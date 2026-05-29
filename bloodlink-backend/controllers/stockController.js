const { supabaseAdmin } = require('../config/supabase');

// Récupérer tout le stock
async function getStock(req, res) {
  try {
    const { data, error } = await supabaseAdmin
      .from('stock_sanguin').select('*').order('groupe_sanguin');
    if (error) throw error;
    return res.json({ success: true, stock: data });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
}

// Mettre à jour le stock (ajout ou sortie)
async function updateStock(req, res) {
  try {
    const { groupe_sanguin, operation, quantite, motif } = req.body;
    // operation: 'ajout' | 'sortie'
    if (!groupe_sanguin || !operation || !quantite || quantite <= 0) {
      return res.status(400).json({ success: false, message: 'groupe_sanguin, operation et quantite requis' });
    }

    const { data: current, error: fetchErr } = await supabaseAdmin
      .from('stock_sanguin').select('quantite').eq('groupe_sanguin', groupe_sanguin).single();
    if (fetchErr) throw fetchErr;

    const nouvelleQuantite = operation === 'ajout'
      ? current.quantite + parseInt(quantite)
      : current.quantite - parseInt(quantite);

    if (nouvelleQuantite < 0) {
      return res.status(400).json({ success: false, message: 'Stock insuffisant pour cette sortie' });
    }

    const { data, error } = await supabaseAdmin
      .from('stock_sanguin')
      .update({ quantite: nouvelleQuantite, updated_at: new Date().toISOString() })
      .eq('groupe_sanguin', groupe_sanguin)
      .select().single();
    if (error) throw error;

    // Log audit
    try {
      await supabaseAdmin.from('audit_logs').insert({
        admin_id: req.user.id, admin_email: req.user.email,
        action: `stock_${operation}`, cible_type: 'stock', cible_id: data.id,
        details: { groupe_sanguin, quantite, motif: motif || null, nouvelle_quantite: nouvelleQuantite }
      });
    } catch (_) {}

    return res.json({ success: true, stock: data });
  } catch (err) {
    console.error('updateStock:', err.message);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
}

// Envoyer une convocation à un donneur
async function envoyerConvocation(req, res) {
  try {
    const { donneur_id, type, message, date_rdv } = req.body;
    if (!donneur_id || !message) {
      return res.status(400).json({ success: false, message: 'donneur_id et message requis' });
    }

    const { data, error } = await supabaseAdmin
      .from('convocations')
      .insert({ donneur_id, admin_id: req.user.id, type: type || 'renouvellement', message, date_rdv: date_rdv || null })
      .select().single();
    if (error) throw error;

    // Notification au donneur
    try {
      await supabaseAdmin.from('notifications').insert({
        destinataire_id: donneur_id, destinataire_type: 'donneur',
        type_alerte: 'convocation',
        contenu: `📋 Le CNTS vous convoque : ${message}`,
        statut_lecture: false
      });
    } catch (_) {}

    return res.status(201).json({ success: true, convocation: data });
  } catch (err) {
    console.error('envoyerConvocation:', err.message);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
}

// Récupérer les convocations d'un donneur
async function getMesConvocations(req, res) {
  try {
    const { id } = req.user;
    const { data, error } = await supabaseAdmin
      .from('convocations').select('*').eq('donneur_id', id).order('created_at', { ascending: false });
    if (error) throw error;
    return res.json({ success: true, convocations: data });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
}

// Répondre à une convocation (donneur)
async function repondreConvocation(req, res) {
  try {
    const { id: donneurId } = req.user;
    const { id } = req.params;
    const { statut } = req.body; // 'confirmée' | 'refusée'

    if (!['confirmée', 'refusée'].includes(statut)) {
      return res.status(400).json({ success: false, message: 'statut doit être confirmée ou refusée' });
    }

    const { data, error } = await supabaseAdmin
      .from('convocations').update({ statut }).eq('id', id).eq('donneur_id', donneurId).select().single();
    if (error) throw error;

    return res.json({ success: true, convocation: data });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
}

module.exports = { getStock, updateStock, envoyerConvocation, getMesConvocations, repondreConvocation };
