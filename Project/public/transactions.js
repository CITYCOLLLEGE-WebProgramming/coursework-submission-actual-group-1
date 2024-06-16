document.addEventListener('DOMContentLoaded', function () {
    const transactionsPerPage = 6;
    let transactions = [
        { bankName: "Attica Bank", description: "Replenishments", amount: "+2 345 $", imgSrc: "img/bank-logo.jpg", id: "1", bankId: "12345", dateTime: "2024-06-10 10:00", senderId: "67890" },
        { bankName: "Piraues Bank", description: "Financial Services", amount: "-2 340 $", imgSrc: "img/bank-logo.jpg", id: "2", bankId: "12346", dateTime: "2024-06-10 11:00", senderId: "67891" },
        { bankName: "Alpha Bank", description: "Money Transfer", amount: "+2 142 $", imgSrc: "img/bank-logo.jpg", id: "3", bankId: "12347", dateTime: "2024-06-10 12:00", senderId: "67892" },
        { bankName: "National Bank", description: "Loan Payment", amount: "-1 500 $", imgSrc: "img/bank-logo.jpg", id: "4", bankId: "12348", dateTime: "2024-06-10 13:00", senderId: "67893" },
        { bankName: "Eurobank", description: "ATM Withdrawal", amount: "-200 $", imgSrc: "img/bank-logo.jpg", id: "5", bankId: "12349", dateTime: "2024-06-10 14:00", senderId: "67894" },
        { bankName: "Alpha Bank", description: "Deposit", amount: "+3 000 $", imgSrc: "img/bank-logo.jpg", id: "6", bankId: "12350", dateTime: "2024-06-10 15:00", senderId: "67895" },
        { bankName: "Attica Bank", description: "Bill Payment", amount: "-150 $", imgSrc: "img/bank-logo.jpg", id: "7", bankId: "12351", dateTime: "2024-06-10 16:00", senderId: "67896" },
        { bankName: "Piraues Bank", description: "Online Purchase", amount: "-500 $", imgSrc: "img/bank-logo.jpg", id: "8", bankId: "12352", dateTime: "2024-06-10 17:00", senderId: "67897" },
        { bankName: "Eurobank", description: "Transfer to Savings", amount: "+1 200 $", imgSrc: "img/bank-logo.jpg", id: "9", bankId: "12353", dateTime: "2024-06-10 18:00", senderId: "67898" },
        { bankName: "Alpha Bank", description: "Mortgage Payment", amount: "-1 300 $", imgSrc: "img/bank-logo.jpg", id: "10", bankId: "12354", dateTime: "2024-06-10 19:00", senderId: "67899" },
        { bankName: "National Bank", description: "Replenishments", amount: "+900 $", imgSrc: "img/bank-logo.jpg", id: "11", bankId: "12355", dateTime: "2024-06-10 20:00", senderId: "67900" },
        { bankName: "Attica Bank", description: "Insurance Payment", amount: "-200 $", imgSrc: "img/bank-logo.jpg", id: "12", bankId: "12356", dateTime: "2024-06-10 21:00", senderId: "67901" },
        { bankName: "Piraues Bank", description: "Salary Deposit", amount: "+4 500 $", imgSrc: "img/bank-logo.jpg", id: "13", bankId: "12357", dateTime: "2024-06-10 22:00", senderId: "67902" },
        { bankName: "Alpha Bank", description: "Charity Donation", amount: "-300 $", imgSrc: "img/bank-logo.jpg", id: "14", bankId: "12358", dateTime: "2024-06-10 23:00", senderId: "67903" },
        { bankName: "Eurobank", description: "Investment Deposit", amount: "+5 000 $", imgSrc: "img/bank-logo.jpg", id: "15", bankId: "12359", dateTime: "2024-06-11 09:00", senderId: "67904" },
        { bankName: "National Bank", description: "Utility Payment", amount: "-100 $", imgSrc: "img/bank-logo.jpg", id: "16", bankId: "12360", dateTime: "2024-06-11 10:00", senderId: "67905" },
        { bankName: "Attica Bank", description: "Travel Expenses", amount: "-700 $", imgSrc: "img/bank-logo.jpg", id: "17", bankId: "12361", dateTime: "2024-06-11 11:00", senderId: "67906" },
        { bankName: "Piraues Bank", description: "Replenishments", amount: "+2 800 $", imgSrc: "img/bank-logo.jpg", id: "18", bankId: "12362", dateTime: "2024-06-11 12:00", senderId: "67907" },
        { bankName: "Alpha Bank", description: "Online Shopping", amount: "-600 $", imgSrc: "img/bank-logo.jpg", id: "19", bankId: "12363", dateTime: "2024-06-11 13:00", senderId: "67908" },
        { bankName: "National Bank", description: "Replenishments", amount: "+1 500 $", imgSrc: "img/bank-logo.jpg", id: "20", bankId: "12364", dateTime: "2024-06-11 14:00", senderId: "67909" }
    ];

    const transactionsContainer = document.getElementById('transactions-container');
    const pageButtonsContainer = document.querySelector('.pagination');
    const sortButton = document.getElementById('sort-button');
    const searchInput = document.getElementById('search-input');
    const overlay = document.getElementById('overlay');
    const closeButton = document.getElementById('close-popup');
    let isSorted = false;
    let filteredTransactions = [...transactions]; // Create a copy for filtering

    function renderTransactions(transactionsToDisplay) {
        transactionsContainer.innerHTML = '';
    
        transactionsToDisplay.forEach(transaction => {
            const transactionRow = document.createElement('div');
            transactionRow.className = 'recent-row';
            transactionRow.dataset.bankId = transaction.bankId;
            transactionRow.dataset.bankName = transaction.bankName;
            transactionRow.dataset.dateTime = transaction.dateTime;
            transactionRow.dataset.senderId = transaction.senderId;
            transactionRow.dataset.amount = transaction.amount; // Добавляем amount как data-attribute
    
            const amountClass = transaction.amount.includes('-') ? 'negative' : 'positive';
            transactionRow.innerHTML = `
                <div class="recent-details">
                    <p class="recent-bank-name">${transaction.bankName}</p>
                    <p class="recent-description">${transaction.description}</p>
                </div>
                <p class="recent-money-amount ${amountClass}">${transaction.amount}</p>
            `;
            transactionsContainer.appendChild(transactionRow);
        });
    }
    

    function renderPageButtons(totalPages) {
        pageButtonsContainer.innerHTML = '';

        for (let i = 1; i <= totalPages; i++) {
            const button = document.createElement('button');
            button.textContent = i;
            button.dataset.page = i;
            button.classList.add('page-btn');
            pageButtonsContainer.appendChild(button);
        }
    }

    function setActivePageButton(page) {
        const pageButtons = document.querySelectorAll('.page-btn');
        pageButtons.forEach(btn => btn.classList.remove('active'));
        const activeButton = pageButtons[page - 1];
        if (activeButton) {
            activeButton.classList.add('active');
        }
    }

    function sortTransactions() {
        filteredTransactions.sort((a, b) => parseFloat(a.amount.replace(/[^\d.-]/g, '')) - parseFloat(b.amount.replace(/[^\d.-]/g, '')));
    }

    function showPopup(transaction) {
        document.getElementById('bank-id').textContent = `Bank Id: ${transaction.dataset.bankId}`;
        document.getElementById('bank-name').textContent = `Bank Name: ${transaction.dataset.bankName}`;
        document.getElementById('dateTime').textContent = `Date and Time: ${transaction.dataset.dateTime}`;
        document.getElementById('sender-id').textContent = `Sender Id: #${transaction.dataset.senderId}`;
        document.getElementById('amount').textContent = `Amount: ${transaction.dataset.amount}`; // Обновление суммы
    
        overlay.classList.add('show');
    }
    

    function hidePopup() {
        overlay.classList.remove('show');
    }

    transactionsContainer.addEventListener('click', function (event) {
        const row = event.target.closest('.recent-row');
        if (row) {
            showPopup(row);
        }
    });

    closeButton.addEventListener('click', hidePopup);

    pageButtonsContainer.addEventListener('click', function (event) {
        if (event.target.classList.contains('page-btn')) {
            const page = parseInt(event.target.dataset.page);
            const start = (page - 1) * transactionsPerPage;
            const end = start + transactionsPerPage;
            renderTransactions(filteredTransactions.slice(start, end));
            setActivePageButton(page);
        }
    });

    sortButton.addEventListener('click', function () {
        if (!isSorted) {
            sortTransactions();
            sortButton.textContent = "Unsort";
        } else {
            filteredTransactions = [...transactions]; // Reset to original
            sortButton.textContent = "Sort";
        }
        isSorted = !isSorted;

        const start = 0;
        const end = transactionsPerPage;
        renderTransactions(filteredTransactions.slice(start, end));
        renderPageButtons(Math.ceil(filteredTransactions.length / transactionsPerPage));
        setActivePageButton(1);
    });

    searchInput.addEventListener('input', function () {
        const query = searchInput.value.toLowerCase();
        filteredTransactions = transactions.filter(transaction => 
            transaction.bankName.toLowerCase().includes(query) ||
            transaction.description.toLowerCase().includes(query) ||
            transaction.amount.toLowerCase().includes(query)
        );
        const start = 0;
        const end = transactionsPerPage;
        renderTransactions(filteredTransactions.slice(start, end));
        renderPageButtons(Math.ceil(filteredTransactions.length / transactionsPerPage));
        setActivePageButton(1);
    });

    // Initial render
    renderTransactions(filteredTransactions.slice(0, transactionsPerPage));
    renderPageButtons(Math.ceil(filteredTransactions.length / transactionsPerPage));
    setActivePageButton(1);
});