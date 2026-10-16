// Climb TFT – LP-Grenzen für Challenger und Großmeister, live von der tactics.tools-Bestenliste.
// Läuft als Vercel-Funktion unter /api/cutoffs. Vercel speichert die Antwort 30 Minuten zwischen,
// damit tactics.tools höchstens ein paar Mal pro Stunde abgefragt wird.
const REGIONS = ['euw', 'eune', 'na', 'kr'];
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36 ClimbTFT';
const RE = /Cutoffs<\/div>[\s\S]*?challenger_solo[^>]*>\s*<div>([\d.,]+)\s*LP<\/div>[\s\S]*?grandmaster_solo[^>]*>\s*<div>([\d.,]+)\s*LP<\/div>/;

async function region(r){
  const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), 8000);
  try {
    const res = await fetch(`https://tactics.tools/leaderboards/${r}`, {headers: {'user-agent': UA}, signal: ctl.signal});
    if (!res.ok) return null;
    const m = RE.exec(await res.text());
    return m ? {ch: parseInt(m[1].replace(/\D/g, ''), 10), gm: parseInt(m[2].replace(/\D/g, ''), 10)} : null;
  } catch (e) { return null; } finally { clearTimeout(timer); }
}

module.exports = async (req, res) => {
  const vals = await Promise.all(REGIONS.map(region));
  const regions = {};
  REGIONS.forEach((r, i) => { if (vals[i]) regions[r] = vals[i]; });
  const ok = Object.keys(regions).length > 0;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  // Erfolg: 30 Min. zwischenspeichern; Fehler nur kurz, damit es bald erneut versucht wird
  res.setHeader('Cache-Control', ok ? 's-maxage=1800, stale-while-revalidate=3600' : 's-maxage=60');
  res.statusCode = ok ? 200 : 502;
  res.end(JSON.stringify({source: 'tactics.tools', url: 'https://tactics.tools/leaderboards/euw', checked: new Date().toISOString(), regions}));
};
