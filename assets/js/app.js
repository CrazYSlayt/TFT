/* TFT Freaks – Seitenlogik (früher direkt in index.html). Braucht vorher: data/sets.js + Set-Daten (siehe Lader in index.html) */
/* ================= ADRESSEN ================= */
// Online echte Pfade (/tierlist/items), lokal per Doppelklick (file://) wie bisher #/tierlist/items
const FILE_MODE = location.protocol === 'file:';
// Sprache: Englisch unter /en/… (festgelegt im Kopf von index.html), sonst Deutsch. Intern arbeiten alle Pfade ohne /en.
const LANG = window.TFT_LANG === 'en' ? 'en' : 'de', EN = LANG === 'en', LOC = EN ? 'en-GB' : 'de-DE';
const L = (de, en) => EN ? en : de;   // kurze Texte direkt im Code übersetzen
const rawPath = () => (FILE_MODE ? location.hash.replace(/^#/, '') : location.pathname) || '/';
const curPath = () => { const p = rawPath(); return EN ? (p.replace(/^\/en(?=\/|$)/, '') || '/') : p; };
const withLang = p => EN && /^\/(?!en(\/|$)|api\/|assets\/|data\/)/.test(p) ? '/en' + p : (EN && p === '/' ? '/en/' : p);
function setUrl(path){ path = withLang(path); history.replaceState(null, '', FILE_MODE ? '#' + path : path); }
function go(path){
  path = withLang(path);
  if(FILE_MODE){ location.hash = '#' + path; return; }
  if(path === location.pathname) return;   // wie früher bei gleichem #: nichts tun
  history.pushState(null, '', path);
  route();
}
const siteUrl = path => FILE_MODE ? location.href.split('#')[0] + '#' + withLang(path) : location.origin + withLang(path);
// alte Links mit #/… (vor der Umstellung geteilt) auf echte Pfade umleiten
if(!FILE_MODE && location.hash.startsWith('#/')) history.replaceState(null, '', location.hash.slice(1));

/* ================= DATA ================= */
const CDRAGON = id => `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/${id}.png`;

// Englische Seite: offizielle englische Texte (data/tft-data-<Set>-en.js) übernehmen und überall die englischen Namen zeigen.
// Der deutsche Fähigkeitstext bleibt als ab.dDe erhalten – der Kampf-Simulator liest die Fähigkeiten daraus.
if(EN){
  const X = window.TFT_DATA_EN || {};
  // de0/n0 = deutscher Name (für die Übersetzung von Sätzen, in denen ein deutscher Name fest im Text steht)
  TFT_DATA.champions.forEach(c=>{ const x = (X.champions||{})[c.api]; if(x && c.ab){ c.ab.dDe = c.ab.d; c.ab.n0 = c.ab.n; c.ab.n = x.n || c.ab.n; c.ab.d = x.d || c.ab.d; } if(c.de){ c.de0 = c.de; delete c.de; } });
  TFT_DATA.traits.forEach(t=>{ const d = (X.traits||{})[t.api]; if(d) t.desc = d; t.de0 = t.de; t.de = t.n; });
  TFT_DATA.items.forEach(i=>{ const d = (X.items||{})[i.id]; if(d) i.desc = d; i.de0 = i.de; i.de = i.en; });
  TFT_DATA.augments.forEach(a=>{ const d = (X.augments||{})[a.id]; if(d) a.desc = d; a.de0 = a.de; a.de = a.en; });
  // Patches: englische Artikel, Teaser und Änderungen (data/patches-en.js)
  const PE = window.TFT_PATCHES_EN || {};
  (window.TFT_PATCHES || []).forEach(p=>{ const e = PE[p.id]; if(e){ if(e.url) p.url = e.url; if(e.teaser) p.teaser = e.teaser; if(e.notes) p.notes = e.notes; } });
}
// Offizielle Champions aus data/tft-data.js (CommunityDragon)
const champions = TFT_DATA.champions.map(c=>({n:c.n, c:c.c, t:c.t}));
const champBy = Object.fromEntries(champions.map(c=>[c.n,c]));

// Eigene Trait-Texte und Einteilung (Ursprung/Klasse). Offizielle Namen, Breakpoints und Icons kommen aus data/tft-data.js.
const TRAIT_META = (window.TFT_CUSTOM && TFT_CUSTOM.traits) || {};
const plainDesc = s => String(s||'').replace(/<br>/gi,' ').replace(/<[^>]+>/g,'').replace(/@[^@]*@/g,'').replace(/\s+/g,' ').trim();
const traits = TFT_DATA.traits.map(x=>{ const m = TRAIT_META[x.n] || {}; return {n:x.n, cat:m.cat||'origin', bp:x.bp.map(String), d:(!EN && m.d) || plainDesc(x.desc)}; });




// Tierlist (pro Set): Entwurf aus der Redaktion (dieser Browser) > tierlist-data-<Set>.js (veröffentlicht)
const TL_DRAFT_KEY = 'tftfreaks_tierlist_draft_v1_' + TFT_DATA.set;
try { if(TFT_DATA.set===18 && !localStorage.getItem(TL_DRAFT_KEY) && localStorage.getItem('tftfreaks_tierlist_draft_v1')) localStorage.setItem(TL_DRAFT_KEY, localStorage.getItem('tftfreaks_tierlist_draft_v1')); } catch(e){}
const TL_FILE = window.TIERLIST_DATA && Array.isArray(window.TIERLIST_DATA.comps) && (!window.TIERLIST_DATA.set || window.TIERLIST_DATA.set===TFT_DATA.set) ? window.TIERLIST_DATA : null;
function loadTierSource(){
  try { const d = JSON.parse(localStorage.getItem(TL_DRAFT_KEY) || 'null'); if(d && Array.isArray(d.comps)) return {src:'draft', data:d}; } catch(e){}
  if(TL_FILE) return {src:'file', data:TL_FILE};
  return {src:'none', data:{comps:[]}};
}
let tierSource = loadTierSource();
// Item-/Augment-Bewertungen: aus dem Entwurf, sonst aus der veröffentlichten Datei
const tlPart = k => tierSource.data[k] || (TL_FILE && TL_FILE[k]) || {};
let ITEM_TL = tlPart('itemTL'), AUG_TL = tlPart('augTL'), HOLD_TL = tlPart('holdTL');
const TL_PATCH = tierSource.data.patch || (TL_FILE && TL_FILE.patch) || '';
// Eigene Ergänzungen zum Set (data/custom-<Set>.js): Pflanzen-Bilder, Icons für Platzhalter-Augments
const TFT_CUSTOM_SET = window.TFT_CUSTOM && (!TFT_CUSTOM.set || TFT_CUSTOM.set===TFT_DATA.set) ? window.TFT_CUSTOM : {};
const PLANT_IMG = TFT_CUSTOM_SET.plants || {};
const AUG_IMG = Object.fromEntries((TFT_CUSTOM_SET.augmentIcons || []).map(id=>[id, 'assets/augments/' + id + '.webp']));
// Augments: offizielle Daten des gewählten Sets; die Stufe aus deiner Augment-Tierlist hat Vorrang
const AUG_TL_LV = {}; Object.values(AUG_TL).forEach(st=>Object.entries(st).forEach(([lv,tiers])=>Object.values(tiers).forEach(ids=>ids.forEach(id=>{ AUG_TL_LV[id] = +lv; }))));
// Stufe: aus der Tierlist, sonst aus Riots Daten, sonst aus dem Icon-Namen (…-i / …ii / …iii)
const augLvFromIcon = icon => { const m = String(icon).match(/(i{1,3})\.png$/i); return m ? m[1].length : 0; };
const AUGS = TFT_DATA.augments.map(a=>Object.assign({}, a, {icon: TFT_DATA.cdn + a.icon, lv: AUG_TL_LV[a.id] || a.lv || augLvFromIcon(a.icon)}));
// Riot führt viele Augments doppelt (Set-18-Version DA_… und eine alte Version aus früheren Sets).
// In Auswahl-Listen nur eine zeigen – die alten bleiben in AUGS, damit bestehende Links ihre Positionen behalten.
const AUG_DUP = (()=>{ const by = {}, dup = new Set();
  AUGS.forEach(a=>{ (by[a.en.toLowerCase()] = by[a.en.toLowerCase()] || []).push(a); });   // gleicher Name, auch wenn die alte Version eine andere Stufe hat
  // Gibt es eine Set-18-Version (DA_…), fallen alle alten weg. Pro Stufe bleibt je eine Version stehen
  // (z. B. „Tons of Stats!“ Gold und „TONS of Stats!“ Prismatisch sind zwei verschiedene Augments).
  Object.values(by).forEach(g=>{
    if(g.length < 2) return;
    const cur = g.filter(a=>/^DA_/.test(a.id)), pool = cur.length ? cur : g, seen = new Set();
    g.forEach(a=>{ if(!pool.includes(a) || seen.has(a.lv)) dup.add(a.id); else seen.add(a.lv); });
  });
  return dup; })();


const packages = [
  {n:'Einzelstunde',p:'30 €',u:'/ Stunde',f:false,l:['1 Stunde 1:1 Coaching auf Discord','10–15 Min. Fundamentals auffrischen','ca. 45 Min. VOD-Review oder dein Thema','Auf Deutsch oder Englisch']},
  {n:'3er-Paket',p:'80 €',u:'/ 3 Stunden',f:true,b:'Spar 10 €',l:['3 × 1 Stunde 1:1 Coaching','Fundamentals + VOD-Review in jeder Stunde','Sessions bauen aufeinander auf','Gültig für das laufende Set']},
  {n:'Team-Session',p:'20 €',u:'/ Person',f:false,l:['1 Stunde für 2–5 Personen','Fundamentals für die ganze Gruppe','Gemeinsames VOD-Review','Für dich und deine Freunde']},
];

// Stimmen gecoachter Spieler: q = Zitat, r = Fortschritt (z. B. 'Platin → Diamant'). Ohne Zitat erscheint ein Platzhalter.
const testimonials = [
  {n:'FreezeBomb', r:'Platin → Smaragd · 2 Sessions', q:'Eigenes Wissen mit den erklärten Konzepten vergleichen und im VOD-Review die eigenen Entscheidungen daran hinterfragen zu können – und Grundkonzepte zu lernen, die man vorher vielleicht gar nicht auf dem Schirm hatte.'},
  {n:'Doki', r:'Meister → Großmeister · 3 Sessions', q:'Habe das erste Mal Grandmaster erreicht. Augments und Opener waren am hilfreichsten.'},
  {n:'AgentZero', r:'Gold I → Platin I · 2 Sessions', q:'Am meisten hat mir gebracht, wie ich mein Early Game besser spielen kann und wann ich welche Augmente auswählen sollte. Auch dass ich mehr scouten muss, war hilfreich.'},
  {n:'бессмертный', r:'Diamant II → Meister · 2 Sessions', q:'Ich treffe jetzt nicht mehr so voreilige Entscheidungen, spiele generell safer und fühle mich mehr comfortable.'},
  {n:'Fist of Shadow', r:'Smaragd → Meister', q:''},
];

const guides = [
  {t:'Wisp-Guide',s:'Kostenlos · 5 Kapitel',col:'linear-gradient(160deg,#f2c14e,#b7791f)',d:'Wann du Wisps kaufst, welche Upgrades sich lohnen und wie du sie mit deiner Econ verbindest.',x:'Mit Checkliste für die nächsten drei Partien.'},
  {t:'Rank-Up-Training',s:'Kostenlos · Übungen',col:'linear-gradient(160deg,#3b82f6,#1e3a8a)',d:'Finde eine Gewohnheit, an der du arbeiten willst: Rollen, Leveln oder Positionieren — mit einer klaren Mission pro Partie.',x:'Klein anfangen. Autopilot hat schon genug Partien gespielt.'},
];

const ranks = [
  ['Eisen','#6b6f7a','Iron'],['Bronze','#a8714a','Bronze'],['Silber','#b6c2d1','Silver'],['Gold','#e3b54a','Gold'],['Platin','#4fb4a8','Platinum'],
  ['Smaragd','#2fae6a','Emerald'],['Diamant','#6aa5ff','Diamond'],['Meister','#b07cf0','Master'],['Großmeister','#ef5b5b','GrandMaster'],['Challenger','#f6d77a','Challenger']
];

/* ================= HELPERS ================= */
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const initials = n => n.split(/[\s']/).filter(Boolean).map(w=>w[0]).slice(0,2).join('').toUpperCase();
const DD = 'https://ddragon.leagueoflegends.com/cdn/16.20.1/img/';
const CH_DATA = Object.fromEntries(TFT_DATA.champions.map(c=>[c.n, c]));

// Champion-Bilder: Set-Kachel und Quadrat-Icon aus CommunityDragon (data/tft-data.js)
const champImg = n => CH_DATA[n] && CH_DATA[n].sq ? TFT_DATA.cdn + CH_DATA[n].sq : null;
const champFallback = n => CH_DATA[n] && CH_DATA[n].tile ? TFT_DATA.cdn + CH_DATA[n].tile : '';

// Offizielle Set-Items: Namen, Icons, Rezepte, Werte und Texte aus CommunityDragon (data/tft-data.js)
const ITEMS = TFT_DATA.items.map(i=>Object.assign({}, i, {img: TFT_DATA.cdn + i.icon}));
const normN = n => String(n).toLowerCase().replace(/[^a-z0-9]/g,'');
const itemById = Object.fromEntries(ITEMS.map(i=>[i.id,i]));
const itemByName = {};
ITEMS.forEach(i=>{ itemByName[normN(i.en)] = i; });
const findItem = k => itemById[k] || itemById[String(k).replace(/Augment$/,'')] || itemByName[normN(k)] || null;
const itemImg = n => { const it = findItem(n); return it ? it.img : null; };
const TRAIT_FILE = {"Blackthorn":"OldGod","Thornmaiden":"ZyraOrigin"};
const TRAIT_ICON = Object.fromEntries(TFT_DATA.traits.map(x=>[x.n, TFT_DATA.cdn + x.icon]));
const traitImg = n => TRAIT_ICON[n] || (DD + 'tft-trait/Trait_Icon_18_' + (TRAIT_FILE[n] || n.replace(/[^A-Za-z]/g,'')) + '.TFT_Set18.png');
function itemIcon(n, size=34){
  const u = itemImg(n);
  return u ? `<img class="item-ic" src="${u}" alt="${esc(n)}" title="${esc(n)}" width="${size}" height="${size}" loading="lazy" style="width:${size}px;height:${size}px;border-radius:6px;flex-shrink:0">` : '';
}
function avatar(name, size=46, extra=''){
  const ch = champBy[name] || {n:name,c:1};
  const u = champImg(ch.n);
  const fb = champFallback(ch.n);
  const img = u ? `<img src="${u}" alt="${esc(ch.n)}" loading="lazy" data-fb="${fb}" onerror="if(this.dataset.fb){this.src=this.dataset.fb;this.dataset.fb='';this.classList.add('wide')}else{this.parentNode.classList.add('no-img');this.remove()}">` : '';
  return `<div class="av av-${size} c${ch.c} ${u?'':'no-img'}" title="${esc(ch.n)} · ${ch.c} Gold">${img}<span class="fb">${initials(ch.n)}</span>${extra}</div>`;
}
const roleColor = {Carry:'#f2c14e',Tank:'#60a5fa',Utility:'#a78bfa',Prismatic:'#f0abfc',Gold:'#f2c14e',Silber:'#cbd5e1'};
const trendTxt = {rising:'▲ Steigend',falling:'▼ Fallend',new:'✦ Neu',stable:'– Stabil'};

/* ================= RENDER: COMPS (Kachel-Tierlist, Aufstellungen nach TFTAcademy) ================= */
const STYLE_DE = {'1-Cost Reroll':'1-Kosten-Reroll','2-Cost Reroll':'2-Kosten-Reroll','3-Cost Reroll':'3-Kosten-Reroll','4-Cost Fast 8':'Fast 8','Fast 9':'Fast 9','Lose Streak':'Lose Streak'};
const DIFF_DE = {EASY:'Leicht',MEDIUM:'Mittel',HARD:'Schwer',CONDITIONAL:'Situativ'};
const AUGTYPE_DE = {ITEMS:'Items',ECON:'Econ',COMBAT:'Kampf',TRAIT:'Trait',TRAITS:'Traits'};
const PLAN = {
  '1-Cost Reroll':'Reroll-Comp für 1-Koster: Spiel früh mit den besten Paaren, sammle Zinsen und rolle meist auf 3-1 bis 3-2 auf Level 5–6, bis deine Carrys 3★ sind. Danach stabil leveln und das Board mit starken 4-Kostern ergänzen.',
  '2-Cost Reroll':'Reroll-Comp für 2-Koster: Auf Level 6 gehen und ab 3-1 bzw. 3-2 langsam über 50 Gold rollen, bis Carry und Tank 3★ sind. Danach Level 7–8 für weitere Upgrades.',
  '3-Cost Reroll':'Reroll-Comp für 3-Koster: Econ bis Level 7 aufbauen, ab etwa 4-1 langsam über 50 Gold rollen, bis der Carry 3★ ist. Mit stabilem Board anschließend Level 8 für weitere Upgrades.',
  '4-Cost Fast 8':'Fast-8-Comp: Früh Leben und Gold halten, auf 4-1 oder 4-2 Level 8 und dort für die 4-Kosten-Carrys rollen. Komponenten bis dahin auf Tank und Zwischen-Carry parken.',
  'Fast 9':'Fast-9-Comp: Maximale Econ mit soliden Zwischenboards. Level 8 auf 4-1/4-2, weiter sparen und auf 5-1/5-2 Level 9 für die 5-Koster. Leben ist hier die wichtigste Ressource.',
  'Lose Streak':'Lose-Streak-Comp: Früh bewusst verlieren und Gold sowie Streak-Bonus mitnehmen, dabei Komponenten sammeln. In Phase 4 das Board mit einem großen Rolldown stabilisieren.',
};
const TIER_COL = {S:'#ff4655',A:'#ff8a1f',B:'#ffd23f',C:'#8ee63a',X:'#2fe0d0'};
const STICKER = {1:['new','+','Neu in der Tierlist'],2:['up','▲','Steigt'],3:['down','▼','Fällt']};
const PLANTS = Object.fromEntries(Object.keys(PLANT_IMG).map(n=>[n,1])); // Reihenfolge aus custom-<Set>.js (Builder-Links hängen davon ab)
let comps = [], mainComps = [], compBySlug = {};
function rebuildComps(list){
  comps = list.filter(c=>!c.hidden).map(c=>{
    const board = c.board || [];
    const best = board.filter(b=>!PLANTS[b.u]).sort((a,b)=>(b.i||[]).length-(a.i||[]).length)[0];
    return Object.assign({early:[], alt:[], cap:[], carousel:[], augs:[], augTypes:[], sub:'', sticker:0, main:1}, c, {
      board, carry: c.carry || (best ? best.u : ''), core: board.map(b=>b.u).filter(u=>!PLANTS[u])});
  });
  mainComps = comps.filter(c=>c.main);
  compBySlug = Object.fromEntries(comps.map(c=>[c.slug,c]));
}
rebuildComps(tierSource.data.comps);
const traitBy = Object.fromEntries(traits.map(t=>[t.n,t]));
const costOf = u => (champBy[u]||{c:0}).c;

function compTraits(c){
  const cnt = {}, seen = new Set();
  c.board.forEach(b=>{
    const ch = champBy[b.u];
    if(ch && !seen.has(b.u)){ seen.add(b.u); ch.t.forEach(t=>{ cnt[t]=(cnt[t]||0)+1; }); }
    (b.i||[]).forEach(id=>{ const it=findItem(id); const tr = it && emblemTrait(it); if(tr && !(ch && ch.t.includes(tr))) cnt[tr]=(cnt[tr]||0)+1; });
  });
  return Object.entries(cnt).map(([n,k])=>{
    const bp = (traitBy[n]||{bp:['1']}).bp.map(Number);
    const lvl = bp.filter(x=>x<=k).length, max = bp.length;
    const cls = !lvl ? 0 : max===1 ? 3 : lvl===max ? (max>=4?4:3) : lvl===1 ? 1 : 2;
    return {n,k,lvl,cls,uniq:max===1};
  }).filter(t=>t.lvl>0).sort((a,b)=>b.cls-a.cls || b.k-a.k);
}
// Offizielle Trait-Glyphe im Hex-Rahmen wie im Spiel (Bronze/Silber/Gold/Prisma, Unique = orange)
const HEX_LVL = ['base','bronze','silver','gold','prism'];
function traitHex(n, cls='base', size=28){ return `<span class="thx thx-${cls}" style="--s:${size}px" title="${esc(n)}"><img src="${traitImg(n)}" alt="" loading="lazy" onerror="this.style.visibility='hidden'"></span>`; }
const traitCls = t => t.uniq ? 'unique' : HEX_LVL[t.cls];
const tBadge = (t,withName) => `<span class="tbadge" title="${esc(t.n)} (${t.k})">${traitHex(t.n, traitCls(t), 18)}<span>${t.k}${withName?' '+esc(t.n):''}</span></span>`;
// Kachel-Symbol: wichtigstes Trait ohne Unique-/Kleinst-Traits (höchster Breakpoint > 2)
const tileTrait = c => compTraits(c).filter(t=>Math.max(...(traitBy[t.n]||{bp:['1']}).bp.map(Number)) > 2).sort((a,b)=>b.k-a.k || b.cls-a.cls)[0];
const itemMini = id => { const it=findItem(id); return it?`<img src="${it.img}" alt="${esc(it.en)}" title="${esc(it.en)}" loading="lazy">`:''; };
const champBg = name => PLANTS[name] ? `url('${PLANT_IMG[name]||traitImg('Elderwood')}')` : [champImg(name), champFallback(name)].filter(Boolean).map(u=>`url('${u}')`).join(',');
const hexHTML = (name, cls='') => { const ch = champBy[name]; return `<div class="hx c${ch?ch.c:1}${PLANTS[name]?' plant':''} ${cls}"><div class="hx-in" style="background-image:${champBg(name)}"></div></div>`; };
function unitHex(b, o={}){
  const its = (b.i||[]).map(itemMini).join('');
  const lv = o.lv ? `<span class="uh-lv" title="${esc(o.lvTitle||'')}">${esc(o.lv)}</span>` : '';
  return `<div class="uh${o.sm?' sm':''}"${champBy[b.u]?` data-champ="${esc(b.u)}"`:''} title="${esc(b.u)}">${b.s?`<span class="uh-stars">${'★'.repeat(b.s)}</span>`:''}${lv}${hexHTML(b.u)}${its?`<div class="uh-items">${its}</div>`:''}<span class="uh-name">${esc(b.u)}</span></div>`;
}
function boardHTML(c){
  const at = {}; c.board.forEach(b=>{ if(b.h!=null) at[b.h]=b; });
  let rows = '';
  for(let r=0;r<4;r++){
    let cells = '';
    for(let col=0;col<7;col++){
      const b = at[r*7+col];
      if(!b){ cells += '<div class="hex"><div class="hex-bg"></div></div>'; continue; }
      const ch = champBy[b.u], plant = PLANTS[b.u];
      const its = (b.i||[]).map(itemMini).join('');
      cells += `<div class="hex filled c${ch?ch.c:1}${plant?' plant':''}" title="${esc(b.u)}"${ch?` data-champ="${esc(b.u)}" style="cursor:pointer"`:''}><div class="hex-bg"></div><div class="hex-img" style="background-image:${champBg(b.u)}"></div>${b.s?`<span class="hex-stars">${'★'.repeat(b.s)}</span>`:''}${its?`<div class="hex-items">${its}</div>`:''}<span class="hex-name">${esc(b.u)}</span></div>`;
    }
    rows += `<div class="board-row${r%2?' odd':''}">${cells}</div>`;
  }
  return `<div class="board">${rows}</div>`;
}

/* --- Übersicht: eine Kachel pro Comp --- */
function tileHTML(c){
  const second = c.board.filter(b=>b.u!==c.carry && !PLANTS[b.u] && (b.i||[]).length>=2).sort((a,b)=>b.i.length-a.i.length || costOf(b.u)-costOf(a.u))[0];
  const st = STICKER[c.sticker];
  const tr = tileTrait(c);
  return `<button class="ct" data-slug="${c.slug}" data-name="${esc(c.name)}" aria-label="${esc(c.name)}">
    ${second?`<span class="ct-back">${hexHTML(second.u)}</span>`:''}${hexHTML(c.carry,'ct-main')}
    ${st?`<span class="ct-st ${st[0]}" title="${st[2]}">${st[1]}</span>`:''}
    ${c.sub?`<span class="ct-st sub" style="background:${TIER_COL[c.sub]}" title="Situativ – Bewertung ${c.sub}">${c.sub}</span>`:''}
    ${tr?`<span class="ct-tr">${traitHex(tr.n, traitCls(tr), 24)}</span>`:''}
  </button>`;
}
function renderTiers(target, list){
  const html = ['S','A','B','C','X'].map(t=>{
    const rows = list.filter(c=>c.tier===t).sort((a,b)=>t==='X' ? 'SABC'.indexOf(a.sub)-'SABC'.indexOf(b.sub) : 0);
    if(!rows.length) return '';
    return `<div class="tl-tier${t==='X'?' tl-x':''}" style="--tc:${TIER_COL[t]}">
      <div class="tl-row"><div class="tl-letter"><b>${t}</b><small>${t} TIER</small></div><div class="tl-tiles">${t==='X'?'<span class="tl-label" title="Stark unter bestimmten Bedingungen (Augments, Items, Emblem). Der Buchstabe zeigt die Stärke, wenn die Bedingungen erfüllt sind.">SITUATIONAL</span>':''}${rows.map(tileHTML).join('')}</div></div>
      <div class="tl-detail" hidden></div>
    </div>`;
  }).join('');
  $(target).innerHTML = html || viSays('Keine Comp passt zu deinen Filtern. Lockere sie ein bisschen, dann finden wir was!');
}

/* --- Detail-Panel --- */
function panelHTML(c){
  const variants = comps.filter(x=>x.carry===c.carry).sort((a,b)=>b.main-a.main || 'SABCX'.indexOf(a.tier)-'SABCX'.indexOf(b.tier));
  const tabs = variants.length>1 ? `<div class="cp-tabs">${variants.map(v=>`<button class="cp-tab${v===c?' on':''}" data-variant="${v.slug}" style="--tc:${TIER_COL[v.tier]}"><span>${v.tier}</span>${esc(v.name)}</button>`).join('')}</div>` : '';
  const units = c.board.filter(b=>!PLANTS[b.u]).sort((a,b)=>costOf(a.u)-costOf(b.u) || a.u.localeCompare(b.u));
  const augs = c.augs.map(id=>augById[id]).filter(Boolean);
  const prio = c.augTypes.map(t=>`<span class="cp-pill">${AUGTYPE_DE[t]||esc(t)}</span>`).join('<span class="cp-arrow">▶</span>');
  const carousel = c.carousel.map(findItem).filter(Boolean).map(it=>`<button data-item="${it.id}" title="${esc(it.en)}"><img src="${it.img}" alt="${esc(it.en)}" loading="lazy"></button>`).join('<span class="cp-arrow">▶</span>');
  const flex = c.cap.map(b=>{ const l=(b.lv||[])[0]||''; const num=/^\d+$/.test(l); return unitHex(b,{sm:true, lv:num?l:'⇄', lvTitle:num?`ab Level ${l}`:`ersetzt ${l}`}); }).join('');
  const card = (title, body, cls='') => body ? `<div class="cp-card ${cls}"><h4>${title}</h4>${body}</div>` : '';
  return `${tabs}<div class="cp" style="--tc:${TIER_COL[c.tier]}">
    <button class="cp-close" data-close-panel aria-label="Schließen">✕</button>
    <div class="cp-left">
      <div class="cp-tierbg">${c.tier}</div>
      ${hexHTML(c.carry,'hx-big')}
      <h3>${esc(c.name)}</h3>
      <div class="cp-style">Spielstil: ${esc(STYLE_DE[c.style]||c.style)} (${DIFF_DE[c.diff]||esc(c.diff)})${c.sub?`<br>Situativ · Bewertung ${c.sub}`:''}</div>
      <div class="trait-row" style="justify-content:center">${compTraits(c).map(t=>tBadge(t,false)).join('')}</div>
      ${augs.length?`<h4>Augments</h4><div class="cp-augs">${augs.map(a=>`<button class="cp-aug" data-aug="${a.id}" title="${esc(a.en)}"><img src="${augImg(a)}" alt="${esc(a.en)}" loading="lazy"></button>`).join('')}</div>`:''}
      ${prio?`<h4>Augment-Priorität</h4><div class="cp-prio">${prio}</div>`:''}
      <h4>Spielplan</h4><p>${c.plan ? esc(c.plan).replace(/\n/g,'<br>') : (PLAN[c.style]||'')}</p>
      ${c.tips ? `<h4>Tipps</h4><p>${esc(c.tips).replace(/\n/g,'<br>')}</p>` : ''}
    </div>
    <div class="cp-right">
      <div class="cp-card cp-final">${units.map(b=>unitHex(b)).join('')}</div>
      <div class="cp-mid">
        ${card('Early Units', c.early.length?`<div class="cp-units">${c.early.map(b=>unitHex(b,{sm:true})).join('')}</div>`:'')}
        ${card('Item-Priorität', carousel?`<div class="cp-itemprio">${carousel}</div>`:'')}
        ${card('Flex Units', flex?`<div class="cp-units">${flex}</div>`:'')}
      </div>
      <div class="cp-bottom">
        ${card('Aufstellung', `<div class="cp-board">${boardHTML(c)}</div>`)}
        ${card('Alt Builds', c.alt.length?`<div class="cp-units cp-col">${c.alt.map(b=>unitHex(b,{sm:true})).join('')}</div>`:'<p class="note" style="text-align:center;margin:0">–</p>')}
      </div>
      <div class="cp-actions"><button class="cp-names" type="button" data-builder="${c.slug}">⬡ Im Team Builder öffnen</button><label class="cp-names"><input type="checkbox" data-names> Namen anzeigen</label></div>
    </div>
  </div>`;
}
function openPanel(tile, slug){
  const tier = tile.closest('.tl-tier'), root = tile.closest('#tierRows,#homeTier') || document;
  const det = tier.querySelector('.tl-detail');
  const c = compBySlug[slug || tile.dataset.slug];
  if(!slug && tile.classList.contains('sel')){ closePanel(tier); return; }
  root.querySelectorAll('.ct.sel').forEach(x=>x.classList.remove('sel'));
  root.querySelectorAll('.tl-detail').forEach(d=>{ if(d!==det){ d.hidden=true; d.innerHTML=''; } });
  tile.classList.add('sel');
  det.innerHTML = panelHTML(c); det.hidden = false;
  det.dataset.tile = tile.dataset.slug;
  if(root.id==='tierRows') buddyReact(c);
}
function closePanel(tier){
  const det = tier.querySelector('.tl-detail'); det.hidden = true; det.innerHTML = '';
  tier.querySelectorAll('.ct.sel').forEach(x=>x.classList.remove('sel'));
}
let compStyle='all';
function filterComps(){
  if(!mainComps.length){ $('#tierRows').innerHTML = ornnSays(`Hmph. Für Set ${TFT_DATA.set} gibt es noch keine Tierlist – die wird gerade geschmiedet.`); return; }
  const q = $('#compSearch').value.toLowerCase().trim();
  const list = mainComps.filter(c=>(compStyle==='all'||c.style.includes(compStyle)) &&
    (!q || c.name.toLowerCase().includes(q) || c.core.some(u=>u.toLowerCase().includes(q)) || compTraits(c).some(t=>t.n.toLowerCase().includes(q))));
  renderTiers('#tierRows', list);
}
function openComp(slug){
  const c = compBySlug[slug]; if(!c) return;
  const main = c.main ? c : (mainComps.find(x=>x.carry===c.carry) || c);
  go('/tierlist');
  setTimeout(()=>{
    $('#compSearch').value=''; compStyle='all';
    $('#compFilters').querySelectorAll('.chip-btn').forEach(x=>x.classList.toggle('active', x.dataset.style==='all'));
    filterComps();
    const tile = document.querySelector(`#tierRows .ct[data-slug="${main.slug}"]`);
    if(tile){ openPanel(tile, c.slug); tile.closest('.tl-tier').scrollIntoView({behavior:'smooth',block:'start'}); }
  },60);
}
document.addEventListener('click', e=>{
  const tile = e.target.closest('.ct'); if(tile){ openPanel(tile); return; }
  const v = e.target.closest('[data-variant]');
  if(v){ const det = v.closest('.tl-detail'); const t = det.closest('.tl-tier').querySelector(`.ct[data-slug="${det.dataset.tile}"]`); openPanel(t, v.dataset.variant); return; }
  const x = e.target.closest('[data-close-panel]'); if(x) closePanel(x.closest('.tl-tier'));
});
document.addEventListener('change', e=>{
  if(e.target.matches('[data-names]')) e.target.closest('.cp').classList.toggle('show-names', e.target.checked);
});
$('#compFilters').addEventListener('click', e=>{
  const b = e.target.closest('.chip-btn'); if(!b) return;
  $('#compFilters').querySelectorAll('.chip-btn').forEach(x=>x.classList.remove('active'));
  b.classList.add('active'); compStyle=b.dataset.style; filterComps();
});
$('#compSearch').addEventListener('input', filterComps);

/* ================= TIERLIST: ITEMS & AUGMENTS ================= */
const AUG_CDN = 'https://raw.communitydragon.org/latest/game/assets/maps/tft/icons/augments/';
const augById = Object.fromEntries(AUGS.map(a=>[a.id,a]));
const augImg = a => AUG_IMG[a.id] || a.icon;
const AUG_LV = {1:'Silber',2:'Gold',3:'Prismatisch'};
// Eine Tier-Reihe im Comps-Design (Buchstabe links, Kacheln rechts) – auch für Items, Augments und Holds
const tierRow = (t, inner, label) => `<div class="tl-tier" style="--tc:${TIER_COL[t] || '#6b7280'}"><div class="tl-row"><div class="tl-letter"><b>${t}</b><small>${label || t + ' TIER'}</small></div><div class="tl-tiles">${inner}</div></div></div>`;
const icoTile = (attr, name, img) => `<button class="tl-ico" ${attr} data-name="${esc(name)}" aria-label="${esc(name)}"><img src="${img}" alt="" loading="lazy"></button>`;

let itlCat = 'craftables';
function renderItemTL(){
  if(!Object.keys(ITEM_TL).length){ $('#itemTiers').innerHTML = ornnSays(`Für Set ${TFT_DATA.set} gibt es noch keine Item-Tierlist. Erst testen, dann bewerten. Hmph.`); return; }
  const tl = ITEM_TL[itlCat] || {};
  $('#itemTiers').innerHTML = ['S','A','B','C'].filter(t=>(tl[t]||[]).length).map(t=>tierRow(t, tl[t].map(id=>{
    const it = findItem(id);
    return it ? icoTile(`data-item="${it.id}"`, it.en, it.img) : '';
  }).join(''))).join('');
}
$('#itemTlFilters').addEventListener('click', e=>{
  const b=e.target.closest('.chip-btn'); if(!b) return;
  $('#itemTlFilters').querySelectorAll('.chip-btn').forEach(x=>x.classList.toggle('active', x===b));
  itlCat = b.dataset.itl; renderItemTL();
});

let augLv = '1', augStage = 'All';
const augCard = a => icoTile(`data-aug="${a.id}"`, a.en, augImg(a));
function renderAugTL(){
  if(!Object.keys(AUG_TL).length){ $('#augTiers').innerHTML = ornnSays(`Für Set ${TFT_DATA.set} gibt es noch keine Augment-Tierlist. Kommt, sobald genug gespielt wurde.`); return; }
  const q = $('#augSearch').value.toLowerCase().trim();
  const tl = (AUG_TL[augStage]||{})[augLv] || {};
  const html = ['S','A','B','C'].map(t=>{
    const list = (tl[t]||[]).map(id=>augById[id]).filter(a=>a && (!q || a.en.toLowerCase().includes(q) || a.de.toLowerCase().includes(q)));
    return list.length ? tierRow(t, list.map(augCard).join('')) : '';
  }).join('');
  $('#augTiers').innerHTML = html || viSays('Kein Augment gefunden. Versuch es mit einem anderen Wort!');
}
[['#augLvFilters','alv',v=>{augLv=v;}],['#augStageFilters','ast',v=>{augStage=v;}]].forEach(([sel,key,set])=>{
  $(sel).addEventListener('click', e=>{
    const b=e.target.closest('.chip-btn'); if(!b) return;
    $(sel).querySelectorAll('.chip-btn').forEach(x=>x.classList.toggle('active', x===b));
    set(b.dataset[key]); renderAugTL();
  });
});
$('#augSearch').addEventListener('input', renderAugTL);

// Holds: welche 1-, 2- und 3-Kosten-Champions sich von 1-1 bis 1-3 zu halten lohnen (holdTL in tierlist-data-<Set>.js)
let holdCost = '1';
const holdTile = n => `<button class="tl-ico tl-champ" data-champ="${esc(n)}" data-name="${esc(n)}" aria-label="${esc(n)}">${hexHTML(n)}</button>`;
function renderHoldTL(){
  const tl = HOLD_TL[holdCost] || {}, pool = champions.filter(c=>c.c===+holdCost).map(c=>c.n);
  const rated = new Set(['S','A','B','C'].flatMap(t=>tl[t]||[]));
  const rows = ['S','A','B','C'].map(t=>{ const list = (tl[t]||[]).filter(n=>champBy[n]); return list.length ? tierRow(t, list.map(holdTile).join('')) : ''; }).join('');
  const rest = pool.filter(n=>!rated.has(n)).sort((a,b)=>a.localeCompare(b));
  $('#holdTiers').innerHTML = (rows || viSays(`Die Holds für ${holdCost}-Kosten-Champions werden gerade bewertet. Schau bald wieder rein!`))
    + (rest.length ? tierRow('–', rest.map(holdTile).join(''), rows ? 'NICHT BEWERTET' : 'ALLE UNITS') : '');
}
$('#holdFilters').addEventListener('click', e=>{
  const b=e.target.closest('.chip-btn'); if(!b) return;
  $('#holdFilters').querySelectorAll('.chip-btn').forEach(x=>x.classList.toggle('active', x===b));
  holdCost = b.dataset.hc; renderHoldTL();
});

function openAug(id){
  const a = augById[id]; if(!a) return;
  const desc = fmtDesc(a.desc, a.fx);
  const inComps = comps.filter(c=>c.augs.includes(id));
  $('#modalBody').innerHTML = `<div style="display:flex;gap:16px;align-items:center"><img src="${augImg(a)}" alt="" width="64" height="64" style="border-radius:10px;border:1px solid var(--line-2)"><div><small style="font-size:.7rem;color:var(--faint);text-transform:uppercase;letter-spacing:.06em">${a.lv?AUG_LV[a.lv]+'-':''}Augment</small><h2 style="margin:2px 0 0">${esc(a.en)}</h2>${a.de!==a.en?`<div style="color:var(--muted);font-size:.9rem">${esc(a.de)}</div>`:''}</div></div>
    ${desc?`<div class="it-desc">${desc}</div>`:''}
    ${inComps.length?`<h4 style="margin-top:18px;font-size:.85rem;color:var(--faint)">EMPFOHLEN IN</h4><div class="tag-row">${inComps.map(c=>`<button class="it-link" data-comp="${c.slug}" style="padding:4px 12px">${c.tier} · ${esc(c.name)}</button>`).join('')}</div>`:''}`;
  openModal();
}
document.addEventListener('click', e=>{
  const a = e.target.closest('[data-aug]'); if(a){ openAug(a.dataset.aug); return; }
  const c = e.target.closest('[data-comp]'); if(c){ closeModal(); openComp(c.dataset.comp); }
});

/* tierlist tabs */
function setTab(tab){
  ['comps','items','augments','holds'].forEach(t=>{ $('#tl-'+t).hidden = t!==tab; });
  $('#tlTabs').querySelectorAll('.tab').forEach(b=>b.classList.toggle('active', b.dataset.tab===tab));
  if(tlTab!==tab){ tlTab = tab; buddyNext('tierlist', true); }
}

/* ================= RANKS: Spielerverteilung ================= */
// Quelle: EsportsTales „TFT Rank Distribution“. Region/Erhebung dort nicht angegeben.
// Aktuelle Zahlen kommen aus data/ranks.js (vom Update-Skript erzeugt); die Werte unten sind der Rückfall (Set 18, September 2026).
const RK = window.TFT_RANKS && window.TFT_RANKS.div && window.TFT_RANKS.apex ? window.TFT_RANKS : null;
const RANK_SRC = RK ? {name:RK.source, url:RK.url, when:`Set ${RK.set}, Stand ${RK.month}`}
  : {name:'EsportsTales', url:'https://www.esportstales.com/teamfight-tactics/seasonal-rank-system-and-player-distribution', when:'Set 18, Stand September 2026'};
const RANK_TIERS = [
  {k:'iron', n:L('Eisen','Iron'), f:'Iron', div:[0.006,0.27,1.1,1.4], d:'Der Einstieg ins Ranked. Hier zählen die Grundlagen: Leben schonen, Econ verstehen, eine Comp sicher spielen.'},
  {k:'bronze', n:L('Bronze','Bronze'), f:'Bronze', div:[2.7,4.3,5.9,6.5], d:'Bronze trennt Neulinge von regelmäßigen Spielern. Wer Zinsen sauber mitnimmt, steigt hier schnell auf.'},
  {k:'silver', n:L('Silber','Silver'), f:'Silver', div:[9.8,9.7,9.5,7.1], d:'Silber ist die größte Gruppe der Spielerbasis. Stabil Top 4 spielen reicht, um hier rauszukommen.'},
  {k:'gold', n:L('Gold','Gold'), f:'Gold', div:[10,7.2,5.4,3.2], d:'Gold liegt zwischen Silber und Platin. Zwei Comps sicher beherrschen bringt dich zum nächsten Rang.'},
  {k:'platinum', n:L('Platin','Platinum'), f:'Platinum', div:[5.3,3.1,2.1,1.1], d:'Platin ist klar überdurchschnittlich. Positionierung und Item-Entscheidungen machen jetzt den Unterschied.'},
  {k:'emerald', n:L('Smaragd','Emerald'), f:'Emerald', div:[1.7,0.89,0.55,0.25], d:'Smaragd gehört zur oberen Spitze. Flexibel spielen und die Lobby lesen wird hier Pflicht.'},
  {k:'diamond', n:L('Diamant','Diamond'), f:'Diamond', div:[0.42,0.19,0.11,0.03], d:'Diamant ist die Elite der Ranglisten-Spieler. Jeder Fehler kostet hier spürbar LP.'},
  {k:'master', n:L('Meister','Master'), f:'Master', pct:0.21, d:'Ab Meister gibt es keine Divisionen mehr – nur noch LP. Jede Partie zählt direkt.'},
  {k:'grandmaster', n:L('Großmeister','Grandmaster'), f:'GrandMaster', pct:0.05, d:'Großmeister gehören zu den besten Spielern ihrer Region. Die LP-Grenze hängt vom Server ab.'},
  {k:'challenger', n:L('Challenger','Challenger'), f:'Challenger', pct:0.023, d:'Die Spitze jeder Region – mit begrenzten Plätzen. Höher geht es nicht.'},
];
if(RK) RANK_TIERS.forEach(t=>{ if(t.div){ if(Array.isArray(RK.div[t.k]) && RK.div[t.k].length===4) t.div = RK.div[t.k]; } else if(typeof RK.apex[t.k]==='number') t.pct = RK.apex[t.k]; });
const DIVS = ['IV','III','II','I'];
const rankImg = t => `${DD}tft-regalia/TFT_Regalia_${t.f}.png`;
// Einträge aufsteigend (Eisen IV … Challenger) mit kumulierten Werten
const RANK_ENTRIES = [];
RANK_TIERS.forEach(t=>{ t.total = t.div ? t.div.reduce((a,b)=>a+b,0) : t.pct; (t.div ? t.div.map((p,i)=>({t, d:DIVS[i], p})) : [{t, d:'', p:t.pct}]).forEach(e=>RANK_ENTRIES.push(e)); });
let acc = 0; RANK_ENTRIES.forEach(e=>{ e.below = acc; acc += e.p; });
const RANK_SUM = acc;
RANK_ENTRIES.forEach(e=>{ e.top = Math.min(100, RANK_SUM - e.below); });
// "Top x %" aus den Werten ab diesem Rang aufwärts; "darunter" = Rest auf 100 % (Quellwerte summieren rundungsbedingt auf ~100,1 %)
RANK_TIERS.forEach(t=>{ const es = RANK_ENTRIES.filter(e=>e.t===t); t.topTier = Math.min(100, RANK_SUM - es[0].below); t.below = Math.max(0, 100 - t.topTier); });
const fmtPct = v => v.toLocaleString(LOC, {maximumFractionDigits: v < 0.1 || (v > 99.9 && v < 100) ? 3 : v < 1 || v > 99 ? 2 : 1}) + L(' %', '%');
const rankBy = Object.fromEntries(RANK_TIERS.map(t=>[t.k,t]));

function rankCell(e, extra=''){
  const label = e.t.n + (e.d ? ' ' + e.d : '');
  return `<a class="rk-cell${extra}" href="/ranks/${e.t.k}" title="${esc(label)}: ${fmtPct(e.p)} der Spieler"><span class="rk-emb"><img src="${rankImg(e.t)}" alt="" loading="lazy">${e.d?`<b class="rk-div">${e.d}</b>`:''}</span><span><strong>${esc(label)}</strong><small>${fmtPct(e.p)} · Top ${fmtPct(e.top)}</small></span></a>`;
}
function renderRankTable(){
  let html = '', row = 0;
  RANK_TIERS.filter(t=>t.div).forEach(t=>{ html += RANK_ENTRIES.filter(e=>e.t===t).map(e=>rankCell(e, row%2?' alt':'')).join(''); row++; });
  html += RANK_ENTRIES.filter(e=>!e.d).map(e=>rankCell(e, row%2?' alt':'')).join('') + `<div class="rk-cell rk-empty${row%2?' alt':''}"></div>`;
  $('#rkTable').innerHTML = html;
  $('#rkSrcLink').href = RANK_SRC.url;
  $('#rkWhen').textContent = RANK_SRC.when;
}

// Achsen-Maximum auf „schöne“ Schritte runden
function niceMax(m){ const steps=[0.05,0.1,0.2,0.5,1,2,5,10,20,50]; const s = steps.find(x=>m/x<=4) || 50; return Math.ceil(m/s)*s; }
function barChart(items, onKey){
  const max = niceMax(Math.max(...items.map(i=>i.v)));
  const grid = [1, .5, 0].map(f=>`<div class="rk-gl" style="bottom:${f*100}%"><span>${fmtPct(max*f).replace(' %','%')}</span></div>`).join('');
  const bars = items.map(i=>`<button class="rk-bar${i.k===onKey?' on':''}" ${i.href?`data-href="${i.href}"`:''} data-tip="${esc(i.label)}: ${fmtPct(i.v)}" aria-label="${esc(i.label)}: ${fmtPct(i.v)}"><em>${fmtPct(i.v)}</em><i style="height:${Math.max(0.6, i.v/max*100)}%"></i></button>`).join('');
  const xl = items.map(i=>`<span class="${i.k===onKey?'on':''}">${i.img?`<img src="${i.img}" alt="" loading="lazy">`:''}${esc(i.short||i.label)}</span>`).join('');
  return `<div class="rk-chart">${grid}<div class="rk-bars">${bars}</div></div><div class="rk-xl">${xl}</div>`;
}
let rkView = 'all';
function renderRankDetail(key){
  const t = rankBy[key]; if(!t){ go('/ranks'); return; }
  const idx = RANK_TIERS.indexOf(t), prev = RANK_TIERS[idx-1], next = RANK_TIERS[idx+1];
  // Meister, Großmeister und Challenger als gemeinsame Gruppe (wie Divisionen) behandeln
  const apex = !t.div;
  const es = apex ? RANK_ENTRIES.filter(e=>!e.d) : RANK_ENTRIES.filter(e=>e.t===t);
  const view = rkView;
  const groupLabel = apex ? 'Meister – Challenger' : ` IV–I`;
  const items = view==='all'
    ? RANK_TIERS.map(x=>({k:x.k, v:x.total, label:x.n, img:rankImg(x), href:'/ranks/'+x.k}))
    : es.map(e=>{ const l = e.t.n + (e.d ? ' ' + e.d : ''); return {k: apex ? e.t.k : e.d, v:e.p, label:l, short:l, img:rankImg(e.t), href: apex ? '/ranks/'+e.t.k : null}; });
  const where = (prev ? `Über ${prev.n}. ` : 'Der Einstieg ins Ranked. ') + (next ? `Nächster Rang: ${next.n}.` : 'Höher geht es nicht.');
  const exact = RANK_ENTRIES.slice().reverse().map(e=>`<tr${e.t===t?' class="on"':''}><td>${esc(e.t.n+(e.d?' '+e.d:''))}</td><td>${fmtPct(e.p)}</td><td>Top ${fmtPct(e.top)}</td></tr>`).join('');
  $('#rk-detail').innerHTML = `
    <div class="rk-back"><a href="/ranks">← Alle TFT-Ränge</a> / <span>${esc(t.n)}</span></div>
    <div class="rk-card">
      <div class="rk-head">
        <img src="${rankImg(t)}" alt="TFT Rang ${esc(t.n)}">
        <div><h1>TFT Rang ${esc(t.n)}</h1><p>${esc(t.d)}</p></div>
        <div class="rk-big"><b>${fmtPct(t.total)}</b><small>der erfassten Spieler</small></div>
      </div>
      <div class="rk-sec"><h3>${apex?'Apex-Ränge':`${esc(t.n)}-Divisionen`}</h3><small class="updated">Geschätzte Anteile</small></div>
      <div class="rk-divs${apex?' three':''}">${es.map(e=>rankCell(e, apex && e.t===t ? ' on' : '')).join('')}</div>
      <div class="rk-sec">
        <div><h3>Wie selten ist ${esc(t.n)}?</h3><small class="updated">${view==='all'?'Anteil der Spieler pro Rang':(apex?'Anteil der Spieler pro Apex-Rang':'Anteil der Spieler pro Division')}</small></div>
        <div class="rk-toggle" role="group" aria-label="Ansicht"><button class="${view==='all'?'on':''}" data-rkview="all">Alle Ränge</button><button class="${view==='div'?'on':''}" data-rkview="div">${esc(groupLabel)}</button></div>
      </div>
      <div class="rk-chartwrap">
        <div>${barChart(items, view==='all' || apex ? t.k : null)}
          <details class="rk-exact"><summary>Genaue Zahlen anzeigen</summary><table><thead><tr><th>Rang</th><th>Anteil</th><th>Kumuliert</th></tr></thead><tbody>${exact}</tbody></table></details>
        </div>
        <aside class="rk-side">
          <small class="updated">Wo ${esc(t.n)} steht</small>
          <b class="rk-sidebig">${fmtPct(t.below)}</b>
          <p>der Spieler sind unter ${esc(t.n)}.</p>
          <hr>
          <p><b>Top ${fmtPct(t.topTier)}</b> der Spieler sind ${esc(t.n)} oder höher.</p>
          <p class="rk-where">${esc(where)}</p>
        </aside>
      </div>
      <p class="note">Quelle: <a href="${RANK_SRC.url}" target="_blank" rel="noopener" style="text-decoration:underline">${RANK_SRC.name}</a> · ${RANK_SRC.when}. Region und Erhebungsweise sind dort nicht angegeben – die Werte sind Schätzungen einer Stichprobe, nicht alle aktiven Spieler. Rundungsbedingt ergibt die Summe nicht genau 100 %.</p>
    </div>`;
}
function setRank(sub){
  const detail = !!(sub && rankBy[sub]);
  $('#rk-list').hidden = detail; $('#rk-detail').hidden = !detail;
  if(detail) renderRankDetail(sub);
}
document.addEventListener('click', e=>{
  const v = e.target.closest('[data-rkview]');
  if(v){ rkView = v.dataset.rkview; renderRankDetail(curPath().split('/')[2]); return; }
  const b = e.target.closest('.rk-bar[data-href]'); if(b) go(b.dataset.href);
});
renderRankTable();

/* ================= TEAM BUILDER ================= */
const BUILDER_KEY = 'tftfreaks_builder_v1_' + TFT_DATA.set, BUILDER_ENEMY_KEY = 'tftfreaks_builder_enemy';
const B_UNITS = [...champions.map(c=>c.n), ...Object.keys(PLANTS)]; // feste Reihenfolge für Teil-Links
const B_ITEM_CATS = ['component','craft','radiant','artifact','emblem'];
let bBoard = {}, bAugs = [], bAlt = [null, null];   // dein Board: Hex-Index (0–27) -> {u, s, i:[itemIds]}
let eBoard = {}, eAugs = [];                         // Gegner-Board (eigene Koordinaten, Anzeige um 180° gedreht)
let bEnemy = false, bActive = 'm', bNamesOn = false, bAugSide = 'm';
let bSel = null;            // {type:'item', id} oder {type:'hex', side, id}
let bCtx = null;            // {slug} wenn aus der Redaktion geöffnet
let bSort = 'cost', bItemCat = 'craft', bQuery = '', bDrag = null, bLoaded = false, bHintTimer = 0;
let bHist = [], bRedo = [], bLast = null, bRestoring = false;
const sideBoard = s => s==='e' ? eBoard : bBoard;
const sideAugs = s => s==='e' ? eAugs : bAugs;
try { bEnemy = localStorage.getItem(BUILDER_ENEMY_KEY)==='1'; } catch(e){}
// Dieselbe Oberfläche dient auch dem Kampf-Simulator (/tools/simulator) – mit eigenem Speicherstand und immer mit Gegner
const SIM_KEY = 'tftfreaks_sim_v1_' + TFT_DATA.set;
let bMode = 'builder';
const bKey = () => bMode==='sim' ? SIM_KEY : BUILDER_KEY;
const bBase = () => bMode==='sim' ? '/tools/simulator' : '/builder';
function bSetMode(mode){
  if(mode===bMode) return;
  bMode = mode; bLoaded = false; bCtx = null; bSel = null;
  if(mode==='builder'){ try { bEnemy = localStorage.getItem(BUILDER_ENEMY_KEY)==='1'; } catch(e){ bEnemy = false; } }
  const sim = mode==='sim';
  $('#page-builder').classList.toggle('sim-mode', sim);
  $('#bCrumb').innerHTML = sim ? '<a href="/tools">Tools</a> / Kampf-Simulator' : '<a href="/">Home</a> / Team Builder';
  $('#bTitle').innerHTML = sim ? `<span class="th-key">TFT Kampf-Simulator:</span> Welches Team gewinnt? <span class="pill gold wip-pill" title="Der Simulator wird noch verbessert – Ergebnisse sind Näherungen">In Arbeit</span>` : `<span class="th-key">TFT Team Builder:</span> Board planen für Set <span data-setno>${TFT_DATA.set}</span>`;
  $('#bIntro').textContent = sim ? 'Stell dein Team und den Gegner auf – mit Items, Sternen und Augments – und starte den Kampf. Du siehst, wohin jede Unit läuft, wen sie angreift, wann sie ihre Fähigkeit wirkt und wohin sie springt. Der Simulator ist noch in Arbeit: Die Ergebnisse sind Näherungen.'
    : 'Zieh Units aufs Brett, verteil Items und sieh sofort, welche Traits aktiv sind. Auf dem Handy: erst antippen, dann aufs Feld tippen.';
}

// Kompakter Code für Links: Brett ~ Augments ~ Alt Builds ~ Gegner-Brett ~ Gegner-Augments (Base36)
const encBoard = board => Object.entries(board).map(([h,b])=>[(+h).toString(36), B_UNITS.indexOf(b.u).toString(36), b.s||1,
  (b.i||[]).map(id=>ITEMS.findIndex(x=>x.id===id)).filter(x=>x>=0).map(x=>x.toString(36)).join(',')].join('-')).join('.');
const encAugs = augs => augs.map(id=>AUGS.findIndex(a=>a.id===id)).filter(x=>x>=0).map(x=>x.toString(36)).join(',');
function decBoard(str){
  const out = {};
  String(str||'').split('.').filter(Boolean).forEach(p=>{
    const [h,u,s,it] = p.split('-'); const hex = parseInt(h,36), name = B_UNITS[parseInt(u,36)];
    if(!name || !(hex>=0 && hex<28)) return;
    out[hex] = {u:name, s:Math.min(3,Math.max(1,+s||1)), i:String(it||'').split(',').filter(Boolean).map(x=>ITEMS[parseInt(x,36)]).filter(Boolean).map(x=>x.id).slice(0,3)};
  });
  return out;
}
const decAugs = str => String(str||'').split(',').filter(Boolean).map(x=>AUGS[parseInt(x,36)]).filter(Boolean).map(a=>a.id).slice(0,3);
function bEncode(){
  const alt = bAlt.map(u=>u ? B_UNITS.indexOf(u).toString(36) : '').join(',');
  const segs = [encBoard(bBoard), encAugs(bAugs), alt===',' ? '' : alt, encBoard(eBoard), encAugs(eAugs)];
  while(segs.length>1 && !segs[segs.length-1]) segs.pop();
  return segs.join('~');
}
function bDecode(code){
  const [b, a, alt, eb, ea] = String(code||'').split('~');
  const al = String(alt||'').split(',').map(x=>x ? B_UNITS[parseInt(x,36)] || null : null);
  return {board:decBoard(b), augs:decAugs(a), alt:[al[0]||null, al[1]||null], eboard:decBoard(eb), eaugs:decAugs(ea)};
}
function bApplyState(st){
  bBoard = st.board; bAugs = st.augs; bAlt = st.alt; eBoard = st.eboard || {}; eAugs = st.eaugs || [];
  if(Object.keys(eBoard).length || eAugs.length) bEnemy = true;
}
const bTeamOf = board => ({board:Object.entries(board).map(([h,b])=>({u:b.u, h:+h, s:b.s, i:b.i}))});
const bTeam = () => bTeamOf(bBoard);
function bHint(msg, keep){
  const el = $('#bHint'); if(!el) return; el.textContent = msg || '';
  clearTimeout(bHintTimer); if(msg && !keep) bHintTimer = setTimeout(()=>{ el.textContent = bSel && bSel.type==='item' ? bSelHint() : ''; }, 2600);
}
const bSelHint = () => { const it = findItem(bSel.id); return it ? `${it.en} gewählt – klick auf eine Unit auf dem Brett.` : ''; };
// Verlauf (Rückgängig/Wiederholen): jeder neue Stand wird beim Rendern erkannt
function bTrack(){
  const code = bEncode();
  if(bLast!==null && code!==bLast && !bRestoring){ bHist.push(bLast); if(bHist.length>100) bHist.shift(); bRedo = []; }
  bLast = code;
}
function bRestore(code){ bRestoring = true; const keep = bEnemy; bApplyState(bDecode(code)); bEnemy = keep || bEnemy; bSel = null; renderBuilder(); bRestoring = false; bLast = code; }
function bUndo(){ if(!bHist.length) return; bRedo.push(bEncode()); bRestore(bHist.pop()); }
function bRedoStep(){ if(!bRedo.length) return; bHist.push(bEncode()); bRestore(bRedo.pop()); }
function bResetHistory(){ bHist = []; bRedo = []; bLast = null; }

function bAllTraits(team){
  const active = compTraits(team), cnt = {}, seen = new Set();
  team.board.forEach(b=>{
    const ch = champBy[b.u];
    if(ch && !seen.has(b.u)){ seen.add(b.u); ch.t.forEach(t=>{ cnt[t]=(cnt[t]||0)+1; }); }
    (b.i||[]).forEach(id=>{ const it=findItem(id); const tr=it && emblemTrait(it); if(tr && !(ch && ch.t.includes(tr))) cnt[tr]=(cnt[tr]||0)+1; });
  });
  const inactive = Object.entries(cnt).filter(([n])=>!active.some(a=>a.n===n)).map(([n,k])=>({n,k,lvl:0,cls:0})).sort((a,b)=>b.k-a.k || a.n.localeCompare(b.n));
  return [...active, ...inactive];
}
// Benötigte Komponenten für alle ausgerüsteten Items
function bComponents(board){
  const cnt = {};
  Object.values(board).forEach(b=>b.i.forEach(id=>{
    const it = itemById[id]; if(!it) return;
    const src = it.cat==='radiant' ? (radiantBase(it) || it) : it;
    const parts = src.comp && src.comp.length===2 ? src.comp : (src.cat==='component' ? [src.id] : []);
    parts.forEach(p=>{ cnt[p] = (cnt[p]||0) + 1; });
  }));
  return Object.entries(cnt).sort((a,b)=>b[1]-a[1]);
}
// Brett zeichnen – das Gegner-Brett ist um 180° gedreht (seine Frontlinie zeigt auf deine)
function boardRows(board, side){
  const flip = side==='e';
  // Schwarzdorn aktiv: Opferfeld markieren (Feld aus data/custom-<Set>.js)
  const bt = TFT_CUSTOM_SET.blackthorn, btHex = bt && compTraits(bTeamOf(board)).some(t=>t.n==='Blackthorn') ? bt.hex : -1;
  let rows = '';
  for(let k=0;k<4;k++){
    const r = flip ? 3-k : k;
    let cells = '';
    for(let j=0;j<7;j++){
      const h = r*7 + (flip ? 6-j : j), b = board[h], key = `${side}:${h}`;
      const sel = (bSel && bSel.type==='hex' && bSel.side===side && +bSel.id===h ? ' sel' : '') + (h===btHex ? ' bthex' : '');
      const btTag = h===btHex ? `<span class="bt-tag" title="Schwarzdorn-Opferfeld: Die Unit hier wird vor dem Kampf geopfert und stärkt dein Team">Opfer</span>` : '';
      if(!b){ cells += `<div class="hex${sel}" data-hex="${h}" data-side="${side}"><div class="hex-bg"></div>${btTag}</div>`; continue; }
      const ch = champBy[b.u], plant = PLANTS[b.u];
      const its = b.i.map((id,n)=>{ const it=findItem(id); return it?`<img src="${it.img}" alt="${esc(it.en)}" title="${esc(it.en)} – Klick entfernt" data-unequip="${key}:${n}" draggable="true">`:''; }).join('');
      cells += `<div class="hex filled c${ch?ch.c:1}${plant?' plant':''}${sel}" data-hex="${h}" data-side="${side}" draggable="true" title="${esc(b.u)}"><div class="hex-bg"></div><div class="hex-img" style="background-image:${champBg(b.u)}"></div>`
        + `<button class="hex-stars b-star${b.s===1?' one':''}" data-star="${key}" type="button" title="Sterne ändern (${b.s}★)">${'★'.repeat(b.s)}</button>`
        + `<button class="b-x" data-remove="${key}" type="button" aria-label="${esc(b.u)} entfernen">✕</button>`
        + (its?`<div class="hex-items">${its}</div>`:'') + `<span class="hex-name">${esc(b.u)}</span>${btTag}</div>`;
    }
    rows += `<div class="board-row${k%2?' odd':''}">${cells}</div>`;
  }
  return rows;
}
function renderSide(side){
  const S = side==='e' ? 'E' : '', board = sideBoard(side), augs = sideAugs(side);
  $('#bBoard'+S).innerHTML = boardRows(board, side);
  $('#bBoard'+S).classList.toggle('show-names', bNamesOn);
  const team = bTeamOf(board), units = team.board.filter(b=>!PLANTS[b.u]);
  const gold = units.reduce((s,b)=>s + costOf(b.u) * Math.pow(3, (b.s||1)-1), 0);
  $('#bStats'+S).innerHTML = `<span title="Units auf dem Brett">⬡ ${units.length}</span><span title="Gesamtkosten in Gold (inkl. Sterne)"><i class="coin"></i> ${gold}</span>`;
  const tr = bAllTraits(team);
  $('#bTraits'+S).innerHTML = tr.length ? tr.map(t=>{
    const bp = (traitBy[t.n]||{bp:['1']}).bp;
    return `<div class="bt${t.lvl?'':' off'}">${traitHex(t.n, t.lvl?traitCls(t):'base', 26)}<div><b>${esc(t.n)}</b><span class="bt-bp">${bp.map(x=>`<i class="${+x<=t.k?'on':''}">${x}</i>`).join('')}</span></div><em>${t.k}</em></div>`;
  }).join('') : '<p class="note" style="margin:0">Noch keine Units auf dem Brett.</p>';
  $('#bAugs'+S).innerHTML = augs.map((id,i)=>{ const a = augById[id]; return a ? `<button class="b-aug" type="button" data-baug-del="${side}:${i}" title="${esc(a.en)} – Klick entfernt"><img src="${augImg(a)}" alt="${esc(a.en)}"></button>` : ''; }).join('')
    + (augs.length<3 ? `<button class="b-plus" type="button" data-baug-open="${side}" title="Augment hinzufügen" aria-label="Augment hinzufügen">+</button>` : '');
  const comps = bComponents(board);
  $('#bComps'+S).innerHTML = comps.length ? comps.map(([id,n])=>{ const it = itemById[id]; return it ? `<span class="b-comp" title="${esc(it.en)}"><img src="${it.img}" alt="${esc(it.en)}"><b>×${n}</b></span>` : ''; }).join('') : '<p class="b-empty">Items ausrüsten, dann siehst du hier die Komponenten.</p>';
}
function renderBuilder(){
  if(bMode==='sim') bEnemy = true;
  bTrack();
  if(!bEnemy && bActive==='e') bActive = 'm';
  $('#bRowE').hidden = !bEnemy;
  $('#bRows').classList.toggle('b-two', bEnemy);
  $('#bEnemy').checked = bEnemy;
  document.querySelectorAll('[data-panel]').forEach(p=>p.classList.toggle('active', bEnemy && p.dataset.panel===bActive));
  renderSide('m'); if(bEnemy) renderSide('e');
  $('#bAlt').innerHTML = bAlt.map((u,i)=>`<div class="b-altslot${u?' filled':''}" data-alt="${i}" title="${u?esc(u)+' – Klick entfernt':'Unit hierher ziehen'}">${u?hexHTML(u):'<div class="hx b-emptyhx"><div class="hx-in"></div></div>'}</div>`).join('');
  $('#bUndo').disabled = !bHist.length; $('#bRedo').disabled = !bRedo.length;
  try { localStorage.setItem(bKey(), bEncode()); if(bMode==='builder') localStorage.setItem(BUILDER_ENEMY_KEY, bEnemy ? '1' : '0'); } catch(e){}
  if(bMode==='sim') simOnEdit();
}
function bUnitBtn(n){
  const ch = champBy[n];
  const title = ch ? `${n} · ${ch.c} Gold · ${ch.t.join(', ')}` : `${n} (Elderwood-Pflanze)`;
  const av = PLANTS[n] ? `<div class="av av-52 c1"><img src="${PLANT_IMG[n]}" alt=""></div>` : avatar(n,52);
  return `<button class="bp-u" type="button" draggable="true" data-bunit="${esc(n)}" title="${esc(title)}">${av}</button>`;
}
function renderPool(){
  const q = bQuery.toLowerCase().trim();
  const hit = n => { const ch = champBy[n]; return !q || n.toLowerCase().includes(q) || (ch ? ch.t.some(t=>t.toLowerCase().includes(q)) : 'elderwood pflanze'.includes(q)); };
  let names = B_UNITS.filter(hit);
  let html;
  if(bSort==='origin' || bSort==='class'){
    html = traits.filter(t=>t.cat===bSort).map(t=>{
      const us = names.filter(n=>champBy[n] && champBy[n].t.includes(t.n)).sort((a,b)=>costOf(a)-costOf(b) || a.localeCompare(b));
      return us.length ? `<div class="bp-grp"><span class="bp-gl">${traitHex(t.n,'base',20)}${esc(t.n)}</span><div class="bp-grid">${us.map(bUnitBtn).join('')}</div></div>` : '';
    }).join('');
  } else {
    names = names.sort(bSort==='name' ? (a,b)=>a.localeCompare(b) : (a,b)=>(costOf(a)||9)-(costOf(b)||9) || a.localeCompare(b));
    html = names.length ? `<div class="bp-grid">${names.map(bUnitBtn).join('')}</div>` : '';
  }
  $('#bPoolUnits').innerHTML = html || viSays('Keine Unit gefunden. Andere Schreibweise?');
  const items = ITEMS.filter(i=>(bItemCat==='other' ? ['emblem','component'].includes(i.cat) : i.cat===bItemCat) && (!q || i.en.toLowerCase().includes(q) || i.de.toLowerCase().includes(q)))
    .sort((a,b)=>bItemCat==='other' ? a.cat.localeCompare(b.cat) || a.en.localeCompare(b.en) : a.en.localeCompare(b.en));
  $('#bPoolItems').innerHTML = items.length ? `<div class="bp-grid">${items.map(it=>`<button class="bp-i${bSel&&bSel.type==='item'&&bSel.id===it.id?' sel':''}" type="button" draggable="true" data-bitem="${it.id}" title="${esc(it.en)} · ${esc(it.de)}"><img src="${it.img}" alt="" draggable="false"></button>`).join('')}</div>` : '<p class="b-empty">Kein Item gefunden.</p>';
  document.querySelectorAll('#bSortPills [data-bsort]').forEach(x=>x.classList.toggle('on', x.dataset.bsort===bSort));
  document.querySelectorAll('#bItemPills [data-bcat]').forEach(x=>x.classList.toggle('on', x.dataset.bcat===bItemCat));
}
function renderBuilderCtx(){
  const box = $('#bCtx'), c = bCtx && adm && adm.comps.find(x=>x.slug===bCtx.slug);
  box.hidden = !c;
  box.innerHTML = c ? `<span>Du bearbeitest die Aufstellung von <b>${esc(c.name)}</b>.</span><button class="btn btn-primary b-btn" id="bApply" type="button">In Comp übernehmen</button><button class="btn btn-ghost b-btn" id="bCancel" type="button">Abbrechen</button>` : '';
}
function builderRoute(sub, code2, mode){
  bSetMode(mode || 'builder');
  // Links: /builder/<Set>/<Code> bzw. /tools/simulator/<Set>/<Code> – gehört der Link zu einem anderen Set, wird dorthin gewechselt
  if(sub && /^\d+$/.test(sub)){ if(+sub !== TFT_DATA.set){ try { localStorage.setItem('tftfreaks_set', sub); } catch(e){} location.reload(); return; } sub = code2 || ''; if(!sub) setUrl(bBase()); }
  if(sub){ bApplyState(bDecode(sub)); bCtx = null; bResetHistory(); setUrl(bBase()); }
  else if(!bLoaded){
    const keep = bEnemy;
    let saved = ''; try { saved = localStorage.getItem(bKey()) || (bMode==='builder' && TFT_DATA.set===18 ? localStorage.getItem('tftfreaks_builder_v1') : '') || ''; } catch(e){}
    // Simulator zum ersten Mal: mit dem Stand aus dem Team Builder starten
    if(!saved && bMode==='sim'){ try { saved = localStorage.getItem(BUILDER_KEY) || ''; } catch(e){} }
    try { bApplyState(bDecode(saved)); } catch(e){ bApplyState(bDecode('')); }
    bEnemy = keep || bEnemy; bResetHistory();
  }
  bLoaded = true; bSel = null;
  renderBuilderCtx(); renderPool(); renderBuilder(); bHint('');
  if(bMode==='sim') simMount(); else simPause();
}
function openInBuilder(c, ctx){
  if(!c) return;
  bSetMode('builder');
  bBoard = {};
  (c.board||[]).forEach(b=>{ if(b.h==null || b.h<0 || b.h>27) return; bBoard[b.h] = {u:b.u, s:b.s||1, i:(b.i||[]).map(id=>(findItem(id)||{}).id).filter(Boolean).slice(0,3)}; });
  bAugs = (c.augs||[]).filter(id=>augById[id]).slice(0,3);
  bAlt = [(c.alt||[])[0] ? c.alt[0].u : null, (c.alt||[])[1] ? c.alt[1].u : null];
  bActive = 'm'; bCtx = ctx || null; bLoaded = true; bResetHistory();
  if(curPath()==='/builder') builderRoute(); else go('/builder');
}
// Aktionen
function bPlace(side, h, name){ sideBoard(side)[h] = {u:name, s:1, i:[]}; }
function bAdd(name){
  const board = sideBoard(bActive);
  // Reihe 0 zeigt zum Gegner: Nahkampf (Reichweite bis 2) und Pflanzen von vorne auffüllen, Fernkampf von hinten – jeweils von der Mitte nach außen
  const front = !CH_DATA[name] || isMelee(name);
  const order = (front ? [0,1,2,3] : [3,2,1,0]).flatMap(r=>[3,2,4,1,5,0,6].map(c=>r*7 + c));
  const h = order.find(x=>!board[x]);
  if(h===undefined){ bHint('Das Brett ist voll.'); return; }
  bPlace(bActive, h, name); renderBuilder();
  bHint(`${name} steht ${front ? 'vorne (Nahkampf)' : 'hinten (Fernkampf)'}${bEnemy ? (bActive==='e' ? ' – Gegner' : ' – dein Board') : ''}.`);
}
function bMove(sa, a, sb, b){
  if(sa===sb && a===b) return;
  const A = sideBoard(sa), B = sideBoard(sb), x = A[a], y = B[b];
  if(y) A[a] = y; else delete A[a];
  if(x) B[b] = x;
}
function bEquip(side, h, id){
  const b = sideBoard(side)[h];
  if(!b){ bHint('Zieh das Item auf eine Unit.'); return false; }
  if(PLANTS[b.u]){ bHint('Pflanzen können keine Items tragen.'); return false; }
  if(b.i.length>=3){ bHint('Maximal 3 Items pro Unit.'); return false; }
  b.i.push(id); return true;
}
const splitKey = k => { const [s, h, n] = String(k).split(':'); return [s, +h, n===undefined ? undefined : +n]; };
function bCopy(text, ok){ if(navigator.clipboard) navigator.clipboard.writeText(text).then(()=>bHint(ok), ()=>prompt('Kopieren:', text)); else prompt('Kopieren:', text); }
function bOpenAugPicker(side){
  bAugSide = side;
  const draw = q => { q = (q||'').toLowerCase(); const cur = sideAugs(side); return AUGS.filter(a=>!cur.includes(a.id) && !AUG_DUP.has(a.id) && (!q || a.en.toLowerCase().includes(q) || a.de.toLowerCase().includes(q))).sort((a,b)=>(a.lv||9)-(b.lv||9) || a.en.localeCompare(b.en)).slice(0,120)
    .map(a=>`<button class="b-augpick" type="button" data-baug-add="${a.id}" title="${esc(a.de)}"><img src="${augImg(a)}" alt=""><span>${esc(a.en)}</span><small>${a.lv?AUG_LV[a.lv]:''}</small></button>`).join(''); };
  $('#modalBody').innerHTML = `<h2 style="margin:0 0 12px">Augment wählen${side==='e'?' (Gegner)':''}</h2><input class="input" id="bAugSearch" placeholder="Augment suchen…" style="width:100%" autocomplete="off"><div class="b-augpicklist" id="bAugPickList">${draw('')}</div>`;
  openModal(); setTimeout(()=>{ const i = $('#bAugSearch'); if(i){ i.focus(); i.oninput = ()=>{ $('#bAugPickList').innerHTML = draw(i.value); }; } }, 30);
}
// Klicks
document.addEventListener('click', e=>{
  const pick = e.target.closest && e.target.closest('[data-baug-add]');
  if(pick){ const augs = sideAugs(bAugSide); if(augs.length<3) augs.push(pick.dataset.baugAdd); closeModal(); renderBuilder(); return; }
  if(!e.target.closest || !e.target.closest('#page-builder')) return;
  const t = e.target;
  const sort = t.closest('[data-bsort]'); if(sort){ bSort = sort.dataset.bsort; renderPool(); return; }
  const cat = t.closest('[data-bcat]'); if(cat){ bItemCat = cat.dataset.bcat; renderPool(); return; }
  const unit = t.closest('[data-bunit]'); if(unit){ bAdd(unit.dataset.bunit); return; }
  const item = t.closest('[data-bitem]');
  if(item){ bSel = bSel && bSel.type==='item' && bSel.id===item.dataset.bitem ? null : {type:'item', id:item.dataset.bitem}; renderPool(); bHint(bSel ? bSelHint() : '', true); return; }
  const star = t.closest('[data-star]'); if(star){ const [s,h] = splitKey(star.dataset.star), b = sideBoard(s)[h]; if(b){ b.s = b.s%3+1; renderBuilder(); } return; }
  const rem = t.closest('[data-remove]'); if(rem){ const [s,h] = splitKey(rem.dataset.remove); delete sideBoard(s)[h]; bSel = null; renderBuilder(); return; }
  const uneq = t.closest('[data-unequip]'); if(uneq){ const [s,h,n] = splitKey(uneq.dataset.unequip), b = sideBoard(s)[h]; if(b) b.i.splice(n,1); renderBuilder(); return; }
  const augDel = t.closest('[data-baug-del]'); if(augDel){ const [s,i] = augDel.dataset.baugDel.split(':'); sideAugs(s).splice(+i,1); renderBuilder(); return; }
  const augOpen = t.closest('[data-baug-open]'); if(augOpen){ bOpenAugPicker(augOpen.dataset.baugOpen); return; }
  const alt = t.closest('[data-alt]'); if(alt){ if(bAlt[+alt.dataset.alt]){ bAlt[+alt.dataset.alt] = null; renderBuilder(); } else bHint('Zieh eine Unit aus der Liste in den Alt-Build-Platz.'); return; }
  const hex = t.closest('.bboard .hex');
  if(hex){
    const h = +hex.dataset.hex, side = hex.dataset.side, b = sideBoard(side)[h];
    bActive = side;
    if(bSel && bSel.type==='item'){ if(bEquip(side, h, bSel.id)){ bSel = null; renderPool(); bHint('Item ausgerüstet.'); } renderBuilder(); return; }
    if(bSel && bSel.type==='hex'){ bMove(bSel.side, +bSel.id, side, h); bSel = null; renderBuilder(); return; }
    if(b){ bSel = {type:'hex', side, id:h}; renderBuilder(); bHint('Jetzt auf ein anderes Feld klicken, um die Unit zu verschieben.'); }
    else renderBuilder();
    return;
  }
  const panel = t.closest('[data-panel]'); if(panel && bEnemy && bActive!==panel.dataset.panel){ bActive = panel.dataset.panel; renderBuilder(); }
  const btn = t.closest('button'); const id = btn && btn.id;
  if(id==='bUndo'){ bUndo(); return; }
  if(id==='bRedo'){ bRedoStep(); return; }
  if(id==='bClear'){ bBoard = {}; bAugs = []; bAlt = [null,null]; eBoard = {}; eAugs = []; bSel = null; renderBuilder(); bHint('Brett geleert.'); return; }
  if(id==='bShare'){ bCopy(siteUrl(bBase() + '/' + TFT_DATA.set + '/' + bEncode()), 'Link kopiert!'); return; }
  if(id==='bCopyCode'){ bCopy(bEncode() || '(leer)', 'Team-Code kopiert!'); return; }
  if(id==='bImport'){
    const v = prompt('Team-Code oder Link einfügen:'); if(!v) return;
    // akzeptiert neue Links (…/builder/18/Code, …/tools/simulator/18/Code), alte Links (…#/builder/18/Code) und reine Codes
    const lm = v.trim().match(/\/(?:builder|tools\/simulator)\/(.+)$/);
    let code = lm ? lm[1] : v.trim();
    const sm = code.match(/^(\d+)\/(.*)$/);
    if(sm){ if(+sm[1] !== TFT_DATA.set){ if(confirm(`Dieser Link gehört zu Set ${sm[1]}. Jetzt zu Set ${sm[1]} wechseln?`)){ try { localStorage.setItem('tftfreaks_set', sm[1]); } catch(e){} setUrl(bBase() + '/' + code); location.reload(); } return; } code = sm[2]; }
    const st = bDecode(code); if(!Object.keys(st.board).length && !st.augs.length && !Object.keys(st.eboard).length){ bHint('Code nicht erkannt.'); return; }
    bApplyState(st); bSel = null; renderBuilder(); bHint('Team importiert.'); return;
  }
  if(id==='bApply'){ bApplyToComp(); return; }
  if(id==='bCancel'){ bCtx = null; go('/admin'); return; }
});
document.addEventListener('contextmenu', e=>{
  const hex = e.target.closest && e.target.closest('.bboard .hex.filled'); if(!hex || !hex.closest('#page-builder')) return;
  e.preventDefault(); delete sideBoard(hex.dataset.side)[+hex.dataset.hex]; bSel = null; renderBuilder();
});
document.addEventListener('input', e=>{ if(e.target.id==='bSearch'){ bQuery = e.target.value; renderPool(); } });
document.addEventListener('change', e=>{
  if(e.target.id==='bNames'){ bNamesOn = e.target.checked; document.querySelectorAll('#page-builder .bboard').forEach(b=>b.classList.toggle('show-names', bNamesOn)); }
  if(e.target.id==='bEnemy'){ bEnemy = e.target.checked; bActive = bEnemy ? bActive : 'm'; bSel = null; renderBuilder(); bHint(bEnemy ? 'Gegner-Board eingeblendet – klick ein Board an, um es zu bearbeiten.' : ''); }
});
document.addEventListener('keydown', e=>{
  if(!$('#page-builder').classList.contains('active') || !(e.ctrlKey || e.metaKey)) return;
  const k = e.key.toLowerCase(), typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName);
  if(k==='f'){ e.preventDefault(); const s = $('#bSearch'); s.focus(); s.select(); }
  else if(k==='z' && !typing){ e.preventDefault(); e.shiftKey ? bRedoStep() : bUndo(); }
  else if(k==='y' && !typing){ e.preventDefault(); bRedoStep(); }
});
document.addEventListener('click', e=>{ const b = e.target.closest && e.target.closest('[data-builder]'); if(b) openInBuilder(compBySlug[b.dataset.builder]); });
// Drag & Drop
document.addEventListener('dragstart', e=>{
  if(!e.target.closest) return;
  const eq = e.target.closest('[data-unequip]'), u = e.target.closest('[data-bunit]'), it = e.target.closest('[data-bitem]'), hx = e.target.closest('.bboard .hex.filled');
  const d = eq ? 'eq:'+eq.dataset.unequip : u ? 'unit:'+u.dataset.bunit : it ? 'item:'+it.dataset.bitem : (hx && hx.closest('#page-builder')) ? 'hex:'+hx.dataset.side+':'+hx.dataset.hex : null;
  if(!d) return;
  bDrag = d; e.dataTransfer.setData('text/plain', d); e.dataTransfer.effectAllowed = 'move';
  if(d.startsWith('hex:') || d.startsWith('eq:')) $('#bPool').classList.add('drop-hint');
});
document.addEventListener('dragover', e=>{
  if(!bDrag || !e.target.closest) return;
  const hx = e.target.closest('#page-builder .bboard .hex'), pool = e.target.closest('#bPool'), alt = e.target.closest('[data-alt]');
  if(!hx && !pool && !(alt && bDrag.startsWith('unit:'))) return;
  e.preventDefault();
  document.querySelectorAll('.bboard .hex.over,.b-altslot.over').forEach(x=>{ if(x!==hx && x!==alt) x.classList.remove('over'); });
  (hx || alt) && (hx || alt).classList.add('over');
});
document.addEventListener('drop', e=>{
  if(!bDrag || !e.target.closest) return;
  const hx = e.target.closest('#page-builder .bboard .hex'), pool = e.target.closest('#bPool'), alt = e.target.closest('[data-alt]');
  if(!hx && !pool && !alt) return;
  e.preventDefault();
  const kind = bDrag.slice(0, bDrag.indexOf(':')), rest = bDrag.slice(bDrag.indexOf(':')+1);
  if(alt){ if(kind==='unit') bAlt[+alt.dataset.alt] = rest; }
  else if(hx){
    const h = +hx.dataset.hex, side = hx.dataset.side; bActive = side;
    if(kind==='unit') bPlace(side, h, rest);
    else if(kind==='hex'){ const [s,a] = splitKey(rest); bMove(s, a, side, h); }
    else if(kind==='item') bEquip(side, h, rest);
    else if(kind==='eq'){ const [s,a,n] = splitKey(rest), src = sideBoard(s)[a], id = src && src.i[n]; if(id && !(s===side && a===h) && bEquip(side, h, id)) src.i.splice(n,1); }
  } else if(pool){
    if(kind==='hex'){ const [s,a] = splitKey(rest); delete sideBoard(s)[a]; }
    if(kind==='eq'){ const [s,a,n] = splitKey(rest), src = sideBoard(s)[a]; if(src) src.i.splice(n,1); }
  }
  bDrag = null; bSel = null; renderBuilder();
});
document.addEventListener('dragend', ()=>{
  bDrag = null; const p = $('#bPool'); if(p) p.classList.remove('drop-hint');
  document.querySelectorAll('.bboard .hex.over,.b-altslot.over').forEach(x=>x.classList.remove('over'));
});

/* ================= REDAKTION: Tierlist bearbeiten ================= */
let adm = null, admSel = null, admDragSlug = null;
const ADM_ROWS = [['S','S-Tier'],['A','A-Tier'],['B','B-Tier'],['C','C-Tier'],['X','Situational'],['var','Varianten'],['hid','Ausgeblendet']];
const ADM_ROW_HELP = {var:'Erscheinen nur als Tab bei Comps mit gleichem Carry', hid:'Nicht auf der Seite sichtbar'};
const admRowOf = c => c.hidden ? 'hid' : !c.main ? 'var' : c.tier;
const admBySlug = s => adm && adm.comps.find(c=>c.slug===s);
function admEnsure(){
  if(adm) return;
  const d = tierSource.data;
  adm = JSON.parse(JSON.stringify({version:1, set:TFT_DATA.set, patch:d.patch||TL_PATCH, updated:d.updated||'', source:d.source||'', basedOn:d.basedOn||'', comps:d.comps, itemTL:d.itemTL||ITEM_TL, augTL:d.augTL||AUG_TL, holdTL:d.holdTL||HOLD_TL}));
}
function admStatus(t){ const el = $('#admStatus'); if(el) el.textContent = t; }
function admSourceText(){ return tierSource.src==='draft' ? 'Entwurf in diesem Browser aktiv' : tierSource.src==='file' ? `Veröffentlichter Stand (tierlist-data-${TFT_DATA.set}.js${tierSource.data.source==='TFTAcademy'?', TFTAcademy-Ausgangsstand':''})` : `Set ${TFT_DATA.set}: noch keine Tierlist – leg mit „+ Neue Comp“ los`; }
function admSave(msg){
  admEnsure();
  adm.updated = new Date().toISOString().slice(0,10);
  if(adm.source && adm.source!=='TFT Freaks'){ adm.basedOn = adm.source; } adm.source = 'TFT Freaks';
  let ok = true; try { localStorage.setItem(TL_DRAFT_KEY, JSON.stringify(adm)); } catch(e){ ok = false; }
  tierSource = {src:'draft', data:adm};
  ITEM_TL = adm.itemTL || {}; AUG_TL = adm.augTL || {}; HOLD_TL = adm.holdTL || {};
  rebuildComps(adm.comps); filterComps(); renderItemTL(); renderAugTL(); renderHoldTL(); updateTlNote();
  admStatus(ok ? (msg || 'Entwurf gespeichert · ' + new Date().toLocaleTimeString(LOC,{hour:'2-digit',minute:'2-digit'})) : 'Speichern im Browser nicht möglich – bitte exportieren!');
}
function updateTlNote(){
  const el = $('#tlSrc'); if(!el) return;
  const D = tierSource.data, link = '<a href="https://tftacademy.com/tierlist/comps" target="_blank" rel="noopener" style="text-decoration:underline">TFTAcademy</a>';
  if(!(D.comps||[]).length){ el.textContent = `Für Set ${TFT_DATA.set} gibt es noch keine Tierlist.`; return; }
  if(D.source==='TFTAcademy'){ el.innerHTML = `Stand: Patch ${esc(D.patch||TL_PATCH)} · Bewertungen und Aufstellungen nach ${link}`; return; }
  const d = D.updated ? new Date(D.updated).toLocaleDateString(LOC) : '';
  el.innerHTML = `Stand: Patch ${esc(D.patch||TL_PATCH)}${d?' · aktualisiert am '+d:''} · Bewertungen von TFT Freaks${D.basedOn==='TFTAcademy' || (TL_FILE && TL_FILE.source==='TFTAcademy') ? ' · Aufstellungen ursprünglich nach ' + link : ''}`;
}
function admCardHTML(c){
  const st = STICKER[c.sticker];
  return `<div class="adm-card${c.slug===admSel?' sel':''}" draggable="true" data-adm="${esc(c.slug)}" title="Ziehen zum Verschieben · Klick zum Bearbeiten"><span class="adm-hx">${hexHTML(c.carry||'')}</span><span class="adm-txt"><b>${esc(c.name)}</b><small>${esc(STYLE_DE[c.style]||c.style||'–')} · ${DIFF_DE[c.diff]||'–'}</small></span>${st?`<i class="adm-st ${st[0]}" title="${st[2]}">${st[1]}</i>`:''}${c.sub&&c.tier==='X'?`<i class="adm-sub" style="background:${TIER_COL[c.sub]}">${c.sub}</i>`:''}</div>`;
}
function renderAdminRows(){
  $('#admRows').innerHTML = ADM_ROWS.map(([k,l])=>{
    const list = adm.comps.filter(c=>admRowOf(c)===k);
    return `<div class="adm-row${k.length>1?' adm-meta':''}" style="--tc:${TIER_COL[k]||'#4a4d63'}"><div class="adm-lbl"><b>${k.length===1?k:(k==='var'?'⇄':'⌀')}</b><small>${l}</small><em>${list.length}</em></div><div class="adm-drop" data-row="${k}" title="${ADM_ROW_HELP[k]||''}">${list.map(admCardHTML).join('') || '<span class="adm-empty">Hierher ziehen</span>'}</div></div>`;
  }).join('');
}
const admOpt = (v, cur, label) => `<option value="${esc(v)}"${String(v)===String(cur)?' selected':''}>${esc(label)}</option>`;
function renderAdminEdit(){
  const box = $('#admEdit'), c = admSel && admBySlug(admSel);
  if(!c){ box.innerHTML = '<h3 style="margin-top:0">Comp bearbeiten</h3><p class="note">Klick links auf eine Comp, um Name, Tier, Texte, Augments und Items zu bearbeiten. Ziehen verschiebt sie zwischen den Tiers. Mit „+ Neue Comp“ legst du eine eigene an.</p>'; return; }
  const units = [...new Set((c.board||[]).map(b=>b.u).filter(u=>!PLANTS[u]))];
  const chips = (arr, kind) => (arr||[]).map((id,i)=>{
    const o = kind==='aug' ? augById[id] : findItem(id), img = o ? (kind==='aug' ? augImg(o) : o.img) : '';
    return `<span class="adm-chip">${img?`<img src="${img}" alt="">`:''}${esc(o?o.en:id)}<button type="button" data-adm-del="${kind}:${i}" aria-label="Entfernen">✕</button></span>`;
  }).join('') || '<span class="note" style="margin:0">–</span>';
  box.innerHTML = `
    <div class="adm-edhead"><span class="adm-hx big">${hexHTML(c.carry||'')}</span><div><small>Bearbeiten</small><h3 id="admEdTitle">${esc(c.name)}</h3></div></div>
    <label class="adm-f"><span>Name</span><input class="input" data-f="name" value="${esc(c.name)}"></label>
    <div class="adm-2">
      <label class="adm-f"><span>Tier</span><select class="input" data-f="tier">${['S','A','B','C','X'].map(t=>admOpt(t,c.tier,t==='X'?'X (Situational)':t)).join('')}</select></label>
      <label class="adm-f"${c.tier==='X'?'':' hidden'}><span>Bewertung (X)</span><select class="input" data-f="sub">${['S','A','B','C'].map(t=>admOpt(t,c.sub,t)).join('')}</select></label>
      <label class="adm-f"><span>Trend</span><select class="input" data-f="sticker">${[[0,'–'],[2,'▲ Steigt'],[3,'▼ Fällt'],[1,'+ Neu']].map(([v,l])=>admOpt(v,c.sticker||0,l)).join('')}</select></label>
      <label class="adm-f"><span>Spielstil</span><select class="input" data-f="style">${Object.entries(STYLE_DE).map(([v,l])=>admOpt(v,c.style,l)).join('')}</select></label>
      <label class="adm-f"><span>Schwierigkeit</span><select class="input" data-f="diff">${Object.entries(DIFF_DE).map(([v,l])=>admOpt(v,c.diff,l)).join('')}</select></label>
      <label class="adm-f"><span>Carry</span><select class="input" data-f="carry">${units.length?units.map(u=>admOpt(u,c.carry,u)).join(''):'<option value="">– erst Units platzieren –</option>'}</select></label>
    </div>
    <label class="adm-f"><span>Spielplan</span><textarea class="input" rows="4" data-f="plan" placeholder="${esc(PLAN[c.style]||'')}">${esc(c.plan||'')}</textarea><small>Leer lassen = Standardtext für den Spielstil.</small></label>
    <label class="adm-f"><span>Tipps</span><textarea class="input" rows="3" data-f="tips" placeholder="z. B. Worauf man im Early Game achten sollte …">${esc(c.tips||'')}</textarea></label>
    <div class="adm-f"><span>Augments</span><div class="adm-chips">${chips(c.augs,'aug')}</div><div class="adm-add"><input class="input" list="admAugList" placeholder="Augment hinzufügen…" data-add="aug"><button class="btn btn-ghost b-btn" type="button" data-add-btn="aug">+</button></div></div>
    <div class="adm-f"><span>Augment-Fokus</span><div class="adm-checks">${['ITEMS','ECON','COMBAT','TRAIT'].map(k=>`<label><input type="checkbox" data-aug-type="${k}"${(c.augTypes||[]).includes(k)?' checked':''}> ${AUGTYPE_DE[k]}</label>`).join('')}</div></div>
    <div class="adm-f"><span>Item-Priorität</span><div class="adm-chips">${chips(c.carousel,'item')}</div><div class="adm-add"><input class="input" list="admItemList" placeholder="Item hinzufügen…" data-add="item"><button class="btn btn-ghost b-btn" type="button" data-add-btn="item">+</button></div></div>
    <div class="adm-f"><span>Aufstellung</span>${(c.board||[]).length?`<div class="adm-board">${boardHTML(c)}</div>`:'<p class="note" style="margin:0">Noch keine Units platziert.</p>'}<button class="btn btn-primary b-btn" type="button" data-adm-builder style="margin-top:8px;align-self:flex-start">⬡ Im Team Builder bearbeiten</button></div>
    <div class="adm-foot"><button class="btn btn-ghost b-btn" type="button" data-adm-dup>Duplizieren</button><button class="btn btn-ghost b-btn adm-danger" type="button" data-adm-delete>Löschen</button></div>
    <datalist id="admAugList">${AUGS.map(a=>`<option value="${esc(a.en)}">`).join('')}</datalist>
    <datalist id="admItemList">${ITEMS.filter(i=>B_ITEM_CATS.includes(i.cat)).map(i=>`<option value="${esc(i.en)}">`).join('')}</datalist>`;
}
function renderAdmin(){
  admEnsure(); renderAdminRows(); renderAdminEdit(); renderAdminTL(); admStatus(admSourceText());
}
function admAdd(kind){
  const c = admBySlug(admSel), inp = document.querySelector(`#admEdit [data-add="${kind}"]`); if(!c || !inp) return;
  const v = inp.value.trim().toLowerCase(); if(!v) return;
  if(kind==='aug'){
    const a = AUGS.find(x=>x.en.toLowerCase()===v || x.de.toLowerCase()===v); if(!a){ admStatus('Augment nicht gefunden.'); return; }
    c.augs = [...(c.augs||[]).filter(x=>x!==a.id), a.id];
  } else {
    const it = ITEMS.find(x=>x.en.toLowerCase()===v || x.de.toLowerCase()===v); if(!it){ admStatus('Item nicht gefunden.'); return; }
    c.carousel = [...(c.carousel||[]), it.id];
  }
  admSave(); renderAdminEdit();
}
function admMove(slug, row, beforeSlug){
  const c = admBySlug(slug); if(!c || slug===beforeSlug) return;
  adm.comps.splice(adm.comps.indexOf(c), 1);
  if(row==='hid') c.hidden = true;
  else { c.hidden = false; if(row==='var') c.main = 0; else { c.main = 1; c.tier = row; if(row!=='X') c.sub = ''; else if(!c.sub) c.sub = 'B'; } }
  let at = beforeSlug ? adm.comps.findIndex(x=>x.slug===beforeSlug) : -1;
  if(at<0){ let last = -1; adm.comps.forEach((x,k)=>{ if(admRowOf(x)===row) last = k; }); at = last>=0 ? last+1 : adm.comps.length; }
  adm.comps.splice(at, 0, c);
  admSave(); renderAdminRows(); if(admSel===slug) renderAdminEdit();
}
function admInsertBefore(zone, x, y){
  return [...zone.querySelectorAll('.adm-card:not(.dragging)')].find(el=>{ const r = el.getBoundingClientRect(); return y < r.top || (y <= r.bottom && x < r.left + r.width/2); }) || null;
}
function bApplyToComp(){
  admEnsure(); const c = bCtx && admBySlug(bCtx.slug); if(!c){ bCtx = null; return; }
  c.board = Object.entries(bBoard).map(([h,b])=>{ const o = {u:b.u, h:+h}; if(b.i.length) o.i = [...b.i]; if(b.s>1) o.s = b.s; return o; });
  c.augs = [...bAugs];
  c.alt = bAlt.filter(Boolean).map(u=>(c.alt||[]).find(a=>a.u===u) || {u});
  if(!c.board.some(b=>b.u===c.carry)){ const best = c.board.filter(b=>!PLANTS[b.u]).sort((a,b)=>(b.i||[]).length-(a.i||[]).length)[0]; c.carry = best ? best.u : ''; }
  admSel = c.slug; bCtx = null; admSave('Aufstellung übernommen'); go('/admin');
}
// Felder
document.addEventListener('input', e=>{
  const f = e.target.dataset && e.target.dataset.f; if(!f || !e.target.closest('#admEdit')) return;
  const c = admBySlug(admSel); if(!c) return;
  c[f] = f==='sticker' ? +e.target.value : e.target.value;
  if(f==='tier'){ if(c.tier!=='X') c.sub = ''; else if(!c.sub) c.sub = 'B'; }
  admSave();
  if(f==='name'){ const h = $('#admEdTitle'); if(h) h.textContent = c.name; }
  if(e.target.tagName==='SELECT' || f==='name') renderAdminRows();
  if(['tier','carry','style'].includes(f)) renderAdminEdit();
});
document.addEventListener('change', e=>{
  if(!e.target.closest) return;
  if(e.target.matches('#admEdit [data-aug-type]')){
    const c = admBySlug(admSel); if(!c) return;
    c.augTypes = [...document.querySelectorAll('#admEdit [data-aug-type]')].filter(x=>x.checked).map(x=>x.dataset.augType);
    admSave(); return;
  }
  if(e.target.id==='admImport' && e.target.files[0]){
    const r = new FileReader();
    r.onload = ()=>{
      try {
        const txt = String(r.result), data = JSON.parse(txt.slice(txt.indexOf('{'), txt.lastIndexOf('}')+1));
        if(!Array.isArray(data.comps)) throw new Error('keine Comps');
        adm = data; admSel = null; admSave('Importiert: ' + data.comps.length + ' Comps'); renderAdminRows(); renderAdminEdit();
      } catch(err){ admStatus('Import fehlgeschlagen: Datei nicht erkannt.'); }
      e.target.value = '';
    };
    r.readAsText(e.target.files[0]);
  }
});
document.addEventListener('keydown', e=>{ if(e.key==='Enter' && e.target.dataset && e.target.dataset.add){ e.preventDefault(); admAdd(e.target.dataset.add); } });
// Klicks
document.addEventListener('click', e=>{
  if(!e.target.closest || !e.target.closest('#page-admin')) return;
  const t = e.target;
  const card = t.closest('[data-adm]'); if(card){ admSel = card.dataset.adm; renderAdminRows(); renderAdminEdit(); return; }
  const addBtn = t.closest('[data-add-btn]'); if(addBtn){ admAdd(addBtn.dataset.addBtn); return; }
  const del = t.closest('[data-adm-del]');
  if(del){ const c = admBySlug(admSel), [kind,i] = del.dataset.admDel.split(':'); (kind==='aug' ? c.augs : c.carousel).splice(+i,1); admSave(); renderAdminEdit(); return; }
  if(t.closest('[data-adm-builder]')){ const c = admBySlug(admSel); if(c) openInBuilder(c, {slug:c.slug}); return; }
  if(t.closest('[data-adm-dup]')){
    const c = admBySlug(admSel); if(!c) return;
    const copy = JSON.parse(JSON.stringify(c)); copy.slug = 'tftf-' + Date.now().toString(36); copy.name = c.name + ' (Kopie)';
    adm.comps.splice(adm.comps.indexOf(c)+1, 0, copy); admSel = copy.slug; admSave('Comp dupliziert'); renderAdminRows(); renderAdminEdit(); return;
  }
  if(t.closest('[data-adm-delete]')){
    const c = admBySlug(admSel); if(!c || !confirm(`„${c.name}“ wirklich löschen?`)) return;
    adm.comps.splice(adm.comps.indexOf(c),1); admSel = null; admSave('Comp gelöscht'); renderAdminRows(); renderAdminEdit(); return;
  }
  if(t.id==='admNew'){
    admEnsure();
    const c = {slug:'tftf-' + Date.now().toString(36), name:'Neue Comp', tier:'C', sub:'', main:1, sticker:1, style:'4-Cost Fast 8', diff:'MEDIUM', carry:'', board:[], early:[], alt:[], cap:[], carousel:[], augs:[], augTypes:[], plan:'', tips:''};
    adm.comps.push(c); admSel = c.slug; admSave('Neue Comp angelegt'); renderAdminRows(); renderAdminEdit(); return;
  }
  if(t.id==='admExport'){
    admEnsure();
    const data = {version:1, set:TFT_DATA.set, patch:adm.patch, updated:adm.updated || new Date().toISOString().slice(0,10), source:adm.source || 'TFT Freaks', basedOn:adm.basedOn || '', comps:adm.comps, itemTL:adm.itemTL || ITEM_TL, augTL:adm.augTL || AUG_TL, holdTL:adm.holdTL || HOLD_TL};
    const js = '// TFT Freaks – Tierlist-Daten, exportiert aus der Redaktion am ' + new Date().toLocaleString(LOC) + '\n// Datei neben die index.html legen, dann sehen alle Besucher diesen Stand.\nwindow.TIERLIST_DATA = ' + JSON.stringify(data) + ';\n';
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([js], {type:'text/javascript'})); a.download = `tierlist-data-${TFT_DATA.set}.js`;
    document.body.appendChild(a); a.click(); setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); }, 500);
    admStatus(`Exportiert: tierlist-data-${TFT_DATA.set}.js – neben die index.html legen.`); return;
  }
  if(t.id==='admReset'){
    if(!confirm('Entwurf verwerfen? Danach gilt wieder der veröffentlichte Stand (tierlist-data-' + TFT_DATA.set + '.js) bzw. der eingebaute Stand.')) return;
    try { localStorage.removeItem(TL_DRAFT_KEY); } catch(err){}
    tierSource = loadTierSource(); ITEM_TL = tlPart('itemTL'); AUG_TL = tlPart('augTL'); HOLD_TL = tlPart('holdTL'); adm = null; admSel = null; rebuildComps(tierSource.data.comps); filterComps(); renderItemTL(); renderAugTL(); renderHoldTL(); updateTlNote(); renderAdmin(); return;
  }
});
// Drag & Drop zwischen den Tiers
document.addEventListener('dragstart', e=>{
  const c = e.target.closest && e.target.closest('.adm-card'); if(!c) return;
  admDragSlug = c.dataset.adm; e.dataTransfer.setData('text/plain', 'adm:' + admDragSlug); e.dataTransfer.effectAllowed = 'move';
  setTimeout(()=>c.classList.add('dragging'), 0);
});
function admClearMarks(){ document.querySelectorAll('.adm-ins').forEach(x=>x.classList.remove('adm-ins')); document.querySelectorAll('.adm-ins-end').forEach(x=>x.classList.remove('adm-ins-end')); }
document.addEventListener('dragover', e=>{
  if(!admDragSlug || !e.target.closest) return;
  const zone = e.target.closest('.adm-drop'); if(!zone) return;
  e.preventDefault(); admClearMarks();
  const b = admInsertBefore(zone, e.clientX, e.clientY);
  if(b) b.classList.add('adm-ins'); else zone.classList.add('adm-ins-end');
});
document.addEventListener('drop', e=>{
  if(!admDragSlug || !e.target.closest) return;
  const zone = e.target.closest('.adm-drop'); if(!zone) return;
  e.preventDefault();
  const b = admInsertBefore(zone, e.clientX, e.clientY), slug = admDragSlug;
  admDragSlug = null; admClearMarks(); admMove(slug, zone.dataset.row, b ? b.dataset.adm : null);
});
document.addEventListener('dragend', ()=>{ admDragSlug = null; admClearMarks(); document.querySelectorAll('.adm-card.dragging').forEach(x=>x.classList.remove('dragging')); });
updateTlNote();

