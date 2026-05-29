const { supabaseAdmin } = require('../config/supabase');

// Récupérer le profil complet du donneur connecté
async function getProfile(req, res) {
  try {
    const { id } = req.user;
    const { data, error } = await supabaseAdmin
      .from('donneurs').select('*').eq('id', id).single();
    if (error) throw error;
    if (!data) {
      return res.status(404).json({ success: false, message: 'Profil introuvable' });
    }
    return res.json({ success: true, donneur: data });
  } catch (err) {
    console.error('getProfile:', err.message);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
}

// Récupérer les demandes compatibles avec le profil du donneur connecté
async function getDemandesCompatibles(req, res) {
  try {
    const { id: donneurId } = req.user;

    const { data: donneur, error: dErr } = await supabaseAdmin
      .from('donneurs').select('groupe_sanguin, commune, disponibilite').eq('id', donneurId).single();
    if (dErr) throw dErr;

    if (!donneur.disponibilite) {
      return res.json({ success: true, demandes: [], message: 'Vous avez désactivé votre disponibilité' });
    }

    // Récupérer les IDs des demandes auxquelles le donneur a déjà répondu
    const { data: reponses } = await supabaseAdmin
      .from('reponses')
      .select('demande_id')
      .eq('donneur_id', donneurId);

    const dejaRepondues = (reponses || []).map(r => r.demande_id);

    let query = supabaseAdmin
      .from('demandes')
      .select('*, structures(nom, commune, telephone)')
      .eq('groupe_sanguin', donneur.groupe_sanguin)
      .neq('statut', 'cloturee')
      .order('created_at', { ascending: false });

    // Exclure les demandes déjà répondues
    if (dejaRepondues.length > 0) {
      query = query.not('id', 'in', `(${dejaRepondues.join(',')})`);
    }

    const { data: demandes, error } = await query;
    if (error) throw error;

    return res.json({ success: true, demandes });
  } catch (err) {
    console.error('getDemandesCompatibles:', err.message);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
}

// Mettre à jour la disponibilité
async function updateDisponibilite(req, res) {
  try {
    const { id } = req.user;
    const { disponibilite } = req.body;
    if (typeof disponibilite !== 'boolean') {
      return res.status(400).json({ success: false, message: 'disponibilite doit être true ou false' });
    }
    const { data, error } = await supabaseAdmin
      .from('donneurs').update({ disponibilite }).eq('id', id).select().single();
    if (error) throw error;
    return res.json({ success: true, message: `Disponibilité mise à jour`, disponibilite: data.disponibilite });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
}

// Mettre à jour le profil
async function updateProfil(req, res) {
  try {
    const { id } = req.user;
    const allowed = ['prenom','nom','sexe','telephone','commune','quartier','disponibilite'];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
    const { data, error } = await supabaseAdmin
      .from('donneurs').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return res.json({ success: true, message: 'Profil mis à jour', donneur: data });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
}

// Réponses envoyées par le donneur
async function getMesReponses(req, res) {
  try {
    const { id } = req.user;
    const { data, error } = await supabaseAdmin
      .from('reponses')
      .select('*, demandes(reference, groupe_sanguin, commune, urgence, structures(nom))')
      .eq('donneur_id', id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return res.json({ success: true, reponses: data });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
}

// Notifications du donneur
async function getNotifications(req, res) {
  try {
    const { id } = req.user;
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('destinataire_id', id)
      .order('created_at', { ascending: false })
      .limit(20);
    if (error) throw error;
    const nonLues = data.filter(n => !n.statut_lecture).length;
    return res.json({ success: true, notifications: data, nonLues });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
}

// Marquer toutes les notifications comme lues
async function marquerNotificationsLues(req, res) {
  try {
    const { id } = req.user;
    const { error } = await supabaseAdmin
      .from('notifications')
      .update({ statut_lecture: true })
      .eq('destinataire_id', id)
      .eq('statut_lecture', false);
    if (error) throw error;
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
}

module.exports = { getProfile, getDemandesCompatibles, updateDisponibilite, updateProfil, getMesReponses, getNotifications, marquerNotificationsLues };
