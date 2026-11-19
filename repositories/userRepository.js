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

const mongoRepository = { findByEmail, existsByUsername, insertUser };

const notImplemented = (name) => async () => {
  throw new Error(`MySQL user repository: ${name} not implemented yet`);
};

const mysqlRepository = {
  findByEmail: notImplemented("findByEmail"),
  existsByUsername: notImplemented("existsByUsername"),
  insertUser: notImplemented("insertUser"),
};

module.exports = process.env.USER_STORE === "mysql" ? mysqlRepository : mongoRepository;