/* --- Redaktion: Items, Augments und Holds bewerten (Drag & Drop oder antippen → Reihe antippen) --- */
let admTab = 'comps', admTLSel = null, admTLDrag = null, admTLq = '';
const admTLf = {items:'craftables', alv:'1', ast:'All', hold:'1'};
const ADM_ITEM_CATS = [['craftables','Kombiniert','craft'],['radiants','Lichtversionen','radiant'],['ornns','Artefakte','artifact'],['emblems','Embleme','emblem']];
const ADM_TL_ROWS = ['S','A','B','C'];
// Bewertungen der aktuellen Auswahl (wird bei Bedarf angelegt)
function admTLObj(){
  admEnsure();
  if(admTab==='items'){ adm.itemTL = adm.itemTL || {}; return adm.itemTL[admTLf.items] = adm.itemTL[admTLf.items] || {}; }
  if(admTab==='augments'){ adm.augTL = adm.augTL || {}; const st = adm.augTL[admTLf.ast] = adm.augTL[admTLf.ast] || {}; return st[admTLf.alv] = st[admTLf.alv] || {}; }
  adm.holdTL = adm.holdTL || {}; return adm.holdTL[admTLf.hold] = adm.holdTL[admTLf.hold] || {};
}
// Alles, was in der aktuellen Auswahl bewertet werden kann
function admTLPool(){
  if(admTab==='items'){ const cat = ADM_ITEM_CATS.find(c=>c[0]===admTLf.items)[2]; return ITEMS.filter(i=>i.cat===cat && !(cat==='emblem' && /Tactician/i.test(i.id + ' ' + i.en))).map(i=>i.id); }
  if(admTab==='augments') return AUGS.filter(a=>a.lv===+admTLf.alv && !AUG_DUP.has(a.id)).map(a=>a.id);
  return champions.filter(c=>c.c===+admTLf.hold).map(c=>c.n);
}
function admTLInfo(id){
  if(admTab==='items'){ const it = findItem(id); return it && {name:it.en, html:`<img src="${it.img}" alt="" loading="lazy">`}; }
  if(admTab==='augments'){ const a = augById[id]; return a && {name:a.en, html:`<img src="${augImg(a)}" alt="" loading="lazy">`}; }
  return champBy[id] && {name:id, html:`<span class="adm-hx">${hexHTML(id)}</span>`};
}
const admTLTile = id => { const f = admTLInfo(id); return f ? `<div class="adm-tl${admTLSel===id?' sel':''}" draggable="true" data-tlk="${esc(id)}" title="${esc(f.name)}">${f.html}<span>${esc(f.name)}</span></div>` : ''; };
function renderAdminTL(){
  const box = $('#admTL'); if(!box) return;
  const comps = admTab==='comps';
  $('#admCompsView').hidden = !comps; box.hidden = comps; $('#admNew').hidden = !comps;
  $('#admTabs').querySelectorAll('.tab').forEach(b=>b.classList.toggle('active', b.dataset.admTab===admTab));
  if(comps) return;
  const chip = (key, v, l) => `<button class="chip-btn${admTLf[key]===v?' active':''}" type="button" data-tlf="${key}:${v}">${l}</button>`;
  const filters = admTab==='items' ? ADM_ITEM_CATS.map(([v,l])=>chip('items', v, l)).join('')
    : admTab==='augments' ? `<div class="tag-row">${[['1','Silber'],['2','Gold'],['3','Prismatisch']].map(([v,l])=>chip('alv', v, l)).join('')}</div><div class="tag-row">${[['All','Alle Phasen'],['2-1','2-1'],['3-2','3-2'],['4-2','4-2']].map(([v,l])=>chip('ast', v, l)).join('')}</div>`
    : [['1','1-Kosten'],['2','2-Kosten'],['3','3-Kosten']].map(([v,l])=>chip('hold', v, l)).join('');
  const tl = admTLObj(), rated = new Set(ADM_TL_ROWS.flatMap(t=>tl[t]||[]));
  const q = admTLq.toLowerCase().trim();
  const rest = admTLPool().filter(id=>!rated.has(id)).filter(id=>{ const f = admTLInfo(id); return f && (!q || f.name.toLowerCase().includes(q)); }).sort((a,b)=>admTLInfo(a).name.localeCompare(admTLInfo(b).name));
  const row = (k, label, ids, col) => `<div class="adm-row" style="--tc:${col}"><div class="adm-lbl"><b>${k}</b><small>${label}</small><em>${ids.length}</em></div><div class="adm-drop adm-tldrop" data-tlrow="${k}">${ids.map(admTLTile).join('') || '<span class="adm-empty">Hierher ziehen</span>'}</div></div>`;
  box.innerHTML = `<div class="toolbar adm-tlbar">${filters}<input class="input" id="admTLSearch" placeholder="Unbewertete suchen…" value="${esc(admTLq)}"></div>
    <p class="note" style="margin:0 0 12px">Ziehen oder antippen und dann eine Reihe antippen. Die Reihenfolge in einer Reihe ist die Reihenfolge auf der Seite. Zurück nach „Nicht bewertet“ entfernt die Bewertung.</p>
    ${ADM_TL_ROWS.map(t=>row(t, t + '-Tier', (tl[t]||[]).filter(id=>admTLInfo(id)), TIER_COL[t])).join('')}
    ${row('–', 'Nicht bewertet', rest, '#4a4d63').replace('data-tlrow="–"', 'data-tlrow="none"')}`;
}
function admTLMove(id, row, beforeId){
  const tl = admTLObj();
  ADM_TL_ROWS.forEach(t=>{ if(tl[t]){ tl[t] = tl[t].filter(x=>x!==id); if(!tl[t].length) delete tl[t]; } });
  if(row!=='none'){ const arr = tl[row] = tl[row] || [], at = beforeId ? arr.indexOf(beforeId) : -1; arr.splice(at<0 ? arr.length : at, 0, id); }
  admTLSel = null; admSave(row==='none' ? 'Bewertung entfernt' : `In ${row}-Tier verschoben`); renderAdminTL();
}
function admTLBefore(zone, x, y){
  return [...zone.querySelectorAll('.adm-tl:not(.dragging)')].find(el=>{ const r = el.getBoundingClientRect(); return y < r.top || (y <= r.bottom && x < r.left + r.width/2); }) || null;
}
document.addEventListener('click', e=>{
  if(!e.target.closest || !e.target.closest('#page-admin')) return;
  const tab = e.target.closest('[data-adm-tab]'); if(tab){ admTab = tab.dataset.admTab; admTLSel = null; admTLq = ''; renderAdminTL(); return; }
  const f = e.target.closest('[data-tlf]'); if(f){ const [k, v] = f.dataset.tlf.split(':'); admTLf[k] = v; admTLSel = null; renderAdminTL(); return; }
  const tile = e.target.closest('.adm-tl'); if(tile){ admTLSel = admTLSel===tile.dataset.tlk ? null : tile.dataset.tlk; renderAdminTL(); return; }
  const zone = e.target.closest('.adm-tldrop'); if(zone && admTLSel) admTLMove(admTLSel, zone.dataset.tlrow, null);
});
document.addEventListener('input', e=>{ if(e.target.id==='admTLSearch'){ admTLq = e.target.value; const pos = e.target.selectionStart; renderAdminTL(); const i = $('#admTLSearch'); i.focus(); i.setSelectionRange(pos, pos); } });
document.addEventListener('dragstart', e=>{
  const t = e.target.closest && e.target.closest('.adm-tl'); if(!t) return;
  admTLDrag = t.dataset.tlk; e.dataTransfer.setData('text/plain', 'tl:' + admTLDrag); e.dataTransfer.effectAllowed = 'move';
  setTimeout(()=>t.classList.add('dragging'), 0);
});
document.addEventListener('dragover', e=>{
  if(!admTLDrag || !e.target.closest) return;
  const zone = e.target.closest('.adm-tldrop'); if(!zone) return;
  e.preventDefault(); admClearMarks();
  const b = admTLBefore(zone, e.clientX, e.clientY);
  if(b) b.classList.add('adm-ins'); else zone.classList.add('adm-ins-end');
});
document.addEventListener('drop', e=>{
  if(!admTLDrag || !e.target.closest) return;
  const zone = e.target.closest('.adm-tldrop'); if(!zone) return;
  e.preventDefault();
  const b = admTLBefore(zone, e.clientX, e.clientY), id = admTLDrag;
  admTLDrag = null; admClearMarks(); admTLMove(id, zone.dataset.tlrow, b && zone.dataset.tlrow!=='none' ? b.dataset.tlk : null);
});
document.addEventListener('dragend', ()=>{ admTLDrag = null; admClearMarks(); document.querySelectorAll('.adm-tl.dragging').forEach(x=>x.classList.remove('dragging')); });

