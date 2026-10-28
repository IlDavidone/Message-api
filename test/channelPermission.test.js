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

// Un utente che non partecipa a una chatroom non può leggere i messaggi di un suo canale
test("Un utente che non partecipa a una chatroom non può leggere i messaggi di un suo canale", async () => {
    const { users, usersCookies } = await registerUsers(2);
    const [owner, outsider] = users;
    const [ownerCookie, outsiderCookie] = usersCookies;

    const createChatroomResponse = await fetch(`${BASE_URL}/chatroom/create/${owner.username}`, {
        method: "POST",
        headers: { Cookie: ownerCookie },
    });

    assert.strictEqual(createChatroomResponse.status, 201);

    const chatroomInfoResponse = await fetch(`${BASE_URL}/chatroom/info/${owner.username}`, {
        method: "GET",
        headers: { Cookie: ownerCookie },
    });
    const chatroomInfo = await chatroomInfoResponse.json();

    const channelName = "general";

    const createChannelResponse = await fetch(
        `${BASE_URL}/channel/create/${chatroomInfo._id}/${channelName}`,
        {
            method: "POST",
            headers: { Cookie: ownerCookie },
        }
    );

    assert.strictEqual(createChannelResponse.status, 201);

    const fetchMessagesAsOutsiderResponse = await fetch(
        `${BASE_URL}/message/fetch/${chatroomInfo._id}/${channelName}`,
        {
            method: "GET",
            headers: { Cookie: outsiderCookie },
        }
    );

    assert.strictEqual(fetchMessagesAsOutsiderResponse.status, 403);
});

// Un utente non può accettare un invito indirizzato a un altro utente
test("Un utente non può accettare un invito indirizzato a un altro utente", async () => {
    const { users, usersCookies } = await registerUsers(3);
    const [owner, recipient, intruder] = users;
    const [ownerCookie, , intruderCookie] = usersCookies;

    const createChatroomResponse = await fetch(`${BASE_URL}/chatroom/create/${owner.username}`, {
        method: "POST",
        headers: { Cookie: ownerCookie },
    });

    assert.strictEqual(createChatroomResponse.status, 201);

    const sendInvitationResponse = await fetch(
        `${BASE_URL}/invitations/send/${owner.username}/${recipient.id}`,
        {
            method: "POST",
            headers: { Cookie: ownerCookie },
        }
    );

    assert.strictEqual(sendInvitationResponse.status, 201);

    const invitation = await sendInvitationResponse.json();

    const acceptInvitationAsIntruderResponse = await fetch(
        `${BASE_URL}/invitations/accept/${invitation.id}`,
        {
            method: "PATCH",
            headers: { Cookie: intruderCookie },
        }
    );

    assert.strictEqual(acceptInvitationAsIntruderResponse.status, 403);
});
