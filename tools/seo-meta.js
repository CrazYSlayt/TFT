/*
  TFTClimb – Kopfdaten aller Seiten für Suchmaschinen erzeugen → data/seo-meta.json
  ---------------------------------------------------------------------------------
  Die Seite setzt Titel, Meta-Beschreibung, canonical, hreflang, Vorschau (og:) und strukturierte Daten per JavaScript.
  Suchmaschinen ohne JavaScript, Link-Vorschauen (Discord, WhatsApp, X) und viele SEO-Tools sehen davon nichts.
  Dieses Skript öffnet jede Seite aus der Sitemap einmal in Edge (unsichtbar), liest die fertigen Kopfdaten aus und speichert sie.
  api/page.js schreibt sie dann schon beim Ausliefern ins HTML – Wort für Wort dieselben Texte wie auf der Seite.

  Aufruf:  node tools/seo-meta.js
  Läuft auch automatisch in tools/update-data.ps1 (vor dem Veröffentlichen) – nach Änderungen an Texten, Tierlist oder Daten neu erzeugen.
*/
const http = require('http'), fs = require('fs'), path = require('path'), {spawn} = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const TYPES = {'.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.ico': 'image/x-icon'};
const sleep = ms => new Promise(r => setTimeout(r, ms));

// kleiner Webserver: Dateien aus dem Projekt, alle anderen Pfade → Vorlage app.html (wie online über api/page.js, nur ohne Aufbereitung)
function serve() {
  return new Promise(res => {
    const srv = http.createServer((req, rs) => {
      const u = decodeURIComponent(new URL(req.url, 'http://x').pathname);
      let f = path.join(ROOT, u);
      if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(ROOT, 'app.html');
      rs.writeHead(200, {'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream'});
      fs.createReadStream(f).pipe(rs);
    });
    srv.listen(0, '127.0.0.1', () => res(srv));
  });
}

function findBrowser() {
  const c = [path.join(process.env['ProgramFiles(x86)'] || '', 'Microsoft/Edge/Application/msedge.exe'), path.join(process.env.ProgramFiles || '', 'Microsoft/Edge/Application/msedge.exe'),
    path.join(process.env.ProgramFiles || '', 'Google/Chrome/Application/chrome.exe'), path.join(process.env.LOCALAPPDATA || '', 'Google/Chrome/Application/chrome.exe')];
  return c.find(f => f && fs.existsSync(f));
}

