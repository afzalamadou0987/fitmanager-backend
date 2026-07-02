require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const memberRoutes = require('./routes/members');
const subscriptionRoutes = require('./routes/subscriptions');
const planRoutes = require('./routes/plans');

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/plans', planRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'FitManager API running' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route introuvable' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`FitManager API running on port ${PORT}`);
});
