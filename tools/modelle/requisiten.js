/*
  TFTClimb – Requisiten, die im Spiel nicht zum Modell gehören, sondern als Effekt an einem Knochen hängen (z. B. Ahris Kugel)
  ----------------------------------------------------------------------------------------------------------------------
  Je Champion von Hand festgelegt (welcher Effekt, welcher Knochen, Farben aus den Effekt-Daten des Spiels). Die Teile stammen aus dem
  LoL-Archiv der Vorlage (TFT-Skin = LoL-Skin, siehe Audio-Tags der Skin-Datei). vorbereiten.js ruft requisiten() auf und legt sie im
  Cache ab; render.html setzt sie an den Knochen der Pose:
    mesh  – Effekt-Modell (.scb) mit Textur, leuchtend (Farbe addiert), größe = Radius in Spieleinheiten
    glow  – weiches Leuchten (Bild immer zur Kamera), größe = Durchmesser, deckkraft 0–1
  Farben (RGB 0–1) aus den Emittern des Effekts (Ahri Skin27: Q_mis_02 – InnerGlow, Flash, PinkHalo, OrbHead).
*/
const fs = require('fs'), path = require('path'), {open} = require('./wad.js'), {decode} = require('./tex.js');
const GAME = (process.env.LOL_GAME || 'C:/Riot Games/League of Legends') + '/Game/DATA/FINAL/';

const REQUISITEN = {
  ahri: {quelle: 'Champions/Ahri.wad.client', ordner: 'assets/characters/jade_ahri/skins/skin27/particles/', knochen: 'Weapon', teile: [   // Weapon = über der rechten Hand, dort schwebt die Kugel (Orb_Root ist der Bodenpunkt des geworfenen Q)
    {glow: 'jade_ahri_skin27_glow.tex', farbe: [1, .29, .91], groesse: 120, deckkraft: .4},           // PinkHalo
    {glow: 'jade_ahri_skin27_glow.tex', farbe: [.25, .45, 1], groesse: 75, deckkraft: .8},            // InnerGlow
    {mesh: 'q_orb.scb', tex: 'jade_ahri_skin27_noise_05.tex', farbe: [.16, .35, .9], groesse: 13, deckkraft: .9},   // Orb_Mesh
    {glow: 'jade_ahri_skin27_glow3.tex', farbe: [.6, .82, 1], groesse: 55, deckkraft: .6},            // Flash (Lichtstern)
    {glow: 'jade_ahri_skin27_glow.tex', farbe: [.75, .9, 1], groesse: 26, deckkraft: .85},            // heller Kern (Flash-Mitte)
  ]},
};

// Effekt-Modell (.scb, r3d2Mesh 3.x): Punkte, Dreiecke mit UV je Ecke → auf Mittelpunkt 0 und Radius 1 gebracht
function scb(b) {
  let o = 8; const maj = b.readUInt16LE(o), min = b.readUInt16LE(o + 2); o += 4 + 128;
  const vc = b.readUInt32LE(o), fc = b.readUInt32LE(o + 4); o += 12 + 24;
  let col = false; if (maj === 3 && min === 2) { col = b.readUInt32LE(o) === 1; o += 4; }
  const p = []; for (let i = 0; i < vc; i++, o += 12) p.push([b.readFloatLE(o), b.readFloatLE(o + 4), b.readFloatLE(o + 8)]);
  if (col) o += vc * 4; o += 12;
  const c = [0, 1, 2].map(k => p.reduce((s, v) => s + v[k], 0) / vc), r = Math.max(...p.map(v => Math.hypot(v[0] - c[0], v[1] - c[1], v[2] - c[2]))) || 1;
  const pos = [], uv = [];
  for (let f = 0; f < fc; f++, o += 100) {
    const ix = [b.readUInt32LE(o), b.readUInt32LE(o + 4), b.readUInt32LE(o + 8)], u = [0, 1, 2].map(k => b.readFloatLE(o + 76 + k * 4)), v = [0, 1, 2].map(k => b.readFloatLE(o + 88 + k * 4));
    ix.forEach((i, k) => { pos.push(...p[i].map((x, a) => +((x - c[a]) / r).toFixed(4))); uv.push(+u[k].toFixed(4), +v[k].toFixed(4)); });
  }
  return {pos, uv};
}

// Requisiten eines Champions in den Cache legen; Texturen mit Helligkeit als Deckkraft (für Leuchten auf transparentem Hintergrund)
function requisiten(champ, dir) {
  const R = REQUISITEN[champ.toLowerCase()]; if (!R) return null;
  const w = open(GAME + R.quelle), out = {knochen: R.knochen, teile: []}, texs = {};
  try {
    const tex = name => { if (texs[name]) return texs[name]; const b = w.read(R.ordner + name); if (!b) return null; const t = decode(b);
      for (let i = 0; i < t.w * t.h; i++) { const a = Math.max(t.rgba[i * 4], t.rgba[i * 4 + 1], t.rgba[i * 4 + 2]); t.rgba[i * 4 + 3] = a; t.rgba[i * 4] = t.rgba[i * 4 + 1] = t.rgba[i * 4 + 2] = 255; }
      const f = 'req' + Object.keys(texs).length + '.rgba'; fs.writeFileSync(path.join(dir, f), t.rgba); return texs[name] = {file: f, w: t.w, h: t.h}; };
    for (const t of R.teile) {
      if (t.mesh) { const b = w.read(R.ordner + t.mesh); if (!b) continue; const f = 'req-' + t.mesh.replace(/\W/g, '_') + '.json'; fs.writeFileSync(path.join(dir, f), JSON.stringify(scb(b)));
        out.teile.push({art: 'mesh', datei: f, tex: t.tex ? tex(t.tex) : null, farbe: t.farbe, groesse: t.groesse, deckkraft: t.deckkraft ?? 1}); }
      else if (t.glow) { const x = tex(t.glow); if (x) out.teile.push({art: 'glow', tex: x, farbe: t.farbe, groesse: t.groesse, deckkraft: t.deckkraft ?? 1}); }
    }
  } finally { w.close(); }
  return out;
}
module.exports = {requisiten, REQUISITEN};
