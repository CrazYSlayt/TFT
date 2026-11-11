// Titelbilder mit Nano Banana (Google Gemini Bildmodelle) – CrazYSlayt als Cartoon taucht in die Szene ein, die Figur selbst bleibt gleich.
// Nur auf ausdrücklichen Wunsch von CrazYSlayt benutzen – ein Bild pro Auftrag, nachbessern nur auf Wunsch.
//
// Standard (Wunsch 12.11.): Nano Banana Pro über den Batch-Weg in 2K – volle Qualität für ~0,067 $ pro Bild, dafür dauert es Minuten bis Stunden.
//   Abschicken:  node tools/nano-banana.js batch <auftrag.json>
//                auftrag.json = [{"prompt": "datei.txt", "out": "ausgabe.png", "refs": ["vorlage1.webp", …]}, …]  (mehrere Bilder in einem Auftrag)
//                → schreibt <auftrag>.job.json mit der Auftragsnummer
//   Abholen:     node tools/nano-banana.js fetch <auftrag>.job.json   (sagt „läuft noch“ oder speichert die Bilder)
// Sofort (doppelter Preis, ~0,134 $): node tools/nano-banana.js now <prompt.txt> <ausgabe.png> [vorlagen …] [--model …] [--ratio 16:9] [--size 2K]
//
// Schlüssel: Umgebungsvariable GEMINI_API_KEY (wird nie ausgegeben oder gespeichert). Vorlagen: Bilder von CrazYSlayt aus assets/img/coach,
// dazu die echten Symbole (Rang-Embleme aus assets/img/ranks, Items, Augments), damit das Modell nichts erfindet.
// Hinweis: Das MCP-Werkzeug „nano-banana-mcp“ ruft ein abgeschaltetes Modell auf (gemini-2.5-flash-image-preview) – deshalb dieses Skript.
const fs = require('fs'), path = require('path');
const API = 'https://generativelanguage.googleapis.com/v1beta';
const args = process.argv.slice(2), opt = (n, d) => { const i = args.indexOf('--' + n); if (i < 0) return d; const v = args[i + 1]; args.splice(i, 2); return v; };
const model = opt('model', 'gemini-3-pro-image'), ratio = opt('ratio', '16:9'), size = opt('size', '2K');
const [mode, ...rest] = args;
let key = process.env.GEMINI_API_KEY;
if (!key && process.platform === 'win32') { try { key = require('child_process').execSync('powershell -NoProfile -Command "[Environment]::GetEnvironmentVariable(\'GEMINI_API_KEY\',\'User\')"').toString().trim(); } catch (e) {} }
if (!key) { console.log('GEMINI_API_KEY fehlt'); process.exit(1); }
const H = {'x-goog-api-key': key, 'Content-Type': 'application/json'};
const mime = f => ({'.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg'})[path.extname(f).toLowerCase()] || 'image/png';
const request = (promptFile, refs) => ({contents: [{role: 'user', parts: [{text: fs.readFileSync(promptFile, 'utf8')}, ...refs.map(f => ({inlineData: {mimeType: mime(f), data: fs.readFileSync(f).toString('base64')}}))]}],
  generationConfig: {responseModalities: ['IMAGE', 'TEXT'], imageConfig: {aspectRatio: ratio, imageSize: size}}});
// erstes Bild in einer Antwort finden (egal wie tief verschachtelt)
const findImg = o => { if (!o || typeof o !== 'object') return null; if (o.inlineData && o.inlineData.data) return o.inlineData; for (const v of Object.values(o)) { const r = findImg(v); if (r) return r; } return null; };
const save = (out, img) => { fs.mkdirSync(path.dirname(out), {recursive: true}); fs.writeFileSync(out, Buffer.from(img.data, 'base64')); console.log('ok', out, Math.round(fs.statSync(out).size / 1024) + ' KB'); };
const call = async (url, init) => { const r = await fetch(url, init), j = await r.json(); if (!r.ok) { console.log('Fehler', r.status, JSON.stringify(j).slice(0, 500)); process.exit(1); } return j; };
(async () => {
  if (mode === 'now') {
    const [promptFile, out, ...refs] = rest; if (!promptFile || !out) { console.log('Aufruf: node tools/nano-banana.js now <prompt.txt> <ausgabe.png> [vorlagen …]'); process.exit(1); }
    const j = await call(`${API}/models/${model}:generateContent`, {method: 'POST', headers: H, body: JSON.stringify(request(promptFile, refs))});
    const img = findImg(j); if (!img) { console.log('Kein Bild erhalten', JSON.stringify(j).slice(0, 300)); process.exit(1); } save(out, img); return;
  }
  if (mode === 'batch') {
    const file = rest[0], jobs = JSON.parse(fs.readFileSync(file, 'utf8')), base = path.dirname(path.resolve(file));
    const abs = p => path.isAbsolute(p) ? p : path.resolve(base, p);
    const requests = jobs.map((x, i) => ({request: request(abs(x.prompt), (x.refs || []).map(abs)), metadata: {key: String(i)}}));
    const j = await call(`${API}/models/${model}:batchGenerateContent`, {method: 'POST', headers: H, body: JSON.stringify({batch: {display_name: 'tftclimb-' + path.basename(file, '.json'), input_config: {requests: {requests}}}})});
    const name = j.name || (j.metadata && j.metadata.name); if (!name) { console.log('Keine Auftragsnummer', JSON.stringify(j).slice(0, 300)); process.exit(1); }
    const jf = file.replace(/\.json$/, '') + '.job.json';
    fs.writeFileSync(jf, JSON.stringify({name, model, created: new Date().toISOString(), outs: jobs.map(x => abs(x.out))}, null, 1));
    console.log('abgeschickt:', jobs.length, 'Bild(er) →', jf); return;
  }
  if (mode === 'fetch') {
    const job = JSON.parse(fs.readFileSync(rest[0], 'utf8'));
    const j = await call(`${API}/${job.name}`, {headers: H});
    const state = JSON.stringify(j.metadata && j.metadata.state || j.state || (j.done ? 'done' : 'running'));
    if (/FAILED|CANCELLED|EXPIRED/i.test(state)) { console.log('Auftrag fehlgeschlagen:', state, JSON.stringify(j.error || '').slice(0, 300)); process.exit(1); }
    if (!(j.done || /SUCCEEDED/i.test(state))) { const min = Math.round((Date.now() - new Date(job.created)) / 60000); console.log(`läuft noch (${state}, seit ${min} Min.)`); return; }
    const list = (j.response && (j.response.inlinedResponses && (j.response.inlinedResponses.inlinedResponses || j.response.inlinedResponses))) || (j.dest && j.dest.inlinedResponses) || [];
    const arr = Array.isArray(list) ? list : [];
    arr.forEach((r, i) => { const k = +((r.metadata && r.metadata.key) ?? i), img = findImg(r.response || r); if (img && job.outs[k]) save(job.outs[k], img); else console.log('kein Bild für', job.outs[k], JSON.stringify(r.error || '').slice(0, 200)); });
    if (!arr.length) console.log('Fertig, aber keine Antworten gefunden:', JSON.stringify(j).slice(0, 400));
    return;
  }
  console.log('Aufruf: node tools/nano-banana.js batch <auftrag.json> | fetch <auftrag.job.json> | now <prompt.txt> <ausgabe.png> [vorlagen …]');
})();
