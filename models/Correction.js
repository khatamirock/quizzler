const mongoose = require('mongoose');

const correctionSchema = new mongoose.Schema({
    questionId: mongoose.Schema.Types.ObjectId,
    currentAnswer: String,
    suggestedAnswer: String,
    timestamp: { type: Date, default: Date.now }
});

const Correction = mongoose.model('Correction', correctionSchema);

module.exports = Correction;