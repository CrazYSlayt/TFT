/* TFT Freaks – Seitenlogik (früher direkt in index.html). Braucht vorher: data/sets.js + Set-Daten (siehe Lader in index.html) */
/* ================= DATA ================= */
const CDRAGON = id => `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/${id}.png`;

// Offizielle Champions aus data/tft-data.js (CommunityDragon)
const champions = TFT_DATA.champions.map(c=>({n:c.n, c:c.c, t:c.t}));
const champBy = Object.fromEntries(champions.map(c=>[c.n,c]));

// Eigene Trait-Texte und Einteilung (Ursprung/Klasse). Offizielle Namen, Breakpoints und Icons kommen aus data/tft-data.js.
const TRAIT_META = (window.TFT_CUSTOM && TFT_CUSTOM.traits) || {};
const plainDesc = s => String(s||'').replace(/<br>/gi,' ').replace(/<[^>]+>/g,'').replace(/@[^@]*@/g,'').replace(/\s+/g,' ').trim();
const traits = TFT_DATA.traits.map(x=>{ const m = TRAIT_META[x.n] || {}; return {n:x.n, cat:m.cat||'origin', bp:x.bp.map(String), d:m.d || plainDesc(x.desc)}; });




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
let ITEM_TL = tlPart('itemTL'), AUG_TL = tlPart('augTL');
const TL_PATCH = tierSource.data.patch || (TL_FILE && TL_FILE.patch) || '';
// Eigene Ergänzungen zum Set (data/custom-<Set>.js): Pflanzen-Bilder, Icons für Platzhalter-Augments
const TFT_CUSTOM_SET = window.TFT_CUSTOM && (!TFT_CUSTOM.set || TFT_CUSTOM.set===TFT_DATA.set) ? window.TFT_CUSTOM : {};
const PLANT_IMG = TFT_CUSTOM_SET.plants || {};
const AUG_IMG = Object.fromEntries((TFT_CUSTOM_SET.augmentIcons || []).map(id=>[id, 'assets/augments/' + id + '.webp']));
// Augments: offizielle Daten des gewählten Sets; die Stufe aus deiner Augment-Tierlist hat Vorrang
const AUG_TL_LV = {}; Object.values(AUG_TL).forEach(st=>Object.entries(st).forEach(([lv,tiers])=>Object.values(tiers).forEach(ids=>ids.forEach(id=>{ AUG_TL_LV[id] = +lv; }))));
const AUGS = TFT_DATA.augments.map(a=>Object.assign({}, a, {icon: TFT_DATA.cdn + a.icon, lv: AUG_TL_LV[a.id] || a.lv}));


const packages = [
  {n:'Einzelstunde',p:'30 €',u:'/ Stunde',f:false,l:['1 Stunde 1:1 Coaching auf Discord','10–15 Min. Fundamentals auffrischen','ca. 45 Min. VOD-Review oder dein Thema','Auf Deutsch oder Englisch']},
  {n:'3er-Paket',p:'80 €',u:'/ 3 Stunden',f:true,b:'Spar 10 €',l:['3 × 1 Stunde 1:1 Coaching','Fundamentals + VOD-Review in jeder Stunde','Sessions bauen aufeinander auf','Gültig für das laufende Set']},
  {n:'Team-Session',p:'20 €',u:'/ Person',f:false,l:['1 Stunde für 2–5 Personen','Fundamentals für die ganze Gruppe','Gemeinsames VOD-Review','Für dich und deine Freunde']},
];

