const { test } = require("node:test");
const assert = require("node:assert");

const BASE_URL = "http://localhost:3000/api/v1";

async function registerUserWithUsername(username) {
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

test("Togliere un admin il cui username non esiste, ma è contenuto nell'username di un altro utente, restituisce 404", async () => {
    const suffix = Date.now().toString(36);
    const missingUsername = "rosso" + suffix;
    const { user: owner, cookie: ownerCookie } = await registerUserWithUsername(missingUsername + "x");

    const createChatroomResponse = await fetch(`${BASE_URL}/chatroom/create/${owner.username}`, {
        method: "POST",
        headers: { Cookie: ownerCookie },
    });

    const createChatroomBody = await createChatroomResponse.json();
    console.log(createChatroomResponse.status, createChatroomBody);
    assert.strictEqual(createChatroomResponse.status, 201);

    const removeAdminResponse = await fetch(`${BASE_URL}/chatroom/admin/remove/${owner.username}`, {
        method: "DELETE",
        headers: {
            Cookie: ownerCookie,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: missingUsername }),
    });

    const removeAdminBody = await removeAdminResponse.json();
    console.log(removeAdminResponse.status, removeAdminBody);
    assert.strictEqual(removeAdminResponse.status, 404);
});
