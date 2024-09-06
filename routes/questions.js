const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs').promises;
const { connectToDatabase } = require('../db');

const loadData = (topic, subtopic) => {
  const filePath = path.join(__dirname, `../data/${topic}/${subtopic}.js`);
  if (fs.existsSync(filePath)) {
    return require(filePath);
  }
  return null;
};

// Add this new route to get available subtopics
router.get('/subtopics/:topic', async (req, res) => {
  const { topic } = req.params;
  const topicPath = path.join(__dirname, `../data/${topic}`);
  
  try {
    const stats = await fs.stat(topicPath);
    if (stats.isDirectory()) {
      const files = await fs.readdir(topicPath);
      const subtopics = files
        .filter(file => file.endsWith('.js'))
        .map(file => file.replace('.js', ''));
      console.log('Available subtopics for topic', topic, ':', subtopics); // Add this line for debugging
      res.json(subtopics);
    } else {
      res.json([]);
    }
  } catch (error) {
    console.error('Error reading subtopics:', error);
    res.status(500).json({ error: 'Failed to read subtopics' });
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

// Add a new route to save JSON data
router.post('/save-json', async (req, res) => {
  const { topicName, subtopicName, jsonData } = req.body;
  console.log('Received save-json request:', { topicName, subtopicName, jsonData }); // Add this line

  try {
    // Create the directory if it doesn't exist
    const dir = path.join(__dirname, '..', 'data', topicName);
    await fs.mkdir(dir, { recursive: true });

    // Write the JSON data to a file
    const filePath = path.join(dir, `${subtopicName}.js`);
    await fs.writeFile(filePath, `module.exports = ${JSON.stringify(jsonData, null, 2)};`);
    console.log('JSON data saved to:', filePath); // Add this line

    res.json({ message: 'JSON data saved successfully' });
  } catch (error) {
    console.error('Error saving JSON data:', error);
    res.status(500).json({ error: 'Failed to save JSON data' });
  }
});

// Update this route to use async/await
router.get('/topics', async (req, res) => {
  const dataPath = path.join(__dirname, '../data');
  
  try {
    const stats = await fs.stat(dataPath);
    if (stats.isDirectory()) {
      const files = await fs.readdir(dataPath);
      const topics = await Promise.all(files.map(async (file) => {
        const filePath = path.join(dataPath, file);
        const fileStat = await fs.stat(filePath);
        return fileStat.isDirectory() ? file : null;
      }));
      const validTopics = topics.filter(topic => topic !== null);
      console.log('Available topics:', validTopics); // Add this line for debugging
      res.json(validTopics);
    } else {
      res.json([]);
    }
  } catch (error) {
    console.error('Error reading topics:', error);
    res.status(500).json({ error: 'Failed to read topics' });
  }
});

module.exports = router;