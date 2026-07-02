const express = require('express');
const supabase = require('../config/supabase');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

router.use(authMiddleware);

// POST /api/subscriptions - Créer / renouveler un abonnement
router.post('/', async (req, res) => {
  const { gymId, id: managerId } = req.manager;
  const { memberId, planId, startDate, paymentMethod, paymentRef } = req.body;

  if (!memberId || !planId) {
    return res.status(400).json({ error: 'memberId et planId sont requis' });
  }

  try {
    // Récupérer le plan pour calculer la date de fin et le montant
    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', planId)
      .eq('gym_id', gymId)
      .single();

    if (planError || !plan) {
      return res.status(404).json({ error: 'Plan introuvable' });
    }

    const start = startDate ? new Date(startDate) : new Date();
    const end = new Date(start);
    end.setDate(end.getDate() + plan.duration_days);

    // Expirer les anciens abonnements actifs du membre
    await supabase
      .from('subscriptions')
      .update({ status: 'expired' })
      .eq('member_id', memberId)
      .eq('gym_id', gymId)
      .eq('status', 'active');

    // Créer le nouvel abonnement
    const { data, error } = await supabase
      .from('subscriptions')
      .insert({
        member_id: memberId,
        plan_id: planId,
        gym_id: gymId,
        start_date: start.toISOString().split('T')[0],
        end_date: end.toISOString().split('T')[0],
        status: 'active',
        amount_paid: plan.price,
        payment_method: paymentMethod || 'cash',
        payment_ref: paymentRef || null,
        created_by: managerId
      })
      .select(`
        *,
        subscription_plans(name, duration_days, price),
        members(full_name, phone)
      `)
      .single();

    if (error) throw error;
    res.status(201).json(data);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/subscriptions/expiring - Abonnements qui expirent bientôt
router.get('/expiring', async (req, res) => {
  const { gymId } = req.manager;
  const days = parseInt(req.query.days) || 7;

  try {
    const today = new Date();
    const limitDate = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);

    const { data, error } = await supabase
      .from('subscriptions')
      .select(`
        *,
        members(id, full_name, phone),
        subscription_plans(name)
      `)
      .eq('gym_id', gymId)
      .eq('status', 'active')
      .lte('end_date', limitDate.toISOString().split('T')[0])
      .gte('end_date', today.toISOString().split('T')[0])
      .order('end_date', { ascending: true });

    if (error) throw error;
    res.json(data);

  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/subscriptions/member/:memberId - Historique d'un membre
router.get('/member/:memberId', async (req, res) => {
  const { gymId } = req.manager;

  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select(`
        *,
        subscription_plans(name, duration_days, price)
      `)
      .eq('member_id', req.params.memberId)
      .eq('gym_id', gymId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);

  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PATCH /api/subscriptions/:id/cancel - Annuler un abonnement
router.patch('/:id/cancel', async (req, res) => {
  const { gymId } = req.manager;

  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .update({ status: 'cancelled' })
      .eq('id', req.params.id)
      .eq('gym_id', gymId)
      .select()
      .single();

    if (error || !data) return res.status(404).json({ error: 'Abonnement introuvable' });
    res.json(data);

  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
