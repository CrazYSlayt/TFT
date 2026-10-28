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
const TYPES = {'.webp': 'image/webp', '.png': 'image/png', '.woff2': 'font/woff2', '.css': 'text/css'};

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
  h1 em{font-style:inherit;background:linear-gradient(90deg,#2ee6d6,#93c5fd,#f0abfc);-webkit-background-clip:text;background-clip:text;color:transparent}
  .sub{margin-top:10px;font:700 italic 38px 'Barlow Condensed';color:#cfe3ee}
  .line{display:inline-block;margin-top:24px;padding:10px 18px;border-radius:99px;border:2px solid rgba(46,230,214,.5);background:rgba(46,230,214,.1);font:700 22px Barlow;color:#7ff7ec}
  .tiers{display:flex;gap:20px;margin-top:30px}
  .tier{display:flex;align-items:center;gap:12px}
  .tier img{width:52px;height:77px;filter:drop-shadow(0 0 12px rgba(255,255,255,.25))}
  .tier b{font:900 italic 30px/1 'Barlow Condensed';text-transform:uppercase}
  .tier.t0 b{color:#d7dee8}.tier.t1 b{color:#f5b82e}.tier.t2 b{color:#c4b5fd}
  .mascot{position:absolute;right:30px;bottom:24px;height:560px;z-index:1;filter:drop-shadow(0 18px 40px rgba(0,0,0,.6)) drop-shadow(0 0 40px rgba(167,139,250,.35))}
</style></head><body>${body}</body></html>`;

// kleiner Webserver: Projektdateien + die aktuelle Vorlage unter /__og
let current = '';
function serve(){ return new Promise(res => { const srv = http.createServer((q, r) => {
  const u = decodeURIComponent(new URL(q.url, 'http://x').pathname);
  if (u === '/__og') { r.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'}); return r.end(current); }
  const f = path.join(ROOT, u); if (!f.startsWith(ROOT) || !fs.existsSync(f)) { r.writeHead(404); return r.end(); }
  r.writeHead(200, {'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream'}); fs.createReadStream(f).pipe(r);
}); srv.listen(0, '127.0.0.1', () => res(srv)); }); }
function findBrowser(){ return [path.join(process.env['ProgramFiles(x86)'] || '', 'Microsoft/Edge/Application/msedge.exe'), path.join(process.env.ProgramFiles || '', 'Microsoft/Edge/Application/msedge.exe'),
  path.join(process.env.ProgramFiles || '', 'Google/Chrome/Application/chrome.exe')].find(f => f && fs.existsSync(f)); }

(async () => {
  fs.mkdirSync(OUT, {recursive: true});
  const jobs = [...augmentPages()];
  const srv = await serve(), origin = 'http://127.0.0.1:' + srv.address().port;
  const port = 9300 + Math.floor(Math.random() * 500), prof = path.join(require('os').tmpdir(), 'tftclimb-og-' + port);
  const br = spawn(findBrowser(), ['--headless=new', '--hide-scrollbars', `--remote-debugging-port=${port}`, `--user-data-dir=${prof}`, '--window-size=1200,630', 'about:blank'], {stdio: 'ignore'});
  try {
    let tabs; for (let i = 0; i < 60; i++) { try { tabs = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); if (tabs.length) break; } catch (e) {} await sleep(250); }
    const ws = new WebSocket(tabs.find(t => t.type === 'page').webSocketDebuggerUrl); await new Promise(r => ws.onopen = r);
    let id = 0; const pend = {}; ws.onmessage = m => { const d = JSON.parse(m.data); if (d.id && pend[d.id]) { pend[d.id](d); delete pend[d.id]; } };
    const send = (method, params = {}) => new Promise(r => { const i = ++id; pend[i] = r; ws.send(JSON.stringify({id: i, method, params})); });
    await send('Page.enable'); await send('Emulation.setDeviceMetricsOverride', {width: 1200, height: 630, deviceScaleFactor: 1, mobile: false});
    for (const j of jobs) {
      current = j.html;
      await send('Page.navigate', {url: origin + '/__og?' + j.file}); await sleep(600);
      await send('Runtime.evaluate', {expression: 'document.fonts.ready.then(()=>Promise.all([...document.images].map(i=>i.decode().catch(()=>{}))))', awaitPromise: true});
      for (const [fmt, ext, q] of [['png', 'png'], ['webp', 'webp', 86]]) {
        const s = await send('Page.captureScreenshot', {format: fmt, ...(q ? {quality: q} : {})}), buf = Buffer.from(s.result.data, 'base64'), f = path.join(OUT, `${j.file}.${ext}`);
        // nur schreiben, wenn sich das Bild geändert hat (sonst gäbe jedes Daten-Update eine neue Datei)
        if (fs.existsSync(f) && fs.readFileSync(f).equals(buf)) { console.log(`  unverändert: assets\\og\\${j.file}.${ext}`); continue; }
        fs.writeFileSync(f, buf); console.log(`  geschrieben: assets\\og\\${j.file}.${ext}`);
      }
    }
    ws.close();
  } finally { br.kill(); srv.close(); try { fs.rmSync(prof, {recursive: true, force: true}); } catch (e) {} }
  process.exit(0);
})().catch(e => { console.error('Fehler:', e.message); process.exit(1); });
