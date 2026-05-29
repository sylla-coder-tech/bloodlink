require('dotenv').config();
const { supabaseAdmin } = require('./config/supabase');

async function addIndexes() {
  try {
    console.log('Ajout des index pour optimiser les performances...');

    // Index pour la table messages
    const { error: error1 } = await supabaseAdmin
      .rpc('exec_sql', { sql: 'CREATE INDEX IF NOT EXISTS idx_messages_demande_id ON messages(demande_id)' });
    
    if (error1) {
      console.log('Erreur idx_messages_demande_id:', error1.message);
      console.log('Tentative alternative via SQL direct...');
    } else {
      console.log('✅ Index idx_messages_demande_id créé');
    }

    const { error: error2 } = await supabaseAdmin
      .rpc('exec_sql', { sql: 'CREATE INDEX IF NOT EXISTS idx_messages_destinataire_id ON messages(destinataire_id)' });
    
    if (error2) {
      console.log('Erreur idx_messages_destinataire_id:', error2.message);
    } else {
      console.log('✅ Index idx_messages_destinataire_id créé');
    }

    const { error: error3 } = await supabaseAdmin
      .rpc('exec_sql', { sql: 'CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC)' });
    
    if (error3) {
      console.log('Erreur idx_messages_created_at:', error3.message);
    } else {
      console.log('✅ Index idx_messages_created_at créé');
    }

    console.log('✅ Index ajoutés avec succès !');
  } catch (err) {
    console.error('Erreur lors de l\'ajout des index:', err.message);
    process.exit(1);
  }
}

addIndexes();
