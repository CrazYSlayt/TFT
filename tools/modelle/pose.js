// League-Modell (.skn) mit Skelett (.skl) in eine Animations-Pose (.anm) bringen.
// posieren(ordner, animation, anteil) → {anim, t, subs: [{name, pos, uv, idx}]} – Ordner wie von vorbereiten.js angelegt (skin.skl, skin.skn, *.anm)
const fs = require('fs'), path = require('path');

// ---------- kleine Mathematik (4×4, spaltenweise wie three.js) ----------
const qmat = (t, q, s) => {   // T * R * S
  const [x, y, z, w] = q, [sx, sy, sz] = s;
  const xx = x * x, yy = y * y, zz = z * z, xy = x * y, xz = x * z, yz = y * z, wx = w * x, wy = w * y, wz = w * z;
  return [(1 - 2 * (yy + zz)) * sx, 2 * (xy + wz) * sx, 2 * (xz - wy) * sx, 0,
          2 * (xy - wz) * sy, (1 - 2 * (xx + zz)) * sy, 2 * (yz + wx) * sy, 0,
          2 * (xz + wy) * sz, 2 * (yz - wx) * sz, (1 - 2 * (xx + yy)) * sz, 0,
          t[0], t[1], t[2], 1];
};
const mul = (a, b) => { const o = new Array(16); for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3]; return o; };
function inv(m) {   // allgemeine 4×4-Inverse
  const [a00, a01, a02, a03, a10, a11, a12, a13, a20, a21, a22, a23, a30, a31, a32, a33] = m;
  const b00 = a00 * a11 - a01 * a10, b01 = a00 * a12 - a02 * a10, b02 = a00 * a13 - a03 * a10, b03 = a01 * a12 - a02 * a11, b04 = a01 * a13 - a03 * a11, b05 = a02 * a13 - a03 * a12;
  const b06 = a20 * a31 - a21 * a30, b07 = a20 * a32 - a22 * a30, b08 = a20 * a33 - a23 * a30, b09 = a21 * a32 - a22 * a31, b10 = a21 * a33 - a23 * a31, b11 = a22 * a33 - a23 * a32;
  const d = 1 / (b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06);
  return [(a11 * b11 - a12 * b10 + a13 * b09) * d, (a02 * b10 - a01 * b11 - a03 * b09) * d, (a31 * b05 - a32 * b04 + a33 * b03) * d, (a22 * b04 - a21 * b05 - a23 * b03) * d,
    (a12 * b08 - a10 * b11 - a13 * b07) * d, (a00 * b11 - a02 * b08 + a03 * b07) * d, (a32 * b02 - a30 * b05 - a33 * b01) * d, (a20 * b05 - a22 * b02 + a23 * b01) * d,
    (a10 * b10 - a11 * b08 + a13 * b06) * d, (a01 * b08 - a00 * b10 - a03 * b06) * d, (a30 * b04 - a31 * b02 + a33 * b00) * d, (a21 * b02 - a20 * b04 - a23 * b00) * d,
    (a11 * b07 - a10 * b09 - a12 * b06) * d, (a00 * b09 - a01 * b07 + a02 * b06) * d, (a31 * b01 - a30 * b03 - a32 * b00) * d, (a20 * b03 - a21 * b01 + a22 * b00) * d];
}
const tp = (m, p) => [m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12], m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13], m[2] * p[0] + m[6] * p[1] + m[10] * p[2] + m[14]];
const slerp = (a, b, t) => { let d = a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3]; if (d < 0) { b = b.map(v => -v); d = -d; }
  const o = a.map((v, i) => v + (b[i] - v) * t), l = Math.hypot(...o); return o.map(v => v / l); };   // normalisiertes lineares Mischen reicht für eine Pose
const lerp = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
const elf = s => { let h = 0; for (const ch of s.toLowerCase()) { h = ((h << 4) + ch.charCodeAt(0)) >>> 0; const g = h & 0xf0000000; if (g) h ^= g >>> 24; h &= ~g; h >>>= 0; } return h >>> 0; };

