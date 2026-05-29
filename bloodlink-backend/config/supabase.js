const { createClient } = require('@supabase/supabase-js');

const supabaseUrl    = process.env.SUPABASE_URL;
const anonKey        = process.env.SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !anonKey || !serviceRoleKey) {
  console.error('Supabase env vars missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, anonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  },
  global: {
    headers: {
      'Connection': 'keep-alive'
    }
  },
  db: {
    schema: 'public'
  }
});

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { 
    autoRefreshToken: false, 
    persistSession: false,
    detectSessionInUrl: false
  },
  global: {
    headers: {
      'Connection': 'keep-alive'
    }
  },
  db: {
    schema: 'public'
  }
});

module.exports = { supabase, supabaseAdmin };