(async () => {
  const srv = await serve(), origin = 'http://127.0.0.1:' + srv.address().port;
  // Seitenliste aus der Sitemap (deutsche und englische Adressen)
  const sm = require(path.join(ROOT, 'api', 'sitemap.js')); let xml = '';
  process.chdir(ROOT);
  sm({headers: {host: '127.0.0.1'}}, {setHeader() {}, status() { return this; }, send(x) { xml = x; }});
  const paths = [...new Set([...xml.matchAll(/<loc>([^<]+)/g)].map(m => new URL(m[1]).pathname))];
  const browser = findBrowser(); if (!browser) throw new Error('Edge/Chrome nicht gefunden');
  const port = 9300 + Math.floor(Math.random() * 500), prof = path.join(require('os').tmpdir(), 'tftclimb-seo-' + port);
  const br = spawn(browser, ['--headless=new', '--disable-gpu', `--remote-debugging-port=${port}`, `--user-data-dir=${prof}`, '--window-size=1440,900', 'about:blank'], {stdio: 'ignore'});
  try {
    let tabs; for (let i = 0; i < 60; i++) { try { tabs = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); if (tabs.length) break; } catch (e) {} await sleep(250); }
    const ws = new WebSocket(tabs.find(t => t.type === 'page').webSocketDebuggerUrl);
    let id = 0; const pend = {};
    const send = (method, params = {}) => new Promise(r => { const i = ++id; pend[i] = r; ws.send(JSON.stringify({id: i, method, params})); });
    ws.onmessage = m => { const d = JSON.parse(m.data); if (d.id && pend[d.id]) { pend[d.id](d); delete pend[d.id]; } };
    await new Promise(r => ws.onopen = r);
    await send('Page.enable');
    const ev = async e => { const r = await send('Runtime.evaluate', {expression: e, returnByValue: true}); return r.result.result && r.result.result.value; };
    // Kopfdaten der aktuellen Seite – Adressen ohne Server-Teil, damit api/page.js sie mit der echten Domain zusammensetzt
    const read = `(() => { const O = location.origin, rel = s => s && s.startsWith(O) ? s.slice(O.length) || '/' : s || '';
      const a = s => (document.querySelector(s) || {}), m = s => a(s).content || '', ld = document.getElementById('ldPage');
      // pre: fertig gebaute Artikel der sichtbaren Seite ([data-pre], z. B. Augment-Chancen) – api/page.js schreibt sie ins HTML
      // data-pre-sel: nur die sichtbaren Teile, die der Selektor trifft (Cheatsheets: Kopf, gezeigte Tabelle, Artikel – nicht alle 38 versteckten Tabellen)
      const pre = {}; document.querySelectorAll('.page.active [data-pre]').forEach(el => { if (!el.getClientRects().length || !el.innerHTML.trim()) return;
        const html = el.dataset.preSel ? [...el.querySelectorAll(el.dataset.preSel)].filter(x => x.getClientRects().length).map(x => x.outerHTML).join('') : el.innerHTML;
        if (html.trim()) pre[el.dataset.pre] = html.split(O + '/').join('/'); });
      // h1/cr: sichtbare Überschrift und Brotkrumen darüber, fertig übersetzt – api/page.js ersetzt damit die Fassung aus index.html
      // (englische Seiten, Simulator mit eigener H1 auf der Builder-Seite)
      const vis = e => e && e.getClientRects().length, h1 = [...document.querySelectorAll('.page.active h1')].find(vis), cr = h1 && h1.parentNode.querySelector(':scope > .crumb');
      // hh: Container (id), in den app.js die Überschrift baut – bei Seiten, die erst JavaScript füllt (Cheatsheets, Champions, Comps …), setzt api/page.js die H1 dort vorab ein
      let host = h1 && h1.parentElement; while (host && !host.id) host = host.parentElement;
      const hx = {...(h1 ? {h1: h1.innerHTML.split(O + '/').join('/')} : {}), ...(cr ? {cr: cr.innerHTML.split(O + '/').join('/')} : {}),   // Brotkrumen auch, wenn das Design sie ausblendet
        ...(host && !host.classList.contains('page') ? {hh: host.id} : {})};
      return {t: document.title, d: m('meta[name="description"]'), r: m('meta[name="robots"]'), c: rel(a('link[rel="canonical"]').href),
        de: rel(a('link[hreflang="de"]').href), en: rel(a('link[hreflang="en"]').href), img: rel(m('meta[property="og:image"]')), loc: m('meta[property="og:locale"]'),
        tw: m('meta[name="twitter:card"]'), ld: ld ? ld.textContent.split(O).join('{{ORIGIN}}') : '', ...(Object.keys(pre).length ? {pre} : {}), ...hx,
        // sichtbare Seite und (bei Tools) das sichtbare Tool – api/page.js lässt nur diese als Inhalt im HTML stehen
        // tv: sichtbare Unteransicht (Tool, Profil bei Meet the Team, Guide) – gleiche Tabelle wie SUBVIEWS in api/page.js
        pg: (document.querySelector('.page.active') || {}).id || '', ...(() => { const pg = document.querySelector('.page.active'), sv = pg && {'page-tools': ['tool-view', 'tool'], 'page-about': ['mt-view', 'about'], 'page-guides': ['gd-view', 'guide']}[pg.id];
          const v = sv && [...pg.querySelectorAll('.' + sv[0])].find(x => !x.hidden); return v ? {tv: v.dataset[sv[1]]} : {}; })()}; })()`;
    const pages = {}; let lang = '';
    for (const p of paths) {
      const l = /^\/en(\/|$)/.test(p) ? 'en' : 'de';
      if (l !== lang) { await send('Page.navigate', {url: origin + p}); await sleep(3000); lang = l; }   // erste Seite je Sprache normal laden
      else { await ev(`go(${JSON.stringify(p.replace(/^\/en(?=\/|$)/, '') || '/')})`); await sleep(300); }   // danach innerhalb der Seite wechseln (schnell)
      const v = await ev(read);
      if (v && v.d) pages[p] = v;
      else console.warn('  ohne Beschreibung:', p);
    }
    // nur schreiben, wenn sich etwas geändert hat (sonst gäbe jedes automatische Update einen neuen Commit)
    const file = path.join(ROOT, 'data', 'seo-meta.json');
    let old = null; try { old = JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) {}
    // Sicherung: fehlt bei mehr als der Hälfte der Seiten alles (z. B. Fehler im Skript oben), die alte Datei nicht überschreiben
    if (Object.keys(pages).length < paths.length / 2) throw new Error(`nur ${Object.keys(pages).length} von ${paths.length} Seiten gelesen – data/seo-meta.json bleibt unverändert`);
    if (old && JSON.stringify(old.pages) === JSON.stringify(pages)) console.log(`  unverändert: data\\seo-meta.json (${Object.keys(pages).length} Seiten)`);
    else { fs.writeFileSync(file, JSON.stringify({generated: new Date().toISOString(), pages})); console.log(`  geschrieben: data\\seo-meta.json (${Object.keys(pages).length} von ${paths.length} Seiten)`); }
    // Kopfdaten der Startseite als Grundblock in der Vorlage app.html (gilt auch für unbekannte Adressen, z. B. 404)
    const {headBlock, SITE} = require(path.join(ROOT, 'api', 'page.js'));
    if (pages['/']) {
      const f = path.join(ROOT, 'app.html'), html = fs.readFileSync(f, 'utf8');
      const next = html.replace(/<!-- seo:start -->[\s\S]*?<!-- seo:end -->/, () => headBlock(pages['/'], SITE));
      if (next !== html) { fs.writeFileSync(f, next); console.log('  aktualisiert: Kopfdaten der Startseite in app.html'); }
    }
    // Startseite index.html neu aufbereiten (Vercel liefert / direkt als Datei aus) – eigener Prozess, damit api/page.js die frischen Dateien liest
    require('child_process').execFileSync(process.execPath, [path.join(ROOT, 'tools', 'startseite.js')], {stdio: 'inherit'});
    ws.close();
  } finally { br.kill(); srv.close(); try { fs.rmSync(prof, {recursive: true, force: true}); } catch (e) {} }
  process.exit(0);
})().catch(e => { console.error('Fehler:', e.message); process.exit(1); });
