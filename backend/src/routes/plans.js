const express = require('express');
const pool = require('../config/db');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

router.use(authMiddleware);

// GET /api/plans
router.get('/', async (req, res) => {
  const { gymId } = req.manager;
  try {
    const result = await pool.query(
      'SELECT * FROM subscription_plans WHERE gym_id=$1 AND is_active=true ORDER BY price ASC',
      [gymId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/plans
router.post('/', async (req, res) => {
  const { gymId } = req.manager;
  const { name, durationDays, price, description } = req.body;
  if (!name || !durationDays || !price) {
    return res.status(400).json({ error: 'name, durationDays et price sont requis' });
  }
  try {
    const result = await pool.query(
      'INSERT INTO subscription_plans (gym_id, name, duration_days, price, description) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [gymId, name, durationDays, price, description || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT /api/plans/:id
router.put('/:id', async (req, res) => {
  const { gymId } = req.manager;
  const { name, durationDays, price, description, isActive } = req.body;

  const fields = [], params = [];
  let i = 1;
  if (name !== undefined) { fields.push(`name=$${i++}`); params.push(name); }
  if (durationDays !== undefined) { fields.push(`duration_days=$${i++}`); params.push(durationDays); }
  if (price !== undefined) { fields.push(`price=$${i++}`); params.push(price); }
  if (description !== undefined) { fields.push(`description=$${i++}`); params.push(description); }
  if (isActive !== undefined) { fields.push(`is_active=$${i++}`); params.push(isActive); }
  if (!fields.length) return res.status(400).json({ error: 'Aucun champ à modifier' });

  params.push(req.params.id, gymId);
  try {
    const result = await pool.query(
      `UPDATE subscription_plans SET ${fields.join(',')} WHERE id=$${i} AND gym_id=$${i+1} RETURNING *`,
      params
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Plan introuvable' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE /api/plans/:id (soft delete)
router.delete('/:id', async (req, res) => {
  const { gymId } = req.manager;
  try {
    await pool.query(
      'UPDATE subscription_plans SET is_active=false WHERE id=$1 AND gym_id=$2',
      [req.params.id, gymId]
    );
    res.json({ message: 'Plan désactivé' });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
