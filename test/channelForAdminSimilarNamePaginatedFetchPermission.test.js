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

test("Un partecipante non admin non può leggere i messaggi paginati di un canale riservato agli admin usando il nome di un altro canale contenuto nel suo", async () => {
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

    // Il canale riservato agli admin si crea PER PRIMO: senza ordinamento, findOne restituisce di solito il più vecchio.
    const protectedChannelName = "admin-test";
    const similarChannelName = "admin";
    const secretText = "segreto-admin-test";

    const createProtectedChannelResponse = await fetch(
        `${BASE_URL}/channel/create/${chatroomInfo._id}/${protectedChannelName}`,
        {
            method: "POST",
            headers: { Cookie: ownerCookie },
        }
    );

    const createProtectedChannelBody = await createProtectedChannelResponse.json();
    console.log(createProtectedChannelResponse.status, createProtectedChannelBody);
    assert.strictEqual(createProtectedChannelResponse.status, 201);

    const editProtectedChannelResponse = await fetch(
        `${BASE_URL}/channel/edit/${chatroomInfo._id}/${protectedChannelName}`,
        {
            method: "PATCH",
            headers: {
                Cookie: ownerCookie,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ forAdmin: true }),
        }
    );

    const editProtectedChannelBody = await editProtectedChannelResponse.json();
    console.log(editProtectedChannelResponse.status, editProtectedChannelBody);
    assert.strictEqual(editProtectedChannelResponse.status, 200);

    const createSimilarChannelResponse = await fetch(
        `${BASE_URL}/channel/create/${chatroomInfo._id}/${similarChannelName}`,
        {
            method: "POST",
            headers: { Cookie: ownerCookie },
        }
    );

    const createSimilarChannelBody = await createSimilarChannelResponse.json();
    console.log(createSimilarChannelResponse.status, createSimilarChannelBody);
    assert.strictEqual(createSimilarChannelResponse.status, 201);

    const sendSecretMessageResponse = await fetch(
        `${BASE_URL}/message/send/${chatroomInfo._id}/${protectedChannelName}`,
        {
            method: "POST",
            headers: {
                Cookie: ownerCookie,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ text: secretText }),
        }
    );

    const sendSecretMessageBody = await sendSecretMessageResponse.json();
    console.log(sendSecretMessageResponse.status, sendSecretMessageBody);
    assert.strictEqual(sendSecretMessageResponse.status, 201);

    const fetchPaginatedMessagesAsPartecipanteResponse = await fetch(
        `${BASE_URL}/message/paginated/fetch/${chatroomInfo._id}/${similarChannelName}`,
        {
            method: "GET",
            headers: { Cookie: partecipanteCookie },
        }
    );

    const fetchPaginatedMessagesAsPartecipanteBody =
        await fetchPaginatedMessagesAsPartecipanteResponse.json();
    console.log(
        fetchPaginatedMessagesAsPartecipanteResponse.status,
        fetchPaginatedMessagesAsPartecipanteBody
    );

    const leakedSecretMessage = fetchPaginatedMessagesAsPartecipanteBody.messages.some(
        (message) => message.text === secretText
    );
    assert.strictEqual(leakedSecretMessage, false);
});
