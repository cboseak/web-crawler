var express = require('express')
var app = express()
var path = require('path');
var request = require('request');
app.all('/*', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  next();
});


app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname + '/main.html'));
});
app.get('/scrape.js', function(req, res) {
    res.sendFile(path.join(__dirname + '/scrape.js'));
});

app.listen(8080);
