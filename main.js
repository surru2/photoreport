process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

const dburl = "mongodb://localhost:27017";
const dbName = 'Tasks';
const client = MongoClient = require('mongodb').MongoClient;
const fs = require('fs');
const moment = require('moment');
const nodemailer = require('nodemailer');
const uuid = require('node-uuid');
const Iconv = require("iconv").Iconv;
const iconv = new Iconv('utf8', 'utf16le');
const oracledb = require('oracledb');
const argusconnect = require('./argusstb_connect');

let transporter = nodemailer.createTransport({
    host : 'smarth.ural.rt.ru',
    port : 25,
    secure : false
});

function sendmail(mailOptions) {
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log(error);
        }
    });
};

var logout = function (req, res) {
    req.session.destroy(function (err) {
        if (err) {
            console.log(err);
        } else {
            fs.readFile('views/photologin.html', 'utf8', function read(err, data) {
                if (err) {
                    res.end(JSON.stringify({ loginstatus : 'success' }));
                    throw err;
                }
                res.end(
                    JSON.stringify({
                        loginstatus : 'logout',
                        body : data
                    })
                );
            });
        }
    });
};

var login = function (req, res) {
    client.connect(dburl, function (err, client) {
        const db = client.db(dbName);
        db.collection('photo_users', function (err, collection) {
            collection.findOne({ login : req.body.login }, function (err, document) {
                if (document) {
                    if (document.password == req.body.password && document.login == req.body.login) {
                        req.session.login = document.login;
                        req.session.role = document.role;
                        req.session.filial = document.filial;
                        req.session.name = document.name;
                        req.session.places = document.places;
                        fs.readFile('views/photo.html', 'utf8', function read(err, data) {
                            if (err) {
                                res.end(JSON.stringify({ loginstatus : 'fail' }));
                                throw err;
                            }
                            res.end(
                                JSON.stringify({
                                    loginstatus : 'success',
                                    body : data,
                                    login : req.session.login,
                                    role : req.session.role,
                                    name : req.session.name
                                })
                            );
                        });
                    } else {
                        res.end(JSON.stringify({ loginstatus : 'fail' }));
                    }
                    ;
                } else {
                    res.end(JSON.stringify({ loginstatus : 'fail' }));
                }
                ;
            });
        });
    });
};

var getusers = function (req, res) {
    var filial = req.session.filial;
    if (req.session.role === 0)
        filial = { $exists : true };
    client.connect(dburl, function (err, client) {
        const db = client.db(dbName);
        db.collection('photo_users', function (err, collection) {
            collection.find({ filial : filial }).toArray(function (err, result) {
                if (err) {
                    res.end(JSON.stringify({ status : 'fail', body : err }));
                } else {
                    res.end(JSON.stringify({ status : 'success', body : result }));
                }
                ;
            });
        });
    });
};

var createuser = function (req, res) {
    client.connect(dburl, function (err, client) {
        const db = client.db(dbName);
        db.collection('photo_users', function (err, collection) {
            collection.find({ login : req.session.login }).toArray(function (err, result) {
                if (err) {
                    throw err;
                } else {
                    if (!result.length)
                        return;
                    if (result[0].role < 2) {
                        if (1 == 1) {
                            if (req.body.filial != req.session.filial && req.session.role > 0) {
                                res.end(JSON.stringify({
                                    status : 'fail',
                                    body : 'Недостаточно прав. Вы не можете управлять пользователями другого филиала'
                                }));
                                return;
                            }
                            ;
                            if (req.body.role == 0 && req.session.role == 1) {
                                res.end(JSON.stringify({
                                    status : 'fail',
                                    body : 'Недостаточно прав. Вы не можете создать суперадмина'
                                }));
                                return;
                            }
                            ;
                            collection.insertOne({
                                date : new Date(),
                                login : req.body.login,
                                name : req.body.name,
                                email : req.body.email,
                                filial : req.body.filial,
                                role : Number(req.body.role),
                                password : req.body.password,
                                places : req.body.places
                            }, function (err, resourse) {
                                if (err) {
                                    res.end(JSON.stringify({
                                        status : 'fail',
                                        body : 'Ошибка, пользователь с таким логином уже существует'
                                    }));
                                } else {
                                    sendmail({
                                        from : 'photoreport@ural.rt.ru',
                                        to : req.body.email,
                                        subject : 'Вы зарегистрированы на ресурсе фото-контроля инсталляций',
                                        html : `<p>Добрый день, ` + req.body.name + `</p>
										Вы зарегистрированы на ресурсе фото-контроля инсталляций, для перехода на ресурс используйте
										<a href="http://212.220.22.27:8088"> ссылку</a> и сохраните её в закладках, для дальнейшей работы.<br>
										Логин: ` + req.body.login + ` <br>
										Пароль: ` + req.body.password + `<br>
										Инструкция по использованию портала https://goo.gl/ab9uuD<br>
										`
                                    });
                                    res.end(JSON.stringify({ status : 'success' }));
                                }
                                ;
                            });
                        } else {
                            res.end(JSON.stringify({
                                status : 'fail',
                                body : 'Недостаточно прав. Вы не можете создать суперадмина'
                            }));
                        }
                        ;
                    } else {
                        res.end(JSON.stringify({
                            status : 'fail',
                            body : 'Недостаточно прав, вы не можете создавать пользователей'
                        }));
                    }
                    ;
                }
                ;
            });
        });
    });
};

