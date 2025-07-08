const express = require("express");
const router = express.Router();
const { authenticatedRoute } = require("../middleware/auth");
const { sendPartecipantInvitation } = require("../controllers/chatroomUtils");
const { fetchInvitations } = require("../controllers/invitationUtils"); 

require('dotenv').config();

router.post("/invitations/send/:name", authenticatedRoute, async (req, res, next) => {
    sendPartecipantInvitation(req, res);
})

router.get("/invitations", authenticatedRoute, async (req, res, next) => {
    fetchInvitations(req, res);
});

module.exports = router;