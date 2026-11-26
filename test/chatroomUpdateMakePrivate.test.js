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

async function updateChatroom(ownerCookie, chatroomId, body) {
    const updateResponse = await fetch(`${BASE_URL}/chatroom/update/${chatroomId}`, {
        method: "PATCH",
        headers: {
            Cookie: ownerCookie,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
    });

    const updateBody = await updateResponse.json();
    console.log(updateResponse.status, updateBody);

    return { status: updateResponse.status, body: updateBody };
}

test("Il proprietario può rendere privata una chatroom pubblica", async () => {
    const { users, usersCookies } = await registerUsers(1);
    const [owner] = users;
    const [ownerCookie] = usersCookies;

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

    const suffix = Date.now().toString(36);

    const makePublic = await updateChatroom(ownerCookie, chatroomInfo._id, { name: "pubblica" + suffix, isPublic: true });
    assert.strictEqual(makePublic.status, 200);
    assert.strictEqual(makePublic.body.isPublic, true);

    const makePrivate = await updateChatroom(ownerCookie, chatroomInfo._id, { name: "privata" + suffix, isPublic: false });
    assert.strictEqual(makePrivate.status, 200);
    assert.strictEqual(makePrivate.body.isPublic, false);
});
