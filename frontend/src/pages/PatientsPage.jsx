import { useState, useEffect } from 'react'
import { patientAPI, fileAPI } from '../services/api'
import { useToast } from '../context/ToastContext'
import Pagination from '../components/Pagination'
import './DoctorsPage.css'
import './PatientsPage.css'
 
const colors = ['#38bdf8','#818cf8','#34d399','#fb7185','#fbbf24']
const hashColor = (s = '') => { let h=0; for(let c of s) h=(h*31+c.charCodeAt(0))%colors.length; return colors[h]; }
 
export default function PatientsPage() {
  const { toast } = useToast()
  const [patients, setPatients] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [bloodFilter, setBloodFilter] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [selected, setSelected] = useState(null)
 
  const load = async () => {
    setLoading(true)
    try {
      const params = { page, page_size: 10 }
      if (search) params.search = search
      if (bloodFilter) params.blood_group = bloodFilter
      const res = await patientAPI.list(params)
      setPatients(res.data.items)
      setTotal(res.data.total)
      setTotalPages(res.data.total_pages)
    } catch { toast('Failed to load patients', 'error') }
    finally { setLoading(false) }
  }
 
  useEffect(() => { load() }, [page, bloodFilter])
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); load() }, 400)
    return () => clearTimeout(t)
  }, [search])
 
  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']
 
  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Patients</h1>
          <p className="page-sub">{total} registered patients</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>+ Add Patient</button>
      </div>
 
      <div className="filters-bar">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input className="search-input" placeholder="Search patients…" value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }} />
        </div>
        <div className="spec-filters">
          <button className={`spec-chip ${!bloodFilter ? 'spec-active' : ''}`} onClick={() => setBloodFilter('')}>All Blood Types</button>
          {bloodGroups.map(b => (
            <button key={b} className={`spec-chip ${bloodFilter === b ? 'spec-active' : ''}`} onClick={() => { setBloodFilter(b); setPage(1) }}>{b}</button>
          ))}
        </div>
      </div>
 
      {loading ? (
        <div className="page-loading"><div className="spinner" style={{ width: 40, height: 40, borderWidth: 3 }} /></div>
      ) : patients.length === 0 ? (
        <div className="empty-state"><div className="empty-icon">♡</div><div>No patients found</div></div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Blood Group</th>
                <th>Date of Birth</th>
                <th>Phone</th>
                <th>Registered</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {patients.map(p => {
                const name = p.user?.full_name || ''
                const color = hashColor(name)
                return (
                  <tr key={p.id}>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div className="avatar" style={{ background:`${color}22`, color, borderRadius:10, fontSize:14, width:36, height:36 }}>
                          {name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight:500 }}>{name}</div>
                          <div style={{ fontSize:12, color:'var(--text-muted)' }}>{p.user?.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      {p.blood_group ? (
                        <span className="blood-badge">{p.blood_group}</span>
                      ) : <span style={{ color:'var(--text-dim)' }}>—</span>}
                    </td>
                    <td style={{ color:'var(--text-muted)', fontSize:13 }}>{p.date_of_birth || '—'}</td>
                    <td style={{ color:'var(--text-muted)', fontSize:13 }}>{p.phone || '—'}</td>
                    <td style={{ color:'var(--text-muted)', fontSize:12 }}>{new Date(p.created_at).toLocaleDateString()}</td>
                    <td>
                      <button className="btn btn-icon btn-sm" onClick={() => setSelected(p)} title="View files">📁</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
 
      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
 
      {showAdd && <AddPatientModal onClose={() => { setShowAdd(false); load() }} />}
      {selected && <PatientFilesModal patient={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
 
// ── Add Patient Modal ─────────────────────────────────────────────
function AddPatientModal({ onClose }) {
  const { toast } = useToast()
  const [form, setForm] = useState({
    date_of_birth: '', blood_group: '', phone: '', address: '', medical_history: '',
    user: { email: '', full_name: '', password: '' }
  })
  const [loading, setLoading] = useState(false)
 
  const set = (f, v) => setForm(prev => ({ ...prev, [f]: v }))
  const setUser = (f, v) => setForm(prev => ({ ...prev, user: { ...prev.user, [f]: v } }))
 
  const submit = async (e) => {
    e.preventDefault(); setLoading(true)
    try {
      await patientAPI.create(form)
      toast('Patient added!', 'success'); onClose()
    } catch (err) { toast(err.response?.data?.detail || 'Failed', 'error') }
    finally { setLoading(false) }
  }
 
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">Add New Patient</h2>
          <button className="btn btn-icon" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={submit} className="modal-body">
          <div className="grid-2">
            <div className="form-group"><label className="form-label">Full Name</label><input className="form-input" value={form.user.full_name} onChange={e=>setUser('full_name',e.target.value)} required /></div>
            <div className="form-group"><label className="form-label">Email</label><input className="form-input" type="email" value={form.user.email} onChange={e=>setUser('email',e.target.value)} required /></div>
            <div className="form-group"><label className="form-label">Password</label><input className="form-input" type="password" value={form.user.password} onChange={e=>setUser('password',e.target.value)} required /></div>
            <div className="form-group"><label className="form-label">Phone</label><input className="form-input" value={form.phone} onChange={e=>set('phone',e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Date of Birth</label><input className="form-input" type="date" value={form.date_of_birth} onChange={e=>set('date_of_birth',e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Blood Group</label>
              <select className="form-input" value={form.blood_group} onChange={e=>set('blood_group',e.target.value)}>
                <option value="">Select…</option>
                {['A+','A-','B+','B-','O+','O-','AB+','AB-'].map(b=><option key={b}>{b}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group" style={{ marginTop: 12 }}><label className="form-label">Address</label><textarea className="form-input" rows={2} value={form.address} onChange={e=>set('address',e.target.value)} /></div>
          <div className="form-group"><label className="form-label">Medical History</label><textarea className="form-input" rows={3} value={form.medical_history} onChange={e=>set('medical_history',e.target.value)} /></div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving…' : 'Add Patient'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
 
// ── Patient Files Modal ───────────────────────────────────────────
function PatientFilesModal({ patient, onClose }) {
  const { toast } = useToast()
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [desc, setDesc] = useState('')
 
  useEffect(() => { loadFiles() }, [])
 
  const loadFiles = async () => {
    try { const r = await fileAPI.list(patient.id); setFiles(r.data) } catch {}
  }
 
  const handleUpload = async (e) => {
    const file = e.target.files[0]; if (!file) return
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    if (desc) fd.append('description', desc)
    try {
      await fileAPI.upload(patient.id, fd)
      toast('File uploaded!', 'success')
      setDesc(''); loadFiles()
    } catch (err) { toast(err.response?.data?.detail || 'Upload failed', 'error') }
    finally { setUploading(false); e.target.value = '' }
  }
 
  const handleDownload = async (f) => {
    try {
      const r = await fileAPI.download(f.id)
      const url = URL.createObjectURL(r.data)
      const a = document.createElement('a'); a.href=url; a.download=f.original_filename; a.click()
      URL.revokeObjectURL(url)
    } catch { toast('Download failed', 'error') }
  }
 
  const handleDelete = async (id) => {
    try { await fileAPI.delete(id); toast('File deleted', 'success'); loadFiles() }
    catch { toast('Delete failed', 'error') }
  }
 
  const fmtSize = (b) => b < 1024*1024 ? `${(b/1024).toFixed(1)} KB` : `${(b/1024/1024).toFixed(1)} MB`
 
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 520 }}>
        <div className="modal-header">
          <h2 className="modal-title">📁 {patient.user?.full_name} — Files</h2>
          <button className="btn btn-icon" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="upload-zone">
            <div style={{ marginBottom:10 }}>
              <input className="form-input" placeholder="Description (optional)" value={desc} onChange={e=>setDesc(e.target.value)} style={{ marginBottom:10 }} />
              <label className="btn btn-secondary" style={{ cursor:'pointer', width:'100%', justifyContent:'center' }}>
                {uploading ? '⏳ Uploading…' : '⬆ Choose File to Upload'}
                <input type="file" style={{ display:'none' }} onChange={handleUpload} disabled={uploading}
                  accept=".pdf,.jpg,.jpeg,.png,.txt,.doc,.docx" />
              </label>
            </div>
            <div style={{ fontSize:12, color:'var(--text-dim)' }}>PDF, Images, Word docs · Max 10MB</div>
          </div>
 
          {files.length === 0 ? (
            <div className="empty-state" style={{ padding:30 }}><div className="empty-icon">📄</div><div>No files uploaded yet</div></div>
          ) : (
            <div className="file-list">
              {files.map(f => (
                <div key={f.id} className="file-row">
                  <div className="file-icon">{f.content_type?.includes('pdf') ? '📄' : f.content_type?.includes('image') ? '🖼' : '📎'}</div>
                  <div className="file-info">
                    <div className="file-name">{f.original_filename}</div>
                    <div className="file-meta">{f.description && `${f.description} · `}{f.file_size ? fmtSize(f.file_size) : ''} · {new Date(f.uploaded_at).toLocaleDateString()}</div>
                  </div>
                  <div style={{ display:'flex', gap:6 }}>
                    <button className="btn btn-icon btn-sm" onClick={() => handleDownload(f)} title="Download">⬇</button>
                    <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDelete(f.id)} title="Delete">🗑</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}