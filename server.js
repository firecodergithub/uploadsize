'use strict';

var express = require('express');
var routes = require('./app/routes/index.js');
var mongoose = require('mongoose');
var passport = require('passport');
var session = require('express-session');
var path=require('path');


var app = express();
app.use('/', function (req,res,next)
{
	var getpath=decodeURIComponent(req.path).replace(/(^\/)/g, "");//remove leading / and decode URI
	if (getpath=='') //by default return the help page
	{
		res.sendFile(path.join(__dirname,'public/indexTimeMicroservice.html'));
	}
	else // we got a time request so need to return the json
	{
		//check if date can be parsed
		var d=Date.parse(getpath);
		if (d) 
		{
			//console.log(d);
			//console.log(new Date(d).getFullYear());
			var jsn={"unix":d/1000,"natural":new Date(d).toDateString()};
			res.send(jsn);
		}
		else
		{
			//check if valid unix timestamp
			var d=getpath*1000;
			var valid = (new Date(d)).getTime() > 0;
			if (valid)
				var jsn={"unix":d/1000,"natural":new Date(d).toDateString()};
			else
				var jsn={"unix":null,"natural":null};
			res.send(jsn);
			//console.log(getpath);
		}
	}
});

var port = process.env.PORT || 8080;
app.listen(port,  function () {
	console.log('Node.js listening on port ' + port + '...');
});