var deleteuser = function (req, res) {
    if (req.session.role < 2) {
        client.connect(dburl, function (err, client) {
            const db = client.db(dbName);
            db.collection('photo_users', function (err, collection) {
                collection.find({ login : req.body.login }).toArray(function (err, result) {
                    if (err) {
                        throw err;
                    } else {
                        if (!result.length)
                            return;
                        if (result[0].filial === req.session.filial || req.session.role === 0) {
                            collection.deleteOne({ login : req.body.login }, function (err, resourse) {
                                if (err) {
                                    res.end(JSON.stringify({
                                        status : 'fail',
                                        body : 'Ошибка БД удаления пользователя'
                                    }));
                                } else {
                                    res.end(JSON.stringify({ status : 'success' }));
                                }
                                ;
                            });
                        } else {
                            res.end(JSON.stringify({
                                status : 'fail',
                                body : 'Недостаточно прав, вы не можете удалять пользователей другого филиала'
                            }));
                        }
                        ;
                    }
                    ;
                });
            });
        });
    } else {
        res.end(JSON.stringify({ status : 'fail', body : 'Недостаточно прав, вы не можете удалять пользователей' }));
    }
    ;
};

var getuser = function (req, res) {
    if (req.session.role < 2) {
        client.connect(dburl, function (err, client) {
            const db = client.db(dbName);
            db.collection('photo_users', function (err, collection) {
                collection.findOne({ login : req.body.login }, function (err, document) {
                    if (err) {
                        res.end(JSON.stringify({ status : 'fail', body : err }));
                    } else {
                        if (document) {
                            if (document.filial === req.session.filial || req.session.role === 0) {
                                res.end(JSON.stringify({ status : 'success', body : JSON.stringify(document) }));
                            } else {
                                res.end(JSON.stringify({
                                    status : 'fail',
                                    body : 'Недостаточно прав, вы не можете редактировать пользователей другого филиала'
                                }));
                            }
                            ;
                        } else {
                            res.end(JSON.stringify({ status : 'fail', body : 'not found' }));
                        }
                        ;
                    }
                    ;
                });
            });
        });
    } else {
        res.end(JSON.stringify({
            status : 'fail',
            body : 'Недостаточно прав, вы не можете редактировать пользователей'
        }));
    }
    ;
};

var updateuser = function (req, res) {
    client.connect(dburl, function (err, client) {
        const db = client.db(dbName);
        db.collection('photo_users', function (err, collection) {
            collection.find({ login : req.session.login }).toArray(function (err, result) {
                if (err) {
                    throw err;
                } else {
                    if (!result.length)
                        return;
                    if (result[0].role < 2) {
                        if (1 == 1) {
                            if (req.body.filial != req.session.filial && req.session.role > 0) {
                                res.end(JSON.stringify({
                                    status : 'fail',
                                    body : 'Недостаточно прав. Вы не можете управлять пользователями другого филиала'
                                }));
                                return;
                            }
                            ;
                            if (req.body.role == 0 && req.session.role == 1) {
                                res.end(JSON.stringify({
                                    status : 'fail',
                                    body : 'Недостаточно прав. Вы не можете создать суперадмина'
                                }));
                                return;
                            }
                            ;
                            collection.updateOne(
                                {
                                    login : req.body.login
                                },
                                {
                                    $set :
                                        {
                                            name : req.body.name,
                                            email : req.body.email,
                                            filial : req.body.filial,
                                            role : Number(req.body.role),
                                            password : req.body.password,
                                            places : req.body.places
                                        }
                                }
                                , function (err, resourse) {
                                    if (err) {
                                        res.end(JSON.stringify({
                                            status : 'fail',
                                            body : 'Ошибка, пользователь с таким логином уже существует'
                                        }));
                                    } else {
                                        res.end(JSON.stringify({ status : 'success' }));
                                    }
                                    ;
                                });
                        } else {
                            res.end(JSON.stringify({
                                status : 'fail',
                                body : 'Недостаточно прав. Вы не можете создать суперадмина'
                            }));
                        }
                        ;
                    } else {
                        res.end(JSON.stringify({
                            status : 'fail',
                            body : 'Недостаточно прав, вы не можете создавать пользователей'
                        }));
                    }
                    ;
                }
                ;
            });
        });
    });
};

