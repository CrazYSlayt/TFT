/*
  TFTClimb – Vorschaubilder (og:image) der Tools erzeugen → assets/og/<adresse>.png (1200 × 630, für Google, Discord, WhatsApp, X)
  ------------------------------------------------------------------------------------------------------------------------
  Pro Tool und Sprache eine Vorlage im Stil der Seite (Schrift, Farben, Maskottchen) – bewusst ohne Zahlen, Set oder Patch,
  damit das Bild auch nach Patches stimmt (es ist nur eine Vorschau).
  Edge rendert die Vorlage unsichtbar und speichert ein PNG (Vorschau) und ein leichtes WebP (Bild im Artikel unter dem Tool).
  Aufruf:  node tools/og-bilder.js        – nach einem neuen Set oder neuen Maskottchen neu erzeugen
*/
const http = require('http'), fs = require('fs'), path = require('path'), {spawn} = require('child_process');
const ROOT = path.resolve(__dirname, '..'), OUT = path.join(ROOT, 'assets', 'og');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const TYPES = {'.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.html': 'text/html; charset=utf-8'};

// ---------- Augment-Chancen ----------
// Nur eine Vorschau: keine Zahlen, kein Set, kein Patch – die ändern sich, das Bild soll trotzdem dauerhaft stimmen (Wunsch des Users)
function augmentPages(){
  const T = {
    de: {file: 'tft-augment-chancen', kick: 'Kostenloses TFT Tool', a: 'TFT Augment-', b: 'Chancen', sub: 'Silber, Gold oder Prismatisch?',
      line: 'Live-Rechner für 2-1, 3-2 und 4-2', names: ['Silber', 'Gold', 'Prismatisch']},
    en: {file: 'tft-augment-odds', kick: 'Free TFT tool', a: 'TFT Augment ', b: 'Odds', sub: 'Silver, Gold or Prismatic?',
      line: 'Live calculator for 2-1, 3-2 and 4-2', names: ['Silver', 'Gold', 'Prismatic']}};
  return Object.values(T).map(t => ({file: t.file, html: page(`
    <div class="l">
      <img class="logo" src="/assets/brand/logo-tftclimb.webp" alt="">
      <div class="kick">${t.kick}</div>
      <h1>${t.a}<em>${t.b}</em></h1>
      <div class="sub">${t.sub}</div>
      <div class="line">${t.line}</div>
      <div class="tiers">${['silver', 'gold', 'prism'].map((f, i) => `<div class="tier t${i}"><img src="/assets/icons/tft/augment-frame-${f}.webp" alt=""><b>${t.names[i]}</b></div>`).join('')}</div>
    </div>
    <img class="mascot" src="/assets/tools/augments.webp" alt="">`)}));
}

// ---------- Rolldown-Rechner ----------
// Fünf Kosten-Chips in den Kostenfarben des Spiels (fest, ändern sich nicht), keine Prozente
function rolldownPages(){
  const T = {
    de: {file: 'tft-rolldown-rechner', kick: 'Kostenloses TFT Tool', a: 'TFT Rolldown-', b: 'Rechner', sub: 'Rollen oder leveln?', line: 'Shop Odds · Pool · Gold-Bedarf'},
    en: {file: 'tft-rolldown-calculator', kick: 'Free TFT tool', a: 'TFT Rolldown ', b: 'Calculator', sub: 'Roll or level?', line: 'Shop odds · Pool · Gold needed'}};
  const col = ['#9aa4b2', '#2bb673', '#2f8cf0', '#b066f3', '#f2a516'];
  return Object.values(T).map(t => ({file: t.file, html: page(`
    <div class="l">
      <img class="logo" src="/assets/brand/logo-tftclimb.webp" alt="">
      <div class="kick">${t.kick}</div>
      <h1>${t.a}<em>${t.b}</em></h1>
      <div class="sub">${t.sub}</div>
      <div class="line">${t.line}</div>
      <div class="costs">${col.map((c, i) => `<span style="--c:${c}">${i + 1}<small>Gold</small></span>`).join('')}</div>
    </div>
    <img class="mascot rd" src="/assets/tools/rolldown.webp" alt="">`)}));
}

