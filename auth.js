const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const router = express.Router();

// লগইন রাউট
router.post('/login', async (req, res) => {
  try {
    const { phone, password } = req.body;
    
    const user = await User.findOne({ phone }).select('+password');
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'ভুল মোবাইল নম্বর বা পাসওয়ার্ড' });
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.TOKEN_EXPIRY || '7d' }
    );

    res.json({ 
      token,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'লগইনে সমস্যা হয়েছে' });
  }
});

// টোকেন ভেরিফিকেশন
router.post('/verify', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ valid: false });

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ 
      valid: false,
      message: err.name === 'TokenExpiredError' ? 
             'টোকেনের মেয়াদ শেষ' : 'অবৈধ টোকেন' 
    });
    
    res.json({ valid: true, user: decoded });
  });
});

module.exports = router;
