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

test("La risposta della cancellazione contiene il messaggio di conferma", async () => {
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

    const channelName = "generale";

    const createChannelResponse = await fetch(
        `${BASE_URL}/channel/create/${chatroomInfo._id}/${channelName}`,
        {
            method: "POST",
            headers: { Cookie: ownerCookie },
        }
    );

    const createChannelBody = await createChannelResponse.json();
    console.log(createChannelResponse.status, createChannelBody);
    assert.strictEqual(createChannelResponse.status, 201);

    const sendMessageResponse = await fetch(
        `${BASE_URL}/message/send/${chatroomInfo._id}/${channelName}`,
        {
            method: "POST",
            headers: {
                Cookie: ownerCookie,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ text: "messaggio-dell-autore" }),
        }
    );

    const sendMessageBody = await sendMessageResponse.json();
    console.log(sendMessageResponse.status, sendMessageBody);
    assert.strictEqual(sendMessageResponse.status, 201);

    const removeMessageResponse = await fetch(
        `${BASE_URL}/message/remove/${sendMessageBody.messageInsertion._id}`,
        {
            method: "DELETE",
            headers: { Cookie: ownerCookie },
        }
    );

    const removeMessageBody = await removeMessageResponse.json();
    console.log(removeMessageResponse.status, removeMessageBody);
    assert.strictEqual(removeMessageBody.message, "The message has been deleted successfully");
});
