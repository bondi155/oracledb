const dbConfig = require ('../config/dbconfig');
const oracledb = require('oracledb');
var o2x = require('object-to-xml');


//conexion a instant client       -----------0------------------
if (process.platform === 'win32') {
  try {
    oracledb.initOracleClient({libDir: 'C:\\oracle\\instantclient_12_2'});   // doble comilla
  } catch (err) {
    console.error('error de conexion con instant client..');
    console.error(err);
    process.exit(1);
  }
}
//                   ----------------o----------------
oracledb.autoCommit = true;
process.env.ORA_SDTZ = 'UTC';


async function getData (request, response) {
  
  //conexion a base de datos
  oracledb.getConnection(dbConfig, function (err, connection) {
    if (err) {
      console.error(err.message);
      response.status(500).send("Error connecting to DB");
      return;
    }

    console.log("conexion establecida ejecutando query...")
    
    const sql = `SELECT * FROM personas`;
    
    connection.execute( sql ,{},
      { outFormat: oracledb.OBJECT },
      (err, result) => {
        if (err) {
          console.error(err.message);
          response.status(500).send("Error getting data from DB");
          return;
        }

        console.log("RESULTSET:" + JSON.stringify(result));
        var EDI_DC40 = [];
        result.rows.forEach( (element) => {
          EDI_DC40.push({ id:element.ID, nombre:element.NOMBRE, 
                           pais: element.PAIS});
        }, this);
        response.set('Content-Type', 'text/xml');
        response.send (o2x({
          '?xml version="1.0" encoding="utf-8"?' :null,
          MBGMCR03 :{
            IDOC :{ 
              EDI_DC40
            }
          }
       


        }))

    
      });
  });
  
 
}

module.exports = {

   getData:getData
}