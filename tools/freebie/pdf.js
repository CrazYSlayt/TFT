// Freebie als PDF: Vorlage tools/freebie/climb-plan.html über einen kleinen Webserver in Edge (unsichtbar) öffnen und drucken.
//   node tools/freebie/pdf.js [ausgabe.pdf]   (Standard: tools/freebie/TFTClimb-Climb-Plan.pdf)
const http = require('http'), fs = require('fs'), path = require('path'), os = require('os'), {spawn} = require('child_process');
const ROOT = path.resolve(__dirname, '..', '..'), OUT = path.resolve(process.argv[2] || path.join(__dirname, 'TFTClimb-Climb-Plan.pdf'));
const TYPES = {'.html': 'text/html; charset=utf-8', '.webp': 'image/webp', '.png': 'image/png', '.woff2': 'font/woff2', '.svg': 'image/svg+xml'};
const sleep = ms => new Promise(r => setTimeout(r, ms));
const srv = http.createServer((q, r) => { const u = decodeURIComponent(new URL(q.url, 'http://x').pathname), f = path.join(ROOT, u);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); r.end(); return; }
  r.writeHead(200, {'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream'}); fs.createReadStream(f).pipe(r); });
srv.listen(0, '127.0.0.1', async () => {
  const edge = path.join(process.env['ProgramFiles(x86)'], 'Microsoft', 'Edge', 'Application', 'msedge.exe');
  const port = 9300 + Math.floor(Math.random() * 500), prof = fs.mkdtempSync(path.join(os.tmpdir(), 'edgeprof-'));
  const ed = spawn(edge, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${prof}`, 'about:blank'], {stdio: 'ignore'});
  let tabs; for (let i = 0; i < 40; i++) { try { tabs = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); if (tabs.length) break; } catch (e) {} await sleep(250); }
  const ws = new WebSocket(tabs.find(t => t.type === 'page').webSocketDebuggerUrl); await new Promise(r => ws.onopen = r);
  let n = 0; const wait = {}; ws.onmessage = m => { const d = JSON.parse(m.data); if (d.id && wait[d.id]) { wait[d.id](d); delete wait[d.id]; } };
  const send = (method, params = {}) => new Promise(r => { const i = ++n; wait[i] = r; ws.send(JSON.stringify({id: i, method, params})); });
  await send('Page.navigate', {url: `http://127.0.0.1:${srv.address().port}/tools/freebie/climb-plan.html`}); await sleep(1500);
  // Überlauf je Seite melden (Inhalt darf nicht unter die Fußzeile rutschen)
  const ov = await send('Runtime.evaluate', {returnByValue: true, awaitPromise: true, expression: `(async()=>{await document.fonts.ready; await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})));
    return [...document.querySelectorAll('.page')].map((p,i)=>{ const f=p.querySelector('.foot').getBoundingClientRect().top, last=[...p.children].filter(c=>!c.classList.contains('foot')).pop().getBoundingClientRect().bottom; return 'Seite '+(i+1)+': '+Math.round(f-last)+' px Luft'; }).join(' · ');})()`});
  console.log(ov.result.result.value);
  const pdf = await send('Page.printToPDF', {printBackground: true, preferCSSPageSize: true, marginTop: 0, marginBottom: 0, marginLeft: 0, marginRight: 0});
  fs.writeFileSync(OUT, Buffer.from(pdf.result.data, 'base64')); console.log('PDF:', OUT, Math.round(fs.statSync(OUT).size / 1024) + ' KB');
  ws.close(); ed.kill(); srv.close(); process.exit(0);
});