var getphotoreport = function (req, res) {
    var dates = req.body.period.split("-");
    var query;
    var status = req.body.status;
    if (req.session.role === 3) {
        status.splice(status.indexOf('Новый'), 1);
        status.splice(status.indexOf('Подтверждён'), 1);
        status.splice(status.indexOf('Доработан'), 1);
    };
    console.log(status);
    if (req.session.role === 0) {
        query = {
            date : {
                $gte : new Date(moment(dates[0], 'DD.MM.YYYY').startOf('day')),
                $lte : new Date(moment(dates[1], 'DD.MM.YYYY').add(1, 'day').startOf('day'))
            }, region : { $exists : true }, status : { $in : req.body.status }
        }
    } else {
        query = {
            date : {
                $gte : new Date(moment(dates[0], 'DD.MM.YYYY').startOf('day')),
                $lte : new Date(moment(dates[1], 'DD.MM.YYYY').add(1, 'day').startOf('day'))
            },
            $or : [{ region : req.session.filial }, { region : Number(req.session.filial) }],
            status : { $in : req.body.status }
        }
    }
    ;
    if (req.session.role === 2) {
        if (req.session.places) {
            query = {
                date : {
                    $gte : new Date(moment(dates[0], 'DD.MM.YYYY').startOf('day')),
                    $lte : new Date(moment(dates[1], 'DD.MM.YYYY').add(1, 'day').startOf('day'))
                },
                $or : [{ region : req.session.filial }, { region : Number(req.session.filial) }],
                status : { $in : req.body.status },
                city : { $in : req.session.places }
            }
        } else {
            query = {
                date : {
                    $gte : new Date(moment(dates[0], 'DD.MM.YYYY').startOf('day')),
                    $lte : new Date(moment(dates[1], 'DD.MM.YYYY').add(1, 'day').startOf('day'))
                },
                $or : [{ region : req.session.filial }, { region : Number(req.session.filial) }],
                status : { $in : req.body.status }
            }
        }
        ;
    }
    ;
    if (req.session.role === 3) {
        query = {
            region : req.session.filial,
            status : { $in : status },
            $or : [{ worksite : { $in : req.session.places } }, { chieflogin : req.session.login }]
        }
    }
    ;
    if (req.body.taskname)
        query = { taskname : req.body.taskname };
    if (req.body.favor) {
        client.connect(dburl, function (err, client) {
            const db = client.db(dbName);
            db.collection('photo_users', function (err, collection) {
                collection.findOne({ login : req.session.login }, function (err, document) {
                    if (document) {
                        db.collection('photos', function (err, collection) {
                            collection.find({ taskname : { $in : document.favorites } }).toArray(function (err, result) {
                                if (err) {
                                    res.end(JSON.stringify({ status : 'fail', body : err }));
                                } else {
                                    res.end(JSON.stringify({ status : 'success', body : result }));
                                }
                                ;
                            });
                        });
                    } else {
                        res.end(JSON.stringify({ status : 'fail', body : 'Ничего не найдено' }));
                    }
                    ;
                });
            });
        });
    }
    ;
    client.connect(dburl, function (err, client) {
        const db = client.db(dbName);
        db.collection('photos', function (err, collection) {
            collection.find(query).toArray(function (err, result) {
                if (err) {
                    res.end(JSON.stringify({ status : 'fail', body : err }));
                } else {
                    res.end(JSON.stringify({ status : 'success', body : result }));
                }
                ;
            });
        });
    });
};

