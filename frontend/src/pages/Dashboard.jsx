import { useState, useEffect } from 'react'
import { membersAPI, subscriptionsAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { Users, TrendingUp, AlertCircle, CreditCard, ArrowUpRight, Plus } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { useNavigate } from 'react-router-dom'

const MOIS = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc']

function genData(revenue) {
  const now = new Date()
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 6 + i, 1)
    return {
      mois: MOIS[d.getMonth()],
      revenus: i === 6 ? revenue : Math.floor(Math.random() * 200000 + 30000)
    }
  })
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="px-4 py-3 rounded-xl text-sm"
        style={{ background: '#0F172A', border: '1px solid rgba(245,158,11,0.3)', boxShadow: '0 0 20px rgba(0,0,0,0.5)' }}>
        <p className="text-[#94A3B8] text-xs mb-1">{label}</p>
        <p className="text-white font-bold">{new Intl.NumberFormat('fr-FR').format(payload[0].value)} FCFA</p>
      </div>
    )
  }
  return null
}

export default function Dashboard() {
  const { gym, manager } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [expiring, setExpiring] = useState([])
  const [recentMembers, setRecentMembers] = useState([])
  const [chartData, setChartData] = useState([])

  useEffect(() => {
    Promise.all([
      membersAPI.getStats(),
      subscriptionsAPI.getExpiring(7),
      membersAPI.getAll({ limit: 5 })
    ]).then(([s, e, m]) => {
      setStats(s.data)
      setExpiring(e.data)
      setRecentMembers(m.data.members || [])
      setChartData(genData(s.data?.monthlyRevenue || 0))
    })
  }, [])

  const fcfa = n => new Intl.NumberFormat('fr-FR').format(n)
  const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

  const statCards = [
    { label: 'Membres actifs', value: stats?.totalMembers ?? '—', icon: Users, color: '#3B82F6', trend: '+12%' },
    { label: 'Abonnements actifs', value: stats?.activeSubscriptions ?? '—', icon: CreditCard, color: '#10B981', trend: '+8%' },
    { label: 'Expirent bientôt', value: stats?.expiringSoon ?? '—', icon: AlertCircle, color: '#F59E0B', trend: null },
    { label: 'Revenus ce mois', value: stats ? `${fcfa(stats.monthlyRevenue)} F` : '—', icon: TrendingUp, color: '#F59E0B', trend: '+5%' },
  ]

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-[#475569] text-xs capitalize mb-1">{today}</p>
          <h1 className="text-2xl font-black text-white">
            Bonjour, <span style={{ color: '#F59E0B' }}>{manager?.fullName?.split(' ')[0]}</span> 👋
          </h1>
          <p className="text-[#475569] text-xs mt-1">{gym?.name}</p>
        </div>
        <button onClick={() => navigate('/members')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-[#0F172A] transition-all"
          style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)', boxShadow: '0 0 20px rgba(245,158,11,0.3)' }}>
          <Plus size={16} /> Nouveau membre
        </button>
      </div>

      {/* Total Revenue Hero */}
      <div className="rounded-2xl p-6 mb-6 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.15) 0%, rgba(15,23,42,0.9) 100%)', border: '1px solid rgba(245,158,11,0.2)' }}>
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #F59E0B, transparent)', transform: 'translate(30%, -30%)' }} />
        <div className="relative z-10">
          <p className="text-[#94A3B8] text-sm mb-2">Revenus totaux ce mois</p>
          <div className="flex items-end gap-4 mb-6">
            <h2 className="text-5xl font-black text-white">
              {stats ? fcfa(stats.monthlyRevenue) : '—'}
            </h2>
            <span className="text-lg text-[#94A3B8] mb-2">FCFA</span>
            <div className="flex items-center gap-1 mb-2 px-2 py-1 rounded-lg"
              style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)' }}>
              <ArrowUpRight size={14} className="text-emerald-400" />
              <span className="text-emerald-400 text-xs font-bold">+5%</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={120}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="mois" tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="revenus" stroke="#F59E0B" strokeWidth={2} fill="url(#colorRev)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {statCards.map(({ label, value, icon: Icon, color, trend }) => (
          <div key={label} className="rounded-2xl p-5 transition-all hover:scale-105"
            style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: `${color}20`, border: `1px solid ${color}40` }}>
                <Icon size={16} style={{ color }} />
              </div>
              {trend && (
                <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-0.5">
                  <ArrowUpRight size={10} />{trend}
                </span>
              )}
            </div>
            <p className="text-[#64748B] text-xs mb-1">{label}</p>
            <p className="text-white font-black text-xl">{value}</p>
          </div>
        ))}
      </div>

      {/* Bottom grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Follow up - expirent bientôt */}
        <div className="rounded-2xl overflow-hidden"
          style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="px-5 py-4 flex items-center justify-between"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div>
              <h3 className="text-white font-bold text-sm">Suivi à faire</h3>
              <p className="text-[#475569] text-xs">Abonnements qui expirent</p>
            </div>
            {expiring.length > 0 && (
              <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                style={{ background: '#F59E0B' }}>
                {expiring.length}
              </span>
            )}
          </div>
          {expiring.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-2xl mb-2">✓</p>
              <p className="text-[#475569] text-xs">Aucun abonnement expirant bientôt</p>
            </div>
          ) : expiring.map(sub => {
            const days = Math.ceil((new Date(sub.end_date) - new Date()) / (1000*60*60*24))
            return (
              <div key={sub.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-white/5 transition-colors cursor-pointer"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: 'rgba(245,158,11,0.15)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.3)' }}>
                    {sub.full_name?.charAt(0)}
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">{sub.full_name}</p>
                    <p className="text-[#475569] text-xs">{sub.phone} · {sub.plan_name}</p>
                  </div>
                </div>
                <span className="text-xs font-bold px-2 py-1 rounded-lg"
                  style={{ background: days <= 3 ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
                    color: days <= 3 ? '#F87171' : '#F59E0B' }}>
                  {days}j
                </span>
              </div>
            )
          })}
        </div>

        {/* Nouveaux membres */}
        <div className="rounded-2xl overflow-hidden"
          style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="px-5 py-4 flex items-center justify-between"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div>
              <h3 className="text-white font-bold text-sm">Membres récents</h3>
              <p className="text-[#475569] text-xs">Derniers inscrits</p>
            </div>
            <button onClick={() => navigate('/members')} className="text-xs font-semibold" style={{ color: '#F59E0B' }}>
              Voir tous →
            </button>
          </div>
          {recentMembers.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-2xl mb-2">👥</p>
              <p className="text-[#475569] text-xs">Aucun membre pour l'instant</p>
              <button onClick={() => navigate('/members')} className="mt-3 text-xs font-semibold" style={{ color: '#F59E0B' }}>
                Ajouter le premier →
              </button>
            </div>
          ) : recentMembers.map((m, i) => (
            <div key={m.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-white/5 transition-colors cursor-pointer"
              style={{ borderBottom: i < recentMembers.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none' }}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: 'rgba(59,130,246,0.15)', color: '#60A5FA', border: '1px solid rgba(59,130,246,0.3)' }}>
                  {m.full_name?.charAt(0)}
                </div>
                <div>
                  <p className="text-white text-sm font-medium">{m.full_name}</p>
                  <p className="text-[#475569] text-xs">{m.phone || '—'}</p>
                </div>
              </div>
              <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                m.subscriptionStatus === 'active' ? 'text-emerald-400' :
                m.subscriptionStatus === 'expiring_soon' ? 'text-orange-400' : 'text-red-400'
              }`} style={{
                background: m.subscriptionStatus === 'active' ? 'rgba(16,185,129,0.1)' :
                  m.subscriptionStatus === 'expiring_soon' ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)'
              }}>
                {m.subscriptionStatus === 'active' ? 'Actif' :
                  m.subscriptionStatus === 'expiring_soon' ? 'Expire bientôt' :
                  m.subscriptionStatus === 'expired' ? 'Expiré' : 'Sans abonnement'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
