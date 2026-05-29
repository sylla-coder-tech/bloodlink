// ============================================================
//  patch.js — BloodLink Frontend
//  Remplace les fonctions simulées par les vrais appels API
//  Ajoute ce fichier APRÈS api.js dans ton HTML
// ============================================================

// ─── CONNEXION ───────────────────────────────────────────────
async function doLogin() {
  const email = document.getElementById('login-email').value.trim();
  const pwd   = document.getElementById('login-pwd').value.trim();
  const err   = document.getElementById('login-error');
  if (err) err.style.display = 'none';

  if (!email || !pwd) {
    if (err) { err.textContent = 'Email et mot de passe requis.'; err.style.display = 'block'; }
    return;
  }

  const result = await API_login(email, pwd);
  if (!result) {
    if (err) { err.textContent = 'Email ou mot de passe incorrect.'; err.style.display = 'block'; }
    return;
  }

  const { role, user } = result;

  if (role === 'donneur') {
    await initDonneurDashboard(user);
    goPage('page-dashboard-donneur');
    toast('Bienvenue, ' + user.prenom + ' ! 🩸');

  } else if (role === 'structure') {
    if (user.statut_validation === 'en_attente') {
      if (err) {
        err.textContent = '⏳ Votre compte est en attente de validation par l\'administrateur.';
        err.style.display = 'block';
      }
      API_logout();
      return;
    }
    await initStructureDashboard(user);
    goPage('page-dashboard-structure');
    toast('Bienvenue, ' + user.nom + ' ! 🏥');

  } else if (role === 'admin') {
    await initAdminDashboard();
    goPage('page-dashboard-admin');
    toast('Connecté — Tableau de bord administrateur 🛡️');
  }
}

// ─── DÉCONNEXION ─────────────────────────────────────────────
function logout() {
  API_logout();
}

// ─── INSCRIPTION DONNEUR ─────────────────────────────────────
async function registerDonneur() {
  const prenom         = document.getElementById('d-prenom')?.value.trim();
  const nom            = document.getElementById('d-nom')?.value.trim();
  const sexe           = document.getElementById('d-sexe')?.value;
  const telephone      = document.getElementById('d-tel')?.value.trim();
  const email          = document.getElementById('d-email')?.value.trim();
  const groupe_sanguin = document.getElementById('d-blood')?.value;
  const commune        = document.getElementById('d-commune')?.value;
  const quartier       = document.getElementById('d-quartier')?.value;
  const disponibilite  = document.getElementById('d-dispo')?.checked ?? true;
  const password       = document.getElementById('d-pwd')?.value;
  const pwd2           = document.getElementById('d-pwd2')?.value;
  const err            = document.getElementById('d-error');

  // Validation
  if (!prenom || !nom || !telephone || !groupe_sanguin || !commune || !password) {
    if (err) { err.textContent = '⚠️ Remplissez tous les champs obligatoires (*).'; err.style.display = 'block'; }
    return;
  }
  if (password !== pwd2) {
    if (err) { err.textContent = '⚠️ Les mots de passe ne correspondent pas.'; err.style.display = 'block'; }
    return;
  }
  if (err) err.style.display = 'none';

  const ok = await API_registerDonneur({
    prenom, nom, sexe, telephone,
    email: email || undefined,
    groupe_sanguin, commune, quartier,
    disponibilite, password
  });

  if (ok) setTimeout(() => goPage('page-login'), 1500);
}

// ─── INSCRIPTION STRUCTURE ────────────────────────────────────
async function registerStructure() {
  const nom         = document.getElementById('s-nom')?.value.trim();
  const type        = document.getElementById('s-type')?.value;
  const commune     = document.getElementById('s-commune')?.value;
  const quartier    = document.getElementById('s-quartier')?.value;
  const responsable = document.getElementById('s-responsable')?.value.trim();
  const telephone   = document.getElementById('s-tel')?.value.trim();
  const email       = document.getElementById('s-email')?.value.trim();
  const password    = document.getElementById('s-pwd')?.value;
  const pwd2        = document.getElementById('s-pwd2')?.value;
  const err         = document.getElementById('s-error');

  if (!nom || !type || !commune || !responsable || !telephone || !email || !password) {
    if (err) { err.textContent = '⚠️ Remplissez tous les champs obligatoires (*).'; err.style.display = 'block'; }
    return;
  }
  if (password !== pwd2) {
    if (err) { err.textContent = '⚠️ Les mots de passe ne correspondent pas.'; err.style.display = 'block'; }
    return;
  }
  if (err) err.style.display = 'none';

  const ok = await API_registerStructure({ nom, type, commune, quartier, responsable, telephone, email, password });
  if (ok) setTimeout(() => goPage('page-login'), 2000);
}

