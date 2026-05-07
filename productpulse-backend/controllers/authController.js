const jwt  = require('jsonwebtoken');
const User = require('../models/User');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

const sendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  res.status(statusCode).json({
    success: true,
    token,
    user,
  });
};

// POST /api/auth/register
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, company } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    const user = await User.create({ name, email, password, company });
    sendToken(user, 201, res);
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.correctPassword(password, user.password))) {
      return res.status(401).json({ success: false, message: 'Incorrect email or password.' });
    }

    // Track session
    user.sessions.push({ deviceInfo: req.headers['user-agent'] || 'Unknown' });
    if (user.sessions.length > 10) user.sessions = user.sessions.slice(-10);  // keep last 10
    await user.save({ validateBeforeSave: false });

    sendToken(user, 200, res);
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/me
exports.getMe = async (req, res) => {
  res.json({ success: true, user: req.user });
};

// PATCH /api/auth/update-profile
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, email, phone, company, preferences, notifications } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, email, phone, company, preferences, notifications },
      { new: true, runValidators: true }
    );

    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/auth/change-password
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');
    if (!(await user.correctPassword(currentPassword, user.password))) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
    }

    user.password = newPassword;
    await user.save();

    sendToken(user, 200, res);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/auth/revoke-sessions
exports.revokeSessions = async (req, res, next) => {
  try {
    // Keep only the current session (last one)
    const user = await User.findById(req.user._id);
    const currentSession = user.sessions[user.sessions.length - 1];
    user.sessions = currentSession ? [currentSession] : [];
    await user.save({ validateBeforeSave: false });

    res.json({ success: true, message: 'All other sessions have been revoked.' });
  } catch (err) {
    next(err);
  }
};
