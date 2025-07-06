const express = require("express");
const router = express.Router();
const isAuth = require("../middleware/auth").isAuth;
const { logout } = require("../controllers/auth.controller");

router.get("/logout", (req, res, next) => {
  logout(req, res);
});

module.exports = router;