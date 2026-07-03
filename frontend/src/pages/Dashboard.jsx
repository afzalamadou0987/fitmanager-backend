import { useState, useEffect } from 'react'
import { membersAPI, subscriptionsAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { BarChart, Bar, Cell, XAxis, Tooltip, ResponsiveContainer, PieChart, Pie } from 'recharts'
import { useNavigate } from 'react-router-dom'
import { ArrowUpRight, ArrowDownRight, Calendar, Plus } from 'lucide-react'

const MOIS = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc']

function genBars(revenue) {
  const now = new Date()
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 6 + i, 1)
    return { mois: MOIS[d.getMonth()], val: i === 6 ? revenue || 0 : Math.floor(Math.random() * 250000 + 50000), isLast: i === 6 }
  })
}

const CustomBar = (props) => {
  const { x, y, width, height, isLast } = props
  return <rect x={x} y={y} width={width} height={height} rx={3}
    fill={isLast ? '#F59E0B' : 'rgba(255,255,255,0.06)'} />
}

const RevTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="px-3 py-2 rounded-lg text-xs" style={{ background: '#0D1117', border: '1px solid rgba(245,158,11,0.3)' }}>
      <p style={{ color: '#94A3B8' }}>{label}</p>
      <p className="font-bold text-white">{new Intl.NumberFormat('fr-FR').format(payload[0].value)} F</p>
    </div>
  )
}

