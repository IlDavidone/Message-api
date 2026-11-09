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

    return { user, cookie, credentials: registrationTestBody };
}

test("Un utente già autenticato non può effettuare di nuovo il login", async () => {
    const { cookie, credentials } = await registerUser();

    const loginResponse = await fetch(`${BASE_URL}/authentication/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Cookie: cookie,
        },
        body: JSON.stringify({
            email: credentials.email,
            password: credentials.password,
        }),
    });

    const loginBody = await loginResponse.json();
    console.log(loginResponse.status, loginBody);

    assert.strictEqual(loginResponse.status, 409);
});
