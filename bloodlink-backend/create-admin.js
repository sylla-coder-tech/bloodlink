require('dotenv').config();
const bcrypt = require('bcryptjs');
const { supabaseAdmin } = require('./config/supabase');

async function createAdmin() {
  try {
    const email = 'admin@bloodlink.gn';
    const password = 'Admin2025!';
    const nom = 'Administrateur BloodLink';

    console.log('Création de l\'administrateur...');
    console.log('Email:', email);
    console.log('Mot de passe:', password);

    // D'abord, vérifier si l'utilisateur existe déjà
    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = users.find(u => u.email === email);

    let authUserId;

    if (existingUser) {
      console.log('L\'utilisateur existe déjà dans Supabase Auth.');
      console.log('ID utilisateur existant:', existingUser.id);
      authUserId = existingUser.id;

      // Mettre à jour le mot de passe
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(authUserId, {
        password: password
      });
      if (updateError) {
        console.error('Erreur lors de la mise à jour du mot de passe:', updateError.message);
        throw updateError;
      }
      console.log('Mot de passe mis à jour avec succès.');
    } else {
      // Créer l'utilisateur dans Supabase Auth
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true
      });

      if (authError) {
        throw authError;
      }
      console.log('Utilisateur créé dans Supabase Auth:', authData.user.id);
      authUserId = authData.user.id;
    }

    // Créer ou mettre à jour l'admin dans la table admins
    const { data: existingAdmin } = await supabaseAdmin
      .from('admins')
      .select('*')
      .eq('email', email)
      .single();

    let adminData;
    if (existingAdmin) {
      console.log('L\'admin existe déjà dans la table admins.');
      adminData = existingAdmin;
    } else {
      const { data: newAdmin, error: adminError } = await supabaseAdmin
        .from('admins')
        .insert({
          nom,
          email
        })
        .select()
        .single();

      if (adminError) throw adminError;
      adminData = newAdmin;
    }

    console.log('✅ Administrateur créé avec succès !');
    console.log('Email:', email);
    console.log('Mot de passe:', password);
    console.log('ID Admin:', adminData.id);
    console.log('ID Auth User:', authUserId);

  } catch (err) {
    console.error('Erreur lors de la création de l\'administrateur:', err.message);
    process.exit(1);
  }
}

createAdmin();
