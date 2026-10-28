const { test } = require("node:test");
const assert = require("node:assert");

test("Garantire che non si possa accedere con credenziali errate", async () => {
    // Registration step
    const username = Date.now().toString();

    const registrationTestBody = {
        username: username,
        email: username + "@mail.com",
        password: "testpass"
    };

    const registrationResponse = await fetch(
        "http://localhost:3000/api/v1/authentication/register",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(registrationTestBody)
        }
    );

    const registrationBody = await registrationResponse.json();

    console.log(registrationResponse.status);
    console.log(registrationBody);

    assert.strictEqual(registrationResponse.status, 201);

    // Login step: wrong password
    const loginTestBody = {
        email: registrationTestBody.email,
        password: "randomWrongPassword"
    };

    const loginResponse = await fetch(
        "http://localhost:3000/api/v1/authentication/login",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(loginTestBody),
        }
    );

    const loginBody = await loginResponse.json();

    console.log(loginResponse.status);
    console.log(loginBody);

    assert.strictEqual(loginResponse.status, 400);
});

