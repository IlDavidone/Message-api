const express = require("express");
const router = express.Router();
const passport = require("passport");
const connection = require("../config/database/schemas");
const User = connection.models.User;
const isAuth = require("../middleware/auth").isAuth;
const isNotAuth = require("../middleware/auth").isNotAuth;
const isAdmin = require("../middleware/auth").isAdmin;

require('dotenv').config();

router.get("/chat", isAuth, (req, res) => {
  console.log(req.session);
  console.log(req.user);
  res.render("index", { username: req.user.username });
});

router.get("/", (req, res, next) => {
  res.send(
    '<h1>Home</h1><p>Please <a href="/register">Register</a> or <a href="/login">Login</a></p>'
  );
});

module.exports = router;