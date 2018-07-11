if (process.argv[2] == undefined) {
  console.error("falta argumento: Input CSV");
  process.exit(-1);
}

const DATA_INFO = {
  "product": "Seguros",
  "product_type": "SOAP",
  "pricing_unit": "Pesos/PrimaAnual"
}
const ELASTICSEARCH = 'http://localhost:9200/';
const INDEX = 'precios';

var fs = require('fs');
var parse = require('csv-parse');
var request = require("request");
var async = require("async");

console.log("Processing: ", process.argv[2]);

var inputFile=process.argv[2];

var parser = parse({delimiter: ','}, function (err, data) {

	const headers = data[0];

  for (i=1; i<data.length; i++) {
    var this_obj = {};
    this_obj.data_info = DATA_INFO;
    this_obj.location = [null,null];
    this_obj.last_updated = new Date(2018,01,01);
    for (k in data[i]){
      switch (true) {
        case (headers[k] == "price_lt" && data[i][k] !== ''):
          this_obj.price_lt = Number(data[i][k]);
          break;
        case (headers[k] == "latitude" && data[i][k] !== ''):
          this_obj.location[0] = Number(data[i][k]);
          break;
        case (headers[k] ==  "longitude" && data[i][k] !== ''):
          this_obj.location[1] = Number(data[i][k]);
        case (headers[k] == "product_type"):
          this_obj.data_info.product_type = "SOAP " + data[i][k];
          break;
        case (headers[k] == "url"):
          this_obj.data_info.source_name = data[i][1];
          this_obj.data_info.source_url = data[i][7];
          break;
        default:
          this_obj[headers[k]] = data[i][k];
      }	
    }
    // console.log(this_obj);
    request({
      method: 'POST',
      url: ELASTICSEARCH + INDEX + '/producto/' + this_obj.custom_id + this_obj.data_info.product_type.replace(/ /g, ''),
      json: true,
      body: this_obj
    },function(error, response, body){
      console.log('ELASTICSEARCH:', body);
      // callback();
    });
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
}, 1);

// assign a callback
q.drain = function() {
  console.log('all items have been processed');
};