// ---------- Weitere Tools: Titel, Frage, Stichworte als Chips, Maskottchen ----------
// Ebenfalls ohne veränderliche Daten. Gleiche Adresse in beiden Sprachen → englische Datei mit „-en“
function toolPages(){
  const T = [
    {img: 'teambuilder', de: {file: 'tft-team-builder', a: 'TFT Team ', b: 'Builder', sub: 'Plan dein Board', chips: ['Units', 'Items', 'Traits', 'Teilen']},
      en: {file: 'tft-team-builder-en', a: 'TFT Team ', b: 'Builder', sub: 'Plan your board', chips: ['Units', 'Items', 'Traits', 'Share']}},
    {img: 'dps', de: {file: 'tft-dps-rechner', a: 'TFT DPS-', b: 'Rechner', sub: 'Welcher Item-Build gewinnt?', chips: ['Bis zu 4 Builds', 'Shred & Sunder', 'Graph']},
      en: {file: 'tft-dps-calculator', a: 'TFT DPS ', b: 'Calculator', sub: 'Which item build wins?', chips: ['Up to 4 builds', 'Shred & sunder', 'Graph']}},
    {img: 'drops', de: {file: 'tft-item-drop-chance', a: 'TFT Item-', b: 'Drop-Chance', sub: 'Welche Komponente kommt?', chips: ['Item-Pool', 'Orbs', 'Stage 1–4']},
      en: {file: 'tft-item-drop-odds', a: 'TFT Item ', b: 'Drop Odds', sub: 'Which component is next?', chips: ['Item pool', 'Orbs', 'Stage 1–4']}},
    {img: 'tierlist', de: {file: 'tft-tierlist-maker', a: 'TFT Tierlist ', b: 'erstellen', sub: 'Deine eigene Tierlist', chips: ['Champions', 'Items', 'Augments', 'Link teilen']},
      en: {file: 'tft-tier-list-maker', a: 'TFT Tier List ', b: 'Maker', sub: 'Your own tier list', chips: ['Champions', 'Items', 'Augments', 'Share link']}},
    {img: 'simulator', de: {file: 'tft-kampf-simulator', a: 'TFT Kampf-', b: 'Simulator', sub: 'Welches Board gewinnt?', chips: ['Schritt für Schritt', 'Siegchance', 'Items & Sterne']},
      en: {file: 'tft-battle-simulator', a: 'TFT Battle ', b: 'Simulator', sub: 'Which board wins?', chips: ['Step by step', 'Win chance', 'Items & stars']}}];
  return T.flatMap(t => ['de', 'en'].map(l => { const x = t[l]; return {file: x.file, html: page(`
    <div class="l">
      <img class="logo" src="/assets/brand/logo-tftclimb.webp" alt="">
      <div class="kick">${l === 'de' ? 'Kostenloses TFT Tool' : 'Free TFT tool'}</div>
      <h1>${x.a}<em>${x.b}</em></h1>
      <div class="sub">${x.sub}</div>
      <div class="chips">${x.chips.map(c => `<span>${c}</span>`).join('')}</div>
    </div>
    <img class="mascot" src="/assets/tools/${t.img}.webp" alt="">`)}; }));
}