var getchiefs = function (req, res) {
    console.log(req.body);
    if (req.session.role < 3) {
        client.connect(dburl, function (err, client) {
            const db = client.db(dbName);
            db.collection('photo_users', function (err, collection) {
                collection.find({
                    filial : req.session.filial,
                    role : 3,
                    places : { $in : [req.body.worksite] }
                }).toArray(function (err, result) {
                    if (err) {
                        res.end(JSON.stringify({ status : 'fail', body : err }));
                    } else {
                        if (result.length) {
                            res.end(JSON.stringify({ status : 'success', body : result }));
                        } else {
                            collection.find({ filial : req.session.filial, role : 3 }).toArray(function (err, result2) {
                                if (err) {
                                    res.end(JSON.stringify({ status : 'fail', body : err }));
                                } else {
                                    if (result2.length) {
                                        res.end(JSON.stringify({ status : 'success', body : result2 }));
                                    } else {
                                        res.end(JSON.stringify({
                                            status : 'fail',
                                            body : 'Не найдено ответственных для данного участка'
                                        }));
                                    }
                                    ;
                                }
                                ;
                            });
                        }
                        ;
                    }
                    ;
                });
            });
        });
    } else {
        res.end(JSON.stringify({
            status : 'fail',
            body : 'Недостаточно прав. Для повышения прав обратитесь к администратору РФ'
        }));
    }
    ;
};

var claimtask = function (req, res) {
    if (req.session.role < 3) {
        client.connect(dburl, function (err, client) {
            const db = client.db(dbName);
            db.collection('photos', function (err, collection) {
                collection.updateMany({ taskname : req.body.taskname }, {
                    $set : {
                        status : 'Претензия',
                        chiefname : req.body.chiefname,
                        chieflogin : req.body.chieflogin,
                        claimtext : req.body.claimtext,
                        claimedname : req.session.login,
                        claimdate : new Date()
                    }
                }, function (err, r) {
                    if (err) {
                        res.end(JSON.stringify({ status : 'fail', body : err }));
                    } else {
                        collection.findOne({ taskname : req.body.taskname }, function (err, document) {
                            db.collection('photo_users', function (err, collection) {
                                collection.findOne({ login : req.body.chieflogin }, function (err, chief) {
                                    if (chief) {
                                        sendmail({
                                            from : 'photoreport@ural.rt.ru',
                                            to : chief.email,
                                            subject : 'Вам назначена новая претензия',
                                            html : `<p>Добрый день, ` + document.chiefname + `</p>
												Вам назначена претензия от ` + req.session.name + `, по инсталляции <a href="http://argusweb.ur.rt.ru:8080/argus/views/wfm/wfmorder/WfmOrderView.xhtml` + document.href + `">` + document.taskname + `</a><br>
												Текст претензии:<br>
												` + document.claimtext + `<br>										
												<a href="https://argus.ural.rt.ru/views/wfm/mobilemounter/order/OrderMobileView.xhtml` + document.href + `">ссылка</a> на инцидент в <a href="https://argus.su/views/wfm/mobilemounter/order/OrderMobileView.xhtml` + document.href + `">argus.su</a> для дополнения фотоотчёта<br>	
												https://argus.su/views/wfm/mobilemounter/order/OrderMobileView.xhtml` + document.href + `<br>
												Для перехода на ресурс фото-контроля инсталляций используйте эту<a href="http://212.220.22.27:8088"> ссылку</a><br>
												`
                                        });
                                    }
                                    ;
                                });
                            });
                        });
                        res.end(JSON.stringify({ status : 'success' }));
                    }
                    ;
                });
            });
        });
    } else {
        res.end(JSON.stringify({
            status : 'fail',
            body : 'Недостаточно прав. Для повышения прав обратитесь к администратору РФ'
        }));
    }
    ;
};

var accepttask = function (req, res) {
    if (req.session.role < 3) {
        client.connect(dburl, function (err, client) {
            const db = client.db(dbName);
            db.collection('photos', function (err, collection) {
                collection.updateMany({ taskname : req.body.taskname }, {
                    $set : {
                        status : 'Подтверждён',
                        acceptedlogin : req.session.login
                    }
                }, function (err, r) {
                    if (err) {
                        res.end(JSON.stringify({ status : 'fail', body : err }));
                    } else {
                        res.end(JSON.stringify({ status : 'success' }));
                    }
                    ;
                });
            });
        });
    } else {
        res.end(JSON.stringify({
            status : 'fail',
            body : 'Недостаточно прав. Для повышения прав обратитесь к администратору РФ'
        }));
    }
    ;
};

