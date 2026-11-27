const { test, after } = require("node:test");
const assert = require("node:assert");
const path = require("node:path");
const fs = require("node:fs");
const mongoose = require("mongoose");

const envPath = path.join(__dirname, "..", ".env");
if (fs.existsSync(envPath)) {
    process.loadEnvFile(envPath);
}

process.env.USER_STORE = "mysql";
process.env.CHATROOM_STORE = "mysql";

const requiredVariables = ["DB_ACCESS_STRING", "DB_HOST", "DB_PORT", "DB_USER", "DB_PASSWORD", "DB_NAME"];
const missing = requiredVariables.filter((name) => !process.env[name]);
const skip = missing.length > 0 ? "Configurazione mancante: " + missing.join(", ") : false;

if (!skip) {
    mongoose.connect(process.env.DB_ACCESS_STRING);
}

let mysqlPool;

function getMysqlPool() {
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
}

after(async () => {
    if (!skip) {
        await require("../repositories/userRepository").close();
        await require("../repositories/chatroomRepository").close();
    }
    if (mysqlPool) {
        await mysqlPool.end();
    }
    await mongoose.disconnect();
});

function uniqueName(prefix) {
    return prefix + Date.now().toString() + "_" + Math.random().toString(36).slice(2);
}

function fakeResponse() {
    return {
        statusCode: undefined,
        body: undefined,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(body) {
            this.body = body;
            return this;
        },
    };
}

test("[mysql] getUserChatrooms risponde 200 con le chatroom dell'utente lette da MySQL", { skip }, async () => {
    const userRepository = require("../repositories/userRepository");
    const username = uniqueName("u");
    const owner = await userRepository.insertUser({
        username: username,
        email: username + "@mail.com",
        passwordSalt: "salt",
        passwordHash: "hash",
    });

    const name = uniqueName("c");
    const [result] = await getMysqlPool().execute(
        "INSERT INTO chatrooms (name, is_public, creator_id, owner_id, created_at, updated_at) VALUES (?, FALSE, ?, ?, NOW(), NOW())",
        [name, owner._id, owner._id]
    );
    await getMysqlPool().execute(
        "INSERT INTO participations (user_id, chatroom_id, is_admin) VALUES (?, ?, TRUE)",
        [owner._id, result.insertId]
    );

    const { getUserChatrooms } = require("../controllers/chatroomUtils");
    const res = fakeResponse();
    await getUserChatrooms({ user: { _id: owner._id } }, res);
    console.log(res.statusCode, res.body);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.length, 1);
    assert.strictEqual(res.body[0].name, name);
});
