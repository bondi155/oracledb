const dbConfig = require('../config/dbconfig');
const oracledb = require('oracledb');
var xml2js = require('xml2js');
const fs = require('fs');

//conexion a instant client       -----------0------------------
if (process.platform === 'win32') {
  try {
    oracledb.initOracleClient({ libDir: 'C:\\oracle\\instantclient_12_2' }); // doble comilla
  } catch (err) {
    console.error('error de conexion con instant client..');
    console.error(err);
    process.exit(1);
  }
}
//                   ----------------o----------------
oracledb.autoCommit = true;
process.env.ORA_SDTZ = 'UTC';

async function getData(request, response) {
  //conexion a base de datos
  oracledb.getConnection(dbConfig, function (err, connection) {
    if (err) {
      console.error(err.message);
      response.status(500).send('Error connecting to DB');
      return;
    }

    console.log('conexion establecida ejecutando query...');

    const sql = `SELECT * FROM personas`;

    connection.execute(
      sql,
      {},
      { outFormat: oracledb.OBJECT },
      (err, result) => {
        if (err) {
          console.error(err.message);
          response.status(500).send('Error getting data from DB');
          return;
        }

        console.log('RESULTSET:' + JSON.stringify(result));

        let EDI_DC40 = [];

        result.rows.forEach((element) => {
          EDI_DC40.push({
            IDOC :{ 
              EDI_DC40:{ 
            id: element.ID,
            nombre: element.NOMBRE,
            pais: element.PAIS,
          }
          },
          E1MBGMCR :{
            
          }
          });
        }, this);

        console.log(EDI_DC40);

        var builder = new xml2js.Builder({explicitRoot : false , rootName :'MBGMCR03'});
        var xml = builder.buildObject(EDI_DC40);
        console.log(xml);

        fs.writeFile('prueba.xml', xml, (err) => {
          if (err) throw err;
          console.log('archivo XML creado');
        });
      }
    );
  });
}

module.exports = {
  getData: getData,
};
