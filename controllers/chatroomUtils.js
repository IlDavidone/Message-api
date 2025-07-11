import { createRequire } from "module";
const require = createRequire(import.meta.url);
const User = require("../config/database/users");
const Chatroom = require("../config/database/chatrooms");
const Invitation = require("../config/database/invitations");

export const getChatroomInformations = async (req, res) => {
  try {
    const chatroomName = req.params.name;

    if (!chatroomName) {
      return res.status(400).json({ message: "Provide a valid chatroom name" });
    }

    const existingChatroom = await Chatroom.findOne({
      name: { $regex: chatroomName, $options: "i" },
    });

    if (!existingChatroom) {
      return res
        .status(404)
        .json({ message: `Chatroom with the name ${chatroomName} not found` });
    }

    res.status(200).json({
      _id: existingChatroom._id,
      name: existingChatroom.name,
      isPublic: existingChatroom.isPublic,
      partecipants: existingChatroom.partecipants,
      creator: existingChatroom.creator,
      owner: existingChatroom.owner,
      admins: existingChatroom.admins,
      creationDate: existingChatroom.creationDate,
      updateDate: existingChatroom.updateDate,
    });
  } catch (err) {
    console.log(
      "An error occurred while getting a chatroom informations: ",
      err.message
    );
    res.status(500).json({ message: "Internal server error" });
  }
};

