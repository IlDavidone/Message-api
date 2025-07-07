const express = require("express");
const router = express.Router();
const User = require("../config/database/schemas");
const isAuth = require("../middleware/auth").isAuth;
const isNotAuth = require("../middleware/auth").isNotAuth;
const isAdmin = require("../middleware/auth").isAdmin;
const { signin } = require("../controllers/authentication");

require('dotenv').config();

router.post("/login", async (req, res, next) => {
  signin(req, res);
})

module.exports = router;
