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
    const questionCountSlider = document.getElementById('questionCountSlider');
    const questionCountValue = document.getElementById('questionCountValue');
    const questionContainer = document.getElementById('questionContainer');

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

    questionCountSlider.addEventListener('input', () => {
        questionCountValue.textContent = questionCountSlider.value;
        updateQuestionFields();
    });

    previewButton.addEventListener('click', () => {
        const subtopicName = newSubtopic.value || subtopicSelect.value;
        currentJsonData = convertToJSON(subtopicName);
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

        const password = prompt("Please enter the admin password to save the data:");
        if (!password) {
            resultDiv.innerHTML = '<p>Error: Password is required to save data.</p>';
            return;
        }

        try {
            console.log('Saving JSON data:', { topicName, subtopicName, currentJsonData });
            const response = await fetch('/api/questions/save-json', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    topicName,
                    subtopicName,
                    jsonData: currentJsonData,
                    password: password
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to save JSON data');
            }

            const result = await response.json();
            console.log('Server response:', result);
            resultDiv.innerHTML = `<p>${result.message}</p>`;
            
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

    function convertToJSON(subtopicName) {
        const questionCount = parseInt(questionCountSlider.value);
        const result = [];
        const subtopicInfo = promptForSubtopicInfo(); // Get subtopic info

        for (let i = 0; i < questionCount; i++) {
            const questionText = document.getElementById(`questionText${i}`).value;
            const optionA = document.getElementById(`optionA${i}`).value;
            const optionB = document.getElementById(`optionB${i}`).value;
            const optionC = document.getElementById(`optionC${i}`).value;
            const optionD = document.getElementById(`optionD${i}`).value;
            const correctAnswer = document.getElementById(`correctAnswer${i}`).value;

            const jsonQuestion = {
                question_id: i + 1,
                subs: parseInt(subtopicName) || 1,
                info: subtopicInfo,
                question_text: questionText,
                options: [
                    { text: `a) ${optionA}`, value: 'a' },
                    { text: `b) ${optionB}`, value: 'b' },
                    { text: `c) ${optionC}`, value: 'c' },
                    { text: `d) ${optionD}`, value: 'd' },
                ],
                correct_answer: correctAnswer
            };

            result.push(jsonQuestion);
        }

        return result;
    }

    function promptForSubtopicInfo() {
        return prompt("Enter information about this subtopic (optional):");
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

    function updateQuestionFields() {
        const questionCount = parseInt(questionCountSlider.value);
        questionContainer.innerHTML = ''; // Clear existing fields

        for (let i = 0; i < questionCount; i++) {
            const questionDiv = document.createElement('div');
            questionDiv.classList.add('question-field');

            questionDiv.innerHTML = `
                <label for="questionText${i}">Question ${i + 1}:</label>
                <textarea id="questionText${i}" rows="2" required></textarea>

                <label for="optionA${i}">Option A:</label>
                <input type="text" id="optionA${i}" required>

                <label for="optionB${i}">Option B:</label>
                <input type="text" id="optionB${i}" required>

                <label for="optionC${i}">Option C:</label>
                <input type="text" id="optionC${i}" required>

                <label for="optionD${i}">Option D:</label>
                <input type="text" id="optionD${i}" required>

                <label for="correctAnswer${i}">Correct Answer:</label>
                <select id="correctAnswer${i}">
                    <option value="a">a</option>
                    <option value="b">b</option>
                    <option value="c">c</option>
                    <option value="d">d</option>
                </select>
            `;

            questionContainer.appendChild(questionDiv);
        }
    }

    updateQuestionFields(); // Initialize with default question count
});