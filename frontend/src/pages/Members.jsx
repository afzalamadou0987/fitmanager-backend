import { useState, useEffect } from 'react'
import { membersAPI, subscriptionsAPI, plansAPI } from '../services/api'
import { Search, Plus, X, QrCode, ChevronRight, RefreshCw } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'

/* ─── Helpers ─── */
function StatusBadge({ status, daysLeft }) {
  const cfg = {
    active: 'bg-green-500/20 text-green-400',
    expiring_soon: 'bg-orange-500/20 text-orange-400',
    expired: 'bg-red-500/20 text-red-400',
    none: 'bg-[#334155] text-[#64748B]'
  }
  const label = status === 'expiring_soon' ? `Expire dans ${daysLeft}j`
    : status === 'active' ? 'Actif'
    : status === 'expired' ? 'Expiré'
    : 'Sans abonnement'
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg[status] || cfg.none}`}>{label}</span>
}

function Input({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <div>
      <label className="block text-xs text-[#94A3B8] mb-1.5">{label}</label>
      <input
        type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full bg-[#0F172A] text-white border border-[#334155] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#F59E0B] transition-colors"
      />
    </div>
  )
}

function PaymentPicker({ value, onChange }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {[['cash', '💵 Cash'], ['flooz', '📱 Flooz'], ['tmoney', '📱 T-Money']].map(([m, lbl]) => (
        <button key={m} type="button" onClick={() => onChange(m)}
          className={`py-2 rounded-lg text-xs font-medium transition-all ${value === m ? 'bg-[#F59E0B] text-[#0F172A]' : 'bg-[#0F172A] text-[#94A3B8] border border-[#334155]'}`}>
          {lbl}
        </button>
      ))}
    </div>
  )
}

/* ─── Modal : ajouter membre ─── */
function AddMemberModal({ plans, onClose, onSave }) {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({ fullName: '', phone: '', email: '' })
  const [subForm, setSubForm] = useState({ planId: '', paymentMethod: 'cash' })
  const [newMember, setNewMember] = useState(null)
  const [loading, setLoading] = useState(false)

  const createMember = async () => {
    if (!form.fullName.trim()) return
    setLoading(true)
    try {
      const res = await membersAPI.create(form)
      setNewMember(res.data)
      setStep(2)
    } catch (e) { alert(e.response?.data?.error || 'Erreur') }
    finally { setLoading(false) }
  }

  const addSub = async () => {
    if (!subForm.planId) { onSave(); return }
    setLoading(true)
    try {
      await subscriptionsAPI.create({ memberId: newMember.id, ...subForm })
      onSave()
    } catch (e) { alert(e.response?.data?.error || 'Erreur') }
    finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1E293B] rounded-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#334155]">
          <h2 className="font-semibold text-white text-sm">{step === 1 ? 'Nouveau membre' : 'Abonnement'}</h2>
          <button onClick={onClose} className="text-[#94A3B8] hover:text-white"><X size={18} /></button>
        </div>
        <div className="p-6 space-y-4">
          {step === 1 ? (
            <>
              <Input label="Nom complet *" value={form.fullName} onChange={v => setForm({ ...form, fullName: v })} placeholder="Kossi Agbeko" />
              <Input label="Téléphone" value={form.phone} onChange={v => setForm({ ...form, phone: v })} placeholder="90 12 34 56" />
              <Input label="Email (optionnel)" value={form.email} onChange={v => setForm({ ...form, email: v })} placeholder="email@..." type="email" />
              <button onClick={createMember} disabled={loading || !form.fullName.trim()}
                className="w-full bg-[#F59E0B] hover:bg-[#D97706] disabled:opacity-40 text-[#0F172A] font-bold py-3 rounded-xl text-sm mt-1">
                {loading ? 'Création...' : 'Créer le membre →'}
              </button>
            </>
          ) : (
            <>
              <p className="text-green-400 text-sm">✓ {newMember?.full_name} créé</p>
              <div>
                <label className="block text-xs text-[#94A3B8] mb-1.5">Plan d'abonnement</label>
                <select value={subForm.planId} onChange={e => setSubForm({ ...subForm, planId: e.target.value })}
                  className="w-full bg-[#0F172A] text-white border border-[#334155] rounded-xl px-4 py-2.5 text-sm">
                  <option value="">-- Pas d'abonnement maintenant --</option>
                  {plans.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} · {new Intl.NumberFormat('fr-FR').format(p.price)} FCFA ({p.duration_days}j)
                    </option>
                  ))}
                </select>
              </div>
              {subForm.planId && (
                <div>
                  <label className="block text-xs text-[#94A3B8] mb-1.5">Mode de paiement</label>
                  <PaymentPicker value={subForm.paymentMethod} onChange={v => setSubForm({ ...subForm, paymentMethod: v })} />
                </div>
              )}
              <button onClick={addSub} disabled={loading}
                className="w-full bg-[#F59E0B] hover:bg-[#D97706] disabled:opacity-40 text-[#0F172A] font-bold py-3 rounded-xl text-sm">
                {loading ? '...' : subForm.planId ? 'Confirmer l\'abonnement' : 'Terminer sans abonnement'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─── Modal : détail membre ─── */
function MemberDetailModal({ member, plans, onClose, onSave }) {
  const [showQR, setShowQR] = useState(false)
  const [showRenew, setShowRenew] = useState(false)
  const [planId, setPlanId] = useState('')
  const [payMethod, setPayMethod] = useState('cash')
  const [loading, setLoading] = useState(false)

  const handleRenew = async () => {
    if (!planId) return
    setLoading(true)
    try {
      await subscriptionsAPI.create({ memberId: member.id, planId, paymentMethod: payMethod })
      onSave()
    } catch (e) { alert(e.response?.data?.error || 'Erreur') }
    finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1E293B] rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#334155] sticky top-0 bg-[#1E293B]">
          <div>
            <h2 className="font-semibold text-white text-sm">{member.full_name}</h2>
            <p className="text-[#94A3B8] text-xs">{member.phone || 'Pas de téléphone'}</p>
          </div>
          <button onClick={onClose} className="text-[#94A3B8] hover:text-white"><X size={18} /></button>
        </div>

        <div className="p-6 space-y-4">
          {/* Statut abonnement */}
          <div className="bg-[#0F172A] rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-[#94A3B8] text-xs">Statut</p>
              {member.currentSubscription ? (
                <>
                  <p className="text-white text-sm font-medium mt-0.5">{member.currentSubscription.plan?.name}</p>
                  <p className="text-[#94A3B8] text-xs mt-0.5">
                    Expire le {new Date(member.currentSubscription.end_date).toLocaleDateString('fr-FR')}
                    {member.daysLeft > 0 ? ` · ${member.daysLeft}j restants` : ''}
                  </p>
                </>
              ) : (
                <p className="text-[#94A3B8] text-sm mt-0.5">Aucun abonnement actif</p>
              )}
            </div>
            <StatusBadge status={member.subscriptionStatus} daysLeft={member.daysLeft} />
          </div>

          {/* QR Code */}
          <button onClick={() => setShowQR(!showQR)}
            className="flex items-center gap-2 text-[#94A3B8] hover:text-white text-xs transition-colors">
            <QrCode size={14} />
            {showQR ? 'Masquer le QR code' : 'Afficher le QR code d\'entrée'}
          </button>

          {showQR && (
            <div className="flex justify-center bg-white p-5 rounded-xl">
              <QRCodeSVG value={member.qr_code} size={160} />
            </div>
          )}

          {/* Renouvellement */}
          {!showRenew ? (
            <button onClick={() => setShowRenew(true)}
              className="w-full flex items-center justify-center gap-2 bg-[#F59E0B] hover:bg-[#D97706] text-[#0F172A] font-bold py-3 rounded-xl text-sm">
              <RefreshCw size={15} />
              Renouveler l'abonnement
            </button>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-[#94A3B8] mb-1.5">Choisir un plan</label>
                <select value={planId} onChange={e => setPlanId(e.target.value)}
                  className="w-full bg-[#0F172A] text-white border border-[#334155] rounded-xl px-4 py-2.5 text-sm">
                  <option value="">-- Sélectionner --</option>
                  {plans.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} · {new Intl.NumberFormat('fr-FR').format(p.price)} FCFA ({p.duration_days}j)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-[#94A3B8] mb-1.5">Mode de paiement</label>
                <PaymentPicker value={payMethod} onChange={setPayMethod} />
              </div>
              <button onClick={handleRenew} disabled={!planId || loading}
                className="w-full bg-[#F59E0B] hover:bg-[#D97706] disabled:opacity-40 text-[#0F172A] font-bold py-3 rounded-xl text-sm">
                {loading ? '...' : 'Confirmer le renouvellement'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─── Page principale ─── */
export default function Members() {
  const [members, setMembers] = useState([])
  const [plans, setPlans] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [selected, setSelected] = useState(null)

  const load = async () => {
    setLoading(true)
    const [mRes, pRes] = await Promise.all([
      membersAPI.getAll(search ? { search } : {}),
      plansAPI.getAll()
    ])
    setMembers(mRes.data.members)
    setPlans(pRes.data)
    setLoading(false)
  }

  useEffect(() => { load() }, [search])

  return (
    <div className="p-7">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Membres</h1>
          <p className="text-[#94A3B8] text-xs mt-0.5">{members.length} membre{members.length > 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 bg-[#F59E0B] hover:bg-[#D97706] text-[#0F172A] font-bold px-4 py-2.5 rounded-xl text-sm">
          <Plus size={16} /> Nouveau membre
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#64748B]" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher nom ou téléphone..."
          className="w-full bg-[#1E293B] text-white border border-[#334155] rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#F59E0B]" />
      </div>

      {/* List */}
      <div className="bg-[#1E293B] rounded-2xl overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-[#94A3B8] text-sm">Chargement...</div>
        ) : members.length === 0 ? (
          <div className="py-12 text-center text-[#94A3B8] text-sm">
            {search ? 'Aucun résultat' : 'Aucun membre pour l\'instant'}
          </div>
        ) : members.map((m, i) => (
          <div key={m.id} onClick={() => setSelected(m)}
            className={`flex items-center justify-between px-5 py-3.5 hover:bg-[#0F172A]/40 cursor-pointer transition-colors ${i < members.length - 1 ? 'border-b border-[#334155]/50' : ''}`}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#F59E0B]/15 flex items-center justify-center flex-shrink-0">
                <span className="text-[#F59E0B] font-bold text-sm">{m.full_name?.charAt(0)?.toUpperCase()}</span>
              </div>
              <div>
                <p className="text-white text-sm font-medium leading-tight">{m.full_name}</p>
                <p className="text-[#64748B] text-xs">{m.phone || '—'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={m.subscriptionStatus} daysLeft={m.daysLeft} />
              <ChevronRight size={14} className="text-[#64748B]" />
            </div>
          </div>
        ))}
      </div>

      {showAdd && <AddMemberModal plans={plans} onClose={() => setShowAdd(false)} onSave={() => { setShowAdd(false); load() }} />}
      {selected && <MemberDetailModal member={selected} plans={plans} onClose={() => setSelected(null)} onSave={() => { setSelected(null); load() }} />}
    </div>
  )
}
