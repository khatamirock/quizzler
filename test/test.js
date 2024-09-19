const fs = require('fs');

function extractQuestions(text) {
    const questions = [];
    let currentQuestion = null;
    let options = [];
    let answer = null;

    const lines = text.split('\n');
    for (const line of lines) {
        if (line.startsWith('A.') || line.startsWith('B.') || line.startsWith('C.') || line.startsWith('D.')) {
            options.push(line.trim());
        } else if (line.startsWith('Ans:') || line.startsWith('Answer:')) {
            answer = line.split(':')[1].trim();
        } else if (/^\d+\./.test(line)) {
            if (currentQuestion) {
                questions.push({ question: currentQuestion, options, answer });
            }
            currentQuestion = line.trim();
            options = [];
            answer = null;
        }
    }

    if (currentQuestion) {
        questions.push({ question: currentQuestion, options, answer });
    }

    return questions;
}

function formatQuestion(question, options, answer, index) {
    const bengaliNumbers = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    const bengaliOptions = ['ক', 'খ', 'গ', 'ঘ'];
    
    // Increment the question number by one
    const questionNumber = index + 1;
    
    let formatted = `প্রশ্ন ${bengaliNumbers[Math.floor(questionNumber / 10)]}${bengaliNumbers[questionNumber % 10]}: ${question.split('.').slice(1).join('.').trim()}\n\n`;
    
    options.forEach((option, i) => {
        formatted += `${bengaliOptions[i]}) ${option.split('.')[1].trim()}\n`;
    });
    
    const answerIndex = 'ABCD'.indexOf(answer);
    formatted += `Answer: ${bengaliOptions[answerIndex]}\n\n`;
    
    return formatted;
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
        formattedQuestions += formatQuestion(q.question, q.options, q.answer, index);
    });

    fs.writeFile('ques.txt', formattedQuestions, 'utf8', (err) => {
        if (err) {
            console.error('Error writing file:', err);
        } else {
            console.log('Questions have been saved to ques.txt');
        }
    });
});