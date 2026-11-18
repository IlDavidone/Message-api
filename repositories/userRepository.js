const User = require("../config/database/users");

const findByEmail = async (email) => {
  return await User.findOne({ email: email });
};

module.exports = { findByEmail };
