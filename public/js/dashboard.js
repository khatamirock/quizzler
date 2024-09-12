document.addEventListener('DOMContentLoaded', () => {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.getAttribute('data-tab');
            
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            button.classList.add('active');
            document.getElementById(`${tabName}-tab`).classList.add('active');

            if (tabName === 'dashboard') {
                loadDashboard();
            }
        });
    });
});

function loadDashboard() {
    fetch('/api/dashboard/progress')
        .then(response => response.json())
        .then(data => {
            console.log('Dashboard data:', data);
            const progressContainer = document.getElementById('topic-progress');
            progressContainer.innerHTML = '';

            data.forEach(topic => {
                const topicElement = document.createElement('div');
                topicElement.className = 'topic-progress';
                topicElement.innerHTML = `
                    <h3>${topic.name}</h3>
                    <p>Overall Average Score: ${topic.overallAverageScore.toFixed(2)}%</p>
                    <div class="progress-bar">
                        <div class="progress" style="width: ${topic.overallAverageScore}%"></div>
                    </div>
                `;

                const subtopicsList = document.createElement('ul');
                topic.subtopics.forEach(subtopic => {
                    const subtopicItem = document.createElement('li');
                    subtopicItem.innerHTML = `
                        <strong>${subtopic.name}</strong>
                        <p>Info: ${subtopic.info || 'No info available'}</p>
                        <p>Average Score: ${subtopic.averageScore.toFixed(2)}%</p>
                    `;
                    subtopicsList.appendChild(subtopicItem);
                });

                topicElement.appendChild(subtopicsList);
                progressContainer.appendChild(topicElement);
            });
        })
        .catch(error => console.error('Error loading dashboard:', error));
}

function submitQuiz() {
    // ... existing code ...

    const topic = document.getElementById('topic-select').value;
    const subtopic = document.getElementById('subtopic-select').value;
    const score = correctAnswers;
    const totalQuestions = questions.length;
    const infoElement = document.getElementById('subtopic-select').options[document.getElementById('subtopic-select').selectedIndex];
    const info = infoElement ? infoElement.getAttribute('data-info') : null;

    // Log the values before sending
    console.log('Submitting quiz result:', { topic, subtopic, score, totalQuestions, info });

    fetch('/api/questions/submit-result', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ topic, subtopic, score, totalQuestions, info }),
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('Result saved:', data);
        // ... rest of the code ...
    })
    .catch(error => {
        console.error('Error:', error);
        // Handle the error (e.g., show an error message to the user)
    });
}