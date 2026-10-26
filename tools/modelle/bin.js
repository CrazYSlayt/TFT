// Riot-Property-Dateien (.bin, „PROP“) lesen: Einträge mit Feldern (Namen als FNV-1a-Hash) als verschachtelte JS-Objekte
const fnv = s => { let h = 0x811c9dc5; for (const c of Buffer.from(s.toLowerCase(), 'utf8')) { h ^= c; h = Math.imul(h, 0x01000193) >>> 0; } return h >>> 0; };
function parse(b) {
  let o = 0;
  const u8 = () => b[o++], u16 = () => { const v = b.readUInt16LE(o); o += 2; return v; }, u32 = () => { const v = b.readUInt32LE(o); o += 4; return v; };
  const str = () => { const n = u16(), s = b.toString('utf8', o, o + n); o += n; return s; };
  const fixed = {1: 1, 2: 1, 3: 1, 4: 2, 5: 2, 6: 4, 7: 4, 8: 8, 9: 8, 10: 4, 11: 8, 12: 12, 13: 16, 14: 64, 15: 4, 17: 4, 18: 8, 0x84: 4, 0x87: 1};
  function val(t) {
    if (t === 16) return str();
    if (t === 17 || t === 0x84) return u32();
    if (t === 10) { const v = b.readFloatLE(o); o += 4; return v; }
    if (t === 12) { const v = [b.readFloatLE(o), b.readFloatLE(o + 4), b.readFloatLE(o + 8)]; o += 12; return v; }
    if (t === 18) { const s = o; o += 8; return {file: b.subarray(s, o).toString('hex')}; }   // Datei-Verweis als xxHash64 des Pfads (Bytes wie gespeichert)
    if (fixed[t]) { const s = o; o += fixed[t]; return t <= 3 || t === 0x87 ? b[s] : t === 5 ? b.readUInt16LE(s) : t === 7 ? b.readUInt32LE(s) : null; }
    if (t === 0x80 || t === 0x81) { const et = u8(); u32(); const n = u32(), a = []; for (let i = 0; i < n; i++) a.push(val(et)); return a; }
    if (t === 0x82 || t === 0x83) { const cls = u32(); if (!cls) return null; u32(); return Object.assign(fields(u16()), {__class: cls}); }
    if (t === 0x85) { const et = u8(), n = u8(); return n ? val(et) : null; }
    if (t === 0x86) { const kt = u8(), vt = u8(); u32(); const n = u32(), m = []; for (let i = 0; i < n; i++) m.push([val(kt), val(vt)]); return m; }
    throw new Error('Typ ' + t + ' bei ' + o);
  }
  function fields(n) { const f = {}; for (let i = 0; i < n; i++) { const h = u32(), t = u8(); f[h] = val(t); } return f; }
  const magic = b.toString('latin1', 0, 4); if (magic === 'PTCH') o = 16; if (b.toString('latin1', o, o + 4) !== 'PROP') throw new Error('kein PROP');
  o += 4; const ver = u32();
  if (ver >= 2) { const n = u32(); for (let i = 0; i < n; i++) str(); }
  const cnt = u32(), types = []; for (let i = 0; i < cnt; i++) types.push(u32());
  const entries = [];
  // Einträge mit unbekannten neueren Feldtypen nicht abbrechen lassen: f = null, Rohbytes bleiben für eine Textsuche erhalten
  for (let i = 0; i < cnt; i++) { const len = u32(), start = o, end = o + len, key = u32(); let f = null; try { f = fields(u16()); } catch (e) {} o = end; entries.push({type: types[i], key, f, raw: b.subarray(start, end)}); }
  return entries;
}
// Zeichenketten in Rohbytes finden (u16-Länge + Text), z. B. Texturpfade in Material-Einträgen
const rawStrings = raw => { const out = []; for (let i = 0; i + 2 < raw.length; i++) { const n = raw.readUInt16LE(i); if (n < 4 || n > 300 || i + 2 + n > raw.length) continue; const s = raw.toString('latin1', i + 2, i + 2 + n); if (/^[\x20-\x7e]+$/.test(s) && /\.(tex|dds|png)$/i.test(s)) { out.push(s); i += 1 + n; } } return out; };
// alle Zeichenketten eines Eintrags (für Material-Definitionen: Texturpfade)
const strings = v => typeof v === 'string' ? [v] : v && typeof v === 'object' ? Object.values(v).flatMap(strings) : [];
module.exports = {fnv, parse, strings, rawStrings};
