// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'নাম আবশ্যক'],
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'মোবাইল নম্বর আবশ্যক'],
    unique: true,
    validate: {
      validator: function(v) {
        return /^(?:\+88|01)?\d{11}$/.test(v);
      },
      message: props => `${props.value} সঠিক মোবাইল নম্বর নয়`
    }
  },
  password: {
    type: String,
    required: [true, 'পাসওয়ার্ড আবশ্যক'],
    minlength: [6, 'পাসওয়ার্ড সর্বনিম্ন ৬ অক্ষরের হতে হবে'],
    select: false
  },
  referralCode: {
    type: String,
    unique: true,
    default: function() {
      return Math.random().toString(36).substr(2, 8).toUpperCase();
    }
  },
  referralBalance: {
    type: Number,
    default: 0
  },
  balance: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// পাসওয়ার্ড হ্যাশিং মিডলওয়্যার
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// পাসওয়ার্ড ম্যাচ মেথড
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// স্বয়ংক্রিয়ভাবে updatedAt আপডেট করার মিডলওয়্যার
UserSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// ভার্চুয়াল ফিল্ড (রেফারেল কাউন্ট)
UserSchema.virtual('referralCount', {
  ref: 'Referral',
  localField: '_id',
  foreignField: 'referrer',
  count: true
});

// JSON আউটপুট থেকে পাসওয়ার্ড বাদ দেয়া
UserSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

module.exports = mongoose.model('User', UserSchema);
