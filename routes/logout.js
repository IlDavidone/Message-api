const express = require("express");
const router = express.Router();
const isAuth = require("../middleware/auth").isAuth;
const { logout } = require("../controllers/auth.controller");
const { authenticatedRoute } = require("../middleware/auth");

router.get("/logout", authenticatedRoute, (req, res, next) => {
  logout(req, res);
});

module.exports = router;