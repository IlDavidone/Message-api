const express = require("express");
const router = express.Router();
const passport = require("passport");
const connection = require("../config/database/schemas");
const User = connection.models.User;
const isAuth = require("../middleware/auth").isAuth;
const isNotAuth = require("../middleware/auth").isNotAuth;
const isAdmin = require("../middleware/auth").isAdmin;

require('dotenv').config();

router.get("/login", isNotAuth, (req, res, next) => {
  res.render("login");
});

router.post(
  "/login",
  passport.authenticate("local", {
    failureRedirect: "/login",
    successRedirect: "/chat",
  }),
  (req, res) => {
    if (req.body.remember) {
      req.session.cookie.maxAge = 14 * 24 * 60 * 60 * 1000;
    } else {
      req.session.cookie.expires = false;
    }
  }
);

module.exports = router;
