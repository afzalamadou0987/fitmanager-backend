import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LayoutDashboard, Users, CreditCard, LogOut, Dumbbell } from 'lucide-react'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/members', icon: Users, label: 'Membres' },
  { to: '/plans', icon: CreditCard, label: 'Plans' }
]

export default function Layout() {
  const { manager, gym, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[#0F172A] flex">
      {/* Sidebar */}
      <aside className="w-60 bg-[#1E293B] flex flex-col flex-shrink-0">
        {/* Brand */}
        <div className="p-5 border-b border-[#334155]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#F59E0B] flex items-center justify-center flex-shrink-0">
              <Dumbbell size={18} className="text-[#0F172A]" />
            </div>
            <div className="min-w-0">
              <div className="text-white font-bold text-sm">FitManager</div>
              <div className="text-[#94A3B8] text-xs truncate">{gym?.name || 'Ma salle'}</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive ? 'bg-[#F59E0B]/10 text-[#F59E0B]' : 'text-[#94A3B8] hover:text-white hover:bg-[#0F172A]'
              }`
            }>
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="p-4 border-t border-[#334155]">
          <div className="flex items-center gap-3 mb-3 px-1">
            <div className="w-8 h-8 rounded-full bg-[#F59E0B]/20 flex items-center justify-center flex-shrink-0">
              <span className="text-[#F59E0B] text-xs font-bold">{manager?.fullName?.charAt(0)?.toUpperCase()}</span>
            </div>
            <div className="min-w-0">
              <div className="text-white text-xs font-medium truncate">{manager?.fullName}</div>
              <div className="text-[#94A3B8] text-xs capitalize">{manager?.role}</div>
            </div>
          </div>
          <button
            onClick={() => { logout(); navigate('/login') }}
            className="flex items-center gap-2 text-[#94A3B8] hover:text-red-400 text-xs px-1 transition-colors"
          >
            <LogOut size={13} />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
