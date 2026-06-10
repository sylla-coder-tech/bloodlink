import { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { Home, ClipboardList, MessageCircle, User, Clock, X, PauseCircle } from 'lucide-react'
import Navbar from '../components/layout/Navbar'
import Sidebar from '../components/layout/Sidebar'
import AIAssistant from '../components/common/AIAssistant'
import { DonneurService } from '../services'
import { useUnreadMessages } from '../hooks/useUnreadMessages'
import styles from './Dashboard.module.css'
import DonneurHome from './donneur/Home'
import DonneurRequests from './donneur/Requests'
import DonneurProfile from './donneur/Profile'
import DonneurMessages from './donneur/Messages'

export default function DashboardDonneur() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const unread = useUnreadMessages()
  const [user, setUser] = useState(null)
  const [statutValidation, setStatutValidation] = useState(null)

  useEffect(() => {
    loadProfile()
  }, [])

  const donneurMenu = [
    {
      label: 'Menu',
      items: [
        { icon: <Home size={18} />, label: 'Accueil', path: '/donneur' },
        { icon: <ClipboardList size={18} />, label: 'Convocations', path: '/donneur/requests' },
        { icon: <MessageCircle size={18} />, label: 'Messages', path: '/donneur/messages', badge: unread > 0 ? unread : undefined },
        { icon: <User size={18} />, label: 'Profil', path: '/donneur/profile' },
      ]
    }
  ]

  const loadProfile = async () => {
    try {
      const { data } = await DonneurService.getProfile()
      const donneur = data.donneur || data.user || {}
      setUser(donneur)
      setStatutValidation(donneur.statut_validation || 'en_attente')
    } catch (err) {
      console.error('Erreur:', err)
    }
  }

  const banniereStatut = {
    en_attente: { bg: '#FFF8E1', border: 'var(--orange)', icon: <Clock size={18} color="var(--orange)" />, text: 'Votre compte est en attente de validation par le CNTS. Certaines fonctionnalités sont temporairement indisponibles.' },
    rejeté:     { bg: '#FFF5F5', border: 'var(--red)',    icon: <X size={18} color="var(--red)" />, text: 'Votre inscription a été rejetée par le CNTS. Veuillez les contacter pour plus d\'informations.' },
    suspendu:   { bg: '#F5F5F5', border: '#999',          icon: <PauseCircle size={18} color="#999" />, text: 'Votre compte a été suspendu par le CNTS. Contactez-nous pour régulariser votre situation.' },
  }
  const banniere = banniereStatut[statutValidation]

  return (
    <div className={styles.dashboard}>
      <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

      {banniere && (
        <div style={{
          background: banniere.bg, borderLeft: `4px solid ${banniere.border}`,
          padding: '12px 20px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '10px'
        }}>
          {banniere.icon}
          <span>{banniere.text}</span>
        </div>
      )}

      <div className={styles.container}>
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          items={donneurMenu}
        />

        <main className={styles['main-content']}>
          <Routes>
            <Route path="/" element={<DonneurHome />} />
            <Route path="/requests" element={<DonneurRequests />} />
            <Route path="/messages" element={<DonneurMessages />} />
            <Route path="/profile" element={<DonneurProfile />} />
          </Routes>
        </main>
      </div>
      <AIAssistant />
    </div>
  )
}
