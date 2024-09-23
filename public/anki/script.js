document.addEventListener('DOMContentLoaded', () => {
    const ankiButton = document.getElementById('ankiButton');
    const ankiText = document.getElementById('ankiText');
    const popup = document.getElementById('popup');
    const popupText = document.getElementById('popupText');
    const copyButton = document.getElementById('copyButton');
    const closeButton = document.querySelector('.close');

    ankiButton.addEventListener('click', () => {
        const text = ankiText.value;
        if (text.trim() === '') {
            alert('Please enter some text.');
            return;
        }

        // Show the popup and populate the text box
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
});
