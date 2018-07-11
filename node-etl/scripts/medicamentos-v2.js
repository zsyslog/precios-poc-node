if (process.argv[2] == undefined) {
  console.error("falta argumento: Input CSV");
  process.exit(-1);
}

var config = require('../config');

const DATA_INFO = {
  "product": "Medicina",
  "product_type": "Medicamentos"
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
    var cid_str = "" + data[i].toString();
    // this_obj.custom_id = crypto.createHash('md5').update(cid_str).digest("hex");
    this_obj.pricing_unit = "Pesos/" + data[i][headers.indexOf('cantidad')] + " " + data[i][headers.indexOf('unidad')];
    // this_obj.last_updated = new Date(2018,01,01);
    for (k in data[i]){
      switch (true) {
      	case (headers[k] == "commerce" && data[i][k] !== ''):
          this_obj.data_info.source_name = data[i][k];
          this_obj.commerce = data[i][k];
          break;
        case (headers[k] == "price_lt" && data[i][k] !== ''):
          this_obj.price_lt = Number(data[i][k]);
          break;
        case (headers[k] == "last_updated" && data[i][k] !== ''):
          this_obj.last_updated = new Date(data[i][k]).toISOString();
          break;
        default:
          this_obj[headers[k].trim()] = data[i][k].trim();
      }	
    }
    // console.log(this_obj);
    q.push(this_obj);
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
  // }
}


// Async queue
var q = async.queue(function(task, callback) {
  request({
    method: 'POST',
    url: ELASTICSEARCH + INDEX + '/producto/' + task.custom_id,
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

