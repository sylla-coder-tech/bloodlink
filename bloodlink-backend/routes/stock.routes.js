const express = require('express');
const router = express.Router();
const { authMiddleware, requireRole } = require('../middleware/auth');
const { getStock, updateStock, envoyerConvocation, getMesConvocations, repondreConvocation } = require('../controllers/stockController');

// Routes CNTS (admin)
router.get('/',                           authMiddleware, requireRole('admin'), getStock);
router.put('/update',                     authMiddleware, requireRole('admin'), updateStock);
router.post('/convoquer',                 authMiddleware, requireRole('admin'), envoyerConvocation);

// Routes donneur
router.get('/convocations',               authMiddleware, requireRole('donneur'), getMesConvocations);
router.put('/convocations/:id',           authMiddleware, requireRole('donneur'), repondreConvocation);

module.exports = router;
