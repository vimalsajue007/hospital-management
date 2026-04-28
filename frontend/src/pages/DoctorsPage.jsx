import { useState, useEffect } from 'react'
import { doctorAPI, appointmentAPI } from '../services/api'
import { useToast } from '../context/ToastContext'
import Pagination from '../components/Pagination'
import './DoctorsPage.css'
 
const SPECIALIZATIONS = ['All', 'Cardiologist', 'Neurologist', 'Pediatrician', 'Orthopedic', 'Dermatologist', 'Gynecologist', 'Ophthalmologist']
const colors = ['#38bdf8','#818cf8','#34d399','#fb7185','#fbbf24','#a78bfa','#f472b6','#22d3ee']
const hashColor = (s = '') => { let h=0; for(let c of s) h=(h*31+c.charCodeAt(0))%colors.length; return colors[h]; }
 
function DoctorCard({ doctor, onBook }) {
  const name = doctor.user?.full_name || ''
  const color = hashColor(name)
  const initials = name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()
 
  return (
    <div className="doctor-card card card-hover fade-in">
      <div className="doctor-top">
        <div className="avatar" style={{ background: `${color}22`, color, width: 56, height: 56, fontSize: 20, borderRadius: 14 }}>
          {initials}
        </div>
        <div className="doctor-meta">
          <div className="doctor-name">Dr. {name}</div>
          <div className="doctor-spec">{doctor.specialization}</div>
          <div className="doctor-rating">{'★'.repeat(Math.round(doctor.rating))}{'☆'.repeat(5-Math.round(doctor.rating))} {doctor.rating.toFixed(1)}</div>
        </div>
      </div>
      <hr className="divider" />
      <div className="doctor-details">
        <div className="detail-row"><span>🎓</span> {doctor.qualification}</div>
        <div className="detail-row"><span>⏱</span> {doctor.experience_years} years experience</div>
        <div className="detail-row"><span>🕐</span> {doctor.available_time_start} – {doctor.available_time_end}</div>
        <div className="detail-row"><span>📅</span> {doctor.available_days?.replace(/,/g, ' · ')}</div>
      </div>
      {doctor.bio && <p className="doctor-bio">{doctor.bio}</p>}
      <div className="doctor-footer">
        <div className="doctor-fee">
          <span className="fee-label">Consultation</span>
          <span className="fee-value">₹{doctor.consultation_fee}</span>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => onBook(doctor)}>Book Now</button>
      </div>
    </div>
  )
}
 
export default function DoctorsPage() {
  const { toast } = useToast()
  const [doctors, setDoctors] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [spec, setSpec] = useState('All')
  const [showAdd, setShowAdd] = useState(false)
  const [showBook, setShowBook] = useState(null)
 
  const load = async () => {
    setLoading(true)
    try {
      const params = { page, page_size: 9 }
      if (search) params.search = search
      if (spec !== 'All') params.specialization = spec
      const res = await doctorAPI.list(params)
      setDoctors(res.data.items)
      setTotal(res.data.total)
      setTotalPages(res.data.total_pages)
    } catch { toast('Failed to load doctors', 'error') }
    finally { setLoading(false) }
  }
 
  useEffect(() => { load() }, [page, spec])
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); load() }, 400)
    return () => clearTimeout(t)
  }, [search])
 
  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Doctors</h1>
          <p className="page-sub">{total} medical professionals</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>+ Add Doctor</button>
      </div>
 
      <div className="filters-bar">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input className="search-input" placeholder="Search doctors…" value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }} />
        </div>
        <div className="spec-filters">
          {SPECIALIZATIONS.map(s => (
            <button key={s} className={`spec-chip ${spec === s ? 'spec-active' : ''}`} onClick={() => { setSpec(s); setPage(1) }}>{s}</button>
          ))}
        </div>
      </div>
 
      {loading ? (
        <div className="page-loading"><div className="spinner" style={{ width: 40, height: 40, borderWidth: 3 }} /></div>
      ) : doctors.length === 0 ? (
        <div className="empty-state"><div className="empty-icon">⚕</div><div>No doctors found</div></div>
      ) : (
        <div className="doctors-grid">
          {doctors.map(d => <DoctorCard key={d.id} doctor={d} onBook={setShowBook} />)}
        </div>
      )}
 
      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
 
      {showAdd && <AddDoctorModal onClose={() => { setShowAdd(false); load() }} />}
      {showBook && <BookModal doctor={showBook} onClose={() => setShowBook(null)} onBooked={() => { setShowBook(null); toast('Appointment booked!', 'success') }} />}
    </div>
  )
}
 
