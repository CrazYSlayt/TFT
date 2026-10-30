/*
  TFTClimb – Team-Planer-Codes der Champions holen → data/planner-<Set>.json
  ---------------------------------------------------------------------------
  Riot vergibt jedem Champion eine Nummer für den Team-Planer im Spiel (team_planner_code, CommunityDragon:
  plugins/rcp-be-lol-game-data/…/tftchampions-teamplanner.json). Damit baut die Tierlist einen Code, den man im Spiel
  in den Team-Planer einfügen kann (app.js: plannerCode). Die Datei wird erst beim Klick auf „Planer-Code kopieren“ geladen.

  Aufruf:  node tools/planer-codes.js [live|pbe]     – nach einem neuen Set (bzw. für den PBE mit „pbe“)
*/
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..'), ch = process.argv[2] === 'pbe' ? 'pbe' : 'latest';
(async () => {
  const url = `https://raw.communitydragon.org/${ch}/plugins/rcp-be-lol-game-data/global/default/v1/tftchampions-teamplanner.json`;
  const data = await (await fetch(url)).json();
  for (const [key, list] of Object.entries(data)) {
    const set = +(key.match(/\d+/) || [0])[0]; if (!set) continue;
    const map = {}; list.forEach(c => { if (c.display_name && c.team_planner_code != null) map[c.display_name] = c.team_planner_code; });
    const f = path.join(ROOT, 'data', `planner-${set}.json`), txt = JSON.stringify({set, key, codes: map});
    if (fs.existsSync(f) && fs.readFileSync(f, 'utf8') === txt) { console.log(`  unverändert: data\\planner-${set}.json`); continue; }
    fs.writeFileSync(f, txt); console.log(`  geschrieben: data\\planner-${set}.json (${Object.keys(map).length} Champions)`);
  }
})().catch(e => { console.error('Fehler:', e.message); process.exit(1); });
