const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  const cookieToken = req.cookies?.bl_token;

  let token = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (cookieToken) {
    token = cookieToken;
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Token manquant' });
  }

  // Vérifier si le token est révoqué
  try {
    const { jwtBlacklist } = require('../server');
    if (jwtBlacklist.has(token)) {
      return res.status(401).json({ success: false, message: 'Token révoqué' });
    }
  } catch (_) { /* server pas encore chargé au premier démarrage */ }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token invalide ou expiré' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Accès refusé — rôle insuffisant' });
    }
    next();
  };
}

// Bloquer les donneurs non validés par le CNTS
async function requireDonneurValide(req, res, next) {
  try {
    const { supabaseAdmin } = require('../config/supabase');
    const { data } = await supabaseAdmin
      .from('donneurs')
      .select('statut_validation')
      .eq('id', req.user.id)
      .single();

    const statut = data?.statut_validation;
    if (!statut || statut === 'en_attente') {
      return res.status(403).json({
        success: false,
        code: 'COMPTE_EN_ATTENTE',
        message: 'Votre compte est en attente de validation par le CNTS.'
      });
    }
    if (statut === 'rejeté') {
      return res.status(403).json({
        success: false,
        code: 'COMPTE_REJETE',
        message: 'Votre inscription a été rejetée par le CNTS. Contactez-nous.'
      });
    }
    if (statut === 'suspendu') {
      return res.status(403).json({
        success: false,
        code: 'COMPTE_SUSPENDU',
        message: 'Votre compte a été suspendu par le CNTS.'
      });
    }
    next();
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
}

// Bloquer les structures non validées par le CNTS
async function requireStructureValidee(req, res, next) {
  try {
    const { supabaseAdmin } = require('../config/supabase');
    const { data } = await supabaseAdmin
      .from('structures')
      .select('statut_validation')
      .eq('id', req.user.id)
      .single();

    const statut = data?.statut_validation;
    if (!statut || statut === 'en_attente') {
      return res.status(403).json({
        success: false,
        code: 'STRUCTURE_EN_ATTENTE',
        message: 'Votre compte est en attente de validation par le CNTS.'
      });
    }
    if (statut === 'refuse' || statut === 'refusé') {
      return res.status(403).json({
        success: false,
        code: 'STRUCTURE_REFUSEE',
        message: 'Votre compte structure a été refusé par le CNTS.'
      });
    }
    next();
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
}

module.exports = { authMiddleware, requireRole, requireDonneurValide, requireStructureValidee };
