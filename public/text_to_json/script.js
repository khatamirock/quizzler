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
        const subtopicName = newSubtopic.value || subtopicSelect.value;
        currentJsonData = convertToJSON(rawText, subtopicName);
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
            console.log('Saving JSON data:', { topicName, subtopicName, currentJsonData });
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

    function convertToJSON(inputText, subtopicName) {
        const questions = inputText.split(/Ques\s+\d+:/);
        questions.shift(); // Remove the empty string at the beginning
        const result = [];

        questions.forEach((questionContent, index) => {
            const questionNumber = index + 1;
            const [questionText, answerPart] = questionContent.split('Answer:');
            const fullQuestionText = questionText.trim();

            const options = fullQuestionText.match(/[a-d]\..+?(?=(?:\n[a-d]\.|\n*$))/gs) || [];

            const jsonQuestion = {
                question_id: questionNumber,
                subs: subtopicName,
                question_text: fullQuestionText.replace(/[a-d]\..+/g, '').trim(),
                options: options.map(option => {
                    const [value, text] = option.split('. ');
                    return {
                        text: `${value}) ${text.trim()}`,
                        value: value.trim()
                    };
                }),
                correct_answer: answerPart ? answerPart.trim() : ''
            };

            result.push(jsonQuestion);
        });

        return result;
    }

    async function fetchTopics() {
        try {
            const response = await fetch('/api/questions/topics');
            const topics = await response.json();
            topicSelect.innerHTML = '<option value="">Select or create a topic</option>';
            topics.forEach(topic => {
                const option = document.createElement('option');
                option.value = topic.name; // Ensure the correct property is used
                option.textContent = topic.name; // Ensure the correct property is used
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
            subtopicSelect.innerHTML = '<option value="">Select or create a subtopic</option>';
            subtopics.forEach(subtopic => {
                const option = document.createElement('option');
                option.value = subtopic.name; // Ensure the correct property is used
                option.textContent = subtopic.name; // Ensure the correct property is used
                subtopicSelect.appendChild(option);
            });
            console.log('Fetched subtopics for topic', topic, ':', subtopics);
        } catch (error) {
            console.error('Error fetching subtopics:', error);
        }
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
            const errorText = await response.text();
            console.error('Failed to save JSON data:', errorText);
            throw new Error('Failed to save JSON data');
        }

        return response.json();
    }
});