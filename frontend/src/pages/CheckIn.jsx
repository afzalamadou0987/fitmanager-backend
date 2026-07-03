import { useState } from 'react'
import { membersAPI } from '../services/api'
import api from '../services/api'
import { Search, QrCode, CheckCircle, XCircle, AlertCircle, ChevronRight } from 'lucide-react'

function StatusCard({ member, onCheckIn, loading, onBack }) {
  const cfg = {
    active: { bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)', icon: <CheckCircle size={36} className="text-emerald-400"/>, label: 'Abonnement actif', color: 'text-emerald-400', canEnter: true },
    expiring_soon: { bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)', icon: <AlertCircle size={36} className="text-amber-400"/>, label: `Expire dans ${member.daysLeft} jours`, color: 'text-amber-400', canEnter: true },
    expired: { bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)', icon: <XCircle size={36} className="text-red-400"/>, label: 'Abonnement expiré', color: 'text-red-400', canEnter: false },
    none: { bg: 'rgba(100,116,139,0.08)', border: 'rgba(100,116,139,0.2)', icon: <XCircle size={36} className="text-slate-400"/>, label: 'Sans abonnement', color: 'text-slate-400', canEnter: false }
  }
  const c = cfg[member.subscriptionStatus] || cfg.none

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="text-xs text-[#475569] hover:text-white flex items-center gap-1">
        ← Retour
      </button>
      <div className="rounded-2xl p-6" style={{ background: c.bg, border: `1px solid ${c.border}` }}>
        <div className="flex items-center gap-4 mb-5">
          <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-black"
            style={{ background: 'rgba(245,158,11,0.15)', color: '#F59E0B' }}>
            {member.fullName?.charAt(0) || member.full_name?.charAt(0)}
          </div>
          <div className="flex-1">
            <p className="text-white font-bold text-lg">{member.fullName || member.full_name}</p>
            <p className="text-[#64748B] text-sm">{member.phone || '—'}</p>
          </div>
          {c.icon}
        </div>

        <div className="rounded-xl py-3 text-center mb-4" style={{ background: 'rgba(0,0,0,0.2)' }}>
          <p className={`font-bold text-lg ${c.color}`}>{c.label}</p>
          {(member.currentSubscription) && (
            <p className="text-[#64748B] text-xs mt-1">
              {member.currentSubscription.planName || member.currentSubscription?.plan?.name || ''}
              {member.currentSubscription.endDate || member.currentSubscription?.end_date
                ? ` · Expire le ${new Date(member.currentSubscription.endDate || member.currentSubscription.end_date).toLocaleDateString('fr-FR')}`
                : ''}
            </p>
          )}
        </div>

        {c.canEnter ? (
          <button onClick={onCheckIn} disabled={loading}
            className="w-full py-3.5 rounded-xl font-bold text-[#0F172A] flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)' }}>
            {loading ? '...' : <><CheckCircle size={18}/> Valider l'entrée</>}
          </button>
        ) : (
          <div className="text-center py-2 text-red-400 text-sm font-semibold">
            ❌ Accès refusé — abonnement invalide
          </div>
        )}
      </div>
    </div>
  )
}

