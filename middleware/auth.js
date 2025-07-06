import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const jwt = require("jsonwebtoken");
const connection = require('../config/database/schemas');
const User = connection.models.User;

export const authenticatedRoute = async (req, res, next) => {
    try {
        const token = req.cookies.jwt;

        if (!token) {
            return res.status(401).json({message: "You are not authorized, no token provided"});
        }

        const decodedToken = jwt.verify(token, process.env.JWT_SECRET_KEY);

        if (!decodedToken) {
            return res.status(401).json({message: "You are not authorized, invalid token provided"});
        }

        const user = await User.findById(decodedToken.userId).select("-passwordSalt -passwordHash");

        if (!user) {
            return res.status(404).json({message: "User not found"})
        }

        req.user = user;

        next();
    } catch (err) {
        console.log("An error occurred while verifying a token: ", err.message);
        res.status(500).json({message: "Internal server error"});
    }
}