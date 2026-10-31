// Hilfsskript für faehigkeiten.ps1 (Fähigkeitssymbole aus dem Unreal-Client von TFT):
//   node faehigkeiten.js da-regex  <set>          → Muster für die Champion-Dateien (DA_…) aus data/tft-data-<set>.js
//   node faehigkeiten.js tex-regex <set> <cache>  → in den entpackten Champion-Dateien den Verweis aufs Fähigkeitssymbol finden, Muster der Texturen ausgeben
//   node faehigkeiten.js png       <set> <cache>  → Texturen dekodieren und nach assets/img/abilities/<api>.png schreiben
const fs = require('fs'), path = require('path'), {texToPng} = require('./tex2png.js');
const ROOT = path.join(__dirname, '..', '..'), [mode, set, cache] = process.argv.slice(2);
global.window = {}; require(path.join(ROOT, 'data', `tft-data-${set}.js`)); const D = window.TFT_DATA;
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const walk = d => fs.existsSync(d) ? fs.readdirSync(d, {withFileTypes: true}).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]) : [];
if (mode === 'da-regex') { console.log(`Set_${set}/Content/Champions/.*/(${D.champions.map(c => esc(c.api)).join('|')})\\.uasset$`); process.exit(0); }

const files = walk(cache), byName = {}; files.forEach(f => { byName[path.basename(f, '.uasset')] = f; });
// Porträt-Varianten (kein Fähigkeitssymbol); bleiben mehrere übrig, gewinnt der Name mit „Spell“/„Ability“
const NOT = /(_Mobile|_PC|_Square|_TeamPlanner_Splash|_TeamPlanner_Portrait|\d\d_Icon|_Icon_?\d*|_Splash.*|_Portrait.*)$/i;
const map = {};
for (const c of D.champions) {
  const f = byName[c.api]; if (!f) continue;
  const s = fs.readFileSync(f).toString('latin1');
  // Pfade hängen im Paket ohne Trenner aneinander („…/T_Draven18_Icon/Set_18/Champions/…“): an jedem „/Set_“, „/Audio_“, „/Character_“, „/Item_“ trennen
  const refs = [...new Set(s.split(/(?=\/(?:Set_|Audio_|Character_|Item_))/).map(x => (x.match(/^\/Set_\d+\/(?:[A-Za-z0-9_]+\/)*T_[A-Za-z0-9_]+/) || [''])[0]).filter(Boolean))];
  let cand = refs.filter(r => !NOT.test(r) && !/\/VFX\/|\/Chrono\/|_Square_|_TeamPlanner/.test(r));
  if (cand.length > 1) { const sp = cand.filter(r => /Spell|Ability/i.test(r)); if (sp.length) cand = sp; }
  if (cand[0]) map[c.api] = cand[0];
}
const texFile = r => r.replace(new RegExp(`^/Set_${set}/`), `Set_${set}/Content/`);
if (mode === 'tex-regex') { console.log('(' + Object.values(map).map(r => esc(texFile(r)) + '\\.uasset').join('|') + ')$'); process.exit(0); }

const OUT = path.join(ROOT, 'assets', 'img', 'abilities'); fs.mkdirSync(OUT, {recursive: true});
let ok = 0; const bad = D.champions.filter(c => !map[c.api]).map(c => c.n + ': kein Symbol');
for (const [api, r] of Object.entries(map)) {
  const f = files.find(x => x.replace(/\\/g, '/').endsWith(texFile(r) + '.uasset'));
  const t = f ? texToPng(f) : {err: 'Datei fehlt'};
  if (t.err) { bad.push(api + ': ' + t.err); continue; }
  fs.writeFileSync(path.join(OUT, api + '.png'), t.png); ok++;
}
console.log(`Fähigkeitssymbole: ${ok} geschrieben nach assets/img/abilities` + (bad.length ? ' · ohne Symbol: ' + bad.join(' ; ') : ''));
