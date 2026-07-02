import { useState, useEffect } from 'react'
import { membersAPI, subscriptionsAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { Users, CreditCard, AlertTriangle, TrendingUp, Clock } from 'lucide-react'

function StatCard({ icon: Icon, label, value, bg }) {
  return (
    <div className="bg-[#1E293B] rounded-2xl p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[#94A3B8] text-xs font-medium">{label}</p>
          <p className="text-2xl font-bold text-white mt-1">{value ?? '—'}</p>
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bg}`}>
          <Icon size={18} className="text-white" />
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status }) {
  const cfg = {
    active: 'bg-green-500/20 text-green-400',
    expiring_soon: 'bg-orange-500/20 text-orange-400',
    expired: 'bg-red-500/20 text-red-400',
    none: 'bg-[#334155] text-[#64748B]'
  }
  const labels = { active: 'Actif', expiring_soon: 'Expire bientôt', expired: 'Expiré', none: 'Sans abonnement' }
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg[status] || cfg.none}`}>
      {labels[status] || 'Sans abonnement'}
    </span>
  )
}

export default function Dashboard() {
  const { gym } = useAuth()
  const [stats, setStats] = useState(null)
  const [expiring, setExpiring] = useState([])

  useEffect(() => {
    Promise.all([membersAPI.getStats(), subscriptionsAPI.getExpiring(7)]).then(([s, e]) => {
      setStats(s.data)
      setExpiring(e.data)
    })
  }, [])

  const fcfa = n => `${new Intl.NumberFormat('fr-FR').format(n)} FCFA`

  return (
    <div className="p-7">
      <div className="mb-7">
        <h1 className="text-xl font-bold text-white">Tableau de bord</h1>
        <p className="text-[#94A3B8] text-xs mt-0.5">{gym?.name}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-7">
        <StatCard icon={Users} label="Membres actifs" value={stats?.totalMembers} bg="bg-blue-600" />
        <StatCard icon={CreditCard} label="Abonnements actifs" value={stats?.activeSubscriptions} bg="bg-emerald-600" />
        <StatCard icon={AlertTriangle} label="Expirent dans 7j" value={stats?.expiringSoon} bg="bg-orange-500" />
        <StatCard icon={TrendingUp} label="Revenus ce mois" value={stats ? fcfa(stats.monthlyRevenue) : null} bg="bg-[#D97706]" />
      </div>

      {/* Expiring soon */}
      <div className="bg-[#1E293B] rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#334155] flex items-center gap-2">
          <Clock size={16} className="text-orange-400" />
          <h2 className="text-sm font-semibold text-white">Abonnements expirant bientôt</h2>
          {expiring.length > 0 && (
            <span className="ml-auto text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full">
              {expiring.length}
            </span>
          )}
        </div>
        {expiring.length === 0 ? (
          <div className="py-10 text-center text-[#94A3B8] text-sm">
            Aucun abonnement n'expire dans les 7 prochains jours ✓
          </div>
        ) : (
          <div>
            {expiring.map(sub => (
              <div key={sub.id} className="px-6 py-3.5 border-b border-[#334155]/50 flex items-center justify-between last:border-0">
                <div>
                  <p className="text-white text-sm font-medium">{sub.full_name}</p>
                  <p className="text-[#94A3B8] text-xs">{sub.phone} · {sub.plan_name}</p>
                </div>
                <p className="text-orange-400 text-sm font-medium">
                  {new Date(sub.end_date).toLocaleDateString('fr-FR')}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
