import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import placesRouter from './routes/places.js';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(morgan('dev'));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/health', (_, res) => {
  res.json({ ok: true, now: new Date().toISOString() });
});

app.use('/api/places', placesRouter);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: err.message || 'Internal error' });
});

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const port = Number(process.env.PORT || 10000);
const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  console.error('Missing MONGODB_URI env variable.');
  process.exit(1);
}

mongoose
  .connect(mongoUri)
  .then(() => {
    app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error('Mongo connection failed:', err.message);
    process.exit(1);
  });
