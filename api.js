// ============================================================
//  api.js — BloodLink Frontend
//  Tous les appels au back-end Node.js + Express
//  Kɛnɛya Digital Guinée — 2025
// ============================================================

// URL de ton back-end — change si tu déploies en ligne
const API_URL = 'http://localhost:3001/api';

// ─── GESTION DU TOKEN JWT ────────────────────────────────────
const Auth = {
  // Sauvegarder le token après connexion
  setToken(token)  { localStorage.setItem('bl_token', token); },
  // Récupérer le token
  getToken()       { return localStorage.getItem('bl_token'); },
  // Supprimer le token (déconnexion)
  removeToken()    { localStorage.removeItem('bl_token'); localStorage.removeItem('bl_role'); localStorage.removeItem('bl_user'); },
  // Sauvegarder le rôle et l'utilisateur
  setUser(role, user) {
    localStorage.setItem('bl_role', role);
    localStorage.setItem('bl_user', JSON.stringify(user));
  },
  // Récupérer le rôle
  getRole()        { return localStorage.getItem('bl_role'); },
  // Récupérer l'utilisateur
  getUser()        { return JSON.parse(localStorage.getItem('bl_user') || '{}'); },
  // Vérifier si connecté
  isLoggedIn()     { return !!this.getToken(); }
};

