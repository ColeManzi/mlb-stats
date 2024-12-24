const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.SECRET_KEY;


const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.sendStatus(401); // Unauthorized
    }

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) {
            return res.sendStatus(403); // Forbidden
        }
        req.user = user; // Attach user data to the request
        next();
    });
}

module.exports = {
  authenticateToken
}