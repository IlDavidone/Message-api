const mongoose = require('mongoose');

require('dotenv').config();

const dbConnectionString = process.env.DB_ACCESS_STRING;

const connection = mongoose.createConnection(dbConnectionString, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const userSchema = new mongoose.Schema({
    username: String, 
    email: String,
    passwordSalt: String,
    passwordHash: String,
    admin: Boolean,
    verification: {type: Boolean, default: false},
    creationDate: Date,
});

const User = connection.model('User', userSchema);

module.exports = connection;