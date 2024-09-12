const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
    topic: String,
    subtopic: String,
    score: Number,
    totalQuestions: Number,
    timestamp: Date
});

module.exports = mongoose.model('Result', resultSchema);