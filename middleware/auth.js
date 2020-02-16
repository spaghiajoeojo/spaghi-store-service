const jwt = require("jsonwebtoken");
const config = require("config");

module.exports = function (req, res, next) {
    //get the token from the header if present
    const token = req.headers["x-access-token"] || req.headers["authorization"];
    //if no token found, return response (without going to the next middelware)
    if (!token && res) {
        return res.status(401).send("Access denied. No token provided.");
    }

    try {
        //if can verify the token, set req.user and pass to next middleware
        const decoded = jwt.verify(token, config.get("token_salt"));
        if (decoded.expiration < new Date().getTime() && decoded.expiration != -1) {
            throw new Error("Invalid token");
        }
        req.user = decoded;
        next();
    } catch (ex) {
        //if invalid token
        if (res) {
            res.status(400).send("Invalid token.");
        }
        next(ex);
    }
};