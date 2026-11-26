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
    assert.strictEqual(renameResponse.status, 200);
    assert.strictEqual(renameBody.name, newName);
}

test("L'invito per una chatroom il cui nome è contenuto nel nome di un'altra più vecchia arriva alla chatroom giusta", async () => {
    const { users, usersCookies } = await registerUsers(2);
    const [, recipient] = users;
    const [ownerCookie] = usersCookies;

    const suffix = Date.now().toString(36);
    const targetChatroomName = "rosso" + suffix;
    const olderChatroomName = targetChatroomName + "x";

    const olderChatroomId = await createChatroomAndGetId(ownerCookie, "a" + suffix);
    const targetChatroomId = await createChatroomAndGetId(ownerCookie, "b" + suffix);

    await renameChatroom(ownerCookie, targetChatroomId, targetChatroomName);
    await renameChatroom(ownerCookie, olderChatroomId, olderChatroomName);

    const sendInvitationResponse = await fetch(`${BASE_URL}/invitations/send/${targetChatroomName}/${recipient.id}`, {
        method: "POST",
        headers: { Cookie: ownerCookie },
    });

    const sendInvitationBody = await sendInvitationResponse.json();
    console.log(sendInvitationResponse.status, sendInvitationBody);
    assert.strictEqual(sendInvitationResponse.status, 201);
    assert.strictEqual(sendInvitationBody.chatroomId, targetChatroomId);
});
