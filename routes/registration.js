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

router.get("/register", isNotAuth, (req, res, next) => {
  res.render("register");
});

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

module.exports = router;