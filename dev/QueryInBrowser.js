const dbConfig = require ('../config/dbconfig');
const oracledb = require('oracledb');

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
    // camaro     ----------------o----------------

const { default: fetch } = require('node-fetch');
process.env.ORA_SDTZ = 'UTC';
const { transform, prettyPrint } = require('camaro');
  //                   ----------------o----------------

  
oracledb.autoCommit = true;

function doRelease(connection) {
  connection.release(function (err) {
    if (err) {
      console.error(err.message);
    }
  });
}

async function getData (request, response) {

  console.log("GET EJEMPLO");
  
  oracledb.getConnection(dbConfig, function (err, connection) {
    if (err) {
      console.error(err.message);
      response.status(500).send("Error connecting to DB");
      return;
    }
    console.log("After connection");
    
    const sql = `SELECT * FROM personas`;
    connection.execute( sql ,{},
      { outFormat: oracledb.OBJECT },
      function (err, result) {
        if (err) {
          console.error(err.message);
          response.status(500).send("Error getting data from DB");
          doRelease(connection);
          return;
        }
        console.log("RESULTSET:" + JSON.stringify(result));
        var employees = [];
        result.rows.forEach(function (element) {
          employees.push({ id: element.ID, nombre: element.NOMBRE, 
                           país: element.PAIS});
        }, this);
        response.json(employees);
        doRelease(connection);
      });
  });
  
}

module.exports = {

   getData:getData
}