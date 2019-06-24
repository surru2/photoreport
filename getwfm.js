var MongoClient = require('mongodb').MongoClient;
var url = 'mongodb://localhost:27017/Tasks';

const request = require('request');
const moment  = require('moment');
const username = "gdstp";
const password = "u93601";
const auth = "Basic " + new Buffer(username + ":" + password).toString("base64");


getwfm();

function getwfm(){
	console.log(moment().format('DD.MM.YYYY HH:mm:ss')+'--->start query to tp.ur.rt.ru');
	request({url : 'http://tp.ur.rt.ru/cgi/mon.pl?ac=tIXuGi&re=99&ff',headers : {"Authorization" : auth}},
		function (error, response, body) {
			if(!error){
				body=JSON.parse(body);
				MongoClient.connect(url, function(err, db) {
					db.collection('actual_wmf_orders',function(err, collection){
						collection.remove({},function(err, removed){
							createNewEntries(db, body, function() {		
								db.close();
								console.log(moment().format('DD.MM.YYYY HH:mm:ss')+'--->done');
								setTimeout(function() {
								  getwfm();
								}, 300000);
							});	
						});
					});
				});		
			}else{
				console.log(error);
				setTimeout(function() {
				  getwfm();
				}, 300000);				
			};
		}
	);
};


var createNewEntries = function(db, entries, callback) {
    var collection = db.collection('actual_wmf_orders'),          
        bulk = collection.initializeOrderedBulkOp(), 
        counter = 0;    
    entries.forEach(function(obj) {         
        bulk.insert(obj);           
        counter++;
        if (counter % 100000 == 0 ) {
            bulk.execute(function(err, result) {          
                bulk = collection.initializeOrderedBulkOp();
                callback();
            });
        }
    });             

    if (counter % 100000 != 0 ){
        bulk.execute(function(err, result) {
            callback();             
        }); 
    } 
};