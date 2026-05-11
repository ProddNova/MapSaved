const home = {
  lat: Number(window.HOME_LAT || 44.4056),
  lng: Number(window.HOME_LNG || 8.9463),
  label: window.HOME_LABEL || 'Genova'
};

const map = L.map('map').setView([home.lat, home.lng], 8);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
let markers = [];

const listEl = document.querySelector('#list');
const dialog = document.querySelector('#placeDialog');
const form = document.querySelector('#placeForm');
const searchInput = document.querySelector('#searchInput');
const exploredFilter = document.querySelector('#exploredFilter');

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function travelEstimate(distanceKm) {
  const avgKmH = 65;
  const h = distanceKm / avgKmH;
  const minutes = Math.round(h * 60);
  return `${minutes} min (stima auto)`;
}

async function api(path = '', options = {}) {
  const res = await fetch(`/api/places${path}`, { headers: { 'Content-Type': 'application/json' }, ...options });
  if (!res.ok && res.status !== 204) throw new Error('Errore API');
  return res.status === 204 ? null : res.json();
}

function toPayload() {
  const photoUrls = document.querySelector('#photoUrls').value.split('\n').map(v => v.trim()).filter(Boolean).map(url => ({ url }));
  return {
    name: document.querySelector('#name').value.trim(),
    googleMapsUrl: document.querySelector('#googleMapsUrl').value.trim(),
    location: { lat: Number(document.querySelector('#lat').value), lng: Number(document.querySelector('#lng').value) },
    notes: document.querySelector('#notes').value.trim(),
    priority: document.querySelector('#priority').value,
    explored: document.querySelector('#explored').checked,
    ratings: {
      overall: Number(document.querySelector('#overall').value),
      access: Number(document.querySelector('#access').value),
      integrity: Number(document.querySelector('#integrity').value),
      notoriety: Number(document.querySelector('#notoriety').value)
    },
    photos: photoUrls
  };
}

function fillForm(p = null) {
  form.reset();
  document.querySelector('#placeId').value = p?._id || '';
  document.querySelector('#dialogTitle').textContent = p ? 'Modifica luogo' : 'Nuovo luogo';
  if (!p) return;
  document.querySelector('#name').value = p.name;
  document.querySelector('#googleMapsUrl').value = p.googleMapsUrl || '';
  document.querySelector('#lat').value = p.location.lat;
  document.querySelector('#lng').value = p.location.lng;
  document.querySelector('#notes').value = p.notes || '';
  document.querySelector('#priority').value = p.priority || 'medium';
  document.querySelector('#explored').checked = Boolean(p.explored);
  document.querySelector('#overall').value = p.ratings?.overall || 5;
  document.querySelector('#access').value = p.ratings?.access || 5;
  document.querySelector('#integrity').value = p.ratings?.integrity || 5;
  document.querySelector('#notoriety').value = p.ratings?.notoriety || 5;
  document.querySelector('#photoUrls').value = (p.photos || []).map(ph => ph.url).join('\n');
}

function placeCard(place) {
  const km = haversineKm(home.lat, home.lng, place.location.lat, place.location.lng);
  const gmap = place.googleMapsUrl || `https://maps.google.com/?q=${place.location.lat},${place.location.lng}`;
  return `<article class="card">
    <h3>${place.explored ? '✅' : '📍'} ${place.name}</h3>
    <div class="meta">${km.toFixed(1)} km da ${home.label} · ${travelEstimate(km)} · Priorità: ${place.priority}</div>
    <div class="meta">Voti → ⭐ ${place.ratings.overall}/10 · 🚪 ${place.ratings.access}/10 · 🧱 ${place.ratings.integrity}/10 · 👀 ${place.ratings.notoriety}/10</div>
    <div class="meta">${place.notes || 'Nessuna nota.'}</div>
    <div class="actions">
      <button data-edit="${place._id}">Modifica</button>
      <button data-delete="${place._id}">Elimina</button>
      <button data-copy="${place.location.lat},${place.location.lng}">Copia coord.</button>
      <a target="_blank" href="${gmap}">Apri Maps</a>
      <a target="_blank" href="https://www.google.com/search?q=${encodeURIComponent(place.name)}">Cerca web</a>
    </div>
  </article>`;
}

async function loadPlaces() {
  const params = new URLSearchParams();
  if (searchInput.value.trim()) params.set('q', searchInput.value.trim());
  if (exploredFilter.value) params.set('explored', exploredFilter.value);
  const places = await api(`?${params.toString()}`);

  markers.forEach(m => map.removeLayer(m));
  markers = places.map(p => L.marker([p.location.lat, p.location.lng]).addTo(map).bindPopup(`${p.name}<br>${p.explored ? 'Esplorato' : 'Da esplorare'}`));

  listEl.innerHTML = places.length ? places.map(placeCard).join('') : '<p>Nessun luogo salvato.</p>';
}

document.querySelector('#newPlaceBtn').addEventListener('click', () => { fillForm(); dialog.showModal(); });
document.querySelector('#cancelBtn').addEventListener('click', () => dialog.close());
searchInput.addEventListener('input', () => loadPlaces());
exploredFilter.addEventListener('change', () => loadPlaces());

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.querySelector('#placeId').value;
  const payload = toPayload();
  if (id) await api(`/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
  else await api('', { method: 'POST', body: JSON.stringify(payload) });
  dialog.close();
  await loadPlaces();
});

listEl.addEventListener('click', async (e) => {
  const editId = e.target.dataset.edit;
  const deleteId = e.target.dataset.delete;
  const copyValue = e.target.dataset.copy;

  if (copyValue) {
    await navigator.clipboard.writeText(copyValue);
    e.target.textContent = 'Copiato!';
    setTimeout(() => (e.target.textContent = 'Copia coord.'), 1000);
  }

  if (deleteId) {
    if (!confirm('Eliminare questo luogo?')) return;
    await api(`/${deleteId}`, { method: 'DELETE' });
    await loadPlaces();
  }

  if (editId) {
    const places = await api('');
    const place = places.find(p => p._id === editId);
    if (place) {
      fillForm(place);
      dialog.showModal();
    }
  }
});

map.on('click', (e) => {
  document.querySelector('#lat').value = e.latlng.lat.toFixed(6);
  document.querySelector('#lng').value = e.latlng.lng.toFixed(6);
});

loadPlaces();
