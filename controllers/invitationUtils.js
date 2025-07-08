import { createRequire } from "module";
const require = createRequire(import.meta.url);
const User = require("../config/database/users");
const Chatroom = require("../config/database/chatrooms");
const Invitation = require("../config/database/invitations");

export const fetchInvitations = async (req, res) => {
  try {
    const invitations = await Invitation.find({ recipient: req.user._id });

    if (!invitations) {
      return res
        .status(404)
        .json({ message: "No invitations found for provided user" });
    }

    if (invitations.length < 1) {
      return res
        .status(404)
        .json({ message: "No invitations found for provided user" });
    }

    res.status(200).json({ invitations });
  } catch (err) {
    console.log(
      "An error occurred while getting user invitations: ",
      err.message
    );
    res.status(500).json({ message: "Internal server error" });
  }
};

export const acceptInvitation = async (req, res) => {
  try {
    const invitationId = req.params.id;

    const existingInvitation = await Invitation.findById(invitationId);

    if (!existingInvitation) {
      return res
        .status(404)
        .json({ message: "No invitation with provided id found" });
    }

    if (existingInvitation.accepted === true) {
      return res.status(403).json({ message: "Invitation already accepted" });
    }

    const existingChatroom = await Chatroom.findById(
      existingInvitation.chatroomId
    );

    if (!existingChatroom) {
      return res.status(404).json({ message: "Chatroom not found" });
    }

    let partecipantsArray = existingChatroom.partecipants;

    const partecipantExists = partecipantsArray.find(
      (partecipant) => partecipant.id === req.user._id
    );

    if (partecipantExists != undefined) {
      return res
        .status(400)
        .json({ message: "You are already a partecipant of this chatroom" });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid token provided - Sign-in again" });
    }

    partecipantsArray.push({ id: req.user._id, username: user.username });

    const updatedInvitation = await Invitation.findByIdAndUpdate(
      req.params.id,
      {
        accepted: true,
      },
      { new: true }
    );

    if (!updatedInvitation) {
      return res
        .status(400)
        .json({ message: "Failed to update invitation acceptation" });
    }

    const updatedPartecipants = await Chatroom.findByIdAndUpdate(
      existingInvitation.chatroomId,
      {
        partecipants: partecipantsArray,
        updateDate: Date.now(),
      },
      { new: true }
    );

    if (!updatedPartecipants) {
      return res
        .status(400)
        .json({ message: "Failed to update chatroom partecipants" });
    }

    res.status(200).json({ updatedInvitation, updatedPartecipants });
  } catch (err) {
    console.log(
      "An error occurred while accepting an invitation: ",
      err.message
    );
    res.status(500).json({ message: "Internal server error" });
  }
};

export const rejectInvitation = async (req, res) => {
  try {
    const invitationId = req.params.id;

    if (!invitationId) {
      return res.status(400).json({ message: "Provide a valid invitation id" });
    }

    const existingInvitation = await Invitation.findById(invitationId);

    if (!existingInvitation) {
      return res
        .status(404)
        .json({ message: "No invitation with provided id found" });
    }

    if (existingInvitation.recipient != req.user._id) {
        return res.status(401).json({message: "you are not authorized to reject this invitations"});
    }

    if (existingInvitation.accepted === true) {
      return res.status(403).json({ message: "Invitation already accepted" });
    }

    const updatedInvitation = await Invitation.findOneAndDelete(req.params.id);

    res.status(200).json({ updatedInvitation });
  } catch (err) {
    console.log(
      "An error occurred while accepting an invitation: ",
      err.message
    );
    res.status(500).json({ message: "Internal server error" });
  }
};
