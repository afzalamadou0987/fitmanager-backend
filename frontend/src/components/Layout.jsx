import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LayoutDashboard, Users, CreditCard, ScanLine, BarChart2, LogOut, Settings, AlertTriangle } from 'lucide-react'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/checkin', icon: ScanLine, label: 'Check-in' },
  { to: '/members', icon: Users, label: 'Membres' },
  { to: '/plans', icon: CreditCard, label: 'Plans' },
  { to: '/stats', icon: BarChart2, label: 'Statistiques' },
]

export default function Layout() {
  const { manager, logout, license } = useAuth()
  const navigate = useNavigate()

  const daysLeft = license?.daysLeft || 0
  const isExpiringSoon = daysLeft <= 3 && daysLeft > 0
  const isExpired = license?.isExpired

  if (isExpired) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#050A18' }}>
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}>
            <AlertTriangle size={32} className="text-red-400"/>
          </div>
          <h1 className="text-2xl font-black text-white mb-2">Licence expirée</h1>
          <p className="text-[#94A3B8] text-sm mb-6">Votre période d'accès à FitManager est terminée. Contactez Afzal pour renouveler.</p>
          <a href="https://wa.me/22892510021?text=Bonjour Afzal, je veux renouveler ma licence FitManager pour ma salle."
            target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white text-sm"
            style={{ background: '#25D366' }}>
            📱 Contacter Afzal sur WhatsApp
          </a>
          <div className="mt-4">
            <button onClick={() => { logout(); navigate('/login') }} className="text-[#475569] text-xs hover:text-white">
              Se déconnecter
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#090D14' }}>
      <aside className="w-12 flex flex-col flex-shrink-0 items-center py-5 gap-1"
        style={{ background: '#0D1117', borderRight: '1px solid rgba(255,255,255,0.04)' }}>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-6 flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0F172A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 4v16M18 4v16M4 8h4M16 8h4M4 16h4M16 16h4"/>
          </svg>
        </div>

        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} title={label}
            className={({ isActive }) => `group relative w-9 h-9 rounded-xl flex items-center justify-center transition-all ${isActive ? '' : 'text-[#3D4B5C] hover:text-white'}`}
            style={({ isActive }) => isActive ? { background: 'rgba(245,158,11,0.2)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.3)' } : {}}>
            <Icon size={16}/>
            <span className="absolute left-14 bg-[#1E293B] text-white text-xs px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50"
              style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
              {label}
            </span>
          </NavLink>
        ))}

        <div className="mt-auto flex flex-col items-center gap-2">
          <button className="w-9 h-9 rounded-xl flex items-center justify-center text-[#3D4B5C] hover:text-[#94A3B8]">
            <Settings size={15}/>
          </button>
          <button onClick={() => { logout(); navigate('/login') }}
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-[#0F172A]"
            style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)' }} title="Deconnexion">
            {manager?.fullName?.charAt(0)?.toUpperCase()}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Bannière expiration */}
        {isExpiringSoon && (
          <div className="px-4 py-2 flex items-center justify-between text-xs"
            style={{ background: daysLeft <= 1 ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.12)', borderBottom: '1px solid rgba(245,158,11,0.2)' }}>
            <span style={{ color: daysLeft <= 1 ? '#F87171' : '#FBBF24' }}>
              ⚠️ Votre licence expire dans <strong>{daysLeft} jour{daysLeft > 1 ? 's' : ''}</strong>
            </span>
            <a href="https://wa.me/22892510021?text=Bonjour Afzal, je veux renouveler ma licence FitManager."
              target="_blank" rel="noopener noreferrer"
              className="font-bold px-3 py-1 rounded-lg text-[#0F172A]"
              style={{ background: '#F59E0B' }}>
              Renouveler
            </a>
          </div>
        )}

        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
