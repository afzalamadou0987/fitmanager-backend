const pool = require('../config/db')

const licenseCheck = async (req, res, next) => {
  try {
    const { gymId } = req.manager
    const result = await pool.query(
      'SELECT * FROM gym_licenses WHERE gym_id = $1',
      [gymId]
    )
    
    if (!result.rows.length) {
      return res.status(403).json({ error: 'licence_expired', message: 'Aucune licence active' })
    }
    
    const license = result.rows[0]
    if (new Date(license.end_date) < new Date()) {
      return res.status(403).json({ error: 'licence_expired', message: 'Votre licence a expiré' })
    }
    
    // Attacher les infos licence à la requête
    req.license = license
    next()
  } catch (err) {
    console.error(err)
    next() // En cas d'erreur DB, on laisse passer
  }
}

module.exports = licenseCheck
