document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('converterForm');
    const resultDiv = document.getElementById('result');
    const topicSelect = document.getElementById('topicSelect');
    const newTopic = document.getElementById('newTopic');
    const subtopicSelect = document.getElementById('subtopicSelect');
    const newSubtopic = document.getElementById('newSubtopic');
    const previewButton = document.getElementById('previewButton');
    const previewArea = document.getElementById('previewArea');
    const jsonPreview = document.getElementById('jsonPreview');
    const saveButton = document.getElementById('saveButton');
    const editButton = document.getElementById('editButton');

    let currentJsonData = null;

    fetchTopics();

    topicSelect.addEventListener('change', () => {
        if (topicSelect.value) {
            fetchSubtopics(topicSelect.value);
            subtopicSelect.disabled = false;
        } else {
            subtopicSelect.innerHTML = '<option value="">Select or create a subtopic</option>';
            subtopicSelect.disabled = true;
        }
    });

    previewButton.addEventListener('click', () => {
        const rawText = document.getElementById('rawText').value;
        currentJsonData = extractQA(rawText);
        jsonPreview.textContent = JSON.stringify(currentJsonData, null, 2);
        form.style.display = 'none';
        previewArea.style.display = 'block';
    });

    editButton.addEventListener('click', () => {
        form.style.display = 'block';
        previewArea.style.display = 'none';
    });

    saveButton.addEventListener('click', async () => {
        const topicName = newTopic.value || topicSelect.value;
        const subtopicName = newSubtopic.value || subtopicSelect.value;

        if (!topicName || !subtopicName) {
            resultDiv.innerHTML = '<p>Error: Please select or create both a topic and subtopic.</p>';
            return;
        }

        try {
            const response = await saveJsonData(topicName, subtopicName, currentJsonData);
            console.log('Server response:', response);
            resultDiv.innerHTML = `<p>${response.message}</p>`;
            
            fetchTopics();
            if (topicSelect.value) {
                fetchSubtopics(topicSelect.value);
            }
            form.style.display = 'block';
            previewArea.style.display = 'none';
        } catch (error) {
            console.error('Error saving JSON data:', error);
            resultDiv.innerHTML = `<p>Error: ${error.message}</p>`;
        }
    });

    // ... (keep the existing fetchTopics and fetchSubtopics functions)

    function extractQA(text) {
        console.log('Raw text input:', text);
        const questions = text.split(/\*\*Ques\s+(\d+)\s+\(Bangla\):\*\*/);
        console.log('Split questions:', questions);
        questions.shift();
        const results = [];

        for (let i = 0; i < questions.length; i += 2) {
            const questionId = parseInt(questions[i]);
            const questionContent = questions[i + 1] || "";

            const [questionText, ...optionsAndAnswer] = questionContent.split(/([a-d]\.)/);
            const options = [];
            let correctAnswer = '';

            for (let j = 0; j < optionsAndAnswer.length; j += 2) {
                const optionLetter = optionsAndAnswer[j].trim().replace('.', '');
                const optionText = optionsAndAnswer[j + 1] || "";

                if (optionText.includes("**Answer:**")) {
                    const [text, answer] = optionText.split("**Answer:**");
                    options.push({
                        text: cleanText(text),
                        value: optionLetter
                    });
                    correctAnswer = answer.trim();
                } else {
                    options.push({
                        text: cleanText(optionText),
                        value: optionLetter
                    });
                }
            }

            results.push({
                question_id: questionId,
                question_text: cleanText(questionText),
                options: options,
                correct_answer: correctAnswer
            });
        }

        console.log('Extracted results:', results);
        return results;
    }

    // ... (keep the existing cleanText and saveJsonData functions)
});

async function fetchTopics() {
    try {
        const response = await fetch('/api/questions/topics');
        const topics = await response.json();
        const topicSelect = document.getElementById('topicSelect');
        topicSelect.innerHTML = '<option value="">Select or create a topic</option>';
        topics.forEach(topic => {
            const option = document.createElement('option');
            option.value = topic;
            option.textContent = topic;
            topicSelect.appendChild(option);
        });
        console.log('Fetched topics:', topics);
    } catch (error) {
        console.error('Error fetching topics:', error);
    }
}

async function fetchSubtopics(topic) {
    try {
        const response = await fetch(`/api/questions/subtopics/${topic}`);
        const subtopics = await response.json();
        const subtopicSelect = document.getElementById('subtopicSelect');
        subtopicSelect.innerHTML = '<option value="">Select or create a subtopic</option>';
        subtopics.forEach(subtopic => {
            const option = document.createElement('option');
            option.value = subtopic;
            option.textContent = subtopic;
            subtopicSelect.appendChild(option);
        });
        console.log('Fetched subtopics for topic', topic, ':', subtopics);
    } catch (error) {
        console.error('Error fetching subtopics:', error);
    }
}

function cleanText(text) {
    return text.replace(/\s+/g, ' ').trim();
}

async function saveJsonData(topicName, subtopicName, jsonData) {
    const response = await fetch('/api/questions/save-json', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            topicName,
            subtopicName,
            jsonData
        }),
    });

    if (!response.ok) {
        throw new Error('Failed to save JSON data');
    }

    return response.json();
}