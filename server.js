const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

const userSchema = new mongoose.Schema({
    name: String,
    phone: { type: String, unique: true },
    password: String,
    balance: { type: Number, default: 100 },
    referredBy: { type: String, default: null },
    referrals: [String]
});

const User = mongoose.model('User', userSchema);

const generateToken = (user) => {
    return jwt.sign({ id: user._id, phone: user.phone }, process.env.JWT_SECRET, {
        expiresIn: '7d'
    });
};

app.post('/api/signup', async (req, res) => {
    const { name, phone, password, referredBy } = req.body;
    try {
        const existing = await User.findOne({ phone });
        if (existing) return res.status(400).json({ message: 'User already exists' });

        const hash = await bcrypt.hash(password, 10);
        const newUser = new User({ name, phone, password: hash, referredBy });

        if (referredBy) {
            const refUser = await User.findOne({ phone: referredBy });
            if (refUser) {
                refUser.balance += 10;
                refUser.referrals.push(phone);
                await refUser.save();
            }
        }

        await newUser.save();
        const token = generateToken(newUser);
        res.status(201).json({ token, user: { phone: newUser.phone } });
    } catch (err) {
        res.status(500).json({ message: 'Signup failed', error: err.message });
    }
});

app.post('/api/login', async (req, res) => {
    const { phone, password } = req.body;
    try {
        const user = await User.findOne({ phone });
        if (!user) return res.status(404).json({ message: 'User not found' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

        const token = generateToken(user);
        res.status(200).json({ token, user: { phone: user.phone } });
    } catch (err) {
        res.status(500).json({ message: 'Login failed', error: err.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
