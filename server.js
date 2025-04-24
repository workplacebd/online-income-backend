require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const authRoutes = require('./routes/auth');
const referRoutes = require('./routes/reffer');

const app = express();

// মিডলওয়্যার সেটআপ
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true
}));
app.use(express.json({ limit: '10kb' }));

// রেট লিমিটার
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'অনেক রিকুয়েস্ট করা হয়েছে, পরে আবার চেষ্টা করুন'
});
app.use('/api/', limiter);

// ডাটাবেস কানেকশন (Render.com-এর জন্য অপটিমাইজড)
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  retryWrites: true,
  w: 'majority'
})
.then(() => console.log('MongoDB কানেকশন সফল'))
.catch(err => {
  console.error('MongoDB কানেকশন ইরর:', err);
  process.exit(1);
});

// রাউট সেটআপ
app.use('/api/auth', authRoutes);
app.use('/api/refer', referRoutes);

// হেলথ চেক এন্ডপয়েন্ট
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'সার্ভার সচল' });
});

// Render.com-এর জন্য পোর্ট কনফিগারেশন
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`সার্ভার চলছে পোর্ট ${PORT} এ`);
});

// এরর হ্যান্ডলিং
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'সার্ভারে সমস্যা হয়েছে' });
});
