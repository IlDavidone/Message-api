const { test } = require("node:test");
const assert = require("node:assert");

const BASE_URL = "http://localhost:3000/api/v1";

test("Registrare due utenti con lo stesso username deve fallire con 409", async () => {
    const username = Date.now().toString() + "_" + Math.random().toString(36).slice(2);

    const firstRegistrationBody = {
        username: username,
        email: username + "_a@mail.com",
        password: (Date.now() * (Math.random() * 100)).toString(),
    };

    const firstRegistrationResponse = await fetch(`${BASE_URL}/authentication/register`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(firstRegistrationBody),
    });
    const firstRegistrationResult = await firstRegistrationResponse.json();
    console.log(firstRegistrationResponse.status, firstRegistrationResult);
    assert.strictEqual(firstRegistrationResponse.status, 201);

    const secondRegistrationBody = {
        username: username,
        email: username + "_b@mail.com",
        password: (Date.now() * (Math.random() * 100)).toString(),
    };

    const secondRegistrationResponse = await fetch(`${BASE_URL}/authentication/register`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(secondRegistrationBody),
    });
    const secondRegistrationResult = await secondRegistrationResponse.json();
    console.log(secondRegistrationResponse.status, secondRegistrationResult);

    assert.strictEqual(
        secondRegistrationResponse.status,
        409,
        "Registrare uno username già in uso è un conflitto"
    );
});
