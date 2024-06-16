const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const multer = require('multer');
const path = require('path');
const session = require('express-session');
const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    next();
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/views'));

app.use(express.static(path.join(__dirname, 'public')));
app.set('public', path.join(__dirname, '/public'));

app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set secure to true if using HTTPS
}));

// Database connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'password123!', //Replace with your database password
    database: 'web_db'        //Replace with your database name
});

db.connect(err => {
    if (err) throw err;
    console.log('Connected to database');
});

// Function to generate a unique 28-digit IBAN
function generateIBAN() {
    let iban = '';
    for (let i = 0; i < 28; i++) {
        const randomDigit = Math.floor(Math.random() * 10);
        iban += randomDigit.toString();
    }
    return iban;
}

// Set up storage engine for multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Ensure this directory exists
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Serve the sign-in form HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'sign_in.html'));
});

// POST route for user registration
app.post('/api/user/register', async (req, res) => {
    const { email, pass, first_name, last_name } = req.body;

    try {
        // Hash the password
        const hashedPassword = await bcrypt.hash(pass, 10); // 10 is the saltRounds

        // Begin database transaction
        db.beginTransaction(err => {
            if (err) {
                console.error('Error starting transaction:', err);
                return res.status(500).json({ error: 'Failed to register. Please try again later.' });
            }

            const userQuery = `INSERT INTO User (pass, email, first_name, last_name) VALUES (?, ?, ?, ?)`;

            db.query(userQuery, [hashedPassword, email, first_name, last_name], (err, result) => {
                if (err) {
                    return db.rollback(() => {
                        console.error('Error registering user:', err);
                        return res.status(500).json({ error: 'Failed to register. Please try again later.' });
                    });
                }

                const new_user_id = result.insertId;
                const accountQuery = `INSERT INTO Account (user_id, account_type, balance, date_created, account_tier, IBAN) VALUES (?, ?, ?, NOW(), ?, ?)`;
                const accountType = 'basic';
                const balance = 0;
                const accountTier = 'bronze';
                const IBAN = generateIBAN();

                db.query(accountQuery, [new_user_id, accountType, balance, accountTier, IBAN], (err, result) => {
                    if (err) {
                        return db.rollback(() => {
                            console.error('Error creating account:', err);
                            return res.status(500).json({ error: 'Failed to create account. Please try again later.' });
                        });
                    }

                    db.commit(err => {
                        if (err) {
                            return db.rollback(() => {
                                console.error('Error committing transaction:', err);
                                return res.status(500).json({ error: 'Failed to register. Please try again later.' });
                            });
                        }

                        // Successful registration and account creation
                        res.status(200).json({ message: 'User registered successfully', redirectUrl: '/' });
                    });
                });
            });
        });
    } catch (error) {
        console.error('Error hashing password:', error);
        res.status(500).json({ error: 'Failed to register. Please try again later.' });
    }
});

