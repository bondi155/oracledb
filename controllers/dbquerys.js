/* Copyright (c) 2018, 2022, Oracle and/or its affiliates. */

/******************************************************************************
 *
 * You may not use the identified files except in compliance with the Apache
 * License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * NAME
 *   example.js
 *
 * DESCRIPTION
 *   A basic node-oracledb example using Node.js 8's async/await syntax.
 *
 *   For connection pool examples see connectionpool.js and webapp.js
 *   For a ResultSet example see resultset1.js
 *   For a query stream example see selectstream.js
 *
 *   This example requires node-oracledb 5 or later.
 *
 *****************************************************************************/

// Using a fixed Oracle time zone helps avoid machine and deployment differences

const fs = require('fs');
const oracledb = require('oracledb');
const dbConfig = require('../config/dbconfig');
const xml2js = require('xml2js');
var o2x = require('object-to-xml');


// On Windows and macOS, you can specify the directory containing the Oracle
// Client Libraries at runtime, or before Node.js starts.  On other platforms
// the system library search path must always be set before Node.js is started.
// See the node-oracledb installation documentation.
// If the search path is not correct, you will get a DPI-1047 error.
let libPath;
if (process.platform === 'win32') {           // Windows
  libPath = 'C:\\oracle\\instantclient_12_2';
} else if (process.platform === 'darwin') {   // macOS
  libPath = process.env.HOME + '/Downloads/instantclient_19_8';
}
if (libPath && fs.existsSync(libPath)) {
  oracledb.initOracleClient({ libDir: libPath });
}

oracledb.autoCommit = true;
process.env.ORA_SDTZ = 'UTC';

async function getData() {
  let connection;

  try {

    let sql, binds, options, result;

    connection = await oracledb.getConnection(dbConfig);

    //
    // Create a table
    //
    sql = ` SELECT * FROM personas where estado = 'pendiente'`;

    result = await connection.execute(sql, {}, { outFormat: oracledb.OBJECT } );
    console.log('RESULTSET:' + JSON.stringify(result));

    let querySelect = [];
    

    result.rows.forEach((element) => {
      querySelect.push({
        IDOC: {
          EDI_DC40: {
            id: element.ID,
            nombre: element.NOMBRE,
            pais: element.PAIS,
           status: element.ESTADO,
          },
        },
        E1MBGMCR: {},
      });
    }, this);

  queryFormat = querySelect.map(person => ({ id: person.IDOC.EDI_DC40.id, nombre: person.IDOC.EDI_DC40.nombre,
     pais: person.IDOC.EDI_DC40.pais, status: person.IDOC.EDI_DC40.status }));

    console.log(queryFormat);

    var builder = new xml2js.Builder({
      explicitRoot: false,
      rootName: 'MBGMCR03',
    });

    var xml = builder.buildObject(
      
      {IDOC:{  
      queryFormat}
    
    });

    console.log(xml);
    

    let status = querySelect.map((status) => status.IDOC.EDI_DC40.status);
    console.log(status);

    if (typeof querySelect != "undefined" && querySelect != null && querySelect.length != null && querySelect.length > 0) { 

    fs.writeFile('prueba.xml', xml, (err) => {
      if (err) throw err;
      console.log('archivo XML creado');
    });
  }


   let ids =  queryFormat.map(val => ({ id: val.id }));
   
    console.log(ids);


    //
    // Insert three rows
    //

   // sql =`UPDATE personas SET estado = 'pendiente' WHERE id IN (11134, 11133)`;

      //sql = `UPDATE personas SET estado = 'cargado' WHERE id IN (:1)`;


    //sql = `INSERT INTO no_example VALUES (:1, :2)`;

    binds = [ 
    [ 11134, 11133]
    ]
    ;

    // For a complete list of options see the documentation.
    options = {
      autoCommit: true,
      // batchErrors: true,  // continue processing even if there are data errors
    // bindDefs: [
      //  { type: oracledb.NUMBER },
        //{ type: oracledb.STRING, maxSize: 20 }
      //]
    };

   //result = await connection.execute(sql, binds, options);

    console.log("Number of rows inserted:", result.rowsAffected);

    //
    // Query the data
    //

    sql = `SELECT * FROM personas`;

    binds = {};

    // For a complete list of options see the documentation.
    options = {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
      autoCommit: true   // query result format
      // extendedMetaData: true,               // get extra metadata
      // prefetchRows:     100,                // internal buffer allocation size for tuning
      // fetchArraySize:   100                 // internal buffer allocation size for tuning
    };

    result = await connection.execute(sql, binds, options);

    console.log("Metadata: ");
    console.dir(result.metaData, { depth: null });
    console.log("Query results: ");
    console.dir(result.rows, { depth: null });

    //
    // Show the date.  The value of ORA_SDTZ affects the output
    //

    sql = `SELECT TO_CHAR(CURRENT_DATE, 'DD-Mon-YYYY HH24:MI') AS CD FROM DUAL`;
    result = await connection.execute(sql, binds, options);
    console.log("Current date query results: ");
    console.log(result.rows[0]['CD']);

  } catch (err) {
    console.error(err);
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error(err);
      }
    }
  }
}


module.exports = {
  getData: getData,
};

