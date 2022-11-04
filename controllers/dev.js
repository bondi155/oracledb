
// select normal desde funcion ----------------------------
async function exec () {
    let con;

try{
    con = await oracledb.getConnection(dbConfig);
   // const datajson = require('./config/data.json');

    const data = await con.execute(
        "SELECT * FROM usuario ORDER BY USERID ASC" ,
    );
    console.log(data.rows);
    //console.log(datajson);
    
}catch (err) {
    console.error(err);
}
}

exec();
//----------------------------------------0-----------------

// fetch desde url json
const dbConfig = require ('../config/dbconfig');
const oracledb = require('oracledb');
const { default: fetch } = require('node-fetch');
process.env.ORA_SDTZ = 'UTC';

async function getData () {
    let con;
    let list = [];
    await fetch('https://jsonplaceholder.typicode.com/users')

    .then(res => res.json())
    .then((data) => {
     list.push(data);
    
    })
        
const userId =json.map(item => item.id);
const nombre = json.map(item => item.name);
const apellido = json.map(item => item.username);
const city = json.map(item => item.address.city);
const email = json.map(item => item.address.suite);
   
    console.log(userId, nombre, city, apellido, email);
try{
    
con = await oracledb.getConnection(dbConfig);
 
const sql = `INSERT INTO usuario (USERID, NOMBRE, APELLIDO, CITY, EMAIL) VALUES (:bv1, :bv2, :bv3, :bv4, :bv5)`;
const binds = { bv1: userId, bv2: nombre, bv3: apellido, bv4: city, bv5: email} ; 
const options = { autoCommit: true 
   
};
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


//---------------------------------------------o---------------------------------

//local json a base de dato oracle 

async function run () {
    let con;

    const datajson = require('./config/data.json');
    const userId = (datajson[0].USERID);
    const nombre = (datajson[0].NOMBRE);
    const apellido = (datajson[0].APELLIDO);
    const city = (datajson[0].CITY);
    const email = (datajson[0].EMAIL);

try{
    con = await oracledb.getConnection(dbConfig);

    const data = await con.execute(
        `INSERT INTO usuario (USERID, NOMBRE, APELLIDO, CITY, EMAIL) VALUES (:id, :n, :ape, :cty, :em)`,
        {id: userId, n: nombre, ape: apellido, cty: city, em: email},
        { autoCommit: true }
    );
    console.log(data.rows);
    
}catch (err) {
    console.error(err);
}
}

run();

//------------------------------* termina json local config insert desde json-----------------------

//api config server.js

router.route('/get').get((request,response) =>{
    
    dbquery.putData().then(result => {
        console.log(result);
        response.json(result); 
        })

})


app.listen(port, () => {
    console.log("The server is running on port " + port);
  });

  //-------server config js
  
//api config
var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var router = express.Router();
var cors = require('cors');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());
app.use('/api', router);
app.use(express.json());
//---------------------*-----------------

//----------------termina api config ---------------------


//funciona insert con strings sin variables , acordarse siempre de autocommit es necesario para los INSERT
async function run () {
    let con;
    const carlos = "variable";
try{
    con = await oracledb.getConnection(dbConfig);

    const data = await con.execute(
        `INSERT INTO usuario (USERID, NOMBRE, APELLIDO, CITY, EMAIL) VALUES (:id, :n, :ape, :cty, :em)`,
        {id: 4, n: carlos, ape: "romero4", cty: "bsas4", em: "caca4"},
        { autoCommit: true }
    );
    console.log(data.rows);
    
}catch (err) {
    console.error(err);
}
}


//hay que ver por q no funciona , pero este esta refactorizado

const sqlInsert = "INSERT INTO usuario VALUES (:a, :b, :c, :d, :e)";

const binds = [
  { a: 3, b: "STURDEVIN3", c: "MAYORGA3", d: "BSAS3", e:"prueba3@prueba.com" }
];

// bindDefs is optional for IN binds but it is generally recommended.
// Without it the data must be scanned to find sizes and types.

async function run() {
  let connection;

  try {
    connection = await oracledb.getConnection(dbConfig);

    const result = await connection.executeMany(sqlInsert, binds);
    console.log("Result is:", result);
    console.log(result.rows)

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
