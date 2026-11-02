// Hilfsskript für empfehlungen.ps1 (Riots empfohlene Items und Rollen-Symbole aus dem Unreal-Client von TFT):
//   node empfehlungen.js <set> <cache>
// Im Spiel hängen die empfohlenen Items an der Rolle des Champions: DA_<Champion> → DA_Role_<Rolle> → DA_RecommendedItemsTable_<Rolle>
// (acht Items in Riots Reihenfolge). Schreibt data/rollen-<set>.js (window.TFT_ROLES) und die Rollen-Symbole nach assets/icons/tft/roles/.
const fs = require('fs'), path = require('path'), {texToPng} = require('./tex2png.js');
const ROOT = path.join(__dirname, '..', '..'), [set, cache] = process.argv.slice(2);
global.window = {}; require(path.join(ROOT, 'data', `tft-data-${set}.js`)); const D = window.TFT_DATA;
const walk = d => fs.existsSync(d) ? fs.readdirSync(d, {withFileTypes: true}).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]) : [];
const files = walk(cache), byName = {}; files.forEach(f => { byName[path.basename(f, '.uasset')] = f; });

// Namensliste eines Zen-Pakets (UE5): nach dem Kopf (Länge je nach Engine-Version) Anzahl, Bytes, Hash-Version (0xC1640000), Hashes, Längen (int16 big-endian), Texte
function names(b) {
  let o = [52, 56, 60, 64, 68].find(x => b.readUInt32LE(x + 8) === 0xC1640000 && b.readUInt32LE(x + 12) === 0);
  if (o === undefined) throw new Error('Namensliste nicht gefunden'); const n = b.readUInt32LE(o); o += 16 + n * 8;
  const len = []; for (let i = 0; i < n; i++, o += 2) len.push(b.readInt16BE(o));
  return len.map(l => { const s = l < 0 ? b.toString('utf16le', o, o - l * 2) : b.toString('latin1', o, o + l); o += l < 0 ? -l * 2 : l; return s; });
}
// Verweise auf andere Assets in den Exportdaten, in ihrer Reihenfolge: zwei FNames hintereinander (Paketpfad, Assetname), Pfad endet auf den Namen
function refs(b) {
  const nm = names(b), start = b.readUInt32LE(4), out = [];
  for (let i = start; i + 16 <= b.length; i++) {
    const a = b.readUInt32LE(i), x = b.readUInt32LE(i + 8);
    if (a >= nm.length || x >= nm.length || b.readUInt32LE(i + 4) || b.readUInt32LE(i + 12)) continue;
    if (nm[a].startsWith('/') && nm[a].endsWith('/' + nm[x])) { out.push(nm[x]); i += 15; }
  }
  return out;
}
const strs = f => fs.readFileSync(f).toString('latin1');

// Rollen: DA_Role_<X> → Tabelle und Symbol
const roles = {};
for (const [n, f] of Object.entries(byName)) {
  const m = n.match(/^DA_Role_(\w+)$/); if (!m) continue;
  const s = strs(f), tab = (s.match(/DA_RecommendedItemsTable_\w+?(?=\/|$|DA_|T_)/) || [])[0];
  const items = tab && byName[tab] ? refs(fs.readFileSync(byName[tab])).filter(x => /^DA_/.test(x)) : [];
  // Symbol: Art (Attack/Magic/Hybrid) + Klasse; im Spiel heißt Assassin „Reaper“ und Marksman „Carry“, Varianten wie _Manaless nutzen das Grundsymbol
  const [, kind, cls] = m[1].match(/^(Attack|Magic|Hybrid)([A-Za-z]+)/) || [];
  const icon = kind && `${kind}-${({Assassin: 'Reaper', Marksman: 'Carry'})[cls] || cls}`.toLowerCase();
  roles[m[1]] = {items, ...(icon ? {icon: `assets/icons/tft/roles/${icon}.png`} : {})};
}
// Champions: Verweis auf ihre Rolle in DA_<Champion>
const champs = {}, miss = [];
for (const c of D.champions) {
  const f = byName[c.api], m = f && strs(f).match(/DA_Role_(\w+?)(?=\/|DA_|$|[A-Z][a-z]+Component)/);
  if (m && roles[m[1]]) champs[c.n] = m[1]; else miss.push(c.n);
}
// Rollen-Symbole als PNG
const OUT = path.join(ROOT, 'assets', 'icons', 'tft', 'roles'); fs.mkdirSync(OUT, {recursive: true}); let icons = 0;
for (const r of Object.values(roles)) { if (!r.icon) continue; const t = byName['T_Icon_Role_' + path.basename(r.icon, '.png').split('-').map(w => w[0].toUpperCase() + w.slice(1)).join('')];
  const p = t && texToPng(t); if (p && !p.err) { fs.writeFileSync(path.join(ROOT, r.icon), p.png); icons++; } else delete r.icon; }
fs.writeFileSync(path.join(ROOT, 'data', `rollen-${set}.js`), `// Erzeugt von tools/unreal/empfehlungen.ps1 – Rollen aus dem TFT-Client: je Rolle Riots empfohlene Items (Reihenfolge wie im Spiel) und Symbol,\n// je Champion seine Rolle. Nicht von Hand ändern.\nwindow.TFT_ROLES = ${JSON.stringify({roles, champions: champs}, null, 1)};\n`);
console.log(`Rollen: ${Object.keys(roles).length} (${icons} Symbole) · Champions mit Rolle: ${Object.keys(champs).length}` + (miss.length ? ` · ohne: ${miss.join(', ')}` : '') + ` → data/rollen-${set}.js`);
