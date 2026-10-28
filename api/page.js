// TFTClimb – liefert die Seite (index.html) mit den richtigen Kopfdaten für die aufgerufene Adresse aus.
// Titel, Meta-Beschreibung, canonical, hreflang, Vorschau (og:) und strukturierte Daten stehen so schon im HTML –
// auch für Suchmaschinen ohne JavaScript, Link-Vorschauen (Discord, WhatsApp, X) und SEO-Tools.
// Die Texte kommen aus data/seo-meta.json (erzeugt von tools/seo-meta.js aus der fertigen Seite, also Wort für Wort gleich).
// In index.html steht zwischen <!-- seo:start --> und <!-- seo:end --> der Block der Startseite; hier wird er je Adresse ersetzt.
// Alle Seitenadressen außer / (die liefert Vercel direkt als Datei) werden in vercel.json hierher geleitet.
const fs = require('fs');
const path = require('path');

const SITE = 'https://www.tftclimb.com';
const BLOCK = /<!-- seo:start -->[\s\S]*?<!-- seo:end -->/;
let HTML = null, PAGES = null;
function load() {
  if (HTML === null) HTML = fs.readFileSync(path.join(process.cwd(), 'index.html'), 'utf8');
  if (PAGES === null) { try { PAGES = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'seo-meta.json'), 'utf8')).pages || {}; } catch (e) { PAGES = {}; } }
}
const att = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const txt = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Kopfdaten-Block einer Seite (m = Eintrag aus seo-meta.json); auch von tools/seo-meta.js für die Startseite in index.html genutzt
function headBlock(m, base) {
  const abs = u => !u ? '' : /^https?:/.test(u) ? u : base + u;
  return ['<!-- seo:start -->',
    `<title>${txt(m.t)}</title>`,
    `<meta name="description" content="${att(m.d)}">`,
    m.r && m.r !== 'index, follow' ? `<meta name="robots" content="${att(m.r)}">` : '',
    m.c ? `<link rel="canonical" href="${att(abs(m.c))}">` : '',
    m.de ? `<link rel="alternate" hreflang="de" href="${att(abs(m.de))}">` : '',
    m.en ? `<link rel="alternate" hreflang="en" href="${att(abs(m.en))}">` : '',
    m.de ? `<link rel="alternate" hreflang="x-default" href="${att(abs(m.de))}">` : '',
    `<meta property="og:title" content="${att(m.t)}">`,
    `<meta property="og:description" content="${att(m.d)}">`,
    m.c ? `<meta property="og:url" content="${att(abs(m.c))}">` : '',
    m.img ? `<meta property="og:image" content="${att(abs(m.img))}">` : '',
    // eigene Vorschaubilder (assets/og/, 1200 × 630): Größe und große Vorschau-Karte angeben
    m.img && /\/assets\/og\//.test(m.img) ? `<meta property="og:image:width" content="1200">\n<meta property="og:image:height" content="630">\n<meta property="og:image:alt" content="${att(m.t)}">` : '',
    m.tw ? `<meta name="twitter:card" content="${att(m.tw)}">` : '',
    m.tw === 'summary_large_image' && m.img ? `<meta name="twitter:image" content="${att(abs(m.img))}">` : '',
    m.loc ? `<meta property="og:locale" content="${att(m.loc)}">` : '',
    m.ld ? `<script type="application/ld+json" id="ldPage">${m.ld.split('{{ORIGIN}}').join(base).replace(/</g, '\\u003c')}</script>` : '',
    '<!-- seo:end -->'].filter(Boolean).join('\n');
}

// Adresse vereinheitlichen: /en → /en/, kein Schrägstrich am Ende; geteilte Links (…/18/Code) nutzen die Kopfdaten der Seite davor
function lookup(p) {
  p = '/' + String(p || '').replace(/^\/+/, '');
  if (p === '/en') p = '/en/';
  if (p.length > 1 && p !== '/en/') p = p.replace(/\/+$/, '');
  return PAGES[p] || PAGES[p.replace(/\/\d+\/[^/]+$/, '')] || null;
}

function render(p, base) {
  let h = HTML;
  const q = '/' + String(p || '').replace(/^\/+/, ''), m = lookup(q);
  if (/^\/en(\/|$)/.test(q)) h = h.replace('<html lang="de">', '<html lang="en">');
  if (m) {
    h = h.replace(BLOCK, () => headBlock(m, base));
    // fertige Artikel (data-pre) der Seite einsetzen – Suchmaschinen sehen sie so schon ohne JavaScript, in der richtigen Sprache
    if (m.pre) h = h.replace(/(<(\w+)[^>]*\sdata-pre="([\w-]+)"[^>]*>)(\s*)(<\/\2>)/g, (all, open, tag, key, ws, close) => m.pre[key] ? open + m.pre[key] + close : all);
    return h;
  }
  // unbekannte Adresse (z. B. 404): Titel und Beschreibung der Startseite bleiben, aber ohne Adress-Angaben der Startseite
  return h.replace(BLOCK, b => b.split('\n').filter(l => !/rel="(canonical|alternate)"|og:url|og:locale|application\/ld\+json/.test(l)).join('\n'));
}

module.exports = (req, res) => {
  const url = new URL(req.url, 'http://x');
  let host = req.headers['x-forwarded-host'] || req.headers.host || 'www.tftclimb.com';
  if (host === 'tftclimb.com') host = 'www.tftclimb.com';   // immer die kanonische Domain
  const base = /localhost|127\.0\.0\.1/.test(host) ? 'http://' + host : 'https://' + host;
  let html;
  try { load(); html = render(url.searchParams.get('__p') || '', base); }
  catch (e) { try { html = HTML || fs.readFileSync(path.join(process.cwd(), 'index.html'), 'utf8'); } catch (e2) { res.status(500).send('Fehler'); return; } }
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  // Browser fragen jedes Mal nach (neue Version sofort sichtbar), das Vercel-CDN hält die fertige Seite bis zum nächsten Deploy vor
  res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
  res.setHeader('CDN-Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800');
  res.status(200).send(html);
};
module.exports.render = (p, base) => { load(); return render(p, base); };   // für Tests
module.exports.headBlock = headBlock;
module.exports.SITE = SITE;
