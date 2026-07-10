const express = require('express')
const pool = require('../config/db')
const router = express.Router()

// Clé admin secrète
const ADMIN_KEY = process.env.ADMIN_KEY || 'fitmanager_admin_2026'

const adminAuth = (req, res, next) => {
  const key = req.headers['x-admin-key']
  if (key !== ADMIN_KEY) return res.status(401).json({ error: 'Non autorisé' })
  next()
}

// GET /api/admin/codes - Liste tous les codes
router.get('/codes', adminAuth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT ac.*, g.name as gym_name 
      FROM access_codes ac
      LEFT JOIN gyms g ON g.id = ac.used_by
      ORDER BY ac.created_at DESC
    `)
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// POST /api/admin/codes - Générer des codes
router.post('/codes', adminAuth, async (req, res) => {
  const { type = 'trial_7', count = 5 } = req.body
  const duration = type === 'trial_7' ? 7 : type === 'monthly' ? 30 : 365
  const prefix = type === 'trial_7' ? 'FM-ESSAI' : type === 'monthly' ? 'FM-MOIS' : 'FM-AN'
  
  try {
    const codes = []
    for (let i = 0; i < count; i++) {
      const rand = Math.random().toString(36).substring(2, 6).toUpperCase()
      const rand2 = Math.random().toString(36).substring(2, 6).toUpperCase()
      const code = `${prefix}-${rand}${rand2}`
      codes.push(code)
    }
    
    const values = codes.map((c, i) => `('${c}', '${type}', ${duration})`).join(',')
    await pool.query(`INSERT INTO access_codes (code, type, duration_days) VALUES ${values} ON CONFLICT DO NOTHING`)
    
    res.json({ generated: codes.length, codes })
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// GET /api/admin/licenses - Liste toutes les licences
router.get('/licenses', adminAuth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT gl.*, g.name as gym_name, g.phone as gym_phone,
        EXTRACT(DAY FROM gl.end_date - NOW()) as days_left
      FROM gym_licenses gl
      JOIN gyms g ON g.id = gl.gym_id
      ORDER BY gl.end_date ASC
    `)
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// POST /api/admin/extend - Prolonger une licence
router.post('/extend', adminAuth, async (req, res) => {
  const { gymId, days = 30 } = req.body
  try {
    const result = await pool.query(`
      UPDATE gym_licenses 
      SET end_date = GREATEST(end_date, NOW()) + INTERVAL '${days} days',
          status = 'active'
      WHERE gym_id = $1 RETURNING *
    `, [gymId])
    res.json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

module.exports = router