// ---------- Cheatsheets: je Seite und Sprache ein Bild – nur der Inhalt der Tabelle an der wichtigsten Stelle, ohne Titel, Logo, Set oder Patch ----------
// (Wunsch des Users: kein eigener Text auf dem Bild). Der Ausschnitt kommt von der echten Seite (CS_SHOT), das Bild ändert sich also nur, wenn sich die Tabelle ändert.
// Nur von den englischen Cheatsheets – das Bild gilt auch für die deutsche Seite (Wunsch des Users). Als JPG: assets/og/cs/<englische adresse>.jpg (app.js: csOgImg)
function cheatPages(){
  let pages = {}; try { pages = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'seo-meta.json'), 'utf8')).pages || {}; } catch (e) {}
  return Object.keys(pages).filter(p => /^\/en\/cheatsheet(\/|$)/.test(p)).map(p => ({file: `cs/${p.split('/').pop()}`, jpg: true, site: p,
    make: shot => page(`<div class="cs-shot"><img src="${shot}" alt=""></div>`)}));
}
// Auf der echten Cheatsheet-Seite: Inhalt des Tabellen-Rahmens (ohne Überschrift, Rahmen, Logo, Riot-Beschreibung, Hinweise und Reiter) als transparentes PNG –
// wie beim „Ausschneiden“: Kopie unsichtbar in fester Breite aufbauen und mit html-to-image rendern. Höhe passend zum Bildformat, längere Tabellen laufen unten weich aus.
// shop: nur Level 7–10 (die Zeilen, auf denen gerollt wird)
const CS_SHOT = `(async () => {
  const sec = document.querySelector('#csPage .cs-sec:not([hidden])'), id = sec ? sec.id.slice(3) : '';
  const src = sec ? sec.querySelector('.csf') : document.querySelector('#csOv .cs-panes'); if (!src) return null;
  const W = sec ? 760 : 1100, H = Math.round(W * 550 / 1120), h2i = await csCutLoad(), wrap = document.createElement('div'), c = src.cloneNode(true);
  wrap.style.cssText = 'position:absolute;left:-99999px;top:0;width:' + W + 'px;pointer-events:none'; wrap.appendChild(c); src.parentNode.appendChild(wrap);
  try {
    c.querySelectorAll('img').forEach(i => { i.loading = 'eager'; });
    c.querySelectorAll('.cax-info,.cs-note,.cs-src,.csp-tabs').forEach(x => { x.style.display = 'none'; });
    if (id === 'shop') c.querySelectorAll('.cso tbody tr').forEach(tr => { const l = +((tr.querySelector('.cso-lv') || {}).textContent || '').replace(/\\D/g, ''); if (l && l < 7) tr.style.display = 'none'; });
    const t = sec ? c.querySelector('.csf-body') : c;
    Object.assign(t.style, {margin: '0', width: W + 'px'});
    if (t.offsetHeight > H) Object.assign(t.style, {height: H + 'px', overflow: 'hidden', webkitMaskImage: 'linear-gradient(to bottom,#000 78%,transparent)', maskImage: 'linear-gradient(to bottom,#000 78%,transparent)'});
    await Promise.race([Promise.all([...c.querySelectorAll('img')].map(i => i.complete ? 0 : new Promise(ok => { i.onload = i.onerror = ok; }))), new Promise(ok => setTimeout(ok, 4000))]);
    const blob = await h2i.toBlob(t, {width: W, height: t.offsetHeight, pixelRatio: 2});
    return await new Promise(ok => { const fr = new FileReader(); fr.onload = () => ok(fr.result); fr.readAsDataURL(blob); });
  } finally { wrap.remove(); }
})()`;

// ---------- Nächstes Set (/tft-set-<N>): „TFT SET 19“ und die Termine aus dem Patch-Plan (PBE, Live) – ohne Sätze, gilt für beide Sprachen ----------
function nextSetPage(){
  try {
    const rd = f => { const w = {}; new Function('window', fs.readFileSync(path.join(ROOT, f), 'utf8'))(w); return w; };
    const sets = rd('data/sets.js').TFT_SETS || [], live = sets.find(s => s.status === 'live') || sets[0]; if (!live) return [];
    const n = live.set + 1, rows = ((rd(`data/custom-${live.set}.js`).TFT_CUSTOM || {}).cheats || {}).patchSchedule;
    const P = rows ? rows.rows : [], pbe = P.find(r => new RegExp(`Set ${n} PBE`).test(r[2].join(' '))), go = P.find(r => r[0] === n + '.1');
    const d = r => r ? r[1].split('-').reverse().join('.') : '';
    return [{file: `tft-set-${n}`, jpg: true, html: page(`
    <img class="logo ns-logo" src="/assets/brand/logo-tftclimb.webp" alt="">
    <div class="ns-og"><h1>TFT <em>Set ${n}</em></h1>
      <div class="ns-og-d">${pbe ? `<span><small>PBE</small><b>${d(pbe)}</b></span>` : ''}${go ? `<span class="go"><small>Live</small><b>${d(go)}</b></span>` : ''}</div></div>`)}];
  } catch (e) { return []; }
}

