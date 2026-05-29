// routes/auth.js
const express = require('express');
const router  = express.Router();
const { registerDonneur, registerStructure, login, getMe } = require('../controllers/authController');
const { authMiddleware } = require('../middleware/auth');

router.post('/register-donneur',   registerDonneur);
router.post('/register-structure', registerStructure);
router.post('/login',              login);
router.get('/me',                  authMiddleware, getMe);

module.exports = router;