/* ================= SET-AUSWAHL (Live / PBE / Archiv) ================= */
const SET_LABEL = {live:'Live', pbe:'PBE', archiv:'Archiv'};
const setStatus = () => (window.TFT_SET && TFT_SET.status) || TFT_DATA.channel || 'live';
const fmtDay = d => { const x = new Date(d); return isNaN(x) ? '' : x.toLocaleDateString(LOC); };
function renderSetSwitcher(){
  const sets = window.TFT_SETS || [], cur = TFT_DATA.set, st = setStatus();
  $('#setSw').innerHTML = `<button class="set-btn" id="setBtn" type="button" aria-haspopup="true" aria-expanded="false" title="Set wechseln"><b>Set ${cur}</b><span class="set-st ${st}">${SET_LABEL[st]||esc(st)}</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg></button>
    <div class="set-menu" id="setMenu" hidden><small class="set-menu-h">Set wählen</small>${sets.map(s=>`<button type="button" class="${s.set===cur?'on':''}" data-set-pick="${s.set}"><b>Set ${s.set}</b><span class="set-st ${s.status}">${SET_LABEL[s.status]||esc(s.status)}</span><small>CommunityDragon ${esc(s.version)} · ${fmtDay(s.generated)}</small></button>`).join('')}</div>`;
  document.querySelectorAll('[data-setno]').forEach(e=>{ e.textContent = cur; });
  const live = sets.find(s=>s.status==='live'), ban = $('#setBanner');
  if(st!=='live' && live && live.set!==cur){
    ban.className = 'set-banner ' + st; ban.hidden = false;
    ban.innerHTML = (st==='pbe'
      ? `<b>PBE-Vorschau:</b> Set ${cur} ist noch nicht live – Champions, Items und Werte können sich bis zum Release ändern.`
      : `<b>Archiv:</b> Du siehst die Daten von Set ${cur}. Aktuell live ist Set ${live.set}.`)
      + ` <button type="button" data-set-pick="${live.set}">Zu Set ${live.set} (Live)</button>`;
  } else ban.hidden = true;
}
function pickSet(n){
  try { localStorage.setItem('tftfreaks_set', String(n)); } catch(e){}
  if(curPath().startsWith('/builder/')) setUrl('/builder');
  if(curPath().startsWith('/tools/simulator/')) setUrl('/tools/simulator');
  location.reload();
}
function toggleSetMenu(open){
  const m = $('#setMenu'); if(!m) return;
  m.hidden = open===undefined ? !m.hidden : !open;
  $('#setBtn').setAttribute('aria-expanded', String(!m.hidden));
}
document.addEventListener('click', e=>{
  if(!e.target.closest) return;
  const pick = e.target.closest('[data-set-pick]');
  if(pick){ if(+pick.dataset.setPick !== TFT_DATA.set) pickSet(+pick.dataset.setPick); else toggleSetMenu(false); return; }
  if(e.target.closest('#setBtn, [data-open-setmenu]')){ e.stopPropagation(); toggleSetMenu(); if(e.target.closest('[data-open-setmenu]')) window.scrollTo({top:0, behavior:'smooth'}); return; }
  if(!e.target.closest('#setMenu')) toggleSetMenu(false);
});
document.addEventListener('keydown', e=>{ if(e.key==='Escape') toggleSetMenu(false); });
/* ================= MASKOTTCHEN: Gedankenblase ================= */
// Vi ist das Maskottchen der Seite (Tipps, leere Suchergebnisse) – Ornn meldet sich nur, wenn etwas im Bau ist oder nicht läuft
function ornnSays(text){ return `<div class="ornn-empty"><span class="m-ornn" role="img" aria-label="Ornn"></span><p class="ornn-say"><b class="say-name">Ornn</b>${esc(text)}</p></div>`; }
function viSays(text){ return `<div class="ornn-empty vi-empty"><span class="m-chibi" role="img" aria-label="Vi"></span><p class="ornn-say"><b class="say-name">Vi</b>${esc(text)}</p></div>`; }
let tlTab = 'comps', libTab = 'champions';
const pickOne = arr => arr[Math.floor(Math.random()*arr.length)];
const BUDDY_LINES = {
  tierlist(){
    if(tlTab==='items'){
      const s = ((ITEM_TL.craftables||{}).S||[]).map(findItem).filter(Boolean).slice(0,3).map(i=>i.en);
      return [`Meine S-Items gerade: ${s.join(', ')}.`, 'Klick auf ein Item – dann siehst du Rezept und Werte.', 'Embleme, Artefakte und Lichtversionen haben eigene Filter. Schau mal rein!', 'Komponenten früh slammen ist fast nie falsch. Leben ist auch eine Ressource!'];
    }
    if(tlTab==='holds'){
      return ['Was du von 1-1 bis 1-3 hältst, entscheidet oft deine ersten Runden.', 'Oben 1-, 2- oder 3-Kosten wählen – dann siehst du, wen du behalten solltest.', 'Ein starkes Paar früh ist Gold wert. Na ja, eigentlich Leben!', 'Klick auf einen Champion – dann siehst du seine Traits und Fähigkeit.'];
    }
    if(tlTab==='augments'){
      return ['Silber, Gold oder Prismatisch? Wähl oben die Stufe aus.', 'Die Phase zählt: Auf 2-1 sind andere Augments stark als auf 4-2.', 'Klick ein Augment an – ich zeig dir, in welchen Comps es glänzt.', 'Ein starkes Augment kann eine ganze Comp tragen. Wähl mit Plan!'];
    }
    if(!mainComps.length) return [`Set ${TFT_DATA.set} ist noch frisch – die Tierlist kommt, sobald genug getestet wurde.`, 'Schau dir solange die neuen Champions und Items in der Bibliothek an!', 'Im Team Builder kannst du schon erste Ideen basteln.'];
    const s = mainComps.filter(c=>c.tier==='S'), up = mainComps.filter(c=>c.sticker===2 && c.tier!=='S'), down = mainComps.filter(c=>c.sticker===3);
    return [
      s.length ? `${s.length} Comps sind gerade S-Tier. Mein Favorit? ${s[0].name}!` : null,
      'Klick auf eine Kachel – dann zeig ich dir, wo jeder Champion steht.',
      up.length ? `${pickOne(up).name} ist im Aufwind ▲ – behalt die im Auge!` : null,
      down.length ? `${pickOne(down).name} fällt gerade ▼. Nur spielen, wenn es offen ist.` : null,
      'Nicht forcen! Spiel, was dir der Shop gibt.',
      'Situational heißt: stark, aber nur mit den richtigen Augments oder Items.',
      'Grüner Pfeil = steigt, roter Pfeil = fällt. Ganz einfach!',
    ].filter(Boolean);
  },
  bibliothek(){
    if(libTab==='items') return ['In der Rezept-Tabelle siehst du alle Kombinationen auf einen Blick.', 'Klick auf ein Item – dann siehst du Werte und Rezept.', 'Welche Items gerade stark sind? Das steht in der Item-Tierlist!', 'Lichtversionen sind die aufgeladenen Varianten der normalen Items. Mehr Wumms!'];
    if(libTab==='traits') return [`Set ${TFT_DATA.set} hat ${traits.length} Traits. Ursprünge und Klassen kannst du oben filtern.`, 'Die Zahlen sind die Stufen: So viele Units brauchst du für den nächsten Bonus.', 'Such nach einer Unit, und ich zeig dir alle ihre Traits.', 'Klick auf eine Unit im Trait – dann siehst du ihre Details.', 'Zwei Traits gleichzeitig aktiv? So entstehen die besten Boards!'];
    return [`Set ${TFT_DATA.set} hat ${champions.length} Champions. Wer ist dein Main?`, 'Filter nach Kosten oder such direkt nach einem Trait!', 'Klick auf einen Champion – dann siehst du alle Details.', 'Fünf-Kosten-Units sind stark, aber teuer. Erst Leben sichern, dann Luxus!'];
  },
  ranks(){
    const top = RANK_ENTRIES.reduce((a,e)=>e.p>a.p?e:a, RANK_ENTRIES[0]);
    return [
      `Nur ${fmtPct(rankBy.challenger.pct)} aller Spieler sind Challenger. Klingt nach einem Ziel, oder?`,
      `Die meisten Spieler stehen gerade in ${top.t.n}${top.d?' '+top.d:''}.`,
      `Smaragd oder höher? Das ist schon die Top ${fmtPct(rankBy.emerald.topTier)}!`,
      'Klick auf einen Rang – dann zeig ich dir, wie die Spieler dort verteilt sind.',
      'Jeder Rang ist machbar. Eine Partie nach der anderen!',
      'Du willst höher? Schau mal beim Coaching vorbei!',
    ];
  },
  coaching(){ return ['Das Kennenlernen ist kostenlos – trau dich!', 'Nimm vorher ein paar Spiele auf, sonst gibt es nichts zum Anschauen!', 'Claudio und Romano sind beide Challenger. Ich bin nur fürs Zuschlagen zuständig.', 'VOD-Review heißt: pausieren, zurückspulen, verstehen. Ganz ohne Stress.', 'Mit dem 3er-Paket sparst du 10 €. Ich würde zuschlagen!', 'Deutsch oder Englisch? Geht beides!']; },
  // Ornn: alles, was noch im Bau ist oder nicht läuft
  news(){ return ['Hmph. Die Neuigkeiten liegen noch auf dem Amboss.', 'Gut Ding will Weile haben. Gute Patch-Notes auch.', 'Ich schmiede hier gerade. Komm später wieder.', 'Erst wenn das Eisen heiß ist, wird geschrieben. Bis dahin: Tierlist.']; },
  tools(){
    const sh = TFT_CUSTOM_SET.shop, o = sh && sh.odds && sh.odds[7];
    // Heimerdinger: das Tools-Maskottchen
    return ['Willkommen in meiner Werkstatt! Such dir ein Werkzeug aus – alles frisch kalibriert.',
      'Rollen oder leveln? Mein Rolldown-Rechner kennt die Antwort. Wissenschaft!',
      o ? `Auf Level 8 ist jeder Shop-Slot zu ${o[3]} % eine 4-Kosten-Unit. Faszinierend, nicht wahr?` : null,
      'Der Item-Drop-Rechner zählt mit, was noch im Item-Pool liegt. Reine Mathematik!',
      'Mit dem Tierlist-Maker baust du deine eigene Tierlist – und schickst sie als Link an deine Freunde.',
      'Der Kampf-Simulator steht noch auf meiner Werkbank. Ein paar Schrauben fehlen noch!',
      'Ein Experiment ist kein Experiment ohne Wiederholung: Im Simulator rechnest du einen Kampf 100-mal.',
      'Guinsoo oder Infinity Edge? Der DPS-Rechner zeigt es dir als Kurve. Wunderbar!'].filter(Boolean);
  },
  // Heimerdinger in den einzelnen Tools (erscheint nur, wenn assets/tools/<tool>.webp existiert)
  tlmaker(){ return ['S-Tier oder C-Tier? Hmm … eine Frage für die Wissenschaft – und für deine Meinung!',
    'Zieh Champions, Items, Artefakte, Embleme oder Augments in die Reihen. Oder tipp erst an, dann auf die Zeile.',
    'Klick auf ein Label, um die Reihe umzubenennen. Farbe und Reihenfolge änderst du direkt daneben.',
    'Bis zu 12 Reihen! Genug Platz für jede noch so verrückte Hypothese.',
    'Fertig? Mit „Teilen“ bekommst du einen Link. Perfekt für hitzige Diskussionen mit Freunden!']; },
  dps(){ return ['Zwei Builds, eine Puppe, 30 Sekunden. So sieht saubere Wissenschaft aus!',
    'Guinsoo und Kraken brauchen Anlauf – schau, wie die Kurve nach oben zieht.',
    'Stell die Auswertung auf die Sekunde, in der dein Kampf meist entschieden ist.',
    'Mehr Puppen zeigen, wie viel Flächenschaden in einer Fähigkeit steckt.']; },
  rolldown(){ return ['Rollen oder leveln? Lass uns das berechnen, bevor du dein Gold verbrennst!',
    'Je mehr Kopien schon weg sind, desto schlechter deine Chancen. Trag sie ein – Präzision ist alles!',
    'Der Vergleich zeigt dir, ob ein Level vor dem Rollen mehr bringt. Faszinierend!',
    'Zwei Gold pro Roll, fünf Slots pro Shop. Den Rest erledigt die Mathematik.']; },
  drops(){ return ['Komponenten kommen aus einem Item-Pool. Ich zähle mit, was noch drin ist!',
    'Klick die Komponenten an, sobald sie droppen. Je genauer du bist, desto besser meine Vorhersage.',
    'Vor jeder Creep-Stage kommt von jeder Komponente eine dazu. Ein wunderbar logisches System!',
    'Prismatic-Orbs gibt es erst ab 3-7. Geduld ist auch eine Wissenschaft!']; },
  sim(){ return ['Willkommen in meinem Labor! Stell zwei Teams auf und starte das Experiment.',
    'Klick eine Unit an – dann siehst du ihr Ziel, ihren Laufweg und was sie als Nächstes vorhat.',
    'Ein Kampf ist Zufall, hundert Kämpfe sind Statistik. Probier „Siegchance“!',
    'Der Simulator steht noch auf meiner Werkbank. Die Ergebnisse sind Näherungen!']; },
  guides(){ return ['Diese Guides glühen noch in der Esse.', 'Ein Guide ist wie eine Klinge: erst schmieden, dann schärfen.', 'Lesen, üben, wiederholen. So wird man Meister.']; },
  notfound(){ return ['Hier ist nichts. Nicht mal Erz.', 'Diesen Pfad habe ich nie geschmiedet. Zurück zur Tierlist!', 'Hmph. Falsch abgebogen, Wanderer.']; },
};
const DIFF_LINE = {EASY:'Gute Wahl – die ist leicht zu spielen.', MEDIUM:'Solide! Achte auf die Item-Priorität.', HARD:'Mutig! Die ist schwer, also Leben schonen.', CONDITIONAL:'Nur spielen, wenn die Bedingungen passen!'};
const buddyState = {};
function buddySay(key, text){
  const box = document.querySelector(`[data-buddy="${key}"] .buddy-bubble`); if(!box) return;
  box.classList.remove('pop'); void box.offsetWidth;
  box.querySelector('.buddy-text').textContent = text;
  box.classList.add('pop');
}
function buddyNext(key, reset){
  const st = buddyState[key] = buddyState[key] || {i:-1, hold:0};
  const lines = BUDDY_LINES[key]();
  st.i = reset ? 0 : (st.i + 1) % lines.length;
  buddySay(key, lines[st.i]);
}
function buddyReact(c){
  const st = buddyState.tierlist = buddyState.tierlist || {i:-1, hold:0};
  st.hold = Date.now() + 15000;
  buddySay('tierlist', `${c.name}? ${DIFF_LINE[c.diff]||''} Gib ${c.carry} die Items!`);
}
function buddyWire(el){
  const key = el.dataset.buddy;
  buddyNext(key, true);
  el.querySelector('.buddy-img').addEventListener('click', ()=>{ (buddyState[key]||{}).hold = 0; buddyNext(key); });
  el.addEventListener('mouseenter', ()=>{ el.dataset.hover = '1'; });
  el.addEventListener('mouseleave', ()=>{ delete el.dataset.hover; });
}
document.querySelectorAll('[data-buddy]').forEach(buddyWire);
// Tool-Seiten: Heimerdinger in der Version des Tools (dasselbe Bild wie auf der Kachel) – nur, wenn es das Bild gibt
document.querySelectorAll('[data-tool-art]').forEach(head=>{
  const src = `assets/tools/${head.dataset.toolArt}.webp`, im = new Image();
  im.onload = ()=>{
    const sim = head.dataset.toolArt==='simulator';
    head.classList.add('art-on');
    head.insertAdjacentHTML('afterbegin', `<div class="buddy heimer${sim ? ' b-simonly' : ''}" data-buddy="${head.dataset.artBuddy}"><div class="buddy-bubble" role="status" aria-live="polite"><span class="buddy-text"></span><i class="bd1"></i><i class="bd2"></i></div>`
      + `<button class="buddy-img" type="button" style="background:url('${src}') center bottom/contain no-repeat" aria-label="Heimerdinger – nächster Tipp" title="Klick für den nächsten Tipp"></button></div>`);
    buddyWire(head.firstElementChild);
  };
  im.src = src;
});
setInterval(()=>{
  const page = document.querySelector('.page.active'); if(!page || document.hidden) return;
  const el = [...page.querySelectorAll('[data-buddy]')].find(b=>b.offsetParent); if(!el || el.dataset.hover) return;
  const st = buddyState[el.dataset.buddy]; if(st && st.hold > Date.now()) return;
  buddyNext(el.dataset.buddy);
}, 9000);
$('#tlTabs').addEventListener('click', e=>{
  const b=e.target.closest('.tab'); if(!b) return;
  go(b.dataset.tab==='comps' ? '/tierlist' : '/tierlist/'+b.dataset.tab);
});

