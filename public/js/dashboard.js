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