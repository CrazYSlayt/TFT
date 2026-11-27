// Set 19 von Hand zusammenbauen, solange CommunityDragon es nicht liefert (seit 18.6 eigener TFT-Client, CDragon liest nur noch den LoL-Client).
// Quellen:
//   Champions, Kosten, Traits: Liste im Dev-Drop-Artikel (data/news.js, Block „Alle 94 Champions“)
//   Trait-Stufen: Riots „TFT Set 19 Prismatic Tour Overview“ (17.11.2026) – Klassen fehlen dort noch (bp leer)
//   Bilder: PBE-Client (vorher entpacken: Champion-UI-Texturen nach C:\t19png, Trait-Icons nach C:\t19trpng – siehe tools/set19/LIESMICH.md)
// Schreibt data/tft-data-19.js (channel "pbe" – update-data.ps1 nimmt die Datei so in data/sets.js auf und überschreibt sie erst,
// wenn CommunityDragon selbst ein Set 19 liefert), data/tft-data-19-en.js und assets/img/set19/…
//   node tools/set19/bauen.js
const fs = require('fs'), path = require('path'), os = require('os'), {spawn} = require('child_process');
const ROOT = path.join(__dirname, '..', '..');
const CH_PNG = 'C:/t19png', TR_PNG = 'C:/t19trpng', DA_DIR = 'C:/t19/TFT/Plugins/GameFeatures/Set_19/Content/Champions';
const OUT_IMG = path.join(ROOT, 'assets', 'img', 'set19'); fs.mkdirSync(path.join(OUT_IMG, 'champions'), {recursive: true}); fs.mkdirSync(path.join(OUT_IMG, 'traits'), {recursive: true});
const VERSION = '16.24 PBE', TODAY = new Date().toISOString().slice(0, 10);

// ---------- 1. Champions aus dem Dev-Drop-Artikel ----------
global.window = {}; require(path.join(ROOT, 'data', 'news.js'));
const post = window.TFT_NEWS.find(p => p.slug.de === 'prismatic-tour-dev-drop');
const grp = post.body.en.filter(b => b.k === 'tags').find(b => b.g.some(g => g.c === 7));
const champs = grp.g.flatMap(g => g.l.map(([n, t]) => ({n: n.replace(/\s*🔒\s*/, '').trim(), lock: /🔒/.test(n), c: g.c, t: t.split(',').map(s => s.trim())})));
// Zwei Akalis (K/DA und True Damage/Freestyle) brauchen eigene Namen – der Name ist auf der Seite der Schlüssel (Adresse, Builder, Tierlist)
const AKALI = {'K/DA': 'Akali (K/DA)', 'True Damage': 'Akali (True Damage)'};
champs.forEach(c => { if (c.n === 'Akali') { c.base = 'Akali'; c.n = AKALI[c.t[0]] || c.n; } });
// Riot (Übersicht 17.11.): Lux ist Ionic Spark + Trickshot laut Dev Drop, Mobalytics sagte Prodigy – Riots Ionic-Spark-Liste enthält Lux, die Klasse bleibt offen

