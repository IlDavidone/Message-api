const express = require("express");
const router = express.Router();
const Channel = require("../config/database/channels");
const User = require("../config/database/users");
const Chatroom = require("../config/database/chatrooms");
const { authenticatedRoute } = require("../middleware/auth");
const {
  createChannel,
  getAllChatroomChannels,
  getAllPublicChatroomChannels,
} = require("../controllers/channelUtils");

router.get("/channel/all/:id", authenticatedRoute, async (req, res, next) => {
    getAllChatroomChannels(req, res);
});

router.get(
    "/channel/public/:id",
    authenticatedRoute,
    async (req, res, next) => {
        getAllPublicChatroomChannels(req, res);
    }
);

router.post(
  "/channel/create/:id/:name",
  authenticatedRoute,
  async (req, res, next) => {
    createChannel(req, res);
  }
);

router.delete("/channel/remove/:id/:name");

module.exports = router;
