import { useState, useEffect } from 'react'
import { membersAPI, subscriptionsAPI, plansAPI } from '../services/api'
import { Search, Plus, X, QrCode, RefreshCw, ChevronRight, User } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'

function Badge({ status, daysLeft }) {
  const cfg = {
    active: { label: 'Actif', bg: 'rgba(16,185,129,0.15)', color: '#34D399', border: 'rgba(16,185,129,0.3)' },
    expiring_soon: { label: `${daysLeft}j restants`, bg: 'rgba(245,158,11,0.15)', color: '#FBBF24', border: 'rgba(245,158,11,0.3)' },
    expired: { label: 'Expiré', bg: 'rgba(239,68,68,0.15)', color: '#F87171', border: 'rgba(239,68,68,0.3)' },
    none: { label: 'Sans abonnement', bg: 'rgba(100,116,139,0.15)', color: '#94A3B8', border: 'rgba(100,116,139,0.2)' }
  }
  const c = cfg[status] || cfg.none
  return (
    <span className="text-[10px] font-bold px-2 py-1 rounded-full"
      style={{ background: c.bg, color: c.color, border: `1px solid ${c.border}` }}>
      {c.label}
    </span>
  )
}

function PaymentPicker({ value, onChange }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {[['cash', '💵 Cash'], ['flooz', '📱 Flooz'], ['tmoney', '📱 T-Money']].map(([m, lbl]) => (
        <button key={m} type="button" onClick={() => onChange(m)}
          className="py-2 rounded-xl text-xs font-medium transition-all"
          style={{
            background: value === m ? 'linear-gradient(135deg, #F59E0B, #D97706)' : 'rgba(15,23,42,0.8)',
            color: value === m ? '#0F172A' : '#94A3B8',
            border: value === m ? 'none' : '1px solid rgba(255,255,255,0.08)'
          }}>
          {lbl}
        </button>
      ))}
    </div>
  )
}

function Input({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <div>
      {label && <label className="block text-xs text-[#64748B] mb-1.5 font-semibold uppercase tracking-wider">{label}</label>}
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder || ''}
        className="w-full text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-all"
        style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.08)' }}
        onFocus={e => e.target.style.borderColor = 'rgba(245,158,11,0.5)'}
        onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'} />
    </div>
  )
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden" style={{ background: '#0D1525', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <h2 className="font-bold text-white text-sm">{title}</h2>
          <button onClick={onClose} className="text-[#64748B] hover:text-white transition-colors"><X size={18}/></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

function AddMemberModal({ plans, onClose, onSave }) {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({ fullName: '', phone: '', email: '' })
  const [subForm, setSubForm] = useState({ planId: '', paymentMethod: 'cash' })
  const [newMember, setNewMember] = useState(null)
  const [loading, setLoading] = useState(false)

  const createMember = async () => {
    if (!form.fullName.trim()) return
    setLoading(true)
    try { const res = await membersAPI.create(form); setNewMember(res.data); setStep(2) }
    catch (e) { alert(e.response?.data?.error || 'Erreur') }
    finally { setLoading(false) }
  }

  const addSub = async () => {
    if (!subForm.planId) { onSave(); return }
    setLoading(true)
    try { await subscriptionsAPI.create({ memberId: newMember.id, ...subForm }); onSave() }
    catch (e) { alert(e.response?.data?.error || 'Erreur') }
    finally { setLoading(false) }
  }

  return (
    <Modal title={step === 1 ? 'Nouveau membre' : 'Abonnement'} onClose={onClose}>
      {step === 1 ? (
        <div className="space-y-4">
          <Input label="Nom complet *" value={form.fullName} onChange={v => setForm({...form, fullName: v})} />
          <Input label="Téléphone" value={form.phone} onChange={v => setForm({...form, phone: v})} />
          <Input label="Email" value={form.email} onChange={v => setForm({...form, email: v})} type="email" />
          <button onClick={createMember} disabled={loading || !form.fullName.trim()}
            className="w-full py-3 rounded-xl font-bold text-sm text-[#0F172A] transition-all disabled:opacity-40 mt-2"
            style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)' }}>
            {loading ? 'Création...' : 'Continuer →'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-emerald-400 text-sm">✓ {newMember?.full_name} créé</p>
          <div>
            <label className="block text-xs text-[#64748B] mb-1.5 font-semibold uppercase tracking-wider">Plan</label>
            <select value={subForm.planId} onChange={e => setSubForm({...subForm, planId: e.target.value})}
              className="w-full text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none"
              style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <option value="">-- Sans abonnement --</option>
              {plans.map(p => <option key={p.id} value={p.id}>{p.name} · {new Intl.NumberFormat('fr-FR').format(p.price)} FCFA</option>)}
            </select>
          </div>
          {subForm.planId && (
            <div>
              <label className="block text-xs text-[#64748B] mb-1.5 font-semibold uppercase tracking-wider">Paiement</label>
              <PaymentPicker value={subForm.paymentMethod} onChange={v => setSubForm({...subForm, paymentMethod: v})} />
            </div>
          )}
          <button onClick={addSub} disabled={loading}
            className="w-full py-3 rounded-xl font-bold text-sm text-[#0F172A] disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)' }}>
            {loading ? '...' : subForm.planId ? 'Confirmer' : 'Terminer sans abonnement'}
          </button>
        </div>
      )}
    </Modal>
  )
}

