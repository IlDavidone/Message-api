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

test("Un partecipante che non è admin non può invitare un altro utente", async () => {
    const { users, usersCookies } = await registerUsers(3);
    const [owner, member, recipient] = users;
    const [ownerCookie, memberCookie] = usersCookies;

    const createChatroomResponse = await fetch(`${BASE_URL}/chatroom/create/${owner.username}`, {
        method: "POST",
        headers: { Cookie: ownerCookie },
    });

    const createChatroomBody = await createChatroomResponse.json();
    console.log(createChatroomResponse.status, createChatroomBody);
    assert.strictEqual(createChatroomResponse.status, 201);

    const memberInvitationResponse = await fetch(`${BASE_URL}/invitations/send/${owner.username}/${member.id}`, {
        method: "POST",
        headers: { Cookie: ownerCookie },
    });

    const memberInvitation = await memberInvitationResponse.json();
    console.log(memberInvitationResponse.status, memberInvitation);
    assert.strictEqual(memberInvitationResponse.status, 201);

    const acceptInvitationResponse = await fetch(`${BASE_URL}/invitations/accept/${memberInvitation.id}`, {
        method: "PATCH",
        headers: { Cookie: memberCookie },
    });

    const acceptInvitationBody = await acceptInvitationResponse.json();
    console.log(acceptInvitationResponse.status, acceptInvitationBody);
    assert.strictEqual(acceptInvitationResponse.status, 200);

    const sendInvitationResponse = await fetch(`${BASE_URL}/invitations/send/${owner.username}/${recipient.id}`, {
        method: "POST",
        headers: { Cookie: memberCookie },
    });

    const sendInvitationBody = await sendInvitationResponse.json();
    console.log(sendInvitationResponse.status, sendInvitationBody);
    assert.strictEqual(sendInvitationResponse.status, 403);
});
