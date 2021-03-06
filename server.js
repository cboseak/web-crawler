var express = require('express')
var app = express()
var http = require('http')
var request = require('request');
var path = require('path');

app.all('/*', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  next();
});

app.get('/api', function (req, res) {
	var url = GroomUrl(req.query["url"]);
	if(url ==''){
		res.send("");
		return; 
	}	
	console.log(url);	
	request(url, function (error, response, body) {
		if(body){
			var ret = " " + body.toString().match(/href=(["'])(.*?)\1/g);
			var retArr = ret.split(',');
			for(var i = 0; i < retArr.length;i++){
			retArr[i] = retArr[i].replace('href="','').replace('"','').replace('https:','').replace('http:','').replace('//','');
			}
		res.send(retArr);}
	});
})


app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname + '/main.html'));
});
app.get('/scrape.js', function(req, res) {
    res.sendFile(path.join(__dirname + '/scrape.js'));
});

function GroomUrl(url){
	if(url == null){
		return '';
	}
	url = url.replace('https:','').replace('http:','').replace('//','');
	return 'http://' + url;
	//return url;
}

app.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function(){


});

