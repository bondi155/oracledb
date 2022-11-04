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

const { default: fetch } = require('node-fetch');
process.env.ORA_SDTZ = 'UTC';
const { transform, prettyPrint } = require('camaro')

async function getData () {
    let con;
    //hago un let , donde meto toda la data del fetch mas abajo
    let query;
    await fetch('http://restapi.adequateshop.com/api/Traveler')

    .then(res => res.text())
    .then((data) => {
        query = data;
    //console.log(query);
    })

//empieza camaro , convierte el xml que llamo en json ------

    const template = [  'TravelerinformationResponse/travelers/Travelerinformation', {
        id: 'number(id)',
        name: 'title-case(name)' ,
        adderes : 'title-case(adderes)' 

    }];
        
const output = await transform(query, template);
console.log(output);

const userId = (output[1].id);
const nombre = (output[1].name);
const pais = (output[1].adderes);

//const userId =json.map(item => item.id);
//const nombre = json.map(item => item.name);
//const apellido = json.map(item => item.username);
//console.log(userId);

const nombres = output.map(item => item.name)
//console.log(nombres);

//empieza conexion e insert a base de datos individual (funcionando)
try{

    con = await oracledb.getConnection(dbConfig);
     
    const sql = `INSERT INTO personas (id, nombre, pais) VALUES (:bv1, :bv2, :bv3)`;
    const binds = { bv1: userId, bv2: nombre, bv3: pais} ; 
    const options = { autoCommit: true   };
    const result  = await con.execute( sql, binds, options);
        console.log(result.rows);
        //console.log(datajson);
        
    }catch (err) {
        console.error(err);
    }
}

module.exports = {

   getData:getData
}