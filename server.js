require('dotenv').config();
const express = require('express');
const cors = require('cors');

const geocodeRouter = require('./routes/geocode');
const routeRouter = require('./routes/route');

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/geocode', geocodeRouter);
app.use('/api/route', routeRouter);

// ── Health check ────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── 404 handler ─────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ── Global error handler ────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('[Error]', err.message);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🗺️  Map Navigator API running on http://localhost:${PORT}`);
  console.log(`   GET /api/geocode?q=<address>`);
  console.log(`   GET /api/route?start=lat,lng&end=lat,lng\n`);
});
