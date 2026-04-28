import { createContext, useContext, useState, useCallback } from 'react'
 
const AuthContext = createContext(null)
 
export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('medicore_user')) } catch { return null }
  })
 
  const login = useCallback((userData, token) => {
    localStorage.setItem('medicore_token', token)
    localStorage.setItem('medicore_user', JSON.stringify(userData))
    setUser(userData)
  }, [])
 
  const logout = useCallback(() => {
    localStorage.removeItem('medicore_token')
    localStorage.removeItem('medicore_user')
    setUser(null)
  }, [])
 
  return (
    <AuthContext.Provider value={{ user, login, logout, isAuth: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}
 
export const useAuth = () => useContext(AuthContext)
export const getToken = () => localStorage.getItem('medicore_token')