// TFTClimb – Sitemap für Suchmaschinen unter /sitemap.xml (Weiterleitung in vercel.json).
// Listet jede Seite auf Deutsch und Englisch, unter der Domain, über die die Sitemap abgerufen wird.
const fs = require('fs');
const path = require('path');

// Sprechende Adressen mit Keyword – gleiche Liste wie in assets/js/app.js (TOOL_SLUG, CS_SLUG, BUILDER_PATH)
const TOOL_SLUG = {rolldown: 'tft-rolldown-rechner', drops: 'tft-item-drop-chance', tierlist: 'tft-tierlist-maker', simulator: 'tft-kampf-simulator', dps: 'tft-dps-rechner', augments: 'tft-augment-chancen'};
const CS_SLUG = {shop: 'tft-shop-odds', power: 'tft-hierarchy-of-power', augments: 'tft-augment-stufen', orbs: 'tft-loot-orbs', loot: 'tft-loot-verteilung', damage: 'tft-spielerschaden', emblems: 'tft-embleme', solo: 'tft-stage-1-solo', 'patch-schedule': 'tft-patch-plan', carousel: 'tft-karussell'};
const csPath = id => '/cheatsheet/' + (CS_SLUG[id] || 'tft-' + id);
// Englische Adressen – gleiche Tabellen wie in app.js (TOOL_SLUG_EN, CS_SLUG_EN, PAGE_EN, langPath)
const TOOL_SLUG_EN = {rolldown: 'tft-rolldown-calculator', drops: 'tft-item-drop-odds', tierlist: 'tft-tier-list-maker', simulator: 'tft-battle-simulator', dps: 'tft-dps-calculator', augments: 'tft-augment-odds'};
const CS_SLUG_EN = {shop: 'tft-shop-odds', power: 'tft-hierarchy-of-power', augments: 'tft-augment-tiers', orbs: 'tft-loot-orbs', loot: 'tft-loot-distribution', damage: 'tft-player-damage', emblems: 'tft-emblems', solo: 'tft-solo-stage-1', 'patch-schedule': 'tft-patch-schedule', carousel: 'tft-carousel'};
const PAGE_EN = {tierlist: 'tier-list', bibliothek: 'library', impressum: 'legal-notice', datenschutz: 'privacy-policy', bedingungen: 'terms', 'tft-patch-countdown': 'tft-next-patch-countdown'};
const keyOf = (map, slug) => (Object.entries(map).find(([, v]) => v === slug) || [slug])[0];
function enPath(p) {
  if (p === '/') return '/en/';
  const s = p.split('/');
  if (s[1] === 'tools' && s[2]) { const k = keyOf(TOOL_SLUG, s[2]); if (TOOL_SLUG_EN[k]) s[2] = TOOL_SLUG_EN[k]; }
  if (s[1] === 'cheatsheet' && s[2]) { const k = keyOf(CS_SLUG, s[2]); s[2] = CS_SLUG_EN[k] || (k !== s[2] ? 'tft-' + k : s[2]); }
  if (PAGE_EN[s[1]]) s[1] = PAGE_EN[s[1]];
  return '/en' + s.join('/');
}

