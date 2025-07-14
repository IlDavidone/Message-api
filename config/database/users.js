const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  email: String,
  passwordSalt: String,
  passwordHash: String,
  profilePicture: String,
  admin: Boolean,
  partecipates: [
    {
      chatroomId: String,
      chatroomName: String,
    },
  ],
  verification: { type: Boolean, default: false },
  creationDate: Date,
});

module.exports = mongoose.model("User", userSchema);
