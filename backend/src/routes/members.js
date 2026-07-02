const express = require('express');
const supabase = require('../config/supabase');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

router.use(authMiddleware);

// GET /api/members - Liste membres avec statut abonnement
router.get('/', async (req, res) => {
  const { gymId } = req.manager;
  const { search, page = 1, limit = 20 } = req.query;

  try {
    let query = supabase
      .from('members')
      .select(`
        *,
        subscriptions(
          id, status, start_date, end_date, amount_paid, payment_method,
          subscription_plans(name, duration_days, price)
        )
      `)
      .eq('gym_id', gymId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    const from = (page - 1) * limit;
    query = query.range(from, from + Number(limit) - 1);

    const { data, error } = await query;
    if (error) throw error;

    // Calcul du statut abonnement pour chaque membre
    const today = new Date();
    const membersWithStatus = data.map(member => {
      const activeSub = member.subscriptions?.find(s => s.status === 'active');

      if (!activeSub) {
        return { ...member, subscriptionStatus: 'none', daysLeft: 0, currentSubscription: null };
      }

      const endDate = new Date(activeSub.end_date);
      const daysLeft = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));

      let subscriptionStatus = 'active';
      if (daysLeft < 0) subscriptionStatus = 'expired';
      else if (daysLeft <= 7) subscriptionStatus = 'expiring_soon';

      return { ...member, subscriptionStatus, daysLeft, currentSubscription: activeSub };
    });

    res.json({ members: membersWithStatus });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/members/stats/summary - Stats pour le dashboard
router.get('/stats/summary', async (req, res) => {
  const { gymId } = req.manager;

  try {
    const today = new Date();
    const in7Days = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [
      { count: totalMembers },
      { count: activeSubscriptions },
      { count: expiringSoon },
      { data: monthlyPayments }
    ] = await Promise.all([
      supabase.from('members').select('*', { count: 'exact', head: true }).eq('gym_id', gymId).eq('is_active', true),
      supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('gym_id', gymId).eq('status', 'active'),
      supabase.from('subscriptions').select('*', { count: 'exact', head: true })
        .eq('gym_id', gymId).eq('status', 'active')
        .gte('end_date', today.toISOString().split('T')[0])
        .lte('end_date', in7Days.toISOString().split('T')[0]),
      supabase.from('subscriptions').select('amount_paid')
        .eq('gym_id', gymId)
        .gte('created_at', firstDayOfMonth.toISOString())
    ]);

    const monthlyRevenue = monthlyPayments?.reduce((sum, s) => sum + parseFloat(s.amount_paid || 0), 0) || 0;

    res.json({ totalMembers, activeSubscriptions, expiringSoon, monthlyRevenue });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/members/:id - Détail d'un membre
router.get('/:id', async (req, res) => {
  const { gymId } = req.manager;

  try {
    const { data, error } = await supabase
      .from('members')
      .select(`
        *,
        subscriptions(
          id, status, start_date, end_date, amount_paid, payment_method, created_at,
          subscription_plans(name, duration_days, price)
        )
      `)
      .eq('id', req.params.id)
      .eq('gym_id', gymId)
      .single();

    if (error || !data) return res.status(404).json({ error: 'Membre introuvable' });

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/members - Créer un nouveau membre
router.post('/', async (req, res) => {
  const { gymId } = req.manager;
  const { fullName, phone, email, notes, registrationDate } = req.body;

  if (!fullName) return res.status(400).json({ error: 'Le nom complet est requis' });

  try {
    const { data, error } = await supabase
      .from('members')
      .insert({
        gym_id: gymId,
        full_name: fullName,
        phone,
        email,
        notes,
        registration_date: registrationDate || new Date().toISOString().split('T')[0]
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT /api/members/:id - Modifier un membre
router.put('/:id', async (req, res) => {
  const { gymId } = req.manager;
  const { fullName, phone, email, notes, isActive } = req.body;

  try {
    const updateData = {};
    if (fullName !== undefined) updateData.full_name = fullName;
    if (phone !== undefined) updateData.phone = phone;
    if (email !== undefined) updateData.email = email;
    if (notes !== undefined) updateData.notes = notes;
    if (isActive !== undefined) updateData.is_active = isActive;

    const { data, error } = await supabase
      .from('members')
      .update(updateData)
      .eq('id', req.params.id)
      .eq('gym_id', gymId)
      .select()
      .single();

    if (error || !data) return res.status(404).json({ error: 'Membre introuvable' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE /api/members/:id - Soft delete
router.delete('/:id', async (req, res) => {
  const { gymId } = req.manager;

  try {
    const { error } = await supabase
      .from('members')
      .update({ is_active: false })
      .eq('id', req.params.id)
      .eq('gym_id', gymId);

    if (error) throw error;
    res.json({ message: 'Membre désactivé' });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/members/qr/:qrCode - Lookup par QR code (pour le check-in)
router.get('/qr/:qrCode', async (req, res) => {
  const { gymId } = req.manager;

  try {
    const { data, error } = await supabase
      .from('members')
      .select(`
        id, full_name, phone, photo_url, qr_code,
        subscriptions(id, status, start_date, end_date, subscription_plans(name))
      `)
      .eq('qr_code', req.params.qrCode)
      .eq('gym_id', gymId)
      .eq('is_active', true)
      .single();

    if (error || !data) return res.status(404).json({ error: 'Membre introuvable' });

    const activeSub = data.subscriptions?.find(s => s.status === 'active');
    const today = new Date();
    const daysLeft = activeSub
      ? Math.ceil((new Date(activeSub.end_date) - today) / (1000 * 60 * 60 * 24))
      : 0;

    res.json({
      ...data,
      subscriptionStatus: !activeSub ? 'none' : daysLeft < 0 ? 'expired' : daysLeft <= 7 ? 'expiring_soon' : 'active',
      daysLeft,
      currentSubscription: activeSub || null
    });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
