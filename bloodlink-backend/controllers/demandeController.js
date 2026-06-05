const { supabaseAdmin } = require('../config/supabase');
const { matchingIA } = require('../services/iaService');

// Notifier les donneurs compatibles d'une nouvelle demande
async function notifierDonneursCompatibles(demande) {
  const { data: donneurs } = await supabaseAdmin
    .from('donneurs')
    .select('id')
    .eq('groupe_sanguin', demande.groupe_sanguin)
    .eq('disponibilite', true)
    .eq('statut', 'actif');

  if (!donneurs || donneurs.length === 0) return;

  const notifications = donneurs.map(d => ({
    destinataire_id: d.id,
    destinataire_type: 'donneur',
    type: 'nouvelle_demande',
    titre: `🩸 Demande urgente ${demande.groupe_sanguin}`,
    contenu: `Une structure à ${demande.commune} a besoin de ${demande.quantite} poche(s) de sang ${demande.groupe_sanguin}. Urgence : ${demande.urgence}.`,
    demande_id: demande.id
  }));

  await supabaseAdmin.from('notifications').insert(notifications);
  console.log(`${donneurs.length} donneurs notifiés pour la demande ${demande.id}`);
}

// Récupérer le profil complet de la structure connectée
async function getProfile(req, res) {
  try {
    const { id } = req.user;
    const { data, error } = await supabaseAdmin
      .from('structures').select('*').eq('id', id).single();
    if (error) throw error;
    if (!data) {
      return res.status(404).json({ success: false, message: 'Profil introuvable' });
    }
    return res.json({ success: true, structure: data });
  } catch (err) {
    console.error('getProfile:', err.message);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
}

// Créer une demande urgente
async function createDemande(req, res) {
  try {
    const { id: structureId, statut } = req.user;

    if (statut === 'en_attente') {
      return res.status(403).json({
        success: false,
        message: 'Votre compte est en attente de validation. Vous ne pouvez pas encore publier de demande.'
      });
    }

    const { groupe_sanguin, quantite, commune, urgence, date_limite, notes } = req.body;
    if (!groupe_sanguin || !quantite || !commune || !urgence || !date_limite) {
      return res.status(400).json({ success: false, message: 'Champs obligatoires manquants' });
    }

    const { data: demande, error } = await supabaseAdmin
      .from('demandes')
      .insert({ structure_id: structureId, groupe_sanguin, quantite, commune, urgence, date_limite, notes })
      .select('*, structures(nom, commune, telephone)')
      .single();
    if (error) throw error;

    // Lancer le matching IA en arrière-plan (sans bloquer la réponse)
    matchingIA(demande).then(matches => {
      if (matches && matches.donneurs) {
        supabaseAdmin.from('demandes')
          .update({ nb_matches: matches.donneurs.length, ia_analyse: matches.ia_analyse, matching_ia_result: matches })
          .eq('id', demande.id);
        console.log(`Matching IA terminé : ${matches.donneurs.length} donneurs matchés`);
      } else {
        console.log('Matching IA : aucun résultat');
      }
    }).catch(err => console.error('Erreur matching IA:', err));

    // Notifier les donneurs compatibles en arrière-plan
    notifierDonneursCompatibles(demande).catch(err => console.error('Erreur notification:', err));

    return res.status(201).json({
      success: true,
      message: 'Demande publiée. Matching IA en cours...',
      demande
    });
  } catch (err) {
    console.error('createDemande:', err.message);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
}

// Récupérer les demandes d'une structure
async function getMesDemandes(req, res) {
  try {
    const { id: structureId } = req.user;
    const { statut } = req.query;
    let query = supabaseAdmin.from('demandes').select('*').eq('structure_id', structureId);
    if (statut) query = query.eq('statut', statut);
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return res.json({ success: true, demandes: data });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
}

// Clôturer une demande
async function cloturerDemande(req, res) {
  try {
    const { id: structureId } = req.user;
    const { id: demandeId } = req.params;

    const { data: existing, error: fetchErr } = await supabaseAdmin
      .from('demandes').select('structure_id, statut').eq('id', demandeId).single();

    if (fetchErr) {
      console.error('cloturerDemande fetch:', fetchErr.message);
      return res.status(500).json({ success: false, message: fetchErr.message });
    }
    if (!existing || existing.structure_id !== structureId) {
      return res.status(403).json({ success: false, message: 'Accès refusé' });
    }
    if (existing.statut === 'clôturée' || existing.statut === 'cloturee') {
      return res.status(400).json({ success: false, message: 'Demande déjà clôturée' });
    }

    // Essayer d'abord avec accent, puis sans accent si ça échoue
    let data, error;
    ({ data, error } = await supabaseAdmin
      .from('demandes').update({ statut: 'clôturée' }).eq('id', demandeId).select().single());

    if (error) {
      console.error('cloturerDemande (avec accent):', error.message);
      ({ data, error } = await supabaseAdmin
        .from('demandes').update({ statut: 'cloturee' }).eq('id', demandeId).select().single());
    }

    if (error) {
      console.error('cloturerDemande (sans accent):', error.message);
      return res.status(500).json({ success: false, message: error.message });
    }

    return res.json({ success: true, message: 'Demande clôturée', demande: data });
  } catch (err) {
    console.error('cloturerDemande exception:', err.message);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
}

// Résultats du matching IA pour une demande
async function getMatching(req, res) {
  try {
    const { id: demandeId } = req.params;
    const { data: demande, error } = await supabaseAdmin
      .from('demandes').select('*').eq('id', demandeId).single();
    if (error || !demande) return res.status(404).json({ success: false, message: 'Demande introuvable' });

    const result = await matchingIA(demande);
    return res.json({ success: true, ...result });
  } catch (err) {
    console.error('getMatching:', err.message);
    return res.status(500).json({ success: false, message: 'Erreur matching IA' });
  }
}

// Répondre à une demande (côté donneur)
async function repondreDemande(req, res) {
  try {
    const { id: donneurId } = req.user;
    const { id: demandeId } = req.params;
    const { statut_reponse = 'intéressé', message } = req.body;

    const { data: demande } = await supabaseAdmin
      .from('demandes').select('statut, structure_id, groupe_sanguin, commune').eq('id', demandeId).single();
    if (!demande || demande.statut === 'cloturee') {
      return res.status(400).json({ success: false, message: 'Cette demande est clôturée ou introuvable' });
    }

    // Récupérer les infos du donneur pour la notification
    const { data: donneur } = await supabaseAdmin
      .from('donneurs').select('prenom, nom, groupe_sanguin, commune').eq('id', donneurId).single();

    const { data, error } = await supabaseAdmin
      .from('reponses')
      .upsert({ donneur_id: donneurId, demande_id: demandeId, statut_reponse, message },
               { onConflict: 'donneur_id,demande_id' })
      .select()
      .single();
    if (error) throw error;

    // Notifier la structure de la réponse du donneur
    if (statut_reponse !== 'refusé') {
      try {
        await supabaseAdmin.from('notifications').insert([{
          destinataire_id: demande.structure_id,
          destinataire_type: 'structure',
          type_alerte: 'reponse_recue',
          contenu: `🩸 Nouvelle réponse - ${donneur.prenom} ${donneur.nom} (${donneur.groupe_sanguin}) de ${donneur.commune} a répondu à votre demande de sang ${demande.groupe_sanguin}.`,
          statut_lecture: false
        }]);
      } catch (err) {
        console.error('Erreur notification structure:', err);
      }
    }

    return res.json({ success: true, message: 'Réponse enregistrée', reponse: data });
  } catch (err) {
    console.error('repondreDemande:', err.message);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
}

// Mettre à jour le profil de la structure connectée
async function updateProfile(req, res) {
  try {
    const { id } = req.user;
    const allowed = ['nom', 'telephone', 'commune', 'quartier', 'type', 'responsable'];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
    const { data, error } = await supabaseAdmin
      .from('structures').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return res.json({ success: true, message: 'Profil mis à jour', structure: data });
  } catch (err) {
    console.error('updateProfile structure:', err.message);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
}

// Récupérer les donneurs disponibles (pour la structure)
async function getDonneurs(req, res) {
  try {
    const { groupe_sanguin } = req.query
    let query = supabaseAdmin
      .from('donneurs')
      .select('id, prenom, nom, groupe_sanguin, commune, quartier, telephone, disponibilite')
      .eq('disponibilite', true)
    if (groupe_sanguin) query = query.eq('groupe_sanguin', groupe_sanguin)
    const { data, error } = await query.order('commune')
    if (error) throw error
    return res.json({ success: true, donneurs: data })
  } catch (err) {
    console.error('getDonneurs:', err.message)
    return res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
}

// Notifications de la structure
async function getNotifications(req, res) {
  try {
    const { id } = req.user;
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('destinataire_id', id)
      .eq('destinataire_type', 'structure')
      .order('created_at', { ascending: false })
      .limit(20);
    if (error) throw error;
    const nonLues = data.filter(n => !n.statut_lecture).length;
    return res.json({ success: true, notifications: data, nonLues });
  } catch (err) {
    console.error('getNotifications structure:', err.message);
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
      .eq('destinataire_type', 'structure')
      .eq('statut_lecture', false);
    if (error) throw error;
    return res.json({ success: true });
  } catch (err) {
    console.error('marquerNotificationsLues structure:', err.message);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
}

module.exports = { getProfile, updateProfile, getDonneurs, createDemande, getMesDemandes, cloturerDemande, getMatching, repondreDemande, getNotifications, marquerNotificationsLues };
