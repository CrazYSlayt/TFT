// TFTClimb – Aufrufe der Tools zählen (Blitz + Zahl auf den Tool-Kacheln unter /tools).
// Läuft als Vercel-Funktion unter /api/clicks:
//   GET            → {counts: {rolldown: 123, …}}   (60 s zwischengespeichert)
//   POST ?t=<tool> → zählt einen Aufruf dieses Tools
// Speicher: Upstash Redis (Vercel → Storage → Upstash for Redis verbinden). Vercel legt die Zugangsdaten als
// KV_REST_API_URL / KV_REST_API_TOKEN (bzw. UPSTASH_REDIS_REST_URL / _TOKEN) an – sie stehen nie im Code.
// Ohne Speicher antwortet die Funktion mit counts: null, die Kacheln zeigen dann keine Zahl.
// Es wird nur die Zahl pro Tool gespeichert – keine IP, kein Cookie, nichts über die Besucher.
const TOOLS = ['builder', 'augments', 'drops', 'dps', 'rolldown', 'simulator', 'tierlist'];
const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

async function redis(path){
  const res = await fetch(`${URL_}/${path}`, {headers: {Authorization: `Bearer ${TOKEN}`}});
  if (!res.ok) throw new Error('Redis ' + res.status);
  return (await res.json()).result;
}

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  if (!URL_ || !TOKEN) { res.setHeader('Cache-Control', 's-maxage=300'); res.end(JSON.stringify({counts: null})); return; }
  try {
    if (req.method === 'POST') {
      const t = String((req.query && req.query.t) || '');
      if (!TOOLS.includes(t)) { res.statusCode = 400; res.end(JSON.stringify({error: 'unknown tool'})); return; }
      const n = await redis(`incr/tftclimb:clicks:${t}`);
      res.setHeader('Cache-Control', 'no-store');
      res.end(JSON.stringify({tool: t, count: n}));
      return;
    }
    const vals = await redis('mget/' + TOOLS.map(t => `tftclimb:clicks:${t}`).join('/'));
    const counts = {}; TOOLS.forEach((t, i) => { counts[t] = parseInt(vals && vals[i], 10) || 0; });
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    res.end(JSON.stringify({counts}));
  } catch (e) {
    res.statusCode = 502; res.setHeader('Cache-Control', 's-maxage=30');
    res.end(JSON.stringify({counts: null}));
  }
};