/* bibliothek tabs */
const LIB_LABEL = {champions:'Champions',items:'Items',traits:'Traits'};
function setLib(tab){
  Object.keys(LIB_LABEL).forEach(t=>{ $('#lib-'+t).hidden = t!==tab; });
  $('#libTabs').querySelectorAll('.tab').forEach(b=>b.classList.toggle('active', b.dataset.lib===tab));
  $('#libCrumb').textContent = LIB_LABEL[tab];
  if(libTab!==tab){ libTab = tab; buddyNext('bibliothek', true); }
}

/* ================= RENDER: CHAMPIONS ================= */
let costF='all';
function renderChamps(){
  const q = $('#champSearch').value.toLowerCase().trim();
  const list = champions.filter(c=>(costF==='all'||String(c.c)===costF) && (!q || c.n.toLowerCase().includes(q) || c.t.some(t=>t.toLowerCase().includes(q))));
  $('#champCount').textContent = `${list.length} von ${champions.length} Champions`;
  $('#champGrid').innerHTML = list.map(c=>`<button class="champ" data-champ="${esc(c.n)}">${avatar(c.n,56)}<div><h4>${esc(c.n)}</h4><div class="cost"><span class="coin"></span>${c.c} Gold${champRange(c.n) ? `<span class="ch-rng sm ${isMelee(c.n) ? 'melee' : 'ranged'}" title="${rangeLabel(c.n)}">${isMelee(c.n) ? 'Nahkampf' : 'Fernkampf'}</span>` : ''}</div><div class="trait-mini">${c.t.map(t=>`<span style="display:inline-flex;align-items:center;gap:4px"><img src="${traitImg(t)}" alt="" width="12" height="12" style="width:12px;height:12px;filter:brightness(1.6)" onerror="this.remove()">${esc(t)}</span>`).join('')}</div></div></button>`).join('');
}
$('#costFilters').addEventListener('click', e=>{
  const b=e.target.closest('.chip-btn'); if(!b) return;
  $('#costFilters').querySelectorAll('.chip-btn').forEach(x=>x.classList.remove('active'));
  b.classList.add('active'); costF=b.dataset.cost; renderChamps();
});
$('#champSearch').addEventListener('input', renderChamps);

/* Champion-Details: Werte, Reichweite, Fähigkeit */
// Reichweite in Feldern: bis 2 = Nahkampf (gehört nach vorne), ab 3 = Fernkampf (nach hinten)
const champRange = n => (CH_DATA[n] && CH_DATA[n].st && CH_DATA[n].st.range) || 0;
const isMelee = n => { const r = champRange(n); return r > 0 && r <= 2; };
const rangeLabel = n => { const r = champRange(n); return r ? `${r <= 2 ? 'Nahkampf' : 'Fernkampf'} · ${r} ${r===1 ? 'Feld' : 'Felder'}` : ''; };
const SCALE_LBL = {AP:'AP', AD:'AD', Health:'Leben', Armor:'Rüstung', MR:'MR', AS:'Angriffstempo', Mana:'Mana', Crit:'Krit'};
// Fähigkeitstext mit Werten pro Stern (1★ / 2★ / 3★). Werte aus den Riot-Daten oder von Hand in data/custom-<Set>.js (abilities)
function abilityHTML(n){
  const ab = (CH_DATA[n] || {}).ab; if(!ab || !ab.d) return '';
  const vals = Object.assign({}, ab.v || {}, (TFT_CUSTOM_SET.abilities || {})[n] || {}), vl = {};
  Object.keys(vals).forEach(k=>{ vl[k.toLowerCase()] = vals[k]; });
  let s = ab.d.replace(/%i:scale([A-Za-z]+)%/g, (m,k)=>`\u0002${k}\u0003`)
    .replace(/@([A-Za-z0-9_]+)(\*100)?@/g, (m,k,mul)=>{
      const v = vl[k.toLowerCase()]; if(v === undefined) return '\u0006';
      const arr = (Array.isArray(v) ? v : [v]).map(x=>x * (mul ? 100 : 1));
      return '\u0004' + (arr.every(x=>x===arr[0]) ? [arr[0]] : arr).map(fmtNum).join(' / ') + (mul ? ' %' : '') + '\u0005';
    });
  return fmtDesc(s, {})
    .replace(/\u0002([A-Za-z]+)\u0003/g, (m,k)=>`<span class="ab-sc">${esc(SCALE_LBL[k] || k)}</span>`)
    .replace(/\u0004([^\u0005]*)\u0005/g, '<b class="ab-val">$1</b>')
    .replace(/\u0006/g, '<span class="ab-q" title="Diesen Wert liefert Riot in den offiziellen Set-Daten nicht mit">?</span>');
}
const traitMore = n => { const h = traitTiersHTML(n); return h ? `<details class="tt-more"><summary>Stufen &amp; Werte</summary>${h}</details>` : ''; };
function champStatsHTML(n){
  const st = (CH_DATA[n] || {}).st; if(!st) return '';
  const stars = (v, m) => [v, v*m, v*m*m].map(x=>fmtNum(Math.round(x))).join(' / ');
  const cells = [['Leben', stars(st.hp, 1.8)], ['Angriffsschaden', stars(st.ad, 1.5)], ['Angriffstempo', fmtNum(st.as)], ['Mana', `${st.mana0} / ${st.mana}`],
    ['Rüstung', st.ar], ['Magieresistenz', st.mr], ['Krit-Chance', Math.round((st.crit||0)*100) + ' %'], ['Reichweite', rangeLabel(n)]];
  return `<div class="ch-stats">${cells.map(([l,v])=>`<div><small>${l}</small><b>${v}</b></div>`).join('')}</div>`;
}
// Offizielle Trait-Beschreibung mit den Werten jeder Stufe
function traitTiersHTML(name){
  const raw = TFT_DATA.traits.find(x=>x.n===name); if(!raw || !raw.desc) return '';
  const fx = raw.fx && raw.fx.length ? raw.fx : [{min:raw.bp[0], v:{}}];
  let d = raw.desc, rows = [];
  const exp = d.match(/<expandRow>([\s\S]*?)<\/expandRow>/i);
  if(exp){ d = d.replace(exp[0], ''); rows = fx.map(()=>exp[1]); }
  else { rows = [...d.matchAll(/<row>([\s\S]*?)<\/row>/gi)].map(m=>m[1]); d = d.replace(/<row>[\s\S]*?<\/row>/gi, ''); }
  const sub = (txt, e) => fmtDesc(txt.replace(/@MinUnits@/gi, e.min), e.v);
  const intro = sub(d, fx[0]);
  const list = rows.map((r,i)=>fx[i] ? `<li><span class="tt-bp">${fx[i].min}</span><span>${sub(r, fx[i]).replace(/^\(\d+\)\s*/, '')}</span></li>` : '').join('');
  return `${intro ? `<p class="tt-intro">${intro}</p>` : ''}${list ? `<ul class="tt-rows">${list}</ul>` : ''}`;
}

function openChamp(name){
  const c = champBy[name]; if(!c) return;
  const tr = c.t.map(tn=>{const t=traits.find(x=>x.n===tn); return t?`<div class="trait" style="margin-top:10px"><div class="trait-top">${traitHex(t.n, t.bp.length===1?'unique':'base', 28)}<h4>${esc(t.n)}</h4><div class="bp">${t.bp.map(b=>`<span>${b}</span>`).join('')}</div></div><p style="margin:0">${esc(t.d)}</p>${traitMore(t.n)}</div>`:'';}).join('');
  const inComps = comps.filter(x=>x.core.includes(c.n)).map(x=>`<button class="it-link" data-comp="${x.slug}" style="padding:4px 12px">${x.tier} · ${esc(x.name)}</button>`).join('') || '<span class="note" style="margin:0">Noch in keiner Tierlist-Comp.</span>';
  // Häufigste Items auf diesem Champion über alle Comps
  const freq = {};
  comps.forEach(x=>[...x.board, ...x.alt].forEach(b=>{ if(b.u===c.n) (b.i||[]).forEach(id=>{ const it=findItem(id); if(it) freq[it.id]=(freq[it.id]||0)+1; }); }));
  const best = Object.entries(freq).sort((a,b)=>b[1]-a[1]).slice(0,6).map(([id])=>itLink(itemById[id])).join('');
  const ab = (CH_DATA[c.n] || {}).ab, st = (CH_DATA[c.n] || {}).st;
  const abHTML = abilityHTML(c.n);
  $('#modalBody').innerHTML = `<div style="display:flex;gap:16px;align-items:center;margin-bottom:6px">${avatar(c.n,64)}<div><h2 style="margin:0">${esc(c.n)}</h2><div class="cost"><span class="coin"></span> ${c.c} Gold${rangeLabel(c.n) ? ` <span class="ch-rng ${isMelee(c.n) ? 'melee' : 'ranged'}">${rangeLabel(c.n)}</span>` : ''}</div></div></div>
    ${abHTML ? `<h4 style="margin-top:18px;font-size:.85rem;color:var(--faint)">FÄHIGKEIT</h4>
      <div class="ch-ab"><div class="ch-ab-head"><b>${esc(ab.n)}</b>${st ? `<span>Mana ${st.mana0} / ${st.mana}</span>` : ''}</div><p>${abHTML}</p>
      ${/ab-q/.test(abHTML) ? '<small class="ch-note">? = Wert, den Riot für dieses Set nicht in den offiziellen Daten mitliefert.</small>' : ''}${/ab-val/.test(abHTML) ? '<small class="ch-note">Werte für 1★ / 2★ / 3★.</small>' : ''}</div>` : ''}
    ${st ? `<h4 style="margin-top:18px;font-size:.85rem;color:var(--faint)">WERTE</h4>${champStatsHTML(c.n)}<small class="ch-note">Leben und Angriffsschaden für 1★ / 2★ / 3★.</small>` : ''}
    ${(()=>{ const h = champPatchHTML(c.n); return h ? `<h4 style="margin-top:18px;font-size:.85rem;color:var(--faint)">LETZTE ÄNDERUNGEN</h4><div class="cp-list">${h}</div>` : ''; })()}
    <h4 style="margin-top:18px;font-size:.85rem;color:var(--faint)">TRAITS</h4>${tr}
    ${best?`<h4 style="margin-top:18px;font-size:.85rem;color:var(--faint)">EMPFOHLENE ITEMS</h4><div class="tag-row">${best}</div>`:''}
    <h4 style="margin-top:18px;font-size:.85rem;color:var(--faint)">IN COMPS</h4><div class="tag-row">${inComps}</div>`;
  openModal();
}
function openModal(){ $('#modal').classList.add('open'); }
function closeModal(){ $('#modal').classList.remove('open'); }
$('#modalClose').onclick = closeModal;
$('#modal').addEventListener('click', e=>{ if(e.target.id==='modal' || e.target.closest('[data-close]')) closeModal(); });
document.addEventListener('click', e=>{ const b=e.target.closest('[data-champ]'); if(b) openChamp(b.dataset.champ); });

