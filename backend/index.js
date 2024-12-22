require('dotenv').config();
const express = require('express');
const { MongoClient, ServerApiVersion } = require('mongodb');
const cors = require('cors');
const app = express();
const port = 5000;

const uri = `mongodb+srv://colemanz:DB_PASSWORD@cluster0.9cgc3.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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

app.post('/login', async (req, res) => {
    try {
        const user = req.body;
        const result = await usersCollection.findOne({ email: user.email }); // Changed to search by email
        if (result) {
             res.json({ message: "logged in" });
        } else {
            res.status(401).send("user not found");
        }
    } catch (error) {
        res.status(500).send("There was an error logging you in", error);
    }
});


app.post('/users', async (req, res) => {
    try {
        if (!usersCollection) {
            return res.status(500).send('usersCollection not initialized.');
        }
        const newUser = req.body;
        const result = await usersCollection.insertOne(newUser);
        res.status(201).json({ message: 'User added!', insertedId: result.insertedId });
    } catch (err) {
        console.error("Error adding user:", err);
        res.status(500).send("Error adding user");
    }
});


app.get('/users', async (req, res) => {
    try {
        if (!usersCollection) {
            return res.status(500).send('usersCollection not initialized.');
        }
        console.log("About to fetch users from the DB");
        const email = req.query.email;  // Get email from query parameters
        if(!email){
            return res.status(400).send("Email required as a query parameter");
        }
        const user = await usersCollection.findOne({ email: email });
        console.log("Fetched user:", user);
        res.json(user);
    } catch (err) {
        console.error("Error fetching user:", err);
        res.status(500).send("Error fetching user");
    }
});


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