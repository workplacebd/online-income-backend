const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// ডাটাবেস ফাইল পাথ
const dbPath = path.join(__dirname, 'referral-db.json');

// ডাটাবেস লোড ফাংশন
function loadDB() {
    try {
        if (!fs.existsSync(dbPath)) {
            fs.writeFileSync(dbPath, JSON.stringify({ users: {} }, null, 2));
            return { users: {} };
        }
        const data = fs.readFileSync(dbPath, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error('ডাটাবেস লোড করতে সমস্যা:', err);
        return { users: {} };
    }
}

// ডাটাবেস সেভ ফাংশন
function saveDB(data) {
    try {
        fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
        console.log('ডাটাবেস সফলভাবে সেভ হয়েছে');
    } catch (err) {
        console.error('ডাটাবেস সেভ করতে সমস্যা:', err);
    }
}

// রেফারেল রেজিস্ট্রেশন এন্ডপয়েন্ট
router.post('/register', (req, res) => {
    try {
        const { phone, referredBy } = req.body;
        console.log('রেজিস্ট্রেশন রিকোয়েস্ট:', { phone, referredBy });
        
        // ভ্যালিডেশন
        if (!phone || !/^01\d{9}$/.test(phone)) {
            return res.status(400).json({ 
                success: false, 
                message: 'সঠিক মোবাইল নম্বর প্রদান করুন (11 ডিজিট, 01 দিয়ে শুরু)' 
            });
        }

        const db = loadDB();

        // নতুন ইউজার তৈরি
        if (!db.users[phone]) {
            db.users[phone] = {
                phone,
                balance: 0,
                referralBalance: 0,
                referrals: [],
                createdAt: new Date().toISOString()
            };
            console.log('নতুন ইউজার তৈরি হয়েছে:', phone);
        }

        // রেফারেল থাকলে প্রসেসিং
        if (referredBy && referredBy !== phone && db.users[referredBy]) {
            const referralBonus = 10; // 10 টাকা বোনাস
            
            db.users[referredBy].referrals.push({
                phone,
                amount: referralBonus,
                date: new Date().toISOString(),
                status: 'active'
            });

            db.users[referredBy].referralBalance += referralBonus;
            console.log('রেফারেল বোনাস যোগ হয়েছে:', referredBy, '→', phone);
            
            // রেফারারকে নোটিফিকেশন
            if (!db.users[referredBy].notifications) {
                db.users[referredBy].notifications = [];
            }
            
            db.users[referredBy].notifications.push({
                type: 'referral',
                message: `${phone} আপনার রেফারেলে রেজিস্টার করেছে!`,
                amount: referralBonus,
                date: new Date().toISOString()
            });
        }

        saveDB(db);
        return res.status(200).json({ 
            success: true, 
            message: 'সফলভাবে প্রসেস হয়েছে',
            referred: !!referredBy
        });

    } catch (err) {
        console.error('রেফারেল রেজিস্ট্রেশনে ত্রুটি:', err);
        return res.status(500).json({ 
            success: false, 
            message: 'সার্ভারে সমস্যা হয়েছে' 
        });
    }
});

// রেফারেল স্ট্যাটস এন্ডপয়েন্ট
router.get('/stats/:phone', (req, res) => {
    try {
        const { phone } = req.params;
        console.log('স্ট্যাটস রিকোয়েস্ট:', phone);
        
        // ভ্যালিডেশন
        if (!phone || !/^01\d{9}$/.test(phone)) {
            return res.status(400).json({ 
                success: false, 
                message: 'সঠিক মোবাইল নম্বর প্রদান করুন' 
            });
        }

        const db = loadDB();
        const user = db.users[phone];

        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'ইউজার পাওয়া যায়নি' 
            });
        }

        // সক্রিয় রেফারেল কাউন্ট
        const activeReferrals = user.referrals.filter(r => r.status === 'active').length;

        return res.json({
            success: true,
            totalReferrals: user.referrals.length,
            activeReferrals: activeReferrals,
            totalEarnings: user.referralBalance,
            referralBalance: user.referralBalance,
            referrals: user.referrals.map(r => ({
                phone: r.phone,
                amount: r.amount,
                date: r.date,
                status: r.status
            }))
        });

    } catch (err) {
        console.error('স্ট্যাটস লোড করতে সমস্যা:', err);
        return res.status(500).json({ 
            success: false, 
            message: 'সার্ভারে সমস্যা হয়েছে' 
        });
    }
});

// ব্যালেন্স ট্রান্সফার এন্ডপয়েন্ট
router.post('/transfer', (req, res) => {
    try {
        const { phone } = req.body;
        console.log('ট্রান্সফার রিকোয়েস্ট:', phone);
        
        // ভ্যালিডেশন
        if (!phone || !/^01\d{9}$/.test(phone)) {
            return res.status(400).json({ 
                success: false, 
                message: 'সঠিক মোবাইল নম্বর প্রদান করুন' 
            });
        }

        const db = loadDB();
        const user = db.users[phone];

        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'ইউজার পাওয়া যায়নি' 
            });
        }

        if (user.referralBalance <= 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'ট্রান্সফার করার মতো পর্যাপ্ত ব্যালেন্স নেই' 
            });
        }

        // ট্রান্সফার প্রসেস
        const transferAmount = user.referralBalance;
        user.balance += transferAmount;
        user.referralBalance = 0;

        // ট্রানজেকশন হিস্ট্রি
        if (!user.transactions) {
            user.transactions = [];
        }

        user.transactions.push({
            type: 'referral_transfer',
            amount: transferAmount,
            date: new Date().toISOString(),
            status: 'completed'
        });

        saveDB(db);

        return res.json({
            success: true,
            message: 'ব্যালেন্স সফলভাবে ট্রান্সফার হয়েছে',
            amount: transferAmount,
            newBalance: user.balance,
            referralBalance: user.referralBalance
        });

    } catch (err) {
        console.error('ব্যালেন্স ট্রান্সফারে ত্রুটি:', err);
        return res.status(500).json({ 
            success: false, 
            message: 'সার্ভারে সমস্যা হয়েছে' 
        });
    }
});

module.exports = router;