/* ================= RENDER: TRAITS ================= */
let catF='all';
function renderTraits(){
  const q = $('#traitSearch').value.toLowerCase().trim();
  const list = traits.filter(t=>(catF==='all'||t.cat===catF) && (!q || t.n.toLowerCase().includes(q) || champions.some(c=>c.t.includes(t.n)&&c.n.toLowerCase().includes(q))));
  $('#traitCount').textContent = `${list.length} von ${traits.length} Traits`;
  $('#traitGrid').innerHTML = list.map(t=>{
    const units = champions.filter(c=>c.t.includes(t.n));
    const col = t.cat==='origin' ? 'var(--accent)' : 'var(--gold)';
    const icon = t.cat==='origin' ? '<path d="M12 3c-3 3-6 6-6 10a6 6 0 0 0 12 0c0-4-3-7-6-10Z"/>' : '<path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z"/>';
    return `<div class="trait"><div class="trait-top">${traitHex(t.n, t.bp.length===1?'unique':'base', 34)}<div><h4>${esc(t.n)}</h4><small style="color:var(--faint);font-size:.72rem">${t.cat==='origin'?'Ursprung':'Klasse'}</small></div></div>
      <div class="bp">${t.bp.map(b=>`<span>${b}</span>`).join('')}</div><p>${esc(t.d)}</p>${traitMore(t.n)}
      <div class="trait-units">${units.map(u=>`<button data-champ="${esc(u.n)}" style="background:none;border:0;padding:0;cursor:pointer">${avatar(u.n,40)}</button>`).join('')}</div></div>`;
  }).join('');
}
$('#traitFilters').addEventListener('click', e=>{
  const b=e.target.closest('.chip-btn'); if(!b) return;
  $('#traitFilters').querySelectorAll('.chip-btn').forEach(x=>x.classList.remove('active'));
  b.classList.add('active'); catF=b.dataset.cat; renderTraits();
});
$('#traitSearch').addEventListener('input', renderTraits);

/* ================= RENDER: ITEMS ================= */
const ITEM_CATS = [
  ['craft','Kombinierte Items'],['component','Komponenten'],['radiant','Lichtversionen'],
  ['artifact','Artefakte'],['emblem','Embleme & Spatula-Items'],['other','Verbrauchsgegenstände & Sonstiges'],
];
function itemCat(it){
  if(it.cat) return it.cat; // vom Update-Skript gesetzt (gilt für jedes Set)
  const id = it.id;
  if(id.startsWith('DA_Component_')) return 'component';
  if(id.includes('Emblem') || id.startsWith('DA_Tacticians')) return 'emblem';
  if(id.includes('Artifact')) return 'artifact';
  if(id.includes('Radiant') && !/Potion|Chest/.test(id)) return 'radiant';
  if(it.comp.length===2) return 'craft';
  return 'other';
}
ITEMS.forEach(it=>{ it.cat = itemCat(it); });
// Komponenten in der gewohnten Reihenfolge (Rezept-Tabelle)
const COMP_ORDER = ['bfsword','recurvebow','needlesslylargerod','tearofthegoddess','chainvest','negatroncloak','giantsbelt','sparringgloves','spatula','fryingpan'];
const COMPONENTS = ITEMS.filter(i=>i.cat==='component').sort((a,b)=>{ const x = COMP_ORDER.indexOf(normN(a.en)), y = COMP_ORDER.indexOf(normN(b.en)); return (x<0?99:x)-(y<0?99:y); }).map(i=>i.id);
const recipeOf = {};
ITEMS.forEach(it=>{ if(it.comp.length===2) recipeOf[[...it.comp].sort().join('|')] = it; });
const radiantBase = it => itemById[it.base] || itemById[it.id.replace(/_?Radiant$/,'')] || null;
const radiantOf = it => ITEMS.find(r=>r.cat==='radiant' && radiantBase(r)===it) || null;
const emblemTrait = it => it.cat==='emblem' && / Emblem$/.test(it.en) ? it.en.replace(/ Emblem$/,'') : null;

const STATS = [['AD',100,' % AD'],['AP',1,' AP'],['AS',1,' % AS'],['Health',1,' Leben'],['Armor',1,' Rüstung'],['MagicResist',1,' MR'],['CritChance',1,' % Krit'],['ManaRegen',1,' Manareg.'],['StatOmnivamp',100,' % Omnivamp']];
const fmtNum = v => EN ? String(Math.round(v*100)/100) : String(Math.round(v*100)/100).replace('.',',');
const itemStats = it => STATS.filter(([k])=>it.fx[k]).map(([k,m,l])=>`<span class="it-stat">+${fmtNum(it.fx[k]*m)}${l}</span>`).join('');
function itemDescHTML(it){
  const tr = emblemTrait(it);
  if(tr) return `Der Träger erhält das Merkmal <span class="d-kw">${esc(tr)}</span>.`;
  return fmtDesc(it.desc, it.fx);
}
// Riot-Beschreibung (Platzhalter @Wert@, Tags) in sicheres HTML umwandeln
function fmtDesc(desc, fx){
  if(!desc) return '';
  const VAR = '\u0001';
  const fxl = {}; Object.keys(fx||{}).forEach(k=>{ fxl[k.toLowerCase()] = fx[k]; });
  let s = desc
    .replace(/<TFTTrackerLabel>[\s\S]*?<\/TFTHighlight>/gi,'')
    .replace(/<tftitemrules>[^<]*@TFTUnitProperty[^<]*<\/tftitemrules>/gi,'')
    .replace(/@TFTUnitProperty\.:[^@]*@/g,'')
    .replace(/\{\{[^}]*\}\}/g,'').replace(/%i:[^%]*%/g,'')
    .replace(/@([A-Za-z0-9_]+)(\*100)?@/g,(m,k,mul)=> k.toLowerCase() in fxl ? fmtNum(fxl[k.toLowerCase()]*(mul?100:1)) : VAR)
    .replace(/@[^@]*@/g,VAR);
  const TAGS = {tftkeyword:'kw',tftbold:'kw',magicdamage:'kw',tfthighlight:'kw',tftshadowitembonus:'kw',tftradiantitembonus:'rad',tftitemrules:'rules',rules:'rules'};
  s = s.replace(/<(\/?)([a-zA-Z]+)[^>]*>/g,(m,cl,t)=>{
    t = t.toLowerCase();
    if(t==='br') return '<br>';
    if(t==='li') return cl ? '' : '<br>• ';
    const c = TAGS[t]; return c ? (cl ? '</span>' : `<span class="d-${c}">`) : '';
  });
  return s.split(VAR).join('<span class="d-var" title="Wert hängt vom Spielverlauf ab (z. B. Phase)">X</span>')
    .replace(/ {2,}/g,' ').replace(/(<br>\s*){3,}/g,'<br><br>').replace(/^(\s*<br>)+|(<br>\s*)+$/g,'').trim();
}
const itImg = (it,size) => `<img src="${it.img}" alt="" width="${size}" height="${size}" loading="lazy">`;
const itLink = it => `<button class="it-link" data-item="${it.id}">${itImg(it,26)}${esc(it.en)}</button>`;

function itemCardHTML(it){
  const rec = it.comp.length===2 ? `<div class="it-recipe">${it.comp.map(c=>itemById[c]?itImg(itemById[c],22):'').join('+')}</div>` : '';
  const st = itemStats(it);
  return `<button class="it-card" data-item="${it.id}"><img class="it-ic" src="${it.img}" alt="" width="48" height="48" loading="lazy"><div><h4>${esc(it.en)}</h4>${it.de!==it.en?`<small>${esc(it.de)}</small>`:''}${rec}${st?`<div class="it-stats">${st}</div>`:''}</div></button>`;
}
let itemCatF = 'all';
function renderItems(){
  const q = $('#itemSearch').value.toLowerCase().trim();
  const list = ITEMS.filter(it=>(itemCatF==='all'||it.cat===itemCatF) && (!q || it.en.toLowerCase().includes(q) || it.de.toLowerCase().includes(q)));
  $('#itemCount').textContent = `${list.length} von ${ITEMS.length} Items`;
  $('#itemGroups').innerHTML = ITEM_CATS.map(([k,label])=>{
    const g = list.filter(it=>it.cat===k).sort((a,b)=>a.en.localeCompare(b.en));
    if(!g.length) return '';
    return `<div class="group-title"><h3 style="margin:0">${label}</h3><span class="count" style="margin:0">${g.length}</span></div><div class="item-grid">${g.map(itemCardHTML).join('')}</div>`;
  }).join('') || viSays('Kein Item gefunden. Probier einen anderen Namen oder Filter!');
}
function renderRecipes(){
  const comps = COMPONENTS.map(id=>itemById[id]).filter(Boolean);
  const head = `<tr><th></th>${comps.map(c=>`<th><button data-item="${c.id}" title="${esc(c.en)}">${itImg(c,42)}</button></th>`).join('')}</tr>`;
  const rows = comps.map(a=>`<tr><th><button data-item="${a.id}" title="${esc(a.en)}">${itImg(a,42)}</button></th>${comps.map(b=>{
    const r = recipeOf[[a.id,b.id].sort().join('|')];
    return `<td>${r?`<button data-item="${r.id}" title="${esc(r.en)}">${itImg(r,42)}</button>`:''}</td>`;
  }).join('')}</tr>`).join('');
  $('#recipeTable').innerHTML = head + rows;
}
$('#itemFilters').addEventListener('click', e=>{
  const b=e.target.closest('.chip-btn'); if(!b) return;
  $('#itemFilters').querySelectorAll('.chip-btn').forEach(x=>x.classList.remove('active'));
  b.classList.add('active'); itemCatF=b.dataset.icat; renderItems();
});
$('#itemSearch').addEventListener('input', renderItems);
$('#itTabs').addEventListener('click', e=>{
  const b=e.target.closest('.chip-btn'); if(!b) return;
  $('#itTabs').querySelectorAll('.chip-btn').forEach(x=>x.classList.toggle('active', x===b));
  $('#it-list').hidden = b.dataset.view!=='list';
  $('#it-recipes').hidden = b.dataset.view!=='recipes';
});

function openItem(key){
  const it = findItem(key); if(!it) return;
  const label = (ITEM_CATS.find(([k])=>k===it.cat)||[])[1] || '';
  const sec = (t,html) => `<h4 style="margin-top:18px;font-size:.85rem;color:var(--faint)">${t}</h4>${html}`;
  let extra = '';
  if(it.comp.length===2) extra += sec('REZEPT', `<div class="tag-row">${it.comp.map(c=>itemById[c]?itLink(itemById[c]):'').join('')}</div>`);
  if(it.cat==='component'){
    const into = ITEMS.filter(r=>r.comp.includes(it.id)).sort((a,b)=>a.en.localeCompare(b.en));
    if(into.length) extra += sec('BAUT IN', `<div class="tag-row">${into.map(itLink).join('')}</div>`);
  }
  const base = it.cat==='radiant' ? radiantBase(it) : null;
  if(base) extra += sec('LICHTVERSION VON', `<div class="tag-row">${itLink(base)}</div>`);
  const rad = it.cat==='craft' ? radiantOf(it) : null;
  if(rad) extra += sec('LICHTVERSION', `<div class="tag-row">${itLink(rad)}</div>`);
  const tr = emblemTrait(it);
  if(tr && traits.some(t=>t.n===tr)) extra += sec('TRAIT', `<div class="tag-row"><button class="it-link" data-trait="${esc(tr)}" style="padding:4px 12px">${esc(tr)} ansehen →</button></div>`);
  const st = itemStats(it);
  const desc = it.cat==='component' && st ? '' : itemDescHTML(it);
  $('#modalBody').innerHTML = `<div style="display:flex;gap:16px;align-items:center">${itImg(it,64).replace('<img','<img style="border-radius:10px;border:1px solid var(--line-2)"')}<div><small style="font-size:.7rem;color:var(--faint);text-transform:uppercase;letter-spacing:.06em">${label}</small><h2 style="margin:2px 0 0">${esc(it.en)}</h2>${it.de!==it.en?`<div style="color:var(--muted);font-size:.9rem">${esc(it.de)}</div>`:''}</div></div>
    ${st?`<div class="it-stats" style="margin-top:14px">${st}</div>`:''}
    ${desc?`<div class="it-desc">${desc}</div>`:''}${extra}`;
  openModal();
}
document.addEventListener('click', e=>{
  const b=e.target.closest('[data-item]'); if(b){ openItem(b.dataset.item); return; }
  const t=e.target.closest('[data-trait]');
  if(t){ const n=t.dataset.trait; go('/bibliothek/traits'); setTimeout(()=>{ $('#traitSearch').value=n; renderTraits(); },10); }
});

/* ================= HOME ================= */
function pkgHTML(p){
  return `<div class="card pkg ${p.f?'featured':''}">${p.f||p.b?`<span class="pill${p.b?' gold':''}" style="align-self:flex-start;margin-bottom:8px">${esc(p.b||'Beliebt')}</span>`:''}<h3 style="margin:0">${esc(p.n)}</h3><div class="price">${p.p} <small>${p.u}</small></div><ul>${p.l.map(x=>`<li>${esc(x)}</li>`).join('')}</ul><a href="/apply" class="btn ${p.f?'btn-primary':'btn-ghost'}" style="justify-content:center">Kennenlernen anfragen</a></div>`;
}
function testimonialHTML(t){
  if(!t.q) return `<div class="card co-quote soon"><span class="co-qm" aria-hidden="true">“</span><p>Feedback folgt</p><figcaption><b>${esc(t.n)}</b>${t.r?`<span>${esc(t.r)}</span>`:''}</figcaption></div>`;
  return `<figure class="card co-quote"><span class="co-qm" aria-hidden="true">“</span><blockquote>${esc(t.q)}</blockquote><figcaption><b>${esc(t.n)}</b>${t.r?`<span>${esc(t.r)}</span>`:''}</figcaption></figure>`;
}
function guideHTML(g){
  return `<div class="card guide"><div class="guide-cover" style="background:${g.col}"><div>${esc(g.t)}<small>TFT Freaks</small></div></div><div><span class="pill">${esc(g.s)}</span><h3 style="margin-top:10px">${esc(g.t)}</h3><p>${esc(g.d)}</p><p style="color:var(--faint);font-size:.82rem">${esc(g.x)}</p><span class="link-arrow">Bald verfügbar</span></div></div>`;
}
function renderHome(){
  $('#ranks').innerHTML = ranks.map(([n,c,f])=>`<a href="/ranks/${f.toLowerCase()}" class="rank"><div class="rank-gem"><img src="${DD}tft-regalia/TFT_Regalia_${f}.png" alt="TFT Rang ${n}" loading="lazy" onerror="this.outerHTML='<span style=&quot;font:900 1.4rem var(--ff-head);color:${c}&quot;>${n[0]}</span>'"></div>${n}</a>`).join('');
  $('#sCount').textContent = mainComps.filter(c=>c.tier==='S').length + ' aktiv';
  // Team: Vi mit offiziellem Set-18-Bild und ihren Traits
  const vi = champBy['Vi'];
  $('#teamViTraits').innerHTML = vi ? vi.t.map(n=>`<span class="tbadge">${traitHex(n,'base',18)}<span>${esc(n)}</span></span>`).join('') : '';
  $('#coachPkgs').innerHTML = packages.map(pkgHTML).join('');
  $('#coachQuotes').innerHTML = testimonials.map(testimonialHTML).join('');
  $('#allGuides').innerHTML = guides.map(guideHTML).join('');
}

/* ================= APPLY ================= */
['fRank','fGoal'].forEach(id=>{ $('#'+id).innerHTML = ranks.map(([n])=>`<option>${n}</option>`).join(''); });
$('#applyForm').addEventListener('submit', e=>{ e.preventDefault(); $('#applyOk').style.display='block'; });

/* ================= SEARCH ================= */
const searchIndex = [
  ...champions.map(c=>({label:c.n,type:'Champion',html:avatar(c.n,40),go:()=>{closeSearch();openChamp(c.n);}})),
  ...traits.map(t=>({label:t.n,type:t.cat==='origin'?'Ursprung':'Klasse',html:traitHex(t.n, t.bp.length===1?'unique':'base', 34),go:()=>{closeSearch();go('/bibliothek/traits');setTimeout(()=>{$('#traitSearch').value=t.n;renderTraits();},10);}})),
  ...ITEMS.map(it=>({label:it.en,alt:it.de,type:'Item · '+(ITEM_CATS.find(([k])=>k===it.cat)||[])[1],html:`<img src="${it.img}" alt="" width="40" height="40" loading="lazy" style="width:40px;height:40px;border-radius:8px">`,go:()=>{closeSearch();openItem(it.id);}})),
  ...AUGS.filter(a=>!AUG_DUP.has(a.id)).map(a=>({label:a.en,alt:a.de,type:'Augment'+(a.lv?' · '+AUG_LV[a.lv]:''),html:`<img src="${augImg(a)}" alt="" width="40" height="40" loading="lazy" style="width:40px;height:40px;border-radius:8px">`,go:()=>{closeSearch();openAug(a.id);}})),
  ...comps.map(c=>({label:c.name,type:'Comp · '+c.tier,html:avatar(c.carry,40),go:()=>{closeSearch();openComp(c.slug);}})),
];
let sResults=[], sFocus=0;
function openSearch(){ $('#searchOv').classList.add('open'); $('#searchInput').value=''; runSearch(); setTimeout(()=>$('#searchInput').focus(),20); }
function closeSearch(){ $('#searchOv').classList.remove('open'); }
function runSearch(){
  const q = $('#searchInput').value.toLowerCase().trim();
  sResults = (q ? searchIndex.filter(s=>s.label.toLowerCase().includes(q) || (s.alt && s.alt.toLowerCase().includes(q))) : searchIndex.filter(s=>s.type.startsWith('Comp'))).slice(0,12);
  sFocus = 0;
  $('#searchRes').innerHTML = sResults.length ? sResults.map((s,i)=>`<div class="sr ${i===0?'focus':''}" data-i="${i}">${s.html}<span>${esc(s.label)}</span><small>${esc(s.type)}</small></div>`).join('') : '<div class="sr-empty">'+viSays('Nichts gefunden. Versuch es mit einem Champion, Item oder Trait!')+'</div>';
}
$('#openSearch').onclick = openSearch;
$('#searchInput').addEventListener('input', runSearch);
$('#searchRes').addEventListener('click', e=>{ const r=e.target.closest('.sr'); if(r) sResults[+r.dataset.i].go(); });
$('#searchOv').addEventListener('click', e=>{ if(e.target.id==='searchOv') closeSearch(); });
document.addEventListener('keydown', e=>{
  const open = $('#searchOv').classList.contains('open');
  if(e.key==='/' && !open && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)){ e.preventDefault(); openSearch(); }
  if(e.key==='Escape'){ closeSearch(); closeModal(); drawer.classList.remove('open'); moreMenu.classList.remove('open'); }
  if(open && (e.key==='ArrowDown'||e.key==='ArrowUp') && sResults.length){
    e.preventDefault(); sFocus = (sFocus + (e.key==='ArrowDown'?1:-1) + sResults.length) % sResults.length;
    document.querySelectorAll('.sr').forEach((el,i)=>el.classList.toggle('focus', i===sFocus));
  }
  if(open && e.key==='Enter' && sResults[sFocus]) sResults[sFocus].go();
});

/* ================= ROUTER ================= */

const SVGI = {
  home:'<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  tier:'<path d="M4 6h16M4 12h10M4 18h6"/>',
  champ:'<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>',
  trait:'<path d="M12 3l8 4v6c0 4-3.5 7-8 8-4.5-1-8-4-8-8V7z"/>',
  item:'<path d="M14 4l6 6-9 9H5v-6z"/><path d="M12 6l6 6"/>',
  aug:'<path d="M12 2l3 7 7 .5-5.5 4.5 2 7L12 17l-6.5 4 2-7L2 9.5 9 9z"/>',
  coach:'<path d="M3 8l9-4 9 4-9 4z"/><path d="M7 10v5c0 1.5 2.5 3 5 3s5-1.5 5-3v-5"/>',
  guide:'<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M8 7h7"/>',
  about:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
  apply:'<path d="M5 4h14v16l-7-4-7 4z"/>',
  patch:'<path d="M6 3h9l4 4v14H6z"/><path d="M15 3v4h4"/><path d="M9 12h7M9 16h5"/>',
  rank:'<path d="M12 3l7 4v6c0 4-3 6.5-7 8-4-1.5-7-4-7-8V7z"/><path d="M12 8l1.2 2.5 2.8.3-2.1 1.9.6 2.8-2.5-1.4-2.5 1.4.6-2.8-2.1-1.9 2.8-.3z"/>',
  lib:'<path d="M4 4h4v16H4zM10 4h4v16h-4z"/><path d="M16 5l3.5-1 3 15.5-3.5 1z"/>',
  news:'<path d="M4 5h13v14H6a2 2 0 0 1-2-2z"/><path d="M17 9h3v8a2 2 0 0 1-2 2"/><path d="M8 9h5M8 13h5"/>',
  builder:'<path d="M7 3.5l4 2.3v4.6l-4 2.3-4-2.3V5.8z"/><path d="M17 3.5l4 2.3v4.6l-4 2.3-4-2.3V5.8z"/><path d="M12 12l4 2.3v4.6l-4 2.3-4-2.3v-4.6z"/>',
  tools:'<path d="M14.5 6.5a4 4 0 0 0-5.4 5.1L4 16.7 7.3 20l5.1-5.1a4 4 0 0 0 5.1-5.4l-2.4 2.4-2.4-.6-.6-2.4z"/>'
};
const NAV = [
  {r:'home', h:'/', l:'Home', mascot:true},
  {r:'tierlist', h:'/tierlist', l:'Tierlist', s:'tier', badge: mainComps.length ? TL_PATCH : (setStatus()==='pbe' ? 'PBE' : '')},
  {r:'bibliothek', h:'/bibliothek', l:'Bibliothek', s:'lib'},
  {r:'builder', h:'/builder', l:'Team Builder', s:'builder'},
  {r:'ranks', h:'/ranks', l:'Ranks', s:'rank'},
  {r:'tools', h:'/tools', l:'Tools', s:'tools', badge:'Neu'},
  {r:'coaching', h:'/coaching', l:'Coaching', s:'coach'},
  {r:'patches', h:'/patches', l:'Patches', s:'patch', more:true},
  {r:'guides', h:'/guides', l:'Guides', s:'guide', more:true},
  {r:'about', h:'/about', l:'Meet the Team', s:'about', more:true},
  {r:'apply', h:'/apply', l:'Bewerbung', s:'apply', more:true},
];function navIcon(n){
  if(n.mascot) return '<span class="tb-ic"><span class="m-face" style="width:100%;height:100%"></span></span>';
  const svg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">${SVGI[n.s]}</svg>`;
  if(!n.img) return `<span class="tb-ic svg">${svg}</span>`;
  return `<span class="tb-ic"><img src="${champImg(n.img)}" alt="" loading="lazy" onerror="this.parentNode.classList.add('svg');this.outerHTML=this.parentNode.dataset.svg"></span>`.replace('<span class="tb-ic">', `<span class="tb-ic" data-svg='${svg}'>`);
}
$('#tbNav').innerHTML = NAV.filter(n=>!n.more).map(n=>`<a href="${n.h}" class="tb-item" data-route="${n.r}">${n.badge?`<span class="tb-badge">${n.badge}</span>`:''}${navIcon(n)}<span>${n.l}</span></a>`).join('')
  + '<button class="tb-item tb-more" id="moreBtn" aria-haspopup="true" aria-label="Mehr">···</button>';
$('#moreMenu').innerHTML = NAV.filter(n=>n.more).map(n=>`<a href="${n.h}" data-route="${n.r}">${navIcon(n)}${n.l}</a>`).join('');
$('#drawerPanel').innerHTML = `<a href="/" class="tb-logo" style="border:0;padding:6px 10px 14px;font-size:1.7rem" aria-label="TFT Freaks Startseite"><span class="tft-logo" aria-hidden="true"></span><div><span>TFT</span> <b>Freaks</b></div></a>
  <h5>Tierlist & Daten</h5>${NAV.filter(n=>['tierlist','bibliothek','builder','ranks','tools','patches'].includes(n.r)).map(n=>`<a href="${n.h}" data-route="${n.r}">${navIcon(n)}${n.l}</a>`).join('')}
  <h5>TFT Freaks</h5>${NAV.filter(n=>['home','coaching','guides','about','apply'].includes(n.r)).map(n=>`<a href="${n.h}" data-route="${n.r}">${navIcon(n)}${n.l}</a>`).join('')}`;
const moreMenu = $('#moreMenu');
$('#moreBtn').onclick = e=>{ e.stopPropagation(); const r=e.currentTarget.getBoundingClientRect(); moreMenu.style.left=Math.min(r.left, innerWidth-240)+'px'; moreMenu.classList.toggle('open'); };
document.addEventListener('click', e=>{ if(!e.target.closest('#moreMenu')) moreMenu.classList.remove('open'); });
const drawer = $('#drawer');
$('#burger').onclick = ()=>drawer.classList.add('open');
drawer.addEventListener('click', e=>{ if(e.target.closest('[data-drawer-close]') || e.target.closest('a')) drawer.classList.remove('open'); });

// Meet the Team: Übersicht (/about) oder Profil (/about/<name>)
function setAbout(sub){
  const views = [...document.querySelectorAll('#page-about .mt-view')];
  const key = views.some(v=>v.dataset.about && v.dataset.about===sub) ? sub : '';
  views.forEach(v=>v.hidden = v.dataset.about!==key);
}

/* ================= TOOLS: Übersicht & Rolldown-Rechner ================= */
// Shop-Chancen/Pool-Größen pro Set aus data/custom-<Set>.js; Champions pro Kosten aus den offiziellen Set-Daten
const SHOP = TFT_CUSTOM_SET.shop && Array.isArray(TFT_CUSTOM_SET.shop.odds) ? TFT_CUSTOM_SET.shop : null;
const SHOP_DISTINCT = [1,2,3,4,5].map(c=>champions.filter(x=>x.c===c).length);
const RD_MAXK = 9;   // bis 9 Kopien (= ★★★)
const rd = {champ:'', cost:4, lvl:8, gold:50, out:0, other:0, target:3, buy:true, xp:''};
(function(){   // Start: Carry der besten Comp, passendes Level
  const c = champBy[(mainComps.find(x=>x.tier==='S') || mainComps[0] || {}).carry];
  if(c){ rd.champ = c.n; rd.cost = c.c; rd.lvl = [5,6,7,8,9][c.c-1]; }
})();

// Chance, dass EIN Shop-Slot den gesuchten Champion zeigt, wenn man schon k Kopien gefunden hat
function rdSlotP(lvl, cost, out, other, k){
  const bag = SHOP.bag[cost-1], left = bag - out - k;
  const pool = bag * SHOP_DISTINCT[cost-1] - out - other - k;
  return left > 0 && pool > 0 ? (SHOP.odds[lvl-1][cost-1] / 100) * left / pool : 0;
}
// Wahrscheinlichkeit für genau 0…9 gefundene Kopien, wenn man `gold` ins Rollen steckt (2 Gold = 5 Slots).
// buy: jeder Treffer kostet seine Kosten in Gold – fehlt das Gold, kann er nicht gekauft werden.
function rdDist(lvl, cost, out, other, gold, buy){
  const K = RD_MAXK + 1, price = buy ? cost : 0, G = Math.max(0, Math.floor(gold));
  const pk = Array.from({length:K}, (_,k)=> k < RD_MAXK ? rdSlotP(lvl, cost, out, other, k) : 0);
  const m = new Float64Array((G+1) * K); m[G*K] = 1;
  for(let g = G; g >= 2; g--){            // Gold sinkt mit jedem Roll – also von oben nach unten abarbeiten
    for(let k = 0; k < K; k++){
      const w = m[g*K+k]; if(!w) continue; m[g*K+k] = 0;
      let st = new Map([[(g-2)*K + k, w]]);
      for(let s = 0; s < 5; s++){
        const nx = new Map(), add = (key, v)=>nx.set(key, (nx.get(key)||0) + v);
        st.forEach((v, key)=>{
          const gg = Math.floor(key / K), kk = key % K, p = pk[kk];
          if(p > 0 && gg >= price){ add((gg-price)*K + kk + 1, v*p); add(key, v*(1-p)); } else add(key, v);
        });
        st = nx;
      }
      st.forEach((v, key)=>{ m[key] += v; });
    }
  }
  const res = new Array(K).fill(0);
  for(let g = 0; g <= Math.min(1, G); g++) for(let k = 0; k < K; k++) res[k] += m[g*K+k];
  return res;
}
const rdAtLeast = (dist, k) => dist.slice(k).reduce((a,b)=>a+b, 0);
const rdPct = p => (p*100).toLocaleString(LOC, {maximumFractionDigits: p > 0 && p < 0.1 ? 1 : 0}) + L(' %', '%');
function rdGoldFor(q){   // kleinstes Gold, mit dem das Ziel mit Chance q erreicht wird
  const P = g => rdAtLeast(rdDist(rd.lvl, rd.cost, rd.out, rd.other, g, rd.buy), rd.target);
  let hi = 2; while(P(hi) < q){ hi *= 2; if(hi > 512) return null; }
  let lo = 0; while(hi - lo > 1){ const mid = (lo + hi) >> 1; if(P(mid) >= q) hi = mid; else lo = mid; }
  return hi;
}

