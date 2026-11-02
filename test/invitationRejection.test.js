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

// Rifiutare un invito deve eliminare esattamente quell'invito, non un invito più vecchio appartenente a qualcun altro
test("Il rifiuto di un invito elimina solo quell'invito, non il più vecchio presente nel database", async () => {
    const { users, usersCookies } = await registerUsers(3);
    const [owner, firstRecipient, secondRecipient] = users;
    const [ownerCookie, firstRecipientCookie, secondRecipientCookie] = usersCookies;

    const createChatroomResponse = await fetch(`${BASE_URL}/chatroom/create/${owner.username}`, {
        method: "POST",
        headers: { Cookie: ownerCookie },
    });
    const createChatroomBody = await createChatroomResponse.json();
    console.log(createChatroomResponse.status, createChatroomBody);
    assert.strictEqual(createChatroomResponse.status, 201);

    // Invito "vecchio", inviato per primo
    const sendFirstInvitationResponse = await fetch(
        `${BASE_URL}/invitations/send/${owner.username}/${firstRecipient.id}`,
        { method: "POST", headers: { Cookie: ownerCookie } }
    );
    const firstInvitation = await sendFirstInvitationResponse.json();
    console.log(sendFirstInvitationResponse.status, firstInvitation);
    assert.strictEqual(sendFirstInvitationResponse.status, 201);

    // Invito "nuovo", inviato subito dopo
    const sendSecondInvitationResponse = await fetch(
        `${BASE_URL}/invitations/send/${owner.username}/${secondRecipient.id}`,
        { method: "POST", headers: { Cookie: ownerCookie } }
    );
    const secondInvitation = await sendSecondInvitationResponse.json();
    console.log(sendSecondInvitationResponse.status, secondInvitation);
    assert.strictEqual(sendSecondInvitationResponse.status, 201);

    // Il vero destinatario dell'invito "nuovo" lo rifiuta: deve andare a buon fine
    const rejectResponse = await fetch(
        `${BASE_URL}/invitations/reject/${secondInvitation.id}`,
        { method: "DELETE", headers: { Cookie: secondRecipientCookie } }
    );
    const rejectBody = await rejectResponse.json();
    console.log(rejectResponse.status, rejectBody);
    assert.strictEqual(rejectResponse.status, 200);

    // L'invito eliminato nella risposta deve essere quello "nuovo", non quello "vecchio"
    assert.strictEqual(
        rejectBody.updatedInvitation._id,
        secondInvitation.id,
        "L'invito eliminato non corrisponde a quello rifiutato: è stato cancellato un invito diverso"
    );

    // L'invito "vecchio" deve esistere ancora, invariato (accepted: false, stessa data di creazione)
    const firstRecipientInvitationsResponse = await fetch(`${BASE_URL}/invitations`, {
        method: "GET",
        headers: { Cookie: firstRecipientCookie },
    });
    const firstRecipientInvitationsBody = await firstRecipientInvitationsResponse.json();
    console.log(firstRecipientInvitationsResponse.status, firstRecipientInvitationsBody);
    assert.strictEqual(firstRecipientInvitationsResponse.status, 200);

    const survivingFirstInvitation = firstRecipientInvitationsBody.invitations.find(
        (invitation) => invitation._id === firstInvitation.id
    );

    assert.ok(
        survivingFirstInvitation,
        "L'invito più vecchio è sparito dal database: è stato cancellato per errore al posto di quello rifiutato"
    );
    assert.strictEqual(survivingFirstInvitation.accepted, false);
    assert.strictEqual(survivingFirstInvitation.creationDate, firstInvitation.creationDate);
});
