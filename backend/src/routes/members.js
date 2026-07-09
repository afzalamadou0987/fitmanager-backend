const express = require('express');
const pool = require('../config/db');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

router.use(authMiddleware);

// GET /api/members Ã¢â‚¬â€ liste avec statut abonnement
router.get('/', async (req, res) => {
  const { gymId } = req.manager;
  const { search, page = 1, limit = 20 } = req.query;

  try {
    const params = [gymId];
    let where = 'WHERE m.gym_id = $1 AND m.is_active = true';

    if (search) {
      params.push(`%${search}%`);
      where += ` AND (m.full_name ILIKE $${params.length} OR m.phone ILIKE $${params.length})`;
    }

    params.push(Number(limit), (Number(page) - 1) * Number(limit));

    const result = await pool.query(
      `SELECT m.*,
              s.id as sub_id, s.status as sub_status, s.start_date, s.end_date,
              s.amount_paid, s.payment_method,
              p.name as plan_name, p.duration_days, p.price as plan_price
       FROM members m
       LEFT JOIN LATERAL (
         SELECT * FROM subscriptions
         WHERE member_id = m.id AND status = 'active'
         ORDER BY created_at DESC LIMIT 1
       ) s ON true
       LEFT JOIN subscription_plans p ON p.id = s.plan_id
       ${where}
       ORDER BY m.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    const today = new Date();
    const members = result.rows.map(row => {
      const base = {
        id: row.id, full_name: row.full_name, phone: row.phone, email: row.email,
        photo_url: row.photo_url, qr_code: row.qr_code,
        registration_date: row.registration_date, notes: row.notes, created_at: row.created_at
      };

      if (!row.sub_id) return { ...base, subscriptionStatus: 'none', daysLeft: 0, currentSubscription: null };

      const daysLeft = Math.ceil((new Date(row.end_date) - today) / (1000 * 60 * 60 * 24));
      const subscriptionStatus = daysLeft < 0 ? 'expired' : daysLeft <= 7 ? 'expiring_soon' : 'active';

      return {
        ...base, subscriptionStatus, daysLeft,
        currentSubscription: {
          id: row.sub_id, status: row.sub_status,
          start_date: row.start_date, end_date: row.end_date,
          amount_paid: row.amount_paid, payment_method: row.payment_method,
          plan: { name: row.plan_name, duration_days: row.duration_days, price: row.plan_price }
        }
      };
    });

    res.json({ members });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/members/stats/summary Ã¢â‚¬â€ stats dashboard
router.get('/stats/summary', async (req, res) => {
  const { gymId } = req.manager;
  try {
    const today = new Date().toISOString().split('T')[0];
    const in7Days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

    const [t, a, e, r] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM members WHERE gym_id=$1 AND is_active=true', [gymId]),
      pool.query("SELECT COUNT(*) FROM subscriptions WHERE gym_id=$1 AND status='active'", [gymId]),
      pool.query(
        "SELECT COUNT(*) FROM subscriptions WHERE gym_id=$1 AND status='active' AND end_date>=$2 AND end_date<=$3",
        [gymId, today, in7Days]
      ),
      pool.query(
        'SELECT COALESCE(SUM(amount_paid),0) as total FROM subscriptions WHERE gym_id=$1 AND created_at>=$2',
        [gymId, firstOfMonth]
      )
    ]);

    res.json({
      totalMembers: parseInt(t.rows[0].count),
      activeSubscriptions: parseInt(a.rows[0].count),
      expiringSoon: parseInt(e.rows[0].count),
      monthlyRevenue: parseFloat(r.rows[0].total)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/members/qr/:qrCode Ã¢â‚¬â€ lookup QR pour check-in
router.get('/qr/:qrCode', async (req, res) => {
  const { gymId } = req.manager;
  try {
    const result = await pool.query(
      `SELECT m.id, m.full_name, m.phone, m.photo_url, m.qr_code,
              s.id as sub_id, s.status as sub_status, s.end_date, p.name as plan_name
       FROM members m
       LEFT JOIN LATERAL (
         SELECT * FROM subscriptions WHERE member_id=m.id AND status='active' ORDER BY created_at DESC LIMIT 1
       ) s ON true
       LEFT JOIN subscription_plans p ON p.id=s.plan_id
       WHERE UPPER(LEFT(m.qr_code::text, 8)) = UPPER(LEFT($1::text, 8)) AND m.gym_id=$2 AND m.is_active=true`,
      [req.params.qrCode, gymId]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Membre introuvable' });

    const row = result.rows[0];
    const daysLeft = row.end_date
      ? Math.ceil((new Date(row.end_date) - new Date()) / (1000 * 60 * 60 * 24))
      : 0;

    res.json({
      id: row.id, fullName: row.full_name, phone: row.phone,
      photoUrl: row.photo_url, qrCode: row.qr_code,
      subscriptionStatus: !row.sub_id ? 'none' : daysLeft < 0 ? 'expired' : daysLeft <= 7 ? 'expiring_soon' : 'active',
      daysLeft,
      currentSubscription: row.sub_id
        ? { status: row.sub_status, endDate: row.end_date, planName: row.plan_name }
        : null
    });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/members/:id
router.get('/:id', async (req, res) => {
  const { gymId } = req.manager;
  try {
    const [memberRes, subsRes] = await Promise.all([
      pool.query('SELECT * FROM members WHERE id=$1 AND gym_id=$2', [req.params.id, gymId]),
      pool.query(
        `SELECT s.*, p.name as plan_name, p.duration_days, p.price as plan_price
         FROM subscriptions s
         JOIN subscription_plans p ON p.id=s.plan_id
         WHERE s.member_id=$1 ORDER BY s.created_at DESC`,
        [req.params.id]
      )
    ]);

    if (memberRes.rows.length === 0) return res.status(404).json({ error: 'Membre introuvable' });
    res.json({ ...memberRes.rows[0], subscriptions: subsRes.rows });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/members
router.post('/', async (req, res) => {
  const { gymId } = req.manager;
  const { fullName, phone, email, notes, registrationDate } = req.body;
  if (!fullName) return res.status(400).json({ error: 'Le nom complet est requis' });

  try {
    const result = await pool.query(
      'INSERT INTO members (gym_id, full_name, phone, email, notes, registration_date) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [gymId, fullName, phone || null, email || null, notes || null, registrationDate || new Date().toISOString().split('T')[0]]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT /api/members/:id
router.put('/:id', async (req, res) => {
  const { gymId } = req.manager;
  const { fullName, phone, email, notes, isActive } = req.body;

  const fields = [], params = [];
  let i = 1;
  if (fullName !== undefined) { fields.push(`full_name=$${i++}`); params.push(fullName); }
  if (phone !== undefined) { fields.push(`phone=$${i++}`); params.push(phone); }
  if (email !== undefined) { fields.push(`email=$${i++}`); params.push(email); }
  if (notes !== undefined) { fields.push(`notes=$${i++}`); params.push(notes); }
  if (isActive !== undefined) { fields.push(`is_active=$${i++}`); params.push(isActive); }
  if (!fields.length) return res.status(400).json({ error: 'Aucun champ ÃƒÂ  modifier' });

  params.push(req.params.id, gymId);
  try {
    const result = await pool.query(
      `UPDATE members SET ${fields.join(',')} WHERE id=$${i} AND gym_id=$${i+1} RETURNING *`,
      params
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Membre introuvable' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE /api/members/:id (soft delete)
router.delete('/:id', async (req, res) => {
  const { gymId } = req.manager;
  try {
    await pool.query('UPDATE members SET is_active=false WHERE id=$1 AND gym_id=$2', [req.params.id, gymId]);
    res.json({ message: 'Membre dÃƒÂ©sactivÃƒÂ©' });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
