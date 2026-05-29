const { supabaseAdmin } = require('../config/supabase');

// API (frontend) ↔ base (schema.sql : validé, refusé)
const STATUT_API_TO_DB = { valide: 'validé', refuse: 'refusé' };
const STATUT_DB_TO_API = { validé: 'valide', refusé: 'refuse', en_attente: 'en_attente' };

function normalizeStructureStatut(structure) {
  if (!structure) return structure;
  const apiStatut = STATUT_DB_TO_API[structure.statut_validation];
  const normalized = apiStatut
    ? { ...structure, statut_validation: apiStatut }
    : { ...structure };
  if (!normalized.type && normalized.type_structure) {
    normalized.type = normalized.type_structure;
  }
  return normalized;
}

// Enregistrer une action dans le journal d'audit
async function logAudit(adminId, adminEmail, action, cibleType, cibleId, details = {}) {
  try {
    await supabaseAdmin.from('audit_logs').insert({
      admin_id: adminId, admin_email: adminEmail,
      action, cible_type: cibleType, cible_id: cibleId, details
    });
  } catch (err) {
    console.error('logAudit error:', err.message);
  }
}

// Dashboard global
async function getDashboard(req, res) {
  try {
    const [
      { count: nbDonneurs },
      { count: nbStructures },
      { count: nbDemandesOuvertes },
      { count: nbDemandesCloturees },
      { count: nbEnAttente },
      { count: nbDonneursValides },
      { count: nbDonneursAttente }
    ] = await Promise.all([
      supabaseAdmin.from('donneurs').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('structures').select('*', { count: 'exact', head: true }).eq('statut_validation', 'validé'),
      supabaseAdmin.from('demandes').select('*', { count: 'exact', head: true }).eq('statut','ouverte'),
      supabaseAdmin.from('demandes').select('*', { count: 'exact', head: true }).in('statut',['cloturee','clôturée']),
      supabaseAdmin.from('structures').select('*', { count: 'exact', head: true }).eq('statut_validation','en_attente'),
      supabaseAdmin.from('donneurs').select('*', { count: 'exact', head: true }).eq('statut_validation','validé'),
      supabaseAdmin.from('donneurs').select('*', { count: 'exact', head: true }).eq('statut_validation','en_attente'),
    ]);

    // Répartition par groupe sanguin et par commune — une seule requête
    const { data: donneursData } = await supabaseAdmin.from('donneurs').select('groupe_sanguin, commune');
    const parGroupe = {};
    const parCommune = {};
    donneursData?.forEach(d => {
      parGroupe[d.groupe_sanguin] = (parGroupe[d.groupe_sanguin] || 0) + 1;
      if (d.commune) parCommune[d.commune] = (parCommune[d.commune] || 0) + 1;
    });

    const totalDemandes = (nbDemandesOuvertes || 0) + (nbDemandesCloturees || 0);
    const tauxResolution = totalDemandes > 0 ? Math.round((nbDemandesCloturees / totalDemandes) * 100) : 0;

    return res.json({
      success: true,
      stats: {
        nbDonneurs, nbStructures, nbDemandesOuvertes,
        nbDemandesCloturees, nbEnAttente, tauxResolution,
        nbDonneursValides, nbDonneursAttente
      },
      parGroupe, parCommune
    });
  } catch (err) {
    console.error('getDashboard:', err.message);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
}

// Lister toutes les structures
async function getStructures(req, res) {
  try {
    const { statut } = req.query;
    let query = supabaseAdmin.from('structures').select('*');
    if (statut) {
      const dbStatut = STATUT_API_TO_DB[statut] || statut;
      query = query.eq('statut_validation', dbStatut);
    }
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return res.json({
      success: true,
      structures: (data || []).map(normalizeStructureStatut)
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
}

// Valider ou refuser une structure
async function validerStructure(req, res) {
  try {
    const { id } = req.params;
    const { decision, motif_refus } = req.body;

    console.log('validerStructure:', { id, decision, motif_refus });

    if (!['valide','refuse'].includes(decision)) {
      console.error('Decision invalide:', decision);
      return res.status(400).json({ success: false, message: 'decision doit être valide ou refuse' });
    }

    const statutDb = STATUT_API_TO_DB[decision];

    const { data, error } = await supabaseAdmin
      .from('structures')
      .update({ statut_validation: statutDb, motif_refus: motif_refus || null })
      .eq('id', id)
      .select()
      .single();
    if (error) {
      console.error('Erreur update structure:', error.message);
      throw error;
    }

    console.log('Structure mise à jour:', data);
    await logAudit(req.user.id, req.user.email, `structure_${decision}`, 'structure', id, { motif_refus: motif_refus || null });
    return res.json({
      success: true,
      message: decision === 'valide' ? 'Structure validée !' : 'Structure refusée.',
      structure: normalizeStructureStatut(data)
    });
  } catch (err) {
    console.error('validerStructure error:', err.message);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
}

// Lister tous les donneurs
async function getDonneurs(req, res) {
  try {
    const { statut_validation } = req.query;
    let query = supabaseAdmin.from('donneurs').select('*').order('created_at', { ascending: false });
    if (statut_validation) query = query.eq('statut_validation', statut_validation);
    const { data, error } = await query;
    if (error) throw error;
    return res.json({ success: true, donneurs: data });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
}

// Toutes les demandes
async function getAllDemandes(req, res) {
  try {
    const { data, error } = await supabaseAdmin
      .from('demandes')
      .select('*, structures(nom, commune)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return res.json({ success: true, demandes: data });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
}

// Activité récente — réponses aux demandes
async function getReports(req, res) {
  try {
    const { data, error } = await supabaseAdmin
      .from('reponses')
      .select('*, donneurs(prenom, nom, groupe_sanguin, commune), demandes(reference, groupe_sanguin, urgence, structure_id)')
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw error;
    return res.json({ success: true, reports: data || [] });
  } catch (err) {
    console.error('getReports:', err.message);
    return res.status(500).json({ success: false, message: 'Erreur serveur', detail: err.message });
  }
}

// Valider / rejeter / suspendre un donneur
async function validerDonneur(req, res) {
  try {
    const { id } = req.params;
    const { decision, motif } = req.body; // decision: 'valide' | 'rejete' | 'suspendu'

    const statutMap = { valide: 'validé', rejete: 'rejeté', suspendu: 'suspendu' };
    if (!statutMap[decision]) {
      return res.status(400).json({ success: false, message: 'decision doit être valide, rejete ou suspendu' });
    }

    const { data, error } = await supabaseAdmin
      .from('donneurs')
      .update({ statut_validation: statutMap[decision] })
      .eq('id', id)
      .select('id, prenom, nom, email, statut_validation')
      .single();
    if (error) throw error;

    await logAudit(req.user.id, req.user.email, `donneur_${decision}`, 'donneur', id, { motif: motif || null });

    return res.json({ success: true, message: `Donneur ${statutMap[decision]}`, donneur: data });
  } catch (err) {
    console.error('validerDonneur:', err.message);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
}

// Récupérer le journal d'audit
async function getAuditLogs(req, res) {
  try {
    const { limit = 50, cible_type } = req.query;
    let query = supabaseAdmin
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));
    if (cible_type) query = query.eq('cible_type', cible_type);
    const { data, error } = await query;
    if (error) throw error;
    return res.json({ success: true, logs: data || [] });
  } catch (err) {
    console.error('getAuditLogs:', err.message);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
}

// Mettre à jour le statut d'une demande (CNTS)
async function updateDemandeStatut(req, res) {
  try {
    const { id } = req.params;
    let { statut } = req.body;

    // Normaliser les variantes sans accent vers la valeur acceptée par la DB
    if (statut === 'cloturee') statut = 'clôturée';

    const { data, error } = await supabaseAdmin
      .from('demandes').update({ statut }).eq('id', id).select().single();
    if (error) throw error;
    return res.json({ success: true, demande: data });
  } catch (err) {
    console.error('updateDemandeStatut:', err.message);
    return res.status(500).json({ success: false, message: err.message || 'Erreur serveur' });
  }
}

// Profil de l'admin connecté
async function getAdminProfile(req, res) {
  try {
    const { id } = req.user;
    const { data, error } = await supabaseAdmin.from('admins').select('id, email, nom, created_at').eq('id', id).single();
    if (error) throw error;
    return res.json({ success: true, admin: data });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
}

// Changer le mot de passe de l'admin
async function changePassword(req, res) {
  try {
    const { email } = req.user;
    const { ancien_mdp, nouveau_mdp } = req.body;
    if (!ancien_mdp || !nouveau_mdp) {
      return res.status(400).json({ success: false, message: 'Ancien et nouveau mot de passe requis' });
    }
    if (nouveau_mdp.length < 6) {
      return res.status(400).json({ success: false, message: 'Le nouveau mot de passe doit faire au moins 6 caractères' });
    }

    // Vérifier l'ancien mot de passe via l'API REST (sans session persistante)
    const verifyRes = await fetch(`${process.env.SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.SUPABASE_ANON_KEY
      },
      body: JSON.stringify({ email, password: ancien_mdp })
    });
    if (!verifyRes.ok) {
      return res.status(401).json({ success: false, message: 'Ancien mot de passe incorrect' });
    }

    // Récupérer l'auth_user_id depuis Supabase Auth par email
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) throw listError;
    const authUser = users.find(u => u.email === email);
    if (!authUser) {
      return res.status(404).json({ success: false, message: 'Utilisateur Auth introuvable' });
    }

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(authUser.id, { password: nouveau_mdp });
    if (updateError) throw updateError;

    return res.json({ success: true, message: 'Mot de passe mis à jour avec succès' });
  } catch (err) {
    console.error('changePassword:', err.message);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
}

// Toutes les convocations (admin)
async function getConvocations(req, res) {
  try {
    const { data, error } = await supabaseAdmin
      .from('convocations')
      .select('*, donneurs(prenom, nom, groupe_sanguin, commune)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return res.json({ success: true, convocations: data || [] });
  } catch (err) {
    console.error('getConvocations:', err.message);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
}
// Valider qu'un don a été effectué (incrémente nb_dons + met à jour dernier_don)
async function validerDon(req, res) {
  try {
    const { id } = req.params

    const { data: conv, error: convErr } = await supabaseAdmin
      .from('convocations').select('donneur_id, statut').eq('id', id).single()
    if (convErr || !conv) return res.status(404).json({ success: false, message: 'Convocation introuvable' })
    if (conv.statut !== 'confirmée') return res.status(400).json({ success: false, message: 'Le donneur n\'a pas encore confirmé sa venue' })

    const { data: donneur } = await supabaseAdmin
      .from('donneurs').select('nb_dons').eq('id', conv.donneur_id).single()

    await Promise.all([
      supabaseAdmin.from('donneurs').update({
        nb_dons: (donneur?.nb_dons || 0) + 1,
        dernier_don: new Date().toISOString()
      }).eq('id', conv.donneur_id),
      supabaseAdmin.from('convocations').update({ statut: 'don_effectue' }).eq('id', id)
    ])

    return res.json({ success: true, message: 'Don validé avec succès' })
  } catch (err) {
    console.error('validerDon:', err.message)
    return res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
}

module.exports = { getDashboard, getStructures, validerStructure, getDonneurs, getAllDemandes, getReports, getAdminProfile, changePassword, validerDonneur, getAuditLogs, updateDemandeStatut, getConvocations, validerDon };
