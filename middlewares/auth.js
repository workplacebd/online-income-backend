// middlewares/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    // ১. টোকেন নিন হেডার থেকে
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'অনুগ্রহ করে লগইন করুন' 
      });
    }

    // ২. টোকেন ভেরিফাই করুন
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // ৩. ইউজার খুঁজে বের করুন (পাসওয়ার্ড বাদ দিয়ে)
    const user = await User.findOne({ 
      _id: decoded.userId,
      // যদি টোকেন ইনভ্যালিডেশনের জন্য কোনো ফিল্ড থাকে
    }).select('-password');

    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'ইউজার পাওয়া যায়নি' 
      });
    }

    // ৪. রিকোয়েস্ট অবজেক্টে ইউজার ইনফো সংযুক্ত করুন
    req.user = user;
    req.token = token;
    next();

  } catch (err) {
    // ৫. এরর হ্যান্ডেলিং
    let message = 'অথেন্টিকেশনে সমস্যা হয়েছে';
    
    if (err.name === 'TokenExpiredError') {
      message = 'সেশনের মেয়াদ শেষ হয়েছে, পুনরায় লগইন করুন';
    } else if (err.name === 'JsonWebTokenError') {
      message = 'অবৈধ টোকেন';
    }

    res.status(401).json({ 
      success: false,
      message 
    });
  }
};

module.exports = auth;
