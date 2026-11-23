const { test, after } = require("node:test");
const assert = require("node:assert");
const path = require("node:path");

process.loadEnvFile(path.join(__dirname, "..", ".env"));
process.env.USER_STORE = "mysql";

const { insertUser, close } = require("../repositories/userRepository");

after(async () => {
    await close();
});

test("Inserire due utenti con lo stesso username produce un errore di utente duplicato", async () => {
    const username = Date.now().toString() + "_" + Math.random().toString(36).slice(2);

    const firstUser = await insertUser({
        username: username,
        email: username + "_1@mail.com",
        passwordSalt: "salt",
        passwordHash: "hash",
    });
    console.log(firstUser);
    assert.ok(firstUser._id);

    await assert.rejects(
        insertUser({
            username: username,
            email: username + "_2@mail.com",
            passwordSalt: "salt",
            passwordHash: "hash",
        }),
        (err) => {
            console.log(err.code, err.errno, err.message);
            return err.code === "DUPLICATE_USER";
        }
    );
});


test("Un errore diverso dal duplicato non viene trasformato in un errore di utente duplicato", async () => {
    const username = Date.now().toString() + "_" + Math.random().toString(36).slice(2);

    await assert.rejects(
        insertUser({
            username: username,
            email: null,
            passwordSalt: "salt",
            passwordHash: "hash",
        }),
        (err) => {
            console.log(err.code, err.errno, err.message);
            return err.code === "ER_BAD_NULL_ERROR";
        }
    );
});
