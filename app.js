var express = require('express')
var app = express()
var request = require('request');
app.get('/', function (req, res) {
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

function GroomUrl(url){
	if(url == null){
		return '';
	}
	url = url.replace('https:','').replace('http:','').replace('//','');
	return 'http://' + url;
	//return url;
}

app.listen(3000, function () {
  console.log('Example app listening on port 3000!')
})