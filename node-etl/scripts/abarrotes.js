if (process.argv[2] == undefined) {
  console.error("falta argumento: Input CSV");
  process.exit(-1);
}

var config = require('../config');

const ELASTICSEARCH = config.elasticsearch.url;
const INDEX = config.elasticsearch.index;

const DATA_INFO = {
	"source_name": "Odepa",
	"source_url": "https://www.odepa.gob.cl/precios/consumidor",
  "product": "Alimentos",
  "product_type": "Vegetales y Abarrotes",
}

var fs = require('fs');
var parse = require('csv-parse');
var request = require("request");
var async = require("async");
var crypto = require('crypto');

console.log("Processing: ", process.argv[2]);

var inputFile=process.argv[2];

var parser = parse({delimiter: ','}, function (err, data) {

	const headers = data[0];

  // for (i=1; i<data.length; i++) {
  for (i=1; i<10; i++) {
    var this_obj = {};
    this_obj.data_info = DATA_INFO;
    this_obj.pricing_range = {};
    var cid_data_str = data[i][0] + data[i][1] + data[i][2] + data[i][3]+ "";
    console.log(cid_data_str);
    this_obj.custom_id = crypto.createHash('md5').update(cid_data_str).digest("hex");
    for (k in data[i]){
      switch (true) {
        case (headers[k] == "price_lt" && data[i][k] !== ''):
          this_obj.price_lt = Number(data[i][k]);
          break;
        case (headers[k] == "precio_min" && data[i][k] !== ''):
          this_obj.pricing_range.min = Number(data[i][k]);
          break;
        case (headers[k] == "precio_max" && data[i][k] !== ''):
          this_obj.pricing_range.max = Number(data[i][k]);
          break;
        case (headers[k] == 'last_updated'):
          this_obj.last_updated = new Date(data[i][k]);
          break;
        default:
          this_obj[headers[k]] = data[i][k];
      }	
    }
    // console.log(this_obj);
    indexObj(this_obj);
 }

});

fs.createReadStream(inputFile).pipe(parser);

function indexObj(task) {
  q.push(task, function(err) {
    if (err)
      throw "QUEUE INSERT ERR: " + err
    else
      console.log('Object queued');
  });
}

// Async queue
var q = async.queue(function(task, callback) {
	// console.log(ELASTICSEARCH + INDEX + '/producto/' + task.custom_id);
  request({
    method: 'POST',
    url: ELASTICSEARCH + INDEX + '/producto/' + task.custom_id,
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

