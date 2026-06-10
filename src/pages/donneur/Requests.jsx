import { useState, useEffect } from 'react'
import apiClient from '../../services/apiClient'
import { RefreshCw, AlertTriangle, FileText, Clock, CheckCircle, XCircle, Droplets, Calendar, Inbox, Info } from 'lucide-react'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import Alert from '../../components/common/Alert'
import styles from './Requests.module.css'

export default function DonneurConvocations() {
  const [convocations, setConvocations] = useState([])
  const [loading, setLoading] = useState(true)
  const [alert, setAlert] = useState(null)
  const [respondingId, setRespondingId] = useState(null)

  useEffect(() => {
    loadConvocations()
  }, [])

  const loadConvocations = async () => {
    try {
      const { data } = await apiClient.get('/stock/convocations')
      setConvocations(data.convocations || [])
    } catch (err) {
      console.error('Erreur:', err)
      setAlert({ type: 'error', message: 'Erreur lors du chargement des convocations' })
    } finally {
      setLoading(false)
    }
  }

  const handleRepondre = async (id, statut) => {
    setRespondingId(id)
    // Mise à jour optimiste immédiate
    setConvocations(prev => prev.map(c => c.id === id ? { ...c, statut } : c))
    try {
      await apiClient.put(`/stock/convocations/${id}`, { statut })
      setAlert({
        type: 'success',
        message: statut === 'confirmée' ? 'Convocation confirmée' : 'Convocation refusée'
      })
    } catch (err) {
      // Annuler la mise à jour optimiste en cas d'erreur
      setConvocations(prev => prev.map(c => c.id === id ? { ...c, statut: 'en_attente' } : c))
      setAlert({ type: 'error', message: 'Erreur lors de votre réponse' })
    } finally {
      setRespondingId(null)
    }
  }

  const typeLabel = { renouvellement: 'Renouvellement de stock', urgence: 'Urgence', autre: 'Autre' }
  const typeIcon = { renouvellement: <RefreshCw size={14} />, urgence: <AlertTriangle size={14} />, autre: <FileText size={14} /> }
  const statutColor = { en_attente: 'var(--orange)', confirmée: 'var(--green)', refusée: 'var(--red)', don_effectue: 'var(--blue, #1A5276)' }
  const statutIcon = { en_attente: <Clock size={12} />, confirmée: <CheckCircle size={12} />, refusée: <XCircle size={12} />, don_effectue: <Droplets size={12} /> }
  const statutLabel = { en_attente: 'En attente', confirmée: 'Confirmée', refusée: 'Refusée', don_effectue: 'Don effectué' }

  return (
    <div>
      {alert && (
        <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} autoClose duration={3000} />
      )}

      <div className={styles['page-header']}>
        <h1>Mes convocations</h1>
        <p>Le CNTS vous contacte ici pour les dons de sang</p>
      </div>

      <div style={{
        background: '#EBF5FB', border: '1px solid #AED6F1',
        borderRadius: '8px', padding: '14px 16px', marginBottom: '20px', fontSize: '14px', color: '#1A5276',
        display: 'flex', alignItems: 'flex-start', gap: '10px'
      }}>
        <Info size={16} style={{ marginTop: '2px', flexShrink: 0 }} />
        <span><strong>Comment ça fonctionne :</strong> Le CNTS vous convoque tous les 3–4 mois pour renouveler le stock sanguin, ou en cas d'urgence. Vous n'avez pas accès aux demandes des structures — c'est le CNTS qui coordonne tout.</span>
      </div>

      {loading ? (
        <Card>
          <p style={{ color: 'var(--text3)', textAlign: 'center', padding: '20px' }}>Chargement...</p>
        </Card>
      ) : convocations.length === 0 ? (
        <Card>
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}><Inbox size={48} color="var(--text3)" /></div>
            <p style={{ color: 'var(--text2)', fontWeight: 600 }}>Aucune convocation pour le moment</p>
            <p style={{ color: 'var(--text3)', fontSize: '13px' }}>
              Le CNTS vous contactera quand votre don sera nécessaire.
            </p>
          </div>
        </Card>
      ) : (
        <div className={styles['requests-grid']}>
          {convocations.map((conv) => (
            <Card key={conv.id} style={{ padding: '16px', borderLeft: `4px solid ${statutColor[conv.statut] || 'var(--orange)'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <h4 style={{ margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {typeIcon[conv.type]}{typeLabel[conv.type] || conv.type}
                  </h4>
                  <p style={{ margin: '0 0 8px', color: 'var(--text2)', fontSize: '13px' }}>{conv.message}</p>
                  {conv.date_rdv && (
                    <p style={{ margin: '0', color: 'var(--text3)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={12} /> Rendez-vous : {new Date(conv.date_rdv).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  )}
                  <p style={{ margin: '4px 0 0', color: 'var(--text3)', fontSize: '11px' }}>
                    Reçu le {new Date(conv.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <span style={{
                  background: statutColor[conv.statut] || 'var(--orange)',
                  color: 'white', padding: '4px 12px', borderRadius: '10px', fontSize: '12px', whiteSpace: 'nowrap',
                  display: 'flex', alignItems: 'center', gap: '4px'
                }}>
                  {statutIcon[conv.statut]}{statutLabel[conv.statut] || conv.statut}
                </span>
              </div>

              {conv.statut === 'en_attente' && (
                <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                  <Button variant="primary" size="sm" onClick={() => handleRepondre(conv.id, 'confirmée')} disabled={respondingId === conv.id}>
                    {respondingId === conv.id ? 'Envoi...' : 'Confirmer'}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleRepondre(conv.id, 'refusée')} disabled={respondingId === conv.id}>
                    {respondingId === conv.id ? 'Envoi...' : 'Refuser'}
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
