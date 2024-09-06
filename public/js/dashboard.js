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
            const progressContainer = document.getElementById('topic-progress');
            progressContainer.innerHTML = '';

            data.forEach(topic => {
                const topicElement = document.createElement('div');
                topicElement.className = 'topic-progress';
                topicElement.innerHTML = `
                    <h3>${topic.name}</h3>
                    <p>Completed: ${topic.completed}</p>
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