// server.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Temporary in-memory user store
const users = [];

// Signup route
app.post('/api/users/signup', (req, res) => {
    const { name, phone, password, referredBy } = req.body;

    if (users.find(user => user.phone === phone)) {
        return res.status(400).json({ message: 'এই মোবাইল নম্বর ইতিমধ্যে ব্যবহার হয়েছে।' });
    }

    const newUser = {
        id: users.length + 1,
        name,
        phone,
        password,
        referredBy: referredBy || null
    };

    users.push(newUser);

    return res.status(201).json({ message: 'Signup successful' });
});

// Login route
app.post('/api/users/login', (req, res) => {
    const { phone, password } = req.body;
    const user = users.find(user => user.phone === phone && user.password === password);

    if (!user) {
        return res.status(401).json({ message: 'ভুল মোবাইল নম্বর বা পাসওয়ার্ড।' });
    }

    return res.status(200).json({
        message: 'Login successful',
        userId: user.id,
        token: 'dummy-token-for-now'
    });
});

// Root test
app.get('/', (req, res) => {
    res.send('API is running...');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
