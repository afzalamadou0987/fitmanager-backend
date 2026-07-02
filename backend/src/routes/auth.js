const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');
const router = express.Router();

// POST /api/auth/register - Créer une nouvelle salle + gérant owner
router.post('/register', async (req, res) => {
  const { gymName, gymAddress, gymPhone, fullName, email, password } = req.body;

  if (!gymName || !fullName || !email || !password) {
    return res.status(400).json({ error: 'gymName, fullName, email et password sont requis' });
  }

  try {
    // 1. Créer la salle
    const { data: gym, error: gymError } = await supabase
      .from('gyms')
      .insert({ name: gymName, address: gymAddress, phone: gymPhone })
      .select()
      .single();

    if (gymError) throw gymError;

    // 2. Hasher le mot de passe
    const passwordHash = await bcrypt.hash(password, 10);

    // 3. Créer le manager owner
    const { data: manager, error: managerError } = await supabase
      .from('managers')
      .insert({
        gym_id: gym.id,
        email,
        password_hash: passwordHash,
        full_name: fullName,
        role: 'owner'
      })
      .select()
      .single();

    if (managerError) {
      if (managerError.code === '23505') {
        // Supprimer la salle créée si l'email existe déjà
        await supabase.from('gyms').delete().eq('id', gym.id);
        return res.status(400).json({ error: 'Cet email est déjà utilisé' });
      }
      throw managerError;
    }

    // 4. Générer le token JWT
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
    console.error('Register error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email et mot de passe requis' });
  }

  try {
    const { data: manager, error } = await supabase
      .from('managers')
      .select('*, gyms(id, name, address, phone, logo_url)')
      .eq('email', email)
      .eq('is_active', true)
      .single();

    if (error || !manager) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    const isValid = await bcrypt.compare(password, manager.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    const token = jwt.sign(
      { id: manager.id, gymId: manager.gym_id, role: manager.role, email: manager.email },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      token,
      manager: {
        id: manager.id,
        fullName: manager.full_name,
        email: manager.email,
        role: manager.role
      },
      gym: manager.gyms
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/auth/me - Profil du manager connecté
router.get('/me', require('../middleware/auth'), async (req, res) => {
  try {
    const { data: manager, error } = await supabase
      .from('managers')
      .select('id, full_name, email, role, gyms(id, name, address, phone, logo_url)')
      .eq('id', req.manager.id)
      .single();

    if (error || !manager) {
      return res.status(404).json({ error: 'Manager introuvable' });
    }

    res.json(manager);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
