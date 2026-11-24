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

async function registerUserWithName(username) {
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

test("Aggiungere un admin con un nome contenuto nel nome di un altro utente aggiunge l'utente giusto", async () => {
    const { users, usersCookies } = await registerUsers(1);
    const [owner] = users;
    const [ownerCookie] = usersCookies;

    const baseName = Date.now().toString() + "_" + Math.random().toString(36).slice(2);
    const olderUser = await registerUserWithName(baseName + "x");
    const partecipante = await registerUserWithName(baseName);
    const partecipanteCookie = partecipante.cookie;

    const createChatroomResponse = await fetch(`${BASE_URL}/chatroom/create/${owner.username}`, {
        method: "POST",
        headers: { Cookie: ownerCookie },
    });

    const createChatroomBody = await createChatroomResponse.json();
    console.log(createChatroomResponse.status, createChatroomBody);
    assert.strictEqual(createChatroomResponse.status, 201);

    const sendPartecipanteInvitationResponse = await fetch(
        `${BASE_URL}/invitations/send/${owner.username}/${partecipante.user.id}`,
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

    const addAdminResponse = await fetch(`${BASE_URL}/chatroom/admin/add/${owner.username}`, {
        method: "POST",
        headers: {
            Cookie: ownerCookie,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: baseName }),
    });

    const addAdminBody = await addAdminResponse.json();
    console.log(addAdminResponse.status, addAdminBody);
    assert.strictEqual(addAdminResponse.status, 200);

    const chatroomInfoResponse = await fetch(`${BASE_URL}/chatroom/info/${owner.username}`, {
        method: "GET",
        headers: { Cookie: ownerCookie },
    });
    const chatroomInfo = await chatroomInfoResponse.json();

    console.log(chatroomInfoResponse.status, chatroomInfo);

    const addedPartecipante = chatroomInfo.admins.some((admin) => admin.username === baseName);
    assert.strictEqual(addedPartecipante, true);

    const addedOlderUser = chatroomInfo.admins.some((admin) => admin.username === baseName + "x");
    assert.strictEqual(addedOlderUser, false);
});
