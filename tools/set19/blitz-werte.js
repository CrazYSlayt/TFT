// Grundwerte von blitz.gg-Detailseiten für Champions, deren Werte im Client-Paket nicht lesbar sind (Baron, Sona, Teemo …)
//   node tools/set19/blitz-werte.js baron-nashor rakan …   → ergänzt tools/set19/blitz-werte.json {slug: {hp, ar, mr, ad, as, range, mana0, mana}}
const fs = require('fs'), path = require('path');
const out = path.join(__dirname, 'blitz-werte.json'), res = fs.existsSync(out) ? JSON.parse(fs.readFileSync(out, 'utf8')) : {};
const KEY = {'Health': 'hp', 'Armor': 'ar', 'Magic Resist': 'mr', 'Attack Damage': 'ad', 'Attack Speed': 'as', 'Range': 'range', 'Attack Range': 'range', 'Mana': 'mana', 'Crit Chance': 'crit', 'Critical Strike Chance': 'crit'};
(async () => {
  for (const slug of process.argv.slice(2)) {
    const r = await fetch('https://blitz.gg/tft/set19/champions/' + slug, {headers: {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130.0'}});
    const s = (await r.text()).replace(/<!--[\s\S]*?-->/g, ''), o = {};
    for (const m of s.matchAll(/<dt[^>]*>([^<]+)<\/dt>\s*<dd[^>]*>([^<]+)<\/dd>/g)) { const k = KEY[m[1].trim()]; if (!k) continue; const v = m[2].trim().replace(/,/g, '');
      if (k === 'mana' && v.includes('/')) { const [a, b] = v.split('/').map(Number); o.mana0 = a; o.mana = b; } else o[k] = parseFloat(v); }
    res[slug] = o; console.log(slug, JSON.stringify(o));
  }
  fs.writeFileSync(out, JSON.stringify(res, null, 1) + '\n');
})();
