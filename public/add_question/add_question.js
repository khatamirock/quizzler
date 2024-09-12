document.addEventListener('DOMContentLoaded', () => {
    const topicSelect = document.getElementById('topic');
    const subtopicSelect = document.getElementById('subtopic');
    const newSubtopicInput = document.getElementById('newSubtopic');
    const form = document.getElementById('addQuestionForm');
    const resultDiv = document.getElementById('result');

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
    topicSelect.addEventListener('change', () => {
        const selectedTopic = topicSelect.value;
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
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const topic = topicSelect.value;
        const subtopic = subtopicSelect.value || newSubtopicInput.value;
        const questionText = document.getElementById('questionText').value;
        const options = Array.from(document.querySelectorAll('.option-input')).map((input, index) => ({
            text: `${String.fromCharCode(97 + index)}) ${input.value}`,
            value: String.fromCharCode(97 + index)
        }));
        const correctAnswer = document.getElementById('correctAnswer').value;

        const newQuestion = {
            subs: 1, // You may want to implement a way to set this dynamically
            info: "",
            question_text: questionText,
            options,
            correct_answer: correctAnswer
        };

        fetch('/api/questions/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ topic, subtopic, question: newQuestion }),
        })
        .then(response => response.json())
        .then(data => {
            resultDiv.textContent = 'Question added successfully!';
            resultDiv.className = 'success';
            form.reset();
        })
        .catch(error => {
            resultDiv.textContent = 'Error adding question: ' + error.message;
            resultDiv.className = 'error';
        });
    });
});