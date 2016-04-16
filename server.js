'use strict';
var express = require('express');
var path=require('path');
var fs=require('fs');
var multer=require('multer');
var app = express();
//control the file names- add datetime to each when saving to public folder
var storage =   multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, './public');
  },
  filename: function (req, file, callback) {
    callback(null, file.fieldname + '-' + Date.now());
  }
});

var upload = multer({ storage : storage ,limits:{fileSize:1024*1024} } ).single('fil');

app.get('/', function (req,res,next) //single entry point for all GET requests
{
			res.sendFile(path.join(__dirname,'public/indexPostBack.html'));
});

app.post('/api/fileanalyze',function(req,res){
    upload(req,res,function(err) {
        if(err) {
            return res.end(JSON.stringify({'error':"Error uploading file under 1Mb:"+err.toString()}));
        }
	if (req.file==undefined) return res.end(JSON.stringify({'error':'No file to upload'}));
        res.end(JSON.stringify({originalname:req.file.originalname,size:req.file.size}));
    });
});





var port = process.env.PORT || 8080;
app.listen(port,  function () {
	console.log('Node.js listening on port ' + port + '...');
});
