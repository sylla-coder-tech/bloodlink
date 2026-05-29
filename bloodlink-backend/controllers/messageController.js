const { supabaseAdmin } = require('../config/supabase');

// Règle : seul admin(CNTS) peut initier. Donneur et structure ne communiquent qu'avec admin.
function isAllowed(expediteurType, destinataireType) {
  if (expediteurType === 'admin') return true;   // CNTS peut écrire à tous
  if (destinataireType === 'admin') return true;  // Tous peuvent écrire au CNTS
  return false; // structure↔donneur interdit
}

async function sendMessage(req, res) {
  try {
    const { id: expediteurId, role: expediteurType } = req.user;
    let { destinataire_id, destinataire_type, contenu, demande_id } = req.body;

    if (!destinataire_type || !contenu) {
      return res.status(400).json({ success: false, message: 'destinataire_type et contenu requis' });
    }

    if (!isAllowed(expediteurType, destinataire_type)) {
      return res.status(403).json({
        success: false,
        message: 'Communication directe interdite. Passez par le CNTS.'
      });
    }

    // Si pas de destinataire_id et destinataire est admin, prendre le premier admin (le plus ancien)
    if (!destinataire_id && destinataire_type === 'admin') {
      const { data: admins } = await supabaseAdmin
        .from('admins').select('id').order('created_at', { ascending: true }).limit(1);
      if (!admins?.length) {
        return res.status(404).json({ success: false, message: 'Aucun administrateur trouvé' });
      }
      destinataire_id = admins[0].id;
      console.log('Admin trouvé pour destinataire:', destinataire_id);
    }

    if (!destinataire_id) {
      return res.status(400).json({ success: false, message: 'destinataire_id requis' });
    }

    console.log('sendMessage:', { expediteurId, expediteurType, destinataire_id, destinataire_type });

    const { data, error } = await supabaseAdmin
      .from('messages')
      .insert({
        demande_id: demande_id || null,
        expediteur_id: expediteurId,
        expediteur_type: expediteurType,
        destinataire_id,
        destinataire_type,
        contenu
      })
      .select().single();
    if (error) throw error;

    return res.status(201).json({ success: true, data });
  } catch (err) {
    console.error('sendMessage:', err.message);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
}

async function getMessages(req, res) {
  try {
    const { id: userId, role } = req.user;
    const { interlocuteur_id } = req.params;

    let query;
    if (role === 'admin') {
      query = supabaseAdmin
        .from('messages')
        .select('*')
        .or(`and(expediteur_type.eq.admin,destinataire_id.eq.${interlocuteur_id}),and(expediteur_id.eq.${interlocuteur_id},destinataire_type.eq.admin)`)
        .order('created_at', { ascending: true });
    } else {
      query = supabaseAdmin
        .from('messages')
        .select('*')
        .or(`and(expediteur_id.eq.${userId},destinataire_id.eq.${interlocuteur_id}),and(expediteur_id.eq.${interlocuteur_id},destinataire_id.eq.${userId})`)
        .order('created_at', { ascending: true });
    }

    const { data, error } = await query;
    if (error) throw error;

    // Enrichir les messages avec les noms des expéditeurs
    const messages = data || [];
    const donneurIds = [...new Set(messages.filter(m => m.expediteur_type === 'donneur').map(m => m.expediteur_id))];
    const structureIds = [...new Set(messages.filter(m => m.expediteur_type === 'structure').map(m => m.expediteur_id))];

    const [donneursRes, structuresRes] = await Promise.all([
      donneurIds.length ? supabaseAdmin.from('donneurs').select('id, nom, prenom').in('id', donneurIds) : { data: [] },
      structureIds.length ? supabaseAdmin.from('structures').select('id, nom').in('id', structureIds) : { data: [] }
    ]);

    const donneurMap = Object.fromEntries((donneursRes.data || []).map(d => [d.id, d]));
    const structureMap = Object.fromEntries((structuresRes.data || []).map(s => [s.id, s]));

    const enriched = messages.map(msg => {
      if (msg.expediteur_type === 'donneur' && donneurMap[msg.expediteur_id]) {
        const d = donneurMap[msg.expediteur_id];
        return { ...msg, expediteur_prenom: d.prenom, expediteur_nom: d.nom };
      }
      if (msg.expediteur_type === 'structure' && structureMap[msg.expediteur_id]) {
        return { ...msg, expediteur_nom: structureMap[msg.expediteur_id].nom };
      }
      return msg;
    });

    // Marquer comme lus
    await supabaseAdmin.from('messages')
      .update({ lu: true })
      .eq('destinataire_id', userId)
      .eq('lu', false)
      .filter('expediteur_id', 'eq', interlocuteur_id);

    return res.json({ success: true, messages: enriched });
  } catch (err) {
    console.error('getMessages:', err.message);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
}

// Conversations : liste des interlocuteurs distincts
async function getConversations(req, res) {
  try {
    const { id: userId, role } = req.user;

    let data, error;

    if (role === 'admin') {
      ({ data, error } = await supabaseAdmin
        .from('messages')
        .select('expediteur_id, expediteur_type, destinataire_id, destinataire_type, contenu, created_at, lu')
        .or('expediteur_type.eq.admin,destinataire_type.eq.admin')
        .order('created_at', { ascending: false }));
    } else {
      ({ data, error } = await supabaseAdmin
        .from('messages')
        .select('expediteur_id, expediteur_type, destinataire_id, destinataire_type, contenu, created_at, lu')
        .or(`expediteur_id.eq.${userId},destinataire_id.eq.${userId}`)
        .order('created_at', { ascending: false }));
    }

    if (error) throw error;

    // Grouper par interlocuteur
    const seen = new Map();
    (data || []).forEach(msg => {
      const isFromMe = role === 'admin'
        ? msg.expediteur_type === 'admin'
        : msg.expediteur_id === userId;
      const interlocId = isFromMe ? msg.destinataire_id : msg.expediteur_id;
      const interlocType = isFromMe ? msg.destinataire_type : msg.expediteur_type;
      const isUnreadForMe = !msg.lu && !isFromMe;
      if (!seen.has(interlocId)) {
        seen.set(interlocId, {
          interlocuteur_id: interlocId,
          interlocuteur_type: interlocType,
          dernier_message: msg.contenu,
          derniere_date: msg.created_at,
          non_lus: isUnreadForMe ? 1 : 0
        });
      } else if (isUnreadForMe) {
        seen.get(interlocId).non_lus++;
      }
    });

    const conversations = Array.from(seen.values());

    // Enrichir avec les noms depuis les tables donneurs/structures
    const donneurIds = conversations.filter(c => c.interlocuteur_type === 'donneur').map(c => c.interlocuteur_id);
    const structureIds = conversations.filter(c => c.interlocuteur_type === 'structure').map(c => c.interlocuteur_id);

    const [donneursRes, structuresRes] = await Promise.all([
      donneurIds.length
        ? supabaseAdmin.from('donneurs').select('id, nom, prenom, groupe_sanguin, commune').in('id', donneurIds)
        : { data: [] },
      structureIds.length
        ? supabaseAdmin.from('structures').select('id, nom, commune').in('id', structureIds)
        : { data: [] }
    ]);

    const donneurMap = Object.fromEntries((donneursRes.data || []).map(d => [d.id, d]));
    const structureMap = Object.fromEntries((structuresRes.data || []).map(s => [s.id, s]));

    const enriched = conversations.map(conv => {
      if (conv.interlocuteur_type === 'donneur' && donneurMap[conv.interlocuteur_id]) {
        const d = donneurMap[conv.interlocuteur_id];
        return { ...conv, interlocuteur_prenom: d.prenom, interlocuteur_nom: d.nom, groupe_sanguin: d.groupe_sanguin, commune: d.commune };
      }
      if (conv.interlocuteur_type === 'structure' && structureMap[conv.interlocuteur_id]) {
        const s = structureMap[conv.interlocuteur_id];
        return { ...conv, interlocuteur_nom: s.nom, commune: s.commune };
      }
      return conv;
    });

    return res.json({ success: true, conversations: enriched });
  } catch (err) {
    console.error('getConversations:', err.message);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
}

// CNTS envoie un message à tous les donneurs d'un groupe sanguin
async function broadcastDonneurs(req, res) {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Réservé au CNTS' });
    }
    const { groupe_sanguin, contenu } = req.body;
    if (!contenu) return res.status(400).json({ success: false, message: 'contenu requis' });

    let query = supabaseAdmin.from('donneurs').select('id').eq('statut_validation', 'validé');
    if (groupe_sanguin) query = query.eq('groupe_sanguin', groupe_sanguin);
    const { data: donneurs } = await query;

    if (!donneurs?.length) return res.json({ success: true, envoyes: 0 });

    const messages = donneurs.map(d => ({
      expediteur_id: req.user.id, expediteur_type: 'admin',
      destinataire_id: d.id, destinataire_type: 'donneur', contenu
    }));
    await supabaseAdmin.from('messages').insert(messages);

    return res.json({ success: true, envoyes: donneurs.length });
  } catch (err) {
    console.error('broadcastDonneurs:', err.message);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
}

module.exports = { sendMessage, getMessages, getConversations, broadcastDonneurs };
