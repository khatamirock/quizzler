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
        
        const selectedCount = parseInt(questionCountSlider.value);
        const filledCount = currentJsonData.length;
        
        if (filledCount < selectedCount) {
            alert(`You selected ${selectedCount} questions, but only ${filledCount} are completely filled out. Only the filled questions will be saved.`);
        }
        
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
            const questionText = document.getElementById(`questionText${i}`).value.trim();
            const optionA = document.getElementById(`optionA${i}`).value.trim();
            const optionB = document.getElementById(`optionB${i}`).value.trim();
            const optionC = document.getElementById(`optionC${i}`).value.trim();
            const optionD = document.getElementById(`optionD${i}`).value.trim();
            const correctAnswer = document.getElementById(`correctAnswer${i}`).value;

            // Check if the question and all options are filled
            if (questionText && optionA && optionB && optionC && optionD) {
                const jsonQuestion = {
                    question_id: result.length + 1, // Use the current length of result array + 1
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
            
            // Create or get the element to display subtopics info
            let subtopicsInfoElement = document.getElementById('subtopicsInfo');
            if (!subtopicsInfoElement) {
                subtopicsInfoElement = document.createElement('div');
                subtopicsInfoElement.id = 'subtopicsInfo';
                subtopicSelect.parentNode.insertBefore(subtopicsInfoElement, subtopicSelect.nextSibling);
            }
            
            // Apply styling to the subtopicsInfoElement
            subtopicsInfoElement.style.color = 'indianred';
            subtopicsInfoElement.style.padding = '15px';
            subtopicsInfoElement.style.fontWeight = 'bold';

            
            if (typeof subtopics === 'object' && subtopics !== null) {
                subtopicsInfoElement.innerHTML = '<h3>Subtopics:</h3>';
                
                Object.entries(subtopics).forEach(([key, value]) => {
                    const subtopicInfo = value[0]; // Assuming there's always at least one item in the array
                    const infoText = subtopicInfo.info || 'No info available';
                    
                    // Add subtopic info to the HTML
                    const subtopicDiv = document.createElement('div');
                    subtopicDiv.innerHTML = `<p>${key} - ${infoText}</p>`;
                    subtopicsInfoElement.appendChild(subtopicDiv);
                    
                    // Add option to select element
                    const option = document.createElement('option');
                    option.value = key;
                    option.textContent = key;
                    subtopicSelect.appendChild(option);
                });
            } else {
                subtopicsInfoElement.innerHTML = '<h3>No subtopics available</h3>';
                console.warn('Subtopics response is not an object:', subtopics);
            }
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