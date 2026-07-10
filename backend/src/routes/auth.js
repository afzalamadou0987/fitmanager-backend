const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const pool = require('../config/db')
const authMiddleware = require('../middleware/auth')
const router = express.Router()

// POST /api/auth/register — créer une salle + gérant owner
router.post('/register', async (req, res) => {
  const { gymName, gymAddress, gymPhone, fullName, email, password, accessCode } = req.body
  if (!gymName || !fullName || !email || !password) {
    return res.status(400).json({ error: 'Tous les champs obligatoires sont requis' })
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // Vérifier le code d'accès
    let licenceDays = 0
    let licenceType = 'trial'
    
    if (accessCode) {
      const codeResult = await client.query(
        "SELECT * FROM access_codes WHERE code = $1 AND is_used = FALSE",
        [accessCode.trim().toUpperCase()]
      )
      if (!codeResult.rows.length) {
        await client.query('ROLLBACK')
        return res.status(400).json({ error: 'Code d\'accès invalide ou déjà utilisé' })
      }
      licenceDays = codeResult.rows[0].duration_days
      licenceType = codeResult.rows[0].type === 'trial_7' ? 'trial' : 'active'
    } else {
      await client.query('ROLLBACK')
      return res.status(400).json({ error: 'Un code d\'accès est requis pour créer un compte' })
    }

    // Créer la salle
    const gymRes = await client.query(
      'INSERT INTO gyms (name, address, phone) VALUES ($1, $2, $3) RETURNING *',
      [gymName, gymAddress || null, gymPhone || null]
    )
    const gym = gymRes.rows[0]

    // Hasher le mot de passe
    const passwordHash = await bcrypt.hash(password, 10)

    // Créer le manager
    const managerRes = await client.query(
      'INSERT INTO managers (gym_id, email, password_hash, full_name, role) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [gym.id, email, passwordHash, fullName, 'owner']
    )
    const manager = managerRes.rows[0]

    // Créer la licence
    await client.query(
      `INSERT INTO gym_licenses (gym_id, code_used, start_date, end_date, status)
       VALUES ($1, $2, NOW(), NOW() + INTERVAL '${licenceDays} days', $3)`,
      [gym.id, accessCode.trim().toUpperCase(), licenceType]
    )

    // Marquer le code comme utilisé
    await client.query(
      'UPDATE access_codes SET is_used = TRUE, used_by = $1, used_at = NOW() WHERE code = $2',
      [gym.id, accessCode.trim().toUpperCase()]
    )

    await client.query('COMMIT')

    const token = jwt.sign(
      { id: manager.id, gymId: gym.id, role: manager.role, email: manager.email },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    )

    res.status(201).json({
      message: 'Compte créé avec succès',
      token,
      manager: { id: manager.id, fullName: manager.full_name, email: manager.email, role: manager.role },
      gym: { id: gym.id, name: gym.name },
      license: { daysLeft: licenceDays, type: licenceType }
    })

  } catch (err) {
    await client.query('ROLLBACK')
    if (err.code === '23505') return res.status(400).json({ error: 'Cet email est déjà utilisé' })
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  } finally {
    client.release()
  }
})

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) return res.status(400).json({ error: 'Email et mot de passe requis' })

  try {
    const result = await pool.query(
      `SELECT m.*, g.name as gym_name, g.address as gym_address, g.phone as gym_phone
       FROM managers m JOIN gyms g ON g.id = m.gym_id
       WHERE m.email = $1 AND m.is_active = true`,
      [email]
    )
    if (!result.rows.length) return res.status(401).json({ error: 'Email ou mot de passe incorrect' })

    const manager = result.rows[0]
    const isValid = await bcrypt.compare(password, manager.password_hash)
    if (!isValid) return res.status(401).json({ error: 'Email ou mot de passe incorrect' })

    // Récupérer la licence
    const licResult = await pool.query(
      'SELECT *, EXTRACT(DAY FROM end_date - NOW()) as days_left FROM gym_licenses WHERE gym_id = $1',
      [manager.gym_id]
    )
    const license = licResult.rows[0] || null

    const token = jwt.sign(
      { id: manager.id, gymId: manager.gym_id, role: manager.role, email: manager.email },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    )

    res.json({
      token,
      manager: { id: manager.id, fullName: manager.full_name, email: manager.email, role: manager.role },
      gym: { id: manager.gym_id, name: manager.gym_name, address: manager.gym_address },
      license: license ? {
        daysLeft: Math.max(0, Math.floor(license.days_left)),
        endDate: license.end_date,
        status: license.status,
        isExpired: new Date(license.end_date) < new Date()
      } : null
    })

  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// GET /api/auth/me
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT m.id, m.full_name, m.email, m.role,
              g.id as gym_id, g.name as gym_name, g.address, g.phone, g.logo_url
       FROM managers m JOIN gyms g ON g.id = m.gym_id WHERE m.id = $1`,
      [req.manager.id]
    )
    if (!result.rows.length) return res.status(404).json({ error: 'Manager introuvable' })

    const licResult = await pool.query(
      'SELECT *, EXTRACT(DAY FROM end_date - NOW()) as days_left FROM gym_licenses WHERE gym_id = $1',
      [req.manager.gymId]
    )
    const license = licResult.rows[0] || null

    const r = result.rows[0]
    res.json({
      id: r.id, fullName: r.full_name, email: r.email, role: r.role,
      gym: { id: r.gym_id, name: r.gym_name, address: r.address, phone: r.phone, logoUrl: r.logo_url },
      license: license ? {
        daysLeft: Math.max(0, Math.floor(license.days_left)),
        endDate: license.end_date,
        status: license.status,
        isExpired: new Date(license.end_date) < new Date()
      } : null
    })
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

module.exports = router
