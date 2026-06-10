import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { StructureService, NotificationService } from '../../services'
import apiClient from '../../services/apiClient'
import { ClipboardList, CheckCircle, Droplets, Bell } from 'lucide-react'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import styles from './Home.module.css'

export default function StructureHome() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState({ active: 0, completed: 0, donors: 0 })
  const [recentDemands, setRecentDemands] = useState([])
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
    loadNotifications()
  }, [])

  const loadData = async () => {
    try {
      const [demandesRes, donneursRes] = await Promise.all([
        StructureService.getDemands(),
        apiClient.get('/structure/donneurs')
      ])
      const demands = demandesRes.data.demandes || demandesRes.data.demands || demandesRes.data || []
      const active = demands.filter(d => (d.statut || d.status) !== 'clôturée').length
      const completed = demands.filter(d => (d.statut || d.status) === 'clôturée').length
      const donors = (donneursRes.data.donneurs || []).length

      setStats({ active, completed, donors })
      setRecentDemands(demands.slice(0, 3))
    } catch (err) {
      console.error('Erreur:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadNotifications = async () => {
    try {
      const { data } = await NotificationService.getStructureNotifications()
      setNotifications(data.notifications || [])
      setUnreadCount(data.nonLues || 0)
    } catch (err) {
      console.error('Erreur notifications:', err)
    }
  }

  const markAsRead = async () => {
    try {
      await NotificationService.marquerStructureLues()
      setNotifications(prev => prev.map(n => ({ ...n, statut_lecture: true })))
      setUnreadCount(0)
    } catch (err) {
      console.error('Erreur marquer lues:', err)
    }
  }

  return (
    <div>
      <div className={styles['page-header']}>
        <h1>Bienvenue, {user?.nom || user?.name}</h1>
        <p>Gère tes demandes de sang et trouve des donneurs</p>
      </div>

      <div className={styles['stat-grid']}>
        <Card className={styles['stat-card']}>
          <div className={styles['stat-icon']}><ClipboardList size={28} color="var(--red)" /></div>
          <div className={styles['stat-value']}>{loading ? '…' : stats.active}</div>
          <div className={styles['stat-label']}>Demandes actives</div>
        </Card>

        <Card className={styles['stat-card']}>
          <div className={styles['stat-icon']}><CheckCircle size={28} color="var(--green)" /></div>
          <div className={styles['stat-value']}>{loading ? '…' : stats.completed}</div>
          <div className={styles['stat-label']}>Demandes complétées</div>
        </Card>

        <Card className={styles['stat-card']}>
          <div className={styles['stat-icon']}><Droplets size={28} color="var(--red)" /></div>
          <div className={styles['stat-value']}>{loading ? '…' : stats.donors}</div>
          <div className={styles['stat-label']}>Donneurs disponibles</div>
        </Card>
      </div>

      {notifications.length > 0 && (
        <div className={styles['section']}>
          <div className={styles['section-header']}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Bell size={20} /> Notifications</h2>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAsRead}>
                Marquer comme lues
              </Button>
            )}
          </div>
          <div style={{ display: 'grid', gap: '12px' }}>
            {notifications.slice(0, 5).map(notif => (
              <Card
                key={notif.id}
                style={{
                  padding: '16px',
                  borderLeft: notif.statut_lecture ? '4px solid var(--text3)' : '4px solid var(--red)',
                  background: notif.statut_lecture ? 'var(--bg2)' : 'var(--bg1)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '14px' }}>{notif.titre}</h4>
                    <p style={{ margin: 0, color: 'var(--text2)', fontSize: '12px' }}>{notif.contenu}</p>
                  </div>
                  {!notif.statut_lecture && (
                    <span style={{
                      background: 'var(--red)',
                      color: 'white',
                      padding: '2px 8px',
                      borderRadius: '10px',
                      fontSize: '10px',
                      marginLeft: '8px'
                    }}>
                      Nouveau
                    </span>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div className={styles['section']}>
        <div className={styles['section-header']}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><ClipboardList size={20} /> Demandes récentes</h2>
          <Button variant="primary" size="sm" onClick={() => navigate('/structure/demands')}>
            + Nouvelle demande
          </Button>
        </div>

        {loading ? (
          <Card><p style={{ color: 'var(--text3)', textAlign: 'center', padding: '20px' }}>Chargement...</p></Card>
        ) : recentDemands.length === 0 ? (
          <Card><p style={{ color: 'var(--text3)', textAlign: 'center', padding: '20px' }}>Aucune demande en attente</p></Card>
        ) : (
          <div style={{ display: 'grid', gap: '12px' }}>
            {recentDemands.map(d => (
              <Card key={d.id} style={{ padding: '16px', borderLeft: '4px solid var(--red)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ margin: '0 0 4px 0' }}>{d.groupe_sanguin} — {d.quantite}L</h4>
                    <p style={{ margin: 0, color: 'var(--text2)', fontSize: '12px' }}>{d.urgence}</p>
                  </div>
                  <span style={{
                    background: d.urgence === 'haute' ? 'var(--red)' : 'var(--orange)',
                    color: 'white', padding: '4px 12px', borderRadius: '12px', fontSize: '12px'
                  }}>
                    {d.statut || d.status || 'active'}
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
