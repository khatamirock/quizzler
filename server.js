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
        const topic = await Topic.findOne({ name: req.params.topic }, 'subtopics.name');
        res.json(topic ? topic.subtopics : []);
    } catch (error) {
        console.error('Error fetching subtopics:', error);
        res.status(500).send('Error fetching subtopics');
    }
});

app.post('/api/questions/save-json', async (req, res) => {
    const { topicName, subtopicName, jsonData } = req.body;

    try {
        console.log('Received data to save:', { topicName, subtopicName, jsonData });

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
        res.json({ message: 'JSON data saved successfully' });
    } catch (error) {
        console.error('Error saving JSON data:', error);
        res.status(500).send('Error saving JSON data');
    }
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});