const jwt = require('jsonwebtoken');
const { ObjectId } = require('mongodb')
const config = require('../config')
const utils = require('../utils')
const SECRET_KEY = process.env.SECRET_KEY || 'secret key'
const { hashPassword } = require('../utils');


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
    const { usersCollection } = config.getDb();
    const { firstName, lastName, email, password } = req.body;
    try {
        if (!usersCollection) {
            return res.status(500).send('usersCollection not initialized.');
        }

        const hashedPassword = await hashPassword(password);

        const newUser = {
            firstName,
            lastName,
            email,
            password: hashedPassword,
            playerIds: [],
        };
        const result = await usersCollection.insertOne(newUser);

        if (result.insertedId) {
            // Retrieve the newly created user (with _id)
            const user = await usersCollection.findOne({ _id: result.insertedId });
            if (!user) {
                return res.status(500).json({ message: 'User not found after creation.' });
            }
            // Generate tokens with user data
            const accessToken = jwt.sign({ userId: user._id, username: user.email }, SECRET_KEY, {
                expiresIn: '15m',
            });
            const refreshToken = jwt.sign({ userId: user._id, username: user.email }, SECRET_KEY, {
                expiresIn: '7d',
            });

            res.status(201).json({
                message: 'User added successfully',
                userId: result.insertedId,
                accessToken,
                refreshToken,
            });
        } else {
            res.status(500).json({ message: 'Failed to add user' });
        }
    } catch (error) {
        console.error('Error adding user:', error);
        res.status(500).json({ message: 'Error adding user', error: error.message });
    }
};

module.exports = {
    login,
    refreshToken,
    createUser
}