// Erste Set-19-Tierlist aus den 13 Comps von mobalytics.gg (Wunsch CrazYSlayt 18.11.2026): Aufstellung, Items, Tier, Spielstil,
// Schwierigkeit, Augment-Vorschläge. Danach pflegt die Redaktion (/admin) die Tierlist wie gewohnt weiter.
//   node tools/set19/tierlist-moba.js <moba-comps.json> <moba-comps.html>   → tierlist-data-19.js
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const comps = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const html = fs.readFileSync(process.argv[3], 'utf8');
global.window = {}; require(path.join(ROOT, 'data', 'tft-data-19.js')); const D = window.TFT_DATA;
const norm = s => String(s || '').toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]/g, '');
const champBy = new Map(D.champions.map(c => [norm(c.n), c]));
const itemBy = new Map(D.items.map(i => [norm(i.en), i]));
// Augments: Name normalisiert, römische Stufen als Ziffern („Trade Sector II“ = trade-sector2)
const roman = s => s.replace(/\biii\b/gi, '3').replace(/\bii\b/gi, '2').replace(/\bi\b/gi, '1');
const augBy = new Map(D.augments.map(a => [norm(roman(a.en)), a]));
// Mobalytics-Guides (Augments je Comp) aus __PRELOADED_STATE__
const i0 = html.indexOf('window.__PRELOADED_STATE__'), a0 = html.indexOf('{', i0);
let dep = 0, e = a0; for (; e < html.length; e++) { const ch = html[e]; if (ch === '"') { e++; while (html[e] !== '"') { if (html[e] === '\\') e++; e++; } continue; } if (ch === '{') dep++; else if (ch === '}') { dep--; if (!dep) break; } }
const st = JSON.parse(html.slice(a0, e + 1)), guides = {};
const walk = o => { if (!o || typeof o !== 'object') return; if (o.__typename === 'TftCompositionGuide' && o.compositionId) guides[o.compositionId] = o; Object.values(o).forEach(walk); }; walk(st);
const STYLE = {'fast-8': '4-Cost Fast 8', 'fast-9': 'Fast 9', '5-slow-roll': '1-Cost Reroll', '6-slow-roll': '2-Cost Reroll', '7-slow-roll': '3-Cost Reroll', 'lose-streak': 'Lose Streak'};
const AUGTYPES = {'4-Cost Fast 8': ['ITEMS', 'ECON', 'COMBAT'], 'Fast 9': ['ECON', 'ITEMS', 'COMBAT'], '1-Cost Reroll': ['ITEMS', 'ECON', 'COMBAT'], '2-Cost Reroll': ['ECON', 'ITEMS', 'COMBAT'], '3-Cost Reroll': ['ITEMS', 'ECON', 'COMBAT'], 'Lose Streak': ['ECON', 'ITEMS', 'COMBAT']};
const miss = [];
const champ = (slug, compName) => {
  if (slug === 'akali') return /true ?damage/i.test(compName) ? 'Akali (True Damage)' : 'Akali (K/DA)';
  const c = champBy.get(norm(slug)) || [...champBy.values()].find(x => norm(x.n).startsWith(norm(slug))); if (!c) miss.push('Champion ' + slug); return c ? c.n : slug;
};
// Mobalytics nutzt für zwei Items alte Namen: Steadfast Hammer = Steadfast Heart, Guardbreaker = Striker's Flail
const ITEM_ALIAS = {'steadfast-hammer': 'steadfast-heart', 'guardbreaker': 'strikers-flail'};
const item = slug0 => { const slug = ITEM_ALIAS[slug0] || slug0, k = norm(slug.replace(/\d+$/, '')); const it = itemBy.get(k) || itemBy.get(norm(slug)); if (!it) miss.push('Item ' + slug); return it ? it.id : null; };
const augBy2 = new Map(D.augments.map(a => [norm(a.en), a]));
// Mobalytics hängt Varianten-Ziffern an (trade-sector2, pandora-s-items1): mit und ohne Ziffer, römische Stufen als Ziffern vergleichen
const aug = x => { const base = x.replace(/-/g, ' '), cands = [base, base.replace(/\s*\d+$/, ''), base.replace(/(\d)$/, ' $1'), base.replace(/\s+i+$/i, '')];
  let a = null; for (const c of cands) { a = augBy.get(norm(roman(c))) || augBy2.get(norm(c)) || augBy2.get(norm(c) + 'i') || augBy.get(norm(roman(c)) + '1'); if (a) break; }
  if (!a) miss.push('Augment ' + x); return a ? a.id : null; };
const out = comps.map(c => {
  const style = STYLE[c.playstyle] || '4-Cost Fast 8';
  const board = c.formation.positions.filter(p => p.champion).map(p => { const b = {u: champ(p.champion.champion.slug, c.name), h: +p.coordinates - 1};
    const its = (p.champion.items || []).map(x => item(x.slug)).filter(Boolean); if (its.length) b.i = its; if (p.champion.level === 3) b.s = 3; return b; });
  const cost = u => (D.champions.find(x => x.n === u) || {c: 0}).c;
  const carry = [...board].sort((a, b) => (b.i || []).length - (a.i || []).length || cost(b.u) - cost(a.u))[0];
  const g = guides[(c.guide && c.guide.__ref || '').match(/compositionId\\?":\\?"([^"\\]+)/)?.[1]] || Object.values(guides).find(x => c.id && x.compositionId === c.id);
  const augs = g && g.augments ? g.augments.augments.map(x => aug(x.slug)).filter(Boolean) : [];
  return {slug: 'set-19-' + c.name.toLowerCase().replace(/&/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''), name: c.name, tier: String(c.tier || 'B').toUpperCase(), style,
    diff: String(c.difficulty || 'medium').toUpperCase(), main: 1, sticker: 0, sub: '', carry: carry ? carry.u : '', board, early: [], alt: [], cap: [],
    carousel: carry && carry.i ? carry.i.slice() : [], augs, augTypes: AUGTYPES[style], hidden: false};
});
const today = new Date().toISOString().slice(0, 10);
const data = {version: 1, set: 19, patch: '19.1', updated: today, source: 'TFTClimb', basedOn: 'Mobalytics', comps: out, itemTL: {}, augTL: {}, holdTL: {}, encTL: {}, rev: 1};
fs.writeFileSync(path.join(ROOT, 'tierlist-data-19.js'), `// TFTClimb – Tierlist-Daten Set 19: erste Fassung aus den Comps von mobalytics.gg (tools/set19/tierlist-moba.js, ${today}).\n// Ab jetzt über die Redaktion (/admin) pflegen – „Speichern“ schreibt diese Datei neu.\nwindow.TIERLIST_DATA = ${JSON.stringify(data)};\n`);
console.log(`Comps: ${out.length} · ` + out.map(c => `${c.name} (${c.tier}, ${c.style}, Carry ${c.carry}, ${c.board.length} Units, ${c.augs.length} Augments)`).join(' | '));
if (miss.length) console.log('Nicht zugeordnet: ' + [...new Set(miss)].join(', '));
