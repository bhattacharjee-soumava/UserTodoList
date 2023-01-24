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
const bcrypt = require('bcrypt');
//const saltRounds = process.env.SALT_ROUNDS;
const saltRounds = 10;

// const TodoDaily = model('TodoDaily', todoSchemaDaily);
// //
// //Schema within Schema
// //
// const itemSchema = {
//   todoEntry: String
// };
//
// const Item = model('Item', itemSchema);
//
// const listSchema = {
//   name: String,
//   items: [itemSchema]
// };
//
// const List = model('List', listSchema);
//
//
//
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
//mongodb+srv://soumava-admin:<password>@cluster0.kdb349w.mongodb.net/?retryWrites=true&w=majority
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

const todoUserSchema = new Schema({
  user: {
    // email: String,
    username: String,
    password: String,
    googleId: String,
    facebookId: String,
    // secret: String,
  },
  todoEntry: {
    type: String,
    required: [true, '***Please make a valid entry***'],
  }
}, {
  collection: 'todoUsers'
});


userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);


const TodoUser = model("TodoUser", todoUserSchema);
const User = model("User", userSchema);
// let day = date.getDay();
const currentYear = new Date().getFullYear()

// passport.use(User.createStrategy());

// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());
// passport.serializeUser(function(user, done) {
//   done(null, user.id);
// });
//
// passport.deserializeUser(function(id, done) {
//   User.findById(id, function(err, user) {
//     done(err, user);
//   });
// });
passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
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
// app.get("/:customListName", function(req, res) {
//
//   var customListName = _.capitalize(req.params.customListName);
//   console.log(customListName);
//   List.findOne({
//     name: customListName
//   }, function(err, foundList) {
//     console.log(foundList);
//     if (!foundList) {
//       res.render("list", {
//         listTitle: customListName,
//         newItems: []
//       });
//     } else {
//       console.log(foundList.items);
//
//       res.render("list", {
//         listTitle: customListName,
//         newItems: foundList.items
//       });
//     }
//   });
// });

//App Get methods

app.get("/", function(req, res) {
  res.render("signin", {
    currentYear: currentYear
  });
});

app.get("/home", function(req, res) {
  console.log(req.isAuthenticated());
  if (req.isAuthenticated()) {
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

app.post("/", function(req, res) {
  res.send("<h1>Hello</h1>");
});

app.post("/register", function(req, res) {
  res.render("register", {
    currentYear: currentYear
  });
});


app.post("/signup", function(req, res) {

  //const username = req.body.username;
  console.log(req.body.username);
  console.log(req.body.password);

  bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
    // Store hash in your password DB.
    if (err) {
      console.log(err);
    } else {
      const user = new User({
        username: req.body.username,
        password: hash
      });
      user.save();
    }
  });
  res.render("home", {
    currentYear: currentYear
  });


});


app.post("/signin", function(req, res) {

  User.findOne({
    username: req.body.email
  }, function(err, userFound) {

    console.log("In signin post method....");
    console.log(req.body.username);
    console.log(req.body.password);
    console.log(userFound);
    if (userFound != null) {
      if (err) {
        console.log(err);
      } else {
        bcrypt.compare(req.body.password, userFound.password, function(err, result) {
          if (result == true) {
            res.render("home", {
              currentYear: currentYear
            });
          } else {
            res.render("signin", {
              currentYear: currentYear
            });
          }
        });
        // res.render("secrets", {usersWithSecret: [userFound]});
      }
    } else {
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
});




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
