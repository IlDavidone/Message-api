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

test("Creare due chatroom con lo stesso nome, da utenti diversi, deve fallire con 409", async () => {
    const { cookie: firstUserCookie } = await registerUser();
    const { cookie: secondUserCookie } = await registerUser();

    const chatroomName = "stanza_" + Date.now().toString() + "_" + Math.random().toString(36).slice(2);

    const firstCreateResponse = await fetch(`${BASE_URL}/chatroom/create/${chatroomName}`, {
        method: "POST",
        headers: { Cookie: firstUserCookie },
    });
    const firstCreateBody = await firstCreateResponse.json();
    console.log(firstCreateResponse.status, firstCreateBody);
    assert.strictEqual(firstCreateResponse.status, 201);

    const secondCreateResponse = await fetch(`${BASE_URL}/chatroom/create/${chatroomName}`, {
        method: "POST",
        headers: { Cookie: secondUserCookie },
    });
    const secondCreateBody = await secondCreateResponse.json();
    console.log(secondCreateResponse.status, secondCreateBody);

    assert.strictEqual(
        secondCreateResponse.status,
        409,
        "Creare una chatroom con un nome già in uso da un altro utente dovrebbe fallire"
    );
});