var setcomment = function (req, res) {
    client.connect(dburl, function (err, client) {
        const db = client.db(dbName);
        db.collection('photos', function (err, collection) {
            collection.updateMany({ taskname : req.body.taskname }, {
                $addToSet : {
                    comments : {
                        text : req.body.comment,
                        commentlogin : req.session.login,
                        commentname : req.session.name,
                        commentdate : new Date()
                    }
                }
            }, function (err, r) {
                if (err) {
                    res.end(JSON.stringify({ status : 'fail', body : err }));
                } else {
                    collection.findOne({ taskname : req.body.taskname }, function (err, document) {
                        if (document) {
                            res.end(JSON.stringify({ status : 'success', body : document.comments }));
                        } else {
                            res.end(JSON.stringify({ status : 'fail', body : 'commets not found' }));
                        }
                        ;
                    });
                }
                ;
            });
        });
    });
};

var fixtask = function (req, res) {
    client.connect(dburl, function (err, client) {
        const db = client.db(dbName);
        db.collection('photos', function (err, collection) {
            collection.updateMany({ taskname : req.body.taskname }, {
                $set : {
                    status : 'Доработан',
                    fixdate : new Date(),
                    fixlogin : req.session.login
                }
            }, function (err, r) {
                if (err) {
                    res.end(JSON.stringify({ status : 'fail', body : err }));
                } else {
                    res.end(JSON.stringify({ status : 'success' }));
                }
                ;
            });
        });
    });
};

var favoritetask = function (req, res) {
    client.connect(dburl, function (err, client) {
        const db = client.db(dbName);
        db.collection('photo_users', function (err, collection) {
            collection.updateOne({ login : req.session.login }, { $addToSet : { favorites : req.body.taskname } }, function (err, r) {
                if (err) {
                    res.end(JSON.stringify({ status : 'fail', body : err }));
                } else {
                    res.end(JSON.stringify({ status : 'success', body : 'Добавлено в избранное' }));
                }
                ;
            });
        });
    });
};

var getfavorites = function (req, res) {
    client.connect(dburl, function (err, client) {
        const db = client.db(dbName);
        db.collection('photo_users', function (err, collection) {
            collection.findOne({ login : req.session.login }, function (err, document) {
                if (document) {
                    res.end(JSON.stringify({ status : 'success', body : document.favorites }));
                } else {
                    res.end(JSON.stringify({ status : 'fail', body : 'Ничего не найдено' }));
                }
                ;
            });
        });
    });
};

var unfavoritetask = function (req, res) {
    client.connect(dburl, function (err, client) {
        const db = client.db(dbName);
        db.collection('photo_users', function (err, collection) {
            collection.updateOne({ login : req.session.login }, { $pull : { favorites : req.body.taskname } }, function (err, r) {
                if (err) {
                    res.end(JSON.stringify({ status : 'fail', body : err }));
                } else {
                    res.end(JSON.stringify({ status : 'success', body : 'Удалено из избранных' }));
                }
                ;
            });
        });
    });
};

var uploadphoto = function (req, res) {
    if (!req.files) {
        res.end(JSON.stringify({ status : 'fail', body : 'no attached files' }));
        return;
    }
    ;
    let uploadedfile = req.files.uploadfile;
    var filename = fexist(uuid.v4());

    function fexist(name) {
        fs.stat(__dirname + '/public/installphoto/' + name + '.jpg', function (err, stat) {
            if (err == null) {
                filename = uuid.v4();
                fexist(filename);
            } else if (err.code == 'ENOENT') {
                filename = name;
                uploadedfile.mv(__dirname + '/public/installphoto/' + filename + '.jpg', function (err) {
                    if (err) {
                        res.end(JSON.stringify({ status : 'fail', body : err }));
                        return;
                    }
                    ;
                    MongoClient.connect(dburl, function (err, client) {
                        const db = client.db(dbName);
                        db.collection('photos').findOne({ taskname : req.body.taskname }, function (err, document) {
                            if (err) {
                                console.log(err);
                                res.end(JSON.stringify({ status : 'fail', body : err }));
                                fs.unlink(__dirname + '/public/installphoto/' + filename + '.jpg', function (err) {
                                    if (err) return console.log(err);
                                });
                            } else {
                                if (document) {
                                    db.collection('photos').updateOne(
                                        { taskname : req.body.taskname },
                                        { $addToSet : { photos : [filename + '.jpg', req.body.filetype, new Date()] } },
                                        function (err, resourse) {
                                            if (err) {
                                                console.log(err);
                                                res.end(JSON.stringify({ status : 'fail', body : err }));
                                                fs.unlink(__dirname + '/public/installphoto/' + filename + '.jpg', function (err) {
                                                    if (err) return console.log(err);
                                                });
                                            } else {
                                                db.collection('photos').findOne({ taskname : req.body.taskname }, function (err, document) {
                                                    res.end(JSON.stringify({
                                                        status : 'success',
                                                        body : document.photos
                                                    }));
                                                    db.close();
                                                });
                                            }
                                            ;
                                        });
                                } else {
                                    db.collection('photos').insertOne({
                                        date : new Date(),
                                        taskname : req.body.taskname,
                                        address : req.body.address,
                                        worksite : req.body.worksite,
                                        workername : req.body.workername,
                                        workeremail : req.body.workeremail,
                                        href : req.body.href,
                                        photos : [filename + '.jpg', req.body.filetype, new Date()],
                                        city : req.body.city,
                                        region : req.body.region,
                                        status : 'Новый'
                                    }, function (err, resourse) {
                                        if (err) {
                                            console.log(err);
                                            res.end(JSON.stringify({ status : 'fail', body : err }));
                                            fs.unlink(__dirname + '/public/installphoto/' + filename + '.jpg', function (err) {
                                                if (err) return console.log(err);
                                            });
                                        } else {
                                            res.end(JSON.stringify({ status : 'success', body : filename + '.jpg' }));
                                        }
                                        ;
                                        db.close();
                                    });
                                }
                                ;
                            }
                            ;
                        });
                    });
                })
            }
            ;
        });
    };
};

