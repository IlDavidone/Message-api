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

// Un utente che non partecipa a una chatroom non può mandare messaggi in un suo canale
test("Un utente che non partecipa a una chatroom non può mandare messaggi in un suo canale", async () => {
    const { users, usersCookies } = await registerUsers(2);
    const [owner, outsider] = users;
    const [ownerCookie, outsiderCookie] = usersCookies;

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

    const channelName = "general";

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

    const intruderMessageText = "Messaggio dell'intruso";

    const sendMessageAsOutsiderResponse = await fetch(
        `${BASE_URL}/message/send/${chatroomInfo._id}/${channelName}`,
        {
            method: "POST",
            headers: {
                Cookie: outsiderCookie,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ text: intruderMessageText }),
        }
    );

    const sendMessageAsOutsiderBody = await sendMessageAsOutsiderResponse.json();
    console.log(sendMessageAsOutsiderResponse.status, sendMessageAsOutsiderBody);

    assert.strictEqual(sendMessageAsOutsiderResponse.status, 403);
    assert.strictEqual(
        sendMessageAsOutsiderBody.message,
        "You are not authorized to perform this operation - Not a partecipant"
    );

    const fetchMessagesAsOwnerResponse = await fetch(
        `${BASE_URL}/message/fetch/${chatroomInfo._id}/${channelName}`,
        {
            method: "GET",
            headers: { Cookie: ownerCookie },
        }
    );

    const fetchMessagesAsOwnerBody = await fetchMessagesAsOwnerResponse.json();
    console.log(fetchMessagesAsOwnerResponse.status, fetchMessagesAsOwnerBody);
    assert.strictEqual(fetchMessagesAsOwnerResponse.status, 200);

    const savedIntruderMessage = fetchMessagesAsOwnerBody.messages.find(
        (message) => message.text === intruderMessageText
    );

    assert.strictEqual(
        savedIntruderMessage,
        undefined,
        "Il messaggio dell'intruso è stato salvato nonostante l'invio fosse stato rifiutato"
    );
});
