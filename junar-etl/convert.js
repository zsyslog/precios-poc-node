
const API_KEY = 'fbf48e360b6f0c38ef13d5f5a6a4e88ec02093e1';
const JUNAR_CALEF_URL = "http://cne.cloudapi.junar.com/api/v2/datastreams/CALEF-EN-LINEA-API-V3/data.ajson/?auth_key=";

const ELASTICSEARCH = 'http://localhost:9200/';
const INDEX = 'precios';

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
  'Distribuidor Logo',
  'Kerosene $/L',
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
  'distributor_logo',
  'Distribuidor Logo SVG',
  'Distribuidor Logo SVG Horizontal',
  'price_lt',
  'Pago Efectivo',
  'Cheque',
  'Tarjetas Bancarias',
  'Tarjeta Grandes Tiendas',
  'latitude',
  'longitude',
  'Tienda',
  'Farmacia',
  'Mantención',
  'Autoservicio' ]


var request = require("request");
var async = require("async");

request({
    url: JUNAR_CALEF_URL + API_KEY,
    json: true
}, function (error, response, body) {
	var obj = [];
    if (!error && response.statusCode === 200) {
        const headers = body.result[0];
        // console.log(headers);
        // return;
		for (var i=1; i<body.result.length; i++) {
			var this_obj = {};
			this_obj.location = []
			this_obj.product_type = "calefaccion";
			for (var k=0; k<body.result[i].length; k++){
				if (required.indexOf(headers[k])>-1){
					switch (true) {
						case (headers[k] == 'ID'):
							this_obj._id = body.result[i][k];
							break;
						case (headers[k] == 'Última Actualización'):
							this_obj[required_compat[k]] = new Date(body.result[i][k]);
							break;
						case (headers[k] == "Latitud"):
							this_obj.location[0] = Number(body.result[i][k]);
							break;
						case (headers[k] ==  "Longitud"):
							this_obj.location[1] = Number(body.result[i][k]);
							break;
						default:
							this_obj[String(required_compat[k])] = body.result[i][k];
					}
				}
			}
			// obj.push(this_obj);
			// console.log(ELASTICSEARCH + INDEX + '/producto/' + this_obj._id);
			q.push(this_obj, function(err) {
				if (err)
					throw "QUEUE INSERT ERR: " + err
			    console.log('Object inserted');
			});
		}
    }
});

// Async queue

var q = async.queue(function(task, callback) {
    request({
		method: 'POST',
		url: ELASTICSEARCH + INDEX + '/producto/' + task._id,
		json: true,
		body: task
	},function(response){
		console.log('ELASTICSEARCH:', response);
		callback();
	});
}, 5);

// assign a callback
q.drain = function() {
    console.log('all items have been processed');
};