var getcsv = function (req, res) {
    var dates = req.query.period.split("-");
    var query;
    if (req.session.role === 0) {
        query = {
            date : {
                $gte : new Date(moment(dates[0], 'DD.MM.YYYY').startOf('day')),
                $lte : new Date(moment(dates[1], 'DD.MM.YYYY').add(1, 'day').startOf('day'))
            }, region : { $exists : true }
        }
    } else {
        query = {
            date : {
                $gte : new Date(moment(dates[0], 'DD.MM.YYYY').startOf('day')),
                $lte : new Date(moment(dates[1], 'DD.MM.YYYY').add(1, 'day').startOf('day'))
            }, $or : [{ region : req.session.filial }, { region : Number(req.session.filial) }]
        }
    }
    ;
    if (req.session.role === 2) {
        query = {
            date : {
                $gte : new Date(moment(dates[0], 'DD.MM.YYYY').startOf('day')),
                $lte : new Date(moment(dates[1], 'DD.MM.YYYY').add(1, 'day').startOf('day'))
            },
            $or : [{ region : req.session.filial }, { region : Number(req.session.filial) }],
            city : { $in : req.session.places }
        }
    }
    ;
    if (req.session.role === 3) {
        query = {
            $or : [{ region : req.session.filial }, { region : Number(req.session.filial) }],
            chieflogin : req.session.login,
            status : 'Претензия'
        }
    }
    ;
    client.connect(dburl, function (err, client) {
        const db = client.db(dbName);
        db.collection('photos', function (err, collection) {
            collection.find(query).toArray(function (err, result) {
                if (err) {
                    res.end(JSON.stringify({ status : 'fail', body : err }));
                } else {
                    var content =
                        'Дата' + '\t' +
                        'Номер' + '\t' +
                        'Город' + '\t' +
                        'Адрес' + '\t' +
                        'Участок' + '\t' +
                        'Работник' + '\t' +
                        'Кол-во фото' + '\t' +
                        'Сатус' + '\t' +
                        'Текст претензии' + '\t' +
                        'Ответственный' + '\t' +
                        'Проверяющие' + '\n';
                    var i = 0;
                    recursive(i);

                    function recursive(i) {
                        if (i < result.length) {
                            db.collection('photo_users', function (err, collection) {
                                collection.find({ places : { $in : [result[i].city] } }).toArray(function (err, users) {
                                    if (err) {
                                        i++;
                                        recursive(i);
                                    } else {
                                        content += moment(result[i].date).format('DD.MM.YYYY') + '\t';
                                        content += result[i].taskname + '\t';
                                        content += result[i].city + '\t';
                                        content += result[i].address + '\t';
                                        content += result[i].worksite + '\t';
                                        content += result[i].workername + '\t';
                                        content += result[i].photos.length + '\t';
                                        content += result[i].status + '\t';
                                        if (result[i].claimtext) {
                                            content += result[i].claimtext.replace(/\t|\r|\n/g, '') + '\t';
                                        } else {
                                            content += '\t';
                                        }
                                        ;
                                        if (result[i].chiefname) {
                                            content += result[i].chiefname + '\t';
                                        } else {
                                            content += '\t';
                                        }
                                        ;
                                        if (users.length) {
                                            for (let j = 0; j < users.length; j++) {
                                                if (j < users.length - 1) {
                                                    content += users[j].name + ',';
                                                } else {
                                                    content += users[j].name + '\n';
                                                }
                                                ;
                                            }
                                            ;
                                        } else {
                                            content += '\n';
                                        }
                                        ;
                                        i++;
                                        recursive(i);
                                    }
                                    ;
                                });
                            });
                        } else {
                            res.setHeader('Content-Type', 'application/vnd.csv');
                            res.setHeader("Content-Disposition", 'attachment; filename=photoreport.csv');
                            res.write(new Buffer([0xff, 0xfe]));
                            res.end(iconv.convert(content));
                        }
                    };
                }
                ;
            });
        });
    });
};

