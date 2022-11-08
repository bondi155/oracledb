var express = require('express');
var app = express();
var bodyParser = require('body-parser');
const dbquery = require ('./controllers/dbquerys');
const PORT = process.env.PORT || 8089;


// configure app to use bodyParser()
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

 app.post('/personas/', dbquery.getData);


app.use(express.static('static'));
app.use('/', router);

app.listen( PORT, () =>{
  console.log("Servidor corriendo en puerto " + PORT)
} )  

