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

test("Un utente non può cancellare la chatroom di un altro con un nome contenuto nel nome della sua", async () => {
    const { users, usersCookies } = await registerUsers(2);
    const [ownerA, ownerB] = users;
    const [ownerACookie, ownerBCookie] = usersCookies;

    const baseName = Date.now().toString() + "_" + Math.random().toString(36).slice(2);
    const chatroomAName = baseName;
    const chatroomBName = baseName + "-progetto";

    const createChatroomAResponse = await fetch(`${BASE_URL}/chatroom/create/${chatroomAName}`, {
        method: "POST",
        headers: { Cookie: ownerACookie },
    });

    const createChatroomABody = await createChatroomAResponse.json();
    console.log(createChatroomAResponse.status, createChatroomABody);
    assert.strictEqual(createChatroomAResponse.status, 201);

    const createChatroomBResponse = await fetch(`${BASE_URL}/chatroom/create/${chatroomBName}`, {
        method: "POST",
        headers: { Cookie: ownerBCookie },
    });

    const createChatroomBBody = await createChatroomBResponse.json();
    console.log(createChatroomBResponse.status, createChatroomBBody);
    assert.strictEqual(createChatroomBResponse.status, 201);

    const deleteChatroomResponse = await fetch(`${BASE_URL}/chatroom/delete/${chatroomAName}`, {
        method: "DELETE",
        headers: { Cookie: ownerBCookie },
    });

    const deleteChatroomBody = await deleteChatroomResponse.json();
    console.log(deleteChatroomResponse.status, deleteChatroomBody);
    assert.strictEqual(deleteChatroomResponse.status, 403);

    const chatroomInfoResponse = await fetch(`${BASE_URL}/chatroom/info/${chatroomAName}`, {
        method: "GET",
        headers: { Cookie: ownerACookie },
    });
    const chatroomInfo = await chatroomInfoResponse.json();

    console.log(chatroomInfoResponse.status, chatroomInfo);
    assert.strictEqual(chatroomInfoResponse.status, 200);
});
