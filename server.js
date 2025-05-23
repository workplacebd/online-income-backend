require('dotenv').config();
const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken'); // Added JWT require

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 5000;

// MongoDB connect
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// User Schema
const UserSchema = new mongoose.Schema({
    name: String,
    phone: { type: String, unique: true },
    password: String,
    referredBy: String
});
const User = mongoose.model('User', UserSchema);

// Signup route
app.post('/api/users/signup', async (req, res) => {
    const { name, phone, password, referredBy } = req.body;

    try {
        const existing = await User.findOne({ phone });
        if (existing) {
            return res.status(400).json({ message: 'এই মোবাইল নম্বর ইতিমধ্যে ব্যবহার হয়েছে।' });
        }

        const newUser = new User({ name, phone, password, referredBy });
        await newUser.save();
        res.status(201).json({ message: 'Signup successful' });
    } catch (err) {
        res.status(500).json({ message: 'সার্ভারে সমস্যা হয়েছে।' });
    }
});

// Updated Login route with proper JWT token
app.post('/api/users/login', async (req, res) => {
    const { phone, password } = req.body;

    try {
        const user = await User.findOne({ phone, password });
        if (!user) {
            return res.status(401).json({ message: 'ভুল মোবাইল নম্বর বা পাসওয়ার্ড।' });
        }

        // Generate JWT token with 24 hours expiration
        const token = jwt.sign(
            { userId: user._id, phone: user.phone },
            'sopno_jwt_2025_secret_key', // Must match with auth.js SECRET_KEY
            { expiresIn: '7d' }
        );

        res.status(200).json({
            message: 'Login successful',
            userId: user._id,
            token: token // Real JWT token instead of dummy-token
        });
    } catch (err) {
        res.status(500).json({ message: 'সার্ভারে সমস্যা হয়েছে।' });
    }
});

app.use('/api/refer', require('./reffer'));
app.use('/api/auth', require('./auth')); // Make sure auth routes are included

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
