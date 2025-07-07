const express = require("express");
const router = express.Router();
const { signin } = require("../controllers/authenticationUtils");
const { authenticatedRoute } = require("../middleware/auth");

router.get("/logout", authenticatedRoute, (req, res, next) => {
  logout(req, res);
});

module.exports = router;