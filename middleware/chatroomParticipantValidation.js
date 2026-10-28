const Chatroom = require("../config/database/chatrooms");

const chatroomParticipantValidation = async (req, res, next) => {
  try {
    const chatroomId = req.params.id;

    if (!chatroomId) {
      return res.status(400).json({ message: "Invalid chatroom id provided" });
    }

    const existingChatroom = await Chatroom.findById(chatroomId);

    if (!existingChatroom) {
      return res
        .status(404)
        .json({ message: "No chatroom found with provided id" });
    }

    const partecipantsArray = existingChatroom.partecipants;

    const checkIfUserIsPartecipant = partecipantsArray.find(
      (partecipant) => partecipant.id == req.user._id
    );

    if (!checkIfUserIsPartecipant) {
      return res.status(403).json({
        message:
          "You are not authorized to perform this operation - Not a partecipant",
      });
    }

    next();
  } catch (err) {
    console.log(
      "An error occurred while checking chatroom partecipation: ",
      err.message
    );
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { chatroomParticipantValidation };
