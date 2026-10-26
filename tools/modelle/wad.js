// Riot WAD-Archive (.wad / .wad.client) lesen: Einträge über xxHash64 des kleingeschriebenen Pfads finden und entpacken.
// Nur lesen – die Spieldateien werden nicht verändert.
const fs = require('fs'), zlib = require('zlib');
const M = (1n << 64n) - 1n, P1 = 11400714785074694791n, P2 = 14029467366897019727n, P3 = 1609587929392839161n, P4 = 9650029242287828579n, P5 = 2870177450012600261n;
const rotl = (x, r) => ((x << BigInt(r)) | (x >> BigInt(64 - r))) & M;
function xxh64(str, seed = 0n) {
  const b = Buffer.from(str, 'utf8'), len = b.length; let i = 0, h;
  const r64 = o => b.readBigUInt64LE(o), r32 = o => BigInt(b.readUInt32LE(o));
  const round = (acc, v) => rotl((acc + v * P2) & M, 31) * P1 & M;
  const merge = (h, v) => (((h ^ round(0n, v)) * P1 + P4) & M);
  if (len >= 32) {
    let v1 = (seed + P1 + P2) & M, v2 = (seed + P2) & M, v3 = seed, v4 = (seed - P1) & M;
    for (; i <= len - 32; i += 32) { v1 = round(v1, r64(i)); v2 = round(v2, r64(i + 8)); v3 = round(v3, r64(i + 16)); v4 = round(v4, r64(i + 24)); }
    h = (rotl(v1, 1) + rotl(v2, 7) + rotl(v3, 12) + rotl(v4, 18)) & M;
    h = merge(h, v1); h = merge(h, v2); h = merge(h, v3); h = merge(h, v4);
  } else h = (seed + P5) & M;
  h = (h + BigInt(len)) & M;
  for (; i <= len - 8; i += 8) { h ^= round(0n, r64(i)); h = (rotl(h, 27) * P1 + P4) & M; }
  if (i <= len - 4) { h ^= (r32(i) * P1) & M; h = (rotl(h, 23) * P2 + P3) & M; i += 4; }
  for (; i < len; i++) { h ^= (BigInt(b[i]) * P5) & M; h = (rotl(h, 11) * P1) & M; }
  h ^= h >> 33n; h = (h * P2) & M; h ^= h >> 29n; h = (h * P3) & M; h ^= h >> 32n;
  return h;
}
function open(file) {
  const fd = fs.openSync(file, 'r'), head = Buffer.alloc(8); fs.readSync(fd, head, 0, 8, 0);
  if (head.toString('latin1', 0, 2) !== 'RW') throw new Error('kein WAD: ' + file);
  const major = head[2];
  if (major < 3) throw new Error('WAD-Version ' + major + ' nicht unterstützt');
  const cnt = Buffer.alloc(4); fs.readSync(fd, cnt, 0, 4, 268); const n = cnt.readUInt32LE(0);
  const toc = Buffer.alloc(n * 32); fs.readSync(fd, toc, 0, toc.length, 272);
  const entries = new Map();
  for (let k = 0; k < n; k++) { const o = k * 32; entries.set(toc.readBigUInt64LE(o), {off: toc.readUInt32LE(o + 8), csize: toc.readUInt32LE(o + 12), size: toc.readUInt32LE(o + 16), type: toc[o + 20] & 15}); }
  const read = path => {
    const e = typeof path === 'bigint' ? entries.get(path) : entries.get(xxh64(path.toLowerCase())); if (!e) return null;
    const raw = Buffer.alloc(e.csize); fs.readSync(fd, raw, 0, e.csize, e.off);
    if (e.type === 0) return raw;
    if (e.type === 1) return zlib.gunzipSync(raw);
    if (e.type === 3) return zlib.zstdDecompressSync(raw);
    if (e.type === 4) { const z = raw.indexOf(Buffer.from([0x28, 0xb5, 0x2f, 0xfd])); return Buffer.concat([raw.subarray(0, z), zlib.zstdDecompressSync(raw.subarray(z))]); }   // Rohteil + zstd
    throw new Error('Typ ' + e.type + ' nicht unterstützt');
  };
  return {entries, read, close: () => fs.closeSync(fd), count: n, version: head[2] + '.' + head[3]};
}
module.exports = {xxh64, open};
