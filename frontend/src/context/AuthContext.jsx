import { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../services/api'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('fm_token'))
  const [manager, setManager] = useState(null)
  const [gym, setGym] = useState(null)
  const [license, setLicense] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (token) {
      authAPI.me()
        .then(res => {
          setManager(res.data)
          setGym(res.data.gym)
          setLicense(res.data.license)
        })
        .catch(() => { setToken(null); localStorage.removeItem('fm_token') })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [token])

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password })
    const { token: t, manager: m, gym: g, license: l } = res.data
    localStorage.setItem('fm_token', t)
    setToken(t); setManager(m); setGym(g); setLicense(l)
    return res.data
  }

  const logout = () => {
    localStorage.removeItem('fm_token')
    setToken(null); setManager(null); setGym(null); setLicense(null)
  }

  return (
    <AuthContext.Provider value={{ token, manager, gym, license, loading, login, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
