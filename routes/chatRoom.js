const User = require("../config/database/users");
const express = require("express");
const router = express.Router();
const { authenticatedRoute } = require("../middleware/auth");
const {
  chatroomAdminValidation,
} = require("../middleware/chatroomAdminValidation");
const {
  createChatroom,
  deleteChatroom,
  updateChatroom,
  getChatroomInformations,
  addAdminToChatroom,
  removeAdminInChatroom,
  getUserChatrooms,
} = require("../controllers/chatroomUtils");

router.get("/chatroom/info/:name", authenticatedRoute, (req, res, next) => {
  getChatroomInformations(req, res);
});

router.get("/chatroom/user", authenticatedRoute, async (req, res, next) => {
  getUserChatrooms(req, res);
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
  "/chatroom/update/:id",
  authenticatedRoute,
  chatroomAdminValidation,
  async (req, res, next) => {
    updateChatroom(req, res);
  }
);

router.post(
  "/chatroom/admin/add/:name",
  authenticatedRoute,
  async (req, res, next) => {
    addAdminToChatroom(req, res);
  }
);

router.delete(
  "/chatroom/admin/remove/:name",
  authenticatedRoute,
  async (req, res, next) => {
    removeAdminInChatroom(req, res);
  }
);

module.exports = router;
