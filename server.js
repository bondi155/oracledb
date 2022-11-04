var express = require('express');
var app = express();
var bodyParser = require('body-parser');
const dbConfig = require ('./config/dbconfig');
var PORT = process.env.PORT || 8089;

var oracledb = require('oracledb');
oracledb.autoCommit = true;

function doRelease(connection) {
  connection.release(function (err) {
    if (err) {
      console.error(err.message);
    }
  });
}

// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({ type: '*/*' }));


var router = express.Router();

router.use(function (request, response, next) {
  console.log("REQUEST:" + request.method + "   " + request.url);
  console.log("BODY:" + JSON.stringify(request.body));
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  response.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
  response.setHeader('Access-Control-Allow-Credentials', true);
  next();
});

/**
 * GET / 
 * Returns a list of employees 
 */
router.route('/personas/').get(function (request, response) {
  console.log("GET EJEMPLO");
  oracledb.getConnection(dbConfig, function (err, connection) {
    if (err) {
      console.error(err.message);
      response.status(500).send("Error connecting to DB");
      return;
    }
    console.log("After connection");
    connection.execute("SELECT * FROM personas",{},
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
});

app.use(express.static('static'));
app.use('/', router);
app.listen(PORT);