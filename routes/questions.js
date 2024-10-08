const express = require('express');
const router = express.Router();
const { connectToDatabase } = require('../db');
const { ObjectId } = require('mongodb');

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
  console.log(`Fetching subtopics for topic: ${topic}`); // Debug info

  try {
    const db = await connectToDatabase('data');
    const collections = await db.listCollections().toArray();
    const subtopics = collections.map(col => col.name);

    console.log(`Found collections:`, subtopics); // Debug info

    const classifiedSubtopics = {};
    const uniqueSubs = new Set();

    for (const subtopic of subtopics) {
      if (subtopic.toLowerCase().includes(topic.toLowerCase())) {
        const collection = db.collection(subtopic);
        const subsFields = await collection.find({}, { projection: { subs: 1, info: 1 } }).toArray();
        
        console.log(`Subtopic ${subtopic} has ${subsFields.length} documents`); // Debug info

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

    for (const subsValue in classifiedSubtopics) {
      classifiedSubtopics[subsValue] = Array.from(classifiedSubtopics[subsValue]);
    }

    for (const subsValue in classifiedSubtopics) {
      classifiedSubtopics[subsValue] = classifiedSubtopics[subsValue].slice(0, Math.ceil(classifiedSubtopics[subsValue].length / 2));
    }

    for (const subsValue in classifiedSubtopics) {
      classifiedSubtopics[subsValue] = await Promise.all(classifiedSubtopics[subsValue].map(async subtopic => {
        const [subtopicName, subs] = subtopic.split('-');
        const count = await db.collection(subtopicName).countDocuments({ subs: parseInt(subs) });
        
        // Fetch the info field for the first document with matching subs
        const infoDoc = await db.collection(subtopicName).findOne({ subs: parseInt(subs) }, { projection: { info: 1 } });
        const info = infoDoc && infoDoc.info ? infoDoc.info : 'No extra info added';
        
        return { name: subtopic, count, info };
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
    try {
        const { topic, subtopic, score, totalQuestions, info, password } = req.body;
        
        console.log('Received quiz result:', { topic, subtopic, score, totalQuestions, info });

        if (!topic || score === undefined || totalQuestions === undefined || !password) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Check if the provided password matches the environment variable
        let isPasswordCorrect = false;
        let attempts = 0;
        const maxAttempts = 3;

        while (!isPasswordCorrect && attempts < maxAttempts) {
            if (password === process.env.ADMIN_PASSWORD) {
                isPasswordCorrect = true;
            } else {
                attempts++;
                if (attempts < maxAttempts) {
                    // Ask for password again
                    const retryResponse = await new Promise(resolve => {
                        res.json({ status: 'retry', message: 'Incorrect password. Please try again.' });
                        req.once('data', chunk => {
                            resolve(JSON.parse(chunk));
                        });
                    });
                    if (retryResponse.password === process.env.ADMIN_PASSWORD) {
                        isPasswordCorrect = true;
                    }
                }
            }
        }

        if (!isPasswordCorrect) {
            return res.status(401).json({ error: 'Unauthorized: Incorrect password after multiple attempts' });
        }

        const db = await connectToDatabase();
        
        // Check if a result for this quiz attempt already exists
        const existingResult = await db.collection('quiz_results').findOne({
            topic,
            subtopic,
            timestamp: { $gte: new Date(Date.now() - 5000) } // Check for results in the last 5 seconds
        });

        if (existingResult) {
            console.log('Duplicate submission detected. Ignoring.');
            return res.json({ message: 'Result already saved' });
        }

        const result = {
            topic,
            subtopic: subtopic || null, // Use null if subtopic is not provided
            score,
            totalQuestions,
            info: info || 'No info available',
            timestamp: new Date()
        };

        await db.collection('quiz_results').insertOne(result);
        console.log('Result saved successfully:', result);
        res.json({ message: 'Result saved successfully' });
    } catch (error) {
        console.error('Error saving result:', error);
        res.status(500).json({ error: 'Failed to save result', details: error.message });
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

// Add this new route after the '/dashboard-topics' route
router.get('/dashboard-subtopics/:topic', async (req, res) => {
  try {
    const db = await connectToDatabase();
    const { topic } = req.params;
    const subtopics = await db.collection('quiz_results').distinct('subtopic', { topic: topic });
    res.json(subtopics);
  } catch (error) {
    console.error('Error fetching dashboard subtopics:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard subtopics' });
  }
});

// Update the dashboard route to accept both topic and subtopic filters
router.get('/dashboard/:topic?/:subtopic?', async (req, res) => {
  try {
    const db = await connectToDatabase();
    const { topic, subtopic } = req.params;
    let query = {};
    if (topic) {
      query.topic = topic;
    }
    if (subtopic) {
      query.subtopic = subtopic;
    }
    const results = await db.collection('quiz_results').find(query).toArray();
    console.log('Dashboard results:', results);
    res.json(results);
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
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
  const { topicName, subtopicName, jsonData, password } = req.body;

  // Check if the provided password matches the environment variable
  if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized: Incorrect password' });
  }

  try {
    const db = await connectToDatabase('data');
    const collection = db.collection(topicName);

    // Insert the new questions
    await collection.insertMany(jsonData);

    res.json({ message: 'JSON data saved successfully' });
  } catch (error) {
    console.error('Error saving JSON data:', error);
    res.status(500).json({ error: 'Failed to save JSON data' });
  }
});

router.post('/suggest-option-correction', async (req, res) => {
    const { questionId, correctedOptions, correctedAnswer, topic, password, explain } = req.body;

    // Check if the provided password matches the environment variable
    if (password !== process.env.ADMIN_PASSWORD) {
        return res.status(401).json({ success: false, message: 'Unauthorized: Incorrect password' });
    }

    try {
        console.log('Received option correction request:', { questionId, correctedOptions, correctedAnswer, topic });

        const db = await connectToDatabase('data');
        
        // Use the topic as the collection name if provided
        const collectionName = topic || 'questions';
        const collection = db.collection(collectionName);

        // Check if the question exists
        const existingQuestion = await collection.findOne({ _id: new ObjectId(questionId) });
        if (!existingQuestion) {
            throw new Error(`Question with ID ${questionId} not found in collection ${collectionName}`);
        }

        // Update the question directly in the database
        const updateResult = await collection.updateOne(
            { _id: new ObjectId(questionId) },
            { 
                $set: {
                    options: correctedOptions,
                    correct_answer: correctedAnswer,
                    explain: explain
                }
            }
        );

        console.log('Update result:', updateResult);

        if (updateResult.matchedCount === 0) {
            throw new Error(`No question found with ID ${questionId} in collection ${collectionName}`);
        }

        if (updateResult.modifiedCount === 0) {
            throw new Error('Question found but not modified. Possibly no changes were made.');
        }

        res.json({ success: true, message: 'Question updated successfully' });
    } catch (error) {
        console.error('Error updating question:', error);
        res.status(500).json({ success: false, message: `Failed to update question: ${error.message}` });
    }
});

// Add this new route to handle subset deletion
router.delete('/delete-subset/:topic/:subsValue', async (req, res) => {
    const { topic, subsValue } = req.params;
    const { password } = req.body;
    console.log(`Attempting to delete subset ${subsValue} for topic ${topic}`);

    // Check if the provided password matches the environment variable
    if (password !== process.env.ADMIN_PASSWORD) {
        return res.status(401).json({ error: 'Unauthorized: Incorrect password ?? reallie ?/' });
    }

    try {
        const db = await connectToDatabase('data');
        const collection = db.collection(topic);

        // Delete all documents with the specified subs value
        const result = await collection.deleteMany({ subs: parseInt(subsValue) });

        console.log(`Deletion result:`, result);

        if (result.deletedCount > 0) {
            res.json({ message: `Subset ${subsValue} deleted successfully`, deletedCount: result.deletedCount });
        } else {
            res.status(404).json({ error: `No questions found for subset ${subsValue}` });
        }
    } catch (error) {
        console.error('Error deleting subset:', error);
        res.status(500).json({ error: 'Failed to delete subset', details: error.message });
    }
});

router.post('/add', async (req, res) => {
    try {
        const { topic, subtopic, question_text, options, correct_answer, password } = req.body;
        
        // Check if the provided password matches the environment variable
        if (password !== process.env.ADMIN_PASSWORD) {
            return res.status(401).json({ error: 'Unauthorized: Incorrect password' });
        }

        const newQuestion = {
            question_id: Date.now(), // You might want to use a more robust ID generation method
            subs: 1, // You might want to determine this value based on your logic
            info: "",
            question_text,
            options,
            correct_answer
        };

        const db = await connectToDatabase('data');
        const collection = db.collection(topic);
        await collection.insertOne(newQuestion);

        res.json({ message: 'Question added successfully', question: newQuestion });
    } catch (error) {
        console.error('Error adding question:', error);
        res.status(500).json({ error: 'Failed to add question' });
    }
});

// Add this new route to save incorrect answers
router.post('/save-incorrect-answers', async (req, res) => {
    const { topic, subtopic, incorrectAnswers, password } = req.body;

    // Check if the provided password matches the environment variable
    if (password !== process.env.ADMIN_PASSWORD) {
        return res.status(401).json({ error: 'Unauthorized: Incorrect password' });
    }

    try {
        const db = await connectToDatabase();
        // Incorrect Answer
        const collection = db.collection('Incorrect Answer');

        // Insert each incorrect answer as a separate document, but only if it doesn't already exist
        const results = await Promise.all(incorrectAnswers.map(async (answer) => {
            const existingQuestion = await collection.findOne({ question_id: answer.question_id });
            if (!existingQuestion) {
                return collection.insertOne({
                    question_id: answer.question_id,
                    subs: answer.subs,
                    info: answer.info,
                    question_text: answer.question_text,
                    options: answer.options,
                    correct_answer: answer.correct_answer,
                    timestamp: new Date()
                });
            }
            return null;
        }));

        const insertedIds = results.filter(result => result !== null).map(result => result.insertedId);

        res.json({ message: 'Incorrect answers saved successfully', insertedIds });
    } catch (error) {
        console.error('Error saving incorrect answers:', error);
        res.status(500).json({ error: 'Failed to save incorrect answers', details: error.message });
    }
});

router.post('/remove-correct-answer', async (req, res) => {
    const { questionId } = req.body;

    console.log(`Attempting to remove correct answer for question ID: ${questionId}`);
    
    try {
        const db = await connectToDatabase();
        const collection = db.collection('Incorrect Answer');

        const result = await collection.deleteOne({ question_id: questionId });

        if (result.deletedCount === 1) {
            res.json({ message: 'Correct answer removed successfully' });
        } else {
            res.status(404).json({ error: 'Question not found in incorrect_ans collection' });
        }
    } catch (error) {
        console.error('Error removing correct answer:', error);
        res.status(500).json({ error: 'Failed to remove correct answer', details: error.message });
    }
});

// Add this new route to handle single question deletion
router.delete('/delete-question', async (req, res) => {
    const { questionId, topic, subtopic, password } = req.body;
    console.log(`Attempting to delete question ${questionId} from topic ${topic}`);

    // Check if the provided password matches the environment variable
    if (password !== process.env.ADMIN_PASSWORD) {
        return res.status(401).json({ error: 'Unauthorized: Incorrect password' });
    }

    try {
        const db = await connectToDatabase('data');
        const collection = db.collection(topic);

        // Delete the specific question
        const result = await collection.deleteOne({ _id: new ObjectId(questionId) });

        console.log(`Deletion result:`, result);

        if (result.deletedCount > 0) {
            res.json({ message: `Question deleted successfully`, deletedCount: result.deletedCount });
        } else {
            res.status(404).json({ error: `Question not found` });
        }
    } catch (error) {
        console.error('Error deleting question:', error);
        res.status(500).json({ error: 'Failed to delete question', details: error.message });
    }
});

module.exports = router;