export default function CheckIn() {
  const [tab, setTab] = useState('search')
  const [search, setSearch] = useState('')
  const [qrInput, setQrInput] = useState('')
  const [results, setResults] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(false)
  const [checkLoading, setCheckLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSearch = async () => {
    if (!search.trim()) return
    setLoading(true)
    setResults([])
    try {
      const res = await membersAPI.getAll({ search })
      setResults(res.data.members || [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const handleQRLookup = async () => {
    if (!qrInput.trim()) return
    setLoading(true)
    try {
      const res = await membersAPI.getByQR(qrInput.trim())
      setSelected(res.data)
    } catch {
      alert('QR code introuvable')
    } finally { setLoading(false) }
  }

  const handleCheckIn = async () => {
    if (!selected) return
    setCheckLoading(true)
    try {
      await api.post('/checkins', { memberId: selected.id })
      setSuccess(true)
      setTimeout(() => { setSuccess(false); setSelected(null); setResults([]); setSearch(''); setQrInput('') }, 2500)
    } catch { alert('Erreur check-in') }
    finally { setCheckLoading(false) }
  }

  const selectMember = (m) => {
    setSelected({
      id: m.id,
      fullName: m.full_name,
      phone: m.phone,
      subscriptionStatus: m.subscriptionStatus,
      daysLeft: m.daysLeft,
      currentSubscription: m.currentSubscription ? {
        planName: m.currentSubscription.plan?.name,
        endDate: m.currentSubscription.end_date
      } : null
    })
  }

  if (success) {
    return (
      <div className="p-6 flex items-center justify-center min-h-96">
        <div className="text-center rounded-2xl p-10" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
          <CheckCircle size={56} className="text-emerald-400 mx-auto mb-4"/>
          <p className="text-emerald-400 font-black text-2xl">Entrée validée ✓</p>
          <p className="text-[#64748B] text-sm mt-2">{selected?.fullName}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white">Check-in</h1>
        <p className="text-[#475569] text-xs mt-1">Contrôle d'accès à l'entrée</p>
      </div>

      {selected ? (
        <StatusCard member={selected} onCheckIn={handleCheckIn} loading={checkLoading} onBack={() => setSelected(null)} />
      ) : (
        <>
          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            {[['search', <Search size={14}/>, 'Recherche'], ['qr', <QrCode size={14}/>, 'QR Code']].map(([t, icon, label]) => (
              <button key={t} onClick={() => setTab(t)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                style={{
                  background: tab === t ? 'linear-gradient(135deg, #F59E0B, #D97706)' : 'rgba(255,255,255,0.04)',
                  color: tab === t ? '#0F172A' : '#94A3B8',
                  border: tab === t ? 'none' : '1px solid rgba(255,255,255,0.06)'
                }}>
                {icon} {label}
              </button>
            ))}
          </div>

          {/* Search tab */}
          {tab === 'search' && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#475569]"/>
                  <input value={search} onChange={e => setSearch(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                    placeholder=""
                    className="w-full text-white rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none"
                    style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.08)' }}
                    onFocus={e => e.target.style.borderColor = 'rgba(245,158,11,0.4)'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}/>
                </div>
                <button onClick={handleSearch} disabled={loading}
                  className="px-5 rounded-xl font-bold text-sm text-[#0F172A]"
                  style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)' }}>
                  {loading ? '...' : 'Chercher'}
                </button>
              </div>

              {results.length > 0 && (
                <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  {results.map((m, i) => (
                    <div key={m.id} onClick={() => selectMember(m)}
                      className="flex items-center justify-between px-4 py-3.5 cursor-pointer hover:bg-white/5 transition-colors"
                      style={{ borderBottom: i < results.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
                          style={{ background: 'rgba(245,158,11,0.12)', color: '#F59E0B' }}>
                          {m.full_name?.charAt(0)}
                        </div>
                        <div>
                          <p className="text-white text-sm font-medium">{m.full_name}</p>
                          <p className="text-[#475569] text-xs">{m.phone || '—'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{
                            background: m.subscriptionStatus === 'active' ? 'rgba(16,185,129,0.15)' : m.subscriptionStatus === 'expiring_soon' ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
                            color: m.subscriptionStatus === 'active' ? '#34D399' : m.subscriptionStatus === 'expiring_soon' ? '#FBBF24' : '#F87171'
                          }}>
                          {m.subscriptionStatus === 'active' ? 'Actif' : m.subscriptionStatus === 'expiring_soon' ? `${m.daysLeft}j` : 'Expiré'}
                        </span>
                        <ChevronRight size={14} className="text-[#334155]"/>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {results.length === 0 && search && !loading && (
                <p className="text-center text-[#475569] text-sm py-4">Aucun résultat pour "{search}"</p>
              )}
            </div>
          )}

          {/* QR tab */}
          {tab === 'qr' && (
            <div className="space-y-4">
              <div className="rounded-2xl p-6 text-center" style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <QrCode size={48} className="mx-auto mb-4" style={{ color: '#F59E0B', opacity: 0.6 }}/>
                <p className="text-[#94A3B8] text-sm mb-4">Scannez ou collez le QR code du membre</p>
                <input value={qrInput} onChange={e => setQrInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleQRLookup()}
                  placeholder=""
                  className="w-full text-white rounded-xl px-4 py-3 text-sm focus:outline-none text-center mb-3"
                  style={{ background: 'rgba(5,10,20,0.8)', border: '1px solid rgba(255,255,255,0.08)' }}
                  onFocus={e => e.target.style.borderColor = 'rgba(245,158,11,0.4)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}/>
                <button onClick={handleQRLookup} disabled={loading || !qrInput.trim()}
                  className="w-full py-3 rounded-xl font-bold text-sm text-[#0F172A] disabled:opacity-40"
                  style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)' }}>
                  {loading ? '...' : 'Vérifier le QR code'}
                </button>
              </div>
              <p className="text-center text-[#334155] text-xs">
                Utilisez un lecteur de code-barres externe ou copiez le QR code depuis le profil du membre
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