// ---------- 2. Ordner im Client ----------
const FOLDER = {'Akali (K/DA)': 'Akali_KDA', 'Akali (True Damage)': 'Akali_TrueDamage', 'Nunu & Willump': 'Nunu', 'Twisted Fate': 'Twisted_Fate', 'Camille': 'Camille_', "K'Sante": 'KSante', "Kai'Sa": 'Kaisa', 'Dr. Mundo': 'DrMundo'};
const folderOf = c => FOLDER[c.n + '|' + c.t[0]] || FOLDER[c.n] || c.n.replace(/[^A-Za-z]/g, '');
const slug = c => c.base === 'Akali' ? (c.t[0] === 'K/DA' ? 'akali-kda' : 'akali-true-damage') : c.n.toLowerCase().replace(/&/g, '').replace(/[^a-z]+/g, '-').replace(/^-|-$/g, '');
const apiOf = (c, f) => {
  const da = fs.existsSync(path.join(DA_DIR, f)) ? fs.readdirSync(path.join(DA_DIR, f)).filter(x => /^DA_.*\.uasset$/.test(x)).map(x => x.replace('.uasset', '')) : [];
  const base = da.filter(x => !/_(AutoAttack|Unlock|Override|HeroAugment|Tooltip|Recommended|Transformed|Tranformed|Mounted|3Star|Pinball|Violin|Tier5|Empowered|APOverride|AllOut|WinSide)|Role$/.test(x));
  if (c.n === 'Seraphine') return 'DA_SeraphineIndie19';
  return base.sort((a, b) => a.length - b.length)[0] || 'DA_' + f.replace(/[^A-Za-z]/g, '') + '19';   // ohne eigenes Paket (Baron, Sona, Teemo): Riots ID-Schema
};
// Werte aus dem Client: Grundwerte im Champion-Paket (DA_…: Name aus der Namensliste, Wert als float 16 Byte dahinter),
// Fähigkeitszahlen in der Curve Table (CT_…, tools/unreal/ct-werte.js; Zeit 1/2/3 = Sterne, Zwischenwerte linear)
const {ctValues, nameMap} = require(path.join(ROOT, 'tools', 'unreal', 'ct-werte.js'));
function readStats(f, api) {
  const file = path.join(DA_DIR, f, api + '.uasset'); if (!fs.existsSync(file)) return null;
  const b = fs.readFileSync(file), n = nameMap(b); if (!n) return null;
  const got = {};
  for (let o = 0; o + 20 <= b.length; o++) { const i = b.readInt32LE(o); if (i < 0 || i >= n.length || b.readInt32LE(o + 4) !== 0) continue;
    const k = n[i]; if (!['Armor', 'AttackSpeed', 'HealthMax', 'MagicResist', 'ManaMax', 'AttackRange', 'Mana'].includes(k) || k in got) continue;
    const v = b.readFloatLE(o + 16); if (Number.isFinite(v) && v >= 0 && v < 100000 && Number.isNaN(b.readFloatLE(o + 8))) got[k] = +v.toFixed(3); }
  return got;
}
function readCT(f) {
  const d = path.join(DA_DIR, f); if (!fs.existsSync(d)) return {};
  const ct = fs.readdirSync(d).filter(x => /^CT_.*\.uasset$/.test(x)).sort((a, b) => a.length - b.length)[0]; if (!ct) return {};
  const raw = ctValues(path.join(d, ct)); if (raw.err) return {};
  const at = (keys, s) => { const t = Object.keys(keys).map(Number).sort((a, b) => a - b); if (keys[s] != null) return keys[s];
    const lo = t.filter(x => x < s).pop(), hi = t.find(x => x > s); if (lo == null) return keys[hi]; if (hi == null) return keys[lo];
    return +(keys[lo] + (keys[hi] - keys[lo]) * (s - lo) / (hi - lo)).toFixed(3); };
  return Object.fromEntries(Object.entries(raw).map(([k, keys]) => [k, [1, 2, 3].map(s => at(keys, s))]));
}
const BASIS = fs.existsSync(path.join(__dirname, 'basis-texte.json')) ? require('./basis-texte.json') : {champions: {de: {}, en: {}}, traits: {de: {}, en: {}}};
const EN_CH = {}, EN_TR = {};
// Die deutschen Basistexte hinken nach PBE-Patches hinterher: geänderte Werte stehen dort als „?“ (Platzhalter fehlt) oder als alte Zahl.
// fillQ: „?“ an derselben Stelle wie im englischen Text durch dessen Platzhalter ersetzen (nur wenn beide Texte gleich viele Werte haben).
// v: Werte des Champions – Platzhalter, die es dort nicht mehr gibt (eigene Übersetzung mit altem Wert), zählen wie „?“
function fillQ(de, en, v) {
  const T = /@v_[A-Za-z0-9_]+@|(?<![\w%])\?(?![\w])/g, a = String(de || '').match(T) || [], b = String(en || '').match(T) || [];
  const alt = m => m === '?' || (v && m[0] === '@' && !v[m.slice(1, -1)]);
  if (!a.some(alt) || a.length !== b.length) return de; let i = 0; return de.replace(T, m => { const e = b[i++]; return alt(m) && e !== '?' ? e : m; });
}
// syncN: einzelne Zahlen einer Trait-Stufe (außerhalb von @…@ und %i:…%) wie im englischen Text – gleiche Anzahl vorausgesetzt, deutsches Komma
function syncN(de, en) {
  const SEG = /(@[^@]+@|%i:[A-Za-z]+%)/, N = /\d+(?:[.,]\d+)?/g, nums = s => String(s).split(SEG).filter((x, i) => i % 2 === 0).join(' ').match(N) || [];
  const a = nums(de), b = nums(en); if (a.length !== b.length || a.every((x, i) => x.replace(',', '.') === b[i])) return de;
  let i = 0; return String(de).split(SEG).map((x, k) => k % 2 ? x : x.replace(N, () => b[i++].replace('.', ','))).join('');
}
// Kampfwerte einer Trait-Stufe für den Kampf-Simulator (assets/js/sim.js → simTraitGeneric): aus den Symbolen im Text, z. B. „%i:scaleHealth% 100, %i:scaleAS% 10%“
function traitStats(t) {
  const K = {scaleHealth: 'Health', scaleAS: 'AS', scaleAD: 'AD', scaleAP: 'AP', scaleArmor: 'Armor', scaleMR: 'MR', scaleDA: 'DamageAmp', scaleDR: 'Durability', scaleDurability: 'Durability', scaleOmnivamp: 'Omnivamp', scaleSV: 'Omnivamp', scaleCrit: 'CritChance', scaleCritChance: 'CritChance'};
  const v = {};
  for (const m of String(t || '').matchAll(/((?:%i:scale\w+%\s*)+)(\d+(?:[.,]\d+)?)\s*(%)?/g)) {
    const ics = [...m[1].matchAll(/%i:(scale\w+)%/g)].map(x => x[1]), n = parseFloat(m[2].replace(',', '.')), pct = !!m[3];
    const keys = ics.includes('scaleArmor') && ics.includes('scaleMR') ? ['Resists'] : ics.map(i => K[i]).filter(Boolean);
    for (const k of keys) { if (v[k] != null) continue; v[k] = k === 'AP' || k === 'Health' && !pct || k === 'Armor' || k === 'MR' || k === 'Resists' ? n : pct || k === 'AD' ? n / 100 : n; if (k === 'Health' && pct) v[k] = n / 100; }
  }
  return v;
}
// Eigene deutsche Übersetzungen, wo die Basistexte auf Deutsch noch englisch sind (tools/set19/uebersetzungen-de.json)
const UE = fs.existsSync(path.join(__dirname, 'uebersetzungen-de.json')) ? JSON.parse(fs.readFileSync(path.join(__dirname, 'uebersetzungen-de.json'), 'utf8')) : {champions: {}, traits: {}};
// Trait-Text wie in Riots Daten: Beschreibung, Leerzeile, je Stufe „(n) …“
const trText = t => t ? [t.d, ...(t.rows || []).map(r => `(${r.n}) ${r.t}`)].filter(Boolean).join('\\n') : '';
const pickImg = (f, re) => { const d = path.join(CH_PNG, f); if (!fs.existsSync(d)) return null; const l = fs.readdirSync(d).filter(x => re.test(x)).sort((a, b) => /Base|F1|^T_19_/.test(b) - /Base|F1|^T_19_/.test(a)); return l[0] ? path.join(d, l[0]) : null; };