// POST route for user login
app.post('/api/user/login', (req, res) => {
    const { email, pass } = req.body;

    const userQuery = `SELECT user_id, pass FROM User WHERE email = ?`;

    db.query(userQuery, [email], async (err, results) => {
        if (err) {
            console.error('Error executing query:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }

        if (results.length === 0) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        const user_id = results[0].user_id;
        const hashedPassword = results[0].pass;

        try {
            // Compare hashed password
            const passwordMatch = await bcrypt.compare(pass, hashedPassword);
            if (!passwordMatch) {
                return res.status(401).json({ error: 'Invalid username or password' });
            }

            // Set user_id in session and cookie for future requests
            req.session.userId = user_id;

            res.status(200).json({ message: 'Login successful', redirectUrl: '/main' });
        } catch (error) {
            console.error('Error comparing passwords:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });
});

app.post('/api/user/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Error destroying session:', err);
            return res.status(500).json({ error: 'Failed to log out. Please try again later.' });
        }

        // Clear the cookie
        res.clearCookie('connect.sid', { path: '/' });

        // Send a JSON response
        res.json({ message: 'Logout successful' });
    });
});

// Middleware to check if user is authenticated
const authenticateUser = (req, res, next) => {
    if (req.session.userId) {
        // User is authenticated, proceed
        next();
    } else {
        // User is not authenticated, redirect to login
        res.redirect('/');
    }
};

app.get('/main', authenticateUser, (req, res) => {
    const user_id = req.session.userId;

    const query = `
        SELECT U.first_name, U.last_name, A.account_id, A.balance, A.IBAN 
        FROM User U 
        JOIN Account A ON U.user_id = A.user_id 
        WHERE U.user_id = ?`;

    db.query(query, [user_id], (err, results) => {
        if (err) {
            console.error('Error retrieving user data:', err);
            return res.status(500).send('Error retrieving user data');
        }

        if (results.length === 0) {
            return res.status(404).send('User not found');
        }

        const userData = results[0];
        res.render('main', {
            name: userData.first_name,
            surname: userData.last_name,
            accountId: userData.account_id,
            amount: userData.balance,
            iban: userData.IBAN
        });
    });
});

// POST route for verification submission
app.post('/verify', upload.fields([
    { name: 'personal_identification_card', maxCount: 1 },
    { name: 'SCN', maxCount: 1 },
    { name: 'Tax_identification_number', maxCount: 1 },
    { name: 'photo_of_passport', maxCount: 1 }
]), (req, res) => {
    const files = req.files;
    const user_id = req.session.userId; // Assume user_id is stored in session

    // Check if the user has already submitted the verification form
    const checkSubmissionQuery = 'SELECT verification_submitted FROM User WHERE user_id = ?';

    db.query(checkSubmissionQuery, [user_id], (err, results) => {
        if (err) {
            console.error('Error checking verification submission status:', err);
            return res.status(500).send('Failed to submit verification. Please try again later.');
        }

        if (results.length === 0 || results[0].verification_submitted) {
            return res.status(400).send('Verification form has already been submitted.');
        }

        const personal_identification_card = files.personal_identification_card[0].path;
        const SCN = files.SCN[0].path;
        const Tax_identification_number = files.Tax_identification_number[0].path;
        const photo_of_passport = files.photo_of_passport[0].path;

        db.beginTransaction(err => {
            if (err) {
                console.error('Error starting transaction:', err);
                return res.status(500).send('Failed to submit verification. Please try again later.');
            }

            const verificationQuery = `INSERT INTO Verification (user_id, personal_identification_card, SCN, Tax_identification_number, photo_of_passport) 
                                       VALUES (?, ?, ?, ?, ?)`;

            db.query(verificationQuery, [user_id, personal_identification_card, SCN, Tax_identification_number, photo_of_passport], (err, result) => {
                if (err) {
                    return db.rollback(() => {
                        console.error('Error submitting verification:', err);
                        return res.status(500).send('Failed to submit verification. Please try again later.');
                    });
                }

                const updateTierQuery = `UPDATE Account SET account_tier = 'silver' WHERE user_id = ?`;
                const updateSubmissionStatusQuery = `UPDATE User SET verification_submitted = TRUE WHERE user_id = ?`;

                db.query(updateTierQuery, [user_id], (err, result) => {
                    if (err) {
                        return db.rollback(() => {
                            console.error('Error updating account tier:', err);
                            return res.status(500).send('Failed to submit verification. Please try again later.');
                        });
                    }

                    db.query(updateSubmissionStatusQuery, [user_id], (err, result) => {
                        if (err) {
                            return db.rollback(() => {
                                console.error('Error updating submission status:', err);
                                return res.status(500).send('Failed to submit verification. Please try again later.');
                            });
                        }

                        db.commit(err => {
                            if (err) {
                                return db.rollback(() => {
                                    console.error('Error committing transaction:', err);
                                    return res.status(500).send('Failed to submit verification. Please try again later.');
                                });
                            }
                            res.redirect('/main');
                        });
                    });
                });
            });
        });
    });
});

// POST route for feedback submission
app.post('/rateUs', (req, res) => {
    const data = req.body;
    const user_id = req.session.userId; // Assume user_id is stored in session

    const question1 = data.question1;
    const question2 = data.question2;
    const question3 = data.question3;
    const feedback = data.feedback;
    const bugs = data.bugs;

    db.beginTransaction(err => {
        if (err) {
            console.error('Error starting transaction:', err);
            return res.status(500).json({ success: false, message: 'Failed to submit feedback. Please try again later.' });
        }

        const feedbackQuery = `INSERT INTO RateUs (user_id, q1, q2, q3, q4, q5) 
                               VALUES (?, ?, ?, ?, ?, ?)`;

        db.query(feedbackQuery, [user_id, question1, question2, question3, feedback, bugs], (err, result) => {
            if (err) {
                return db.rollback(() => {
                    console.error('Error submitting feedback:', err);
                    return res.status(500).json({ success: false, message: 'Failed to submit feedback. Please try again later.' });
                });
            }

            db.commit(err => {
                if (err) {
                    return db.rollback(() => {
                        console.error('Error committing transaction:', err);
                        return res.status(500).json({ success: false, message: 'Failed to submit feedback. Please try again later.' });
                    });
                }

                res.json({ success: true, message: 'Feedback submitted successfully.' });
            });
        });
    });
});

// Serve the verification form HTML
app.get('/verify', authenticateUser, (req, res) => {
    res.render('verify.ejs');
});

// Serve the transactions page ejs
app.get('/transactions', authenticateUser, (req, res) => {
    res.render('transactions.ejs');
});

// Serve the faq page ejs
app.get('/faq', authenticateUser, (req, res) => {
    res.render('faq.ejs');
});

// Serve the rate us page ejs
app.get('/rateUs', authenticateUser, (req, res) => {
    res.render('rateUs.ejs');
});

// POST route for handling transactions
app.post('/api/transaction', (req, res) => {
    const { amount, description, iban } = req.body;
    const user_id = req.session.userId; // Retrieve user_id from session

    // Fetch account_id and balance for the logged-in user
    const accountQuery = `SELECT account_id, balance, IBAN FROM Account WHERE user_id = ?`;

    db.query(accountQuery, [user_id], (err, results) => {
        if (err) {
            console.error('Error retrieving account information:', err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: 'Account not found' });
        }

        const { account_id: account_id_1, balance: balance_1, IBAN: iban_1 } = results[0];

        // Check if user's IBAN and provided IBAN are the same
        if (iban_1 === iban) {
            return res.status(400).json({ error: 'Cannot make a transaction to your own account' });
        }

        // Fetch account_id for the account associated with the provided IBAN
        const accountQuery2 = `SELECT account_id, balance FROM Account WHERE IBAN = ?`;

        db.query(accountQuery2, [iban], (err, results2) => {
            if (err) {
                console.error('Error retrieving account information for IBAN:', err);
                return res.status(500).json({ error: 'Internal Server Error' });
            }

            if (results2.length === 0) {
                return res.status(404).json({ error: 'Account with provided IBAN not found' });
            }

            const { account_id: account_id_2, balance: balance_2 } = results2[0];

            // Ensure sufficient balance for the transaction
            if (parseFloat(balance_1) < parseFloat(amount)) {
                return res.status(400).json({ error: 'Insufficient balance' });
            }

            // Begin transaction for inserting into Transaction table
            db.beginTransaction(err => {
                if (err) {
                    console.error('Error starting transaction:', err);
                    return res.status(500).json({ error: 'Failed to initiate transaction' });
                }

                const transactionQuery = `
                    INSERT INTO Transaction (account_id, amount, date, description, other_account_IBAN)
                    VALUES (?, ?, NOW(), ?, ?),
                           (?, ?, NOW(), ?, ?)
                `;
                const newBalance1 = parseFloat(balance_1) - parseFloat(amount);
                const newBalance2 = parseFloat(balance_2) + parseFloat(amount); // Adjust balance for receiving account

                db.query(transactionQuery, [account_id_1, amount, description, iban, account_id_2, amount, description, iban_1], (err, result) => {
                    if (err) {
                        return db.rollback(() => {
                            console.error('Error inserting transaction:', err);
                            return res.status(500).json({ error: 'Failed to process transaction' });
                        });
                    }

                    // Update balance in Account table for account_id_1
                    const updateBalanceQuery1 = `UPDATE Account SET balance = ? WHERE account_id = ?`;
                    db.query(updateBalanceQuery1, [newBalance1, account_id_1], (err, result) => {
                        if (err) {
                            return db.rollback(() => {
                                console.error('Error updating balance for account_id_1:', err);
                                return res.status(500).json({ error: 'Failed to update balance' });
                            });
                        }

                        // Update balance in Account table for account_id_2
                        const updateBalanceQuery2 = `UPDATE Account SET balance = ? WHERE account_id = ?`;
                        db.query(updateBalanceQuery2, [newBalance2, account_id_2], (err, result) => {
                            if (err) {
                                return db.rollback(() => {
                                    console.error('Error updating balance for account_id_2:', err);
                                    return res.status(500).json({ error: 'Failed to update balance' });
                                });
                            }

                            // Commit the transaction
                            db.commit(err => {
                                if (err) {
                                    return db.rollback(() => {
                                        console.error('Error committing transaction:', err);
                                        return res.status(500).json({ error: 'Failed to commit transaction' });
                                    });
                                }

                                // Transaction successfully processed
                                res.status(200).json({ message: 'Transaction successful', redirectUrl: '/main' });
                            });
                        });
                    });
                });
            });
        });
    });
});

