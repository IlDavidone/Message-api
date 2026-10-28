const router = require("./routes/main");
const http = require("http");
const path = require("node:path");
const express = require("express");
const app = express();
const server = http.createServer(app);
const socketio = require("socket.io");
const io = socketio(server, {
  connectionStateRecovery: {},
});
const session = require("express-session");
const mongoose = require("mongoose");
const connection = require("./config/database/users");
const crypto = require("crypto");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const { sanitizeRequestData } = require("./middleware/sanitizeInput");
require("dotenv").config();

mongoose.connect(process.env.DB_ACCESS_STRING);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
// express.json()/urlencoded() leave req.body undefined when the request has
// no matching Content-Type (or no body at all), which crashes any controller
// that destructures req.body directly. Normalize it to {} so those requests
// fail with a clean 400 from the controller's own validation instead of a 500.
app.use((req, res, next) => {
  if (!req.body) {
    req.body = {};
  }
  next();
});
app.use(sanitizeRequestData);
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.set("views", path.join(__dirname, "views"));
app.use(express.static(__dirname + "/src"));

app.use("/api/v1", router);

io.on("connection", (socket) => {
  console.log("A user connected!");
  socket.on("message", (uname, message) => {
    io.emit("message", uname, message);
  });
  socket.on("disconnect", () => {
    console.log("User disconnected :(");
  });
});

server.listen(3000, () => {
  console.log(`The server is now listening on port 3000`);
});
