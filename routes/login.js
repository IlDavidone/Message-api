const express = require("express");
const router = express.Router();
const User = require("../config/database/users");
const { signin } = require("../controllers/authentication");

require('dotenv').config();

router.post("/login", async (req, res, next) => {
  signin(req, res);
})

module.exports = router;
