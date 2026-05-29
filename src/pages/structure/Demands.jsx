import { useState, useEffect } from 'react'
import { StructureService } from '../../services'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import Alert from '../../components/common/Alert'
import styles from './Demands.module.css'

export default function StructureDemands() {
  const [demands, setDemands] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [alert, setAlert] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    groupe_sanguin: 'O+',
    quantite: '',
    urgence: 'moyenne',
    commune: '',
    date_limite: '',
    notes: ''
  })

  useEffect(() => {
    loadDemands()
  }, [])

  const loadDemands = async () => {
    try {
      const { data } = await StructureService.getDemands()
      setDemands(data.demandes || data.demands || data || [])
    } catch (err) {
      console.error('Erreur:', err)
      setAlert({ type: 'error', message: 'Erreur lors du chargement des demandes' })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await StructureService.createDemand(formData)
      setAlert({ type: 'success', message: '✅ Demande publiée avec succès!' })
      setShowForm(false)
      setFormData({ groupe_sanguin: 'O+', quantite: '', urgence: 'moyenne', commune: '', date_limite: '', notes: '' })
      loadDemands()
    } catch (err) {
      console.error('Erreur:', err)
      setAlert({ type: 'error', message: err.response?.data?.message || 'Erreur lors de la création' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = async (id) => {
    try {
      await StructureService.closeDemand(id)
      setAlert({ type: 'success', message: '✅ Demande clôturée' })
      loadDemands()
    } catch (err) {
      setAlert({ type: 'error', message: 'Erreur lors de la clôture' })
    }
  }

  const urgenceColor = { haute: 'var(--red)', moyenne: 'var(--orange)', basse: 'var(--green)' }

  return (
    <div>
      {alert && (
        <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} autoClose />
      )}

      <div className={styles['page-header']}>
        <h1>Mes demandes 📋</h1>
        <p>Gère tes demandes de sang</p>
      </div>

      <div className={styles['action-bar']}>
        <Button variant="primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Annuler' : '+ Nouvelle demande'}
        </Button>
      </div>

      {showForm && (
        <Card className={styles['form-card']}>
          <h3>Créer une nouvelle demande</h3>
          <form onSubmit={handleSubmit}>
            <div className={styles['form-row']}>
              <div className={styles['form-group']}>
                <label>Type de sang</label>
                <select
                  value={formData.groupe_sanguin}
                  onChange={(e) => setFormData({ ...formData, groupe_sanguin: e.target.value })}
                  className={styles['form-select']}
                >
                  {['O+','O-','A+','A-','B+','B-','AB+','AB-'].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <Input
                label="Quantité (poches)"
                type="number"
                min="1"
                step="1"
                placeholder="2"
                value={formData.quantite}
                onChange={(e) => setFormData({ ...formData, quantite: e.target.value })}
                required
              />

              <div className={styles['form-group']}>
                <label>Urgence</label>
                <select
                  value={formData.urgence}
                  onChange={(e) => setFormData({ ...formData, urgence: e.target.value })}
                  className={styles['form-select']}
                >
                  <option value="basse">Basse</option>
                  <option value="moyenne">Moyenne</option>
                  <option value="haute">Haute</option>
                </select>
              </div>
            </div>

            <Input
              label="Notes (optionnel)"
              placeholder="Informations complémentaires..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />

            <div className={styles['form-row']}>
              <div className={styles['form-group']}>
                <label>Commune</label>
                <select
                  value={formData.commune}
                  onChange={(e) => setFormData({ ...formData, commune: e.target.value })}
                  className={styles['form-select']}
                  required
                >
                  <option value="">Sélectionner</option>
                  <option value="Kaloum">Kaloum</option>
                  <option value="Dixinn">Dixinn</option>
                  <option value="Matam">Matam</option>
                  <option value="Ratoma">Ratoma</option>
                  <option value="Matoto">Matoto</option>
                </select>
              </div>
              <Input
                label="Date limite"
                type="date"
                value={formData.date_limite}
                onChange={(e) => setFormData({ ...formData, date_limite: e.target.value })}
                required
              />
            </div>

            <Button variant="primary" type="submit" block disabled={submitting}>
              {submitting ? 'Publication...' : 'Publier la demande'}
            </Button>
          </form>
        </Card>
      )}

      <div className={styles['demands-list']}>
        {loading ? (
          <Card><p style={{ color: 'var(--text3)', textAlign: 'center', padding: '20px' }}>Chargement...</p></Card>
        ) : demands.length === 0 ? (
          <Card><p style={{ color: 'var(--text3)', textAlign: 'center', padding: '20px' }}>Aucune demande pour le moment</p></Card>
        ) : (
          demands.map((demand) => (
            <Card key={demand.id} className={styles['demand-card']} style={{ borderLeft: `4px solid ${urgenceColor[demand.urgence] || 'var(--orange)'}` }}>
              <div className={styles['demand-header']}>
                <div>
                  <h4>{demand.groupe_sanguin} — {demand.quantite} poche(s)</h4>
                  <span className={styles.urgence} style={{ color: urgenceColor[demand.urgence] }}>
                    {demand.urgence}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className={styles.status}>{demand.statut || demand.status || 'active'}</span>
                  {(demand.statut || demand.status) !== 'clôturée' && (
                    <Button variant="ghost" size="sm" onClick={() => handleClose(demand.id)}>
                      Clôturer
                    </Button>
                  )}
                </div>
              </div>
              {demand.description && <p className={styles.description}>{demand.description}</p>}
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
