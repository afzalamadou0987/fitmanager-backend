import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LayoutDashboard, Users, CreditCard, LogOut, Dumbbell, Bell } from 'lucide-react'

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
      <aside className="w-56 bg-[#1E293B] flex flex-col flex-shrink-0 border-r border-[#334155]/50">
        {/* Brand */}
        <div className="p-5 border-b border-[#334155]/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#F59E0B] to-[#D97706] flex items-center justify-center flex-shrink-0 shadow-lg shadow-[#F59E0B]/20">
              <Dumbbell size={17} className="text-[#0F172A]" />
            </div>
            <div className="min-w-0">
              <div className="text-white font-bold text-sm tracking-tight">FitManager</div>
              <div className="text-[#94A3B8] text-[10px] truncate">{gym?.name || 'Ma salle'}</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5">
          <p className="text-[#64748B] text-[10px] font-semibold uppercase tracking-wider px-3 py-2">Menu</p>
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/20'
                  : 'text-[#94A3B8] hover:text-white hover:bg-[#0F172A]'
              }`
            }>
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="p-4 border-t border-[#334155]/50">
          <div className="flex items-center gap-2.5 mb-3 px-1">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#F59E0B] to-[#D97706] flex items-center justify-center flex-shrink-0">
              <span className="text-[#0F172A] text-xs font-bold">{manager?.fullName?.charAt(0)?.toUpperCase()}</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-white text-xs font-semibold truncate">{manager?.fullName}</div>
              <div className="text-[#94A3B8] text-[10px] capitalize">{manager?.role}</div>
            </div>
          </div>
          <button
            onClick={() => { logout(); navigate('/login') }}
            className="flex items-center gap-2 text-[#94A3B8] hover:text-red-400 text-xs px-1 transition-colors w-full"
          >
            <LogOut size={12} />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto bg-[#0F172A]">
        <Outlet />
      </main>
    </div>
  )
}
