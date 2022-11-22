const fs = require('fs');
const oracledb = require('oracledb');
const dbConfig = require('../config/dbconfig');
const xml2js = require('xml2js');

let libPath;
if (process.platform === 'win32') {
  // Windows
  libPath = 'C:\\oracle\\instantclient_12_2';
} else if (process.platform === 'darwin') {
  // macOS
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
    // Select
    //
      sql = `SELECT * FROM personas where estado = 'pendiente'`;

     //sql = `UPDATE personas SET estado = 'pendiente' WHERE id iN (11134, 11133)`;

    result = await connection.execute(sql, {}, { outFormat: oracledb.OBJECT });

    console.log('RESULTSET:' + JSON.stringify(result));

    let ID_DC40 = [];

    ID_DC40 = result.rows.map((person) => ({
      id: person.ID,
      nombre: person.NOMBRE,
      pais: person.PAIS,
      status: person.ESTADO,
    }));

    console.log(ID_DC40);

    var builder = new xml2js.Builder({
      explicitRoot: false,
      rootName: 'MBGMCR03',
    });

    var xml = builder.buildObject({
      IDOC: {
        ID_DC40,
      },
    });

    console.log(xml);

    typeof ID_DC40 != 'undefined' &&
    ID_DC40 != null &&
    ID_DC40.length != null &&
    ID_DC40.length > 0
      ? fs.writeFile('prueba.xml', xml, (err) => {
          if (err) throw err;
          console.log('archivo XML creado');
        })
      : console.log('No hay documentos para conversión a XML');

    let ids = Object.values(ID_DC40).map((val) => ({ id: val.id }));

    //let ids =  Object.values(ID_DC40).map(val => (val.id ));

    //const ids = JSON.stringify(idsObj.join(','));

    console.log(ids);

    //
    // Insert three rows
    //

    sql = `UPDATE personas SET estado = 'cargado' WHERE id IN (:id)`;

    binds = ids;
    //    binds =[{"id":ids}];

    // For a complete list of options see the documentation.
    options = {
      autoCommit: true,
      // batchErrors: true,  // continue processing even if there are data errors
      bindDefs: {
        id: { type: oracledb.NUMBER },
      },
      //{ type: oracledb.STRING, maxSize: 20 }
    };

    //result = await connection.execute(sql);

    if (
      typeof ids != 'undefined' &&
      ids != null &&
      ids.length != null &&
      ids.length > 0
    ) {
      result = await connection.executeMany(sql, binds, options);
    }
    console.log('Number of rows inserted:', result.rowsAffected);

    //
    // Query the data
    // BUENO ME FALTA HACER IF EN LINEA 146 , ME FALTA HACER UPDATE Y PROBAR CON MULTIPLE VALORES Y AVERIGUAR COMO HACER SERVICIO ESTABLE

    sql = `SELECT * FROM personas`;

    binds = {};

    // For a complete list of options see the documentation.
    options = {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
      autoCommit: true, // query result format
      // extendedMetaData: true,               // get extra metadata
      // prefetchRows:     100,                // internal buffer allocation size for tuning
      // fetchArraySize:   100                 // internal buffer allocation size for tuning
    };

    result = await connection.execute(sql, binds, options);

    console.log('Metadata: ');
    console.dir(result.metaData, { depth: null });
    console.log('Query results: ');
    console.dir(result.rows, { depth: null });

    //
    // Show the date.  The value of ORA_SDTZ affects the output
    //

    sql = `SELECT TO_CHAR(CURRENT_DATE, 'DD-Mon-YYYY HH24:MI') AS CD FROM DUAL`;
    result = await connection.execute(sql, binds, options);
    console.log('Current date query results: ');
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
