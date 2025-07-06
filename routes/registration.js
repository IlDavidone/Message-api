const express = require("express");
const router = express.Router();
const generatePassword = require("../controllers/passwordUtils").generatePassword;
const connection = require("../config/database/schemas");
const User = connection.models.User;
const isNotAuth = require("../middleware/auth").isNotAuth;
const { signup } = require("../controllers/auth.controller");

require('dotenv').config();

router.post("/register", async (req, res, next) => {
  signup(req, res);
});

module.exports = router;