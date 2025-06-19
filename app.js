const http = require('http');
const path = require('node:path');
const express = require('express');
const app = express();
const server = http.createServer(app);
const socketio = require('socket.io');
const io = socketio(server, {
    connectionStateRecovery: {}
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set("views", path.join(__dirname, "views"));
app.use(express.static(__dirname + '/src'));
app.set("view engine", "ejs");

app.get("/", (req, res) => {
    res.render("index");
});

io.on('connection', (socket) => {
    console.log("A user connected!");
    socket.on('message', (message) => {
        io.emit('message', message);
    })
    socket.on('disconnect', () => {
        console.log("User disconnected :(")
    })
})

server.listen(3000, () => {
    console.log(`The server is now listening on port 3000`);
});