// ─── FONCTION PRINCIPALE D'APPEL API ────────────────────────
async function apiCall(method, endpoint, body = null, requireAuth = false) {
  const headers = { 'Content-Type': 'application/json' };

  // Ajouter le token si nécessaire
  if (requireAuth) {
    const token = Auth.getToken();
    if (!token) {
      showError('Session expirée. Veuillez vous reconnecter.');
      goPage('page-login');
      return null;
    }
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  try {
    const response = await fetch(`${API_URL}${endpoint}`, options);
    const data = await response.json();

    if (!response.ok && response.status === 401) {
      Auth.removeToken();
      goPage('page-login');
      showError('Session expirée. Veuillez vous reconnecter.');
      return null;
    }

    return { ok: response.ok, status: response.status, data };
  } catch (err) {
    console.error('Erreur réseau:', err);
    showError('Impossible de contacter le serveur. Vérifiez que le back-end est démarré.');
    return null;
  }
}

// ─── AUTH ─────────────────────────────────────────────────────

// Inscription donneur
async function API_registerDonneur(formData) {
  showLoading(true);
  const res = await apiCall('POST', '/auth/register/donneur', formData);
  showLoading(false);

  if (!res) return false;
  if (!res.ok) {
    showError(res.data.message || 'Erreur lors de l\'inscription');
    return false;
  }

  toast('✅ Compte créé avec succès ! Vous pouvez vous connecter.');
  return true;
}

// Inscription structure
async function API_registerStructure(formData) {
  showLoading(true);
  const res = await apiCall('POST', '/auth/register/structure', formData);
  showLoading(false);

  if (!res) return false;
  if (!res.ok) {
    showError(res.data.message || 'Erreur lors de l\'inscription');
    return false;
  }

  toast('✅ Demande envoyée ! En attente de validation par l\'administrateur.');
  return true;
}

// Connexion
async function API_login(email, password) {
  showLoading(true);
  const res = await apiCall('POST', '/auth/login', { email, password });
  showLoading(false);

  if (!res) return null;
  if (!res.ok) {
    showError(res.data.message || 'Email ou mot de passe incorrect');
    return null;
  }

  // Sauvegarder token + user
  Auth.setToken(res.data.token);
  Auth.setUser(res.data.role, res.data.user);
  return res.data;
}

// Déconnexion
function API_logout() {
  Auth.removeToken();
  toast('Vous avez été déconnecté.');
  goPage('page-login');
}

// Récupérer mon profil
async function API_getMe() {
  const res = await apiCall('GET', '/auth/me', null, true);
  if (!res || !res.ok) return null;
  return res.data.user;
}

// ─── DONNEUR ──────────────────────────────────────────────────

// Demandes compatibles avec le profil du donneur
async function API_getDemandesCompatibles() {
  const res = await apiCall('GET', '/donneur/demandes', null, true);
  if (!res || !res.ok) return [];
  return res.data.demandes || [];
}

// Mettre à jour la disponibilité
async function API_updateDisponibilite(disponibilite) {
  const res = await apiCall('PUT', '/donneur/disponibilite', { disponibilite }, true);
  if (!res || !res.ok) {
    showError('Erreur lors de la mise à jour de la disponibilité');
    return false;
  }
  toast(disponibilite ? '✅ Vous êtes maintenant disponible' : '⏸️ Vous êtes maintenant indisponible');
  return true;
}

// Répondre à une demande
async function API_repondreDemande(demandeId, statut) {
  const res = await apiCall('POST', `/donneur/demandes/${demandeId}/repondre`, { statut }, true);
  if (!res || !res.ok) {
    showError('Erreur lors de l\'envoi de la réponse');
    return false;
  }
  toast(statut === 'interesse' ? '✅ Réponse envoyée ! La structure vous contactera.' : 'Réponse enregistrée.');
  return true;
}

// Mes réponses
async function API_getMesReponses() {
  const res = await apiCall('GET', '/donneur/reponses', null, true);
  if (!res || !res.ok) return [];
  return res.data.reponses || [];
}

// Mettre à jour le profil donneur
async function API_updateProfil(updates) {
  const res = await apiCall('PUT', '/donneur/profil', updates, true);
  if (!res || !res.ok) {
    showError('Erreur lors de la mise à jour du profil');
    return false;
  }
  toast('✅ Profil mis à jour avec succès !');
  return true;
}

// ─── STRUCTURE ────────────────────────────────────────────────

// Créer une demande urgente
async function API_createDemande(formData) {
  showLoading(true);
  const res = await apiCall('POST', '/structure/demandes', formData, true);
  showLoading(false);

  if (!res || !res.ok) {
    showError(res?.data?.message || 'Erreur lors de la création de la demande');
    return null;
  }
  toast('🚀 Demande publiée ! Matching IA en cours...');
  return res.data.demande;
}

// Mes demandes (structure)
async function API_getMesDemandes(statut = null) {
  const url = statut ? `/structure/demandes?statut=${statut}` : '/structure/demandes';
  const res = await apiCall('GET', url, null, true);
  if (!res || !res.ok) return [];
  return res.data.demandes || [];
}

// Résultats du matching IA pour une demande
async function API_getMatching(demandeId) {
  showLoading(true);
  const res = await apiCall('GET', `/structure/demandes/${demandeId}/matching`, null, true);
  showLoading(false);

  if (!res || !res.ok) {
    showError('Erreur lors du matching IA');
    return null;
  }
  return res.data;
}

// Clôturer une demande
async function API_cloturerDemande(demandeId) {
  const res = await apiCall('PUT', `/structure/demandes/${demandeId}/cloturer`, {}, true);
  if (!res || !res.ok) {
    showError('Erreur lors de la clôture');
    return false;
  }
  toast('Demande clôturée avec succès.');
  return true;
}

// ─── ADMIN ────────────────────────────────────────────────────

// Dashboard admin
async function API_getAdminDashboard() {
  const res = await apiCall('GET', '/admin/dashboard', null, true);
  if (!res || !res.ok) return null;
  return res.data;
}

// Liste des structures
async function API_getStructures(statut = null) {
  const url = statut ? `/admin/structures?statut=${statut}` : '/admin/structures';
  const res = await apiCall('GET', url, null, true);
  if (!res || !res.ok) return [];
  return res.data.structures || [];
}

// Valider ou refuser une structure
async function API_validerStructure(structureId, decision, motifRefus = null) {
  const body = { decision };
  if (motifRefus) body.motif_refus = motifRefus;
  const res = await apiCall('PUT', `/admin/structures/${structureId}/valider`, body, true);
  if (!res || !res.ok) {
    showError('Erreur lors de la validation');
    return false;
  }
  toast(decision === 'valide' ? '✅ Structure validée !' : '❌ Structure refusée.');
  return true;
}

// Liste des donneurs (admin)
async function API_getDonneurs() {
  const res = await apiCall('GET', '/admin/donneurs', null, true);
  if (!res || !res.ok) return [];
  return res.data.donneurs || [];
}

// Toutes les demandes (admin)
async function API_getAllDemandes() {
  const res = await apiCall('GET', '/admin/demandes', null, true);
  if (!res || !res.ok) return [];
  return res.data.demandes || [];
}

// ─── IA CHATBOT ───────────────────────────────────────────────

// Envoyer un message au chatbot IA
async function API_chatbot(message) {
  const res = await apiCall('POST', '/ia/chatbot', { message }, true);
  if (!res) return 'Erreur de connexion au serveur.';
  return res.data.reponse || 'Je ne peux pas répondre pour le moment.';
}

// ─── HELPERS UI ───────────────────────────────────────────────

// Afficher/masquer un spinner de chargement
function showLoading(show) {
  let loader = document.getElementById('global-loader');
  if (!loader) {
    loader = document.createElement('div');
    loader.id = 'global-loader';
    loader.style.cssText = `
      position: fixed; top: 0; left: 0; right: 0; height: 3px;
      background: linear-gradient(90deg, #C0392B, #E74C3C, #C0392B);
      background-size: 200% 100%;
      animation: loading 1s infinite linear;
      z-index: 9999; display: none;
    `;
    const style = document.createElement('style');
    style.textContent = '@keyframes loading { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }';
    document.head.appendChild(style);
    document.body.appendChild(loader);
  }
  loader.style.display = show ? 'block' : 'none';
}

// Afficher un message d'erreur
function showError(message) {
  toast('❌ ' + message, true);
}

// ─── INIT AU CHARGEMENT ───────────────────────────────────────
// Vérifier si l'utilisateur est déjà connecté au chargement de la page
window.addEventListener('load', () => {
  if (Auth.isLoggedIn()) {
    const role = Auth.getRole();
    const user = Auth.getUser();

    if (role === 'donneur') {
      initDonneurDashboard(user);
      goPage('page-dashboard-donneur');
    } else if (role === 'structure') {
      initStructureDashboard(user);
      goPage('page-dashboard-structure');
    } else if (role === 'admin') {
      initAdminDashboard();
      goPage('page-dashboard-admin');
    }
  }
});

// ─── FONCTIONS D'INITIALISATION DES DASHBOARDS ───────────────

async function initDonneurDashboard(user) {
  // Mettre à jour le nom dans la nav
  const navName = document.getElementById('nav-donneur-name');
  const navAv   = document.getElementById('nav-donneur-av');
  const greet   = document.getElementById('greet-name');
  if (navName) navName.textContent = user.prenom + ' ' + user.nom;
  if (navAv)   navAv.textContent   = (user.prenom?.[0] || '') + (user.nom?.[0] || '');
  if (greet)   greet.textContent   = user.prenom;

  // Groupe sanguin
  const gsEl = document.getElementById('d-stat-gs');
  if (gsEl) gsEl.textContent = user.groupe_sanguin;

  // Badge donneur universel
  if (user.groupe_sanguin === 'O-') {
    const banner = document.getElementById('d-universal-banner');
    if (banner) banner.style.display = 'flex';
  }

  // Charger les demandes compatibles
  renderDonneurRecent();
}

async function initStructureDashboard(user) {
  const navName  = document.getElementById('nav-struct-name');
  const subtitle = document.getElementById('struct-subtitle');
  if (navName)  navName.textContent  = user.nom;
  if (subtitle) subtitle.textContent = user.nom + ' · ' + user.commune;
  renderStructOverview();
}

async function initAdminDashboard() {
  renderBloodChart();
  renderCommuneChart();
  loadAdminStats();
}

async function loadAdminStats() {
  const data = await API_getAdminDashboard();
  if (!data) return;

  const s = data.stats;
  const ids = {
    'a-stat-open':    s.nbDemandesOuvertes,
    'a-stat-pending': s.nbEnAttente,
    'a-pending-badge': s.nbEnAttente,
    'pending-count':  s.nbEnAttente,
  };
  Object.entries(ids).forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  });
}

console.log('✅ BloodLink API.js chargé — back-end:', API_URL);
