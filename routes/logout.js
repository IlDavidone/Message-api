const express = require("express");
const router = express.Router();
const isAuth = require("../middleware/auth").isAuth;

// router.get("/logout", isAuth, (req, res, next) => {
//   req.logout(function (err) {
//     if (err) {
//       return next(err);
//     }
//     res.redirect("/login");
//   });
// });

module.exports = router;