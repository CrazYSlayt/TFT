/*
  TFTClimb – Posen der Champion-Seite rendern und ihre Lage in data/champions3d-<set>.js schreiben
  ----------------------------------------------------------------------------------------------
  Je Champion bis zu drei Posen (Idle, Angriff, Fähigkeit) über modell.js → assets/img/champions3d/<slug>[-attack|-spell].webp.
  Aus der Ausgabe von modell.js kommen Standpunkt (fx/fb: der Punkt am Boden, auf dem der Champion steht – er kommt genau auf die
  Mitte des Podests) und r (Bildmaßstab). s = r / R_REF, damit alle Champions im gleichen Maßstab stehen (höchstens S_MAX).
  Die Seite liest window.CH_RENDER_DATA (app.html lädt die Datei, app.js → CH_RENDER).

  Aufruf:  node tools/modelle/posen.js Ashe "Elder Dragon"      (Namen wie in den Daten)
           node tools/modelle/posen.js --alle                    (alle Champions des Sets – dauert)
           Optionen: --set 18
  Sonderfälle (SONDER) einzeln prüfen und hier eintragen: andere Blickrichtung, andere Zeitpunkte, schwebende Einheiten.
*/
const fs = require('fs'), path = require('path'), vm = require('vm'), {execFileSync} = require('child_process');
const ROOT = path.join(__dirname, '..', '..'), IMG = path.join(ROOT, 'assets', 'img', 'champions3d');
const args = process.argv.slice(2), opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const slug = n => String(n).toLowerCase().replace(/['’.]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');   // wie champSlug in app.js
// Maßstab: s = r / R_REF hält alle Champions im gleichen Weltmaßstab (Ashe r 154 → 1,03). Sehr kleine (Amumu, Veigar) mindestens S_MIN, sehr große höchstens S_MAX.
// Der Maßstab kommt von der Idle-Pose; die anderen Posen behalten ihn relativ (s × r/r_idle). Weicht r einer Pose stark von Idle ab (Effekt-Teile weit weg
// im Bild, z. B. Alunes Mond), ist die Pose unbrauchbar und entfällt. Liegt der Standpunkt unter dem Bild (Sprung), schwebt die Figur über dem Podest.
const R_REF = 150, S_MIN = .75, S_MAX = 1.3, R_MAXREL = 1.8, R_MINREL = .55;

// Standard-Posen: Animation(en) – die erste vorhandene zählt (Fähigkeit heißt je nach Champion spell4 oder spell1 …) –, Zeitpunkt (0–1), Blickrichtung. Fehlt alles, entfällt die Pose.
const POSEN = [{k: 'idle', f: '', anim: ['idle1', 'idle1_base', 'idle_base', 'idle_loop', 'idle1_var', 'raw_idle1', 'idle2', 'idleready'], zeit: .3, yaw: -25},
  {k: 'attack', f: '-attack', anim: ['attack1', 'attack1_a', 'attack1_hit', 'attack2'], zeit: .35, yaw: -25},
  {k: 'spell', f: '-spell', anim: ['spell4', 'spell1', 'spell2', 'spell3', 'spell', 'spell1_0', 'spell2_a_0', 'cast', 'spell3_long', 'spell2_base'], zeit: .4, yaw: -25}];
// Sonderfälle: je Pose überschreiben (null = Pose weglassen); schwebt: über dem Podest statt darauf (Unterkante + Abstand statt Standpunkt)
const SONDER = {
  'Ashe': {attack: {yaw: 95}},   // die Angriffsanimation dreht sie von der Kamera weg
  // nur attack1 und death; Idle ist im Animations-Graphen ein leerer Platzhalter = Grundhaltung (Gleitflug, im Spiel von oben gesehen); attack1 liegt flach in der Luft
  'Elder Dragon': {idle: {zeit: 0, yaw: -35, schwebt: .07, s: 1.5}, attack: null, spell: null},   // s fest: so abgenommen
  'Master Yi': {idle: {schwebt: .005}, attack: null},   // Standpunkt sitzt auf Bauchhöhe → Füße (Unterkante) aufs Podest   // Angriffsanimationen bewegen im Standbild nichts (gleich wie Idle)
  'Mama Beak': {alle: {yaw: 60}},   // alle = für jede Pose; extra = zusätzliche Posen ({k, f, modell, anim, …})
  'Amumu': {alle: {alpha: 'schnitt'}},   // Flamme ist am Gesicht durchsichtig, dahinter sitzt die Maske
  'Alune': {alle: {alpha: 'schnitt'}},   // Rocksaum ist im Alphakanal ausgeschnitten
  'Gromp': {alle: {yaw: 40}},   // Gesicht und Pilze sichtbar
  'Elise': {extra: [{k: 'spider', f: '-spider', modell: 'elisespider', anim: ['idle1', 'idle1_base', 'idle_base'], zeit: .3, yaw: -25}]},   // Spinnenform: eigenes Modell   // von vorne sieht man nur den Rücken (Textur: LoL-Vorlage, siehe vorbereiten.js)
};

const data = set => { const ctx = {window: {}}; vm.createContext(ctx); vm.runInContext(fs.readFileSync(path.join(ROOT, 'data', `tft-data-${set}.js`), 'utf8'), ctx); return ctx.window.TFT_DATA.champions || []; };
const ordner = (c, set) => ([c.tile, c.sq].map(p => ((p || '').match(/characters\/tft\d+_([^/]+)\//i) || [])[1]).find(Boolean) || c.n.toLowerCase().replace(/[^a-z0-9]/g, '')).toLowerCase();

const set = +opt('set', 18), file = path.join(ROOT, 'data', `champions3d-${set}.js`);
const alt = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8').replace(/^[^{]*/, '').replace(/;\s*$/, '')) : {};
const all = data(set), want = args.includes('--alle') ? all.map(c => c.n) : args.filter((a, i) => !a.startsWith('--') && !(args[i - 1] || '').startsWith('--'));
if (!want.length) { console.log('Aufruf: node tools/modelle/posen.js <Champion> […] | --alle  – Details oben in dieser Datei'); process.exit(1); }
fs.mkdirSync(IMG, {recursive: true});
for (const n of want) {
  const c = all.find(x => x.n.toLowerCase() === n.toLowerCase()); if (!c) { console.log(`✗ ${n}: nicht in den Daten`); continue; }
  const id = ordner(c, set), sp = SONDER[c.n] || {}, out = []; let rIdle = 0, sIdle = 1;
  for (const p0 of POSEN.concat(sp.extra || [])) {   // extra: zusätzliche Posen, auch mit anderem Modell (z. B. Elises Spinnenform)
    if (sp[p0.k] === null) continue;
    const p = {...p0, ...(sp.alle || {}), ...(sp[p0.k] || {})}, dst = path.join(IMG, slug(c.n) + p.f + '.webp');   // alle: gilt für jede Pose
    let log = '', err = '';
    for (const anim of [].concat(p.anim)) {
      try { log = execFileSync(process.execPath, [path.join(__dirname, 'modell.js'), p.modell || id, '--set', set, '--anim', anim, '--zeit', p.zeit, '--yaw', p.yaw, '--pitch', 10, '--groesse', 900, '--out', dst, ...(p.alpha ? ['--alpha', p.alpha] : [])], {encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe']}); p.anim = anim; break; }
      catch (e) { err = String(e.stdout || e.message).trim().split('\n').pop();
        if (/fehlgeschlagen/.test(err) && !p.nochmal) { p.nochmal = 1; try { log = execFileSync(process.execPath, [path.join(__dirname, 'modell.js'), p.modell || id, '--set', set, '--anim', anim, '--zeit', p.zeit, '--yaw', p.yaw, '--pitch', 10, '--groesse', 900, '--out', dst, ...(p.alpha ? ['--alpha', p.alpha] : [])], {encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe']}); p.anim = anim; break; } catch (e2) { err = String(e2.stdout || e2.message).trim().split('\n').pop(); } }   // zweiter Versuch (Zeitüberschreitung unter Last)
        if (!/nicht gefunden/.test(err)) break; }
    }
    if (!log) { console.log(`  – ${c.n} ${p.k}: ${err}`); continue; }
    const m = log.match(/Standpunkt fx ([\d.]+) fb ([\d.]+) · r ([\d.]+) · Unterkante ([\d.]+) · Oberkante (-?[\d.]+)/); if (!m) { console.log(`  – ${c.n} ${p.k}: Ausgabe nicht lesbar`); continue; }
    const r = +m[3];
    if (p.k === 'idle'){ rIdle = r; sIdle = p.s || Math.min(S_MAX, Math.max(S_MIN, r / R_REF)); }
    else if (rIdle && !p.modell && (r / rIdle > R_MAXREL || r / rIdle < R_MINREL))   /* eigenes Modell (z. B. Spinnenform) darf größer sein */ { console.log(`  – ${c.n} ${p.k}: verworfen (Bildausschnitt ${(r / rIdle).toFixed(1)}× so groß wie Idle)`); fs.unlinkSync(dst); continue; }
    const jump = !p.schwebt && +m[2] > .97, fb = p.schwebt ? +m[4] + p.schwebt : jump ? Math.min(.97, +m[4] + .03) : +m[2];
    out.push({k: p.k, ...(p.f ? {f: p.f} : {}), fx: +m[1], fb: +fb.toFixed(3), o: +(+m[5]).toFixed(3), s: +(p.s || (rIdle ? sIdle * r / rIdle : Math.min(S_MAX, Math.max(S_MIN, r / R_REF)))).toFixed(3)});
    console.log(`  ✓ ${c.n} ${p.k} (${p.anim} @ ${p.zeit}, yaw ${p.yaw}) fx ${m[1]} fb ${fb.toFixed(3)}${jump ? ' (Sprung, schwebt)' : ''} r ${r}`);
  }
  if (out.length) alt[c.n] = out; else { delete alt[c.n]; console.log(`✗ ${c.n}: keine Pose – behält die alte Seite`); }
  // Bilder von Posen, die es nicht mehr gibt, löschen
  POSEN.filter(p => !out.some(o => o.k === p.k)).forEach(p => { const f = path.join(IMG, slug(c.n) + p.f + '.webp'); if (fs.existsSync(f)) fs.unlinkSync(f); });
}
const sorted = Object.fromEntries(Object.keys(alt).sort().map(k => [k, alt[k]]));
fs.writeFileSync(file, `// Erzeugt von tools/modelle/posen.js – Posen der Champion-Seite: Standpunkt (fx/fb im Bild), Maßstab s. Nicht von Hand ändern, neu rendern.\nwindow.CH_RENDER_DATA = ${JSON.stringify(sorted, null, 1)};\n`);
console.log(`→ data/champions3d-${set}.js (${Object.keys(sorted).length} Champions)`);