var getuserscsv = function (req, res) {
    var filial = req.session.filial;
    if (req.session.role === 0)
        filial = { $exists : true };
    client.connect(dburl, function (err, client) {
        const db = client.db(dbName);
        db.collection('photo_users', function (err, collection) {
            collection.find({ filial : filial }).toArray(function (err, result) {
                if (err) {
                    res.end(JSON.stringify({ status : 'fail', body : err }));
                } else {
                    var content =
                        'Филиал' + '\t' +
                        'Логин' + '\t' +
                        'Имя' + '\t' +
                        'Роль' + '\t' +
                        'Дата' + '\t' +
                        'e-mail' + '\n';
                    for (var i = 0; i < result.length; i++) {
                        let role;
                        switch (result[i].role) {
                            case 0:
                                role = 'Суперадмин';
                                break;
                            case 1:
                                role = 'Админ РФ';
                                break;
                            case 2:
                                role = 'Проверяющий';
                                break;
                            case 3:
                                role = 'Ответственный';
                                break;
                        }
                        ;
                        let _filial;
                        switch (result[i].filial) {
                            case '86':
                                _filial = 'ХМФ';
                                break;
                            case '66':
                                _filial = 'ЕФ';
                                break;
                            case '59':
                                _filial = 'ПФ';
                                break;
                            case '74':
                                _filial = 'ЧФ';
                                break;
                            case '72':
                                _filial = 'ФТК';
                                break;
                            case '89':
                                _filial = 'ЯНФ';
                                break;
                        }
                        ;
                        content += _filial + '\t';
                        content += result[i].login + '\t';
                        content += result[i].name + '\t';
                        content += role + '\t';
                        content += moment(result[i].date).format('DD.MM.YYYY') + '\t';
                        content += result[i].email.replace(';', ',') + '\n';
                    }
                    ;
                    res.setHeader('Content-Type', 'application/vnd.csv');
                    res.setHeader("Content-Disposition", 'attachment; filename=users.csv');
                    res.write(new Buffer([0xff, 0xfe]));
                    res.end(iconv.convert(content));
                }
                ;
            });
        });
    });
};

var getregions = function (req, res) {
    client.connect(dburl, function (err, client) {
        const db = client.db(dbName);
        db.collection('region_l', function (err, collection) {
            collection.find({ REGION : Number(req.body.region) }).toArray(function (err, regions) {
                if (err) {
                    res.end(JSON.stringify({ status : 'fail', body : err }));
                    return;
                } else {
                    db.collection('worksite', function (err, collection) {
                        collection.find({ REGION : Number(req.body.region) }).toArray(function (err, worksites) {
                            if (err) {
                                res.end(JSON.stringify({ status : 'fail', body : err }));
                                return;
                            } else {
                                res.end(JSON.stringify({
                                    status : 'success',
                                    worksites : worksites,
                                    regions : regions
                                }));
                            }
                            ;
                        });
                    });
                }
                ;
            });
        });
    });
};

