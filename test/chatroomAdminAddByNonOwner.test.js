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

test("Un partecipante che non è proprietario non può aggiungere un admin", async () => {
    const { users, usersCookies } = await registerUsers(3);
    const [owner, partecipante, altroPartecipante] = users;
    const [ownerCookie, partecipanteCookie, altroPartecipanteCookie] = usersCookies;

    const createChatroomResponse = await fetch(`${BASE_URL}/chatroom/create/${owner.username}`, {
        method: "POST",
        headers: { Cookie: ownerCookie },
    });

    const createChatroomBody = await createChatroomResponse.json();
    console.log(createChatroomResponse.status, createChatroomBody);
    assert.strictEqual(createChatroomResponse.status, 201);

    const sendPartecipanteInvitationResponse = await fetch(
        `${BASE_URL}/invitations/send/${owner.username}/${partecipante.id}`,
        {
            method: "POST",
            headers: { Cookie: ownerCookie },
        }
    );

    const partecipanteInvitation = await sendPartecipanteInvitationResponse.json();
    console.log(sendPartecipanteInvitationResponse.status, partecipanteInvitation);
    assert.strictEqual(sendPartecipanteInvitationResponse.status, 201);

    const acceptPartecipanteInvitationResponse = await fetch(`${BASE_URL}/invitations/accept/${partecipanteInvitation.id}`, {
        method: "PATCH",
        headers: { Cookie: partecipanteCookie },
    });

    const acceptPartecipanteInvitationBody = await acceptPartecipanteInvitationResponse.json();
    console.log(acceptPartecipanteInvitationResponse.status, acceptPartecipanteInvitationBody);
    assert.strictEqual(acceptPartecipanteInvitationResponse.status, 200);

    const sendAltroPartecipanteInvitationResponse = await fetch(
        `${BASE_URL}/invitations/send/${owner.username}/${altroPartecipante.id}`,
        {
            method: "POST",
            headers: { Cookie: ownerCookie },
        }
    );

    const altroPartecipanteInvitation = await sendAltroPartecipanteInvitationResponse.json();
    console.log(sendAltroPartecipanteInvitationResponse.status, altroPartecipanteInvitation);
    assert.strictEqual(sendAltroPartecipanteInvitationResponse.status, 201);

    const acceptAltroPartecipanteInvitationResponse = await fetch(`${BASE_URL}/invitations/accept/${altroPartecipanteInvitation.id}`, {
        method: "PATCH",
        headers: { Cookie: altroPartecipanteCookie },
    });

    const acceptAltroPartecipanteInvitationBody = await acceptAltroPartecipanteInvitationResponse.json();
    console.log(acceptAltroPartecipanteInvitationResponse.status, acceptAltroPartecipanteInvitationBody);
    assert.strictEqual(acceptAltroPartecipanteInvitationResponse.status, 200);

    const addAdminResponse = await fetch(`${BASE_URL}/chatroom/admin/add/${owner.username}`, {
        method: "POST",
        headers: {
            Cookie: partecipanteCookie,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: altroPartecipante.username }),
    });

    const addAdminBody = await addAdminResponse.json();
    console.log(addAdminResponse.status, addAdminBody);
    assert.strictEqual(addAdminResponse.status, 403);
});