// ---------- 3. Traits: Stufen (Riot) und Icons (Client) ----------
global.window = {}; require(path.join(ROOT, 'data', 'custom-19.js')); const CUSTOM = window.TFT_CUSTOM;
const BP = {'Beach Pop': [3, 5, 7], 'Classical': [2, 4, 6], 'EDM': [2], 'Gu Feng': [2, 3, 4], 'Heartsteel': [1, 3, 5, 7], 'Hyperpop': [2, 3, 4, 5], 'Illbeats': [2, 3, 4],
  'Ionic Spark': [3, 5, 7], 'Jazz': [2, 3, 4], 'K/DA': [3, 5, 7, 10, 13, 15], 'Pentakill': [3, 5, 7], 'R&B': [1, 2], 'Rock': [3, 4, 5, 7], 'True Damage': [3, 5]};
// Icons wie in Riots Trait-Dateien (DA_<Trait>19 bzw. DA_<Champion>19_UniqueTrait verweisen darauf; interne Namen: Heavenscale = Gu Feng,
// Virtuoso = Classical, Synchmancer = Beat Master, DemonVision = Rock, GlitterBomb = Hyperpop, OceanSong = Beach Pop, Mosher = Slayer)
const ICON = {'Arcanist': 'T_Arcanist19', 'Beach Pop': 'T_TraitIcon_19_BeachPop', 'Classical': 'T_TraitIcon_19_Virtuoso', 'Gu Feng': 'T_TraitIcon_19_Heavenscale',
  'Beat Master': 'T_TraitIcon_19_Synchmancer', 'Ionic Spark': 'T_TraitIcon_19_IonicSpark', 'K/DA': 'T_TraitIcon_19_KDA', 'True Damage': 'T_TraitIcon_19_Truedamage', 'R&B': 'T_TraitIcon_19_RnB',
  '8-Bit': 'T_MissFortune19_UniqueTrait_Icon', 'Boy Band': 'T_Rakan19_UniqueTrait_Icon', 'Emo': 'T_Amumu19_UniqueTrait_Icon', 'Hype Man': 'T_TraitIcon_19_HypeMan',
  'One Monster Band': 'T_TraitIcon_19_OneMonsterBand', 'Melodic Heart': 'T_TraitIcon_19_MelodicHeart', 'Record Mogul': 'T_TraitIcon_19_RecordMogul'};
