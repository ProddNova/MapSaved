const home = { lat: 44.4056, lng: 8.9463, label: 'Genova' };
const map = L.map('map').setView([home.lat, home.lng], 8);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
const iconTodo = new L.Icon.Default();
let markers = [];

const $ = (s) => document.querySelector(s);
const listEl = $('#list');

const state = { places: [] };

const haversineKm = (a,b,c,d)=>{const R=6371,p=Math.PI/180;const d1=(c-a)*p,d2=(d-b)*p;const x=Math.sin(d1/2)**2+Math.cos(a*p)*Math.cos(c*p)*Math.sin(d2/2)**2;return 2*R*Math.asin(Math.sqrt(x));};
const eta = (km)=> `${Math.round((km/65)*60)} min auto`;
const prioScore = { high: 3, medium: 2, low: 1 };

const parseCoordsFromMapsUrl = (url) => {
  if (!url) return null;
  const patterns = [/@(-?\d+\.\d+),(-?\d+\.\d+)/, /q=(-?\d+\.\d+),(-?\d+\.\d+)/, /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/];
  for (const p of patterns) { const m = url.match(p); if (m) return { lat: Number(m[1]), lng: Number(m[2]) }; }
  return null;
};

async function api(path='', options={}){const r=await fetch(`/api/places${path}`,{headers:{'Content-Type':'application/json'},...options}); if(!r.ok&&r.status!==204) throw new Error(await r.text()); return r.status===204?null:r.json();}

function renderStats(places){
  const explored = places.filter(p=>p.explored).length;
  const avg = places.length ? (places.reduce((s,p)=>s+(p.ratings?.overall||0),0)/places.length).toFixed(1) : '0.0';
  $('#stats').innerHTML = `<div class="stat"><div>Totali</div><b>${places.length}</b></div><div class="stat"><div>Esplorati</div><b>${explored}</b></div><div class="stat"><div>Media ⭐</div><b>${avg}</b></div>`;
}

function card(p){
  const km = haversineKm(home.lat,home.lng,p.location.lat,p.location.lng);
  const maps = p.googleMapsUrl || `https://maps.google.com/?q=${p.location.lat},${p.location.lng}`;
  const photos = (p.photos||[]).slice(0,3).map(x=>`<img src="${x.url}" loading="lazy" style="width:62px;height:62px;object-fit:cover;border-radius:8px;border:1px solid #2b3a57"/>`).join('');
  return `<article class="card"><h3>${p.explored?'✅':'📍'} ${p.name}</h3>
  <div class="chips"><span class="chip">${p.priority}</span><span class="chip">${km.toFixed(1)} km</span><span class="chip">${eta(km)}</span></div>
  <div class="meta">⭐ ${p.ratings.overall}/10 · 🚪 ${p.ratings.access}/10 · 🧱 ${p.ratings.integrity}/10 · 👀 ${p.ratings.notoriety}/10</div>
  <div class="meta">${p.notes||'Nessuna nota'}</div><div style="display:flex;gap:6px;margin-top:8px">${photos}</div>
  <div class="actions"><button data-edit="${p._id}">Modifica</button><button data-delete="${p._id}">Elimina</button><button data-copy="${p.location.lat},${p.location.lng}">Copia coord.</button><a target="_blank" href="${maps}">Google Maps</a></div></article>`;
}

function sortPlaces(places){
  const by = $('#sortBy').value;
  const sorted = [...places];
  if (by==='distance') sorted.sort((a,b)=>haversineKm(home.lat,home.lng,a.location.lat,a.location.lng)-haversineKm(home.lat,home.lng,b.location.lat,b.location.lng));
  else if (by==='overall') sorted.sort((a,b)=>(b.ratings?.overall||0)-(a.ratings?.overall||0));
  else if (by==='priority') sorted.sort((a,b)=>prioScore[b.priority]-prioScore[a.priority]);
  else sorted.sort((a,b)=>new Date(b.updatedAt)-new Date(a.updatedAt));
  return sorted;
}

