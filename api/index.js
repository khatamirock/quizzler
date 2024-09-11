const express = require('express');
const cors = require('cors');
const path = require('path'); // Add this line
const questionsRouter = require('../routes/questions');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/questions', questionsRouter);

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, '../public')));

 
 
// Catch-all route to serve the index.html for any unmatched routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

module.exports = app;