/* ================= DPS-RECHNER ================= */
// Ein Champion mit bis zu 4 Item-Builds schlägt 30 s auf Trainingspuppen (Engine des Kampf-Simulators, sim.js → simDps)
const dpsN = v => Math.round(v).toLocaleString(LOC);
const DPS_COL = ['#4f8cff','#ff8a1f','#2fe0d0','#e05cff'];
const DPS_PROF = [['back','Backline', 800, 30, 30], ['mid','Frontline', 1600, 70, 70], ['tank','Tank', 3000, 150, 150]];
const DPS_CATS = [['craft','Kombiniert'], ['radiant','Lichtversionen'], ['artifact','Artefakte']];
const dps = {cost:4, champ:'', star:2, builds:[[], []], prof:'mid', n:1, at:25, dur:30, mode:'sum', pick:null, cat:'craft', q:'', res:null};
let dpsMounted = false, dpsTimer = 0;
// Builds aus der Tierlist als Startpunkt: Item-Sets, die der Champion in Comps und Alt Builds hält
function dpsSuggest(n){
  const seen = new Set(), out = [];
  comps.forEach(c=>[...(c.board||[]), ...(c.alt||[])].forEach(b=>{
    if(b.u!==n || (b.i||[]).length < 2) return;
    const ids = b.i.map(findItem).filter(it=>it && ['craft','radiant','artifact'].includes(it.cat)).map(it=>it.id), k = ids.slice().sort().join('|');   // Embleme wirken hier nicht (keine Traits)
    if(ids.length >= 2 && !seen.has(k)){ seen.add(k); out.push(ids.slice(0, 3)); }
  }));
  return out.slice(0, 3);
}
function dpsMount(){
  if(dpsMounted) return; dpsMounted = true;
  if(!dps.champ){ const c = mainComps.find(x=>champBy[x.carry] && champBy[x.carry].c===4) || mainComps[0]; if(c && champBy[c.carry]){ dps.champ = c.carry; dps.cost = champBy[c.carry].c; } }
  if(dps.champ){ const s = dpsSuggest(dps.champ); if(s.length) dps.builds = s.length > 1 ? s : [s[0], []]; }
  $('#dpsApp').innerHTML = `<div class="dps">
    <div class="card dps-in">
      <section><h3 class="rd-h"><b>1</b> Champion</h3>
        <div class="rd-costs" id="dpsCosts">${[1,2,3,4,5].map(c=>`<button type="button" class="rd-cost" data-dcost="${c}"><i class="cdot c${c}"></i>${c} Gold</button>`).join('')}</div>
        <div class="rd-champs" id="dpsChamps"></div>
        <div class="dps-row"><span>Sterne</span><div class="rd-costs" id="dpsStars">${[1,2,3].map(s=>`<button type="button" class="rd-cost" data-dstar="${s}">${'★'.repeat(s)}</button>`).join('')}</div></div></section>
      <section><h3 class="rd-h"><b>2</b> Item-Builds</h3>
        <div id="dpsBuilds"></div>
        <div id="dpsPicker"></div></section>
      <section><h3 class="rd-h"><b>3</b> Ziel</h3>
        <div class="rd-costs" id="dpsProf">${DPS_PROF.map(([k,l,hp,ar,mr])=>`<button type="button" class="rd-cost" data-dprof="${k}" title="${dpsN(hp)} Leben · ${ar} Rüstung · ${mr} Magieresistenz">${l}</button>`).join('')}</div>
        <p class="rd-hint" id="dpsProfTxt"></p>
        <div class="dps-row"><span>Puppen</span><div class="rd-costs" id="dpsN">${[1,2,3].map(n=>`<button type="button" class="rd-cost" data-dn="${n}">${n}</button>`).join('')}</div></div>
        <p class="rd-hint">Mehr Puppen nebeneinander zeigen, wie viel Flächenschaden eine Fähigkeit macht.</p></section>
    </div>
    <div class="card dps-res">
      <div class="dps-head"><h3 class="rd-h">Schaden über die Zeit</h3>
        <div class="rd-costs" id="dpsMode"><button type="button" class="rd-cost" data-dmode="sum">Gesamtschaden</button><button type="button" class="rd-cost" data-dmode="dps">Schaden pro Sekunde</button></div></div>
      <div id="dpsChart" class="dps-chart"></div>
      <label class="rd-f dps-at"><span>Auswertung bis Sekunde</span><b id="dpsAtV"></b><input type="range" id="dpsAt" min="1" max="30" value="${dps.at}"></label>
      <div class="dps-table-wrap"><table class="dps-table" id="dpsTable"></table></div>
      <p class="note">Gerechnet mit der Engine des Kampf-Simulators: Grundwerte und Items nach Riot, die Stärke der Fähigkeiten ist geschätzt, wo Riot keine Zahlen liefert. Die Puppen greifen nicht an – Mana gibt es also nur über Angriffe und Items. Ohne Traits und Augments. Jeder Wert ist der Mittelwert aus 24 Kämpfen, weil Krits Zufall sind. Für den Vergleich von Builds gut geeignet, die absoluten Zahlen sind Richtwerte.</p>
    </div>
  </div>`;
  const on = (sel, ev, f) => $(sel).addEventListener(ev, f);
  on('#dpsCosts', 'click', e=>{ const b = e.target.closest('[data-dcost]'); if(!b) return; dps.cost = +b.dataset.dcost; dpsChamps(); });
  on('#dpsChamps', 'click', e=>{ const b = e.target.closest('[data-dch]'); if(!b) return; dpsSetChamp(b.dataset.dch); });
  on('#dpsStars', 'click', e=>{ const b = e.target.closest('[data-dstar]'); if(!b) return; dps.star = +b.dataset.dstar; dpsUpdate(); });
  on('#dpsProf', 'click', e=>{ const b = e.target.closest('[data-dprof]'); if(!b) return; dps.prof = b.dataset.dprof; dpsUpdate(); });
  on('#dpsN', 'click', e=>{ const b = e.target.closest('[data-dn]'); if(!b) return; dps.n = +b.dataset.dn; dpsUpdate(); });
  on('#dpsMode', 'click', e=>{ const b = e.target.closest('[data-dmode]'); if(!b) return; dps.mode = b.dataset.dmode; dpsDraw(); });
  on('#dpsAt', 'input', e=>{ dps.at = +e.target.value; dpsDraw(); });
  let dpsW = 0; window.addEventListener('resize', ()=>{ const ch = $('#dpsChart'); if(ch && ch.offsetParent && Math.abs(ch.clientWidth - dpsW) > 30){ dpsW = ch.clientWidth; dpsDraw(); } });
  on('#dpsBuilds', 'click', e=>{
    const slot = e.target.closest('[data-dslot]'), del = e.target.closest('[data-ddel]'), add = e.target.closest('[data-dadd]'), clr = e.target.closest('[data-dclr]');
    if(del){ dps.builds.splice(+del.dataset.ddel, 1); dps.pick = null; dpsUpdate(); return; }
    if(add){ dps.builds.push([]); dps.pick = {b:dps.builds.length - 1, s:0}; dpsUpdate(); return; }
    if(clr){ const [b, s] = clr.dataset.dclr.split(':').map(Number); dps.builds[b].splice(s, 1); dps.pick = null; dpsUpdate(); return; }
    if(slot){ const [b, s] = slot.dataset.dslot.split(':').map(Number); dps.pick = dps.pick && dps.pick.b===b && dps.pick.s===s ? null : {b, s}; dpsBuilds(); }
  });
  on('#dpsPicker', 'click', e=>{
    const c = e.target.closest('[data-dcat]'); if(c){ dps.cat = c.dataset.dcat; dpsPicker(); return; }
    if(e.target.closest('[data-dclose]')){ dps.pick = null; dpsBuilds(); return; }
    const it = e.target.closest('[data-ditem]'); if(!it || !dps.pick) return;
    const b = dps.builds[dps.pick.b]; b[Math.min(dps.pick.s, b.length)] = it.dataset.ditem;
    dps.pick = b.length < 3 ? {b:dps.pick.b, s:b.length} : null; dpsUpdate();
  });
  on('#dpsPicker', 'input', e=>{ if(e.target.id!=='dpsQ') return; dps.q = e.target.value; dpsPickerGrid(); });
  const ch = $('#dpsChart');
  ch.addEventListener('mousemove', e=>dpsHover(e)); ch.addEventListener('mouseleave', ()=>dpsHover(null));
  dpsChamps(); dpsUpdate();
}
function dpsSetChamp(n){
  if(!champBy[n]) return;
  dps.champ = n; dps.cost = champBy[n].c; dps.pick = null;
  const s = dpsSuggest(n); dps.builds = s.length ? (s.length > 1 ? s : [s[0], []]) : [[], []];
  dpsChamps(); dpsUpdate();
}
function dpsChamps(){
  $('#dpsCosts').querySelectorAll('[data-dcost]').forEach(b=>b.classList.toggle('on', +b.dataset.dcost===dps.cost));
  $('#dpsChamps').innerHTML = champions.filter(c=>c.c===dps.cost).map(c=>`<button type="button" class="rd-ch${c.n===dps.champ?' on':''}" data-dch="${esc(c.n)}" title="${esc(c.n)}">${avatar(c.n, 44)}<span>${esc(c.n)}</span></button>`).join('');
}
const dpsItemImg = id => { const it = findItem(id); return it ? `<img src="${it.img}" alt="" title="${esc(it.en)}">` : ''; };
function dpsBuilds(){
  $('#dpsBuilds').innerHTML = dps.builds.map((b, i)=>`<div class="dps-build" style="--bc:${DPS_COL[i]}"><b class="dps-bn">${String.fromCharCode(65 + i)}</b>
    <div class="dps-slots">${[0,1,2].map(s=>{ const id = b[s], open = dps.pick && dps.pick.b===i && dps.pick.s===s;
      return `<div class="dps-slot${open?' on':''}${id?'':' empty'}"><button type="button" data-dslot="${i}:${s}" aria-label="${id ? esc((findItem(id)||{}).en || '') : 'Item wählen'}">${id ? dpsItemImg(id) : '+'}</button>${id?`<button type="button" class="dps-x" data-dclr="${i}:${s}" aria-label="Entfernen">✕</button>`:''}</div>`; }).join('')}</div>
    <span class="dps-bname">${b.length ? b.map(id=>esc((findItem(id)||{}).en || '')).join(' · ') : 'Keine Items'}</span>
    ${dps.builds.length > 1 ? `<button type="button" class="dps-del" data-ddel="${i}" title="Build entfernen" aria-label="Build entfernen">✕</button>` : ''}</div>`).join('')
    + (dps.builds.length < 4 ? `<button type="button" class="btn btn-ghost b-btn dps-add" data-dadd>+ Build vergleichen</button>` : '');
  dpsPicker();
}
function dpsPicker(){
  const box = $('#dpsPicker');
  if(!dps.pick){ box.innerHTML = ''; return; }
  box.innerHTML = `<div class="dps-pick"><div class="dps-pickbar"><span>Item für Build ${String.fromCharCode(65 + dps.pick.b)}, Slot ${dps.pick.s + 1}</span><button type="button" class="dps-x2" data-dclose aria-label="Schließen">✕</button></div>
    <div class="dps-pickbar">${DPS_CATS.map(([k,l])=>`<button type="button" class="chip-btn${dps.cat===k?' active':''}" data-dcat="${k}">${l}</button>`).join('')}<input class="input" id="dpsQ" placeholder="Item suchen…" value="${esc(dps.q)}"></div>
    <div class="dps-grid" id="dpsGrid"></div></div>`;
  dpsPickerGrid();
}
function dpsPickerGrid(){
  const q = dps.q.toLowerCase().trim();
  const list = ITEMS.filter(i=>(q ? ['craft','radiant','artifact'].includes(i.cat) : i.cat===dps.cat) && (!q || i.en.toLowerCase().includes(q) || i.de.toLowerCase().includes(q))).sort((a,b)=>a.en.localeCompare(b.en));
  $('#dpsGrid').innerHTML = list.map(i=>`<button type="button" data-ditem="${i.id}" title="${esc(i.en)}"><img src="${i.img}" alt="" loading="lazy"><span>${esc(i.en)}</span></button>`).join('') || '<p class="note">Kein Item gefunden.</p>';
}
function dpsUpdate(){
  $('#dpsStars').querySelectorAll('[data-dstar]').forEach(b=>b.classList.toggle('on', +b.dataset.dstar===dps.star));
  $('#dpsProf').querySelectorAll('[data-dprof]').forEach(b=>b.classList.toggle('on', b.dataset.dprof===dps.prof));
  $('#dpsN').querySelectorAll('[data-dn]').forEach(b=>b.classList.toggle('on', +b.dataset.dn===dps.n));
  const p = DPS_PROF.find(x=>x[0]===dps.prof);
  $('#dpsProfTxt').textContent = `${dpsN(p[2])} Leben · ${p[3]} Rüstung · ${p[4]} Magieresistenz`;
  dpsBuilds();
  clearTimeout(dpsTimer);
  dpsTimer = setTimeout(()=>{   // kurz warten, damit schnelle Klicks nicht jedes Mal neu rechnen
    if(!dps.champ){ dps.res = null; dpsDraw(); return; }
    dps.res = dps.builds.map(items=>simDps({champ:dps.champ, star:dps.star, items, hp:p[2], ar:p[3], mr:p[4], n:dps.n, dur:dps.dur}));
    dpsDraw();
  }, 30);
}
const dpsAtIdx = (r, t) => Math.min(r.tot.length - 1, Math.round(t / SIM_DPS_STEP));
// Schaden pro Sekunde: gleitendes Fenster (±2 s um den Zeitpunkt), damit einzelne Angriffe und Fähigkeiten nicht als Zacken stehen
const dpsRate = r => { const k = Math.round(2 / SIM_DPS_STEP), n = r.tot.length - 1;
  return r.tot.map((_, i)=>{ const a = Math.max(0, i - k), b = Math.min(n, i + k); return b > a ? (r.tot[b] - r.tot[a]) / ((b - a) * SIM_DPS_STEP) : 0; }); };
function dpsDraw(){
  $('#dpsMode').querySelectorAll('[data-dmode]').forEach(b=>b.classList.toggle('on', b.dataset.dmode===dps.mode));
  $('#dpsAtV').textContent = dps.at + ' s';
  const R = dps.res, chart = $('#dpsChart');
  if(!R || !R.length){ chart.innerHTML = viSays('Wähl oben einen Champion – dann rechne ich los.'); $('#dpsTable').innerHTML = ''; return; }
  // Zeichenfläche in echter Breite, damit die Beschriftung auf dem Handy lesbar bleibt
  const W = Math.round(Math.max(320, Math.min(640, chart.clientWidth || 640))), H = Math.round(W * (W < 480 ? 0.62 : 0.45)), L0 = 54, R0 = 14, T0 = 14, B0 = 30, w = W - L0 - R0, h = H - T0 - B0;
  const ser = R.map(r=>dps.mode==='dps' ? dpsRate(r) : r.tot);
  const max = Math.max(1, ...ser.map(s=>Math.max(...s)));
  const step = [50,100,200,250,500,1000,2000,2500,5000,10000,20000,25000,50000,100000].find(s=>max / s <= 5) || 200000, top = Math.ceil(max / step) * step;
  const X = t => L0 + t / dps.dur * w, Y = v => T0 + h - v / top * h;
  let g = '';
  for(let v = 0; v <= top + 1e-6; v += step) g += `<line x1="${L0}" x2="${W - R0}" y1="${Y(v)}" y2="${Y(v)}" class="dps-grid-l"/><text x="${L0 - 8}" y="${Y(v) + 4}" text-anchor="end">${dpsN(v)}</text>`;
  for(let t = 0; t <= dps.dur; t += 5) g += `<line x1="${X(t)}" x2="${X(t)}" y1="${T0}" y2="${T0 + h}" class="dps-grid-l v"/><text x="${X(t)}" y="${H - 10}" text-anchor="middle">${t} s</text>`;
  const lines = ser.map((s, i)=>`<polyline fill="none" stroke="${DPS_COL[i]}" stroke-width="2.6" stroke-linejoin="round" points="${s.map((v, k)=>`${X(R[i].t[k]).toFixed(1)},${Y(v).toFixed(1)}`).join(' ')}"/>`).join('');
  const dots = ser.map((s, i)=>`<circle cx="${X(dps.at)}" cy="${Y(s[dpsAtIdx(R[i], dps.at)])}" r="4.5" fill="${DPS_COL[i]}" stroke="#0d0d12" stroke-width="2"/>`).join('');
  chart.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Schaden über die Zeit">${g}<line x1="${X(dps.at)}" x2="${X(dps.at)}" y1="${T0}" y2="${T0 + h}" class="dps-at-l"/>${lines}${dots}<g id="dpsHov"></g></svg><div class="dps-tip" id="dpsTip" hidden></div>`;
  chart.dataset.geo = JSON.stringify({W, L0, w, top, T0, h});
  // Tabelle: Schaden bis zur gewählten Sekunde, sortiert nach Build
  const vals = R.map(r=>r.tot[dpsAtIdx(r, dps.at)]), best = Math.max(...vals);
  const split = r => { const i = dpsAtIdx(r, dps.at), t = r.tot[i] || 1; return [r.ph[i]/t, r.mg[i]/t, r.tr[i]/t]; };
  $('#dpsTable').innerHTML = `<thead><tr><th>Build</th><th>Schaden bis ${dps.at} s</th><th>DPS</th><th>Aufteilung</th><th>Fähigkeiten</th><th>Gesamt ${dps.dur} s</th></tr></thead><tbody>${R.map((r, i)=>{
    const v = vals[i], sp = split(r), diff = best ? Math.round((v / best - 1) * 100) : 0, casts = r.casts * dps.at / dps.dur;
    return `<tr><td><span class="dps-tb" style="--bc:${DPS_COL[i]}"><b>${String.fromCharCode(65 + i)}</b>${dps.builds[i].map(dpsItemImg).join('') || '<small>ohne Items</small>'}</span></td>
      <td><b class="dps-big">${dpsN(v)}</b>${v===best && R.length > 1 ? '<span class="dps-best">Bester</span>' : R.length > 1 ? `<small class="dps-minus">${diff} %</small>` : ''}</td>
      <td>${dpsN(v / dps.at)}</td>
      <td><div class="dps-split" title="Physisch ${Math.round(sp[0]*100)} % · Magisch ${Math.round(sp[1]*100)} % · Absolut ${Math.round(sp[2]*100)} %"><i class="ph" style="flex:${sp[0]}"></i><i class="mg" style="flex:${sp[1]}"></i><i class="tr" style="flex:${sp[2]}"></i></div></td>
      <td>${fmtNum(Math.round(casts * 10) / 10)}×</td>
      <td>${dpsN(r.tot[r.tot.length - 1])}</td></tr>`; }).join('')}</tbody>`;
}
function dpsHover(e){
  const tip = $('#dpsTip'), hov = $('#dpsHov'), ch = $('#dpsChart'); if(!tip || !hov || !dps.res) return;
  if(!e){ tip.hidden = true; hov.innerHTML = ''; return; }
  const g = JSON.parse(ch.dataset.geo || '{}'), svg = ch.querySelector('svg'), r = svg.getBoundingClientRect();
  const x = (e.clientX - r.left) / r.width * g.W, t = Math.max(0, Math.min(dps.dur, (x - g.L0) / g.w * dps.dur));
  if(x < g.L0 - 10){ tip.hidden = true; hov.innerHTML = ''; return; }
  const ts = Math.round(t / SIM_DPS_STEP) * SIM_DPS_STEP, X = g.L0 + ts / dps.dur * g.w;
  const vals = dps.res.map(rr=>(dps.mode==='dps' ? dpsRate(rr) : rr.tot)[dpsAtIdx(rr, ts)]);
  hov.innerHTML = `<line x1="${X}" x2="${X}" y1="${g.T0}" y2="${g.T0 + g.h}" class="dps-hov-l"/>`;
  tip.hidden = false;
  tip.innerHTML = `<b>${fmtNum(ts)} s</b>${vals.map((v, i)=>`<span><i style="background:${DPS_COL[i]}"></i>${String.fromCharCode(65 + i)}: ${dpsN(v)}${dps.mode==='dps' ? '/s' : ''}</span>`).join('')}`;
  const px = (X / g.W) * r.width;
  tip.style.left = Math.min(r.width - tip.offsetWidth - 4, px + 12) + 'px';
}

function renderTools(sub, a, b){
  const key = ['rolldown','tierlist','drops','dps'].includes(sub) ? sub : '';
  document.querySelectorAll('#page-tools .tool-view').forEach(v=>v.hidden = v.dataset.tool!==key);
  if(key==='rolldown') rdMount();
  if(key==='tierlist') tmRoute(a, b);
  if(key==='drops') drRender();
  if(key==='dps') dpsMount();
}
let rdMounted = false;
function rdMount(){
  if(rdMounted) return; rdMounted = true;
  const app = $('#rdApp');
  if(!SHOP){ app.innerHTML = ornnSays(`Für Set ${TFT_DATA.set} fehlen mir noch die Shop-Chancen. Sobald sie feststehen, schmiede ich den Rechner nach.`); return; }
  app.innerHTML = `<div class="rd">
    <div class="card rd-in">
      <section><h3 class="rd-h"><b>1</b> Champion</h3>
        <div class="rd-costs" id="rdCosts">${[1,2,3,4,5].map(c=>`<button type="button" class="rd-cost" data-cost="${c}"><i class="cdot c${c}"></i>${c} Gold</button>`).join('')}</div>
        <div class="rd-champs" id="rdChamps"></div></section>
      <section><h3 class="rd-h"><b>2</b> Level &amp; Gold</h3>
        <label class="rd-f"><span>Level</span><b id="rdLvlV"></b><input type="range" id="rdLvl" min="1" max="11" value="${rd.lvl}"></label>
        <div class="rd-odds" id="rdOdds"></div>
        <label class="rd-f"><span>Gold zum Rollen</span><b id="rdGoldV"></b><input type="range" id="rdGold" min="0" max="150" step="2" value="${rd.gold}"></label></section>
      <section><h3 class="rd-h"><b>3</b> Pool</h3>
        <div class="rd-nums">
          <label class="rd-n"><span>Kopien schon draußen</span><input class="input" type="number" id="rdOutN" min="0" value="0"><small>bei allen Spielern – deine eingeschlossen</small></label>
          <label class="rd-n"><span>Andere <span id="rdCostLbl"></span>-Kosten draußen</span><input class="input" type="number" id="rdOther" min="0" value="0"><small>alle anderen Units dieser Kosten auf Boards und Bänken</small></label>
        </div></section>
      <section><h3 class="rd-h"><b>4</b> Ziel</h3>
        <div class="rd-targets" id="rdTargets">${Array.from({length:RD_MAXK}, (_,i)=>`<button type="button" data-k="${i+1}">${i+1}</button>`).join('')}</div>
        <p class="rd-hint">So viele Kopien willst du finden · 3 Kopien = ★★ · 9 Kopien = ★★★</p>
        <label class="rd-chk"><input type="checkbox" id="rdBuy" checked> Treffer kosten Gold <small>(wie im Spiel – ausschalten, um nur die Shops zu zählen)</small></label>
        <label class="rd-n"><span>XP bis zum nächsten Level <small>(optional)</small></span><input class="input" type="number" id="rdXp" min="0" placeholder="z. B. 28"><small>Dann vergleicht der Rechner: jetzt rollen oder erst leveln und dann rollen?</small></label></section>
    </div>
    <div class="card rd-res" id="rdRes" aria-live="polite"></div>
  </div>
  <div class="card rd-table-card"><h3 class="rd-h">Shop-Chancen Set ${TFT_DATA.set}</h3><div class="rd-table-wrap"><table class="rd-table" id="rdTable"></table></div>
    <p class="note">Chance pro Shop-Slot nach Level. Pool: ${SHOP.bag.map((b,i)=>`${i+1}-Kosten ${b} Kopien × ${SHOP_DISTINCT[i]} Champions`).join(' · ')}.</p></div>`;
  $('#rdCosts').addEventListener('click', e=>{ const b = e.target.closest('[data-cost]'); if(!b) return; rd.cost = +b.dataset.cost; rd.champ = ''; rdChamps(); rdUpdate(); });
  $('#rdChamps').addEventListener('click', e=>{ const b = e.target.closest('[data-rdc]'); if(!b) return; const c = champBy[b.dataset.rdc]; rd.champ = rd.champ===c.n ? '' : c.n; rd.cost = c.c; rdChamps(); rdUpdate(); });
  $('#rdTargets').addEventListener('click', e=>{ const b = e.target.closest('[data-k]'); if(!b) return; rd.target = +b.dataset.k; rdUpdate(); });
  $('#rdLvl').addEventListener('input', e=>{ rd.lvl = +e.target.value; rdUpdate(); });
  $('#rdGold').addEventListener('input', e=>{ rd.gold = +e.target.value; rdUpdate(); });
  $('#rdOutN').addEventListener('input', e=>{ rd.out = Math.max(0, parseInt(e.target.value)||0); rdUpdate(); });
  $('#rdOther').addEventListener('input', e=>{ rd.other = Math.max(0, parseInt(e.target.value)||0); rdUpdate(); });
  $('#rdBuy').addEventListener('change', e=>{ rd.buy = e.target.checked; rdUpdate(); });
  $('#rdXp').addEventListener('input', e=>{ rd.xp = e.target.value; rdUpdate(); });
  rdChamps(); rdUpdate();
}
function rdChamps(){
  $('#rdCosts').querySelectorAll('[data-cost]').forEach(b=>b.classList.toggle('on', +b.dataset.cost===rd.cost));
  $('#rdChamps').innerHTML = champions.filter(c=>c.c===rd.cost).map(c=>`<button type="button" class="rd-ch${c.n===rd.champ?' on':''}" data-rdc="${esc(c.n)}" title="${esc(c.n)}">${avatar(c.n, 44)}<span>${esc(c.n)}</span></button>`).join('');
}
function rdUpdate(){
  const bag = SHOP.bag[rd.cost-1], maxOther = bag * (SHOP_DISTINCT[rd.cost-1] - 1);
  rd.out = Math.min(rd.out, bag); rd.other = Math.min(rd.other, maxOther);
  const outEl = $('#rdOutN'), othEl = $('#rdOther');
  outEl.max = bag; othEl.max = maxOther;
  if(+outEl.value > bag) outEl.value = bag;
  if(+othEl.value > maxOther) othEl.value = maxOther;
  $('#rdCostLbl').textContent = rd.cost;
  $('#rdLvlV').textContent = rd.lvl; $('#rdGoldV').textContent = rd.gold + ' Gold';
  $('#rdTargets').querySelectorAll('[data-k]').forEach(b=>b.classList.toggle('on', +b.dataset.k===rd.target));
  const odds = SHOP.odds[rd.lvl-1];
  $('#rdOdds').innerHTML = odds.map((o,i)=>o ? `<span class="c${i+1}${i+1===rd.cost?' on':''}" style="flex:${o}" title="${i+1}-Kosten: ${o} %">${o >= 6 ? o + ' %' : ''}</span>` : '').join('');
  $('#rdTable').innerHTML = `<thead><tr><th>Level</th>${[1,2,3,4,5].map(c=>`<th class="${c===rd.cost?'on':''}"><i class="cdot c${c}"></i>${c}</th>`).join('')}</tr></thead><tbody>${SHOP.odds.map((r,i)=>`<tr class="${i+1===rd.lvl?'on':''}"><td>${i+1}</td>${r.map((o,c)=>`<td class="${c+1===rd.cost?'on':''}">${o ? o + ' %' : '–'}</td>`).join('')}</tr>`).join('')}</tbody>`;

  const who = rd.champ ? esc(rd.champ) : `deine ${rd.cost}-Kosten-Unit`;
  const left = bag - rd.out;
  if(left < rd.target){ $('#rdRes').innerHTML = viSays(`Es sind nur noch ${left} Kopien im Pool – ${rd.target} kannst du nicht mehr finden.`); return; }
  if(!odds[rd.cost-1]){ $('#rdRes').innerHTML = viSays(`Auf Level ${rd.lvl} tauchen keine ${rd.cost}-Kosten-Units im Shop auf. Erst leveln!`); return; }

  const dist = rdDist(rd.lvl, rd.cost, rd.out, rd.other, rd.gold, rd.buy);
  const P = rdAtLeast(dist, rd.target), exp = dist.reduce((a,v,k)=>a + v*k, 0);
  // Vergleich: erst leveln (4 Gold = 4 XP), dann mit dem Rest rollen
  const xp = parseInt(rd.xp), lvlGold = xp > 0 ? Math.ceil(xp/4) * 4 : 0;
  let cmp = null, cmpNote = '';
  if(xp > 0 && rd.lvl < 11){
    if(rd.gold >= lvlGold){ cmp = rdDist(rd.lvl+1, rd.cost, rd.out, rd.other, rd.gold - lvlGold, rd.buy); }
    else cmpNote = `Zum Leveln brauchst du ${lvlGold} Gold – du hast nur ${rd.gold}.`;
  }
  const pRoll = 1 - Math.pow(1 - rdSlotP(rd.lvl, rd.cost, rd.out, rd.other, 0), 5);
  const need = [0.5, 0.8, 0.95].map(q=>[q, rdGoldFor(q)]);
  const bars = Array.from({length:RD_MAXK}, (_,i)=>{
    const k = i+1, a = rdAtLeast(dist, k), b = cmp ? rdAtLeast(cmp, k) : null;
    return `<div class="rd-bar${k===rd.target?' on':''}" title="Mindestens ${k}×: ${rdPct(a)}${b!==null?' · nach Leveln: '+rdPct(b):''}">
      <div class="rd-cols"><span class="rd-fill" style="height:${a*100}%"></span>${b!==null?`<span class="rd-fill alt" style="height:${b*100}%"></span>`:''}</div>
      <b>${rdPct(a)}</b><small>${k}×</small></div>`;
  }).join('');
  let verdict = '';
  if(cmp){
    const Q = rdAtLeast(cmp, rd.target), diff = Math.round((Q - P) * 100);
    verdict = `<div class="rd-cmp ${diff > 0 ? 'up' : 'down'}"><b>${diff > 0 ? 'Erst leveln lohnt sich' : diff < 0 ? 'Lieber jetzt rollen' : 'Kein Unterschied'}</b>
      <span>Auf Level ${rd.lvl+1} (${lvlGold} Gold fürs Leveln, ${rd.gold - lvlGold} Gold zum Rollen): ${rdPct(Q)} statt ${rdPct(P)}${diff ? ` (${diff > 0 ? '+' : '−'}${Math.abs(diff)} Prozentpunkte)` : ''}.</span></div>`;
  } else if(cmpNote) verdict = `<div class="rd-cmp">${esc(cmpNote)}</div>`;

  $('#rdRes').innerHTML = `
    <div class="rd-hero">
      <div class="rd-ring" style="--p:${(P*100).toFixed(1)}"><b>${rdPct(P)}</b><small>Chance</small></div>
      <div><span class="rd-kicker">${rd.champ ? avatar(rd.champ, 26) : ''}Level ${rd.lvl} · ${rd.gold} Gold</span>
        <h3>Mindestens ${rd.target}× ${who}</h3>
        <p>Im Schnitt findest du <b>${exp.toLocaleString(LOC, {maximumFractionDigits:1})}</b> Kopien. In einem Roll (5 Slots) taucht ${who} mit <b>${rdPct(pRoll)}</b> Chance mindestens einmal auf.</p></div>
    </div>
    ${verdict}
    <h4 class="rd-sub">Chance auf mindestens …</h4>
    <div class="rd-bars">${bars}</div>
    ${cmp ? `<div class="rd-legend"><span><i class="rd-fill"></i>jetzt rollen (Level ${rd.lvl})</span><span><i class="rd-fill alt"></i>erst leveln (Level ${rd.lvl+1})</span></div>` : ''}
    <h4 class="rd-sub">Wie viel Gold brauchst du für ${rd.target}×?</h4>
    <div class="rd-need">${need.map(([q, g])=>`<div><small>${q*100} % Chance</small><b>${g === null ? 'über 500' : g + ' Gold'}</b></div>`).join('')}</div>
    <p class="note">Gerechnet wird Shop für Shop mit dem geteilten Pool aller Spieler: Jede gefundene Kopie fehlt danach im Pool. Nicht berücksichtigt sind Effekte, die Shops verändern (z. B. Augments oder Wisps).</p>`;
}

/* ================= TOOLS: Tierlist-Maker ================= */
// Einträge als Schlüssel: c:<Champion> · t:<Trait> · a:<Augment-ID> · i:<Item-ID>
const TM_KEY = 'tftfreaks_tlmaker_v1_' + TFT_DATA.set;
const TM_COLORS = ['#ff4040','#ff9a2e','#ffd92e','#3ddc5a','#2f80ed','#a855f7','#ec4899','#8a94a8'];
const TM_DEFAULT = () => ({title:'', rows:[['S',0],['A',1],['B',2],['C',3],['X',4]].map(([l,c])=>({l, c, items:[]}))});
// Tabs der Toolbox: Items, Artefakte und Embleme sind alles Item-Einträge (i:…) – nur anders gefiltert.
// Traits (t:…) haben keinen Tab mehr, werden in älteren geteilten Tierlists aber weiter angezeigt.
const TM_TABS = [['c','Champions'],['i','Items'],['r','Artefakte'],['e','Embleme'],['a','Augments']];
const TM_ITEM_TABS = {i:['craft','radiant','component'], r:['artifact'], e:['emblem']};
// Augments: statt Sortierung eine Auswahl nach Stufe (Silber / Gold / Prismatisch)
const TM_SORTS = {c:[['cost','Kosten'],['name','Name'],['origin','Ursprung'],['class','Klasse']], t:[['type','Typ'],['name','Name']], a:[['1','Silber'],['2','Gold'],['3','Prismatisch']], i:[['cat','Kategorie'],['name','Name']], r:[['name','Name']], e:[['name','Name']]};
// Taktiker-Krone, -Umhang und -Schild geben nur +1 Teamgröße – keine Embleme
const tmIsTactician = it => /Tactician/i.test(it.id + ' ' + it.en);
const AUG_BY = Object.fromEntries(AUGS.map(x=>[x.id, x])), ITEM_BY = Object.fromEntries(ITEMS.map(x=>[x.id, x])), TRAIT_BY = Object.fromEntries(traits.map(x=>[x.n, x]));
// feste Reihenfolge für Teilen-Links (Index statt langer IDs)
const TM_ORDER = {c:champions.map(x=>x.n).sort(), t:traits.map(x=>x.n).sort(), a:AUGS.map(x=>x.id).sort(), i:ITEMS.map(x=>x.id).sort()};
const TM_IDX = Object.fromEntries(Object.entries(TM_ORDER).map(([k, arr])=>[k, Object.fromEntries(arr.map((v,i)=>[v,i]))]));
let tm = null, tmMode = 'build', tmTab = 'c', tmSort = {c:'cost', t:'type', a:'1', i:'cat', r:'name', e:'name'}, tmSel = null, tmShared = false, tmBuilt = false, tmDrag = null;

function tmInfo(key){
  const ty = key[0], id = key.slice(2);
  if(ty==='c'){ const c = champBy[id]; return c && {name:id, html:avatar(id, 46)}; }
  if(ty==='t'){ const t = TRAIT_BY[id]; return t && {name:id, html:traitHex(id, t.bp.length===1 ? 'unique' : 'base', 44)}; }
  if(ty==='a'){ const x = AUG_BY[id]; return x && {name:x.en, html:`<img src="${augImg(x)}" alt="" loading="lazy">`}; }
  if(ty==='i'){ const x = ITEM_BY[id]; return x && {name:x.en, html:`<img src="${x.img}" alt="" loading="lazy">`}; }
  return null;
}
const tmTile = key => { const f = tmInfo(key); return f ? `<div class="tm-tile tm-${key[0]}${tmSel===key?' sel':''}" draggable="${tmMode==='build'}" data-k="${esc(key)}" title="${esc(f.name)}">${f.html}</div>` : ''; };
const tmUsed = () => new Set(tm.rows.flatMap(r=>r.items));

