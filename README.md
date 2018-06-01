# precios-poc-node
Prueba de Concepto


## Junar ETL

```
# cd junar-etl && npm install -d
```

next steps:

0. docker run -p 9200:9200 -p 9300:9300 -e "discovery.type=single-node" elasticsearch:5.5.2-alpine
1. curl -X PUT http://[elasticsearch_server]/precios/
2. node convert.js
3. drink a beer :beer:
