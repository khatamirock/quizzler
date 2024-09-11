require('dotenv').config();
const { MongoClient } = require('mongodb');

let cachedDb = null;

async function connectToDatabase(dbName = 'data') {
  if (cachedDb) {
    return cachedDb;
  }

  const client = await MongoClient.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  const db = client.db(dbName);
  cachedDb = db;
  return db;
}

module.exports = { connectToDatabase };