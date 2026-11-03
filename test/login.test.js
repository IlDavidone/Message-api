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

    assert.strictEqual(loginResponse.status, 401);
});

test("Le risposte di login per email inesistente e per password errata devono essere indistinguibili", async () => {
    // Preparazione: utente di prova con credenziali note
    const username = Date.now().toString() + "_" + Math.random().toString(36).slice(2);

    const registrationTestBody = {
        username: username,
        email: username + "@mail.com",
        password: "correctPassword123"
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

    // Caso A: login con un'email che di sicuro non appartiene a nessun utente registrato
    const nonExistentEmail = Date.now().toString() + "_" + Math.random().toString(36).slice(2) + "@mail.com";

    const loginWithUnknownEmailResponse = await fetch(
        "http://localhost:3000/api/v1/authentication/login",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                email: nonExistentEmail,
                password: "whateverPassword123"
            }),
        }
    );

    const loginWithUnknownEmailBody = await loginWithUnknownEmailResponse.json();

    console.log(loginWithUnknownEmailResponse.status);
    console.log(loginWithUnknownEmailBody);

    // Caso B: login con l'email dell'utente appena registrato, ma una password sbagliata
    const loginWithWrongPasswordResponse = await fetch(
        "http://localhost:3000/api/v1/authentication/login",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                email: registrationTestBody.email,
                password: "wrongPassword456"
            }),
        }
    );

    const loginWithWrongPasswordBody = await loginWithWrongPasswordResponse.json();

    console.log(loginWithWrongPasswordResponse.status);
    console.log(loginWithWrongPasswordBody);

    // Le due risposte devono essere indistinguibili tra loro: stesso status e stesso messaggio,
    // non solo "entrambe 401" per coincidenza con testi diversi.
    assert.strictEqual(
        loginWithUnknownEmailResponse.status,
        loginWithWrongPasswordResponse.status,
        "Lo status code per email inesistente e per password errata deve essere identico, altrimenti si può capire dall'esterno se un'email è registrata"
    );

    assert.strictEqual(
        loginWithUnknownEmailBody.message,
        loginWithWrongPasswordBody.message,
        "Il messaggio per email inesistente e per password errata deve essere identico, altrimenti si può capire dall'esterno se un'email è registrata"
    );

    assert.strictEqual(loginWithWrongPasswordResponse.status, 401);

});

