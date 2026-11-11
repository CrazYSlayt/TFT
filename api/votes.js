// TFTClimb – Abstimmungen in News-Beiträgen („Wer ist das?“ beim Set-Teaser).
// Läuft als Vercel-Funktion unter /api/votes:
//   GET  ?p=<id>,<id>     → {votes: {<id>: {<option>: 12, …}, …}}   (15 s zwischengespeichert)
//   POST ?p=<id>&o=<opt>  → zählt eine Stimme, antwortet mit dem neuen Stand dieser Abstimmung
// Erlaubt sind nur Abstimmungen aus data/news.js: Block {k: 'poll', id, o: [[option, Name], …]} oder {k: 'guess', id} (Tipp = Champion aus data/lol-champions.js).
// Speicher: Upstash Redis wie bei /api/clicks (KV_REST_API_URL / KV_REST_API_TOKEN). Gespeichert wird nur die Zahl je Antwort –
// keine IP, kein Cookie. Dass jemand schon abgestimmt hat, merkt sich nur sein eigener Browser (localStorage).
const fs = require('fs'), path = require('path');
const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

// Abstimmungen aus data/news.js: poll = feste Antworten, guess = freier Tipp, aber nur Champions aus data/lol-champions.js (plus „neu“)
const slug = s => String(s).toLowerCase().normalize('NFD').replace(/[^a-z]/g, '');
function polls(){
  const out = {}, load = f => { const w = {}; new Function('window', fs.readFileSync(path.join(process.cwd(), 'data', f), 'utf8'))(w); return w; };
  try { const champs = new Set([...(load('lol-champions.js').LOL_CHAMPS || []).map(slug), 'neu']);
    (load('news.js').TFT_NEWS || []).forEach(p => Object.values(p.body || {}).forEach(list => (list || []).flatMap(b => b && (b.k === 'guesses' || b.k === 'matches') ? b.items || [] : [b]).forEach(b => {
      if (b && b.k === 'poll' && b.id) out[b.id] = new Set([...(out[b.id] || []), ...(b.o || []).map(o => o[0])]);
      if (b && b.k === 'guess' && b.id) out[b.id] = champs;
      if (b && b.k === 'match' && b.id) out[b.id] = new Set(['ja', 'nein']); }))); } catch (e) {}   // match = „Passt das?“ (ja/nein)
  return out;
}
async function redis(p){
  const res = await fetch(`${URL_}/${p}`, {headers: {Authorization: `Bearer ${TOKEN}`}});
  if (!res.ok) throw new Error('Redis ' + res.status);
  return (await res.json()).result;
}
const toObj = arr => { const o = {}; for (let i = 0; i + 1 < (arr || []).length; i += 2) o[arr[i]] = parseInt(arr[i + 1], 10) || 0; return o; };

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  if (!URL_ || !TOKEN) { res.setHeader('Cache-Control', 's-maxage=300'); res.end(JSON.stringify({votes: null})); return; }
  const P = polls(), q = req.query || {};
  try {
    if (req.method === 'POST') {
      const id = String(q.p || ''), o = String(q.o || '');
      if (!P[id] || !P[id].has(o)) { res.statusCode = 400; res.end(JSON.stringify({error: 'unknown poll or option'})); return; }
      await redis(`hincrby/tftclimb:votes:${encodeURIComponent(id)}/${encodeURIComponent(o)}/1`);
      const v = toObj(await redis(`hgetall/tftclimb:votes:${encodeURIComponent(id)}`));
      res.setHeader('Cache-Control', 'no-store');
      res.end(JSON.stringify({votes: {[id]: v}}));
      return;
    }
    const ids = String(q.p || '').split(',').filter(id => P[id]).slice(0, 12), votes = {};
    for (const id of ids) votes[id] = toObj(await redis(`hgetall/tftclimb:votes:${encodeURIComponent(id)}`));
    res.setHeader('Cache-Control', 's-maxage=15, stale-while-revalidate=60');
    res.end(JSON.stringify({votes}));
  } catch (e) {
    res.statusCode = 502; res.setHeader('Cache-Control', 's-maxage=15');
    res.end(JSON.stringify({votes: null}));
  }
};
