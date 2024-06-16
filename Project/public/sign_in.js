//NIKITA CODE
const overlay = document.getElementById("main-box");
const openSignUpButton = document.getElementById("slide-left-button");
const openSignInButton = document.getElementById("slide-right-button");
const leftText = document.getElementById("sign-in");
const rightText = document.getElementById("sign-up");
const accountForm = document.getElementById("sign-in-info");
const signinForm = document.getElementById("sign-up-info");
const signUpForm = document.getElementById("sign-up-form");
const nameInput = document.getElementById("name");

function openSignUp() {
    leftText.classList.remove("overlay-text-left-animation-out");
    overlay.classList.remove("open-sign-in");
    rightText.classList.remove("overlay-text-right-animation");
    accountForm.classList.add("form-left-slide-out");
    rightText.classList.add("overlay-text-right-animation-out");
    overlay.classList.add("open-sign-up");
    leftText.classList.add("overlay-text-left-animation");

    setTimeout(function () {
        accountForm.style.display = "none";
        accountForm.classList.remove("form-left-slide-in");
        accountForm.classList.remove("form-left-slide-out");
    }, 500);

    setTimeout(function () {
        signinForm.style.display = "flex";
        signinForm.classList.add("form-right-slide-in");
    }, 100);
}

function openSignIn() {
    leftText.classList.remove("overlay-text-left-animation");
    overlay.classList.remove("open-sign-up");
    rightText.classList.remove("overlay-text-right-animation-out");
    signinForm.classList.add("form-right-slide-out");
    leftText.classList.add("overlay-text-left-animation-out");
    overlay.classList.add("open-sign-in");
    rightText.classList.add("overlay-text-right-animation");

    setTimeout(function () {
        signinForm.style.display = "none";
        signinForm.classList.remove("form-right-slide-in");
        signinForm.classList.remove("form-right-slide-out");
    }, 500);

    setTimeout(function () {
        accountForm.style.display = "flex";
        accountForm.classList.add("form-left-slide-in");
    }, 100);
}

//MY CODE
document.addEventListener('DOMContentLoaded', function() {
    // Check if the current page is settings.html
    if (window.location.pathname === '/settings.html') {
        // Fetch user profile information from the server
        fetch('/api/user/profile')
            .then(response => response.json())
            .then(data => {
                // Update HTML with user profile information
                document.getElementById('email').textContent = data.email;
                document.getElementById('fullname').textContent = `${data.first_name} ${data.last_name}`;
            })
            .catch(error => {
                console.error('Error fetching user profile:', error);
                alert('Failed to fetch user profile. Please try again later.');
            });
    }
});

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
            // Get the data type (e.g., email, phone) from the list item's ID
            const dataType = button.id.startsWith('editEmail') ? 'email' : 'phone_number'; // Adjusted to detect email or phone_number
            // Prompt the user to enter the new value
            const newValue = prompt(`Enter new ${dataType}:`, listItem.querySelector('span').textContent);

            if (dataType === 'email' && !isValidEmail(newValue)) {
                alert('Invalid email format. Please enter a valid email address.');
                return; // Stop further execution
            } //else if (dataType === 'phone_number' && !isValidPhoneNumber(newValue)) {
            //     alert('Invalid phone number format. Please enter a valid phone number.');
            //     return; // Stop further execution
            // }

            // If the user provided a new value, update the UI and send the update to the server
            if (newValue !== null) {
                listItem.querySelector('span').textContent = newValue;
                // Send the updated data to the server
                const updatedData = { user_id: 1 }; // Assuming user_id is 1
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

// FOR SIGN UP
document.addEventListener('DOMContentLoaded', function() {
    const signUpForm = document.getElementById('sign-up-form');
    signUpForm.addEventListener('submit', function(event) {
        event.preventDefault(); // Prevent default form submission

        const formData = new FormData(signUpForm);
        const jsonData = {};
        formData.forEach((value, key) => {
            jsonData[key] = value;
        });

        // Send registration data to the server
        fetch('/api/user/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(jsonData)
        })
        .then(response => {
            if (response.ok) {
                return response.json(); // Parse response JSON
            } else {
                throw new Error('Failed to register'); // Handle non-OK response
            }
        })
        .then(data => {
            alert('User registered successfully');
            // Redirect to login page after registration (handled by server-side redirect)
            window.location.href = data.redirectUrl; // Redirect to URL from server response
        })
        .catch(error => {
            console.error('Error registering user:', error);
            alert('Failed to register. Please try again later.');
        });
    });
});

document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('sign-in-form');
    loginForm.addEventListener('submit', function(event) {
        event.preventDefault(); // Prevent default form submission

        const formData = new FormData(loginForm);
        const jsonData = {};
        formData.forEach((value, key) => {
            jsonData[key] = value;
        });

        // Send login credentials to the server for authentication
        fetch('/api/user/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(jsonData)
        })
        .then(response => {
            if (response.ok) {
                return response.json(); // Parse response JSON
            } else {
                throw new Error('Login failed'); // Handle non-OK response
            }
        })
        .then(data => {
            // Assuming server sends a redirectUrl upon successful login
            if (data.redirectUrl) {
                alert('Successfully logged in');
                window.location.href = data.redirectUrl; // Redirect to URL from server response
            } else {
                throw new Error('Redirect URL not provided');
            }
        })
        .catch(error => {
            console.error('Error logging in:', error);
            alert('Invalid username or password. Please try again.');
        });
    });
});

// Function to validate email format
function isValidEmail(email) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
}

// Fuction to validate phone number
// function isValidPhoneNumber(phoneNumber) {
//     if (phoneNumber.length <= 15) {
//         return true;
//     } else {
//         return false;
//     }
// }

openSignUpButton.addEventListener("click", openSignUp);
openSignInButton.addEventListener("click", openSignIn);