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
const bcrypt = require('bcrypt');
const saltRounds = 10;

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
// //
// //##TO do####
// //
const userSchema = new Schema({
  // email: String,
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
// I am use bctypt, but you need your comparer function
userSchema.methods.verifyPassword = function(password, callback) {
  callback(err, bcrypt.compareSync(password, this.password));
};
const User = model("User", userSchema);

const itemSchema = new Schema({
  todoEntry: String
})


const todoUserSchema = new Schema({
  userID: String,
  listName: String,
  items: [itemSchema]
}, {
  collection: 'todoUsers'
});

const TodoUser = model("TodoUser", todoUserSchema);


// let day = date.getDay();
const currentYear = new Date().getFullYear()

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

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


passport.use('local-signup', new LocalStrategy({},

  function(username, password, err) {


    console.log(username);
    console.log(password);

    User.findOne({ username: username }, function (err, user) {

      if (err){
        throw err;
      }

      if (user) {
        console.log('That email is already taken.');
        // return done(null, false, req.flash('signupMessage', 'That email is already taken.'));
      } else {

        console.log("Save new user here");

      }


    });
  }
));


//App Get methods

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
    User.findById(req.user.id, function(err, userFound) {
      if (err) {
        console.log(err);
      } else {
        res.render("home", {
          currentYear: currentYear
        });
      }
    });
  } else {
    //res.redirect("login");
    //-->ChangeUser.find({secret: {$ne: null}}, function(err, userswithSecretsFound){
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

//App Post Methods ///

// app.post("/", function(req, res) {
//   res.send("<h1>Hello</h1>");
// });

app.get("/register", function(req, res) {
  res.render("register", {
    currentYear: currentYear
  });
});

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//  Sign Up method w/o passport start
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// app.post("/register", function(req, res) {
//
//   //const username = req.body.username;
//   console.log(req.body.username);
//   console.log(req.body.password);
//
//   bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
//     // Store hash in your password DB.
//     if (err) {
//       console.log(err);
//     } else {
//       const user = new User({
//         username: req.body.username,
//         password: hash
//       });
//       user.save();
//     }
//   });
//   res.render("home", {
//     currentYear: currentYear
//   });
//
//
// });

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//  Sign Up method w/o passport end
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//  Sign Up method with passport start
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// app.post("/register", function(req, res) {
//
//   User.register({
//     username: req.body.username,
//     active: false
//   }, req.body.password, function(err, user) {
//     if (err) {
//       console.log(err);
//       res.redirect("/register");
//     } else {
//       passport.authenticate("local")(req, res, function() {
//         res.redirect("/home");
//         // const authenticate = User.authenticate();
//         // authenticate(req.body.username, req.body.password, function(err, result) {
//         //   if (err) {
//         //     console.log(err);
//         //   }else{
//         //     res.redirect("/secrets");
//         //   }
//         //
//         //   // Value 'result' is set to false. The user could not be authenticated since the user is not active
//         // });
//       });
//     }
//
//
//
//   });
//
//
//

app.post("/register", function(req, res) {
  res.render("register", {
    currentYear: currentYear
  });
});

// process the signup form
app.post('/signup', passport.authenticate('local-signup', {
    successRedirect : '/home', // redirect to the secure profile section
    failureRedirect : '/register'
}));


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//  Sign Up method with passport end
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//  Sign In method without passport start
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // app.post("/signin", function(req, res) {
  //
  // User.findOne({
  //   username: req.body.email
  // }, function(err, userFound) {
  //
  //   console.log("In signin post method....");
  //   console.log(req.body.email);
  //   console.log(req.body.password);
  //   console.log("userFound: " + userFound);
  //   if (userFound != null) {
  //     if (err) {
  //       console.log(err);
  //     } else {
  //       bcrypt.compare(req.body.password, userFound.password, function(err, result) {
  //         console.log("result: " + result);
  //         if (result == true) {
  //           res.redirect("/home");
  //         } else {
  //           res.redirect("/signin");
  //         }
  //       });
  //       // res.render("secrets", {usersWithSecret: [userFound]});
  //     }
  //   } else {
  //     res.redirect("/");
  // }
  //
  // });
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  //  Sign In method without passport end
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  //  Sign In method with passport start
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  app.post('/signin',
  passport.authenticate('local', { failureRedirect: '/' }),
  function(req, res) {
    res.redirect('/home');
  });


  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  //  Sign In method with passport end
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  app.post('/logout', function(req, res, next) {
    req.logout(function(err) {
      if (err) {
        return next(err);
      }
      res.redirect('/');
    });
  });

// console.log(req.isAuthenticated());
// if (req.isAuthenticated()) {
//   User.findById(req.user.id, function(err, userFound) {
//     if (err) {
//       console.log(err);
//     } else {
//       res.render("home", {
//         currentYear: currentYear
//       });
//     }
//   });
// } else {
//   //res.redirect("login");
//   //-->ChangeUser.find({secret: {$ne: null}}, function(err, userswithSecretsFound){
//   res.render("signin", {
//     currentYear: currentYear
//   });
// }





// app.post("/", function(req, res) {
//   console.log(req.body);
//   });
// app.get("/", function(req, res) {
//
//   Item.find(function(err, todoAll) {
//     if (err) {
//       console.log(err);
//     } else {
//
//       res.render("list", {
//         listTitle: "Today",
//         newItems: todoAll
//       });
//     }
//   });
// });


// app.post("/", function(req, res) {
//
//   console.log(req.body);
//   console.log(req.body.getToDo);
//
//   const listName = req.body.list;
//   const item = new Item({
//     todoEntry: req.body.getToDo
//   });
//
//   if (req.body.list != "Today") {
//     console.log(item);
//     console.log(listName);
//
//     List.findOne({name: listName}, function(err, findPostList){
//       if (!err){
//         if (!findPostList){
//           const list = new List({
//             name: listName,
//             items: [item]
//           });
//           list.save();
//           res.render("list", {
//             listTitle: listName,
//             newItems: [item]
//           });
//         }else{
//           findPostList.items.push(item);
//           findPostList.save();
//           res.redirect("/" + listName);
//         }
//       }else{
//         console.log(err);
//       }
//
//     });
//
//
//   } else {
//
//     //await todoDaily.save();
//     item.save();
//     res.redirect("/");
//   }
//
// });

// app.post("/delete", function(req, res) {
//
//   const page = req.body.page;
//   const delId = req.body.myCheckbox;
//   console.log(req.body.page);
//   if (req.body.page != "Today") {
//
//
//     List.findOneAndUpdate({
//       name: page
//     }, {
//       $pull: {
//         items: {
//           _id: delId
//         }
//       }
//     }, function(err, foundList) {
//
//       if (!err) {
//         res.redirect("/" + page);
//       }
//     });
//   } else {
//     Item.findByIdAndRemove(delId, function(err) {
//       if (!err) {
//         console.log("Successfully removed document from DB.");
//         res.redirect("/");
//       }
//     });
//   }
// });

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}


app.listen(port, function() {
  console.log("Server started on port 3000");
});
