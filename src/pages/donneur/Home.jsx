import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { DonneurService } from '../../services'
import apiClient from '../../services/apiClient'
import { Droplets, CheckCircle, ClipboardList, Heart, Inbox, RefreshCw, AlertTriangle, FileText } from 'lucide-react'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import styles from './Home.module.css'

export default function DonneurHome() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    bloodType: user?.groupe_sanguin || 'O+',
    donations: 0,
    convocations: 0,
    liters: 0
  })
  const [recentConvocations, setRecentConvocations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [profileRes, convoRes] = await Promise.all([
        DonneurService.getProfile(),
        apiClient.get('/stock/convocations')
      ])

      const profile = profileRes.data.donneur || profileRes.data.user || profileRes.data
      const convocations = convoRes.data.convocations || []
      const enAttente = convocations.filter(c => c.statut === 'en_attente').length
      const nbDons = profile.nb_dons || 0

      setStats({
        bloodType: profile.groupe_sanguin || user?.groupe_sanguin || 'O+',
        donations: nbDons,
        convocations: enAttente,
        liters: (nbDons * 0.45).toFixed(1)
      })

      setRecentConvocations(convocations.slice(0, 3))
    } catch (err) {
      console.error('Erreur:', err)
    } finally {
      setLoading(false)
    }
  }

  const statutColor = { en_attente: 'var(--orange)', confirmée: 'var(--green)', refusée: 'var(--red)' }
  const typeLabel = { renouvellement: 'Renouvellement', urgence: 'Urgence', autre: 'Autre' }
  const typeIcon = { renouvellement: <RefreshCw size={14} />, urgence: <AlertTriangle size={14} />, autre: <FileText size={14} /> }

  return (
    <div>
      <div className={styles['page-header']}>
        <h1>Bienvenue, {user?.prenom || user?.firstName}</h1>
        <p>Votre espace donneur — coordonné par le CNTS</p>
      </div>

      <div className={styles['stat-grid']}>
        <Card className={styles['stat-card']}>
          <div className={styles['stat-icon']}><Droplets size={28} color="var(--red)" /></div>
          <div className={styles['stat-value']}>{stats.bloodType}</div>
          <div className={styles['stat-label']}>Groupe sanguin</div>
        </Card>

        <Card className={styles['stat-card']}>
          <div className={styles['stat-icon']}><CheckCircle size={28} color="var(--green)" /></div>
          <div className={styles['stat-value']}>{stats.donations}</div>
          <div className={styles['stat-label']}>Dons effectués</div>
        </Card>

        <Card className={styles['stat-card']}>
          <div className={styles['stat-icon']}><ClipboardList size={28} color="var(--orange)" /></div>
          <div className={styles['stat-value']}>{stats.convocations}</div>
          <div className={styles['stat-label']}>Convocations en attente</div>
        </Card>

        <Card className={styles['stat-card']}>
          <div className={styles['stat-icon']}><Heart size={28} color="var(--red)" /></div>
          <div className={styles['stat-value']}>{stats.liters}L</div>
          <div className={styles['stat-label']}>Litres donnés</div>
        </Card>
      </div>

      <div className={styles['section']}>
        <div className={styles['section-header']}>
          <h2>Mes convocations CNTS</h2>
          <Button variant="primary" size="sm" onClick={() => navigate('/donneur/requests')}>Voir tout</Button>
        </div>

        {loading ? (
          <Card>
            <p style={{ color: 'var(--text3)', textAlign: 'center', padding: '20px' }}>Chargement...</p>
          </Card>
        ) : recentConvocations.length === 0 ? (
          <Card>
            <div style={{ textAlign: 'center', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}><Inbox size={36} color="var(--text3)" /></div>
              <p style={{ color: 'var(--text2)', margin: 0 }}>Aucune convocation pour le moment</p>
              <p style={{ color: 'var(--text3)', fontSize: '12px', margin: '4px 0 0' }}>
                Le CNTS vous contactera quand votre don sera nécessaire.
              </p>
            </div>
          </Card>
        ) : (
          <div style={{ display: 'grid', gap: '12px' }}>
            {recentConvocations.map(conv => (
              <Card key={conv.id} style={{ padding: '16px', borderLeft: `4px solid ${statutColor[conv.statut] || 'var(--orange)'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {typeIcon[conv.type]}{typeLabel[conv.type] || conv.type}
                    </h4>
                    <p style={{ margin: 0, color: 'var(--text2)', fontSize: '12px' }}>{conv.message}</p>
                  </div>
                  <span style={{
                    background: statutColor[conv.statut] || 'var(--orange)',
                    color: 'white', padding: '4px 10px', borderRadius: '10px', fontSize: '11px', whiteSpace: 'nowrap'
                  }}>
                    {conv.statut}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
