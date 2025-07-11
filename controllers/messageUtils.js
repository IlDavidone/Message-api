import { createRequire } from "module";
const require = createRequire(import.meta.url);
const Message = require("../config/database/messages");
const Chatroom = require("../config/database/chatrooms");
const Channel = require("../config/database/channels");

export const sendMessages = async (req, res) => {
  try {
    let { text, media } = req.body;
    const chatroomId = req.params.id;
    const channelName = req.params.name;

    if (!text && !media) {
      return res
        .status(400)
        .json({ message: "No message parameters provided" });
    }

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
        .json({ message: "No chatroom found with provided" });
    }

    const existingChannel = await Channel.find({
      name: { $regex: channelName, $options: "i" },
      chatroomId: existingChatroom._id,
    });

    if (!existingChannel) {
      return res
        .status(404)
        .json({ message: "No existing channel found within this chatroom" });
    }

    const messageInsertion = new Message({
      sender: req.user._id,
      toChatroom: true,
      recipient: existingChannel._id,
      text: text,
      media: media,
    });

    if (!messageInsertion) {
      return res.status(400).json({ message: "Invalid arguments provided" });
    }

    await messageInsertion.save();
    res.status(200).json({ messageInsertion });
  } catch (err) {
    console.log("An error occurred while sending a message: ", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const fetchAllMessages = async (req, res) => {
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
        .json({ message: "No chatroom found with provided" });
    }

    const existingChannel = await Channel.find({
      name: { $regex: channelName, $options: "i" },
      chatroomId: existingChatroom._id,
    });

    if (!existingChannel) {
      return res
        .status(404)
        .json({ message: "No existing channel found within this chatroom" });
    }

    const messages = await Message.find({
      recipient: existingChannel._id,
    });

    if (!messages) {
      return res
        .status(404)
        .json({ message: "No messages found within this channel" });
    }

    res.status(200).json({ messages });
  } catch (err) {
    console.log("An error occurred while fetching a message: ", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const fetchPaginatedMessages = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
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
        .json({ message: "No chatroom found with provided" });
    }

    const existingChannel = await Channel.find({
      name: { $regex: channelName, $options: "i" },
      chatroomId: existingChatroom._id,
    });

    if (!existingChannel) {
      return res.status(404).json({
        message: "No existing channel found within this chatroom",
      });
    }

    const messages = await Message.find({
      recipient: existingChannel._id,
    })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const messagesCount = await Message.countDocuments({
      recipient: existingChannel._id,
    });

    if (!messages) {
      return res
        .status(404)
        .json({ message: "No messages found within this channel" });
    }

    res.status(200).json({
      messages,
      totalPages: Math.ceil(messagesCount / limit),
      currentPage: page,
    });
  } catch (err) {
    console.log("An error occurred while fetching a message: ", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const removeMessage = async (req, res) => {
  try {
    const messageId = req.params.id;

    if (!messageId) {
      return res.status(400).json({ message: "Invalid message id format" });
    }

    const existingMessage = await Message.findById(messageId);

    if (!existingMessage) {
      return res
        .status(404)
        .json({ message: "No message found with provided id" });
    }

    if (existingMessage.sender != req.user._id) {
      return res
        .status(401)
        .json({ message: "Can't remove the message - Not authorized" });
    }

    Message.deleteOne({ _id: messageId })
      .then(console.log("Message deleted!"))
      .catch((err) => {
        console.log("An error occurred while deleting a message");
      });

    res
      .status(200)
      .json({
        message: "The message has been deleted successfully",
        message: existingMessage,
      });
  } catch (err) {
    console.log("An error occurred while deleting a message: ", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
};
