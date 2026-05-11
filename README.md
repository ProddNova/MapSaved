# MapSaved

Web app privata (mobile-first) per salvare e gestire luoghi abbandonati da esplorare, con mappa, voti e stato esplorazione.

## Stack
- Frontend: HTML + CSS + JavaScript vanilla + Leaflet (OpenStreetMap)
- Backend: Node.js + Express
- Database: MongoDB (Mongoose)
- Deploy: Render.com

## Funzioni principali
- Aggiunta luogo da coordinate o link Google Maps.
- Modifica / eliminazione luoghi.
- Voti 1-10: generale, fattibilità accesso, integrità, notorietà.
- Stato: esplorato / da esplorare.
- Priorità: alta/media/bassa.
- Foto tramite URL multipli.
- Distanza automatica da Genova (o punto home configurabile) + stima tempo auto.
- Azioni rapide: copia coordinate, apri in Google Maps, ricerca web.
- Ricerca testuale e filtro per esplorazione.

## Avvio locale
1. Installa dipendenze:
   ```bash
   npm install
   ```
2. Crea `.env` da `.env.example` e inserisci la tua `MONGODB_URI`.
3. Avvia:
   ```bash
   npm run dev
   ```
4. Apri `http://localhost:10000`.

## Deploy su Render
1. Crea un nuovo **Web Service** da repo GitHub.
2. Build command: `npm install`
3. Start command: `npm start`
4. Environment variables:
   - `MONGODB_URI`
   - `PORT` (Render la gestisce automaticamente, facoltativo)
   - `HOME_LAT` (facoltativo)
   - `HOME_LNG` (facoltativo)
   - `HOME_LABEL` (facoltativo)

## API
- `GET /api/places?q=&explored=`
- `POST /api/places`
- `PUT /api/places/:id`
- `DELETE /api/places/:id`
- `GET /api/health`