// ---------- Skelett (.skl, neues Format 0x22FD4FC3) ----------
function readSkl(b) {
  if (b.readUInt32LE(4) !== 0x22fd4fc3) throw new Error('altes SKL-Format');
  const n = b.readUInt16LE(14), infN = b.readUInt32LE(16), jOff = b.readInt32LE(20), infOff = b.readInt32LE(28);
  const f3 = o => [b.readFloatLE(o), b.readFloatLE(o + 4), b.readFloatLE(o + 8)], f4 = o => [...f3(o), b.readFloatLE(o + 12)];
  const joints = [];
  for (let i = 0; i < n; i++) {
    const o = jOff + i * 100, nameAt = o + 96 + b.readInt32LE(o + 96);
    joints.push({id: b.readInt16LE(o + 2), parent: b.readInt16LE(o + 4), hash: b.readUInt32LE(o + 8), t: f3(o + 16), s: f3(o + 28), r: f4(o + 40), name: b.toString('latin1', nameAt, b.indexOf(0, nameAt))});
  }
  const inf = []; for (let i = 0; i < infN; i++) inf.push(b.readInt16LE(infOff + i * 2));
  return {joints, inf};
}
// ---------- Modell (.skn v4) ----------
function readSkn(b) {
  let o = 8; const major = b.readUInt16LE(4), subN = b.readUInt32LE(o); o += 4; const subs = [];
  for (let i = 0; i < subN; i++, o += 80) subs.push({name: b.toString('latin1', o, b.indexOf(0, o)), v0: b.readUInt32LE(o + 64), vn: b.readUInt32LE(o + 68), i0: b.readUInt32LE(o + 72), in: b.readUInt32LE(o + 76)});
  if (major === 4) o += 4;   // flags
  const iN = b.readUInt32LE(o), vN = b.readUInt32LE(o + 4); o += 8;
  let vSize = 52; if (major === 4) { vSize = b.readUInt32LE(o); o += 8 + 40; }   // Größe, Typ, Bounding-Box und -Kugel
  const idx = []; for (let i = 0; i < iN; i++) idx.push(b.readUInt16LE(o + i * 2)); o += iN * 2;
  const verts = [];
  for (let i = 0; i < vN; i++, o += vSize) verts.push({p: [b.readFloatLE(o), b.readFloatLE(o + 4), b.readFloatLE(o + 8)], bi: [b[o + 12], b[o + 13], b[o + 14], b[o + 15]],
    bw: [b.readFloatLE(o + 16), b.readFloatLE(o + 20), b.readFloatLE(o + 24), b.readFloatLE(o + 28)], uv: [b.readFloatLE(o + 44), b.readFloatLE(o + 48)]});
  return {subs, idx, verts};
}
// ---------- Animation (.anm): r3d2anmd v5 (Frames mit Paletten) und r3d2canm (komprimiert, Schlüsselbilder je Gelenk) ----------
// Liefert hashes (Gelenk-Hash je Spur) und sample(spur, anteil 0..1) → {t, r, s}
const quat48 = (u0, u1, u2) => {   // Quaternion aus 48 Bit: größte Komponente weggelassen, drei mit 15 Bit
  const bits = BigInt(u0) | (BigInt(u1) << 16n) | (BigInt(u2) << 32n), mi = Number((bits >> 45n) & 3n), dq = v => Number(v) / 32767 * Math.SQRT2 - 1 / Math.SQRT2;
  const a = dq((bits >> 30n) & 0x7fffn), bb = dq((bits >> 15n) & 0x7fffn), c = dq(bits & 0x7fffn), d = Math.sqrt(Math.max(0, 1 - (a * a + bb * bb + c * c)));
  return mi === 0 ? [d, a, bb, c] : mi === 1 ? [a, d, bb, c] : mi === 2 ? [a, bb, d, c] : [a, bb, c, d];
};
function readAnm(b) {
  const magic = b.toString('latin1', 0, 8);
  if (magic === 'r3d2anmd' && b.readUInt32LE(8) === 5) {
    const tracks = b.readInt32LE(28), frames = b.readInt32LE(32), fd = b.readFloatLE(36);
    const hOff = b.readInt32LE(40) + 12, vOff = b.readInt32LE(52) + 12, qOff = b.readInt32LE(56) + 12, fOff = b.readInt32LE(60) + 12;
    const vecs = []; for (let o = vOff; o < qOff; o += 12) vecs.push([b.readFloatLE(o), b.readFloatLE(o + 4), b.readFloatLE(o + 8)]);
    const quats = []; for (let o = qOff; o + 6 <= hOff; o += 6) quats.push(quat48(b.readUInt16LE(o), b.readUInt16LE(o + 2), b.readUInt16LE(o + 4)));
    const hashes = []; for (let i = 0; i < tracks; i++) hashes.push(b.readUInt32LE(hOff + i * 4));
    const key = (f, j) => { const o = fOff + (f * tracks + j) * 6; return {t: vecs[b.readUInt16LE(o)], s: vecs[b.readUInt16LE(o + 2)], r: quats[b.readUInt16LE(o + 4)]}; };
    const sample = (j, frac) => { const ft = Math.min(frames - 1, Math.max(0, frac * (frames - 1))), f0 = Math.floor(ft), f1 = Math.min(frames - 1, f0 + 1), k = ft - f0, a = key(f0, j), c = key(f1, j);
      return {t: lerp(a.t, c.t, k), r: slerp(a.r, c.r, k), s: lerp(a.s, c.s, k)}; };
    return {hashes, sample, info: `v5 · ${frames} Frames (${(frames * fd).toFixed(2)} s)`};
  }
  if (magic === 'r3d2canm') {
    const joints = b.readInt32LE(24), frames = b.readInt32LE(28), dur = b.readFloatLE(36);
    const f3 = o => [b.readFloatLE(o), b.readFloatLE(o + 4), b.readFloatLE(o + 8)];
    const tMin = f3(68), tMax = f3(80), sMin = f3(92), sMax = f3(104), fOff = b.readInt32LE(116) + 12, hOff = b.readInt32LE(124) + 12;
    const hashes = []; for (let i = 0; i < joints; i++) hashes.push(b.readUInt32LE(hOff + i * 4));
    const keys = hashes.map(() => [[], [], []]);   // je Gelenk: Drehung, Verschiebung, Skalierung – Liste [zeit, wert]
    for (let i = 0; i < frames; i++) { const o = fOff + i * 10, time = b.readUInt16LE(o) / 65535, bits = b.readUInt16LE(o + 2), j = bits & 0x3fff, type = bits >> 14, v = [b.readUInt16LE(o + 4), b.readUInt16LE(o + 6), b.readUInt16LE(o + 8)];
      if (!keys[j] || type > 2) continue;
      const val = type === 0 ? quat48(...v) : (type === 1 ? [tMin, tMax] : [sMin, sMax]).reduce((mn, mx) => mn.map((m, k) => m + (mx[k] - m) * v[k] / 65535));
      keys[j][type].push([time, val]); }
    keys.forEach(k => k.forEach(l => l.sort((x, y) => x[0] - y[0])));
    const at = (list, frac, mix) => { if (!list.length) return null; let i = 0; while (i < list.length - 1 && list[i + 1][0] <= frac) i++;
      const a = list[i], c = list[Math.min(list.length - 1, i + 1)]; const k = c[0] > a[0] ? Math.min(1, Math.max(0, (frac - a[0]) / (c[0] - a[0]))) : 0; return mix(a[1], c[1], k); };
    const sample = (j, frac) => ({r: at(keys[j][0], frac, slerp), t: at(keys[j][1], frac, lerp), s: at(keys[j][2], frac, lerp)});
    return {hashes, sample, info: `komprimiert · ${frames} Schlüssel (${dur.toFixed(2)} s)`};
  }
  throw new Error('Animationsformat nicht unterstützt: ' + magic + ' v' + b.readUInt32LE(8));
}

