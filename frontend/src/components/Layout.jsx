import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LayoutDashboard, Users, CreditCard, LogOut, ScanLine, Settings } from 'lucide-react'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/checkin', icon: ScanLine, label: 'Check-in' },
  { to: '/members', icon: Users, label: 'Membres' },
  { to: '/plans', icon: CreditCard, label: 'Plans' },
]

export default function Layout() {
  const { manager, gym, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex" style={{ background: '#050A18' }}>
      {/* Sidebar - icônes uniquement */}
      <aside className="w-16 flex flex-col flex-shrink-0 py-4 items-center"
        style={{ background: 'rgba(15,23,42,0.95)', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
        
        {/* Logo */}
        <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-8 flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)', boxShadow: '0 0 20px rgba(245,158,11,0.3)' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 4v16M18 4v16M4 8h4M16 8h4M4 16h4M16 16h4"/>
          </svg>
        </div>

        {/* Nav items */}
        <nav className="flex flex-col gap-2 flex-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} title={label}
              className={({ isActive }) =>
                `group relative w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                  isActive ? 'text-[#F59E0B]' : 'text-[#475569] hover:text-white'
                }`
              }
              style={({ isActive }) => ({
                background: isActive ? 'rgba(245,158,11,0.15)' : 'transparent',
                border: isActive ? '1px solid rgba(245,158,11,0.3)' : '1px solid transparent'
              })}
            >
              <Icon size={18} />
              {/* Tooltip */}
              <span className="absolute left-14 bg-[#1E293B] text-white text-xs px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50"
                style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                {label}
              </span>
            </NavLink>
          ))}
        </nav>

        {/* User avatar */}
        <div className="mt-auto flex flex-col items-center gap-3">
          <button onClick={() => { logout(); navigate('/login') }} title="Déconnexion"
            className="w-10 h-10 rounded-xl flex items-center justify-center text-[#475569] hover:text-red-400 transition-colors">
            <LogOut size={16} />
          </button>
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-[#0F172A]"
            style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)' }}>
            {manager?.fullName?.charAt(0)?.toUpperCase()}
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
