var nodemailer = require('nodemailer');
    let transporter = nodemailer.createTransport({
        host: 'localhost',
        port: 25,
        secure: false, 
        auth: {
            user: 'ksmon', 
            pass: 'ksmon'
        }
    });
	
var express = require('express');
var moment = require('moment');
var session = require('express-session');
var bodyParser = require('body-parser');
var app = express();
var fs = require("fs");
var MongoClient = require('mongodb').MongoClient;
var app_port=8088;
var main = require('./main');

app.engine('html', require('ejs').renderFile);
app.use(session({secret: 'QdtVr56zP',resave: true,saveUninitialized: true}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static('public'));

app.use(function(req, res, next) {
	next();		
}); 

app.listen(app_port,'0.0.0.0',function(){
	console.log("App Started on PORT "+app_port);
});

app.use(function(req, res, next) {
        //res.redirect('https://photoreport.ural.rt.ru/' + req.url);
	next();
});

app.get('/',function(req,res){
	//res.end('Portal is temporarily unavailable. Sorry');
	//return;
	if(req.session.login) {
		res.render('photo.html');

	}else{
		res.render('photologin.html');
	}
});

app.all('/main',function(req,res){
	if (!req.session.login && req.body.act!=='login'){
		res.end('no_session');
		return;
	}
	else if(req.method=='POST'){
		if(req.body.act==='login' && req.body.password && req.body.login) main.login(req,res);
		if(req.body.act==='logout') main.logout(req,res);	
		if(req.body.act==='getusers') main.getusers(req,res);	
		if(req.body.act==='createuser' && req.body.login && req.body.name && req.body.email && req.body.filial && req.body.password && req.body.role) main.createuser(req,res);	
		if(req.body.act==='deleteuser' && req.body.login) main.deleteuser(req,res);	
		if(req.body.act==='getuser' && req.body.login) main.getuser(req,res);	
		if(req.body.act==='updateuser' && req.body.login && req.body.name && req.body.email && req.body.filial && req.body.password && req.body.role) main.updateuser(req,res);	
		if(req.body.act==='getphotoreport' && req.body.period) main.getphotoreport(req,res);
		if(req.body.act==='getchiefs' && req.body.worksite) main.getchiefs(req,res);
		if(req.body.act==='claimtask') main.claimtask(req,res);
		if(req.body.act==='accepttask') main.accepttask(req,res);
		if(req.body.act==='setcomment' && req.body.taskname && req.body.comment) main.setcomment(req,res);
		if(req.body.act==='fixtask' && req.body.taskname) main.fixtask(req,res);
		if(req.body.act==='favoritetask' && req.body.taskname) main.favoritetask(req,res);
		if(req.body.act==='getfavorites') main.getfavorites(req,res);
		if(req.body.act==='unfavoritetask' && req.body.taskname) main.unfavoritetask(req,res);
		if(req.body.act==='uploadphoto' && req.body.taskname && req.body.filetype) main.uploadphoto(req,res);
		if(req.body.act==='getregions') main.getregions(req,res);
		if(req.body.act==='getphotoscount' && req.body.bi_id) main.getphotoscount(req,res);
	}else if(req.method=='GET'){
		if(req.query.act==='getcsv' && req.query.period) main.getcsv(req,res);
		if(req.query.act==='getmaterials' && req.query.period) main.getmaterials(req,res);
		if(req.query.act==='getuserscsv') main.getuserscsv(req,res);
		if(req.query.act==='getphoto' && req.query.path) main.getphoto(req,res);
	};
});

