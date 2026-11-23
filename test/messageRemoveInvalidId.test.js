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

test("Cancellare un messaggio con un id in un formato non valido restituisce 400", async () => {
    const { user, cookie } = await registerUser();

    const removeMessageResponse = await fetch(`${BASE_URL}/message/remove/id-non-valido`, {
        method: "DELETE",
        headers: { Cookie: cookie },
    });

    const removeMessageBody = await removeMessageResponse.json();
    console.log(removeMessageResponse.status, removeMessageBody);
    assert.strictEqual(removeMessageResponse.status, 400);
});
