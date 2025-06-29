const express = require("express");
const router = express.Router();
const passport = require("passport");
const generatePassword = require("../controllers/passwordUtils").generatePassword;
const connection = require("../config/database/schemas");
const User = connection.models.User;
const isAuth = require("../controllers/auth").isAuth;
const isNotAuth = require("../controllers/auth").isNotAuth;
const isAdmin = require("../controllers/auth").isAdmin;

require('dotenv').config();

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

router.post("/register", async (req, res, next) => {
  try {
    const existingUser = await User.findOne({ username: req.body.username });

    if (existingUser) {
      return res
        .status(400)
        .send("User already exists. Please choose another username.");
    }

    const saltHash = generatePassword(req.body.password);
    const salt = saltHash.salt;
    const hash = saltHash.hash;

    const newUser = new User({
      username: req.body.username,
      hash: hash,
      salt: salt,
      admin: false,
    });

    await newUser.save();
    res.redirect("/login");
  } catch (err) {
    next(err);
  }
});

router.get("/chat", (req, res) => {
    res.render("index", { username: req.user.username });
});

router.get("/", (req, res, next) => {
  res.send(
    '<h1>Home</h1><p>Please <a href="/register">Register</a> or <a href="/login">Login</a></p>'
  );
});

router.get("/login", isNotAuth, (req, res, next) => {
  res.render("login");
});

router.get("/register", isNotAuth, (req, res, next) => {
  res.render("register");
});

module.exports = router;
