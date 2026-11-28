import { ALL_BADGES, PLACES } from './data.js';
import { placePhoto } from './photos.js';
// Family Explorer — kit graphique maison (SVG) : mascotte Pistou, objets, pictogrammes, médailles, carte au trésor.
// Un seul style : trait encre arrondi, aplats de la palette, aucune ressource externe ni licence à gérer.

export const C = {
  ink: '#1B2A3A', sun: '#FFC23C', fox: '#F08A3C', terra: '#E0603A', sea: '#0E6E8C', leaf: '#3E9B5A', cream: '#FFF8EC',
  parch: '#F3DFB5', parch2: '#E8C98E', wood: '#A0693B', wood2: '#B97A44', grey: '#C9C2B4', red: '#D64545', sky: '#BFE3EE',
  pink: '#F4A3A3', purple: '#6C5CE7', gem: '#5BC0DE', orange: '#F28C28',
};
const g = (body, sw = 3) => `<g fill="none" stroke="${C.ink}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${body}</g>`;

// ---------- Objets et pictogrammes (viewBox 64) ----------
const I = {
  compass: `<circle cx="32" cy="32" r="25" fill="${C.cream}"/><path d="M32 9v5M32 50v5M9 32h5M50 32h5"/><polygon points="32,13 38,32 26,32" fill="${C.terra}"/><polygon points="26,32 38,32 32,51" fill="${C.sea}"/><circle cx="32" cy="32" r="3.5" fill="${C.sun}"/>`,
  magnifier: `<rect x="35" y="43" width="24" height="10" rx="5" transform="rotate(45 47 48)" fill="${C.wood}"/><circle cx="26" cy="26" r="17" fill="${C.sky}"/><path d="M17 22a10 10 0 0 1 8-7" stroke="#fff"/>`,
  key: `<rect x="29" y="28" width="28" height="8" rx="2" fill="${C.sun}"/><path d="M46 36v8h5v-8M54 36v5" fill="${C.sun}"/><circle cx="19" cy="32" r="12" fill="${C.sun}"/><circle cx="19" cy="32" r="4.5" fill="${C.cream}"/>`,
  scroll: `<rect x="14" y="12" width="36" height="40" fill="${C.parch}"/><rect x="10" y="7" width="44" height="10" rx="5" fill="${C.parch2}"/><rect x="10" y="47" width="44" height="10" rx="5" fill="${C.parch2}"/><path d="M21 25h22M21 32h22M21 39h14" stroke-width="2.5"/>`,
  chest: `<rect x="8" y="30" width="48" height="25" rx="3" fill="${C.wood}"/><path d="M8 30v-8q0-10 24-10t24 10v8z" fill="${C.wood2}"/><rect x="8" y="27" width="48" height="6" fill="${C.sun}"/><rect x="27" y="30" width="10" height="12" rx="2" fill="${C.sun}"/><path d="M18 33v22M46 33v22"/>`,
  map: `<path d="M8 14l16-6 16 6 16-6v42l-16 6-16-6-16 6z" fill="${C.parch}"/><path d="M24 8v42M40 14v42"/><path d="M14 46q8-14 16-8t16-16" stroke="${C.terra}" stroke-dasharray="3 5"/><path d="M42 18l8 8M50 18l-8 8" stroke="${C.terra}" stroke-width="3.5"/>`,
  footprints: `<ellipse cx="21" cy="44" rx="7" ry="10" fill="${C.wood}"/><circle cx="15" cy="31" r="2.6" fill="${C.wood}"/><circle cx="21" cy="29" r="2.6" fill="${C.wood}"/><circle cx="27" cy="31" r="2.6" fill="${C.wood}"/><ellipse cx="43" cy="26" rx="7" ry="10" fill="${C.wood}"/><circle cx="37" cy="13" r="2.6" fill="${C.wood}"/><circle cx="43" cy="11" r="2.6" fill="${C.wood}"/><circle cx="49" cy="13" r="2.6" fill="${C.wood}"/>`,
  arrow: `<path d="M8 26h28V15l20 17-20 17V38H8z" fill="${C.terra}"/>`,
  lock: `<path d="M21 30v-8a11 11 0 0 1 22 0v8" stroke-width="5"/><rect x="13" y="29" width="38" height="27" rx="5" fill="${C.sun}"/><circle cx="32" cy="40" r="4" fill="${C.ink}"/><path d="M32 42v7" stroke-width="3.5"/>`,
  coin: `<circle cx="32" cy="32" r="23" fill="${C.sun}"/><circle cx="32" cy="32" r="16"/><polygon points="32,22 35,29 42,29 36.5,34 38.5,41 32,37 25.5,41 27.5,34 22,29 29,29" fill="#F7D777" stroke-width="2"/>`,
  star: `<polygon points="32,9 37.9,24.9 54.8,25.6 41.5,36.1 46.1,52.4 32,43 17.9,52.4 22.5,36.1 9.2,25.6 26.1,24.9" fill="${C.sun}"/>`,
  gem: `<polygon points="18,14 46,14 56,26 32,54 8,26" fill="${C.gem}"/><path d="M8 26h48M26 26l6-12 6 12M26 26l6 28 6-28" stroke-width="2.5"/>`,
  spyglass: `<g transform="rotate(-30 32 32)"><rect x="5" y="27" width="16" height="10" rx="2" fill="${C.wood}"/><rect x="21" y="25" width="16" height="14" rx="2" fill="${C.sun}"/><rect x="37" y="22" width="20" height="20" rx="3" fill="${C.wood}"/></g>`,
  lantern: `<circle cx="32" cy="9" r="4"/><path d="M22 18h20l-4-6H26z" fill="${C.wood}"/><rect x="20" y="18" width="24" height="28" rx="3" fill="${C.sun}"/><path d="M32 25q7 8 0 15q-7-7 0-15z" fill="${C.terra}"/><rect x="17" y="46" width="30" height="7" rx="2" fill="${C.wood}"/>`,
  camera: `<rect x="20" y="13" width="16" height="9" rx="2" fill="${C.sea}"/><rect x="7" y="20" width="50" height="33" rx="6" fill="${C.sea}"/><circle cx="32" cy="37" r="12" fill="${C.cream}"/><circle cx="32" cy="37" r="6" fill="${C.ink}"/><rect x="45" y="25" width="7" height="5" rx="1" fill="${C.sun}"/>`,
  leaf: `<path d="M12 53C12 25 30 10 54 10c0 25-15 43-42 43z" fill="${C.leaf}"/><path d="M12 53L44 21M26 39h10M34 31v-9" stroke-width="2.5"/>`,
  shell: `<path d="M32 54L9 27q23-24 46 0z" fill="#F7B58A"/><path d="M32 54L17 19M32 54L24 13M32 54V10M32 54l8-41M32 54l15-35" stroke-width="2.5"/><rect x="26" y="51" width="12" height="6" rx="2" fill="#F7B58A"/>`,
  anchor: `<circle cx="32" cy="12" r="5"/><path d="M32 17v38M21 25h22M11 37q3 18 21 18t21-18" stroke-width="4.5"/><path d="M7 41l4-6 5 5M57 41l-4-6-5 5" stroke-width="4"/>`,
  hourglass: `<rect x="13" y="7" width="38" height="7" rx="2" fill="${C.wood}"/><rect x="13" y="50" width="38" height="7" rx="2" fill="${C.wood}"/><path d="M18 14h28L32 32l14 18H18l14-18z" fill="${C.sky}"/><path d="M23 17h18l-9 10z" fill="${C.sun}" stroke-width="2"/><path d="M23 47h18l-9-9z" fill="${C.sun}" stroke-width="2"/>`,
  puzzle: `<path d="M14 22h12a6 6 0 1 1 12 0h12v12a6 6 0 1 1 0 12v8H14z" fill="${C.terra}"/>`,
  flag: `<path d="M16 8v50" stroke="${C.wood}" stroke-width="5"/><path d="M16 8v50"/><path d="M18 10h32l-8 10 8 10H18z" fill="${C.terra}"/>`,
  pinecone: `<path d="M32 10v6" stroke="${C.wood}" stroke-width="4"/><ellipse cx="32" cy="36" rx="14" ry="20" fill="${C.wood}"/><path d="M21 27q11 7 22 0M19 37q13 7 26 0M22 47q10 6 20 0M32 17v38" stroke-width="2.5"/>`,
  lighthouse: `<path d="M24 54h16l-3-36H27z" fill="${C.cream}"/><path d="M25.6 34h12.8l.6 7H25z" fill="${C.terra}" stroke-width="2"/><rect x="26" y="10" width="12" height="8" fill="${C.sun}"/><path d="M24 10h16l-8-6z" fill="${C.terra}"/><path d="M42 12l12-4M42 16l12 4" stroke="${C.sun}" stroke-width="3.5"/><rect x="17" y="54" width="30" height="5" rx="1" fill="${C.grey}"/>`,
  castle: `<rect x="22" y="28" width="20" height="28" fill="${C.parch}"/><path d="M8 56V18h4v-5h4v5h3v-5h3v43zM42 56V18h3v-5h3v5h3v-5h4v43z" fill="${C.parch2}"/><path d="M27 56v-9a5 5 0 0 1 10 0v9z" fill="${C.wood}"/><path d="M48 13V4" stroke-width="2.5"/><path d="M48 4h8l-3 3 3 3h-8" fill="${C.terra}" stroke-width="2"/>`,
  fort: `<polygon points="32,5 40,24 59,32 40,40 32,59 24,40 5,32 24,24" fill="${C.parch2}"/><rect x="24" y="24" width="16" height="16" fill="${C.parch}"/><path d="M32 24v-8" stroke-width="2.5"/><path d="M32 16h7l-2 2.5 2 2.5h-7" fill="${C.terra}" stroke-width="2"/>`,
  wall: `<path d="M6 56V24h6v-6h7v6h7v-6h7v6h7v-6h7v6h7v-6h6v38z" fill="${C.parch2}"/><path d="M6 34h52M6 45h52M18 24v10M34 24v10M50 24v10M12 34v11M26 34v11M42 34v11M18 45v11M34 45v11M50 45v11" stroke-width="2"/>`,
  amphora: `<path d="M26 9h12v6q12 8 8 25-4 12-14 18-10-6-14-18-4-17 8-25z" fill="#D98A4E"/><path d="M26 17q-10 0-6 12M38 17q10 0 6 12M20 36h24" stroke-width="2.5"/>`,
  palette: `<path d="M32 8C14 8 6 22 8 34s14 22 26 22c6 0 6-6 2-10s0-8 6-6c10 3 16-4 14-14S44 8 32 8z" fill="${C.parch}"/><circle cx="21" cy="23" r="4.5" fill="${C.terra}" stroke-width="2"/><circle cx="35" cy="17" r="4.5" fill="${C.sun}" stroke-width="2"/><circle cx="47" cy="26" r="4.5" fill="${C.sea}" stroke-width="2"/><circle cx="19" cy="37" r="4.5" fill="${C.leaf}" stroke-width="2"/>`,
  flower: `<path d="M32 36v22" stroke="${C.leaf}" stroke-width="4"/><path d="M32 48q8-8 14-4" stroke="${C.leaf}" stroke-width="3.5"/><circle cx="32" cy="14" r="8" fill="#F48FB1"/><circle cx="44" cy="23" r="8" fill="#F48FB1"/><circle cx="40" cy="37" r="8" fill="#F48FB1"/><circle cx="24" cy="37" r="8" fill="#F48FB1"/><circle cx="20" cy="23" r="8" fill="#F48FB1"/><circle cx="32" cy="26" r="7" fill="${C.sun}"/>`,
  palm: `<path d="M30 58q5-17 2-32" stroke="${C.wood}" stroke-width="6"/><path d="M30 58q5-17 2-32" stroke-width="2"/><path d="M32 25q-14-12-26-4 14-2 26 4zM32 25q14-12 26-4-14-2-26 4zM32 25q-6-16-20-16 12 6 20 16zM32 25q6-16 20-16-12 6-20 16z" fill="${C.leaf}"/>`,
  wave: `<path d="M4 38q10-12 20 0t20 0 18-2v22H4z" fill="${C.sea}"/><path d="M4 50q10-8 20 0t20 0 18 0" stroke="#fff" stroke-width="2.5"/><circle cx="48" cy="20" r="7" fill="${C.sun}"/>`,
  pencil: `<g transform="rotate(-45 32 32)"><rect x="10" y="26" width="36" height="12" fill="${C.sun}"/><polygon points="46,26 58,32 46,38" fill="${C.parch}"/><polygon points="54,30 58,32 54,34" fill="${C.ink}"/><rect x="4" y="26" width="7" height="12" rx="2" fill="${C.pink}"/></g>`,
  tomato: `<circle cx="32" cy="37" r="20" fill="${C.red}"/><path d="M32 17l4 5 6-2-3 6 5 3h-8l-4 4-4-4h-8l5-3-3-6 6 2z" fill="${C.leaf}" stroke-width="2"/><path d="M22 32a10 10 0 0 1 6-6" stroke="#fff" stroke-width="2.5"/>`,
  trophy: `<path d="M18 10h28v12q0 16-14 18-14-2-14-18z" fill="${C.sun}"/><path d="M18 14H9q0 12 11 13M46 14h9q0 12-11 13"/><rect x="29" y="40" width="6" height="8" fill="${C.sun}"/><rect x="19" y="48" width="26" height="8" rx="2" fill="${C.wood}"/>`,
  medal: `<path d="M20 6l10 22M44 6L34 28" stroke-width="8" stroke="${C.sea}"/><circle cx="32" cy="40" r="15" fill="${C.sun}"/><polygon points="32,31 34.5,37 41,37 36,41 38,47 32,43.5 26,47 28,41 23,37 29.5,37" fill="#F7D777" stroke-width="2"/>`,
  boot: `<path d="M19 8h17v28l16 6q5 2 5 8v5H15V40q4-6 4-12z" fill="${C.wood}"/><path d="M15 50h42M19 18h17"/>`,
  backpack: `<path d="M24 16v-4a8 8 0 0 1 16 0v4"/><rect x="13" y="16" width="38" height="41" rx="11" fill="${C.leaf}"/><path d="M13 30q19 8 38 0" fill="#2F7D47"/><rect x="22" y="38" width="20" height="13" rx="3" fill="${C.sun}"/>`,
  crown: `<polygon points="8,47 8,18 20,32 32,11 44,32 56,18 56,47" fill="${C.sun}"/><circle cx="20" cy="40" r="3.5" fill="${C.terra}" stroke-width="2"/><circle cx="32" cy="40" r="3.5" fill="${C.sea}" stroke-width="2"/><circle cx="44" cy="40" r="3.5" fill="${C.terra}" stroke-width="2"/><rect x="8" y="47" width="48" height="7" fill="${C.sun}"/>`,
  sun: `<path d="M32 4v8M32 52v8M4 32h8M52 32h8M12 12l6 6M46 46l6 6M52 12l-6 6M18 46l-6 6" stroke="${C.terra}" stroke-width="3.5"/><circle cx="32" cy="32" r="14" fill="${C.sun}"/>`,
  snowflake: `<path d="M32 6v52M9.5 19l45 26M54.5 19l-45 26M26 10l6 6 6-6M26 54l6-6 6 6M10 28l8-2-2-8M54 36l-8 2 2 8M54 28l-8-2 2-8M10 36l8 2-2 8" stroke="${C.sea}" stroke-width="3.5"/>`,
  pumpkin: `<path d="M32 18q-2-8 4-12" stroke="${C.leaf}" stroke-width="4"/><ellipse cx="20" cy="37" rx="12" ry="18" fill="${C.orange}"/><ellipse cx="44" cy="37" rx="12" ry="18" fill="${C.orange}"/><ellipse cx="32" cy="37" rx="11" ry="19" fill="#F59B3D"/>`,
  tree: `<rect x="28" y="44" width="8" height="14" fill="${C.wood}"/><path d="M32 6L14 30h8L10 46h44L42 30h8z" fill="${C.leaf}"/>`,
  binoculars: `<rect x="12" y="14" width="13" height="16" rx="3" fill="${C.ink}"/><rect x="39" y="14" width="13" height="16" rx="3" fill="${C.ink}"/><rect x="25" y="26" width="14" height="8" fill="${C.sea}"/><circle cx="19" cy="40" r="12" fill="${C.sea}"/><circle cx="45" cy="40" r="12" fill="${C.sea}"/><circle cx="19" cy="40" r="6" fill="${C.sky}"/><circle cx="45" cy="40" r="6" fill="${C.sky}"/>`,
  eye: `<path d="M5 32q27-26 54 0-27 26-54 0z" fill="${C.cream}"/><circle cx="32" cy="32" r="10" fill="${C.sea}"/><circle cx="32" cy="32" r="4" fill="${C.ink}"/>`,
  bolt: `<polygon points="37,4 13,36 30,36 25,60 51,25 34,25" fill="${C.sun}"/>`,
  thought: `<circle cx="22" cy="30" r="12" fill="${C.cream}"/><circle cx="37" cy="22" r="14" fill="${C.cream}"/><circle cx="48" cy="34" r="10" fill="${C.cream}"/><circle cx="33" cy="38" r="11" fill="${C.cream}"/><g stroke="none" fill="${C.cream}"><circle cx="22" cy="30" r="10.5"/><circle cx="37" cy="22" r="12.5"/><circle cx="48" cy="34" r="8.5"/><circle cx="33" cy="38" r="9.5"/></g><circle cx="14" cy="50" r="4.5" fill="${C.cream}"/><circle cx="7" cy="58" r="2.8" fill="${C.cream}"/>`,
  tally: `<rect x="10" y="8" width="44" height="48" rx="4" fill="${C.parch}"/><path d="M20 20v24M27 20v24M34 20v24M41 20v24M16 38l30-12" stroke-width="3.5"/>`,
  heart: `<path d="M32 54C10 40 8 22 20 16c7-3 12 2 12 6 0-4 5-9 12-6 12 6 10 24-12 38z" fill="${C.terra}"/>`,
  umbrella: `<path d="M32 30v20a5 5 0 0 1-10 0" stroke-width="3.5"/><path d="M6 30Q8 8 32 8t26 22q-6-5-13 0-6-5-13 0-6-5-13 0-7-5-13 0z" fill="${C.sea}"/>`,
  note: `<path d="M24 46V14l26-6v32" stroke-width="3.5"/><path d="M24 20l26-6" stroke-width="5"/><ellipse cx="18" cy="47" rx="8" ry="6" fill="${C.purple}"/><ellipse cx="44" cy="41" rx="8" ry="6" fill="${C.purple}"/>`,
  boat: `<path d="M8 40h48l-8 12H16z" fill="${C.wood}"/><path d="M32 8v32" stroke-width="3"/><path d="M34 10l16 26H34z" fill="${C.cream}"/><path d="M30 14L16 36h14z" fill="${C.terra}"/>`,
  bucket: `<path d="M22 22a10 10 0 0 1 20 0" stroke-width="3"/><path d="M14 24h36l-5 32H19z" fill="${C.sea}"/><rect x="12" y="20" width="40" height="7" rx="3" fill="${C.gem}"/><path d="M22 36h20" stroke="#fff" stroke-width="2.5"/><path d="M50 52q6-4 10 2" fill="${C.parch2}"/>`,
  bell: `<circle cx="32" cy="9" r="4"/><path d="M32 13c-12 0-14 12-14 22l-6 10h40l-6-10c0-10-2-22-14-22z" fill="${C.sun}"/><circle cx="32" cy="50" r="5" fill="${C.wood}"/><path d="M24 26q2-6 7-7" stroke="#fff" stroke-width="2.5"/>`,
  pine: `<path d="M31 58q2-14 1-26" stroke="${C.wood}" stroke-width="5"/><path d="M31 58q2-14 1-26" stroke-width="2"/><ellipse cx="22" cy="24" rx="14" ry="8" fill="${C.leaf}"/><ellipse cx="42" cy="22" rx="15" ry="8" fill="${C.leaf}"/><ellipse cx="32" cy="14" rx="14" ry="8" fill="#4FAE68"/>`,
  brush: `<g transform="rotate(-40 32 32)"><rect x="29" y="22" width="6" height="34" rx="3" fill="${C.wood}"/><rect x="27" y="16" width="10" height="8" fill="${C.grey}"/><path d="M27 16q5-14 10 0z" fill="${C.terra}"/></g><circle cx="48" cy="48" r="4" fill="${C.sea}" stroke="none"/><circle cx="54" cy="40" r="3" fill="${C.sun}" stroke="none"/>`,
  fish: `<path d="M8 40q4-14 10-28M14 54q2-10 8-16M54 56q-2-12 4-22" stroke="${C.leaf}" stroke-width="3.5"/><path d="M14 30q14-14 32 0-18 14-32 0z" fill="${C.gem}"/><path d="M46 30l10-8v16z" fill="${C.gem}"/><circle cx="22" cy="28" r="2.5" fill="${C.ink}"/><path d="M30 24v12" stroke-width="2"/>`,
  spray: `<rect x="18" y="22" width="20" height="34" rx="4" fill="${C.terra}"/><rect x="22" y="14" width="12" height="9" rx="2" fill="${C.grey}"/><rect x="25" y="9" width="6" height="6" rx="1" fill="${C.ink}"/><path d="M18 34h20" stroke="#fff" stroke-width="2.5"/><circle cx="42" cy="10" r="3" fill="${C.sun}" stroke="none"/><circle cx="50" cy="14" r="3.5" fill="${C.sea}" stroke="none"/><circle cx="46" cy="22" r="3" fill="${C.leaf}" stroke="none"/><circle cx="55" cy="6" r="2.5" fill="#F48FB1" stroke="none"/>`,
  duck: `<path d="M10 40q0 14 22 14 22 0 24-14-10 4-18 0z" fill="${C.sun}"/><circle cx="20" cy="26" r="10" fill="${C.sun}"/><path d="M9 26l-6 3 6 2z" fill="${C.terra}"/><circle cx="18" cy="23" r="2" fill="${C.ink}"/><path d="M4 56q28 6 56 0" stroke="${C.sea}" stroke-width="3"/>`,
  speaker: `<path d="M10 24h10l14-12v40L20 40H10z" fill="${C.sun}"/><path d="M42 22q8 10 0 20M48 16q14 16 0 32" stroke-width="3.5"/>`,
  mute: `<path d="M10 24h10l14-12v40L20 40H10z" fill="${C.grey}"/><path d="M42 24l14 16M56 24L42 40" stroke-width="4"/>`,
  book: `<path d="M8 14q12-4 24 4 12-8 24-4v38q-12-4-24 4-12-8-24-4z" fill="${C.cream}"/><path d="M32 18v38" /><path d="M14 24q8-2 13 2M14 32q8-2 13 2M37 26q5-4 13-2M37 34q5-4 13-2" stroke-width="2"/>`,
  flame: `<path d="M32 6q4 12 12 18 8 8 6 18-2 14-18 16-16-2-18-16-2-10 6-16 0 8 6 10-2-16 6-30z" fill="${C.orange}"/><path d="M32 30q8 8 6 16-2 6-6 6-6 0-7-6 0-8 7-16z" fill="${C.sun}"/>`,
  house: `<path d="M8 30L32 10l24 20" stroke-width="4"/><path d="M14 28v26h36V28L32 13z" fill="${C.sun}"/><rect x="27" y="38" width="10" height="16" rx="2" fill="${C.terra}"/><path d="M8 30L32 10l24 20" stroke="${C.terra}" stroke-width="5"/>`,
  person: `<circle cx="32" cy="20" r="11" fill="${C.fox}"/><path d="M12 56q0-20 20-20t20 20z" fill="${C.sea}"/>`,
  chapel: `<path d="M32 4v10M27 9h10" stroke-width="3"/><path d="M14 30L32 14l18 16v26H14z" fill="${C.parch}"/><path d="M27 56V44a5 5 0 0 1 10 0v12z" fill="${C.wood}"/><circle cx="32" cy="30" r="4" fill="${C.sky}"/>`,
  arches: `<path d="M4 18h56v8H4z" fill="${C.parch2}"/><path d="M8 26h12v32H8zM26 26h12v32H26zM44 26h12v32H44z" fill="${C.parch}"/><path d="M20 58V40a3 3 0 0 1 6 0v18M38 58V40a3 3 0 0 1 6 0v18" fill="${C.sky}"/><path d="M4 22h56" stroke="${C.sea}" stroke-width="3"/>`,
  dice: `<rect x="10" y="10" width="44" height="44" rx="9" fill="${C.cream}"/><circle cx="22" cy="22" r="4" fill="${C.terra}" stroke="none"/><circle cx="42" cy="22" r="4" fill="${C.terra}" stroke="none"/><circle cx="32" cy="32" r="4" fill="${C.terra}" stroke="none"/><circle cx="22" cy="42" r="4" fill="${C.terra}" stroke="none"/><circle cx="42" cy="42" r="4" fill="${C.terra}" stroke="none"/>`,
};
export const ICON_NAMES = Object.keys(I);

