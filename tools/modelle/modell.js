/*
  TFTClimb – Ingame-Modell eines TFT-Champions als freigestelltes Bild rendern
  ---------------------------------------------------------------------------
  Alles kommt aus den lokal installierten Spieldateien (League of Legends): Modell, Skelett, Animation und Texturen.
  Ablauf: vorbereiten.js (entpacken + Skin-Datei lesen) → pose.js (Modell in eine Animations-Pose bringen)
          → render.html in Edge (three.js) → WebP/PNG mit transparentem Hintergrund.

  Aufruf:
    node tools/modelle/modell.js ashe
    node tools/modelle/modell.js akali --anim attack1 --zeit 0.35 --out akali-angriff.webp
  Optionen:
    --set 18          Set-Nummer (Standard: Live-Set aus data/sets.js)
    --anim idle1      Animation (Name ohne tftXX_<champion>_ und .anm), z. B. idle1, attack1, celebration
    --zeit 0          Zeitpunkt in der Animation, 0 = Anfang, 1 = Ende
    --groesse 600     Bildgröße in Pixeln (quadratisch)
    --yaw -25         Drehung der Figur in Grad   --pitch 30   Kamera von oben in Grad (TFT-Blickwinkel)
    --bg 06141e       Hintergrundfarbe statt transparent (nur zur Vorschau)
    --out datei.webp  Ausgabe (.webp oder .png); Standard: tools/modelle/cache/<champion>-<anim>.webp
  Umgebung: LOL_GAME = Installationsordner von League (Standard C:/Riot Games/League of Legends)
  Zwischendateien liegen in tools/modelle/cache/ (nicht im Repo).
*/
const fs = require('fs'), path = require('path'), http = require('http'), os = require('os'), {spawn} = require('child_process');
const {vorbereiten, CACHE} = require('./vorbereiten.js'), {posieren} = require('./pose.js');
const sleep = ms => new Promise(r => setTimeout(r, ms));

const args = process.argv.slice(2), champ = args.find(a => !a.startsWith('--') && !args[args.indexOf(a) - 1]?.startsWith('--'));
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const liveSet = () => { const t = fs.readFileSync(path.join(__dirname, '..', '..', 'data', 'sets.js'), 'utf8'), l = JSON.parse(t.slice(t.indexOf('['), t.lastIndexOf(']') + 1)); return (l.find(s => s.status === 'live') || l[0]).set; };

// render.html und die Daten über einen kleinen lokalen Webserver ausliefern, in Edge (unsichtbar) öffnen, Bild abholen
async function rendern(query, out) {
  const T = {'.html': 'text/html', '.json': 'application/json'};
  const srv = http.createServer((q, s) => {
    const u = decodeURIComponent(new URL(q.url, 'http://x').pathname), f = u === '/render.html' ? path.join(__dirname, 'render.html') : path.join(CACHE, u);
    if (!f.startsWith(__dirname) || !fs.existsSync(f)) { s.writeHead(404); s.end(); return; }
    s.writeHead(200, {'Content-Type': T[path.extname(f)] || 'application/octet-stream'}); fs.createReadStream(f).pipe(s);
  });
  await new Promise(r => srv.listen(0, '127.0.0.1', r));
  const edge = ['ProgramFiles(x86)', 'ProgramFiles'].map(v => path.join(process.env[v] || '', 'Microsoft/Edge/Application/msedge.exe')).find(f => fs.existsSync(f));
  if (!edge) throw new Error('Microsoft Edge nicht gefunden');
  const port = 9300 + Math.floor(Math.random() * 600), prof = path.join(os.tmpdir(), 'tftclimb-modell-' + port);
  const br = spawn(edge, ['--headless=new', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', `--remote-debugging-port=${port}`, `--user-data-dir=${prof}`, '--window-size=1100,1100', 'about:blank'], {stdio: 'ignore'});
  try {
    let tabs; for (let i = 0; i < 60; i++) { try { tabs = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); if (tabs.length) break; } catch (e) {} await sleep(250); }
    const ws = new WebSocket(tabs.find(t => t.type === 'page').webSocketDebuggerUrl);
    let id = 0; const pend = {}, errs = [];
    const send = (m, p = {}) => new Promise(r => { const i = ++id; pend[i] = r; ws.send(JSON.stringify({id: i, method: m, params: p})); });
    ws.onmessage = m => { const d = JSON.parse(m.data); if (d.id && pend[d.id]) { pend[d.id](d); delete pend[d.id]; } if (d.method === 'Runtime.exceptionThrown') errs.push(d.params.exceptionDetails.text); };
    await new Promise(r => ws.onopen = r); await send('Page.enable'); await send('Runtime.enable');
    await send('Page.navigate', {url: `http://127.0.0.1:${srv.address().port}/render.html?` + query});
    let done = false; for (let i = 0; i < 160 && !done; i++) { await sleep(250); done = (await send('Runtime.evaluate', {expression: 'window.__done === true', returnByValue: true})).result.result.value; }
    if (!done) throw new Error('Rendern fehlgeschlagen ' + errs.join(' '));
    const info = (await send('Runtime.evaluate', {expression: 'window.__info', returnByValue: true})).result.result.value;
    const img = (await send('Runtime.evaluate', {expression: 'window.__png', returnByValue: true})).result.result.value;
    fs.writeFileSync(out, Buffer.from(img.split(',')[1], 'base64'));
    ws.close(); return info;
  } finally { br.kill(); srv.close(); try { fs.rmSync(prof, {recursive: true, force: true}); } catch (e) {} }
}

(async () => {
  if (!champ) { console.log('Aufruf: node tools/modelle/modell.js <champion> [--anim idle1] [--zeit 0] [--out datei.webp] – Details oben in dieser Datei'); process.exit(1); }
  const set = +opt('set', liveSet()), anim = opt('anim', 'idle1'), zeit = +opt('zeit', 0);
  const {dir, manifest} = await vorbereiten(champ, set);
  const animFile = manifest.anims.find(a => a.toLowerCase() === `tft${set}_${champ.toLowerCase()}_${anim.toLowerCase()}.anm`);
  if (!animFile) throw new Error(`Animation „${anim}“ nicht gefunden. Vorhanden: ${manifest.anims.map(a => a.replace(/^tft\d+_[^_]+_/, '').replace('.anm', '')).join(', ')}`);
  const pose = posieren(dir, animFile, zeit);
  fs.writeFileSync(path.join(dir, 'posed.json'), JSON.stringify(pose));
  const out = path.resolve(opt('out', path.join(CACHE, `${champ.toLowerCase()}-${anim}.webp`)));
  const q = new URLSearchParams({d: path.relative(CACHE, dir).split(path.sep).join('/'), size: opt('groesse', '600'), yaw: opt('yaw', '-25'), pitch: opt('pitch', '30'), fmt: out.endsWith('.png') ? 'png' : 'webp'});
  if (opt('bg')) q.set('bg', opt('bg'));
  const info = await rendern(q.toString(), out);
  console.log(`${champ} (Set ${set}, ${anim} @ ${zeit}) · ${pose.info} · ${info}\n  → ${out} (${(fs.statSync(out).size / 1024).toFixed(0)} KB)`);
  process.exit(0);
})().catch(e => { console.error('Fehler:', e.message); process.exit(1); });
