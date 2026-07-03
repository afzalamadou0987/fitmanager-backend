const express = require('express');
const pool = require('../config/db');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

router.use(authMiddleware);

// POST /api/subscriptions — créer/renouveler
router.post('/', async (req, res) => {
  const { gymId, id: managerId } = req.manager;
  const { memberId, planId, startDate, paymentMethod, paymentRef } = req.body;
  if (!memberId || !planId) return res.status(400).json({ error: 'memberId et planId sont requis' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const planRes = await client.query(
      'SELECT * FROM subscription_plans WHERE id=$1 AND gym_id=$2 AND is_active=true',
      [planId, gymId]
    );
    if (!planRes.rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Plan introuvable' });
    }
    const plan = planRes.rows[0];

    const start = startDate ? new Date(startDate) : new Date();
    const end = new Date(start);
    end.setDate(end.getDate() + plan.duration_days);

    // Expirer les anciens abonnements actifs
    await client.query(
      "UPDATE subscriptions SET status='expired' WHERE member_id=$1 AND gym_id=$2 AND status='active'",
      [memberId, gymId]
    );

    const result = await client.query(
      `INSERT INTO subscriptions (member_id, plan_id, gym_id, start_date, end_date, status, amount_paid, payment_method, payment_ref, created_by)
       VALUES ($1,$2,$3,$4,$5,'active',$6,$7,$8,$9) RETURNING *`,
      [memberId, planId, gymId,
       start.toISOString().split('T')[0],
       end.toISOString().split('T')[0],
       plan.price, paymentMethod || 'cash', paymentRef || null, managerId]
    );

    await client.query('COMMIT');
    res.status(201).json({
      ...result.rows[0],
      plan: { name: plan.name, duration_days: plan.duration_days, price: plan.price }
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  } finally {
    client.release();
  }
});

// GET /api/subscriptions/expiring — alertes expiration
router.get('/expiring', async (req, res) => {
  const { gymId } = req.manager;
  const days = parseInt(req.query.days) || 7;
  const today = new Date().toISOString().split('T')[0];
  const limit = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  try {
    const result = await pool.query(
      `SELECT s.*, m.full_name, m.phone, p.name as plan_name
       FROM subscriptions s
       JOIN members m ON m.id=s.member_id
       JOIN subscription_plans p ON p.id=s.plan_id
       WHERE s.gym_id=$1 AND s.status='active' AND s.end_date>=$2 AND s.end_date<=$3
       ORDER BY s.end_date ASC`,
      [gymId, today, limit]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/subscriptions/member/:memberId — historique
router.get('/member/:memberId', async (req, res) => {
  const { gymId } = req.manager;
  try {
    const result = await pool.query(
      `SELECT s.*, p.name as plan_name, p.duration_days, p.price as plan_price
       FROM subscriptions s
       JOIN subscription_plans p ON p.id=s.plan_id
       WHERE s.member_id=$1 AND s.gym_id=$2
       ORDER BY s.created_at DESC`,
      [req.params.memberId, gymId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PATCH /api/subscriptions/:id/cancel
router.patch('/:id/cancel', async (req, res) => {
  const { gymId } = req.manager;
  try {
    const result = await pool.query(
      "UPDATE subscriptions SET status='cancelled' WHERE id=$1 AND gym_id=$2 RETURNING *",
      [req.params.id, gymId]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Abonnement introuvable' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
