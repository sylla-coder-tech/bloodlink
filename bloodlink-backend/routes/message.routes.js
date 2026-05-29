const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { sendMessage, getMessages, getConversations, broadcastDonneurs } = require('../controllers/messageController');

router.use(authMiddleware);

router.post('/',                          sendMessage);
router.get('/conversations',              getConversations);
router.get('/:interlocuteur_id',          getMessages);
router.post('/broadcast',                 broadcastDonneurs);

module.exports = router;