export function icon(name, cls = '') {
  const body = I[name] || I.star;
  return `<svg class="ico ${cls}" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">${g(body)}</svg>`;
}
const nested = (name, x, y, s) => `<svg x="${x}" y="${y}" width="${s}" height="${s}" viewBox="0 0 64 64">${g(I[name] || I.star)}</svg>`;

// ---------- Correspondances ----------
export const PLACE_ICON = {
  'vieil-antibes': 'castle', 'fort-carre': 'fort', 'port-vauban': 'anchor', exflora: 'flower', pinede: 'pinecone', garoupe: 'lighthouse',
  marche: 'tomato', remparts: 'wall', picasso: 'palette', archeo: 'amphora', eilenroc: 'flower', 'juan-plage': 'shell',
  thuret: 'palm', brague: 'tree', salis: 'wave', peynet: 'pencil', autour: 'compass',
  jazz: 'note', gravette: 'bucket', 'bastion-jaume': 'flag', bernardin: 'chapel', 'bois-garoupe': 'pine', hartung: 'brush',
  posidonia: 'fish', 'street-art': 'spray', tirepoil: 'footprints', calvaire: 'boot', vaugrenier: 'duck',
  'place-nationale': 'note', cathedrale: 'bell', martyrs: 'flame', 'de-gaulle': 'flag', albert1: 'tree', ponteil: 'sun', ondes: 'umbrella',
  ilette: 'spyglass', gallice: 'boat', 'palais-congres': 'star', 'saint-jean': 'chapel', school: 'spray', cerutti: 'trophy', semboules: 'crown',
  estagnol: 'leaf', combes: 'dice', fontonne: 'heart', bouillides: 'arches',
};
export const TYPE_ICON = { treasure: 'chest', detective: 'magnifier', nature: 'leaf', photo: 'camera', challenge: 'bolt', imaginary: 'crown', surprise: 'dice' };
export const KIND_ICON = { observe: 'binoculars', photo: 'camera', quiz: 'puzzle', count: 'tally', challenge: 'bolt', imagine: 'thought', final: 'lock' };
export const WEATHER_ICON = { sun: 'sun', cloud: 'thought', rain: 'umbrella', wind: 'flag', heat: 'sun' };
const BADGE_ICON = {
  'n-1': 'leaf', 'n-3': 'binoculars', 'n-vert': 'tree', 'n-mer': 'shell', 'n-thuret': 'palm', 'n-foret': 'footprints',
  'h-antipolis': 'amphora', 'h-fort': 'fort', 'h-musees': 'palette', 'h-detective': 'magnifier', 'h-artistes': 'pencil',
  's-printemps': 'flower', 's-ete': 'sun', 's-automne': 'leaf', 's-hiver': 'snowflake', 's-pluie': 'umbrella',
  'e-1': 'boot', 'e-5': 'backpack', 'e-10': 'crown', 'e-types': 'puzzle', 'e-equipe': 'heart', 'e-surprise': 'chest', 'e-bonus': 'gem', 'e-lieux': 'map', 'e-20': 'trophy', 'e-tous': 'compass', 'e-savoir': 'book', 'e-serie': 'flame', 'n-gardien': 'pine',
  'x-halloween': 'pumpkin', 'x-noel': 'tree', 'x-musique': 'note', 'x-jazz': 'note', 'x-nouvelan': 'star', 'x-mimosa': 'sun',
};
export const COLLECTION_COLOR = { quartiers: C.sea, nature: C.leaf, histoire: C.wood, saisons: C.terra, explorateurs: '#E0A21B', exceptionnels: '#8E5BB5' };
export const badgeIcon = id => BADGE_ICON[id] || PLACE_ICON[id.replace(/^q-/, '')] || 'star';

