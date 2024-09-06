# Adding a New Question Set to the Quiz System

If you want to add a new JSON question file (e.g., `algo3.js`) to the quiz system, you'll need to modify the following files:

1. `data/algo3.js`
2. `routes/questions.js`
3. `public/index.html`

## Steps to Add a New Question Set

### 1. Create the new question file

Create a new file `algo3.js` in the `data` folder with your questions in the following format:

```javascript
module.exports = [
  {
    question_id: 1,
    question_text: "Your question here?",
    options: [
      { text: "Option A", value: "A" },
      { text: "Option B", value: "B" },
      { text: "Option C", value: "C" },
      { text: "Option D", value: "D" },
    ],
    correct_answer: "B",
  },
  // Add more questions...
];

```

2. Update routes/questions.js
Modify the routes/questions.js file to include the new question set:
```

const express = require('express');
const router = express.Router();
const algo1Data = require('../data/algo1');
const algo2Data = require('../data/algo2');
const quizData = require('../data/quizData');
const algo3Data = require('../data/algo3'); // Add this line

const allData = {
  algo1: algo1Data,
  algo2: algo2Data,
  quiz: quizData,
  algo3: algo3Data // Add this line
};

// The rest of the file remains the same```
```
3. Update public/index.html
Add a new option to the topic dropdown in the public/index.html file:
```
<select id="topic">
    <option value="" disabled selected>Select a topic</option>
    <option value="algo1">Algorithm 1</option>
    <option value="algo2">Algorithm 2</option>
    <option value="quiz">General Quiz</option>
    <option value="algo3">Algorithm 3</option> <!-- Add this line -->
</select>

```



