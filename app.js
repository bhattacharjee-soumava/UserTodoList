//jshint esversion:6
require('dotenv').config();
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const app = express();
const _ = require("lodash");
const mongoose = require("mongoose");
// const bcrypt = require('bcrypt');
//Authentication:
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');
const FacebookStrategy = require('passport-facebook');
const LocalStrategy = require('passport-local').Strategy;

// <button type="submit" name="delButton" onChange="submit()" value= <%= list._id %> ></button>
    // <p id="listCategory"  class="hover" onClick="submit()"> <%= list.listCategory %></p>

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
  // verifyPassword: function(password, done) {
  //     bcrypt.compare(password, this.password, function(err, isMatch) {
  //         if (err) return done(err);
  //         done(null, isMatch);
  //     });
  // }
  // secret: String
}, {
  collection: "users"
});

// userSchema.methods.verifyPassword = function(password, done) {
//     bcrypt.compare(password, this.password, function(err, isMatch) {
//         if (err) return done(err);
//         done(null, isMatch);
//     });
// }

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = model("User", userSchema);



const itemSchema = new Schema({
  todoEntry: String
});

const Item = model("Item", itemSchema);

const listSchema = new Schema({
  listCategory: String,
  items: [itemSchema]
});

const List = model("List", listSchema);

const todoUserSchema = new Schema({
  userID: String,
  lists: [listSchema]
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
// passport.use(new LocalStrategy(
//   {   usernameField : 'username',
//       passwordField : 'password',
//        },
//        function (username, password, done) {
//            User.findOne({ where: { email: username } })
//                .then(function (users) {
//                    if (!users) {
//                        return done(null, false, { message: 'Incorrect email.' });
//                    }
//                    if (users.password !== password) {
//                        return done(null, false, { message: 'Incorrect password.' });
//                    }
//                    return done(null, users);
//                })
//                .catch(err => done(err));
//        }
//    ));
// passport.use(new LocalStrategy(
//   function(username, password, done) {
//     User.findOne({ username: username }, function (err, user) {
//       if (err) { return done(err); }
//       if (!user) { return done(null, false, {message: "username not found!"}); }
//       if (!user.verifyPassword(password)) { return done(null, false, {message: "incorrect password"}); }
//       return done(null, user);
//     });
//   }
// ));



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
      console.log("Local user: " + user + "is saved.");
      console.log("UserId: " + user.id);

      const todoUser = new TodoUser({
        userID: user.id,
        lists: []
      });
      todoUser.save();
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
      console.log("Local user: " + user + "is saved.");
      console.log("UserId: " + user.id);

      const todoUser = new TodoUser({
        userID: user.id,
        lists: []
      });
      todoUser.save();
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

app.get("/register", function(req, res) {
  res.render("register", {
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
          res.render("home", {
          lists: [],
          currentYear: currentYear
        });
        }else{
          res.render("home", {
          lists: userListsFound.lists,
          currentYear: currentYear
        });
        }

      }
    });
  } else {
    res.redirect("/");
    // res.render("signin", {
    //   currentYear: currentYear
    // });
  }
});


app.get("/user/:userListCategory", function(req, res) {

  console.log("-------req.params.userListCategory: " + req.params.userListCategory);
  const userListCategory = req.params.userListCategory;
  if (req.isAuthenticated()) {
    console.log("req.user.id: " + req.user.id);
    const userId = req.user.id;

    TodoUser.findOne({"userID": userId, "lists.listCategory": userListCategory}, function(err, userListFound) {
      console.log("/user/:userListCategory: " + userListFound);

      if (!err){
        const listArray = userListFound.lists;
        listArray.forEach( list => {

          if (list.listCategory === userListCategory){
            if (list.items[0] == ""){

              res.render("list", {
                currentYear: currentYear,
                listTitle: userListCategory,
                newItems: []
              });

            }else{

              res.render("list", {
                currentYear: currentYear,
                listTitle: userListCategory,
                newItems: list.items
              });
            }
          }

        });




        //console.log("userListFound.lists.items:- " + userListFound.lists.items);
        // console.log("userListCategoryItems:3 - "  +  userListCategoryItems);
      }else{
        console.log(err);
      }
    });
  }else{
    res.redirect("/");
  }
  // var customListName = _.capitalize(req.params.customListName);
  // console.log(customListName);
  // List.findOne({
  //   name: customListName
  // }, function(err, foundList) {
  //   console.log(foundList);
  //   if (!foundList) {
  //     res.render("list", {
  //       listTitle: customListName,
  //       newItems: []
  //     });
  //   } else {
  //     console.log(foundList.items);
  //
  //     res.render("list", {
  //       listTitle: customListName,
  //       newItems: foundList.items
  //     });
  //   }
  // });


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



    // Successful authentication, redirect to home.
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
        lists: []
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
    console.log("In register post call  --> redirect to get-register");
    res.redirect("/register");
    // res.render("register", {
    //   currentYear: currentYear
    // });
  });

