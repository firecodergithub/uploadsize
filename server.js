'use strict';

var express = require('express');
var mongoose = require('mongoose'); 
var path=require('path');
var fs=require('fs');

var app = express();
app.use('/', function (req,res,next)
{
	var getpath=decodeURIComponent(req.path).replace(/(^\/)/g, "");//remove leading / and decode URI
	if (getpath=='') //by default return the help page
	{
		res.sendFile(path.join(__dirname,'public/indexURLShort.html'));
	}
	else // we got a time request so need to return the json
	{
		mongoose.connect('mongodb://localhost:27017/clementinejs');//connect to db
		//load all model files (with tables definition)
		fs.readdirSync(__dirname+'/models').forEach(function(filename){
				if (filename.indexOf('.js')) {
				//console.log(__dirname+'/models/'+filename) ;
				require (__dirname+'/models/'+filename);
						}
				});
		var reg=/(^new\/)/gi;
		if (!reg.test(getpath))
		{
			//redirect if there is no /new in the request
			mongoose.model('url').findOne({"shortUrlId":getpath})
				.exec(function(err,doc)
				{
						if (err) console.log('Err search'+err);
						if (doc!=null && doc!=undefined){ mongoose.connection.close();console.log('redirecting to '+ doc.originalUrl);res.redirect(doc.originalUrl);}
						else {mongoose.connection.close();res.end("Shortened url "+getpath+" does not exist!");}
				});
		}
else
{
		getpath=getpath.replace(/(^new\/)/gi,""); //remove leading new/
		var regURLvalidate= /^(https?|ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i
		//check if URL
		if (regURLvalidate.test(getpath))
		{
			console.log('url '+getpath+' is good!');
			//check what link number we have reached and add a new entry in the database
			//now we have the model defined, we can access directly and find last record
			var findLastUrl=mongoose.model('url').findOne()
			    .sort('-shortUrlId')
			    .exec(function(err, doc)
			    {
				if (err) console.log('Err'+err);
				else
				{
					if (doc==null) {var max=0;} else
					{
						var max = doc.shortUrlId;
					}
					console.log(max.toString());
					var ob={"shortUrlId":max+1,"originalUrl":getpath,"ip":req.headers["x-forwarded-for"]};
					mongoose.model('url').create(ob,function(err,data){
						if (err) console('Error on insert '+err);
						mongoose.connection.close();
					});

					var jsn={"original_url":getpath,"shortened_url":req.protocol + '://' + req.get('host') +'/'+(max+1).toString()};
					res.send(JSON.stringify(jsn));
				}
			    }
			);
			if (findLastUrl==null) {
					console.log('Empty Db err');
			}

		}
		else
		{
			var jsn={"error":getpath+" is not a valid URL!"};
			res.send(jsn);
			//console.log(getpath);
		}
	}
}
});

var port = process.env.PORT || 8080;
app.listen(port,  function () {
	console.log('Node.js listening on port ' + port + '...');
});