// ---------- Médaille de badge ----------
function medalSvg(badgeId, collection, cls = '', size) {
  const col = COLLECTION_COLOR[collection] || C.sea;
  const wh = size ? `width="${size}" height="${size * 1.1}"` : '';
  return `<svg class="medal ${cls}" viewBox="0 0 100 110" ${wh} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    ${g(`<path d="M30 70l-10 36 16-8 10 10 4-34" fill="${C.terra}"/><path d="M70 70l10 36-16-8-10 10-4-34" fill="${C.terra}"/>
    <circle cx="50" cy="48" r="44" fill="${col}"/><circle cx="50" cy="48" r="35" fill="${C.cream}"/>
    <circle cx="50" cy="48" r="39.5" stroke="#fff" stroke-width="2" stroke-dasharray="2 5"/>`)}
    ${nested(badgeIcon(badgeId), 24, 22, 52)}</svg>`;
}

// ---------- Mascotte : Pistou le renard explorateur ----------
const HATS = {
  explorer: `<ellipse cx="100" cy="64" rx="54" ry="10" fill="#E9D3A1"/><path d="M62 64q2-36 38-38t38 38z" fill="#E9D3A1"/><path d="M63 56q37 8 74 0l1 7q-38 8-76 0z" fill="${C.wood}"/>`,
  pirate: `<path d="M44 68q12-34 56-38 44 4 56 38-56-16-112 0z" fill="${C.ink}"/><circle cx="100" cy="47" r="7" fill="#fff" stroke="#fff"/><path d="M92 56l16-6M92 50l16 6" stroke="#fff" stroke-width="3"/>`,
  detective: `<path d="M64 66q2-32 36-34t36 34z" fill="#B98D5B"/><path d="M72 42q28 10 56 0M66 54q34 10 68 0M88 34v30M112 34v30" stroke-width="2" stroke="#8A6640"/><path d="M56 66q20-8 44-4t44 4q-44 10-88 0z" fill="#B98D5B"/><circle cx="100" cy="30" r="4" fill="#B98D5B"/>`,
  botanist: `<ellipse cx="100" cy="64" rx="62" ry="12" fill="#F1D27A"/><path d="M68 62q2-26 32-28t32 28z" fill="#F1D27A"/><path d="M68 56q32 8 64 0v6q-32 8-64 0z" fill="${C.leaf}"/><circle cx="76" cy="52" r="6" fill="#F48FB1"/><circle cx="76" cy="52" r="2.5" fill="${C.sun}"/>`,
  reporter: `<ellipse cx="96" cy="54" rx="44" ry="16" fill="${C.red}"/><path d="M96 38v-8" stroke-width="4"/>`,
  coach: `<path d="M64 64q2-34 36-34t36 34z" fill="${C.sea}"/><path d="M100 64q42-6 62 6-32 6-62-2z" fill="${C.sea}"/><circle cx="100" cy="31" r="4" fill="${C.sun}"/><path d="M84 40l-6 22M116 40l6 22" stroke="#fff" stroke-width="2"/>`,
  wizard: `<polygon points="68,66 104,2 134,66" fill="${C.purple}"/><ellipse cx="100" cy="66" rx="50" ry="9" fill="${C.purple}"/><polygon points="102,26 105,33 112,33 106,37 108,44 102,40 96,44 98,37 92,33 99,33" fill="${C.sun}" stroke-width="1.5"/><circle cx="116" cy="52" r="3" fill="${C.sun}"/>`,
  knight: `<path d="M58 74q0-48 42-50 42 2 42 50z" fill="${C.grey}"/><path d="M66 74q34-10 68 0" stroke-width="2.5"/><path d="M100 24q-4-18 18-20-6 10 6 16-12 4-24 4z" fill="${C.red}"/>`,
  agent: `<ellipse cx="100" cy="62" rx="56" ry="9" fill="${C.ink}"/><path d="M70 62q0-28 30-28t30 28z" fill="${C.ink}"/><path d="M71 54q29 6 58 0v5q-29 6-58 0z" fill="${C.terra}" stroke="${C.terra}"/>`,
  time: `<path d="M50 66q50-14 100 0" stroke-width="5" stroke="${C.wood}"/><circle cx="82" cy="60" r="13" fill="${C.sky}"/><circle cx="118" cy="60" r="13" fill="${C.sky}"/><path d="M76 56a7 7 0 0 1 6-5M112 56a7 7 0 0 1 6-5" stroke="#fff" stroke-width="2.5"/>`,
  astronaut: '',
};
const ASTRO_GLASS = `<circle cx="100" cy="104" r="80" fill="${C.sky}" fill-opacity=".28"/><path d="M48 70a60 60 0 0 1 30-32" stroke="#fff" stroke-width="5"/><path d="M100 24V8" stroke-width="3"/><circle cx="100" cy="6" r="5" fill="${C.terra}"/>`;

