const mongoose = require("mongoose");

const channelSchema = new mongoose.Schema({
  chatroomId: {
    type: String,
    require: true,
  },
  name: {
    type: String,
    require: true,
  },
  forAdmin: {
    type: Boolean,
    default: false,
  },
  creationDate: Date,
});

module.exports = mongoose.model("Channel", channelSchema);
