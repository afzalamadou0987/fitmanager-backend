const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

// POST /api/auth/register — créer une salle + gérant owner
router.post('/register', async (req, res) => {
  const { gymName, gymAddress, gymPhone, fullName, email, password } = req.body;
  if (!gymName || !fullName || !email || !password) {
    return res.status(400).json({ error: 'gymName, fullName, email et password sont requis' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const gymRes = await client.query(
      'INSERT INTO gyms (name, address, phone) VALUES ($1, $2, $3) RETURNING *',
      [gymName, gymAddress || null, gymPhone || null]
    );
    const gym = gymRes.rows[0];

    const passwordHash = await bcrypt.hash(password, 10);

    const managerRes = await client.query(
      'INSERT INTO managers (gym_id, email, password_hash, full_name, role) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [gym.id, email, passwordHash, fullName, 'owner']
    );
    const manager = managerRes.rows[0];

    await client.query('COMMIT');

    const token = jwt.sign(
      { id: manager.id, gymId: gym.id, role: manager.role, email: manager.email },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(201).json({
      message: 'Salle créée avec succès',
      token,
      manager: { id: manager.id, fullName: manager.full_name, email: manager.email, role: manager.role },
      gym: { id: gym.id, name: gym.name }
    });

  } catch (err) {
    await client.query('ROLLBACK');
    if (err.code === '23505') return res.status(400).json({ error: 'Cet email est déjà utilisé' });
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  } finally {
    client.release();
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email et mot de passe requis' });

  try {
    const result = await pool.query(
      `SELECT m.*, g.name as gym_name, g.address as gym_address, g.phone as gym_phone
       FROM managers m
       JOIN gyms g ON g.id = m.gym_id
       WHERE m.email = $1 AND m.is_active = true`,
      [email]
    );

    if (result.rows.length === 0) return res.status(401).json({ error: 'Email ou mot de passe incorrect' });

    const manager = result.rows[0];
    const isValid = await bcrypt.compare(password, manager.password_hash);
    if (!isValid) return res.status(401).json({ error: 'Email ou mot de passe incorrect' });

    const token = jwt.sign(
      { id: manager.id, gymId: manager.gym_id, role: manager.role, email: manager.email },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      token,
      manager: { id: manager.id, fullName: manager.full_name, email: manager.email, role: manager.role },
      gym: { id: manager.gym_id, name: manager.gym_name, address: manager.gym_address }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT m.id, m.full_name, m.email, m.role,
              g.id as gym_id, g.name as gym_name, g.address, g.phone, g.logo_url
       FROM managers m
       JOIN gyms g ON g.id = m.gym_id
       WHERE m.id = $1`,
      [req.manager.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Manager introuvable' });
    const r = result.rows[0];
    res.json({
      id: r.id, fullName: r.full_name, email: r.email, role: r.role,
      gym: { id: r.gym_id, name: r.gym_name, address: r.address, phone: r.phone, logoUrl: r.logo_url }
    });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
