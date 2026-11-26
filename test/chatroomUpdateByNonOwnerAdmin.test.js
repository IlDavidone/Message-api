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

test("Un admin che non è proprietario non può cambiare il nome della chatroom", async () => {
    const { users, usersCookies } = await registerUsers(2);
    const [owner, admin] = users;
    const [ownerCookie, adminCookie] = usersCookies;

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

    const sendInvitationResponse = await fetch(`${BASE_URL}/invitations/send/${owner.username}/${admin.id}`, {
        method: "POST",
        headers: { Cookie: ownerCookie },
    });

    const invitation = await sendInvitationResponse.json();
    console.log(sendInvitationResponse.status, invitation);
    assert.strictEqual(sendInvitationResponse.status, 201);

    const acceptInvitationResponse = await fetch(`${BASE_URL}/invitations/accept/${invitation.id}`, {
        method: "PATCH",
        headers: { Cookie: adminCookie },
    });

    const acceptInvitationBody = await acceptInvitationResponse.json();
    console.log(acceptInvitationResponse.status, acceptInvitationBody);
    assert.strictEqual(acceptInvitationResponse.status, 200);

    const addAdminResponse = await fetch(`${BASE_URL}/chatroom/admin/add/${owner.username}`, {
        method: "POST",
        headers: {
            Cookie: ownerCookie,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: admin.username }),
    });

    const addAdminBody = await addAdminResponse.json();
    console.log(addAdminResponse.status, addAdminBody);
    assert.strictEqual(addAdminResponse.status, 200);

    const renameResponse = await fetch(`${BASE_URL}/chatroom/update/${chatroomInfo._id}`, {
        method: "PATCH",
        headers: {
            Cookie: adminCookie,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: "nuovo" + Date.now().toString(36) }),
    });

    const renameBody = await renameResponse.json();
    console.log(renameResponse.status, renameBody);
    assert.strictEqual(renameResponse.status, 403);
});