const iconFile = n => { const k = ICON[n] || 'T_TraitIcon_19_' + n.replace(/[^A-Za-z]/g, ''); const f = path.join(TR_PNG, k + '.png'); return fs.existsSync(f) ? f : null; };

// ---------- 4. Bilder als WebP (Edge headless, Canvas) ----------
async function toWebp(jobs) {
  const edge = path.join(process.env['ProgramFiles(x86)'], 'Microsoft', 'Edge', 'Application', 'msedge.exe');
  const port = 9300 + Math.floor(Math.random() * 500), prof = fs.mkdtempSync(path.join(os.tmpdir(), 'edgeprof-'));
  const ed = spawn(edge, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${prof}`, 'about:blank'], {stdio: 'ignore'});
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  let tabs; for (let i = 0; i < 40; i++) { try { tabs = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); if (tabs.length) break; } catch (e) {} await sleep(250); }
  const ws = new WebSocket(tabs.find(t => t.type === 'page').webSocketDebuggerUrl); await new Promise(r => ws.onopen = r);
  let n = 0; const wait = {}; ws.onmessage = m => { const d = JSON.parse(m.data); if (d.id && wait[d.id]) { wait[d.id](d); delete wait[d.id]; } };
  const send = (method, params = {}) => new Promise(r => { const i = ++n; wait[i] = r; ws.send(JSON.stringify({id: i, method, params})); });
  for (const j of jobs) {
    const src = 'data:image/png;base64,' + fs.readFileSync(j.src).toString('base64');
    const r = await send('Runtime.evaluate', {awaitPromise: true, returnByValue: true, expression: `new Promise(res=>{const i=new Image();i.onload=()=>{const W=${j.w}||i.width,H=${j.h}||Math.round(i.height*W/i.width);const c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');x.imageSmoothingQuality='high';x.drawImage(i,0,0,W,H);res(c.toDataURL('image/webp',${j.q || 0.86}))};i.src=${JSON.stringify(src)}})`});
    fs.writeFileSync(j.out, Buffer.from(r.result.result.value.split(',')[1], 'base64'));
  }
  ws.close(); ed.kill();
}

(async () => {
  const jobs = [], out = [], warn = [];
  for (const c of champs) {
    const f = folderOf(c), s = slug(c);
    const sq = pickImg(f, /(Mobile|MOBILE)/i), card = pickImg(f, /_PC|Photoshop5|PC_256/i);
    const o = {api: apiOf(c, f), n: c.n, c: c.c, t: c.t};
    if (sq) { jobs.push({src: sq, out: path.join(OUT_IMG, 'champions', s + '.webp'), w: 256, h: 256}); o.sq = `assets/img/set19/champions/${s}.webp`; o.tile = o.sq; } else warn.push(c.n + ': kein Bild');
    if (card) { jobs.push({src: card, out: path.join(OUT_IMG, 'champions', s + '-karte.webp'), w: 256}); o.card = `assets/img/set19/champions/${s}-karte.webp`; }
    if (c.lock) o.lock = 1;
    const sv = readStats(f, o.api), cv = readCT(f);
    // Nahkämpfer haben im Paket keine AttackRange (Standard 1); ohne Angriffsschaden (keine Curve Table) lieber keine Werte als falsche
    const ad = cv.AutoAttackDamage ? cv.AutoAttackDamage[0] : null;
    if (sv && sv.HealthMax && ad != null) o.st = {hp: sv.HealthMax, mana: sv.ManaMax ?? 0, mana0: sv.Mana ?? 0, ad, as: sv.AttackSpeed, ar: sv.Armor, mr: sv.MagicResist, crit: 0.25, range: sv.AttackRange ?? 1};
    else {
      // Ersatz: Grundwerte aus tools/set19/basis-werte.json, Leben aus Riots Video, wo dort keins steht (Locke, Shyvana)
      const BW = fs.existsSync(path.join(__dirname, 'basis-werte.json')) ? require('./basis-werte.json') : {}, VIDEO_HP = {'Locke': 1000, 'Shyvana': 1000};
      const w = BW[c.n.toLowerCase().replace(/['.]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')], hp = w && (w.hp || VIDEO_HP[c.n]);
      if (w && hp && w.ad != null) o.st = {hp, mana: 0, mana0: 0, ad: w.ad, as: w.as, ar: w.ar, mr: w.mr, crit: 0.25, range: w.range || 1};
      else warn.push(c.n + ': keine Grundwerte');
    }
    const abv = Object.fromEntries(Object.entries(cv).filter(([k]) => k !== 'AutoAttackDamage'));
    if (Object.keys(abv).length) o.abv = abv;
    // Fähigkeit (Name, Text mit Werten pro Stern, Mana) und Unlock-Bedingung aus den Basistexten (tools/set19/basis-texte.json) – deutscher Text, sonst englischer
    const bd = BASIS.champions.de[o.api], be = BASIS.champions.en[o.api];
    if (bd || be) {
      const x = bd && bd.d ? bd : be, deGleich = bd && be && bd.d === be.d;
      o.ab = {n: (bd && bd.ab) || be.ab, d: deGleich && UE.champions[o.api] ? UE.champions[o.api] : x.d, v: {...(be ? be.v : {}), ...(bd ? bd.v : {})}};
      if (be && be.d) o.ab.d = fillQ(o.ab.d, be.d, o.ab.v);
      if (be && be.d) EN_CH[o.api] = {n: be.ab, d: be.d};
      const mana = (bd || be).mana; if (o.st && mana && mana.length === 2) { o.st.mana0 = mana[0]; o.st.mana = mana[1]; }
      if ((bd && bd.unlock) || (be && be.unlock)) o.unlock = {de: bd && bd.unlock || be.unlock, en: be && be.unlock || bd.unlock};
      // Diese Bedingungen sind in den Basistexten nicht übersetzt – eigene Übersetzung mit Riots Begriffen
      const UL_DE = {'Akali (True Damage)': 'Verdiene 350 True-Damage-Bling, ohne dass K/DA-Akali freigeschaltet ist', 'Mordekaiser': '10 einzigartige Sternestufen von Pentakill',
        'Taliyah': 'Je ein Champion jeder Kostenstufe beginnt auf einem Beach-Pop-Feld', 'Teemo': 'Sammle 900 Hyperpop-Hype',
        'Thresh': 'Gegner sind insgesamt 275 Sekunden lang von Classical gebannt', 'Samira': '2 Gegenstände auf einem Classical-, Renegade- oder Trickshot-Champion',
        'Kobuko': '2-Sterne-Ziggs mit 1 Gegenstand'};
      if (o.unlock && o.unlock.de === o.unlock.en && UL_DE[c.n]) o.unlock.de = UL_DE[c.n];
      // eigene Fassung hat Vorrang (die Basistexte mischen oft „Erf. St. 7 - <englischer Text>“), Trait-Namen wie auf der Seite
      if (o.unlock && (UE.unlocks || {})[c.n]) o.unlock.de = UE.unlocks[c.n];
      if (o.ab) for (const [a, b] of Object.entries(UE.ersetzen || {})) o.ab.d = o.ab.d.split(a).join(b);
    } else warn.push(c.n + ': nicht in den Basistexten (' + o.api + ')');
    out.push(o);
  }
  // PBE-Balance-Änderungen (tools/set19/pbe-aenderungen.json): Riot patcht den PBE fast täglich, Client und Basisdaten haben den alten Stand.
  // Ersetzt nur, solange noch der alte Stand drin ist – sonst Hinweis (dann ist die Quelle schon aktuell oder der Schlüssel falsch)
  const PBE = fs.existsSync(path.join(__dirname, 'pbe-aenderungen.json')) ? JSON.parse(fs.readFileSync(path.join(__dirname, 'pbe-aenderungen.json'), 'utf8')).updates : [];
  const repAll = (s, pairs, wo) => (pairs || []).reduce((t, [a, b]) => { if (t.includes(a)) return t.split(a).join(b); if (!t.includes(b)) warn.push(`PBE: „${a.slice(0, 40)}“ nicht gefunden (${wo})`); return t; }, s);
  for (const u of PBE) {
    for (const [n, vals] of Object.entries(u.werte || {})) { if (n.startsWith('_')) continue; const o = out.find(c => c.n === n); if (!o || !o.ab) { warn.push('PBE: Champion fehlt ' + n); continue; }
      for (const [k, v] of Object.entries(vals)) { if (o.ab.v[k]) o.ab.v[k] = v; else warn.push(`PBE: ${n} ohne Wert ${k}`); } }
    for (const [n, tx] of Object.entries(u.texte || {})) { const o = out.find(c => c.n === n); if (!o || !o.ab) continue;
      o.ab.d = repAll(o.ab.d, tx.de, n + ' de'); if (EN_CH[o.api]) EN_CH[o.api].d = repAll(EN_CH[o.api].d, tx.en, n + ' en'); }
    for (const [n, ul] of Object.entries(u.unlocks || {})) { const o = out.find(c => c.n === n); if (o) o.unlock = ul; }
    // Grundwerte (Leben, Mana, Angriffstempo …): der Client-Stand ist älter als die PBE-Patches
    for (const [n, st] of Object.entries(u.stats || {})) { const o = out.find(c => c.n === n); if (o && o.st) Object.assign(o.st, st); else warn.push('PBE: Werte fehlen ' + n); }
  }
  const traitNames = Object.keys(CUSTOM.traits);
  const used = new Set(champs.flatMap(c => c.t)); used.forEach(t => { if (!CUSTOM.traits[t]) warn.push('Trait nicht in custom-19: ' + t); });
  const traits = traitNames.map(n => {
    const m = CUSTOM.traits[n], o = {api: 'TFT19_' + n.replace(/[^A-Za-z0-9]/g, ''), n};
    // Stufen und Texte aus den Basistexten (auch für Klassen); Stil je Stufe wie in Riots Daten (1 Bronze, 3 Silber, 5 Gold, 6 Prismatisch, 4 einzigartig)
    const ten = BASIS.traits.en[n], ue = UE.traits[n]; let tde = BASIS.traits.de[n];
    // deutsche Fassung: wo die Basistexte noch englisch sind, die eigene Übersetzung (Beschreibung und einzelne Stufen)
    const TT = UE.traitTexte || {}, tr = x => TT[x] || x;
    if (!tde && ten) tde = {...ten, name: ''};   // Trait nur auf Englisch (R&B): englische Fassung übersetzen
    if (tde) tde = {...tde, d: tr(tde.d), rows: tde.rows.map(r => ({...r, t: tr(r.t)}))};
    if (tde && ten && ue) tde = {...tde, d: tde.d === ten.d && ue.d ? ue.d : tde.d, rows: tde.rows.map(r => ue.rows && ue.rows[r.n] && r.t === (ten.rows.find(e => e.n === r.n) || {}).t ? {...r, t: ue.rows[r.n]} : r)};
    // nach PBE-Patches: Zahlen der deutschen Stufen wie im (aktuellen) englischen Text, „?“ füllen; „Shield“ ist teils nicht übersetzt
    if (tde && ten) tde = {...tde, d: fillQ(tde.d, ten.d), rows: tde.rows.map((r, i) => { const e = ten.rows[i]; return e && e.n === r.n ? {...r, t: syncN(fillQ(r.t, e.t), e.t).replace(/ Shield;/g, ' Schild;')} : r; })};
    if (tde && tde.name && tde.name !== n && tde.name.toUpperCase() !== n.toUpperCase()) o.de = tde.name;
    const rows = (ten || tde || {}).rows || [];
    const STYLE = {bronze: 1, silver: 3, gold: 5, prismatic: 6};
    if (rows.length) { const uq = rows.filter((r, i) => rows.findIndex(x => x.n === r.n) === i); o.bp = uq.map(r => r.n); o.bs = uq.length === 1 && o.bp[0] === 1 ? [4] : uq.map(r => STYLE[r.s] || 1); }
    else o.bp = BP[n] || (m.group === 'solo' ? [1] : []);
    // wie in Riots Trait-Texten: Zeilen mit <br> getrennt (nicht \n), jede Stufe als <row>(n) …</row>
    const br = x => String(x || '').replace(/\\n/g, '<br>');
    const row = (t) => t ? [br(t.d), ...(t.rows || []).map(r => `<row>(${r.n}) ${br(r.t)}</row>`)].filter(Boolean).join('<br>') : '';
    if (tde || ten) { o.desc = row(tde && (tde.d || (tde.rows || []).length) ? tde : ten); o.fx = rows.length ? rows.map(r => ({min: r.n, v: traitStats(r.t)})) : o.bp.map(b => ({min: b, v: {}})); /* je Zeile eine Stufe (A-/B-Seite, Prismatisch haben dieselbe Zahl) */ if (ten) EN_TR[o.api] = row(ten); }
    const ic = iconFile(n); if (ic) { const s = n.toLowerCase().replace(/&/g, 'n').replace(/[^a-z0-9]+/g, '-'); jobs.push({src: ic, out: path.join(OUT_IMG, 'traits', s + '.webp'), w: 64, h: 64, q: 0.92}); o.icon = `assets/img/set19/traits/${s}.webp`; }
    else { warn.push('Trait ohne Icon: ' + n); o.icon = 'assets/img/set19/traits/leer.svg'; }
    if (!o.bp.length) o.bpOffen = 1;
    return o;
  });
  // PBE-Änderungen an Trait-Texten: {Trait: {de: [[alt, neu]], en: [[alt, neu]]}}
  for (const u of PBE) for (const [n, tx] of Object.entries(u.traits || {})) { const o = traits.find(t => t.n === n); if (!o) { warn.push('PBE: Trait fehlt ' + n); continue; }
    if (o.desc) o.desc = repAll(o.desc, tx.de, n + ' de'); if (EN_TR[o.api]) EN_TR[o.api] = repAll(EN_TR[o.api], tx.en, n + ' en'); }
  fs.writeFileSync(path.join(OUT_IMG, 'traits', 'leer.svg'), '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><path d="M32 6l22 13v26L32 58 10 45V19z" fill="none" stroke="#fff" stroke-width="5" opacity=".7"/></svg>');
  // Mitglieder prüfen: Riots Übersicht (Bands) gegen die Champion-Liste
  const RIOT = {'Beach Pop': 'Taric, Zoe, Ashe, Renekton, Syndra, Graves, Zac, Taliyah', 'Classical': 'Katarina, Nasus, Renata Glasc, Samira, Jhin, Thresh, Vladimir', 'EDM': 'Jax, Vi', 'Gu Feng': 'Wukong, Xayah, Janna, Lee Sin',
    'Heartsteel': "Kayn, Sett, Ezreal, K'Sante, Alune, Yone, Aphelios", 'Hyperpop': 'Kobuko, Ziggs, Lulu, Tristana, Teemo', 'Illbeats': 'Illaoi, Braum, Draven, Yuumi', 'Ionic Spark': 'Elise, Yunara, Annie, Lux, Briar, Tibbers, Aurora, Jinx, Shyvana, Gwen',
    'Jazz': 'Lucian, Bard, Galio, Smeech', 'K/DA': "Lillia, Neeko, Gragas, Evelynn, Kai'Sa, Ahri, Leona, Akali", 'Pentakill': 'Gnar, Olaf, Karthus, Viego, Kayle, Yorick, Mordekaiser', 'R&B': 'Mel, Rell',
    'Rock': 'Olaf, Varus, Camille, Swain, Locke, Vayne, Pyke', 'True Damage': 'Kennen, Qiyana, Ekko, Senna, Yasuo, Akali'};
  for (const [t, l] of Object.entries(RIOT)) { const a = l.split(', ').sort().join(','), b = out.filter(c => c.t.includes(t)).map(c => c.n.replace(/ \(.*\)$/, '')).sort().join(','); if (a !== b) warn.push(`${t}: Riot ${a} ≠ Liste ${b}`); }

  await toWebp(jobs);
  const J = x => JSON.stringify(x);
  const head = `// TFTClimb – Set 19 (PBE), von Hand zusammengebaut mit tools/set19/bauen.js – CommunityDragon liefert Set 19 nicht (eigener TFT-Client seit 18.6)\n// Quellen: Riot „Prismatic Tour Overview“ (Trait-Stufen), Dev-Drop-Liste (Kosten/Traits), PBE-Client (Bilder) · erzeugt am ${TODAY}\nwindow.TFT_DATA = {\nset:19, channel:"pbe", version:"${VERSION}", generated:"${TODAY}", cdn:"", manual:true,\n`;
  // Items: die Standard-Items (Komponenten, fertige, strahlende) sind dieselben wie in Set 18 – Riots Empfehlungen für Set 19 (data/rollen-19.js)
  // verweisen genau auf diese IDs. Icons mit voller Adresse (cdn ist hier leer). Änderungen aus dem Video kommen später dazu (bp: „am PBE prüfen“)
  global.window = {}; require(path.join(ROOT, 'data', 'tft-data-18.js')); const D18 = window.TFT_DATA;
  const items = D18.items.filter(i => ['component', 'craft', 'radiant'].includes(i.cat)).map(i => ({...i, icon: /^https?:/.test(i.icon) ? i.icon : D18.cdn + i.icon, aus18: 1}));
  // Set-19-eigene Items (tools/set19/items-19.json): Embleme, Artefakte, Support, Trait-Items, Verbrauchsgegenstände; englischer Text → tft-data-19-en.js
  const I19 = fs.existsSync(path.join(__dirname, 'items-19.json')) ? require('./items-19.json') : [], EN_IT = {};
  for (const x of I19) { if (items.some(i => i.id === x.id)) continue; const {en_desc, ...o} = x; items.push(o); if (en_desc) EN_IT[x.id] = en_desc; }
  // PBE-Änderungen an den Werten der Standard-Items (die kommen aus Set 18): {Item-ID: {Wert: neu}}
  for (const u of PBE) for (const [id, fx] of Object.entries(u.items || {})) { const it = items.find(i => i.id === id); if (!it) { warn.push('PBE: Item fehlt ' + id); continue; } it.fx = {...it.fx, ...fx}; }
  // Augments aus den Basistexten (Name, Stufe, Text DE/EN); Symbol: wie in Set 18 (gleiche ID/Name), sonst aus dem PBE-Client (tools/set19/augment-icons.js → C:\t19augpng),
  // sonst das Symbol eines verwandten Augments (Pyramid Scheme Level 2 → Pyramid Scheme, …_II → …_I)
  const A18 = D18.augments, a18id = new Map(A18.map(x => [x.id, x])), a18n = new Map(A18.map(x => [x.en.toLowerCase(), x]));
  const vals = (d, v) => String(d || '').replace(/@(v_[A-Za-z0-9_]+)@/g, (m, k) => v && v[k] ? v[k].join('/') : '?');
  const AE = (BASIS.augments || {}).en || {}, AD = (BASIS.augments || {}).de || {}, augs = [], EN_AUG = {};
  fs.mkdirSync(path.join(OUT_IMG, 'augments'), {recursive: true});
  const pngOf = id => { const p = path.join('C:/t19augpng', id + '.png'); return fs.existsSync(p) ? p : null; };
  const stem = id => id.replace(/_Level\d+$|(?:_?(?:I{1,3}|Gold|Silver|Prismatic|Plus|Late|\d))$/i, '');   // Late: Stakeholder Management+ = StakeholderMeeting
  for (const [id, e] of Object.entries(AE)) {
    const d = AD[id] || e, old0 = a18id.get(id) || a18n.get(e.name.toLowerCase()), old = old0 && !/missing-t/.test(old0.icon || '') ? old0 : null;   // Set-18-Platzhalter zählt nicht als Symbol
    const deTxt = AD[id] && AD[id].d === e.d && (UE.augments || {})[id] ? UE.augments[id] : d.d;   // eigene Übersetzung, wo der Basistext noch englisch ist
    const o = {id, en: e.name, de: d.name || e.name, desc: vals(fillQ(deTxt, e.d), {...e.v, ...d.v}), fx: {}, lv: e.lv || (old0 && old0.lv) || 1};
    if (old) o.icon = /^https?:/.test(old.icon) ? old.icon : D18.cdn + old.icon;
    else { let p = pngOf(id), sid = id; while (!p && stem(sid) !== sid) { sid = stem(sid); p = pngOf(sid) || Object.keys(AE).filter(k => k !== id && k.startsWith(sid)).map(pngOf).find(Boolean); }
      if (p) { const fn = path.basename(p, '.png').toLowerCase() + '.webp'; if (!jobs.some(j => j.out.endsWith(fn))) jobs.push({src: p, out: path.join(OUT_IMG, 'augments', fn), q: 0.9}); o.icon = 'assets/img/set19/augments/' + fn; }
      else { o.icon = D18.cdn + 'assets/maps/tft/icons/augments/hexcore/missing-t' + o.lv + '.png'; warn.push('Augment ohne Symbol: ' + e.name); } }
    if (e.rounds && e.rounds.length) o.r = e.rounds;
    augs.push(o); EN_AUG[id] = vals(e.d, e.v);
  }
  for (const u of PBE) for (const [id, tx] of Object.entries(u.augments || {})) { const a = augs.find(x => x.id === id); if (!a) { warn.push('PBE: Augment fehlt ' + id); continue; }
    a.desc = repAll(a.desc, tx.de, id + ' de'); if (EN_AUG[id]) EN_AUG[id] = repAll(EN_AUG[id], tx.en, id + ' en'); }
  await toWebp(jobs.filter(j => j.out.includes(path.sep + 'augments' + path.sep)));
  const body = `champions:[\n${out.map(J).join(',\n')}\n],\ntraits:[\n${traits.map(J).join(',\n')}\n],\nitems:[\n${items.map(J).join(',\n')}\n],\naugments:[\n${augs.map(J).join(',\n')}\n]\n};\n`;
  fs.writeFileSync(path.join(ROOT, 'data', 'tft-data-19.js'), head + body);
  fs.writeFileSync(path.join(ROOT, 'data', 'tft-data-19-en.js'), '// TFTClimb – englische Texte zu Set 19 (noch keine – Set 19 wird von Hand gebaut, tools/set19/bauen.js)\nwindow.TFT_DATA_EN = ' + JSON.stringify({champions: EN_CH, traits: EN_TR, items: EN_IT, augments: EN_AUG}) + ';\n');
  console.log(`Champions: ${out.length} (7 Gold: ${out.filter(c => c.c === 7).length}) · Traits: ${traits.length} · Bilder: ${jobs.length}`);
  console.log(warn.length ? 'Hinweise:\n  ' + warn.join('\n  ') : 'keine Hinweise');
  process.exit(0);
})();
