// reffer.js - আপডেটেড ভার্সন
const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const Referral = require('../models/Referral'); // নতুন মডেল

// রেফারেল রেজিস্ট্রেশন (অথেন্টিকেটেড)
router.post('/register', auth, async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
        const { referredBy } = req.body;
        const referrer = req.user._id;

        // ভ্যালিডেশন
        if (!referredBy) {
            await session.abortTransaction();
            return res.status(400).json({ message: 'রেফারেল কোড প্রয়োজন' });
        }

        if (referredBy === referrer.toString()) {
            await session.abortTransaction();
            return res.status(400).json({ message: 'নিজেকে রেফার করতে পারবেন না' });
        }

        // ট্রানজেকশনাল অপারেশন
        const referral = new Referral({
            referrer,
            referredUser: referredBy,
            commission: 10 // 10% কমিশন
        });

        await referral.save({ session });

        // ইউজার আপডেট
        await User.findByIdAndUpdate(
            referrer,
            { $inc: { referralBalance: 10 } },
            { session }
        );

        await session.commitTransaction();
        res.status(201).json({ message: 'রেফারেল রেজিস্ট্রেশন সফল' });
    } catch (err) {
        await session.abortTransaction();
        console.error('Referral error:', err);
        res.status(500).json({ message: 'রেফারেল প্রসেস করতে সমস্যা হয়েছে' });
    } finally {
        session.endSession();
    }
});

// রেফারেল স্ট্যাটস (অথেন্টিকেটেড)
router.get('/stats', auth, async (req, res) => {
    try {
        const stats = await Referral.aggregate([
            { $match: { referrer: req.user._id } },
            { 
                $group: {
                    _id: null,
                    totalReferrals: { $sum: 1 },
                    totalCommission: { $sum: '$commission' }
                }
            }
        ]);

        res.json({
            totalReferrals: stats[0]?.totalReferrals || 0,
            referralBalance: stats[0]?.totalCommission || 0
        });
    } catch (err) {
        console.error('Stats error:', err);
        res.status(500).json({ message: 'স্ট্যাটস লোড করতে সমস্যা হয়েছে' });
    }
});

module.exports = router;
