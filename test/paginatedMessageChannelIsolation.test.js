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

test("La lettura paginata di un canale non deve restituire ne' conteggiare i messaggi di un altro canale della stessa chatroom", async () => {
    const { user: owner, cookie: ownerCookie } = await registerUser();

    const createChatroomResponse = await fetch(`${BASE_URL}/chatroom/create/${owner.username}`, {
        method: "POST",
        headers: { Cookie: ownerCookie },
    });
    const createChatroomBody = await createChatroomResponse.json();
    console.log(createChatroomResponse.status, createChatroomBody);
    assert.strictEqual(createChatroomResponse.status, 201);

    const chatroomInfoResponse = await fetch(`${BASE_URL}/chatroom/info/${owner.username}`, {
        method: "GET",
        headers: { Cookie: ownerCookie },
    });
    const chatroom = await chatroomInfoResponse.json();
    console.log(chatroomInfoResponse.status, chatroom);
    assert.strictEqual(chatroomInfoResponse.status, 200);

    const canaleAName = "canaleA";
    const canaleBName = "canaleB";

    const createCanaleAResponse = await fetch(
        `${BASE_URL}/channel/create/${chatroom._id}/${canaleAName}`,
        { method: "POST", headers: { Cookie: ownerCookie } }
    );
    const canaleA = await createCanaleAResponse.json();
    console.log(createCanaleAResponse.status, canaleA);
    assert.strictEqual(createCanaleAResponse.status, 201);

    const createCanaleBResponse = await fetch(
        `${BASE_URL}/channel/create/${chatroom._id}/${canaleBName}`,
        { method: "POST", headers: { Cookie: ownerCookie } }
    );
    const canaleB = await createCanaleBResponse.json();
    console.log(createCanaleBResponse.status, canaleB);
    assert.strictEqual(createCanaleBResponse.status, 201);

    const canaleAMessageText = "Messaggio esclusivo di canaleA";
    const canaleBMessageText = "Messaggio esclusivo di canaleB";

    const sendCanaleAMessageResponse = await fetch(
        `${BASE_URL}/message/send/${chatroom._id}/${canaleAName}`,
        {
            method: "POST",
            headers: { Cookie: ownerCookie, "Content-Type": "application/json" },
            body: JSON.stringify({ text: canaleAMessageText }),
        }
    );
    const sendCanaleAMessageBody = await sendCanaleAMessageResponse.json();
    console.log(sendCanaleAMessageResponse.status, sendCanaleAMessageBody);
    assert.strictEqual(sendCanaleAMessageResponse.status, 201);
    const canaleAMessage = sendCanaleAMessageBody.messageInsertion;

    const sendCanaleBMessageResponse = await fetch(
        `${BASE_URL}/message/send/${chatroom._id}/${canaleBName}`,
        {
            method: "POST",
            headers: { Cookie: ownerCookie, "Content-Type": "application/json" },
            body: JSON.stringify({ text: canaleBMessageText }),
        }
    );
    const sendCanaleBMessageBody = await sendCanaleBMessageResponse.json();
    console.log(sendCanaleBMessageResponse.status, sendCanaleBMessageBody);
    assert.strictEqual(sendCanaleBMessageResponse.status, 201);
    const canaleBMessage = sendCanaleBMessageBody.messageInsertion;

    // canaleA contiene un solo messaggio: con limit=1 ci si aspetta una sola pagina
    const limit = 1;
    const expectedTotalPages = 1;

    const fetchPaginatedResponse = await fetch(
        `${BASE_URL}/message/paginated/fetch/${chatroom._id}/${canaleAName}?limit=${limit}`,
        { method: "GET", headers: { Cookie: ownerCookie } }
    );
    const fetchPaginatedBody = await fetchPaginatedResponse.json();
    console.log(fetchPaginatedResponse.status, fetchPaginatedBody);

    assert.strictEqual(fetchPaginatedResponse.status, 200);

    assert.strictEqual(
        fetchPaginatedBody.messages.length,
        1,
        "La lettura paginata di 'canaleA' dovrebbe restituire esattamente un messaggio"
    );

    const returnedMessage = fetchPaginatedBody.messages[0];

    assert.strictEqual(
        returnedMessage._id,
        canaleAMessage._id,
        "Il messaggio restituito non e' quello inviato su 'canaleA'"
    );
    assert.strictEqual(
        returnedMessage.text,
        canaleAMessageText,
        "Il testo del messaggio restituito non corrisponde a quello inviato su 'canaleA'"
    );

    assert.notStrictEqual(
        returnedMessage._id,
        canaleBMessage._id,
        "La lettura paginata di 'canaleA' ha restituito il messaggio di 'canaleB'"
    );
    assert.strictEqual(
        returnedMessage.text,
        canaleAMessageText,
        "La lettura paginata di 'canaleA' non dovrebbe restituire il testo del messaggio di 'canaleB'"
    );
    assert.notStrictEqual(
        returnedMessage.text,
        canaleBMessageText,
        "La lettura paginata di 'canaleA' ha restituito il testo del messaggio di 'canaleB'"
    );

    assert.strictEqual(
        fetchPaginatedBody.totalPages,
        expectedTotalPages,
        "totalPages dovrebbe riflettere solo i messaggi di 'canaleA', non l'intera collezione messages"
    );
});
