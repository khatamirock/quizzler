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
        renderEditablePreview(currentJsonData);
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
            const editedJsonData = gatherEditedData();
            console.log('Saving JSON data:', { topicName, subtopicName, editedJsonData });
            const response = await fetch('/api/questions/save-json', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    topicName,
                    subtopicName,
                    jsonData: editedJsonData,
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

    function gatherEditedData() {
        const editedData = [];
        const previewContent = document.getElementById('editablePreview');
        const questionDivs = previewContent.getElementsByClassName('question-preview');

        Array.from(questionDivs).forEach((questionDiv, index) => {
            const questionText = questionDiv.querySelector(`#question-${index}`).value.trim();
            
            // Skip this question if the question text is empty
            if (questionText.length === 0) {
                return;
            }

            const info = questionDiv.querySelector(`#info-${index}`).value;
            const options = ['a', 'b', 'c', 'd'].map(option => ({
                text: `${option}) ${questionDiv.querySelector(`#option-${index}-${option}`).value}`,
                value: option
            }));
            const correctAnswer = questionDiv.querySelector(`#correct-answer-${index}`).value;

            editedData.push({
                question_id: editedData.length + 1, // Use the current length for numbering
                subs: currentJsonData[index].subs,
                info: info,
                question_text: questionText,
                options: options,
                correct_answer: correctAnswer
            });
        });

        return editedData;
    }

    function convertToJSON(inputText, subtopicName) {
        const questions = inputText.split(/(?:Ques\s+\d+:|প্রশ্ন\s*\d*:?|\d+\.\s*)/);
        questions.shift(); // Remove the empty string at the beginning
        const result = [];
        const subtopicInfo = promptForSubtopicInfo(); // Get subtopic info
        
        questions.forEach((questionContent, index) => {
            // Skip empty questions
            if (!questionContent.trim()) {
                return;
            }

            const questionNumber = result.length + 1; // Use the current result length for numbering
            const [questionText, answerPart] = questionContent.split(/Answer:|উত্তর:|Ans:/i);
            const fullQuestionText = questionText.trim();
            
            // Skip questions without any content
            if (!fullQuestionText) {
                return;
            }

            // Updated regex to match both English, Bangla, and new Bangla format options
            const options = fullQuestionText.match(/(?:[a-dA-D]\)|[ক-ঘ]\)|[a-dA-D]\.|\n[A-D]\.)\s*.+?(?=(?:\n[a-dA-D]\)|\n[ক-ঘ]\)|\n[a-dA-D]\.|\n[A-D]\.|\n*$))/gs) || [];
            
            const cleanedQuestionText = fullQuestionText.replace(/(?:[a-dA-D]\)|[ক-ঘ]\)|[a-dA-D]\.|\n[A-D]\.)\s*.+/g, '').trim();
            
            const jsonQuestion = {
                question_id: questionNumber,
                subs: parseInt(subtopicName) || 1,
                info: subtopicInfo,
                question_text: cleanedQuestionText,
                options: options.map(option => {
                    let [value, text] = option.split(/\s*\)\s*|\s*\.\s*/);
                    value = value.trim();
                    // Handle the new format where options start with A, B, C, D
                    if (/^[A-D]$/.test(value)) {
                        value = value.toLowerCase();
                    }
                    const englishValue = convertBanglaToEnglishOption(value);
                    return {
                        text: `${value}) ${text.trim()}`,
                        value: englishValue
                    };
                }),
                correct_answer: answerPart ? convertBanglaToEnglishOption(answerPart.trim().replace(/[^a-dA-Dক-ঘ]/gi, '')) : ''
            };
            
            // Push the question only if it has content
            if (jsonQuestion.question_text || jsonQuestion.options.length > 0) {
                result.push(jsonQuestion);
            }
        });
        
        return result;
    }

    function convertBanglaToEnglishOption(option) {
        const banglaToEnglish = {
            'ক': 'a',
            'খ': 'b',
            'গ': 'c',
            'ঘ': 'd',
            'A': 'a',
            'B': 'b',
            'C': 'c',
            'D': 'd'
        };
        return banglaToEnglish[option] || option.toLowerCase();
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
                option.value = topic.name;
                option.textContent = topic.name;
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

    async function saveJsonData(topicName, subtopicName, jsonData) {
        const response = await fetch('/api/questions/save-json', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                topicName,
                subtopicName,
                jsonData,
                subtopicInfo: jsonData[0].info // Add this line
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

function renderEditablePreview(jsonData) {
    const previewContent = document.createElement('div');
    previewContent.id = 'editablePreview';
    jsonData.forEach((question, index) => {
        const questionDiv = document.createElement('div');
        questionDiv.className = 'question-preview';
        questionDiv.style.padding = '15px';
        questionDiv.style.marginBottom = '10px';
        questionDiv.style.borderRadius = '5px';
        questionDiv.style.backgroundColor = index % 2 === 0 ? '#ffffff' : '#f0f0f0';
        questionDiv.innerHTML = `
            <h3>Question ${index + 1}</h3>
            <div class="input-group">
                <label for="question-${index}">Question Text:</label>
                <textarea id="question-${index}" rows="3">${question.question_text}</textarea>
            </div>
            <div class="input-group">
                <label for="info-${index}">Info:</label>
                <input type="text" id="info-${index}" value="${question.info || ''}">
            </div>
            <h4>Options:</h4>
            <div class="options-grid">
                ${['a', 'b', 'c', 'd'].map((option, optIndex) => `
                    <div class="option-input">
                        <label for="option-${index}-${option}">${option.toUpperCase()}:</label>
                        <input type="text" id="option-${index}-${option}" value="${question.options[optIndex] ? question.options[optIndex].text.split(') ')[1] : (optIndex === 3 ? 'None of the above' : '')}">
                    </div>
                `).join('')}
            </div>
            <div class="input-group">
                <label for="correct-answer-${index}">Correct Answer:</label>
                <select id="correct-answer-${index}">
                    ${['a', 'b', 'c', 'd'].map(option => `
                        <option value="${option}" ${question.correct_answer.toLowerCase() === option ? 'selected' : ''}>${option.toUpperCase()}</option>
                    `).join('')}
                </select>
            </div>
        `;

        previewContent.appendChild(questionDiv);
    });

    jsonPreview.innerHTML = '';
    jsonPreview.appendChild(previewContent);
}