function MemberModal({ member, plans, onClose, onSave }) {
  const [showQR, setShowQR] = useState(false)
  const [showRenew, setShowRenew] = useState(false)
  const [planId, setPlanId] = useState('')
  const [payMethod, setPayMethod] = useState('cash')
  const [loading, setLoading] = useState(false)

  const handleRenew = async () => {
    if (!planId) return
    setLoading(true)
    try { await subscriptionsAPI.create({ memberId: member.id, planId, paymentMethod: payMethod }); onSave() }
    catch (e) { alert(e.response?.data?.error || 'Erreur') }
    finally { setLoading(false) }
  }

  return (
    <Modal title={member.full_name} onClose={onClose}>
      <div className="space-y-4">
        <div className="flex items-center gap-4 p-4 rounded-xl" style={{ background: 'rgba(15,23,42,0.6)' }}>
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-black"
            style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)', color: '#0F172A' }}>
            {member.full_name?.charAt(0)}
          </div>
          <div className="flex-1">
            <p className="text-white font-bold">{member.full_name}</p>
            <p className="text-[#64748B] text-xs">{member.phone || '—'}</p>
          </div>
          <Badge status={member.subscriptionStatus} daysLeft={member.daysLeft} />
        </div>

        {member.currentSubscription && (
          <div className="p-4 rounded-xl" style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <p className="text-[#64748B] text-xs mb-1">Abonnement actuel</p>
            <p className="text-white font-semibold text-sm">{member.currentSubscription.plan?.name}</p>
            <p className="text-[#64748B] text-xs mt-1">
              Expire le {new Date(member.currentSubscription.end_date).toLocaleDateString('fr-FR')}
            </p>
          </div>
        )}

        <button onClick={() => setShowQR(!showQR)}
          className="flex items-center gap-2 text-xs transition-colors" style={{ color: showQR ? '#F59E0B' : '#64748B' }}>
          <QrCode size={14}/> {showQR ? 'Masquer QR code' : 'Afficher QR code'}
        </button>

        {showQR && (
          <div className="flex justify-center p-5 rounded-xl bg-white">
            <QRCodeSVG value={member.qr_code} size={160} />
          </div>
        )}

        {!showRenew ? (
          <button onClick={() => setShowRenew(true)}
            className="w-full py-3 rounded-xl font-bold text-sm text-[#0F172A] flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)' }}>
            <RefreshCw size={15}/> Renouveler l'abonnement
          </button>
        ) : (
          <div className="space-y-3">
            <select value={planId} onChange={e => setPlanId(e.target.value)}
              className="w-full text-white rounded-xl px-4 py-2.5 text-sm"
              style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <option value="">-- Choisir un plan --</option>
              {plans.map(p => <option key={p.id} value={p.id}>{p.name} · {new Intl.NumberFormat('fr-FR').format(p.price)} FCFA</option>)}
            </select>
            <PaymentPicker value={payMethod} onChange={setPayMethod} />
            <button onClick={handleRenew} disabled={!planId || loading}
              className="w-full py-3 rounded-xl font-bold text-sm text-[#0F172A] disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)' }}>
              {loading ? '...' : 'Confirmer'}
            </button>
          </div>
        )}
      </div>
    </Modal>
  )
}

export default function Members() {
  const [members, setMembers] = useState([])
  const [plans, setPlans] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [selected, setSelected] = useState(null)

  const load = async () => {
    setLoading(true)
    const [mRes, pRes] = await Promise.all([membersAPI.getAll(search ? { search } : {}), plansAPI.getAll()])
    setMembers(mRes.data.members); setPlans(pRes.data); setLoading(false)
  }

  useEffect(() => { load() }, [search])

  const activeCount = members.filter(m => m.subscriptionStatus === 'active').length
  const expiringCount = members.filter(m => m.subscriptionStatus === 'expiring_soon').length

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white">Membres</h1>
          <p className="text-[#475569] text-xs mt-1">
            {members.length} membres · {activeCount} actifs · {expiringCount} expirent bientôt
          </p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-[#0F172A]"
          style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)', boxShadow: '0 0 20px rgba(245,158,11,0.25)' }}>
          <Plus size={16}/> Nouveau membre
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: '#475569' }} />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder=""
          className="w-full text-white rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none transition-all"
          style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.06)' }}
          onFocus={e => e.target.style.borderColor = 'rgba(245,158,11,0.4)'}
          onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.06)'} />
      </div>

      {/* List */}
      <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.05)' }}>
        {loading ? (
          <div className="py-16 text-center text-[#475569] text-sm">Chargement...</div>
        ) : members.length === 0 ? (
          <div className="py-16 text-center">
            <User size={40} className="mx-auto mb-3 text-[#1E293B]" />
            <p className="text-[#475569] text-sm">{search ? 'Aucun résultat' : 'Aucun membre'}</p>
          </div>
        ) : members.map((m, i) => (
          <div key={m.id} onClick={() => setSelected(m)}
            className="flex items-center justify-between px-5 py-4 cursor-pointer transition-all hover:bg-white/5"
            style={{ borderBottom: i < members.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center font-black text-sm flex-shrink-0"
                style={{ background: 'rgba(245,158,11,0.12)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.2)' }}>
                {m.full_name?.charAt(0)?.toUpperCase()}
              </div>
              <div>
                <p className="text-white font-semibold text-sm">{m.full_name}</p>
                <p className="text-[#475569] text-xs">{m.phone || '—'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge status={m.subscriptionStatus} daysLeft={m.daysLeft} />
              <ChevronRight size={14} style={{ color: '#334155' }} />
            </div>
          </div>
        ))}
      </div>

      {showAdd && <AddMemberModal plans={plans} onClose={() => setShowAdd(false)} onSave={() => { setShowAdd(false); load() }} />}
      {selected && <MemberModal member={selected} plans={plans} onClose={() => setSelected(null)} onSave={() => { setSelected(null); load() }} />}
    </div>
  )
}
