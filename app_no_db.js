const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const app = express();

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
let day = date.getDay ();

let items = ["buy food", "cook food", "eat food"];

let workItems = [];

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
    res.redirect("/work");
  }else{
    items.push(req.body.getToDo);
    res.redirect("/");
  }



});




app.listen(3000, function() {
  console.log("Server started on port 3000");
});
