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

const absentIds = {
    mongo: () => new mongoose.Types.ObjectId().toString(),
    mysql: () => 2147483647,
};

function loadRepository(store) {
    process.env.USER_STORE = store;
    const modulePath = require.resolve("../repositories/userRepository");
    delete require.cache[modulePath];
    return require(modulePath);
}

function missingConfiguration(store) {
    const missing = requiredVariables[store].filter((name) => !process.env[name]);
    return missing.length > 0 ? "Configurazione mancante: " + missing.join(", ") : false;
}

const mongoSkip = missingConfiguration("mongo");
if (!mongoSkip) {
    mongoose.connect(process.env.DB_ACCESS_STRING);
}

const repositories = [];

after(async () => {
    for (const repository of repositories) {
        await repository.close();
    }
    await mongoose.disconnect();
});

for (const store of ["mongo", "mysql"]) {
    const skip = missingConfiguration(store);
    const repository = skip ? null : loadRepository(store);
    if (repository) {
        repositories.push(repository);
    }

    test(`[${store}] findById restituisce l'utente inserito`, { skip }, async () => {
        const username = Date.now().toString() + "_" + Math.random().toString(36).slice(2);

        const insertedUser = await repository.insertUser({
            username: username,
            email: username + "@mail.com",
            passwordSalt: "salt",
            passwordHash: "hash",
        });

        const foundUser = await repository.findById(insertedUser._id);
        console.log(foundUser);

        assert.ok(foundUser);
        assert.strictEqual(foundUser.username, username);
        assert.strictEqual(foundUser.email, username + "@mail.com");
    });

    test(`[${store}] findById restituisce null per un id ben formato ma assente`, { skip }, async () => {
        const foundUser = await repository.findById(absentIds[store]());
        console.log(foundUser);

        assert.strictEqual(foundUser, null);
    });

    test(`[${store}] findById restituisce null per un id non valido`, { skip }, async () => {
        const foundUser = await repository.findById("abc");
        console.log(foundUser);

        assert.strictEqual(foundUser, null);
    });
}
