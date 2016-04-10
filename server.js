'use strict';
var https=require('https');
var express = require('express');
var mongoose = require('mongoose'); 
var path=require('path');
var fs=require('fs');

var flickrKey="6e6dc76f660cd9a9688c4cad747c16bf";
var hostname="api.flickr.com";
var param="/services/rest/?method=flickr.photos.search&format=json&nojsoncallback=1";

var app = express();
app.use('/', function (req,res,next) //single entry point for all GET requests
{
	var getpath=decodeURIComponent(req.path).replace(/(^\/)/g, "");//remove leading / and decode URI
//handle default GET with help page
	if (getpath=='')
	{
			res.sendFile(path.join(__dirname,'public/indexImageSearch.html'));
	}
	else //an actual GET request
	{
	// we got an image request so we should treat it
	console.log(getpath);
	if (getpath.match('^api/imagesearch/*'))
	{
		var searchtext=getpath.replace('api/imagesearch/','');//keep only the text to search and offset if applicable
		//save the string request into mongodb
		mongoose.connect('mongodb://localhost:27017/clementinejs');//connect to db
		//load all model files (with tables definition)
		fs.readdirSync(__dirname+'/models').forEach(function(filename){
				if (filename.indexOf('.js')) {
				//console.log(__dirname+'/models/'+filename) ;
				require (__dirname+'/models/'+filename);
						}
		});
		//our db model is imgSearch
		var ob={"term":searchtext,"when":new Date().toString(),"ip":req.headers["x-forwarded-for"]};
		mongoose.model('imgSearch').create(ob,function(err,data){
				if (err) console('Error on insert '+err);
				mongoose.connection.close();
			});
		//set default page to 1 if no offset specified in the request
		var page=(req.query.offset==undefined)?1:req.query.offset;
		console.log(searchtext);//compile the actual request for flickr
		  var options = {
		    host: hostname,
		    path:param+'&api_key='+flickrKey+'&page='+page+'&text='+encodeURIComponent(searchtext),
		    method: 'GET',
		    headers: {}
		  };
		console.log(options);
		//do the flickr request
		var reqs = https.request(options, function(resp) {
			resp.setEncoding('utf-8');
			//console.log(resp);
			var responseString = '';
			resp.on('data', function(data) {
				responseString += data;
				//console.log(data);
			});

			resp.on('end', function() {
				//console.log(responseString);
				var responseObject = JSON.parse(responseString);
				//create new object with urls
				var recomposedJSON=[];
				for (var i=0;i<responseObject.photos.photo.length;i++)
				{
					recomposedJSON.push({url:'farm'+responseObject.photos.photo[i].farm+
						'.staticflickr.com/'+responseObject.photos.photo[i].server+
						'/'+responseObject.photos.photo[i].id+'_'+responseObject.photos.photo[i].secret+'.jpg',
						snippet:responseObject.photos.photo[i].title,
						context:'farm'+responseObject.photos.photo[i].farm+
						'.staticflickr.com/'+responseObject.photos.photo[i].server+
						'/'+responseObject.photos.photo[i].id+'_'+responseObject.photos.photo[i].secret+'.jpg'
						});
				}
				res.end(JSON.stringify(recomposedJSON));
			});
		});
		reqs.end();//needed because otherwise we get socket timeout
	}
	else
		if (getpath.match('^api/latest/imagesearch/*'))
		{

				mongoose.connect('mongodb://localhost:27017/clementinejs');//connect to db
				//load all model files (with tables definition)
				fs.readdirSync(__dirname+'/models').forEach(function(filename){
						if (filename.indexOf('.js')) {
						//console.log(__dirname+'/models/'+filename) ;
						require (__dirname+'/models/'+filename);
								}
						});
				//search for image search terms and return them all
				mongoose.model('imgSearch').find().exec( function(err,docs)
						{
								if (err) console.log('Err search'+err);
								mongoose.connection.close();
								console.log(docs);
								var latestSearches=[];//remove all the other info keep just term and when
								for (var i=0;i<docs.length;i++) { latestSearches.push({'term':docs[i].term,'when':docs[i].when})};
								res.end(JSON.stringify(latestSearches));
						});
		}
		else //GET request unknown-return error message
		{
			res.end('Invalid GET request! for valid ones see main page');
		}
	}	
});

var port = process.env.PORT || 8080;
app.listen(port,  function () {
	console.log('Node.js listening on port ' + port + '...');
});
