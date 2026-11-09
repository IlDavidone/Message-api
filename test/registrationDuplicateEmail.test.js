const { test } = require("node:test");
const assert = require("node:assert");

const BASE_URL = "http://localhost:3000/api/v1";

test("Registrare due utenti con la stessa email deve fallire con 409 Conflict", async () => {
    const username = Date.now().toString() + "_" + Math.random().toString(36).slice(2);
    const email = username + "@mail.com";

    const firstRegistrationBody = {
        username: username,
        email: email,
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

    const secondUsername = Date.now().toString() + "_" + Math.random().toString(36).slice(2);
    const secondRegistrationBody = {
        username: secondUsername,
        email: email,
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
        "Registrare un'email già in uso è un conflitto con lo stato corrente"
    );
});
