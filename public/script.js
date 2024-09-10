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

function updateSubtopics() {
    const topic = topicSelect.value;
    subtopicSelect.innerHTML = '<option value="">Select Subtopic</option>';
    subtopicSelect.disabled = true;

    const loadingSpinner = document.getElementById('subtopicLoading');

    if (topic) {
        // Show loading spinner
        loadingSpinner.style.display = 'inline-block';

        fetch(`/api/questions/subtopics/${topic}`)
            .then(response => response.json())
            .then(classifiedSubtopics => {
                if (Object.keys(classifiedSubtopics).length > 0) {
                    const addedSubtopics = new Set();
                    for (const [subsValue, subtopics] of Object.entries(classifiedSubtopics)) {
                        const optgroup = document.createElement('optgroup');
                        
                        // Get the info from the first subtopic in this group
                        const groupInfo = subtopics[0].info || 'No extra info added';
                        
                        // Add the info to the optgroup label
                        optgroup.label = `Subset: ${subsValue} - ${groupInfo}`;
                        
                        subtopics.forEach(subtopic => {
                            if (!addedSubtopics.has(subtopic.name)) {
                                const option = document.createElement('option');

                            }
                        });
                        if (optgroup.children.length > 0) {
                            subtopicSelect.appendChild(optgroup);
                        }
                    }
                    subtopicSelect.disabled = false;
                } else {
                    const option = document.createElement('option');
                    option.value = "default";
                    option.textContent = "No subtopics available";
                    subtopicSelect.appendChild(option);
                }
            })
            .catch(error => {
                console.error('Error fetching subtopics:', error);
                const option = document.createElement('option');
                option.value = "error";
                option.textContent = "Error loading subtopics";
                subtopicSelect.appendChild(option);
            })
            .finally(() => {
                // Hide loading spinner
                loadingSpinner.style.display = 'none';
            });
    } else {
        // Hide loading spinner if no topic is selected
        loadingSpinner.style.display = 'none';
    }
}

startButton.addEventListener('click', startQuiz);
submitButton.addEventListener('click', submitQuiz);
restartButton.addEventListener('click', restartQuiz);

let quizDuration = 0;
let timerInterval;

// Add this near the top of your file with other variable declarations
let selectedQuestionCount = 5; // Default to 5 questions

// Add this after your existing event listeners
document.querySelectorAll('.question-count-btn').forEach(button => {
    button.addEventListener('click', () => {
        document.querySelectorAll('.question-count-btn').forEach(btn => btn.classList.remove('selected'));
        button.classList.add('selected');
        selectedQuestionCount = parseInt(button.dataset.count);
    });
});

// In your initializePage function, add this line to set the default selected button
document.querySelector('.question-count-btn[data-count="5"]').classList.add('selected');

