import { createRequire } from "module";
const require = createRequire(import.meta.url);
const User = require("../config/database/users");
const Chatroom = require("../config/database/chatrooms");
const Invitation = require("../config/database/invitations");

export const fetchInvitations = async (req, res) => {
    try {
        const invitations = await Invitation.find({recipient: req.user._id});

        if (!invitations) {
            return res.status(404).json({message: "No invitations found for provided user"});
        }

        if (invitations.length < 1) {
            return res.status(404).json({message: "No invitations found for provided user"});
        }

        res.status(200).json({invitations});
    } catch (err) {
        console.log("An error occurred while getting user invitations: ", err.message);
        res.status(500).json({ message: "Internal server error" });
    }
}