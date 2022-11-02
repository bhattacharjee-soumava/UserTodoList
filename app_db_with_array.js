const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const app = express();


//import mongoose from 'mongoose'
const mongoose = require("mongoose");
mongoose.connect("mongodb://localhost:27017/todolistDB?maxPoolSize=20&w=majority");

const { Schema, model } = mongoose;
//
//##TO do Daily ####
//
const todoSchemaDaily = new Schema({
  todoEntry: {
    type: String,
    required: [true, '***Please make a valid entry***'],
  }
}, {collection: 'todoListsDaily'});

const TodoDaily = model('TodoDaily', todoSchemaDaily);
// Create a new Todo post object
// const todoDaily = new TodoDaily({
//   todoEntry: 'Ivy Ganguly',
//
// });

//Insert the person in our MongoDB database
//await todoDaily.save();

//
//##TO do Work ####
//
const todoSchemaWork = new Schema({
  todoEntry: {
    type: String,
    required: [true, '***Please make a valid entry***'],
  }
}, {collection: 'todoListsWork'});

const TodoWork = model('TodoWork', todoSchemaWork);


//let items = ["buy food", "cook food", "eat food"];
//let workItems = [];
// db.todoListsDaily.insertOne({todoEntry: 'buy food'})
//
// db.collection.insertMany([
// 	{todoEntry: 'cook food'},
// 	{todoEntry: 'eat food'}
// ])

let items = [];
let workItems = [];
// Create a new Todo post object
// const todoWork = new TodoWork({
//   todoEntry: 'Ivy Ganguly',
//
// });


TodoDaily.find(function(err, todoAll) {
  if (err) {
    console.log(err);
  } else {
    //mongoose.connection.close();
    console.log(todoAll);
    todoAll.forEach(function(todo){
      //console.log(todo.todoEntry);
      items.push(todo.todoEntry);
    });
  }
});
//Insert the person in our MongoDB database
//await todoWork.save();
TodoWork.find(function(err, todoAll) {
  if (err) {
    console.log(err);
  } else {
    //mongoose.connection.close();
    todoAll.forEach(function(todo){
      //console.log(todo.todoEntry);
      workItems.push(todo.todoEntry);
    });
  }
});

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(express.static('public'));

//const weekday = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
// const d = new Date();
// //let day = weekday[d.getDay()];
//
// const options = {
//   weekday: 'long',
//   month: 'long',
//   day: 'numeric',
//   year: 'numeric'
// };
function remove(el) {
  var element = el;
  //element.remove();
  console.log(el);
}
//
// let day = d.toLocaleDateString('en-US', options);
let day = date.getDay();

// let items = ["buy food", "cook food", "eat food"];
// let workItems = [];

app.get("/", function(req, res) {


  res.render("list", {
    listTitle: day,
    newItems: items
  });

});

app.get("/work", function(req, res) {


  res.render("list", {
    listTitle: "Work-List",
    newItems: workItems
  });

});

app.get("/about", function(req, res) {


  res.render("about");

});

app.post("/", function(req, res) {

  console.log(req.body);
  if (req.body.list === "Work-List") {
    workItems.push(req.body.getToDo);
    const todoWork = new TodoWork({
      todoEntry: req.body.getToDo,

    });
    //await todoWork.save();
    todoWork.save();
    res.redirect("/work");
  }else{
    items.push(req.body.getToDo);
    const todoDaily = new TodoDaily({
      todoEntry: req.body.getToDo,

    });
    //await todoDaily.save();
    todoDaily.save();
    res.redirect("/");
  }
});




app.listen(3000, function() {
  console.log("Server started on port 3000");
});
