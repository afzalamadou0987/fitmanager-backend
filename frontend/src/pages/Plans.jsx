import { useState, useEffect } from 'react'
import { plansAPI } from '../services/api'
import { Plus, X, Edit2, Trash2, CreditCard } from 'lucide-react'

const PRESETS = [{ label: '1 mois', days: 30 }, { label: '3 mois', days: 90 }, { label: '6 mois', days: 180 }, { label: '1 an', days: 365 }]

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden" style={{ background: '#0D1525', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <h2 className="font-bold text-white text-sm">{title}</h2>
          <button onClick={onClose} className="text-[#64748B] hover:text-white"><X size={18}/></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

function PlanModal({ plan, onClose, onSave }) {
  const [form, setForm] = useState({ name: plan?.name || '', durationDays: plan?.duration_days || 30, price: plan?.price || '', description: plan?.description || '' })
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    if (!form.name || !form.price) return
    setLoading(true)
    try { plan ? await plansAPI.update(plan.id, form) : await plansAPI.create(form); onSave() }
    catch (e) { alert(e.response?.data?.error || 'Erreur') }
    finally { setLoading(false) }
  }

  return (
    <Modal title={plan ? 'Modifier le plan' : 'Nouveau plan'} onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="block text-xs text-[#64748B] mb-1.5 font-semibold uppercase tracking-wider">Nom du plan</label>
          <input value={form.name} onChange={e => setForm({...form, name: e.target.value})}
            className="w-full text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none"
            style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.08)' }} />
        </div>

        <div>
          <label className="block text-xs text-[#64748B] mb-1.5 font-semibold uppercase tracking-wider">Durée</label>
          <div className="grid grid-cols-4 gap-2 mb-2">
            {PRESETS.map(p => (
              <button key={p.days} onClick={() => setForm({...form, durationDays: p.days})}
                className="py-1.5 rounded-xl text-xs font-bold transition-all"
                style={{
                  background: form.durationDays === p.days ? 'linear-gradient(135deg, #F59E0B, #D97706)' : 'rgba(15,23,42,0.8)',
                  color: form.durationDays === p.days ? '#0F172A' : '#94A3B8',
                  border: form.durationDays === p.days ? 'none' : '1px solid rgba(255,255,255,0.08)'
                }}>
                {p.label}
              </button>
            ))}
          </div>
          <input type="number" value={form.durationDays} onChange={e => setForm({...form, durationDays: parseInt(e.target.value) || 30})}
            className="w-full text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none"
            style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.08)' }} />
        </div>

        <div>
          <label className="block text-xs text-[#64748B] mb-1.5 font-semibold uppercase tracking-wider">Prix (FCFA)</label>
          <input type="number" value={form.price} onChange={e => setForm({...form, price: e.target.value})}
            className="w-full text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none"
            style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.08)' }} />
        </div>

        <button onClick={handleSave} disabled={loading || !form.name || !form.price}
          className="w-full py-3 rounded-xl font-bold text-sm text-[#0F172A] disabled:opacity-40"
          style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)' }}>
          {loading ? '...' : plan ? 'Enregistrer' : 'Créer le plan'}
        </button>
      </div>
    </Modal>
  )
}

export default function Plans() {
  const [plans, setPlans] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editPlan, setEditPlan] = useState(null)

  const load = () => plansAPI.getAll().then(r => setPlans(r.data))
  useEffect(() => { load() }, [])

  const handleDelete = async id => {
    if (!window.confirm('Désactiver ce plan ?')) return
    await plansAPI.remove(id); load()
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white">Plans d'abonnement</h1>
          <p className="text-[#475569] text-xs mt-1">{plans.length} plan{plans.length > 1 ? 's' : ''} actif{plans.length > 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => { setEditPlan(null); setShowModal(true) }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-[#0F172A]"
          style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)', boxShadow: '0 0 20px rgba(245,158,11,0.25)' }}>
          <Plus size={16}/> Nouveau plan
        </button>
      </div>

      {plans.length === 0 ? (
        <div className="rounded-2xl py-20 text-center" style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <CreditCard size={40} className="mx-auto mb-3" style={{ color: '#1E293B' }} />
          <p className="text-[#475569] text-sm">Aucun plan. Créez votre premier plan !</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {plans.map(plan => (
            <div key={plan.id} className="rounded-2xl p-5 hover:scale-105 transition-all"
              style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-white font-bold">{plan.name}</h3>
                  <p className="text-[#64748B] text-xs mt-0.5">{plan.duration_days} jours</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setEditPlan(plan); setShowModal(true) }}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-[#475569] hover:text-white transition-colors"
                    style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <Edit2 size={13}/>
                  </button>
                  <button onClick={() => handleDelete(plan.id)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-[#475569] hover:text-red-400 transition-colors"
                    style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <Trash2 size={13}/>
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-xl mb-3" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)' }}>
                <p className="text-3xl font-black" style={{ color: '#F59E0B' }}>
                  {new Intl.NumberFormat('fr-FR').format(plan.price)}
                </p>
                <p className="text-[#94A3B8] text-xs">FCFA / {plan.duration_days}j</p>
              </div>

              {plan.description && <p className="text-[#64748B] text-xs">{plan.description}</p>}
            </div>
          ))}
        </div>
      )}

      {showModal && <PlanModal plan={editPlan} onClose={() => setShowModal(false)} onSave={() => { setShowModal(false); load() }} />}
    </div>
  )
}
