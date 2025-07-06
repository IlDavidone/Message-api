const express = require("express");
const router = express.Router();
const connection = require("../config/database/schemas");
const User = connection.models.User;
const isAuth = require("../middleware/auth").isAuth;
const isNotAuth = require("../middleware/auth").isNotAuth;
const isAdmin = require("../middleware/auth").isAdmin;
const { signin } = require("../controllers/auth.controller");

require('dotenv').config();

router.post("/login", async (req, res, next) => {
  signin(req, res);
})

module.exports = router;
