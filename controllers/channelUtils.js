import { createRequire } from "module";
const require = createRequire(import.meta.url);
const User = require("../config/database/users");
const Chatroom = require("../config/database/chatrooms");
const Channel = require("../config/database/channels");

export const createChannel = async (req, res) => {
    try {
    const chatroomId = req.params.id;
    const channelName = req.params.name;

    if (!chatroomId) {
        return res.status(400).json({message: "Invalid chatroom id provided"});
    }

    if (!channelName) {
        return res.status(400).json({message: "Invalid channel name provided"});
    }

    const existingChatroom = await Chatroom.findById(chatroomId);

    if (!existingChatroom) {
        return res.status(404).json({message: "No chatroom with provided id found"});
    }

    const adminsArray = existingChatroom.admins;

    const checkIfUserIsAdmin = adminsArray.find((admin) => admin.id == req.user._id);

    if (!checkIfUserIsAdmin) {
        return res.status(401).json({message: "You are not authorized to create a channel - Permissions missing"});
    }

    const channelInsertion = new Channel({
        chatroomId: existingChatroom._id,
        name: channelName,
        forAdmin: false, //temporary hardcoded value
        creationDate: Date.now()
    });

    if (!channelInsertion) {
        return res.status(400).json({message: "Invalid channel informations provided"});
    }

    await channelInsertion.save();

    res.status(200).json({channelInsertion});
}
catch (err) {
    console.log("An error occurred while creating a channel: ", err.message);
    res.status(500).json({message: "Internal server error"});
}
}