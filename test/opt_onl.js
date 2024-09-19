const fs = require('fs');

function extractQuestions(text) {
    const questions = [];
    const lines = text.split('\n');
    for (const line of lines) {
        if (/^\d+\./.test(line)) {
            questions.push(line.trim());
        }
    }
    return questions;
}

function formatQuestion(question, index) {
    const bengaliNumbers = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    const questionNumber = index + 1;
    const bengaliNumber = `${bengaliNumbers[Math.floor(questionNumber / 10)]}${bengaliNumbers[questionNumber % 10]}`;
    
    // Remove the original question number and trim
    const questionText = question.split('.').slice(1).join('.').trim();
    
    return `প্রশ্ন ${bengaliNumber}: ${questionText}\n\n`;
}

// Read the input text
fs.readFile('input_text.txt', 'utf8', (err, data) => {
    if (err) {
        console.error('Error reading file:', err);
        return;
    }

    // Extract questions
    const questions = extractQuestions(data);

    // Format and write questions to ques.txt
    let formattedQuestions = '';
    questions.forEach((q, index) => {
        formattedQuestions += formatQuestion(q, index);
    });

    fs.writeFile('ques.txt', formattedQuestions, 'utf8', (err) => {
        if (err) {
            console.error('Error writing file:', err);
        } else {
            console.log('Questions have been saved to ques.txt');
        }
    });
});