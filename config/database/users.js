const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: String, 
    email: String,
    passwordSalt: String,
    passwordHash: String,
    admin: Boolean,
    verification: {type: Boolean, default: false},
    creationDate: Date,
});

module.exports = mongoose.model("User", userSchema);