// Grundgerüst: Farben, Schrift und Hintergrund wie auf tftclimb.com
const page = body => `<!doctype html><html><head><meta charset="utf-8"><style>
  @font-face{font-family:'Barlow Condensed';font-weight:900;font-style:italic;src:url(/assets/fonts/BarlowCondensed-900i-latin.woff2) format('woff2')}
  @font-face{font-family:'Barlow Condensed';font-weight:700;font-style:italic;src:url(/assets/fonts/BarlowCondensed-700i-latin.woff2) format('woff2')}
  @font-face{font-family:Barlow;font-weight:600;src:url(/assets/fonts/Barlow-600-latin.woff2) format('woff2')}
  @font-face{font-family:Barlow;font-weight:700;src:url(/assets/fonts/Barlow-700-latin.woff2) format('woff2')}
  *{box-sizing:border-box;margin:0}
  html,body{width:1200px;height:630px;overflow:hidden}
  body{position:relative;font-family:Barlow,sans-serif;color:#fff;background:radial-gradient(700px 520px at 88% 70%,rgba(167,139,250,.32),transparent 65%),radial-gradient(620px 420px at 8% 0%,rgba(46,230,214,.22),transparent 60%),linear-gradient(160deg,#0d2a34,#061520 70%)}
  body::before{content:"";position:absolute;inset:0;opacity:.09;background:repeating-linear-gradient(60deg,#2ee6d6 0 1px,transparent 1px 34px),repeating-linear-gradient(-60deg,#2ee6d6 0 1px,transparent 1px 34px)}
  body::after{content:"";position:absolute;inset:14px;border:2px solid rgba(46,230,214,.35);border-radius:26px}
  .l{position:absolute;left:66px;top:58px;width:660px;z-index:2}
  .logo{height:46px}
  .kick{margin-top:26px;font:700 22px Barlow;letter-spacing:.32em;text-transform:uppercase;color:#7ff7ec}
  h1{margin-top:6px;font:900 italic 104px/0.92 'Barlow Condensed';text-transform:uppercase;letter-spacing:-.01em}
  /* Verlauf per background-clip:text reicht nur bis zum Rand des Textfelds – kursive Buchstaben ragen rechts darüber hinaus und würden abgeschnitten.
     Innenabstand rechts (mit gleich großem negativem Rand, damit sich nichts verschiebt) gibt dem Verlauf Platz – gilt für alle Vorlagen */
  h1 em{font-style:inherit;background:linear-gradient(90deg,#2ee6d6,#93c5fd,#f0abfc);-webkit-background-clip:text;background-clip:text;color:transparent;padding:0 .14em 0 .04em;margin:0 -.14em 0 -.04em;-webkit-box-decoration-break:clone;box-decoration-break:clone}
  .sub{margin-top:10px;font:700 italic 38px 'Barlow Condensed';color:#cfe3ee}
  .line{display:inline-block;margin-top:24px;padding:10px 18px;border-radius:99px;border:2px solid rgba(46,230,214,.5);background:rgba(46,230,214,.1);font:700 22px Barlow;color:#7ff7ec}
  .tiers{display:flex;gap:20px;margin-top:30px}
  .tier{display:flex;align-items:center;gap:12px}
  .tier img{width:52px;height:77px;filter:drop-shadow(0 0 12px rgba(255,255,255,.25))}
  .tier b{font:900 italic 30px/1 'Barlow Condensed';text-transform:uppercase}
  .tier.t0 b{color:#d7dee8}.tier.t1 b{color:#f5b82e}.tier.t2 b{color:#c4b5fd}
  .costs{display:flex;gap:12px;margin-top:30px}
  .costs span{display:flex;flex-direction:column;align-items:center;justify-content:center;width:72px;height:72px;border-radius:16px;border:3px solid var(--c);background:color-mix(in srgb,var(--c) 22%,#061520);font:900 italic 34px/1 'Barlow Condensed';color:#fff;box-shadow:0 0 18px color-mix(in srgb,var(--c) 45%,transparent)}
  .costs small{font:700 13px Barlow;color:#cfe3ee}
  .chips{display:flex;flex-wrap:wrap;gap:12px;margin-top:30px;max-width:640px}
  .chips span{padding:10px 18px;border-radius:99px;border:2px solid rgba(46,230,214,.5);background:rgba(46,230,214,.1);font:700 22px Barlow;color:#7ff7ec}
  .mascot.rd{height:520px;bottom:40px;right:20px}
  .ns-logo{position:absolute;left:50%;top:62px;transform:translateX(-50%);height:54px;z-index:2}
  .ns-og{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:34px;z-index:2;padding-top:40px}
  .ns-og h1{margin:0;font-size:190px;line-height:.9}
  .ns-og-d{display:flex;gap:26px}
  .ns-og-d span{display:flex;flex-direction:column;align-items:center;gap:4px;padding:14px 34px;border-radius:20px;border:2px solid rgba(46,230,214,.5);background:rgba(46,230,214,.1)}
  .ns-og-d span.go{border-color:rgba(240,171,252,.55);background:rgba(240,171,252,.1)}
  .ns-og-d small{font:700 22px Barlow;letter-spacing:.3em;text-transform:uppercase;color:#7ff7ec}
  .ns-og-d .go small{color:#f5c2fd}
  .ns-og-d b{font:900 italic 54px/1 'Barlow Condensed';color:#fff}
  /* Cheatsheets: nur die Tabelle, mittig auf der Fläche innerhalb der Umrandung (die liegt 14 px vom Rand) */
  .cs-shot{position:absolute;inset:40px;display:flex;align-items:center;justify-content:center;z-index:1}
  .cs-shot img{max-width:100%;max-height:100%;object-fit:contain;filter:drop-shadow(0 14px 30px rgba(0,0,0,.5))}
  .mascot{position:absolute;right:30px;bottom:24px;height:560px;z-index:1;filter:drop-shadow(0 18px 40px rgba(0,0,0,.6)) drop-shadow(0 0 40px rgba(167,139,250,.35))}
</style></head><body>${body}</body></html>`;

