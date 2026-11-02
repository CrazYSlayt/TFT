// Einen TFT-Champion fürs Rendern vorbereiten – alles aus den lokal installierten Spieldateien:
// Skin-Datei lesen (Modell, Skelett, Textur je Teil, ausgeblendete Teile), Modell/Skelett/Animationen entpacken,
// Texturen (.tex) entschlüsseln (RGBA), manifest.json schreiben. Dateinamen der Animationen aus der CommunityDragon-Namensliste.
const fs = require('fs'), path = require('path'), {open, xxh64} = require('./wad.js'), {fnv, parse, strings, rawStrings} = require('./bin.js'), {decode} = require('./tex.js'), {requisiten} = require('./requisiten.js');
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
    // Suchtext: Ordner des Champions (nicht „…_skin“ – beim Elder Dragon heißt das Modell nur tft18_elderdragon.skn)
    const needle = Buffer.from('/' + id + '/'), skinOf = es => es.find(e => { const m = e.f && e.f[H('skinMeshProperties')]; return m && String(m[H('simpleSkin')] || '').toLowerCase().includes('/' + id + '/'); });
    let entries = null, skinBin = null;
    for (const [h, e] of w.entries) {
      if (e.size > 5e6) continue; let b; try { b = w.read(h); } catch (err) { continue; }
      if (b.toString('latin1', 0, 4) !== 'PROP' || Buffer.from(b.toString('latin1').toLowerCase(), 'latin1').indexOf(needle) < 0) continue;
      const es = parse(b); if (skinOf(es)) { entries = es; skinBin = b; break; }
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
    // Plausibilität: Verweist die Skin-Datei auf eine falsche Textur (Rückruf-Umgebung, Maske, winzige Hilfstextur) oder auf keine,
    // die Farbtextur des Champions (<…>_tx_cm.tex im eigenen Ordner) nehmen – für einen Teil die mit seinem Namen (z. B. „_body_tx_cm“)
    const cm = names.filter(n => /_tx_cm\.(tex|dds)$/.test(n) && !/recall|enviro|_nm|mask|vfx|particle/i.test(n));
    const pathOf = new Map(names.map(n => [xxh64(n.toLowerCase()), n])), refPath = r => typeof r === 'string' ? r.toLowerCase() : pathOf.get(hashOf(r)) || '';
    const bad = (ref, t) => { const p = refPath(ref); return !t || t.w < 256 || /recall|enviro|_nm\b/i.test(p) || (/mask/i.test(p) && !/_tx_cm/i.test(p)); };   // „…mask…_tx_cm“ ist eine echte Farbtextur (z. B. Amumus Gesichtsmaske)
    const best = part => cm.find(n => part && n.includes('_' + part.toLowerCase() + '_tx_cm')) || cm.find(n => /skin0_tx_cm|skin0_body_tx_cm/.test(n)) || cm.find(n => /_tx_cm/.test(n) && !/weapon/.test(n)) || cm[0];
    if (bad(texRef(mp), manifest.defaultTex) && best()) manifest.defaultTex = texFile(best()) || manifest.defaultTex;
    // Seit Set 18 (Unreal-Client) liegen manche Texturen im League-Client nur als 4×4-Platzhalter vor (z. B. Zyra, Mama Beak).
    // Dann die Farbtextur der LoL-Vorlage nehmen: die Skin-Datei nennt sie in den Audio-Tags („ZyraSkin0“, „SRU_RazorbeakSkin0“) –
    // Champion-Archiv bzw. Dschungel-Archiv (Map11), dort data/characters/<name>/skins/skin<n>.bin → texture
    if (!manifest.defaultTex || manifest.defaultTex.w < 64) {
      const tag = (skinBin.toString('latin1').match(/\b([A-Za-z_]+)Skin(\d+)\b/) || []);
      if (tag[1]) {
        const lname = tag[1].toLowerCase(), wads = [];
        const cf = fs.readdirSync(GAME + 'Champions').find(f => f.toLowerCase() === lname + '.wad.client'); if (cf) wads.push(GAME + 'Champions/' + cf);
        if (fs.existsSync(GAME + 'Maps/Shipping/Map11.wad.client')) wads.push(GAME + 'Maps/Shipping/Map11.wad.client');
        for (const wf of wads) {
          const lw = open(wf);
          try {
            const sb = lw.read(`data/characters/${lname}/skins/skin${+tag[2]}.bin`); if (!sb) continue;
            const lmp = parse(sb).map(e => e.f && e.f[H('skinMeshProperties')]).find(Boolean), ref = lmp && lmp[H('texture')], h = hashOf(ref);
            const tb = h !== null && lw.read(h); if (!tb) continue;
            const t = decode(tb); if (t.w < 64) continue;
            const r = {file: 'tex' + (n++) + '.rgba', w: t.w, h: t.h}; fs.writeFileSync(path.join(dir, r.file), t.rgba);
            manifest.defaultTex = r; manifest.lolTex = `${tag[1]}Skin${tag[2]}`;
            for (const k of Object.keys(manifest.tex)) if (manifest.tex[k].w < 64) delete manifest.tex[k];
            break;
          } catch (e) {} finally { lw.close(); }
        }
      }
    }
    for (const o of mp[H('materialOverride')] || []) { const part = o[H('submesh')], t = manifest.tex[part];
      if (t && bad(texRef(o), t)) { const b = best(part); if (b) manifest.tex[part] = texFile(b) || t; } }
    // Modell, Skelett, Animationen
    fs.writeFileSync(path.join(dir, 'skin.skl'), w.read(skl.toLowerCase())); fs.writeFileSync(path.join(dir, 'skin.skn'), w.read(skn.toLowerCase()));
    for (const a of names.filter(x => x.endsWith('.anm') && x.includes('/animations/'))) { const b = w.read(a); if (b) { fs.writeFileSync(path.join(dir, path.basename(a)), b); manifest.anims.push(path.basename(a)); } }
    // Dazu die Clips aus dem Animations-Graphen der Skin-Datei: dort stehen die Dateien nur als Hash, deshalb fehlen manche in der Namensliste
    // (z. B. der Elder Dragon nutzt den Graphen „DA_18_ElderDragon“). Clip-Name (FNV-Hash, gegen bekannte Namen geprüft) → Datei hinter „mAnimationFilePath“
    const gp = (skinBin.toString('latin1').match(/data\/characters\/[\x21-\x7e]+?\/animations\/[\x21-\x7e]+?\.bin/i) || [])[0], graph = gp && w.read(gp.toLowerCase());
    if (graph) {
      const clips = ['Idle1', 'Idle2', 'Idle_Base', 'Run', 'Run_Base', 'Attack1', 'Attack2', 'Attack3', 'Crit', 'Spell1', 'Spell2', 'Spell3', 'Spell4', 'Death', 'Celebration', 'Dance', 'Dance_In', 'Flying', 'Spawn', 'Taunt', 'Joke', 'Laugh', 'Channel', 'Recall'];
      const byHash = new Map(clips.map(c => [H(c), c])), AFP = Buffer.alloc(5); AFP.writeUInt32LE(H('mAnimationFilePath')); AFP[4] = 18;
      for (let p = graph.indexOf(AFP), last = 0; p >= 0; last = p + 13, p = graph.indexOf(AFP, p + 1)) {
        let name = null; for (let i = p - 4; i >= last && !name; i--) name = byHash.get(graph.readUInt32LE(i)) || null;
        const file = `${id}_${(name || 'clip' + p).toLowerCase()}.anm`; if (manifest.anims.includes(file)) continue;
        const b = w.read(graph.readBigUInt64LE(p + 5)); if (!b) continue;
        fs.writeFileSync(path.join(dir, file), b); manifest.anims.push(file);
      }
    }
    const req = requisiten(champ, dir); if (req) manifest.requisiten = req;   // Effekt-Teile an Knochen (z. B. Ahris Kugel), siehe requisiten.js
    fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify(manifest, null, 1));
    return {dir, manifest};
  } finally { w.close(); extra.forEach(x => x.close()); }
}
module.exports = {vorbereiten, CACHE};
