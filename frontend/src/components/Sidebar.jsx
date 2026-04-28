import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Sidebar.css'
 
const navItems = [
  { path: '/dashboard', icon: '⬡', label: 'Dashboard' },
  { path: '/doctors', icon: '⚕', label: 'Doctors' },
  { path: '/patients', icon: '♡', label: 'Patients' },
  { path: '/appointments', icon: '◷', label: 'Appointments' },
]
 
function getInitials(name = '') {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}
 
const colors = ['#38bdf8','#818cf8','#34d399','#fb7185','#fbbf24']
function hashColor(str) { let h=0; for(let c of str) h=(h*31+c.charCodeAt(0))%colors.length; return colors[h]; }
 
export default function Sidebar({ notifications = [] }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
 
  const handleLogout = () => { logout(); navigate('/login') }
 
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">✚</div>
        <div>
          <div className="logo-name">VS Hospitals</div>
          <div className="logo-tagline">Healthcare OS</div>
        </div>
      </div>
 
      <nav className="sidebar-nav">
        {navItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
            {item.path === '/appointments' && notifications.length > 0 && (
              <span className="nav-badge">{notifications.length}</span>
            )}
          </NavLink>
        ))}
      </nav>
 
      <div className="sidebar-footer">
        <div className="user-info">
          <div className="avatar" style={{ background: hashColor(user?.full_name || '') }}>
            {getInitials(user?.full_name)}
          </div>
          <div className="user-details">
            <div className="user-name">{user?.full_name}</div>
            <div className="user-role">{user?.role}</div>
          </div>
        </div>
        <button className="btn btn-icon logout-btn" onClick={handleLogout} title="Logout">↪</button>
      </div>
    </aside>
  )
}