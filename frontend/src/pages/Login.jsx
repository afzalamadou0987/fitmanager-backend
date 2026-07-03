import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Dumbbell, Eye, EyeOff } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
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
    <div className="min-h-screen bg-[#0F172A] flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#1E293B] to-[#0F172A] relative overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="absolute rounded-full opacity-5 bg-[#F59E0B]"
              style={{
                width: `${120 + i * 60}px`,
                height: `${120 + i * 60}px`,
                top: `${10 + i * 12}%`,
                left: `${5 + i * 8}%`,
              }}
            />
          ))}
        </div>
        <div className="relative z-10 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-[#F59E0B] to-[#D97706] mb-8 shadow-2xl shadow-[#F59E0B]/30">
            <Dumbbell size={36} className="text-[#0F172A]" />
          </div>
          <h1 className="text-4xl font-black text-white mb-4">FitManager</h1>
          <p className="text-[#94A3B8] text-lg mb-12 max-w-sm mx-auto leading-relaxed">
            La solution complète pour gérer votre salle de sport en Afrique de l'Ouest
          </p>
          <div className="grid grid-cols-1 gap-4 text-left max-w-xs mx-auto">
            {[
              ['✓', 'Gestion des membres & abonnements'],
              ['✓', 'Check-in QR code instantané'],
              ['✓', 'Paiement Flooz & T-Money'],
              ['✓', 'Statistiques en temps réel'],
            ].map(([icon, text]) => (
              <div key={text} className="flex items-center gap-3">
                <span className="text-[#F59E0B] font-bold">{icon}</span>
                <span className="text-[#94A3B8] text-sm">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[#F59E0B] to-[#D97706] mb-3">
              <Dumbbell size={24} className="text-[#0F172A]" />
            </div>
            <h1 className="text-2xl font-black text-white">FitManager</h1>
          </div>

          <h2 className="text-xl font-bold text-white mb-1">Connexion</h2>
          <p className="text-[#94A3B8] text-sm mb-7">Connectez-vous à votre espace gérant</p>

          <div className="bg-[#1E293B] rounded-2xl p-7 border border-[#334155]/50">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-xs flex items-center gap-2">
                  <span>⚠️</span> {error}
                </div>
              )}
              <div>
                <label className="block text-xs text-[#94A3B8] mb-1.5 font-medium">Email</label>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  placeholder="gerant@masalle.tg"
                  className="w-full bg-[#0F172A] text-white border border-[#334155] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#F59E0B] transition-colors placeholder:text-[#475569]"
                />
              </div>
              <div>
                <label className="block text-xs text-[#94A3B8] mb-1.5 font-medium">Mot de passe</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'} value={password}
                    onChange={e => setPassword(e.target.value)} required
                    placeholder="••••••••"
                    className="w-full bg-[#0F172A] text-white border border-[#334155] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#F59E0B] transition-colors pr-10"
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#94A3B8]">
                    {showPass ? <EyeOff size={15}/> : <Eye size={15}/>}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-gradient-to-r from-[#F59E0B] to-[#D97706] hover:from-[#D97706] hover:to-[#B45309] disabled:opacity-50 text-[#0F172A] font-bold py-3 rounded-xl transition-all mt-2 shadow-lg shadow-[#F59E0B]/20">
                {loading ? 'Connexion...' : 'Se connecter →'}
              </button>
            </form>
          </div>

          <p className="text-center text-[#475569] text-xs mt-6">
            FitManager — Gestion de salle de sport · Togo 🇹🇬
          </p>
        </div>
      </div>
    </div>
  )
}