function posieren(dir, anim, frac = 0) {
  const skl = readSkl(fs.readFileSync(path.join(dir, 'skin.skl'))), skn = readSkn(fs.readFileSync(path.join(dir, 'skin.skn'))), anm = readAnm(fs.readFileSync(path.join(dir, anim)));
  const track = new Map(anm.hashes.map((h, i) => [h, i])), global = new Map(), bindG = new Map();
  let matched = 0;
  for (const j of skl.joints) {   // Eltern stehen in der Liste vor ihren Kindern
    const ti = track.has(j.hash) ? track.get(j.hash) : track.get(elf(j.name));
    let loc = qmat(j.t, j.r, j.s);
    if (ti !== undefined) { matched++; const a = anm.sample(ti, frac); loc = qmat(a.t || j.t, a.r || j.r, a.s || j.s); }   // fehlende Spuren: Wert aus dem Skelett
    const pg = j.parent >= 0 ? global.get(j.parent) : null, pb = j.parent >= 0 ? bindG.get(j.parent) : null, bl = qmat(j.t, j.r, j.s);
    global.set(j.id, pg ? mul(pg, loc) : loc); bindG.set(j.id, pb ? mul(pb, bl) : bl);
  }
  const skin = new Map(skl.joints.map(j => [j.id, mul(global.get(j.id), inv(bindG.get(j.id)))]));
  // Vertices verformen (bis zu 4 Gelenke je Vertex)
  const posed = skn.verts.map(v => { const o = [0, 0, 0];
    for (let i = 0; i < 4; i++) { const w = v.bw[i]; if (!w) continue; const m = skin.get(skl.inf[v.bi[i]]); if (!m) continue; const p = tp(m, v.p); o[0] += p[0] * w; o[1] += p[1] * w; o[2] += p[2] * w; }
    return o; });
  const r3 = x => Math.round(x * 1000) / 1000;
  const subs = skn.subs.map(s => ({name: s.name, pos: posed.slice(s.v0, s.v0 + s.vn).flat().map(r3), uv: skn.verts.slice(s.v0, s.v0 + s.vn).flatMap(v => v.uv).map(x => Math.round(x * 1e5) / 1e5),
    idx: skn.idx.slice(s.i0, s.i0 + s.in).map(i => i - s.v0)}));
  return {anim, t: frac, subs, info: `Gelenke ${skl.joints.length}, mit Animation ${matched}/${anm.hashes.length} · ${anm.info}`};
}
module.exports = {posieren};
