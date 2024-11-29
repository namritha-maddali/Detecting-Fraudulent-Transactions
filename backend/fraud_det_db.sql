CREATE DATABASE Fraudulent_Transactions;
USE Fraudulent_Transactions;

-- Create User table 
CREATE TABLE User (
    User_ID INT PRIMARY KEY AUTO_INCREMENT,
    First_Name VARCHAR(50) NOT NULL,
    Middle_Name VARCHAR(50),
    Last_Name VARCHAR(50) NOT NULL,
    Email VARCHAR(100) UNIQUE NOT NULL,
    Phone VARCHAR(15) UNIQUE NOT NULL,
    Password VARCHAR(100) NOT NULL,
    CONSTRAINT pass_len CHECK (CHAR_LENGTH(Password) >= 8)
);

-- Create Bank_Account table 
CREATE TABLE Bank_Account (
    Acc_No VARCHAR(10) PRIMARY KEY,
    Bank_Name VARCHAR(100) NOT NULL,
    Acc_Type ENUM('Savings', 'Zero Balance', 'Salary', 'Checking', 'Joint') NOT NULL,
    Balance DECIMAL(15, 2) DEFAULT 0.00,
    Open_Date DATE NOT NULL,
    Is_Active BOOLEAN DEFAULT TRUE,
    User_ID INT,
    FOREIGN KEY (User_ID) REFERENCES User(User_ID)
);

-- Create Transaction table
CREATE TABLE Transaction (
    Txn_ID INT PRIMARY KEY AUTO_INCREMENT,
    Txn_Date DATE NOT NULL,
    Txn_Time TIME NOT NULL,
    Txn_Loc VARCHAR(100),
    Txn_Amount DECIMAL(15, 2) NOT NULL,
    Txn_Type ENUM('Deposit', 'Withdrawal', 'Transfer') NOT NULL,
    Account_Balance_Before DECIMAL(15, 2), 
    Account_Balance_After DECIMAL(15, 2),  
    Rcvr_Loc VARCHAR(100),                 
    Rcvr_Cat ENUM('Individual', 'Business', 'External'),  
    User_ID INT,
    FOREIGN KEY (User_ID) REFERENCES User(User_ID)
);

-- Create Prediction table
CREATE TABLE Prediction (
	Txn_ID INT,
    Is_Flagged BOOLEAN DEFAULT FALSE,
    Is_Fraud BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (Txn_ID) REFERENCES Transaction(Txn_ID),
    PRIMARY KEY (Txn_ID)
);

-- Create Has_Account table
CREATE TABLE Has_Account (
    User_ID INT,
    Acc_No VARCHAR(10),
    FOREIGN KEY (User_ID) REFERENCES User(User_ID),
    FOREIGN KEY (Acc_No) REFERENCES Bank_Account(Acc_No),
    PRIMARY KEY (User_ID, Acc_No)
);


-- STORED PROCEDURES
DELIMITER //
CREATE PROCEDURE UpdateUserInfo(
    IN p_user_id INT,
    IN p_first_name VARCHAR(255),
    IN p_middle_name VARCHAR(255),
    IN p_last_name VARCHAR(255),
    IN p_email VARCHAR(255),
    IN p_phone VARCHAR(20),
    IN p_password VARCHAR(20),
    IN p_acc_no VARCHAR(20),
    IN p_bank_name VARCHAR(255),
    IN p_acc_type VARCHAR(50),
    IN p_balance DECIMAL(10, 2),
    IN p_open_date DATE,
    IN p_is_active BOOLEAN
)

BEGIN
    -- Update User information
    UPDATE User 
    SET First_Name = p_first_name, 
        Middle_Name = p_middle_name, 
        Last_Name = p_last_name, 
        Email = p_email, 
        Phone = p_phone,
        Password = p_password 
    WHERE User_ID = p_user_id;

    -- Update Bank Account information
    UPDATE Bank_Account
    SET Acc_No = p_acc_no, 
        Bank_Name = p_bank_name, 
        Acc_Type = p_acc_type, 
        Balance = p_balance, 
        Open_Date = p_open_date, 
        Is_Active = p_is_active 
    WHERE User_ID = p_user_id;
END //

DELIMITER ;


DELIMITER //

CREATE PROCEDURE DeleteTransaction(IN txn_id INT)
BEGIN
    -- delete specific transaction
    IF EXISTS (SELECT 1 FROM Transaction WHERE Txn_ID = txn_id) THEN
        DELETE FROM Transaction WHERE Txn_ID = txn_id;
    ELSE
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Transaction not found!';
    END IF;
END//

DELIMITER ;



-- TRIGGERS
-- handle prediction table values on transaction table change
DELIMITER //

CREATE TRIGGER after_transaction_insert
AFTER INSERT ON Transaction
FOR EACH ROW
BEGIN
    INSERT INTO Prediction (Txn_ID, Is_Flagged, Is_Fraud)
    VALUES (NEW.Txn_ID, 0, 0)
    ON DUPLICATE KEY UPDATE
        Is_Flagged = VALUES(Is_Flagged),
        Is_Fraud = VALUES(Is_Fraud);
END//

DELIMITER ;

DELIMITER //

CREATE TRIGGER before_transaction_delete
BEFORE DELETE ON Transaction
FOR EACH ROW
BEGIN
    DELETE FROM Prediction WHERE Txn_ID = OLD.Txn_ID;
END//

DELIMITER ;
