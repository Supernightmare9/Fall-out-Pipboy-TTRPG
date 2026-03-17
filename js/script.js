// JavaScript code for login form validation and player data storage

document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');

    // Validate login form
    loginForm.addEventListener('submit', function(event) {
        event.preventDefault(); // Prevent form submission
        const username = loginForm.username.value;
        const password = loginForm.password.value;

        if (validateForm(username, password)) {
            storePlayerData(username);
            window.location.href = 'character-menu.html'; // Redirect to character menu
        } else {
            alert('Invalid username or password!');
        }
    });

    // Function to validate login form
    function validateForm(username, password) {
        // Simple validation checks (can be enhanced)
        return username.trim() !== '' && password.trim() !== '';
    }

    // Function to store player data in browser storage
    function storePlayerData(username) {
        localStorage.setItem('playerUsername', username);
        // Additional player data can be stored here
    }
});