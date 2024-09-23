document.addEventListener('DOMContentLoaded', () => {
    const ankiButton = document.getElementById('ankiButton');
    const ankiText = document.getElementById('ankiText');
    const popup = document.getElementById('popup');
    const popupText = document.getElementById('popupText');
    const copyButton = document.getElementById('copyButton');
    const closeButton = document.querySelector('.close');
    const topicSelect = document.getElementById('topicSelect');
    const subtopicSelect = document.getElementById('subtopicSelect');

    // Fetch topics when the page loads
    fetchTopics();

    topicSelect.addEventListener('change', () => {
        const selectedTopic = topicSelect.value;
        if (selectedTopic) {
            fetchSubtopics(selectedTopic);
        } else {
            subtopicSelect.innerHTML = '<option value="">Select a subtopic</option>';
            subtopicSelect.disabled = true;
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
        fetch('/api/questions/topics')
            .then(response => response.json())
            .then(topics => {
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
        fetch(`/api/questions/subtopics/${topic}`)
            .then(response => response.json())
            .then(classifiedSubtopics => {
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
});