// ─── DASHBOARD DONNEUR ────────────────────────────────────────

// Charger et afficher les demandes compatibles récentes
async function renderDonneurRecent() {
  const container = document.getElementById('d-recent-demands');
  if (!container) return;

  container.innerHTML = '<div class="empty"><div class="empty-icon">⏳</div><div class="empty-title">Chargement...</div></div>';

  const demandes = await API_getDemandesCompatibles();

  // Mettre à jour le compteur
  const notifEl = document.getElementById('d-notif-count');
  const statEl  = document.getElementById('d-stat-recues');
  if (notifEl) notifEl.textContent = demandes.length;
  if (statEl)  statEl.textContent  = demandes.length;

  if (demandes.length === 0) {
    container.innerHTML = '<div class="empty"><div class="empty-icon">🎉</div><div class="empty-title">Aucune demande urgente en ce moment</div><div style="font-size:14px;color:var(--text3);">Vous serez alerté dès qu\'une demande compatible apparaît.</div></div>';
    return;
  }

  container.innerHTML = demandes.slice(0, 2).map(d => renderDemandCard(d, true)).join('');
}

// Charger toutes les demandes compatibles
async function renderDonneurDemands(filter = 'toutes') {
  const container = document.getElementById('d-demands-list');
  if (!container) return;

  container.innerHTML = '<div class="empty"><div class="empty-icon">⏳</div><div class="empty-title">Chargement...</div></div>';

  let demandes = await API_getDemandesCompatibles();

  if (filter === 'haute')       demandes = demandes.filter(d => d.urgence === 'haute');
  if (filter === 'moyenne')     demandes = demandes.filter(d => d.urgence === 'moyenne');
  if (filter === 'disponible')  demandes = demandes.filter(d => d.statut === 'ouverte');

  container.innerHTML = demandes.length
    ? demandes.map(d => renderDemandCard(d, true)).join('')
    : '<div class="empty"><div class="empty-icon">✅</div><div class="empty-title">Aucune demande dans cette catégorie</div></div>';
}

// Toggle disponibilité
async function toggleDispo(el) {
  await API_updateDisponibilite(el.checked);
}

// Réponse à une demande (depuis le modal)
async function respondDemand(statut) {
  closeModal('modal-response');
  const demandeId = document.getElementById('modal-response').dataset.demandeId;
  if (!demandeId) return;
  await API_repondreDemande(demandeId, statut === 'disponible' ? 'interesse' : 'refuse');
  renderDonneurRecent();
}

// Ouvrir le modal de réponse
function openResponseModal(id, blood, commune, structure) {
  const modal = document.getElementById('modal-response');
  if (!modal) return;
  modal.dataset.demandeId = id;
  document.getElementById('modal-demand-info').innerHTML = `
    <div class="highlight-box">
      <div class="hb-title">🏥 ${structure} — Demande #${id.substring(0,8)}...</div>
      <div class="hb-text">Groupe requis : <strong>${blood}</strong> · Lieu : <strong>${commune}</strong></div>
    </div>`;
  modal.classList.add('open');
}

// Sauvegarder le profil donneur
async function saveProfile() {
  const prenom = document.getElementById('p-prenom')?.value;
  const nom    = document.getElementById('p-nom')?.value;
  if (!prenom || !nom) { toast('⚠️ Prénom et nom requis'); return; }

  const ok = await API_updateProfil({ prenom, nom });
  if (ok) {
    document.getElementById('profile-fullname').textContent = prenom + ' ' + nom;
    document.getElementById('profile-av-big').textContent   = (prenom[0]||'') + (nom[0]||'');
    document.getElementById('nav-donneur-name').textContent  = prenom + ' ' + nom;
    document.getElementById('nav-donneur-av').textContent    = (prenom[0]||'') + (nom[0]||'');
  }
}

// ─── DASHBOARD STRUCTURE ─────────────────────────────────────

async function renderStructOverview() {
  const container = document.getElementById('s-recent-list');
  if (!container) return;
  const demandes = await API_getMesDemandes();
  // Stats
  const ouvertesEl  = document.getElementById('s-stat-ouvertes');
  const totalEl     = document.getElementById('s-stat-total');
  if (ouvertesEl) ouvertesEl.textContent = demandes.filter(d => d.statut === 'ouverte').length;
  if (totalEl)    totalEl.textContent    = demandes.length;
  container.innerHTML = demandes.slice(0, 3).map(d => renderDemandCard(d, false, true)).join('');
}

