document.addEventListener('DOMContentLoaded', () => {
    fetchCorrections();
});

function fetchCorrections() {
    fetch('/api/questions/corrections')
        .then(response => response.json())
        .then(corrections => {
            displayCorrections(corrections);
        })
        .catch(error => {
            console.error('Error fetching corrections:', error);
        });
}

function displayCorrections(corrections) {
    const correctionsContainer = document.getElementById('corrections');
    correctionsContainer.innerHTML = '';

    corrections.forEach(correction => {
        const correctionElement = document.createElement('div');
        correctionElement.className = 'correction';
        let correctionDetails;

        if (correction.type === 'option_correction') {
            correctionDetails = `
                <h4>Corrected Options:</h4>
                <ul>
                    ${correction.correctedOptions.map(option => `<li>${option.value}: ${option.text}</li>`).join('')}
                </ul>
                <p>Corrected Answer: ${correction.correctedAnswer}</p>
            `;
        } else {
            correctionDetails = `
                <p>Corrected Question: ${correction.correctedQuestion}</p>
                <p>Corrected Answer: ${correction.correctedAnswer}</p>
            `;
        }

        correctionElement.innerHTML = `
            <h3>Question ID: ${correction.questionId}</h3>
            ${correctionDetails}
            <button onclick="approveCorrection('${correction._id}')">Approve</button>
        `;
        correctionsContainer.appendChild(correctionElement);
    });
}

function approveCorrection(correctionId) {
    console.log('Approving correction:', correctionId);
    fetch('/api/questions/approve-correction', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ correctionId }),
    })
    .then(response => response.json())
    .then(data => {
        console.log('Approval response:', data);
        alert(data.message);
        fetchCorrections(); // Refresh the list of corrections
    })
    .catch(error => {
        console.error('Error approving correction:', error);
        alert('Failed to approve correction. Please try again.');
    });
}