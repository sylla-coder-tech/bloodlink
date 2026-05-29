import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { StructureService } from '../../services'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import Card from '../../components/common/Card'
import Alert from '../../components/common/Alert'
import styles from './Settings.module.css'

export default function StructureSettings() {
  const { user, login, token, role } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [alert, setAlert] = useState(null)
  const [formData, setFormData] = useState({
    nom: user?.nom || user?.name || '',
    email: user?.email || '',
    telephone: user?.telephone || user?.phone || '',
    commune: user?.commune || user?.city || '',
    quartier: user?.quartier || user?.address || '',
    type: user?.type || 'Hôpital national',
    responsable: user?.responsable || ''
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await StructureService.updateProfile({
        nom: formData.nom,
        telephone: formData.telephone,
        commune: formData.commune,
        quartier: formData.quartier,
        type: formData.type,
        responsable: formData.responsable
      })
      // Mettre à jour le contexte avec les nouvelles données
      const updatedUser = data.structure || data.user || { ...user, ...formData }
      login(updatedUser, token, role)
      setAlert({ type: 'success', message: '✅ Paramètres mis à jour avec succès!' })
      setIsEditing(false)
    } catch (err) {
      console.error('Erreur:', err)
      setAlert({ type: 'error', message: err.response?.data?.message || '❌ Erreur lors de la mise à jour' })
    } finally {
      setLoading(false)
    }
  }

  const structureTypes = [
    'Hôpital national',
    'Hôpital préfectoral',
    'Clinique privée',
    'Centre de santé communautaire',
    'Banque de sang (CNTS)',
    'Maternité',
    'Autre'
  ]

  return (
    <div>
      {alert && (
        <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} autoClose />
      )}

      <div className={styles['page-header']}>
        <h1>Paramètres 🏥</h1>
        <p>Gère les informations de ta structure</p>
      </div>

      <div className={styles['settings-grid']}>
        <Card className={styles['structure-card']}>
          <div className={styles['structure-header']}>
            <div className={styles.icon}>🏥</div>
            <div>
              <h3>{user?.nom || user?.name || 'Ma Structure'}</h3>
              <p>{formData.type}</p>
            </div>
          </div>

          <div className={styles.actions}>
            <Button variant="primary" onClick={() => setIsEditing(!isEditing)}>
              {isEditing ? 'Annuler' : 'Modifier'}
            </Button>
          </div>
        </Card>

        {isEditing ? (
          <Card className={styles['edit-card']}>
            <h3>Modifier les paramètres</h3>
            <form onSubmit={handleSubmit}>
              <Input label="Nom de la structure" name="nom" value={formData.nom} onChange={handleChange} required />
              <Input label="Email" type="email" name="email" value={formData.email} onChange={handleChange} disabled />
              <Input label="Téléphone" type="tel" name="telephone" value={formData.telephone} onChange={handleChange} />
              <Input label="Responsable" name="responsable" value={formData.responsable} onChange={handleChange} />

              <div className={styles['form-group']}>
                <label>Type de structure</label>
                <select name="type" value={formData.type} onChange={handleChange} className={styles['form-select']}>
                  {structureTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <Input label="Commune" name="commune" value={formData.commune} onChange={handleChange} />
              <Input label="Quartier" name="quartier" value={formData.quartier} onChange={handleChange} />

              <Button variant="primary" block type="submit" disabled={loading}>
                {loading ? 'Sauvegarde...' : 'Sauvegarder les modifications'}
              </Button>
            </form>
          </Card>
        ) : (
          <Card className={styles['info-card']}>
            <h3>Informations</h3>
            <div className={styles['info-row']}>
              <span className={styles.label}>Type:</span>
              <span>{formData.type}</span>
            </div>
            <div className={styles['info-row']}>
              <span className={styles.label}>Responsable:</span>
              <span>{formData.responsable || '-'}</span>
            </div>
            <div className={styles['info-row']}>
              <span className={styles.label}>Téléphone:</span>
              <span>{formData.telephone || '-'}</span>
            </div>
            <div className={styles['info-row']}>
              <span className={styles.label}>Commune:</span>
              <span>{formData.commune || '-'}</span>
            </div>
            <div className={styles['info-row']}>
              <span className={styles.label}>Quartier:</span>
              <span>{formData.quartier || '-'}</span>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