// ---------- PNG mit 256 Farben (statt ~850 KB Vollfarbe etwa 200–300 KB) ----------
// Median-Cut wählt die 256 Farben, Floyd-Steinberg-Dithering verhindert Streifen in den Verläufen; Ausgabe als Paletten-PNG (Farbtyp 3)
const zlib = require('zlib');
function quantize(rgba, W, H){
  // 1) Histogramm in 5 Bit pro Kanal
  const hist = new Uint32Array(32768);
  for (let i = 0; i < rgba.length; i += 4) hist[((rgba[i] >> 3) << 10) | ((rgba[i + 1] >> 3) << 5) | (rgba[i + 2] >> 3)]++;
  const bins = []; for (let k = 0; k < 32768; k++) if (hist[k]) bins.push(k);
  const ch = (k, c) => c === 0 ? k >> 10 : c === 1 ? (k >> 5) & 31 : k & 31;
  // 2) Median-Cut: immer die Box mit der größten (gewichteten) Spannweite teilen
  let boxes = [bins];
  while (boxes.length < 256) {
    let best = -1, bc = 0, bs = -1;
    boxes.forEach((b, i) => { if (b.length < 2) return; for (let c = 0; c < 3; c++) { let lo = 31, hi = 0, n = 0; for (const k of b) { const v = ch(k, c); if (v < lo) lo = v; if (v > hi) hi = v; n += hist[k]; } const s = (hi - lo) * Math.sqrt(n); if (s > bs) { bs = s; best = i; bc = c; } } });
    if (best < 0) break;
    const b = boxes[best].sort((x, y) => ch(x, bc) - ch(y, bc)), tot = b.reduce((s, k) => s + hist[k], 0); let acc = 0, cut = 1;
    for (let i = 0; i < b.length - 1; i++) { acc += hist[b[i]]; if (acc >= tot / 2) { cut = i + 1; break; } }
    boxes.splice(best, 1, b.slice(0, cut), b.slice(cut));
  }
  const pal = boxes.map(b => { let r = 0, g = 0, bl = 0, n = 0; for (const k of b) { const w = hist[k]; r += (ch(k, 0) * 8 + 4) * w; g += (ch(k, 1) * 8 + 4) * w; bl += (ch(k, 2) * 8 + 4) * w; n += w; } return [Math.round(r / n), Math.round(g / n), Math.round(bl / n)]; });
  // 3) nächste Palettenfarbe je 5-Bit-Farbe (zwischengespeichert), Floyd-Steinberg-Dithering
  const near = new Int16Array(32768).fill(-1);
  const pick = (r, g, b) => { const k = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3); if (near[k] >= 0) return near[k];
    let bi = 0, bd = Infinity; pal.forEach((p, i) => { const d = (p[0] - r) ** 2 * 3 + (p[1] - g) ** 2 * 4 + (p[2] - b) ** 2 * 2; if (d < bd) { bd = d; bi = i; } }); return near[k] = bi; };
  const buf = Float32Array.from(rgba), idx = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const o = (y * W + x) * 4, r = Math.max(0, Math.min(255, buf[o])), g = Math.max(0, Math.min(255, buf[o + 1])), b = Math.max(0, Math.min(255, buf[o + 2]));
    const i = pick(r, g, b), p = pal[i]; idx[y * W + x] = i;
    const e = [r - p[0], g - p[1], b - p[2]];
    const add = (dx, dy, f) => { const xx = x + dx, yy = y + dy; if (xx < 0 || xx >= W || yy >= H) return; const q = (yy * W + xx) * 4; buf[q] += e[0] * f; buf[q + 1] += e[1] * f; buf[q + 2] += e[2] * f; };
    add(1, 0, 7 / 16); add(-1, 1, 3 / 16); add(0, 1, 5 / 16); add(1, 1, 1 / 16);
  }
  // 4) Paletten-PNG schreiben
  const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type, 'ascii'), data]); const crc = Buffer.alloc(4); crc.writeUInt32BE(zlib.crc32(td) >>> 0); return Buffer.concat([len, td, crc]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4); ihdr[8] = 8; ihdr[9] = 3;
  const raw = Buffer.alloc((W + 1) * H); for (let y = 0; y < H; y++) { raw[y * (W + 1)] = 0; idx.subarray(y * W, (y + 1) * W).forEach((v, x) => { raw[y * (W + 1) + 1 + x] = v; }); }
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('PLTE', Buffer.from(pal.flat())), chunk('IDAT', zlib.deflateSync(raw, {level: 9})), chunk('IEND', Buffer.alloc(0))]);
}

