document.addEventListener('DOMContentLoaded', () => {
    const topicSelect = document.getElementById('topicSelect');
    const newTopic = document.getElementById('newTopic');
    const subtopicSelect = document.getElementById('subtopicSelect');
    const newSubtopic = document.getElementById('newSubtopic');
    const questionText = document.getElementById('questionText');
    const optionsContainer = document.getElementById('optionsContainer');
    const correctAnswer = document.getElementById('correctAnswer');
    const submitButton = document.getElementById('submitQuestion');

    // Fetch topics
    fetch('/api/questions/topics')
        .then(response => response.json())
        .then(topics => {
            topics.forEach(topic => {
                const option = document.createElement('option');
                option.value = topic.name;
                option.textContent = topic.name;
                topicSelect.appendChild(option);
            });
        });

    // Update subtopics when topic changes
    topicSelect.addEventListener('change', updateSubtopics);

    // Function to update subtopics
    function updateSubtopics() {
        const selectedTopic = topicSelect.value;
        if (selectedTopic) {
            fetch(`/api/questions/subtopics/${selectedTopic}`)
                .then(response => response.json())
                .then(subtopics => {
                    subtopicSelect.innerHTML = '<option value="" disabled selected>Select a subtopic</option>';
                    Object.values(subtopics).flat().forEach(subtopic => {
                        const option = document.createElement('option');
                        option.value = subtopic.name;
                        option.textContent = subtopic.name;
                        subtopicSelect.appendChild(option);
                    });
                });
        } else {
            subtopicSelect.innerHTML = '<option value="" disabled selected>Select a subtopic</option>';
        }
    }

    // Submit question
    submitButton.addEventListener('click', () => {
        const password = prompt("Please enter the admin password to add this question:");
        if (!password) {
            alert("Password is required to add a question.");
            return;
        }

        const options = Array.from(optionsContainer.querySelectorAll('.optionInput')).map((input, index) => ({
            text: input.value,
            value: String.fromCharCode(97 + index) // 'a', 'b', 'c', 'd'
        }));

        const questionData = {
            topic: topicSelect.value || newTopic.value,
            subtopic: subtopicSelect.value || newSubtopic.value,
            question_text: questionText.value,
            options: options,
            correct_answer: correctAnswer.value,
            password: password
        };

        console.log('Sending question data:', questionData);

        fetch('/api/questions/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(questionData),
        })
        .then(response => {
            if (!response.ok) {
                return response.text().then(text => {
                    throw new Error(`HTTP error! status: ${response.status}, body: ${text}`);
                });
            }
            return response.json();
        })
        .then(data => {
            console.log('Response:', data);
            alert('Question added successfully!');
            // Clear form
            topicSelect.value = '';
            newTopic.value = '';
            subtopicSelect.value = '';
            newSubtopic.value = '';
            questionText.value = '';
            optionsContainer.querySelectorAll('.optionInput').forEach(input => input.value = '');
            correctAnswer.value = '';
            updateSubtopics(); // Reset subtopics
        })
        .catch(error => {
            console.error('Error:', error);
            alert(`Failed to add question. Error: ${error.message}`);
        });
    });
});