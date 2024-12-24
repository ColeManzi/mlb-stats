const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.9cgc3.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

let dbInstance = null; // Store a db instance.

async function init(){
   try {
     await client.connect();
     console.log("Connected to MongoDB!");
     const db = client.db("mlb_stats");
     dbInstance = {
      usersCollection : db.collection("users")
     };
     return dbInstance;
   } catch (err) {
     console.error("Error connecting to MongoDB:", err);
     throw err;
    }
}

async function close(){
     await client.close();
}

module.exports = {
    init,
    close,
    getDb : () => dbInstance
};