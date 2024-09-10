require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const questionsRouter = require('./routes/questions');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
app.use(bodyParser.json());
app.use(express.json());
app.use('/api/questions', questionsRouter);

mongoose.connect('mongodb://localhost:27017/yourDatabase', { useNewUrlParser: true, useUnifiedTopology: true });

const topicSchema = new mongoose.Schema({
    name: String,
    subtopics: [{ name: String, questions: Array }]
});

const Topic = mongoose.model('Topic', topicSchema);

const questionsCache = new Map();

async function loadQuestionsToCache() {
    try {
        const client = await MongoClient.connect(process.env.MONGODB_URI);
        const db = client.db(dbName);
        const questionsCollection = db.collection('questions');

        const questions = await questionsCollection.find().toArray();
        questions.forEach(question => {
            questionsCache.set(question._id.toString(), question);
        });

        client.close();
        console.log('Questions loaded to cache');
    } catch (error) {
        console.error('Error loading questions to cache:', error);
    }
}

// Call this function when the server starts
loadQuestionsToCache();

app.get('/api/questions/topics', async (req, res) => {
    try {
        const topics = await Topic.find({}, 'name');
        res.json(topics);
    } catch (error) {
        console.error('Error fetching topics:', error);
        res.status(500).send('Error fetching topics');
    }
});

app.get('/api/questions/subtopics/:topic', async (req, res) => {
    try {
        const topic = await Topic.findOne({ name: req.params.topic }, 'subtopics');
        if (topic) {
            const classifiedSubtopics = topic.subtopics.reduce((acc, subtopic) => {
                const subsValue = subtopic.questions[0]?.subs || 1;
                if (!acc[subsValue]) {
                    acc[subsValue] = [];
                }
                acc[subsValue].push({
                    name: subtopic.name,
                    count: subtopic.questions.length,
                    info: subtopic.questions[0]?.info || '' // Include the info field
                });
                return acc;
            }, {});
            res.json(classifiedSubtopics);
        } else {
            res.json({});
        }
    } catch (error) {
        console.error('Error fetching subtopics:', error);
        res.status(500).send('Error fetching subtopics');
    }
});

app.post('/api/questions/save-json', async (req, res) => {
    try {
        const { topicName, subtopicName, jsonData, subtopicInfo } = req.body;
        
        // Save the subtopic info
        if (subtopicInfo) {
            await db.collection('subtopics').updateOne(
                { topic: topicName, name: subtopicName },
                { $set: { info: subtopicInfo } },
                { upsert: true }
            );
        }

        let topic = await Topic.findOne({ name: topicName });
        if (!topic) {
            topic = new Topic({ name: topicName, subtopics: [] });
        }

        let subtopic = topic.subtopics.find(sub => sub.name === subtopicName);
        if (!subtopic) {
            subtopic = { name: subtopicName, questions: [] };
            topic.subtopics.push(subtopic);
        }

        subtopic.questions = jsonData;

        await topic.save();
        res.json({ message: 'Questions saved successfully' });
    } catch (error) {
        console.error('Error saving questions:', error);
        res.status(500).json({ error: 'Failed to save questions' });
    }
});

app.post('/api/questions/suggest-correction', async (req, res) => {
    const { questionId, correctedQuestion, correctedAnswer, reason } = req.body;

    try {
        const client = await MongoClient.connect(process.env.MONGODB_URI);
        const db = client.db(dbName);
        const correctionsCollection = db.collection('corrections');

        await correctionsCollection.insertOne({
            questionId: new ObjectId(questionId),
            correctedQuestion,
            correctedAnswer,
            reason,
            status: 'pending',
            createdAt: new Date(),
        });

        client.close();
        res.json({ success: true, message: 'Correction suggestion submitted successfully' });
    } catch (error) {
        console.error('Error submitting correction:', error);
        res.status(500).json({ success: false, message: 'Failed to submit correction' });
    }
});

// Add this new route for the admin interface
app.get('/api/questions/corrections', async (req, res) => {
    try {
        const client = await MongoClient.connect(process.env.MONGODB_URI);
        const db = client.db(dbName);
        const correctionsCollection = db.collection('corrections');

        const corrections = await correctionsCollection.find({ status: 'pending' }).toArray();

        client.close();
        res.json(corrections);
    } catch (error) {
        console.error('Error fetching corrections:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch corrections' });
    }
});

app.post('/api/questions/approve-correction', async (req, res) => {
    const { correctionId } = req.body;

    try {
        const client = await MongoClient.connect(process.env.MONGODB_URI);
        const db = client.db(dbName);
        const correctionsCollection = db.collection('corrections');
        const questionsCollection = db.collection('questions');

        const correction = await correctionsCollection.findOne({ _id: new ObjectId(correctionId) });

        if (!correction) {
            client.close();
            return res.status(404).json({ success: false, message: 'Correction not found' });
        }

        const questionId = correction.questionId.toString();
        let updatedQuestion;

        if (correction.type === 'option_correction') {
            updatedQuestion = {
                ...questionsCache.get(questionId),
                options: correction.correctedOptions,
                correct_answer: correction.correctedAnswer,
            };
        } else {
            updatedQuestion = {
                ...questionsCache.get(questionId),
                question_text: correction.correctedQuestion,
                correct_answer: correction.correctedAnswer,
            };
        }

        await questionsCollection.updateOne(
            { _id: correction.questionId },
            { $set: updatedQuestion }
        );

        questionsCache.set(questionId, updatedQuestion);

        await correctionsCollection.updateOne(
            { _id: new ObjectId(correctionId) },
            { $set: { status: 'approved' } }
        );

        client.close();
        res.json({ success: true, message: 'Correction approved and question updated' });
    } catch (error) {
        console.error('Error approving correction:', error);
        res.status(500).json({ success: false, message: 'Failed to approve correction' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});