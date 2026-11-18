// Fähigkeitswerte aus den Curve Tables der Champions (CT_<…>.uasset aus dem Unreal-Client, nur gelesen – nichts wird injiziert).
// Ohne Mapping (.usmap) lesbar, weil eine Curve Table (Modus SimpleCurves) fast nur aus Zeilen besteht:
//   Namensliste des Pakets: N Längen (uint16, big endian) direkt vor den aneinandergehängten Namen
//   je Zeile: Name (Index in die Namensliste int32 + Nummer int32), 1 Byte 0, 2 Byte Kopf (0x0b 0x01), Anzahl Stützpunkte (int32),
//             Stützpunkte (Zeit = Sternestufe float, Wert float), danach Interpolation/Extrapolation (hier egal)
//   node tools/unreal/ct-werte.js <CT-Datei>        → {Zeile: {"1":…, "2":…, "3":…, "4":…}}
const fs = require('fs');
function nameMap(b) {
  const s = b.toString('latin1'), m = s.match(/[\x20-\x7e]{6,}/g) || [];
  // längster druckbarer Lauf, der einen Paketpfad „/Set_“ enthält = Namen am Stück
  const run = m.filter(x => /\/Set_\d+\//.test(x)).sort((a, c) => c.length - a.length)[0]; if (!run) return null;
  // Das letzte Längen-Byte kann selbst druckbar sein (z. B. 0x21 = „!“) – deshalb Anfang um bis zu 2 Zeichen verschieben
  const r0 = s.indexOf(run), end = r0 + run.length;
  for (let s0 = r0; s0 <= r0 + 2; s0++) for (let n = 1; n < 400 && s0 - 2 * n >= 0; n++) {
    let sum = 0; for (let k = 0; k < n; k++) sum += b.readUInt16BE(s0 - 2 * n + 2 * k);
    if (sum === end - s0) { const names = []; let p = s0; for (let k = 0; k < n; k++) { const l = b.readUInt16BE(s0 - 2 * n + 2 * k); names.push(s.slice(p, p + l)); p += l; } return names; }
  }
  return null;
}
function ctValues(file) {
  const b = fs.readFileSync(file), names = nameMap(b); if (!names) return {err: 'keine Namensliste'};
  const out = {};
  for (let o = 15; o + 8 <= b.length; o++) {
    if (b[o - 6] !== 0x0b || b[o - 5] !== 0x01 || b[o - 7] !== 0) continue;
    const cnt = b.readInt32LE(o - 4), idx = b.readInt32LE(o - 15), num = b.readInt32LE(o - 11);
    if (cnt < 1 || cnt > 12 || idx < 0 || idx >= names.length || num !== 0 || o + cnt * 8 > b.length) continue;
    const keys = {}; let ok = true, last = -1;
    for (let k = 0; k < cnt; k++) { const t = b.readFloatLE(o + k * 8), v = b.readFloatLE(o + k * 8 + 4);
      if (!(t > last && t <= 10 && Number.isInteger(t)) || !Number.isFinite(v)) { ok = false; break; } keys[t] = +v.toFixed(4); last = t; }
    if (ok) { out[names[idx]] = keys; o += cnt * 8 - 1; }
  }
  return out;
}
module.exports = {ctValues, nameMap};
if (require.main === module) console.log(JSON.stringify(ctValues(process.argv[2])));
