import { useState, useEffect, useRef } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import Sidebar from '../components/layout/Sidebar'
import { AdminService } from '../services'
import { useUnreadMessages } from '../hooks/useUnreadMessages'
import apiClient from '../services/apiClient'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import Alert from '../components/common/Alert'
import AIAssistant from '../components/common/AIAssistant'
import styles from './Dashboard.module.css'

const ADMIN_MENU = [
  {
    label: 'CNTS',
    items: [
      { icon: '📊', label: 'Dashboard', path: '/admin' },
      { icon: '🩸', label: 'Donneurs', path: '/admin/donneurs' },
      { icon: '🏥', label: 'Structures', path: '/admin/structures' },
      { icon: '📋', label: 'Demandes', path: '/admin/demandes' },
      { icon: '🧪', label: 'Stock sanguin', path: '/admin/stock' },
      { icon: '📨', label: 'Convocations', path: '/admin/convocations' },
      { icon: '💬', label: 'Messagerie', path: '/admin/messages' },
      { icon: '📜', label: 'Audit', path: '/admin/audit' },
      { icon: '⚙️', label: 'Paramètres', path: '/admin/settings' },
    ]
  }
]

export default function Admin() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const unread = useUnreadMessages()

  const adminMenu = ADMIN_MENU.map(section => ({
    ...section,
    items: section.items.map(item =>
      item.path === '/admin/messages'
        ? { ...item, badge: unread > 0 ? unread : undefined }
        : item
    )
  }))

  return (
    <div className={styles.dashboard}>
      <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <div className={styles.container}>
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} items={adminMenu} />
        <main className={styles['main-content']}>
          <Routes>
            <Route path="/" element={<AdminHome />} />
            <Route path="/donneurs" element={<AdminDonneurs />} />
            <Route path="/structures" element={<AdminStructures />} />
            <Route path="/demandes" element={<AdminDemandes />} />
            <Route path="/stock" element={<AdminStock />} />
            <Route path="/convocations" element={<AdminConvocations />} />
            <Route path="/messages" element={<AdminMessagerie />} />
            <Route path="/audit" element={<AdminAudit />} />
            <Route path="/settings" element={<AdminSettings />} />
          </Routes>
        </main>
      </div>
      <AIAssistant />
    </div>
  )
}