function MiniCard({ label, sub, value, trend, children }) {
  return (
    <div className="rounded-2xl p-4 flex flex-col" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)' }}>
      <p className="text-white text-xs font-semibold leading-tight">{label}</p>
      {sub && <p className="text-[#3D4B5C] text-[10px] mt-0.5 leading-tight">{sub}</p>}
      <div className="flex items-end justify-between mt-auto pt-3">
        <p className="text-white font-black text-2xl">{value ?? '—'}</p>
        {trend !== undefined && (
          <div className={`flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-md ${trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}
            style={{ background: trend >= 0 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)' }}>
            {trend >= 0 ? <ArrowUpRight size={10}/> : <ArrowDownRight size={10}/>}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      {children}
    </div>
  )
}

export default function Dashboard() {
  const { gym, manager } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [expiring, setExpiring] = useState([])
  const [recentMembers, setRecentMembers] = useState([])
  const [bars, setBars] = useState([])
  const today = new Date()
  const dateStr = today.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

  useEffect(() => {
    Promise.all([membersAPI.getStats(), subscriptionsAPI.getExpiring(14), membersAPI.getAll({ limit: 5 })]).then(([s, e, m]) => {
      setStats(s.data); setExpiring(e.data); setRecentMembers(m.data.members || [])
      setBars(genBars(s.data?.monthlyRevenue || 0))
    })
  }, [])

  const fcfa = n => new Intl.NumberFormat('fr-FR').format(n || 0)
  const donutData = [
    { value: stats?.activeSubscriptions || 0 },
    { value: Math.max((stats?.totalMembers || 0) - (stats?.activeSubscriptions || 0), 1) }
  ]

  const payBreakdown = [
    { label: 'Actifs', val: stats?.activeSubscriptions || 0, color: '#F59E0B' },
    { label: 'Expirent bientôt', val: stats?.expiringSoon || 0, color: '#EF4444' },
    { label: 'Total membres', val: stats?.totalMembers || 0, color: '#3B82F6' },
  ]

  return (
    <div className="p-4 max-w-[1400px] mx-auto">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-5 px-1">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <Calendar size={12} style={{ color: '#F59E0B' }}/>
            <span className="text-white text-xs font-medium">{dateStr}</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl text-xs" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', color: '#F59E0B' }}>
            {gym?.name}
          </div>
        </div>
        <button onClick={() => navigate('/members')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-[#0F172A]"
          style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)' }}>
          <Plus size={12}/> Nouveau membre
        </button>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-12 gap-3">

        {/* Total Revenue - large card */}
        <div className="col-span-12 xl:col-span-5 rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="flex items-start justify-between mb-1">
            <div>
              <p className="text-white text-sm font-semibold">Revenus totaux</p>
              <p className="text-[#3D4B5C] text-[10px]">Revenus générés ce mois</p>
            </div>
            <div className="px-2 py-1 rounded-lg text-[10px] font-medium text-[#94A3B8]"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.06)' }}>
              Ce mois ↓
            </div>
          </div>
          <div className="flex items-end gap-2 mb-4 mt-3">
            <span className="text-white font-black text-4xl">{stats ? fcfa(stats.monthlyRevenue) : '—'}</span>
            <span className="text-[#94A3B8] text-sm mb-1">FCFA</span>
            <div className="flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-md mb-1 text-emerald-400"
              style={{ background: 'rgba(16,185,129,0.1)' }}>
              <ArrowUpRight size={10}/>5%
            </div>
          </div>
          <ResponsiveContainer width="100%" height={100}>
            <BarChart data={bars} barGap={3}>
              <XAxis dataKey="mois" tick={{ fill: '#3D4B5C', fontSize: 9 }} axisLine={false} tickLine={false} />
              <Tooltip content={<RevTooltip />} cursor={false} />
              <Bar dataKey="val" shape={<CustomBar />} maxBarSize={28}>
                {bars.map((b, i) => <Cell key={i} fill={b.isLast ? '#F59E0B' : 'rgba(255,255,255,0.06)'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly recurring - donut */}
        <div className="col-span-6 xl:col-span-3 rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <p className="text-white text-xs font-semibold">Abonnements actifs</p>
          <p className="text-[#3D4B5C] text-[10px] mt-0.5">Membres avec abonnement en cours</p>
          <div className="flex items-center gap-3 mt-3">
            <div className="flex-1">
              <p className="text-white font-black text-3xl">{stats?.activeSubscriptions ?? '—'}</p>
              <p className="text-[#3D4B5C] text-[10px] mt-1">sur {stats?.totalMembers ?? '—'} membres</p>
            </div>
            <ResponsiveContainer width={70} height={70}>
              <PieChart>
                <Pie data={donutData} cx="50%" cy="50%" innerRadius={22} outerRadius={33} startAngle={90} endAngle={-270} dataKey="value" strokeWidth={0}>
                  <Cell fill="#F59E0B" />
                  <Cell fill="rgba(255,255,255,0.05)" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expirent bientôt */}
        <div className="col-span-6 xl:col-span-2 rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <p className="text-white text-xs font-semibold">Expirent bientôt</p>
          <p className="text-[#3D4B5C] text-[10px] mt-0.5">Dans les 14 prochains jours</p>
          <p className="text-white font-black text-4xl mt-4">{stats?.expiringSoon ?? '—'}</p>
          <div className="flex items-center gap-1 mt-2">
            <div className="w-1.5 h-1.5 rounded-full bg-red-400"/>
            <p className="text-red-400 text-[10px]">Relancer</p>
          </div>
        </div>

        {/* Check-ins */}
        <div className="col-span-6 xl:col-span-2 rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <p className="text-white text-xs font-semibold">Total membres</p>
          <p className="text-[#3D4B5C] text-[10px] mt-0.5">Inscrits sur FitManager</p>
          <p className="text-white font-black text-4xl mt-4">{stats?.totalMembers ?? '—'}</p>
          <div className="flex items-center gap-1 mt-2">
            <ArrowUpRight size={10} className="text-emerald-400"/>
            <p className="text-emerald-400 text-[10px]">+12% ce mois</p>
          </div>
        </div>

        {/* Follow up */}
        <div className="col-span-12 xl:col-span-4 rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-white text-xs font-semibold">Suivi à faire</p>
              <p className="text-[#3D4B5C] text-[10px]">Abonnements qui expirent bientôt</p>
            </div>
            {expiring.length > 0 && (
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-[#0F172A]"
                style={{ background: '#F59E0B' }}>{expiring.length}</span>
            )}
          </div>
          {expiring.length === 0 ? (
            <p className="text-[#3D4B5C] text-xs text-center py-4">Aucun abonnement expirant ✓</p>
          ) : expiring.slice(0, 4).map(sub => {
            const days = Math.ceil((new Date(sub.end_date) - new Date()) / (1000*60*60*24))
            return (
              <div key={sub.id} className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0"
                    style={{ background: 'rgba(245,158,11,0.15)', color: '#F59E0B' }}>
                    {sub.full_name?.charAt(0)}
                  </div>
                  <div>
                    <p className="text-white text-[11px] font-medium leading-tight">{sub.full_name}</p>
                    <p className="text-[#3D4B5C] text-[9px]">{sub.phone}</p>
                  </div>
                </div>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md"
                  style={{ background: days <= 3 ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)', color: days <= 3 ? '#F87171' : '#FBBF24' }}>
                  {days}j
                </span>
              </div>
            )
          })}
        </div>

        {/* New members */}
        <div className="col-span-12 xl:col-span-4 rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-white text-xs font-semibold">Membres récents</p>
              <p className="text-[#3D4B5C] text-[10px]">Derniers inscrits</p>
            </div>
            <button onClick={() => navigate('/members')} className="text-[10px] font-semibold" style={{ color: '#F59E0B' }}>
              Voir tous →
            </button>
          </div>
          {recentMembers.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-[#3D4B5C] text-xs">Aucun membre</p>
              <button onClick={() => navigate('/members')} className="text-[10px] font-bold mt-1" style={{ color: '#F59E0B' }}>
                Ajouter →
              </button>
            </div>
          ) : recentMembers.map((m, i) => (
            <div key={m.id} className="flex items-center justify-between py-2" style={{ borderBottom: i < recentMembers.length-1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0"
                  style={{ background: 'rgba(59,130,246,0.15)', color: '#60A5FA' }}>
                  {m.full_name?.charAt(0)}
                </div>
                <div>
                  <p className="text-white text-[11px] font-medium">{m.full_name}</p>
                  <p className="text-[#3D4B5C] text-[9px]">{m.phone || '—'}</p>
                </div>
              </div>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md`}
                style={{
                  background: m.subscriptionStatus === 'active' ? 'rgba(16,185,129,0.1)' : m.subscriptionStatus === 'expiring_soon' ? 'rgba(245,158,11,0.1)' : 'rgba(100,116,139,0.1)',
                  color: m.subscriptionStatus === 'active' ? '#34D399' : m.subscriptionStatus === 'expiring_soon' ? '#FBBF24' : '#94A3B8'
                }}>
                {m.subscriptionStatus === 'active' ? 'Actif' : m.subscriptionStatus === 'expiring_soon' ? 'Bientôt' : 'Inactif'}
              </span>
            </div>
          ))}
        </div>

        {/* Revenue details */}
        <div className="col-span-12 xl:col-span-4 rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <p className="text-white text-xs font-semibold mb-0.5">Détails des revenus</p>
          <p className="text-[#3D4B5C] text-[10px] mb-4">Analyse de la performance financière</p>
          {payBreakdown.map(({ label, val, color }) => (
            <div key={label} className="flex items-center justify-between py-2.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-8 rounded-full" style={{ background: color }}/>
                <p className="text-white text-xs font-medium">{label}</p>
              </div>
              <p className="text-white font-black text-sm">{val}</p>
            </div>
          ))}
          <div className="flex items-center justify-between pt-3">
            <p className="text-[#94A3B8] text-xs font-semibold">Revenus du mois</p>
            <p style={{ color: '#F59E0B' }} className="font-black text-sm">{stats ? fcfa(stats.monthlyRevenue) : '—'} F</p>
          </div>
        </div>

      </div>
    </div>
  )
}
