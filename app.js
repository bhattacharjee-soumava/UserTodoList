//jshint esversion:6
require('dotenv').config();
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const app = express();
const _ = require("lodash");
const mongoose = require("mongoose");
//Authentication:
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');
const FacebookStrategy = require('passport-facebook');
const LocalStrategy = require('passport-local').Strategy;

// <button type="submit" name="delButton" onChange="submit()" value= <%= list._id %> ></button>


app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(express.static('public'));

app.set('trust proxy', 1);
app.use(session({
  secret: 'soumavas node secret key',
  resave: false,
  saveUninitialized: false

}));

app.use(passport.initialize());
app.use(passport.session());

//Connect Using Shell:
//mongosh "mongodb+srv://cluster0.kdb349w.mongodb.net/userTodoListDB" --apiVersion 1 --username soumava-admin

mongoose.connect("mongodb+srv://soumava-admin:Test123@cluster0.kdb349w.mongodb.net/userTodoListDB");
const {
  Schema,
  model
} = mongoose;

const userSchema = new Schema({

  username: String,
  password: String,
  googleId: String,
  facebookId: String,
  // secret: String
}, {
  collection: "users"
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = model("User", userSchema);



const itemSchema = new Schema({
  item: String
});

const Item = model("Item", itemSchema);

const listSchema = new Schema({
  listCategory: String
});

const List = model("List", listSchema);

const todoUserSchema = new Schema({
  userID: String,
  lists: [listSchema],
  items: [itemSchema]
}, {
  collection: 'todoUsers'
});

const TodoUser = model("TodoUser", todoUserSchema);


const currentYear = new Date().getFullYear()


////////////////////////////////////////////////////////////
//     Passport Strategies
////////////////////////////////////////////////////////////

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

passport.use(new LocalStrategy(User.authenticate()));

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/home"
    // callbackURL: '/oauth2/redirect/google',

  },
  function(accessToken, refreshToken, profile, cb) {

    console.log(profile);
    console.log(User);
    User.findOrCreate({
      googleId: profile.id
    }, function(err, user) {
      console.log('A new user from "%s" was inserted', user.googleId);
      return cb(err, user);
    });
  }
));

passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/home"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({
      facebookId: profile.id
    }, function(err, user) {
      return cb(err, user);
    });
  }
));

////////////////////////////////////////////////////////////
//App Get methods
////////////////////////////////////////////////////////////
app.get("/", function(req, res) {
  res.render("signin", {
    currentYear: currentYear
  });
});

app.get("/home", function(req, res) {
  console.log("In home route get method");
  console.log(req.isAuthenticated());
  if (req.isAuthenticated()) {
    console.log("req.user.id: " + req.user.id);
    const userId = req.user.id;
    TodoUser.findOne({"userID": userId}, function(err, userListsFound) {
      console.log("In home route get method step 2");
      if (err) {
        console.log(err);
      } else {
        console.log("userListsFound.lists: " + userListsFound.lists);
        if (userListsFound.lists == null){
          res.render("list", {
          lists: [],
          currentYear: currentYear
        });
        }else{
          res.render("list", {
          lists: userListsFound.lists,
          currentYear: currentYear
        });
        }

      }
    });
  } else {
    //res.redirect("login");
    res.render("signin", {
      currentYear: currentYear
    });
  }
});

//Authenticate Requests//
app.get('/auth/google',
  passport.authenticate('google', {
    scope: ['profile', 'email']
  }));


app.get('/auth/google/home',
  passport.authenticate('google', {
    failureRedirect: '/'
  }),
  function(req, res) {
    // Successful authentication, redirect to secrets.
    res.redirect('/home');
  });

app.get('/auth/facebook',
  passport.authenticate('facebook'));

app.get('/auth/facebook/home',
  passport.authenticate('facebook', {
    failureRedirect: '/'
  }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/home');
  });

  app.get("/register", function(req, res) {
    res.render("register", {
      currentYear: currentYear
    });
  });

//App Post Methods ///


app.post("/signup", function(req, res) {

  console.log("In post signup route...");
  console.log(req.body.username);
  console.log(req.body.password);

  User.register({
    username: req.body.username
  }, req.body.password, function(err, user) {
    if (err) {
      console.log(err);
      res.redirect("/register")
    } else {
      //A new user was saved
      console.log("Local user: " + user + "is saved.");
      console.log("UserId: " + user.id);

      const todoUser = new TodoUser({
        userID: user.id,
        lists: [],
        items: []
      });
      todoUser.save();

      passport.authenticate("local")(req, res, function() {
        res.redirect("/home")
      })
    }
  });

});

app.post("/registerpage",
  function(req, res) {
    console.log("In register post call");
    res.render("register", {
      currentYear: currentYear
    });
  });

app.post('/signin',
  passport.authenticate('local', { failureRedirect: '/' }),
  function(req, res) {
    res.redirect('/home');
  });

  app.post("/home", function(req, res) {

    console.log("In home route post method");
    console.log(req.isAuthenticated());

    if (req.isAuthenticated()) {

      console.log("req.user.id: " + req.user.id);
      console.log(req.body);
      console.log(req.body.getToDoCategory);
      const userId = req.user.id;

      const list = new List({
        listCategory: req.body.getToDoCategory
      });

      TodoUser.findOne({"userID": userId, "lists.listCategory": list.listCategory}, function(err, userListFound) {
        console.log("Home post method userListFound: " + userListFound);
        if (!err){
          if(!userListFound){

            TodoUser.findOne({"userID": userId}, function(err, userFound) {
              if (!err){
                console.log();
                console.log("Home post method userFound: " + userFound);

                  userFound.lists.push(list);
                  userFound.save();

                res.redirect("/home");
              }else{
                console.log(err);
              }
            });



          }else{
            console.log("This list category: " + req.body.getToDoCategory + " already exists for user");
            res.redirect("/home");
          }
        }else{
          console.log(err);
        }
      });
    } else {
      //res.redirect("login");
      res.render("signin", {
        currentYear: currentYear
      });
    }
  });

app.post("/userListCategory/delete", function(req, res) {
  console.log("In - /userListCategory/delete");
  // console.log(req.body);
  if (req.isAuthenticated()) {
    console.log("req.user.id: " + req.user.id);
    console.log(req.body);

    const userId = req.user.id;
    const delId = req.body.myCheckbox;

    TodoUser.findOneAndUpdate({
      userID: userId
    }, {
      $pull: {
        lists: {
          _id: delId
        }
      }
    }, function(err, foundList) {

      if (!err) {
        res.redirect("/home");
      }else{
        console.log(err);
      }
      
    });

  }else{
    res.render("signin", {
      currentYear: currentYear
    });
  }
});

app.post('/logout', function(req, res, next) {
  req.logout(function(err) {
    if (err) {
      return next(err);
    }
    res.redirect('/');
  });
});




let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}


app.listen(port, function() {
  console.log("Server started on port 3000");
});
