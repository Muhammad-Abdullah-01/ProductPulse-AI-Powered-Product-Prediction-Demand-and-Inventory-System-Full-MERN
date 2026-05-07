const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name:     { type: String, required: true, trim: true },
    email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    company:  { type: String, default: '' },
    phone:    { type: String, default: '' },
    role:     { type: String, enum: ['admin', 'analyst', 'viewer'], default: 'analyst' },
    avatar:   { type: String, default: '' },

    // Notification preferences (mirrors Settings.js toggles)
    notifications: {
      email:   { type: Boolean, default: true  },
      push:    { type: Boolean, default: false },
      alerts:  { type: Boolean, default: true  },
      reports: { type: Boolean, default: true  },
    },

    // App preferences
    preferences: {
      theme:           { type: String, enum: ['light', 'dark'], default: 'light' },
      defaultRegion:   { type: String, default: 'All' },
      defaultCategory: { type: String, default: 'All' },
    },

    twoFactorEnabled: { type: Boolean, default: false },

    // Active sessions tracking
    sessions: [
      {
        deviceInfo: String,
        createdAt:  { type: Date, default: Date.now },
        lastActive: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare plain password with hash
userSchema.methods.correctPassword = async function (candidate, hashed) {
  return bcrypt.compare(candidate, hashed);
};

// Strip sensitive fields when converting to JSON
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
