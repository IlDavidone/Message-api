const User = require("../config/database/users");
const express = require("express");
const router = express.Router();
const { authenticatedRoute } = require("../middleware/auth");
const {
  createChatroom,
  deleteChatroom,
  updateChatroom,
} = require("../controllers/chatroomUtils");

router.post(
  "/chatroom/create/:name",
  authenticatedRoute,
  async (req, res, next) => {
    createChatroom(req, res);
  }
);

router.delete(
  "/chatroom/delete/:name",
  authenticatedRoute,
  async (req, res, next) => {
    deleteChatroom(req, res);
  }
);

router.patch(
  "/chatroom/update/:name",
  authenticatedRoute,
  async (req, res, next) => {
    updateChatroom(req, res);
  }
);

module.exports = router;
