// Riots PBE-Rundown: OCR-Zeilen der Standbilder (D:\Tools\video\set19\stops2\*.json, tools/set19/video-ocr.ps1) zu Tabellen zusammensetzen.
// Datenbrowser des Test-Clients, Spalten fest (1920 px breit):
//   Champions: Nr | Name 140–270 | Kosten | Origin 330–510 | Klasse 1 510–690 | Klasse 2 690–870 | Fähigkeit 960–1160 | Mana 1160–1235 | Text 1235–1640 | Leben | Resistenzen | AD | Tempo
//   Traits:    Nr | Name 140–300 | Typ 300–400 | Stufen 400–520 | Text 625–1035 | Champions
// Rechts unten liegt die Webcam (x > 1575, y > 820) – Zeilen dort sind abgeschnitten; je Champion/Trait zählt die vollständigste Fassung.
//   node tools/set19/video-parse.js   → tools/set19/video-daten.json
const fs = require('fs'), path = require('path');
const DIR = 'D:/Tools/video/set19/stops2';
const files = fs.readdirSync(DIR).filter(f => f.endsWith('.json')).sort();
const clean = s => s.replace(/\s+/g, ' ')
  .replace(/(\d+(?:\.\d+)?%?)\s*\(\s*[^()\s]{0,3}\s*\)?/g, '$1')       // Zahl + Skalierungs-Symbol „(A“, „(4)“, „W)“ → Zahl
  .replace(/\b(\d) (\d{2,3})\b/g, '$1$2')                              // „1 30“ → „130“ (Ziffern auseinandergerissen)
  .replace(/\s+([,.;:)])/g, '$1').replace(/\(\s+/g, '(').trim();
const champs = {}, traits = {};
for (const f of files) {
  let lines; try { lines = JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8').replace(/^\uFEFF/, '')); } catch (e) { continue; }
  if (!Array.isArray(lines)) lines = [lines];
  const has = t => lines.some(l => l.t === t || l.t.startsWith(t));
  const mode = lines.some(l => /^Breakpoints/.test(l.t)) ? 'traits' : lines.some(l => /^Class 1/.test(l.t)) ? 'champs' : null;
  if (!mode) continue;
  // Zeilennummern links (Spalte x < 60, nur Ziffern) = Zeilenmitte
  const nums = lines.filter(l => l.x < 60 && /^\d{1,3}$/.test(l.t) && l.y > 150).sort((a, b) => a.y - b.y);
  if (!nums.length) continue;
  const rows = nums.map((n, i) => ({n: +n.t, top: i ? (nums[i - 1].y + n.y) / 2 : n.y - 70, bot: i < nums.length - 1 ? (n.y + nums[i + 1].y) / 2 : n.y + 70, y: n.y}));
  for (const r of rows) {
    const inRow = lines.filter(l => l.y + 8 >= r.top && l.y + 8 < r.bot);
    const col = (a, b) => inRow.filter(l => l.x >= a && l.x < b).sort((p, q) => p.y - q.y || p.x - q.x);
    const one = (a, b) => (col(a, b).find(l => Math.abs(l.y - r.y) < 30) || col(a, b)[0] || {}).t || '';
    const cam = inRow.some(l => l.x > 1575 && l.y > 820) || r.bot > 820;   // evtl. von der Webcam verdeckt
    if (mode === 'champs') {
      const name = one(130, 275); if (!name || name.length < 2) continue;
      const desc = clean(col(1235, 1645).map(l => l.t).join(' '));
      const e = {nr: r.n, name, cost: one(270, 330), origin: one(330, 510), c1: one(510, 690), c2: one(690, 870), ab: one(960, 1160), mana: one(1160, 1235), desc,
        hp: one(1640, 1700), res: one(1700, 1770), ad: one(1770, 1840), as: one(1840, 1920), cam, src: f};
      const old = champs[name]; const score = x => (x.cam ? 0 : 10000) + x.desc.length;
      if (!old || score(e) > score(old)) champs[name] = e;
    } else {
      const name = one(130, 300); if (!name || name.length < 2) continue;
      const desc = clean(col(625, 1035).map(l => l.t).join(' '));
      const e = {nr: r.n, name, type: one(300, 400), bp: one(400, 520), desc, cam, src: f};
      const old = traits[name]; const score = x => (x.cam ? 0 : 10000) + x.desc.length;
      if (!old || score(e) > score(old)) traits[name] = e;
    }
  }
}
fs.writeFileSync(path.join(__dirname, 'video-daten.json'), JSON.stringify({champs, traits}, null, 1));
console.log(`Champions: ${Object.keys(champs).length} · Traits: ${Object.keys(traits).length} · Bilder: ${files.length}`);
