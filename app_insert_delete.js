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

// let items = [];
// let workItems = [];
// Create a new Todo post object
// const todoWork = new TodoWork({
//   todoEntry: 'Ivy Ganguly',
//
// });


// TodoDaily.find(function(err, todoAll) {
//   if (err) {
//     console.log(err);
//   } else {
//     //mongoose.connection.close();
//     console.log(todoAll);
//     todoAll.forEach(function(todo){
//       //console.log(todo.todoEntry);
//       items.push(todo.todoEntry);
//     });
//   }
// });
//Insert the person in our MongoDB database
//await todoWork.save();
// TodoWork.find(function(err, todoAll) {
//   if (err) {
//     console.log(err);
//   } else {
//     //mongoose.connection.close();
//     todoAll.forEach(function(todo){
//       //console.log(todo.todoEntry);
//       workItems.push(todo.todoEntry);
//     });
//   }
// });

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

//
// let day = d.toLocaleDateString('en-US', options);
let day = date.getDay();

// let items = ["buy food", "cook food", "eat food"];
// let workItems = [];

app.get("/", function(req, res) {

  TodoDaily.find(function(err, todoAll) {
    if (err) {
      console.log(err);
    } else {

      res.render("list", {
      listTitle: day,
      newItems: todoAll
    });
    }
  });



});

app.get("/work", function(req, res) {

  TodoWork.find(function(err, todoAll) {
    if (err) {
      console.log(err);
    } else {

      res.render("list", {
      listTitle: "Work-List",
      newItems: todoAll
    });
    }
  });



});

app.post("/delete", function(req, res){

  const delId = req.body.myCheckbox;
  //console.log(req.body.page);
  if (req.body.page === "Work-List") {

    TodoWork.findByIdAndRemove(delId, function(err){
      if (!err){
        console.log("Successfully removed document from DB.");
        res.redirect("/work");
      }
    });

  }else{
    TodoDaily.findByIdAndRemove(delId, function(err){
      if (!err){
        console.log("Successfully removed document from DB.");
        res.redirect("/");
      }
    });
  }
});


app.post("/", function(req, res) {

  console.log(req.body);
  if (req.body.list === "Work-List") {

    const todoWork = new TodoWork({
      todoEntry: req.body.getToDo,

    });
    //await todoWork.save();
    todoWork.save();
    res.redirect("/work");
  }else{

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
