import { useState, useEffect } from 'react'
import { appointmentAPI, doctorAPI } from '../services/api'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../context/AuthContext'
import Pagination from '../components/Pagination'
import './AppointmentsPage.css'
import './DoctorsPage.css'
 
const STATUS_OPTIONS = ['all', 'pending', 'confirmed', 'cancelled', 'completed']
 
const STATUS_ACTIONS = {
  pending: [
    { label: 'Confirm', status: 'confirmed', cls: 'btn-primary' },
    { label: 'Cancel', status: 'cancelled', cls: 'btn-danger' },
  ],
  confirmed: [
    { label: 'Complete', status: 'completed', cls: 'btn-primary' },
    { label: 'Cancel', status: 'cancelled', cls: 'btn-danger' },
  ],
  cancelled: [],
  completed: [],
}
 
export default function AppointmentsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [appointments, setAppointments] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [showBook, setShowBook] = useState(false)
  const [updating, setUpdating] = useState(null)
 
  const load = async () => {
    setLoading(true)
    try {
      const params = { page, page_size: 10 }
      if (statusFilter !== 'all') params.status = statusFilter
      const res = await appointmentAPI.list(params)
      setAppointments(res.data.items)
      setTotal(res.data.total)
      setTotalPages(res.data.total_pages)
    } catch {
      toast('Failed to load appointments', 'error')
    } finally {
      setLoading(false)
    }
  }
 
  useEffect(() => { load() }, [page, statusFilter])
 
  const handleStatusChange = async (id, status) => {
    setUpdating(id)
    try {
      await appointmentAPI.update(id, { status })
      toast(`Appointment ${status}`, 'success')
      load()
    } catch {
      toast('Update failed', 'error')
    } finally {
      setUpdating(null)
    }
  }
 
  const handleDelete = async (id) => {
    if (!confirm('Cancel this appointment?')) return
    try {
      await appointmentAPI.delete(id)
      toast('Appointment removed', 'success')
      load()
    } catch {
      toast('Delete failed', 'error')
    }
  }
 
  const canAct = user?.role === 'doctor' || user?.role === 'admin'
 
  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Appointments</h1>
          <p className="page-sub">{total} total appointments</p>
        </div>
        {user?.role === 'patient' && (
          <button className="btn btn-primary" onClick={() => setShowBook(true)}>+ Book Appointment</button>
        )}
      </div>
 
      {/* Status filter tabs */}
      <div className="status-tabs">
        {STATUS_OPTIONS.map(s => (
          <button
            key={s}
            className={`status-tab ${statusFilter === s ? 'status-tab-active' : ''}`}
            onClick={() => { setStatusFilter(s); setPage(1) }}
          >
            <span className={`tab-dot tab-dot-${s}`} />
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>
 
      {loading ? (
        <div className="page-loading">
          <div className="spinner" style={{ width: 40, height: 40, borderWidth: 3 }} />
        </div>
      ) : appointments.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📅</div>
          <div>No appointments found</div>
          {user?.role === 'patient' && (
            <button className="btn btn-primary" onClick={() => setShowBook(true)}>Book your first appointment</button>
          )}
        </div>
      ) : (
        <div className="appt-cards">
          {appointments.map(a => (
            <div key={a.id} className={`appt-card card appt-card-${a.status}`}>
              <div className="appt-card-header">
                <div className="appt-id">#{a.id}</div>
                <span className={`badge badge-${a.status}`}>
                  <span className={`badge-dot badge-dot-${a.status}`} />
                  {a.status}
                </span>
              </div>
 
              <div className="appt-card-body">
                <div className="appt-parties">
                  <div className="party-block">
                    <div className="party-label">Patient</div>
                    <div className="party-name">{a.patient?.user?.full_name}</div>
                    <div className="party-detail">{a.patient?.blood_group || 'No blood group'}</div>
                  </div>
                  <div className="appt-arrow">→</div>
                  <div className="party-block">
                    <div className="party-label">Doctor</div>
                    <div className="party-name">Dr. {a.doctor?.user?.full_name}</div>
                    <div className="party-detail">{a.doctor?.specialization}</div>
                  </div>
                </div>
 
                <div className="appt-datetime">
                  <div className="datetime-chip">
                    <span>📅</span>
                    <span>{a.appointment_date}</span>
                  </div>
                  <div className="datetime-chip">
                    <span>🕐</span>
                    <span>{a.appointment_time}</span>
                  </div>
                  <div className="datetime-chip">
                    <span>💰</span>
                    <span>₹{a.doctor?.consultation_fee}</span>
                  </div>
                </div>
 
                {a.reason && (
                  <div className="appt-reason">
                    <span className="reason-label">Reason:</span> {a.reason}
                  </div>
                )}
                {a.notes && (
                  <div className="appt-notes">
                    <span className="reason-label">Notes:</span> {a.notes}
                  </div>
                )}
              </div>
 
              <div className="appt-card-footer">
                <span className="appt-created">
                  Created {new Date(a.created_at).toLocaleDateString()}
                </span>
                <div className="appt-actions">
                  {canAct && STATUS_ACTIONS[a.status]?.map(action => (
                    <button
                      key={action.status}
                      className={`btn btn-sm ${action.cls}`}
                      disabled={updating === a.id}
                      onClick={() => handleStatusChange(a.id, action.status)}
                    >
                      {updating === a.id ? '…' : action.label}
                    </button>
                  ))}
                  <button
                    className="btn btn-icon btn-sm"
                    onClick={() => handleDelete(a.id)}
                    title="Delete"
                  >
                    🗑
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
 
      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
 
      {showBook && (
        <BookAppointmentModal
          onClose={() => setShowBook(false)}
          onBooked={() => { setShowBook(false); load(); toast('Appointment booked!', 'success') }}
        />
      )}
    </div>
  )
}
 
/* ── Book Appointment Modal ──────────────────────────────────────── */
function BookAppointmentModal({ onClose, onBooked }) {
  const { toast } = useToast()
  const [doctors, setDoctors] = useState([])
  const [selectedDoctor, setSelectedDoctor] = useState(null)
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({ appointment_date: '', appointment_time: '10:00', reason: '' })
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1) // 1=pick doctor, 2=pick time
 
  useEffect(() => {
    doctorAPI.list({ page_size: 50, search }).then(r => setDoctors(r.data.items)).catch(() => {})
  }, [search])
 
  const submit = async (e) => {
    e.preventDefault()
    if (!selectedDoctor) return
    setLoading(true)
    try {
      await appointmentAPI.create({ ...form, doctor_id: selectedDoctor.id })
      onBooked()
    } catch (err) {
      toast(err.response?.data?.detail || 'Booking failed', 'error')
    } finally {
      setLoading(false)
    }
  }
 
  const colors = ['#38bdf8','#818cf8','#34d399','#fb7185','#fbbf24']
  const hashColor = (s = '') => { let h=0; for(let c of s) h=(h*31+c.charCodeAt(0))%colors.length; return colors[h]; }
 
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 600 }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {step === 2 && (
              <button className="btn btn-icon btn-sm" onClick={() => setStep(1)}>←</button>
            )}
            <h2 className="modal-title">
              {step === 1 ? 'Choose a Doctor' : 'Select Date & Time'}
            </h2>
          </div>
          <button className="btn btn-icon" onClick={onClose}>✕</button>
        </div>
 
        <div className="modal-body">
          {/* Step indicator */}
          <div className="step-indicator">
            <div className={`step ${step >= 1 ? 'step-active' : ''}`}>
              <div className="step-num">1</div>
              <div className="step-label">Select Doctor</div>
            </div>
            <div className="step-line" />
            <div className={`step ${step >= 2 ? 'step-active' : ''}`}>
              <div className="step-num">2</div>
              <div className="step-label">Choose Time</div>
            </div>
          </div>
 
          {step === 1 && (
            <div>
              <div className="search-box" style={{ marginBottom: 16, flex: 'none', maxWidth: '100%' }}>
                <span className="search-icon">🔍</span>
                <input
                  className="search-input"
                  placeholder="Search by name or specialization…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <div className="doctor-pick-grid">
                {doctors.map(d => {
                  const name = d.user?.full_name || ''
                  const color = hashColor(name)
                  const isSelected = selectedDoctor?.id === d.id
                  return (
                    <div
                      key={d.id}
                      className={`doctor-pick-card ${isSelected ? 'doctor-pick-selected' : ''}`}
                      onClick={() => setSelectedDoctor(d)}
                    >
                      <div
                        className="avatar"
                        style={{ background: `${color}22`, color, borderRadius: 10, fontSize: 16, width: 44, height: 44, flexShrink: 0 }}
                      >
                        {name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>Dr. {name}</div>
                        <div style={{ fontSize: 12, color: 'var(--accent)', marginTop: 2 }}>{d.specialization}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                          {d.experience_years}y exp · ₹{d.consultation_fee}
                        </div>
                      </div>
                      {isSelected && <span style={{ color: 'var(--accent3)', fontSize: 18 }}>✓</span>}
                    </div>
                  )
                })}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={!selectedDoctor}
                  onClick={() => setStep(2)}
                >
                  Continue →
                </button>
              </div>
            </div>
          )}
 
          {step === 2 && selectedDoctor && (
            <form onSubmit={submit}>
              {/* Selected doctor summary */}
              <div className="selected-doc-summary">
                <div
                  className="avatar"
                  style={{ background: 'rgba(56,189,248,0.12)', color: 'var(--accent)', borderRadius: 10, fontSize: 18, width: 48, height: 48, flexShrink: 0 }}
                >
                  {selectedDoctor.user?.full_name?.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 600 }}>Dr. {selectedDoctor.user?.full_name}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    {selectedDoctor.specialization} · ₹{selectedDoctor.consultation_fee}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>
                    Available: {selectedDoctor.available_days?.replace(/,/g, ', ')}
                    &nbsp;·&nbsp;{selectedDoctor.available_time_start}–{selectedDoctor.available_time_end}
                  </div>
                </div>
              </div>
 
              {/* Quick time slots */}
              <div style={{ marginBottom: 16 }}>
                <div className="form-label" style={{ marginBottom: 10 }}>Quick Time Slots</div>
                <div className="time-slots">
                  {['09:00','10:00','11:00','12:00','14:00','15:00','16:00','17:00'].map(t => (
                    <button
                      key={t}
                      type="button"
                      className={`time-slot ${form.appointment_time === t ? 'time-slot-active' : ''}`}
                      onClick={() => setForm({ ...form, appointment_time: t })}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
 
              <div className="grid-2" style={{ marginBottom: 16 }}>
                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input
                    className="form-input"
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={form.appointment_date}
                    onChange={e => setForm({ ...form, appointment_date: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Time</label>
                  <input
                    className="form-input"
                    type="time"
                    value={form.appointment_time}
                    onChange={e => setForm({ ...form, appointment_time: e.target.value })}
                    required
                  />
                </div>
              </div>
 
              <div className="form-group" style={{ marginBottom: 20 }}>
                <label className="form-label">Reason for Visit</label>
                <textarea
                  className="form-input"
                  rows={3}
                  placeholder="Briefly describe your symptoms or reason for the visit…"
                  value={form.reason}
                  onChange={e => setForm({ ...form, reason: e.target.value })}
                />
              </div>
 
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? <><span className="spinner" /> Booking…</> : '📅 Confirm Booking'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}