const express = require('express')
const pool = require('../config/db')
const authMiddleware = require('../middleware/auth')
const router = express.Router()

router.use(authMiddleware)

router.post('/', async (req, res) => {
  const { gymId, id: managerId } = req.manager
  const { memberId } = req.body
  if (!memberId) return res.status(400).json({ error: 'memberId requis' })
  try {
    const result = await pool.query(
      'INSERT INTO checkins (member_id, gym_id, checked_in_by) VALUES (, , ) RETURNING *',
      [memberId, gymId, managerId]
    )
    res.status(201).json(result.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

router.get('/today', async (req, res) => {
  const { gymId } = req.manager
  try {
    const result = await pool.query(
      'SELECT c.*, m.full_name, m.phone FROM checkins c JOIN members m ON m.id = c.member_id WHERE c.gym_id =  AND c.checked_in_at::date = CURRENT_DATE ORDER BY c.checked_in_at DESC',
      [gymId]
    )
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

module.exports = router
