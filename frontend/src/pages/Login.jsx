import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Dumbbell } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#F59E0B] mb-4">
            <Dumbbell size={28} className="text-[#0F172A]" />
          </div>
          <h1 className="text-2xl font-bold text-white">FitManager</h1>
          <p className="text-[#94A3B8] text-sm mt-1">Gestion de votre salle de sport</p>
        </div>

        {/* Card */}
        <div className="bg-[#1E293B] rounded-2xl p-7">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm text-[#94A3B8] mb-2">Email</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)} required
                placeholder="gerant@salle.tg"
                className="w-full bg-[#0F172A] text-white border border-[#334155] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#F59E0B] transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm text-[#94A3B8] mb-2">Mot de passe</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)} required
                placeholder="••••••••"
                className="w-full bg-[#0F172A] text-white border border-[#334155] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#F59E0B] transition-colors"
              />
            </div>
            <button
              type="submit" disabled={loading}
              className="w-full bg-[#F59E0B] hover:bg-[#D97706] disabled:opacity-50 text-[#0F172A] font-bold py-3 rounded-xl transition-colors mt-2"
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