async function renderStructDemands(filter = 'toutes') {
  const container = document.getElementById('s-demand-list-full');
  if (!container) return;
  container.innerHTML = '<div class="empty"><div class="empty-icon">⏳</div><div class="empty-title">Chargement...</div></div>';
  const demandes = filter === 'toutes' ? await API_getMesDemandes() : await API_getMesDemandes(filter);
  container.innerHTML = demandes.length
    ? demandes.map(d => renderDemandCard(d, false, true)).join('')
    : '<div class="empty"><div class="empty-icon">📋</div><div class="empty-title">Aucune demande dans cette catégorie</div></div>';
}

async function createDemand() {
  const groupe_sanguin = document.getElementById('req-blood')?.value;
  const quantite       = document.getElementById('req-qty')?.value;
  const commune        = document.getElementById('req-commune')?.value;
  const urgence        = document.getElementById('req-urgence')?.value;
  const date_limite    = document.getElementById('req-date')?.value;
  const notes          = document.getElementById('req-notes')?.value;
  const err            = document.getElementById('req-error');

  if (!groupe_sanguin || !quantite || !commune || !urgence || !date_limite) {
    if (err) { err.textContent = '⚠️ Remplissez tous les champs obligatoires.'; err.style.display = 'block'; }
    return;
  }
  if (err) err.style.display = 'none';

  const demande = await API_createDemand({ groupe_sanguin, quantite: parseInt(quantite), commune, urgence, date_limite, notes });
  if (!demande) return;

  // Aller directement sur le matching
  currentDemandeId = demande.id;
  showStructSection('matching', null);
  document.querySelectorAll('#page-dashboard-structure .sidebar-item').forEach((i, idx) => i.classList.toggle('active', idx === 3));
  renderMatching([]);
  setTimeout(async () => {
    const result = await API_getMatching(demande.id);
    if (result) renderMatching(result.donneurs, result.ia_analyse);
  }, 1000);
}

// Clôturer une demande
async function askClose(id) {
  pendingCloseId = id;
  document.getElementById('modal-confirm').classList.add('open');
}

async function confirmClose() {
  const ok = await API_cloturerDemande(pendingCloseId);
  if (ok) { renderStructDemands(); renderStructOverview(); }
  closeModal('modal-confirm');
  pendingCloseId = null;
}

// Matching IA
let currentDemandeId = null;

async function renderMatching(donneurs = [], iaAnalyse = '') {
  const container = document.getElementById('matching-list');
  if (!container) return;

  if (donneurs.length === 0 && !iaAnalyse) {
    container.innerHTML = '<div class="empty"><div class="empty-icon">🤖</div><div class="empty-title">Lancement du matching IA...</div></div>';
    return;
  }

  // Afficher l'analyse IA en haut
  if (iaAnalyse) {
    const analyseEl = document.querySelector('.alert-green');
    if (analyseEl) analyseEl.innerHTML = `🤖 <strong>Analyse IA :</strong> ${iaAnalyse}`;
  }

  container.innerHTML = donneurs.length
    ? donneurs.map(d => `
      <div class="match-card">
        <div style="width:46px;height:46px;border-radius:50%;background:var(--red-pale);color:var(--red);font-weight:700;font-size:14px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">${initials(d.prenom + ' ' + d.nom)}</div>
        <div style="flex:1;min-width:0;">
          <div style="font-weight:700;font-size:15px;">${d.prenom} ${d.nom}</div>
          <div style="font-size:13px;color:var(--text2);margin-top:2px;">📍 ${d.commune}${d.quartier ? ', ' + d.quartier : ''}</div>
          <div style="font-size:12px;color:var(--text2);margin-top:4px;font-style:italic;">"${d.ia_explication || ''}"</div>
          <div style="margin-top:6px;">${bloodBadge(d.groupe_sanguin)} <span class="badge badge-green">✅ Disponible</span></div>
        </div>
        <div style="text-align:center;flex-shrink:0;">
          <div class="match-pct">${d.ia_score || 0}%</div>
          <div class="match-lbl">Score IA</div>
          <div style="display:flex;gap:6px;margin-top:8px;flex-direction:column;">
            <a href="tel:+224${d.telephone}" class="btn btn-call btn-sm">📞 Appeler</a>
            <button class="btn btn-outline btn-sm" onclick="toast('Message envoyé à ${d.prenom} ✓')">✉️ Contacter</button>
          </div>
        </div>
      </div>`).join('')
    : '<div class="empty"><div class="empty-icon">😔</div><div class="empty-title">Aucun donneur compatible disponible</div><div style="font-size:14px;color:var(--text3);">Essayez d\'élargir la zone géographique ou vérifiez les disponibilités.</div></div>';
}

