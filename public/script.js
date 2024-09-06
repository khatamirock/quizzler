const setup = document.getElementById('setup');
const quiz = document.getElementById('quiz');
const results = document.getElementById('results');
const startButton = document.getElementById('startQuiz');
const submitButton = document.getElementById('submit');
const restartButton = document.getElementById('restart');

let currentQuestions = [];
let score = 0;

const topicSelect = document.getElementById('topic');
const subtopicSelect = document.getElementById('subtopic');

topicSelect.addEventListener('change', updateSubtopics);

async function updateSubtopics() {
    const topic = topicSelect.value;
    subtopicSelect.innerHTML = '<option value="">Select Subtopic</option>';
    subtopicSelect.disabled = true;

    if (topic) {
        try {
            const response = await fetch(`/api/questions/subtopics/${topic}`);
            if (!response.ok) {
                throw new Error('Failed to fetch subtopics');
            }
            const subtopics = await response.json();
            if (subtopics.length > 0) {
                subtopics.forEach(subtopic => {
                    const option = document.createElement('option');
                    option.value = subtopic;
                    option.textContent = subtopic;
                    subtopicSelect.appendChild(option);
                });
                subtopicSelect.disabled = false;
            } else {
                const option = document.createElement('option');
                option.value = "default";
                option.textContent = "No subtopics available";
                subtopicSelect.appendChild(option);
            }
        } catch (error) {
            console.error('Error fetching subtopics:', error);
            const option = document.createElement('option');
            option.value = "default";
            option.textContent = "Error fetching subtopics";
            subtopicSelect.appendChild(option);
        }
    }
}

startButton.addEventListener('click', startQuiz);
submitButton.addEventListener('click', submitQuiz);
restartButton.addEventListener('click', restartQuiz);

function startQuiz() {
    const topic = topicSelect.value;
    const subtopic = subtopicSelect.value;
    const count = document.getElementById('questionCount').value;

    if (!topic || (!subtopic && subtopicSelect.options.length > 1)) {
        alert('Please select a topic and subtopic (if available)');
        return;
    }

    const subtopicPath = subtopic === "default" ? "" : `/${subtopic}`;
    fetch(`/api/questions/${topic}${subtopicPath}/${count}`)
        .then(response => response.json())
        .then(data => {
            currentQuestions = data;
            score = 0;
            setup.style.display = 'none';
            quiz.style.display = 'block';
            results.style.display = 'none';
            displayQuestions();
            updateScore();
        });
}

function displayQuestions() {
    const questionsContainer = document.getElementById('questions');
    questionsContainer.innerHTML = '';
    currentQuestions.forEach((question, index) => {
        const questionElement = document.createElement('div');
        questionElement.className = 'question';
        questionElement.innerHTML = `
            <h3>Question ${index + 1}: ${question.question_text}</h3>
            <div class="options">
                ${question.options.map(option => `
                    <div class="option" data-value="${option.value}">
                        ${option.text}
                    </div>
                `).join('')}
            </div>
        `;
        questionsContainer.appendChild(questionElement);
    });

    // Add event listeners to options
    document.querySelectorAll('.option').forEach(option => {
        option.addEventListener('click', () => selectOption(option));
    });
}

function selectOption(selectedOption) {
    const questionElement = selectedOption.closest('.question');
    const options = questionElement.querySelectorAll('.option');
    const questionIndex = Array.from(document.querySelectorAll('.question')).indexOf(questionElement);
    const question = currentQuestions[questionIndex];

    if (options[0].classList.contains('correct') || options[0].classList.contains('incorrect')) {
        return; // Question already answered
    }

    options.forEach(option => {
        option.classList.remove('selected');
    });

    selectedOption.classList.add('selected');

    if (selectedOption.dataset.value === question.correct_answer) {
        selectedOption.classList.add('correct');
        score++;
    } else {
        selectedOption.classList.add('incorrect');
        options.forEach(option => {
            if (option.dataset.value === question.correct_answer) {
                option.classList.add('correct');
            }
        });
    }

    updateScore();
}

function updateScore() {
    const answeredQuestions = document.querySelectorAll('.option.correct, .option.incorrect').length;
    document.getElementById('score').textContent = `Current Score: ${score} out of ${answeredQuestions}`;
}