function startQuiz() {
    const topic = topicSelect.value;
    const subtopic = subtopicSelect.value;

    if (!topic || (!subtopic && subtopicSelect.options.length > 1)) {
        alert('Please select a topic and subtopic (if available)');
        return;
    }

    const subtopicPath = subtopic === "default" ? "" : `/${subtopic}`;
    fetch(`/api/questions/${topic}${subtopicPath}/${selectedQuestionCount}`)
        .then(response => response.json())
        .then(data => {
            currentQuestions = data;
            score = 0;
            setup.style.display = 'none';
            quiz.style.display = 'block';
            results.style.display = 'none';
            displayQuestions();
            updateScore();
            
            // Set up and start the timer
            quizDuration = currentQuestions.length * 60; // 1 minute per question
            startTimer();
            setupStickyTimer();
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
    clearInterval(timerInterval); // Stop the timer
    
    const unansweredQuestions = currentQuestions.length - document.querySelectorAll('.question:has(.option.correct), .question:has(.option.incorrect)').length;
    if (unansweredQuestions > 0) {
        alert(`Time's up! You have ${unansweredQuestions} unanswered question(s). These will be marked as incorrect.`);
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
            subs: currentQuestions[0].subs, // Assuming all questions in a quiz have the same 'subs' value
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
    clearInterval(timerInterval); // Ensure the timer is stopped
    results.style.display = 'none';
    quiz.style.display = 'none';
    setup.style.display = 'block';
    document.getElementById('score').textContent = '';
    document.getElementById('finalScore').textContent = '';
    document.getElementById('timeRemaining').textContent = '';
    document.getElementById('timerBar').value = 100;
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

const topicFilter = document.createElement('select');
topicFilter.id = 'topicFilter';
topicFilter.innerHTML = '<option value="">All Topics</option>';

const subtopicFilter = document.createElement('select');
subtopicFilter.id = 'subtopicFilter';
subtopicFilter.innerHTML = '<option value="">All Subtopics</option>';
subtopicFilter.disabled = true;

async function populateTopicFilter() {
    try {
        const response = await fetch('/api/questions/dashboard-topics');
        const topics = await response.json();
        topicFilter.innerHTML = '<option value="">All Topics</option>';
        topics.forEach(topic => {
            const option = document.createElement('option');
            option.value = topic;
            option.textContent = topic;
            topicFilter.appendChild(option);
        });
        dashboardContent.insertBefore(subtopicFilter, dashboardData);
        dashboardContent.insertBefore(topicFilter, subtopicFilter);
    } catch (error) {
        console.error('Error fetching dashboard topics:', error);
    }
}

async function populateSubtopicFilter(topic) {
    try {
        const response = await fetch(`/api/questions/dashboard-subtopics/${topic}`);
        const subtopics = await response.json();
        subtopicFilter.innerHTML = '<option value="">All Subtopics</option>';
        subtopics.forEach(subtopic => {
            const option = document.createElement('option');
            option.value = subtopic;
            option.textContent = subtopic;
            subtopicFilter.appendChild(option);
        });
        subtopicFilter.disabled = false;
    } catch (error) {
        console.error('Error fetching dashboard subtopics:', error);
    }
}

async function fetchDashboardData() {
    try {
        const topic = topicFilter.value;
        const subtopic = subtopicFilter.value;
        let url = '/api/questions/dashboard';
        if (topic) {
            url += `/${topic}`;
            if (subtopic) {
                url += `/${subtopic}`;
            }
        }
        const response = await fetch(url);
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
        populateTopicFilter();
        fetchDashboardData();
    } else if (tab === 'converter') {
        converterTab.classList.add('active');
        converterContent.style.display = 'block';
    }
}

topicFilter.addEventListener('change', (event) => {
    const selectedTopic = event.target.value;
    if (selectedTopic) {
        populateSubtopicFilter(selectedTopic);
    } else {
        subtopicFilter.innerHTML = '<option value="">All Subtopics</option>';
        subtopicFilter.disabled = true;
    }
    fetchDashboardData();
});

subtopicFilter.addEventListener('change', fetchDashboardData);

function displayDashboardData(data) {
    console.log('Displaying dashboard data:', data);
    if (!data || data.length === 0) {
        dashboardData.innerHTML = '<p>No quiz results available.</p>';
        return;
    }

    // Sort the entire data array by timestamp in descending order
    data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Group data by topic, subtopic, and subs
    const groupedData = data.reduce((acc, result) => {
        const key = `${result.topic}-${result.subtopic}-${result.subs}`;
        if (!acc[key]) {
            acc[key] = [];
        }
        acc[key].push(result);
        return acc;
    }, {});

    // Clear previous charts
    const chartsContainer = document.getElementById('chartsContainer');
    chartsContainer.innerHTML = '';

    // Create a chart for each topic-subtopic-subs combination
    Object.entries(groupedData).forEach(([key, results]) => {
        const [topic, subtopic, subs] = key.split('-');
        
        // Sort results for this group by timestamp in descending order
        results.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        const labels = results.map(result => new Date(result.timestamp).toLocaleString());
        const percentages = results.map(result => (result.score / result.totalQuestions) * 100);

        // Create a canvas element for the chart
        const canvas = document.createElement('canvas');
        canvas.id = `chart-${key}`;
        chartsContainer.appendChild(canvas);

        // Get the info field from the first result in the group
        const info = results[0].info || 'No info available';
        console.log('Chart info:', results[0].info ); // Log the info field for each chart

        // Render the chart
        const ctx = canvas.getContext('2d');
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: `Quiz Scores for ${topic} - ${info}`, // Updated label to use info
                    data: percentages,
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
                        },
                        reverse: true
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Score Percentage'
                        },
                        beginAtZero: true,
                        max: 100
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const dataIndex = context.dataIndex;
                                const result = results[dataIndex];
                                const percentage = percentages[dataIndex].toFixed(2);
                                return `${result.score} / ${result.totalQuestions} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    });
}

// Call this function when the page loads to set up the initial state
function initializePage() {
    switchTab('quiz');
    fetchTopics();
    // fetchMongoCollections(); // Add this line to fetch MongoDB collections
}

// Call the initialization function when the page loads
document.addEventListener('DOMContentLoaded', initializePage);

// const mongoCollectionSelect = document.getElementById('mongoCollection');

// // Add this function to fetch MongoDB collections
// async function fetchMongoCollections() {
//     try {
//         const response = await fetch('/api/questions/collections');
//         const collections = await response.json();
//         mongoCollectionSelect.innerHTML = '<option value="" disabled selected>Select a MongoDB Collection</option>';
//         collections.forEach(collection => {
//             const option = document.createElement('option');
//             option.value = collection;
//             option.textContent = collection;
//             mongoCollectionSelect.appendChild(option);
//         });
//         console.log('Fetched MongoDB collections:', collections);
//     } catch (error) {
//         console.error('Error fetching MongoDB collections:', error);
//     }
// }

document.addEventListener('DOMContentLoaded', () => {
  const topicSelect = document.getElementById('topic');
  const subtopicSelect = document.getElementById('subtopic');

  // Fetch and populate topics
  fetch('/api/questions/topics')
    .then(response => response.json())
    .then(topics => {
      topicSelect.innerHTML = '<option value="" disabled selected>Select a topic</option>';
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

  topicSelect.addEventListener('change', updateSubtopics);

  function updateSubtopics() {
    const topic = topicSelect.value;
    subtopicSelect.innerHTML = '<option value="">Select Subtopic</option>';
    subtopicSelect.disabled = true;

    if (topic) {
      fetch(`/api/questions/subtopics/${topic}`)
        .then(response => response.json())
        .then(classifiedSubtopics => {
          if (Object.keys(classifiedSubtopics).length > 0) {
            const addedSubtopics = new Set();
            for (const [subsValue, subtopics] of Object.entries(classifiedSubtopics)) {
              const optgroup = document.createElement('optgroup');
              
              // Get the info from the first subtopic in this group
              const groupInfo = subtopics[0].info || '  No extra info added';
              
              // Add the info to the optgroup label
              optgroup.label = `Subset: ${subsValue} -   ${groupInfo}`;
              
              subtopics.forEach(subtopic => {
                if (!addedSubtopics.has(subtopic.name)) {
                  const option = document.createElement('option');
                  option.value = subtopic.name; // Use subtopic as the value
                  option.textContent = `Start -  ${subtopic.name} (${subtopic.count} questions)`;
                  if (subtopic.info) {
                    option.dataset.info = subtopic.info;
                  }
                  optgroup.appendChild(option);
                  addedSubtopics.add(subtopic.name);
                }
              });
              if (optgroup.children.length > 0) {
                subtopicSelect.appendChild(optgroup);
              }
            }
            subtopicSelect.disabled = false;
          } else {
            const option = document.createElement('option');
            option.value = "default";
            option.textContent = "No subtopics available";
            subtopicSelect.appendChild(option);
          }
        });
    }
  }

  // Other existing code...
});

topicFilter.addEventListener('change', fetchDashboardData);

function startTimer() {
    let timeLeft = quizDuration;
    updateTimerDisplay(timeLeft);
    
    timerInterval = setInterval(() => {
        timeLeft--;
        updateTimerDisplay(timeLeft);
        
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            submitQuiz();
        }
    }, 1000);
}

function updateTimerDisplay(timeLeft) {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    document.getElementById('timeRemaining').textContent = `Time Remaining: ${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    const progressPercentage = (timeLeft / quizDuration) * 100;
    document.getElementById('timerBar').value = progressPercentage;
}

function setupStickyTimer() {
    const stickyTimer = document.querySelector('.sticky-timer');
    const observer = new IntersectionObserver(
        ([e]) => e.target.classList.toggle('stuck', e.intersectionRatio < 1),
        { threshold: [1] }
    );

    observer.observe(stickyTimer);
}