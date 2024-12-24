const jwt = require('jsonwebtoken');
const { ObjectId } = require('mongodb')
const config = require('../config')
const utils = require('../utils')
const SECRET_KEY = process.env.SECRET_KEY || 'secret key'

const login = async (req, res) => {
    const { email, password } = req.body;
     const {usersCollection } = config.getDb()
    try {
        if(!usersCollection){
            return res.status(500).send({ message: "usersCollection not initialized" });
        }
        const user = await usersCollection.findOne({ email: email });

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        //const passwordMatch = await bcrypt.compare(password, user.password);

       //if (!passwordMatch) {
        //    return res.status(401).json({ message: 'Invalid credentials' });
       //}
        const accessToken = jwt.sign({ userId: user._id, username: user.username }, SECRET_KEY, {
            expiresIn: '15m',
        });

        const refreshToken = jwt.sign({ userId: user._id, username: user.username }, SECRET_KEY, {
            expiresIn: '7d',
        });

        res.json({ accessToken: accessToken, refreshToken: refreshToken });
    } catch (error) {
        console.error("Error logging in", error)
        res.status(500).send({message: "There was an error logging you in", error: error.message}); // use res.status().send()
    }
};


const refreshToken = (req, res) => {
    const refreshToken = req.body.refreshToken;
    if (!refreshToken) {
      return res.sendStatus(401);
    }

    jwt.verify(refreshToken, SECRET_KEY, (err, user) => {
        if (err) {
            return res.sendStatus(403);
        }
        const accessToken = jwt.sign(
            { userId: user.userId, username: user.username },
            SECRET_KEY,
            {
                expiresIn: '15m',
            }
        );
        res.json({ accessToken: accessToken });
    });
};

const createUser = async (req, res) => {
    try {
        const {usersCollection } = config.getDb()
        if (!usersCollection) {
            return res.status(500).send('usersCollection not initialized.');
        }
        const {username, email, password } = req.body;
        const hashedPassword = await utils.hashPassword(password);
        const newUser = {
            username: username,
            email: email,
            password: hashedPassword
        }
        const result = await usersCollection.insertOne(newUser);
        res.status(201).json({ message: 'User added!', insertedId: result.insertedId });
    } catch (err) {
        console.error("Error adding user:", err);
         res.status(500).send({message: "Error adding user", error: err.message });
    }
};

module.exports = {
    login,
    refreshToken,
    createUser
}