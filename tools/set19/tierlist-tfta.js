// Neue Set-19-Comps von TFT Academy in die Tierlist übernehmen (Wunsch CrazYSlayt 19.11.2026): nur Comps, die wir noch nicht haben,
// mit Tier, Spielstil, Schwierigkeit, Aufstellung (Items, Sterne), Carry, Augments, Augment-Prio, Item-Prio und Early-Units wie dort.
// Bestehende Comps (auch alles, was in der Redaktion geändert wurde) bleiben unangetastet.
//   node tools/set19/tierlist-tfta.js <tfta-comps19.json> <Titel1,Titel2,…>   (Titel = die zu übernehmenden Comps)
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const J = JSON.parse(fs.readFileSync(process.argv[2], 'utf8')), want = process.argv[3].split(',').map(s => s.trim());
global.window = {}; require(path.join(ROOT, 'data', 'tft-data-19.js')); const D = window.TFT_DATA;
const byApi = Object.fromEntries(D.champions.map(c => [c.api, c.n]));
const ALIAS = {DA_Seraphine19_Indie: 'Seraphine', DA_19_Ahri: 'Ahri'};   // Varianten-Namen bei TFT Academy
const itemIds = new Set(D.items.map(i => i.id)), augIds = new Set(D.augments.map(a => a.id));
const f = path.join(ROOT, 'tierlist-data-19.js'), src = fs.readFileSync(f, 'utf8'), key = 'window.TIERLIST_DATA = ', a = src.indexOf(key) + key.length, e = src.lastIndexOf(';');
const T = JSON.parse(src.slice(a, e)), miss = [];
const champ = x => { const api = x && (x.apiName || x); const n = ALIAS[api] || byApi[api]; if (!n) miss.push('Champion ' + api); return n; };
const items = l => (l || []).map(x => x.apiName || x).filter(id => { if (itemIds.has(id)) return true; miss.push('Item ' + id); return false; });
const slug = t => 'set-19-' + t.toLowerCase().replace(/&/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const ORDER = 'SABCX';
let added = 0;
for (const t of want) {
  const g = J.guides.find(x => x.title === t); if (!g) { console.log('nicht gefunden:', t); continue; }
  if (T.comps.some(c => c.slug === slug(t))) { console.log('schon da:', t); continue; }
  const board = g.finalComp.map(u => { const n = champ(u); if (!n) return null; const b = {u: n, h: +u.boardIndex}; const it = items(u.items); if (it.length) b.i = it; if (u.stars > 1) b.s = u.stars; return b; }).filter(Boolean);
  const early = (g.earlyComp || []).map(u => { const n = champ(u); if (!n) return null; const b = {u: n, h: +(u.boardIndex || 0)}; const it = items(u.items); if (it.length) b.i = it; return b; }).filter(Boolean);
  const carry = champ(g.mainChampion) || (board.slice().sort((x, y) => (y.i || []).length - (x.i || []).length)[0] || {}).u || '';
  const augs = (g.augments || []).filter(x => !x.disabled).map(x => x.apiName).filter(id => { if (augIds.has(id)) return true; miss.push('Augment ' + id); return false; });
  const c = {slug: slug(t), name: t, tier: String(g.tier || 'B').toUpperCase(), style: g.style || '4-Cost Fast 8', diff: String(g.difficulty || 'MEDIUM').toUpperCase(),
    main: 1, sticker: 0, sub: '', carry, board, early, alt: [], cap: [], carousel: items(g.carousel), augs, augTypes: (g.augmentTypes || []).filter(Boolean), hidden: false};
  if (c.tier === 'X') c.sub = 'B';
  // hinter die letzte Comp desselben Tiers einsortieren (sonst ans Ende)
  let at = -1; T.comps.forEach((x, i) => { if (x.tier === c.tier && x.main && !x.hidden) at = i; });
  if (at < 0) at = T.comps.findIndex(x => ORDER.indexOf(x.tier) > ORDER.indexOf(c.tier)) - 1;
  T.comps.splice(at < -1 ? T.comps.length : at + 1, 0, c); added++;
  console.log(`+ ${c.tier} ${t} (${c.style}, Carry ${carry}, ${board.length} Units, ${augs.length} Augments, Item-Prio ${c.carousel.length})`);
}
fs.writeFileSync(f, src.slice(0, a) + JSON.stringify(T) + src.slice(e));
console.log('übernommen:', added, '· Comps jetzt:', T.comps.length); if (miss.length) console.log('nicht zugeordnet:', [...new Set(miss)].join(', '));
