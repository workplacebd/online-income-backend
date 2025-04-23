// server.js - আপডেটেড ভার্সন
require('dotenv').config();
const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();

// উন্নত সিকিউরিটি মিডলওয়্যার
app.use(helmet());
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    credentials: true
}));
app.use(express.json({ limit: '10kb' }));

// রেট লিমিটার
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// MongoDB কানেকশন (অপটিমাইজড)
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    autoIndex: true
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1); // সার্ভার বন্ধ করে দেবে যদি কানেকশন ফেইল হয়
});

// উন্নত ইউজার স্কিমা
const UserSchema = new mongoose.Schema({
    name: { type: String, required: [true, 'নাম আবশ্যক'] },
    phone: { 
        type: String, 
        required: [true, 'মোবাইল নম্বর আবশ্যক'],
        unique: true,
        validate: {
            validator: v => /^(?:\+88|01)?(?:\d{11}|\d{13})$/.test(v),
            message: 'সঠিক মোবাইল নম্বর দিন'
        }
    },
    password: { 
        type: String, 
        required: true,
        select: false // ডিফল্টভাবে কোয়েরিতে পাসওয়ার্ড রিটার্ন করবে না
    },
    referredBy: String,
    createdAt: { type: Date, default: Date.now }
});

// পাসওয়ার্ড হ্যাশিং মিডলওয়্যার
UserSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

const User = mongoose.model('User', UserSchema);

// লগইন রাউট (আপডেটেড)
app.post('/api/users/login', async (req, res) => {
    try {
        const { phone, password } = req.body;
        
        const user = await User.findOne({ phone }).select('+password');
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: 'ভুল মোবাইল নম্বর বা পাসওয়ার্ড' });
        }

        const token = generateToken(user);
        
        res.status(200).json({
            message: 'লগইন সফল',
            token,
            user: {
                id: user._id,
                name: user.name,
                phone: user.phone
            }
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: 'সার্ভারে সমস্যা হয়েছে' });
    }
});
