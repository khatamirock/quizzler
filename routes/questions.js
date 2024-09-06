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

// Add this new route for the dashboard
router.get('/dashboard', async (req, res) => {
  const db = getDb();

  try {
    const results = await db.collection('quiz_results').aggregate([
      {
        $group: {
          _id: { topic: '$topic', subtopic: '$subtopic' },
          avgScore: { $avg: { $divide: ['$score', '$totalQuestions'] } },
          totalAttempts: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.topic',
          subtopics: {
            $push: {
              name: '$_id.subtopic',
              avgScore: { $multiply: ['$avgScore', 100] },
              totalAttempts: '$totalAttempts'
            }
          }
        }
      }
    ]).toArray();

    res.json(results);
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

module.exports = router;