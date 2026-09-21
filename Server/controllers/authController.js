const { poolPromise } = require('../config/db');
const bcrypt = require('bcrypt');

exports.signup = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        
        if (!username || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const pool = await poolPromise;
        
        // Check if user already exists
        const checkUser = await pool.request()
            .input('Email', email)
            .query('SELECT * FROM Users WHERE Email = @Email');
            
        if (checkUser.recordset.length > 0) {
            return res.status(400).json({ error: 'User already exists with this email' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Insert new user
        await pool.request()
            .input('Username', username)
            .input('Email', email)
            .input('PasswordHash', hashedPassword)
            .query('INSERT INTO Users (Username, Email, PasswordHash) VALUES (@Username, @Email, @PasswordHash)');

        res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.signin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const pool = await poolPromise;
        
        // Find user
        const result = await pool.request()
            .input('Email', email)
            .query('SELECT * FROM Users WHERE Email = @Email');

        const user = result.recordset[0];
        if (!user) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, user.PasswordHash);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }

        res.status(200).json({ message: 'Login successful', user: { id: user.Id, username: user.Username, email: user.Email, role: user.Role || 'Customer' } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

