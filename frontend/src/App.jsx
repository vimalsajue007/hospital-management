import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import DoctorsPage from './pages/DoctorsPage'
import PatientsPage from './pages/PatientsPage'
import AppointmentsPage from './pages/AppointmentsPage'
import { useOutletContext } from 'react-router-dom'

// Wrapper to pass notifications context from Layout outlet
function DashboardWrapper() {
  const { notifications, setNotifications } = useOutletContext()
  return <Dashboard setNotifications={setNotifications} />
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<DashboardWrapper />} />
            <Route path="/doctors" element={<DoctorsPage />} />
            <Route path="/patients" element={<PatientsPage />} />
            <Route path="/appointments" element={<AppointmentsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </ToastProvider>
    </AuthProvider>
  )
}
