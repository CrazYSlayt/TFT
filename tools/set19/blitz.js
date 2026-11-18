// Set 19: Fähigkeiten (Name, Mana, Text mit Werten pro Stern), Unlock-Bedingungen und Trait-Texte von blitz.gg lesen
// (Entscheidung CrazYSlayt 18.11.2026: fehlende offizielle Daten von den großen Datenseiten übernehmen, bis Riot/CommunityDragon sie liefert).
// Eingabe: die Seiten als HTML (tools/set19/LIESMICH.md), Zuordnung über Riots interne ID im Bildnamen (DA_Ahri19.webp).
//   node tools/set19/blitz.js <ordner mit blitz-de.html, blitz-en.html, blitz-tr-de.html, blitz-tr-en.html>  → tools/set19/blitz-daten.json
const fs = require('fs'), path = require('path');
const dir = process.argv[2]; const read = f => fs.readFileSync(path.join(dir, f), 'utf8').replace(/<!--[\s\S]*?-->/g, '');
const ent = s => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&#x27;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ');
// Riot-Text: Werte „a/b/c“ → @vN@ (Werte in v), Skalierungs-Symbole → %i:scaleX%, Umbrüche → \n (wie in Riots Daten), übrige Tags weg
function riot(html, v) {
  let s = html.replace(/<br\s*\/?>/gi, '\\n').replace(/<img[^>]*alt="(scale[A-Za-z]+)"[^>]*>/g, ' %i:$1% ').replace(/<img[^>]*>/g, '').replace(/<[^>]+>/g, '');
  s = ent(s).replace(/(-?\d+(?:\.\d+)?)(%?)\/(-?\d+(?:\.\d+)?)%?\/(-?\d+(?:\.\d+)?)%?(?:\/(-?\d+(?:\.\d+)?)%?)?/g, (m, a, p, b, c) => {
    // Schlüssel aus den Werten selbst, damit deutscher und englischer Text (andere Satzstellung) dieselben Platzhalter haben
    const k = 'v_' + [a, b, c].join('_').replace(/\./g, 'p').replace(/-/g, 'm'); v[k] = [+a, +b, +c]; return '@' + k + '@' + p; });
  return s.replace(/[ \t]+/g, ' ').replace(/ ?%i:/g, ' %i:').replace(/% (\s)/g, '%$1').replace(/\s*\\n\s*/g, '\\n').trim();
}
function champs(html) {
  const out = {};
  for (const a of html.split('<article class="unit').slice(1)) {
    const api = (a.match(/set19\/(DA_[A-Za-z0-9_]+)\.webp/) || [])[1]; if (!api) continue;
    const g = re => ((a.match(re) || [])[1] || '').trim();
    const v = {}, desc = g(/class="rich-description ability-description[^"]*"[^>]*>([\s\S]*?)<\/p>/);
    out[api] = {name: ent(g(/<h4 class="name[^"]*">([^<]+)<\/h4>/)), cost: +g(/cost(\d)"/) || null, role: ent(g(/class="unit-role[^"]*">([^<]+)</)),
      traits: [...a.matchAll(/class="trait-name[^"]*">([^<]+)</g)].map(m => ent(m[1])),
      unlock: ent(g(/class="[^"]*unlock-description[^"]*">([\s\S]*?)<\/p>/).replace(/<[^>]+>/g, '')),
      ab: ent(g(/class="ability-name[^"]*">([^<]+)</)), mana: (a.match(/class="mana-cost"><span>(\d+)<\/span> \/ <span>(\d+)<\/span>/) || []).slice(1).map(Number),
      d: desc ? riot(desc, v) : '', v};
  }
  return out;
}
// Traits je Adresse (englischer Slug, z. B. /de/tft/set19/traits/classical) – auf der deutschen Seite stehen deutsche Namen (Klassik, Moloch …)
function traits(html) {
  const out = {};
  for (const b of html.split(/<a href="\/(?:de\/)?tft\/set19\/traits\//).slice(1)) {
    const slug = b.slice(0, b.indexOf('"'));
    const name = ent(((b.match(/class="trait-name[^"]*">([^<]+)</) || [])[1] || '').trim()); if (!name) continue;
    const v = {}, d = riot(((b.match(/class="trait-description[^"]*">\s*<p[^>]*>([\s\S]*?)<\/p>/) || [])[1] || ''), v);
    const rows = [...b.split('class="trait-units')[0].matchAll(/trait-bonus-number ([a-z]+)[^>]*>(\d+)<\/span>\s*<span>\s*<p[^>]*>([\s\S]*?)<\/p>/g)].map(m => ({n: +m[2], s: m[1], t: riot(m[3], v)}));
    out[slug] = {name, d, rows, v};
  }
  return out;
}
// Augments: ID aus dem Bildnamen (set19/DA_19_….webp), Stufe aus der Textur (silver/gold/prismatic), Runden, Text
function augments(html) {
  const out = {}, LV = {silver: 1, gold: 2, prismatic: 3};
  for (const b of html.replace(/<!--[\s\S]*?-->/g, '').split('<div class="augment svelte').slice(1)) {
    const id = (b.match(/augments\/set19\/([A-Za-z0-9_]+)\.webp/) || [])[1]; if (!id) continue;
    // Stufe an der Leuchtfarbe des Symbols: Silber #477DCB, Gold #A18E21, Prismatisch #6838FF
    const glow = ((b.match(/drop-shadow\(0 0 4px (#[0-9A-Fa-f]{6})\)/) || [])[1] || '').toUpperCase(), lv = {'#477DCB': 1, '#A18E21': 2, '#6838FF': 3}[glow] || 0, v = {};
    const d = riot(((b.match(/class="rich-description augment-description[^"]*">([\s\S]*?)<\/p>/) || [])[1] || ''), v);
    out[id] = {name: ent(((b.match(/class="augment-name[^"]*">([^<]+)</) || [])[1] || '').trim()), lv, rounds: [...b.matchAll(/class="augment-tag type-caption--semi svelte[^"]*">(\d-\d)</g)].map(m => m[1]), d, v};
  }
  return out;
}
const AUG = fs.existsSync(path.join(dir, 'blitz-aug-en.html')) ? {en: augments(read('blitz-aug-en.html')), de: augments(read('blitz-aug-de.html'))} : null;
// Traits unter dem englischen Namen ablegen (wie in custom-19.js); deutsche Fassung mit deutschem Namen (name)
const trEn = traits(read('blitz-tr-en.html')), trDe = traits(read('blitz-tr-de.html')), byEn = (src) => Object.fromEntries(Object.entries(src).filter(([s]) => trEn[s]).map(([s, t]) => [trEn[s].name, t]));
const res = {champions: {de: champs(read('blitz-de.html')), en: champs(read('blitz-en.html'))}, traits: {de: byEn(trDe), en: byEn(trEn)}, augments: AUG};
fs.writeFileSync(path.join(__dirname, 'blitz-daten.json'), JSON.stringify(res, null, 1));
const c = res.champions.en; console.log(`Champions: ${Object.keys(c).length} (de ${Object.keys(res.champions.de).length}) · mit Text: ${Object.values(c).filter(x => x.d).length} · Unlocks: ${Object.values(c).filter(x => x.unlock).length} · Traits: ${Object.keys(res.traits.en).length} (de ${Object.keys(res.traits.de).length})` + (AUG ? ` · Augments: ${Object.keys(AUG.en).length} (de ${Object.keys(AUG.de).length})` : ''));
