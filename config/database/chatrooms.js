const mongoose = require("mongoose");

const chatroomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  isPublic: {
    type: Boolean,
    default: false,
  },
  partecipants: [
    {
      id: {
        type: String,
        required: true,
      },
      username: String,
    },
  ],
  creator: String,
  owner: String,
  admins: [
    {
      id: {
        type: String,
        required: true,
      },
      username: String,
    },
  ],
  image: String,
  creationDate: {
    type: Date,
    required: true,
    default: Date.now(),
  },
  updateDate: {
    type: Date,
    required: true,
    default: Date.now(),
  },
});

module.exports = mongoose.model("Chatroom", chatroomSchema);
