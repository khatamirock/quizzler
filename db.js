require('dotenv').config();
const { MongoClient } = require('mongodb');

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

let dbConnection;

async function connectToDatabase() {
  if (dbConnection) return dbConnection;
  
  try {
    // Check if we're already connected
    if (client.topology && client.topology.isConnected()) {
      dbConnection = client.db(process.env.DB_NAME);
      return dbConnection;
    }

    // If not connected, connect now
    await client.connect();
    dbConnection = client.db(process.env.DB_NAME);
    console.log('Connected to MongoDB');
    return dbConnection;
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    throw error;
  }
}

module.exports = { connectToDatabase };