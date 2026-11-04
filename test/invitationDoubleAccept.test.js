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

test("Accettare due volte lo stesso invito non deve avere effetti collaterali", async () => {
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

    const sendInvitationResponse = await fetch(
        `${BASE_URL}/invitations/send/${owner.username}/${recipient.id}`,
        { method: "POST", headers: { Cookie: ownerCookie } }
    );
    const invitation = await sendInvitationResponse.json();
    console.log(sendInvitationResponse.status, invitation);
    assert.strictEqual(sendInvitationResponse.status, 201);

    // Prima accettazione
    const firstAcceptResponse = await fetch(`${BASE_URL}/invitations/accept/${invitation.id}`, {
        method: "PATCH",
        headers: { Cookie: recipientCookie },
    });
    const firstAcceptBody = await firstAcceptResponse.json();
    console.log(firstAcceptResponse.status, firstAcceptBody);
    assert.strictEqual(firstAcceptResponse.status, 200);

    // Stato dei partecipanti
    const chatroomInfoBeforeResponse = await fetch(`${BASE_URL}/chatroom/info/${owner.username}`, {
        method: "GET",
        headers: { Cookie: ownerCookie },
    });
    const chatroomInfoBefore = await chatroomInfoBeforeResponse.json();
    console.log(chatroomInfoBeforeResponse.status, chatroomInfoBefore);
    assert.strictEqual(chatroomInfoBeforeResponse.status, 200);

    // Seconda accettazione dello stesso invito
    const secondAcceptResponse = await fetch(`${BASE_URL}/invitations/accept/${invitation.id}`, {
        method: "PATCH",
        headers: { Cookie: recipientCookie },
    });
    const secondAcceptBody = await secondAcceptResponse.json();
    console.log(secondAcceptResponse.status, secondAcceptBody);

    assert.strictEqual(
        secondAcceptResponse.status,
        409,
        "Accettare due volte lo stesso invito è un conflitto con lo stato corrente"
    );
    assert.strictEqual(secondAcceptBody.message, "Invitation already accepted");

    // Verifica di invarianza
    const chatroomInfoAfterResponse = await fetch(`${BASE_URL}/chatroom/info/${owner.username}`, {
        method: "GET",
        headers: { Cookie: ownerCookie },
    });
    const chatroomInfoAfter = await chatroomInfoAfterResponse.json();
    console.log(chatroomInfoAfterResponse.status, chatroomInfoAfter);
    assert.strictEqual(chatroomInfoAfterResponse.status, 200);

    assert.deepStrictEqual(
        chatroomInfoAfter.partecipants,
        chatroomInfoBefore.partecipants,
        "La seconda accettazione ha comunque modificato l'elenco dei partecipanti del chatroom"
    );
});
