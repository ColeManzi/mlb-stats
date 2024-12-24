require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./config/db')
const routes = require('./routes')


const app = express();
const port = 5000;


app.use(cors());
app.use(express.json());

// Initialize the connection to mongoDB
db.init().then(() => {
  // Routes
  app.use('/api', routes);

  app.get('/', (req, res) => {
    res.send('Hello, World!');
  });
  
  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
   });
  
   process.on('exit', async () => {
    await db.close();
    console.log("MongoDB connection closed");
   });
});