const EYES = {
  happy: `<ellipse cx="80" cy="98" rx="6" ry="8" fill="${C.ink}"/><ellipse cx="120" cy="98" rx="6" ry="8" fill="${C.ink}"/><circle cx="82" cy="95" r="2" fill="#fff" stroke="none"/><circle cx="122" cy="95" r="2" fill="#fff" stroke="none"/>`,
  surprised: `<circle cx="80" cy="97" r="10" fill="#fff"/><circle cx="120" cy="97" r="10" fill="#fff"/><circle cx="80" cy="98" r="5" fill="${C.ink}"/><circle cx="120" cy="98" r="5" fill="${C.ink}"/><path d="M70 80q10-6 20 0M110 80q10-6 20 0"/>`,
  thinking: `<ellipse cx="80" cy="98" rx="6.5" ry="8.5" fill="#fff"/><ellipse cx="120" cy="98" rx="6.5" ry="8.5" fill="#fff"/><circle cx="83" cy="94" r="4" fill="${C.ink}" stroke="none"/><circle cx="123" cy="94" r="4" fill="${C.ink}" stroke="none"/><path d="M110 82q10-8 20-2"/>`,
  cheer: `<path d="M71 101q9-12 18 0M111 101q9-12 18 0" stroke-width="4.5"/>`,
  wink: `<ellipse cx="80" cy="98" rx="6" ry="8" fill="${C.ink}"/><circle cx="82" cy="95" r="2" fill="#fff" stroke="none"/><path d="M111 99q9 6 18 0" stroke-width="4.5"/>`,
};
const MOUTH = {
  happy: `<path d="M100 123v4M90 126q10 9 20 0"/>`,
  surprised: `<path d="M100 123v3"/><ellipse cx="100" cy="133" rx="5" ry="6.5" fill="${C.ink}"/>`,
  thinking: `<path d="M100 123v4M94 130q6-3 14 1"/>`,
  cheer: `<path d="M100 123v2M86 126q14 22 28 0z" fill="#B53A2E"/><path d="M93 133q7 6 14 0" fill="${C.pink}" stroke-width="2"/>`,
  wink: `<path d="M100 123v4M91 127q11 8 20-2"/>`,
};
const EXTRA = {
  cheer: `<polygon points="30,52 33,59 40,59 34.5,63.5 37,71 30,66.5 23,71 25.5,63.5 20,59 27,59" fill="${C.sun}" stroke-width="2"/><polygon points="170,44 172.5,50 178,50 173.5,53.5 175.5,59.5 170,56 164.5,59.5 166.5,53.5 162,50 167.5,50" fill="${C.sun}" stroke-width="2"/>`,
  thinking: `<circle cx="158" cy="72" r="4" fill="${C.cream}"/><circle cx="168" cy="58" r="6" fill="${C.cream}"/><circle cx="178" cy="40" r="9" fill="${C.cream}"/>`,
  surprised: `<path d="M160 60l10-8M164 74l12-2M30 66l-10-6" stroke="${C.terra}" stroke-width="3.5"/>`,
};
const ACCESSORY = { detective: 'magnifier', reporter: 'camera', coach: 'medal', explorer: 'compass', botanist: 'leaf', knight: 'hourglass', time: 'puzzle', pirate: 'map', wizard: 'star', agent: 'key', astronaut: 'star' };

