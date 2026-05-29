import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Login from './pages/Login'
import Register from './pages/Register'
import DashboardDonneur from './pages/DashboardDonneur'
import DashboardStructure from './pages/DashboardStructure'
import Admin from './pages/Admin'
import PrivateRoute from './components/PrivateRoute'
import InstallBanner from './components/common/InstallBanner'

function App() {
  return (
    <Router>
      <AuthProvider>
        <InstallBanner />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/donneur/*" element={<PrivateRoute><DashboardDonneur /></PrivateRoute>} />
          <Route path="/structure/*" element={<PrivateRoute><DashboardStructure /></PrivateRoute>} />
          <Route path="/admin/*" element={<PrivateRoute><Admin /></PrivateRoute>} />
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </AuthProvider>
    </Router>
  )
}

export default App