// ─── Dashboard CNTS ──────────────────────────────────────────────────────────
function AdminHome() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    AdminService.getStats()
      .then(({ data }) => setStats(data.stats || data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const cards = stats ? [
    { icon: '🩸', label: 'Donneurs inscrits', value: stats.nbDonneurs ?? 0, color: 'var(--red)' },
    { icon: '✅', label: 'Donneurs validés', value: stats.nbDonneursValides ?? 0, color: 'var(--green)' },
    { icon: '⏳', label: 'Donneurs en attente', value: stats.nbDonneursAttente ?? 0, color: 'var(--orange)' },
    { icon: '🏥', label: 'Structures validées', value: stats.nbStructures ?? 0, color: 'var(--blue)' },
    { icon: '📋', label: 'Demandes ouvertes', value: stats.nbDemandesOuvertes ?? 0, color: 'var(--red)' },
    { icon: '🏁', label: 'Demandes clôturées', value: stats.nbDemandesCloturees ?? 0, color: 'var(--green)' },
    { icon: '⏳', label: 'Structures en attente', value: stats.nbEnAttente ?? 0, color: 'var(--orange)' },
    { icon: '📈', label: 'Taux de résolution', value: `${stats.tauxResolution ?? 0}%`, color: 'var(--blue)' },
  ] : []

  return (
    <div>
      <h1 style={{ marginBottom: '8px' }}>Dashboard CNTS 📊</h1>
      <p style={{ color: 'var(--text2)', marginBottom: '24px', fontSize: '14px' }}>
        Centre National de Transfusion Sanguine — Vue d'ensemble
      </p>
      {loading ? (
        <p style={{ color: 'var(--text3)' }}>Chargement...</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }}>
          {cards.map(c => (
            <Card key={c.label} style={{ textAlign: 'center', padding: '20px' }}>
              <div style={{ fontSize: '28px', marginBottom: '6px' }}>{c.icon}</div>
              <div style={{ fontSize: '26px', fontWeight: 700, color: c.color }}>{c.value}</div>
              <div style={{ color: 'var(--text2)', fontSize: '12px', marginTop: '4px' }}>{c.label}</div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Gestion Donneurs CNTS ───────────────────────────────────────────────────
function AdminDonneurs() {
  const [donneurs, setDonneurs] = useState([])
  const [loading, setLoading] = useState(true)
  const [alert, setAlert] = useState(null)
  const [filter, setFilter] = useState('en_attente')

  useEffect(() => { loadDonneurs() }, [filter])

  const loadDonneurs = () => {
    setLoading(true)
    apiClient.get('/admin/donneurs', { params: { statut_validation: filter } })
      .then(({ data }) => setDonneurs(data.donneurs || []))
      .catch(() => setAlert({ type: 'error', message: 'Erreur chargement' }))
      .finally(() => setLoading(false))
  }

  const handleDecision = async (id, decision) => {
    try {
      await apiClient.put(`/admin/donneurs/${id}/valider`, { decision })
      const labels = { valide: '✅ Donneur validé', rejete: '❌ Donneur rejeté', suspendu: '⏸️ Donneur suspendu' }
      setAlert({ type: 'success', message: labels[decision] })
      loadDonneurs()
    } catch {
      setAlert({ type: 'error', message: 'Erreur lors de la décision' })
    }
  }

  const statutColor = { en_attente: 'var(--orange)', validé: 'var(--green)', rejeté: 'var(--red)', suspendu: '#999' }
  const statutLabel = { en_attente: '⏳ En attente', validé: '✅ Validé', rejeté: '❌ Rejeté', suspendu: '⏸️ Suspendu' }
  const filters = ['en_attente', 'validé', 'rejeté', 'suspendu']

  return (
    <div>
      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} autoClose />}
      <h1 style={{ marginBottom: '16px' }}>Gestion des donneurs 🩸</h1>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {filters.map(s => (
          <button key={s} onClick={() => setFilter(s)} style={{
            padding: '6px 14px', borderRadius: '20px', border: '1px solid var(--border)', cursor: 'pointer',
            background: filter === s ? 'var(--red)' : 'white',
            color: filter === s ? 'white' : 'var(--text1)', fontSize: '13px'
          }}>
            {statutLabel[s]}
          </button>
        ))}
      </div>

      {loading ? (
        <Card><p style={{ textAlign: 'center', padding: '20px', color: 'var(--text3)' }}>Chargement...</p></Card>
      ) : donneurs.length === 0 ? (
        <Card><p style={{ textAlign: 'center', padding: '20px', color: 'var(--text3)' }}>Aucun donneur</p></Card>
      ) : (
        <div style={{ display: 'grid', gap: '12px' }}>
          {donneurs.map(d => (
            <Card key={d.id} style={{ padding: '16px', borderLeft: `4px solid ${statutColor[d.statut_validation] || 'var(--orange)'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <strong>{d.prenom} {d.nom}</strong>
                  <span style={{ marginLeft: '8px', background: 'var(--red)', color: 'white', padding: '2px 8px', borderRadius: '8px', fontSize: '12px' }}>
                    {d.groupe_sanguin}
                  </span>
                  <p style={{ margin: '4px 0 0', color: 'var(--text2)', fontSize: '13px' }}>
                    {d.telephone} · {d.commune}{d.quartier ? ` · ${d.quartier}` : ''}
                  </p>
                  <p style={{ margin: '2px 0 0', color: 'var(--text3)', fontSize: '12px' }}>
                    Inscrit le {new Date(d.created_at).toLocaleDateString('fr-FR')}
                    {d.disponibilite ? ' · 🟢 Disponible' : ' · ⚫ Indisponible'}
                  </p>
                </div>
                <span style={{
                  background: statutColor[d.statut_validation] || 'var(--orange)',
                  color: 'white', padding: '4px 12px', borderRadius: '10px', fontSize: '12px', whiteSpace: 'nowrap'
                }}>
                  {statutLabel[d.statut_validation] || d.statut_validation}
                </span>
              </div>

              {d.statut_validation === 'en_attente' && (
                <div style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <Button variant="primary" size="sm" onClick={() => handleDecision(d.id, 'valide')}>✅ Valider</Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDecision(d.id, 'rejete')}>❌ Rejeter</Button>
                </div>
              )}
              {d.statut_validation === 'validé' && (
                <div style={{ marginTop: '12px' }}>
                  <Button variant="ghost" size="sm" onClick={() => handleDecision(d.id, 'suspendu')}>⏸️ Suspendre</Button>
                </div>
              )}
              {d.statut_validation === 'suspendu' && (
                <div style={{ marginTop: '12px' }}>
                  <Button variant="primary" size="sm" onClick={() => handleDecision(d.id, 'valide')}>🔄 Réactiver</Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Structures ──────────────────────────────────────────────────────────────
function AdminStructures() {
  const [structures, setStructures] = useState([])
  const [loading, setLoading] = useState(true)
  const [alert, setAlert] = useState(null)
  const [filter, setFilter] = useState('en_attente')
  const [motifRefus, setMotifRefus] = useState({})

  useEffect(() => { loadStructures() }, [filter])

  const loadStructures = () => {
    setLoading(true)
    AdminService.getStructures(filter)
      .then(({ data }) => setStructures(data.structures || []))
      .catch(() => setAlert({ type: 'error', message: 'Erreur lors du chargement' }))
      .finally(() => setLoading(false))
  }

  const handleDecision = async (id, decision) => {
    try {
      await AdminService.validerStructure(id, decision, motifRefus[id] || '')
      setAlert({ type: 'success', message: decision === 'valide' ? '✅ Structure validée' : '❌ Structure refusée' })
      loadStructures()
    } catch {
      setAlert({ type: 'error', message: 'Erreur lors de la décision' })
    }
  }

  const statutColor = { en_attente: 'var(--orange)', valide: 'var(--green, #1E8449)', refuse: 'var(--red)' }
  const statutLabel = { en_attente: '⏳ En attente', valide: '✅ Validée', refuse: '❌ Refusée' }

  return (
    <div>
      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} autoClose />}
      <h1 style={{ marginBottom: '16px' }}>Validation des structures 🏥</h1>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {['en_attente', 'valide', 'refuse'].map(s => (
          <button key={s} onClick={() => setFilter(s)} style={{
            padding: '6px 16px', borderRadius: '20px', border: '1px solid var(--border)', cursor: 'pointer',
            background: filter === s ? 'var(--red)' : 'white',
            color: filter === s ? 'white' : 'var(--text1)', fontSize: '13px'
          }}>
            {statutLabel[s]}
          </button>
        ))}
      </div>

      {loading ? (
        <Card><p style={{ textAlign: 'center', padding: '20px', color: 'var(--text3)' }}>Chargement...</p></Card>
      ) : structures.length === 0 ? (
        <Card><p style={{ textAlign: 'center', padding: '20px', color: 'var(--text3)' }}>Aucune structure</p></Card>
      ) : (
        <div style={{ display: 'grid', gap: '12px' }}>
          {structures.map(s => (
            <Card key={s.id} style={{ padding: '16px', borderLeft: `4px solid ${statutColor[s.statut_validation]}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <strong style={{ fontSize: '16px' }}>{s.nom}</strong>
                  <p style={{ margin: '2px 0', color: 'var(--text2)', fontSize: '13px' }}>
                    {s.type || s.type_structure} · {s.commune} · {s.email}
                  </p>
                  <p style={{ margin: '2px 0', color: 'var(--text2)', fontSize: '13px' }}>
                    Responsable : {s.responsable} · {s.telephone}
                  </p>
                  {s.motif_refus && (
                    <p style={{ margin: '4px 0', color: 'var(--red)', fontSize: '12px' }}>
                      Motif : {s.motif_refus}
                    </p>
                  )}
                </div>
                <span style={{
                  background: statutColor[s.statut_validation], color: 'white',
                  padding: '4px 12px', borderRadius: '10px', fontSize: '12px', whiteSpace: 'nowrap'
                }}>
                  {statutLabel[s.statut_validation]}
                </span>
              </div>

              {s.statut_validation === 'en_attente' && (
                <div style={{ marginTop: '12px', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <input
                    placeholder="Motif de refus (optionnel)"
                    value={motifRefus[s.id] || ''}
                    onChange={e => setMotifRefus(prev => ({ ...prev, [s.id]: e.target.value }))}
                    style={{
                      flex: 1, minWidth: '200px', padding: '6px 10px',
                      border: '1px solid var(--border)', borderRadius: '6px', fontSize: '13px'
                    }}
                  />
                  <Button variant="primary" size="sm" onClick={() => handleDecision(s.id, 'valide')}>
                    ✅ Valider
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDecision(s.id, 'refuse')}>
                    ❌ Refuser
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Demandes structures → CNTS ──────────────────────────────────────────────
function AdminDemandes() {
  const [demandes, setDemandes] = useState([])
  const [stock, setStock] = useState([])
  const [loading, setLoading] = useState(true)
  const [alert, setAlert] = useState(null)
  const [actionId, setActionId] = useState(null)

  useEffect(() => {
    Promise.all([
      apiClient.get('/admin/demandes'),
      apiClient.get('/stock')
    ]).then(([{ data: d }, { data: s }]) => {
      setDemandes(d.demandes || [])
      setStock(s.stock || [])
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  const getStockDispo = (groupe) => {
    const s = stock.find(s => s.groupe_sanguin === groupe)
    return s?.quantite ?? 0
  }

  const utiliserStock = async (demande) => {
    setActionId(demande.id)
    try {
      await apiClient.put('/stock/update', {
        groupe_sanguin: demande.groupe_sanguin,
        operation: 'sortie',
        quantite: demande.quantite,
        motif: `Demande structure ${demande.structures?.nom || demande.structure_id}`
      })
      await apiClient.put(`/admin/demandes/${demande.id}/statut`, { statut: 'clôturée' })
      setAlert({ type: 'success', message: `✅ Stock utilisé pour ${demande.groupe_sanguin} — demande clôturée` })
      setDemandes(prev => prev.map(d => d.id === demande.id ? { ...d, statut: 'cloturee' } : d))
      setStock(prev => prev.map(s => s.groupe_sanguin === demande.groupe_sanguin
        ? { ...s, quantite: s.quantite - demande.quantite } : s))
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Erreur' })
    } finally { setActionId(null) }
  }

  const contacterDonneurs = async (demande) => {
    setActionId(demande.id)
    try {
      // 1. Envoyer un message à tous les donneurs compatibles
      const contenu = `🩸 Besoin urgent de sang ${demande.groupe_sanguin} — ${demande.quantite} poche(s) à ${demande.commune}. Urgence : ${demande.urgence}. Contactez le CNTS si vous êtes disponible.`
      const { data: broadcastData } = await apiClient.post('/messages/broadcast', {
        groupe_sanguin: demande.groupe_sanguin,
        contenu
      })
      // 2. Clôturer la demande
      await apiClient.put(`/admin/demandes/${demande.id}/statut`, { statut: 'clôturée' })
      setDemandes(prev => prev.map(d => d.id === demande.id ? { ...d, statut: 'clôturée' } : d))
      const nb = broadcastData?.envoyes ?? 0
      setAlert({ type: 'success', message: `✅ Message envoyé à ${nb} donneur(s) ${demande.groupe_sanguin} — demande clôturée` })
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Erreur lors du contact' })
    } finally { setActionId(null) }
  }

  const urgenceColor = { haute: 'var(--red)', moyenne: 'var(--orange)', basse: 'var(--green)' }
  const statutColor = { ouverte: 'var(--orange)', 'clôturée': '#999', cloturee: '#999' }

  return (
    <div>
      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} autoClose />}
      <h1 style={{ marginBottom: '8px' }}>Demandes des structures 📋</h1>
      <p style={{ color: 'var(--text2)', fontSize: '14px', marginBottom: '20px' }}>
        Les structures soumettent leurs besoins au CNTS. Vous décidez de la réponse.
      </p>

      {loading ? (
        <Card><p style={{ textAlign: 'center', padding: '20px', color: 'var(--text3)' }}>Chargement...</p></Card>
      ) : demandes.length === 0 ? (
        <Card><p style={{ textAlign: 'center', padding: '20px', color: 'var(--text3)' }}>Aucune demande</p></Card>
      ) : (
        <div style={{ display: 'grid', gap: '12px' }}>
          {demandes.map(d => {
            const stockDispo = getStockDispo(d.groupe_sanguin)
            const peutUtiliserStock = stockDispo >= (d.quantite || 0)
            const estCloturee = d.statut === 'clôturée' || d.statut === 'cloturee'
            return (
              <Card key={d.id} style={{ padding: '16px', borderLeft: `4px solid ${urgenceColor[d.urgence] || 'var(--orange)'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <strong style={{ fontSize: '15px' }}>{d.groupe_sanguin} — {d.quantite} poche(s)</strong>
                    <p style={{ margin: '4px 0 0', color: 'var(--text2)', fontSize: '13px' }}>
                      {d.structures?.nom || 'Structure'} · {d.commune} · Urgence : {d.urgence}
                    </p>
                    <p style={{ margin: '2px 0 0', color: 'var(--text3)', fontSize: '12px' }}>
                      Stock disponible : <strong style={{ color: peutUtiliserStock ? 'var(--green)' : 'var(--red)' }}>
                        {stockDispo} poche(s)
                      </strong>
                    </p>
                    {d.notes && <p style={{ margin: '4px 0 0', color: 'var(--text3)', fontSize: '12px' }}>{d.notes}</p>}
                  </div>
                  <span style={{
                    background: statutColor[d.statut] || 'var(--orange)',
                    color: 'white', padding: '4px 12px', borderRadius: '10px', fontSize: '12px'
                  }}>
                    {d.statut || 'ouverte'}
                  </span>
                </div>

                {!estCloturee && (
                  <div style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <Button
                      variant="primary" size="sm"
                      disabled={!peutUtiliserStock || actionId === d.id}
                      onClick={() => utiliserStock(d)}
                    >
                      🧪 Utiliser le stock
                    </Button>
                    <Button
                      variant="ghost" size="sm"
                      disabled={actionId === d.id}
                      onClick={() => contacterDonneurs(d)}
                    >
                      🩸 Contacter donneurs
                    </Button>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Stock sanguin CNTS ───────────────────────────────────────────────────────
function AdminStock() {
  const [stock, setStock] = useState([])
  const [loading, setLoading] = useState(true)
  const [alert, setAlert] = useState(null)
  const [form, setForm] = useState({ groupe_sanguin: 'O+', operation: 'ajout', quantite: '', motif: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadStock() }, [])

  const loadStock = () => {
    apiClient.get('/stock')
      .then(({ data }) => setStock(data.stock || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await apiClient.put('/stock/update', form)
      setAlert({ type: 'success', message: `✅ Stock mis à jour` })
      setForm(f => ({ ...f, quantite: '', motif: '' }))
      loadStock()
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Erreur' })
    } finally { setSaving(false) }
  }

  const groupes = ['A+','A-','B+','B-','AB+','AB-','O+','O-']
  const inputStyle = { width: '100%', padding: '8px 12px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px' }

  return (
    <div>
      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} autoClose />}
      <h1 style={{ marginBottom: '24px' }}>Stock sanguin 🧪</h1>

      <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>

        {/* Tableau de stock */}
        <Card style={{ padding: '20px' }}>
          <h3 style={{ marginBottom: '16px' }}>État du stock</h3>
          {loading ? <p style={{ color: 'var(--text3)' }}>Chargement...</p> : (
            <div style={{ display: 'grid', gap: '8px' }}>
              {stock.map(s => {
                const alerte = s.quantite <= s.seuil_alerte
                return (
                  <div key={s.groupe_sanguin} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '10px 12px', borderRadius: '8px',
                    background: alerte ? '#FFF5F5' : 'var(--bg2)',
                    border: `1px solid ${alerte ? 'var(--red)' : 'var(--border)'}`
                  }}>
                    <span style={{ fontWeight: 700, fontSize: '15px' }}>{s.groupe_sanguin}</span>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontWeight: 700, color: alerte ? 'var(--red)' : 'var(--green)', fontSize: '18px' }}>
                        {s.quantite}
                      </span>
                      <span style={{ color: 'var(--text3)', fontSize: '12px', marginLeft: '4px' }}>poches</span>
                      {alerte && <div style={{ color: 'var(--red)', fontSize: '11px' }}>⚠️ Stock bas</div>}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>

        {/* Formulaire ajout/sortie */}
        <Card style={{ padding: '20px' }}>
          <h3 style={{ marginBottom: '16px' }}>Mouvement de stock</h3>
          <form onSubmit={handleUpdate}>
            <label style={{ fontSize: '13px', color: 'var(--text2)' }}>Groupe sanguin</label>
            <select value={form.groupe_sanguin} onChange={e => setForm(f => ({ ...f, groupe_sanguin: e.target.value }))} style={{ ...inputStyle, marginTop: '4px', marginBottom: '12px' }}>
              {groupes.map(g => <option key={g} value={g}>{g}</option>)}
            </select>

            <label style={{ fontSize: '13px', color: 'var(--text2)' }}>Opération</label>
            <select value={form.operation} onChange={e => setForm(f => ({ ...f, operation: e.target.value }))} style={{ ...inputStyle, marginTop: '4px', marginBottom: '12px' }}>
              <option value="ajout">➕ Ajout (don reçu)</option>
              <option value="sortie">➖ Sortie (livraison)</option>
            </select>

            <label style={{ fontSize: '13px', color: 'var(--text2)' }}>Quantité (poches)</label>
            <input type="number" min="1" required value={form.quantite}
              onChange={e => setForm(f => ({ ...f, quantite: e.target.value }))}
              style={{ ...inputStyle, marginTop: '4px', marginBottom: '12px' }} />

            <label style={{ fontSize: '13px', color: 'var(--text2)' }}>Motif (optionnel)</label>
            <input type="text" value={form.motif}
              onChange={e => setForm(f => ({ ...f, motif: e.target.value }))}
              placeholder="Ex: Don collecte Ratoma"
              style={{ ...inputStyle, marginTop: '4px', marginBottom: '16px' }} />

            <Button type="submit" variant="primary" style={{ width: '100%' }} disabled={saving}>
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  )
}

// ─── Journal d'audit CNTS ────────────────────────────────────────────────────
function AdminAudit() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')

  useEffect(() => {
    apiClient.get('/admin/audit', { params: filter ? { cible_type: filter } : {} })
      .then(({ data }) => setLogs(data.logs || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [filter])

  const actionLabel = {
    structure_valide: '✅ Structure validée',
    structure_refuse: '❌ Structure refusée',
    donneur_valide: '✅ Donneur validé',
    donneur_rejete: '❌ Donneur rejeté',
    donneur_suspendu: '⏸️ Donneur suspendu',
  }
  const actionColor = {
    structure_valide: 'var(--green)', structure_refuse: 'var(--red)',
    donneur_valide: 'var(--green)', donneur_rejete: 'var(--red)', donneur_suspendu: '#999'
  }

  return (
    <div>
      <h1 style={{ marginBottom: '16px' }}>Journal d'audit 📜</h1>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {[['', 'Tout'], ['donneur', '🩸 Donneurs'], ['structure', '🏥 Structures']].map(([val, label]) => (
          <button key={val} onClick={() => setFilter(val)} style={{
            padding: '6px 14px', borderRadius: '20px', border: '1px solid var(--border)', cursor: 'pointer',
            background: filter === val ? 'var(--red)' : 'white',
            color: filter === val ? 'white' : 'var(--text1)', fontSize: '13px'
          }}>{label}</button>
        ))}
      </div>

      {loading ? (
        <Card><p style={{ textAlign: 'center', padding: '20px', color: 'var(--text3)' }}>Chargement...</p></Card>
      ) : logs.length === 0 ? (
        <Card><p style={{ textAlign: 'center', padding: '20px', color: 'var(--text3)' }}>Aucune action enregistrée</p></Card>
      ) : (
        <div style={{ display: 'grid', gap: '8px' }}>
          {logs.map(log => (
            <Card key={log.id} style={{ padding: '12px 16px', borderLeft: `3px solid ${actionColor[log.action] || 'var(--border)'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <span style={{ fontWeight: 600, fontSize: '14px' }}>
                    {actionLabel[log.action] || log.action}
                  </span>
                  <p style={{ margin: '2px 0 0', color: 'var(--text2)', fontSize: '12px' }}>
                    Par {log.admin_email} · cible : {log.cible_type}
                    {log.details?.motif ? ` · Motif : ${log.details.motif}` : ''}
                  </p>
                </div>
                <span style={{ color: 'var(--text3)', fontSize: '12px', whiteSpace: 'nowrap' }}>
                  {new Date(log.created_at).toLocaleString('fr-FR')}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Paramètres Admin ────────────────────────────────────────────────────────
function AdminSettings() {
  const [profile, setProfile] = useState(null)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [pwForm, setPwForm] = useState({ ancien_mdp: '', nouveau_mdp: '', confirm_mdp: '' })
  const [alert, setAlert] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    apiClient.get('/admin/me')
      .then(({ data }) => setProfile(data.admin))
      .catch(console.error)
      .finally(() => setLoadingProfile(false))
  }, [])

  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (pwForm.nouveau_mdp !== pwForm.confirm_mdp) {
      return setAlert({ type: 'error', message: 'Les nouveaux mots de passe ne correspondent pas' })
    }
    setSaving(true)
    try {
      await apiClient.put('/admin/password', {
        ancien_mdp: pwForm.ancien_mdp,
        nouveau_mdp: pwForm.nouveau_mdp
      })
      setAlert({ type: 'success', message: '✅ Mot de passe mis à jour avec succès' })
      setPwForm({ ancien_mdp: '', nouveau_mdp: '', confirm_mdp: '' })
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Erreur lors du changement de mot de passe' })
    } finally {
      setSaving(false)
    }
  }

  const inputStyle = {
    width: '100%', padding: '8px 12px', border: '1px solid var(--border)',
    borderRadius: '8px', fontSize: '14px', marginTop: '4px'
  }
  const labelStyle = { fontSize: '13px', color: 'var(--text2)', display: 'block', marginTop: '12px' }

  return (
    <div>
      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} autoClose />}
      <h1 style={{ marginBottom: '24px' }}>Paramètres ⚙️</h1>

      <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>

        {/* Profil admin */}
        <Card style={{ padding: '20px' }}>
          <h3 style={{ marginBottom: '16px' }}>👤 Mon profil</h3>
          {loadingProfile ? (
            <p style={{ color: 'var(--text3)', fontSize: '14px' }}>Chargement...</p>
          ) : profile ? (
            <div style={{ display: 'grid', gap: '8px' }}>
              {[
                { label: 'Nom', value: profile.nom || '—' },
                { label: 'Email', value: profile.email },
                { label: 'Rôle', value: '🔑 Administrateur' },
                { label: 'Membre depuis', value: profile.created_at ? new Date(profile.created_at).toLocaleDateString('fr-FR') : '—' }
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--text2)', fontSize: '13px' }}>{label}</span>
                  <span style={{ fontWeight: 500, fontSize: '13px' }}>{value}</span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text3)', fontSize: '14px' }}>Profil indisponible</p>
          )}
        </Card>

        {/* Changer mot de passe */}
        <Card style={{ padding: '20px' }}>
          <h3 style={{ marginBottom: '16px' }}>🔒 Changer le mot de passe</h3>
          <form onSubmit={handleChangePassword}>
            {[
              { key: 'ancien_mdp', label: 'Mot de passe actuel' },
              { key: 'nouveau_mdp', label: 'Nouveau mot de passe' },
              { key: 'confirm_mdp', label: 'Confirmer le nouveau mot de passe' }
            ].map(({ key, label }) => (
              <div key={key}>
                <label style={labelStyle}>{label}</label>
                <input
                  type="password"
                  required
                  minLength={key !== 'ancien_mdp' ? 6 : undefined}
                  value={pwForm[key]}
                  onChange={e => setPwForm(p => ({ ...p, [key]: e.target.value }))}
                  style={inputStyle}
                />
              </div>
            ))}
            <Button
              type="submit"
              variant="primary"
              style={{ marginTop: '16px', width: '100%' }}
              disabled={saving}
            >
              {saving ? 'Enregistrement...' : 'Mettre à jour'}
            </Button>
          </form>
        </Card>


      </div>
    </div>
  )
}

// ─── Convocations CNTS ───────────────────────────────────────────────────────
function AdminConvocations() {
  const [donneurs, setDonneurs] = useState([])
  const [convocations, setConvocations] = useState([])
  const [loading, setLoading] = useState(true)
  const [alert, setAlert] = useState(null)
  const [sending, setSending] = useState(false)
  const [validating, setValidating] = useState(null)
  const [form, setForm] = useState({ donneur_id: '', type: 'renouvellement', message: '', date_rdv: '' })
  const [filterGroupe, setFilterGroupe] = useState('')

  useEffect(() => {
    Promise.all([
      apiClient.get('/admin/donneurs', { params: { statut_validation: 'validé' } }),
      apiClient.get('/admin/convocations').catch(() => ({ data: { convocations: [] } }))
    ]).then(([{ data: d }, { data: c }]) => {
      setDonneurs(d.donneurs || [])
      setConvocations(c.convocations || [])
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  const handleEnvoyer = async (e) => {
    e.preventDefault()
    if (!form.donneur_id || !form.message) return
    setSending(true)
    try {
      await apiClient.post('/stock/convoquer', form)
      setAlert({ type: 'success', message: '✅ Convocation envoyée avec succès' })
      setForm({ donneur_id: '', type: 'renouvellement', message: '', date_rdv: '' })
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Erreur lors de l\'envoi' })
    } finally {
      setSending(false)
    }
  }

  const handleValiderDon = async (convId, donneurNom) => {
    setValidating(convId)
    try {
      await apiClient.post(`/admin/convocations/${convId}/valider-don`)
      setAlert({ type: 'success', message: `✅ Don de ${donneurNom} validé — nb_dons mis à jour` })
      setConvocations(prev => prev.map(c => c.id === convId ? { ...c, statut: 'don_effectue' } : c))
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Erreur lors de la validation' })
    } finally { setValidating(null) }
  }

  const handleBroadcast = async () => {
    if (!form.message) return setAlert({ type: 'error', message: 'Écrivez un message d\'abord' })
    setSending(true)
    try {
      await apiClient.post('/messages/broadcast', {
        groupe_sanguin: filterGroupe || undefined,
        contenu: form.message
      })
      const nb = filterGroupe
        ? donneurs.filter(d => d.groupe_sanguin === filterGroupe).length
        : donneurs.length
      setAlert({ type: 'success', message: `✅ Message envoyé à ${nb} donneur(s)` })
      setForm(f => ({ ...f, message: '' }))
    } catch (err) {
      setAlert({ type: 'error', message: 'Erreur lors du broadcast' })
    } finally {
      setSending(false)
    }
  }

  const inputStyle = { width: '100%', padding: '8px 12px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px', marginTop: '4px', marginBottom: '12px' }
  const bloodTypes = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-']
  const typeLabel = { renouvellement: '🔄 Renouvellement de stock', urgence: '🚨 Urgence', autre: '📋 Autre' }

  const donneursFiltered = filterGroupe ? donneurs.filter(d => d.groupe_sanguin === filterGroupe) : donneurs

  return (
    <div>
      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} autoClose />}
      <h1 style={{ marginBottom: '8px' }}>Convocations donneurs 📨</h1>
      <p style={{ color: 'var(--text2)', fontSize: '14px', marginBottom: '20px' }}>
        Convoquez des donneurs individuellement ou par groupe sanguin.
      </p>

      <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>

        {/* Convocation individuelle */}
        <Card style={{ padding: '20px' }}>
          <h3 style={{ marginBottom: '16px' }}>📨 Convoquer un donneur</h3>
          <form onSubmit={handleEnvoyer}>
            <label style={{ fontSize: '13px', color: 'var(--text2)' }}>Donneur</label>
            <select value={form.donneur_id} onChange={e => setForm(f => ({ ...f, donneur_id: e.target.value }))} style={inputStyle} required>
              <option value="">Sélectionner un donneur</option>
              {donneurs.map(d => (
                <option key={d.id} value={d.id}>
                  {d.prenom} {d.nom} — {d.groupe_sanguin} ({d.commune})
                </option>
              ))}
            </select>

            <label style={{ fontSize: '13px', color: 'var(--text2)' }}>Type de convocation</label>
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} style={inputStyle}>
              {Object.entries(typeLabel).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>

            <label style={{ fontSize: '13px', color: 'var(--text2)' }}>Message</label>
            <textarea
              value={form.message}
              onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
              placeholder="Ex: Votre don est nécessaire pour renouveler notre stock..."
              rows={3}
              required
              style={{ ...inputStyle, resize: 'vertical' }}
            />

            <label style={{ fontSize: '13px', color: 'var(--text2)' }}>Date de rendez-vous (optionnel)</label>
            <input type="datetime-local" value={form.date_rdv} onChange={e => setForm(f => ({ ...f, date_rdv: e.target.value }))} style={inputStyle} />

            <Button type="submit" variant="primary" style={{ width: '100%' }} disabled={sending}>
              {sending ? 'Envoi...' : '📨 Envoyer la convocation'}
            </Button>
          </form>
        </Card>

        {/* Broadcast par groupe sanguin */}
        <Card style={{ padding: '20px' }}>
          <h3 style={{ marginBottom: '16px' }}>📢 Message groupé</h3>
          <p style={{ color: 'var(--text3)', fontSize: '13px', marginBottom: '12px' }}>
            Envoyez un message à tous les donneurs validés, ou filtrez par groupe sanguin.
          </p>

          <label style={{ fontSize: '13px', color: 'var(--text2)' }}>Filtrer par groupe sanguin</label>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', margin: '8px 0 12px' }}>
            <button onClick={() => setFilterGroupe('')} style={{
              padding: '4px 12px', borderRadius: '16px', border: '1px solid var(--border)', cursor: 'pointer',
              background: filterGroupe === '' ? 'var(--red)' : 'white',
              color: filterGroupe === '' ? 'white' : 'var(--text1)', fontSize: '12px'
            }}>Tous ({donneurs.length})</button>
            {bloodTypes.map(t => {
              const count = donneurs.filter(d => d.groupe_sanguin === t).length
              return count > 0 ? (
                <button key={t} onClick={() => setFilterGroupe(t)} style={{
                  padding: '4px 12px', borderRadius: '16px', border: '1px solid var(--border)', cursor: 'pointer',
                  background: filterGroupe === t ? 'var(--red)' : 'white',
                  color: filterGroupe === t ? 'white' : 'var(--text1)', fontSize: '12px'
                }}>{t} ({count})</button>
              ) : null
            })}
          </div>

          <label style={{ fontSize: '13px', color: 'var(--text2)' }}>Message</label>
          <textarea
            value={form.message}
            onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
            placeholder="Message à envoyer à tous les donneurs sélectionnés..."
            rows={4}
            style={{ ...inputStyle, resize: 'vertical' }}
          />

          <Button variant="primary" style={{ width: '100%' }} onClick={handleBroadcast} disabled={sending || !form.message}>
            {sending ? 'Envoi...' : `📢 Envoyer à ${donneursFiltered.length} donneur(s)`}
          </Button>
        </Card>
      </div>

      {/* Liste des donneurs validés */}
      <div style={{ marginTop: '24px' }}>
        <h3 style={{ marginBottom: '12px' }}>Donneurs validés ({donneursFiltered.length})</h3>
        {loading ? (
          <Card><p style={{ textAlign: 'center', padding: '20px', color: 'var(--text3)' }}>Chargement...</p></Card>
        ) : donneursFiltered.length === 0 ? (
          <Card><p style={{ textAlign: 'center', padding: '20px', color: 'var(--text3)' }}>Aucun donneur validé</p></Card>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '10px' }}>
            {donneursFiltered.map(d => (
              <Card key={d.id} style={{ padding: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '50%',
                    background: 'var(--red)', color: 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700
                  }}>{d.prenom?.[0] || '?'}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <strong style={{ fontSize: '13px' }}>{d.prenom} {d.nom}</strong>
                    <p style={{ margin: 0, fontSize: '11px', color: 'var(--text3)' }}>{d.commune}</p>
                  </div>
                  <span style={{
                    background: 'var(--red)', color: 'white',
                    padding: '2px 8px', borderRadius: '8px', fontSize: '12px', fontWeight: 700
                  }}>{d.groupe_sanguin}</span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Réponses aux convocations */}
      <div style={{ marginTop: '32px' }}>
        <h3 style={{ marginBottom: '12px' }}>Réponses aux convocations 📬</h3>
        {convocations.length === 0 ? (
          <Card><p style={{ textAlign: 'center', padding: '20px', color: 'var(--text3)' }}>Aucune convocation envoyée</p></Card>
        ) : (
          <div style={{ display: 'grid', gap: '8px' }}>
            {convocations.map(conv => {
              const statutColor = { en_attente: 'var(--orange)', confirmée: 'var(--green)', refusée: 'var(--red)', don_effectue: 'var(--blue)' }
              const statutIcon = { en_attente: '⏳', confirmée: '✅', refusée: '❌', don_effectue: '🩸' }
              const typeLabel = { renouvellement: '🔄 Renouvellement', urgence: '🚨 Urgence', autre: '📋 Autre' }
              const donneur = conv.donneurs
              const donneurNom = donneur ? `${donneur.prenom} ${donneur.nom}` : 'Donneur inconnu'
              return (
                <Card key={conv.id} style={{ padding: '14px', borderLeft: `4px solid ${statutColor[conv.statut] || 'var(--orange)'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <strong style={{ fontSize: '14px' }}>{donneurNom}</strong>
                        {donneur && (
                          <span style={{ background: 'var(--red)', color: 'white', padding: '1px 7px', borderRadius: '8px', fontSize: '11px', fontWeight: 700 }}>
                            {donneur.groupe_sanguin}
                          </span>
                        )}
                      </div>
                      <p style={{ margin: '0 0 2px', color: 'var(--text2)', fontSize: '12px' }}>
                        {typeLabel[conv.type] || conv.type} — {conv.message}
                      </p>
                      {conv.date_rdv && (
                        <p style={{ margin: 0, color: 'var(--text3)', fontSize: '11px' }}>
                          📅 {new Date(conv.date_rdv).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                      )}
                      <p style={{ margin: '2px 0 0', color: 'var(--text3)', fontSize: '11px' }}>
                        Envoyée le {new Date(conv.created_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <span style={{
                      background: statutColor[conv.statut] || 'var(--orange)',
                      color: 'white', padding: '4px 12px', borderRadius: '10px', fontSize: '12px', whiteSpace: 'nowrap'
                    }}>
                      {statutIcon[conv.statut]} {conv.statut}
                    </span>
                  </div>
                  {conv.statut === 'confirmée' && (
                    <div style={{ marginTop: '10px' }}>
                      <Button
                        variant="primary" size="sm"
                        disabled={validating === conv.id}
                        onClick={() => handleValiderDon(conv.id, donneurNom)}
                      >
                        {validating === conv.id ? 'Validation...' : '🩸 Valider le don'}
                      </Button>
                    </div>
                  )}
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Messagerie CNTS ─────────────────────────────────────────────────────────
function AdminMessagerie() {
  const location = useLocation()
  const matchGroupe = location.state?.groupe_sanguin || null

  const [conversations, setConversations] = useState([])
  const [selectedConv, setSelectedConv] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [tab, setTab] = useState(matchGroupe ? 'donneur' : 'all')
  const messagesEndRef = useRef(null)

  useEffect(() => { loadConversations() }, [])
  useEffect(() => {
    if (selectedConv) loadMessages(selectedConv.interlocuteur_id)
  }, [selectedConv])
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Auto-refresh toutes les 10 secondes
  useEffect(() => {
    if (!selectedConv) return
    const interval = setInterval(() => loadMessages(selectedConv.interlocuteur_id), 10000)
    return () => clearInterval(interval)
  }, [selectedConv])

  const loadConversations = async () => {
    try {
      const { data } = await apiClient.get('/messages/conversations')
      const convs = data.conversations || []
      setConversations(convs)

      // Si on vient d'une demande avec un groupe sanguin, pré-sélectionner le premier donneur compatible
      if (matchGroupe) {
        const compatible = convs.find(c =>
          c.interlocuteur_type === 'donneur' && c.groupe_sanguin === matchGroupe
        )
        if (compatible) setSelectedConv(compatible)
      }
    } catch (err) {
      console.error('Erreur:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadMessages = async (interlocId) => {
    try {
      const { data } = await apiClient.get(`/messages/${interlocId}`)
      setMessages(data.messages || [])
      window.dispatchEvent(new Event('messages:read'))
    } catch (err) {
      console.error('Erreur:', err)
    }
  }

  const handleSend = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedConv) return
    setSending(true)
    try {
      await apiClient.post('/messages', {
        destinataire_id: selectedConv.interlocuteur_id,
        destinataire_type: selectedConv.interlocuteur_type,
        contenu: newMessage
      })
      setNewMessage('')
      loadMessages(selectedConv.interlocuteur_id)
    } catch (err) {
      console.error('Erreur:', err)
    } finally {
      setSending(false)
    }
  }

  // Extraire le nom d'affichage depuis les données de la conversation
  const getDisplayName = (conv) => {
    if (conv.interlocuteur_type === 'donneur') {
      const prenom = conv.interlocuteur_prenom || conv.prenom || ''
      const nom = conv.interlocuteur_nom || conv.nom || ''
      if (prenom || nom) return `${prenom} ${nom}`.trim()
    }
    if (conv.interlocuteur_type === 'structure') {
      return conv.interlocuteur_nom || conv.nom || conv.structure_nom || 'Structure'
    }
    return conv.interlocuteur_nom || conv.interlocuteur_prenom || 'Inconnu'
  }

  // Initiales pour l'avatar
  const getInitials = (conv) => {
    const name = getDisplayName(conv)
    const parts = name.split(' ').filter(Boolean)
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
    return parts[0]?.[0]?.toUpperCase() || '?'
  }

  // Nom de l'expéditeur dans les bulles
  const getSenderName = (msg) => {
    if (msg.expediteur_type === 'admin') return 'CNTS'
    if (msg.expediteur_type === 'donneur') {
      const p = msg.expediteur_prenom || ''
      const n = msg.expediteur_nom || ''
      return `${p} ${n}`.trim() || 'Donneur'
    }
    if (msg.expediteur_type === 'structure') {
      return msg.expediteur_nom || 'Structure'
    }
    return 'Inconnu'
  }

  const filtered = tab === 'all' ? conversations : conversations.filter(c => c.interlocuteur_type === tab)
  const typeIcon = { donneur: '🩸', structure: '🏥' }
  const typeLabel = { donneur: 'Donneur', structure: 'Structure' }

  return (
    <div>
      <h1 style={{ marginBottom: '8px' }}>Messagerie CNTS 💬</h1>
      <p style={{ color: 'var(--text2)', fontSize: '14px', marginBottom: '20px' }}>
        Communiquez avec les donneurs et les structures de santé.
      </p>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {[['all', '📬 Tous'], ['donneur', '🩸 Donneurs'], ['structure', '🏥 Structures']].map(([val, label]) => (
          <button key={val} onClick={() => setTab(val)} style={{
            padding: '6px 14px', borderRadius: '20px', border: '1px solid var(--border)', cursor: 'pointer',
            background: tab === val ? 'var(--red)' : 'white',
            color: tab === val ? 'white' : 'var(--text1)', fontSize: '13px'
          }}>{label}</button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '16px', height: '600px' }}>
        {/* Liste conversations */}
        <div style={{ width: '300px', flexShrink: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {matchGroupe && (
            <div style={{ background: '#FEF9E7', border: '1px solid #F9CA24', borderRadius: '8px', padding: '8px 12px', fontSize: '12px', color: '#7D6608' }}>
              🩸 Donneurs compatibles <strong>{matchGroupe}</strong> mis en avant
            </div>
          )}
          {loading ? (
            <p style={{ color: 'var(--text3)', fontSize: '13px' }}>Chargement...</p>
          ) : filtered.length === 0 ? (
            <p style={{ color: 'var(--text3)', fontSize: '13px', textAlign: 'center', padding: '20px' }}>Aucune conversation</p>
          ) : (
            filtered.map(conv => {
              const displayName = getDisplayName(conv)
              const initials = getInitials(conv)
              const isSelected = selectedConv?.interlocuteur_id === conv.interlocuteur_id
              const isCompatible = matchGroupe && conv.interlocuteur_type === 'donneur' && conv.groupe_sanguin === matchGroupe
              return (
                <Card
                  key={conv.interlocuteur_id}
                  onClick={() => setSelectedConv(conv)}
                  style={{
                    padding: '12px', cursor: 'pointer',
                    background: isSelected ? 'var(--bg2)' : 'var(--bg1)',
                    border: isSelected ? '2px solid var(--red)' : isCompatible ? '2px solid var(--green)' : '1px solid var(--border)',
                    order: isCompatible ? -1 : 0
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                      {/* Avatar avec initiales */}
                      <div style={{
                        width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
                        background: conv.interlocuteur_type === 'donneur' ? 'var(--red)' : 'var(--blue)',
                        color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, fontSize: '14px'
                      }}>
                        {initials}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <strong style={{ fontSize: '13px', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {displayName}
                        </strong>
                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flexWrap: 'wrap' }}>
                          <span style={{
                            fontSize: '10px', color: 'white', padding: '1px 6px', borderRadius: '8px',
                            background: conv.interlocuteur_type === 'donneur' ? 'var(--red)' : 'var(--blue)'
                          }}>
                            {typeIcon[conv.interlocuteur_type]} {typeLabel[conv.interlocuteur_type] || conv.interlocuteur_type}
                          </span>
                          {isCompatible && (
                            <span style={{ fontSize: '10px', color: 'white', padding: '1px 6px', borderRadius: '8px', background: 'var(--green)' }}>
                              ✓ Compatible
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {conv.non_lus > 0 && (
                      <span style={{ background: 'var(--red)', color: 'white', padding: '2px 7px', borderRadius: '10px', fontSize: '11px', fontWeight: 700, flexShrink: 0 }}>
                        {conv.non_lus}
                      </span>
                    )}
                  </div>
                  {conv.dernier_message && (
                    <p style={{ margin: '8px 0 0', fontSize: '11px', color: 'var(--text3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {conv.dernier_message}
                    </p>
                  )}
                  {conv.derniere_date && (
                    <p style={{ margin: '2px 0 0', fontSize: '10px', color: 'var(--text3)' }}>
                      {new Date(conv.derniere_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                </Card>
              )
            })
          )}
        </div>

        {/* Zone de chat */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
          {selectedConv ? (
            <>
              {/* En-tête conversation */}
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', background: 'var(--bg2)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '44px', height: '44px', borderRadius: '50%',
                  background: selectedConv.interlocuteur_type === 'donneur' ? 'var(--red)' : 'var(--blue)',
                  color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: '16px', flexShrink: 0
                }}>
                  {getInitials(selectedConv)}
                </div>
                <div>
                  <strong style={{ fontSize: '15px' }}>{getDisplayName(selectedConv)}</strong>
                  <p style={{ margin: 0, fontSize: '12px', color: 'var(--text3)' }}>
                    {typeIcon[selectedConv.interlocuteur_type]} {typeLabel[selectedConv.interlocuteur_type] || selectedConv.interlocuteur_type}
                    {selectedConv.groupe_sanguin && ` · ${selectedConv.groupe_sanguin}`}
                    {selectedConv.commune && ` · ${selectedConv.commune}`}
                  </p>
                </div>
              </div>

              {/* Messages */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {messages.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text3)' }}>
                    <div style={{ fontSize: '36px', marginBottom: '8px' }}>💬</div>
                    <p>Aucun message. Commencez la conversation.</p>
                  </div>
                ) : (
                  messages.map(msg => {
                    const isMine = msg.expediteur_type === 'admin'
                    const senderName = getSenderName(msg)
                    return (
                      <div key={msg.id} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start' }}>
                        <div style={{ maxWidth: '70%' }}>
                          {/* Nom de l'expéditeur */}
                          <p style={{ margin: '0 0 3px', fontSize: '11px', color: 'var(--text3)', textAlign: isMine ? 'right' : 'left', fontWeight: 600 }}>
                            {senderName}
                          </p>
                          <div style={{
                            padding: '10px 14px',
                            borderRadius: isMine ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                            background: isMine ? 'var(--red)' : 'var(--bg2)',
                            color: isMine ? 'white' : 'var(--text1)',
                            border: isMine ? 'none' : '1px solid var(--border)'
                          }}>
                            <p style={{ margin: 0, fontSize: '14px' }}>{msg.contenu}</p>
                            <span style={{ fontSize: '10px', opacity: 0.7, display: 'block', marginTop: '4px', textAlign: 'right' }}>
                              {new Date(msg.created_at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSend} style={{ padding: '12px', borderTop: '1px solid var(--border)', display: 'flex', gap: '8px' }}>
                <input
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  placeholder={`Répondre à ${getDisplayName(selectedConv)}...`}
                  disabled={sending}
                  style={{ flex: 1, padding: '8px 12px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px' }}
                />
                <Button type="submit" variant="primary" disabled={sending || !newMessage.trim()}>
                  {sending ? '...' : 'Envoyer'}
                </Button>
              </form>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text3)' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>💬</div>
              <p>Sélectionnez une conversation</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
