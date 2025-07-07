import { createRequire } from "module";
const require = createRequire(import.meta.url);
const User = require("../config/database/users");
const Chatroom = require("../config/database/chatrooms");

export const createChatroom = async (req, res) => {
  try {
    const chatroomName = req.params.name;

    if (!chatroomName) {
      return res.status(400).json({ message: "Provide a valid chatroom name" });
    }

    const existingChatroom = await Chatroom.findOne({ name: chatroomName });

    if (existingChatroom) {
      return res.status(400).json({ message: "Chatroom name already taken" });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res
        .status(404)
        .json({ message: "Invalid token credentials, please log in again" });
    }

    const chatroomInsertion = new Chatroom({
      name: chatroomName,
      isPublic: false,
      partecipants: [
        {
          id: user._id,
          username: user.username,
        },
      ],
      creator: user._id,
      owner: user._id,
      admins: [
        {
          id: user._id,
          username: user.username,
        },
      ],
      creationDate: Date.now(),
      updateDate: Date.now(),
    });

    if (chatroomInsertion) {
      await chatroomInsertion.save();
      res.status(200).json({
        name: chatroomInsertion.name,
        isPublic: chatroomInsertion.isPublic,
        partecipants: chatroomInsertion.partecipants,
        creator: chatroomInsertion.creator,
        owner: chatroomInsertion.owner,
        admins: chatroomInsertion.admins,
        creationDate: chatroomInsertion.creationDate,
        updateDate: chatroomInsertion.updateDate,
      });
    } else {
      res.status(400).json({ message: "Invalid data provided" });
    }
  } catch (err) {
    console.log("An error occurred while creating a chatroom: ", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteChatroom = async (req, res) => {
  try {
    const chatroomName = req.params.name;

    if (!chatroomName) {
      return res
        .status(400)
        .json({ message: "The provided chatroom name is invalid" });
    }

    const existingChatroom = await Chatroom.findOne({ name: chatroomName });

    if (!existingChatroom) {
      return res.status(404).json({ message: "Chatroom not found" });
    }

    Chatroom.deleteOne({ name: chatroomName })
      .then(console.log(`${chatroomName} deleted`))
      .catch((err) => {
        console.log(
          `An error occurred during ${chatroomName} chatroom deletion: `,
          err.message
        );
      });

    res.status(200).json({ message: `${chatroomName} has been deleted` });
  } catch (err) {
    console.log(
      "An error occurred during chatroom deletion process: ",
      err.message
    );
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateChatroom = async (req, res) => {
  try {
    const chatroomName = req.params.name;
    const { name, isPublic, owner } = req.body;

    if (!chatroomName) {
      return res
        .status(400)
        .json({ message: "The provided chatroom name is invalid" });
    }

    let chatroomProperties = await Chatroom.findOne({ name: chatroomName });

    if (!chatroomProperties) {
      return res
        .status(404)
        .json({ message: `No chatroom with the name ${chatroomName} found` });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res
        .status(404)
        .json({ message: "Invalid token credentials, please log in again" });
    }

    const checkIfUserIsAdmin = chatroomProperties.admins.find(
      (admin) => admin.id == user._id
    );

    if (checkIfUserIsAdmin === undefined) {
      return res
        .status(401)
        .json({
          message:
            "You are not authorized to update this chatroom informations",
        });
    }

    const checkIfNameExists = await Chatroom.findOne({ name: name });

    if (!checkIfNameExists) {
      chatroomProperties.name = name;
    }

    if (isPublic) {
      chatroomProperties.isPublic = isPublic;
    }

    const ownerId = await User.findOne({ name: owner });

    if (ownerId) {
      chatroomProperties.owner = ownerId._id;
    }

    const updatedChatroom = await Chatroom.findByIdAndUpdate(
      chatroomProperties._id,
      {
        name: chatroomProperties.name,
        isPublic: chatroomProperties.isPublic,
        owner: chatroomProperties.owner,
      },
      { new: true }
    );

    res.status(200).json(updatedChatroom);
  } catch (err) {
    console.log("An error occurred while updating a chatroom: ", err.message);
    res.status(500).json({message: "Internal server error"});
  }
};
