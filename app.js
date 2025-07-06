const router = require("./routes/main");
const http = require('http');
const path = require('node:path');
const express = require('express');
const app = express();
const server = http.createServer(app);
const socketio = require('socket.io');
const io = socketio(server, {
    connectionStateRecovery: {}
});
const session = require('express-session');
const mongoose = require("mongoose");
const connection = require("./config/database/schemas");
const crypto = require("crypto");
const cookieParser = require("cookie-parser");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.set("views", path.join(__dirname, "views"));
app.use(express.static(__dirname + '/src'));

const MongoStore = require('connect-mongo')(session);

const sessionStore = new MongoStore({ mongooseConnection: connection, collection: 'sessions' });

const sharedSession = require("express-socket.io-session");

const sessionMiddleware = session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    store: sessionStore,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24
    }
});

app.use(sessionMiddleware);
io.use(sharedSession(sessionMiddleware, { autoSave: true }));

app.use("/", router);

io.on('connection', (socket) => {
    console.log("A user connected!");
    socket.on('login', function(user) {
        socket.handshake.session.user = user;
        socket.handshake.session.save();
    });
    socket.on('logout', function(userdata) {
        if (socket.handshake.session.user) {
            delete socket.handshake.session.user;
            socket.handshake.session.save();
        }
    });
    socket.on('message', (uname, message) => {
        io.emit('message', uname, message);
    });
    socket.on('disconnect', () => {
        console.log("User disconnected :(")
    });
})

server.listen(3000, () => {
    console.log(`The server is now listening on port 3000`);
});