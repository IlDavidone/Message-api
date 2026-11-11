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

test("Un utente già autenticato non può registrarsi di nuovo", async () => {
    const { cookie } = await registerUser();

    const secondUsername = Date.now().toString() + "_" + Math.random().toString(36).slice(2);

    const secondRegistrationResponse = await fetch(`${BASE_URL}/authentication/register`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Cookie: cookie,
        },
        body: JSON.stringify({
            username: secondUsername,
            email: secondUsername + "@mail.com",
            password: (Date.now() * (Math.random() * 100)).toString(),
        }),
    });

    const secondRegistrationBody = await secondRegistrationResponse.json();
    console.log(secondRegistrationResponse.status, secondRegistrationBody);

    assert.strictEqual(secondRegistrationResponse.status, 409);
});
