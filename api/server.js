const express = require('express');
const mysql = require('mysql2');
const dotenv = require('dotenv');
const cors = require('cors');
const bcrypt = require('bcrypt');

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// connecting to the database
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
});

// test connection
db.connect((err) => {
    if (err) {
        return console.log("Error connecting to MySQL:", err);
    }
    console.log("Connected to MySQL as id:", db.threadId);
});

// Run the server
app.listen(3000, () => {
    console.log("Server is running at PORT 3000");

    // create a db
    db.query(`CREATE DATABASE IF NOT EXISTS expense_tracker`, (err, result) => {
        if (err) {
            return console.log("Error creating database:", err);
        }
        console.log("DB expense_tracker created/checked successfully");

        // select the expense_tracker db
        db.changeUser({ database: 'expense_tracker' }, (err, result) => {
            if (err) {
                return console.log("Error changing database:", err);
            }
            console.log("Expense_tracker is in use");

            // create table
            const createUsersTable = `
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                email VARCHAR(100) NOT NULL UNIQUE,
                username VARCHAR(50) NOT NULL,
                password VARCHAR(255) NOT NULL
            )`;
            db.query(createUsersTable, (err, result) => {
                if (err) {
                    return console.log("Error creating table:", err);
                }
                console.log("Users table is created/checked successfully");
            });
        });
    });
});

// User registration
app.post('/api/register', async (req, res) => {
    try {
        const { email, username, password } = req.body;

        // Check if email already exists
        const users = `SELECT * FROM users WHERE email = ?`;
        db.query(users, [email], (err, data) => {
            if (err) {
                return res.status(500).json("Internal server error");
            }
            if (data.length > 0) {
                return res.status(409).json("User already exists");
            }

            // Create new user
            //password hashing
            const salt = bcrypt.genSaltSync(10)
            const hashedPassword = bcrypt.hashSync(req.body.password, salt)

            // Create new user
            const newUser = `INSERT INTO users (email, username, password) VALUES (?, ?, ?)`;
            db.query(newUser, [email, username, hashedPassword], (err, data) => {
                if (err) {
                    return res.status(400).json("Something went wrong");
                }
                res.status(201).json("User created successfully");
            });
        });
    } catch (err) {
        res.status(500).json("Internal server error");
    }
});
// login user
app.post('/api/login', async(req, res) => {
    try{
const users = `SELECT * FROM users WHERE email = ?`
db.query(users, [req.body.email], (err,data) => {
    //if user not found
    if(data.length === 0) return res.status(404).json("user not found!");

    //if user exists
    const isPasswordValid = bcrypt.compareSync(req.body.password, data[0].password)

    //password not valid if(isPasswordValid === false)
    if(!isPasswordValid) return res.status(400).json("Invalid password or email")

    //password and email match
    return res.status(201).json("login successful")

})
    }
    catch(err) {
        res.status(500).json("internal server error")
    }
})