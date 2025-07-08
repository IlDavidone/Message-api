const User = require("../config/database/users");
const express = require("express");
const router = express.Router();
const { authenticatedRoute } = require("../middleware/auth");
const {
  createChatroom,
  deleteChatroom,
  updateChatroom,
  getChatroomInformations,
} = require("../controllers/chatroomUtils");

router.get("/chatroom/info/:name", authenticatedRoute, (req, res, next) => {
  getChatroomInformations(req, res);
});

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
