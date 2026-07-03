import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Eye, EyeOff } from 'lucide-react'

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
      setError(err.response?.data?.error || 'Email ou mot de passe incorrect')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0F1E] flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center p-12"
        style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1a1033 50%, #0F172A 100%)' }}>
        
        {/* Glow effects */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #F59E0B, transparent)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #F59E0B, transparent)' }} />

        <div className="relative z-10 text-center max-w-md">
          {/* Logo */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-8"
            style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)', boxShadow: '0 0 40px rgba(245,158,11,0.4)' }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 4v16M18 4v16M4 8h4M16 8h4M4 16h4M16 16h4"/>
            </svg>
          </div>

          <h1 className="text-5xl font-black text-white mb-3 tracking-tight">FitManager</h1>
          <p className="text-[#94A3B8] text-lg mb-12 leading-relaxed">
            La solution complète pour gérer votre salle de sport en Afrique de l'Ouest
          </p>

          {/* Features */}
          <div className="space-y-4">
            {[
              { icon: '👥', text: 'Gestion des membres & abonnements' },
              { icon: '📱', text: 'Check-in QR code instantané' },
              { icon: '💰', text: 'Paiement Flooz & T-Money intégré' },
              { icon: '📊', text: 'Statistiques & revenus en temps réel' },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-4 text-left px-5 py-3 rounded-2xl"
                style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)' }}>
                <span className="text-xl">{icon}</span>
                <span className="text-[#CBD5E1] text-sm font-medium">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-3"
              style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 4v16M18 4v16M4 8h4M16 8h4M4 16h4M16 16h4"/>
              </svg>
            </div>
            <h1 className="text-2xl font-black text-white">FitManager</h1>
          </div>

          <h2 className="text-2xl font-bold text-white mb-1">Connexion</h2>
          <p className="text-[#64748B] text-sm mb-8">Connectez-vous à votre espace gérant</p>

          <div className="rounded-2xl p-7" style={{ background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)' }}>
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="px-4 py-3 rounded-xl text-xs flex items-center gap-2"
                  style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#F87171' }}>
                  ⚠️ {error}
                </div>
              )}
              
              <div>
                <label className="block text-xs text-[#94A3B8] mb-2 font-semibold tracking-wide uppercase">Email</label>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  placeholder=""
                  className="w-full text-white rounded-xl px-4 py-3 text-sm focus:outline-none transition-all"
                  style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.08)' }}
                  onFocus={e => e.target.style.borderColor = 'rgba(245,158,11,0.6)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                />
              </div>

              <div>
                <label className="block text-xs text-[#94A3B8] mb-2 font-semibold tracking-wide uppercase">Mot de passe</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'} value={password}
                    onChange={e => setPassword(e.target.value)} required
                    placeholder=""
                    className="w-full text-white rounded-xl px-4 py-3 text-sm focus:outline-none transition-all pr-10"
                    style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.08)' }}
                    onFocus={e => e.target.style.borderColor = 'rgba(245,158,11,0.6)'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#94A3B8]">
                    {showPass ? <EyeOff size={15}/> : <Eye size={15}/>}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full font-bold py-3.5 rounded-xl transition-all mt-2 text-[#0F172A] text-sm"
                style={{ 
                  background: loading ? '#92400E' : 'linear-gradient(135deg, #F59E0B, #D97706)',
                  boxShadow: '0 0 20px rgba(245,158,11,0.3)',
                  opacity: loading ? 0.7 : 1
                }}>
                {loading ? 'Connexion en cours...' : 'Se connecter →'}
              </button>
            </form>
          </div>

          <p className="text-center text-[#475569] text-xs mt-6">
            Pas encore de compte ?{' '}
            <Link to="/register" className="font-semibold" style={{ color: '#F59E0B' }}>
              Créer un compte
            </Link>
          </p>

          <p className="text-center text-[#334155] text-xs mt-3">
            FitManager · Togo 🇹🇬
          </p>
        </div>
      </div>
    </div>
  )
}
