const express = require("express");
const router = express.Router();
const Channel = require("../config/database/channels");
const User = require("../config/database/users");
const Chatroom = require("../config/database/chatrooms");
const { authenticatedRoute } = require("../middleware/auth");
const { createChannel } = require("../controllers/channelUtils");

router.post("/channel/create/:id/:name", authenticatedRoute, async (req, res, next) => {
    createChannel(req, res);
});

module.exports = router;