// =======================
// get the packages we need ============
// =======================
var allowCrossDomain = function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');

    // intercept OPTIONS method
    if ('OPTIONS' == req.method) {
        res.send(200);
    }
    else {
        next();
    }
};

var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var morgan = require('morgan');
var mongoose = require('mongoose');
var Db = require('mongodb').Db;
var MongoClient = require('mongodb').MongoClient;
var jwt = require('jsonwebtoken'); // used to create, sign, and verify tokens
var config = require('./config'); // get our config file
var User = require('./models/user'); // get our mongoose model
var DB;
// =======================
// configuration =========
// =======================
var port = process.env.PORT || 8080; // used to create, sign, and verify tokens

//mongoose.connect(config.database); // connect to database
app.set('superSecret', config.secret); // secret variable

MongoClient.connect("mongodb://heroku_0nnqckfc:9g0lk5tnvdemqgpj5hmvf6nsub@ds033153.mongolab.com:33153/heroku_0nnqckfc", function (err, db) {
    if (!err) {
        DB = db;
        console.log("We are connected");
    }
    else
        console.log("Error in connecting to DB")
});
app.use(allowCrossDomain);
// use body parser so we can get info from POST and/or URL parameters
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// use morgan to log requests to the console
app.use(morgan('dev'));

// =======================
// routes ================
// =======================
// basic route
app.get('/', function (req, res) {
    res.send('Hello! The API is at http://localhost:' + port + '/api');
});

app.post('/users', function (req, res) {

    DB.collection('User', function (err, collection) {
        collection.find({}).toArray(function (err, users) {
            res.json({
                errorCode: 0,
                errorMessage: "",
                data: {
                    users: users
                }
            });
        });
    });
});
app.post('/register', function (req, res) {
    DB.collection('User', function (err, collection) {
        collection.insert({
            first_name: req.body.first_name,
            last_name: req.body.last_name,
            email: req.body.email,
            password: req.body.password,
            mobile: req.body.mobile,
            nick_name: req.body.nick_name,
            address: req.body.address
        });
        collection.find({ email: req.body.email }).toArray(function (err, user) {
            var token = jwt.sign(user, app.get('superSecret'), {
                expiresInMinutes: 1440 // expires in 24 hours
            });

            // return the information including token as JSON
            res.json({
                errorCode: 0,
                errorMessage: "",
                data: {
                    user: user[0],
                    message: 'Enjoy your token!',
                    token: token
                }
            });
        })
    })
})
app.post('/authenticate', function (req, res) {
    console.log(req.body);
    DB.collection('User', function (err, collection) {
        collection.find({ email: req.body.email }).toArray(function (err, user) {
            console.log(user);
            if (user.length == 0)
                res.json({ data: null, errorCode: 1, errorMessage: 'Authentication failed. User not found.' });
            else if (user)
                // check if password matches
                if (user[0].password != req.body.password) {
                    res.json({ data: null, errorCode: 1, errorMessage: 'Authentication failed. Wrong password.' });
                }
                else {
                    // if user is found and password is right
                    // create a token
                    var token = jwt.sign(user, app.get('superSecret'), {
                        expiresInMinutes: 1440 // expires in 24 hours
                    });

                    // return the information including token as JSON
                    res.json({
                        errorCode: 0,
                        errorMessage: "",
                        data: {
                            user: user[0],
                            message: 'Enjoy your token!',
                            token: token
                        }
                    });
                }
        });
    });
});
//Create Missions
app.post('/create-mission', function (req, res) {
    DB.collection('Mission', function (err, collection) {
        collection.insert({
            name: req.body.mission.name,
            description: req.body.mission.description,
            start_date_estimated: req.body.mission.start_date,
            end_date_estimated: req.body.mission.end_date,
            status: req.body.mission.status,
            award_coins: req.body.mission.award_coins,
            award_experience: req.body.mission.award_experience
        });

        res.json({
            errorCode: 0,
            errorMessage: "",
            data: {
                message: 'Mission Created Successfully'
            }
        });

    })
})
app.post('/missions', function (req, res) {

    DB.collection('Mission', function (err, collection) {
        collection.find({}).toArray(function (err, missions) {
            res.json({
                errorCode: 0,
                errorMessage: "",
                data: {
                    missions: missions
                }
            });
        });
    });
});
app.post('/delete-mission', function (req, res) {

    DB.collection('Mission', function (err, collection) {
        res.json({
            errorCode: 0,
            errorMessage: "",
            data: {
                missions: req.body.mission_id
            }
        });
        //collection.remove({_id: new mongodb.ObjectID(req.body.mission_id)});
    });
});
// API ROUTES -------------------
// we'll get to these in a second

// =======================
// start the server ======
// =======================
app.listen(port);
console.log('Magic happens at http://localhost:' + port);