export const createChatroom = async (req, res) => {
  try {
    const chatroomName = req.params.name;

    if (!chatroomName) {
      return res.status(400).json({ message: "Provide a valid chatroom name" });
    }

    const existingChatroom = await Chatroom.findOne({
      name: { $regex: chatroomName, $options: "i" },
    });

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

    const existingChatroom = await Chatroom.findOne({
      name: { $regex: chatroomName, $options: "i" },
    });

    if (!existingChatroom) {
      return res.status(404).json({ message: "Chatroom not found" });
    }

    const user = await User.findById(req.user._id);

    if (existingChatroom.owner != user._id) {
      return res.status(401).json({
        message: "You are not authorized to delete this chatroom",
      });
    }

    Chatroom.deleteOne({ name: { $regex: chatroomName, $options: "i" } })
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
    const chatroomId = req.params.id;
    const { name, isPublic, owner } = req.body;

    if (!chatroomId) {
      return res
        .status(400)
        .json({ message: "The provided chatroom id is invalid" });
    }

    let chatroomProperties = await Chatroom.findById(chatroomId);

    if (!chatroomProperties) {
      return res
        .status(404)
        .json({ message: `No chatroom with the provided id found` });
    }

    const checkIfNameExists = await Chatroom.findOne({
      name: { $regex: name, $options: "i" },
    });

    if (!checkIfNameExists) {
      chatroomProperties.name = name;
    }

    if (isPublic) {
      chatroomProperties.isPublic = isPublic;
    }

    if (owner) {
      const ownerId = await User.findOne({
        name: { $regex: owner, $options: "i" },
      });
      if (ownerId) {
        chatroomProperties.owner = ownerId._id;
      }
    }

    const updatedChatroom = await Chatroom.findByIdAndUpdate(
      chatroomProperties._id,
      {
        name: chatroomProperties.name,
        isPublic: chatroomProperties.isPublic,
        owner: chatroomProperties.owner,
        updateDate: Date.now(),
      },
      { new: true }
    );

    res.status(200).json(updatedChatroom);
  } catch (err) {
    console.log("An error occurred while updating a chatroom: ", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const addAdminToChatroom = async (req, res) => {
  try {
    const { name } = req.body;
    const chatroomName = req.params.name;

    if (!name) {
      return res
        .status(400)
        .json({ message: "The provided admin username is invalid" });
    }

    if (!chatroomName) {
      return res
        .status(400)
        .json({ message: "The provided chatroom name is invalid" });
    }

    const existingUser = await User.findOne({
      username: { $regex: name, $options: "i" },
    });

    if (!existingUser) {
      return res
        .status(404)
        .json({ message: `No entry found with ${name} name` });
    }

    const existingChatroom = await Chatroom.findOne({
      name: { $regex: chatroomName, $options: "i" },
    });

    if (!existingChatroom) {
      return res
        .status(404)
        .json({ message: `No entry found with ${chatroomName} chatroom name` });
    }

    if (existingChatroom.owner != req.user._id) {
      return res.status(401).json({
        message: "You are not authorized to add an admin to this chatroom",
      });
    }

    let adminArray = existingChatroom.admins;

    const checkIfAdminExists = adminArray.find(
      (admin) => admin.username.toLowerCase() === name.toLowerCase()
    );

    if (checkIfAdminExists != undefined) {
      return res
        .status(400)
        .json({ message: "The selected admin already exists" });
    }

    let partecipantsArray = existingChatroom.partecipants;

    const checkIfPartecipantExists = partecipantsArray.find(
      (user) => user.username.toLowerCase() === name.toLowerCase()
    );

    if (checkIfPartecipantExists === undefined) {
      return res.status(400).json({
        message: "The selected user isn't a partecipant of this chatroom",
      });
    }

    adminArray.push({ id: existingUser._id, username: existingUser.username });

    const updatedChatroom = await Chatroom.findByIdAndUpdate(
      existingChatroom._id,
      { admins: adminArray },
      { new: true }
    );

    res.status(200).json({ updatedChatroom });
  } catch (err) {
    console.log(
      "An error occurred while adding an admin to a chatroom: ",
      err.message
    );
    res.status(500).json({ message: "Internal server error" });
  }
};

export const removeAdminInChatroom = async (req, res) => {
  try {
    const { name } = req.body;
    const chatroomName = req.params.name;

    if (!name) {
      return res
        .status(400)
        .json({ message: "The provided admin username is invalid" });
    }

    if (!chatroomName) {
      return res
        .status(400)
        .json({ message: "The provided chatroom name is invalid" });
    }

    const existingUser = await User.findOne({
      username: { $regex: name, $options: "i" },
    });

    if (!existingUser) {
      return res
        .status(404)
        .json({ message: `No entry found with ${name} name` });
    }

    const existingChatroom = await Chatroom.findOne({
      name: { $regex: chatroomName, $options: "i" },
    });

    if (!existingChatroom) {
      return res
        .status(404)
        .json({ message: `No entry found with ${chatroomName} chatroom name` });
    }

    if (existingChatroom.owner != req.user._id) {
      return res.status(401).json({
        message: "You are not authorized to remove an admin from this chatroom",
      });
    }

    let adminArray = existingChatroom.admins;

    const checkIfAdminExists = adminArray.find(
      (admin) => admin.username.toLowerCase() === name.toLowerCase()
    );

    if (checkIfAdminExists != undefined) {
      return res
        .status(400)
        .json({ message: "The selected admin doesn't exist" });
    }

    const updatedAdminArray = adminArray.filter(
      (admin) => admin.username.toLowerCase() != name.toLowerCase()
    );

    console.log(updatedAdminArray);

    const updatedChatroom = await Chatroom.findByIdAndUpdate(
      existingChatroom._id,
      { admins: updatedAdminArray },
      { new: true }
    );

    res.status(200).json({ updatedChatroom });
  } catch (err) {
    console.log(
      "An error occurred while removing an admin from a chatroom: ",
      err.message
    );
    res.status(500).json({ message: "Internal server error" });
  }
};

export const sendPartecipantInvitation = async (req, res) => {
  try {
    const { name } = req.body;
    const chatroomName = req.params.name;

    if (!name) {
      return res
        .status(400)
        .json({ message: "The provided username is invalid" });
    }

    if (!chatroomName) {
      return res
        .status(400)
        .json({ message: "The provided chatroom name is invalid" });
    }

    const existingUser = await User.findOne({
      username: { $regex: name, $options: "i" },
    });

    if (!existingUser) {
      return res
        .status(404)
        .json({ message: `No entry found with ${name} name` });
    }

    const existingChatroom = await Chatroom.findOne({
      name: { $regex: chatroomName, $options: "i" },
    });

    if (!existingChatroom) {
      return res
        .status(404)
        .json({ message: `No entry found with ${chatroomName} chatroom name` });
    }

    const invitationInsertion = new Invitation({
      chatroomId: existingChatroom._id,
      creator: req.user._id,
      recipient: existingUser._id,
      accepted: false,
      creationDate: Date.now(),
    });

    if (!invitationInsertion) {
      return res.status(400).json({ message: "Failed to send invitation" });
    }

    await invitationInsertion.save();
    res.status(200).json(invitationInsertion);
  } catch (err) {
    console.log("An error occurred while sending an invitation: ", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
};
