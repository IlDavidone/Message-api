const mongoose = require('mongoose');

require('dotenv').config();

const dbConnectionString = process.env.DB_ACCESS_STRING;

const userConnection = mongoose.createConnection(dbConnectionString, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const userSchema = new mongoose.Schema({
    username: String, 
    hash: String,
    salt: String,
    admin: Boolean,
    verification: {type: Boolean, default: false},
    creationDate: Date,
});

const User = connection.model('User', userSchema);

module.exports = userConnection;