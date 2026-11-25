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

const invalidFormats = [
    { label: "con un suffisso di lettere", build: (id) => `${id}abc` },
    { label: "in notazione scientifica", build: (id) => `${id}e0` },
    { label: "con una parte decimale", build: (id) => `${id}.0` },
    { label: "con uno spazio iniziale", build: (id) => ` ${id}` },
    { label: "con il segno più", build: (id) => `+${id}` },
];

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

async function insertSampleUser(repository) {
    const username = Date.now().toString() + "_" + Math.random().toString(36).slice(2);

    return await repository.insertUser({
        username: username,
        email: username + "@mail.com",
        passwordSalt: "salt",
        passwordHash: "hash",
    });
}

for (const store of ["mongo", "mysql"]) {
    const skip = missingConfiguration(store);
    const repository = skip ? null : loadRepository(store);
    if (repository) {
        repositories.push(repository);
    }

    test(`[${store}] findById con l'id scritto come testo trova l'utente`, { skip }, async () => {
        const insertedUser = await insertSampleUser(repository);

        const foundUser = await repository.findById(String(insertedUser._id));
        console.log(foundUser);

        assert.ok(foundUser);
        assert.strictEqual(foundUser.username, insertedUser.username);
    });

    for (const invalidFormat of invalidFormats) {
        test(`[${store}] findById con l'id ${invalidFormat.label} restituisce null`, { skip }, async () => {
            const insertedUser = await insertSampleUser(repository);

            const foundUser = await repository.findById(invalidFormat.build(insertedUser._id));
            console.log(foundUser);

            assert.strictEqual(foundUser, null);
        });
    }
}
