const express = require("express");
const router = express.Router();
const {
  chatroomAdminValidation,
} = require("../middleware/chatroomAdminValidation");
const {
  chatroomParticipantValidation,
} = require("../middleware/chatroomParticipantValidation");
const { authenticatedRoute } = require("../middleware/auth");
const {
  sendMessages,
  fetchAllMessages,
  fetchPaginatedMessages,
  removeMessage,
} = require("../controllers/messageUtils");

router.post(
  "/message/send/:id/:name",
  authenticatedRoute,
  chatroomParticipantValidation,
  async (req, res, next) => {
    sendMessages(req, res);
  }
);

router.delete(
  "/message/remove/:id",
  authenticatedRoute,
  async (req, res, next) => {
    removeMessage(req, res);
  }
);

router.get(
  "/message/fetch/:id/:name",
  authenticatedRoute,
  chatroomParticipantValidation,
  async (req, res, next) => {
    fetchAllMessages(req, res);
  }
);

router.get(
  "/message/paginated/fetch/:id/:name",
  authenticatedRoute,
  chatroomParticipantValidation,
  async (req, res, next) => {
    fetchPaginatedMessages(req, res);
  }
);

module.exports = router;
