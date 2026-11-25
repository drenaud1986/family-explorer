// Carte souvenir : image PNG avec titre, date, participants, photos et badges
import { photoURL } from './store.js';
import { ALL_BADGES, TYPES } from './data.js';
import { medal, guideArt } from './art.js';
const svgImg = svg => loadImg('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg));

const loadImg = src => new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; });

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
function cover(ctx, img, x, y, w, h) {
  const k = Math.max(w / img.width, h / img.height);
  const sw = w / k, sh = h / k;
  ctx.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, x, y, w, h);
}
function wrap(ctx, text, maxW) {
  const words = text.split(' '); const lines = []; let line = '';
  for (const w of words) { const t = line ? line + ' ' + w : w; if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t; }
  if (line) lines.push(line);
  return lines;
}

export async function renderSouvenir(adv, members) {
  await document.fonts?.ready;
  const W = 1080, H = 1350, P = 64;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const ctx = c.getContext('2d');
  const T = TYPES[adv.type];

  // Fond
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#0B4A61'); g.addColorStop(1, '#0E6E8C');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(255,194,60,.16)';
  ctx.beginPath(); ctx.arc(W - 120, 140, 260, 0, Math.PI * 2); ctx.fill();

  // Carte crème
  ctx.fillStyle = '#FFF8EC'; roundRect(ctx, P / 2, P / 2, W - P, H - P, 48); ctx.fill();

  const head = '"Baloo 2", "Nunito", system-ui, sans-serif';
  const body = '"Nunito", system-ui, sans-serif';
  let y = 110;
  ctx.fillStyle = '#E0603A'; ctx.font = `800 30px ${body}`; ctx.textAlign = 'center';
  ctx.fillText('FAMILY EXPLORER · SOUVENIR D\'AVENTURE', W / 2, y);
  y += 78;
  ctx.fillStyle = '#1B2A3A'; ctx.font = `800 68px ${head}`;
  for (const l of wrap(ctx, adv.title, W - 2 * P - 40).slice(0, 2)) { ctx.fillText(l, W / 2, y); y += 72; }
  ctx.font = `700 34px ${body}`; ctx.fillStyle = '#4A5866';
  const d = new Date(adv.finishedAt || Date.now());
  ctx.fillText(`${adv.placeName} · ${d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`, W / 2, y + 4);
  y += 50;

  // Photos
  const ids = adv.steps.flatMap(s => s.photoIds || []).concat(adv.bonus?.photoIds || []).slice(0, 4);
  const imgs = (await Promise.all(ids.map(async id => { const u = await photoURL(id); return u ? loadImg(u) : null; }))).filter(Boolean);
  const gx = P + 8, gw = W - 2 * P - 16, gh = 560;
  if (imgs.length) {
    const cells = imgs.length === 1 ? [[0, 0, 1, 1]] : imgs.length === 2 ? [[0, 0, .5, 1], [.5, 0, .5, 1]] : imgs.length === 3 ? [[0, 0, .6, 1], [.6, 0, .4, .5], [.6, .5, .4, .5]] : [[0, 0, .5, .5], [.5, 0, .5, .5], [0, .5, .5, .5], [.5, .5, .5, .5]];
    imgs.forEach((img, i) => {
      const [cx, cy, cw, ch] = cells[i]; const gap = 8;
      const x = gx + cx * gw + gap / 2, yy = y + cy * gh + gap / 2, w = cw * gw - gap, h = ch * gh - gap;
      ctx.save(); roundRect(ctx, x, yy, w, h, 28); ctx.clip(); cover(ctx, img, x, yy, w, h); ctx.restore();
    });
  } else {
    ctx.fillStyle = '#FFE7A8'; roundRect(ctx, gx, y, gw, gh, 32); ctx.fill();
    const m = await svgImg(guideArt(adv, 'cheer', { size: 460 })); if (m) ctx.drawImage(m, W / 2 - 230, y + 40, 460, 460);
  }
  y += gh + 70;

  // Participants
  ctx.fillStyle = '#1B2A3A'; ctx.font = `800 38px ${head}`;
  const names = members.map(m => `${m.avatar} ${m.name}`).join('   ');
  for (const l of wrap(ctx, names || 'La famille', W - 2 * P).slice(0, 2)) { ctx.fillText(l, W / 2, y); y += 48; }
  y += 10;

  // Badges + étoiles
  const badges = (adv.earnedBadges || []).map(id => ALL_BADGES.find(b => b.id === id)).filter(Boolean).slice(0, 6);
  if (badges.length) {
    ctx.font = `76px ${body}`;
    const step = Math.min(130, (W - 2 * P) / badges.length);
    const x0 = W / 2 - (step * (badges.length - 1)) / 2;
    const imgs2 = await Promise.all(badges.map(b => svgImg(medal(b.id, b.collection, '', 100))));
    imgs2.forEach((im, i) => im && ctx.drawImage(im, x0 + i * step - 46, y - 10, 92, 101));
    y += 96;
    ctx.font = `700 28px ${body}`; ctx.fillStyle = '#4A5866';
    ctx.fillText(badges.map(b => b.name).slice(0, 3).join(' · '), W / 2, y + 10);
    y += 40;
  }
  const stars = adv.steps.reduce((s, x) => s + (x.stars || 0), 0) + (adv.bonus?.done ? 2 : 0);
  ctx.fillStyle = '#E0A21B'; ctx.font = `800 40px ${head}`;
  ctx.fillText(`⭐ ${stars} étoiles · Code secret : ${adv.steps.at(-1).word}`, W / 2, Math.min(y + 30, H - 70));

  return new Promise(res => c.toBlob(res, 'image/png'));
}
