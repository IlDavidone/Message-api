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

const closeMysqlPool = async () => {
  if (mysqlPool) {
    await mysqlPool.end();
    mysqlPool = undefined;
  }
};

module.exports = { getMysqlPool, closeMysqlPool };
