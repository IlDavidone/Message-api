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

async function createChatroomAndGetId(ownerCookie, chatroomName) {
    const createChatroomResponse = await fetch(`${BASE_URL}/chatroom/create/${chatroomName}`, {
        method: "POST",
        headers: { Cookie: ownerCookie },
    });

    const createChatroomBody = await createChatroomResponse.json();
    console.log(createChatroomResponse.status, createChatroomBody);
    assert.strictEqual(createChatroomResponse.status, 201);

    const chatroomInfoResponse = await fetch(`${BASE_URL}/chatroom/info/${chatroomName}`, {
        method: "GET",
        headers: { Cookie: ownerCookie },
    });
    const chatroomInfo = await chatroomInfoResponse.json();
    console.log(chatroomInfoResponse.status, chatroomInfo);

    return chatroomInfo._id;
}

async function renameChatroom(ownerCookie, chatroomId, newName) {
    const renameResponse = await fetch(`${BASE_URL}/chatroom/update/${chatroomId}`, {
        method: "PATCH",
        headers: {
            Cookie: ownerCookie,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: newName }),
    });

    const renameBody = await renameResponse.json();
    console.log(renameResponse.status, renameBody);

    return { status: renameResponse.status, body: renameBody };
}

test("Rinominare una chatroom con un nome contenuto nel nome di un'altra chatroom cambia il nome", async () => {
    const { usersCookies } = await registerUsers(1);
    const [ownerCookie] = usersCookies;

    const suffix = Date.now().toString(36);
    const containedName = "rosso" + suffix;
    const containingName = containedName + "x";

    const firstChatroomId = await createChatroomAndGetId(ownerCookie, "a" + suffix);
    const secondChatroomId = await createChatroomAndGetId(ownerCookie, "b" + suffix);

    const firstRename = await renameChatroom(ownerCookie, firstChatroomId, containingName);
    assert.strictEqual(firstRename.status, 200);
    assert.strictEqual(firstRename.body.name, containingName);

    const secondRename = await renameChatroom(ownerCookie, secondChatroomId, containedName);
    assert.strictEqual(secondRename.status, 200);
    assert.strictEqual(secondRename.body.name, containedName);
});