// ─── DASHBOARD ADMIN ─────────────────────────────────────────

async function renderAdminStructures() {
  const tbody = document.getElementById('admin-struct-tbody');
  if (!tbody) return;

  const structures = await API_getStructures();
  const pending = structures.filter(s => s.statut_validation === 'en_attente').length;

  // Mettre à jour les compteurs
  ['pending-count', 'a-pending-badge', 'a-stat-pending'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = pending;
  });

  tbody.innerHTML = structures.map(s => `
    <tr>
      <td><strong>${s.nom}</strong></td>
      <td style="font-size:13px;">${s.type}</td>
      <td>${s.commune}</td>
      <td style="font-size:13px;">${s.responsable}</td>
      <td><a href="tel:+224${s.telephone}" style="color:var(--green);font-size:13px;">📞 ${s.telephone}</a></td>
      <td>${s.statut_validation === 'valide' ? '<span class="badge badge-green">✓ Validé</span>' : s.statut_validation === 'refuse' ? '<span class="badge badge-red">✗ Refusé</span>' : '<span class="badge badge-orange">⏳ En attente</span>'}</td>
      <td>${s.statut_validation === 'en_attente' ? `
        <div style="display:flex;gap:6px;">
          <button class="btn btn-green btn-sm" onclick="validerStructure('${s.id}', 'valide')">✓</button>
          <button class="btn btn-ghost btn-sm" onclick="validerStructure('${s.id}', 'refuse')">✗</button>
        </div>` : '<span style="color:var(--text3);font-size:13px;">—</span>'}
      </td>
    </tr>`).join('');
}

async function validerStructure(id, decision) {
  const ok = await API_validerStructure(id, decision);
  if (ok) renderAdminStructures();
}

async function renderAdminDemands() {
  const tbody = document.getElementById('admin-demands-tbody');
  if (!tbody) return;
  const demandes = await API_getAllDemandes();
  tbody.innerHTML = demandes.map(d => `
    <tr>
      <td><strong>${d.reference || d.id.substring(0,8)}</strong></td>
      <td style="font-size:13px;">${d.structures?.nom || '—'}</td>
      <td>${bloodBadge(d.groupe_sanguin)}</td>
      <td>${d.quantite}</td>
      <td>${urgenceBadge(d.urgence)}</td>
      <td>${d.commune}</td>
      <td>${statutBadge(d.statut)}</td>
      <td style="font-size:13px;color:var(--text3);">${new Date(d.created_at).toLocaleDateString('fr-FR')}</td>
    </tr>`).join('');
}

// ─── CHATBOT IA ───────────────────────────────────────────────
let chatMessages = [];

function initChatbot() {
  const chatDiv = document.getElementById('chatbot-messages');
  if (!chatDiv) return;
  chatMessages = [];
  chatDiv.innerHTML = '';
  addChatMessage('assistant', '👋 Bonjour ! Je suis l\'assistant BloodLink. Comment puis-je vous aider ?');
}

function addChatMessage(role, text) {
  const chatDiv = document.getElementById('chatbot-messages');
  if (!chatDiv) return;
  const div = document.createElement('div');
  div.style.cssText = `margin-bottom:10px;display:flex;${role === 'user' ? 'justify-content:flex-end' : ''}`;
  div.innerHTML = `<div style="max-width:80%;padding:10px 14px;border-radius:${role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px'};background:${role === 'user' ? 'var(--red)' : 'var(--bg)'};color:${role === 'user' ? '#fff' : 'var(--text)'};font-size:14px;line-height:1.5;">${text}</div>`;
  chatDiv.appendChild(div);
  chatDiv.scrollTop = chatDiv.scrollHeight;
}

async function sendChatMessage() {
  const input = document.getElementById('chatbot-input');
  if (!input) return;
  const message = input.value.trim();
  if (!message) return;
  input.value = '';

  addChatMessage('user', message);
  addChatMessage('assistant', '⏳ En train de répondre...');

  const reponse = await API_chatbot(message);

  // Remplacer le message de chargement
  const chatDiv = document.getElementById('chatbot-messages');
  const msgs = chatDiv.querySelectorAll('div > div');
  if (msgs.length > 0) msgs[msgs.length - 1].parentElement.remove();

  addChatMessage('assistant', reponse);
}

console.log('✅ BloodLink Patch.js chargé — fonctions API connectées');
