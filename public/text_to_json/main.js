import { fetchTopics, fetchSubtopics, convertToJSON, gatherEditedData } from './logic.js';

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

    fetchTopics(topicSelect);

    topicSelect.addEventListener('change', () => {
        if (topicSelect.value) {
            fetchSubtopics(topicSelect.value, subtopicSelect);
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
            const editedJsonData = gatherEditedData(currentJsonData);
            console.log('Saving JSON data:', { topicName, subtopicName, editedJsonData });
            const response = await fetch('/api/questions/save-json', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    topicName,
                    subtopicName,
                    password,
                    jsonData: editedJsonData
                })
            });
            const result = await response.text();
            resultDiv.innerHTML = `<p>${result}</p>`;
        } catch (error) {
            resultDiv.innerHTML = '<p>Error saving JSON data.</p>';
            console.error('Error saving JSON data:', error);
        }
    });

    function renderEditablePreview(jsonData) {
        const previewContent = document.getElementById('editablePreview');
        previewContent.innerHTML = '';
        jsonData.forEach((question, index) => {
            const questionDiv = document.createElement('div');
            questionDiv.className = 'question-preview';
            questionDiv.innerHTML = `
                <h3>Question ${index + 1}</h3>
                <textarea id="question-${index}" rows="2" style="width: 100%;">${question.question_text}</textarea>
                <label for="info-${index}">Subtopic Info:</label>
                <input type="text" id="info-${index}" value="${question.info}" />
                <h4>Options:</h4>
                ${question.options.map(option => `
                    <label for="option-${index}-${option.value}">${option.value.toUpperCase()}:</label>
                    <input type="text" id="option-${index}-${option.value}" value="${option.text.split(')').slice(1).join(')').trim()}" />
                `).join('')}
                <label for="correct-answer-${index}">Correct Answer:</label>
                <input type="text" id="correct-answer-${index}" value="${question.correct_answer}" />
            `;
            previewContent.appendChild(questionDiv);
        });
    }
});
