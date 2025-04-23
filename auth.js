// auth.js - আপডেটেড ভার্সন
const jwt = require('jsonwebtoken');
require('dotenv').config();

const SECRET_KEY = process.env.JWT_SECRET || 'fallback_secret_should_be_complex_and_long';
const TOKEN_EXPIRY = process.env.TOKEN_EXPIRY || '7d'; // 7 দিন মেয়াদ

// টোকেন জেনারেশন ফাংশন (server.js-এ যোগ করুন)
function generateToken(user) {
    return jwt.sign(
        { userId: user._id, phone: user.phone },
        SECRET_KEY,
        { expiresIn: TOKEN_EXPIRY }
    );
}

// ভারিফিকেশন রাউট (অপরিবর্তিত)
router.post('/verify', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ valid: false, message: 'No token provided' });

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) return res.status(401).json({ 
            valid: false, 
            message: err.name === 'TokenExpiredError' ? 
                    'Token expired' : 'Invalid token' 
        });
        
        res.json({ valid: true, user: decoded });
    });
});