export const MOODS = Object.keys(EYES);
export const HAT_NAMES = Object.keys(HATS);

function mascotSvg({ hat = 'explorer', mood = 'happy', accessory = true, cls = '', size } = {}) {
  const wh = size ? `width="${size}" height="${size}"` : '';
  const acc = accessory && ACCESSORY[hat] ? nested(ACCESSORY[hat], 126, 132, 62) : '';
  const eyes = hat === 'agent' ? `<path d="M66 92h28q0 16-14 16t-14-16zM106 92h28q0 16-14 16t-14-16z" fill="${C.ink}"/><path d="M94 95h12"/>` : EYES[mood] || EYES.happy;
  return `<svg class="mascot ${cls}" viewBox="0 0 200 200" ${wh} xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Pistou le renard explorateur">
  ${g(`
    <path d="M136 176q52-12 42-66-6 30-38 40z" fill="${C.fox}"/><path d="M178 110q8 18-2 32-8-12 2-32z" fill="${C.cream}"/>
    <path d="M60 200v-28q0-28 40-28t40 28v28z" fill="${C.sea}"/>
    <path d="M70 148q30 14 60 0l-2 10q-28 14-56 0z" fill="${C.terra}"/><path d="M112 160l12 22-13-2z" fill="${C.terra}"/>
    <polygon points="52,84 60,28 94,62" fill="${C.fox}"/><polygon points="61,74 64,42 83,62" fill="#FBD3B0" stroke-width="2"/>
    <polygon points="148,84 140,28 106,62" fill="${C.fox}"/><polygon points="139,74 136,42 117,62" fill="#FBD3B0" stroke-width="2"/>
    <ellipse cx="100" cy="102" rx="55" ry="48" fill="${C.fox}"/>
    <path d="M50 104q8 38 50 44 42-6 50-44-22 16-50 9-28 7-50-9z" fill="${C.cream}"/>
    <circle cx="68" cy="122" r="7" fill="${C.pink}" stroke="none" opacity=".75"/><circle cx="132" cy="122" r="7" fill="${C.pink}" stroke="none" opacity=".75"/>
    <g class="m-eyes">${eyes}</g>
    <ellipse cx="100" cy="118" rx="7.5" ry="5.5" fill="${C.ink}"/>
    ${MOUTH[mood] || MOUTH.happy}
    ${HATS[hat] ?? ''}
    ${hat === 'astronaut' ? ASTRO_GLASS : ''}
    ${EXTRA[mood] || ''}
  `, 3.5)}
  ${acc}</svg>`;
}

