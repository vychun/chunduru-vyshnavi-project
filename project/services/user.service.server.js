var app = require('../../express'); // this will go to the express.js file (get this from the video)
var userModel = require('../models/user/user.model.server');
var passport = require('passport');

// local strategy
var LocalStrategy = require('passport-local').Strategy;
passport.use(new LocalStrategy(localStrategy));
passport.serializeUser(serializeUser);
passport.deserializeUser(deserializeUser);
//
// function

// facebook strategy
var FacebookStrategy = require('passport-facebook').Strategy;

// calls
// gets
app.get('/api/project/username/user', findUserByUsername);
app.get('/api/project/user/:userId', findUserById);
app.get('/api/project/credentials/user', findUserByCredentials);
app.get('/api/project/checkLoggedIn', checkLoggedIn);
app.get('/auth/facebook', passport.authenticate('facebook', {'scope': 'email'}));
//posts
app.post('/api/project/register', register);
app.post('/api/project/login', passport.authenticate('local'), login);
app.post('/api/project/logout', logout);

//functions
function findUserByUsername(req, res) {
    var username = req.query['username'];

    userModel
        .findUserByUsername(username)
        .then(function(user) {
            if (user === null) {
                res.sendStatus(404)
            } else {
                res.json(user);
            }
        }, function(error) {
            res.sendStatus(404);
        });
}

function findUserById(req, res) {
    var userId = req.params.userId;

    userModel
        .findUserById(userId)
        .then(function(user) {
            if (user === null) {
                res.sendStatus(404);
            } else {
                res.json(user);
            }
        }, function(error) {
            res.sendStatus(404);
        });

}

function findUserByCredentials(req, res) {
    var username = req.query.username;
    var password = req.query.password;

    userModel
        .findUserByCredentials(username, password)
        .then(function(user) {
            if (user!== null) {
                res.json(user);
            } else {
                res.sendStatus(404);
            }
        }, function(error) {
            res.sendStatus(404);
        })
}

function checkLoggedIn(req, res){
    if(req.isAuthenticated()) {
        res.json(req.user);
    } else {
        res.send('0');
    }
}


function register(req, res)  {
    var user = req.body;
    userModel
        .createUser(user)
        .then(function (user) {
            req.login(user, function(status) {
                res.json(user);
            })
        }, function(error) {
            res.sendStatus(404);
        });
}

function login(req, res) {
    res.json(req.user);
}

function logout(req, res) {
    req.logOut();
    res.sendStatus(200);
}
// passport things
passport.serializeUser(serializeUser);

function serializeUser(user, done) {
    done(null, user);
}

passport.deserializeUser(deserializeUser);

function deserializeUser(user, done) {
    userModel
        .findUserById(user._id)
        .then(
            function(user){
                done(null, user);
            },
            function(err){
                done(err, null);
            }
        );
}


passport.use(new LocalStrategy(localStrategy));

function localStrategy(username, password, done) {
    console.log('in local strategy');
    userModel
        .findUserByCredentials(username, password)
        .then(
            function(user) {
                if(user.username === username) {
                    return done(null, user);
                } else {
                    return done(null, false);
                }
            },
            function(err) {
                if (err) { return done(err); }
            }
        );
}

// facebook

var facebookConfig = {
    clientID     : "248821795602346",
    clientSecret : "cf5d64e9bd59f22466baf885d334783c",
    callbackURL  : "http://localhost:3000/auth/facebook/callback"
};


app.get('/auth/facebook/callback',
    passport.authenticate('facebook', {
        successRedirect: '/#!/profile',
        failureRedirect: '/#!/login'
    }));

passport.use(new FacebookStrategy(facebookConfig, facebookStrategy));

function facebookStrategy(token, refreshToken, profile, done) {
    console.log(profile);

    userModel
        .findUserByFacebookId(profile.id)
        .then(function(user) {
            if (user) {
                return done(null, user);
            } else {
                console.log('am about to create a user');
                var user = {
                    username: profile.displayName.split(" ")[0],
                    facebook: {
                        id: profile.id,
                        token: token
                    }
                };
                return userModel
                    .createUser(user);
            }
        }, function(err) {
            return done(err);
        })
        .then(function(user) {
            console.log('have created user and am sending him along');
            return done(null, user);
        }, function(err) {
            return done(err);
        })
}

