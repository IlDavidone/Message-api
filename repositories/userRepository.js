const User = require("../config/database/users");

const findByEmail = async (email) => {
  return await User.findOne({ email: email });
};

const existsByUsername = async (username) => {
  return await User.exists({
    username: { $regex: `^${username}$`, $options: "i" },
  })
};

module.exports = { findByEmail, existsByUsername };
