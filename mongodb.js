const { MongoClient } = require('mongodb');

// Define your MongoDB connection URL and database name
const url = "mongodb://localhost:27017";
const dbName = 'mydatabase';


// Create a new MongoClient
const client = new MongoClient(url, {
    useNewUrlParser: true,
});

// Connect to the database
const connectToDb = async () => {
    try {
        await client.connect();
        console.log("Connected to MongoDB");
        console.log("Connected to MongoDB");
        return client.db(dbName).collection('users'); // Name of your collection
    } catch (err) {
        console.error('Failed to connect to MongoDB', err);
        throw err;
    }
}

module.exports = connectToDb();
