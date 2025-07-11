import { createRequire } from "module";
const require = createRequire(import.meta.url);
const Chatroom = require("../config/database/chatrooms");

export const chatroomAdminValidation = async (req, res, next) => {
  try {
    req.isAdmin = false;

    const chatroomId = req.params.id;

    if (!chatroomId) {
      return res.status(400).json({ message: "Invalid chatroom id provided" });
    }

    let existingChatroom = await Chatroom.findById(chatroomId);

    if (!existingChatroom) {
      return res
        .status(404)
        .json({ message: "No chatroom found with provided id" });
    }

    const adminsArray = existingChatroom.admins;

    const checkIfUserIsAdmin = adminsArray.find(
      (admin) => admin.id == req.user._id
    );

    if (!checkIfUserIsAdmin) {
      return res.status(401).json({
        message:
          "You are not authorized to begin this operation - Not a chatroom admin",
      });
    }

    req.isAdmin = true;

    next();
  } catch (err) {
    console.log(
      "An error occurred while checking whether a user is admin or not: ",
      err.message
    );
    res.status(500).json({ message: "Internal server error" });
  }
};
