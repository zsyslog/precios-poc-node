#!/bin/bash

if [ "$#" -ne 4 ]; then
    echo "Illegal number of arguments. Usage: backup_es <host/index> <number_of_shards> <number_of_replicas> <mapping_output_file>"
    echo "Example: backup_es elasticsearch_host:9200/my_index 5 1 output.json"
    exit 0
fi

> $4
echo -n "Backing up metadata… "
curl -XGET -o /tmp/mapping.json "$1/_mapping?pretty=true" > /dev/null 2>&1
sed -i '.orig' '1,2d' /tmp/mapping.json
echo '{"settings":{"number_of_shards":'$2',"number_of_replicas":'$3'},"mappings":{' >> $4
	
cat /tmp/mapping.json >> $4
echo "DONE!"