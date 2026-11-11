// Titelbilder mit Nano Banana (Google Gemini Bildmodelle) – CrazYSlayt als Cartoon taucht in die Szene ein, die Figur selbst bleibt gleich.
// Aufruf: node tools/nano-banana.js <prompt.txt> <ausgabe.png> [vorlage1 vorlage2 …] [--model gemini-3-pro-image] [--ratio 16:9] [--size 2K]
// Schlüssel: Umgebungsvariable GEMINI_API_KEY (wird nie ausgegeben oder gespeichert). Vorlagen: Bilder von CrazYSlayt aus assets/img/coach.
// Hinweis: Das MCP-Werkzeug „nano-banana-mcp“ ruft ein abgeschaltetes Modell auf (gemini-2.5-flash-image-preview) – deshalb dieses Skript.
const fs = require('fs'), path = require('path');
const args = process.argv.slice(2), opt = (n, d) => { const i = args.indexOf('--' + n); if (i < 0) return d; const v = args[i + 1]; args.splice(i, 2); return v; };
const model = opt('model', 'gemini-3-pro-image'), ratio = opt('ratio', '16:9'), size = opt('size', '2K');
const [promptFile, out, ...refs] = args;
if (!promptFile || !out) { console.log('Aufruf: node tools/nano-banana.js <prompt.txt> <ausgabe.png> [vorlagen …]'); process.exit(1); }
let key = process.env.GEMINI_API_KEY;
if (!key && process.platform === 'win32') { try { key = require('child_process').execSync('powershell -NoProfile -Command "[Environment]::GetEnvironmentVariable(\'GEMINI_API_KEY\',\'User\')"').toString().trim(); } catch (e) {} }
if (!key) { console.log('GEMINI_API_KEY fehlt'); process.exit(1); }
const mime = f => ({'.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg'})[path.extname(f).toLowerCase()] || 'image/png';
(async () => {
  const parts = [{text: fs.readFileSync(promptFile, 'utf8')}, ...refs.map(f => ({inlineData: {mimeType: mime(f), data: fs.readFileSync(f).toString('base64')}}))];
  const body = {contents: [{role: 'user', parts}], generationConfig: {responseModalities: ['IMAGE', 'TEXT'], imageConfig: {aspectRatio: ratio, imageSize: size}}};
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {method: 'POST', headers: {'x-goog-api-key': key, 'Content-Type': 'application/json'}, body: JSON.stringify(body)});
  const j = await r.json();
  if (!r.ok) { console.log('Fehler', r.status, JSON.stringify(j).slice(0, 400)); process.exit(1); }
  const ps = ((j.candidates || [])[0] || {}).content?.parts || [], img = ps.find(p => p.inlineData);
  ps.filter(p => p.text).forEach(p => console.log('Modell:', p.text.slice(0, 300)));
  if (!img) { console.log('Kein Bild erhalten', JSON.stringify(j).slice(0, 300)); process.exit(1); }
  fs.mkdirSync(path.dirname(out), {recursive: true}); fs.writeFileSync(out, Buffer.from(img.inlineData.data, 'base64'));
  console.log('ok', out, Math.round(fs.statSync(out).size / 1024) + ' KB');
})();
