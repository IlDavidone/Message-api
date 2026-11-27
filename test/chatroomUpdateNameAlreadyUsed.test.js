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

test("Rinominare una chatroom con il nome di un'altra chatroom restituisce 409", async () => {
    const { users, usersCookies } = await registerUsers(2);
    const [firstOwner, secondOwner] = users;
    const [firstCookie, secondCookie] = usersCookies;

    const firstChatroomResponse = await fetch(`${BASE_URL}/chatroom/create/${firstOwner.username}`, {
        method: "POST",
        headers: { Cookie: firstCookie },
    });

    const firstChatroomBody = await firstChatroomResponse.json();
    console.log(firstChatroomResponse.status, firstChatroomBody);
    assert.strictEqual(firstChatroomResponse.status, 201);

    const secondChatroomResponse = await fetch(`${BASE_URL}/chatroom/create/${secondOwner.username}`, {
        method: "POST",
        headers: { Cookie: secondCookie },
    });

    const secondChatroomBody = await secondChatroomResponse.json();
    console.log(secondChatroomResponse.status, secondChatroomBody);
    assert.strictEqual(secondChatroomResponse.status, 201);

    const secondInfoResponse = await fetch(`${BASE_URL}/chatroom/info/${secondOwner.username}`, {
        method: "GET",
        headers: { Cookie: secondCookie },
    });
    const secondInfo = await secondInfoResponse.json();
    console.log(secondInfoResponse.status, secondInfo);

    const renameResponse = await fetch(`${BASE_URL}/chatroom/update/${secondInfo._id}`, {
        method: "PATCH",
        headers: {
            Cookie: secondCookie,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: firstOwner.username }),
    });

    const renameBody = await renameResponse.json();
    console.log(renameResponse.status, renameBody);
    assert.strictEqual(renameResponse.status, 409);
});
