import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { generateToken } = require("../config/authentication/jwt");
const connection = require('../config/database/schemas');
const User = connection.models.User;
const crypto = require("crypto");
const generatePassword = require("../controllers/passwordUtils").generatePassword;

export const signup =  async (req, res) => {
    const {  username, email, password } = req.body;
    try {
        if (!username | !email | !password) {
            return res.status(400).json({message: "Missing one or more required fields"});
        }
        
        if (password.length < 8) {
            return res.status(400).json({message: "The password is too short (Min. 8 characters)"});
        }

        const user = await User.findOne({email: email});

        if (user) {
            return res.status(400).json({message: "The provided email is already registered"});
        }

        const saltedPassword = generatePassword(password).salt;
        const hashedPassword = generatePassword(password).hash;

        const userInsertion = new User({
            username,
            email,
            passwordSalt: saltedPassword,
            passwordHash: hashedPassword,
            admin: false,
            verification: false,
            creationDate: new Date()
        });

        if (userInsertion) {
            generateToken(userInsertion._id, res);
            await userInsertion.save();

            res.status(200).json({
                id: userInsertion._id,
                username: userInsertion.username,
                email: userInsertion.email,
                passwordSalt: userInsertion.passwordSalt,
                passwordHash: userInsertion.passwordHash,
                admin: userInsertion.admin,
                verification: userInsertion.verification,
                creationDate: userInsertion.creationDate
            });
        }
        else {
            res.status(400).json({message: "Invalid user data"});
        }
    } catch (err) {
        console.log("Error in signup process", err.message);
        res.status(500).json({message: "Internal server error"});
    }
} 