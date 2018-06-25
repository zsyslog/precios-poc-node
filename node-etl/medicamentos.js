if (process.argv[2] == undefined) {
  console.error("falta argumento: Input CSV");
  process.exit(-1);
}

var config = require('./config');

const DATA_INFO = {
  // "source_name": "Comisión Nacional de Energía",
  // "source_url": "http://datos.energiaabierta.cl/dataviews/242658/bencina-en-linea/",
  "product": "Medicina",
  "product_type": "Medicamentos"
  // "pricing_unit": "Pesos/PrimaAnual"
}
const ELASTICSEARCH = config.elasticsearch.url;
const INDEX = config.elasticsearch.index;

var fs = require('fs');
var parse = require('csv-parse');
var request = require("request");
var async = require("async");
var crypto = require('crypto');

console.log("Processing: ", process.argv[2]);

var inputFile=process.argv[2];

var parser = parse({delimiter: ','}, function (err, data) {

	const headers = data[0];


  // for (i=1; i<10; i++) {
  for (i=1; i<data.length; i++) {
  	// console.log(data[i]);
    var this_obj = {};
    this_obj.data_info = DATA_INFO;
    this_obj.location = [null,null];
    var cid_str = "" + data[i].toString();
    this_obj.custom_id = crypto.createHash('md5').update(cid_str).digest("hex");
    // this_obj.last_updated = new Date(2018,01,01);
    for (k in data[i]){
      switch (true) {
      	case (headers[k] == "source" && data[i][k] == 'SALCOBRAND'):
          this_obj.data_info.source_name = "Farmacias Salcobrand";
          this_obj.data_info.source_url = "https://salcobrand.cl";
          break;
        case (headers[k] == "source" && data[i][k] == 'SERNAC'):
          this_obj.data_info.source_name = "SERNAC";
          this_obj.data_info.source_url = "https://www.sernac.cl";
          break;
        case (headers[k] == "price_lt" && data[i][k] !== ''):
          this_obj.price_lt = Number(data[i][k]);
          break;
        case (headers[k] == "presentacion" && data[i][k] !== ''):
          this_obj.data_info.pricing_unit = "Pesos/" + data[i][k];
          break;
        case (headers[k] == "url"):
          this_obj.data_info.source_name = data[i][1];
          this_obj.data_info.source_url = data[i][7];
          break;
        case (headers[k] == "last_updated" && data[i][k] !== ''):
          this_obj.last_updated = new Date(data[i][k]).toISOString();
          break;
        default:
          this_obj[headers[k]] = data[i][k];
      }	
    }
    // console.log(this_obj);
    q.push(this_obj);
    /* request({
      method: 'POST',
      url: ELASTICSEARCH + INDEX + '/producto/' + this_obj.custom_id,
      json: true,
      body: this_obj
    },function(error, response, body){
      console.log('ELASTICSEARCH:', body);
      // callback();
    });*/
 }

});

fs.createReadStream(inputFile).pipe(parser);

function indexObj(task) {
  
  // if (Number(task.price_lt) > 0) 
    // console.log(task);
  // if (Number(task.price_lt) > 0) {
    // console.log(task);
    q.push(task, function(err) {
      if (err)
        throw "QUEUE INSERT ERR: " + err
      else
        console.log('Object queued');
    });
  // }
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
}, 20);

// assign a callback
q.drain = function() {
  console.log('all items have been processed');
};

