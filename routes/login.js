const express = require("express");
const router = express.Router();
const connection = require("../config/database/schemas");
const User = connection.models.User;
const isAuth = require("../middleware/auth").isAuth;
const isNotAuth = require("../middleware/auth").isNotAuth;
const isAdmin = require("../middleware/auth").isAdmin;

require('dotenv').config();

router.get("/login", isNotAuth, (req, res, next) => {
  res.render("login");
});

//  //router.post(
//   "/login",
//   (req, res) =>  {

//   }
// );

module.exports = router;
