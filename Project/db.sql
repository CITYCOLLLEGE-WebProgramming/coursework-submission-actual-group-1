USE web_db;

CREATE TABLE User (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    pass VARCHAR(100) NOT NULL,
    email VARCHAR(50) NOT NULL, 
    first_name VARCHAR(48) NOT NULL,
    last_name VARCHAR(48) NOT NULL,
	verification_submitted BOOLEAN
);

CREATE TABLE Account (
    account_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    account_type VARCHAR(50) NOT NULL,
    balance DECIMAL(15, 2) NOT NULL,
    date_created DATE NOT NULL,
    account_tier VARCHAR(34) NOT NULL,
    IBAN VARCHAR(28) UNIQUE NOT NULL,
    FOREIGN KEY (user_id) REFERENCES User(user_id)
);

CREATE TABLE Verification (
    verification_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    personal_identification_card VARCHAR(250) NOT NULL,
    SCN VARCHAR(250) NOT NULL,
    Tax_identification_number VARCHAR(250) NOT NULL,
    photo_of_passport VARCHAR(250) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES User(user_id)
);

CREATE TABLE Transaction (
    transaction_id INT PRIMARY KEY AUTO_INCREMENT,
	account_id INT NOT NULL,
    other_account_IBAN VARCHAR(28) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    date DATE NOT NULL,
    description VARCHAR(150) NOT NULL,
    FOREIGN KEY (account_id) REFERENCES Account(account_id)
);

CREATE TABLE RateUs (
    rating_id INT PRIMARY KEY AUTO_INCREMENT,
	user_id INT NOT NULL,
    q1 INT NOT NULL,
    q2 INT NOT NULL,
    q3 INT NOT NULL,
    q4 VARCHAR(250) NOT NULL,
    q5 VARCHAR(250) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES User(user_id)
);

INSERT INTO User (pass, email, first_name, last_name) VALUES ('Password123', 'kati@gmail.com', 'simos', 'kati');

UPDATE Account
SET balance = 3000
WHERE account_id = 1;

SELECT * FROM User;
SELECT * FROM Account;
SELECT * FROM Verification;
SELECT * FROM Transaction;
SELECT * FROM RateUs;

drop table Transaction;
drop table Verification;
drop table Account;
drop table RateUs;
drop table User;