const PAGES = [
  '/',
  '/tierlist', '/tierlist/items', '/tierlist/augments', '/tierlist/holds',
  '/tools', ...Object.values(TOOL_SLUG).map(s => '/tools/' + s), '/tft-team-builder',
  '/bibliothek', '/bibliothek/items', '/bibliothek/traits',
  '/ranks',
  ...['iron', 'bronze', 'silver', 'gold', 'platinum', 'emerald', 'diamond', 'master', 'grandmaster', 'challenger'].map(k => '/ranks/' + k),
  '/patches', '/tft-patch-countdown',
  '/cheatsheet',
  ...['shop', 'power', 'augments', 'encounters', 'damage', 'orbs', 'loot', 'gold-subscription', 'reroll-subscription', 'emblems', 'solo'].map(csPath),
  // Augment-Tabellen (ids wie in data/custom-<Set>.js → cheats.augTables)
  ...['trait-ladder', 'we-stick-together', 'loaded-dice', 'blossoms-call', 'expedition', 'booster-pack', 'frontline-foundation', 'backline-blueprint', 'warpath',
    'slightly-magic-roll', 'magic-roll', 'expected-unexpectedness', 'call-to-chaos', 'golden-egg', 'missed-connections', 'slice-of-life', 'hard-commit', 'solo-leveling'].map(csPath),
  // Attribut-Tabellen und Patch-Plan (cheats.traitTables / patchSchedule)
  ...['prismatic-traits', 'coven', 'riftbeast', 'blackthorn', 'fae', 'primal', 'avatar-lux', 'sprykin', 'patch-schedule'].map(csPath),
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

// Comp-Seiten aus der veröffentlichten Tierlist des Live-Sets (tierlist-data-<Set>.js), Adresse wie in app.js (compHref)
function compPages(){
  try {
    const sets = fs.readFileSync(path.join(process.cwd(), 'data', 'sets.js'), 'utf8');
    const list = JSON.parse(sets.slice(sets.indexOf('['), sets.lastIndexOf(']') + 1));
    const live = list.find(s => s.status === 'live') || list[0];
    const txt = fs.readFileSync(path.join(process.cwd(), 'tierlist-data-' + live.set + '.js'), 'utf8');
    const data = JSON.parse(txt.slice(txt.indexOf('{'), txt.lastIndexOf('}') + 1));
    const slug = n => String(n || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/['’.]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const seen = new Set();
    return (data.comps || []).filter(c => !c.hidden).map(c => { const base = slug(c.name) || 'comp'; let k = base, n = 2; while (seen.has(k)) k = base + '-' + n++; seen.add(k); return '/comps/' + k; });
  } catch (e) { return []; }
}

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

// Änderungsdatum: Seiten, die aus den Spieldaten entstehen (Tools, Cheatsheets, Champions), ändern sich mit jedem Daten-Update;
// Patch-Seiten tragen ihr Patch-Datum. Andere Seiten bekommen kein Datum (lieber keins als ein falsches – Google nutzt es nur, wenn es stimmt)
function lastmods(){
  const out = {};
  try {
    const sets = fs.readFileSync(path.join(process.cwd(), 'data', 'sets.js'), 'utf8');
    const live = JSON.parse(sets.slice(sets.indexOf('['), sets.lastIndexOf(']') + 1)).find(s => s.status === 'live');
    if (live && live.generated) out.data = live.generated;
    const txt = fs.readFileSync(path.join(process.cwd(), 'data', 'patches.js'), 'utf8');
    JSON.parse(txt.slice(txt.indexOf('['), txt.lastIndexOf(']') + 1)).forEach(p => { if (p.date) out['/patches/' + String(p.id).replace('.', '-')] = p.date; });
  } catch (e) {}
  return out;
}
const modOf = (p, lm) => lm[p] || (/^\/(tools\/|cheatsheet|champions\/)/.test(p) ? lm.data : '');
// Vorschaubilder (1200 × 630) aus den Kopfdaten der Seiten (data/seo-meta.json) – als Bild-Angabe in der Sitemap
function ogImages(){
  try { const pages = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'seo-meta.json'), 'utf8')).pages || {}; const out = {};
    Object.entries(pages).forEach(([p, m]) => { if (m.img && /\/assets\/og\//.test(m.img)) out[p] = m.img; }); return out; } catch (e) { return {}; }
}

// Erst alle deutschen, dann alle englischen Seiten. Jeder Eintrag nennt beide Sprachfassungen (hreflang) –
// so ordnet Google die deutsche und die englische Seite einander zu (zusätzlich zu den Verweisen im Kopf jeder Seite, app.js).
module.exports = (req, res) => {
  let host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost';
  if (host === 'tftclimb.com') host = 'www.tftclimb.com';   // immer die kanonische Domain
  const base = (req.headers['x-forwarded-proto'] || 'https') + '://' + host;
  const paths = [...PAGES, ...compPages(), ...champions(), ...patches()];
  const alt = p => ['de', p, 'en', enPath(p), 'x-default', p].reduce((s, v, i, a) => i % 2 ? s : s + `\n    <xhtml:link rel="alternate" hreflang="${v}" href="${esc(base + a[i + 1])}"/>`, '');
  const lm = lastmods(), img = ogImages();
  const entry = (loc, p) => { const d = modOf(p, lm), im = img[loc];
    return `  <url><loc>${esc(base + loc)}</loc>${d ? `<lastmod>${esc(d)}</lastmod>` : ''}${alt(p)}${im ? `\n    <image:image><image:loc>${esc(/^https?:/.test(im) ? im : base + im)}</image:loc></image:image>` : ''}\n  </url>`; };
  const urls = [...paths.map(p => entry(p, p)), ...paths.map(p => entry(enPath(p), p))];
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=86400');
  res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${urls.join('\n')}\n</urlset>\n`);
};
