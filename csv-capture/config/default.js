// config
module.exports = {
  mysql: {
    host: '127.0.0.1',
    user: 'root',
    password: 'mysql',
    database: 'cuantovale',
  },
  csv: {
    comment: '#',
    quote: '"'
  },
  table: process.argv[3] // segundo argumento del script
}