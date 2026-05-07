const express = require('express');
const router  = express.Router();
const { body } = require('express-validator');
const ctrl    = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const validateRegister = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

const validateLogin = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
];

router.post('/register', validateRegister, ctrl.register);
router.post('/login',    validateLogin,    ctrl.login);

router.get   ('/me',             protect, ctrl.getMe);
router.patch ('/update-profile', protect, ctrl.updateProfile);
router.patch ('/change-password',protect, ctrl.changePassword);
router.delete('/revoke-sessions',protect, ctrl.revokeSessions);

module.exports = router;
