const express = require('express');
const router = express.Router();
const { register, registerDonneur, registerStructure, login, logout, getMe } = require('../controllers/authController');
const { authMiddleware } = require('../middleware/auth');

router.post('/register',            register);
router.post('/register/donneur',    registerDonneur);
router.post('/register/structure',  registerStructure);
router.post('/login',               login);
router.post('/logout',              authMiddleware, logout);
router.get('/me',                   authMiddleware, getMe);

module.exports = router;
