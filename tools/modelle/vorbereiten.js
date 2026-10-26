// Einen TFT-Champion fürs Rendern vorbereiten – alles aus den lokal installierten Spieldateien:
// Skin-Datei lesen (Modell, Skelett, Textur je Teil, ausgeblendete Teile), Modell/Skelett/Animationen entpacken,
// Texturen (.tex) entschlüsseln (RGBA), manifest.json schreiben. Dateinamen der Animationen aus der CommunityDragon-Namensliste.
const fs = require('fs'), path = require('path'), {open, xxh64} = require('./wad.js'), {fnv, parse, strings, rawStrings} = require('./bin.js'), {decode} = require('./tex.js');
const GAME = (process.env.LOL_GAME || 'C:/Riot Games/League of Legends') + '/Game/DATA/FINAL/';
const CACHE = path.join(__dirname, 'cache');
const H = fnv;

// Namensliste (nur Dateien der Set-Champions) einmal von CommunityDragon laden und im Cache ablegen (~220 MB werden durchlaufen, ~150 KB bleiben)
async function namen(set) {
  const file = path.join(CACHE, `namen-set${set}.txt`);
  if (!fs.existsSync(file)) {
    fs.mkdirSync(CACHE, {recursive: true});
    const r = await fetch('https://raw.communitydragon.org/data/hashes/lol/hashes.game.txt'), rd = r.body.getReader(), dec = new TextDecoder(), re = new RegExp(`characters/tft${set}_`);
    let rest = ''; const hits = [];
    for (;;) { const {done, value} = await rd.read(); if (done) break; const t = rest + dec.decode(value, {stream: true}), lines = t.split('\n'); rest = lines.pop(); for (const l of lines) if (re.test(l)) hits.push(l); }
    fs.writeFileSync(file, hits.join('\n'));
  }
  return fs.readFileSync(file, 'utf8').split('\n').map(l => l.slice(l.indexOf(' ') + 1).trim()).filter(Boolean);
}

async function vorbereiten(champ, set) {
  const id = `tft${set}_` + champ.toLowerCase(), dir = path.join(CACHE, `set${set}`, champ.toLowerCase());
  fs.mkdirSync(dir, {recursive: true});
  const names = (await namen(set)).filter(n => n.includes('/' + id + '/'));
  const w = open(GAME + `TFTSet${set}.wad.client`), extra = [];
  try {
    // Skin-Datei: nicht jeder Dateiname ist bekannt – deshalb im Archiv die Property-Datei suchen, die das Modell dieses Champions beschreibt
    const needle = Buffer.from(id + '_skin'), skinOf = es => es.find(e => { const m = e.f && e.f[H('skinMeshProperties')]; return m && String(m[H('simpleSkin')] || '').toLowerCase().includes('/' + id + '/'); });
    let entries = null;
    for (const [h, e] of w.entries) {
      if (e.size > 5e6) continue; let b; try { b = w.read(h); } catch (err) { continue; }
      if (b.toString('latin1', 0, 4) !== 'PROP' || Buffer.from(b.toString('latin1').toLowerCase(), 'latin1').indexOf(needle) < 0) continue;
      const es = parse(b); if (skinOf(es)) { entries = es; break; }
    }
    if (!entries) throw new Error(`Skin-Datei für ${id} nicht gefunden`);
    const mp = skinOf(entries).f[H('skinMeshProperties')];
    const skl = mp[H('skeleton')], skn = mp[H('simpleSkin')], hide = String(mp[H('initialSubmeshToHide')] || '').split(/[\s,]+/).filter(Boolean);
    const lol = fs.readdirSync(GAME + 'Champions').find(f => f.toLowerCase() === champ.toLowerCase() + '.wad.client'); if (lol) extra.push(open(GAME + 'Champions/' + lol));
    // Datei-Verweise: Pfad (Text) oder xxHash64 (8 Byte, wie gespeichert) → Hash als Zahl; Textur zuerst im Set-Archiv, dann im LoL-Archiv des Champions
    const hashOf = v => typeof v === 'string' ? xxh64(v.toLowerCase()) : v && v.file ? BigInt('0x' + Buffer.from(v.file, 'hex').reverse().toString('hex')) : null;
    const readTex = h => { if (w.entries.has(h)) return w.read(h); for (const x of extra) if (x.entries.has(h)) return x.read(h); return null; };
    // Material-Eintrag: Sampler „Diffuse_Texture“ → Feld texturePath (Text oder Datei-Hash) direkt aus den Rohbytes
    const byKey = new Map(entries.map(e => [e.key, e])), TP = Buffer.alloc(4); TP.writeUInt32LE(H('texturePath'));
    const matTex = link => { const e = byKey.get(link); if (!e) return null; const r = e.raw;
      for (let i = r.indexOf('Diffuse_Texture'); i >= 0; i = r.indexOf('Diffuse_Texture', i + 1)) {
        if (r.readUInt16LE(i - 2) !== 15) continue;   // genau „Diffuse_Texture“ (nicht „Alt_Diffuse_Texture“)
        const p = r.indexOf(TP, i); if (p < 0 || p - i > 80) continue;
        const t = r[p + 4]; if (t === 18) return {file: r.subarray(p + 5, p + 13).toString('hex')}; if (t === 16) return r.toString('latin1', p + 7, p + 7 + r.readUInt16LE(p + 5));
      }
      const s = (e.f ? strings(e.f) : []).concat(rawStrings(r)); return s.find(x => /\.(tex|dds)$/i.test(x) && !/mask|normal|_nm\b|noise|gradient|ramp|fresnel/i.test(x)) || null; };
    const texRef = o => o[H('texture')] || (o[H('material')] ? matTex(o[H('material')]) : null);
    // Texturen entschlüsseln (gleiche Textur nur einmal)
    const texFiles = new Map(); let n = 0;
    const texFile = ref => { const h = hashOf(ref); if (h === null) return null; if (texFiles.has(h)) return texFiles.get(h);
      const b = readTex(h); let r = null;
      if (b) { try { const t = decode(b); if (t.w > 8) { r = {file: 'tex' + (n++) + '.rgba', w: t.w, h: t.h}; fs.writeFileSync(path.join(dir, r.file), t.rgba); } } catch (e) {} }
      texFiles.set(h, r); return r; };
    const manifest = {champ, set, hide, defaultTex: texFile(texRef(mp)), tex: {}, anims: []};
    for (const o of mp[H('materialOverride')] || []) { const t = texFile(texRef(o)); if (t) manifest.tex[o[H('submesh')]] = t; }
    // Modell, Skelett, Animationen
    fs.writeFileSync(path.join(dir, 'skin.skl'), w.read(skl.toLowerCase())); fs.writeFileSync(path.join(dir, 'skin.skn'), w.read(skn.toLowerCase()));
    for (const a of names.filter(x => x.endsWith('.anm') && x.includes('/animations/'))) { const b = w.read(a); if (b) { fs.writeFileSync(path.join(dir, path.basename(a)), b); manifest.anims.push(path.basename(a)); } }
    fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify(manifest, null, 1));
    return {dir, manifest};
  } finally { w.close(); extra.forEach(x => x.close()); }
}
module.exports = {vorbereiten, CACHE};
