require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const questionsRouter = require('./routes/questions');

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});