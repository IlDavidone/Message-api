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


test("Un utente autenticato può fare il logout", async () => {
    const { cookie } = await registerUser();

    const logoutResponse = await fetch(`${BASE_URL}/authentication/logout`, {
        method: "GET",
        headers: { Cookie: cookie },
    });

    const logoutBody = await logoutResponse.json();
    console.log(logoutResponse.status, logoutBody);
    assert.strictEqual(logoutResponse.status, 200);
});
