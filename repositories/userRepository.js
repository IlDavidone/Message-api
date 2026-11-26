const mongoose = require("mongoose");
const User = require("../config/database/users");

const findByEmail = async (email) => {
  return await User.findOne({ email: email });
};

const findById = async (id) => {
  if (!mongoose.isValidObjectId(id)) {
    return null;
  }

  return await User.findById(id);
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

const mongoRepository = {
  findByEmail,
  findById,
  existsByUsername,
  insertUser,
  close: async () => {},
};

const notImplemented = (name) => async () => {
  throw new Error(`MySQL user repository: ${name} not implemented yet`);
};

const { getMysqlPool, closeMysqlPool } = require("./mysqlPool");

// Converte una riga MySQL nei nomi dei campi che il controller usa con Mongo.
const toUser = (row) => ({
  _id: row.id,
  username: row.username,
  email: row.email,
  passwordSalt: row.password_salt,
  passwordHash: row.password_hash,
  admin: Boolean(row.is_admin),
  verification: Boolean(row.is_verified),
  creationDate: row.created_at,
});

const mysqlFindByEmail = async (email) => {
  const [rows] = await getMysqlPool().execute(
    "SELECT id, username, email, password_salt, password_hash, is_admin, is_verified, created_at FROM users WHERE email = ?",
    [email]
  );

  return rows.length === 0 ? null : toUser(rows[0]);
};

const toMysqlId = (id) => {
  if (typeof id === "number" && Number.isInteger(id) && id > 0) {
    return id;
  }

  if (typeof id === "string" && /^\d+$/.test(id)) {
    return Number(id);
  }

  return null;
};

const mysqlFindById = async (id) => {
  const mysqlId = toMysqlId(id);

  if (mysqlId === null) {
    return null;
  }

  const [rows] = await getMysqlPool().execute(
    "SELECT id, username, email, password_salt, password_hash, is_admin, is_verified, created_at FROM users WHERE id = ?",
    [mysqlId]
  );

  return rows.length === 0 ? null : toUser(rows[0]);
};

const mysqlExistsByUsername = async (username) => {
  const [rows] = await getMysqlPool().execute(
    "SELECT id FROM users WHERE username = ?",
    [username]
  );

  return rows.length === 0 ? null : rows[0].id;
};

const mysqlInsertUser = async ({username, email, passwordSalt, passwordHash}) => {
  const newDate = new Date();
  
  let result;

  try {
    [result] = await getMysqlPool().execute(
      "INSERT INTO users (username, email, password_salt, password_hash, created_at) VALUES (?, ?, ?, ?, ?)",
      [username, email, passwordSalt, passwordHash, newDate]
    );
  } catch (err) {
    if (err.errno === 1062) {
      const duplicateUserError = new Error(err.message);
      duplicateUserError.code = "DUPLICATE_USER";
      throw duplicateUserError;
    }

    throw err;
  }

  return {
    _id: result.insertId,
    username,
    email,
    passwordSalt,
    passwordHash,
    admin: false,
    verification: false,
    creationDate: newDate,
  };
};

const mysqlClose = async () => {
  await closeMysqlPool();
};

const mysqlRepository = {
  findByEmail: mysqlFindByEmail,
  findById: mysqlFindById,
  existsByUsername: mysqlExistsByUsername,
  insertUser: mysqlInsertUser,
  close: mysqlClose,
};

module.exports = process.env.USER_STORE === "mysql" ? mysqlRepository : mongoRepository;
