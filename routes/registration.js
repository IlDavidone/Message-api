const express = require("express");
const router = express.Router();
const generatePassword = require("../controllers/passwordUtils").generatePassword;
const User = require("../config/database/schemas");
const isNotAuth = require("../middleware/auth").isNotAuth;
const { signup } = require("../controllers/authentication");

require('dotenv').config();

router.post("/register", async (req, res, next) => {
  signup(req, res);
});

module.exports = router;