// Family Explorer — application (routeur, écrans, déroulé des aventures)
import { PLACES, TYPES, ROLES, COLLECTIONS, ALL_BADGES, LEVELS, AVATARS, WEATHER, KIND_LABEL } from './data.js';
import { generate, suggest, nearestPlace, warningsFor, levelFor, computeLevels, rng } from './generator.js';
import { state, save, uid, putPhoto, deletePhoto, photoURL, resizeImage, requestPersistence, exportBackup, importBackup, replaceState } from './store.js';
import { renderSouvenir } from './souvenir.js';
import { chest, icon, mascot, medal, guideArt, guideWho, character, CHARACTER_GALLERY, treasureMap, MAP_ZONES, PLACE_ICON, TYPE_ICON, KIND_ICON, ROLE_HAT, ICON_NAMES, MOODS, HAT_NAMES, COLLECTION_COLOR } from './art.js';
import { PHOTOS, placePhoto, stepPhoto, photoURLs, stepDetail, DEFAULT_HINTS } from './photos.js';
import { SOUNDS, play, setSoundEnabled, soundEnabled, preloadSounds, soundURLs } from './sounds.js';

const $ = (s, el = document) => el.querySelector(s);
const view = $('#view');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const placeById = id => PLACES.find(p => p.id === id);
const memberById = id => state.family.members.find(m => m.id === id);
const currentAdv = () => state.adventures.find(a => a.id === state.currentId && a.status === 'active') || null;
const doneAdvs = () => state.adventures.filter(a => a.status === 'done').sort((a, b) => b.finishedAt.localeCompare(a.finishedAt));
const explored = () => new Set(doneAdvs().map(a => a.placeId));
const advStars = a => a.steps.reduce((s, x) => s + (x.stars || 0), 0) + (a.bonus?.done ? 2 : 0);
const totalStars = () => doneAdvs().reduce((s, a) => s + advStars(a), 0);
const hourNow = () => new Date().getHours();
const youngestAge = () => Math.min(99, ...state.family.members.map(m => m.age));
const factOf = st => st.fact || st.quiz?.explain || null;
const factTotal = placeId => (placeById(placeId)?.steps || []).filter(factOf).length;
const factCount = () => Object.keys(state.facts || {}).length;
// Semaine (lundi) d'une date, pour la série d'aventures
const weekIdx = d => Math.floor((new Date(d).getTime() - Date.UTC(2024, 0, 1)) / (7 * 864e5));
function streak() {
  const weeks = new Set(doneAdvs().map(a => weekIdx(a.finishedAt)));
  let w = weekIdx(new Date()); if (!weeks.has(w)) w--;
  let n = 0; while (weeks.has(w)) { n++; w--; }
  return n;
}
const fmtDate = iso => new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

let draft = null;      // paramètres du générateur
let preview = null;    // aventure générée, pas encore lancée
const ui = { collTab: 'badges', calMonth: null, quizWrong: new Set(), clue: null, timer: null, rewardFor: null, souvenirURL: null, bonusHidden: false };
let installEvent = null;

// ---------- Utilitaires d'interface ----------
function toast(msg, ms = 2600) {
  document.querySelector('.toast')?.remove();
  const t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = msg;
  document.body.append(t); setTimeout(() => t.remove(), ms);
}
function openModal(html) {
  closeModal();
  const back = document.createElement('div'); back.className = 'modal-back';
  back.innerHTML = `<div class="modal" role="dialog" aria-modal="true">${html}</div>`;
  back.addEventListener('click', e => { if (e.target === back) closeModal(); });
  document.body.append(back);
  return back.firstElementChild;
}
function closeModal() { document.querySelector('.modal-back')?.remove(); }
function confetti() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const box = document.createElement('div'); box.className = 'confetti';
  const colors = ['#FFC23C', '#E0603A', '#0E6E8C', '#3E9B5A', '#C0397B'];
  for (let i = 0; i < 80; i++) {
    const c = document.createElement('i');
    c.style.left = Math.random() * 100 + 'vw'; c.style.background = colors[i % colors.length];
    c.style.animationDuration = 1.8 + Math.random() * 1.8 + 's'; c.style.animationDelay = Math.random() * .5 + 's';
    box.append(c);
  }
  document.body.append(box); setTimeout(() => box.remove(), 4200);
}
const levelInfo = stars => {
  let i = 0; LEVELS.forEach((l, k) => { if (stars >= l.min) i = k; });
  const cur = LEVELS[i], next = LEVELS[i + 1];
  return { cur, next, pct: next ? Math.round(((stars - cur.min) / (next.min - cur.min)) * 100) : 100 };
};
const weatherKind = () => state.weather?.kind || 'sun';

// ---------- Visuels ----------
const face = (adv, mood = 'happy') => `<div class="face art">${guideArt(adv, mood)}</div>`;
const credit = p => `<span class="credit">${esc(p.author)} · <a href="${p.page}" target="_blank" rel="noopener">${esc(p.license)}</a> · Wikimedia Commons</span>`;
const photoFig = (p, caption = '') => p ? `<figure class="photo-ref"><img src="${p.src}" alt="${esc(p.title)}" loading="lazy" onerror="this.closest('figure').classList.add('broken')">
  <figcaption>${caption ? `<b>${caption}</b>` : ''}<span>${esc(p.title)}</span>${credit(p)}</figcaption></figure>` : '';
const placeIcon = id => icon(PLACE_ICON[id] || 'compass');
function prefetchPhotos(urls) {
  for (const u of urls) fetch(u, { mode: 'no-cors' }).catch(() => {});
}

// ---------- Météo (Open-Meteo, sans clé) ----------
async function refreshWeather(force = false) {
  const w = state.weather;
  if (!force && (w?.manual || (w && Date.now() - w.at < 30 * 60 * 1000))) return;
  if (!navigator.onLine) return;
  try {
    const r = await fetch('https://api.open-meteo.com/v1/forecast?latitude=43.58&longitude=7.12&current=temperature_2m,weather_code,wind_speed_10m&timezone=Europe%2FParis');
    const j = await r.json(); const c = j.current;
    const code = c.weather_code, temp = c.temperature_2m, wind = c.wind_speed_10m;
    let kind = code <= 1 ? 'sun' : code <= 48 ? 'cloud' : 'rain';
    if (code >= 71 && code <= 77) kind = 'cloud';
    if (kind !== 'rain' && wind >= 35) kind = 'wind';
    if (kind === 'sun' && temp >= 30) kind = 'heat';
    state.weather = { kind, temp: Math.round(temp), wind: Math.round(wind), at: Date.now(), manual: false };
    save();
    if (route().path === 'accueil') render();
  } catch { /* hors ligne : on garde la dernière météo */ }
}