// Chapeau de chaque guide / rôle
const TYPE_HAT = { treasure: 'pirate', detective: 'detective', nature: 'botanist', photo: 'reporter', challenge: 'coach' };
const THEME_HAT = { pirate: 'pirate', archeo: 'explorer', chevalier: 'knight', agent: 'agent', temps: 'time', magicien: 'wizard', astronaute: 'astronaut' };
export const ROLE_HAT = { detective: 'detective', photographe: 'reporter', cryptographe: 'time', navigateur: 'explorer', gardien: 'knight' };
export const guideHat = adv => (adv.theme && THEME_HAT[adv.theme]) || TYPE_HAT[adv.type] || 'explorer';


// ---------- Carte au trésor illustrée d'Antibes ----------
export const MAP_POS = {
  // Quartiers nord et ouest
  bouillides: [30, 34], semboules: [36, 96], school: [74, 58], combes: [110, 40], cerutti: [104, 84], 'saint-jean': [66, 140], estagnol: [104, 124],
  vaugrenier: [150, 58], brague: [214, 58], fontonne: [196, 92],
  // Port et vieille ville
  'fort-carre': [236, 110], 'bastion-jaume': [272, 138], 'port-vauban': [232, 150], gravette: [256, 168], cathedrale: [270, 190],
  marche: [196, 190], 'vieil-antibes': [234, 200], picasso: [290, 206], 'de-gaulle': [150, 182], 'street-art': [158, 214], martyrs: [182, 228],
  bernardin: [212, 236], peynet: [176, 256], 'place-nationale': [206, 262], remparts: [276, 242], archeo: [252, 268],
  albert1: [232, 292], ponteil: [264, 298], salis: [256, 326],
  // Cap d'Antibes
  calvaire: [282, 334], 'bois-garoupe': [222, 346], garoupe: [288, 370], thuret: [246, 380], ondes: [212, 394], tirepoil: [296, 416],
  posidonia: [214, 420], eilenroc: [254, 448], ilette: [232, 470],
  // Juan-les-Pins
  'juan-plage': [160, 366], jazz: [150, 324], 'palais-congres': [180, 330], pinede: [112, 340], exflora: [60, 360], gallice: [192, 372],
};
const ROUTE = ['bouillides', 'semboules', 'school', 'combes', 'cerutti', 'estagnol', 'saint-jean', 'de-gaulle', 'street-art', 'martyrs', 'peynet', 'place-nationale',
  'bernardin', 'marche', 'vieil-antibes', 'cathedrale', 'picasso', 'remparts', 'archeo', 'albert1', 'ponteil', 'salis', 'calvaire', 'bois-garoupe', 'garoupe', 'thuret',
  'tirepoil', 'eilenroc', 'ilette', 'posidonia', 'ondes', 'gallice', 'juan-plage', 'palais-congres', 'jazz', 'pinede', 'exflora'];
export const MAP_ZONES = {
  tout: { label: 'Toute la ville', box: '0 0 360 540' },
  centre: { label: 'Vieille ville', box: '134 92 176 250' },
  cap: { label: 'Cap d\'Antibes', box: '186 300 140 200' },
  juan: { label: 'Juan-les-Pins', box: '24 290 200 120' },
  nord: { label: 'Quartiers', box: '6 14 254 156' },
};

