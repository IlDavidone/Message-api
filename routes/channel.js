const express = require("express");
const router = express.Router();
const Channel = require("../config/database/channels");
const User = require("../config/database/users");
const Chatroom = require("../config/database/chatrooms");
const { authenticatedRoute } = require("../middleware/auth");
const {
  chatroomAdminValidation,
} = require("../middleware/chatroomAdminValidation");
const {
  createChannel,
  getAllChatroomChannels,
  getAllPublicChatroomChannels,
  deleteChannel,
  editChannel,
} = require("../controllers/channelUtils");

router.get(
  "/channel/all/:id",
  authenticatedRoute,
  chatroomAdminValidation,
  async (req, res, next) => {
    getAllChatroomChannels(req, res);
  }
);

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
  chatroomAdminValidation,
  async (req, res, next) => {
    createChannel(req, res);
  }
);

router.delete(
  "/channel/remove/:id/:name",
  authenticatedRoute,
  chatroomAdminValidation,
  async (req, res, next) => {
    deleteChannel(req, res);
  }
);

router.patch(
  "/channel/edit/:id/:name",
  authenticatedRoute,
  chatroomAdminValidation,
  async (req, res, next) => {
    editChannel(req, res);
  }
);

module.exports = router;