function submitQuiz() {
    const unansweredQuestions = currentQuestions.length - document.querySelectorAll('.question:has(.option.correct), .question:has(.option.incorrect)').length;
    if (unansweredQuestions > 0) {
        alert(`You have ${unansweredQuestions} unanswered question(s). Please answer all questions before submitting.`);
        return;
    }

    const topic = document.getElementById('topic').value;
    const subtopic = document.getElementById('subtopic').value;

    fetch('/api/questions/submit-result', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            topic,
            subtopic,
            score,
            totalQuestions: currentQuestions.length
        }),
    })
    .then(response => response.json())
    .then(data => {
        console.log('Result saved:', data);
        quiz.style.display = 'none';
        showResults();
    })
    .catch(error => {
        console.error('Error saving result:', error);
        alert('Failed to save result. Please try again.');
    });
}

function showResults() {
    results.style.display = 'block';
    document.getElementById('finalScore').textContent = `Final Score: ${score} out of ${currentQuestions.length}`;
}

function restartQuiz() {
    results.style.display = 'none';
    quiz.style.display = 'none';
    setup.style.display = 'block';
    document.getElementById('score').textContent = '';
    document.getElementById('finalScore').textContent = '';
}

// Add these variables at the top of your file
const quizTab = document.getElementById('quizTab');
const dashboardTab = document.getElementById('dashboardTab');
const quizContent = document.getElementById('quizContent');
const dashboardContent = document.getElementById('dashboardContent');
const dashboardData = document.getElementById('dashboardData');
const converterTab = document.getElementById('converterTab');
const converterContent = document.getElementById('converterContent');

// Add event listeners for tab switching
quizTab.addEventListener('click', () => switchTab('quiz'));
dashboardTab.addEventListener('click', () => switchTab('dashboard'));
converterTab.addEventListener('click', () => switchTab('converter'));

function switchTab(tab) {
    quizTab.classList.remove('active');
    dashboardTab.classList.remove('active');
    converterTab.classList.remove('active');
    quizContent.style.display = 'none';
    dashboardContent.style.display = 'none';
    converterContent.style.display = 'none';

    if (tab === 'quiz') {
        quizTab.classList.add('active');
        quizContent.style.display = 'block';
    } else if (tab === 'dashboard') {
        dashboardTab.classList.add('active');
        dashboardContent.style.display = 'block';
        fetchDashboardData();
    } else if (tab === 'converter') {
        converterTab.classList.add('active');
        converterContent.style.display = 'block';
    }
}

async function fetchDashboardData() {
    try {
        const response = await fetch('/api/questions/dashboard');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('Fetched dashboard data:', data);
        displayDashboardData(data);
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        dashboardData.innerHTML = '<p>Error loading dashboard data. Please try again later.</p>';
    }
}

function displayDashboardData(data) {
    console.log('Displaying dashboard data:', data);
    if (!data || data.length === 0) {
        dashboardData.innerHTML = '<p>No quiz results available.</p>';
        return;
    }

    // Group data by topic
    const groupedData = data.reduce((acc, result) => {
        if (!acc[result.topic]) {
            acc[result.topic] = [];
        }
        acc[result.topic].push(result);
        return acc;
    }, {});

    // Clear previous charts
    const chartsContainer = document.getElementById('chartsContainer');
    chartsContainer.innerHTML = '';

    // Create a chart for each topic
    Object.keys(groupedData).forEach(topic => {
        const topicData = groupedData[topic];
        const labels = topicData.map(result => new Date(result.timestamp).toLocaleString());
        const scores = topicData.map(result => result.score);

        // Create a canvas element for the chart
        const canvas = document.createElement('canvas');
        canvas.id = `chart-${topic}`;
        chartsContainer.appendChild(canvas);

        // Render the chart
        const ctx = canvas.getContext('2d');
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: `Quiz Scores Over Time for ${topic}`,
                    data: scores,
                    borderColor: 'rgba(75, 192, 192, 1)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    fill: true,
                    tension: 0.1
                }]
            },
            options: {
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Time'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Score'
                        },
                        beginAtZero: true
                    }
                }
            }
        });
    });
}

// Call this function when the page loads to set up the initial state
function initializePage() {
    switchTab('quiz');
}

// Call the initialization function when the page loads
document.addEventListener('DOMContentLoaded', initializePage);