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
    subtopicSelect.innerHTML = '';
    subtopicSelect.disabled = true;

    const loadingSpinner = document.getElementById('subtopicLoading');

    if (topic) {
        loadingSpinner.style.display = 'inline-block';

        fetch(`/api/questions/subtopics/${topic}`)
            .then(response => response.json())
            .then(classifiedSubtopics => {
                console.log('Received subtopics:', classifiedSubtopics); // Debug info
                if (Object.keys(classifiedSubtopics).length > 0) {
                    const addedSubtopics = new Set();
                    for (const [subsValue, subtopics] of Object.entries(classifiedSubtopics)) {
                        const subsetContainer = document.createElement('div');
                        subsetContainer.className = 'subset-container';
                        const groupInfo = subtopics[0].info || 'No extra info added';
                        
                        // Add subset label
                        const subsetLabel = document.createElement('span');
                        subsetLabel.textContent = `Subset: ${subsValue} - ${groupInfo}`;
                        subsetContainer.appendChild(subsetLabel);
                        
                        // Add delete button
                        const deleteButton = createDeleteButton(subsValue, topic);
                        subsetContainer.appendChild(deleteButton);
                        
                        // Add the subset container to the subtopicSelect
                        subtopicSelect.appendChild(subsetContainer);

                        subtopics.forEach(subtopic => {
                            if (!addedSubtopics.has(subtopic.name)) {
                                const option = document.createElement('div');
                                option.className = 'subtopic-option';
                                option.dataset.value = subtopic.name;
                                option.textContent = `Start - ${subtopic.name} (${subtopic.count} questions)`;
                                if (subtopic.info) {
                                    option.dataset.info = subtopic.info;
                                }
                                subtopicSelect.appendChild(option);
                                addedSubtopics.add(subtopic.name);
                            }
                        });
                    }
                    subtopicSelect.disabled = false;
                } else {
                    const option = document.createElement('div');
                    option.className = 'subtopic-option';
                    option.dataset.value = "default";
                    option.textContent = "No subtopics available";
                    subtopicSelect.appendChild(option);
                }
            })
            .catch(error => {
                console.error('Error fetching subtopics:', error);
                const option = document.createElement('div');
                option.className = 'subtopic-option';
                option.dataset.value = "error";
                option.textContent = "Error loading subtopics";
                subtopicSelect.appendChild(option);
            })
            .finally(() => {
                loadingSpinner.style.display = 'none';
            });
    } else {
        loadingSpinner.style.display = 'none';
    }
}

function createDeleteButton(subsValue, topic) {
    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Delete';
    deleteButton.className = 'delete-subset-btn';
    deleteButton.onclick = (e) => {
        e.preventDefault(); // Prevent the dropdown from closing
        if (confirm(`Are you sure you want to delete subset ${subsValue} for topic ${topic}?`)) {
            deleteSubset(topic, subsValue);
        }
    };
    return deleteButton;
}

async function deleteSubset(topic, subsValue) {
    try {
        const response = await fetch(`/api/questions/delete-subset/${topic}/${subsValue}`, {
            method: 'DELETE',
        });
        if (response.ok) {
            console.log(`Subset ${subsValue} deleted successfully for topic ${topic}`);
            updateSubtopics(); // Refresh the subtopics list
        } else {
            console.error('Failed to delete subset:', await response.text());
        }
    } catch (error) {
        console.error('Error deleting subset:', error);
    }
}

startButton.addEventListener('click', startQuiz);
submitButton.addEventListener('click', submitQuiz);
restartButton.addEventListener('click', restartQuiz);

let quizStartTime;
let quizDuration;
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

// Update the subtopic selection event listener
subtopicSelect.addEventListener('click', (event) => {
    if (event.target.classList.contains('subtopic-option')) {
        // Remove 'selected' class from all options
        document.querySelectorAll('.subtopic-option').forEach(option => {
            option.classList.remove('selected');
        });
        // Add 'selected' class to the clicked option
        event.target.classList.add('selected');
        const selectedValue = event.target.dataset.value;
        console.log('Selected subtopic:', selectedValue);
    }
});

