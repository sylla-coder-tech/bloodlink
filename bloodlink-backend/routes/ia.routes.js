const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { chatbotIA } = require('../services/iaService');
const { supabaseAdmin } = require('../config/supabase');

// Chatbot IA — accessible à tous les utilisateurs connectés
router.post('/chatbot', authMiddleware, async (req, res) => {
  try {
    const { message, historique = [] } = req.body;
    if (!message || message.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Message vide' });
    }
    if (message.length > 500) {
      return res.status(400).json({ success: false, message: 'Message trop long (max 500 caractères)' });
    }

    const { id, role } = req.user;
    let userContext = {};

    if (role === 'donneur') {
      const { data } = await supabaseAdmin.from('donneurs').select('groupe_sanguin, commune').eq('id', id).single();
      userContext = data || {};
    }

    const result = await chatbotIA(message, role, userContext, historique);
    return res.json(result);
  } catch (err) {
    console.error('chatbot route error:', err.message);
    return res.status(500).json({ success: false, reponse: 'Erreur serveur' });
  }
});

module.exports = router;
