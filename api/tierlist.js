// TFTClimb – Tierlist aus der Redaktion (/admin) direkt veröffentlichen.
// Läuft als Vercel-Funktion unter /api/tierlist: prüft das Redaktions-Passwort und schreibt tierlist-data-<Set>.js per GitHub-API
// als Commit ins Repository. Vercel baut danach automatisch neu – nach etwa einer Minute sehen alle Besucher den neuen Stand.
// Umgebungsvariablen (Vercel → Settings → Environment Variables):
//   ADMIN_PASSWORD  Passwort der Redaktion
//   GITHUB_TOKEN    Fine-grained Token, nur für dieses Repository, Berechtigung „Contents: Read and write“
//   GITHUB_REPO     optional, Standard CrazYSlayt/TFT · GITHUB_BRANCH optional, Standard main
const crypto = require('crypto');

const REPO = process.env.GITHUB_REPO || 'CrazYSlayt/TFT';
const BRANCH = process.env.GITHUB_BRANCH || 'main';
const AUTHOR = {name: 'CrazYSlayt', email: '328547410+CrazYSlayt@users.noreply.github.com'};
const MAX_BYTES = 2 * 1024 * 1024;

// Bremse gegen Passwort-Raten: höchstens 5 Fehlversuche pro IP in 10 Minuten (gilt je laufender Instanz)
const FAILS = new Map();
const failed = ip => { const now = Date.now(), l = (FAILS.get(ip) || []).filter(t => now - t < 600000); FAILS.set(ip, l); return l; };
// Passwort in konstanter Zeit vergleichen (über die Prüfsummen, damit auch unterschiedliche Längen nichts verraten)
const same = (a, b) => crypto.timingSafeEqual(crypto.createHash('sha256').update(String(a)).digest(), crypto.createHash('sha256').update(String(b)).digest());

async function readBody(req){
  if (req.body && typeof req.body === 'object') return req.body;
  const chunks = []; let n = 0;
  for await (const c of req) { n += c.length; if (n > MAX_BYTES) throw new Error('zu groß'); chunks.push(c); }
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
}

async function gh(path, opts = {}){
  const r = await fetch('https://api.github.com/repos/' + REPO + path, {...opts, headers: {
    'Authorization': 'Bearer ' + process.env.GITHUB_TOKEN, 'Accept': 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'tftclimb-admin', ...(opts.headers || {})}});
  return {status: r.status, data: await r.json().catch(() => ({}))};
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') { res.status(405).json({error: 'Nur POST'}); return; }
  if (!process.env.ADMIN_PASSWORD || !process.env.GITHUB_TOKEN) { res.status(500).json({error: 'Veröffentlichen ist noch nicht eingerichtet (ADMIN_PASSWORD und GITHUB_TOKEN in Vercel fehlen).'}); return; }
  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unbekannt';
  if (failed(ip).length >= 5) { res.status(429).json({error: 'Zu viele Fehlversuche – bitte in 10 Minuten noch einmal.'}); return; }

  let body;
  try { body = await readBody(req); } catch (e) { res.status(400).json({error: 'Anfrage nicht lesbar.'}); return; }
  if (!same(body.password || '', process.env.ADMIN_PASSWORD)) { failed(ip).push(Date.now()); res.status(401).json({error: 'Passwort falsch.'}); return; }

  // Inhalt prüfen: nur eine Tierlist für ein Set, nur die eine Datei
  const set = Number(body.set), data = body.data;
  if (!Number.isInteger(set) || set < 1 || set > 99) { res.status(400).json({error: 'Set ungültig.'}); return; }
  if (!data || typeof data !== 'object' || !Array.isArray(data.comps) || Number(data.set) !== set) { res.status(400).json({error: 'Tierlist ungültig.'}); return; }
  const file = `tierlist-data-${set}.js`;
  try {
    const cur = await gh(`/contents/${file}?ref=${encodeURIComponent(BRANCH)}`);   // bisherige Datei mit sha (fehlt bei einem neuen Set)
    if (cur.status !== 200 && cur.status !== 404) { res.status(502).json({error: 'GitHub nicht erreichbar (' + cur.status + ').'}); return; }
    // Schutz vor veralteten Entwürfen: jede veröffentlichte Tierlist hat eine Version (rev). Der Entwurf schickt die Version mit,
    // auf der er aufbaut (base). Hat sich der Live-Stand seitdem geändert, wird nur mit ausdrücklichem „Trotzdem“ (force) überschrieben.
    const curText = cur.status === 200 && cur.data.content ? Buffer.from(cur.data.content, 'base64').toString('utf8') : '';
    const curRev = (curText.match(/"rev":"([^"]*)"/) || [])[1] || '';
    if (curRev && String(body.base || '') !== curRev && !body.force) {
      const upd = (curText.match(/"updated":"([^"]*)"/) || [])[1] || '';
      res.status(409).json({error: 'Die Live-Tierlist wurde seit deinem Entwurf geändert.', updated: upd}); return;
    }
    data.rev = Date.now().toString(36) + crypto.randomBytes(3).toString('hex');
    const json = JSON.stringify(data);
    if (Buffer.byteLength(json) > MAX_BYTES) { res.status(413).json({error: 'Tierlist zu groß.'}); return; }
    const stamp = new Date().toLocaleString('de-DE', {timeZone: 'Europe/Berlin'});
    const content = '// TFTClimb – Tierlist-Daten, veröffentlicht aus der Redaktion am ' + stamp + '\n// Wird vom Knopf „Veröffentlichen“ in /admin geschrieben (api/tierlist.js).\nwindow.TIERLIST_DATA = ' + json + ';\n';
    const put = await gh(`/contents/${file}`, {method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({
      message: `Tierlist Set ${set} aus der Redaktion veröffentlicht (${data.comps.length} Comps, Patch ${String(data.patch || '').slice(0, 12)})`,
      content: Buffer.from(content, 'utf8').toString('base64'), branch: BRANCH, committer: AUTHOR, author: AUTHOR,
      ...(cur.status === 200 && cur.data.sha ? {sha: cur.data.sha} : {})})});
    if (put.status !== 200 && put.status !== 201) { res.status(502).json({error: 'GitHub hat das Speichern abgelehnt (' + put.status + ').'}); return; }
    res.status(200).json({ok: true, commit: String((put.data.commit || {}).sha || '').slice(0, 7), comps: data.comps.length, rev: data.rev});
  } catch (e) {
    res.status(502).json({error: 'Veröffentlichen fehlgeschlagen.'});
  }
};
