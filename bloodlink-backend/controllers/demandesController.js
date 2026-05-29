// controllers/demandesController.js
const supabase = require('../config/supabase');
const iaService = require('../services/iaService');

// Notifier les donneurs compatibles d'une nouvelle demande
async function notifierDonneursCompatibles(demande) {
  const { data: donneurs } = await supabase
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

  await supabase.from('notifications').insert(notifications);
}

// ============================================================
//  POST /api/demandes — Créer une demande urgente
// ============================================================
async function creerDemande(req, res) {
  try {
    const { groupe_sanguin, quantite, commune, urgence, date_limite, notes } = req.body;
    const structure_id = req.user.id;

    if (!groupe_sanguin || !quantite || !commune || !urgence || !date_limite) {
      return res.status(400).json({ error: 'Champs obligatoires manquants.' });
    }
    if (new Date(date_limite) < new Date()) {
      return res.status(400).json({ error: 'La date limite doit être dans le futur.' });
    }

    // ── Créer la demande
    const { data: demande, error } = await supabase
      .from('demandes')
      .insert([{ structure_id, groupe_sanguin, quantite, commune, urgence, date_limite, notes }])
      .select(`*, structures(nom, telephone, commune)`)
      .single();

    if (error) throw error;

    // ── Lancer le matching IA en arrière-plan (asynchrone)
    lancerMatchingIA(demande.id, groupe_sanguin, commune, urgence, notes).catch(console.error);

    // ── Notifier les donneurs compatibles en arrière-plan
    notifierDonneursCompatibles(demande).catch(console.error);

    return res.status(201).json({
      message: '🚀 Demande publiée ! Le matching IA est en cours...',
      demande
    });

  } catch (err) {
    console.error('creerDemande error:', err);
    return res.status(500).json({ error: 'Erreur serveur.' });
  }
}

// ── Fonction interne : lancer le matching IA après création
async function lancerMatchingIA(demande_id, groupe_sanguin, commune, urgence, notes) {
  // Récupérer les donneurs compatibles (pré-filtrés)
  const { data: donneurs } = await supabase
    .from('donneurs')
    .select('id, prenom, nom, groupe_sanguin, commune, quartier, telephone, disponibilite, nb_dons, dernier_don')
    .eq('groupe_sanguin', groupe_sanguin)
    .eq('disponibilite', true)
    .eq('statut', 'actif');

  if (!donneurs || donneurs.length === 0) {
    console.log(`Aucun donneur compatible trouvé pour le groupe ${groupe_sanguin}`);
    return;
  }

  console.log(`${donneurs.length} donneurs compatibles trouvés pour le groupe ${groupe_sanguin}`);

  // Appel IA pour le scoring intelligent
  const resultatIA = await iaService.matchingIA({
    id: demande_id,
    groupe_sanguin,
    commune,
    urgence,
    notes
  });

  // Sauvegarder le résultat dans la demande
  await supabase
    .from('demandes')
    .update({ matching_ia_result: resultatIA, nb_matches: resultatIA.total })
    .eq('id', demande_id);

  console.log(`Matching IA terminé pour la demande ${demande_id} : ${resultatIA.total} donneurs matchés`);
}

// ============================================================
//  GET /api/demandes — Liste des demandes
// ============================================================
async function listerDemandes(req, res) {
  try {
    const { role, id } = req.user;
    const { statut, groupe, commune } = req.query;

    let query = supabase
      .from('demandes')
      .select(`
        id, groupe_sanguin, quantite, commune, urgence,
        date_limite, statut, notes, created_at,
        structures(id, nom, commune, telephone)
      `)
      .order('created_at', { ascending: false });

    // ── Filtres selon le rôle
    if (role === 'structure') {
      // La structure ne voit que ses propres demandes
      query = query.eq('structure_id', id);
    } else if (role === 'donneur') {
      // Le donneur ne voit que les demandes ouvertes (pas clôturées)
      query = query.neq('statut', 'clôturée');
    }

    // ── Filtres optionnels
    if (statut) query = query.eq('statut', statut);
    if (groupe) query = query.eq('groupe_sanguin', groupe);
    if (commune) query = query.eq('commune', commune);

    const { data, error } = await query;
    if (error) throw error;

    return res.json({ demandes: data, total: data.length });

  } catch (err) {
    console.error('listerDemandes error:', err);
    return res.status(500).json({ error: 'Erreur serveur.' });
  }
}

// ============================================================
//  GET /api/demandes/:id — Détail d'une demande
// ============================================================
async function detailDemande(req, res) {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('demandes')
      .select(`
        *, structures(id, nom, commune, quartier, telephone, responsable),
        reponses(id, donneur_id, statut_reponse, created_at,
          donneurs(prenom, nom, groupe_sanguin, commune, telephone))
      `)
      .eq('id', id)
      .single();

    if (error || !data) return res.status(404).json({ error: 'Demande introuvable.' });

    return res.json({ demande: data });
  } catch (err) {
    console.error('detailDemande error:', err);
    return res.status(500).json({ error: 'Erreur serveur.' });
  }
}

