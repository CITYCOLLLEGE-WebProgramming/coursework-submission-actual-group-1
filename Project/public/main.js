document.addEventListener('DOMContentLoaded', (event) => {
    const overlay = document.getElementById('overlay');
    const closePopupButton = document.getElementById('close-popup');
    const recentRows = document.querySelectorAll('.recent-row');
    var userBalance = 1000; // Replace this with actual user balance fetched from server
    const amountInput = document.getElementById('amount');
    let balanceDisplay = document.getElementById('balance-display');

    function showPopup(transaction) {
        overlay.classList.add('show');
        if (!balanceDisplay) {
            balanceDisplay = document.createElement('p');
            balanceDisplay.id = 'balance-display';
            amountInput.parentNode.insertBefore(balanceDisplay, amountInput.nextSibling);
        }
        balanceDisplay.textContent = 'Maximum transfer amount is ' + userBalance;
    }

    function hidePopup() {
        overlay.classList.remove('show');
    }

    closePopupButton.addEventListener('click', hidePopup);
    recentRows.forEach(row => {
        row.addEventListener('click', () => showPopup(row));
    });
    const overlayTriggers = document.querySelectorAll('.overlay-trigger');
    overlayTriggers.forEach(trigger => {
        trigger.addEventListener('click', () => showPopup(trigger));
    });

    amountInput.addEventListener('input', function() {
        const amountToTransfer = this.value;
        if (amountToTransfer > userBalance) {
            balanceDisplay.style.color = 'red';
            balanceDisplay.textContent = 'Insufficient balance. You can transfer up to ' + userBalance;
        } else {
            balanceDisplay.style.color = 'green';
            balanceDisplay.textContent = 'Maximum transfer amount is ' + userBalance;
        }
    });

    document.getElementById('transaction-form').addEventListener('submit', function(event) {
        event.preventDefault(); 
        const amountToTransfer = document.getElementById('amount').value;
        if (amountToTransfer > userBalance) {
            balanceDisplay.style.color = 'red';
            balanceDisplay.textContent = 'Insufficient balance. You can transfer up to ' + userBalance;
        } else {
            alert('Form submitted successfully!');
            setTimeout(function() {
                hidePopup(); 
            }, 1);
        }
    });
});

document.querySelector('form').addEventListener('submit', async function(event) {
    event.preventDefault(); // Prevent form submission for now

    const ibanInput = document.getElementById('iban');
    const iban = ibanInput.value.trim();

    // Validate IBAN format
    if (!/^\d{28}$/.test(iban)) {
        ibanInput.setCustomValidity('Please enter exactly 28 digits');
        ibanInput.dataset.valid = false;
        return;
    }

    // Check IBAN existence via server-side route
    try {
        const response = await fetch('/api/check-iban', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ iban })
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data = await response.json();

        if (data.exists) {
            ibanInput.setCustomValidity('');
            ibanInput.dataset.valid = true;
            // Submit the form if IBAN exists
            this.submit();
        } else {
            ibanInput.setCustomValidity('IBAN does not exist in database');
            ibanInput.dataset.valid = false;
        }
    } catch (error) {
        console.error('Error checking IBAN existence:', error);
        ibanInput.setCustomValidity('Error checking IBAN existence');
        ibanInput.dataset.valid = false;
    }
});

function validateIBAN(input) {
    const ibanValue = input.value.trim(); // Trim whitespace

    // Validate length and digits only
    if (/^\d{28}$/.test(ibanValue)) {
        input.setCustomValidity('');
        input.dataset.valid = true;
    } else {
        input.setCustomValidity('Please enter exactly 28 digits');
        input.dataset.valid = false;
    }
}