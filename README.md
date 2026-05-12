# MapSaved

App privata mobile-first per gestire luoghi urbex "imminenti" senza caos.

## Migliorie UX incluse
- Dashboard con statistiche rapide (totali, esplorati, media voto).
- Ordinamento: recenti, distanza, voto, priorità.
- Parsing coordinate automatico da link Google Maps.
- Anteprima foto nelle card.
- Mappa + lista ottimizzate per telefono.

## Stack
- Frontend: HTML/CSS/JS vanilla + Leaflet
- Backend: Node.js + Express
- DB: MongoDB + Mongoose
- Hosting: Render

## Setup
```bash
npm install
cp .env.example .env
npm run dev
```

## Env
- `MONGODB_URI` (obbligatoria)
- `PORT` (default 10000)

## API
- `GET /api/places?q=&explored=`
- `POST /api/places`
- `PUT /api/places/:id`
- `DELETE /api/places/:id`