// ---------- Routeur ----------
function route() {
  const raw = location.hash.replace(/^#\/?/, '');
  const [pathPart, query = ''] = raw.split('?');
  const [path = 'accueil', arg] = pathPart.split('/');
  return { path: path || 'accueil', arg, q: Object.fromEntries(new URLSearchParams(query)) };
}
const go = h => { if (location.hash === h) render(); else location.hash = h; };

function render() {
  const r = route();
  if (!state.family.members.length && r.path !== 'bienvenue') { location.replace('#/bienvenue'); return; }
  clearInterval(ui.timer?.id); ui.timer = null;
  const screens = { accueil: home, explorer, aventure: adventure, collection, famille: family, creer: wizard, apercu: previewScreen, album: albumDetail, bienvenue: onboarding, kit: kitScreen, credits: creditsScreen, aventures: adventuresScreen };
  const fn = screens[r.path] || home;
  const tabbarHidden = ['bienvenue'].includes(r.path);
  document.getElementById('tabbar').hidden = tabbarHidden;
  view.classList.toggle('no-tabs', tabbarHidden);
  view.innerHTML = fn(r);
  if (ui.lastPath !== r.path + (r.arg || '')) { ui.lastPath = r.path + (r.arg || ''); view.classList.remove('anim'); void view.offsetWidth; view.classList.add('anim'); clearTimeout(ui.animT); ui.animT = setTimeout(() => view.classList.remove('anim'), 900); }
  const tab = { creer: 'accueil', apercu: 'accueil', album: 'collection', kit: 'famille', credits: 'famille', aventures: 'aventure' }[r.path] || r.path;
  document.querySelectorAll('.tabbar a').forEach(a => {
    a.toggleAttribute('aria-current', a.dataset.tab === tab); if (a.dataset.tab === tab) a.setAttribute('aria-current', 'page');
    a.classList.toggle('live', a.dataset.tab === 'aventure' && !!currentAdv());
  });
  after[r.path]?.(r);
}
const after = {};
window.addEventListener('hashchange', () => { window.scrollTo(0, 0); render(); });

// ---------- Écran : Bienvenue ----------
let onboardMembers = [];
function onboarding() {
  return `
  <div class="splash">
    ${logo()}
    <div class="splash-pistou">${character('pistou', 'happy', 'splash-char')}</div>
    <div class="speech big"><b>Salut ! Je suis Pistou !</b><span>Prêt·e à explorer Antibes et Juan-les-Pins avec moi ?</span></div>
  </div>
  <div class="principles">
    <div class="card">${icon('binoculars', 'ico-lg')}<b>Découvrir</b></div>
    <div class="card">${icon('dice', 'ico-lg')}<b>Jouer</b></div>
    <div class="card">${icon('trophy', 'ico-lg')}<b>Collectionner</b></div>
  </div>
  <div class="card stack">
    <h2>Votre équipe</h2>
    <div class="field"><label for="ob-family">Nom de la famille (facultatif)</label>
      <input id="ob-family" class="input" placeholder="Ex. : Les Martin" value="${esc(state.family.name)}" autocomplete="off"></div>
    <div>${onboardMembers.map(m => `<div class="member"><div class="av">${m.avatar}</div><div class="info"><b>${esc(m.name)}</b><div class="muted small">${m.age} ans</div></div><button class="icon-btn" data-act="ob-remove" data-id="${m.id}" aria-label="Retirer ${esc(m.name)}">✕</button></div>`).join('')}</div>
    <button class="btn ghost block" data-act="member-add" data-ctx="onboard">➕ Ajouter un explorateur</button>
  </div>
  <button class="btn big block" data-act="ob-done" ${onboardMembers.length ? '' : 'disabled'}>C'est parti ! 🚀</button>
  <p class="muted small center">Tout reste sur ce téléphone. Un seul appareil suffit pour toute la famille.</p>`;
}

// ---------- Écran : Accueil ----------
function home() {
  const members = state.family.members;
  const cur = currentAdv();
  const w = state.weather; const wk = weatherKind();
  const sug = suggest(wk, hourNow(), explored(), Number(new Date().toISOString().slice(0, 10).replace(/-/g, '')), youngestAge());
  const stars = totalStars(); const lv = levelInfo(stars);
  const recent = Object.entries(state.badges).sort((a, b) => b[1].localeCompare(a[1])).slice(0, 5).map(([id]) => ALL_BADGES.find(b => b.id === id)).filter(Boolean);
  const T = TYPES[sug.type];
  return `
  ${navigator.onLine ? '' : '<div class="offline-flag" style="border-radius:12px">📴 Hors connexion : les aventures fonctionnent, la carte et la météo attendront.</div>'}
  <div class="greet">
    <span class="greet-av">${members[0]?.avatar || '🦊'}</span>
    <h2>Bonjour ${esc(members.length === 1 ? members[0].name : (state.family.name || 'les explorateurs'))} !</h2>
    <button class="chip weather" data-act="weather-pick" aria-label="Météo : ${WEATHER[wk].name}. Modifier">${WEATHER[wk].emoji} ${w?.temp != null && !w.manual ? w.temp + '°' : WEATHER[wk].name}</button>
    <a class="icon-btn gear" href="#/famille" aria-label="Réglages de la famille">⚙️</a>
  </div>

  ${cur ? `
  <div class="card sun stack">
    <div class="row" style="align-items:center"><div class="cur-char">${guideArt(cur, 'walk')}</div>
      <div style="flex:1"><p class="small muted">Aventure en cours</p><h3>${esc(cur.title)}</h3><p class="small">Mission ${Math.min(cur.pos + 1, cur.steps.length)} sur ${cur.steps.length}</p></div></div>
    <a class="btn sea block" href="#/aventure">Reprendre l'aventure ▶️</a>
  </div>` : ''}

  <div class="home-hero">
    <div class="speech">Prêt pour une nouvelle aventure ?</div>
    ${character('pistou', 'happy', 'home-char')}
  </div>
  <div class="tiles3">
    <a class="tile" href="#/explorer">${icon('spyglass')}<b>Découvrir</b><small>les lieux</small></a>
    <a class="tile" href="#/aventures">${icon('puzzle')}<b>Jouer</b><small>des missions</small></a>
    <a class="tile" href="#/collection">${icon('trophy')}<b>Collectionner</b><small>des badges</small></a>
  </div>

  ${dayCard(sug)}
  <div class="row">
    <a class="btn" href="#/creer">${icon('map', 'ico-btn')} Créer</a>
    <button class="btn ghost" data-act="surprise">${icon('dice', 'ico-btn')} Surprise</button>
  </div>

  <div class="card level-card">
    <div class="em">${lv.cur.emoji}</div>
    <div style="flex:1" class="stack">
      <div class="row" style="justify-content:space-between"><b>${lv.cur.name}</b><span class="small muted">⭐ ${stars}${lv.next ? ' / ' + lv.next.min : ''}</span></div>
      <div class="progress" role="progressbar" aria-valuenow="${lv.pct}" aria-valuemin="0" aria-valuemax="100"><i style="width:${lv.pct}%"></i></div>
      ${lv.next ? `<span class="small muted">Prochain grade : ${lv.next.emoji} ${lv.next.name}</span>` : '<span class="small">Grade maximum atteint !</span>'}
    </div>
  </div>

  <div class="home-chips">
    <div class="chip-stat ${streak() ? 'hot' : ''}">${icon('flame')}<span><b>${streak()}</b> semaine${streak() > 1 ? 's' : ''} d'affilée</span></div>
    <a class="chip-stat" href="#/collection" data-act="coll-tab" data-id="savoir">${icon('book')}<span><b>${factCount()}</b> secret${factCount() > 1 ? 's' : ''} d'Antibes</span></a>
  </div>

  ${recent.length ? `<div class="section-title"><h3>Derniers badges</h3><a href="#/collection" class="small" style="color:var(--sea)">Tout voir</a></div>
  <div class="medal-row">${recent.map(b => `<div class="medal-mini">${medal(b.id, b.collection)}<small>${esc(b.name)}</small></div>`).join('')}</div>` : ''}`;
}

// ---------- Écran : Explorer (carte) ----------
function explorer() {
  const ex = explored();
  const real = ui.mapMode === 'reelle';
  return `
  <div class="top"><h1>Explorer</h1></div>
  <div class="tabs" role="tablist">
    <button role="tab" aria-selected="${!real}" data-act="map-mode" data-m="tresor">${icon('map', 'ico-tab')} Carte au trésor</button>
    <button role="tab" aria-selected="${real}" data-act="map-mode" data-m="reelle">${icon('compass', 'ico-tab')} Carte réelle</button>
  </div>
  ${real ? `<div id="map" role="region" aria-label="Carte des lieux d'Antibes"><div class="empty"><div class="em">🗺️</div><p class="muted">Chargement de la carte…</p></div></div>`
    : `<div class="chip-row zones">${Object.entries(MAP_ZONES).map(([k, z]) => `<button class="chip" data-act="map-zone" data-z="${k}" aria-pressed="${(ui.mapZone || 'tout') === k}">${z.label}</button>`).join('')}</div>
    <div class="tmap-wrap">${treasureMap(PLACES, ex, ui.mapZone || 'tout')}</div><p class="small muted center">Touchez un lieu pour partir à l'aventure. Choisissez un quartier pour zoomer.</p>`}
  <div class="legend"><span><i class="dot done"></i> Exploré (${ex.size})</span><span><i class="dot"></i> À découvrir (${PLACES.length - ex.size})</span></div>
  <div class="stack">
    ${PLACES.map(p => `
    <div class="card row" style="align-items:center;padding:14px">
      <div class="place-ico ${ex.has(p.id) ? 'done' : ''}">${placeIcon(p.id)}</div>
      <div style="flex:1"><b>${esc(p.name)}</b><div class="small muted">${p.area}${ex.has(p.id) ? ' · ✅ exploré' : ''}${p.indoor ? ' · ☔ abrité' : ''}</div></div>
      <a class="btn sea" style="min-height:48px;padding:8px 16px;font-size:16px" href="#/creer?place=${p.id}" aria-label="Créer une aventure : ${esc(p.name)}">Jouer</a>
    </div>`).join('')}
  </div>`;
}
let leafletP;
function loadLeaflet() {
  if (window.L) return Promise.resolve(window.L);
  return leafletP ||= new Promise((res, rej) => {
    const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'; document.head.append(css);
    const s = document.createElement('script'); s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    s.onload = () => res(window.L); s.onerror = () => { leafletP = null; rej(new Error('leaflet')); }; document.head.append(s);
  });
}
after.explorer = async () => {
  const el = document.getElementById('map');
  if (!el) return;
  try {
    const L = await loadLeaflet();
    if (!document.getElementById('map')) return;
    el.innerHTML = '';
    const map = L.map(el, { zoomControl: true, attributionControl: true }).setView([43.572, 7.118], 13);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '© OpenStreetMap' }).addTo(map);
    const ex = explored();
    for (const p of PLACES) {
      const pin = L.divIcon({ className: '', html: `<div class="map-pin ${ex.has(p.id) ? 'done' : ''}">${placeIcon(p.id)}</div>`, iconSize: [44, 44], iconAnchor: [22, 22] });
      L.marker([p.lat, p.lng], { icon: pin, title: p.name }).addTo(map)
        .bindPopup(`<b>${esc(p.name)}</b><br>${ex.has(p.id) ? '✅ Déjà exploré' : '✨ À découvrir'}<br><a class="btn sea" href="#/creer?place=${p.id}">Créer une aventure</a>`);
    }
    map.fitBounds(L.latLngBounds(PLACES.map(p => [p.lat, p.lng])), { padding: [18, 18] });
    if (navigator.geolocation && localStorage.getItem('fe-geo') === '1') {
      navigator.geolocation.getCurrentPosition(pos => L.circleMarker([pos.coords.latitude, pos.coords.longitude], { radius: 9, color: '#0E6E8C', fillOpacity: .8 }).addTo(map), () => {});
    }
  } catch {
    el.innerHTML = '<div class="empty"><div class="em">📴</div><p class="muted">La carte a besoin d\'internet. La liste des lieux ci-dessous fonctionne hors connexion.</p></div>';
  }
};

// ---------- Écran : Créer une aventure ----------
function ensureDraft(q = {}) {
  if (!draft || q.place || q.type) {
    draft = {
      placeId: q.place || draft?.placeId || 'vieil-antibes',
      memberIds: draft?.memberIds?.length ? draft.memberIds : state.family.members.map(m => m.id),
      duration: draft?.duration || state.settings.duration || 45,
      difficulty: draft?.difficulty || state.settings.difficulty || 'auto',
      type: q.type || draft?.type || 'treasure',
      weather: draft?.weather || weatherKind(),
    };
  }
  draft.memberIds = draft.memberIds.filter(memberById);
  if (!draft.memberIds.length) draft.memberIds = state.family.members.map(m => m.id);
}
const AREAS = [
  ['Vieille ville et port', p => p.area === 'Antibes' && p.lat < 43.5925 && p.lng > 7.115 && !p.indoor && !p.tags.includes('nature')],
  ['Musées et lieux abrités', p => p.indoor],
  ['Cap d\'Antibes', p => p.area === 'Cap d\'Antibes' && !p.indoor],
  ['Juan-les-Pins', p => p.area === 'Juan-les-Pins' && !p.indoor],
  ['Parcs, jardins et nature', p => !p.indoor && (p.tags.includes('nature') || ['Villeneuve-Loubet', 'Valbonne'].includes(p.area)) && !(p.area === 'Cap d\'Antibes' || p.area === 'Juan-les-Pins')],
  ['Quartiers d\'Antibes', p => p.area === 'Antibes' && !p.indoor && !p.tags.includes('nature') && !(p.lat < 43.5925 && p.lng > 7.115)],
];
function wizard(r) {
  ensureDraft(r.q);
  if (r.q.place || r.q.type) history.replaceState(null, '', '#/creer');
  const ex = explored();
  const members = state.family.members;
  const sel = draft.memberIds.map(memberById).filter(Boolean);
  const levels = computeLevels(sel, draft.difficulty);
  const place = placeById(draft.placeId);
  const warns = place ? warningsFor(place, draft.weather, hourNow(), sel) : [];
  const press = c => `aria-pressed="${c}"`;
  return `
  <div class="top"><a class="icon-btn" href="#/accueil" aria-label="Retour">←</a><h1>Nouvelle aventure</h1></div>

  <section class="stack"><h2>1. Où allons-nous ?</h2>
    ${AREAS.map(([title, test]) => `<h3 class="area-title">${title}</h3><div class="place-grid">
      ${PLACES.filter(test).map(p => `<button class="place" data-act="d-set" data-k="placeId" data-v="${p.id}" ${press(draft.placeId === p.id)}>
        <span class="em">${placeIcon(p.id)}</span><b>${esc(p.name)}</b><small>${p.indoor ? '☔ abrité' : p.area}${p.minAge ? ` · ${p.minAge} ans +` : ''}</small>${ex.has(p.id) ? '<span class="done-dot" aria-label="déjà exploré">✅</span>' : ''}</button>`).join('')}</div>`).join('')}
    <div class="place-grid">
      <button class="place" data-act="d-set" data-k="placeId" data-v="autour" ${press(draft.placeId === 'autour')}><span class="em">${placeIcon('autour')}</span><b>Autour de moi</b><small>Géolocalisation</small></button>
    </div>
  </section>

  <section class="stack"><h2>2. Qui part à l'aventure ?</h2>
    <div class="member-toggle">
      ${members.map(m => `<button class="chip" data-act="d-member" data-id="${m.id}" ${press(draft.memberIds.includes(m.id))}><span class="av">${m.avatar}</span>${esc(m.name)} · ${m.age} ans</button>`).join('')}
      <button class="chip" data-act="member-add" data-ctx="wizard">➕</button>
    </div>
  </section>

  <section class="stack"><h2>3. Combien de temps ?</h2>
    <div class="chip-row">${[20, 45, 60, 90].map(d => `<button class="chip" data-act="d-set" data-k="duration" data-v="${d}" ${press(draft.duration === d)}>⏱️ ${d} min</button>`).join('')}</div>
  </section>

  <section class="stack"><h2>4. Quel type d'aventure ?</h2>
    <div class="type-grid">
      ${Object.entries(TYPES).map(([id, t]) => `<button class="type-btn" data-act="d-set" data-k="type" data-v="${id}" ${press(draft.type === id)}><span class="em">${icon(TYPE_ICON[id])}</span>${t.name}</button>`).join('')}
      <button class="type-btn surprise" data-act="d-set" data-k="type" data-v="surprise" ${press(draft.type === 'surprise')}><span class="em">${icon('dice')}</span>Mission surprise : scénario secret !</button>
    </div>
  </section>

  <section class="stack"><h2>5. Niveau</h2>
    <div class="chip-row">
      ${[['auto', '🎯 Selon l\'âge'], ['easy', '🐣 Facile'], ['hard', '🦅 Avancé']].map(([v, l]) => `<button class="chip" data-act="d-set" data-k="difficulty" data-v="${v}" ${press(draft.difficulty === v)}>${l}</button>`).join('')}
    </div>
    ${draft.difficulty === 'auto' && sel.length ? `<p class="small muted">${sel.map(m => `${m.avatar} ${esc(m.name)} → ${levels.hard.includes(m) ? 'avancé' : 'facile'}`).join(' · ')}</p>` : ''}
  </section>

  <section class="stack"><h2>6. Les conditions</h2>
    <div class="chip-row">${Object.entries(WEATHER).map(([k, w]) => `<button class="chip" data-act="d-set" data-k="weather" data-v="${k}" ${press(draft.weather === k)}>${w.emoji} ${w.name}</button>`).join('')}</div>
    <p class="small muted">🕒 Il est ${hourNow()} h. ${state.weather && !state.weather.manual ? `Météo d'Antibes : ${state.weather.temp}°, vent ${state.weather.wind} km/h.` : ''}</p>
    ${warns.length ? `<div class="card" style="padding:6px 16px">${warns.map(w => `<div class="warn"><span>${w.icon}</span><p>${esc(w.text)}</p></div>`).join('')}</div>` : ''}
  </section>

  <button class="btn big block" data-act="generate" ${sel.length ? '' : 'disabled'}>🪄 Générer l'aventure</button>`;
}

async function doGenerate(seed) {
  ensureDraft();
  let nearPlaceId = null;
  if (draft.placeId === 'autour') {
    toast('📍 Recherche de votre position…');
    try {
      const pos = await new Promise((res, rej) => navigator.geolocation ? navigator.geolocation.getCurrentPosition(res, rej, { timeout: 9000, maximumAge: 300000 }) : rej());
      localStorage.setItem('fe-geo', '1');
      const n = nearestPlace(pos.coords.latitude, pos.coords.longitude);
      if (n.km <= 3) nearPlaceId = n.place.id;
      else toast('Vous êtes loin des lieux d\'Antibes : aventure de quartier générée.');
    } catch { toast('Position indisponible : aventure de quartier générée.'); }
  }
  const members = draft.memberIds.map(memberById).filter(Boolean);
  const placeKey = nearPlaceId || draft.placeId;
  preview = generate({
    placeId: draft.placeId, nearPlaceId, members, duration: draft.duration, difficulty: draft.difficulty,
    type: draft.type, weather: draft.weather, hour: hourNow(), seed, history: state.history[placeKey] || [],
  });
  state.settings.duration = draft.duration; state.settings.difficulty = draft.difficulty; save();
  play('magic', { volume: 0.7 });
  go('#/apercu');
}

// ---------- Écran : Aperçu ----------
function previewScreen() {
  if (!preview) { location.replace('#/creer'); return ''; }
  const a = preview; const T = TYPES[a.type]; const secret = a.surprise;
  const missions = a.steps.filter(s => s.kind !== 'final');
  return `
  <div class="top"><a class="icon-btn" href="#/creer" aria-label="Modifier">←</a><h2>Votre aventure</h2></div>
  ${placeHero(a, secret ? 'Mission surprise' : `${T.name}${a.themeName ? ' · ' + a.themeName : ''}`, secret)}
  <div class="guide">
    ${secret ? `<div class="face art">${mascot({ hat: 'explorer', mood: 'wink', accessory: false })}</div>` : face(a)}
    <div class="bubble parchment"><b>${secret ? 'Personnage mystère' : esc(a.guide.name)}</b>${secret ? 'Le scénario sera révélé une fois sur place. Prêts à être surpris ?' : esc(a.intro)}</div>
  </div>
  <div class="card stack">
    <h3>Les missions</h3>
    <ol class="steps-preview">
      ${missions.map(s => `<li><span class="kind-ico">${icon(KIND_ICON[s.kind])}</span><span class="${secret ? 'mystery' : ''}">${esc(s.title)}</span></li>`).join('')}
      <li><span class="kind-ico">${icon('lock')}</span><span>${esc(a.steps.at(-1).title)} : le code secret</span></li>
    </ol>
  </div>
  ${a.warnings.length ? `<div class="card" style="padding:6px 16px"><h3 style="padding-top:12px">À savoir avant de partir</h3>${a.warnings.map(w => `<div class="warn"><span>${w.icon}</span><p>${esc(w.text)}</p></div>`).join('')}</div>` : ''}
  <button class="btn big block leaf" data-act="start">🚀 C'est parti !</button>
  <div class="row"><button class="btn ghost" data-act="reroll">🔄 Autre version</button><a class="btn ghost" href="#/creer">✏️ Modifier</a></div>`;
}

// Bandeau photo du lieu (ou illustration si pas de photo)
function placeHero(a, label, secret = false) {
  const p = placePhoto(a.placeId);
  return `<div class="hero place-hero ${p ? 'has-photo' : ''}" ${p ? `style="--bg:url('${p.src}')"` : ''}>
    <span class="pill" style="align-self:flex-start;color:var(--ink)">${icon(secret ? 'dice' : TYPE_ICON[a.type], 'ico-pill')} ${esc(label)}</span>
    <h1 class="${secret ? 'mystery' : ''}">${esc(a.title)}</h1>
    <p>${esc(a.placeName)} · ${a.duration} min · ${a.steps.length - 1} missions</p>
    ${p ? `<span class="hero-credit">Photo : ${esc(p.author)} · ${esc(p.license)}</span>` : `<div class="hero-ico">${placeIcon(a.placeId)}</div>`}
  </div>`;
}

// ---------- Logo, aventure du jour, aventures prêtes à jouer ----------
function logo() {
  return `<div class="logo" role="img" aria-label="Family Explorer, les sorties deviennent des aventures">
    <span class="logo-title">Family<br>Explorer</span><span class="logo-compass">${icon('compass')}</span>
    <span class="logo-ribbon">Les sorties deviennent des aventures</span></div>`;
}
const CAT_NATURE = ['nature', 'jardin', 'forêt', 'oiseaux', 'rivière', 'randonnée', 'mer'];
const CAT_CULTURE = ['histoire', 'art', 'culture', 'musique', 'quartier', 'goût'];
function readyList() {
  if (ui.ready) return ui.ready;
  const members = state.family.members;
  ui.ready = PLACES.map((p, i) => {
    const short = p.steps.length <= 5 || p.tags.includes('petits') || p.tags.includes('jeux');
    const duration = short ? 20 : 45;
    const type = p.tags.includes('nature') ? 'nature' : p.tags.includes('art') ? 'detective' : p.tags.includes('mer') ? 'treasure' : (i % 2 ? 'detective' : 'treasure');
    const seed = 1000 + i * 37;
    const cats = [CAT_NATURE.some(t => p.tags.includes(t)) && 'nature', CAT_CULTURE.some(t => p.tags.includes(t)) && 'culture'].filter(Boolean);
    let title = p.name;
    try { title = generate({ placeId: p.id, members, duration, difficulty: 'auto', type, weather: 'sun', hour: 11, seed }).title; } catch { /* titre par défaut */ }
    return { id: p.id, place: p, duration, type, seed, cats, ages: `${p.minAge || 5}-12 ans`, title };
  });
  return ui.ready;
}
function readyCard(r) {
  const ph = placePhoto(r.id);
  return `<button class="ready-card" data-act="ready" data-id="${r.id}">
    <span class="ready-photo" style="${ph ? `background-image:url('${ph.src}')` : ''}">${ph ? '' : `<span class="ready-ico">${placeIcon(r.id)}</span>`}<span class="ready-type">${icon(TYPE_ICON[r.type], 'ico-pill')} ${TYPES[r.type].name}</span></span>
    <span class="ready-body"><b>${esc(r.title)}</b><span class="ready-place">${esc(r.place.name)}</span>
      <span class="ready-meta">⏱️ ${r.duration} min · 👤 ${r.ages}</span></span>
    <span class="ready-go" aria-hidden="true">›</span></button>`;
}
function dayCard(sug) {
  const r = readyList().find(x => x.id === sug.place.id) || readyList()[0];
  const ph = placePhoto(r.id);
  return `<button class="day-card" data-act="ready" data-id="${r.id}">
    <span class="day-photo" style="${ph ? `background-image:url('${ph.src}')` : ''}">${ph ? '' : placeIcon(r.id)}<span class="day-chip">Aventure du jour</span></span>
    <span class="day-body"><b>${esc(r.title)}</b><span>${icon('map', 'ico-pill')} ${esc(r.place.name)} · ${r.duration} min${sug.fresh ? ' · <em>Nouveau lieu !</em>' : ''}</span></span>
    <span class="day-go" aria-hidden="true">›</span></button>`;
}
function adventuresScreen() {
  const f = ui.readyFilter || 'toutes';
  const list = readyList().filter(r => f === 'toutes' || (f === 'courtes' ? r.duration <= 20 : r.cats.includes(f)));
  const cur = currentAdv();
  return `
  <div class="top"><h1>Aventures</h1></div>
  ${cur ? `<a class="card cur-card" href="#/aventure"><div class="cur-char">${guideArt(cur, 'walk')}</div><div style="flex:1"><span class="small muted">Aventure en cours</span><b>${esc(cur.title)}</b><span class="small">Mission ${Math.min(cur.pos + 1, cur.steps.length)} sur ${cur.steps.length}</span></div><span class="ready-go">›</span></a>` : ''}
  <div class="filters" role="tablist">${[['toutes', 'Toutes'], ['courtes', 'Courtes'], ['nature', 'Nature'], ['culture', 'Culture']].map(([id, l]) => `<button role="tab" aria-selected="${f === id}" data-act="ready-filter" data-id="${id}">${l}</button>`).join('')}</div>
  <div class="stack">${list.map(readyCard).join('') || '<p class="muted center">Aucune aventure dans cette catégorie.</p>'}</div>
  <a class="btn ghost block" href="#/creer">${icon('map', 'ico-btn')} Créer mon aventure sur mesure</a>`;
}

function startAdventure() {
  const cur = currentAdv();
  if (cur) cur.status = 'abandoned';
  const a = { ...preview, id: uid(), createdAt: new Date().toISOString(), status: 'active', pos: 0, introSeen: false };
  state.adventures.push(a); state.currentId = a.id; save();
  prefetchPhotos([...photoURLs(a.placeId, a.steps.map(s => s.id)), ...soundURLs()]); // disponibles hors connexion pendant l'aventure
  play('page');
  const pl = placeById(a.placeId); const m = new Date().getMonth();
  if (pl?.tags.includes('mer')) play('gull', { volume: 0.35, delay: 500 });
  else if (pl?.tags.includes('nature') && m >= 5 && m <= 8) play('cicada', { volume: 0.3, delay: 500 });
  preview = null; ui.quizWrong.clear(); ui.clue = null; ui.bonusHidden = false;
  go('#/aventure');
}

// ---------- Écran : Aventure en cours ----------
function nameList(ids) { return ids.map(memberById).filter(Boolean).map(m => `${m.avatar} ${esc(m.name)}`).join(', '); }

function adventure() {
  const a = currentAdv();
  if (!a) return `
    <div class="top"><h1>Aventure</h1></div>
    <div class="card empty">${character('pistou', 'thinking', 'empty-char')}<h2>Aucune aventure en cours</h2><p class="muted">Choisissez une aventure prête à jouer ou créez la vôtre !</p>
      <a class="btn block" href="#/aventures">${icon('puzzle', 'ico-btn')} Aventures prêtes à jouer</a><a class="btn ghost block" href="#/creer">${icon('map', 'ico-btn')} Créer une aventure</a></div>`;

  const missions = a.steps.length;
  const step = a.steps[a.pos];
  const pct = Math.round((a.steps.filter(s => s.done).length / missions) * 100);
  const stars = advStars(a);
  const letters = a.steps.filter(s => s.kind !== 'final');
  const head = `
  <div class="mission-top">
    <button class="icon-btn" data-act="adv-menu" aria-label="Options de l'aventure">☰</button>
    <div class="mt-mid"><b>${a.introSeen ? (step.kind === 'final' ? 'Le code secret' : `Mission ${a.pos + 1} / ${missions - 1}`) : esc(a.title)}</b>
      <div class="segs" aria-label="Progression : ${pct} %">${a.steps.map((st, i) => `<i class="${st.done ? 'done' : i === a.pos && a.introSeen ? 'cur' : ''}"></i>`).join('')}</div></div>
    <button class="icon-btn snd" data-act="sound-toggle" aria-label="${soundEnabled() ? 'Couper le son' : 'Activer le son'}">${icon(soundEnabled() ? 'speaker' : 'mute')}</button>
    <span class="pill">⭐ ${stars}</span>
  </div>
  <div class="letters" aria-label="Lettres du code secret">${letters.map(s => `<span class="letter ${s.done ? '' : 'empty'}">${s.done ? s.letter : '?'}</span>`).join('')}</div>`;

  // Introduction
  if (!a.introSeen) {
    return `${head}
    ${placeHero(a, `${TYPES[a.type].name}${a.themeName ? ' · ' + a.themeName : ''}`)}
    <div class="story parchment">
      <div class="story-art">${guideArt(a, 'story')}</div>
      <div class="stack"><b class="story-name">${esc(a.guide.name)}</b><p>${esc(a.intro)}</p><p class="small">Chaque mission réussie vous donne une <b>lettre du code secret</b> !</p></div>
    </div>
    ${a.memberIds.length >= 2 ? `<div class="card stack"><h3>Les rôles de l'équipe</h3><p class="small muted">Ils changent à chaque mission, pour que chacun participe.</p>
      <div class="role-team">${ROLES.slice(0, Math.min(Math.max(a.memberIds.length, 3), ROLES.length)).map(r => `<div class="role-card">${mascot({ hat: ROLE_HAT[r.id], mood: 'happy' })}<b>${r.name}</b><span class="muted small">${r.job}</span></div>`).join('')}</div></div>` : ''}
    <button class="btn big block leaf" data-act="intro-ok">Première mission ➜</button>`;
  }

  // Lettre gagnée
  if (ui.clue) {
    const last = a.pos >= missions - 1;
    return `${head}
    <div class="card clue-pop">
      <div class="clue-art">${guideArt(a, 'cheer')}</div>
      <p class="muted">Mission réussie ! Nouvelle lettre du code :</p>
      <div class="letter flip">${ui.clue.letter}</div>
      <div class="stars-row">${Array.from({ length: 3 }, (_, i) => `<span class="star-pop" style="animation-delay:${0.35 + i * 0.18}s">${icon('star', i < ui.clue.stars ? 'on' : 'off')}</span>`).join('')}</div>
      ${ui.clue.fact ? `<div class="fact-card"><span class="fact-ico">${icon('book')}</span><div><b>Le savais-tu ?${ui.clue.isNew ? ' <span class="pill new">Nouveau secret !</span>' : ''}</b><p>${esc(ui.clue.fact)}</p></div></div>` : ''}
      <div class="bubble parchment" style="text-align:left;width:100%"><b>${esc(a.guide.name)}</b>${esc(a.lines[a.pos % a.lines.length])}</div>
    </div>
    <button class="btn big block leaf" data-act="clue-ok">${last ? icon('key', 'ico-btn') + ' Le code secret' : 'Mission suivante ➜'}</button>`;
  }

  const bonus = a.bonus && !a.bonus.done && a.pos > a.bonus.unlockAfter && !ui.bonusHidden ? bonusCard(a) : '';
  if (step.kind === 'final') return `${head}${finalStep(a, step)}${bonus}`;

  const K = KIND_LABEL[step.kind];
  const easyIds = a.levels.easy, hardIds = a.levels.hard;
  const both = easyIds.length && hardIds.length;
  const levelsHtml = both
    ? `<div class="level easy"><span class="who">🐣 ${nameList(easyIds)}</span>${esc(step.easy)}</div>
       <div class="level hard"><span class="who">🦅 ${nameList(hardIds)}</span>${esc(step.hard)}</div>`
    : `<div class="level ${hardIds.length ? 'hard' : 'easy'}">${esc(hardIds.length ? step.hard : step.easy)}</div>`;
  const roles = step.roles?.length ? `<div class="roles">${step.roles.map(r => { const m = memberById(r.memberId); const R = ROLES.find(x => x.id === r.role); return m ? `<span class="pill role-pill"><span class="role-mini">${mascot({ hat: ROLE_HAT[R.id], accessory: false })}</span>${m.avatar} ${esc(m.name)} = ${R.name}</span>` : ''; }).join('')}</div>` : '';

  return `${head}
  <div class="guide">${face(a, a.pos % 2 ? 'thinking' : 'happy')}<div class="bubble"><b>${esc(a.guide.name)}</b>${esc(a.lines[(a.pos + 1) % a.lines.length])}</div></div>
  <article class="mission">
    <div class="band"><span class="k">${icon(KIND_ICON[step.kind])}</span><h2>${esc(step.title)}</h2><span class="small">${K.name}</span></div>
    <div class="inner">
      ${roles}
      ${step.coop ? '<span class="pill leaf" style="align-self:flex-start">🤝 Mission d\'équipe : tout le monde participe !</span>' : ''}
      ${levelsHtml}
      ${missionVisual(a, step)}
      ${stepAction(a, step)}
    </div>
  </article>
  <button class="btn ghost block" data-act="skip" style="min-height:48px;font-size:16px">Passer cette mission</button>
  ${bonus}`;
}

function stepAction(a, step) {
  switch (step.kind) {
    case 'observe':
      return `<button class="btn big block leaf" data-act="complete" data-stars="1">✅ Trouvé !</button>`;
    case 'photo':
      return `
      <div class="photo-strip" id="strip">${(step.photoIds || []).map(id => `<img data-photo="${id}" alt="Photo de la mission">`).join('')}</div>
      <label class="btn big block sea" style="cursor:pointer">📷 ${step.photoIds?.length ? 'Une autre photo' : 'Prendre la photo'}
        <input type="file" accept="image/*" capture="environment" class="sr" data-photo-input="step"></label>
      <button class="btn block leaf" data-act="complete" data-stars="${step.photoIds?.length ? 2 : 1}">✅ Mission réussie${step.photoIds?.length ? '' : ' (sans photo)'}</button>`;
    case 'quiz': {
      const q = step.quiz; const solved = step.answer === 'ok';
      const order = rngOrder(a.seed + a.pos, q.choices.length);
      return `
      <h3>🧩 ${esc(q.q)}</h3>
      <div class="stack">${order.map(i => `<button class="choice ${solved && i === q.answer ? 'right' : ui.quizWrong.has(i) ? 'wrong' : ''}" data-act="quiz" data-i="${i}" ${solved ? 'disabled' : ''}>${esc(q.choices[i])}</button>`).join('')}</div>
      ${ui.quizWrong.size && !solved ? `<div class="oops">${guideArt(a, 'worried')}<p>Presque ! Essayez encore, vous allez trouver 💪</p></div>` : ''}
      ${solved ? `<div class="explain">💡 ${esc(q.explain)}</div><button class="btn big block leaf" data-act="complete" data-stars="${ui.quizWrong.size ? 1 : 2}">Continuer ➜</button>` : ''}`;
    }
    case 'count':
      return `
      <div class="field"><label for="count-in">Votre réponse</label>
        <input id="count-in" class="input" type="number" inputmode="numeric" min="0" placeholder="0" style="font-size:28px;text-align:center"></div>
      <button class="btn big block leaf" data-act="count-ok">✅ Valider</button>`;
    case 'challenge':
      return `
      ${step.timer ? `<div class="timer" id="timer" aria-live="polite">${step.timer}s</div><button class="btn block sea" data-act="timer" data-s="${step.timer}">▶️ Lancer le chrono</button>` : ''}
      <button class="btn big block leaf" data-act="complete" data-stars="1">⚡ Défi réussi !</button>`;
    case 'imagine':
      return `
      <div class="field"><label for="imag-in">Notez votre idée (facultatif)</label>
        <textarea id="imag-in" class="input" placeholder="Il était une fois…"></textarea></div>
      <button class="btn big block leaf" data-act="imagine-ok">💭 C'est imaginé !</button>`;
  }
  return '';
}
// ---------- Visuel de mission : photo de référence + Pistou + zoom-indice ----------
const KIND_TIP = {
  observe: 'Pas de photo pour celle-là : c\'est toi l\'explorateur, ouvre grand les yeux !',
  photo: 'À toi de prendre la photo de référence pour l\'album !',
  count: 'Compte bien, je vérifie derrière toi !',
  challenge: 'Prêts ? On se lance tous ensemble !',
  imagine: 'Ferme les yeux… et laisse parler ton imagination !',
  quiz: 'Réfléchis bien, la réponse est autour de toi !',
};
const HINT_MOOD = ['thinking', 'loupe', 'surprised', 'cheer'];
const KIND_POSE = { photo: 'photo', observe: 'loupe', quiz: 'thinking', count: 'thinking', challenge: 'cheer', imagine: 'wink' };
function missionVisual(a, step) {
  const p = stepPhoto(step.id);
  const d = stepDetail(step.id) || {};
  if (!p) {
    return `<div class="visual noimg"><div class="visual-pistou">${guideArt(a, KIND_POSE[step.kind] || 'happy')}</div>
      <div class="visual-say"><span class="visual-ico">${icon(KIND_ICON[step.kind])}</span><p>${esc(KIND_TIP[step.kind] || KIND_TIP.observe)}</p></div></div>`;
  }
  if (step.kind === 'quiz' && step.answer !== 'ok') {
    return `<div class="visual noimg"><div class="visual-pistou">${guideArt(a, 'wink')}</div>
      <div class="visual-say"><span class="visual-ico">${icon('camera')}</span><p>La photo de repère apparaîtra quand vous aurez trouvé la bonne réponse !</p></div></div>`;
  }
  const max = d.focus ? 3 : 2;
  const quizDone = step.kind === 'quiz';
  const lvl = Math.min(max, step.hint ?? (quizDone ? 2 : 0));
  const hints = (d.hints || []).map((h, i) => h || DEFAULT_HINTS[i]);
  const text = hints[lvl] || DEFAULT_HINTS[lvl];
  const [fx, fy] = d.focus || [50, 50];
  const z = d.zoom || 2.6;
  const label = lvl < 2 ? `Indice ${lvl + 1}` : lvl === 2 ? (p.caption ? 'À comparer' : 'Photo de repère') : 'Zoom sur le détail';
  const next = lvl < max ? (lvl === 0 ? 'Un indice' : lvl === 1 ? 'Voir la photo' : 'Zoom sur le détail') : '';
  return `<figure class="visual" data-lvl="${lvl}">
    <div class="visual-photo">
      <img src="${p.src}" alt="${lvl >= 2 ? esc(p.title) : 'Photo mystère'}" loading="lazy" onerror="this.closest('.visual').classList.add('broken')">
      ${lvl >= 3 ? `<span class="zoom-ring" style="left:${fx}%;top:${fy}%"></span>
        <div class="zoom-pane ${fx > 55 ? 'left' : 'right'}" style="background-image:url('${p.src}');background-size:${z * 100}% auto;background-position:${fx}% ${fy}%"><span>Zoom ×${z}</span></div>` : ''}
      <span class="visual-step">${Array.from({ length: max + 1 }, (_, i) => `<i class="${i <= lvl ? 'on' : ''}"></i>`).join('')}</span>
    </div>
    <figcaption>
      <div class="visual-row"><div class="visual-pistou mini">${guideArt(a, HINT_MOOD[lvl], { accessory: false })}</div>
        <div class="visual-text"><b>${label}</b><span>${esc(text)}</span></div></div>
      ${next ? `<button class="btn ghost hint-btn" data-act="hint" data-max="${max}">${icon(lvl === max - 1 && max === 3 ? 'magnifier' : 'eye', 'ico-btn')} ${next}</button>` : ''}
      ${lvl >= 2 ? `<span class="credit">${esc(p.title)} · ${esc(p.author)} · <a href="${p.page}" target="_blank" rel="noopener">${esc(p.license)}</a>${p.note ? ' · ⚠️ ' + esc(p.note) : ''}</span>` : ''}
    </figcaption>
  </figure>`;
}

function rngOrder(seed, n) { const r = rng(seed); const a = [...Array(n).keys()]; for (let i = n - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

function finalStep(a, step) {
  const hard = a.levels.hard.length > 0;
  const choices = rngOrder(a.seed, 3).map(i => [step.word, ...step.decoys][i]).filter(Boolean);
  return `
  <div class="guide">${face(a, 'thinking')}<div class="bubble"><b>${esc(a.guide.name)}</b>Vous avez réuni toutes les lettres ! Remettez-les dans l'ordre pour découvrir le mot secret.</div></div>
  <article class="mission">
    <div class="band"><span class="k">${icon('lock')}</span><h2>${esc(step.title)}</h2></div>
    <div class="inner">
      <p class="center muted">Les lettres récoltées :</p>
      <div class="letters">${step.scrambled.split('').map(l => `<span class="letter">${l}</span>`).join('')}</div>
      ${hard ? `
        <div class="field"><label for="code-in">Le mot secret</label>
          <input id="code-in" class="input" autocomplete="off" autocapitalize="characters" style="font-size:26px;text-align:center;letter-spacing:.2em;text-transform:uppercase"></div>
        <button class="btn big block leaf" data-act="code-ok">🔓 Ouvrir</button>
        <details><summary class="small muted" style="padding:8px 0;cursor:pointer">Besoin d'aide ? Voir des propositions</summary>
          <div class="stack">${choices.map(w => `<button class="choice" data-act="code-pick" data-w="${w}">${w}</button>`).join('')}</div></details>`
      : `<p class="center"><b>Quel est le mot secret ?</b></p>
        <div class="stack">${choices.map(w => `<button class="choice ${ui.quizWrong.has(w) ? 'wrong' : ''}" data-act="code-pick" data-w="${w}" style="text-align:center;font-size:24px;letter-spacing:.15em">${w}</button>`).join('')}</div>`}
    </div>
  </article>`;
}

function bonusCard(a) {
  const b = a.bonus;
  return `
  <div class="card sun stack">
    <div class="row" style="align-items:center"><span class="kind-ico">${icon('gem')}</span><h3 style="flex:1">${esc(b.title)}</h3><span class="pill">+2 ⭐</span></div>
    <p>${esc(a.levels.hard.length && !a.levels.easy.length ? b.hard : b.easy)}</p>
    ${b.kind === 'photo' ? `<label class="btn block sea" style="cursor:pointer">📷 Photo bonus<input type="file" accept="image/*" capture="environment" class="sr" data-photo-input="bonus"></label>` : ''}
    <div class="row"><button class="btn leaf" data-act="bonus-ok">Réussi !</button><button class="btn ghost" data-act="bonus-hide">Plus tard</button></div>
  </div>`;
}

function completeStep(stars) {
  const a = currentAdv(); const s = a.steps[a.pos];
  s.done = true; s.stars = stars;
  ui.quizWrong.clear();
  save();
  if (s.kind === 'final') return finishAdventure(a);
  const fact = factOf(s); let isNew = false;
  if (fact) { state.facts ||= {}; if (!state.facts[s.id]) { state.facts[s.id] = { text: fact, placeId: a.placeId, at: new Date().toISOString() }; isNew = true; } save(); }
  play('success');
  if (stars) play('coins', { volume: 0.5, delay: 900 });
  ui.clue = { letter: s.letter, stars, fact, isNew };
  render(); window.scrollTo(0, 0);
}

// ---------- Fin d'aventure : badges ----------
function computeStats() {
  const done = doneAdvs();
  const byType = Object.fromEntries(Object.keys(TYPES).map(t => [t, 0]));
  done.forEach(a => byType[a.type]++);
  return { count: done.length, byType, places: new Set(done.map(a => a.placeId)), facts: factCount(), streak: streak() };
}
function finishAdventure(a) {
  const levelBefore = levelInfo(totalStars()).cur;
  a.status = 'done'; a.finishedAt = new Date().toISOString();
  state.currentId = null;
  const used = a.steps.map(s => s.id).filter(id => id !== 'final');
  state.history[a.placeId] = [...new Set([...(state.history[a.placeId] || []), ...used])].slice(-14);
  const stats = computeStats();
  a.earnedBadges = [];
  for (const b of ALL_BADGES) {
    if (state.badges[b.id]) continue;
    try { if (b.cond(stats, a)) { state.badges[b.id] = a.finishedAt; a.earnedBadges.push(b.id); } } catch { /* ignoré */ }
  }
  save();
  ui.rewardFor = a.id; ui.souvenirURL = null;
  go(`#/album/${a.id}`);
  play('applause', { volume: 0.6, delay: 600 });
  setTimeout(confetti, 900);
  if (a.earnedBadges.length) play('badge', { delay: 2200 });
  const levelAfter = levelInfo(totalStars()).cur;
  if (levelAfter.name !== levelBefore.name) setTimeout(() => showLevelUp(levelAfter), 3600);
}

function showLevelUp(lv) {
  play('magic'); play('badge', { delay: 900 });
  const modal = openModal(`<div class="levelup">
    <div class="levelup-art">${mascot({ hat: 'explorer', mood: 'cheer' })}</div>
    <p class="muted center">Nouveau grade !</p>
    <h1 class="center">${lv.emoji} ${esc(lv.name)}</h1>
    <p class="center">Vos aventures font de vous des explorateurs de plus en plus forts. Continuez !</p>
    <button class="btn big block" id="lv-ok">Youpi !</button></div>`);
  modal.querySelector('#lv-ok').onclick = closeModal;
  confetti();
}

// ---------- Écran : Collection ----------
function collection() {
  const tabs = [['badges', 'Badges'], ['savoir', 'Savoir'], ['album', 'Album'], ['calendrier', 'Calendrier']];
  let body = '';
  if (ui.collTab === 'badges') {
    const stars = totalStars(); const lv = levelInfo(stars);
    const got = Object.keys(state.badges).length;
    body = `
    <div class="card level-card"><div class="em">${lv.cur.emoji}</div><div style="flex:1" class="stack">
      <b>${lv.cur.name} · ⭐ ${stars}</b><div class="progress"><i style="width:${lv.pct}%"></i></div>
      <span class="small muted">${got} badge${got > 1 ? 's' : ''} sur ${ALL_BADGES.length}</span></div></div>
    ${COLLECTIONS.map(c => {
      const n = c.badges.filter(b => state.badges[b.id]).length;
      return `<div class="section-title"><h3>${c.emoji} ${esc(c.name)}</h3><span class="small muted">${n}/${c.badges.length}</span></div>
      <div class="badge-grid">${c.badges.map(b => `<button class="badge ${state.badges[b.id] ? '' : 'locked'}" data-act="badge-info" data-id="${b.id}">${medal(b.id, c.id)}<small>${esc(b.name)}</small></button>`).join('')}</div>`;
    }).join('')}`;
  } else if (ui.collTab === 'savoir') {
    const known = state.facts || {};
    const totalAll = PLACES.reduce((n, p) => n + factTotal(p.id), 0);
    const pct = Math.round(factCount() / totalAll * 100);
    body = `
    <div class="card level-card"><div class="em-ico">${icon('book')}</div><div style="flex:1" class="stack">
      <b>Carnet du savoir · ${factCount()} / ${totalAll} secrets</b><div class="progress"><i style="width:${pct}%"></i></div>
      <span class="small muted">Chaque mission réussie peut révéler un secret sur Antibes.</span></div></div>
    ${PLACES.map(p => {
      const facts = p.steps.filter(factOf); if (!facts.length) return '';
      const got = facts.filter(st => known[st.id]);
      return `<details class="card savoir" ${got.length ? '' : ''}><summary><span class="place-ico ${got.length === facts.length ? 'done' : ''}">${placeIcon(p.id)}</span><b>${esc(p.name)}</b><span class="pill">${got.length}/${facts.length}</span></summary>
        ${facts.map(st => known[st.id] ? `<div class="fact-line">${esc(known[st.id].text)}</div>` : `<div class="fact-line locked">${icon('lock', 'ico-pill')} Secret à découvrir sur place…</div>`).join('')}</details>`;
    }).join('')}`;
  } else if (ui.collTab === 'album') {
    const list = doneAdvs();
    body = list.length ? `<div class="stack">${list.map(a => `
      <button class="album-item" data-act="open-album" data-id="${a.id}">
        <div class="thumb" data-thumb="${a.steps.flatMap(s => s.photoIds || [])[0] || ''}">${placeById(a.placeId)?.emoji || '🧭'}</div>
        <div class="info"><b>${esc(a.title)}</b><span class="small muted">${esc(a.placeName)} · ${fmtDate(a.finishedAt)}</span><span class="small">⭐ ${advStars(a)} · ${(a.earnedBadges || []).map(id => ALL_BADGES.find(b => b.id === id)?.emoji).join(' ')}</span></div>
      </button>`).join('')}</div>`
      : `<div class="card empty"><div class="em">📸</div><h3>Votre album est vide</h3><p class="muted">Les photos et souvenirs de vos aventures apparaîtront ici.</p><a class="btn block" href="#/creer">Partir à l'aventure</a></div>`;
  } else {
    const now = new Date();
    const m = ui.calMonth || { y: now.getFullYear(), m: now.getMonth() };
    ui.calMonth = m;
    const first = new Date(m.y, m.m, 1); const days = new Date(m.y, m.m + 1, 0).getDate();
    const offset = (first.getDay() + 6) % 7;
    const byDay = {};
    doneAdvs().forEach(a => { const d = new Date(a.finishedAt); if (d.getFullYear() === m.y && d.getMonth() === m.m) (byDay[d.getDate()] ||= []).push(a); });
    const cells = [];
    for (let i = 0; i < offset; i++) cells.push('<span class="day out"></span>');
    for (let d = 1; d <= days; d++) {
      const isToday = d === now.getDate() && m.m === now.getMonth() && m.y === now.getFullYear();
      cells.push(byDay[d] ? `<button class="day has ${isToday ? 'today' : ''}" data-act="open-album" data-id="${byDay[d][0].id}" aria-label="${d} : ${esc(byDay[d][0].title)}">${d}</button>` : `<span class="day ${isToday ? 'today' : ''}">${d}</span>`);
    }
    const monthAdvs = Object.values(byDay).flat();
    body = `
    <div class="card stack">
      <div class="row" style="align-items:center"><button class="icon-btn" data-act="cal" data-d="-1" aria-label="Mois précédent">‹</button>
        <h3 style="flex:1;text-align:center;text-transform:capitalize">${first.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</h3>
        <button class="icon-btn" data-act="cal" data-d="1" aria-label="Mois suivant">›</button></div>
      <div class="cal">${['L', 'M', 'M', 'J', 'V', 'S', 'D'].map(d => `<span class="dow">${d}</span>`).join('')}${cells.join('')}</div>
    </div>
    <p class="muted small center">${monthAdvs.length ? `${monthAdvs.length} aventure${monthAdvs.length > 1 ? 's' : ''} ce mois-ci` : 'Aucune aventure ce mois-ci… pour l\'instant !'}</p>`;
  }
  return `
  <div class="top"><h1>Ma collection</h1></div>
  <div class="tabs" role="tablist">${tabs.map(([id, l]) => `<button role="tab" aria-selected="${ui.collTab === id}" data-act="coll-tab" data-id="${id}">${l}</button>`).join('')}</div>
  ${body}`;
}
after.collection = () => hydratePhotos();

// ---------- Écran : détail d'un souvenir ----------
function albumDetail(r) {
  const a = state.adventures.find(x => x.id === r.arg && x.status === 'done');
  if (!a) return `<div class="card empty"><div class="em">🤔</div><p>Souvenir introuvable.</p><a class="btn" href="#/collection">Retour</a></div>`;
  const reward = ui.rewardFor === a.id;
  const badges = (a.earnedBadges || []).map(id => ALL_BADGES.find(b => b.id === id)).filter(Boolean);
  const photos = a.steps.flatMap(s => s.photoIds || []).concat(a.bonus?.photoIds || []);
  const notes = a.steps.filter(s => s.answer && s.answer !== 'ok');
  return `
  <div class="top"><a class="icon-btn" href="#/collection" aria-label="Retour">←</a><h2>${reward ? 'Récompense' : 'Souvenir'}</h2></div>
  ${reward ? `
  <div class="reward-hero">
    <h1 class="reward-title">Aventure réussie !</h1>
    <div class="reward-scene"><div class="reward-chest">${chest()}</div><div class="reward-art">${guideArt(a, 'cheer')}</div></div>
    <div class="ribbon">Bravo ${a.memberIds.map(memberById).filter(Boolean).map(m => esc(m.name)).join(', ') || 'les explorateurs'} !</div>
    <p>Tu as retrouvé le mot secret :</p>
    <div class="word-ribbon">${a.steps.at(-1).word}</div>
    <div class="reward-stats"><span>${icon('star', 'ico-pill')} +${advStars(a)} étoiles</span><span>${icon('chest', 'ico-pill')} +${badges.length} badge${badges.length > 1 ? 's' : ''}</span></div>
    <p class="small">${esc(a.guide.name)} est très fier de vous !</p>
  </div>` : `
  <div class="hero stack"><h1>${esc(a.title)}</h1><p>📍 ${esc(a.placeName)} · ${fmtDate(a.finishedAt)}</p><p>${nameList(a.memberIds)}</p></div>`}

  ${badges.length ? `<div class="card stack"><h3>${reward ? 'Nouveaux badges !' : 'Badges gagnés'}</h3>
    <div class="badge-grid">${badges.map(b => `<div class="badge pop">${medal(b.id, b.collection)}<small>${esc(b.name)}</small></div>`).join('')}</div></div>` : ''}

  ${a.steps.some(factOf) ? `<div class="card stack"><h3>${icon('book', 'ico-pill')} Secrets découverts</h3>
    ${a.steps.filter(factOf).map(st => `<div class="fact-line">${esc(factOf(st))}</div>`).join('')}
    <a class="small" style="color:var(--sea)" href="#/collection" data-act="coll-tab" data-id="savoir">Voir mon Carnet du savoir</a></div>` : ''}

  <div class="card stack">
    <h3>🖼️ Carte souvenir</h3>
    ${ui.souvenirURL ? `<img class="souvenir-img" src="${ui.souvenirURL}" alt="Carte souvenir de l'aventure">
      <div class="row"><button class="btn sea" data-act="souvenir-share">📤 Partager</button><a class="btn ghost" href="${ui.souvenirURL}" download="souvenir-${a.id}.png">💾 Enregistrer</a></div>`
      : `<p class="muted small">Titre, date, participants, photos et badges réunis sur une jolie carte à garder ou à envoyer aux grands-parents.</p>
      <button class="btn block" data-act="souvenir" data-id="${a.id}">✨ Créer la carte souvenir</button>`}
  </div>

  ${photos.length ? `<div class="card stack"><h3>📸 Photos (${photos.length})</h3><div class="photo-grid">${photos.map(id => `<img data-photo="${id}" alt="Photo de l'aventure">`).join('')}</div></div>` : ''}
  ${notes.length ? `<div class="card stack"><h3>📝 Carnet de bord</h3>${notes.map(s => `<div><b>${esc(s.title)}</b><p class="muted">${esc(s.answer)}</p></div>`).join('')}</div>` : ''}

  <button class="btn sea block" data-act="replay" data-id="${a.id}">🔄 Rejouer avec d'autres énigmes</button>
  ${reward ? '<a class="btn ghost block" href="#/accueil">🏠 Retour à l\'accueil</a>' : `<button class="btn danger block" data-act="delete-adv" data-id="${a.id}">Supprimer ce souvenir</button>`}`;
}
after.album = () => hydratePhotos();

async function hydratePhotos() {
  for (const img of document.querySelectorAll('img[data-photo]')) { const u = await photoURL(img.dataset.photo); if (u) img.src = u; else img.remove(); }
  for (const t of document.querySelectorAll('[data-thumb]')) { if (!t.dataset.thumb) continue; const u = await photoURL(t.dataset.thumb); if (u) t.innerHTML = `<img src="${u}" alt="">`; }
}
after.aventure = () => hydratePhotos();

// ---------- Écran : Famille ----------
function family() {
  const st = computeStats(); const stars = totalStars();
  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  return `
  <div class="top"><h1>Famille</h1></div>
  <div class="card stack">
    <div class="field"><label for="fam-name">Nom de la famille</label>
      <input id="fam-name" class="input" value="${esc(state.family.name)}" placeholder="Ex. : Les Martin" data-bind="family-name"></div>
  </div>
  <div class="card">
    <div class="section-title" style="margin-bottom:6px"><h3>Les explorateurs</h3></div>
    ${state.family.members.map(m => `
    <div class="member"><div class="av">${m.avatar}</div>
      <div class="info"><b>${esc(m.name)}</b><div class="small muted">${m.age} ans · niveau ${levelFor(m.age) === 'hard' ? 'avancé 🦅' : 'facile 🐣'}</div></div>
      <button class="icon-btn" data-act="member-edit" data-id="${m.id}" aria-label="Modifier ${esc(m.name)}">✏️</button></div>`).join('')}
    <button class="btn ghost block" style="margin-top:10px" data-act="member-add" data-ctx="family">➕ Ajouter un explorateur</button>
  </div>

  <h3>Statistiques</h3>
  <div class="stats">
    <div class="stat"><b>${st.count}</b><span>aventures</span></div>
    <div class="stat"><b>⭐ ${stars}</b><span>étoiles</span></div>
    <div class="stat"><b>${Object.keys(state.badges).length}</b><span>badges</span></div>
    <div class="stat"><b>${st.places.size}/${PLACES.length}</b><span>lieux explorés</span></div>
  </div>
  ${st.count ? `<div class="card stack"><h3>Types préférés</h3>${Object.entries(st.byType).filter(([, v]) => v).sort((a, b) => b[1] - a[1]).map(([t, v]) => `<div class="row" style="justify-content:space-between"><span>${TYPES[t].emoji} ${TYPES[t].name}</span><b>${v}</b></div>`).join('')}</div>` : ''}

  ${!standalone ? `<div class="card sun stack"><h3>📲 Installer l'application</h3>
    ${installEvent ? '<p class="small">Ajoutez Family Explorer à l\'écran d\'accueil pour l\'utiliser comme une vraie application, même hors connexion.</p><button class="btn sea block" data-act="install">Installer</button>'
      : ios ? '<p class="small">Sur iPhone : touchez <b>Partager</b> ⬆️ puis <b>« Sur l\'écran d\'accueil »</b>.</p>' : '<p class="small">Dans le menu du navigateur, choisissez <b>« Installer l\'application »</b> ou <b>« Ajouter à l\'écran d\'accueil »</b>.</p>'}</div>` : ''}

  <div class="card stack">
    <h3>💾 Sauvegarde</h3>
    <p class="small muted">Vos aventures et photos sont stockées sur ce téléphone. Exportez-les pour les garder en sécurité ou les transférer sur un autre appareil.</p>
    <div class="row"><button class="btn ghost" data-act="export">⬇️ Exporter</button>
      <label class="btn ghost" style="cursor:pointer">⬆️ Importer<input type="file" accept="application/json,.json" class="sr" data-import></label></div>
  </div>
  <button class="btn danger block" data-act="reset">Tout effacer</button>
  <div class="card row" style="align-items:center">
    <span class="kind-ico">${icon(soundEnabled() ? 'speaker' : 'mute')}</span>
    <div style="flex:1"><b>Sons et jingles</b><div class="small muted">${soundEnabled() ? 'Activés' : 'Coupés'}</div></div>
    <button class="btn ${soundEnabled() ? 'ghost' : 'sea'}" style="min-height:48px" data-act="sound-toggle">${soundEnabled() ? 'Couper' : 'Activer'}</button>
  </div>
  <div class="card stack">
    <h3>Univers graphique</h3>
    <a class="btn ghost block" href="#/kit">${icon('palette', 'ico-btn')} Bibliothèque visuelle</a>
    <a class="btn ghost block" href="#/credits">${icon('scroll', 'ico-btn')} Crédits photos, sons et licences</a>
  </div>
  <p class="muted small center">Family Explorer · Antibes & Juan-les-Pins<br>Météo : Open-Meteo · Carte : © OpenStreetMap · Photos : Wikimedia Commons</p>`;
}

function memberForm(m, ctx) {
  const isNew = !m;
  m = m || { name: '', age: 6, avatar: AVATARS[Math.floor(Math.random() * AVATARS.length)] };
  const modal = openModal(`
    <h2>${isNew ? 'Nouvel explorateur' : 'Modifier ' + esc(m.name)}</h2>
    <div class="field"><label for="m-name">Prénom</label><input id="m-name" class="input" value="${esc(m.name)}" maxlength="20" autocomplete="off"></div>
    <div class="field"><label for="m-age">Âge</label>
      <select id="m-age" class="input">${Array.from({ length: 16 }, (_, i) => i + 3).map(a => `<option value="${a}" ${a === m.age ? 'selected' : ''}>${a} ans</option>`).join('')}<option value="30" ${m.age >= 19 ? 'selected' : ''}>Adulte</option></select></div>
    <div class="field"><label>Avatar</label><div class="avatar-pick" id="m-av">${AVATARS.map(a => `<button type="button" aria-pressed="${a === m.avatar}" data-av="${a}">${a}</button>`).join('')}</div></div>
    <button class="btn big block" id="m-save">${isNew ? 'Ajouter' : 'Enregistrer'}</button>
    ${!isNew ? '<button class="btn danger block" id="m-del">Retirer de la famille</button>' : ''}
    <button class="btn ghost block" id="m-cancel">Annuler</button>`);
  let avatar = m.avatar;
  modal.querySelector('#m-av').addEventListener('click', e => {
    const b = e.target.closest('[data-av]'); if (!b) return; avatar = b.dataset.av;
    modal.querySelectorAll('[data-av]').forEach(x => x.setAttribute('aria-pressed', x === b));
  });
  modal.querySelector('#m-cancel').onclick = closeModal;
  modal.querySelector('#m-del')?.addEventListener('click', () => {
    state.family.members = state.family.members.filter(x => x.id !== m.id); save(); closeModal(); render();
  });
  modal.querySelector('#m-save').onclick = () => {
    const name = modal.querySelector('#m-name').value.trim();
    if (!name) { modal.querySelector('#m-name').focus(); return; }
    const age = Number(modal.querySelector('#m-age').value);
    if (ctx === 'onboard') onboardMembers.push({ id: uid(), name, age, avatar });
    else if (isNew) { const nm = { id: uid(), name, age, avatar }; state.family.members.push(nm); if (draft) draft.memberIds.push(nm.id); }
    else Object.assign(memberById(m.id), { name, age, avatar });
    ui.ready = null; save(); closeModal(); render();
  };
  setTimeout(() => modal.querySelector('#m-name').focus(), 50);
}

// ---------- Écran : Bibliothèque visuelle (kit graphique) ----------
const ICON_LABEL = { compass: 'Boussole', magnifier: 'Loupe', key: 'Clé', scroll: 'Parchemin', chest: 'Coffre', map: 'Carte', footprints: 'Empreintes', arrow: 'Flèche', lock: 'Cadenas', coin: 'Pièce', star: 'Étoile', gem: 'Pierre précieuse', spyglass: 'Longue-vue', lantern: 'Lanterne', camera: 'Appareil photo', leaf: 'Feuille', shell: 'Coquillage', anchor: 'Ancre', hourglass: 'Sablier', puzzle: 'Puzzle', flag: 'Drapeau', pinecone: 'Pomme de pin', lighthouse: 'Phare', castle: 'Château', fort: 'Fort', wall: 'Remparts', amphora: 'Amphore', palette: 'Palette', flower: 'Fleur', palm: 'Palmier', wave: 'Vague', pencil: 'Crayon', tomato: 'Tomate', trophy: 'Trophée', medal: 'Médaille', boot: 'Chaussure', backpack: 'Sac à dos', crown: 'Couronne', sun: 'Soleil', snowflake: 'Flocon', pumpkin: 'Citrouille', tree: 'Arbre', binoculars: 'Jumelles', eye: 'Œil', bolt: 'Éclair', thought: 'Idée', tally: 'Comptage', heart: 'Cœur', umbrella: 'Parapluie', note: 'Musique', boat: 'Bateau', dice: 'Dé' };
const MOOD_LABEL = { happy: 'Content', surprised: 'Surpris', thinking: 'Réfléchit', cheer: 'Bravo !', wink: 'Secret' };
const HAT_LABEL = { explorer: 'Explorateur', pirate: 'Pirate', detective: 'Détective', botanist: 'Botaniste', reporter: 'Reporter', coach: 'Coach', wizard: 'Magicien', knight: 'Chevalier', agent: 'Agent secret', time: 'Voyageur du temps', astronaut: 'Astronaute' };
function kitScreen() {
  const sample = { quartiers: 'q-vieil-antibes', nature: 'n-thuret', histoire: 'h-fort', saisons: 's-hiver', explorateurs: 'e-1', exceptionnels: 'x-noel' };
  return `
  <div class="top"><a class="icon-btn" href="#/famille" aria-label="Retour">←</a><h1>Bibliothèque visuelle</h1></div>
  <p class="muted">Le kit graphique Family Explorer : un seul univers « carnet d'explorateur » pour toutes les aventures.</p>
  <section class="card stack"><h2>Pistou et le Capitaine Barbe-Sel</h2>
    <p class="small muted">Pistou, le renard explorateur, accompagne toutes les missions. Le Capitaine Barbe-Sel, vieux loup de mer d'Antibes, guide les chasses au trésor.</p>
    <div class="kit-grid">${CHARACTER_GALLERY.map(c => `<figure><img class="char" src="${c.src}" alt=""><figcaption>${c.label}</figcaption></figure>`).join('')}</div>

  </section>
  <section class="card stack"><h2>Objets, indices et récompenses</h2>
    <div class="icon-grid">${ICON_NAMES.map(n => `<figure>${icon(n)}<figcaption>${ICON_LABEL[n] || n}</figcaption></figure>`).join('')}</div>
  </section>
  <section class="card stack"><h2>Pictogrammes des missions</h2>
    <div class="icon-grid">${Object.entries(KIND_ICON).map(([k, n]) => `<figure>${icon(n)}<figcaption>${KIND_LABEL[k].name}</figcaption></figure>`).join('')}</div>
  </section>
  <section class="card stack"><h2>Médailles des collections</h2>
    <div class="badge-grid">${COLLECTIONS.map(c => `<div class="badge">${medal(sample[c.id], c.id)}<small>${esc(c.name)}</small></div>`).join('')}</div>
  </section>
  <section class="card stack"><h2>Carnet, indices et code secret</h2>
    <div class="bubble parchment"><b>Parchemin</b>Les histoires et les messages des guides s'affichent sur du papier de carnet.</div>
    <div class="letters"><span class="letter">C</span><span class="letter">L</span><span class="letter">E</span><span class="letter empty">?</span></div>
  </section>
  <section class="card stack"><h2>Photographies réelles</h2>
    <p class="small muted">Pour comparer l'écran avec ce qui se trouve vraiment devant les enfants : ${Object.keys(PHOTOS).length} photos libres de Wikimedia Commons.</p>
    <div class="photo-grid">${Object.values(PHOTOS).map(p => `<img src="${p.src}" alt="${esc(p.title)}" loading="lazy" title="${esc(p.title)}">`).join('')}</div>
    <a class="btn ghost block" href="#/credits">Voir les crédits</a>
  </section>`;
}

// ---------- Écran : Crédits photos ----------
function creditsScreen() {
  return `
  <div class="top"><a class="icon-btn" href="#/famille" aria-label="Retour">←</a><h1>Crédits</h1></div>
  <div class="card stack small">
    <p><b>Illustrations</b> : icône, Pistou, Capitaine Barbe-Sel et badges illustrés fournis par Family Explorer ; objets, pictogrammes, badges dessinés et carte au trésor : créations originales Family Explorer.</p>
    <p><b>Photographies et sons</b> : Wikimedia Commons, sous licences libres. Merci aux photographes et preneurs de son !</p>
  </div>
  <h2>Sons et jingles</h2>
  <div class="stack">${Object.entries(SOUNDS).map(([k, x]) => `
    <div class="card credit-row"><button class="icon-btn" data-act="sound-test" data-k="${k}" aria-label="Écouter : ${esc(x.title)}">${icon('speaker')}</button>
      <div class="stack" style="gap:2px"><b>${esc(x.title)}</b><span class="small">${esc(x.author)}</span>
      <span class="small"><a href="${x.licenseUrl || x.page}" target="_blank" rel="noopener">${esc(x.license)}</a> · <a href="${x.page}" target="_blank" rel="noopener">source</a></span></div></div>`).join('')}</div>
  <h2>Photographies</h2>
  <div class="stack">${Object.values(PHOTOS).map(p => `
    <div class="card credit-row"><img src="${p.src}" alt="" loading="lazy">
      <div class="stack" style="gap:2px"><b>${esc(p.title)}</b><span class="small">${esc(p.author)}</span>
      <span class="small"><a href="${p.licenseUrl || p.page}" target="_blank" rel="noopener">${esc(p.license)}</a> · <a href="${p.page}" target="_blank" rel="noopener">source</a></span></div></div>`).join('')}</div>`;
}

// ---------- Actions ----------
const actions = {
  'member-add': d => memberForm(null, d.ctx),
  'member-edit': d => memberForm(memberById(d.id), 'family'),
  'ob-remove': d => { onboardMembers = onboardMembers.filter(m => m.id !== d.id); render(); },
  'ob-done': () => {
    state.family.name = $('#ob-family')?.value.trim() || '';
    state.family.members.push(...onboardMembers); onboardMembers = []; save(); go('#/accueil');
  },
  'weather-pick': () => {
    const modal = openModal(`<h2>La météo du moment</h2><p class="muted small">Choisissez la météo pour adapter les aventures.</p>
      <div class="chip-row">${Object.entries(WEATHER).map(([k, w]) => `<button class="chip" data-w="${k}" aria-pressed="${weatherKind() === k}">${w.emoji} ${w.name}</button>`).join('')}</div>
      <button class="btn ghost block" data-w="auto">🔄 Météo automatique (Antibes)</button>`);
    modal.addEventListener('click', e => {
      const b = e.target.closest('[data-w]'); if (!b) return;
      if (b.dataset.w === 'auto') { state.weather = null; save(); refreshWeather(true); }
      else { state.weather = { ...(state.weather || {}), kind: b.dataset.w, manual: true, at: Date.now() }; save(); }
      if (draft) draft.weather = weatherKind();
      closeModal(); render();
    });
  },
  surprise: () => {
    const sug = suggest(weatherKind(), hourNow(), explored(), Date.now() % 100000, youngestAge());
    draft = { placeId: sug.place.id, memberIds: state.family.members.map(m => m.id), duration: state.settings.duration || 45, difficulty: state.settings.difficulty || 'auto', type: 'surprise', weather: weatherKind() };
    doGenerate();
  },
  'd-set': d => { draft[d.k] = d.k === 'duration' ? Number(d.v) : d.v; render(); },
  'd-member': d => { const s = new Set(draft.memberIds); s.has(d.id) ? s.delete(d.id) : s.add(d.id); draft.memberIds = state.family.members.map(m => m.id).filter(id => s.has(id)); render(); },
  generate: () => doGenerate(),
  reroll: () => { preview = null; doGenerate(); },
  hint: d => {
    const a = currentAdv(); const st = a.steps[a.pos];
    const base = st.kind === 'quiz' ? 2 : 0;
    st.hint = Math.min(Number(d.max), (st.hint ?? base) + 1); save();
    play(st.hint >= 3 ? 'magic' : 'page', { volume: 0.5 });
    render();
    document.querySelector('.visual')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  },
  'sound-toggle': () => { state.settings.sound = !soundEnabled(); setSoundEnabled(state.settings.sound); save(); if (state.settings.sound) play('chime'); render(); },
  start: () => startAdventure(),
  'intro-ok': () => { play('page', { volume: 0.6 }); currentAdv().introSeen = true; save(); render(); window.scrollTo(0, 0); },
  'clue-ok': () => { play('page', { volume: 0.5 }); const a = currentAdv(); ui.clue = null; a.pos = Math.min(a.pos + 1, a.steps.length - 1); save(); render(); window.scrollTo(0, 0); },
  complete: d => completeStep(Number(d.stars)),
  skip: () => {
    const modal = openModal(`<h2>Passer cette mission ?</h2><p class="muted">Vous gardez la lettre du code, mais sans étoile.</p>
      <button class="btn block" id="sk-yes">Oui, passer</button><button class="btn ghost block" id="sk-no">Continuer la mission</button>`);
    modal.querySelector('#sk-no').onclick = closeModal;
    modal.querySelector('#sk-yes').onclick = () => { closeModal(); completeStep(0); };
  },
  quiz: d => {
    const a = currentAdv(); const s = a.steps[a.pos]; const i = Number(d.i);
    if (i === s.quiz.answer) { s.answer = 'ok'; save(); play('chime'); } else { ui.quizWrong.add(i); play('wrong', { volume: 0.6 }); }
    render();
  },
  'count-ok': () => {
    const v = $('#count-in').value;
    if (v === '') { $('#count-in').focus(); toast('Indiquez un nombre 🔢'); return; }
    const a = currentAdv(); a.steps[a.pos].answer = `Réponse : ${v}`; completeStep(1);
  },
  'imagine-ok': () => { const a = currentAdv(); const v = $('#imag-in').value.trim(); if (v) a.steps[a.pos].answer = v; completeStep(v ? 2 : 1); },
  timer: (d, el) => {
    clearInterval(ui.timer?.id);
    let left = Number(d.s); const out = $('#timer'); el.disabled = true;
    ui.timer = { id: setInterval(() => {
      left--; if (out) out.textContent = left + 's';
      if (left <= 0) { clearInterval(ui.timer.id); play('bell'); if (out) out.textContent = '🎉 Terminé !'; navigator.vibrate?.(300); el.disabled = false; el.textContent = '🔁 Relancer'; }
    }, 1000) };
  },
  'code-ok': () => {
    const a = currentAdv(); const s = a.steps[a.pos];
    const v = $('#code-in').value.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/[^A-Z]/g, '');
    if (v === s.word) completeStep(3); else { play('wrong', { volume: 0.6 }); toast('Ce n\'est pas encore ça… Essayez un autre ordre !'); $('#code-in').select(); }
  },
  'code-pick': d => {
    const a = currentAdv(); const s = a.steps[a.pos];
    if (d.w === s.word) completeStep(ui.quizWrong.size ? 2 : 3); else { play('wrong', { volume: 0.6 }); ui.quizWrong.add(d.w); render(); }
  },
  'bonus-ok': () => { play('coins', { volume: 0.6 }); play('chime', { delay: 500 }); const a = currentAdv(); a.bonus.done = true; a.bonusDone = true; save(); toast('💎 Mission bonus réussie ! +2 ⭐'); render(); },
  'bonus-hide': () => { ui.bonusHidden = true; render(); },
  'adv-menu': () => {
    const a = currentAdv();
    const modal = openModal(`<h2>${esc(a.title)}</h2>
      <p class="muted small">L'aventure est sauvegardée automatiquement : vous pouvez la reprendre plus tard, même hors connexion.</p>
      <button class="btn block" id="am-pause">⏸️ Faire une pause</button>
      ${a.warnings.length ? `<details><summary style="padding:8px 0;cursor:pointer"><b>🦺 Conseils de sécurité</b></summary>${a.warnings.map(w => `<div class="warn"><span>${w.icon}</span><p>${esc(w.text)}</p></div>`).join('')}</details>` : ''}
      <button class="btn danger block" id="am-stop">Abandonner l'aventure</button>
      <button class="btn ghost block" id="am-close">Fermer</button>`);
    modal.querySelector('#am-close').onclick = closeModal;
    modal.querySelector('#am-pause').onclick = () => { closeModal(); go('#/accueil'); };
    modal.querySelector('#am-stop').onclick = () => { a.status = 'abandoned'; state.currentId = null; save(); closeModal(); go('#/accueil'); };
  },
  'coll-tab': d => { ui.collTab = d.id; if (route().path !== 'collection') go('#/collection'); else render(); },
  'sound-test': d => { const was = soundEnabled(); setSoundEnabled(true); play(d.k); setSoundEnabled(was); },
  'ready-filter': d => { ui.readyFilter = d.id; render(); },
  ready: d => {
    const r = readyList().find(x => x.id === d.id); if (!r) return;
    draft = { placeId: r.id, memberIds: state.family.members.map(m => m.id), duration: r.duration, difficulty: state.settings.difficulty || 'auto', type: r.type, weather: weatherKind() };
    doGenerate(r.seed);
  },
  'map-mode': d => { ui.mapMode = d.m; render(); },
  'map-zone': d => { ui.mapZone = d.z; render(); },
  'map-pin': d => {
    const p = placeById(d.id); const ph = placePhoto(p.id); const done = explored().has(p.id);
    const modal = openModal(`${ph ? photoFig(ph) : `<div class="hero-ico" style="margin:auto">${placeIcon(p.id)}</div>`}
      <h2>${esc(p.name)}</h2><p class="muted">${p.area}${done ? ' · ✅ déjà exploré' : ' · à découvrir'}${p.indoor ? ' · abrité de la pluie' : ''}</p>
      ${p.hoursNote ? `<p class="small">🕒 ${esc(p.hoursNote)}</p>` : ''}
      <a class="btn big block" href="#/creer?place=${p.id}">${icon('map', 'ico-btn')} Créer une aventure ici</a>
      <button class="btn ghost block" id="mp-close">Fermer</button>`);
    modal.querySelector('#mp-close').onclick = closeModal;
    modal.querySelector('a.btn').addEventListener('click', closeModal);
  },
  cal: d => { const m = ui.calMonth; const dt = new Date(m.y, m.m + Number(d.d), 1); ui.calMonth = { y: dt.getFullYear(), m: dt.getMonth() }; render(); },
  'badge-info': d => {
    const b = ALL_BADGES.find(x => x.id === d.id); const when = state.badges[b.id];
    openModal(`<div class="medal-big ${when ? '' : 'locked'}">${medal(b.id, b.collection)}</div>
      <h2 class="center">${esc(b.name)}</h2><p class="center muted">${esc(b.desc)}</p>
      <p class="center">${when ? `✅ Gagné le ${fmtDate(when)}` : '🔒 Pas encore gagné'}</p>
      <button class="btn ghost block" onclick="this.closest('.modal-back').remove()">Fermer</button>`);
  },
  'open-album': d => { ui.rewardFor = null; ui.souvenirURL = null; go(`#/album/${d.id}`); },
  souvenir: async (d, el) => {
    el.disabled = true; el.textContent = '⏳ Création…';
    const a = state.adventures.find(x => x.id === d.id);
    const blob = await renderSouvenir(a, a.memberIds.map(memberById).filter(Boolean));
    ui.souvenirURL = URL.createObjectURL(blob); ui.souvenirBlob = blob; render();
  },
  'souvenir-share': async () => {
    const file = new File([ui.souvenirBlob], 'souvenir-family-explorer.png', { type: 'image/png' });
    if (navigator.canShare?.({ files: [file] })) { try { await navigator.share({ files: [file], title: 'Souvenir Family Explorer' }); } catch { /* annulé */ } }
    else toast('Partage indisponible : utilisez « Enregistrer ».');
  },
  replay: d => {
    const a = state.adventures.find(x => x.id === d.id);
    draft = { placeId: a.around ? 'autour' : a.placeId, memberIds: a.memberIds.filter(memberById), duration: a.duration, difficulty: a.difficulty, type: a.surprise ? 'surprise' : a.type, weather: weatherKind() };
    doGenerate();
  },
  'delete-adv': d => {
    const modal = openModal(`<h2>Supprimer ce souvenir ?</h2><p class="muted">L'aventure et ses photos seront définitivement effacées de ce téléphone. Les badges restent gagnés.</p>
      <button class="btn danger block" id="del-yes">Supprimer définitivement</button><button class="btn ghost block" id="del-no">Annuler</button>`);
    modal.querySelector('#del-no').onclick = closeModal;
    modal.querySelector('#del-yes').onclick = async () => {
      const a = state.adventures.find(x => x.id === d.id);
      for (const id of a.steps.flatMap(s => s.photoIds || []).concat(a.bonus?.photoIds || [])) await deletePhoto(id).catch(() => {});
      state.adventures = state.adventures.filter(x => x.id !== d.id); save(); closeModal(); go('#/collection');
    };
  },
  install: async () => { if (!installEvent) return; installEvent.prompt(); await installEvent.userChoice; installEvent = null; render(); },
  export: async () => {
    toast('⏳ Préparation de la sauvegarde…');
    const blob = await exportBackup();
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `family-explorer-${new Date().toISOString().slice(0, 10)}.json`; a.click();
  },
  reset: () => {
    const modal = openModal(`<h2>Tout effacer ?</h2><p class="muted">Famille, aventures, badges et photos seront définitivement supprimés de ce téléphone. Pensez à exporter une sauvegarde avant.</p>
      <button class="btn danger block" id="rs-yes">Tout effacer définitivement</button><button class="btn ghost block" id="rs-no">Annuler</button>`);
    modal.querySelector('#rs-no').onclick = closeModal;
    modal.querySelector('#rs-yes').onclick = async () => {
      indexedDB.deleteDatabase('family-explorer-photos'); replaceState({}); closeModal(); location.hash = '#/bienvenue'; location.reload();
    };
  },
};

document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]');
  preloadSounds();
  if (!el || el.disabled) return;
  const fn = actions[el.dataset.act];
  if (fn) { e.preventDefault(); fn(el.dataset, el); }
});