// ── Add Doctor Modal ──────────────────────────────────────────────
function AddDoctorModal({ onClose }) {
  const { toast } = useToast()
  const [form, setForm] = useState({
    specialization: '', qualification: '', experience_years: 0, consultation_fee: 0, bio: '',
    available_days: 'Mon,Tue,Wed,Thu,Fri', available_time_start: '09:00', available_time_end: '17:00',
    user: { email: '', full_name: '', password: '' }
  })
  const [loading, setLoading] = useState(false)
 
  const set = (field, val) => setForm(f => ({ ...f, [field]: val }))
  const setUser = (field, val) => setForm(f => ({ ...f, user: { ...f.user, [field]: val } }))
 
  const submit = async (e) => {
    e.preventDefault(); setLoading(true)
    try {
      await doctorAPI.create(form)
      toast('Doctor added!', 'success'); onClose()
    } catch (err) { toast(err.response?.data?.detail || 'Failed', 'error') }
    finally { setLoading(false) }
  }
 
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">Add New Doctor</h2>
          <button className="btn btn-icon" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={submit} className="modal-body">
          <div className="grid-2">
            <div className="form-group"><label className="form-label">Full Name</label><input className="form-input" placeholder="Dr. John Smith" value={form.user.full_name} onChange={e=>setUser('full_name',e.target.value)} required /></div>
            <div className="form-group"><label className="form-label">Email</label><input className="form-input" type="email" value={form.user.email} onChange={e=>setUser('email',e.target.value)} required /></div>
            <div className="form-group"><label className="form-label">Password</label><input className="form-input" type="password" placeholder="••••••••" value={form.user.password} onChange={e=>setUser('password',e.target.value)} required /></div>
            <div className="form-group"><label className="form-label">Specialization</label><input className="form-input" value={form.specialization} onChange={e=>set('specialization',e.target.value)} required /></div>
            <div className="form-group"><label className="form-label">Qualification</label><input className="form-input" value={form.qualification} onChange={e=>set('qualification',e.target.value)} required /></div>
            <div className="form-group"><label className="form-label">Experience (years)</label><input className="form-input" type="number" min={0} value={form.experience_years} onChange={e=>set('experience_years',+e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Fee (₹)</label><input className="form-input" type="number" min={0} value={form.consultation_fee} onChange={e=>set('consultation_fee',+e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Available Days</label><input className="form-input" value={form.available_days} onChange={e=>set('available_days',e.target.value)} /></div>
          </div>
          <div className="form-group"><label className="form-label">Bio</label><textarea className="form-input" rows={3} value={form.bio} onChange={e=>set('bio',e.target.value)} /></div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving…' : 'Add Doctor'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
 
// ── Book Appointment Modal ────────────────────────────────────────
function BookModal({ doctor, onClose, onBooked }) {
  const { toast } = useToast()
  const [form, setForm] = useState({ appointment_date: '', appointment_time: '10:00', reason: '' })
  const [loading, setLoading] = useState(false)
 
  const submit = async (e) => {
    e.preventDefault(); setLoading(true)
    try {
      await appointmentAPI.create({ ...form, doctor_id: doctor.id })
      onBooked()
    } catch (err) { toast(err.response?.data?.detail || 'Booking failed', 'error') }
    finally { setLoading(false) }
  }
 
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 440 }}>
        <div className="modal-header">
          <h2 className="modal-title">Book Appointment</h2>
          <button className="btn btn-icon" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20, padding:'12px 14px', background:'var(--surface2)', borderRadius:'var(--radius-sm)', border:'1px solid var(--border)' }}>
            <div className="avatar" style={{ background:'rgba(56,189,248,0.12)', color:'var(--accent)', width:44, height:44, borderRadius:10, fontSize:18 }}>
              {doctor.user?.full_name?.[0]}
            </div>
            <div>
              <div style={{ fontWeight:600 }}>Dr. {doctor.user?.full_name}</div>
              <div style={{ fontSize:13, color:'var(--text-muted)' }}>{doctor.specialization} · ₹{doctor.consultation_fee}</div>
            </div>
          </div>
          <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <div className="form-group"><label className="form-label">Date</label><input className="form-input" type="date" min={new Date().toISOString().split('T')[0]} value={form.appointment_date} onChange={e=>setForm({...form,appointment_date:e.target.value})} required /></div>
            <div className="form-group"><label className="form-label">Time</label><input className="form-input" type="time" value={form.appointment_time} onChange={e=>setForm({...form,appointment_time:e.target.value})} required /></div>
            <div className="form-group"><label className="form-label">Reason</label><textarea className="form-input" rows={3} placeholder="Briefly describe your concern…" value={form.reason} onChange={e=>setForm({...form,reason:e.target.value})} /></div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Booking…' : 'Confirm Booking'}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}