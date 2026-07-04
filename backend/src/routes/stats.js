const express = require('express')
const pool = require('../config/db')
const authMiddleware = require('../middleware/auth')
const router = express.Router()

router.use(authMiddleware)

router.get('/', async (req, res) => {
  const { gymId } = req.manager

  try {
    const [monthlyRev, planDistrib, renewalData, newMembers] = await Promise.all([
      pool.query(`
        SELECT 
          TO_CHAR(DATE_TRUNC('month', created_at AT TIME ZONE 'UTC'), 'Mon') as month,
          DATE_TRUNC('month', created_at) as month_date,
          COALESCE(SUM(amount_paid), 0) as total,
          COUNT(*) as count
        FROM subscriptions
        WHERE gym_id = $1 AND created_at >= NOW() - INTERVAL '12 months'
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY month_date ASC
      `, [gymId]),
      pool.query(`
        SELECT p.name, COUNT(*) as count, COALESCE(SUM(s.amount_paid), 0) as revenue
        FROM subscriptions s
        JOIN subscription_plans p ON p.id = s.plan_id
        WHERE s.gym_id = $1 AND s.status = 'active'
        GROUP BY p.name
        ORDER BY count DESC
      `, [gymId]),
      pool.query(`
        SELECT 
          COUNT(DISTINCT member_id) FILTER (WHERE sub_count > 1) as renewed,
          COUNT(DISTINCT member_id) as total
        FROM (
          SELECT member_id, COUNT(*) as sub_count
          FROM subscriptions WHERE gym_id = $1
          GROUP BY member_id
        ) t
      `, [gymId]),
      pool.query(`
        SELECT 
          TO_CHAR(DATE_TRUNC('month', created_at), 'Mon') as month,
          DATE_TRUNC('month', created_at) as month_date,
          COUNT(*) as count
        FROM members
        WHERE gym_id = $1 AND created_at >= NOW() - INTERVAL '6 months'
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY month_date ASC
      `, [gymId])
    ])

    const renewal = renewalData.rows[0]
    const renewalRate = renewal.total > 0 ? Math.round((renewal.renewed / renewal.total) * 100) : 0

    res.json({
      monthlyRevenue: monthlyRev.rows,
      planDistribution: planDistrib.rows,
      renewalRate,
      renewalRaw: renewal,
      newMembers: newMembers.rows
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

module.exports = router
