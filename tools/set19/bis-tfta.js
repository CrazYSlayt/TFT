// Beste Items (BIS) je Champion von TFT Academy (Tier X „EVERY N COST BIS“) in data/custom-19.js → itemBuilds übernehmen (Wunsch CrazYSlayt 20.11.2026).
// Bestehende Einträge (z. B. die 4-Kosten-Vorlage von CrazYSlayt) bleiben, neu kommen nur Champions ohne Eintrag dazu.
//   Invoke-WebRequest https://tftacademy.com/api/tierlist/comps?set=19 -OutFile tfta.json ; node tools/set19/bis-tfta.js tfta.json
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const J = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
global.window = {}; require(path.join(ROOT, 'data', 'tft-data-19.js')); const D = window.TFT_DATA;
const byApi = Object.fromEntries(D.champions.map(c => [c.api, c.n])), itemEn = Object.fromEntries(D.items.map(i => [i.id, i.en]));
const ALIAS = {DA_Seraphine19_Indie: 'Seraphine', DA_19_Ahri: 'Ahri'};
const f = path.join(ROOT, 'data', 'custom-19.js'); let src = fs.readFileSync(f, 'utf8');
const a = src.indexOf('itemBuilds: {'), e = src.indexOf('\n  },', a);
const have = new Set([...src.slice(a, e).matchAll(/(?:'([^']+)'|"([^"]+)"):\s*\[/g)].map(m => m[1] || m[2]));
const add = {}, miss = [];
for (const g of J.guides.filter(g => /EVERY \d COST BIS/i.test(g.title))) for (const u of g.finalComp) {
  const n = ALIAS[u.apiName] || byApi[u.apiName]; if (!n) { miss.push(u.apiName); continue; }
  const its = (u.items || []).map(x => x.apiName || x).map(id => itemEn[id] || (miss.push(id), null)).filter(Boolean);
  if (its.length && !have.has(n) && !add[n]) add[n] = its;
}
const q = s => /'/.test(s) ? JSON.stringify(s) : `'${s}'`;
const ent = Object.entries(add).sort((x, y) => (byApi[0], D.champions.find(c => c.n === x[0]).c - D.champions.find(c => c.n === y[0]).c) || x[0].localeCompare(y[0]));
if (ent.length) {
  const lines = []; for (let i = 0; i < ent.length; i += 2) lines.push('    ' + ent.slice(i, i + 2).map(([n, l]) => `${q(n)}: [${l.map(q).join(', ')}]`).join(', '));
  src = src.slice(0, e) + ',\n    // TFT Academy „Every N Cost BIS“ (PBE, 20.11.2026)\n' + lines.join(',\n') + src.slice(e);
  fs.writeFileSync(f, src);
}
console.log('neu:', ent.length, '· schon da:', have.size, miss.length ? '· nicht zugeordnet: ' + [...new Set(miss)].join(', ') : '');
