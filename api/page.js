// TFTClimb – liefert die Seite (Vorlage app.html) mit den richtigen Kopfdaten für die aufgerufene Adresse aus.
// index.html ist KEINE Vorlage mehr: tools/seo-meta.js (bzw. tools/startseite.js) erzeugt sie aus app.html als fertig aufbereitete
// Startseite, weil Vercel / direkt als Datei ausliefert, ohne diese Funktion. Änderungen am HTML also immer in app.html.
// Titel, Meta-Beschreibung, canonical, hreflang, Vorschau (og:) und strukturierte Daten stehen so schon im HTML –
// auch für Suchmaschinen ohne JavaScript, Link-Vorschauen (Discord, WhatsApp, X) und SEO-Tools.
// Die Texte kommen aus data/seo-meta.json (erzeugt von tools/seo-meta.js aus der fertigen Seite, also Wort für Wort gleich).
// In app.html steht zwischen <!-- seo:start --> und <!-- seo:end --> der Block der Startseite; hier wird er je Adresse ersetzt.
// Alle Seitenadressen außer / (die liefert Vercel direkt als Datei) werden in vercel.json hierher geleitet.
const fs = require('fs');
const path = require('path');

const SITE = 'https://www.tftclimb.com';
const BLOCK = /<!-- seo:start -->[\s\S]*?<!-- seo:end -->/;
let HTML = null, PAGES = null;
function load() {
  if (HTML === null) HTML = fs.readFileSync(path.join(process.cwd(), 'app.html'), 'utf8');
  if (PAGES === null) { try { PAGES = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'seo-meta.json'), 'utf8')).pages || {}; } catch (e) { PAGES = {}; } }
}
// Live-Set aus data/sets.js: seine Daten-Skripte lädt die Seite erst per document.write am Ende – der Browser findet sie dadurch spät.
// Im Kopf als preload angemeldet, kommen sie parallel zu CSS und Schriften (am Handy deutlich früher fertig)
let SETS = null;
function liveSet() {
  if (SETS === null) { try { const t = fs.readFileSync(path.join(process.cwd(), 'data', 'sets.js'), 'utf8'); SETS = JSON.parse(t.slice(t.indexOf('['), t.lastIndexOf(']') + 1)); } catch (e) { SETS = []; } }
  return SETS.find(s => s.status === 'live') || SETS[0] || null;
}
const att = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const txt = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Kopfdaten-Block einer Seite (m = Eintrag aus seo-meta.json); auch von tools/seo-meta.js für den Block in app.html genutzt
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
    ...(() => { const s = liveSet(); if (!s) return []; const en = m.loc === 'en_GB';
      return [s.file, `custom-${s.set}.js`, en ? s.file.replace(/\.js$/, '-en.js') : ''].filter(Boolean).map(f => `<link rel="preload" href="data/${f}" as="script">`)
        .concat([`<link rel="preload" href="tierlist-data-${s.set}.js" as="script">`]); })(),
    '<!-- seo:end -->'].filter(Boolean).join('\n');
}

// Adresse vereinheitlichen: /en → /en/, kein Schrägstrich am Ende; geteilte Links (…/18/Code) nutzen die Kopfdaten der Seite davor
function lookup(p) {
  p = '/' + String(p || '').replace(/^\/+/, '');
  if (p === '/en') p = '/en/';
  if (p.length > 1 && p !== '/en/') p = p.replace(/\/+$/, '');
  return PAGES[p] || PAGES[p.replace(/\/\d+\/[^/]+$/, '')] || null;
}