// Stimmen gecoachter Spieler: q = Zitat, r = Fortschritt (z. B. 'Platin → Diamant'). Ohne Zitat erscheint ein Platzhalter.
const testimonials = [
  {n:'FreezeBomb', r:'Platin → Smaragd · 2 Sessions', q:'Eigenes Wissen mit den erklärten Konzepten vergleichen und im VOD-Review die eigenen Entscheidungen daran hinterfragen zu können – und Grundkonzepte zu lernen, die man vorher vielleicht gar nicht auf dem Schirm hatte.'},
  {n:'Doki', r:'Meister → Großmeister · Set 18', q:'Habe das erste Mal Grandmaster erreicht. Augments und Opener waren am hilfreichsten.'},
  {n:'Fist of Shadow', r:'', q:''},
  {n:'AgentZero', r:'', q:''},
  {n:'Moskau', r:'', q:''},
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
  location.hash = '#/tierlist';
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
const tierRow = (t,inner) => `<div class="tier-block" style="margin-top:12px"><div class="tier-letter tier-${t}">${t}</div><div class="tl-grid">${inner}</div></div>`;

let itlCat = 'craftables';
function renderItemTL(){
  if(!Object.keys(ITEM_TL).length){ $('#itemTiers').innerHTML = ornnSays(`Für Set ${TFT_DATA.set} gibt es noch keine Item-Tierlist. Erst testen, dann bewerten. Hmph.`); return; }
  const tl = ITEM_TL[itlCat] || {};
  $('#itemTiers').innerHTML = ['S','A','B','C'].filter(t=>(tl[t]||[]).length).map(t=>tierRow(t, tl[t].map(id=>{
    const it = findItem(id);
    return it ? `<button class="tl-card" data-item="${it.id}"><img src="${it.img}" alt="" loading="lazy"><div><h4>${esc(it.en)}</h4><small>${esc(it.de)}</small></div></button>` : '';
  }).join(''))).join('');
}
$('#itemTlFilters').addEventListener('click', e=>{
  const b=e.target.closest('.chip-btn'); if(!b) return;
  $('#itemTlFilters').querySelectorAll('.chip-btn').forEach(x=>x.classList.toggle('active', x===b));
  itlCat = b.dataset.itl; renderItemTL();
});

let augLv = '1', augStage = 'All';
const augCard = a => `<button class="tl-card" data-aug="${a.id}"><img src="${augImg(a)}" alt="" loading="lazy"><div><h4>${esc(a.en)}</h4>${a.de!==a.en?`<small>${esc(a.de)}</small>`:''}</div></button>`;
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
  ['comps','items','augments'].forEach(t=>{ $('#tl-'+t).hidden = t!==tab; });
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
  {k:'iron', n:'Eisen', f:'Iron', div:[0.006,0.27,1.1,1.4], d:'Der Einstieg ins Ranked. Hier zählen die Grundlagen: Leben schonen, Econ verstehen, eine Comp sicher spielen.'},
  {k:'bronze', n:'Bronze', f:'Bronze', div:[2.7,4.3,5.9,6.5], d:'Bronze trennt Neulinge von regelmäßigen Spielern. Wer Zinsen sauber mitnimmt, steigt hier schnell auf.'},
  {k:'silver', n:'Silber', f:'Silver', div:[9.8,9.7,9.5,7.1], d:'Silber ist die größte Gruppe der Spielerbasis. Stabil Top 4 spielen reicht, um hier rauszukommen.'},
  {k:'gold', n:'Gold', f:'Gold', div:[10,7.2,5.4,3.2], d:'Gold liegt zwischen Silber und Platin. Zwei Comps sicher beherrschen bringt dich zum nächsten Rang.'},
  {k:'platinum', n:'Platin', f:'Platinum', div:[5.3,3.1,2.1,1.1], d:'Platin ist klar überdurchschnittlich. Positionierung und Item-Entscheidungen machen jetzt den Unterschied.'},
  {k:'emerald', n:'Smaragd', f:'Emerald', div:[1.7,0.89,0.55,0.25], d:'Smaragd gehört zur oberen Spitze. Flexibel spielen und die Lobby lesen wird hier Pflicht.'},
  {k:'diamond', n:'Diamant', f:'Diamond', div:[0.42,0.19,0.11,0.03], d:'Diamant ist die Elite der Ranglisten-Spieler. Jeder Fehler kostet hier spürbar LP.'},
  {k:'master', n:'Meister', f:'Master', pct:0.21, d:'Ab Meister gibt es keine Divisionen mehr – nur noch LP. Jede Partie zählt direkt.'},
  {k:'grandmaster', n:'Großmeister', f:'GrandMaster', pct:0.05, d:'Großmeister gehören zu den besten Spielern ihrer Region. Die LP-Grenze hängt vom Server ab.'},
  {k:'challenger', n:'Challenger', f:'Challenger', pct:0.023, d:'Die Spitze jeder Region – mit begrenzten Plätzen. Höher geht es nicht.'},
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
const fmtPct = v => v.toLocaleString('de-DE', {maximumFractionDigits: v < 0.1 || (v > 99.9 && v < 100) ? 3 : v < 1 || v > 99 ? 2 : 1}) + ' %';
const rankBy = Object.fromEntries(RANK_TIERS.map(t=>[t.k,t]));

function rankCell(e, extra=''){
  const label = e.t.n + (e.d ? ' ' + e.d : '');
  return `<a class="rk-cell${extra}" href="#/ranks/${e.t.k}" title="${esc(label)}: ${fmtPct(e.p)} der Spieler"><span class="rk-emb"><img src="${rankImg(e.t)}" alt="" loading="lazy">${e.d?`<b class="rk-div">${e.d}</b>`:''}</span><span><strong>${esc(label)}</strong><small>${fmtPct(e.p)} · Top ${fmtPct(e.top)}</small></span></a>`;
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
  const t = rankBy[key]; if(!t){ location.hash = '#/ranks'; return; }
  const idx = RANK_TIERS.indexOf(t), prev = RANK_TIERS[idx-1], next = RANK_TIERS[idx+1];
  // Meister, Großmeister und Challenger als gemeinsame Gruppe (wie Divisionen) behandeln
  const apex = !t.div;
  const es = apex ? RANK_ENTRIES.filter(e=>!e.d) : RANK_ENTRIES.filter(e=>e.t===t);
  const view = rkView;
  const groupLabel = apex ? 'Meister – Challenger' : ` IV–I`;
  const items = view==='all'
    ? RANK_TIERS.map(x=>({k:x.k, v:x.total, label:x.n, img:rankImg(x), href:'#/ranks/'+x.k}))
    : es.map(e=>{ const l = e.t.n + (e.d ? ' ' + e.d : ''); return {k: apex ? e.t.k : e.d, v:e.p, label:l, short:l, img:rankImg(e.t), href: apex ? '#/ranks/'+e.t.k : null}; });
  const where = (prev ? `Über ${prev.n}. ` : 'Der Einstieg ins Ranked. ') + (next ? `Nächster Rang: ${next.n}.` : 'Höher geht es nicht.');
  const exact = RANK_ENTRIES.slice().reverse().map(e=>`<tr${e.t===t?' class="on"':''}><td>${esc(e.t.n+(e.d?' '+e.d:''))}</td><td>${fmtPct(e.p)}</td><td>Top ${fmtPct(e.top)}</td></tr>`).join('');
  $('#rk-detail').innerHTML = `
    <div class="rk-back"><a href="#/ranks">← Alle TFT-Ränge</a> / <span>${esc(t.n)}</span></div>
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
  if(v){ rkView = v.dataset.rkview; renderRankDetail(location.hash.split('/')[2]); return; }
  const b = e.target.closest('.rk-bar[data-href]'); if(b) location.hash = b.dataset.href;
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
  let rows = '';
  for(let k=0;k<4;k++){
    const r = flip ? 3-k : k;
    let cells = '';
    for(let j=0;j<7;j++){
      const h = r*7 + (flip ? 6-j : j), b = board[h], key = `${side}:${h}`;
      const sel = bSel && bSel.type==='hex' && bSel.side===side && +bSel.id===h ? ' sel' : '';
      if(!b){ cells += `<div class="hex${sel}" data-hex="${h}" data-side="${side}"><div class="hex-bg"></div></div>`; continue; }
      const ch = champBy[b.u], plant = PLANTS[b.u];
      const its = b.i.map((id,n)=>{ const it=findItem(id); return it?`<img src="${it.img}" alt="${esc(it.en)}" title="${esc(it.en)} – Klick entfernt" data-unequip="${key}:${n}" draggable="true">`:''; }).join('');
      cells += `<div class="hex filled c${ch?ch.c:1}${plant?' plant':''}${sel}" data-hex="${h}" data-side="${side}" draggable="true" title="${esc(b.u)}"><div class="hex-bg"></div><div class="hex-img" style="background-image:${champBg(b.u)}"></div>`
        + `<button class="hex-stars b-star${b.s===1?' one':''}" data-star="${key}" type="button" title="Sterne ändern (${b.s}★)">${'★'.repeat(b.s)}</button>`
        + `<button class="b-x" data-remove="${key}" type="button" aria-label="${esc(b.u)} entfernen">✕</button>`
        + (its?`<div class="hex-items">${its}</div>`:'') + `<span class="hex-name">${esc(b.u)}</span></div>`;
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
  bTrack();
  if(!bEnemy && bActive==='e') bActive = 'm';
  $('#bRowE').hidden = !bEnemy;
  $('#bRows').classList.toggle('b-two', bEnemy);
  $('#bEnemy').checked = bEnemy;
  document.querySelectorAll('[data-panel]').forEach(p=>p.classList.toggle('active', bEnemy && p.dataset.panel===bActive));
  renderSide('m'); if(bEnemy) renderSide('e');
  $('#bAlt').innerHTML = bAlt.map((u,i)=>`<div class="b-altslot${u?' filled':''}" data-alt="${i}" title="${u?esc(u)+' – Klick entfernt':'Unit hierher ziehen'}">${u?hexHTML(u):'<div class="hx b-emptyhx"><div class="hx-in"></div></div>'}</div>`).join('');
  $('#bUndo').disabled = !bHist.length; $('#bRedo').disabled = !bRedo.length;
  try { localStorage.setItem(BUILDER_KEY, bEncode()); localStorage.setItem(BUILDER_ENEMY_KEY, bEnemy ? '1' : '0'); } catch(e){}
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
function builderRoute(sub, code2){
  // Links: #/builder/<Set>/<Code> – gehört der Link zu einem anderen Set, wird dorthin gewechselt
  if(sub && /^\d+$/.test(sub)){ if(+sub !== TFT_DATA.set){ try { localStorage.setItem('tftfreaks_set', sub); } catch(e){} location.reload(); return; } sub = code2 || ''; if(!sub) history.replaceState(null, '', '#/builder'); }
  if(sub){ bApplyState(bDecode(sub)); bCtx = null; bResetHistory(); history.replaceState(null, '', '#/builder'); }
  else if(!bLoaded){ const keep = bEnemy; try { bApplyState(bDecode(localStorage.getItem(BUILDER_KEY) || (TFT_DATA.set===18 ? localStorage.getItem('tftfreaks_builder_v1') : '') || '')); } catch(e){ bApplyState(bDecode('')); } bEnemy = keep || bEnemy; bResetHistory(); }
  bLoaded = true; bSel = null;
  renderBuilderCtx(); renderPool(); renderBuilder(); bHint('');
}
function openInBuilder(c, ctx){
  if(!c) return;
  bBoard = {};
  (c.board||[]).forEach(b=>{ if(b.h==null || b.h<0 || b.h>27) return; bBoard[b.h] = {u:b.u, s:b.s||1, i:(b.i||[]).map(id=>(findItem(id)||{}).id).filter(Boolean).slice(0,3)}; });
  bAugs = (c.augs||[]).filter(id=>augById[id]).slice(0,3);
  bAlt = [(c.alt||[])[0] ? c.alt[0].u : null, (c.alt||[])[1] ? c.alt[1].u : null];
  bActive = 'm'; bCtx = ctx || null; bLoaded = true; bResetHistory();
  if(location.hash==='#/builder') builderRoute(); else location.hash = '#/builder';
}
// Aktionen
function bPlace(side, h, name){ sideBoard(side)[h] = {u:name, s:1, i:[]}; }
function bAdd(name){
  const board = sideBoard(bActive);
  const order = [21,22,23,24,25,26,27,14,15,16,17,18,19,20,7,8,9,10,11,12,13,0,1,2,3,4,5,6]; // hintere Reihe zuerst
  const h = order.find(x=>!board[x]);
  if(h===undefined){ bHint('Das Brett ist voll.'); return; }
  bPlace(bActive, h, name); renderBuilder(); bHint(`${name} platziert${bEnemy ? (bActive==='e' ? ' (Gegner)' : ' (dein Board)') : ''}.`);
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
  const draw = q => { q = (q||'').toLowerCase(); const cur = sideAugs(side); return AUGS.filter(a=>!cur.includes(a.id) && (!q || a.en.toLowerCase().includes(q) || a.de.toLowerCase().includes(q))).sort((a,b)=>(a.lv||9)-(b.lv||9) || a.en.localeCompare(b.en)).slice(0,120)
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
  if(id==='bShare'){ bCopy(location.href.split('#')[0] + '#/builder/' + TFT_DATA.set + '/' + bEncode(), 'Link kopiert!'); return; }
  if(id==='bCopyCode'){ bCopy(bEncode() || '(leer)', 'Team-Code kopiert!'); return; }
  if(id==='bImport'){
    const v = prompt('Team-Code oder Link einfügen:'); if(!v) return;
    let code = v.includes('#/builder/') ? v.split('#/builder/')[1] : v.trim();
    const sm = code.match(/^(\d+)\/(.*)$/);
    if(sm){ if(+sm[1] !== TFT_DATA.set){ if(confirm(`Dieser Link gehört zu Set ${sm[1]}. Jetzt zu Set ${sm[1]} wechseln?`)){ try { localStorage.setItem('tftfreaks_set', sm[1]); } catch(e){} history.replaceState(null, '', '#/builder/' + code); location.reload(); } return; } code = sm[2]; }
    const st = bDecode(code); if(!Object.keys(st.board).length && !st.augs.length && !Object.keys(st.eboard).length){ bHint('Code nicht erkannt.'); return; }
    bApplyState(st); bSel = null; renderBuilder(); bHint('Team importiert.'); return;
  }
  if(id==='bApply'){ bApplyToComp(); return; }
  if(id==='bCancel'){ bCtx = null; location.hash = '#/admin'; return; }
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
  adm = JSON.parse(JSON.stringify({version:1, set:TFT_DATA.set, patch:d.patch||TL_PATCH, updated:d.updated||'', source:d.source||'', basedOn:d.basedOn||'', comps:d.comps, itemTL:d.itemTL||ITEM_TL, augTL:d.augTL||AUG_TL}));
}
function admStatus(t){ const el = $('#admStatus'); if(el) el.textContent = t; }
function admSourceText(){ return tierSource.src==='draft' ? 'Entwurf in diesem Browser aktiv' : tierSource.src==='file' ? `Veröffentlichter Stand (tierlist-data-${TFT_DATA.set}.js${tierSource.data.source==='TFTAcademy'?', TFTAcademy-Ausgangsstand':''})` : `Set ${TFT_DATA.set}: noch keine Tierlist – leg mit „+ Neue Comp“ los`; }
function admSave(msg){
  admEnsure();
  adm.updated = new Date().toISOString().slice(0,10);
  if(adm.source && adm.source!=='TFT Freaks'){ adm.basedOn = adm.source; } adm.source = 'TFT Freaks';
  let ok = true; try { localStorage.setItem(TL_DRAFT_KEY, JSON.stringify(adm)); } catch(e){ ok = false; }
  tierSource = {src:'draft', data:adm};
  rebuildComps(adm.comps); filterComps(); updateTlNote();
  admStatus(ok ? (msg || 'Entwurf gespeichert · ' + new Date().toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'})) : 'Speichern im Browser nicht möglich – bitte exportieren!');
}
function updateTlNote(){
  const el = $('#tlSrc'); if(!el) return;
  const D = tierSource.data, link = '<a href="https://tftacademy.com/tierlist/comps" target="_blank" rel="noopener" style="text-decoration:underline">TFTAcademy</a>';
  if(!(D.comps||[]).length){ el.textContent = `Für Set ${TFT_DATA.set} gibt es noch keine Tierlist.`; return; }
  if(D.source==='TFTAcademy'){ el.innerHTML = `Stand: Patch ${esc(D.patch||TL_PATCH)} · Bewertungen und Aufstellungen nach ${link}`; return; }
  const d = D.updated ? new Date(D.updated).toLocaleDateString('de-DE') : '';
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
  admEnsure(); renderAdminRows(); renderAdminEdit(); admStatus(admSourceText());
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
  admSel = c.slug; bCtx = null; admSave('Aufstellung übernommen'); location.hash = '#/admin';
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
    const data = {version:1, set:TFT_DATA.set, patch:adm.patch, updated:adm.updated || new Date().toISOString().slice(0,10), source:adm.source || 'TFT Freaks', basedOn:adm.basedOn || '', comps:adm.comps, itemTL:adm.itemTL || ITEM_TL, augTL:adm.augTL || AUG_TL};
    const js = '// TFT Freaks – Tierlist-Daten, exportiert aus der Redaktion am ' + new Date().toLocaleString('de-DE') + '\n// Datei neben die index.html legen, dann sehen alle Besucher diesen Stand.\nwindow.TIERLIST_DATA = ' + JSON.stringify(data) + ';\n';
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([js], {type:'text/javascript'})); a.download = `tierlist-data-${TFT_DATA.set}.js`;
    document.body.appendChild(a); a.click(); setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); }, 500);
    admStatus(`Exportiert: tierlist-data-${TFT_DATA.set}.js – neben die index.html legen.`); return;
  }
  if(t.id==='admReset'){
    if(!confirm('Entwurf verwerfen? Danach gilt wieder der veröffentlichte Stand (tierlist-data-' + TFT_DATA.set + '.js) bzw. der eingebaute Stand.')) return;
    try { localStorage.removeItem(TL_DRAFT_KEY); } catch(err){}
    tierSource = loadTierSource(); ITEM_TL = tlPart('itemTL'); AUG_TL = tlPart('augTL'); adm = null; admSel = null; rebuildComps(tierSource.data.comps); filterComps(); renderItemTL(); renderAugTL(); updateTlNote(); renderAdmin(); return;
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

/* ================= SET-AUSWAHL (Live / PBE / Archiv) ================= */
const SET_LABEL = {live:'Live', pbe:'PBE', archiv:'Archiv'};
const setStatus = () => (window.TFT_SET && TFT_SET.status) || TFT_DATA.channel || 'live';
const fmtDay = d => { const x = new Date(d); return isNaN(x) ? '' : x.toLocaleDateString('de-DE'); };
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
  if(location.hash.startsWith('#/builder/')) history.replaceState(null, '', '#/builder');
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
  tools(){ return ['Werkzeug? Das schmiede ich selbst. Gib mir Zeit.', 'Ein Team-Planer braucht mehr als einen Hammerschlag.', 'Wer drängelt, bekommt schiefe Klingen. Hmph.', 'Bis dahin tut es die Rezept-Tabelle in der Bibliothek.']; },
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
document.querySelectorAll('[data-buddy]').forEach(el=>{
  const key = el.dataset.buddy;
  buddyNext(key, true);
  el.querySelector('.buddy-img').addEventListener('click', ()=>{ (buddyState[key]||{}).hold = 0; buddyNext(key); });
  el.addEventListener('mouseenter', ()=>{ el.dataset.hover = '1'; });
  el.addEventListener('mouseleave', ()=>{ delete el.dataset.hover; });
});
setInterval(()=>{
  const page = document.querySelector('.page.active'); if(!page || document.hidden) return;
  const el = page.querySelector('[data-buddy]'); if(!el || el.dataset.hover) return;
  const st = buddyState[el.dataset.buddy]; if(st && st.hold > Date.now()) return;
  buddyNext(el.dataset.buddy);
}, 9000);
$('#tlTabs').addEventListener('click', e=>{
  const b=e.target.closest('.tab'); if(!b) return;
  location.hash = b.dataset.tab==='comps' ? '#/tierlist' : '#/tierlist/'+b.dataset.tab;
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
  $('#champGrid').innerHTML = list.map(c=>`<button class="champ" data-champ="${esc(c.n)}">${avatar(c.n,56)}<div><h4>${esc(c.n)}</h4><div class="cost"><span class="coin"></span>${c.c} Gold</div><div class="trait-mini">${c.t.map(t=>`<span style="display:inline-flex;align-items:center;gap:4px"><img src="${traitImg(t)}" alt="" width="12" height="12" style="width:12px;height:12px;filter:brightness(1.6)" onerror="this.remove()">${esc(t)}</span>`).join('')}</div></div></button>`).join('');
}
$('#costFilters').addEventListener('click', e=>{
  const b=e.target.closest('.chip-btn'); if(!b) return;
  $('#costFilters').querySelectorAll('.chip-btn').forEach(x=>x.classList.remove('active'));
  b.classList.add('active'); costF=b.dataset.cost; renderChamps();
});
$('#champSearch').addEventListener('input', renderChamps);

function openChamp(name){
  const c = champBy[name]; if(!c) return;
  const tr = c.t.map(tn=>{const t=traits.find(x=>x.n===tn); return t?`<div class="trait" style="margin-top:10px"><div class="trait-top">${traitHex(t.n, t.bp.length===1?'unique':'base', 28)}<h4>${esc(t.n)}</h4><div class="bp">${t.bp.map(b=>`<span>${b}</span>`).join('')}</div></div><p style="margin:0">${esc(t.d)}</p></div>`:'';}).join('');
  const inComps = comps.filter(x=>x.core.includes(c.n)).map(x=>`<button class="it-link" data-comp="${x.slug}" style="padding:4px 12px">${x.tier} · ${esc(x.name)}</button>`).join('') || '<span class="note" style="margin:0">Noch in keiner Tierlist-Comp.</span>';
  // Häufigste Items auf diesem Champion über alle Comps
  const freq = {};
  comps.forEach(x=>[...x.board, ...x.alt].forEach(b=>{ if(b.u===c.n) (b.i||[]).forEach(id=>{ const it=findItem(id); if(it) freq[it.id]=(freq[it.id]||0)+1; }); }));
  const best = Object.entries(freq).sort((a,b)=>b[1]-a[1]).slice(0,6).map(([id])=>itLink(itemById[id])).join('');
  $('#modalBody').innerHTML = `<div style="display:flex;gap:16px;align-items:center;margin-bottom:6px">${avatar(c.n,64)}<div><h2 style="margin:0">${esc(c.n)}</h2><div class="cost"><span class="coin"></span> ${c.c} Gold</div></div></div>
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
      <div class="bp">${t.bp.map(b=>`<span>${b}</span>`).join('')}</div><p>${esc(t.d)}</p>
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
const fmtNum = v => String(Math.round(v*100)/100).replace('.',',');
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
  if(t){ const n=t.dataset.trait; location.hash='#/bibliothek/traits'; setTimeout(()=>{ $('#traitSearch').value=n; renderTraits(); },10); }
});

