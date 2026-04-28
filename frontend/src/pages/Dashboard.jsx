import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { doctorAPI, patientAPI, appointmentAPI } from '../services/api'
import { useWebSocket } from '../hooks/useWebSocket'
import { useToast } from '../context/ToastContext'
import './Dashboard.css'
 
const STATUS_COLORS = {
  pending: '#fbbf24', confirmed: '#34d399', cancelled: '#f87171', completed: '#818cf8'
}
 
export default function Dashboard({ setNotifications }) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [stats, setStats] = useState({ doctors: 0, patients: 0, appointments: 0, pending: 0 })
  const [recentAppointments, setRecentAppointments] = useState([])
  const [loading, setLoading] = useState(true)
 
  const handleWsMessage = useCallback((msg) => {
    if (msg.type === 'new_appointment' || msg.type === 'appointment_update') {
      toast(msg.message, msg.type === 'new_appointment' ? 'info' : 'success')
      setNotifications(prev => [msg, ...prev.slice(0, 9)])
      loadData()
    }
  }, [toast, setNotifications])
 
  useWebSocket(user?.user_id, handleWsMessage)
 
  const loadData = async () => {
    try {
      const [docs, pats, appts, pending] = await Promise.all([
        doctorAPI.list({ page_size: 1 }),
        patientAPI.list({ page_size: 1 }),
        appointmentAPI.list({ page_size: 5 }),
        appointmentAPI.list({ status: 'pending', page_size: 1 }),
      ])
      setStats({
        doctors: docs.data.total,
        patients: pats.data.total,
        appointments: appts.data.total,
        pending: pending.data.total,
      })
      setRecentAppointments(appts.data.items)
    } catch {}
    finally { setLoading(false) }
  }
 
  useEffect(() => { loadData() }, [])
 
  if (loading) return (
    <div className="page-loading">
      <div className="spinner" style={{ width: 40, height: 40, borderWidth: 3 }} />
    </div>
  )
 
  return (
    <div className="dashboard fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-sub">Good {getGreeting()}, {user?.full_name?.split(' ')[0]} 👋</p>
        </div>
        <div className="header-date">{new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
      </div>
 
      <div className="stats-grid">
        {[
          { label: 'Total Doctors', value: stats.doctors, icon: '⚕', color: 'var(--accent)', bg: 'rgba(56,189,248,0.08)' },
          { label: 'Total Patients', value: stats.patients, icon: '♡', color: '#818cf8', bg: 'rgba(129,140,248,0.08)' },
          { label: 'Appointments', value: stats.appointments, icon: '◷', color: '#34d399', bg: 'rgba(52,211,153,0.08)' },
          { label: 'Pending', value: stats.pending, icon: '⏳', color: '#fbbf24', bg: 'rgba(251,191,36,0.08)' },
        ].map(s => (
          <div key={s.label} className="stat-card card" style={{ '--stat-color': s.color, '--stat-bg': s.bg }}>
            <div className="stat-icon-box">{s.icon}</div>
            <div className="stat-info">
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>
 
      <div className="dashboard-lower">
        <div className="card recent-card">
          <div className="section-header">
            <h2 className="section-title">Recent Appointments</h2>
            <span className="ws-indicator">
              <span className="ws-dot" />
              Live
            </span>
          </div>
          {recentAppointments.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📅</div>
              <div>No appointments yet</div>
            </div>
          ) : (
            <div className="appt-list">
              {recentAppointments.map(a => (
                <div key={a.id} className="appt-row">
                  <div className="appt-avatar" style={{ background: `${STATUS_COLORS[a.status]}22`, color: STATUS_COLORS[a.status] }}>
                    {a.patient?.user?.full_name?.[0] || '?'}
                  </div>
                  <div className="appt-info">
                    <div className="appt-name">{a.patient?.user?.full_name}</div>
                    <div className="appt-detail">Dr. {a.doctor?.user?.full_name} · {a.appointment_date} {a.appointment_time}</div>
                  </div>
                  <span className={`badge badge-${a.status}`}>{a.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
 
        <div className="card quick-actions-card">
          <h2 className="section-title" style={{ marginBottom: 16 }}>Quick Actions</h2>
          <div className="quick-actions">
            {[
              { label: 'Add Doctor', icon: '⚕', link: '/doctors' },
              { label: 'Add Patient', icon: '♡', link: '/patients' },
              { label: 'Book Appointment', icon: '📅', link: '/appointments' },
            ].map(a => (
              <a key={a.label} href={a.link} className="quick-action-btn">
                <span className="qa-icon">{a.icon}</span>
                <span>{a.label}</span>
              </a>
            ))}
          </div>
 
          <div style={{ marginTop: 24 }}>
            <div className="section-title" style={{ marginBottom: 12 }}>System Status</div>
            {[
              { label: 'API Server', status: 'online' },
              { label: 'WebSocket', status: 'online' },
              { label: 'Database', status: 'online' },
            ].map(s => (
              <div key={s.label} className="status-row">
                <span className="status-label">{s.label}</span>
                <div className="status-indicator">
                  <span className="status-dot" />
                  <span>Online</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
 
function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}