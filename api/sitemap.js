// TFTClimb – Sitemap für Suchmaschinen unter /sitemap.xml (Weiterleitung in vercel.json).
// Listet jede Seite auf Deutsch und Englisch, unter der Domain, über die die Sitemap abgerufen wird.
const fs = require('fs');
const path = require('path');

const PAGES = [
  '/',
  '/tierlist', '/tierlist/items', '/tierlist/augments', '/tierlist/holds',
  '/tools', '/tools/rolldown', '/tools/dps', '/tools/drops',
  '/tools/tierlist', '/tools/simulator', '/builder',
  '/bibliothek', '/bibliothek/items', '/bibliothek/traits',
  '/ranks',
  ...['iron', 'bronze', 'silver', 'gold', 'platinum', 'emerald', 'diamond', 'master', 'grandmaster', 'challenger'].map(k => '/ranks/' + k),
  '/patches',
  '/cheatsheet',
  ...['shop', 'augments', 'encounters', 'damage', 'orbs', 'loot', 'gold-subscription', 'reroll-subscription', 'emblems', 'solo'].map(k => '/cheatsheet/' + k),
  // Augment-Tabellen (ids wie in data/custom-<Set>.js → cheats.augTables)
  ...['trait-ladder', 'we-stick-together', 'loaded-dice', 'blossoms-call', 'expedition', 'booster-pack', 'frontline-foundation', 'backline-blueprint', 'warpath',
    'slightly-magic-roll', 'magic-roll', 'expected-unexpectedness', 'call-to-chaos', 'golden-egg', 'missed-connections', 'slice-of-life', 'hard-commit', 'solo-leveling'].map(k => '/cheatsheet/' + k),
  // Attribut-Tabellen und Patch-Plan (cheats.traitTables / patchSchedule)
  ...['prismatic-traits', 'coven', 'riftbeast', 'blackthorn', 'fae', 'primal', 'avatar-lux', 'sprykin', 'patch-schedule'].map(k => '/cheatsheet/' + k),
  '/coaching', '/apply',
  '/about', '/about/crazyslayt', '/about/humbadobo',
  '/impressum', '/datenschutz', '/bedingungen',
];

// Patch-Seiten aus data/patches.js (wird vom Update-Skript gepflegt)
function patches(){
  try {
    const txt = fs.readFileSync(path.join(process.cwd(), 'data', 'patches.js'), 'utf8');
    const list = JSON.parse(txt.slice(txt.indexOf('['), txt.lastIndexOf(']') + 1));
    return list.map(p => '/patches/' + String(p.id).replace('.', '-'));
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
    return [...new Set(names.map(slug))].map(s => '/champions/' + s);
  } catch (e) { return []; }
}

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

// Schlicht wie üblich: nur die Adressen, erst alle deutschen, dann alle englischen Seiten.
// Die Sprachverweise (hreflang) stehen im Kopf jeder Seite (app.js), Priorität/Häufigkeit wertet Google nicht mehr aus.
module.exports = (req, res) => {
  let host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost';
  if (host === 'tftclimb.com') host = 'www.tftclimb.com';   // immer die kanonische Domain
  const base = (req.headers['x-forwarded-proto'] || 'https') + '://' + host;
  const paths = [...PAGES, ...champions(), ...patches()];
  const urls = [...paths.map(p => base + p), ...paths.map(p => base + (p === '/' ? '/en/' : '/en' + p))];
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=86400');
  res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u => `  <url><loc>${esc(u)}</loc></url>`).join('\n')}\n</urlset>\n`);
};
