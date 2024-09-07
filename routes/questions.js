const express = require('express');
const router = express.Router();
const { connectToDatabase } = require('../db');

// Route to fetch collection names as topics with question counts
router.get('/topics', async (req, res) => {
  try {
    const db = await connectToDatabase('data');
    const collections = await db.listCollections().toArray();
    const topics = await Promise.all(collections.map(async col => {
      const count = await db.collection(col.name).countDocuments();
      return { name: col.name, count };
    }));
    res.json(topics);
  } catch (error) {
    console.error('Error fetching topics:', error);
    res.status(500).json({ error: 'Failed to fetch topics', details: error.message });
  }
});

// Update the subtopics route to fetch collections from the "data" database with question counts
router.get('/subtopics/:topic', async (req, res) => {
  const { topic } = req.params;
  try {
    const db = await connectToDatabase('data');
    const collections = await db.listCollections().toArray();
    const subtopics = collections.map(col => col.name);

    // Find unique `subs` values and classify subtopics
    const classifiedSubtopics = {};
    const uniqueSubs = new Set();

    for (const subtopic of subtopics) {
      if (subtopic.toLowerCase().includes(topic.toLowerCase())) {
        const collection = db.collection(subtopic);
        const subsFields = await collection.find({}, { projection: { subs: 1 } }).toArray();
        
        subsFields.forEach(subsField => {
          const subsValue = subsField && subsField.subs ? subsField.subs : 'other';
          uniqueSubs.add(subsValue);

          if (!classifiedSubtopics[subsValue]) {
            classifiedSubtopics[subsValue] = new Set();
          }
          classifiedSubtopics[subsValue].add(`${subtopic}-${subsValue}`);
        });
      }
    }

    // Convert sets to arrays for JSON serialization
    for (const subsValue in classifiedSubtopics) {
      classifiedSubtopics[subsValue] = Array.from(classifiedSubtopics[subsValue]);
    }

    // Send only half of the unique subtopics
    for (const subsValue in classifiedSubtopics) {
      classifiedSubtopics[subsValue] = classifiedSubtopics[subsValue].slice(0, Math.ceil(classifiedSubtopics[subsValue].length / 2));
    }

    // Add question counts to subtopics
    for (const subsValue in classifiedSubtopics) {
      classifiedSubtopics[subsValue] = await Promise.all(classifiedSubtopics[subsValue].map(async subtopic => {
        const [subtopicName, subs] = subtopic.split('-');
        const count = await db.collection(subtopicName).countDocuments({ subs: parseInt(subs) });
        return { name: subtopic, count };
      }));
    }

    console.log('Unique Subs:', Array.from(uniqueSubs));
    console.log('Classified Subtopics:', classifiedSubtopics);
    res.json(classifiedSubtopics);
  } catch (error) {
    console.error('Error fetching subtopics:', error);
    res.status(500).json({ error: 'Failed to fetch subtopics', details: error.message });
  }
});

// Update the route to fetch questions from the "data" database
router.get('/:topic/:subtopic/:count', async (req, res) => {
  const { topic, subtopic, count } = req.params;
  try {
    const db = await connectToDatabase('data');
    const collection = db.collection(topic);
    const subsValue = parseInt(subtopic.split('-').pop());
    const questions = await collection.find({ subs: subsValue }).toArray();

    if (!questions || !Array.isArray(questions)) {
      return res.status(400).json({ error: 'Invalid topic or data format' });
    }

    const shuffled = [...questions].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, Math.min(parseInt(count), shuffled.length));
    res.json(selected);
  } catch (error) {
    console.error('Error fetching questions:', error);
    res.status(500).json({ error: 'Failed to fetch questions', details: error.message });
  }
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

// Update the dashboard route to accept a topic filter
router.get('/dashboard/:topic?', async (req, res) => {
  try {
    const db = await connectToDatabase();
    const { topic } = req.params;
    let query = {};
    if (topic) {
      query = { topic: topic };
    }
    const results = await db.collection('quiz_results').find(query).toArray();
    console.log('Dashboard results:', results);
    res.json(results);
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Add a new route to fetch all unique topics
router.get('/dashboard-topics', async (req, res) => {
  try {
    const db = await connectToDatabase();
    const topics = await db.collection('quiz_results').distinct('topic');
    res.json(topics);
  } catch (error) {
    console.error('Error fetching dashboard topics:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard topics' });
  }
});

// Update the collections route to use the "data" database
router.get('/collections', async (req, res) => {
  console.log('Attempting to fetch collections...');
  try {
    console.log('Connecting to database...');
    const db = await connectToDatabase('data');
    console.log('Connected to database successfully');

    console.log('Listing collections...');
    const collections = await db.listCollections().toArray();
    console.log('Raw collections data:', collections);

    const collectionNames = collections.map(col => col.name);
    console.log('Collection names:', collectionNames);

    res.json(collectionNames);
  } catch (error) {
    console.error('Error fetching collections:', error);
    res.status(500).json({ error: 'Failed to fetch collections', details: error.message });
  }
});

// Route to save JSON data
router.post('/save-json', async (req, res) => {
  const { topicName, subtopicName, jsonData } = req.body;

  try {
    const db = await connectToDatabase('data');
    const collection = db.collection(topicName);

    // Insert the JSON data into the collection
    const result = await collection.insertMany(jsonData);

    console.log(`Inserted ${result.insertedCount} documents into the collection`);
    res.json({ message: 'JSON data saved successfully', insertedCount: result.insertedCount });
  } catch (error) {
    console.error('Error saving JSON data:', error);
    res.status(500).json({ error: 'Failed to save JSON data', details: error.message });
  }
});

module.exports = router;