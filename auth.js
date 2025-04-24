// auth.js
const express = require('express');
const jwt = require('jsonwebtoken');

const router = express.Router();

// Secret key for signing tokens (same key used during login)
const SECRET_KEY = 'sopno_jwt_2025_secret_key'; // পরিবর্তন করো এবং সুরক্ষিত রাখো

// Token verification route
router.post('/verify', (req, res) => {
    const authHeader = req.headers['authorization'];

    if (!authHeader) return res.json({ valid: false, message: 'No token provided' });

    const token = authHeader.split(' ')[1];

    if (!token) return res.json({ valid: false, message: 'Token missing' });

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.json({ valid: false, message: 'Invalid or expired token' });
        res.json({ valid: true, user });
    });
});

module.exports = router;
