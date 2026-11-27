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

test("Passare la proprietà a un utente che non esiste restituisce 404", async () => {
    const { user: owner, cookie: ownerCookie } = await registerUser();

    const createChatroomResponse = await fetch(`${BASE_URL}/chatroom/create/${owner.username}`, {
        method: "POST",
        headers: { Cookie: ownerCookie },
    });

    const createChatroomBody = await createChatroomResponse.json();
    console.log(createChatroomResponse.status, createChatroomBody);
    assert.strictEqual(createChatroomResponse.status, 201);

    const chatroomInfoResponse = await fetch(`${BASE_URL}/chatroom/info/${owner.username}`, {
        method: "GET",
        headers: { Cookie: ownerCookie },
    });
    const chatroomInfo = await chatroomInfoResponse.json();
    console.log(chatroomInfoResponse.status, chatroomInfo);

    const updateResponse = await fetch(`${BASE_URL}/chatroom/update/${chatroomInfo._id}`, {
        method: "PATCH",
        headers: {
            Cookie: ownerCookie,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: "nuovo" + Date.now().toString(36), owner: "inesistente" + Date.now().toString(36) }),
    });

    const updateBody = await updateResponse.json();
    console.log(updateResponse.status, updateBody);
    assert.strictEqual(updateResponse.status, 404);
});
