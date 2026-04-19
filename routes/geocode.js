const express = require('express');
const axios = require('axios');
const router = express.Router();

/**
 * GET /api/geocode?q=<address>
 * Proxies to OpenStreetMap Nominatim for address → coordinates lookup.
 * Returns an array of results: [{ lat, lon, display_name, place_id }]
 */
router.get('/', async (req, res, next) => {
  const { q } = req.query;

  if (!q || typeof q !== 'string' || q.trim().length === 0) {
    return res.status(400).json({ error: 'Query parameter "q" is required.' });
  }

  try {
    const response = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: {
        q: q.trim(),
        format: 'json',
        limit: 5,
        addressdetails: 1,
      },
      headers: {
        // Nominatim requires a User-Agent to identify your app
        'User-Agent': 'MapNavigatorApp/1.0 (educational project)',
        'Accept-Language': 'en',
      },
      timeout: 8000,
    });

    const results = response.data.map((item) => ({
      place_id: item.place_id,
      display_name: item.display_name,
      lat: parseFloat(item.lat),
      lon: parseFloat(item.lon),
      type: item.type,
      importance: item.importance,
    }));

    res.json(results);
  } catch (err) {
    if (err.code === 'ECONNABORTED') {
      return res.status(504).json({ error: 'Geocoding service timed out.' });
    }
    next(err);
  }
});

module.exports = router;
