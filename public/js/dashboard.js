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
            console.log('Dashboard data:', data); // Log the data to check the structure
            const progressContainer = document.getElementById('topic-progress');
            progressContainer.innerHTML = '';

            data.forEach(topic => {
                console.log('Topic info:', topic.info); // Log each topic's info field
                const topicElement = document.createElement('div');
                topicElement.className = 'topic-progress';
                topicElement.innerHTML = `
                    <h3>${topic.name}</h3>
                    <p>${topic.info}</p> <!-- Ensure this line displays the info field -->
                    <p>Average Score: ${topic.averageScore.toFixed(2)}%</p>
                    <div class="progress-bar">
                        <div class="progress" style="width: ${topic.averageScore}%"></div>
                    </div>
                `;
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
    const info = document.getElementById('subtopic-select').options[document.getElementById('subtopic-select').selectedIndex].getAttribute('data-info');

    // Log the values before sending
    console.log('Submitting quiz result:', { topic, subtopic, score, totalQuestions, info });

    fetch('/api/questions/submit-result', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ topic, subtopic, score, totalQuestions, info }),
    })
    .then(response => response.json())
    .then(data => {
        console.log('Result saved:', data);
        // ... rest of the code ...
    })
    .catch(error => {
        console.error('Error:', error);
    });
}