/* ================= HOME ================= */
function pkgHTML(p){
  return `<div class="card pkg ${p.f?'featured':''}">${p.f||p.b?`<span class="pill${p.b?' gold':''}" style="align-self:flex-start;margin-bottom:8px">${esc(p.b||'Beliebt')}</span>`:''}<h3 style="margin:0">${esc(p.n)}</h3><div class="price">${p.p} <small>${p.u}</small></div><ul>${p.l.map(x=>`<li>${esc(x)}</li>`).join('')}</ul><a href="#/apply" class="btn ${p.f?'btn-primary':'btn-ghost'}" style="justify-content:center">Kennenlernen anfragen</a></div>`;
}
function testimonialHTML(t){
  if(!t.q) return `<div class="card co-quote soon"><span class="co-qm" aria-hidden="true">“</span><p>Feedback folgt</p><b>${esc(t.n)}</b></div>`;
  return `<figure class="card co-quote"><span class="co-qm" aria-hidden="true">“</span><blockquote>${esc(t.q)}</blockquote><figcaption><b>${esc(t.n)}</b>${t.r?`<span>${esc(t.r)}</span>`:''}</figcaption></figure>`;
}
function guideHTML(g){
  return `<div class="card guide"><div class="guide-cover" style="background:${g.col}"><div>${esc(g.t)}<small>TFT Freaks</small></div></div><div><span class="pill">${esc(g.s)}</span><h3 style="margin-top:10px">${esc(g.t)}</h3><p>${esc(g.d)}</p><p style="color:var(--faint);font-size:.82rem">${esc(g.x)}</p><span class="link-arrow">Bald verfügbar</span></div></div>`;
}
function renderHome(){
  $('#ranks').innerHTML = ranks.map(([n,c,f])=>`<a href="#/ranks/${f.toLowerCase()}" class="rank"><div class="rank-gem"><img src="${DD}tft-regalia/TFT_Regalia_${f}.png" alt="TFT Rang ${n}" loading="lazy" onerror="this.outerHTML='<span style=&quot;font:900 1.4rem var(--ff-head);color:${c}&quot;>${n[0]}</span>'"></div>${n}</a>`).join('');
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
  ...traits.map(t=>({label:t.n,type:t.cat==='origin'?'Ursprung':'Klasse',html:traitHex(t.n, t.bp.length===1?'unique':'base', 34),go:()=>{closeSearch();location.hash='#/bibliothek/traits';setTimeout(()=>{$('#traitSearch').value=t.n;renderTraits();},10);}})),
  ...ITEMS.map(it=>({label:it.en,alt:it.de,type:'Item · '+(ITEM_CATS.find(([k])=>k===it.cat)||[])[1],html:`<img src="${it.img}" alt="" width="40" height="40" loading="lazy" style="width:40px;height:40px;border-radius:8px">`,go:()=>{closeSearch();openItem(it.id);}})),
  ...AUGS.map(a=>({label:a.en,alt:a.de,type:'Augment'+(a.lv?' · '+AUG_LV[a.lv]:''),html:`<img src="${augImg(a)}" alt="" width="40" height="40" loading="lazy" style="width:40px;height:40px;border-radius:8px">`,go:()=>{closeSearch();openAug(a.id);}})),
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
  rank:'<path d="M12 3l7 4v6c0 4-3 6.5-7 8-4-1.5-7-4-7-8V7z"/><path d="M12 8l1.2 2.5 2.8.3-2.1 1.9.6 2.8-2.5-1.4-2.5 1.4.6-2.8-2.1-1.9 2.8-.3z"/>',
  lib:'<path d="M4 4h4v16H4zM10 4h4v16h-4z"/><path d="M16 5l3.5-1 3 15.5-3.5 1z"/>',
  news:'<path d="M4 5h13v14H6a2 2 0 0 1-2-2z"/><path d="M17 9h3v8a2 2 0 0 1-2 2"/><path d="M8 9h5M8 13h5"/>',
  builder:'<path d="M7 3.5l4 2.3v4.6l-4 2.3-4-2.3V5.8z"/><path d="M17 3.5l4 2.3v4.6l-4 2.3-4-2.3V5.8z"/><path d="M12 12l4 2.3v4.6l-4 2.3-4-2.3v-4.6z"/>',
  tools:'<path d="M14.5 6.5a4 4 0 0 0-5.4 5.1L4 16.7 7.3 20l5.1-5.1a4 4 0 0 0 5.1-5.4l-2.4 2.4-2.4-.6-.6-2.4z"/>'
};
const NAV = [
  {r:'home', h:'#/', l:'Home', mascot:true},
  {r:'tierlist', h:'#/tierlist', l:'Tierlist', s:'tier', badge: mainComps.length ? TL_PATCH : (setStatus()==='pbe' ? 'PBE' : '')},
  {r:'bibliothek', h:'#/bibliothek', l:'Bibliothek', s:'lib'},
  {r:'ranks', h:'#/ranks', l:'Ranks', s:'rank'},
  {r:'builder', h:'#/builder', l:'Team Builder', s:'builder'},
  {r:'tools', h:'#/tools', l:'Tools', s:'tools', badge:'Bald'},
  {r:'coaching', h:'#/coaching', l:'Coaching', s:'coach'},
  {r:'guides', h:'#/guides', l:'Guides', s:'guide', more:true},
  {r:'about', h:'#/about', l:'Meet the Team', s:'about', more:true},
  {r:'apply', h:'#/apply', l:'Bewerbung', s:'apply', more:true},
];function navIcon(n){
  if(n.mascot) return '<span class="tb-ic"><span class="m-face" style="width:100%;height:100%"></span></span>';
  const svg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">${SVGI[n.s]}</svg>`;
  if(!n.img) return `<span class="tb-ic svg">${svg}</span>`;
  return `<span class="tb-ic"><img src="${champImg(n.img)}" alt="" loading="lazy" onerror="this.parentNode.classList.add('svg');this.outerHTML=this.parentNode.dataset.svg"></span>`.replace('<span class="tb-ic">', `<span class="tb-ic" data-svg='${svg}'>`);
}
$('#tbNav').innerHTML = NAV.filter(n=>!n.more).map(n=>`<a href="${n.h}" class="tb-item" data-route="${n.r}">${n.badge?`<span class="tb-badge">${n.badge}</span>`:''}${navIcon(n)}<span>${n.l}</span></a>`).join('')
  + '<button class="tb-item tb-more" id="moreBtn" aria-haspopup="true" aria-label="Mehr">···</button>';
