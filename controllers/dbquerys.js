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
    //                   ----------------o----------------

const { default: fetch } = require('node-fetch');
process.env.ORA_SDTZ = 'UTC';
const { transform, prettyPrint } = require('camaro')

async function getData () {
  
}

module.exports = {

   getData:getData
}