app.get('/api/user/balance', (req, res) => {
    const user_id = req.session.userId; // Get user ID from session or wherever it's stored

    // Query the database to fetch user's balance based on user_id
    const query = 'SELECT balance FROM Account WHERE user_id = ?';
    db.query(query, [user_id], (err, results) => {
        if (err) {
            console.error('Error fetching user balance:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: 'User account not found' });
        }

        const balance = results[0].balance;
        res.json({ balance });
    });
});

// Server-side route to check IBAN existence
app.post('/api/check-iban', (req, res) => {
    const iban = req.body.iban;

    const query = 'SELECT COUNT(*) AS count FROM Account WHERE IBAN = ?';
    db.query(query, [iban], (err, results) => {
        if (err) {
            console.error('Error checking IBAN existence:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }

        const count = results[0].count;
        const exists = count > 0;
        res.json({ exists });
    });
});

// Route to render settings page
app.get('/settings', authenticateUser, (req, res) => {
    const user_id = req.session.userId;

    const query = `
        SELECT U.first_name, U.last_name, U.email, A.account_id, A.date_created
        FROM User U
        JOIN Account A ON U.user_id = A.user_id
        WHERE U.user_id = ?`;

    db.query(query, [user_id], (err, results) => {
        if (err) {
            console.error('Error retrieving user data:', err);
            return res.status(500).send('Error retrieving user data');
        }

        if (results.length === 0) {
            return res.status(404).send('User not found');
        }

        const userData = results[0];
        res.render('settings', {
            name: userData.first_name,
            surname: userData.last_name,
            email: userData.email,
            accountId: userData.account_id,
            dateTime: userData.date_created.toLocaleDateString(),
            userId: user_id // Pass the user_id to the template
        });
    });
});

// Example route to handle user data update
app.post('/api/user/update', (req, res) => {
    const updatedData = req.body;
    const userId = req.session.userId; // Get user ID from session

    if (!userId) {
        return res.status(401).json({ error: 'User not logged in' });
    }

    // Construct the SQL query to update user data
    let query = 'UPDATE User SET ';
    const values = [];
    let setValues = ''; // String to hold the set values part of the query
    Object.keys(updatedData).forEach((key, index) => {
        if (key !== 'user_id') {
            setValues += `${key} = ?`; // Append the key and placeholder for value
            values.push(updatedData[key]); // Push the value to the values array
            if (index < Object.keys(updatedData).length - 1) {
                setValues += ', '; // Add comma if it's not the last column to update
            }
        }
    });
    query += setValues; // Append the set values to the query
    query += ' WHERE user_id = ?';
    values.push(userId); // Push the user_id value to the values array

    console.log('Generated SQL query:', query);
    console.log('Values:', values); 
    // Execute the SQL query
    db.query(query, values, (error, results) => {
        if (error) {
            console.error('Error updating user data:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        } else {
            res.status(200).json({ message: 'User data updated successfully' });
        }
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
