const Chatroom = require("../config/database/chatrooms");

export const chatroomAdminValidation = async (req, res, next) => {
    const chatroomId = req.params.id;

    if (!chatroomId) {
        return res.status(400).json({message: "Invalid chatroom id provided"});
    }
}