document.addEventListener('DOMContentLoaded', () => {
    const ankiButton = document.getElementById('ankiButton');
    const ankiText = document.getElementById('ankiText');
    const popup = document.getElementById('popup');
    const popupText = document.getElementById('popupText');
    const copyButton = document.getElementById('copyButton');
    const closeButton = document.querySelector('.close');
    const topicSelect = document.getElementById('topicSelect');
    const subtopicSelect = document.getElementById('subtopicSelect');

    console.log('DOM fully loaded');

    // Fetch topics when the page loads
    fetchTopics();

    topicSelect.addEventListener('change', () => {
        const selectedTopic = topicSelect.value;
        console.log('Selected topic:', selectedTopic);
        if (selectedTopic) {
            fetchSubtopics(selectedTopic);
        } else {
            subtopicSelect.innerHTML = '<option value="">Select a subtopic</option>';
            subtopicSelect.disabled = true;
        }
        ankiText.value = ''; // Clear the text area when topic changes
    });

    subtopicSelect.addEventListener('change', () => {
        const selectedTopic = topicSelect.value;
        const selectedSubtopic = subtopicSelect.value;
        console.log('Selected subtopic:', selectedSubtopic);
        if (selectedTopic && selectedSubtopic) {
            fetchQuestions(selectedTopic, selectedSubtopic);
        } else {
            ankiText.value = ''; // Clear the text area if no subtopic is selected
        }
    });

    ankiButton.addEventListener('click', () => {
        const text = ankiText.value;
        if (text.trim() === '') {
            alert('Please enter some text.');
            return;
        }

        popupText.value = text;
        popup.style.display = 'block';
    });

    copyButton.addEventListener('click', () => {
        popupText.select();
        document.execCommand('copy');
        alert('Text copied to clipboard');
    });

    closeButton.addEventListener('click', () => {
        popup.style.display = 'none';
    });

    window.addEventListener('click', (event) => {
        if (event.target === popup) {
            popup.style.display = 'none';
        }
    });

    function fetchTopics() {
        console.log('Fetching topics...');
        fetch('/api/questions/topics')
            .then(response => response.json())
            .then(topics => {
                console.log('Fetched topics:', topics);
                topicSelect.innerHTML = '<option value="">Select a topic</option>';
                topics.forEach(topic => {
                    const option = document.createElement('option');
                    option.value = topic.name;
                    option.textContent = `${topic.name} (${topic.count} questions)`;
                    topicSelect.appendChild(option);
                });
            })
            .catch(error => {
                console.error('Error fetching topics:', error);
            });
    }

    function fetchSubtopics(topic) {
        console.log('Fetching subtopics for topic:', topic);
        fetch(`/api/questions/subtopics/${topic}`)
            .then(response => response.json())
            .then(classifiedSubtopics => {
                console.log('Fetched subtopics:', classifiedSubtopics);
                subtopicSelect.innerHTML = '<option value="">Select a subtopic</option>';
                for (const [subsValue, subtopics] of Object.entries(classifiedSubtopics)) {
                    subtopics.forEach(subtopic => {
                        const option = document.createElement('option');
                        option.value = `${subtopic.name}-${subsValue}`;
                        option.textContent = `${subtopic.info} (${subtopic.count} questions) - ${subsValue}`;
                        subtopicSelect.appendChild(option);
                    });
                }
                subtopicSelect.disabled = false;
            })
            .catch(error => {
                console.error('Error fetching subtopics:', error);
            });
    }

    function fetchQuestions(topic, subtopic) {
        console.log('Fetching questions for topic:', topic, 'and subtopic:', subtopic);
        const [subtopicName, subsValue] = subtopic.split('-');
        fetch(`/api/questions/${topic}/${subtopicName}/${subsValue}`)
            .then(response => response.json())
            .then(questions => {
                console.log('Fetched questions:', questions);
                const formattedQuestions = questions.map(q => JSON.stringify(q, null, 2)).join('\n\n');
                console.log('Formatted questions:', formattedQuestions);
                ankiText.value = formattedQuestions;
            })
            .catch(error => {
                console.error('Error fetching questions:', error);
                ankiText.value = 'Error fetching questions. Please try again.';
            });
    }
});
