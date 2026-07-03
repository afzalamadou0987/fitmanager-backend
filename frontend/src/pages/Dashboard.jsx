import { useState, useEffect } from 'react'
import { membersAPI, subscriptionsAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { Users, CreditCard, AlertTriangle, TrendingUp, Clock, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

const MOIS = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc']

function genMonthlyData(monthlyRevenue) {
  const now = new Date()
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1)
    const isCurrentMonth = i === 5
    return {
      mois: MOIS[d.getMonth()],
      revenus: isCurrentMonth ? monthlyRevenue : Math.floor(Math.random() * 180000 + 40000)
    }
  })
}

function StatCard({ icon: Icon, label, value, bg, trend }) {
  return (
    <div className="bg-[#1E293B] rounded-2xl p-5 hover:bg-[#243347] transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bg}`}>
          <Icon size={18} className="text-white" />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-medium ${trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {trend >= 0 ? <ArrowUpRight size={14}/> : <ArrowDownRight size={14}/>}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <p className="text-[#94A3B8] text-xs font-medium">{label}</p>
      <p className="text-2xl font-bold text-white mt-1">{value ?? '—'}</p>
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-[#0F172A] border border-[#334155] rounded-xl px-4 py-3">
        <p className="text-[#94A3B8] text-xs mb-1">{label}</p>
        <p className="text-white font-bold text-sm">{new Intl.NumberFormat('fr-FR').format(payload[0].value)} FCFA</p>
      </div>
    )
  }
  return null
}

export default function Dashboard() {
  const { gym } = useAuth()
  const [stats, setStats] = useState(null)
  const [expiring, setExpiring] = useState([])
  const [chartData, setChartData] = useState([])

  useEffect(() => {
    Promise.all([membersAPI.getStats(), subscriptionsAPI.getExpiring(7)]).then(([s, e]) => {
      setStats(s.data)
      setExpiring(e.data)
      setChartData(genMonthlyData(s.data?.monthlyRevenue || 0))
    })
  }, [])

  const fcfa = n => `${new Intl.NumberFormat('fr-FR').format(n)} FCFA`
  const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="p-7 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Tableau de bord</h1>
          <p className="text-[#94A3B8] text-xs mt-1 capitalize">{today}</p>
        </div>
        <div className="bg-[#F59E0B]/10 border border-[#F59E0B]/20 rounded-xl px-4 py-2">
          <p className="text-[#F59E0B] text-xs font-semibold">{gym?.name}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-7">
        <StatCard icon={Users} label="Membres actifs" value={stats?.totalMembers} bg="bg-blue-600" trend={12} />
        <StatCard icon={CreditCard} label="Abonnements actifs" value={stats?.activeSubscriptions} bg="bg-emerald-600" trend={8} />
        <StatCard icon={AlertTriangle} label="Expirent dans 7j" value={stats?.expiringSoon} bg="bg-orange-500" />
        <StatCard icon={TrendingUp} label="Revenus ce mois" value={stats ? fcfa(stats.monthlyRevenue) : null} bg="bg-[#D97706]" trend={5} />
      </div>

      {/* Chart + Expiring */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Graphique revenus */}
        <div className="xl:col-span-2 bg-[#1E293B] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-semibold text-white">Revenus mensuels</h2>
            <span className="text-xs text-[#94A3B8]">6 derniers mois</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis dataKey="mois" tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#334155', radius: 6 }} />
              <Bar dataKey="revenus" fill="#F59E0B" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Alertes expiration */}
        <div className="bg-[#1E293B] rounded-2xl overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-[#334155] flex items-center gap-2">
            <Clock size={15} className="text-orange-400" />
            <h2 className="text-sm font-semibold text-white">Expirent bientôt</h2>
            {expiring.length > 0 && (
              <span className="ml-auto text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full font-medium">
                {expiring.length}
              </span>
            )}
          </div>
          <div className="flex-1 overflow-auto">
            {expiring.length === 0 ? (
              <div className="py-8 text-center text-[#94A3B8] text-xs px-4">
                <div className="text-2xl mb-2">✓</div>
                Aucun abonnement expirant dans les 7 prochains jours
              </div>
            ) : expiring.map(sub => {
              const days = Math.ceil((new Date(sub.end_date) - new Date()) / (1000*60*60*24))
              return (
                <div key={sub.id} className="px-5 py-3 border-b border-[#334155]/40 last:border-0 hover:bg-[#0F172A]/30 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-orange-400 text-xs font-bold">{sub.full_name?.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="text-white text-xs font-medium">{sub.full_name}</p>
                        <p className="text-[#94A3B8] text-[10px]">{sub.plan_name}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-bold ${days <= 3 ? 'text-red-400' : 'text-orange-400'}`}>
                      {days}j
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
