/*
  TFTClimb – Rang-Embleme lokal ablegen
  -------------------------------------
  Lädt die zehn Ranked-Embleme (Eisen … Challenger) von Data Dragon und legt sie als WebP ab:
  assets/img/ranks/<rang>.webp (512 px, großes Emblem der Rang-Seite) und <rang>-s.webp (128 px, Raster, Balken, kleine Icons).
  Aufruf:  node tools/rang-embleme.js [--dd 16.20.1]
  Die Umwandlung läuft in Edge (unsichtbar), wie bei tools/modelle/icons.js.
*/
const fs = require('fs'), path = require('path'), http = require('http'), os = require('os'), {spawn} = require('child_process');
const ROOT = path.join(__dirname, '..'), OUT = path.join(ROOT, 'assets', 'img', 'ranks');
const args = process.argv.slice(2), opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const TIERS = ['Iron', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Emerald', 'Diamond', 'Master', 'GrandMaster', 'Challenger'];
const SIZES = {'': 512, '-s': 128};

// PNGs in Edge verkleinern und nach WebP wandeln (Data-URLs zurück)
async function toWebp(pngs) {
  const srv = http.createServer((q, s) => { const k = decodeURIComponent(q.url.slice(1)); if (pngs[k]) { s.writeHead(200, {'Content-Type': 'image/png'}); s.end(pngs[k]); } else { s.writeHead(200, {'Content-Type': 'text/html'}); s.end('<!doctype html><title>x</title>'); } });
  await new Promise(r => srv.listen(0, '127.0.0.1', r));
  const edge = ['ProgramFiles(x86)', 'ProgramFiles'].map(v => path.join(process.env[v] || '', 'Microsoft/Edge/Application/msedge.exe')).find(f => fs.existsSync(f));
  const port = 9300 + Math.floor(Math.random() * 600), prof = path.join(os.tmpdir(), 'tftclimb-ranks-' + port);
  const br = spawn(edge, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${prof}`, 'about:blank'], {stdio: 'ignore'});
  try {
    let tabs; for (let i = 0; i < 60; i++) { try { tabs = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); if (tabs.length) break; } catch (e) {} await sleep(250); }
    const ws = new WebSocket(tabs.find(t => t.type === 'page').webSocketDebuggerUrl); let id = 0; const pend = {};
    const send = (m, p = {}) => new Promise(r => { const i = ++id; pend[i] = r; ws.send(JSON.stringify({id: i, method: m, params: p})); });
    ws.onmessage = m => { const d = JSON.parse(m.data); if (d.id && pend[d.id]) { pend[d.id](d); delete pend[d.id]; } };
    await new Promise(r => ws.onopen = r); await send('Page.enable'); await send('Page.navigate', {url: `http://127.0.0.1:${srv.address().port}/`}); await sleep(800);
    const js = `Promise.all(${JSON.stringify(Object.keys(pngs))}.map(k=>new Promise(ok=>{const i=new Image();i.onload=()=>{const out={};
      for(const [suf,s] of Object.entries(${JSON.stringify(SIZES)})){const f=Math.min(1,s/Math.max(i.width,i.height)),c=document.createElement('canvas');c.width=Math.round(i.width*f);c.height=Math.round(i.height*f);
        const x=c.getContext('2d');x.imageSmoothingQuality='high';x.drawImage(i,0,0,c.width,c.height);out[suf]=c.toDataURL('image/webp',.9)}ok([k,out])};i.onerror=()=>ok([k,null]);i.src='/'+encodeURIComponent(k)}))).then(Object.fromEntries)`;
    const r = await send('Runtime.evaluate', {expression: js, awaitPromise: true, returnByValue: true}); ws.close();
    return r.result.result.value;
  } finally { br.kill(); srv.close(); try { fs.rmSync(prof, {recursive: true, force: true}); } catch (e) {} }
}

(async () => {
  const dd = opt('dd', '16.20.1'), pngs = {};
  for (const f of TIERS) {
    const res = await fetch(`https://ddragon.leagueoflegends.com/cdn/${dd}/img/tft-regalia/TFT_Regalia_${f}.png`);
    if (!res.ok) throw new Error(`${f}: HTTP ${res.status}`);
    pngs[f.toLowerCase()] = Buffer.from(await res.arrayBuffer());
  }
  const webp = await toWebp(pngs); fs.mkdirSync(OUT, {recursive: true}); let kb = 0;
  for (const [k, o] of Object.entries(webp)) {
    if (!o) throw new Error(k + ': Umwandlung fehlgeschlagen');
    for (const [suf, u] of Object.entries(o)) { const buf = Buffer.from(u.split(',')[1], 'base64'); fs.writeFileSync(path.join(OUT, k + suf + '.webp'), buf); kb += buf.length / 1024; }
  }
  console.log(`${Object.keys(webp).length} Embleme → assets/img/ranks/ (${kb.toFixed(0)} KB)`);
  process.exit(0);
})().catch(e => { console.error('Fehler:', e.message); process.exit(1); });
