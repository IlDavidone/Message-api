const mongoose = require("mongoose");

const invitationSchema = new mongoose.Schema({
  chatroomId: {
    type: String,
    required: true,
  },
  creator: String,
  recipient: String,
  accepted: {
    type: Boolean,
    default: false,
  },
  creationDate: Date,
  expirationDate: Date,
  originalMaxAge: Number,
});

module.exports = mongoose.model("Invitation", invitationSchema);
