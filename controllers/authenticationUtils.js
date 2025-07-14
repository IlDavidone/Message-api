import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { generateToken } = require("../config/authentication/jwt");
const User = require("../config/database/users");
const crypto = require("crypto");
const generatePassword =
  require("../controllers/passwordUtils").generatePassword;
const verifyPassword = require("../controllers/passwordUtils").validPassword;

export const signup = async (req, res) => {
  const { username, email, password } = req.body;
  try {
    if (req.cookies.jwt) {
      return res.status(400).json({ message: "User is already signed in" });
    }

    if (!username | !email | !password) {
      return res
        .status(400)
        .json({ message: "Missing one or more required fields" });
    }

    if (password.length < 8) {
      return res
        .status(400)
        .json({ message: "The password is too short (Min. 8 characters)" });
    }

    const userEmail = await User.findOne({ email: email });

    if (userEmail) {
      return res
        .status(400)
        .json({ message: "The provided email is already registered" });
    }

    const userName = await User.exists({
      username: { $regex: username, $options: "i" },
    });

    if (userName !== null) {
      return res
        .status(400)
        .json({ message: "The selected username already exists" });
    }

    const { salt, hash } = generatePassword(password);

    const userInsertion = new User({
      username,
      email,
      passwordSalt: salt,
      passwordHash: hash,
      admin: false,
      partecipates: [],
      verification: false,
      creationDate: new Date(),
    });

    if (userInsertion) {
      generateToken(userInsertion._id, res);
      await userInsertion.save();

      res.status(200).json({
        id: userInsertion._id,
        username: userInsertion.username,
        email: userInsertion.email,
        admin: userInsertion.admin,
        verification: userInsertion.verification,
        creationDate: userInsertion.creationDate,
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (err) {
    console.log("An error occurred during signup process", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const signin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (req.cookies.jwt) {
      return res.status(400).json({ message: "User is already signed in" });
    }

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Missing one or more required fields" });
    }

    if (password.length < 8) {
      return res
        .status(400)
        .json({ message: "Password must be 8 characters long" });
    }

    const user = await User.findOne({ email: email });

    if (!user) {
      return res.status(404).json({ message: "Invalid credentials submitted" });
    }

    const passwordVerification = verifyPassword(
      password,
      user.passwordHash,
      user.passwordSalt
    );

    if (!passwordVerification) {
      return res.status(400).json({ message: "Invalid password submitted" });
    }

    generateToken(user._id, res);

    res.status(200).json({
      id: user._id,
      username: user.username,
      email: user.email,
      admin: user.admin,
      verification: user.verification,
      creationDate: user.creationDate,
    });
  } catch (err) {
    console.log("An error occurred during signin process", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const logout = (req, res) => {
  try {
    res.cookie("jwt", "", { maxAge: 0 });
    res.status(200).json({ message: "Logged out successfully" });
  } catch (err) {
    console.log("An error occurred while logging out:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const fetchUserInformations = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select(
      "-passwordHash -passwordSalt"
    );

    if (!user) {
      return res
        .status(401)
        .json({ message: "Invalid token provided - Please sign-in again" });
    }

    res.status(200).json({ user });
  } catch (err) {
    console.log(
      "An error occurred while fetching a user informations",
      err.message
    );
    res.status(500).json({ message: "Internal server error" });
  }
};
