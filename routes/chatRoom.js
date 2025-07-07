const User = require("../config/database/users");
const express = require("express");
const router = express.Router();
const { authenticatedRoute } = require("../middleware/auth");

// router.post("/chatroom/create/:name", authenticatedRoute, (req, res, next) => {

// });

module.exports = router;