document.addEventListener('change', async e => {
  const t = e.target;
  if (t.matches('[data-bind="family-name"]')) { state.family.name = t.value.trim(); save(); toast('✅ Enregistré'); }
  if (t.matches('[data-photo-input]') && t.files?.[0]) {
    const a = currentAdv(); if (!a) return;
    play('shutter'); toast('📷 Enregistrement de la photo…');
    try {
      const blob = await resizeImage(t.files[0]);
      const id = 'p-' + uid(); await putPhoto(id, blob); requestPersistence();
      if (t.dataset.photoInput === 'bonus') { (a.bonus.photoIds ||= []).push(id); a.bonus.done = true; a.bonusDone = true; toast('💎 Mission bonus réussie ! +2 ⭐'); }
      else (a.steps[a.pos].photoIds ||= []).push(id);
      save(); render();
    } catch (err) { console.error(err); toast('Impossible d\'enregistrer la photo.'); }
  }
  if (t.matches('[data-import]') && t.files?.[0]) {
    try { await importBackup(t.files[0]); toast('✅ Sauvegarde importée'); render(); }
    catch (err) { toast(err.message || 'Fichier invalide'); }
  }
});

window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEvent = e; if (route().path === 'famille') render(); });
window.addEventListener('online', () => { refreshWeather(); render(); });
window.addEventListener('offline', () => render());

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(err => console.warn('SW', err)));
}

{
  const TAB_ICON = { accueil: 'house', explorer: 'magnifier', aventure: 'compass', collection: 'trophy', famille: 'person' };
  document.querySelectorAll('.tabbar a').forEach(a => { const em = a.querySelector('.em'); if (em) em.outerHTML = `<span class="em">${icon(TAB_ICON[a.dataset.tab])}</span>`; });
}
setSoundEnabled(state.settings.sound !== false);
render();
refreshWeather();
