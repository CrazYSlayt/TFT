// Riot-Texturen (.tex) entschlüsseln → RGBA-Pixel (größte Mip-Stufe). Formate: BC1/DXT1 (10), BC3/DXT5 (12), BGRA8 (20)
function decode(b) {
  if (b.toString('latin1', 0, 3) !== 'TEX') throw new Error('keine TEX-Datei');
  const w = b.readUInt16LE(4), h = b.readUInt16LE(6), fmt = b[9], mips = b[11] & 1;
  const bw = Math.max(1, (w + 3) >> 2), bh = Math.max(1, (h + 3) >> 2);
  const size = fmt === 10 ? bw * bh * 8 : fmt === 12 ? bw * bh * 16 : fmt === 20 ? w * h * 4 : 0;
  if (!size) throw new Error('TEX-Format ' + fmt + ' nicht unterstützt');
  const off = mips ? b.length - size : 12;   // mit Mip-Stufen: kleinste zuerst, größte am Ende
  const out = Buffer.alloc(w * h * 4);
  if (fmt === 20) { for (let i = 0; i < w * h; i++) { const s = off + i * 4; out[i * 4] = b[s + 2]; out[i * 4 + 1] = b[s + 1]; out[i * 4 + 2] = b[s]; out[i * 4 + 3] = b[s + 3]; } return {w, h, rgba: out}; }
  const c565 = v => [((v >> 11) & 31) * 255 / 31, ((v >> 5) & 63) * 255 / 63, (v & 31) * 255 / 31];
  for (let by = 0; by < bh; by++) for (let bx = 0; bx < bw; bx++) {
    let p = off + (by * bw + bx) * (fmt === 12 ? 16 : 8);
    let alpha = null;
    if (fmt === 12) {   // BC3: 8 Byte Alpha-Block vor dem Farbblock
      const a0 = b[p], a1 = b[p + 1], pal = [a0, a1];
      if (a0 > a1) for (let i = 1; i < 7; i++) pal.push(((7 - i) * a0 + i * a1) / 7); else { for (let i = 1; i < 5; i++) pal.push(((5 - i) * a0 + i * a1) / 5); pal.push(0, 255); }
      let bits = 0n; for (let i = 0; i < 6; i++) bits |= BigInt(b[p + 2 + i]) << BigInt(8 * i);
      alpha = []; for (let i = 0; i < 16; i++) alpha.push(pal[Number((bits >> BigInt(3 * i)) & 7n)]);
      p += 8;
    }
    const v0 = b.readUInt16LE(p), v1 = b.readUInt16LE(p + 2), c0 = c565(v0), c1 = c565(v1), cols = [c0, c1];
    if (v0 > v1 || fmt === 12) cols.push(c0.map((x, i) => (2 * x + c1[i]) / 3), c0.map((x, i) => (x + 2 * c1[i]) / 3));
    else cols.push(c0.map((x, i) => (x + c1[i]) / 2), null);   // BC1 mit Transparenz
    const idx = b.readUInt32LE(p + 4);
    for (let i = 0; i < 16; i++) {
      const x = bx * 4 + (i & 3), y = by * 4 + (i >> 2); if (x >= w || y >= h) continue;
      const c = cols[(idx >>> (2 * i)) & 3], o = (y * w + x) * 4;
      if (c) { out[o] = c[0]; out[o + 1] = c[1]; out[o + 2] = c[2]; out[o + 3] = alpha ? alpha[i] : 255; } else out[o + 3] = 0;
    }
  }
  return {w, h, rgba: out};
}
module.exports = {decode};
