const {generateToken} = require("jsonwebtoken");
const connection = require('../database/schemas');
const User = connection.models.User;
const crypto = require("crypto");