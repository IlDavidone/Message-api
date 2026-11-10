const { test } = require("node:test");
const assert = require("node:assert");

const BASE_URL = "http://localhost:3000/api/v1";

test("Registrare uno username che è prefisso di uno già esistente non deve fallire per falso positivo del regex", async () => {
    const base = Date.now().toString() + "_" + Math.random().toString(36).slice(2);

    const firstUsername = base + "_abc";
    const firstRegistrationBody = {
        username: firstUsername,
        email: firstUsername + "@mail.com",
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

    const secondUsername = base;
    const secondRegistrationBody = {
        username: secondUsername,
        email: secondUsername + "@mail.com",
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
        201,
        "Lo username 'base' non è realmente in conflitto con 'base_abc': non deve essere rifiutato"
    );
});
