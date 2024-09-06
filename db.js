require('dotenv').config();
const { MongoClient } = require('mongodb');

let cachedDb = null;

async function connectToDatabase(dbName = null) {
  if (cachedDb && (!dbName || cachedDb.databaseName === dbName)) {
    console.log('Using cached database connection');
    return cachedDb;
  }

  try {
    console.log('Connecting to MongoDB...');
    const uri = dbName ? `${process.env.MONGO_URI}/${dbName}` : process.env.MONGO_URI;
    const client = await MongoClient.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB successfully');

    const db = client.db(dbName);
    cachedDb = db;
    return db;
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    throw error;
  }
}

module.exports = { connectToDatabase };