const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const alert = require("alert");
let mongoose = require("mongoose");

const app = express();


// to enable the use of ejs and css 
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// Connection to mongodb 
let mongoDB = "mongodb://localhost:27017/hostelDB";
mongoose.connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true });
let db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));

// making a schema to store user data when he fills the booking form 
let Schema = mongoose.Schema;
let usersSchema = new Schema({
  name: String,
  phoneNumber: Number,
  email: String,
  roomSize: String,
  startMonth: String,
  startYear: String,
  endMonth: String,
  endYear: String,
  bathType: String,
  feePaid: Number,
  roomId: String,
  seatId: Number,
});

let userDB = mongoose.model("hostelDB", usersSchema);

const months = [
  "January",
  "Febuary",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const adminId = "admin123";
const password = "admin123";

// checks whether the start date is smaller than end date to avoid incorrect entries 
function validateDate(startMonth, startYear, endMonth, endYear, months) {
  if (startYear > endYear) {
    return false;
  }
  if (startYear < endYear) {
    return true;
  }
  if (startYear == endYear) {
    let startMonthIdx, endMonthIdx;
    for (let i = 0; i < months.length; i++) {
      if (startMonth === months[i]) {
        startMonthIdx = i;
      }
      if (endMonth === months[i]) {
        endMonthIdx = i;
      }
    }

    if (startMonthIdx > endMonthIdx) {
      return false;
    } else {
      return true;
    }
  }
}

// find how many months are there between the start and end date. This helps is estimating rent fee
function calcDatesDiff(startMonth, startYear, endMonth, endYear, months) {
  let sy, ey;
  for (let i = 0; i < months.length; i++) {
    if (months[i] === startMonth) {
      sy = i;
    }
    if (months[i] === endMonth) {
      ey = i;
    }
  }
  if (endYear == startYear) {
    return ey - sy + 1;
  } else {
    return 12 - sy + (ey + 1);
  }
}

// calculates the total fee depending on room size, bath type and the duration 
function calcRent(datediff, roomSize, bathType) {
  if (roomSize == "large") {
    if (bathType == "attachBath") {
      return datediff * 15000;
    } else {
      return datediff * 12000;
    }
  }
  if (roomSize == "medium") {
    if (bathType == "attachBath") {
      return datediff * 18000;
    } else {
      return datediff * 14000;
    }
  }
  if (roomSize == "small") {
    if (bathType == "attachBath") {
      return datediff * 25000;
    } else {
      return datediff * 18000;
    }
  }
}

// home page or landing page 
app.get("/", (req, res) => {
  res.render("home");
});

// display a booking form to be filled for registration 
app.get("/booking", (req, res) => {
  res.render("booking", { months: months });
});

// Display form to fill passward and username to access the database
app.get("/adminlogin", (req, res) => {
  res.render("adminLogin");
});

let allow = 0; 
// checks whether user entered correct or incorrect password and user and redirects 
app.post("/adminlogin", (req, res) => {
  if (adminId == req.body.adminId && password == req.body.password) {
    app.get("/management", (req, res) => {
      userDB.find({}, (err, users) => {
        res.render("management", { users: users });
      });
    });
    res.redirect("/management");
  
  } else {
    alert("password incorrect");
  }
});

// takes all the information from what user has filled in registration form and stores it in database
app.post("/booking", async (req, res) => {
  let userInstance = new userDB({
    name: req.body.name,
    phoneNumber: req.body.phoneNumber,
    email: req.body.email,
    roomSize: req.body.roomSize,
    startMonth: req.body.startMonth,
    startYear: req.body.startYear,
    endMonth: req.body.endMonth,
    endYear: req.body.endYear,
    bathType: req.body.bathType,
    feePaid: 0,
    roomId: "R1",
    seatId: ( Math.floor(Math.random()*4)+1 ),
  });

  await userDB.findOne(
    { phoneNumber: userInstance.phoneNumber },
    function (err, details) {
      if (details) {
        alert("User already exists please try a new phone number");
      } else {
        // check email address
        userDB.findOne({ email: userInstance.email }, function (err, details) {
          if (details) {
            alert("User already exists please try a new email");
          } else {
            if (
              validateDate(
                userInstance.startMonth,
                userInstance.startYear,
                userInstance.endMonth,
                userInstance.endYear,
                months
              )
            ) {
              let x = calcRent(
                calcDatesDiff(
                  userInstance.startMonth,
                  userInstance.startYear,
                  userInstance.endMonth,
                  userInstance.endYear,
                  months
                ),
                userInstance.roomSize,
                userInstance.bathType
              );
              userInstance.feePaid = x;
              userInstance.save(function (err) {
                if (err) {
                  alert("Error please retry");
                } else {
                  alert("You have been successfully registered");
                  res.redirect("/booking");
                }
              });
            } else {
              alert("Invalid information Please try again");
            }
          }
        });
      }
    }
  );
});

app.listen(3000, () => {
  console.log("server at port 3000");
});
