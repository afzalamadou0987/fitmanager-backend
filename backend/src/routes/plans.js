const express = require('express');
const supabase = require('../config/supabase');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

router.use(authMiddleware);

// GET /api/plans - Tous les plans de la salle
router.get('/', async (req, res) => {
  const { gymId } = req.manager;

  try {
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('gym_id', gymId)
      .eq('is_active', true)
      .order('price', { ascending: true });

    if (error) throw error;
    res.json(data);

  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/plans - Créer un plan
router.post('/', async (req, res) => {
  const { gymId } = req.manager;
  const { name, durationDays, price, description } = req.body;

  if (!name || !durationDays || !price) {
    return res.status(400).json({ error: 'name, durationDays et price sont requis' });
  }

  try {
    const { data, error } = await supabase
      .from('subscription_plans')
      .insert({
        gym_id: gymId,
        name,
        duration_days: durationDays,
        price,
        description
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);

  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT /api/plans/:id - Modifier un plan
router.put('/:id', async (req, res) => {
  const { gymId } = req.manager;
  const { name, durationDays, price, description, isActive } = req.body;

  try {
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (durationDays !== undefined) updateData.duration_days = durationDays;
    if (price !== undefined) updateData.price = price;
    if (description !== undefined) updateData.description = description;
    if (isActive !== undefined) updateData.is_active = isActive;

    const { data, error } = await supabase
      .from('subscription_plans')
      .update(updateData)
      .eq('id', req.params.id)
      .eq('gym_id', gymId)
      .select()
      .single();

    if (error || !data) return res.status(404).json({ error: 'Plan introuvable' });
    res.json(data);

  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE /api/plans/:id - Soft delete
router.delete('/:id', async (req, res) => {
  const { gymId } = req.manager;

  try {
    const { error } = await supabase
      .from('subscription_plans')
      .update({ is_active: false })
      .eq('id', req.params.id)
      .eq('gym_id', gymId);

    if (error) throw error;
    res.json({ message: 'Plan désactivé' });

  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
