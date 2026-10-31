// Unreal-Textur (entpacktes Paket, Bildpunkte inline) → PNG. Unterstützt PF_DXT1, PF_DXT5, PF_B8G8R8A8.
// Aufbau nach dem Format-Text: FirstMip (int32), Mip-Anzahl (int32), je Mip: Bulk-Index (int32), Bildpunkte, SizeX/SizeY/SizeZ
const fs = require('fs'), zlib = require('zlib');
function png(w, h, rgba) {
  const crcT = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; crcT[n] = c >>> 0; }
  const crc = buf => { let c = 0xffffffff; for (const x of buf) c = crcT[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const chunk = (t, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]); };
  const raw = Buffer.alloc((w * 4 + 1) * h); for (let y = 0; y < h; y++) rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4);
  const ih = Buffer.alloc(13); ih.writeUInt32BE(w, 0); ih.writeUInt32BE(h, 4); ih[8] = 8; ih[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ih), chunk('IDAT', zlib.deflateSync(raw, {level: 9})), chunk('IEND', Buffer.alloc(0))]);
}
const c565 = v => [((v >> 11) & 31) * 255 / 31 | 0, ((v >> 5) & 63) * 255 / 63 | 0, (v & 31) * 255 / 31 | 0];
function colorBlock(d, o, out, w, bx, by, dxt1) {
  const a = d.readUInt16LE(o), b = d.readUInt16LE(o + 2), A = c565(a), B = c565(b), idx = d.readUInt32LE(o + 4);
  const pal = [A, B]; if (!dxt1 || a > b) { pal.push(A.map((x, i) => (2 * x + B[i]) / 3 | 0), A.map((x, i) => (x + 2 * B[i]) / 3 | 0)); } else { pal.push(A.map((x, i) => (x + B[i]) / 2 | 0), [0, 0, 0, -1]); }
  for (let i = 0; i < 16; i++) { const c = pal[(idx >> (2 * i)) & 3], x = bx + (i & 3), y = by + (i >> 2), p = (y * w + x) * 4; out[p] = c[0]; out[p + 1] = c[1]; out[p + 2] = c[2]; out[p + 3] = c[3] === -1 ? 0 : 255; }
}
function decode(fmt, d, o, w, h) {
  const out = Buffer.alloc(w * h * 4);
  if (fmt === 'PF_B8G8R8A8') { for (let i = 0; i < w * h; i++) { out[i * 4] = d[o + i * 4 + 2]; out[i * 4 + 1] = d[o + i * 4 + 1]; out[i * 4 + 2] = d[o + i * 4]; out[i * 4 + 3] = d[o + i * 4 + 3]; } return out; }
  const bs = fmt === 'PF_DXT1' ? 8 : 16;
  for (let by = 0; by < h; by += 4) for (let bx = 0; bx < w; bx += 4) {
    const bo = o + ((by / 4) * (w / 4) + bx / 4) * bs;
    if (fmt === 'PF_DXT1') colorBlock(d, bo, out, w, bx, by, true);
    else { colorBlock(d, bo + 8, out, w, bx, by, false);
      const a0 = d[bo], a1 = d[bo + 1], al = [a0, a1]; for (let k = 1; k < 7; k++) al.push(a0 > a1 ? ((7 - k) * a0 + k * a1) / 7 | 0 : k < 5 ? ((5 - k) * a0 + k * a1) / 5 | 0 : k === 5 ? 0 : 255);
      let bits = 0n; for (let k = 0; k < 6; k++) bits |= BigInt(d[bo + 2 + k]) << BigInt(8 * k);
      for (let i = 0; i < 16; i++) { const x = bx + (i & 3), y = by + (i >> 2); out[(y * w + x) * 4 + 3] = al[Number((bits >> BigInt(3 * i)) & 7n)]; } }
  }
  return out;
}
function texToPng(file) {
  const b = fs.readFileSync(file), s = b.toString('latin1');
  for (let i = s.indexOf('PF_'); i >= 0; i = s.indexOf('PF_', i + 1)) {
    const len = b.readInt32LE(i - 4); if (len < 5 || len > 30 || b[i + len - 1] !== 0) continue;   // Format als FString mit Länge davor
    const fmt = s.slice(i, i + len - 1), w = b.readInt32LE(i - 16), h = b.readInt32LE(i - 12);
    if (!['PF_DXT1', 'PF_DXT5', 'PF_B8G8R8A8'].includes(fmt)) return {err: 'Format ' + fmt};
    let o = i + len; const mips = b.readInt32LE(o + 4); o += 8;
    const size = (mw, mh) => fmt === 'PF_DXT1' ? Math.max(1, mw / 4) * Math.max(1, mh / 4) * 8 : fmt === 'PF_DXT5' ? Math.max(1, mw / 4) * Math.max(1, mh / 4) * 16 : mw * mh * 4;
    // Je Stufe: Bulk-Index, dann Bildpunkte (nur wenn inline) und Größe. Große Stufen liegen ausgelagert – dann die erste Stufe nehmen, die im Paket steht
    for (let m = 0, mw = w, mh = h; m < mips; m++, mw = Math.max(1, mw >> 1), mh = Math.max(1, mh >> 1)) {
      o += 4;
      if (b.readInt32LE(o) === mw && b.readInt32LE(o + 4) === mh && b.readInt32LE(o + 8) === 1) { o += 12; continue; }   // ausgelagert
      const n = size(mw, mh); if (o + n + 12 > b.length || b.readInt32LE(o + n) !== mw) break;
      return {w: mw, h: mh, fmt, png: png(mw, mh, decode(fmt, b, o, mw, mh))};
    }
    return {err: `keine Stufe im Paket (${fmt} ${w}x${h}, ${mips} Stufen)`};
  }
  return {err: 'kein Format gefunden'};
}
module.exports = {texToPng};
if (require.main === module) { const r = texToPng(process.argv[2]); if (r.err) console.log(r.err); else { fs.writeFileSync(process.argv[3], r.png); console.log('ok', r.fmt, r.w + 'x' + r.h); } }
