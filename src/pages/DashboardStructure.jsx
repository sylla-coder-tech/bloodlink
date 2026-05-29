import { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import Sidebar from '../components/layout/Sidebar'
import AIAssistant from '../components/common/AIAssistant'
import { useAuth } from '../hooks/useAuth'
import { useUnreadMessages } from '../hooks/useUnreadMessages'
import styles from './Dashboard.module.css'
import StructureHome from './structure/Home'
import StructureDemands from './structure/Demands'
import StructureDonors from './structure/Donors'
import StructureSettings from './structure/Settings'
import StructureMessages from './structure/Messages'

export default function DashboardStructure() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user } = useAuth()
  const unread = useUnreadMessages()
  const enAttente = user?.statut_validation === 'en_attente'

  const structureMenu = [
    {
      label: 'Menu',
      items: [
        { icon: '🏠', label: 'Accueil', path: '/structure' },
        { icon: '📋', label: 'Mes demandes', path: '/structure/demands' },
        { icon: '💬', label: 'Messages CNTS', path: '/structure/messages', badge: unread > 0 ? unread : undefined },
        { icon: '⚙️', label: 'Paramètres', path: '/structure/settings' },
      ]
    }
  ]

  return (
    <div className={styles.dashboard}>
      <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      {enAttente && (
        <div style={{
          background: '#FFF3CD', borderBottom: '1px solid #FFEAA7',
          padding: '10px 24px', textAlign: 'center',
          color: '#856404', fontSize: '14px'
        }}>
          ⏳ Votre compte est <strong>en attente de validation</strong> par l'administrateur. Certaines fonctionnalités sont limitées jusqu'à validation.
        </div>
      )}
      
      <div className={styles.container}>
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          items={structureMenu}
        />

        <main className={styles['main-content']}>
          <Routes>
            <Route path="/" element={<StructureHome />} />
            <Route path="/demands" element={<StructureDemands />} />
            <Route path="/messages" element={<StructureMessages />} />
            <Route path="/donors" element={<StructureDonors />} />
            <Route path="/settings" element={<StructureSettings />} />
          </Routes>
        </main>
      </div>
      <AIAssistant />
    </div>
  )
}
