// Persistance : état familial dans localStorage, photos dans IndexedDB
const KEY = 'family-explorer-v1';

const defaults = () => ({
  family: { name: '', members: [] },
  adventures: [],      // aventures (en cours, terminées)
  badges: {},          // badgeId -> date ISO
  currentId: null,
  history: {},         // placeId -> [stepIds récents]
  weather: null,       // { code, temp, wind, kind, at }
  settings: { duration: 45, difficulty: 'auto' },
});

function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY));
    return Object.assign(defaults(), raw || {});
  } catch { return defaults(); }
}

export const state = load();

export function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); }
  catch (e) { console.warn('Sauvegarde impossible', e); }
}

export function replaceState(next) {
  for (const k of Object.keys(state)) delete state[k];
  Object.assign(state, defaults(), next);
  save();
}

export const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);

// ---------- Photos (IndexedDB) ----------
let dbp;
function db() {
  return dbp ||= new Promise((res, rej) => {
    const r = indexedDB.open('family-explorer-photos', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('photos');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}
function tx(mode, fn) {
  return db().then(d => new Promise((res, rej) => {
    const t = d.transaction('photos', mode);
    const req = fn(t.objectStore('photos'));
    t.oncomplete = () => res(req?.result);
    t.onerror = () => rej(t.error);
  }));
}
export const putPhoto = (id, blob) => tx('readwrite', s => s.put(blob, id)).then(() => id);
export const getPhoto = id => tx('readonly', s => s.get(id));
export const deletePhoto = id => { urls.delete(id); return tx('readwrite', s => s.delete(id)); };
export const allPhotoKeys = () => tx('readonly', s => s.getAllKeys());

const urls = new Map();
export async function photoURL(id) {
  if (urls.has(id)) return urls.get(id);
  const b = await getPhoto(id).catch(() => null);
  if (!b) return null;
  const u = URL.createObjectURL(b);
  urls.set(id, u);
  return u;
}

export async function resizeImage(file, max = 1280) {
  const bmp = await createImageBitmap(file);
  const k = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const c = document.createElement('canvas');
  c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
  c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
  bmp.close?.();
  return new Promise(res => c.toBlob(res, 'image/jpeg', 0.82));
}

export async function requestPersistence() {
  try { if (navigator.storage?.persist && !(await navigator.storage.persisted())) await navigator.storage.persist(); } catch { /* ignoré */ }
}

// ---------- Sauvegarde / restauration ----------
const blobToDataURL = b => new Promise(res => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.readAsDataURL(b); });

export async function exportBackup() {
  const keys = await allPhotoKeys().catch(() => []);
  const photos = {};
  for (const k of keys) { const b = await getPhoto(k); if (b) photos[k] = await blobToDataURL(b); }
  const data = { app: 'family-explorer', version: 1, exportedAt: new Date().toISOString(), state, photos };
  return new Blob([JSON.stringify(data)], { type: 'application/json' });
}

export async function importBackup(file) {
  const data = JSON.parse(await file.text());
  if (data.app !== 'family-explorer') throw new Error('Ce fichier n\'est pas une sauvegarde Family Explorer.');
  for (const [k, durl] of Object.entries(data.photos || {})) {
    const blob = await (await fetch(durl)).blob();
    await putPhoto(k, blob);
  }
  replaceState(data.state);
}