function draw(places){
  markers.forEach(m=>map.removeLayer(m));
  markers = places.map(p=>L.marker([p.location.lat,p.location.lng],{icon:iconTodo}).addTo(map).bindPopup(`<b>${p.name}</b><br>${p.explored?'Esplorato':'Da esplorare'}`));
  renderStats(places);
  listEl.innerHTML = places.length ? sortPlaces(places).map(card).join('') : '<div class="panel">Nessun luogo</div>';
}

async function load(){
  const q = $('#searchInput').value.trim(); const exp = $('#exploredFilter').value;
  const p = new URLSearchParams(); if(q)p.set('q',q); if(exp)p.set('explored',exp);
  state.places = await api(`?${p.toString()}`);
  draw(state.places);
}

function payload(){
  return {name:$('#name').value.trim(),googleMapsUrl:$('#googleMapsUrl').value.trim(),location:{lat:Number($('#lat').value),lng:Number($('#lng').value)},notes:$('#notes').value.trim(),priority:$('#priority').value,explored:$('#explored').checked,ratings:{overall:Number($('#overall').value),access:Number($('#access').value),integrity:Number($('#integrity').value),notoriety:Number($('#notoriety').value)},photos:$('#photoUrls').value.split('\n').map(v=>v.trim()).filter(Boolean).map(url=>({url}))};
}

function openForm(p){ $('#placeForm').reset(); $('#placeId').value=p?._id||''; $('#dialogTitle').textContent=p?'Modifica luogo':'Nuovo luogo'; if(!p) return $('#placeDialog').showModal();
  $('#name').value=p.name; $('#googleMapsUrl').value=p.googleMapsUrl||''; $('#lat').value=p.location.lat; $('#lng').value=p.location.lng; $('#notes').value=p.notes||''; $('#priority').value=p.priority||'medium'; $('#explored').checked=!!p.explored;
  $('#overall').value=p.ratings?.overall||5; $('#access').value=p.ratings?.access||5; $('#integrity').value=p.ratings?.integrity||5; $('#notoriety').value=p.ratings?.notoriety||5; $('#photoUrls').value=(p.photos||[]).map(x=>x.url).join('\n'); $('#placeDialog').showModal();}

$('#newPlaceBtn').addEventListener('click',()=>openForm()); $('#cancelBtn').addEventListener('click',()=>$('#placeDialog').close());
$('#searchInput').addEventListener('input',load); $('#exploredFilter').addEventListener('change',load); $('#sortBy').addEventListener('change',()=>draw(state.places));
$('#extractCoordsBtn').addEventListener('click',()=>{const c=parseCoordsFromMapsUrl($('#googleMapsUrl').value.trim()); if(!c) return alert('Coordinate non trovate nel link'); $('#lat').value=c.lat; $('#lng').value=c.lng;});

$('#placeForm').addEventListener('submit', async (e)=>{e.preventDefault(); const id=$('#placeId').value; const data=payload(); if(id) await api(`/${id}`,{method:'PUT',body:JSON.stringify(data)}); else await api('',{method:'POST',body:JSON.stringify(data)}); $('#placeDialog').close(); await load();});

listEl.addEventListener('click', async (e)=>{const t=e.target; if(t.dataset.copy){await navigator.clipboard.writeText(t.dataset.copy); t.textContent='Copiato'; setTimeout(()=>t.textContent='Copia coord.',1000);} if(t.dataset.delete){if(confirm('Eliminare?')){await api(`/${t.dataset.delete}`,{method:'DELETE'}); await load();}} if(t.dataset.edit){openForm(state.places.find(p=>p._id===t.dataset.edit));}});
map.on('click',(e)=>{$('#lat').value=e.latlng.lat.toFixed(6); $('#lng').value=e.latlng.lng.toFixed(6);});
load();
