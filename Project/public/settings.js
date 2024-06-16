
//FOR DARK MODE
document.addEventListener('DOMContentLoaded', function() {
    // Toggle dark mode
    document.getElementById('darkModeToggle').addEventListener('click', function() {
        document.body.classList.toggle('dark-mode');
    });
});

//FOR EDIT BUTTONS
document.addEventListener('DOMContentLoaded', function() {
    // Add event listeners to edit buttons
    const editButtons = document.querySelectorAll('.edit-button');
    editButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Get the parent list item containing the data to be edited
            const listItem = button.closest('li');
            // Get the data type (e.g., email) from the button's data-type attribute
            const dataType = button.getAttribute('data-type');

            // Prompt the user to enter the new value
            const currentValue = listItem.querySelector('span').textContent;
            const newValue = prompt(`Enter new ${dataType}:`, currentValue);

            // Check if the dataType is 'email' and validate the email format
            if (dataType === 'email' && !isValidEmail(newValue)) {
                alert('Invalid email format. Please enter a valid email address.');
                return; // Stop further execution
            }

            // If the user provided a new value, update the UI and send the update to the server
            if (newValue !== null && newValue !== currentValue) {
                listItem.querySelector('span').textContent = newValue;

                // Assuming user ID is available as a global variable
                const userId = '<%= userId %>';
                const updatedData = { user_id: userId };
                updatedData[dataType] = newValue;
                fetch('/api/user/update', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(updatedData)
                })
                .then(response => response.json())
                .then(data => {
                    console.log(data.message); // Log success message
                })
                .catch(error => {
                    console.error('Error updating user data:', error);
                    alert('Failed to update user data. Please try again later.');
                });
            }
        });
    });
});

// Function to validate email format
function isValidEmail(email) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
}
