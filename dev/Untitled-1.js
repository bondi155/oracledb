
//mapeo total del json

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
    
    const userId = list.map(item => item[0].id) //mapeo total 
    const nombre = list.map(item => item[0].name)
    const apellido = list.map(item => item[0].username)
    const city = list.map(item => item[0].address.city)
    const email = list.map(item => item[0].address.suite)
   
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


///borrador1 

const dbConfig = require ('../config/dbconfig');
const oracledb = require('oracledb');
process.env.ORA_SDTZ = 'UTC';


async function getData () {
    let con;

    const datajson = require('../config/data.json');

    const userId = datajson.map(item => item.id)
    const nombre = datajson.map(item => item.name)
    const apellido = datajson.map(item => item.username)
    const city = datajson.map(item => item.USERID)
    const email = datajson.map(item => item.USERID)
    console.log(userId);
try{
    
    con = await oracledb.getConnection(dbConfig);
 

    const data = await con.execute(
        `INSERT INTO usuario (USERID, NOMBRE, APELLIDO, CITY, EMAIL) VALUES (:id, :n, :ape, :cty, :em)`,
        {id: userId, n: nombre, ape: apellido, cty: city, em: email},
        { autoCommit: true }
    );
    console.log(data.rows);
    //console.log(datajson);
    
}catch (err) {
    console.error(err);
}
}


module.exports = {

   getData:getData
}


const getDatafetch = fetch('https://jsonplaceholder.typicode.com/users')

.then(res => res.json())
.then(json => {
    console.log("Name of the first user in the array:");
    console.log(json[0].name);
    
const userId =json.map(item => item.id);
const nombre = json.map(item => item.name);
const apellido = json.map(item => item.username);
const city = json.map(item => item.address.city);
const email = json.map(item => item.address.suite);
console.log(userId);

})


//borrador 2


//funcionando fetch de json url en oracle
const dbConfig = require ('../config/dbconfig');
const oracledb = require('oracledb');
const { default: fetch } = require('node-fetch');
process.env.ORA_SDTZ = 'UTC';

async function getData () {
    let con;
    let query;
    await fetch('https://jsonplaceholder.typicode.com/users')

    .then(res => res.json())
    .then((data) => {
        query = data;
     //list.push(data);
console.log(query);
    })
    
    const userId = (query[0].id);
    const nombre = (query[0].name);
    const apellido = (query[0].username);
    const city = (query[0].address.city);
    const email = (query[0].address.suite);

   9
    console.log(userId, nombre, apellido, city, email );
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
