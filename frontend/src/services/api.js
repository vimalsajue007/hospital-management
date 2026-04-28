import axios from 'axios'
import { getToken } from '../context/AuthContext'
 
const api = axios.create({ baseURL: '/api' })
 
api.interceptors.request.use(config => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})
 
api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('medicore_token')
      localStorage.removeItem('medicore_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)
 
// Auth
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
}
 
// Doctors
export const doctorAPI = {
  list: (params) => api.get('/doctors/', { params }),
  get: (id) => api.get(`/doctors/${id}`),
  create: (data) => api.post('/doctors/', data),
  update: (id, data) => api.put(`/doctors/${id}`, data),
  delete: (id) => api.delete(`/doctors/${id}`),
}
 
// Patients
export const patientAPI = {
  list: (params) => api.get('/patients/', { params }),
  get: (id) => api.get(`/patients/${id}`),
  create: (data) => api.post('/patients/', data),
  update: (id, data) => api.put(`/patients/${id}`, data),
  delete: (id) => api.delete(`/patients/${id}`),
}
 
// Appointments
export const appointmentAPI = {
  list: (params) => api.get('/appointments/', { params }),
  get: (id) => api.get(`/appointments/${id}`),
  create: (data) => api.post('/appointments/', data),
  update: (id, data) => api.put(`/appointments/${id}`, data),
  delete: (id) => api.delete(`/appointments/${id}`),
}
 
// Files
export const fileAPI = {
  upload: (patientId, formData) => api.post(`/files/upload/${patientId}`, formData),
  list: (patientId) => api.get(`/files/patient/${patientId}`),
  download: (fileId) => api.get(`/files/download/${fileId}`, { responseType: 'blob' }),
  delete: (fileId) => api.delete(`/files/${fileId}`),
}
 
export default api