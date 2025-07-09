const express = require("express");
const router = express.Router();
const Channel = require("../config/database/channels");
const User = require("../config/database/users");
const Chatroom = require("../config/database/chatrooms");
const { authenticatedRoute } = require("../middleware/auth");



module.exports = router;