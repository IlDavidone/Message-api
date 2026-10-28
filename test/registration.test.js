const { test } = require("node:test");
const assert = require("node:assert");

test("Garantire che la registrazione avvenga correttamente", async () => {
    const username = Date.now().toString();
    
    const testBody = {
        username: username,
        email: username + "@mail.com",
        password: "testpass"
    };

    const response = await fetch("http://localhost:3000/api/v1/authentication/register", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(testBody),
    });

    console.log(response.status);

    
    const body = await response.json();
    
    console.log(body);
    
    assert.strictEqual(response.status, 201);
    assert.strictEqual(body.passwordHash, undefined);
});
