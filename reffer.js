// reffer.js
const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// Mock Database (You should replace this with a real DB like MongoDB)
const dbPath = path.join(__dirname, 'referral-db.json');

function loadDB() {
    if (!fs.existsSync(dbPath)) fs.writeFileSync(dbPath, JSON.stringify({ users: {} }, null, 2));
    return JSON.parse(fs.readFileSync(dbPath));
}

function saveDB(data) {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

// Create or update user with referral
router.post('/register', (req, res) => {
    const { phone, referredBy } = req.body;
    const db = loadDB();

    if (!phone) return res.status(400).json({ message: 'Phone number is required' });

    if (!db.users[phone]) {
        db.users[phone] = {
            phone,
            balance: 0,
            referralBalance: 0,
            referrals: [],
        };

        if (referredBy && db.users[referredBy] && referredBy !== phone) {
            db.users[referredBy].referrals.push({
                phone,
                amount: 10,
                date: new Date().toISOString(),
            });

            db.users[referredBy].referralBalance += 10; // 10% commission
        }

        saveDB(db);
        return res.status(201).json({ message: 'User registered successfully' });
    }

    return res.status(200).json({ message: 'User already exists' });
});

// Get referral stats
router.get('/stats/:phone', (req, res) => {
    const { phone } = req.params;
    const db = loadDB();
    const user = db.users[phone];

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({
        totalReferrals: user.referrals.length,
        referralBalance: user.referralBalance,
        referrals: user.referrals,
    });
});

module.exports = router;
