// Screenshots von Tools für Guides: Seite öffnen, Eingaben per Skript setzen, Ausschnitt als WebP speichern.
// Aufruf: node tools/tool-screens.mjs <auftrag.json>   (lokaler Server muss laufen: node tools/serve.js)
// Auftrag: {"base":"http://localhost:8765", "width":1280, "shots":[{"url":"/tools/tft-rolldown-rechner", "steps":"…JS…", "sel":"#rdRes", "out":"assets/img/guides/tools/name.webp"}]}
// steps läuft im Browser; Hilfen: click(sel), clickN(sel, n), val(sel, wert) (setzt Wert + input-Event)
import { spawn } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';

const job = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const base = job.base || 'http://localhost:8765', width = job.width || 1280, port = 9341;
const prof = join(tmpdir(), 'tftclimb-tool-screens');
const edge = spawn(process.env['ProgramFiles(x86)'] + '\\Microsoft\\Edge\\Application\\msedge.exe',
  ['--headless=new', `--remote-debugging-port=${port}`, `--window-size=${width},1000`, '--user-data-dir=' + prof, 'about:blank']);
const sleep = ms => new Promise(r => setTimeout(r, ms));
await sleep(2500);
const tabs = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
const ws = new WebSocket(tabs.find(t => t.type === 'page').webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);
let id = 0; const pend = {}, errs = [];
ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pend[m.id]) { pend[m.id](m.result); delete pend[m.id]; }
  if (m.method === 'Runtime.exceptionThrown') errs.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text); };
const cmd = (method, params = {}) => new Promise(r => { pend[++id] = r; ws.send(JSON.stringify({ id, method, params })); });
const ev = async x => (await cmd('Runtime.evaluate', { expression: x, returnByValue: true, awaitPromise: true })).result?.value;
await cmd('Runtime.enable'); await cmd('Page.enable');
await cmd('Emulation.setDeviceMetricsOverride', { width, height: 1000, deviceScaleFactor: 1, mobile: false });
const HELP = `const click = s => document.querySelector(s).click(), clickN = (s, n) => { for (let i = 0; i < n; i++) click(s); },
  val = (s, v) => { const e = document.querySelector(s); e.value = v; e.dispatchEvent(new Event('input', {bubbles:true})); };`;

for (const s of job.shots) {
  await cmd('Page.navigate', { url: base + s.url }); await sleep(3500);
  await ev(`document.getElementById('ckb')?.remove(); document.querySelectorAll('.fn-pop,.exit-pop').forEach(e=>e.remove());`);
  if (s.steps) await ev(`(async()=>{ ${HELP} ${s.steps} })()`);
  await sleep(s.wait || 1800);   // Ergebnis-Animationen auslaufen lassen
  const b = await ev(`(()=>{ const e = document.querySelector(${JSON.stringify(s.sel)}); if(!e) return null; const r = e.getBoundingClientRect(); return {x:r.x + scrollX, y:r.y + scrollY, w:r.width, h:r.height}; })()`);
  if (!b) { console.log('fehlt:', s.sel, s.url); continue; }
  const pad = s.pad ?? 0;
  const shot = await cmd('Page.captureScreenshot', { format: 'webp', quality: 88, captureBeyondViewport: true,
    clip: { x: b.x - pad, y: b.y - pad, width: b.w + 2 * pad, height: b.h + 2 * pad, scale: s.scale || 1 } });
  mkdirSync(dirname(s.out), { recursive: true }); writeFileSync(s.out, Buffer.from(shot.data, 'base64'));
  console.log('gespeichert:', s.out, Math.round(b.w) + '×' + Math.round(b.h));
}
if (errs.length) console.log('JS-Fehler:', errs);
ws.close(); edge.kill(); await sleep(500); try { rmSync(prof, { recursive: true, force: true }); } catch {}
