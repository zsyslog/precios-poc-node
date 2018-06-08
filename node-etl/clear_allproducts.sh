#!/bin/bash

curl -XPOST 'http://localhost:9200/precios/producto/_delete_by_query?conflicts=proceed&pretty' -d'
{
    "query": {
        "match_all": {}
    }
}'