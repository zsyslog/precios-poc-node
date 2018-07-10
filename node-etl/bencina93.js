var config = require('./config');


const API_KEY = 'fbf48e360b6f0c38ef13d5f5a6a4e88ec02093e1';
const JUNAR_URL = "http://cne.cloudapi.junar.com/api/v2/datastreams/BENCI-EN-LINEA-V2-80280/data.ajson/?auth_key=";
const DATA_INFO = {
  "source_name": "Comisión Nacional de Energía",
  "source_url": "http://datos.energiaabierta.cl/dataviews/242658/bencina-en-linea/",
  "product": "Combustible",
  "product_type": "Bencina 93",
  "pricing_unit": "Pesos/lt"
}

const ELASTICSEARCH = config.elasticsearch.url;
const INDEX = config.elasticsearch.index;

const required = [
  'ID',
  'Última Actualización',
  'Razón Social',
  'Calle',
  'Número',
  'ID Comuna',
  'Comuna',
  'ID Región',
  'Región',
  'Distribuidor',
  'Distribuidor Logo SVG Horizontal',
  'Gasolina 93 $/L',
  // 'Gasolina 97 $/L',
  // 'Petróleo Diesel $/L',
  // 'Gasolina 95 $/L',
  // 'GLP Vehicular $/m3',
  // 'GNC $/m3',
  'Latitud',
  'Longitud'
];
const required_compat = [ 
  'ID',
  'last_updated',
  'commerce',
  'street_name',
  'street_nr',
  'id_city',
  'city',
  'id_region',
  'region',
  'Horario de Atención',
  'distributor',
  'Distribuidor Logo',
  'Distribuidor Logo SVG',
  'distributor_logo',
  'price_lt',
  'price_lt_97',
  'price_lt_diesel',
  'price_lt_95',
  'price_lt_glpv',
  'price_m3_gnc',
  'latitude',
  'longitude',
  'Tienda',
  'Farmacia',
  'Mantención',
  'Autoservicio',
  'Pago Efectivo',
  'Cheque',
  'Tarjetas Bancarias',
  'Tarjeta Grandes Tiendas'
];


var request = require("request");
var async = require("async");

console.log('starting...');

request({
  url: JUNAR_URL + config.junar_apikey,
  json: true
}, function (error, response, body) {
	var obj = [];
  if(error)
    throw "JUNAR:" + error;
  if (!error && response.statusCode === 200) {
    const headers = body.result[0];
        // console.log(headers);
        // return;
        // for (var i=1; i<body.result.length; i++) {
        for (var i=1; i<10; i++) {
         var this_obj = {};
         this_obj.data_info = DATA_INFO;
         this_obj.location = {};
         this_obj.location.lat = 0;
         this_obj.location.lon = 0;
         for (var k=0; k<body.result[i].length; k++){
          if (required.indexOf(headers[k])>-1){
            switch (true) {
              case (headers[k] == 'ID'):
                this_obj.custom_id = body.result[i][k];
                break;
              case (required_compat[k] == 'price_lt'):
                this_obj.price_lt = Number(body.result[i][k]);
                break;
              case (headers[k] == 'Última Actualización'):
                this_obj[required_compat[k]] = new Date(body.result[i][k]);
                break;
              case (headers[k] == "Latitud"):
                // this_obj.location.lat = Number(body.result[i][k]);
                console.log(body.result[i][k]);
                this_obj.location.lat = body.result[i][k];
                break;
              case (headers[k] ==  "Longitud"):
                // this_obj.location.lon = Number(body.result[i][k]);
                this_obj.location.lon = body.result[i][k];
                break;
              default:
                this_obj[String(required_compat[k])] = body.result[i][k];
            }
          }
        }
        indexObj(this_obj);
    }
  }
});

function indexObj(task) {
  
  // if (Number(task.price_lt) > 0) 
    // console.log(task);
  if (Number(task.price_lt) > 0) {
    // console.log(task);
    q.push(task, function(err) {
      if (err)
        throw "QUEUE INSERT ERR: " + err
      else
        console.log('Object queued');
    });
  }
}


// Async queue
var q = async.queue(function(task, callback) {
  request({
    method: 'POST',
    url: ELASTICSEARCH + INDEX + '/producto/' + task.custom_id + task.data_info.product_type.replace(" ",""),
    json: true,
    body: task
  },function(error, response, body){
    console.log('ELASTICSEARCH:', body);
    callback();
  });
}, 1);

// assign a callback
q.drain = function() {
  console.log('all items have been processed');
};