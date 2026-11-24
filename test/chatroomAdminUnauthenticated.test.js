const { test } = require("node:test");
const assert = require("node:assert");

const BASE_URL = "http://localhost:3000/api/v1";

async function registerUser() {
    const username = Date.now().toString() + "_" + Math.random().toString(36).slice(2);

    const registrationTestBody = {
        username: username,
        email: username + "@mail.com",
        password: (Date.now() * (Math.random() * 100)).toString(),
    };

    const registrationResponse = await fetch(`${BASE_URL}/authentication/register`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(registrationTestBody),
    });

    const user = await registrationResponse.json();

    const rawCookie = registrationResponse.headers.getSetCookie()[0];
    const cookie = rawCookie.split(";")[0];

    return { user, cookie };
}

async function registerUsers(count) {
    const users = [];
    const usersCookies = [];

    for (let i = 0; i < count; i++) {
        const { user, cookie } = await registerUser();
        users.push(user);
        usersCookies.push(cookie);
    }

    return { users, usersCookies };
}

test("Aggiungere un admin senza essere autenticati restituisce 401", async () => {
    const addAdminResponse = await fetch(`${BASE_URL}/chatroom/admin/add/nome-di-prova`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "utente-di-prova" }),
    });

    const addAdminBody = await addAdminResponse.json();
    console.log(addAdminResponse.status, addAdminBody);
    assert.strictEqual(addAdminResponse.status, 401);
});

test("Togliere un admin senza essere autenticati restituisce 401", async () => {
    const removeAdminResponse = await fetch(`${BASE_URL}/chatroom/admin/remove/nome-di-prova`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "utente-di-prova" }),
    });

    const removeAdminBody = await removeAdminResponse.json();
    console.log(removeAdminResponse.status, removeAdminBody);
    assert.strictEqual(removeAdminResponse.status, 401);
});
