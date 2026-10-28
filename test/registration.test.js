const { test } = require("node:test");
const assert = require("node:assert");

test("Garantire che la registrazione avvenga correttamente", async () => {
    const username = (Date.now() + Math.random() * 100).toString();
    
    const registrationTestBody = {
        username: username,
        email: username + "@mail.com",
        password: (Date.now() * (Math.random() * 100)).toString()
    };

    const registrationResponse = await fetch("http://localhost:3000/api/v1/authentication/register", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(registrationTestBody),
    });
    
    const registrationBody = await registrationResponse.json();
    
    assert.strictEqual(registrationResponse.status, 201);
    assert.strictEqual(registrationBody.passwordHash, undefined);
});
