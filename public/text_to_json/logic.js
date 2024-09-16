export async function fetchTopics(topicSelect) {
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

export async function fetchSubtopics(topic, subtopicSelect) {
    try {
        const response = await fetch(`/api/questions/subtopics/${topic}`);
        const subtopics = await response.json();
        subtopicSelect.innerHTML = '<option value="">Select or create a subtopic</option>';
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
                const subtopicInfo = value[0];
                const infoText = subtopicInfo.info || 'No info available';
                const subtopicDiv = document.createElement('div');
                subtopicDiv.innerHTML = `<p>${key} - ${infoText}</p>`;
                subtopicsInfoElement.appendChild(subtopicDiv);
                const option = document.createElement('option');
                option.value = key;
                option.textContent = key;
                subtopicSelect.appendChild(option);
            });
        } else {
            subtopicsInfoElement.innerHTML = '<h3>No subtopics available</h3>';
        }
        console.log('Fetched subtopics for topic', topic, ':', subtopics);
    } catch (error) {
        console.error('Error fetching subtopics:', error);
    }
}

export function convertToJSON(inputText, subtopicName) {
    const questions = inputText.split(/(?:Ques\s+\d+:|প্রশ্ন\s*\d*:?|\d+\.\s*)/);
    questions.shift(); 
    const result = [];
    const subtopicInfo = promptForSubtopicInfo();
    questions.forEach((questionContent, index) => {
        if (!questionContent.trim()) {
            return;
        }
        const questionNumber = result.length + 1;
        const [questionText, answerPart] = questionContent.split(/Answer:|উত্তর:|Ans:/i);
        const fullQuestionText = questionText.trim();
        if (!fullQuestionText) return;
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
        if (jsonQuestion.question_text || jsonQuestion.options.length > 0) {
            result.push(jsonQuestion);
        }
    });
    return result;
}

export function gatherEditedData(currentJsonData) {
    const editedData = [];
    const previewContent = document.getElementById('editablePreview');
    const questionDivs = previewContent.getElementsByClassName('question-preview');
    Array.from(questionDivs).forEach((questionDiv, index) => {
        const questionText = questionDiv.querySelector(`#question-${index}`).value.trim();
        if (questionText.length === 0) return;
        const info = questionDiv.querySelector(`#info-${index}`).value;
        const options = ['a', 'b', 'c', 'd'].map(option => ({
            text: `${option}) ${questionDiv.querySelector(`#option-${index}-${option}`).value}`,
            value: option
        }));
        const correctAnswer = questionDiv.querySelector(`#correct-answer-${index}`).value;
        editedData.push({
            question_id: editedData.length + 1,
            subs: currentJsonData[index].subs,
            info: info,
            question_text: questionText,
            options: options,
            correct_answer: correctAnswer
        });
    });
    return editedData;
}

function promptForSubtopicInfo() {
    return prompt("Enter information about this subtopic (optional):");
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