// ============================================================
//  GET /api/demandes/:id/matching — Résultats matching IA
// ============================================================
async function getMatching(req, res) {
  try {
    const { id } = req.params;

    // Récupérer la demande + le résultat IA déjà stocké
    const { data: demande, error } = await supabase
      .from('demandes')
      .select('id, groupe_sanguin, commune, urgence, notes, statut, matching_ia_result')
      .eq('id', id)
      .single();

    if (error || !demande) return res.status(404).json({ error: 'Demande introuvable.' });
    if (demande.statut === 'clôturée') {
      return res.status(400).json({ error: 'Cette demande est clôturée.' });
    }

    // Si le matching IA n'est pas encore prêt, on le lance maintenant
    if (!demande.matching_ia_result) {
      const { data: donneurs } = await supabase
        .from('donneurs')
        .select('id, prenom, nom, groupe_sanguin, commune, quartier, telephone, disponibilite, nb_dons, dernier_don')
        .eq('groupe_sanguin', demande.groupe_sanguin)
        .eq('disponibilite', true)
        .eq('statut', 'actif');

      const resultatIA = await iaService.matchingIntelligent({
        demande: { groupe_sanguin: demande.groupe_sanguin, commune: demande.commune, urgence: demande.urgence, notes: demande.notes },
        donneurs: donneurs || []
      });

      // Sauvegarder
      await supabase.from('demandes').update({ matching_ia_result: resultatIA }).eq('id', id);

      return res.json({ matching: resultatIA, source: 'ia_fresh' });
    }

    return res.json({ matching: demande.matching_ia_result, source: 'ia_cached' });

  } catch (err) {
    console.error('getMatching error:', err);
    return res.status(500).json({ error: 'Erreur serveur.' });
  }
}

// ============================================================
//  PUT /api/demandes/:id/statut — Changer le statut
// ============================================================
async function changerStatut(req, res) {
  try {
    const { id } = req.params;
    const { statut } = req.body;
    const structure_id = req.user.id;

    const statutsValides = ['ouverte', 'contactés', 'confirmés', 'clôturée'];
    if (!statutsValides.includes(statut)) {
      return res.status(400).json({ error: `Statut invalide. Valeurs : ${statutsValides.join(', ')}` });
    }

    // Vérifier que la demande appartient à cette structure
    const { data: demande } = await supabase
      .from('demandes').select('id, statut, structure_id').eq('id', id).single();

    if (!demande) return res.status(404).json({ error: 'Demande introuvable.' });
    if (req.user.role !== 'admin' && demande.structure_id !== structure_id) {
      return res.status(403).json({ error: 'Vous ne pouvez modifier que vos propres demandes.' });
    }
    if (demande.statut === 'clôturée') {
      return res.status(400).json({ error: 'Une demande clôturée ne peut plus être modifiée.' });
    }

    const { data, error } = await supabase
      .from('demandes').update({ statut }).eq('id', id).select().single();

    if (error) throw error;

    return res.json({ message: `Statut mis à jour : ${statut}`, demande: data });
  } catch (err) {
    console.error('changerStatut error:', err);
    return res.status(500).json({ error: 'Erreur serveur.' });
  }
}

// ============================================================
//  POST /api/demandes/:id/repondre — Réponse d'un donneur
// ============================================================
async function repondreDemande(req, res) {
  try {
    const { id: demande_id } = req.params;
    const donneur_id = req.user.id;
    const { statut_reponse, message } = req.body;

    // Vérifier la demande
    const { data: demande } = await supabase
      .from('demandes').select('id, statut, groupe_sanguin, structure_id, commune').eq('id', demande_id).single();

    if (!demande) return res.status(404).json({ error: 'Demande introuvable.' });
    if (demande.statut === 'clôturée') {
      return res.status(400).json({ error: 'Cette demande est clôturée. Plus de réponses acceptées.' });
    }

    // Récupérer les infos du donneur pour la notification
    const { data: donneur } = await supabase
      .from('donneurs').select('prenom, nom, groupe_sanguin, commune').eq('id', donneur_id).single();

    // Upsert (créer ou mettre à jour la réponse)
    const { data, error } = await supabase
      .from('reponses')
      .upsert([{ donneur_id, demande_id, statut_reponse: statut_reponse || 'intéressé', message }],
               { onConflict: 'donneur_id,demande_id' })
      .select()
      .single();

    if (error) throw error;

    // Notifier la structure de la réponse du donneur
    if (statut_reponse !== 'refusé') {
      await supabase.from('notifications').insert([{
        destinataire_id: demande.structure_id,
        destinataire_type: 'structure',
        type: 'reponse_recue',
        titre: `🩸 Nouvelle réponse - ${donneur.prenom} ${donneur.nom}`,
        contenu: `Le donneur ${donneur.prenom} ${donneur.nom} (${donneur.groupe_sanguin}) de ${donneur.commune} a répondu à votre demande de sang ${demande.groupe_sanguin}.`,
        demande_id: demande_id
      }]).catch(console.error);
    }

    return res.status(201).json({
      message: statut_reponse === 'refusé'
        ? 'Réponse enregistrée. Merci pour votre retour.'
        : '✅ Votre disponibilité a été transmise à la structure de santé !',
      reponse: data
    });

  } catch (err) {
    console.error('repondreDemande error:', err);
    return res.status(500).json({ error: 'Erreur serveur.' });
  }
}

module.exports = { creerDemande, listerDemandes, detailDemande, getMatching, changerStatut, repondreDemande };
