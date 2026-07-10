import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authAPI } from '../services/api'
import { Eye, EyeOff, Key } from 'lucide-react'

export default function Register() {
  const [form, setForm] = useState({ gymName: '', gymAddress: '', gymPhone: '', fullName: '', email: '', password: '', accessCode: '' })
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const set = (k, v) => setForm(f => ({...f, [k]: v}))

  const inp = {
    className: "w-full text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-all",
    style: { background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.08)' },
    onFocus: e => e.target.style.borderColor = 'rgba(245,158,11,0.5)',
    onBlur: e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'
  }

  const handleSubmit = async e => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      const res = await authAPI.register(form)
      localStorage.setItem('fm_token', res.data.token)
      navigate('/dashboard'); window.location.reload()
    } catch (err) { setError(err.response?.data?.error || 'Erreur lors de la création du compte') }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#050A18' }}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-3"
            style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)', boxShadow: '0 0 30px rgba(245,158,11,0.35)' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 4v16M18 4v16M4 8h4M16 8h4M4 16h4M16 16h4"/>
            </svg>
          </div>
          <h1 className="text-2xl font-black text-white">FitManager</h1>
          <p className="text-[#475569] text-xs mt-1">Créez votre espace gérant</p>
        </div>

        <div className="rounded-2xl p-6" style={{ background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <form onSubmit={handleSubmit} className="space-y-3">
            {error && (
              <div className="px-4 py-3 rounded-xl text-xs" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#F87171' }}>
                ⚠️ {error}
              </div>
            )}

            {/* Code d'accès - en premier et mis en évidence */}
            <div className="p-4 rounded-xl" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
              <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#F59E0B' }}>
                <Key size={12} className="inline mr-1"/> Code d'accès *
              </label>
              <input value={form.accessCode} onChange={e => set('accessCode', e.target.value.toUpperCase())}
                required placeholder="FM-ESSAI-XXXX"
                className="w-full font-mono font-bold rounded-xl px-4 py-2.5 text-sm focus:outline-none tracking-widest"
                style={{ background: 'rgba(5,10,20,0.8)', border: '1px solid rgba(245,158,11,0.3)', color: '#F59E0B' }}
                onFocus={e => e.target.style.borderColor = '#F59E0B'}
                onBlur={e => e.target.style.borderColor = 'rgba(245,158,11,0.3)'}/>
              <p className="text-[#64748B] text-[10px] mt-1.5">Contactez Afzal au +228 pour obtenir votre code</p>
            </div>

            <p className="text-[#475569] text-[10px] font-bold uppercase tracking-widest pt-1">Votre salle</p>
            <input value={form.gymName} onChange={e => set('gymName', e.target.value)} required placeholder="Ex: Zeyno Gym" {...inp} />
            <div className="grid grid-cols-2 gap-3">
              <input value={form.gymAddress} onChange={e => set('gymAddress', e.target.value)} placeholder="Quartier / Ville" {...inp} />
              <input value={form.gymPhone} onChange={e => set('gymPhone', e.target.value)} placeholder="Ex: 90 00 00 00" {...inp} />
            </div>

            <p className="text-[#475569] text-[10px] font-bold uppercase tracking-widest pt-2">Votre compte</p>
            <input value={form.fullName} onChange={e => set('fullName', e.target.value)} required placeholder="Votre nom complet" {...inp} />
            <input type="email" value={form.email} onChange={e => set('email', e.target.value)} required placeholder="email@exemple.com" {...inp} />
            <div className="relative">
              <input type={showPass ? 'text' : 'password'} value={form.password} onChange={e => set('password', e.target.value)} required minLength={6}
                placeholder="Mot de passe (min. 6 caracteres)" {...inp} style={{...inp.style, paddingRight: '2.5rem'}} />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#94A3B8]">
                {showPass ? <EyeOff size={14}/> : <Eye size={14}/>}
              </button>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-sm text-[#0F172A] mt-2"
              style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)', boxShadow: '0 0 20px rgba(245,158,11,0.25)', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Creation...' : 'Creer mon compte →'}
            </button>
          </form>
        </div>

        <p className="text-center text-[#475569] text-xs mt-4">
          Deja un compte ?{' '}
          <Link to="/login" style={{ color: '#F59E0B' }} className="font-semibold">Se connecter</Link>
        </p>
      </div>
    </div>
  )
}