function tmEncode(s){
  const rows = s.rows.map(r=>[r.l, r.c, r.items.map(k=>{ const i = (TM_IDX[k[0]]||{})[k.slice(2)]; return i===undefined ? '' : k[0] + i.toString(36); }).filter(Boolean).join('.')]);
  return btoa(unescape(encodeURIComponent(JSON.stringify({t:s.title||'', r:rows})))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
function tmDecode(code){
  try{
    const o = JSON.parse(decodeURIComponent(escape(atob(code.replace(/-/g,'+').replace(/_/g,'/')))));
    const rows = (o.r||[]).slice(0, 12).map(([l, c, list])=>({l:String(l||'?').slice(0,12), c:Math.abs(+c||0) % TM_COLORS.length,
      items:String(list||'').split('.').filter(Boolean).map(tok=>{ const ty = tok[0], v = (TM_ORDER[ty]||[])[parseInt(tok.slice(1), 36)]; return v ? ty + ':' + v : null; }).filter(Boolean)}));
    return rows.length ? {title:String(o.t||'').slice(0,40), rows} : null;
  }catch(e){ return null; }
}
function tmLoad(){ try{ const s = JSON.parse(localStorage.getItem(TM_KEY)); if(s && Array.isArray(s.rows) && s.rows.length) return s; }catch(e){} return TM_DEFAULT(); }
function tmSave(){ if(tmShared) return; try{ localStorage.setItem(TM_KEY, JSON.stringify(tm)); }catch(e){} }
// Änderung an einer geteilten Tierlist → wird zur eigenen Kopie
function tmChanged(){ if(tmShared){ tmShared = false; setUrl('/tools/tierlist'); } tmSave(); tmRender(); }
function tmToast(msg){ const t = $('#tmToast'); t.textContent = msg; t.classList.add('show'); clearTimeout(tmToast.h); tmToast.h = setTimeout(()=>t.classList.remove('show'), 2200); }

function tmRoute(a, b){
  // geteilte Links: /tools/tierlist/<Set>/<Code>
  if(a && /^\d+$/.test(a) && b){
    if(+a !== TFT_DATA.set){ try { localStorage.setItem('tftfreaks_set', a); } catch(e){} location.reload(); return; }
    const st = tmDecode(b);
    if(st){ tm = st; tmShared = true; tmMode = 'view'; }
    else { setUrl('/tools/tierlist'); }
  } else if(!tm || tmShared){ tm = tmLoad(); tmShared = false; }
  if(!tmBuilt) tmBuild();
  tmRender();
}
function tmBuild(){
  tmBuilt = true;
  $('#tmApp').innerHTML = `<div class="tm">
    <div class="tm-top">
      <label class="tm-title"><span>Tierlist</span><i aria-hidden="true">›</i><input id="tmTitle" maxlength="40" placeholder="Dein Titel" aria-label="Titel der Tierlist"></label>
      <div class="tm-mode" id="tmMode" role="group" aria-label="Modus"><button type="button" data-mode="view">Ansehen</button><button type="button" data-mode="build">Bearbeiten</button></div>
    </div>
    <div class="tm-shared" id="tmShared" hidden><span>Geteilte Tierlist – zum Ansehen.</span><button type="button" class="btn btn-ghost" id="tmCopyOwn">Als eigene Kopie bearbeiten</button></div>
    <div class="tm-body">
      <div class="tm-rows" id="tmRows"></div>
      <aside class="tm-box" id="tmBox">
        <div class="tm-box-head"><h3>Toolbox</h3>
          <div class="tm-acts"><button type="button" id="tmAddRow">+ Zeile</button><button type="button" id="tmClear">Alles leeren</button><button type="button" id="tmShare" class="hl">Teilen</button></div></div>
        <div class="tm-tabs" id="tmTabs">${TM_TABS.map(([k,l])=>`<button type="button" data-tab="${k}">${l}</button>`).join('')}</div>
        <input class="input" id="tmSearch" placeholder="Suchen …" aria-label="Suchen">
        <div class="tm-sorts" id="tmSorts"></div>
        <div class="tm-pool tm-drop" id="tmPool" data-r="-1"></div>
        <p class="tm-tip">Ziehen zum Einsortieren · am Handy: antippen, dann Zeile antippen · Doppelklick nimmt einen Eintrag wieder raus</p>
      </aside>
    </div>
    <div class="tm-toast" id="tmToast" role="status"></div>
  </div>`;
  const app = $('#tmApp');
  $('#tmTitle').addEventListener('input', e=>{ tm.title = e.target.value; if(tmShared){ tmShared = false; setUrl('/tools/tierlist'); $('#tmShared').hidden = true; } tmSave(); });
  $('#tmMode').addEventListener('click', e=>{ const b = e.target.closest('[data-mode]'); if(!b) return; tmMode = b.dataset.mode; tmSel = null; tmRender(); });
  $('#tmCopyOwn').addEventListener('click', ()=>{ tmMode = 'build'; tmChanged(); tmToast('Kopie angelegt – deine Änderungen werden gespeichert.'); });
  $('#tmTabs').addEventListener('click', e=>{ const b = e.target.closest('[data-tab]'); if(!b) return; tmTab = b.dataset.tab; tmRenderPool(); });
  $('#tmSorts').addEventListener('click', e=>{ const b = e.target.closest('[data-sort]'); if(!b) return; tmSort[tmTab] = b.dataset.sort; tmRenderPool(); });
  $('#tmSearch').addEventListener('input', tmRenderPool);
  $('#tmAddRow').addEventListener('click', ()=>{ if(tm.rows.length >= 12) return tmToast('Maximal 12 Zeilen.'); const used = new Set(tm.rows.map(r=>r.l)); tm.rows.push({l:['D','E','F','?'].find(x=>!used.has(x)) || '?', c:(tm.rows.length) % TM_COLORS.length, items:[]}); tmChanged(); });
  $('#tmClear').addEventListener('click', ()=>{ if(!tm.rows.some(r=>r.items.length) || confirm('Alle Einträge aus der Tierlist entfernen?')){ tm.rows.forEach(r=>r.items = []); tmChanged(); } });
  $('#tmShare').addEventListener('click', ()=>{
    const url = siteUrl('/tools/tierlist/' + TFT_DATA.set + '/' + tmEncode(tm));
    const ok = ()=>tmToast('Link kopiert – wer ihn öffnet, sieht deine Tierlist.');
    if(navigator.clipboard) navigator.clipboard.writeText(url).then(ok, ()=>prompt('Link kopieren:', url)); else prompt('Link kopieren:', url);
  });
  // Zeilen-Steuerung (Name, Farbe, verschieben, löschen)
  $('#tmRows').addEventListener('click', e=>{
    const ctl = e.target.closest('[data-act]');
    if(ctl && tmMode==='build'){
      const i = +ctl.closest('.tm-row').dataset.r, r = tm.rows[i], act = ctl.dataset.act;
      if(act==='name'){ const v = prompt('Name der Zeile:', r.l); if(v!==null && v.trim()){ r.l = v.trim().slice(0,12); tmChanged(); } }
      if(act==='color'){ r.c = (r.c + 1) % TM_COLORS.length; tmChanged(); }
      if(act==='up' && i > 0){ [tm.rows[i-1], tm.rows[i]] = [tm.rows[i], tm.rows[i-1]]; tmChanged(); }
      if(act==='down' && i < tm.rows.length-1){ [tm.rows[i+1], tm.rows[i]] = [tm.rows[i], tm.rows[i+1]]; tmChanged(); }
      if(act==='del'){ if(tm.rows.length <= 1) return tmToast('Eine Zeile muss bleiben.'); if(!r.items.length || confirm(`Zeile „${r.l}“ löschen? Die Einträge gehen zurück in die Toolbox.`)){ tm.rows.splice(i, 1); tmChanged(); } }
      return;
    }
  });
  // Antippen: auswählen, dann Ziel antippen (Handy und Maus)
  app.addEventListener('click', e=>{
    if(tmMode!=='build' || e.target.closest('[data-act]')) return;
    const tile = e.target.closest('.tm-tile'), zone = e.target.closest('.tm-drop');
    if(tile && (!tmSel || tmSel===tile.dataset.k)){ tmSel = tmSel===tile.dataset.k ? null : tile.dataset.k; tmRender(); return; }
    if(tmSel && zone){ const k = tmSel; tmSel = null; tmPlace(k, +zone.dataset.r, tile ? tile.dataset.k : null); return; }
  });
  app.addEventListener('dblclick', e=>{ const tile = e.target.closest('.tm-rows .tm-tile'); if(tile && tmMode==='build'){ tmSel = null; tmPlace(tile.dataset.k, -1); } });
  // Drag & Drop
  app.addEventListener('dragstart', e=>{ const tile = e.target.closest('.tm-tile'); if(!tile || tmMode!=='build') return; tmDrag = tile.dataset.k; e.dataTransfer.effectAllowed = 'move'; try{ e.dataTransfer.setData('text/plain', tmDrag); }catch(_){} tile.classList.add('dragging'); });
  app.addEventListener('dragend', ()=>{ tmDrag = null; app.querySelectorAll('.dragging,.over').forEach(x=>x.classList.remove('dragging','over')); });
  app.addEventListener('dragover', e=>{ const zone = e.target.closest('.tm-drop'); if(!zone || !tmDrag) return; e.preventDefault(); app.querySelectorAll('.tm-drop.over').forEach(z=>z!==zone && z.classList.remove('over')); zone.classList.add('over'); });
  app.addEventListener('dragleave', e=>{ const zone = e.target.closest('.tm-drop'); if(zone && !zone.contains(e.relatedTarget)) zone.classList.remove('over'); });
  app.addEventListener('drop', e=>{
    const zone = e.target.closest('.tm-drop'); if(!zone || !tmDrag) return; e.preventDefault();
    const tile = e.target.closest('.tm-tile');
    let before = null;
    if(tile && tile.dataset.k !== tmDrag){ const rc = tile.getBoundingClientRect(); before = e.clientX < rc.left + rc.width/2 ? tile.dataset.k : (tile.nextElementSibling && tile.nextElementSibling.dataset.k) || null; }
    tmPlace(tmDrag, +zone.dataset.r, before); tmDrag = null;
  });
}
// Eintrag in Zeile r einsortieren (vor `before`), r = -1 → zurück in die Toolbox
function tmPlace(key, r, before){
  tm.rows.forEach(row=>{ row.items = row.items.filter(k=>k!==key); });
  if(r >= 0 && tm.rows[r]){ const list = tm.rows[r].items, i = before ? list.indexOf(before) : -1; if(i >= 0) list.splice(i, 0, key); else list.push(key); }
  tmChanged();
}
function tmRender(){
  const build = tmMode==='build';
  $('#tmApp').querySelector('.tm').classList.toggle('view', !build);
  $('#tmMode').querySelectorAll('[data-mode]').forEach(b=>b.classList.toggle('on', b.dataset.mode===tmMode));
  $('#tmShared').hidden = !tmShared;
  const ti = $('#tmTitle'); if(document.activeElement !== ti) ti.value = tm.title || ''; ti.readOnly = !build;
  $('#tmRows').innerHTML = tm.rows.map((r, i)=>`<div class="tm-row" data-r="${i}" style="--rc:${TM_COLORS[r.c]}">
      <div class="tm-label"><button type="button" data-act="name" title="Umbenennen" ${build?'':'tabindex="-1"'}>${esc(r.l)}</button>
        ${build ? `<div class="tm-ctl"><button type="button" data-act="up" title="Nach oben" aria-label="Nach oben">▲</button><button type="button" data-act="color" title="Farbe wechseln" aria-label="Farbe wechseln">●</button><button type="button" data-act="down" title="Nach unten" aria-label="Nach unten">▼</button><button type="button" data-act="del" title="Zeile löschen" aria-label="Zeile löschen">✕</button></div>` : ''}</div>
      <div class="tm-drop" data-r="${i}">${r.items.map(tmTile).join('') || (build ? '<span class="tm-empty">Hierher ziehen</span>' : '')}</div>
    </div>`).join('');
  tmRenderPool();
}
function tmRenderPool(){
  if(tmMode!=='build') return;
  $('#tmTabs').querySelectorAll('[data-tab]').forEach(b=>b.classList.toggle('on', b.dataset.tab===tmTab));
  $('#tmSorts').innerHTML = TM_SORTS[tmTab].map(([k,l])=>`<button type="button" data-sort="${k}" class="${tmSort[tmTab]===k?'on':''}">${l}</button>`).join('');
  const q = $('#tmSearch').value.toLowerCase().trim(), used = tmUsed(), s = tmSort[tmTab];
  const firstOf = (c, cat) => c.t.map(t=>TRAIT_BY[t]).filter(t=>t && t.cat===cat).map(t=>t.n)[0] || '~';
  let list;
  if(tmTab==='c'){
    list = champions.filter(c=>!q || c.n.toLowerCase().includes(q) || c.t.some(t=>t.toLowerCase().includes(q)));
    list.sort(s==='name' ? (a,b)=>a.n.localeCompare(b.n) : s==='origin' ? (a,b)=>firstOf(a,'origin').localeCompare(firstOf(b,'origin')) || a.c-b.c : s==='class' ? (a,b)=>firstOf(a,'class').localeCompare(firstOf(b,'class')) || a.c-b.c : (a,b)=>a.c-b.c || a.n.localeCompare(b.n));
    list = list.map(c=>'c:'+c.n);
  } else if(tmTab==='t'){
    list = traits.filter(t=>!q || t.n.toLowerCase().includes(q)).sort(s==='name' ? (a,b)=>a.n.localeCompare(b.n) : (a,b)=>(a.cat===b.cat ? 0 : a.cat==='origin' ? -1 : 1) || a.n.localeCompare(b.n)).map(t=>'t:'+t.n);
  } else if(tmTab==='a'){
    list = AUGS.filter(a=>String(a.lv||1)===s && !AUG_DUP.has(a.id) && (!q || a.en.toLowerCase().includes(q) || (a.de||'').toLowerCase().includes(q))).sort((a,b)=>a.en.localeCompare(b.en)).map(a=>'a:'+a.id);
  } else {
    const cats = TM_ITEM_TABS[tmTab] || TM_ITEM_TABS.i, ord = Object.fromEntries(cats.map((k,i)=>[k,i]));
    list = ITEMS.filter(i=>cats.includes(itemCat(i)) && !(tmTab==='e' && tmIsTactician(i)) && (!q || i.en.toLowerCase().includes(q) || (i.de||'').toLowerCase().includes(q)))
      .sort(s==='cat' ? (a,b)=>(ord[itemCat(a)]??9)-(ord[itemCat(b)]??9) || a.en.localeCompare(b.en) : (a,b)=>a.en.localeCompare(b.en)).map(i=>'i:'+i.id);
  }
  const free = list.filter(k=>!used.has(k));
  $('#tmPool').innerHTML = free.map(tmTile).join('') || `<span class="tm-empty">${list.length ? 'Alles einsortiert!' : 'Nichts gefunden.'}</span>`;
}

/* ================= TOOLS: Item-Drop-Rechner ================= */
// Komponenten aus Creep-Runden kommen aus einem Item-Pool: gezogene Komponenten fehlen darin, vor jeder weiteren Creep-Stage
// kommt von jeder Komponente eine dazu. Beute-Tabellen pro Stage stehen in data/custom-<Set>.js (loot).
const LOOT = TFT_CUSTOM_SET.loot && TFT_CUSTOM_SET.loot.stages ? TFT_CUSTOM_SET.loot : null;
const DR_KEY = 'tftfreaks_drops_v1_' + TFT_DATA.set;
const DR_COMPS = COMPONENTS.filter(id=>!/spatula|fryingpan/i.test(normN(itemById[id].en))).slice(0, 8);   // die 8 Komponenten im Item-Pool
const DR_STAGES = [[1,'Stage 1','Minions'],[2,'2-7','Creeps'],[3,'3-7','Creeps'],[4,'4-7','Creeps'],[5,'ab 5-7','Xerath']];
const DR_NEW = () => ({stage:1, start:1, src:'drop', drops:{1:[], 2:[], 3:[], 4:[]}, extra:[]});
let dr = (()=>{ try { const s = JSON.parse(localStorage.getItem(DR_KEY)); if(s && s.drops) return Object.assign(DR_NEW(), s); } catch(e){} return DR_NEW(); })();
const drSave = () => { try { localStorage.setItem(DR_KEY, JSON.stringify(dr)); } catch(e){} };
// Item-Pool nach allen Drops bis einschließlich Stage `upto`
function drBag(upto){
  const bag = Object.fromEntries(DR_COMPS.map(id=>[id, dr.start]));
  let warn = false;
  for(let s = 1; s <= Math.min(4, upto); s++){
    if(s > 1) DR_COMPS.forEach(id=>{ bag[id]++; });
    (dr.drops[s]||[]).forEach(id=>{ if(bag[id] > 0) bag[id]--; else warn = true; });
  }
  return {bag, warn, n:Object.values(bag).reduce((a,b)=>a + b, 0)};
}
// Wie viele zufällige Komponenten kommen in Stage s noch, wenn schon d gedroppt sind? (nach Beute-Tabelle)
function drRest(s, d){
  const rows = (LOOT && LOOT.stages[s]) || [], out = {}; let tot = 0;
  rows.forEach(r=>{ if(r[4] >= d){ out[r[4] - d] = (out[r[4] - d]||0) + r[7]; tot += r[7]; } });
  if(!tot) return null;
  Object.keys(out).forEach(k=>{ out[k] /= tot; });
  return out;
}
// Chance auf mindestens eine Komponente (c im Pool von n), wenn k gezogen werden – ohne Zurücklegen
const drAtLeast1 = (c, n, k) => { if(!c || !k) return 0; let none = 1; for(let i = 0; i < k; i++) none *= Math.max(0, n - c - i) / (n - i); return 1 - none; };
const drMix = (dist, c, n) => dist ? Object.entries(dist).reduce((s, [k, p])=>s + p * drAtLeast1(c, n, Math.min(+k, n)), 0) : null;
const drPct = p => p == null ? '–' : rdPct(p);
const drIcon = (id, size=34) => { const it = itemById[id]; return it ? `<img src="${it.img}" alt="${esc(it.de || it.en)}" title="${esc(it.de || it.en)}" width="${size}" height="${size}">` : ''; };

function drRender(){
  const app = $('#drApp'); if(!app) return;
  if(!LOOT){ app.innerHTML = ornnSays(`Für Set ${TFT_DATA.set} fehlen mir noch die Beute-Tabellen. Sobald sie feststehen, schmiede ich den Rechner nach.`); return; }
  const s = dr.stage, late = s >= 5, cur = dr.drops[s] || [];
  const {bag, warn, n} = drBag(s);
  const rest = late ? null : drRest(s, cur.length);
  const restK = rest ? Object.entries(rest).reduce((a, [k, p])=>a + k*p, 0) : 0;
  const nextS = s + 1, nextBag = Object.fromEntries(DR_COMPS.map(id=>[id, bag[id] + 1])), nextN = n + DR_COMPS.length;
  const nextDist = nextS <= 4 ? drRest(nextS, 0) : null;
  const stageName = DR_STAGES.find(x=>x[0]===s)[1];
  // Stage-Leiste
  const tabs = DR_STAGES.map(([k, l, sub])=>`<button type="button" class="dr-tab${k===s ? ' on' : ''}" data-drstage="${k}"><b>${l}</b><small>${sub}</small>${k <= 4 && (dr.drops[k]||[]).length ? `<i>${dr.drops[k].length}</i>` : ''}</button>`).join('');
  // Eingabe
  const pickIds = dr.src==='drop' ? DR_COMPS : COMPONENTS;
  const pick = late && dr.src==='drop' ? `<p class="dr-note">${esc(LOOT.late)}</p>`
    : `<div class="dr-pick">${pickIds.map(id=>{ const it = itemById[id]; const left = dr.src==='drop' ? bag[id] : null;
        return `<button type="button" class="dr-c${left===0 ? ' empty' : ''}" data-dradd="${id}" title="${esc(it.de)} hinzufügen">${drIcon(id, 44)}<span>${esc(it.de)}</span>${left != null ? `<em>${left}× im Pool</em>` : ''}</button>`; }).join('')}</div>`;
  const got = [1,2,3,4].map(k=>{ const l = dr.drops[k]||[]; return `<div class="dr-row${k===s ? ' on' : ''}"><span>${DR_STAGES[k-1][1]}</span><div>${l.length ? l.map((id, i)=>`<button type="button" class="dr-chip" data-drdel="${k}:${i}" title="Entfernen">${drIcon(id, 28)}</button>`).join('') : '<small>–</small>'}</div></div>`; }).join('')
    + `<div class="dr-row"><span>Sonstiges</span><div>${dr.extra.length ? dr.extra.map((id, i)=>`<button type="button" class="dr-chip" data-drdel="x:${i}" title="Entfernen">${drIcon(id, 28)}</button>`).join('') : '<small>Karussell, Amboss, Augments …</small>'}</div></div>`;
  // Wahrscheinlichkeiten
  const rows = DR_COMPS.map(id=>{
    const it = itemById[id], c = bag[id];
    const pNext = late || !n ? null : c / n;
    const pRest = late || !rest || restK < 0.01 ? null : drMix(rest, c, n);
    const pNextStage = nextDist ? drMix(nextDist, nextBag[id], nextN) : null;
    return {id, it, c, pNext, pRest, pNextStage};
  });
  const best = Math.max(...rows.map(r=>r.pNext || 0));
  const dots = c => '<span class="dr-dots">' + Array.from({length:Math.max(c, 1)}, (_, i)=>`<i class="${i < c ? 'on' : ''}"></i>`).join('') + '</span>';
  const table = `<table class="dr-table"><thead><tr><th>Komponente</th><th>Im Pool</th><th>Nächster Drop</th><th>Mind. 1 im Rest von ${esc(stageName)}</th><th>Mind. 1 in ${nextS <= 4 ? DR_STAGES[nextS-1][1] : '–'}</th></tr></thead><tbody>${rows.map(r=>
    `<tr class="${r.pNext && r.pNext===best ? 'best' : ''}${r.c===0 ? ' gone' : ''}"><td><span class="dr-name">${drIcon(r.id, 30)}${esc(r.it.de)}</span></td><td>${dots(r.c)} <b>${r.c}</b></td><td><span class="dr-bar"><i style="width:${(r.pNext||0)*100}%"></i></span>${drPct(r.pNext)}</td><td>${drPct(r.pRest)}</td><td>${drPct(r.pNextStage)}</td></tr>`).join('')}</tbody></table>`;
  const restTxt = late ? 'Ab Stage 5 gibt es keine zufälligen Komponenten mehr.'
    : !rest ? `Mehr Komponenten als laut Tabelle möglich (max. ${Math.max(...LOOT.stages[s].map(r=>r[4]))}) – prüf deine Eingabe.`
    : restK < 0.01 ? `In ${esc(stageName)} kommt laut Tabelle keine weitere Komponente – weiter zu ${nextS <= 4 ? DR_STAGES[nextS-1][1] : 'Stage 5'}.`
    : `Noch erwartet in ${esc(stageName)}: <b>${fmtNum(Math.round(restK*10)/10)}</b> Komponente${Math.abs(restK-1) < 0.05 ? '' : 'n'} (${Object.entries(rest).filter(([,p])=>p > 0.0005).map(([k, p])=>`${k}: ${drPct(p)}`).join(' · ')}).`;
  // Beute dieser Stage (bedingt auf die schon gedroppten Komponenten)
  let loot = '';
  if(!late){
    const all = LOOT.stages[s], ok = all.filter(r=>r[4] >= cur.length), tot = ok.reduce((a, r)=>a + r[7], 0) || 1;
    const P = f => ok.filter(f).reduce((a, r)=>a + r[7], 0) / tot;
    const cnt = {}; all.forEach(r=>{ cnt[r[4]] = (cnt[r[4]]||0) + r[7]; });
    const maxC = Math.max(...Object.values(cnt));
    const orbName = r => [r[0] && `${r[0]}× Silber`, r[1] && `${r[1]}× Blau`, r[2] && `${r[2]}× Gold`, r[3] && `${r[3]}× Prismatic`, `${r[4]} Komponente${r[4]===1 ? '' : 'n'}`, r[5] && 'Komponenten-Amboss'].filter(Boolean).join(' + ');
    loot = `<div class="dr-orbs">
        <div class="dr-orb prism"><span>Prismatic-Orb</span><b>${drPct(P(r=>r[3] > 0))}</b></div>
        <div class="dr-orb gold"><span>Gold-Orb</span><b>${drPct(P(r=>r[2] > 0))}</b></div>
        <div class="dr-orb blue"><span>Blau-Orb</span><b>${drPct(P(r=>r[1] > 0))}</b></div>
        <div class="dr-orb up"><span>Aufgewertet</span><b>${drPct(P(r=>r[6] > 0))}</b></div>
      </div>
      ${cur.length ? `<p class="dr-note">Schon berücksichtigt: Du hast in ${esc(stageName)} ${cur.length} Komponente${cur.length===1 ? '' : 'n'} – Kombinationen mit weniger fallen raus.</p>` : ''}
      <h4 class="dr-h4">Zufällige Komponenten in ${esc(stageName)}</h4>
      <div class="dr-counts">${Object.keys(cnt).sort((a,b)=>a-b).map(k=>`<div class="${+k < cur.length ? 'off' : ''}"><span style="height:${cnt[k]/maxC*100}%"></span><b>${fmtNum(Math.round(cnt[k]*10)/10)} %</b><small>${k}</small></div>`).join('')}</div>
      <details class="dr-more"><summary>Alle Beute-Kombinationen</summary><table class="dr-table small"><tbody>${all.slice().sort((a,b)=>b[7]-a[7]).map(r=>`<tr class="${r[4] < cur.length ? 'gone' : ''}${r[3] ? ' prism' : ''}"><td>${orbName(r)}${r[6] ? ' <span class="dr-up" title="nur in einer aufgewerteten Runde">aufgewertet</span>' : ''}</td><td>${fmtNum(r[7])} %</td></tr>`).join('')}</tbody></table></details>`;
  } else loot = `<p class="dr-note">${esc(LOOT.late)}</p>`;
  // Deine Komponenten und was du daraus bauen kannst
  const mine = [...[1,2,3,4].flatMap(k=>dr.drops[k]||[]), ...dr.extra];
  const have = {}; mine.forEach(id=>{ have[id] = (have[id]||0) + 1; });
  const craft = [];
  Object.keys(have).forEach(a=>Object.keys(have).forEach(b=>{ if(a > b || (a===b && have[a] < 2)) return; const r = recipeOf[[a, b].sort().join('|')]; if(r && !craft.includes(r)) craft.push(r); }));
  const orbTbl = o => o ? `<div class="dr-orbtbl"><h4>${esc(o.label)} <small>${esc(o.note)} · Wert ${esc(o.wert)}</small></h4><table class="dr-table small"><tbody>${o.items.map(([t, p])=>`<tr><td>${esc(t)}</td><td>${fmtNum(p)} %</td></tr>`).join('')}</tbody></table></div>` : '';
  app.innerHTML = `<div class="dr">
    <div class="dr-top"><div class="dr-tabs">${tabs}</div>
      <button class="dr-new" type="button" data-drreset title="Alle Eingaben löschen und mit einem neuen Spiel starten"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/></svg>Neues Spiel</button></div>
    <div class="dr-grid">
      <section class="card dr-in">
        <div class="dr-head"><h3>Was hast du in ${esc(stageName)} bekommen?</h3>
          <div class="bp-pills"><button type="button" data-drsrc="drop" class="${dr.src==='drop' ? 'on' : ''}">Creep-Drop</button><button type="button" data-drsrc="extra" class="${dr.src==='extra' ? 'on' : ''}">Sonstiges</button></div></div>
        <p class="dr-note">${dr.src==='drop' ? 'Klick die Komponenten an, die gerade gedroppt sind – sie werden aus dem Item-Pool genommen.' : 'Komponenten aus Karussell, Ambossen oder Augments: zählen für deine Items, aber nicht für den Item-Pool.'}</p>
        ${pick}
        ${warn ? '<p class="dr-warn">Eine Komponente ist öfter gedroppt, als laut Pool-Regel möglich. Stell unten den Start-Pool auf „2 von jeder“ um, falls das in deinem Spiel so war.</p>' : ''}
        <div class="dr-got">${got}</div>
        <div class="dr-actions">
          ${s < 5 ? `<button class="btn btn-primary" type="button" data-drstage="${s+1}">Weiter zu ${DR_STAGES[s][1]} →</button>` : ''}
          <button class="b-tbtn" type="button" data-drundo>Letzten entfernen</button>
        </div>
        <label class="dr-set">Start-Pool:
          <select class="input" id="drStart"><option value="1"${dr.start===1 ? ' selected' : ''}>1 von jeder Komponente – Stage 1 ohne Doppelte</option><option value="2"${dr.start===2 ? ' selected' : ''}>2 von jeder Komponente</option></select>
        </label>
      </section>
      <section class="card dr-out">
        <h3>Wahrscheinlichkeiten ${late ? '' : `<small>${n} Komponenten im Pool</small>`}</h3>
        ${table}
        <p class="dr-note">${restTxt} Vor ${nextS <= 4 ? DR_STAGES[nextS-1][1] : 'der nächsten Creep-Stage'} kommt von jeder Komponente eine in den Item-Pool.</p>
      </section>
    </div>
    <div class="dr-grid">
      <section class="card"><h3>Beute in ${esc(stageName)}</h3>${loot}</section>
      <section class="card"><h3>Deine Komponenten</h3>
        <div class="dr-have">${mine.length ? Object.entries(have).map(([id, k])=>`<span>${drIcon(id, 34)}${k > 1 ? `<b>×${k}</b>` : ''}</span>`).join('') : '<small class="dr-note">Noch keine.</small>'}</div>
        ${craft.length ? `<h4 class="dr-h4">Daraus baubar</h4><div class="dr-craft">${craft.map(r=>`<button type="button" data-item="${r.id}" title="${esc(r.en)}">${itImg(r, 38)}</button>`).join('')}</div>` : ''}
      </section>
    </div>
    <details class="card dr-more"><summary>Orb-Inhalte (Gold &amp; Prismatic) und Quelle</summary>
      <div class="dr-orbgrid">${orbTbl(LOOT.orbs.prism)}${orbTbl(LOOT.orbs.gold)}${orbTbl(LOOT.orbs.gold4)}
        <div class="dr-orbtbl"><h4>Aufgewertete Runden <small>einmal pro Spiel geheim ausgewürfelt</small></h4><table class="dr-table small"><tbody>${LOOT.upgraded.map(([t, p])=>`<tr><td>${esc(t)}</td><td>${fmtNum(p)} %</td></tr>`).join('')}</tbody></table></div></div>
      <p class="dr-note">Beute-Tabellen: ${esc(LOOT.source)}. Die Pool-Regel (gezogene Komponenten fehlen, vor jeder Creep-Stage kommt von jeder eine dazu) ist nicht offiziell von Riot dokumentiert – deshalb kannst du den Start-Pool umstellen.</p>
    </details>
  </div>`;
}
document.addEventListener('click', e=>{
  const app = e.target.closest && e.target.closest('#drApp'); if(!app) return;
  const t = e.target;
  const st = t.closest('[data-drstage]'); if(st){ dr.stage = +st.dataset.drstage; drSave(); drRender(); return; }
  const src = t.closest('[data-drsrc]'); if(src){ dr.src = src.dataset.drsrc; drSave(); drRender(); return; }
  const add = t.closest('[data-dradd]'); if(add){ if(dr.src==='extra') dr.extra.push(add.dataset.dradd); else if(dr.stage <= 4) dr.drops[dr.stage].push(add.dataset.dradd); drSave(); drRender(); return; }
  const del = t.closest('[data-drdel]'); if(del){ const [k, i] = del.dataset.drdel.split(':'); (k==='x' ? dr.extra : dr.drops[k]).splice(+i, 1); drSave(); drRender(); return; }
  if(t.closest('[data-drundo]')){ const l = dr.src==='extra' ? dr.extra : dr.drops[Math.min(4, dr.stage)]; if(l && l.length){ l.pop(); drSave(); drRender(); } return; }
  if(t.closest('[data-drreset]')){ if(confirm('Alle Eingaben löschen und ein neues Spiel starten?')){ dr = DR_NEW(); drSave(); drRender(); } return; }
});
document.addEventListener('change', e=>{ if(e.target.id==='drStart'){ dr.start = +e.target.value; drSave(); drRender(); } });

/* ================= PATCHES (aus Riots Patchnotes, automatisch vom Update-Skript) ================= */
const PATCHES = (window.TFT_PATCHES || []).slice().sort((a,b)=>String(b.date).localeCompare(String(a.date)));
const PATCH_NOTES = window.TFT_PATCH_NOTES || {};
const PATCH_FOCUS = window.TFT_PATCH_FOCUS || {};   // Bildausschnitt pro Patch (data/patch-kommentare.js)
const patchFocus = p => /^\d{1,3}% \d{1,3}%$/.test(PATCH_FOCUS[p.id] || '') ? PATCH_FOCUS[p.id] : '50% 30%';
const patchSlug = id => String(id).replace('.', '-');
const patchBySlug = Object.fromEntries(PATCHES.map(p=>[patchSlug(p.id), p]));
const TODAY_ISO = new Date().toISOString().slice(0,10);
const CURRENT_PATCH = PATCHES.find(p=>p.date <= TODAY_ISO);
const fmtDate = d => d ? new Date(d + 'T12:00:00').toLocaleDateString(LOC, {day:'numeric', month:'long', year:'numeric'}) : '';
const patchCount = p => (p.notes || []).reduce((n,s)=>n + (s.ch||[]).length, 0);
// Namen aus den (deutschen) Patchnotes den Einträgen der Seite zuordnen
const NAME_IDX = {};
(()=>{
  const add = (name, v) => { if(name) NAME_IDX[String(name).toLowerCase()] = NAME_IDX[String(name).toLowerCase()] || v; };
  TFT_DATA.champions.forEach(c=>{ add(c.n, {ty:'c', k:c.n}); add(c.de, {ty:'c', k:c.n}); });
  TFT_DATA.traits.forEach(t=>{ add(t.n, {ty:'t', k:t.n}); add(t.de, {ty:'t', k:t.n}); });
  ITEMS.forEach(i=>{ add(i.en, {ty:'i', k:i.id}); add(i.de, {ty:'i', k:i.id}); });
  AUGS.forEach(a=>{ add(a.en, {ty:'a', k:a.id}); add(a.de, {ty:'a', k:a.id}); });
})();
// Englische Patchnotes schreiben „Camille Ability Damage: …“ ohne Trennstrich – den Namen vorne abtrennen
if(EN) (()=>{ const names = Object.keys(NAME_IDX).sort((a,b)=>b.length - a.length);
  PATCHES.forEach(p=>(p.notes||[]).forEach(s=>(s.ch||[]).forEach(r=>{ if(r[0] || !r[1]) return; const l = r[1].toLowerCase(), n = names.find(x=>l.startsWith(x + ' ')); if(n){ r[0] = r[1].slice(0, n.length); r[1] = r[1].slice(n.length).trim(); } }))); })();
function patchIcon(subject){
  const m = NAME_IDX[String(subject||'').toLowerCase()]; if(!m) return '';
  if(m.ty==='c') return `<button class="pn-ic" data-champ="${esc(m.k)}" type="button">${avatar(m.k, 34)}</button>`;
  if(m.ty==='t') return `<span class="pn-ic">${traitHex(m.k, 'base', 30)}</span>`;
  if(m.ty==='i'){ const it = itemById[m.k]; return it ? `<button class="pn-ic" data-item="${esc(it.id)}" type="button"><img src="${it.img}" alt="" loading="lazy"></button>` : ''; }
  const a = AUG_BY[m.k]; return a ? `<span class="pn-ic"><img src="${augImg(a)}" alt="" loading="lazy"></span>` : '';
}
const grpLabel = g => { const s = String(g||''); if(/PATCH-AKTUALISIERUNG|MID-PATCH UPDATE/i.test(s)) return 'B-Patch' + (s.includes('·') ? ' · ' + secLabel(s.split('·').slice(1).join('·').trim()) : ''); return secLabel(s).replace(/\bGrosse\b/g, 'Große'); };
const secLabel = s => String(s||'').toLowerCase().replace(/(^|[\s\-–(„"])(\S)/g, (m,a,b)=>a + b.toUpperCase());
function patchRowHTML(r){
  const [s, l, o, n] = r;
  return `<li class="pn-row">${patchIcon(s) || '<span class="pn-ic pn-dot"></span>'}<div class="pn-txt">${s ? `<b>${esc(s)}</b>` : ''}${l ? `<span class="pn-l">${esc(l)}</span>` : ''}<span class="pn-v">${o ? `<span class="pn-old">${esc(o)}</span><span class="pn-arr">⇒</span>` : ''}<span class="pn-new">${esc(n)}</span></span></div></li>`;
}
function renderPatches(sub){
  const app = $('#patchesApp');
  if(!PATCHES.length){ app.innerHTML = `<div class="page-head"><div class="crumb">Home / Patches</div><h1>TFT <em class="serif">Patches</em></h1></div>` + ornnSays('Hmph. Die Patchliste ist noch nicht geschmiedet – das Update-Skript holt sie beim nächsten Lauf.'); return; }
  const p = sub && patchBySlug[sub];
  if(!p){
    const sets = [...new Set(PATCHES.map(x=>x.set))];
    app.innerHTML = `<div class="page-head"><div class="crumb">Home / Patches</div><h1>TFT <em class="serif">Patches</em></h1>
      <p>Alle Patches mit den offiziellen Änderungen von Riot – automatisch aktualisiert, sobald ein neuer Patch erscheint (alle zwei Wochen, meist dienstags).</p></div>`
      + sets.map(st=>`<div class="pt-set"><h2>Set ${st}</h2><div class="pt-grid">${PATCHES.filter(x=>x.set===st).map(x=>{
        const cur = x===CURRENT_PATCH, cnt = patchCount(x), note = PATCH_NOTES[x.id];
        return `<a class="pt-card${cur?' cur':''}" href="/patches/${patchSlug(x.id)}">
          <div class="pt-img"${x.img ? ` style="background-image:url('${esc(x.img)}?w=640&fm=webp');background-position:${esc(patchFocus(x))}"` : ''}>${cur ? '<span class="pill">Aktuell</span>' : ''}</div>
          <div class="pt-body"><small>${fmtDate(x.date)}</small><h3>Patch ${esc(x.id)}</h3><p>${esc(x.teaser || '')}</p>
          <div class="pt-meta">${cnt ? `<span>${cnt} Änderungen</span>` : ''}${note ? '<span class="hl">mit Einschätzung</span>' : ''}</div></div></a>`;
      }).join('')}</div></div>`).join('')
      + `<p class="note">Quelle: offizielle Patchnotes von Riot Games. Die Änderungen werden automatisch übernommen – die vollständigen Texte findest du jeweils bei Riot.</p>`;
    return;
  }
  const i = PATCHES.indexOf(p), newer = PATCHES[i-1], older = PATCHES[i+1];
  const grps = []; (p.notes || []).forEach(s=>{ let g = grps.find(x=>x.g===s.grp); if(!g){ g = {g:s.grp, secs:[]}; grps.push(g); } g.secs.push(s); });
  const note = PATCH_NOTES[p.id];
  app.innerHTML = `<div class="page-head"><div class="crumb"><a href="/patches">Patches</a> / ${esc(p.id)}</div></div>
    <div class="pd-hero"${p.img ? ` style="--img:url('${esc(p.img)}?w=1280&fm=webp');--pos:${esc(patchFocus(p))}"` : ''}><div>
      <small>${fmtDate(p.date)}${p===CURRENT_PATCH ? ' · <b>Aktueller Patch</b>' : ''}</small><h1>Patch <em class="serif">${esc(p.id)}</em></h1>
      ${p.teaser ? `<blockquote>${esc(p.teaser)}<cite>– Riot Games</cite></blockquote>` : ''}
      <a class="btn btn-primary" href="${esc(p.url)}" target="_blank" rel="noopener">Komplette Patchnotes bei Riot ↗</a></div></div>
    ${note ? `<div class="card pd-note"><h3>Einschätzung von TFT Freaks</h3>${String(note).split(/\n{2,}/).map(t=>`<p>${esc(t).replace(/\n/g,'<br>')}</p>`).join('')}</div>` : ''}
    ${grps.length ? `<input class="input pd-search" id="pdSearch" placeholder="Champion, Trait, Item oder Augment suchen …" aria-label="Änderungen durchsuchen">
    <div id="pdList">${grps.map(g=>`<section class="pd-grp">${g.g ? `<h2>${esc(grpLabel(g.g))}</h2>` : ''}${g.secs.map(s=>`<div class="card pd-sec"><h3>${esc(secLabel(s.sec))}</h3><ul>${s.ch.map(patchRowHTML).join('')}</ul></div>`).join('')}</section>`).join('')}</div>`
      : viSays('Für diesen Patch habe ich keine einzelnen Änderungen gefunden – schau direkt in die Patchnotes bei Riot.')}
    <div class="pd-nav">${older ? `<a class="btn btn-ghost" href="/patches/${patchSlug(older.id)}">← Patch ${esc(older.id)}</a>` : '<span></span>'}${newer ? `<a class="btn btn-ghost" href="/patches/${patchSlug(newer.id)}">Patch ${esc(newer.id)} →</a>` : ''}</div>
    <p class="note">Änderungen automatisch aus den offiziellen Patchnotes von Riot Games übernommen. Maßgeblich sind die vollständigen Notizen bei Riot.</p>`;
  const s = $('#pdSearch');
  if(s) s.addEventListener('input', ()=>{
    const q = s.value.toLowerCase().trim();
    app.querySelectorAll('.pn-row').forEach(li=>{ li.hidden = !!q && !li.textContent.toLowerCase().includes(q); });
    app.querySelectorAll('.pd-sec').forEach(sec=>{ sec.hidden = ![...sec.querySelectorAll('.pn-row')].some(li=>!li.hidden); });
    app.querySelectorAll('.pd-grp').forEach(g=>{ g.hidden = ![...g.querySelectorAll('.pd-sec')].some(x=>!x.hidden); });
  });
}
// Letzte Änderungen eines Champions (für das Champion-Fenster)
function champPatchHTML(name){
  const keys = [name, (CH_DATA[name]||{}).de].filter(Boolean).map(x=>x.toLowerCase());
  const out = [];
  PATCHES.filter(p=>p.set===TFT_DATA.set).forEach(p=>{
    const rows = (p.notes||[]).flatMap(s=>s.ch).filter(r=>keys.includes(String(r[0]).toLowerCase()));
    if(rows.length && out.length < 3) out.push(`<div class="cp-p"><a href="/patches/${patchSlug(p.id)}">Patch ${esc(p.id)}</a><ul>${rows.map(r=>`<li>${r[1] ? esc(r[1]) + ': ' : ''}${r[2] ? `<span class="pn-old">${esc(r[2])}</span> ⇒ ` : ''}<b>${esc(r[3])}</b></li>`).join('')}</ul></div>`);
  });
  return out.join('');
}

/* ================= LEISTE OBEN: LP-Grenzen + nächster Patch ================= */
// Patch-Countdown: Riot patcht meist mittwochs um 4:30 Uhr (deutsche Zeit) im Zwei-Wochen-Takt.
// Feste Termine aus data/patch-kommentare.js (TFT_PATCH_SCHEDULE) haben Vorrang.
const ST_PATCH = TL_PATCH || (CURRENT_PATCH ? CURRENT_PATCH.id : '');
// Uhrzeit in deutscher Zeit (Sommer-/Winterzeit automatisch) → echter Zeitpunkt, egal wo der Besucher ist
function berlinTime(y, mo, d, h, mi){
  const guess = Date.UTC(y, mo - 1, d, h, mi);
  const off = (()=>{ try { const p = new Intl.DateTimeFormat('en-US', {timeZone:'Europe/Berlin', timeZoneName:'shortOffset'}).formatToParts(new Date(guess)).find(x=>x.type==='timeZoneName').value.match(/GMT([+-]\d+)/); return p ? +p[1] : 1; } catch(e){ return 1; } })();
  return new Date(guess - off * 36e5);
}
function stNextPatch(){
  const now = new Date();
  const fixed = Object.entries(window.TFT_PATCH_SCHEDULE || {}).map(([id, s])=>{ const m = String(s).match(/^(\d{4})-(\d\d)-(\d\d)(?:[ T](\d\d):(\d\d))?/); return m ? {id, d:berlinTime(+m[1], +m[2], +m[3], +(m[4]||4), +(m[5]||30)), fixed:true} : null; })
    .filter(x=>x && x.d > now).sort((a,b)=>a.d - b.d)[0];
  if(fixed) return fixed;
  if(!CURRENT_PATCH || !CURRENT_PATCH.date) return null;
  // Live-Termin des letzten Patches: erster Mittwoch ab dem Datum der Patchnotes, 4:30 Uhr
  const [y, mo, d] = CURRENT_PATCH.date.split('-').map(Number), base = new Date(Date.UTC(y, mo - 1, d));
  base.setUTCDate(base.getUTCDate() + (3 - base.getUTCDay() + 7) % 7);
  let k = 0, t;   // k = 0: Patchnotes sind schon da, der Patch selbst aber noch nicht live
  do { const x = new Date(base); x.setUTCDate(x.getUTCDate() + 14 * k++); t = berlinTime(x.getUTCFullYear(), x.getUTCMonth() + 1, x.getUTCDate(), 4, 30); } while(t <= now);
  return {d:t, fixed:false};
}
function stCountdown(){
  const n = stNextPatch(); if(!n) return '–';
  const ms = n.d - new Date(), days = Math.floor(ms / 864e5), hrs = Math.floor(ms % 864e5 / 36e5), min = Math.floor(ms % 36e5 / 6e4);
  return EN ? (days > 0 ? `${days}d ${hrs}h` : hrs > 0 ? `${hrs}h ${min}m` : `${min}m`) : days > 0 ? `${days} T ${hrs} Std` : hrs > 0 ? `${hrs} Std ${min} Min` : `${min} Min`;
}
const stNextLabel = () => { const n = stNextPatch(); if(!n) return ''; return n.d.toLocaleString(LOC, {weekday:'short', day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit', timeZone:'Europe/Berlin'}) + L(' Uhr', '') + (n.fixed ? '' : L(' · geschätzt', ' · estimated')); };
// LP-Grenzen (Challenger/Großmeister) pro Server: zuerst aus data/cutoffs.js, dann live über /api/cutoffs (Vercel-Funktion)
let ST_CUT = window.TFT_CUTOFFS && window.TFT_CUTOFFS.regions ? window.TFT_CUTOFFS : null, ST_CUT_LIVE = false;
const stCut = r => ST_CUT && ST_CUT.regions[r];
if(!FILE_MODE) fetch('/api/cutoffs').then(r=>r.ok ? r.json() : null).then(d=>{
  if(d && d.regions && Object.keys(d.regions).length){ ST_CUT = d; ST_CUT_LIVE = true; renderStatBar(); }
}).catch(()=>{});
const fmtLP = v => v.toLocaleString(LOC) + ' LP';
// Leiste oben: LP-Grenzen für Challenger und Großmeister (EUW) und der nächste Patch
function renderStatBar(){
  const el = $('#statBar'); if(!el) return;
  const cut = stCut('euw'), dot = `<i class="sb-dot${ST_CUT_LIVE ? ' live' : ''}" title="${ST_CUT_LIVE ? 'Live' : 'Gespeicherter Stand'}"></i>`;
  el.innerHTML = `<div class="wrap sb-in">
    ${cut ? `<a class="sb-main" href="/ranks/challenger"><img src="${rankImg(rankBy.challenger)}" alt="" width="40" height="40"><span class="sb-num"><b>${fmtLP(cut.ch)}</b><small>${dot}Challenger · EUW</small></span></a>
    <a class="sb-main" href="/ranks/grandmaster"><img src="${rankImg(rankBy.grandmaster)}" alt="" width="40" height="40"><span class="sb-num"><b>${fmtLP(cut.gm)}</b><small>${dot}Großmeister · EUW</small></span></a>` : ''}
    ${ST_PATCH ? `<a class="sb-item sb-hide" href="/patches" title="${L('Nächster Patch', 'Next patch')}: ${esc(stNextLabel())}"><span class="sb-patch">${esc(ST_PATCH)}</span><span><small>Nächster Patch in</small><b data-countdown>${stCountdown()}</b></span></a>` : ''}</div>`;
  el.hidden = !cut && !ST_PATCH;
}
setInterval(()=>document.querySelectorAll('[data-countdown]').forEach(e=>{ e.textContent = stCountdown(); }), 60000);
/* ================= SEITENTITEL & SUCHMASCHINEN ================= */
// Pro Seite: [Titel, Beschreibung]. Seiten ohne eigenen Inhalt (Platzhalter, Redaktion, 404) werden nicht indexiert.
function pageMeta(page, sub){
  const S = `Set ${TFT_DATA.set}`, P = TL_PATCH ? ` (Patch ${TL_PATCH})` : '', rk = rankBy[sub];
  switch(page){
    case 'home': return ['TFT Freaks – TFT Tierlist, Comps & Coaching', `Aktuelle TFT Tierlist für ${S}${P}: die besten Comps mit Items, Augments und Aufstellung – dazu Coaching von Challenger-Spielern.`];
    case 'tierlist':
      if(sub==='items') return [`TFT Item-Tierlist ${S}${P}`, `Welche Items sind in TFT ${S} am stärksten? Item-Tierlist mit kombinierten Items, Lichtversionen und Artefakten.`];
      if(sub==='augments') return [`TFT Augment-Tierlist ${S}${P}`, `Die besten Augments in TFT ${S} – sortiert nach Silber, Gold und Prismatisch.`];
      if(sub==='holds') return [`TFT Holds ${S}${P} – welche Units du früh hältst`, `Welche 1-, 2- und 3-Kosten-Champions lohnen sich in TFT ${S} von 1-1 bis 1-3 zu halten? Holds-Tierlist von S bis C.`];
      return [`TFT Tierlist ${S}${P} – die besten Comps`, `Die besten TFT Comps für ${S}${P}: Tierlist mit Aufstellung, Items, Augments und Spielplan für jede Comp.`];
    case 'bibliothek':
      if(sub==='items') return [`TFT Items ${S} – Rezepte & Werte`, `Alle Items in TFT ${S}: Rezepte, Komponenten, Lichtversionen, Artefakte und Embleme mit ihren Werten.`];
      if(sub==='traits') return [`TFT Traits ${S} – Stufen & Units`, `Alle Traits in TFT ${S}: Ursprünge und Klassen mit Stufen, Effekten und den passenden Units.`];
      return [`TFT Champions ${S} – Kosten & Traits`, `Alle ${champions.length} Champions in TFT ${S} mit Kosten und Traits.`];
    case 'ranks':
      if(rk) return [`TFT Rang ${rk.n} – Spielerverteilung`, `Wie viele Spieler sind in TFT ${rk.n}? Verteilung nach Divisionen und Vergleich mit den anderen Rängen.`];
      return ['TFT Ränge & Spielerverteilung', 'Alle TFT Ränge von Eisen bis Challenger mit Divisionen – und wie viel Prozent der Spieler in jedem Rang stehen.'];
    case 'builder': return [`TFT Team Builder ${S} – Board planen & teilen`, `Kostenloser TFT Team Builder für ${S}: Units platzieren, Items verteilen, aktive Traits prüfen und dein Board als Link oder Team-Code teilen.`];
    case 'coaching': return ['TFT Coaching von Challenger-Spielern', 'TFT Coaching auf Deutsch und Englisch: Fundamentals und VOD-Review mit Challenger-Coaches. Kostenloses Kennenlernen, Einzelstunde 30 €.'];
    case 'about':
      if(sub==='crazyslayt') return ['CrazYSlayt – TFT Challenger & Founder', 'Claudio „CrazYSlayt“: Challenger seit Set 15, Founder von TFT Freaks und Coach seit Set 17.'];
      if(sub==='humbadobo') return ['humbadobo – TFT Challenger & Coach', 'Romano „humbadobo“: Challenger seit Set 15, Peak 1.447 LP und Coach bei TFT Freaks.'];
      return ['Meet the Team', 'Das Team hinter TFT Freaks: Challenger-Spieler, Coaches – und Vi.'];
    case 'apply': return ['Coaching anfragen', 'Frag ein kostenloses Kennenlernen für dein TFT Coaching an.'];
    case 'patches': {
      const p = patchBySlug[sub];
      if(p) return [`TFT Patch ${p.id} – alle Änderungen`, L(`Alle Änderungen aus TFT Patch ${p.id} (${fmtDate(p.date)}) auf einen Blick: Champions, Traits, Items und Augments. ${p.teaser || ''}`, `All changes from TFT patch ${p.id} (${fmtDate(p.date)}) at a glance: champions, traits, items and augments. ${p.teaser || ''}`).trim()];
      return ['TFT Patch Notes – alle Änderungen', 'Alle TFT Patches mit den offiziellen Änderungen von Riot: Champions, Traits, Items und Augments – automatisch aktuell.'];
    }
    case 'impressum': return ['Impressum', 'Impressum von TFT Freaks.'];
    case 'datenschutz': return ['Datenschutzerklärung', 'Datenschutzerklärung von TFT Freaks.'];
    case 'guides': return ['TFT Guides', '', true];
    case 'tools':
      if(sub==='tierlist') return [`TFT Tierlist-Maker ${S} – eigene Tierlist erstellen & teilen`, `Kostenloser TFT Tierlist-Maker für ${S}: Champions, Items, Artefakte, Embleme und Augments per Drag & Drop ranken und deine Tierlist als Link teilen.`];
      if(sub==='rolldown') return [`TFT Rolldown-Rechner ${S} – Odds & Chancen pro Level`, `Wie wahrscheinlich triffst du deine Units? TFT Rolldown-Rechner für ${S} mit Shop-Odds pro Level, Pool-Größen und dem Vergleich: jetzt rollen oder erst leveln.`];
      if(sub==='drops') return [`TFT Item-Drop-Rechner ${S} – nächste Komponente berechnen`, `Trag deine Item-Drops aus den Creep-Runden ein und sieh die Chancen für die nächsten Komponenten in TFT ${S} – mit Gold- und Prismatic-Orb-Chancen pro Stage.`];
      if(sub==='dps') return [`TFT DPS-Rechner ${S} – Item-Builds & Schaden vergleichen`, `Welcher Item-Build macht am meisten Schaden? Kostenloser TFT DPS-Rechner für ${S}: bis zu vier Builds eines Champions über 30 Sekunden im Graph vergleichen.`];
      if(sub==='simulator') return [`TFT Kampf-Simulator ${S} – Teams gegeneinander testen`, `Lass zwei TFT Teams für ${S} gegeneinander kämpfen: Laufwege, Ziele, Fähigkeiten und Sprünge Schritt für Schritt – mit Items, Sternen, Traits und Augments.`];
      return [`TFT Tools ${S} – Rolldown-Rechner, DPS-Rechner & Tierlist-Maker`, `Kostenlose TFT Tools für ${S}: Rolldown-Rechner mit Shop-Odds, DPS-Rechner für Item-Builds, Item-Drop-Rechner, Tierlist-Maker und Kampf-Simulator.`];
    case 'news': return ['TFT News', '', true];
    case 'admin': return ['Redaktion', '', true];
    default: return ['Seite nicht gefunden', '', true];
  }
}
function headTag(sel, make){ let el = document.head.querySelector(sel); if(!el){ el = make(); document.head.appendChild(el); } return el; }
function setMeta(page, sub){
  let [title, desc, noindex] = pageMeta(page, sub);
  title = tr(title); if(desc) desc = tr(desc);   // englische Seite: über das Wörterbuch
  document.title = page==='home' ? title : title + ' | TFT Freaks';
  if(desc) headTag('meta[name="description"]', ()=>Object.assign(document.createElement('meta'), {name:'description'})).content = desc;
  headTag('meta[name="robots"]', ()=>Object.assign(document.createElement('meta'), {name:'robots'})).content = noindex ? 'noindex' : 'index, follow';
  if(FILE_MODE) return;
  if(noindex){ const c = document.head.querySelector('link[rel="canonical"]'); if(c) c.remove(); return; }
  // kanonische Adresse: eine Adresse pro Inhalt (z. B. /bibliothek statt /bibliothek/champions, Builder ohne Team-Code)
  const keep = {tierlist:['items','augments','holds'], bibliothek:['items','traits'], tools:['rolldown','tierlist','simulator','drops','dps'], patches:Object.keys(patchBySlug), ranks: rankBy[sub] ? [sub] : [], about:['crazyslayt','humbadobo']}[page] || [];
  const path = page==='home' ? '/' : '/' + page + (keep.includes(sub) ? '/' + sub : '');
  headTag('link[rel="canonical"]', ()=>Object.assign(document.createElement('link'), {rel:'canonical'})).href = location.origin + withLang(path);
  // beide Sprachfassungen für Suchmaschinen verknüpfen
  [['de', path], ['en', '/en' + path], ['x-default', path]].forEach(([l, p])=>{ headTag(`link[rel="alternate"][hreflang="${l}"]`, ()=>Object.assign(document.createElement('link'), {rel:'alternate', hreflang:l})).href = location.origin + p; });
  // Vorschau beim Teilen (Discord, WhatsApp, X …)
  const url = location.origin + withLang(path), tool = page==='tools' ? (sub && keep.includes(sub) ? sub : 'overview') : page==='builder' ? 'builder' : '';
  const img = location.origin + '/' + ({tierlist:'assets/tools/tierlist.webp', drops:'assets/tools/drops.webp', simulator:'assets/tools/simulator.webp'}[tool] || (tool ? 'assets/img/mascot-heimer-wave.webp' : 'assets/img/mascot-vi.webp'));
  const og = (k, v) => { headTag(`meta[property="${k}"]`, ()=>{ const m = document.createElement('meta'); m.setAttribute('property', k); return m; }).content = v; };
  og('og:title', document.title); og('og:description', desc || ''); og('og:url', url); og('og:type', 'website'); og('og:site_name', 'TFT Freaks'); og('og:locale', EN ? 'en_GB' : 'de_DE'); og('og:image', img);
  headTag('meta[name="twitter:card"]', ()=>Object.assign(document.createElement('meta'), {name:'twitter:card'})).content = 'summary';
  setLd(page, sub, tool, title, desc, url, path);
}
// Strukturierte Daten für Google: Brotkrumen, bei Tools zusätzlich Web-App und die Fragen aus dem Textblock
const LD_SECTION = {tierlist:'Tierlist', tools:'Tools', bibliothek:'Bibliothek', ranks:'Ranks', patches:'Patches', about:'Meet the Team', builder:'Team Builder', coaching:'Coaching', apply:'Coaching', impressum:'Impressum', datenschutz:'Datenschutz'};
function setLd(page, sub, tool, title, desc, url, path){
  const org = {'@type':'Organization', name:'TFT Freaks', url:location.origin + withLang('/'), logo:location.origin + '/assets/img/tft-logo.png'};
  const graph = [{'@type':'WebSite', name:'TFT Freaks', url:location.origin + withLang('/'), inLanguage:EN ? 'en' : 'de', publisher:org}];
  if(page!=='home'){
    const items = [['Home', '/']], sec = LD_SECTION[page];
    if(sec) items.push([tr(sec), '/' + page]);
    if(path !== '/' + page) items.push([title.split(' – ')[0], path]);
    graph.push({'@type':'BreadcrumbList', itemListElement:items.map(([n, p], i)=>({'@type':'ListItem', position:i + 1, name:n, item:location.origin + withLang(p)}))});
  }
  if(tool){
    graph.push({'@type':'WebApplication', name:title.split(' – ')[0], url, description:desc, applicationCategory:'GameApplication', operatingSystem:'Web', browserRequirements:'JavaScript', inLanguage:EN ? 'en' : 'de', isAccessibleForFree:true, offers:{'@type':'Offer', price:'0', priceCurrency:'EUR'}, publisher:org});
    const box = tool==='builder' ? $('#page-builder .tool-seo.b-only') : tool==='simulator' ? $('#page-builder .tool-seo.b-simonly') : $(`#page-tools .tool-view[data-tool="${tool==='overview' ? '' : tool}"] .tool-seo`);
    const qa = box ? [...box.querySelectorAll('details')].map(d=>({'@type':'Question', name:d.querySelector('summary').textContent.trim(), acceptedAnswer:{'@type':'Answer', text:d.querySelector('p').textContent.trim()}})) : [];
    if(qa.length) graph.push({'@type':'FAQPage', mainEntity:qa});
  }
  let el = document.getElementById('ldPage');
  if(!el){ el = document.createElement('script'); el.type = 'application/ld+json'; el.id = 'ldPage'; document.head.appendChild(el); }
  el.textContent = JSON.stringify({'@context':'https://schema.org', '@graph':graph});
}

// Interne Links ohne Neuladen öffnen (Strg/Mittelklick öffnen weiterhin einen neuen Tab)
document.addEventListener('click', e=>{
  if(e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  const a = e.target.closest('a[href]'); if(!a || a.target === '_blank') return;
  const h = a.getAttribute('href');
  if(h.startsWith('#') && !h.startsWith('#/')){   // Sprunganker wie #main
    e.preventDefault();
    const t = h.length > 1 && document.getElementById(h.slice(1));
    if(t){ t.scrollIntoView(); t.focus({preventScroll:true}); }
    return;
  }
  const p = h.startsWith('#/') ? h.slice(1) : h;
  if(!p.startsWith('/') || p.startsWith('//')) return;
  e.preventDefault(); go(p);
});

function route(){
  // lokal: normale Sprunganker (z. B. #main) nicht als Seite behandeln
  if(FILE_MODE && location.hash && !location.hash.startsWith('#/') && document.querySelector('.page.active')) return;
  const parts = curPath().replace(/^\/+/,'').split('/');
  let page = parts[0] || 'home', sub = parts[1];
  // alte Adressen weiter unterstützen
  if(['champions','items','traits'].includes(page)){ sub = page; page = 'bibliothek'; }
  if(page==='augments'){ sub = 'augments'; page = 'tierlist'; }
  const valid = ['home','tierlist','bibliothek','ranks','builder','admin','news','tools','coaching','guides','about','apply','impressum','datenschutz','patches'];
  if(!valid.includes(page)) page='notfound';
  const isSim = page==='tools' && sub==='simulator';   // der Simulator nutzt die Builder-Oberfläche
  const pageId = page==='bibliothek' ? 'library' : isSim ? 'builder' : page;
  document.querySelectorAll('.page').forEach(p=>p.classList.toggle('active', p.id==='page-'+pageId));
  let navKey = page;
  if(!isSim) simPause();
  if(page==='tierlist') setTab(['items','augments','holds'].includes(sub)?sub:'comps');
  if(page==='bibliothek') setLib(['items','traits'].includes(sub)?sub:'champions');
  if(page==='ranks') setRank(sub);
  if(page==='builder') builderRoute(sub, parts[2], 'builder');
  if(page==='admin') renderAdmin();
  if(page==='about') setAbout(sub);
  if(isSim) builderRoute(parts[2], parts[3], 'sim');
  else if(page==='tools') renderTools(sub, parts[2], parts[3]);
  if(page==='patches') renderPatches(sub);
  document.querySelectorAll('[data-route]').forEach(a=>a.classList.toggle('active', a.dataset.route===navKey));
  if(['guides','about','apply','patches'].includes(navKey)) $('#moreBtn').classList.add('active');
  else $('#moreBtn').classList.remove('active');
  moreMenu.classList.remove('open'); drawer.classList.remove('open');
  closeModal(); window.scrollTo(0,0);
  setMeta(page, sub);
}
window.addEventListener(FILE_MODE ? 'hashchange' : 'popstate', route);

/* ================= ÜBERSETZUNG (englische Seite) ================= */
// Die deutschen Texte bleiben im Code. Auf /en/… ersetzt ein Wörterbuch (assets/js/i18n-en.js) jeden sichtbaren Text:
// Schlüssel = deutscher Text; Zahlen und Namen (Champions, Traits, Items, Augments …) stehen darin als {0}, {1} ….
// Ablauf pro Text: genauer Treffer → nur Zahlen ersetzt → Zahlen und Namen ersetzt. Ohne Treffer bleibt der Text, wie er ist.
const I18N_HARVEST = !EN && /[?&]i18nharvest/.test(location.search);   // nur zum Sammeln aller Texte (Entwicklung)
const I18N = EN ? (window.I18N_EN || {}) : {};
const I18N_SEEN = new Map(), I18N_CACHE = new Map(), I18N_OUT = new Set();
let I18N_NAMES = null;
const I18N_DE2EN = new Map();   // deutscher Name → englischer Name (englische Seite)
const RANK_DE_EN = [['Eisen','Iron'],['Silber','Silver'],['Platin','Platinum'],['Smaragd','Emerald'],['Diamant','Diamond'],['Meister','Master'],['Großmeister','Grandmaster']];
function i18nNames(){
  if(I18N_NAMES) return I18N_NAMES;
  const s = new Set();
  const add = n => { n = String(n||'').trim(); if(n.length >= 2) s.add(n); };
  // auf der englischen Seite: deutsche Namen, die fest in einem deutschen Satz stehen, werden zum englischen Namen
  const map = (de, en) => { de = String(de||'').trim(); if(EN && de.length >= 3 && en && de !== en && !I18N_DE2EN.has(de)){ I18N_DE2EN.set(de, en); add(de); } };
  TFT_DATA.champions.forEach(c=>{ add(c.n); if(c.de) add(c.de); if(c.ab) add(c.ab.n); map(c.de0, c.n); if(c.ab) map(c.ab.n0, c.ab.n); });
  TFT_DATA.traits.forEach(t=>{ add(t.n); add(t.de); map(t.de0, t.n); });
  TFT_DATA.items.forEach(i=>{ add(i.en); add(i.de); map(i.de0, i.en); });
  TFT_DATA.augments.forEach(a=>{ add(a.en); add(a.de); map(a.de0, a.en); });
  comps.forEach(c=>add(c.name)); Object.keys(PLANTS).forEach(add);
  RANK_TIERS.forEach(t=>add(t.n)); RANK_DE_EN.forEach(([d, e])=>map(d, e));
  (window.I18N_EN_NOTNAMES || []).forEach(n=>s.delete(n));   // Wörter, die auch normale Wörter sind
  const by = new Map();
  [...s].sort((a,b)=>b.length - a.length).forEach(n=>{ const k = n.slice(0, 2); (by.get(k) || by.set(k, []).get(k)).push(n); });
  return I18N_NAMES = by;
}
const I18N_WORD = /[\p{L}\p{N}]/u;
// Zahlen (und optional Namen) durch {0}, {1} … ersetzen
function i18nKey(t, names){
  const args = []; let out = '', i = 0;
  const by = names ? i18nNames() : null;
  while(i < t.length){
    const prevWord = i > 0 && I18N_WORD.test(t[i-1]);
    if(!prevWord && /\d/.test(t[i])){ const m = t.slice(i).match(/^\d+(?:[.,]\d+)*/); out += '{' + args.length + '}'; args.push(m[0]); i += m[0].length; continue; }
    if(by && !prevWord){
      const hit = (by.get(t.substr(i, 2)) || []).find(n=>t.startsWith(n, i) && !I18N_WORD.test(t[i + n.length] || ''));
      if(hit){ out += '{' + args.length + '}'; args.push(hit); i += hit.length; continue; }
    }
    out += t[i++];
  }
  return {key:out, args};
}
// deutsche Zahlen aus festem Text ins englische Format: 1.447 → 1,447 · 0,02 → 0.02 (englische Zahlen bleiben unverändert)
const i18nNum = a => /^[1-9]\d{0,2}(\.\d{3})+$/.test(a) ? a.replace(/\./g, ',') : (/^\d+,\d+$/.test(a) && !/^[1-9]\d{0,2},\d{3}$/.test(a) ? a.replace(',', '.') : a);
const i18nFill = (v, args) => v.replace(/\{(\d+)\}/g, (m, k)=>args[+k] !== undefined ? (I18N_DE2EN.get(args[+k]) || (EN ? i18nNum(args[+k]) : args[+k])) : m);
// Einen Text übersetzen (oder beim Sammeln merken). Gibt null zurück, wenn nichts zu tun ist.
function trStr(s){
  if(!EN && !I18N_HARVEST) return null;
  const t = String(s).replace(/\s+/g, ' ').trim();
  if(!t || !/\p{L}/u.test(t) || I18N_OUT.has(t)) return null;
  if(I18N_HARVEST){ if(!I18N_SEEN.has(t)) I18N_SEEN.set(t, curPath()); return null; }
  if(I18N_CACHE.has(t)) return I18N_CACHE.get(t);
  const q = t.replace(/(\d)%/g, '$1 %');   // englische Zahlen „36.1%“ wie im deutschen Schlüssel „36,1 %“ behandeln
  let v = I18N[q], res = null;
  if(v === undefined){ const k = i18nKey(q, false); if(k.args.length && I18N[k.key] !== undefined) v = i18nFill(I18N[k.key], k.args);
    else { const k2 = i18nKey(q, true); if(k2.args.length && I18N[k2.key] !== undefined) v = i18nFill(I18N[k2.key], k2.args);
      else if(k2.key === '{0}' && I18N_DE2EN.has(k2.args[0])) v = I18N_DE2EN.get(k2.args[0]); } }   // deutscher Name allein
  if(v !== undefined){ res = v.replace(/(\d) %/g, '$1%'); I18N_OUT.add(res.replace(/\s+/g, ' ').trim()); }
  else if(!I18N_SEEN.has(t)) I18N_SEEN.set(t, curPath());   // fehlt im Wörterbuch → window.i18nMissing()
  if(I18N_CACHE.size > 20000) I18N_CACHE.clear();
  I18N_CACHE.set(t, res);
  return res;
}
const tr = s => { const v = trStr(s); return v === null ? s : v; };
const I18N_ATTRS = ['title', 'placeholder', 'aria-label', 'alt'];
function i18nNode(root){
  if(root.nodeType === 3){ const p = root.parentNode; if(!p || p.closest && p.closest('script,style,textarea,[data-noi18n]')) return;
    const v = trStr(root.nodeValue); if(v !== null){ const lead = root.nodeValue.match(/^\s*/)[0], tail = root.nodeValue.match(/\s*$/)[0]; root.nodeValue = lead + v + tail; } return; }
  if(root.nodeType !== 1 || root.closest('script,style,[data-noi18n]')) return;
  const tw = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {acceptNode: n=>n.nodeType===1 && /^(SCRIPT|STYLE|TEXTAREA)$/.test(n.tagName) || n.nodeType===1 && n.hasAttribute('data-noi18n') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT});
  let n = root;
  do {
    if(n.nodeType === 3){ const v = trStr(n.nodeValue); if(v !== null){ const lead = n.nodeValue.match(/^\s*/)[0], tail = n.nodeValue.match(/\s*$/)[0]; n.nodeValue = lead + v + tail; } }
    else {
      for(const a of I18N_ATTRS){ const x = n.getAttribute(a); if(x){ const v = trStr(x); if(v !== null) n.setAttribute(a, v); } }
      if(EN && n.tagName === 'A'){ const h = n.getAttribute('href'); if(h && h[0] === '/' && h[1] !== '/'){ const w = withLang(h); if(w !== h) n.setAttribute('href', w); } }
    }
  } while((n = tw.nextNode()));
}
function i18nStart(){
  if(!EN && !I18N_HARVEST) return;
  i18nNode(document.body);
  new MutationObserver(list=>{ for(const m of list){
    if(m.type === 'childList') m.addedNodes.forEach(i18nNode);
    else if(m.type === 'characterData') i18nNode(m.target);
    else if(m.type === 'attributes'){   // nur das geänderte Attribut prüfen, nicht den ganzen Inhalt
      const el = m.target, a = m.attributeName, x = el.getAttribute(a); if(!x || el.closest('[data-noi18n]')) continue;
      if(a === 'href'){ if(EN && el.tagName === 'A' && x[0] === '/' && x[1] !== '/'){ const w = withLang(x); if(w !== x) el.setAttribute('href', w); } }
      else { const v = trStr(x); if(v !== null) el.setAttribute(a, v); }
    }
  } }).observe(document.body, {childList:true, subtree:true, characterData:true, attributes:true, attributeFilter:['title','placeholder','aria-label','alt','href']});
  // Meldungen in Dialogen ebenfalls übersetzen
  const c = window.confirm.bind(window), p = window.prompt.bind(window), a = window.alert.bind(window);
  window.confirm = m => c(tr(m)); window.prompt = (m, d) => p(tr(m), d); window.alert = m => a(tr(m));
}
// Entwicklung: alle Texte ohne Übersetzung (auf /en/) bzw. alle gesammelten Texte (mit ?i18nharvest) als Liste
window.i18nMissing = () => [...I18N_SEEN.entries()].map(([t, p])=>p + '\t' + t).join('\n');
window.i18nKeys = () => [...I18N_SEEN.keys()].map(t=>{ const k = i18nKey(t, true); return k.key; });

// Sprachumschalter oben rechts: Schieberegler DE (links) ↔ EN (rechts), merkt sich die Wahl
const FLAG_DE = '<svg class="tl-flag" viewBox="0 0 5 3" aria-hidden="true"><path fill="#000" d="M0 0h5v1H0z"/><path fill="#D00" d="M0 1h5v1H0z"/><path fill="#FFCE00" d="M0 2h5v1H0z"/></svg>';
const FLAG_US = '<svg class="tl-flag" viewBox="0 0 190 100" aria-hidden="true"><path fill="#fff" d="M0 0h190v100H0z"/>'
  + [0,2,4,6,8,10,12].map(i=>`<path fill="#B22234" d="M0 ${(i*100/13).toFixed(2)}h190v${(100/13).toFixed(2)}H0z"/>`).join('')
  + '<path fill="#3C3B6E" d="M0 0h76v53.85H0z"/><g fill="#fff">'
  + [0,1,2,3].map(r=>[0,1,2,3,4].map(c=>`<circle cx="${9 + c*14.5 + (r%2)*7}" cy="${8 + r*12.5}" r="3"/>`).join('')).join('') + '</g></svg>';
$('#openSearch').insertAdjacentHTML('beforebegin', `<a class="tb-lang${EN ? ' is-en' : ''}" id="langBtn" href="${EN ? curPath() : '/en' + (curPath()==='/' ? '/' : curPath())}" hreflang="${EN ? 'de' : 'en'}" role="switch" aria-checked="${EN}" title="${EN ? 'Deutsche Version' : 'English version'}" aria-label="Deutsch / English" data-noi18n><i class="tl-knob"></i><span class="tl-opt tl-de">${FLAG_DE}<b>DE</b></span><span class="tl-opt tl-en">${FLAG_US}<b>EN</b></span></a>`);
$('#langBtn').addEventListener('click', e=>{
  e.preventDefault(); e.stopPropagation();
  try { localStorage.setItem('tftfreaks_lang', EN ? 'de' : 'en'); } catch(_){}
  const p = curPath(), to = (EN ? p : '/en' + (p === '/' ? '/' : p)) + location.search;
  e.currentTarget.classList.toggle('is-en', !EN);   // Regler erst rüberschieben, dann wechseln
  const still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  setTimeout(()=>{ location.href = to; }, still ? 0 : 220);
}, true);
i18nStart();

/* init */
renderSetSwitcher();
document.querySelectorAll('.data-src').forEach(el=>{ el.textContent = L(`Offizielle Spieldaten: CommunityDragon ${TFT_DATA.version} · Set ${TFT_DATA.set} · aktualisiert am ${new Date(TFT_DATA.generated).toLocaleDateString(LOC)}. Werte können sich mit Patches ändern.`, `Official game data: CommunityDragon ${TFT_DATA.version} · Set ${TFT_DATA.set} · updated on ${new Date(TFT_DATA.generated).toLocaleDateString(LOC)}. Values may change with patches.`); });
renderStatBar(); renderHome(); filterComps(); renderItemTL(); renderAugTL(); renderHoldTL(); renderChamps(); renderTraits(); renderItems(); renderRecipes(); route();
