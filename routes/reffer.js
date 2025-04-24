const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const Referral = require('../models/Referral');
const User = require('../models/User');

// রেফারেল রেজিস্ট্রেশন
router.post('/register', auth, async (req, res) => {
  try {
    const { referredCode } = req.body;
    const userId = req.user.userId;

    // ভ্যালিডেশন
    if (!referredCode) {
      return res.status(400).json({ message: 'রেফারেল কোড প্রয়োজন' });
    }

    const referrer = await User.findOne({ referralCode: referredCode });
    if (!referrer) {
      return res.status(404).json({ message: 'রেফারেল কোড ভুল' });
    }

    // রেফারেল রেকর্ড তৈরি
    const referral = new Referral({
      referrer: referrer._id,
      referredUser: userId,
      commission: 10
    });

    await referral.save();

    // রেফারার ব্যালেন্স আপডেট
    await User.findByIdAndUpdate(
      referrer._id,
      { $inc: { referralBalance: 10 } }
    );

    res.json({ message: 'রেফারেল সফলভাবে রেজিস্টার্ড হয়েছে' });
  } catch (err) {
    res.status(500).json({ message: 'রেফারেল প্রসেসে সমস্যা' });
  }
});

// রেফারেল স্ট্যাটস
router.get('/stats', auth, async (req, res) => {
  try {
    const stats = await Referral.aggregate([
      { $match: { referrer: req.user.userId } },
      { 
        $group: {
          _id: null,
          totalReferrals: { $sum: 1 },
          totalEarnings: { $sum: '$commission' }
        }
      }
    ]);

    res.json({
      totalReferrals: stats[0]?.totalReferrals || 0,
      totalEarnings: stats[0]?.totalEarnings || 0
    });
  } catch (err) {
    res.status(500).json({ message: 'স্ট্যাটস লোড করতে সমস্যা' });
  }
});

module.exports = router;
