import express from 'express';
import Place from '../models/Place.js';

const router = express.Router();

const dmsToDecimal = (deg, min, sec, hemi) => {
  const sign = hemi === 'S' || hemi === 'W' ? -1 : 1;
  return sign * (Number(deg) + Number(min) / 60 + Number(sec) / 3600);
};

const parseCoordinateInput = (raw = '') => {
  const input = `${raw}`.trim();
  if (!input) return null;

  const decimalMatch = input.match(/(-?\d{1,2}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)/);
  if (decimalMatch) {
    const lat = Number(decimalMatch[1]);
    const lng = Number(decimalMatch[2]);
    if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180) return { lat, lng };
  }

  const dmsMatch = input.match(/(\d{1,2})°\s*(\d{1,2})'\s*(\d{1,2}(?:\.\d+)?)"?\s*([NS])[^\d]+(\d{1,3})°\s*(\d{1,2})'\s*(\d{1,2}(?:\.\d+)?)"?\s*([EW])/i);
  if (dmsMatch) {
    const lat = dmsToDecimal(dmsMatch[1], dmsMatch[2], dmsMatch[3], dmsMatch[4].toUpperCase());
    const lng = dmsToDecimal(dmsMatch[5], dmsMatch[6], dmsMatch[7], dmsMatch[8].toUpperCase());
    if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180) return { lat, lng };
  }

  return null;
};

const parseCoordsFromMapsUrl = (url = '') => {
  const patterns = [/@(-?\d+\.\d+),(-?\d+\.\d+)/, /q=(-?\d+\.\d+),(-?\d+\.\d+)/, /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return { lat: Number(m[1]), lng: Number(m[2]) };
  }
  return null;
};

const resolveMapsUrl = async (url) => {
  try {
    const res = await fetch(url, { redirect: 'follow' });
    return res.url || url;
  } catch {
    return url;
  }
};

const normalizePayload = async (body) => {
  const coordinateInput = body.coordinateInput || '';
  let location = body.location?.lat != null && body.location?.lng != null ? body.location : parseCoordinateInput(coordinateInput);

  if (!location && body.googleMapsUrl) {
    const resolved = await resolveMapsUrl(body.googleMapsUrl);
    location = parseCoordsFromMapsUrl(resolved) || parseCoordsFromMapsUrl(body.googleMapsUrl);
  }

  if (!location && !body.googleMapsUrl) {
    throw new Error('Inserisci coordinate oppure un link Google Maps.');
  }
  if (!location) {
    throw new Error('Impossibile estrarre coordinate dal link Google Maps.');
  }

  return {
    ...body,
    location: { lat: Number(location.lat), lng: Number(location.lng) }
  };
};

router.get('/', async (req, res) => {
  const { q, explored } = req.query;
  const filter = {};

  if (q?.trim()) filter.$text = { $search: q.trim() };
  if (explored === 'true' || explored === 'false') filter.explored = explored === 'true';

  const places = await Place.find(filter).sort({ explored: 1, updatedAt: -1 });
  res.json(places);
});

router.post('/', async (req, res) => {
  try {
    const payload = await normalizePayload(req.body);
    const place = await Place.create(payload);
    res.status(201).json(place);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const payload = await normalizePayload(req.body);
    const place = await Place.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true });
    if (!place) return res.status(404).json({ message: 'Place not found' });
    res.json(place);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  const deleted = await Place.findByIdAndDelete(req.params.id);
  if (!deleted) return res.status(404).json({ message: 'Place not found' });
  res.status(204).send();
});

export default router;
