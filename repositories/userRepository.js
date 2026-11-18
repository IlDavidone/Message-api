const User = require("../config/database/users");

const findByEmail = async (email) => {
  return await User.findOne({ email: email });
};

const existsByUsername = async (username) => {
  return await User.exists({
    username: { $regex: `^${username}$`, $options: "i" },
  })
};

const insertUser = async ({ username, email, passwordSalt, passwordHash }) => {
  const user = new User({
    username,
    email,
    passwordSalt,
    passwordHash,
    admin: false,
    partecipates: [],
    verification: false,
    creationDate: new Date(),
  });

  return await user.save();
};

module.exports = { findByEmail, existsByUsername, insertUser };