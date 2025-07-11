import { createRequire } from "module";
const require = createRequire(import.meta.url);
const jwt = require("jsonwebtoken");

require("dotenv").config();

export const generateToken = (userId, res) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET_KEY, {
    expiresIn: "7d",
  });

  res.cookie("jwt", token, {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true, // XSS attacks prevention
    sameSite: "strict", // CSRF attacks prevention
    secure: process.env.NODE_ENV !== "development",
  });

  return token;
};
