const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// Mock Database
const dbPath = path.join(__dirname, 'referral-db.json');

function loadDB() {
    if (!fs.existsSync(dbPath)) fs.writeFileSync(dbPath, JSON.stringify({ users: {} }, null, 2));
    return JSON.parse(fs.readFileSync(dbPath));
}

function saveDB(data) {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

// Register user with referral
router.post('/register', (req, res) => {
    const { phone, referredBy } = req.body;
    const db = loadDB();

    if (!phone) return res.status(400).json({ success: false, message: 'Phone number is required' });

    if (!db.users[phone]) {
        // Create new user
        db.users[phone] = {
            phone,
            balance: 10, // Initial balance for new user
            referralBalance: 0,
            referrals: [],
            referredBy: referredBy || null,
            createdAt: new Date().toISOString()
        };

        // Add bonus to referrer if exists
        if (referredBy && db.users[referredBy] && referredBy !== phone) {
            db.users[referredBy].referrals.push({
                phone,
                amount: 10,
                date: new Date().toISOString(),
                status: 'active'
            });

            db.users[referredBy].referralBalance += 10;
            
            saveDB(db);
            return res.status(201).json({ 
                success: true, 
                message: 'Referral registered successfully',
                bonusAdded: true
            });
        }

        saveDB(db);
        return res.status(201).json({ 
            success: true, 
            message: 'User registered without referral bonus' 
        });
    }

    return res.status(200).json({ 
        success: false, 
        message: 'User already exists' 
    });
});

// Get referral stats
router.get('/stats/:phone', (req, res) => {
    const { phone } = req.params;
    const db = loadDB();
    const user = db.users[phone];

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const activeReferrals = user.referrals.filter(ref => ref.status === 'active').length;
    const totalEarnings = user.referrals.reduce((sum, ref) => sum + ref.amount, 0);

    res.json({
        success: true,
        totalReferrals: user.referrals.length,
        activeReferrals,
        totalEarnings,
        referralBalance: user.referralBalance,
        referrals: user.referrals
    });
});

// Transfer referral balance to main balance
router.post('/transfer', (req, res) => {
    const { phone } = req.body;
    const db = loadDB();
    const user = db.users[phone];

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.referralBalance <= 0) return res.status(400).json({ success: false, message: 'No balance to transfer' });

    user.balance += user.referralBalance;
    user.referralBalance = 0;
    
    saveDB(db);
    res.json({ 
        success: true, 
        message: 'Balance transferred successfully',
        newBalance: user.balance
    });
});

module.exports = router;
