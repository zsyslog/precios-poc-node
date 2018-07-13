var config = require('../config');


const FARMANET_URL = "http://farmanet.minsal.cl/maps/index.php/ws/getLocales";
const DATA_INFO = {
  "source_name": "Listado de Farmacias en Chile",
  "source_url": "http://farmanet.minsal.cl/",
}

const ELASTICSEARCH = config.elasticsearch.url;
const INDEX = "farmacias";


var request = require("request");
var async = require("async");
var crypto = require('crypto');

console.log('starting...');

request({
  url: FARMANET_URL,
  json: true
}, function (error, response, body) {
  body.result = body;
  console.log(body.result[0]);
	var obj = [];
  if(error)
    throw "FARMANET:" + error;
  if (!error && response.statusCode === 200) {
    // const headers = body.result[0];
        // console.log(headers);
        // return;
        // for (var i=1; i<body.result.length; i++) {
        for (var i=1; i<5; i++) {
          var this_obj = body.result[i];
          var this_obj.commerce = "FARMACIA " + body.result[i].local_nombre;
          this_obj.data_info = DATA_INFO;
          this_obj.location = [Number(body.result[i].local_lat),Number(body.result[i].local_lng)];
          var cid_str = this_obj.location.toString();
          this_obj.custom_id = crypto.createHash('md5').update(cid_str).digest("hex");
          delete this_obj.local_lat;
          delete this_obj.local_lng;
          delete this_obj.fk_region;
          delete this_obj.fk_comuna;
          // console.log(this_obj);
          indexObj(this_obj);
    }
  }
});

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
  request({
    method: 'POST',
    url: ELASTICSEARCH + INDEX + '/local/' + task.custom_id,
    json: true,
    body: task
  },function(error, response, body){
    if (error)
      throw error;
    else 
      console.log('ELASTICSEARCH:', body);
    callback();
  });
}, 20);

// assign a callback
q.drain = function() {
  console.log('all items have been processed');
};