// Ende eines <div>, das bei `start` beginnt (verschachtelte divs mitgezählt, Kommentare übersprungen)
function divEnd(h, start) {
  const re = /<!--[\s\S]*?-->|<div\b[^>]*>|<\/div>/g; re.lastIndex = start; let depth = 0, m;
  while ((m = re.exec(h))) { if (m[0][1] === '!') continue; depth += m[0][1] === '/' ? -1 : 1; if (!depth) return m.index; }
  return -1;
}
// app.html enthält alle Seiten der Website. Für die aufgerufene Adresse bleibt nur deren Seite (und bei Seiten mit Unteransichten –
// Tools, Meet the Team, Guides – nur die gewählte Ansicht) als Inhalt stehen; die übrigen stecken in <template class="pg-tpl"> –
// für Suchmaschinen kein Seiteninhalt (eine H1, kein fremder Text).
// Im Browser holt ein kleines Skript direkt nach </main> alles wieder heraus, bevor app.js startet – die Seite funktioniert wie immer.
const SUBVIEWS = {'page-tools': '<div class="tool-view" data-tool="', 'page-about': '<div class="mt-view" data-about="', 'page-guides': '<div class="gd-view" data-guide="'};
function onlyPage(h, pg, tv) {
  const wrap = (src, open, keep) => {   // alle <div …> mit passendem Anfang, die nicht `keep` sind, einpacken (von hinten nach vorn)
    const hits = []; let i = -1;
    while ((i = src.indexOf(open, i + 1)) >= 0) { const id = (src.slice(i, src.indexOf('>', i)).match(/(?:id="page-|data-(?:tool|about|guide)=")([^"]*)"/) || [])[1]; hits.push([i, id]); }
    for (const [i, id] of hits.reverse()) {
      const s = src.indexOf('>', i) + 1, e = divEnd(src, i); if (e < 0 || id === keep) continue;
      const inner = src.slice(s, e); if (!inner.trim()) continue;
      src = src.slice(0, s) + '<template class="pg-tpl">' + inner + '</template>' + src.slice(e);
    }
    return src;
  };
  h = wrap(h, '<div class="page" id="page-', pg.replace(/^page-/, ''));
  if (SUBVIEWS[pg] && tv != null) h = wrap(h, SUBVIEWS[pg], tv);
  return h;
}

// erste Fundstelle von `re`, die nicht in einem <template> steckt (also zum sichtbaren Inhalt gehört)
function outsideTpl(h, re) {
  const tpl = /<template\b[^>]*>|<\/template>/g, ranges = []; let d = 0, s = 0, m;
  while ((m = tpl.exec(h))) { if (m[0][1] !== '/') { if (!d++) s = m.index; } else if (d && !--d) ranges.push([s, m.index]); }
  re.lastIndex = 0;
  while ((m = re.exec(h))) if (!ranges.some(([a, b]) => m.index > a && m.index < b)) return m;
  return null;
}
// Überschrift der Seite wie im Browser: H1 und Brotkrumen in der Sprache der Seite (englische Seiten, Simulator auf der Builder-Seite),
// dazu der Meta-Text als Einleitung direkt darunter (gleiche Regel wie metaLead in app.js – Rechtstexte mit data-keep bleiben)
function heading(h, m) {
  const hm = m.h1 && outsideTpl(h, /<h1\b([^>]*)>[\s\S]*?<\/h1>/g);
  if (!hm) {   // Seite ohne H1 im HTML (Inhalt baut erst app.js): H1 und Einleitung in den leeren Container – app.js ersetzt ihn beim Aufbau komplett
    const em = m.h1 && /^[\w-]+$/.test(m.hh || '') && outsideTpl(h, new RegExp(`<(\\w+)([^>]*\\sid="${m.hh}"[^>]*)>\\s*</\\1>`, 'g'));
    if (!em) return h;
    const lead = m.d && !/noindex/.test(m.r || '') ? `<p data-meta>${txt(m.d)}</p>` : '';
    return h.slice(0, em.index) + `<${em[1]}${em[2]}><h1>${m.h1}</h1>${lead}</${em[1]}>` + h.slice(em.index + em[0].length);
  }
  let before = h.slice(0, hm.index), after = h.slice(hm.index + hm[0].length);
  if (m.cr) before = before.replace(/<div class="crumb"([^>]*)>((?:(?!<\/?div)[\s\S])*?)<\/div>(\s*)$/, (all, at, inner, ws) => `<div class="crumb"${at}>${m.cr}</div>${ws}`);
  if (m.d && !/noindex/.test(m.r || '')) after = after.replace(/^(\s*)<p\b([^>]*)>[\s\S]*?<\/p>/, (all, ws, at) => /data-keep|class="[^"]*\b(updated|pd-lang)\b/.test(at) ? all : `${ws}<p${at}${/data-meta/.test(at) ? '' : ' data-meta'}>${txt(m.d)}</p>`);
  return before + `<h1${hm[1]}>${m.h1}</h1>` + after;
}

function render(p, base) {
  let h = HTML;
  const q = '/' + String(p || '').replace(/^\/+/, ''), m = lookup(q);
  if (/^\/en(\/|$)/.test(q)) h = h.replace('<html lang="de">', '<html lang="en">');
  if (m) {
    h = h.replace(BLOCK, () => headBlock(m, base));
    // fertige Artikel (data-pre) der Seite einsetzen – Suchmaschinen sehen sie so schon ohne JavaScript, in der richtigen Sprache
    if (m.pre) h = h.replace(/(<(\w+)[^>]*\sdata-pre="([\w-]+)"[^>]*>)(\s*)(<\/\2>)/g, (all, open, tag, key, ws, close) => m.pre[key] ? open + m.pre[key] + close : all);
    if (m.pg) h = onlyPage(h, m.pg, m.tv);
    return heading(h, m);
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
  catch (e) { try { html = HTML || fs.readFileSync(path.join(process.cwd(), 'app.html'), 'utf8'); } catch (e2) { res.status(500).send('Fehler'); return; } }
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  // Browser fragen jedes Mal nach (neue Version sofort sichtbar), das Vercel-CDN hält die fertige Seite bis zum nächsten Deploy vor
  res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
  res.setHeader('CDN-Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800');
  res.status(200).send(html);
};
module.exports.render = (p, base) => { load(); return render(p, base); };   // für Tests
module.exports.headBlock = headBlock;
module.exports.SITE = SITE;
