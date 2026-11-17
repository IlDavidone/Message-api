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

// Un partecipante non admin non può leggere i messaggi di un canale riservato agli admin
test("Un partecipante non admin non può leggere i messaggi di un canale riservato agli admin", async () => {
    const { users, usersCookies } = await registerUsers(2);
    const [owner, partecipante] = users;
    const [ownerCookie, partecipanteCookie] = usersCookies;

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

    const sendInvitationResponse = await fetch(
        `${BASE_URL}/invitations/send/${owner.username}/${partecipante.id}`,
        {
            method: "POST",
            headers: { Cookie: ownerCookie },
        }
    );

    const invitation = await sendInvitationResponse.json();
    console.log(sendInvitationResponse.status, invitation);
    assert.strictEqual(sendInvitationResponse.status, 201);

    const acceptInvitationResponse = await fetch(`${BASE_URL}/invitations/accept/${invitation.id}`, {
        method: "PATCH",
        headers: { Cookie: partecipanteCookie },
    });

    const acceptInvitationBody = await acceptInvitationResponse.json();
    console.log(acceptInvitationResponse.status, acceptInvitationBody);
    assert.strictEqual(acceptInvitationResponse.status, 200);

    const channelName = "admin-only";

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

    const editChannelResponse = await fetch(
        `${BASE_URL}/channel/edit/${chatroomInfo._id}/${channelName}`,
        {
            method: "PATCH",
            headers: {
                Cookie: ownerCookie,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ forAdmin: true }),
        }
    );

    const editChannelBody = await editChannelResponse.json();
    console.log(editChannelResponse.status, editChannelBody);
    assert.strictEqual(editChannelResponse.status, 200);

    const fetchMessagesAsPartecipanteResponse = await fetch(
        `${BASE_URL}/message/fetch/${chatroomInfo._id}/${channelName}`,
        {
            method: "GET",
            headers: { Cookie: partecipanteCookie },
        }
    );

    const fetchMessagesAsPartecipanteBody = await fetchMessagesAsPartecipanteResponse.json();
    console.log(fetchMessagesAsPartecipanteResponse.status, fetchMessagesAsPartecipanteBody);

    assert.strictEqual(fetchMessagesAsPartecipanteResponse.status, 403);
});