app.post('/signin',
  passport.authenticate('local', { failureRedirect: '/', failureMessage: true }),
  function(req, res) {
    res.redirect('/home');
  });

  app.post("/home", function(req, res) {

    console.log("In home route post method");
    //res.redirect("/home");
    console.log(req.isAuthenticated());

    if (req.isAuthenticated()) {

      console.log("req.user.id: " + req.user.id);
      console.log(req.body);
      console.log(req.body.getToDoCategory);
      const userId = req.user.id;

      const list = new List({
        listCategory: req.body.getToDoCategory,
        items: []
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

app.post("/userListCategory/exploreDelete", function(req, res) {
  console.log("In - /userListCategory/exploreDelete");
  console.log(req.body);
  if (req.isAuthenticated()) {
    console.log("req.user.id: " + req.user.id);
    console.log(req.body);
    console.log("*req.body.myCheckbox: " + req.body.myCheckbox);
    console.log("req.body.listCategory: " + req.body.listCategory);
    const userId = req.user.id;
    const delId = req.body.myCheckbox;



    if (typeof req.body.myCheckbox == "undefined") {
      console.log("**********req.body.myCheckbox undefined");
      console.log("****************************************");
      console.log("Add code here to handle click on category");
      console.log("****************************************");
      console.log("****** req.body.listCategory: " + req.body.listCategory);
      console.log("****** req.params: " + req.params);
      const userListCategory = (req.body.listCategory).trim();
      const redirectUserList = "/user/" + userListCategory;
      console.log("redirectUserList:--" + redirectUserList + "---");

      res.redirect(redirectUserList);

      // res.render("list", {
      //   currentYear: currentYear,
      //   listTitle: "testListTitle",
      //   newItems: []
      // });

    }else{
        console.log("############req.body.myCheckbox DEFINED");
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
    }


  }else{
    res.render("signin", {
      currentYear: currentYear
    });
  }
});

app.post("/user/:userListCategory/add", function(req, res) {

  console.log("-------req.params.userListCategory: " + req.params.userListCategory);
  //console.log("-------req.body:- " + req.body.getToDo);
  const userListCategory = req.params.userListCategory;
  if (req.isAuthenticated()) {
    console.log("req.user.id: " + req.user.id);
    const userId = req.user.id;

    const item = new Item({
      todoEntry: req.body.getToDo
    });

    TodoUser.findOne({"userID": userId, "lists.listCategory": userListCategory}, function(err, userListFound) {
      console.log("/user/:userListCategory/add: " + userListFound);
      if (!err){
        // const Item = model("Item", itemSchema);
        if (typeof userListFound.lists.items == "undefined"){

          // const list = new List({
          //   listCategory: userListCategory,
          //   items: [item]
          // });
          //
          // const todoUser = new TodoUser({
          //   userID: userId,
          //   lists: [list]
          // });
          console.log("item:-- " + item);
          console.log("userListFound:-- " + userListFound);
          // userListFound.lists.items = [item];
          TodoUser.findOneAndUpdate({"userID": userId, "lists.listCategory": userListCategory}, {$push: {"lists.$.items": item}}, { 'new': true },
           function(err, foundList) {

            if (!err) {
              res.redirect("/user/" + userListCategory);
            }else{
              console.log(err);
            }

          });
          // console.log("userListFound after assignment:-- " + userListFound);
          // userListFound.save();
          // const todoUserSchema = new Schema({
          //   userID: String,
          //   lists: [listSchema]
          // });

          // res.render("list", {
          //   currentYear: currentYear,
          //   listTitle: userListCategory,
          //   newItems: [item]
          // });
          // res.redirect("/user/" + userListCategory);
        }else{

          userListFound.lists.items.push(item);
          userListFound.save();
          res.redirect("/user/" + userListCategory);
        }

        //console.log("userListFound.lists.items:- " + userListFound.lists.items);
        // console.log("userListCategoryItems:3 - "  +  userListCategoryItems);
      }else{
        console.log(err);
      }
    });
  }else{
    res.redirect("/");
  }
});


app.post("/user/:userListCategory/delete", function(req, res) {

  console.log("-------req.params.userListCategory: " + req.params.userListCategory);
  //console.log("-------req.body:- " + req.body.getToDo);
  const userListCategory = req.params.userListCategory;
  if (req.isAuthenticated()) {
    console.log("req.user.id: " + req.user.id);
    const userId = req.user.id;

    const item = new Item({
      todoEntry: req.body.getToDo
    });

    const delId = req.body.myCheckbox;
    console.log("#/user/:userListCategory/delete---req.body.myCheckbox ---- " + delId);
    TodoUser.findOneAndUpdate({"userID": userId, "lists.listCategory": userListCategory}, {$pull: {"lists.$.items": {_id: delId}}}, { 'new': true },
     function(err, foundList) {
          // userListFound.lists.items = [item];
          if (!err) {
            res.redirect("/user/" + userListCategory);
          }else{
            console.log(err);
          }

          });

    }else{
          res.redirect("/");
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
  console.log("Server started on port-" + port);
});
