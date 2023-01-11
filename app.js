//jshint esversion:6

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

mongoose.connect("mongodb+srv://soumava-admin:Test123@cluster0.kdb349w.mongodb.net/userTodoListDB");
const {
  Schema,
  model
} = mongoose;
// //
// //##TO do####
// //
const todoSchema = new Schema({
  user: String,
  todoEntry: {
    type: String,
    required: [true, '***Please make a valid entry***'],
  }
}, {
  collection: 'todoLists'
});
// let day = date.getDay();
const currentYear = new Date().getFullYear()

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

app.get("/", function(req, res) {
  res.render("signin", {currentYear: currentYear});
});

app.post("/",function(req, res){res.send("<h1>Hello</h1>");});

app.post("/register",function(req, res){res.render("register");});
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
