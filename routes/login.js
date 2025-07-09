const express = require("express");
const router = express.Router();
const { authenticatedRoute } = require("../middleware/auth");
const {
  signin,
  fetchUserInformations,
} = require("../controllers/authenticationUtils");

require("dotenv").config();

router.post("/login", async (req, res, next) => {
  signin(req, res);
});

router.get("/user", authenticatedRoute, async (req, res, next) => {
  fetchUserInformations(req, res);
});

module.exports = router;
