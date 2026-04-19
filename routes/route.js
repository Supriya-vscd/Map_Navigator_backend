const express = require('express');
const axios = require('axios');
const router = express.Router();

/**
 * GET /api/route?start=lat,lng&end=lat,lng&mode=driving
 * Proxies to OSRM public API to compute a driving/walking route.
 * Returns: { distance_m, duration_s, geometry (GeoJSON LineString), steps[] }
 */
router.get('/', async (req, res, next) => {
  console.log("i was called")
  const { start, end, mode = 'driving' } = req.query;

  if (!start || !end) {
    return res.status(400).json({ error: 'Parameters "start" and "end" are required (format: lat,lng).' });
  }

  const parseCoord = (str) => {
    const parts = str.split(',').map(Number);
    if (parts.length !== 2 || parts.some(isNaN)) return null;
    return { lat: parts[0], lng: parts[1] };
  };

  const startCoord = parseCoord(start);
  const endCoord = parseCoord(end);

  if (!startCoord || !endCoord) {
    return res.status(400).json({ error: 'Invalid coordinate format. Use "lat,lng".' });
  }

  const profile = mode === 'walking' ? 'foot' : mode === 'cycling' ? 'bike' : 'car';

  // OSRM expects coordinates as lng,lat (GeoJSON order)
  const coords = `${startCoord.lng},${startCoord.lat};${endCoord.lng},${endCoord.lat}`;
  const osrmUrl = `https://router.project-osrm.org/route/v1/${profile}/${coords}`;

  try {
    const response = await axios.get(osrmUrl, {
      params: {
        overview: 'full',
        geometries: 'geojson',
        steps: true,
        annotations: false,
      },
      headers: {
        'User-Agent': 'MapNavigatorApp/1.0 (educational project)',
      },
      timeout: 10000,
    });

    const data = response.data;

    if (!data.routes || data.routes.length === 0) {
      return res.status(404).json({ error: 'No route found between the given coordinates.' });
    }

    const route = data.routes[0];

    const steps = route.legs[0].steps.map((step) => ({
      instruction: step.maneuver.type,
      modifier: step.maneuver.modifier || null,
      name: step.name || 'Unnamed road',
      distance_m: Math.round(step.distance),
      duration_s: Math.round(step.duration),
    }));

    res.json({
      distance_m: Math.round(route.distance),
      duration_s: Math.round(route.duration),
      geometry: route.geometry,   // GeoJSON LineString
      steps,
      waypoints: data.waypoints,
    });
  } catch (err) {
    if (err.code === 'ECONNABORTED') {
      return res.status(504).json({ error: 'Routing service timed out.' });
    }
    if (err.response?.status === 400) {
      return res.status(400).json({ error: 'Invalid route request. Check your coordinates.' });
    }
    next(err);
  }
});

module.exports = router;
