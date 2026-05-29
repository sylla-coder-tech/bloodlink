const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { supabase, supabaseAdmin } = require('../config/supabase');

function signToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
}

// ── INSCRIPTION DONNEUR
async function registerDonneur(req, res) {
  try {
    const {
      prenom, nom, sexe, telephone, email,
      groupe_sanguin, commune, quartier,
      disponibilite, password
    } = req.body;

    if (!prenom || !nom || !telephone || !groupe_sanguin || !commune || !password) {
      return res.status(400).json({ success: false, message: 'Champs obligatoires manquants' });
    }

    // Créer l'utilisateur dans Supabase Auth
    const authEmail = email || `${telephone}@bloodlink.gn`;
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: authEmail, password, email_confirm: true
    });
    if (authError) {
      if (authError.message.includes('already registered')) {
        return res.status(409).json({ success: false, message: 'Cet email ou téléphone est déjà utilisé' });
      }
      throw authError;
    }

    // Créer le profil donneur
    const { data: donneur, error: dbError } = await supabaseAdmin
      .from('donneurs')
      .insert({
        prenom, nom, sexe, telephone, email,
        groupe_sanguin, commune, quartier,
        disponibilite: disponibilite !== false,
        auth_user_id: authData.user.id
      })
      .select()
      .single();
    if (dbError) throw dbError;

    const token = signToken({ id: donneur.id, role: 'donneur', auth_user_id: authData.user.id });
    return res.status(201).json({ success: true, message: 'Compte donneur créé', token, donneur });
  } catch (err) {
    console.error('registerDonneur:', err.message);
    return res.status(500).json({ success: false, message: 'Erreur serveur', detail: err.message });
  }
}

// ── INSCRIPTION STRUCTURE
async function registerStructure(req, res) {
  try {
    const { nom, type, telephone, email, commune, quartier, responsable, password, structure_type } = req.body;
    const structureType = structure_type || type || 'Autre';
    if (!nom || !telephone || !email || !commune || !responsable || !password) {
      return res.status(400).json({ success: false, message: 'Champs obligatoires manquants' });
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email, password, email_confirm: true
    });
    if (authError) {
      if (authError.message.includes('already registered')) {
        return res.status(409).json({ success: false, message: 'Cet email est déjà utilisé' });
      }
      throw authError;
    }

    const { data: structure, error: dbError } = await supabaseAdmin
      .from('structures')
      .insert({
        nom, type_structure: structureType, telephone, email, commune, quartier, responsable,
        statut_validation: 'en_attente',
        auth_user_id: authData.user.id
      })
      .select()
      .single();
    if (dbError) throw dbError;

    const token = signToken({ id: structure.id, role: 'structure', auth_user_id: authData.user.id });
    return res.status(201).json({
      success: true,
      message: 'Demande envoyée. Votre compte est en attente de validation par l\'administrateur.',
      token, structure
    });
  } catch (err) {
    console.error('registerStructure:', err.message);
    return res.status(500).json({ success: false, message: 'Erreur serveur', detail: err.message });
  }
}

// ── CONNEXION (donneur, structure, admin)
async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email et mot de passe requis' });
    }

    // Auth via Supabase — client anon uniquement pour signInWithPassword (pas admin)
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError || !authData?.user) {
      console.error('Login authError:', authError?.message);
      return res.status(401).json({ success: false, message: 'Email ou mot de passe incorrect' });
    }

    const userId = authData.user.id;

    // Vérifier admin, donneur et structure en parallèle
    const [
      { data: admin },
      { data: donneur },
      { data: structure }
    ] = await Promise.all([
      supabaseAdmin.from('admins').select('*').eq('email', email).maybeSingle(),
      supabaseAdmin.from('donneurs').select('*').eq('auth_user_id', userId).maybeSingle(),
      supabaseAdmin.from('structures').select('*').eq('auth_user_id', userId).maybeSingle()
    ]);

    if (admin) {
      const token = signToken({ id: admin.id, role: 'admin', email: admin.email });
      return res.json({ success: true, role: 'admin', token, user: admin });
    }

    if (donneur) {
      const statut = donneur.statut_validation
      if (statut === 'rejeté' || statut === 'rejete') {
        return res.status(403).json({ success: false, code: 'COMPTE_REJETE', message: 'Votre inscription a été rejetée par le CNTS. Contactez-nous pour plus d\'informations.' })
      }
      if (statut === 'suspendu') {
        return res.status(403).json({ success: false, code: 'COMPTE_SUSPENDU', message: 'Votre compte a été suspendu par le CNTS. Contactez-nous pour régulariser votre situation.' })
      }
      const token = signToken({ id: donneur.id, role: 'donneur', auth_user_id: userId });
      return res.json({ success: true, role: 'donneur', token, user: donneur });
    }

    if (structure) {
      if (structure.statut_validation === 'refuse' || structure.statut_validation === 'refusé') {
        return res.status(403).json({ success: false, message: 'Votre compte structure a été refusé. Contactez BloodLink.' });
      }
      const token = signToken({ id: structure.id, role: 'structure', statut: structure.statut_validation, auth_user_id: userId });
      return res.json({ success: true, role: 'structure', token, user: structure });
    }

    return res.status(404).json({ success: false, message: 'Compte introuvable' });
  } catch (err) {
    console.error('login:', err.message);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
}

// ── PROFIL CONNECTÉ
async function getMe(req, res) {
  try {
    const { id, role } = req.user;
    let data;
    if (role === 'donneur') {
      const r = await supabaseAdmin.from('donneurs').select('*').eq('id', id).single();
      data = r.data;
    } else if (role === 'structure') {
      const r = await supabaseAdmin.from('structures').select('*').eq('id', id).single();
      data = r.data;
    } else {
      const r = await supabaseAdmin.from('admins').select('*').eq('id', id).single();
      data = r.data;
    }
    return res.json({ success: true, role, user: data });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
}

// ── INSCRIPTION GÉNÉRIQUE (redirige selon le type)
async function register(req, res) {
  try {
    const { type } = req.body;
    
    if (!type) {
      return res.status(400).json({ 
        success: false, 
        message: 'Le champ "type" est obligatoire',
        hint: 'Utilisez type: "donneur" ou type: "structure"'
      });
    }

    if (type === 'donneur') {
      return registerDonneur(req, res);
    } else if (type === 'structure') {
      return registerStructure(req, res);
    } else {
      return res.status(400).json({ 
        success: false, 
        message: 'Type d\'utilisateur invalide. Utilisez "donneur" ou "structure"' 
      });
    }
  } catch (err) {
    console.error('register:', err.message);
    return res.status(500).json({ success: false, message: 'Erreur serveur', detail: err.message });
  }
}

module.exports = { register, registerDonneur, registerStructure, login, getMe };