// Update the startQuiz function
function startQuiz() {
    console.log('startQuiz function called'); // Debug log
    const topic = topicSelect.value;
    const subtopicElement = document.querySelector('.subtopic-option.selected');
    const subtopic = subtopicElement ? subtopicElement.dataset.value : '';

    console.log('Selected topic:', topic); // Debug log
    console.log('Selected subtopic:', subtopic); // Debug log
    console.log('Selected question count:', selectedQuestionCount); // Debug log

    if (!topic || (!subtopic && subtopicSelect.children.length > 1)) {
        alert('Please select a topic and subtopic (if available)');
        return;
    }

    const subtopicPath = subtopic === "default" ? "" : `/${subtopic}`;
    const timestamp = new Date().getTime();
    const url = `/api/questions/${topic}${subtopicPath}/${selectedQuestionCount}?t=${timestamp}`;
    
    console.log('Fetching questions from:', url); // Debug log

    fetch(url, {
        cache: 'no-store'
    })
        .then(response => {
            console.log('Response status:', response.status); // Debug log
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Received questions:', data); // Debug log
            if (!Array.isArray(data) || data.length === 0) {
                throw new Error('No questions received');
            }
            currentQuestions = data;
            score = 0;
            setup.style.display = 'none';
            quiz.style.display = 'block';
            results.style.display = 'none';
            displayQuestions();
            updateScore();
            
            startTimer();
            setupStickyTimer();
        })
        .catch(error => {
            console.error('Error starting quiz:', error);
            alert('Failed to start quiz. Please try again. Error: ' + error.message);
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
            <button class="suggest-correction" data-question-id="${question._id}">Suggest Correction</button>
        `;
        questionsContainer.appendChild(questionElement);
    });

    // Add event listeners to options and suggest correction buttons
    document.querySelectorAll('.option').forEach(option => {
        option.addEventListener('click', () => selectOption(option));
    });
    document.querySelectorAll('.suggest-correction').forEach(button => {
        button.addEventListener('click', () => suggestCorrection(button.dataset.questionId));
    });
}

function suggestCorrection(questionId) {
    const question = currentQuestions.find(q => q._id === questionId);
    const questionElement = document.querySelector(`[data-question-id="${questionId}"]`).closest('.question');
    
    // Remove any existing modal
    const existingModal = document.querySelector('.modal');
    if (existingModal) {
        existingModal.remove();
    }

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h2>Suggest Correction</h2>
            <p>Question: ${question.question_text}</p>
            <form id="correctionForm">
                <div id="optionsContainer">
                    ${question.options.map((option, index) => `
                        <div class="option-edit">
                            <label for="option${index}">Option ${option.value}:</label>
                            <input type="text" id="option${index}" value="${option.text}" required>
                        </div>
                    `).join('')}
                </div>
                <label for="correctedAnswer">Correct Answer:</label>
                <select id="correctedAnswer" required>
                    ${question.options.map(option => `
                        <option value="${option.value}" ${option.value === question.correct_answer ? 'selected' : ''}>
                            ${option.value}
                        </option>
                    `).join('')}
                </select>
                <button type="submit">Submit Correction</button>
                <button type="button" id="cancelCorrection">Cancel</button>
            </form>
        </div>
    `;
    
    // Insert the modal after the question element
    questionElement.insertAdjacentElement('afterend', modal);

    document.getElementById('correctionForm').addEventListener('submit', (e) => {
        e.preventDefault();
        submitOptionCorrection(questionId);
    });

    document.getElementById('cancelCorrection').addEventListener('click', () => {
        modal.remove();
    });
}

function submitOptionCorrection(questionId) {
    const correctedOptions = Array.from(document.querySelectorAll('.option-edit input')).map((input, index) => ({
        value: String.fromCharCode(97 + index), // 'a', 'b', 'c', 'd'
        text: input.value
    }));
    const correctedAnswer = document.getElementById('correctedAnswer').value;
    const topic = topicSelect.value;

    const password = prompt("Please enter the admin password to submit the correction:");
    if (!password) {
        alert("Password is required to submit a correction.");
        return;
    }

    console.log('Submitting correction:', { questionId, correctedOptions, correctedAnswer, topic });

    fetch('/api/questions/suggest-option-correction', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            questionId,
            correctedOptions,
            correctedAnswer,
            topic,
            password
        }),
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => {
                throw new Error(err.message || 'Unknown error occurred');
            });
        }
        return response.json();
    })
    .then(data => {
        console.log('Question updated successfully:', data);
        alert('Question updated successfully!');
        
        // Find and remove the modal
        const modal = document.querySelector('.modal');
        if (modal) {
            modal.remove();
        }
        
        // Refresh the questions display
        startQuiz();
    })
    .catch(error => {
        console.error('Error updating question:', error);
        alert(`Failed to update question: ${error.message}`);
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
    subtopicSelect.innerHTML = '';
    subtopicSelect.disabled = true;

    if (topic) {
      fetch(`/api/questions/subtopics/${topic}`)
        .then(response => response.json())
        .then(classifiedSubtopics => {
          if (Object.keys(classifiedSubtopics).length > 0) {
            const addedSubtopics = new Set();
            for (const [subsValue, subtopics] of Object.entries(classifiedSubtopics)) {
            //   const subsetContainer = document.createElement('div');
            //   subsetContainer.className = 'subset-container';
            //   const groupInfo = subtopics[0].info || 'No extra info added';
              
              // Add subset label
              const subsetLabel = document.createElement('span');
              subsetLabel.textContent = `Subset: ${subsValue} - ${groupInfo}`;
              subsetContainer.appendChild(subsetLabel);
              
              // Add delete button
              const deleteButton = createDeleteButton(subsValue, topic);
              subsetContainer.appendChild(deleteButton);
              
              // Add the subset container to the subtopicSelect
              subtopicSelect.appendChild(subsetContainer);

              subtopics.forEach(subtopic => {
                if (!addedSubtopics.has(subtopic.name)) {
                  const option = document.createElement('div');
                  option.className = 'subtopic-option';
                  option.dataset.value = subtopic.name;
                  option.textContent = `Start - ${subtopic.name} (${subtopic.count} questions)`;
                  if (subtopic.info) {
                    option.dataset.info = subtopic.info;
                  }
                  subtopicSelect.appendChild(option);
                  addedSubtopics.add(subtopic.name);
                }
              });
            }
            subtopicSelect.disabled = false;
          } else {
            const option = document.createElement('div');
            option.className = 'subtopic-option';
            option.dataset.value = "default";
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
    quizStartTime = Date.now();
    quizDuration = currentQuestions.length * 60 * 1000; // Convert minutes to milliseconds
    
    updateTimerDisplay();
    
    timerInterval = setInterval(updateTimerDisplay, 1000);
}

function updateTimerDisplay() {
    const currentTime = Date.now();
    const elapsedTime = currentTime - quizStartTime;
    const remainingTime = Math.max(quizDuration - elapsedTime, 0);
    
    const minutes = Math.floor(remainingTime / 60000);
    const seconds = Math.floor((remainingTime % 60000) / 1000);
    
    document.getElementById('timeRemaining').textContent = `Time Remaining: ${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    const progressPercentage = (remainingTime / quizDuration) * 100;
    document.getElementById('timerBar').value = progressPercentage;

    if (remainingTime <= 0) {
        clearInterval(timerInterval);
        submitQuiz();
    }
}

function setupStickyTimer() {
    const stickyTimer = document.querySelector('.sticky-timer');
    const observer = new IntersectionObserver(
        ([e]) => e.target.classList.toggle('stuck', e.intersectionRatio < 1),
        { threshold: [1] }
    );

    observer.observe(stickyTimer);
}

subtopicSelect.addEventListener('click', (event) => {
    if (event.target.classList.contains('subtopic-option')) {
        const selectedValue = event.target.dataset.value;
        console.log('Selected subtopic:', selectedValue);
        // Here you can update any other parts of your UI that need to know the selected subtopic
    }
});

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded');
    const startButton = document.getElementById('startQuiz');
    if (startButton) {
        console.log('Start button found');
        startButton.addEventListener('click', () => {
            console.log('Start button clicked');
            startQuiz();
        });
    } else {
        console.error('Start button not found');
    }
});