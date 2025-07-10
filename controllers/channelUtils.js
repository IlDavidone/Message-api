import { createRequire } from "module";
const require = createRequire(import.meta.url);
const User = require("../config/database/users");
const Chatroom = require("../config/database/chatrooms");
const Channel = require("../config/database/channels");

export const getAllChatroomChannels = async (req, res) => {
  try {
    const chatroomId = req.params.id;

    if (!chatroomId) {
      return res.status(400).json({ message: "Invalid chatroom id provided" });
    }

    const existingChatroom = await Chatroom.findById(chatroomId);

    if (!existingChatroom) {
      return res
        .status(404)
        .json({ message: "No chatroom with provided id found" });
    }

    const existingChannels = await Channel.find({ chatroomId: chatroomId });

    if (!existingChannels) {
      return res
        .status(404)
        .json({ message: "No channels found within this chatroom" });
    }

    res.status(200).json({ existingChannels });
  } catch (err) {
    console.log("An error occurred while fetching a channel: ", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getAllPublicChatroomChannels = async (req, res) => {
  try {
    const chatroomId = req.params.id;

    if (!chatroomId) {
      return res.status(400).json({ message: "Invalid chatroom id provided" });
    }

    const existingChatroom = await Chatroom.findById(chatroomId);

    if (!existingChatroom) {
      return res
        .status(404)
        .json({ message: "No chatroom with provided id found" });
    }

    const user = await User.findById(req.user._id);

    const partecipantsArray = existingChatroom.partecipants;

    const checkIfUserIsPartecipant = partecipantsArray.find(
      (partecipants) => partecipants.id == user._id
    );

    if (!checkIfUserIsPartecipant) {
      return res.status(401).json({
        message:
          "You are not authorized to fetch channels - Not a partecipant",
      });
    }

    const existingPublicChannels = await Channel.find({chatroomId: chatroomId, forAdmin: false});
  
    if (!existingPublicChannels) {
      return res
        .status(404)
        .json({ message: "No channels found within this chatroom" });
    }

    res.status(200).json({ existingPublicChannels });
  } catch (err) {
    console.log("An error occurred while fetching a public channel: ", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const createChannel = async (req, res) => {
  try {
    const chatroomId = req.params.id;
    const channelName = req.params.name;

    if (!chatroomId) {
      return res.status(400).json({ message: "Invalid chatroom id provided" });
    }

    if (!channelName) {
      return res.status(400).json({ message: "Invalid channel name provided" });
    }

    const existingChatroom = await Chatroom.findById(chatroomId);

    if (!existingChatroom) {
      return res
        .status(404)
        .json({ message: "No chatroom with provided id found" });
    }

    const channelInsertion = new Channel({
      chatroomId: existingChatroom._id,
      name: channelName,
      forAdmin: false, //temporary hardcoded value
      creationDate: Date.now(),
    });

    if (!channelInsertion) {
      return res
        .status(400)
        .json({ message: "Invalid channel informations provided" });
    }

    await channelInsertion.save();

    res.status(200).json({ channelInsertion });
  } catch (err) {
    console.log("An error occurred while creating a channel: ", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
};
