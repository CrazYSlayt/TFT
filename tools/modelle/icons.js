/*
  TFTClimb – kleine quadratische Champion-Icons (128 px) aus den Spieldateien für die Champion-Leiste
  ---------------------------------------------------------------------------------------------------
  Liest für jeden Champion des Sets die Textur <id>_square.tex aus TFTSet<set>.wad.client (League-Installation),
  wandelt sie in Edge (unsichtbar) nach WebP und legt sie unter assets/img/champions-square/<slug>.webp ab (je ~5 KB).
  Aufruf:  node tools/modelle/icons.js [--set 18]
  Fehlt ein Icon, nutzt die Seite weiter das Splash-Bild (champBg) – die Ausgabe nennt die fehlenden.
*/
const fs = require('fs'), path = require('path'), http = require('http'), os = require('os'), zlib = require('zlib'), vm = require('vm'), {spawn} = require('child_process');
const {open} = require('./wad.js'), {decode} = require('./tex.js');
const ROOT = path.join(__dirname, '..', '..'), OUT = path.join(ROOT, 'assets', 'img', 'champions-square');
const GAME = (process.env.LOL_GAME || 'C:/Riot Games/League of Legends') + '/Game/DATA/FINAL/';
const args = process.argv.slice(2), opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const slug = n => String(n).toLowerCase().replace(/['’.]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');   // wie champSlug in app.js

// Champions des Sets aus data/tft-data-<set>.js (setzt window.TFT_DATA)
function champs(set) {
  const ctx = {window: {}}; vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'data', `tft-data-${set}.js`), 'utf8'), ctx);
  return ctx.window.TFT_DATA.champions || [];
}
// RGBA → PNG (ohne Filter, reicht für 128 px)
function png(w, h, rgba) {
  const crcT = Array.from({length: 256}, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
  const crc = b => { let c = ~0; for (const x of b) c = crcT[(c ^ x) & 255] ^ (c >>> 8); return (~c) >>> 0; };
  const chunk = (t, d) => { const l = Buffer.alloc(4), c = Buffer.alloc(4), td = Buffer.concat([Buffer.from(t), d]); l.writeUInt32BE(d.length); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]); };
  const raw = Buffer.alloc((w * 4 + 1) * h); for (let y = 0; y < h; y++) rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4);
  const ih = Buffer.alloc(13); ih.writeUInt32BE(w); ih.writeUInt32BE(h, 4); ih[8] = 8; ih[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ih), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
// PNGs in Edge nach WebP wandeln: kleiner Server liefert eine leere Seite und die PNGs, das Skript in der Seite gibt Data-URLs zurück
async function toWebp(pngs) {
  const srv = http.createServer((q, s) => { const k = decodeURIComponent(q.url.slice(1)); if (pngs[k]) { s.writeHead(200, {'Content-Type': 'image/png'}); s.end(pngs[k]); } else { s.writeHead(200, {'Content-Type': 'text/html'}); s.end('<!doctype html><title>x</title>'); } });
  await new Promise(r => srv.listen(0, '127.0.0.1', r));
  const edge = ['ProgramFiles(x86)', 'ProgramFiles'].map(v => path.join(process.env[v] || '', 'Microsoft/Edge/Application/msedge.exe')).find(f => fs.existsSync(f));
  const port = 9300 + Math.floor(Math.random() * 600), prof = path.join(os.tmpdir(), 'tftclimb-icons-' + port);
  const br = spawn(edge, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${prof}`, 'about:blank'], {stdio: 'ignore'});
  try {
    let tabs; for (let i = 0; i < 60; i++) { try { tabs = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); if (tabs.length) break; } catch (e) {} await sleep(250); }
    const ws = new WebSocket(tabs.find(t => t.type === 'page').webSocketDebuggerUrl); let id = 0; const pend = {};
    const send = (m, p = {}) => new Promise(r => { const i = ++id; pend[i] = r; ws.send(JSON.stringify({id: i, method: m, params: p})); });
    ws.onmessage = m => { const d = JSON.parse(m.data); if (d.id && pend[d.id]) { pend[d.id](d); delete pend[d.id]; } };
    await new Promise(r => ws.onopen = r); await send('Page.enable'); await send('Page.navigate', {url: `http://127.0.0.1:${srv.address().port}/`}); await sleep(800);
    const js = `Promise.all(${JSON.stringify(Object.keys(pngs))}.map(k=>new Promise(ok=>{const i=new Image();i.onload=()=>{const c=document.createElement('canvas');c.width=i.width;c.height=i.height;c.getContext('2d').drawImage(i,0,0);ok([k,c.toDataURL('image/webp',.86)])};i.onerror=()=>ok([k,null]);i.src='/'+encodeURIComponent(k)}))).then(Object.fromEntries)`;
    const r = await send('Runtime.evaluate', {expression: js, awaitPromise: true, returnByValue: true}); ws.close();
    return r.result.result.value;
  } finally { br.kill(); srv.close(); try { fs.rmSync(prof, {recursive: true, force: true}); } catch (e) {} }
}

(async () => {
  const set = +opt('set', 18), w = open(GAME + `TFTSet${set}.wad.client`), pngs = {}, miss = [];
  for (const c of champs(set)) {
    // Ordner aus den Bildpfaden der Daten (tile/sq) – der Name passt nicht immer (Pebbles = tft18_sentry, Mama Beak = tft18_raptor)
    const n = c.n, dirs = [...new Set([c.tile, c.sq].map(p => ((p || '').match(/characters\/([^/]+)\//i) || [])[1]).filter(Boolean).map(x => x.toLowerCase())
      .concat(`tft${set}_` + n.toLowerCase().replace(/[^a-z0-9]/g, '')))];
    const b = dirs.flatMap(id => [`assets/characters/${id}/${id}_square.tex`, `assets/characters/${id}/hud/${id}_square.tex`]).map(p => w.read(p)).find(Boolean);
    if (!b) { miss.push(n); continue; }
    const t = decode(b); pngs[slug(n)] = png(t.w, t.h, t.rgba);
  }
  w.close();
  const webp = await toWebp(pngs); fs.mkdirSync(OUT, {recursive: true}); let n = 0, kb = 0;
  for (const [k, u] of Object.entries(webp)) { if (!u) { miss.push(k); continue; } const buf = Buffer.from(u.split(',')[1], 'base64'); fs.writeFileSync(path.join(OUT, k + '.webp'), buf); n++; kb += buf.length / 1024; }
  console.log(`${n} Icons → assets/img/champions-square/ (${kb.toFixed(0)} KB)` + (miss.length ? ` · fehlen: ${miss.join(', ')}` : ''));
  process.exit(0);
})().catch(e => { console.error('Fehler:', e.message); process.exit(1); });
