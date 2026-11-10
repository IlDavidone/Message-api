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

test("I messaggi di un canale non devono comparire nella lettura di un altro canale della stessa chatroom", async () => {
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

    const generalChannelName = "general";
    const randomChannelName = "random";

    const createGeneralChannelResponse = await fetch(
        `${BASE_URL}/channel/create/${chatroom._id}/${generalChannelName}`,
        { method: "POST", headers: { Cookie: ownerCookie } }
    );
    const generalChannel = await createGeneralChannelResponse.json();
    console.log(createGeneralChannelResponse.status, generalChannel);
    assert.strictEqual(createGeneralChannelResponse.status, 201);

    const createRandomChannelResponse = await fetch(
        `${BASE_URL}/channel/create/${chatroom._id}/${randomChannelName}`,
        { method: "POST", headers: { Cookie: ownerCookie } }
    );
    const randomChannel = await createRandomChannelResponse.json();
    console.log(createRandomChannelResponse.status, randomChannel);
    assert.strictEqual(createRandomChannelResponse.status, 201);

    const generalMessageText = "Messaggio di general";
    const randomMessageText = "Messaggio di random";

    const sendGeneralMessageResponse = await fetch(
        `${BASE_URL}/message/send/${chatroom._id}/${generalChannelName}`,
        {
            method: "POST",
            headers: { Cookie: ownerCookie, "Content-Type": "application/json" },
            body: JSON.stringify({ text: generalMessageText }),
        }
    );
    const generalMessage = await sendGeneralMessageResponse.json();
    console.log(sendGeneralMessageResponse.status, generalMessage);
    assert.strictEqual(sendGeneralMessageResponse.status, 201);

    const sendRandomMessageResponse = await fetch(
        `${BASE_URL}/message/send/${chatroom._id}/${randomChannelName}`,
        {
            method: "POST",
            headers: { Cookie: ownerCookie, "Content-Type": "application/json" },
            body: JSON.stringify({ text: randomMessageText }),
        }
    );
    const randomMessage = await sendRandomMessageResponse.json();
    console.log(sendRandomMessageResponse.status, randomMessage);
    assert.strictEqual(sendRandomMessageResponse.status, 201);

    const fetchGeneralMessagesResponse = await fetch(
        `${BASE_URL}/message/fetch/${chatroom._id}/${generalChannelName}`,
        { method: "GET", headers: { Cookie: ownerCookie } }
    );
    const fetchGeneralMessagesBody = await fetchGeneralMessagesResponse.json();
    console.log(fetchGeneralMessagesResponse.status, fetchGeneralMessagesBody);
    assert.strictEqual(fetchGeneralMessagesResponse.status, 200);

    const textsInGeneral = fetchGeneralMessagesBody.messages.map((message) => message.text);

    assert.strictEqual(
        textsInGeneral.includes(randomMessageText),
        false,
        "La lettura del canale 'general' ha restituito anche un messaggio inviato nel canale 'random'"
    );

    assert.strictEqual(
        textsInGeneral.includes(generalMessageText),
        true,
        "La lettura del canale 'general' non contiene nemmeno il proprio messaggio"
    );
});
