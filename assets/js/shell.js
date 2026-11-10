/* TFTClimb – Grundgerüst des neuen Designs: Topleiste und Seitenleiste sofort zeigen, noch bevor Spieldaten und app.js geladen sind.
   Läuft ganz am Anfang von <body>. Der Inhalt blendet ein, sobald app.js fertig ist (Klasse nd-ready, siehe index.html);
   bis dahin läuft oben ein Ladebalken. app.js (ndInit) ergänzt danach Set- und Sprachschalter. */

// Strich-Symbole und Seitenleisten-Links – auch von app.js genutzt
const ND_IC = {
  tools:'<path d="M14.5 6.5a4 4 0 0 0-5.4 5.1L4 16.7 7.3 20l5.1-5.1a4 4 0 0 0 5.1-5.4l-2.4 2.4-2.4-.6-.6-2.4z"/>',
  cheat:'<rect x="4" y="3.5" width="16" height="17" rx="2"/><path d="M4 9h16M4 14.5h16M10 3.5v17"/>',
  guides:'<path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M8 8h7M8 12h5"/>',
  gameplans:'<circle cx="6" cy="6" r="2.2"/><circle cx="18" cy="18" r="2.2"/><path d="M8 6h5a3 3 0 0 1 0 6h-2a3 3 0 0 0 0 6h4.8"/><path d="M15 4.5l2.5 1.5L15 7.5"/>',
  patches:'<path d="M4 7l8-4 8 4v10l-8 4-8-4z"/><path d="M4 7l8 4 8-4M12 11v10"/>',
  ranks:'<path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z"/><path d="M9 11l2 2 4-4"/>',
  coaching:'<path d="M3 9l9-5 9 5-9 5z"/><path d="M7 11v5c3 2 7 2 10 0v-5"/>',
  about:'<circle cx="9" cy="8" r="3"/><path d="M3 20c.6-3.4 3-5.5 6-5.5s5.4 2.1 6 5.5"/><circle cx="17" cy="9" r="2.4"/><path d="M16 14.6c2.6.2 4.5 2.2 5 5.4"/>',
  nextset:'<path d="M9 18V5.5l11-2.5v13"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="16" r="2.5"/>',
  builder:'<path d="M12 2.8l4 2.3v4.6L12 12 8 9.7V5.1z"/><path d="M8 12.3l4 2.3v4.6L8 21.5l-4-2.3v-4.6zM16 12.3l4 2.3v4.6l-4 2.3-4-2.3"/>',
  col:'<path d="M15 6l-6 6 6 6"/>',
  chev:'<path d="M6 9l6 6 6-6"/>',
  explain:'<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>'
};
const ndSvg = (k, w=1.8) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ND_IC[k]}</svg>`;
// Seitenleisten-Symbole (assets/icons/side-*.webp, aus dem Icon-Konzept); ohne Bild bleibt das Strich-Symbol
const ND_IMG = {tierlist:'tierlist', bibliothek:'library', tools:'tools', cheatsheet:'cheat', guides:'guides', gameplans:'gameplans', patches:'patches', ranks:'ranks', coaching:'coaching', about:'team', builder:'builder', explain:'explain', nextset:'newset', lernen:'learn', daten:'data', news:'news'};
const ndIcon = (key, ic) => ND_IMG[key] ? `<img class="nds-ic" src="assets/icons/side-${ND_IMG[key]}.webp" alt="" width="34" height="34">` : ndSvg(ic || key);
// data-m: Adressen (deutsch|englisch|zugehörige Unterseiten), bei denen der Punkt als aktiv gilt – der längste Treffer gewinnt (ndMark); ohne data-m zählt die eigene Adresse
function ndLink(key, label, href, ic, m){ return `<a class="nds-link" href="${href}" data-nd="${key}"${m ? ` data-m="${m}"` : ''} title="${label}">${ndIcon(key, ic)}<span>${label}</span></a>`; }
// Unterpunkt einer Gruppe mit kleinem Symbol (ic: Schlüssel aus ND_IMG oder ND_IC); ohne Adresse (noch keine Seite) nur als Text mit „Soon“
function ndSub(label, href, m, soon, key, ic){
  const b = soon ? '<em class="nds-soon">Soon</em>' : '', i = ic ? ndIcon(ic).replace('class="nds-ic"', 'class="nds-ic nds-sub-ic"') : '';
  return href ? `<a class="nds-sub-a" href="${href}"${m ? ` data-m="${m}"` : ''}${key ? ` data-nd="${key}"` : ''}>${i}<span>${label}</span>${b}</a>`
              : `<span class="nds-sub-a off" aria-disabled="true">${i}<span>${label}</span>${b}</span>`;
}
// Gruppe: Name führt direkt zur Seite (mit href) oder klappt nur auf (ohne); der Pfeil rechts klappt das Untermenü auf
function ndGroup(key, label, href, subs, badge, en){
  const inner = `${ndIcon(key)}<span>${label}</span>${badge || ''}`, tg = `aria-expanded="false" aria-controls="nds-${key}"`;
  const head = href ? `<a class="nds-link nds-head" href="${href}" data-nd="${key}" data-m="${key === 'tools' ? '/tools' : '-'}" title="${label}">${inner}</a>`
                    : `<button class="nds-link nds-head" type="button" data-tg ${tg} title="${label}">${inner}</button>`;
  return `<div class="nds-grp" data-grp="${key}"><div class="nds-row">${head}<button class="nds-tg" type="button" data-tg ${tg}${href ? '' : ' tabindex="-1"'} aria-label="${label}: ${en ? 'submenu' : 'Untermenü'}">${ndSvg('chev', 2.2)}</button></div><div class="nds-sub" id="nds-${key}"><div class="nds-sub-in">${subs}</div></div></div>`;
}

// Topleiste: Logo (→ Dashboard), Suche über die ganze Seite, rechts LP-Grenzen, Patch-Stand, Set und Einstellungen.
// Alle Bereiche stehen links in der einklappbaren Seitenleiste (Tierlist und Bibliothek ganz oben)
function ndShellHTML(en){
  const T = (de, e) => en ? e : de;
  return `
    <div class="nd-load" id="ndLoad" aria-hidden="true"></div>
    <header class="nd-top" id="ndTop">
      <button class="nd-burger" type="button" aria-label="${T('Menü', 'Menu')}" onclick="document.body.classList.toggle('nd-drawer')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 6h16M4 12h16M4 18h16"/></svg></button>
      <a class="nd-brand" href="/" data-nd="home" aria-label="TFTClimb ${T('Startseite', 'home')}"><img src="assets/brand/logo-tftclimb.webp" alt="TFTClimb"></a>
      <button class="nd-search" id="ndSearch" type="button" aria-label="${T('Suchen', 'Search')}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/></svg><span>${T('Champion, Comp, Item, Augment suchen …', 'Search champion, comp, item, augment …')}</span><kbd>/</kbd></button>
      <div class="nd-r">
        <span class="nd-stats" id="ndStats"></span>
        <span id="ndSlot"></span>
      </div>
    </header>
    <aside class="nd-side" id="ndSide" aria-label="${T('Seiten', 'Pages')}">
      ${ndLink('tierlist', 'Tierlist', '/tierlist', '', '/tierlist|/tier-list|/comps|/augments')}
      ${ndLink('gameplans', 'Gameplans', '/gameplans').replace('</span></a>', '</span><em class="nds-soon">Soon</em></a>')}
      ${ndLink('builder', 'Team Builder', '/tft-team-builder')}
      <div class="nds-gap"></div>
      ${ndLink('tools', 'Tools', '/tools')}
      ${ndGroup('lernen', T('Lernen', 'Learn'), '', ndSub('Guides', '/guides', '/guides', true, '', 'guides') + ndSub(T('TFT erklärt', 'TFT explained'), '', '', true, '', 'explain'), '', en)}
      ${ndGroup('daten', T('Daten', 'Data'), '',
        ndSub(T('Bibliothek', 'Library'), '/bibliothek', '/bibliothek|/library|/champions|/traits|/items', false, '', 'bibliothek') + ndSub('Cheatsheets', '/cheatsheet', '/cheatsheet', false, '', 'cheatsheet') + ndSub('Ranks', '/ranks', '/ranks', false, '', 'ranks'), '', en)}
      ${ndGroup('news', 'News', '',
        ndSub('Patches', '/patches', '/patches|/tft-patch-countdown|/tft-next-patch-countdown', false, '', 'patches') + ndSub('Set 19', '/tft-set-19', '', false, 'nextset', 'nextset'), `<em class="nds-soon nds-new">${T('Neu', 'New')}</em>`, en)}
      <div class="nds-gap"></div><div class="nds-gap"></div>
      ${ndLink('coaching', 'Coaching', '/coaching', '', '/coaching|/apply').replace('class="nds-link"', 'class="nds-link nds-hot"')}${ndLink('about', 'Meet the Team', '/about')}
      <button class="nds-link nds-col" type="button" onclick="document.body.classList.toggle('nd-mini');try{localStorage.setItem('tftfreaks_side',document.body.classList.contains('nd-mini')?'mini':'')}catch(e){}">${ndSvg('col', 2)}<span>${T('Einklappen', 'Collapse')}</span></button>    </aside>
    <div class="nds-fly" id="ndFly" hidden></div>
    <div class="nd-scrim" onclick="document.body.classList.remove('nd-drawer')"></div>`;
}

// Aktiven Punkt aus der Adresse bestimmen: längster passender Eintrag gewinnt; seine Gruppe wird markiert und aufgeklappt, die übrigen klappen zu
function ndMark(raw){
  const side = document.getElementById('ndSide'); if(!side) return;
  if(raw == null) raw = location.protocol === 'file:' ? location.hash.replace(/^#/, '') : location.pathname;
  const p = String(raw || '/').split(/[?#]/)[0].replace(/^\/en(?=\/|$)/, '').replace(/\/+$/, '') || '/';
  const links = [...side.querySelectorAll('a[href]')];
  let best = 0;
  links.forEach(a=>{
    a._m = 0;
    (a.dataset.m || (a.getAttribute('href') || '').replace(/^\/en(?=\/|$)/, '')).split('|').forEach(m=>{
      if(m.length > 1 && m.length > a._m && (p === m || p.startsWith(m + '/'))) a._m = m.length; });
    if(a._m > best) best = a._m;
  });
  links.forEach(a=>a.classList.toggle('on', best > 0 && a._m === best));
  side.querySelectorAll('.nds-grp').forEach(g=>{ const on = !!g.querySelector('a.on'); g.querySelector('.nds-head').classList.toggle('on', on); ndOpen(g, on); });
  ndFlyHide(0);
}
function ndOpen(g, open){ g.classList.toggle('open', open); g.querySelectorAll('[data-tg]').forEach(b=>b.setAttribute('aria-expanded', open)); }
const ndMiniNow = () => document.body.classList.contains('nd-mini') && matchMedia('(min-width:981px)').matches;
// Eingeklappte Leiste: Untermenü als kleines Fenster rechts neben dem Symbol (liegt außerhalb der Leiste, damit es nicht abgeschnitten wird)
function ndFly(g){
  const fly = document.getElementById('ndFly'), side = document.getElementById('ndSide'); if(!fly) return;
  clearTimeout(fly._t);
  if(fly._g !== g || fly.hidden){
    const head = g.querySelector('.nds-head'), label = head.querySelector('span').textContent;
    fly.innerHTML = (head.tagName === 'A' ? `<a class="nds-fly-h" href="${head.getAttribute('href')}">${label}</a>` : `<b class="nds-fly-h">${label}</b>`) + g.querySelector('.nds-sub-in').innerHTML;
    fly._g = g; fly.hidden = false;
    const r = head.getBoundingClientRect(), h = fly.offsetHeight;
    fly.style.left = Math.round(side.getBoundingClientRect().right + 8) + 'px';
    fly.style.top = Math.round(Math.max(8, Math.min(r.top - 6, innerHeight - h - 8))) + 'px';
  }
  fly.hidden = false;
}
function ndFlyHide(ms = 180){
  const fly = document.getElementById('ndFly'); if(!fly) return;
  clearTimeout(fly._t);
  fly._t = setTimeout(()=>{ fly.hidden = true; fly._g = null; }, ms);
}

(function(){
  if(!document.documentElement.classList.contains('nd')) return;
  const en = window.TFT_LANG === 'en';
  document.body.insertAdjacentHTML('afterbegin', ndShellHTML(en));
  try { if(localStorage.getItem('tftfreaks_side')==='mini') document.body.classList.add('nd-mini'); } catch(e){}
  // aktiven Punkt vorab aus der Adresse markieren – route() in app.js ruft ndMark bei jedem Seitenwechsel erneut auf
  ndMark();
  const side = document.getElementById('ndSide'), fly = document.getElementById('ndFly');
  // Pfeil / Gruppenname ohne eigene Seite: Untermenü auf- und zuklappen; bei eingeklappter Leiste stattdessen das Fenster daneben
  side.addEventListener('click', e=>{
    const t = e.target.closest('[data-tg]'); if(!t) return;
    const g = t.closest('.nds-grp');
    if(ndMiniNow()){ if(fly.hidden || fly._g !== g) ndFly(g); else ndFlyHide(0); return; }
    ndOpen(g, !g.classList.contains('open'));
  });
  side.querySelectorAll('.nds-grp').forEach(g=>{
    g.addEventListener('mouseenter', ()=>{ if(ndMiniNow()) ndFly(g); });
    g.addEventListener('mouseleave', ()=>ndFlyHide());
  });
  fly.addEventListener('mouseenter', ()=>clearTimeout(fly._t));
  fly.addEventListener('mouseleave', ()=>ndFlyHide());
  fly.addEventListener('click', e=>{ if(e.target.closest('a')) ndFlyHide(0); });
  side.addEventListener('scroll', ()=>ndFlyHide(0));
  // Ladebalken: läuft per CSS-Animation (auch während app.js rechnet), am Ende auf volle Breite und ausblenden
  document.addEventListener('DOMContentLoaded', function(){
    const b = document.getElementById('ndLoad'); if(!b) return;
    const t = getComputedStyle(b).transform;
    b.style.transform = t && t !== 'none' ? t : 'scaleX(.1)'; b.style.animation = 'none'; void b.offsetWidth;
    b.style.transition = 'transform .3s ease-out, opacity .35s ease .3s'; b.style.transform = 'scaleX(1)'; b.style.opacity = '0';
    setTimeout(function(){ b.remove(); }, 900);
  });
})();
