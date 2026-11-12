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

test("Promuovere due volte lo stesso utente ad admin deve dare conflitto", async () => {
    const { users, usersCookies } = await registerUsers(2);
    const [owner, partecipant] = users;
    const [ownerCookie, partecipantCookie] = usersCookies;

    const createChatroomResponse = await fetch(`${BASE_URL}/chatroom/create/${owner.username}`, {
        method: "POST",
        headers: { Cookie: ownerCookie },
    });
    const createChatroomBody = await createChatroomResponse.json();
    console.log(createChatroomResponse.status, createChatroomBody);
    assert.strictEqual(createChatroomResponse.status, 201);

    // B entra come partecipante tramite invito
    const sendInvitationResponse = await fetch(
        `${BASE_URL}/invitations/send/${owner.username}/${partecipant.id}`,
        { method: "POST", headers: { Cookie: ownerCookie } }
    );
    const invitation = await sendInvitationResponse.json();
    console.log(sendInvitationResponse.status, invitation);
    assert.strictEqual(sendInvitationResponse.status, 201);

    const acceptResponse = await fetch(`${BASE_URL}/invitations/accept/${invitation.id}`, {
        method: "PATCH",
        headers: { Cookie: partecipantCookie },
    });
    const acceptBody = await acceptResponse.json();
    console.log(acceptResponse.status, acceptBody);
    assert.strictEqual(acceptResponse.status, 200);

    // Prima promozione ad admin
    const firstPromotionResponse = await fetch(`${BASE_URL}/chatroom/admin/add/${owner.username}`, {
        method: "POST",
        headers: {
            Cookie: ownerCookie,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: partecipant.username }),
    });
    const firstPromotionBody = await firstPromotionResponse.json();
    console.log(firstPromotionResponse.status, firstPromotionBody);
    assert.strictEqual(firstPromotionResponse.status, 200);

    // Seconda promozione dello stesso utente ad admin
    const secondPromotionResponse = await fetch(`${BASE_URL}/chatroom/admin/add/${owner.username}`, {
        method: "POST",
        headers: {
            Cookie: ownerCookie,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: partecipant.username }),
    });
    const secondPromotionBody = await secondPromotionResponse.json();
    console.log(secondPromotionResponse.status, secondPromotionBody);

    assert.strictEqual(
        secondPromotionResponse.status,
        409,
        "Promuovere due volte lo stesso utente ad admin è un conflitto con lo stato corrente"
    );
    assert.strictEqual(secondPromotionBody.message, "The selected admin already exists");
});
