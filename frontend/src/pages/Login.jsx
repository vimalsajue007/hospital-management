import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { authAPI } from '../services/api'
import './Login.css'
 
export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState('login')
  const [regForm, setRegForm] = useState({ email: '', full_name: '', password: '', role: 'patient' })
  const { login } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
 
  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await authAPI.login(form)
      login({ full_name: res.data.full_name, role: res.data.role, user_id: res.data.user_id }, res.data.access_token)
      toast('Welcome back!', 'success')
      navigate('/dashboard')
    } catch (err) {
      toast(err.response?.data?.detail || 'Login failed', 'error')
    } finally {
      setLoading(false)
    }
  }
 
  const handleRegister = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await authAPI.register(regForm)
      toast('Account created! Please log in.', 'success')
      setTab('login')
      setForm({ email: regForm.email, password: '' })
    } catch (err) {
      toast(err.response?.data?.detail || 'Registration failed', 'error')
    } finally {
      setLoading(false)
    }
  }
 
  const demoLogin = async (email, password) => {
    setForm({ email, password })
    setLoading(true)
    try {
      const res = await authAPI.login({ email, password })
      login({ full_name: res.data.full_name, role: res.data.role, user_id: res.data.user_id }, res.data.access_token)
      toast('Welcome!', 'success')
      navigate('/dashboard')
    } catch {
      toast('Demo account not found. Run seed.py first.', 'error')
    } finally { setLoading(false) }
  }
 
  return (
    <div className="login-page">
      <div className="login-bg">
        <div className="bg-orb bg-orb-1" />
        <div className="bg-orb bg-orb-2" />
        <div className="bg-grid" />
      </div>
 
      <div className="login-left">
        <div className="hero-content fade-in">
          <div className="hero-logo">
            <span className="logo-cross">✚</span>
          </div>
          <h1 className="hero-title">VS Hospitals</h1>
          <p className="hero-sub">Modern Healthcare<br />Management System</p>
          <div className="hero-stats">
            {[['500+', 'Doctors'], ['12k+', 'Patients'], ['98%', 'Uptime']].map(([v, l]) => (
              <div key={l} className="hero-stat">
                <div className="stat-val">{v}</div>
                <div className="stat-label">{l}</div>
              </div>
            ))}
          </div>
          <div className="hero-features">
            {['Real-time appointment notifications', 'Secure patient records', 'Smart analytics dashboard'].map(f => (
              <div key={f} className="feature-pill">
                <span style={{ color: 'var(--accent3)' }}>✓</span> {f}
              </div>
            ))}
          </div>
        </div>
      </div>
 
      <div className="login-right">
        <div className="login-card fade-in">
          <div className="tab-bar">
            <button className={`tab-btn ${tab === 'login' ? 'tab-active' : ''}`} onClick={() => setTab('login')}>Sign In</button>
            <button className={`tab-btn ${tab === 'register' ? 'tab-active' : ''}`} onClick={() => setTab('register')}>Sign Up</button>
          </div>
 
          {tab === 'login' ? (
            <form onSubmit={handleLogin} className="auth-form">
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-input" type="email" placeholder="you@example.com" value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input className="form-input" type="password" placeholder="••••••••" value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })} required />
              </div>
              <button className="btn btn-primary login-submit" type="submit" disabled={loading}>
                {loading ? <><span className="spinner" />Signing in…</> : 'Sign In →'}
              </button>
 
              <div className="demo-section">
                <div className="demo-label">Quick Demo</div>
                <div className="demo-btns">
                  <button type="button" className="demo-btn" onClick={() => demoLogin('priya@health.com', 'Doctor@123')}>
                    🩺 Doctor
                  </button>
                  <button type="button" className="demo-btn" onClick={() => demoLogin('rahul@patient.com', 'Patient@123')}>
                    🧑‍⚕️ Patient
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="auth-form">
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="form-input" placeholder="John Doe" value={regForm.full_name}
                  onChange={e => setRegForm({ ...regForm, full_name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-input" type="email" placeholder="you@example.com" value={regForm.email}
                  onChange={e => setRegForm({ ...regForm, email: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input className="form-input" type="password" placeholder="••••••••" value={regForm.password}
                  onChange={e => setRegForm({ ...regForm, password: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Role</label>
                <select className="form-input" value={regForm.role} onChange={e => setRegForm({ ...regForm, role: e.target.value })}>
                  <option value="patient">Patient</option>
                  <option value="doctor">Doctor</option>
                </select>
              </div>
              <button className="btn btn-primary login-submit" type="submit" disabled={loading}>
                {loading ? <><span className="spinner" />Creating…</> : 'Create Account →'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}