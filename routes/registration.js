const express = require("express");
const router = express.Router();
const User = require("../config/database/users");
const { signin } = require("../controllers/authenticationUtils");

require('dotenv').config();

router.post("/register", async (req, res, next) => {
  signup(req, res);
});

module.exports = router;