import { useState, useEffect } from 'react'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from 'recharts'
import { TrendingUp, Users, RefreshCw, CreditCard } from 'lucide-react'

const COLORS = ['#F59E0B', '#3B82F6', '#10B981', '#EF4444', '#8B5CF6', '#EC4899']

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="px-3 py-2 rounded-xl text-xs" style={{ background: '#0D1525', border: '1px solid rgba(245,158,11,0.3)' }}>
      <p className="text-[#94A3B8] mb-1">{label}</p>
      <p className="text-white font-bold">{new Intl.NumberFormat('fr-FR').format(payload[0].value)} {payload[0].name === 'total' ? 'FCFA' : ''}</p>
    </div>
  )
}

function KpiCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)' }}>
      <div className="flex items-center justify-between mb-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${color}20`, border: `1px solid ${color}40` }}>
          <Icon size={16} style={{ color }} />
        </div>
      </div>
      <p className="text-[#64748B] text-xs mb-1">{label}</p>
      <p className="text-white font-black text-2xl">{value ?? '—'}</p>
      {sub && <p className="text-[#475569] text-xs mt-1">{sub}</p>}
    </div>
  )
}

export default function Stats() {
  const { gym } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/stats').then(res => { setData(res.data); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  const totalRevenue = data?.monthlyRevenue?.reduce((s, m) => s + parseFloat(m.total || 0), 0) || 0
  const fcfa = n => `${new Intl.NumberFormat('fr-FR').format(n)} FCFA`

  if (loading) return <div className="p-6 text-[#475569] text-sm">Chargement...</div>

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white">Statistiques</h1>
        <p className="text-[#475569] text-xs mt-1">{gym?.name} · Analyse de performance</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <KpiCard icon={TrendingUp} label="Revenus totaux (12 mois)" value={fcfa(totalRevenue)} color="#F59E0B" />
        <KpiCard icon={RefreshCw} label="Taux de renouvellement" value={`${data?.renewalRate || 0}%`} sub={`${data?.renewalRaw?.renewed || 0} sur ${data?.renewalRaw?.total || 0} membres`} color="#10B981" />
        <KpiCard icon={CreditCard} label="Plans actifs" value={data?.planDistribution?.length || 0} sub="types de plans" color="#3B82F6" />
        <KpiCard icon={Users} label="Nouveaux membres (6 mois)" value={data?.newMembers?.reduce((s, m) => s + parseInt(m.count || 0), 0) || 0} color="#8B5CF6" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-4">
        {/* Revenus mensuels */}
        <div className="xl:col-span-2 rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <h2 className="text-white font-semibold text-sm mb-4">Revenus mensuels (12 mois)</h2>
          {data?.monthlyRevenue?.length === 0 ? (
            <p className="text-[#475569] text-xs text-center py-8">Aucune donnée</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data?.monthlyRevenue || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                <Bar dataKey="total" fill="#F59E0B" radius={[4, 4, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Distribution par plan */}
        <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <h2 className="text-white font-semibold text-sm mb-4">Distribution par plan</h2>
          {!data?.planDistribution?.length ? (
            <p className="text-[#475569] text-xs text-center py-8">Aucune donnée</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={data.planDistribution} cx="50%" cy="50%" outerRadius={60} dataKey="count" strokeWidth={0}>
                    {data.planDistribution.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(val, name) => [val, 'membres']} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {data.planDistribution.map((p, i) => (
                  <div key={p.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="text-[#94A3B8] text-xs">{p.name}</span>
                    </div>
                    <span className="text-white text-xs font-bold">{p.count} membres</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Nouveaux membres */}
      <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)' }}>
        <h2 className="text-white font-semibold text-sm mb-4">Nouveaux membres (6 mois)</h2>
        {!data?.newMembers?.length ? (
          <p className="text-[#475569] text-xs text-center py-6">Aucune donnée</p>
        ) : (
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={data.newMembers}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="count" stroke="#10B981" strokeWidth={2} dot={{ fill: '#10B981', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
