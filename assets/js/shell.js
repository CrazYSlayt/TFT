/* TFTClimb – Grundgerüst des neuen Designs: Topleiste und Seitenleiste sofort zeigen, noch bevor Spieldaten und app.js geladen sind.
   Läuft ganz am Anfang von <body>. Der Inhalt blendet ein, sobald app.js fertig ist (Klasse nd-ready, siehe index.html);
   bis dahin läuft oben ein Ladebalken. app.js (ndInit) ergänzt danach Set- und Sprachschalter. */

// Strich-Symbole und Seitenleisten-Links – auch von app.js genutzt
const ND_IC = {
  tools:'<path d="M14.5 6.5a4 4 0 0 0-5.4 5.1L4 16.7 7.3 20l5.1-5.1a4 4 0 0 0 5.1-5.4l-2.4 2.4-2.4-.6-.6-2.4z"/>',
  cheat:'<rect x="4" y="3.5" width="16" height="17" rx="2"/><path d="M4 9h16M4 14.5h16M10 3.5v17"/>',
  guides:'<path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M8 8h7M8 12h5"/>',
  patches:'<path d="M4 7l8-4 8 4v10l-8 4-8-4z"/><path d="M4 7l8 4 8-4M12 11v10"/>',
  ranks:'<path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z"/><path d="M9 11l2 2 4-4"/>',
  coaching:'<path d="M3 9l9-5 9 5-9 5z"/><path d="M7 11v5c3 2 7 2 10 0v-5"/>',
  about:'<circle cx="9" cy="8" r="3"/><path d="M3 20c.6-3.4 3-5.5 6-5.5s5.4 2.1 6 5.5"/><circle cx="17" cy="9" r="2.4"/><path d="M16 14.6c2.6.2 4.5 2.2 5 5.4"/>',
  col:'<path d="M15 6l-6 6 6 6"/>'
};
const ndSvg = (k, w=1.8) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ND_IC[k]}</svg>`;
// Seitenleisten-Symbole (assets/icons/side-*.webp, aus dem Icon-Konzept); ohne Bild bleibt das Strich-Symbol
const ND_IMG = {tools:'tools', cheatsheet:'cheat', guides:'guides', patches:'patches', ranks:'ranks', coaching:'coaching', about:'team'};
function ndLink(key, label, href, ic){ const im = ND_IMG[key]; return `<a class="nds-link" href="${href}" data-nd="${key}" title="${label}">${im ? `<img class="nds-ic" src="assets/icons/side-${im}.webp" alt="" width="34" height="34">` : ndSvg(ic || key)}<span>${label}</span></a>`; }

// Topleiste mit den drei Hauptpunkten, links die einklappbare Seitenleiste mit den übrigen Seiten
function ndShellHTML(en){
  const T = (de, e) => en ? e : de;
  return `
    <div class="nd-load" id="ndLoad" aria-hidden="true"></div>
    <header class="nd-top" id="ndTop">
      <button class="nd-burger" type="button" aria-label="${T('Menü', 'Menu')}" onclick="document.body.classList.toggle('nd-drawer')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 6h16M4 12h16M4 18h16"/></svg></button>
      <a class="nd-brand" href="/" aria-label="TFTClimb ${T('Startseite', 'home')}"><img src="assets/brand/logo-tftclimb.webp" alt="TFTClimb"></a>
      <nav class="nd-tabs" aria-label="${T('Hauptnavigation', 'Main navigation')}"><a href="/" data-nd="home">Dashboard</a><a href="/tierlist" data-nd="tierlist">Tierlist</a><a href="/bibliothek" data-nd="bibliothek">${T('Bibliothek', 'Library')}</a></nav>
      <div class="nd-r">
        <span id="ndSlot"></span>
      </div>
    </header>
    <aside class="nd-side" id="ndSide" aria-label="${T('Weitere Seiten', 'More pages')}">
      ${ndLink('tools', 'Tools', '/tools')}${ndLink('cheatsheet', 'Cheatsheet', '/cheatsheet', 'cheat')}
      <div class="nds-cap">${T('Daten', 'Data')}</div>
      ${ndLink('ranks', 'Ranks', '/ranks')}${ndLink('patches', 'Patches', '/patches')}${ndLink('guides', 'Guides', '/guides').replace('</span></a>', '</span><em class="nds-soon">Soon</em></a>')}
      <div class="nds-gap"></div>
      ${ndLink('coaching', 'Coaching', '/coaching').replace('class="nds-link"', 'class="nds-link nds-hot"')}${ndLink('about', 'Meet the Team', '/about')}
      <button class="nds-link nds-col" type="button" onclick="document.body.classList.toggle('nd-mini');try{localStorage.setItem('tftfreaks_side',document.body.classList.contains('nd-mini')?'mini':'')}catch(e){}">${ndSvg('col', 2)}<span>${T('Einklappen', 'Collapse')}</span></button>
      <img class="nds-vi2" src="assets/img/mascot-vi-huh.webp" alt="" width="520" height="505" loading="lazy">
    </aside>
    <div class="nd-scrim" onclick="document.body.classList.remove('nd-drawer')"></div>`;
}

(function(){
  if(!document.documentElement.classList.contains('nd')) return;
  const en = window.TFT_LANG === 'en';
  document.body.insertAdjacentHTML('afterbegin', ndShellHTML(en));
  try { if(localStorage.getItem('tftfreaks_side')==='mini') document.body.classList.add('nd-mini'); } catch(e){}
  // aktiven Punkt vorab aus der Adresse markieren – route() in app.js setzt ihn danach genau
  const raw = (location.protocol === 'file:' ? location.hash.replace(/^#/, '') : location.pathname) || '/';
  const first = raw.replace(/^\/en(?=\/|$)/, '').replace(/^\/+/, '').split(/[/?]/)[0];
  const alias = {'': 'home', champions: 'bibliothek', items: 'bibliothek', traits: 'bibliothek', augments: 'tierlist', apply: 'coaching'};
  const key = first in alias ? alias[first] : first;
  document.querySelectorAll('#ndTop [data-nd], #ndSide [data-nd]').forEach(a=>a.classList.toggle('on', a.dataset.nd===key));
  // Ladebalken: läuft per CSS-Animation (auch während app.js rechnet), am Ende auf volle Breite und ausblenden
  document.addEventListener('DOMContentLoaded', function(){
    const b = document.getElementById('ndLoad'); if(!b) return;
    const t = getComputedStyle(b).transform;
    b.style.transform = t && t !== 'none' ? t : 'scaleX(.1)'; b.style.animation = 'none'; void b.offsetWidth;
    b.style.transition = 'transform .3s ease-out, opacity .35s ease .3s'; b.style.transform = 'scaleX(1)'; b.style.opacity = '0';
    setTimeout(function(){ b.remove(); }, 900);
  });
})();
