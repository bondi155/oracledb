var express = require('express');
var app = express();
var bodyParser = require('body-parser');
const dbquery = require ('./controllers/dbquerys');
const PORT = process.env.PORT || 8089;

// configure app to use bodyParser()
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({ type: '*/*' }));


dbquery.getData();

