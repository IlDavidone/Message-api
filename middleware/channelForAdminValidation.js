const Chatroom = require("../config/database/chatrooms");
const Channel = require("../config/database/channels");

const channelForAdminValidation = async (req, res, next) => {
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
        .json({ message: "No chatroom found with provided id" });
    }

    const existingChannel = await Channel.findOne({
      name: { $regex: `^${channelName}$`, $options: "i" },
      chatroomId: existingChatroom._id,
    });

    if (!existingChannel) {
      return res
        .status(404)
        .json({ message: "No existing channel found within this chatroom" });
    }

    if (!existingChannel.forAdmin) {
      return next();
    }

    const adminsArray = existingChatroom.admins;

    const checkIfUserIsAdmin = adminsArray.find(
      (admin) => admin.id == req.user._id
    );

    if (!checkIfUserIsAdmin) {
      return res.status(403).json({
        message:
          "You are not authorized to perform this operation - Not a chatroom admin",
      });
    }

    next();
  } catch (err) {
    console.log(
      "An error occurred while checking channel admin permission: ",
      err.message
    );
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { channelForAdminValidation };
