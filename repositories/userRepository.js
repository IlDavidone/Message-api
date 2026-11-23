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

const mongoRepository = {
  findByEmail,
  existsByUsername,
  insertUser,
  close: async () => {},
};

const notImplemented = (name) => async () => {
  throw new Error(`MySQL user repository: ${name} not implemented yet`);
};

let mysqlPool;

const getMysqlPool = () => {
  if (!mysqlPool) {
    mysqlPool = require("mysql2/promise").createPool({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });
  }

  return mysqlPool;
};

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

const mysqlExistsByUsername = async (username) => {
  const [rows] = await getMysqlPool().execute(
    "SELECT id FROM users WHERE username = ?",
    [username]
  );

  return rows.length === 0 ? null : rows[0].id;
};

const mysqlInsertUser = async ({username, email, passwordSalt, passwordHash}) => {
  const newDate = new Date();
  
  const [result] = await getMysqlPool().execute(
    "INSERT INTO users (username, email, password_salt, password_hash, created_at) VALUES (?, ?, ?, ?, ?)",
    [username, email, passwordSalt, passwordHash, newDate]
  );

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
  if (mysqlPool) {
    await mysqlPool.end();
    mysqlPool = undefined;
  }
};

const mysqlRepository = {
  findByEmail: mysqlFindByEmail,
  existsByUsername: mysqlExistsByUsername,
  insertUser: mysqlInsertUser,
  close: mysqlClose,
};

module.exports = process.env.USER_STORE === "mysql" ? mysqlRepository : mongoRepository;
