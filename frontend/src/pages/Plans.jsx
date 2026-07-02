import { useState, useEffect } from 'react'
import { plansAPI } from '../services/api'
import { Plus, X, Edit2, Trash2 } from 'lucide-react'

const PRESETS = [{ label: '1 mois', days: 30 }, { label: '3 mois', days: 90 }, { label: '6 mois', days: 180 }, { label: '1 an', days: 365 }]

function PlanModal({ plan, onClose, onSave }) {
  const [form, setForm] = useState({
    name: plan?.name || '',
    durationDays: plan?.duration_days || 30,
    price: plan?.price || '',
    description: plan?.description || ''
  })
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    if (!form.name || !form.price) return
    setLoading(true)
    try {
      plan ? await plansAPI.update(plan.id, form) : await plansAPI.create(form)
      onSave()
    } catch (e) { alert(e.response?.data?.error || 'Erreur') }
    finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1E293B] rounded-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#334155]">
          <h2 className="font-semibold text-white text-sm">{plan ? 'Modifier le plan' : 'Nouveau plan'}</h2>
          <button onClick={onClose} className="text-[#94A3B8] hover:text-white"><X size={18} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs text-[#94A3B8] mb-1.5">Nom du plan *</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="ex: Mensuel Standard"
              className="w-full bg-[#0F172A] text-white border border-[#334155] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#F59E0B]" />
          </div>

          <div>
            <label className="block text-xs text-[#94A3B8] mb-1.5">Durée</label>
            <div className="grid grid-cols-4 gap-2 mb-2">
              {PRESETS.map(p => (
                <button key={p.days} type="button" onClick={() => setForm({ ...form, durationDays: p.days })}
                  className={`py-1.5 rounded-lg text-xs font-medium transition-all ${form.durationDays === p.days ? 'bg-[#F59E0B] text-[#0F172A]' : 'bg-[#0F172A] text-[#94A3B8] border border-[#334155]'}`}>
                  {p.label}
                </button>
              ))}
            </div>
            <input type="number" value={form.durationDays} onChange={e => setForm({ ...form, durationDays: parseInt(e.target.value) || 30 })}
              placeholder="Jours"
              className="w-full bg-[#0F172A] text-white border border-[#334155] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#F59E0B]" />
          </div>

          <div>
            <label className="block text-xs text-[#94A3B8] mb-1.5">Prix (FCFA) *</label>
            <input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })}
              placeholder="ex: 15000"
              className="w-full bg-[#0F172A] text-white border border-[#334155] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#F59E0B]" />
          </div>

          <div>
            <label className="block text-xs text-[#94A3B8] mb-1.5">Description (optionnel)</label>
            <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="ex: Accès illimité salle..."
              className="w-full bg-[#0F172A] text-white border border-[#334155] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#F59E0B]" />
          </div>

          <button onClick={handleSave} disabled={loading || !form.name || !form.price}
            className="w-full bg-[#F59E0B] hover:bg-[#D97706] disabled:opacity-40 text-[#0F172A] font-bold py-3 rounded-xl text-sm">
            {loading ? '...' : plan ? 'Enregistrer' : 'Créer le plan'}
          </button>
        </div>
      </div>
    </div>
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
    await plansAPI.remove(id)
    load()
  }

  return (
    <div className="p-7">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Plans d'abonnement</h1>
          <p className="text-[#94A3B8] text-xs mt-0.5">{plans.length} plan{plans.length > 1 ? 's' : ''} actif{plans.length > 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => { setEditPlan(null); setShowModal(true) }}
          className="flex items-center gap-1.5 bg-[#F59E0B] hover:bg-[#D97706] text-[#0F172A] font-bold px-4 py-2.5 rounded-xl text-sm">
          <Plus size={16} /> Nouveau plan
        </button>
      </div>

      {plans.length === 0 ? (
        <div className="bg-[#1E293B] rounded-2xl py-16 text-center text-[#94A3B8] text-sm">
          Aucun plan. Créez votre premier plan d'abonnement !
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {plans.map(plan => (
            <div key={plan.id} className="bg-[#1E293B] rounded-2xl p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-white font-semibold">{plan.name}</h3>
                  <p className="text-[#94A3B8] text-xs mt-0.5">{plan.duration_days} jours</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setEditPlan(plan); setShowModal(true) }}
                    className="text-[#64748B] hover:text-white transition-colors">
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => handleDelete(plan.id)}
                    className="text-[#64748B] hover:text-red-400 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <p className="text-[#F59E0B] text-2xl font-bold">
                {new Intl.NumberFormat('fr-FR').format(plan.price)}
                <span className="text-[#94A3B8] text-sm font-normal ml-1">FCFA</span>
              </p>
              {plan.description && <p className="text-[#64748B] text-xs mt-2">{plan.description}</p>}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <PlanModal plan={editPlan} onClose={() => setShowModal(false)} onSave={() => { setShowModal(false); load() }} />
      )}
    </div>
  )
}
