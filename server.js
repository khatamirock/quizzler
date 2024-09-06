const app = require('./api/index');
const { connectToDatabase } = require('./db');

const PORT = process.env.PORT || 3000;

connectToDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch(error => {
  console.error('Failed to connect to the database', error);
  process.exit(1);
});