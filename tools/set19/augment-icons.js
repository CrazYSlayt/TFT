// Symbole der neuen Set-19-Augments aus dem PBE-Client: Augment-Paket (DA_…) → verwiesene Textur (T_AugmentIcon…) → PNG.
// Vorher entpacken (C:\t19aug): Muster aus „node augment-icons.js muster“ mit [IoExtract]::Run (siehe LIESMICH.md).
//   node tools/set19/augment-icons.js muster   → Regex der Augment-Pakete und aller T_AugmentIcon-Texturen (inkl. .ubulk)
//   node tools/set19/augment-icons.js png      → C:\t19augpng\<id>.png + Liste
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..', '..'), SRC = 'C:/t19aug', OUT = 'C:/t19augpng';
const {texToPng} = require(path.join(ROOT, 'tools', 'unreal', 'tex2png.js'));
const B = require('./basis-texte.json');
global.window = {}; require(path.join(ROOT, 'data', 'tft-data-18.js')); const A18 = window.TFT_DATA.augments;
// „alt“ nur mit echtem Symbol aus Set 18 – Set-18-Augments mit Platzhalter (missing-t…) holen ihr Symbol auch aus dem Client
const A18ok = A18.filter(a => !/missing-t/.test(a.icon || '')), old = new Set(A18ok.map(a => a.id)), oldName = new Set(A18ok.map(a => a.en.toLowerCase()));
const neu = Object.entries(B.augments.en).filter(([id, a]) => !old.has(id) && !oldName.has(a.name.toLowerCase())).map(([id]) => id);
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
if (process.argv[2] === 'muster') { console.log(`/(${neu.map(esc).join('|')}|T_AugmentIcon[^/]*)\\.(uasset|ubulk)$`); process.exit(0); }
const walk = d => fs.existsSync(d) ? fs.readdirSync(d, {withFileTypes: true}).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]) : [];
// C:\t19aug2/3: nachgeladene Pakete (Augment_Shared, Item_Shared)
const files = [SRC, SRC + '2', SRC + '3'].flatMap(d => walk(d)), byName = {}; files.filter(f => f.endsWith('.uasset')).forEach(f => { byName[path.basename(f, '.uasset')] = f; });
fs.mkdirSync(OUT, {recursive: true});
let ok = 0; const miss = [];
const TEX = Object.keys(byName).filter(n => /^T_AugmentIcon/i.test(n));   // manche Texturen sind klein geschrieben (t_augmenticon_blindbox)
for (const id of neu) {
  const da = byName[id]; if (!da) { miss.push(id + ' (kein Paket)'); continue; }
  const s = fs.readFileSync(da).toString('latin1');
  // Namen stehen im Paket ohne Trenner aneinander – deshalb: welche bekannten Texturnamen kommen als Text vor?
  let refs = TEX.filter(r => s.includes('/' + r) || s.includes(r));
  if (!refs.length) refs = TEX.filter(r => s.includes(r.replace(/_\d+$/, '')));   // Datei heißt …_2, Paket verweist ohne Ziffer (Weight The Worth)
  // mehrere Verweise: den längsten Namen nehmen (spezifischer als z. B. „T_AugmentIcon_arcanist_crown“ für alle Stufen)
  const r = refs.sort((a, b) => b.length - a.length)[0];
  if (!r) { const p = (s.match(/\/[A-Za-z0-9_]+(?:\/[A-Za-z0-9_]+)*\/T_AugmentIcon[A-Za-z0-9_]*/gi) || []).map(x => x.replace(/^.*?(\/[A-Za-z0-9_]+\/[A-Za-z0-9_\/]*T_AugmentIcon)/i, '$1')); miss.push(id + ' (keine Textur' + (p.length ? ': ' + [...new Set(p)].join(' ') : '') + ')'); continue; }
  const t = texToPng(byName[r]); if (t.err) { miss.push(id + ': ' + t.err); continue; }
  fs.writeFileSync(path.join(OUT, id + '.png'), t.png); ok++;
}
console.log(`neue Augments: ${neu.length} · Symbole: ${ok}` + (miss.length ? `\nohne: ${miss.join(', ')}` : ''));
