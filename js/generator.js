// Générateur d'aventures : lieu + participants + durée + type + météo + heure -> aventure jouable
import { PLACES, GENERIC_STEPS, BONUS_STEPS, TYPES, WORDS, ROLES } from './data.js';

export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = (r, arr) => arr[Math.floor(r() * arr.length)];
function shuffle(r, arr) { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

export const DURATIONS = { 20: 3, 45: 4, 60: 5, 90: 7 };

export function levelFor(age) { return age <= 6 ? 'easy' : age >= 9 ? 'hard' : 'mid'; }

// Répartit les participants en "facile" / "avancé"
export function computeLevels(members, difficulty) {
  if (difficulty === 'easy') return { easy: members, hard: [] };
  if (difficulty === 'hard') return { easy: [], hard: members };
  const easy = [], hard = [];
  for (const m of members) (levelFor(m.age) === 'hard' ? hard : easy).push(m);
  // un groupe homogène de "mid" -> facile ; un groupe uniquement de grands -> avancé
  return { easy, hard };
}

export function nearestPlace(lat, lng) {
  let best = null, bestD = Infinity;
  for (const p of PLACES) {
    const d = Math.hypot((p.lat - lat) * 111, (p.lng - lng) * 111 * Math.cos(lat * Math.PI / 180));
    if (d < bestD) { bestD = d; best = p; }
  }
  return { place: best, km: bestD };
}

// Avertissements selon météo / heure / lieu
export function warningsFor(place, weather, hour, members = []) {
  const w = [];
  if (place?.minAge && members.some(m => m.age < place.minAge)) w.push({ icon: '🧒', text: `Ce lieu est plutôt adapté aux enfants de ${place.minAge} ans et plus.` });
  if (place?.safety) w.push({ icon: '🦺', text: place.safety });
  if (place?.hoursNote) w.push({ icon: '🕒', text: place.hoursNote });
  if (weather === 'rain' && place?.id === 'brague') w.push({ icon: '⚠️', text: 'Après de fortes pluies, la rivière peut monter vite : restez loin des berges.' });
  if (weather === 'rain' && !place?.indoor) w.push({ icon: '🌧️', text: 'Il pleut : cirés et bottes ! Posidonia et les musées Picasso, Peynet et d\'Archéologie sont de bonnes alternatives.' });
  if (weather === 'heat') w.push({ icon: '🧢', text: 'Forte chaleur : eau, chapeau, crème solaire et pauses à l\'ombre. Évitez 12 h – 16 h.' });
  if (weather === 'wind' && place && ['garoupe', 'remparts', 'juan-plage', 'eilenroc', 'port-vauban', 'salis', 'tirepoil', 'bastion-jaume', 'ilette', 'ondes', 'ponteil', 'gallice'].includes(place.id)) w.push({ icon: '💨', text: 'Vent fort : restez loin du bord de mer, des quais et des rochers.' });
  if (place?.hours === 'museum' && (hour >= 18 || hour < 10)) w.push({ icon: '🔒', text: 'Le musée est probablement fermé à cette heure-ci.' });
  if (place?.hours === 'morning' && hour >= 13) w.push({ icon: '🔒', text: 'Le marché se tient le matin : il sera sans doute fermé.' });
  if (place?.hours === 'day' && (hour >= 19 || hour < 8)) w.push({ icon: '🌙', text: 'Ce lieu est peut-être fermé ou peu éclairé à cette heure-ci.' });
  if (!place?.indoor && (hour >= 20 || hour < 7)) w.push({ icon: '🔦', text: 'Il fait peut-être nuit : lampe de poche et gilets visibles.' });
  return w;
}

export const seasonOf = d => { const m = d.getMonth(); return m <= 1 || m === 11 ? 'hiver' : m <= 4 ? 'printemps' : m <= 7 ? 'ete' : 'automne'; };

function fits(step, ctx) {
  if (step.seasons && !step.seasons.includes(ctx.season)) return false;
  if (step.months && !step.months.includes(ctx.month)) return false;
  if (step.wx && !step.wx.includes(ctx.weather)) return false;
  if (step.dry && ctx.weather === 'rain') return false;
  return true;
}

function scoreStep(step, ctx, r) {
  let s = 1 + r() * 2.5;
  if (step.types?.includes(ctx.type)) s += 4;
  if (step.local) s += 5; // priorité aux missions propres au lieu
  if (ctx.history.has(step.id)) s -= 4; // rejouable : on évite les missions déjà faites ici
  if (step.coop && ctx.memberCount >= 2) s += 1;
  if (step.seasons || step.months) s += 1; // missions de saison mises en avant
  return s;
}

function selectSteps(pool, n, ctx, r) {
  const chosen = [];
  const kindCount = {};
  let remaining = [...pool];
  while (chosen.length < n && remaining.length) {
    const prevKind = chosen.at(-1)?.kind;
    const scored = remaining.map(st => {
      let s = scoreStep(st, ctx, r);
      if (st.kind === prevKind) s -= 3;
      s -= (kindCount[st.kind] || 0) * 1.5;
      return { st, s };
    }).sort((a, b) => b.s - a.s);
    const top = scored.slice(0, 3);
    const choice = pick(r, top).st;
    chosen.push(choice);
    kindCount[choice.kind] = (kindCount[choice.kind] || 0) + 1;
    remaining = remaining.filter(x => x.id !== choice.id);
  }
  // Les quiz "fil rouge" du lieu en premier ou au milieu, l'imagination plutôt à la fin
  return chosen.sort((a, b) => (a.kind === 'imagine') - (b.kind === 'imagine'));
}

function wordFor(type, n, r) {
  const list = WORDS[type]?.[n] || WORDS.imaginary[n];
  return pick(r, list);
}

export function decoysFor(word, r) {
  const same = Object.values(WORDS).flatMap(t => t[word.length] || []).filter(w => w !== word);
  return shuffle(r, [...new Set(same)]).slice(0, 2);
}

/**
 * opts: { placeId, nearPlaceId?, members:[{id,name,age}], duration, difficulty, type, weather, hour, seed, history:[stepIds] }
 */
export function generate(opts) {
  const seed = opts.seed ?? Math.floor(Math.random() * 2 ** 31);
  const r = rng(seed);
  const surprise = opts.type === 'surprise';
  const type = surprise ? pick(r, Object.keys(TYPES)) : opts.type;
  const T = TYPES[type];
  const theme = T.themes ? pick(r, T.themes) : null;
  const guide = theme ? theme.guide : T.guide;

  const isAround = opts.placeId === 'autour';
  const place = PLACES.find(p => p.id === (isAround ? opts.nearPlaceId : opts.placeId)) || (isAround ? null : PLACES[0]);
  const placeName = isAround ? (place ? `autour de ${place.name}` : 'votre quartier') : place.name;
  const at = place ? place.at : 'dans votre quartier';

  const n = DURATIONS[opts.duration] || 4;
  const now = opts.date ? new Date(opts.date) : new Date();
  const ctx = { type, weather: opts.weather, history: new Set(opts.history || []), memberCount: opts.members.length, season: seasonOf(now), month: now.getMonth() + 1 };

  let pool = [
    ...(place ? place.steps.map(s => ({ ...s, local: true })) : []),
    ...GENERIC_STEPS,
  ].filter(s => fits(s, ctx));
  // Dans un musée : pas de missions génériques de plein air liées à la nature/météo
  if (place?.indoor) pool = pool.filter(s => s.local || !s.outdoor && !['g-feuille', 'g-oiseau', 'g-insecte', 'g-nuage', 'g-ombre', 'g-chapeau', 'g-marches', 'g-sourire', 'g-pas', 'g-cri'].includes(s.id));

  const picked = selectSteps(pool, n, ctx, r);
  const word = wordFor(type, picked.length, r);
  // Les lettres arrivent dans le désordre : il faudra les remettre dans l'ordre à la fin
  let scrambled = shuffle(r, word.split('')).join('');
  for (let k = 0; k < 5 && scrambled === word && new Set(word).size > 1; k++) scrambled = shuffle(r, word.split('')).join('');
  const levels = computeLevels(opts.members, opts.difficulty);
  const roleCount = Math.min(Math.max(opts.members.length, 3), ROLES.length);

  const steps = picked.map((s, i) => {
    let kind = s.kind, easy = s.easy, hard = s.hard;
    if (kind === 'photo' && place?.noPhoto) {
      kind = 'observe';
      easy += ' (Photos souvent interdites ici : décris-le ou dessine-le !)';
      hard += ' (Photos souvent interdites ici : dessine-le dans ta tête ou sur un carnet.)';
    }
    const roles = opts.members.length >= 2
      ? opts.members.map((m, j) => ({ memberId: m.id, role: ROLES[(i + j) % roleCount].id }))
      : [];
    return {
      id: s.id, kind, title: s.title, easy, hard, quiz: s.quiz || null, timer: s.timer || null, coop: !!s.coop,
      letter: scrambled[i], fact: s.fact || s.quiz?.explain || null, roles, done: false, stars: 0, answer: null, photoIds: [],
    };
  });

  steps.push({
    id: 'final', kind: 'final', title: T.final, letter: null, done: false, stars: 0,
    word, decoys: decoysFor(word, r), scrambled,
  });

  const bonusAvail = BONUS_STEPS.filter(b => !(place?.noPhoto && b.kind === 'photo'));
  const bonus = { ...pick(r, bonusAvail), unlockAfter: Math.min(1, steps.length - 2), done: false };

  const title = (theme ? theme.title : pick(r, T.titles)).replace('{place}', place ? place.name : 'votre quartier');
  const intro = (theme ? theme.intro : pick(r, T.intros)).replace('{at}', at);

  return {
    seed, type, theme: theme?.id || null, themeName: theme?.name || null, surprise,
    placeId: isAround ? (place?.id || 'autour') : place.id, around: isAround, placeName,
    title, intro, guide, lines: T.lines,
    duration: opts.duration, difficulty: opts.difficulty, weather: opts.weather, hour: opts.hour,
    memberIds: opts.members.map(m => m.id),
    levels: { easy: levels.easy.map(m => m.id), hard: levels.hard.map(m => m.id) },
    steps, bonus,
    warnings: warningsFor(place, opts.weather, opts.hour, opts.members),
    badge: place?.badge || null,
  };
}

// Suggestion du jour selon la météo, l'heure et les lieux pas encore explorés
export function suggest(weather, hour, explored, seed, youngest = 99) {
  const r = rng(seed);
  let cands = PLACES.filter(p => {
    if (p.minAge && youngest < p.minAge) return false; // lieu trop difficile pour le plus jeune
    if (weather === 'rain') return p.indoor || p.id === 'vieil-antibes';
    if (p.hours === 'museum' && (hour >= 18 || hour < 10)) return false;
    if (p.hours === 'morning' && hour >= 13) return false;
    if (p.hours === 'day' && (hour >= 19 || hour < 8)) return false;
    if (weather === 'heat') return ['pinede', 'exflora', 'juan-plage', 'eilenroc', 'picasso', 'archeo', 'thuret', 'brague', 'peynet', 'salis', 'gravette', 'bois-garoupe', 'vaugrenier', 'posidonia', 'semboules', 'estagnol', 'bouillides', 'albert1', 'ponteil', 'ondes'].includes(p.id);
    if (weather === 'wind') return !['garoupe', 'juan-plage', 'salis', 'tirepoil', 'bastion-jaume', 'ilette', 'ondes', 'ponteil', 'gallice'].includes(p.id);
    return true;
  });
  if (!cands.length) cands = PLACES.filter(p => p.hours === 'always');
  const fresh = cands.filter(p => !explored.has(p.id));
  const place = pick(r, fresh.length ? fresh : cands);
  const typesFor = place.tags.includes('nature') ? ['nature', 'photo', 'treasure'] : place.tags.includes('art') ? ['detective', 'imaginary', 'photo'] : ['treasure', 'detective', 'imaginary', 'challenge'];
  return { place, type: pick(r, typesFor), fresh: !explored.has(place.id) };
}
