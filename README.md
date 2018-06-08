# precios-poc-node
Prueba de Concepto


## Node ETL's

```
# cd node-etl && npm install -d
```

### Config elasticsearch data and other fields:

```
vim config/default.js
```

next steps:

1. docker run -p 9200:9200 -p 9300:9300 -e "discovery.type=single-node" elasticsearch:5.5.2-alpine
2. curl -X PUT http://[elasticsearch_server]/precios/
3. curl -X PUT http://[elasticsearch_server]/precios/producto/_mapping -d @precios_mapping.json
4. node gasolina93.js
5. drink a beer :beer:
