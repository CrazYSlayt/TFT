/*
  TFTClimb – Startseite index.html aus der Vorlage app.html erzeugen
  ------------------------------------------------------------------
  Vercel liefert / direkt als Datei aus (ohne api/page.js). Damit Suchmaschinen auch dort nur die Startseite sehen
  (eine H1, Kopfdaten, keine fremden Seiteninhalte), wird index.html hier genauso aufbereitet wie jede andere Adresse:
  api/page.js rendert "/" mit den Daten aus data/seo-meta.json. Die Datei bleibt voll funktionsfähig –
  das kleine Skript nach </main> holt die übrigen Seiten im Browser wieder aus ihren Vorlagen.

  Aufruf:  node tools/startseite.js     – nach JEDER Änderung an app.html (läuft auch am Ende von tools/seo-meta.js)
  Wichtig: index.html nie von Hand bearbeiten, sondern app.html.
*/
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..');
process.chdir(ROOT);
const page = require(path.join(ROOT, 'api', 'page.js'));
let html = page.render('/', page.SITE);
if (!/class="pg-tpl"/.test(html)) { console.error('Fehler: Startseite ließ sich nicht aufbereiten (fehlt "/" in data/seo-meta.json?) – index.html bleibt unverändert'); process.exit(1); }
html = html.replace(/^<!doctype html>/i, m => m + '\n<!-- Automatisch erzeugt aus app.html (tools/startseite.js) – nicht von Hand bearbeiten -->');
const f = path.join(ROOT, 'index.html');
if (fs.existsSync(f) && fs.readFileSync(f, 'utf8') === html) console.log('  unverändert: index.html');
else { fs.writeFileSync(f, html); console.log('  geschrieben: index.html (Startseite aus app.html)'); }
