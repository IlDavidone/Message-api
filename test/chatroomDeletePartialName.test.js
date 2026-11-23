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

test("Cancellare una chatroom con un nome parziale restituisce 404 e non cancella nulla", async () => {
    const { users, usersCookies } = await registerUsers(1);
    const [owner] = users;
    const [ownerCookie] = usersCookies;

    const baseName = Date.now().toString() + "_" + Math.random().toString(36).slice(2);
    const chatroomName = baseName + "-progetto";

    const createChatroomResponse = await fetch(`${BASE_URL}/chatroom/create/${chatroomName}`, {
        method: "POST",
        headers: { Cookie: ownerCookie },
    });

    const createChatroomBody = await createChatroomResponse.json();
    console.log(createChatroomResponse.status, createChatroomBody);
    assert.strictEqual(createChatroomResponse.status, 201);

    const deleteChatroomResponse = await fetch(`${BASE_URL}/chatroom/delete/${baseName}`, {
        method: "DELETE",
        headers: { Cookie: ownerCookie },
    });

    const deleteChatroomBody = await deleteChatroomResponse.json();
    console.log(deleteChatroomResponse.status, deleteChatroomBody);
    assert.strictEqual(deleteChatroomResponse.status, 404);

    const chatroomInfoResponse = await fetch(`${BASE_URL}/chatroom/info/${chatroomName}`, {
        method: "GET",
        headers: { Cookie: ownerCookie },
    });
    const chatroomInfo = await chatroomInfoResponse.json();

    console.log(chatroomInfoResponse.status, chatroomInfo);
    assert.strictEqual(chatroomInfoResponse.status, 200);
});