$('#moreMenu').innerHTML = NAV.filter(n=>n.more).map(n=>`<a href="${n.h}" data-route="${n.r}">${navIcon(n)}${n.l}</a>`).join('');
$('#drawerPanel').innerHTML = `<a href="#/" class="tb-logo" style="border:0;padding:6px 10px 14px;font-size:1.7rem" aria-label="TFT Freaks Startseite"><span class="tft-logo" aria-hidden="true"></span><div><span>TFT</span> <b>Freaks</b></div></a>
  <h5>Tierlist & Daten</h5>${NAV.filter(n=>['tierlist','bibliothek','ranks','builder','tools'].includes(n.r)).map(n=>`<a href="${n.h}" data-route="${n.r}">${navIcon(n)}${n.l}</a>`).join('')}
  <h5>TFT Freaks</h5>${NAV.filter(n=>['home','coaching','guides','about','apply'].includes(n.r)).map(n=>`<a href="${n.h}" data-route="${n.r}">${navIcon(n)}${n.l}</a>`).join('')}`;
const moreMenu = $('#moreMenu');
$('#moreBtn').onclick = e=>{ e.stopPropagation(); const r=e.currentTarget.getBoundingClientRect(); moreMenu.style.left=Math.min(r.left, innerWidth-240)+'px'; moreMenu.classList.toggle('open'); };
document.addEventListener('click', e=>{ if(!e.target.closest('#moreMenu')) moreMenu.classList.remove('open'); });
const drawer = $('#drawer');
$('#burger').onclick = ()=>drawer.classList.add('open');
drawer.addEventListener('click', e=>{ if(e.target.closest('[data-drawer-close]') || e.target.closest('a')) drawer.classList.remove('open'); });

