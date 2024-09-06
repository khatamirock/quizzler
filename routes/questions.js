const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { getDb } = require('../db');

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

router.post('/submit-result', async (req, res) => {
  const { topic, subtopic, score, totalQuestions } = req.body;
  const db = getDb();

  try {
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

module.exports = router;