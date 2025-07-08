const express = require("express");
const router = express.Router();
const { signin } = require("../controllers/authenticationUtils");

require('dotenv').config();

router.post("/login", async (req, res, next) => {
  signin(req, res);
})

module.exports = router;
