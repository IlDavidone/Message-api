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

test("Invitare un utente che è già partecipante della chatroom restituisce 409", async () => {
    const { users, usersCookies } = await registerUsers(2);
    const [owner, recipient] = users;
    const [ownerCookie, recipientCookie] = usersCookies;

    const createChatroomResponse = await fetch(`${BASE_URL}/chatroom/create/${owner.username}`, {
        method: "POST",
        headers: { Cookie: ownerCookie },
    });

    const createChatroomBody = await createChatroomResponse.json();
    console.log(createChatroomResponse.status, createChatroomBody);
    assert.strictEqual(createChatroomResponse.status, 201);

    const firstInvitationResponse = await fetch(`${BASE_URL}/invitations/send/${owner.username}/${recipient.id}`, {
        method: "POST",
        headers: { Cookie: ownerCookie },
    });

    const firstInvitation = await firstInvitationResponse.json();
    console.log(firstInvitationResponse.status, firstInvitation);
    assert.strictEqual(firstInvitationResponse.status, 201);

    const acceptResponse = await fetch(`${BASE_URL}/invitations/accept/${firstInvitation.id}`, {
        method: "PATCH",
        headers: { Cookie: recipientCookie },
    });

    const acceptBody = await acceptResponse.json();
    console.log(acceptResponse.status, acceptBody);
    assert.strictEqual(acceptResponse.status, 200);

    const secondInvitationResponse = await fetch(`${BASE_URL}/invitations/send/${owner.username}/${recipient.id}`, {
        method: "POST",
        headers: { Cookie: ownerCookie },
    });

    const secondInvitation = await secondInvitationResponse.json();
    console.log(secondInvitationResponse.status, secondInvitation);
    assert.strictEqual(secondInvitationResponse.status, 409);
});
