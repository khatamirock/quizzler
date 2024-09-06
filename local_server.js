require('dotenv').config();
const app = require('./api/index');
const { connectToDatabase } = require('./db');

const PORT = process.env.PORT || 3000;

async function startServer() {
  await connectToDatabase();
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

startServer();