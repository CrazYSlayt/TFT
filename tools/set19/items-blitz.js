// Set-19-Items von blitz.gg (Wunsch CrazYSlayt 20.11.2026): Embleme, Artefakte, Support-Items, Trait-Items (z. B. Schriftrolle der Bestie) und
// allgemeine Verbrauchsgegenstände – die Standard-Items (Komponenten, fertige, Lichtversionen) kommen weiter aus Set 18 (bauen.js).
// Blitz bettet alle Items als JSON in die Seite ein (Name, Text DE/EN, Rezept, Art); Symbole von Blitz' CDN → assets/img/set19/items/.
//   Invoke-WebRequest https://blitz.gg/tft/set19/items -OutFile <ordner>/blitz-items-en.html
//   Invoke-WebRequest https://blitz.gg/de/tft/set19/items -OutFile <ordner>/blitz-items-de.html
//   node tools/set19/items-blitz.js <ordner>   → tools/set19/items-19.json (danach node tools/set19/bauen.js)
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..', '..'), dir = process.argv[2];
const parse = f => { const h = fs.readFileSync(path.join(dir, f), 'utf8'); const u = h.replace(/\\"/g, '"').replace(/\\u003C/g, '<').replace(/\\u003E/g, '>').replace(/\\u0026/g, '&');
  const out = {}; for (const m of u.matchAll(/\{"apiKey":"([^"]+)"[^{}]*\}/g)) { try { out[m[1]] = JSON.parse(m[0].replace(/\\\\/g, '\\')); } catch (e) {} }
  return {out, listed: new Set([...h.matchAll(/items\/set19\/([A-Za-z0-9_]+)\.webp/g)].map(m => m[1]))}; };
const {out: E, listed} = parse('blitz-items-en.html'), {out: G} = parse('blitz-items-de.html');
global.window = {}; require(path.join(ROOT, 'data', 'tft-data-19.js')); const D = window.TFT_DATA;
const UE = JSON.parse(fs.readFileSync(path.join(__dirname, 'uebersetzungen-de.json'), 'utf8'));
const have = new Set(D.items.filter(i => i.aus18).map(i => i.id)), trByLow = new Map(D.traits.map(t => [t.n.toLowerCase(), t]));
const trDe = n => { const t = D.traits.find(x => x.n === n), u = (UE.traits || {})[n]; return (t && t.de) || (u && typeof u === 'object' ? u.name : u) || null; };
// Auswahl: was Blitz für Set 19 listet (Embleme, Artefakte, Support) + Trait-Items/-Verbrauchsgegenstände mit „19“ + allgemeine Verbrauchsgegenstände
const GENERAL = /^DA_(Consumable_|Reforger$|MasterworkUpgrade$|LuckyItemChest$|ScissorSalvager$|Tacticians|TacticiansCape$)/;
const pick = Object.values(E).filter(i => !have.has(i.apiKey) && (
  (listed.has(i.apiKey) && ['emblem', 'artifact', 'support'].includes(i.kind)) ||
  (/19/.test(i.apiKey) && ['misc', 'consumable'].includes(i.kind) && !/Booster/.test(i.apiKey)) ||
  (GENERAL.test(i.apiKey) && ['consumable', 'spatula'].includes(i.kind)) || (i.kind === 'radiant' && listed.has(i.apiKey))));
const CAT = {emblem: 'emblem', artifact: 'artifact', support: 'support', radiant: 'radiant'};
// Riot-Text von Blitz: Zahlen schon eingesetzt; Zeilenumbrüche wie in Riots Daten, Hinweis-Tags bleiben (die Seite stellt sie dar)
const txt = s => String(s || '').replace(/<br\s*\/?>/gi, '<br>').trim();
fs.mkdirSync(path.join(ROOT, 'assets', 'img', 'set19', 'items'), {recursive: true});
(async () => {
  const items = [], warn = [];
  for (const i of pick) {
    const g = G[i.apiKey] || i, id = i.apiKey;
    let en = i.name, de = g.name || en;
    if (i.kind === 'emblem') {   // Emblem-Name wie der Trait auf der Seite (Illbeats statt IllBeats); fehlt die deutsche Fassung, „<Trait>-Emblem“
      const t = trByLow.get(en.replace(/ Emblem$/, '').toLowerCase()); if (t) { en = t.n + ' Emblem'; const td = trDe(t.n); if (/ Emblem$|[„“"]/.test(de) || (td && !de.startsWith(td))) de = (td || t.n) + '-Emblem'; } else warn.push('Emblem ohne Trait: ' + en);
    }
    const f = id.toLowerCase().replace(/^da_/, '') + '.webp', out = path.join(ROOT, 'assets', 'img', 'set19', 'items', f);
    if (!fs.existsSync(out)) { const r = await fetch(`https://blitz-cdn.blitz.gg/blitz/tft/items/set19/${id}.webp`); if (r.ok) fs.writeFileSync(out, Buffer.from(await r.arrayBuffer())); else { warn.push('kein Symbol: ' + id); continue; } }
    const deTxt = g.description && g.description !== i.description ? g.description : i.description;
    items.push({id, en, de, icon: 'assets/img/set19/items/' + f, comp: (i.buildsFrom || []).filter(c => /^DA_Component_/.test(c)), desc: txt(deTxt), fx: {}, cat: CAT[i.kind] || 'other', en_desc: txt(i.description)});
  }
  items.sort((a, b) => a.cat.localeCompare(b.cat) || a.en.localeCompare(b.en));
  fs.writeFileSync(path.join(__dirname, 'items-19.json'), JSON.stringify(items, null, 1));
  const n = {}; items.forEach(i => n[i.cat] = (n[i.cat] || 0) + 1);
  console.log('Items:', items.length, JSON.stringify(n), warn.length ? '\n' + warn.join('\n') : '');
})();
