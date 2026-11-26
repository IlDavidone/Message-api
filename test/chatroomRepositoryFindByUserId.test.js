const { test, after } = require("node:test");
const assert = require("node:assert");
const path = require("node:path");
const fs = require("node:fs");
const mongoose = require("mongoose");

const envPath = path.join(__dirname, "..", ".env");
if (fs.existsSync(envPath)) {
    process.loadEnvFile(envPath);
}

const requiredVariables = {
    mongo: ["DB_ACCESS_STRING"],
    mysql: ["DB_HOST", "DB_PORT", "DB_USER", "DB_PASSWORD", "DB_NAME"],
};

function missingConfiguration(store) {
    const missing = requiredVariables[store].filter((name) => !process.env[name]);
    return missing.length > 0 ? "Configurazione mancante: " + missing.join(", ") : false;
}

function loadFresh(modulePath, store) {
    process.env.USER_STORE = store;
    process.env.CHATROOM_STORE = store;
    const resolvedPath = require.resolve(modulePath);
    delete require.cache[resolvedPath];
    return require(resolvedPath);
}

const mongoSkip = missingConfiguration("mongo");
if (!mongoSkip) {
    mongoose.connect(process.env.DB_ACCESS_STRING);
}

const closers = [];
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
    for (const close of closers) {
        await close();
    }
    if (mysqlPool) {
        await mysqlPool.end();
    }
    await mongoose.disconnect();
});

const adapters = {
    mongo: {
        insertChatroom: async (owner, name) => {
            const Chatroom = require("../config/database/chatrooms");
            const User = require("../config/database/users");
            const ownerId = String(owner._id);

            const chatroom = await Chatroom.create({
                name: name,
                isPublic: false,
                partecipants: [{ id: ownerId, username: owner.username }],
                creator: ownerId,
                owner: ownerId,
                admins: [{ id: ownerId, username: owner.username }],
                image: "",
                creationDate: Date.now(),
                updateDate: Date.now(),
            });

            await User.findByIdAndUpdate(owner._id, {
                $push: { partecipates: { chatroomId: String(chatroom._id), chatroomName: name } },
            });

            return chatroom._id;
        },
        addMember: async (chatroomId, member, name) => {
            const Chatroom = require("../config/database/chatrooms");
            const User = require("../config/database/users");

            await Chatroom.findByIdAndUpdate(chatroomId, {
                $push: { partecipants: { id: String(member._id), username: member.username } },
            });

            await User.findByIdAndUpdate(member._id, {
                $push: { partecipates: { chatroomId: String(chatroomId), chatroomName: name } },
            });
        },
    },
    mysql: {
        insertChatroom: async (owner, name) => {
            const [result] = await getMysqlPool().execute(
                "INSERT INTO chatrooms (name, is_public, creator_id, owner_id, created_at, updated_at) VALUES (?, FALSE, ?, ?, NOW(), NOW())",
                [name, owner._id, owner._id]
            );

            await getMysqlPool().execute(
                "INSERT INTO participations (user_id, chatroom_id, is_admin) VALUES (?, ?, TRUE)",
                [owner._id, result.insertId]
            );

            return result.insertId;
        },
        addMember: async (chatroomId, member) => {
            await getMysqlPool().execute(
                "INSERT INTO participations (user_id, chatroom_id, is_admin) VALUES (?, ?, FALSE)",
                [member._id, chatroomId]
            );
        },
    },
};

function uniqueName(prefix) {
    return prefix + Date.now().toString() + "_" + Math.random().toString(36).slice(2);
}

async function insertSampleUser(userRepository) {
    const username = uniqueName("u");

    return await userRepository.insertUser({
        username: username,
        email: username + "@mail.com",
        passwordSalt: "salt",
        passwordHash: "hash",
    });
}

function setup(store) {
    const userRepository = loadFresh("../repositories/userRepository", store);
    closers.push(() => userRepository.close());

    return userRepository;
}

for (const store of ["mongo", "mysql"]) {
    const skip = missingConfiguration(store);
    const adapter = adapters[store];

    test(`[${store}] findByUserId restituisce un array vuoto per un utente senza chatroom`, { skip }, async () => {
        const userRepository = setup(store);
        const user = await insertSampleUser(userRepository);

        const chatroomRepository = loadFresh("../repositories/chatroomRepository", store);
        const chatrooms = await chatroomRepository.findByUserId(user._id);
        console.log(chatrooms);

        assert.deepStrictEqual(chatrooms, []);
    });

    test(`[${store}] findByUserId restituisce la chatroom di cui l'utente è proprietario, con partecipanti e admin`, { skip }, async () => {
        const userRepository = setup(store);
        const owner = await insertSampleUser(userRepository);
        const name = uniqueName("c");
        await adapter.insertChatroom(owner, name);

        const chatroomRepository = loadFresh("../repositories/chatroomRepository", store);
        const chatrooms = await chatroomRepository.findByUserId(owner._id);
        console.log(chatrooms);

        assert.strictEqual(chatrooms.length, 1);
        assert.strictEqual(chatrooms[0].name, name);
        assert.strictEqual(String(chatrooms[0].owner), String(owner._id));
        assert.strictEqual(String(chatrooms[0].creator), String(owner._id));
        assert.ok(chatrooms[0].partecipants.some((p) => String(p.id) === String(owner._id) && p.username === owner.username));
        assert.ok(chatrooms[0].admins.some((a) => String(a.id) === String(owner._id) && a.username === owner.username));
    });

    test(`[${store}] findByUserId per un partecipante che non è admin non lo mette tra gli admin`, { skip }, async () => {
        const userRepository = setup(store);
        const owner = await insertSampleUser(userRepository);
        const member = await insertSampleUser(userRepository);
        const name = uniqueName("c");
        const chatroomId = await adapter.insertChatroom(owner, name);
        await adapter.addMember(chatroomId, member, name);

        const chatroomRepository = loadFresh("../repositories/chatroomRepository", store);
        const chatrooms = await chatroomRepository.findByUserId(member._id);
        console.log(chatrooms);

        assert.strictEqual(chatrooms.length, 1);
        assert.strictEqual(chatrooms[0].name, name);
        assert.strictEqual(chatrooms[0].partecipants.length, 2);
        assert.ok(chatrooms[0].partecipants.some((p) => String(p.id) === String(member._id)));
        assert.strictEqual(chatrooms[0].admins.some((a) => String(a.id) === String(member._id)), false);
    });
}
