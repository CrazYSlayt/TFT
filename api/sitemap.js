// Climb TFT – Sitemap für Suchmaschinen unter /sitemap.xml (Weiterleitung in vercel.json).
// Nimmt die Domain, unter der die Seite gerade aufgerufen wird, und listet jede Seite auf Deutsch und Englisch.
const fs = require('fs');
const path = require('path');

const PAGES = [
  ['/', 1.0, 'daily'],
  ['/tierlist', 0.9, 'daily'], ['/tierlist/items', 0.8, 'weekly'], ['/tierlist/augments', 0.8, 'weekly'], ['/tierlist/holds', 0.7, 'weekly'],
  ['/tools', 0.8, 'weekly'], ['/tools/rolldown', 0.8, 'monthly'], ['/tools/dps', 0.8, 'monthly'], ['/tools/drops', 0.7, 'monthly'],
  ['/tools/tierlist', 0.7, 'monthly'], ['/tools/simulator', 0.7, 'monthly'], ['/builder', 0.7, 'monthly'],
  ['/bibliothek', 0.7, 'weekly'], ['/bibliothek/items', 0.7, 'weekly'], ['/bibliothek/traits', 0.7, 'weekly'],
  ['/ranks', 0.6, 'monthly'],
  ...['iron', 'bronze', 'silver', 'gold', 'platinum', 'emerald', 'diamond', 'master', 'grandmaster', 'challenger'].map(k => ['/ranks/' + k, 0.4, 'monthly']),
  ['/patches', 0.7, 'weekly'],
  ['/guides/encounters', 0.7, 'weekly'], ['/cheatsheet', 0.8, 'weekly'],
  ...['shop', 'augments', 'encounters', 'carousel', 'damage', 'orbs', 'loot', 'gold-subscription', 'reroll-subscription', 'emblems', 'solo'].map(k => ['/cheatsheet/' + k, 0.6, 'weekly']),
  ['/coaching', 0.7, 'monthly'], ['/apply', 0.5, 'yearly'],
  ['/about', 0.4, 'monthly'], ['/about/crazyslayt', 0.4, 'monthly'], ['/about/humbadobo', 0.4, 'monthly'],
  ['/impressum', 0.1, 'yearly'], ['/datenschutz', 0.1, 'yearly'], ['/bedingungen', 0.1, 'yearly'],
];

// Patch-Seiten aus data/patches.js (wird vom Update-Skript gepflegt)
function patches(){
  try {
    const txt = fs.readFileSync(path.join(process.cwd(), 'data', 'patches.js'), 'utf8');
    const list = JSON.parse(txt.slice(txt.indexOf('['), txt.lastIndexOf(']') + 1));
    return list.map(p => ['/patches/' + String(p.id).replace('.', '-'), 0.5, 'monthly', p.date]);
  } catch (e) { return []; }
}

// Champion-Seiten des Live-Sets (data/sets.js → data/tft-data-<Set>.js), Adresse wie in app.js (champSlug)
function champions(){
  try {
    const dir = path.join(process.cwd(), 'data');
    const sets = fs.readFileSync(path.join(dir, 'sets.js'), 'utf8');
    const list = JSON.parse(sets.slice(sets.indexOf('['), sets.lastIndexOf(']') + 1));
    const live = list.find(s => s.status === 'live') || list[0];
    const all = fs.readFileSync(path.join(dir, live.file), 'utf8');
    const start = all.indexOf('champions:['), end = all.indexOf('traits:[', start);
    const txt = all.slice(start, end > start ? end : undefined);   // nur der Champion-Abschnitt (danach kommen die Traits)
    const names = [...txt.matchAll(/^\{"api":"[^"]*","n":"([^"]+)"/gm)].map(m => m[1]);
    const slug = n => n.toLowerCase().replace(/['’.]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    return [...new Set(names.map(slug))].map(s => ['/champions/' + s, 0.6, 'weekly', live.generated]);
  } catch (e) { return []; }
}

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

module.exports = (req, res) => {
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost';
  const base = (req.headers['x-forwarded-proto'] || 'https') + '://' + host;
  const urls = [...PAGES, ...champions(), ...patches()].map(([p, prio, freq, date]) => {
    const de = base + p, en = base + (p === '/' ? '/en/' : '/en' + p);
    const alt = `<xhtml:link rel="alternate" hreflang="de" href="${esc(de)}"/><xhtml:link rel="alternate" hreflang="en" href="${esc(en)}"/><xhtml:link rel="alternate" hreflang="x-default" href="${esc(de)}"/>`;
    const meta = `${date ? `<lastmod>${date}</lastmod>` : ''}<changefreq>${freq}</changefreq>`;
    return `<url><loc>${esc(de)}</loc>${meta}<priority>${prio.toFixed(1)}</priority>${alt}</url>`
      + `<url><loc>${esc(en)}</loc>${meta}<priority>${Math.max(0.1, prio - 0.1).toFixed(1)}</priority>${alt}</url>`;
  });
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=86400');
  res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join('\n')}\n</urlset>\n`);
};