// Meet the Team: Übersicht (#/about) oder Profil (#/about/<name>)
function setAbout(sub){
  const views = [...document.querySelectorAll('#page-about .mt-view')];
  const key = views.some(v=>v.dataset.about && v.dataset.about===sub) ? sub : '';
  views.forEach(v=>v.hidden = v.dataset.about!==key);
}

function route(){
  // normale Sprunganker (z. B. #main) nicht als Seite behandeln
  const routed = !location.hash || location.hash.startsWith('#/');
  if(!routed && document.querySelector('.page.active')) return;
  const parts = routed ? location.hash.replace(/^#\/?/,'').split('/') : [''];
  let page = parts[0] || 'home', sub = parts[1];
  // alte Adressen weiter unterstützen
  if(['champions','items','traits'].includes(page)){ sub = page; page = 'bibliothek'; }
  if(page==='augments'){ sub = 'augments'; page = 'tierlist'; }
  const valid = ['home','tierlist','bibliothek','ranks','builder','admin','news','tools','coaching','guides','about','apply','impressum','datenschutz'];
  if(!valid.includes(page)) page='notfound';
  const pageId = page==='bibliothek' ? 'library' : page;
  document.querySelectorAll('.page').forEach(p=>p.classList.toggle('active', p.id==='page-'+pageId));
  let navKey = page;
  if(page==='tierlist') setTab(['items','augments'].includes(sub)?sub:'comps');
  if(page==='bibliothek') setLib(['items','traits'].includes(sub)?sub:'champions');
  if(page==='ranks') setRank(sub);
  if(page==='builder') builderRoute(sub, parts[2]);
  if(page==='admin') renderAdmin();
  if(page==='about') setAbout(sub);
  document.querySelectorAll('[data-route]').forEach(a=>a.classList.toggle('active', a.dataset.route===navKey));
  if(['guides','about','apply'].includes(navKey)) $('#moreBtn').classList.add('active');
  else $('#moreBtn').classList.remove('active');
  moreMenu.classList.remove('open'); drawer.classList.remove('open');
  closeModal(); window.scrollTo(0,0);
}
window.addEventListener('hashchange', route);

/* init */
renderSetSwitcher();
document.querySelectorAll('.data-src').forEach(el=>{ el.textContent = `Offizielle Spieldaten: CommunityDragon ${TFT_DATA.version} · Set ${TFT_DATA.set} · aktualisiert am ${new Date(TFT_DATA.generated).toLocaleDateString('de-DE')}. Werte können sich mit Patches ändern.`; });
renderHome(); filterComps(); renderItemTL(); renderAugTL(); renderChamps(); renderTraits(); renderItems(); renderRecipes(); route();
