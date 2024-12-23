require('dotenv').config();
const { ObjectId, MongoClient, ServerApiVersion } = require('mongodb');
const express = require('express');
const cors = require('cors');
const app = express();
const port = 5000;

const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { ContactSupportOutlined } = require('@mui/icons-material');

const SECRET_KEY = "" // Store in environment variable in production

const uri = `mongodb+srv://colemanz:@cluster0.9cgc3.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

app.use(cors());
app.use(express.json());
let usersCollection;

async function run() {
    try {
        await client.connect();
        console.log("Connected to MongoDB!");
        const db = client.db("mlb_stats");
        usersCollection = db.collection("users");
    } catch (err) {
        console.error("Error connecting to MongoDB:", err);
    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Hello, World!');
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

process.on('exit', async () => {
    await client.close();
    console.log("MongoDB connection closed");
});

// Login route (generate token)
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await usersCollection.findOne({ email: email });

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        //const passwordMatch = await bcrypt.compare(password, user.password);

        //if (!passwordMatch) {
            //return res.status(401).json({ message: 'Invalid credentials' });
        //}
          
        const accessToken = jwt.sign({ userId: user._id, username: user.username }, SECRET_KEY, {
            expiresIn: '15m',
        });

        const refreshToken = jwt.sign({ userId: user._id, username: user.username }, SECRET_KEY, {
            expiresIn: '7d',
        });

        res.json({ accessToken: accessToken, refreshToken: refreshToken });
    } catch (error) {
        res.status(500).send("There was an error logging you in", error);
    }
});


app.post('/users', async (req, res) => {
    try {
        if (!usersCollection) {
            return res.status(500).send('usersCollection not initialized.');
        }
        const {username, email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = {
            username: username,
            email: email,
            password: hashedPassword
        }
        const result = await usersCollection.insertOne(newUser);
        res.status(201).json({ message: 'User added!', insertedId: result.insertedId });
    } catch (err) {
        console.error("Error adding user:", err);
        res.status(500).send("Error adding user");
    }
});


app.get('/users', authenticateToken, async (req, res) => {
    try {
        if (!usersCollection) {
            return res.status(500).send('usersCollection not initialized.');
        }
        console.log("About to fetch users from the DB");
        const user = await usersCollection.findOne({ _id: new ObjectId(req.user.userId) });
        console.log("Fetched user:", user.firstName);
        res.json(user);
    } catch (err) {
        console.error("Error fetching user:", err);
        res.status(500).send("Error fetching user");
    }
});

// Middleware for token verification
function authenticateToken(req, res, next) {
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

// Refresh Token Route
app.post('/token', (req, res) => {
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
});