// kleiner Webserver: Projektdateien + die aktuelle Vorlage unter /__og; Seitenadressen ohne Dateiendung → app.html (für die Cheatsheet-Ausschnitte)
let current = '';
function serve(){ return new Promise(res => { const srv = http.createServer((q, r) => {
  const u = decodeURIComponent(new URL(q.url, 'http://x').pathname);
  if (u === '/__og') { r.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'}); return r.end(current); }
  let f = path.join(ROOT, u); if (!path.extname(u)) f = path.join(ROOT, 'app.html');
  if (!f.startsWith(ROOT) || !fs.existsSync(f)) { r.writeHead(404); return r.end(); }
  r.writeHead(200, {'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream'}); fs.createReadStream(f).pipe(r);
}); srv.listen(0, '127.0.0.1', () => res(srv)); }); }
function findBrowser(){ return [path.join(process.env['ProgramFiles(x86)'] || '', 'Microsoft/Edge/Application/msedge.exe'), path.join(process.env.ProgramFiles || '', 'Microsoft/Edge/Application/msedge.exe'),
  path.join(process.env.ProgramFiles || '', 'Google/Chrome/Application/chrome.exe')].find(f => f && fs.existsSync(f)); }

(async () => {
  fs.mkdirSync(OUT, {recursive: true});
  fs.mkdirSync(path.join(OUT, 'cs'), {recursive: true});
  const jobs = [...augmentPages(), ...rolldownPages(), ...toolPages(), ...nextSetPage(), ...cheatPages()].filter(j => !process.argv[2] || j.file.includes(process.argv[2]));   // optional: nur Dateien mit diesem Namensteil
  const srv = await serve(), origin = 'http://127.0.0.1:' + srv.address().port;
  const port = 9300 + Math.floor(Math.random() * 500), prof = path.join(require('os').tmpdir(), 'tftclimb-og-' + port);
  const br = spawn(findBrowser(), ['--headless=new', '--hide-scrollbars', `--remote-debugging-port=${port}`, `--user-data-dir=${prof}`, '--window-size=1200,630', 'about:blank'], {stdio: 'ignore'});
  try {
    let tabs; for (let i = 0; i < 60; i++) { try { tabs = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); if (tabs.length) break; } catch (e) {} await sleep(250); }
    const ws = new WebSocket(tabs.find(t => t.type === 'page').webSocketDebuggerUrl); await new Promise(r => ws.onopen = r);
    let id = 0; const pend = {}; ws.onmessage = m => { const d = JSON.parse(m.data); if (d.id && pend[d.id]) { pend[d.id](d); delete pend[d.id]; } };
    const send = (method, params = {}) => new Promise((r, no) => { const i = ++id; pend[i] = r; ws.send(JSON.stringify({id: i, method, params}));
      setTimeout(() => { if (pend[i]) { delete pend[i]; no(new Error(`${method} antwortet nicht`)); } }, 60000); });
    await send('Page.enable');
    const ev = async e => (await send('Runtime.evaluate', {expression: e, awaitPromise: true, returnByValue: true})).result.result.value;
    // 1) Cheatsheets: echte Seite öffnen (pro Sprache einmal laden, dann innerhalb der Seite wechseln), Tabellen-Rahmen in 1,5-facher Größe ausschneiden
    const cs = jobs.filter(j => j.site);
    if (cs.length) {
      await send('Emulation.setDeviceMetricsOverride', {width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false});
      let lang = '';
      for (const j of cs) {
        const l = /^\/en(\/|$)/.test(j.site) ? 'en' : 'de';
        if (l !== lang) { await send('Page.navigate', {url: origin + j.site}); await sleep(3500); lang = l; await ev(`document.head.insertAdjacentHTML('beforeend', '<style>#ckb{display:none!important}</style>')`); }
        else { await ev(`go(${JSON.stringify(j.site.replace(/^\/en(?=\/|$)/, '') || '/')})`); await sleep(500); }
        const img = await ev(CS_SHOT); if (!img) { console.warn('  ohne Tabelle:', j.site); continue; }
        j.html = j.make(img);
      }
    }
    await send('Emulation.setDeviceMetricsOverride', {width: 1200, height: 630, deviceScaleFactor: 1, mobile: false});
    // 2) Vorlagen rendern und speichern
    for (const j of jobs) {
      if (!j.html) continue;
      current = j.html;
      await send('Page.navigate', {url: origin + '/__og?' + j.file}); await sleep(600);
      await send('Runtime.evaluate', {expression: 'document.fonts.ready.then(()=>Promise.all([...document.images].map(i=>i.decode().catch(()=>{}))))', awaitPromise: true});
      if (j.jpg) {   // Cheatsheets: nur ein JPG (klein genug für viele Seiten)
        const buf = Buffer.from((await send('Page.captureScreenshot', {format: 'jpeg', quality: 78})).result.data, 'base64'), f = path.join(OUT, `${j.file}.jpg`);
        if (fs.existsSync(f) && fs.readFileSync(f).equals(buf)) { console.log(`  unverändert: assets\\og\\${j.file}.jpg`); continue; }
        fs.writeFileSync(f, buf); console.log(`  geschrieben: assets\\og\\${j.file}.jpg`); continue;
      }
      // Pixel der Seite holen (für das 256-Farben-PNG): Screenshot im Browser auf ein Canvas zeichnen und als Rohdaten zurückgeben
      const shot = (await send('Page.captureScreenshot', {format: 'png'})).result.data;
      const px = (await send('Runtime.evaluate', {awaitPromise: true, returnByValue: true, expression: `new Promise(ok => { const i = new Image(); i.onload = () => { const c = document.createElement('canvas'); c.width = 1200; c.height = 630;
        const x = c.getContext('2d'); x.drawImage(i, 0, 0); const d = x.getImageData(0, 0, 1200, 630).data; let s = ''; for (let k = 0; k < d.length; k += 32768) s += String.fromCharCode.apply(null, d.subarray(k, k + 32768)); ok(btoa(s)); }; i.src = 'data:image/png;base64,${shot}'; })`})).result.result.value;
      const pngSmall = quantize(Buffer.from(px, 'base64'), 1200, 630);
      for (const [fmt, ext, q] of [['png', 'png'], ['webp', 'webp', 86]]) {
        const buf = ext === 'png' ? pngSmall : Buffer.from((await send('Page.captureScreenshot', {format: fmt, quality: q})).result.data, 'base64'), f = path.join(OUT, `${j.file}.${ext}`);
        // nur schreiben, wenn sich das Bild geändert hat (sonst gäbe jedes Daten-Update eine neue Datei)
        if (fs.existsSync(f) && fs.readFileSync(f).equals(buf)) { console.log(`  unverändert: assets\\og\\${j.file}.${ext}`); continue; }
        fs.writeFileSync(f, buf); console.log(`  geschrieben: assets\\og\\${j.file}.${ext}`);
      }
    }
    // alte Cheatsheet-Bilder ohne Seite (z. B. frühere deutsche Fassungen) entfernen – nur bei einem vollständigen Lauf
    if (!process.argv[2]) { const keep = new Set(jobs.filter(j => j.site).map(j => path.basename(j.file) + '.jpg'));
      fs.readdirSync(path.join(OUT, 'cs')).filter(f => !keep.has(f)).forEach(f => { fs.unlinkSync(path.join(OUT, 'cs', f)); console.log(`  entfernt: assets\\og\\cs\\${f}`); }); }
    ws.close();
  } finally { br.kill(); srv.close(); try { fs.rmSync(prof, {recursive: true, force: true}); } catch (e) {} }
  process.exit(0);
})().catch(e => { console.error('Fehler:', e.message); process.exit(1); });
