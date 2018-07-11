switch (true) {
  case (process.argv[2] === undefined):
    console.error("Error: falta parametro: ruta de archivo CSV es:", process.argv[2]);
    console.error("Usage: node index.js /path/to/file.csv mysql_table_name");
    process.exit(-1);
    break;
  case (process.argv[3] === undefined):
    console.error("Error: falta parametro: nombre de la tabla donde se guardan los datos es:", process.argv[3]);
    console.error("Usage: node index.js /path/to/file.csv mysql_table_name");
    process.exit(-1);
    break;
}

console.log("Processing: ", process.argv[2]);

var inputFile=process.argv[2];
var fs = require('fs');

if (!fs.existsSync(inputFile)) {
    console.error("Error: el archivo no se pudo leer:", process.argv[2]);
    process.exit(-1);
}

var mysql = require('mysql');

var parse = require('csv-parse');

var parser = parse({delimiter: ','}, function (error, data) {
  const header_values = '("' + data[0].join('","') + '")';
  console.log(header_values);

});

fs.createReadStream(inputFile).pipe(parser);