export function treasureMap(places, explored, zone = 'tout') {
  const coast = 'M0 0H252Q256 30 258 46Q268 80 262 120Q258 140 250 152L266 170Q290 186 292 214Q298 240 290 262Q268 276 266 296Q284 312 300 330Q312 372 302 404Q290 446 272 480Q246 488 230 456Q214 430 216 400Q200 376 176 372Q140 366 112 370Q80 378 56 384Q30 388 0 386Z';
  const route = ROUTE.filter(id => MAP_POS[id]).map((id, i) => `${i ? 'L' : 'M'}${MAP_POS[id][0]} ${MAP_POS[id][1]}`).join('');
  const waves = [[320, 60], [300, 150], [336, 230], [326, 300], [340, 420], [180, 430], [110, 410], [60, 440], [200, 500], [330, 500]]
    .map(([x, y]) => `<path d="M${x - 10} ${y}q5-5 10 0t10 0" stroke="${C.sea}" stroke-width="2.5"/>`).join('');
  const trees = [[140, 150], [40, 200], [92, 236], [30, 300], [118, 282], [62, 186], [170, 24]]
    .map(([x, y]) => nested('tree', x - 14, y - 14, 28)).join('');
  const pins = places.map(p => {
    const pos = MAP_POS[p.id]; if (!pos) return '';
    const done = explored.has(p.id);
    return `<g class="map-node" data-act="map-pin" data-id="${p.id}" tabindex="0" role="button" aria-label="${p.name}${done ? ', exploré' : ', à découvrir'}">
      <circle class="pin-bg" cx="${pos[0]}" cy="${pos[1]}" r="12.5" fill="${done ? C.sun : C.cream}" stroke="${C.ink}" stroke-width="3" ${done ? '' : 'stroke-dasharray="5 4"'}/>
      ${nested(PLACE_ICON[p.id] || 'star', pos[0] - 8.5, pos[1] - 8.5, 17)}
      ${done ? `<circle cx="${pos[0] + 10}" cy="${pos[1] - 10}" r="5" fill="${C.leaf}" stroke="${C.ink}" stroke-width="2"/><path d="M${pos[0] + 7.6} ${pos[1] - 10}l1.7 1.7 2.8-3.5" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round"/>` : ''}
    </g>`;
  }).join('');
  return `<svg class="tmap zone-${zone}" viewBox="${(MAP_ZONES[zone] || MAP_ZONES.tout).box}" xmlns="http://www.w3.org/2000/svg" role="group" aria-label="Carte au trésor d'Antibes et Juan-les-Pins">
    <rect width="360" height="540" fill="${C.sky}"/>
    <g class="tmap-waves">${g(waves)}</g>
    <path d="${coast}" fill="${C.parch}" stroke="${C.ink}" stroke-width="3.5" stroke-linejoin="round"/>
    <path d="M110 6q30 18 60 20t84 22" stroke="${C.sea}" stroke-width="5" fill="none" stroke-linecap="round"/>
    ${trees}
    <path d="${route}" stroke="${C.terra}" stroke-width="3.5" stroke-dasharray="2 9" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    ${nested('boat', 300, 78, 46)}${nested('boat', 20, 410, 40)}
    ${nested('compass', 290, 456, 62)}
    <g transform="translate(26 462)">${g(`<path d="M0 6h150l-8 14 8 14H0l8-14z" fill="${C.cream}"/>`, 2.5)}<text x="75" y="25" text-anchor="middle" font-family="'Baloo 2', Nunito, sans-serif" font-weight="800" font-size="15" fill="${C.ink}">Antibes · Juan-les-Pins</text></g>
    <text x="150" y="518" text-anchor="middle" font-family="'Baloo 2', Nunito, sans-serif" font-size="15" font-weight="800" fill="${C.sea}" letter-spacing="2">Mer Méditerranée</text>
    ${pins}
  </svg>`;
}

// ---------- Coffre au trésor animé ----------
export function chest() {
  return `<svg class="chest-anim" viewBox="0 0 200 170" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  ${g(`
    <g class="chest-glow"><circle cx="100" cy="86" r="60" fill="${C.sun}" fill-opacity=".35" stroke="none"/></g>
    <g class="chest-coins">
      ${[[70, 70], [100, 56], [130, 70], [86, 46], [116, 44]].map(([x, y], i) => `<g class="coin c${i}"><circle cx="${x}" cy="${y}" r="9" fill="${C.sun}"/><circle cx="${x}" cy="${y}" r="5" stroke-width="2"/></g>`).join('')}
      <polygon class="coin c5" points="100,30 104,40 114,40 106,46 109,56 100,50 91,56 94,46 86,40 96,40" fill="${C.gem}" stroke-width="2.5"/>
    </g>
    <rect x="40" y="90" width="120" height="66" rx="8" fill="${C.wood}"/>
    <rect x="40" y="96" width="120" height="12" fill="${C.sun}"/>
    <path d="M62 96v60M138 96v60" stroke-width="3"/>
    <rect x="90" y="96" width="20" height="26" rx="4" fill="${C.sun}"/>
    <g class="chest-lid"><path d="M40 92V74q0-26 60-26t60 26v18z" fill="${C.wood2}"/><rect x="40" y="84" width="120" height="10" fill="${C.sun}"/><path d="M62 54v38M138 54v38" stroke-width="3"/></g>
  `, 4)}</svg>`;
}

// =====================================================================
// Personnages illustrés : Pistou et le Capitaine Barbe-Sel (images fournies)
// =====================================================================
const PISTOU_FILE = { happy: 'heureux', surprised: 'surpris', thinking: 'interrogatif', worried: 'inquiet', proud: 'fier', wink: 'amuse', laugh: 'amuse',
  walk: 'marche', loupe: 'observation-loupe', hint: 'observation-loupe', photo: 'photographie', cheer: 'celebration', story: 'heureux' };
const CAPTAIN_FILE = { happy: 'souriant', surprised: 'surpris', thinking: 'donneur-indice', hint: 'donneur-indice', loupe: 'donneur-indice', wink: 'complice',
  proud: 'complice', laugh: 'souriant', story: 'conteur', walk: 'aventurier', cheer: 'aventurier', worried: 'surpris', photo: 'souriant' };
export const PISTOU_POSES = Object.keys(PISTOU_FILE);
export const CHARACTER_GALLERY = [
  ...['heureux', 'surpris', 'interrogatif', 'inquiet', 'fier', 'amuse', 'marche', 'observation-loupe', 'photographie', 'celebration'].map(f => ({ src: `img/pistou/pistou-${f}.png`, label: f.replace('-', ' ') })),
  ...['souriant', 'surpris', 'complice', 'conteur', 'donneur-indice', 'aventurier'].map(f => ({ src: `img/pistou/capitaine-${f}.png`, label: 'capitaine ' + f.replace('-', ' ') })),
];
export const characterSrc = (who, mood = 'happy') => who === 'captain'
  ? `img/pistou/capitaine-${CAPTAIN_FILE[mood] || 'souriant'}.png`
  : `img/pistou/pistou-${PISTOU_FILE[mood] || 'heureux'}.png`;
export function character(who, mood = 'happy', cls = '') {
  const name = who === 'captain' ? 'Capitaine Barbe-Sel' : 'Pistou';
  return `<img class="char ${cls}" src="${characterSrc(who, mood)}" alt="${name}" draggable="false">`;
}
// Pose de Pistou selon le rôle (anciens « chapeaux »)
const HAT_POSE = { detective: 'loupe', reporter: 'photo', time: 'thinking', knight: 'proud', explorer: 'happy', botanist: 'loupe', coach: 'cheer' };
export function mascot({ hat = 'explorer', mood = 'happy', cls = '' } = {}) {
  if (hat === 'pirate') return character('captain', mood, cls);
  const pose = mood === 'happy' && HAT_POSE[hat] ? HAT_POSE[hat] : mood;
  return character('pistou', pose, cls);
}
export const guideWho = adv => (adv.type === 'treasure' || adv.theme === 'pirate') ? 'captain' : 'pistou';
export const guideArt = (adv, mood = 'happy', opts = {}) => character(guideWho(adv), mood, opts.cls || '');

// =====================================================================
// Badges : planche illustrée fournie + gabarit « même style » pour les autres
// =====================================================================
const BADGE_IMG = {
  'q-fort-carre': 'fort-carre', 'q-bastion-jaume': 'nomade', 'q-vieil-antibes': 'vieil-antibes', 'q-picasso': 'picasso', 'q-port-vauban': 'port-vauban',
  'q-garoupe': 'cap-antibes', 'q-juan-plage': 'juan-les-pins', 'q-exflora': 'exflora', 'q-tirepoil': 'sentier-littoral', 'q-salis': 'plages',
  'q-thuret': 'thuret', 'q-archeo': 'antibes-antique', 'q-street-art': 'street-art', 'q-marche': 'marche', 'q-bernardin': 'bernardin',
  'q-pinede': 'pinede', 'q-remparts': 'remparts', 'q-bouillides': 'aqueduc-bouillide',
  'e-1': 'pistou', 'n-1': 'parcours-nature', 'n-mer': 'nature-littoral', 'e-lieux': 'grand-explorateur', 'h-detective': 'antibes-insolite', 'h-antipolis': 'antibes-antique',
};
export const badgeImage = id => BADGE_IMG[id] ? `img/badges/${BADGE_IMG[id]}.png` : null;
const COLL_SKY = { quartiers: ['#5FB6F0', '#CDEBFB'], nature: ['#5FC07A', '#D8F2D2'], histoire: ['#E8B26A', '#FBE8C8'], saisons: ['#F08A5D', '#FDE1C8'],
  explorateurs: ['#F5C23C', '#FFF1C2'], exceptionnels: ['#A77BD8', '#EADCF8'] };
const escX = t => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

function styledBadge(badgeId, collection, cls = '', size) {
  const b = ALL_BADGES.find(x => x.id === badgeId);
  const placeId = badgeId.startsWith('q-') ? badgeId.slice(2) : null;
  const place = placeId ? PLACES.find(p => p.id === placeId) : null;
  const photo = placeId ? placePhoto(placeId) : null;
  const title = place ? place.name.replace(/ – .*$/, '').replace(/ & .*$/, '').replace(/^Le street art.*/, 'Street art') : (b?.name || 'Badge');
  const [c1, c2] = COLL_SKY[collection] || COLL_SKY.quartiers;
  const uid = 'bd-' + badgeId.replace(/[^a-z0-9-]/gi, '');
  const ico = badgeIcon(badgeId);
  // Titre sur une ou deux lignes
  let lines = [title];
  if (title.length > 13) { const words = title.split(' '); let best = 1, diff = 99; for (let i = 1; i < words.length; i++) { const d = Math.abs(words.slice(0, i).join(' ').length - words.slice(i).join(' ').length); if (d < diff) { diff = d; best = i; } } lines = [words.slice(0, best).join(' '), words.slice(best).join(' ')]; }
  const longest = Math.max(...lines.map(l => l.length));
  const fs = lines.length === 1 ? (longest <= 9 ? 24 : 20) : (longest <= 11 ? 18 : longest <= 14 ? 15.5 : 13);
  const wh = size ? `width="${size}" height="${Math.round(size * 1.1)}"` : '';
  const clip = 'M30 74 Q30 26 100 24 Q170 26 170 74 V140 Q170 166 100 186 Q30 166 30 140 Z';
  const scene = photo
    ? `<image href="${photo.src}" x="30" y="22" width="140" height="150" preserveAspectRatio="xMidYMid slice" clip-path="url(#${uid}-c)"/>`
    : `<g clip-path="url(#${uid}-c)"><rect x="30" y="22" width="140" height="150" fill="url(#${uid}-s)"/><circle cx="142" cy="52" r="15" fill="#FFE27A"/>
        <path d="M30 118 Q70 96 108 112 T170 104 V172 H30 Z" fill="${c1}" opacity=".6"/>${nested(ico, 64, 48, 72)}</g>`;
  const leaves = side => [0, 1, 2, 3].map(i => { const y = 196 - i * 15, x = side < 0 ? 46 - i * 6 : 154 + i * 6, r = side < 0 ? 40 + i * 12 : -40 - i * 12;
    return `<ellipse cx="${x}" cy="${y}" rx="10" ry="4.6" transform="rotate(${r} ${x} ${y})"/>`; }).join('');
  const ty = lines.length === 1 ? 155 : 145;
  return `<svg class="medal styled ${cls}" viewBox="0 0 200 220" ${wh} xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${escX(b?.name || title)}">
  <defs>
    <linearGradient id="${uid}-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFF0A8"/><stop offset=".45" stop-color="#EDBE4C"/><stop offset="1" stop-color="#B57E22"/></linearGradient>
    <linearGradient id="${uid}-s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient>
    <linearGradient id="${uid}-r" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF8E1"/><stop offset="1" stop-color="#F4DC9E"/></linearGradient>
    <clipPath id="${uid}-c"><path d="${clip}"/></clipPath>
  </defs>
  <path d="M16 72 Q16 10 100 8 Q184 10 184 72 V140 Q184 178 100 208 Q16 178 16 140 Z" fill="url(#${uid}-g)" stroke="#6E4510" stroke-width="5" stroke-linejoin="round"/>
  ${scene}
  <path d="${clip}" fill="none" stroke="#FFF6CF" stroke-width="3.5"/>
  <g fill="#7DB84F" stroke="#2E5A1B" stroke-width="1.6">${leaves(-1)}${leaves(1)}</g>
  <path d="M2 124 Q100 112 198 124 L187 150 L198 176 Q100 164 2 176 L13 150 Z" fill="url(#${uid}-r)" stroke="#9C6A1C" stroke-width="3.5" stroke-linejoin="round"/>
  ${lines.map((l, i) => `<text x="100" y="${ty + i * (fs + 1)}" text-anchor="middle" font-family="'Baloo 2', Nunito, sans-serif" font-weight="800" font-size="${fs}" fill="#12305A">${escX(l)}</text>`).join('')}
  <circle cx="100" cy="197" r="18" fill="#12305A" stroke="#EDBE4C" stroke-width="3.5"/>
  ${nested(ico, 88, 185, 24)}
</svg>`;
}

export function medal(badgeId, collection, cls = '', size) {
  const img = badgeImage(badgeId);
  if (img) return `<img class="medal badge-img ${cls}" src="${img}" alt="" draggable="false" ${size ? `width="${size}"` : ''}>`;
  return styledBadge(badgeId, collection, cls, size);
}
