import express from 'express';
import Place from '../models/Place.js';

const router = express.Router();

router.get('/', async (req, res) => {
  const { q, explored } = req.query;
  const filter = {};

  if (q?.trim()) {
    filter.$text = { $search: q.trim() };
  }
  if (explored === 'true' || explored === 'false') {
    filter.explored = explored === 'true';
  }

  const places = await Place.find(filter).sort({ explored: 1, updatedAt: -1 });
  res.json(places);
});

router.post('/', async (req, res) => {
  const place = await Place.create(req.body);
  res.status(201).json(place);
});

router.put('/:id', async (req, res) => {
  const place = await Place.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  if (!place) {
    return res.status(404).json({ message: 'Place not found' });
  }

  res.json(place);
});

router.delete('/:id', async (req, res) => {
  const deleted = await Place.findByIdAndDelete(req.params.id);

  if (!deleted) {
    return res.status(404).json({ message: 'Place not found' });
  }

  res.status(204).send();
});

export default router;
