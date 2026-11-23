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

test("Un partecipante non admin non può cancellare un messaggio scritto da un altro partecipante", async () => {
    const { users, usersCookies } = await registerUsers(3);
    const [owner, autore, altroPartecipante] = users;
    const [ownerCookie, autoreCookie, altroPartecipanteCookie] = usersCookies;

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

    const sendAutoreInvitationResponse = await fetch(
        `${BASE_URL}/invitations/send/${owner.username}/${autore.id}`,
        {
            method: "POST",
            headers: { Cookie: ownerCookie },
        }
    );

    const autoreInvitation = await sendAutoreInvitationResponse.json();
    console.log(sendAutoreInvitationResponse.status, autoreInvitation);
    assert.strictEqual(sendAutoreInvitationResponse.status, 201);

    const acceptAutoreInvitationResponse = await fetch(`${BASE_URL}/invitations/accept/${autoreInvitation.id}`, {
        method: "PATCH",
        headers: { Cookie: autoreCookie },
    });

    const acceptAutoreInvitationBody = await acceptAutoreInvitationResponse.json();
    console.log(acceptAutoreInvitationResponse.status, acceptAutoreInvitationBody);
    assert.strictEqual(acceptAutoreInvitationResponse.status, 200);

    const sendAltroInvitationResponse = await fetch(
        `${BASE_URL}/invitations/send/${owner.username}/${altroPartecipante.id}`,
        {
            method: "POST",
            headers: { Cookie: ownerCookie },
        }
    );

    const altroInvitation = await sendAltroInvitationResponse.json();
    console.log(sendAltroInvitationResponse.status, altroInvitation);
    assert.strictEqual(sendAltroInvitationResponse.status, 201);

    const acceptAltroInvitationResponse = await fetch(`${BASE_URL}/invitations/accept/${altroInvitation.id}`, {
        method: "PATCH",
        headers: { Cookie: altroPartecipanteCookie },
    });

    const acceptAltroInvitationBody = await acceptAltroInvitationResponse.json();
    console.log(acceptAltroInvitationResponse.status, acceptAltroInvitationBody);
    assert.strictEqual(acceptAltroInvitationResponse.status, 200);

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
                Cookie: autoreCookie,
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
            headers: { Cookie: altroPartecipanteCookie },
        }
    );

    const removeMessageBody = await removeMessageResponse.json();
    console.log(removeMessageResponse.status, removeMessageBody);
    assert.strictEqual(removeMessageResponse.status, 403);
});
