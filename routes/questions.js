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

// Update this route to use async/await
router.get('/topics', async (req, res) => {
  const dataPath = path.join(__dirname, '..', 'data');
  
  try {
    console.log(`Checking data path: ${dataPath}`);
    console.log(`Full resolved data path: ${path.resolve(dataPath)}`);
    const stats = await fs.stat(dataPath);
    if (stats.isDirectory()) {
      const files = await fs.readdir(dataPath);
      console.log('Files in data directory:', files);
      const topics = await Promise.all(files.map(async (file) => {
        const filePath = path.join(dataPath, file);
        const fileStat = await fs.stat(filePath);
        return fileStat.isDirectory() ? file : null;
      }));
      const validTopics = topics.filter(topic => topic !== null);
      console.log('Available topics:', validTopics);
      res.json(validTopics);
    } else {
      console.log('Data path is not a directory');
      res.status(500).json({ error: 'Data directory not found' });
    }
  } catch (error) {
    console.error('Error reading topics:', error);
    res.status(500).json({ error: 'Failed to read topics', details: error.message, path: dataPath });
  }
});

// Update this route to handle subtopics correctly and provide more informative feedback
router.get('/subtopics/:topic', async (req, res) => {
  const { topic } = req.params;
  const topicPath = path.join(__dirname, '..', 'data', topic);
  
  try {
    console.log(`Checking path: ${topicPath}`);
    console.log(`Full resolved path: ${path.resolve(topicPath)}`);
    const stats = await fs.stat(topicPath);
    if (stats.isDirectory()) {
      const files = await fs.readdir(topicPath);
      const subtopics = files
        .filter(file => file.endsWith('.js'))
        .map(file => file.replace('.js', ''));
      console.log('Available subtopics for topic', topic, ':', subtopics);
      res.json(subtopics);
    } else {
      console.log(`Path exists but is not a directory: ${topicPath}`);
      res.status(404).json({ error: 'Topic not found', details: 'The specified topic is not a directory' });
    }
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.error(`Topic directory does not exist: ${topicPath}`);
      res.status(404).json({ error: 'Topic not found', details: 'The specified topic directory does not exist' });
    } else {
      console.error(`Error reading subtopics for topic "${topic}":`, error);
      res.status(500).json({ error: 'Failed to read subtopics', details: error.message, path: topicPath });
    }
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
  console.log('Received save-json request:', { topicName, subtopicName, jsonData });

  try {
    // Create the directory if it doesn't exist
    const dir = path.join(__dirname, '..', 'data', topicName);
    await fs.mkdir(dir, { recursive: true });

    // Write the JSON data to a file
    const filePath = path.join(dir, `${subtopicName}.js`);
    await fs.writeFile(filePath, `module.exports = ${JSON.stringify(jsonData, null, 2)};`);
    console.log('JSON data saved to:', filePath);

    res.json({ message: 'JSON data saved successfully' });
  } catch (error) {
    console.error('Error saving JSON data:', error);
    res.status(500).json({ error: 'Failed to save JSON data' });
  }
});

module.exports = router;