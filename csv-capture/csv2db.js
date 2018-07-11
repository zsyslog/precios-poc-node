#!/usr/bin/env node

'use strict';

const parse      = require('csv-parse');
const util       = require('util');
const fs         = require('fs');
const path       = require('path');
const mysql      = require('mysql');
const async      = require('async');
const co         = require('co');
const csvHeaders = require('csv-headers');
const leftpad    = require('leftpad');

const dbhost = process.argv[2];
const dbuser = process.argv[3];
const dbpass = process.argv[4];
const dbname = process.argv[5];
const tblnm  = process.argv[6];
const csvfn  = process.argv[7];

new Promise((resolve, reject) => {
    csvHeaders({
        file      : csvfn,
        delimiter : ','
    }, function(err, headers) {
        if (err) reject(err);
        else resolve({ headers });
    });
})
.then(context => {
    return new Promise((resolve, reject) => {
        var conn_data = {
            host     : dbhost,
            port     : '3306',
            user     : dbuser,
            password : dbpass,
            database : dbname
        };

        if (dbhost.indexOf(':')>-1){
            conn_data.host = dbhost.split(':')[0];
            conn_data.port = dbhost.split(':')[1];
        }

        context.db = mysql.createConnection(conn_data);

        context.db.connect((err) => {
            if (err) {
                console.error('error connecting: ' + err.stack);
                reject(err);
            } else {
                resolve(context);
            }
        });
    })
})
.then(context => {
    return new Promise((resolve, reject) => {
        context.db.query(`DROP TABLE IF EXISTS ${tblnm}`,
        [ ],
        err => {
            if (err) reject(err);
            else resolve(context);
        })
    });
})
.then(context => {
    return new Promise((resolve, reject) => {
        var fields = '';
        var fieldnms = '';
        var qs = '';
        context.headers.forEach(hdr => {
            console.log("->", hdr);
            hdr = hdr.replace(/ /g, '_');
            if (fields !== '') fields += ',';
            if (fieldnms !== '') fieldnms += ','
            if (qs !== '') qs += ',';
            switch(true){
                case (hdr.indexOf("->INT")>-1):
                    fields += ` ${hdr.replace("->INT",'')} INT`;
                    break;
                case (hdr.indexOf("->BOOL")>-1):
                    fields += ` ${hdr.replace("->BOOL",'')} BIT(1)`;
                    break;
                case (hdr.indexOf("->FLOAT")>-1):
                    fields += ` ${hdr.replace("->FLOAT",'')} FLOAT`;
                    break;
                default:
                    fields += ` ${hdr} TEXT CHARACTER SET utf8 COLLATE utf8_unicode_ci`;
            }
            fieldnms += ` ${hdr}`;
            qs += ' ?';
        });
        context.qs = qs;
        context.fieldnms = fieldnms
                            .replace(/\-\>INT/g,'')
                            .replace(/\-\>BOOL/g,'')
                            .replace(/\-\>FLOAT/g,'');
        console.log(`about to create CREATE TABLE IF NOT EXISTS ${tblnm} ( ${fields} )`);
        context.db.query(`CREATE TABLE IF NOT EXISTS ${tblnm} ( ${fields} )`,
        [ ],
        err => {
            if (err) reject(err);
            else resolve(context);
        })
    });
})
.then(context => {
    return new Promise((resolve, reject) => {
        fs.createReadStream(csvfn).pipe(parse({
            delimiter: ',',
            columns: true,
            relax_column_count: true
        }, (err, data) => {
            if (err) return reject(err);
            async.eachSeries(data, (datum, next) => {
                // console.log(`about to run INSERT INTO ${tblnm} ( ${context.fieldnms} ) VALUES ( ${context.qs} )`);
                var d = [];
                try {
                    context.headers.forEach(hdr => {
                        // In some cases the data fields have embedded blanks,
                        // which must be trimmed off
                        let tp = datum[hdr].trim();
                        // For a field with an empty string, send NULL instead
                        d.push(tp === '' ? null : tp);
                    });
                } catch (e) {
                    console.error(e.stack);
                }
                // console.log(`${d.length}: ${util.inspect(d)}`);
                if (d.length > 0) {
                    console.log(d);
                    context.db.query(`INSERT INTO ${tblnm} ( ${context.fieldnms} ) VALUES ( ${context.qs} )`, d,
                    err => {
                        if (err) { console.error(err); next(err); }
                        else setTimeout(() => { next(); });
                    });
                } else { console.log(`empty row ${util.inspect(datum)} ${util.inspect(d)}`); next(); }
            },
            err => {
                if (err) reject(err);
                else resolve(context);
            });
        }));
    });
})
.then(context => { context.db.end(); })
.catch(err => { console.error(err.stack); });
