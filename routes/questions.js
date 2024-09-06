const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { connectToDatabase } = require('../db');

const loadData = (topic, subtopic) => {
  const filePath = path.join(__dirname, `../data/${topic}/${subtopic}.js`);
  if (fs.existsSync(filePath)) {
    return require(filePath);
  }
  return null;
};

// Add this new route to get available subtopics
router.get('/subtopics/:topic', (req, res) => {
  const { topic } = req.params;
  const topicPath = path.join(__dirname, `../data/${topic}`);
  
  if (fs.existsSync(topicPath) && fs.lstatSync(topicPath).isDirectory()) {
    const subtopics = fs.readdirSync(topicPath)
      .filter(file => file.endsWith('.js'))
      .map(file => file.replace('.js', ''));
    res.json(subtopics);
  } else {
    res.json([]);
  }
});

router.get('/:topic/:subtopic/:count', (req, res) => {
  const { topic, subtopic, count } = req.params;
  const topicData = loadData(topic, subtopic);

  if (!topicData || !Array.isArray(topicData)) {
    return res.status(400).json({ error: 'Invalid topic or data format' });
  }

  const shuffled = [...topicData].sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, Math.min(parseInt(count), shuffled.length));
  res.json(selected);
});

// Update the submit-result route
router.post('/submit-result', async (req, res) => {
  const { topic, subtopic, score, totalQuestions } = req.body;
  try {
    const db = await connectToDatabase();
    const result = await db.collection('quiz_results').insertOne({
      topic,
      subtopic,
      score,
      totalQuestions,
      timestamp: new Date()
    });
    res.json({ message: 'Result saved successfully', id: result.insertedId });
  } catch (error) {
    console.error('Error saving result:', error);
    res.status(500).json({ error: 'Failed to save result' });
  }
});

// Update the dashboard route
router.get('/dashboard', async (req, res) => {
  try {
    const db = await connectToDatabase();
    const results = await db.collection('quiz_results').find({}).toArray();
    console.log('Dashboard results:', results);
    res.json(results);
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

module.exports = router;