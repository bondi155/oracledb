process.env.ORA_SDTZ = 'UTC';

const fs = require('fs');
const oracledb = require('oracledb');
const dbConfig = require('../config/dbconfig');
const xml2js = require('xml2js');

oracledb.autoCommit = true;
process.env.ORA_SDTZ = 'UTC';

async function getData() {
  let connection;

  try {
    let sql, binds, options, result;

    //conexion a db com dbconfig

    connection = await oracledb.getConnection(dbConfig);

    // Select
    sql = ` SELECT * FROM personas where estado = 'pendiente'`;

    result = await connection.execute(sql, {}, { outFormat: oracledb.OBJECT });
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

    var builder = new xml2js.Builder({
      explicitRoot: false,
      rootName: 'MBGMCR03',
    });

    var xml = builder.buildObject(querySelect);
    console.log(xml);

    let status = querySelect.map((status) => status.IDOC.EDI_DC40.status);
    console.log(status);

    if (typeof querySelect != "undefined" && querySelect != null && querySelect.length != null && querySelect.length > 0) { 

    fs.writeFile('prueba.xml', xml, (err) => {
      if (err) throw err;
      console.log('archivo XML creado');
    });
  }

    let ids = querySelect.map((id) => id.IDOC.EDI_DC40.id);
   


    console.log(ids);

    
    // UPDATE cargado a los id que se hicieron select 
    

  //sql = `UPDATE personas SET estado = 'cargado' WHERE id = :ids`;

    binds = [ids];

    // For a complete list of options see the documentation.
    options = {
      // extendedMetaData: true,               // get extra metadata
      // prefetchRows:     100,                // internal buffer allocation size for tuning
      // fetchArraySize:   100                 // internal buffer allocation size for tuning
    };

  //  result = await connection.execute(sql, binds, options);

   
    //
    // Show the date.  The value of ORA_SDTZ affects the output
    //

    sql = `SELECT TO_CHAR(CURRENT_DATE, 'DD-Mon-YYYY HH24:MI') AS CD FROM DUAL`;
    result = await connection.execute(sql);
    console.log('Current date query results: ');
    console.log(result.rows[0]);

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