var getphotoscount = function (req, res) {
    oracledb.getConnection(
        argusconnect.getConnect(),
        function (err, connection) {
            if (err) {
                console.error(err);
                res.end(JSON.stringify({
                    status : 'fail',
                    body : 'БД Аргус временно недоступна, просмотр фотографий невозможен. Попробуйте позже.'
                }));
                return;
            }
            connection.execute(
                `	select 
				att.object_attachment_id, att.file_name, att.create_date, att.REMOTE_STORAGE_PATH
				from 
				argus_sys.OBJECT_ATTACHMENT att
				where
				att.ATTACHED_TO_OBJECT_ID = ` + req.body.bi_id + `
			`,
                [],
                { maxRows : 10000000 },
                function (err, result) {
                    if (err) {
                        res.end(JSON.stringify({
                            status : 'fail',
                            body : 'Ошибка, обратитесь к администратору или попробуйте позже.'
                        }));
                    } else {
                        if (result.rows.length) {
                            var arr = [];
                            for (let i = 0; i < result.rows.length; i++) {
                                //var lob=result.rows[i][3];
                                //if (lob.type !== oracledb.CLOB) {
                                arr.push([result.rows[i][0], result.rows[i][1], result.rows[i][2], result.rows[i][3]]);
                                //}
                            }
                            ;
                            res.end(JSON.stringify({ status : 'success', body : arr }));
                        } else {
                            res.end(JSON.stringify({ status : 'success', body : [] }));
                        }
                        ;
                    }
                    ;
                    connection.close();
                });
        });
};

var getphoto = function (req, res) {
    var file = req.query.path.toLowerCase();
    if (fs.existsSync(file)) {
        var filestream = fs.createReadStream(file);
        filestream.pipe(res);
    } else {
        res.end('error');
    }
};

var getmaterials = function (req, res) {
    var dates = req.query.period.split("-");
    var filial = 'Ханты-Мансийский филиал';
    switch (req.session.filial) {
        case 86:
            filial = 'Ханты-Мансийский филиал';
            break;
        case 66:
            filial = 'Екатеринбургский филиал';
            break;
        case 59:
            filial = 'Пермский филиал';
            break;
        case 74:
            filial = 'Челябинский филиал';
            break;
        case 72:
            filial = 'ФТК';
            break;
        case 89:
            filial = 'Ямало-Ненецкий филиал';
            break;
    }
    if (req.session.role === 0)
        filial = { $exists : true };
    var MongoClient = require('mongodb').MongoClient;
    var url = "mongodb://localhost:27017/";
    MongoClient.connect(url, function (err, db) {
        if (err) throw err;
        var dbo = db.db("Tasks");
        dbo.collection("materials").find({
            date : {
                $gte : new Date(moment(dates[0], 'DD.MM.YYYY').startOf('day')),
                $lte : new Date(moment(dates[1], 'DD.MM.YYYY').add(1, 'day').startOf('day'))
            }, filial : filial
        }).toArray(function (err, items) {
            if (err) throw err;
            var content =
                'Филиал' + '\t' +
                'Дата' + '\t' +
                'Номер' + '\t' +
                'Участок' + '\t' +
                'Работник' + '\t' +
                'Адрес' + '\t' +
                'Номенклатура' + '\t' +
                'Наименование' + '\t' +
                'Кол-во' + '\t' +
                'ед.изм' + '\n';
            for (var i = 0; i < items.length; i++) {
                for (var j = 0; j < items[i].materials.length; j++) {
                    content += items[i].filial + '\t';
                    content += moment(items[i].date).format('DD.MM.YYYY') + '\t';
                    content += items[i].taskname + '\t';
                    content += items[i].worksite + '\t';
                    content += items[i].workername + '\t';
                    content += items[i].address + '\t';
                    content += items[i].materials[j][0] + '\t';
                    content += items[i].materials[j][1] + '\t';
                    content += items[i].materials[j][2] + '\t';
                    content += items[i].materials[j][3] + '\n';
                }
                ;
            }
            res.setHeader('Content-Type', 'application/vnd.csv');
            res.setHeader("Content-Disposition", 'attachment; filename=materials.csv');
            res.write(new Buffer([0xff, 0xfe]));
            res.end(iconv.convert(content));
            db.close();
        });
    });
};

module.exports.login = login;
module.exports.logout = logout;
module.exports.getusers = getusers;
module.exports.createuser = createuser;
module.exports.deleteuser = deleteuser;
module.exports.getuser = getuser;
module.exports.updateuser = updateuser;
module.exports.getphotoreport = getphotoreport;
module.exports.getchiefs = getchiefs;
module.exports.claimtask = claimtask;
module.exports.accepttask = accepttask;
module.exports.setcomment = setcomment;
module.exports.fixtask = fixtask;
module.exports.favoritetask = favoritetask;
module.exports.getfavorites = getfavorites;
module.exports.unfavoritetask = unfavoritetask;
module.exports.uploadphoto = uploadphoto;
module.exports.getcsv = getcsv;
module.exports.getuserscsv = getuserscsv;
module.exports.getregions = getregions;
module.exports.getphotoscount = getphotoscount;
module.exports.getphoto = getphoto;
module.exports.getmaterials = getmaterials;
