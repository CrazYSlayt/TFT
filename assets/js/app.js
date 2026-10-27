/* TFTClimb – Seitenlogik (früher direkt in index.html). Braucht vorher: data/sets.js + Set-Daten (siehe Lader in index.html) */
/* ================= ADRESSEN ================= */
// Online echte Pfade (/tierlist/items), lokal per Doppelklick (file://) wie bisher #/tierlist/items
const FILE_MODE = location.protocol === 'file:';
// Sprache: Englisch unter /en/… (festgelegt im Kopf von index.html), sonst Deutsch. Intern arbeiten alle Pfade ohne /en.
const LANG = window.TFT_LANG === 'en' ? 'en' : 'de', EN = LANG === 'en', LOC = EN ? 'en-GB' : 'de-DE';
const L = (de, en) => EN ? en : de;   // kurze Texte direkt im Code übersetzen
const ND = document.documentElement.classList.contains('nd');   // Vorschau neues Design (?design=neu, siehe index.html)
const rawPath = () => (FILE_MODE ? location.hash.replace(/^#/, '') : location.pathname) || '/';
// interner Pfad = deutscher Pfad ohne /en (englische Adressen werden über fromEn() auf die deutschen zurückgeführt)
const curPath = () => { const p = rawPath(); return fromEn(EN ? (p.replace(/^\/en(?=\/|$)/, '') || '/') : p); };
// Sprechende Adressen für Google: das Keyword steht in der Adresse (/tools/tft-item-drop-chance), intern bleiben die kurzen Schlüssel (drops).
// Alte Adressen leiten weiter – online per 301 (vercel.json), in der Seite über seoPath(). Gleiche Listen in api/sitemap.js
const TOOL_SLUG = {rolldown:'tft-rolldown-rechner', drops:'tft-item-drop-chance', tierlist:'tft-tierlist-maker', simulator:'tft-kampf-simulator', dps:'tft-dps-vergleich', augments:'tft-augment-vorhersage'};
const CS_SLUG = {shop:'tft-shop-odds', augments:'tft-augment-stufen', orbs:'tft-loot-orbs', loot:'tft-loot-verteilung', damage:'tft-spielerschaden', emblems:'tft-embleme', solo:'tft-stage-1-solo', 'patch-schedule':'tft-patch-plan', carousel:'tft-karussell'};   // sonst „tft-“ + Schlüssel
const GUIDE_SLUG = {encounters:'tft-encounters'};
// Englische Seite: eigene englische Adressen mit englischem Keyword (/en/tools/tft-rolldown-calculator, /en/library …).
// toEn() macht aus einem internen (deutschen) Pfad den englischen, fromEn() umgekehrt
const TOOL_SLUG_EN = {rolldown:'tft-rolldown-calculator', drops:'tft-item-drop-chance', tierlist:'tft-tier-list-maker', simulator:'tft-fight-simulator', dps:'tft-dps-comparison', augments:'tft-augment-prediction'};
const CS_SLUG_EN = {shop:'tft-shop-odds', augments:'tft-augment-tiers', orbs:'tft-loot-orbs', loot:'tft-loot-distribution', damage:'tft-player-damage', emblems:'tft-emblems', solo:'tft-solo-stage-1', 'patch-schedule':'tft-patch-schedule', carousel:'tft-carousel'};
const PAGE_EN = {tierlist:'tier-list', bibliothek:'library', impressum:'legal-notice', datenschutz:'privacy-policy', bedingungen:'terms', 'tft-patch-countdown':'tft-next-patch-countdown'};
function langPath(p, en){   // en = true: deutsch → englisch, false: englisch → deutsch
  const i = p.search(/[?#]/), rest = i < 0 ? '' : p.slice(i), s = (i < 0 ? p : p.slice(0, i)).split('/');
  const [pages, tools, csFrom, csTo] = en ? [PAGE_EN, [TOOL_SLUG, TOOL_SLUG_EN], CS_SLUG, CS_SLUG_EN] : [Object.fromEntries(Object.entries(PAGE_EN).map(([a, b])=>[b, a])), [TOOL_SLUG_EN, TOOL_SLUG], CS_SLUG_EN, CS_SLUG];
  if(s[1]==='tools' && s[2]){ const k = unslug(tools[0], s[2]); if(tools[1][k]) s[2] = tools[1][k]; }
  if(s[1]==='cheatsheet' && s[2]){ const k = unslug(csFrom, s[2]); if(k !== s[2]) s[2] = csTo[k] || 'tft-' + k; }
  if(pages[s[1]]) s[1] = pages[s[1]];
  return s.join('/') + rest;
}
function toEn(p){ return langPath(p, true); }
function fromEn(p){ return langPath(p, false); }
const BUILDER_PATH = '/tft-team-builder', COUNTDOWN_PATH = '/tft-patch-countdown';   // intern: builder, countdown
const toolHref = k => '/tools/' + (TOOL_SLUG[k] || k), csHref = id => '/cheatsheet/' + (CS_SLUG[id] || 'tft-' + id);
const unslug = (map, s) => (Object.entries(map).find(([, v])=>v === s) || [s])[0];
const seoPath = p => p.replace(/^\/builder(?=[/?#]|$)/, BUILDER_PATH).replace(/^\/countdown(?=[/?#]|$)/, COUNTDOWN_PATH)
  .replace(/^\/tools\/([^/?#]+)/, (m, k)=>TOOL_SLUG[k] ? toolHref(k) : m)
  .replace(/^\/cheatsheet\/([^/?#]+)/, (m, k)=>/^tft-/.test(k) ? m : csHref(k))
  .replace(/^\/guides\/([^/?#]+)/, (m, k)=>GUIDE_SLUG[k] ? '/guides/' + GUIDE_SLUG[k] : m);
const enPath = p => p === '/' ? '/en/' : '/en' + toEn(seoPath(p));   // englische Adresse zu einem internen Pfad
const withLang = p => { p = seoPath(p); return EN && /^\/(?!en(\/|$)|api\/|assets\/|data\/)/.test(p) ? '/en' + toEn(p) : (EN && p === '/' ? '/en/' : p); };
function setUrl(path){ path = withLang(path); history.replaceState(null, '', FILE_MODE ? '#' + path : path); }
function go(path){
  path = withLang(path);
  if(FILE_MODE){ location.hash = '#' + path; return; }
  if(path === location.pathname) return;   // wie früher bei gleichem #: nichts tun
  history.pushState(null, '', path);
  route();
}
const qParam = k => new URLSearchParams(FILE_MODE ? (location.hash.split('?')[1] || '') : location.search).get(k);
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
// Riot-Text eines Traits mit Werten: Zeile i (<row>) bekommt die Werte der Stufe i (fx[i]), z. B. „(2) … 15 % Krit-Chance“; fehlt ein Wert in der Stufe, nimm ihn aus einer anderen
function traitDesc(x){
  const fx = Array.isArray(x.fx) ? x.fx : [], val = (k, mul, i) => { const f = [fx[i], ...fx].find(e=>e && e.v && k in e.v); if(k === 'MinUnits') return fx[i] ? fx[i].min : ''; if(!f) return ''; const v = f.v[k] * (mul ? 100 : 1); return String(Math.round(v * 100) / 100); };
  let i = -1;
  const s = String(x.desc || '').replace(/<row>|@([A-Za-z0-9_]+)(\*100)?@/gi, (m, k, mul)=>{ if(/^<row>$/i.test(m)){ i++; return m; } return val(k, mul, Math.max(i, 0)); });
  // Werte-Symbole im Riot-Text (%i:scaleHealth%) als Wort
  const ST = {health:['Leben', 'Health'], as:['Angriffstempo', 'Attack Speed'], ad:['Angriffsschaden', 'Attack Damage'], ap:['Fähigkeitsstärke', 'Ability Power'], armor:['Rüstung', 'Armor'], mr:['Magieresistenz', 'Magic Resist'],
    manaregen:['Manaregeneration', 'Mana Regen'], mana:['Mana', 'Mana'], crit:['Krit-Chance', 'Crit Chance'], critmult:['Krit-Schaden', 'Crit Damage'], da:['Schadensverstärkung', 'Damage Amp'], dr:['Haltbarkeit', 'Durability'], sv:['Omnivampir', 'Omnivamp'], omnivamp:['Omnivampir', 'Omnivamp']};
  return plainDesc(s.replace(/%i:scale([A-Za-z]+)%/g, (m, k)=>{ const t = ST[k.toLowerCase()]; return t ? L(t[0], t[1]) : k.replace(/([a-z])([A-Z])/g, '$1 $2'); }).replace(/%i:[^%]*%/g, '')).replace(/\(\)\s*/g, '');
}
const traits = TFT_DATA.traits.map(x=>{ const m = TRAIT_META[x.n] || {}; return {n:x.n, cat:m.cat||'origin', bp:x.bp.map(String), d:(!EN && m.d) || traitDesc(x)}; });




// Tierlist (pro Set): die Seite zeigt immer den gespeicherten Stand (tierlist-data-<Set>.js) – auf jedem Gerät gleich.
// Die Redaktion arbeitet auf einer eigenen Kopie; ungespeicherte Änderungen liegen nur dort (ADM_WIP_KEY), bis man „Speichern“ klickt
const ADM_WIP_KEY = 'tftfreaks_admin_wip_v1_' + TFT_DATA.set;
try { localStorage.removeItem('tftfreaks_tierlist_draft_v1_' + TFT_DATA.set); localStorage.removeItem('tftfreaks_tierlist_draft_v1'); } catch(e){}   // alte Entwürfe (früher auch auf der Seite angezeigt)
const TL_FILE = window.TIERLIST_DATA && Array.isArray(window.TIERLIST_DATA.comps) && (!window.TIERLIST_DATA.set || window.TIERLIST_DATA.set===TFT_DATA.set) ? window.TIERLIST_DATA : null;
function loadTierSource(){
  if(TL_FILE) return {src:'file', data:TL_FILE};
  return {src:'none', data:{comps:[]}};
}
let tierSource = loadTierSource();
// Item-/Augment-Bewertungen: aus dem Entwurf, sonst aus der veröffentlichten Datei
const tlPart = k => tierSource.data[k] || (TL_FILE && TL_FILE[k]) || {};
let ITEM_TL = tlPart('itemTL'), AUG_TL = tlPart('augTL'), HOLD_TL = tlPart('holdTL'), ENC_TL = tlPart('encTL');
const TL_PATCH = tierSource.data.patch || (TL_FILE && TL_FILE.patch) || '';
// Eigene Ergänzungen zum Set (data/custom-<Set>.js): Pflanzen-Bilder, Icons für Platzhalter-Augments
const TFT_CUSTOM_SET = window.TFT_CUSTOM && (!TFT_CUSTOM.set || TFT_CUSTOM.set===TFT_DATA.set) ? window.TFT_CUSTOM : {};
const PLANT_IMG = TFT_CUSTOM_SET.plants || {};
// Sonderregeln für Units (data/custom-<Set>.js → unitRules): Teamplätze (slots) und Zählwert pro Trait (traits), z. B. Elder Dragon = 2 Plätze, +2 Riftbeast
const UNIT_RULES = TFT_CUSTOM_SET.unitRules || {};
const unitSlots = u => (UNIT_RULES[u] || {}).slots || 1;
const unitTraitAdd = (u, t) => ((UNIT_RULES[u] || {}).traits || {})[t] || 1;
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
  {n:'Einzelstunde',p:'30 €',u:'/ Stunde',h:'30 € pro Stunde',f:false,l:['1 Stunde 1:1 Coaching auf Discord','10–15 Min. Fundamentals auffrischen','ca. 45 Min. VOD-Review oder dein Thema','Auf Deutsch oder Englisch']},
  {n:'Set-Pass',p:'200 €',u:'/ 8 Stunden',h:'25 € pro Stunde',f:true,b:'Bester Deal · Spar 40 €',l:['8 × 1 Stunde 1:1 Coaching','Bis zu 2 Stunden pro Woche','Fundamentals + VOD-Review in jeder Stunde','Gültig für das laufende Set']},
  {n:'Team-Session',p:'20 €',u:'/ Person',h:'für 2–5 Personen',f:false,l:['1 Stunde für 2–5 Personen','Fundamentals für die ganze Gruppe','Gemeinsames VOD-Review','Für dich und deine Freunde']},
];

// Stimmen gecoachter Spieler: q = Zitat, r = Fortschritt (z. B. 'Platin → Diamant'). Ohne Zitat erscheint ein Platzhalter.
const testimonials = [
  {n:'Janny', r:'Smaragd → Meister · 5 Sessions', q:'Ich konnte im Coaching richtig viel lernen – vor allem bei Holds und Openern, wie man zu einem starken Board kommt und welche Augments man wann priorisieren sollte. Claudio ist sehr geduldig und erklärt alles gut und ausführlich. Manchmal muss man ihn sogar bremsen, weil er so viel zu einem Thema erzählen will.'},
  {n:'Doki', r:'Meister → Großmeister · 3 Sessions', q:'Habe das erste Mal Grandmaster erreicht. Augments und Opener waren am hilfreichsten.'},
  {n:'FreezeBomb', r:'Platin → Smaragd · 2 Sessions', q:'Eigenes Wissen mit den erklärten Konzepten vergleichen und im VOD-Review die eigenen Entscheidungen daran hinterfragen zu können – und Grundkonzepte zu lernen, die man vorher vielleicht gar nicht auf dem Schirm hatte.'},
  {n:'AgentZero', r:'Gold I → Platin I · 2 Sessions', q:'Am meisten hat mir gebracht, wie ich mein Early Game besser spielen kann und wann ich welche Augmente auswählen sollte. Auch dass ich mehr scouten muss, war hilfreich.'},
  {n:'бессмертный', r:'Diamant II → Meister · 2 Sessions', q:'Ich treffe jetzt nicht mehr so voreilige Entscheidungen, spiele generell safer und fühle mich mehr comfortable.'},
];

const guides = [
  {t:'TFT Encounters',s:'Neu · Set 18',col:'linear-gradient(160deg,#8b5cf6,#3b0764)',href:'/guides/tft-encounters',d:'Alle Encounters mit Chance pro Spiel – und welche Comp du auf Ambosse, Gold-Augments, prismatische Augments oder besondere Start-Units spielst.',x:'Mit Einschätzung von Challenger-Spielern.'},
  {t:'Wisp-Guide',s:'Kostenlos · 5 Kapitel',col:'linear-gradient(160deg,#f7166e,#7a0b3a)',d:'Wann du Wisps kaufst, welche Upgrades sich lohnen und wie du sie mit deiner Econ verbindest.',x:'Mit Checkliste für die nächsten drei Partien.'},
  {t:'Rank-Up-Training',s:'Kostenlos · Übungen',col:'linear-gradient(160deg,#2ee6d6,#0b5f5a)',d:'Finde eine Gewohnheit, an der du arbeiten willst: Rollen, Leveln oder Positionieren — mit einer klaren Mission pro Partie.',x:'Klein anfangen. Autopilot hat schon genug Partien gespielt.'},
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
const AUGTYPE_DE = {ITEMS:'Items',ECON:'Econ',COMBAT:'Kampf',TRAIT:'Trait',TRAITS:'Traits',EMBLEM:'Emblem'};
const DIFF_EN = {EASY:'Easy',MEDIUM:'Medium',HARD:'Hard',CONDITIONAL:'Situational'};
const compStyleName = c => L(STYLE_DE[c.style] || c.style, c.style), compDiffName = c => L(DIFF_DE[c.diff] || c.diff || '', DIFF_EN[c.diff] || c.diff || '');
const augTypeName = t => L(AUGTYPE_DE[t] || t, t === 'COMBAT' ? 'Combat' : AUGTYPE_DE[t] || t.charAt(0) + t.slice(1).toLowerCase());
const PLAN_EN = {
  '1-Cost Reroll':'Reroll comp for 1-costs: play your best pairs early, build interest and usually roll down at 3-1 to 3-2 on level 5–6 until your carries are 3★. Then level steadily and add strong 4-costs to the board.',
  '2-Cost Reroll':'Reroll comp for 2-costs: go level 6 and from 3-1 or 3-2 slow roll above 50 gold until carry and tank are 3★. Then level 7–8 for further upgrades.',
  '3-Cost Reroll':'Reroll comp for 3-costs: build econ up to level 7, from about 4-1 slow roll above 50 gold until the carry is 3★. With a stable board, go level 8 afterwards for further upgrades.',
  '4-Cost Fast 8':'Fast 8 comp: keep health and gold early, hit level 8 on 4-1 or 4-2 and roll there for the 4-cost carries. Until then, park components on the tank and a temporary carry.',
  'Fast 9':'Fast 9 comp: maximum econ with solid transition boards. Level 8 on 4-1/4-2, keep saving and go level 9 on 5-1/5-2 for the 5-costs. Health is the most important resource here.',
  'Lose Streak':'Lose streak comp: lose on purpose early, take the gold and streak bonus and collect components along the way. Stabilise the board with a big rolldown in stage 4.',
};
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
  // Adresse aus dem Comp-Namen („Draven Dragon 9“ → draven-dragon-9), bei gleichem Namen mit -2, -3 … (gleiche Regel in api/sitemap.js)
  compByKey = {};
  comps.forEach(c=>{ const base = compNameSlug(c.name) || 'comp'; let k = base, n = 2; while(compByKey[k]) k = base + '-' + n++; c.key = k; compByKey[k] = c; });
}
// Eigene Seite pro Comp: /comps/<name>
let compByKey = {};
const compNameSlug = n => String(n || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/['’.]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const compKey = c => c.key;
const compHref = c => '/comps/' + compKey(c);
rebuildComps(tierSource.data.comps);
const traitBy = Object.fromEntries(traits.map(t=>[t.n,t]));
const costOf = u => (champBy[u]||{c:0}).c;

function compTraits(c){
  const cnt = {}, seen = new Set();
  c.board.forEach(b=>{
    const ch = champBy[b.u];
    if(ch && !seen.has(b.u)){ seen.add(b.u); ch.t.forEach(t=>{ cnt[t]=(cnt[t]||0)+unitTraitAdd(b.u, t); }); }
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
  // Karte dahinter nur, wenn es echte Varianten gibt (Comps mit demselben Carry, in der Redaktion als Variante angelegt)
  const vars = comps.filter(x=>x!==c && !x.main && x.carry===c.carry);
  const st = STICKER[c.sticker];
  const tr = tileTrait(c);
  const label = c.name + (vars.length ? ' · ' + L(`+${vars.length} ${vars.length > 1 ? 'Varianten' : 'Variante'}`, `+${vars.length} ${vars.length > 1 ? 'variants' : 'variant'}`) : '');
  return `<button class="ct" data-slug="${c.slug}" data-name="${esc(label)}" aria-label="${esc(label)}">
    ${vars.length?`<span class="ct-back">${hexHTML(vars[0].carry)}</span>`:''}${hexHTML(c.carry,'ct-main')}
    ${st?`<span class="ct-st ${st[0]}" title="${st[2]}">${st[1]}</span>`:''}
    ${c.sub?`<span class="ct-st sub" style="background:${TIER_COL[c.sub]}" title="Situativ – Bewertung ${c.sub}">${c.sub}</span>`:''}
    ${tr?`<span class="ct-tr">${traitHex(tr.n, traitCls(tr), 24)}</span>`:''}
  <span></span></button>`;
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
function panelHTML(c, page){   // page: auf der eigenen Comp-Seite (Varianten als Links, kein Schließen-Knopf)
  const variants = comps.filter(x=>x.carry===c.carry).sort((a,b)=>b.main-a.main || 'SABCX'.indexOf(a.tier)-'SABCX'.indexOf(b.tier));
  const tabs = variants.length>1 ? `<div class="cp-tabs">${variants.map(v=>page
    ? `<a class="cp-tab${v===c?' on':''}" href="${compHref(v)}" style="--tc:${TIER_COL[v.tier]}"><span>${v.tier}</span>${esc(v.name)}</a>`
    : `<button class="cp-tab${v===c?' on':''}" data-variant="${v.slug}" style="--tc:${TIER_COL[v.tier]}"><span>${v.tier}</span>${esc(v.name)}<span></span></button>`).join('')}</div>` : '';
  const units = c.board.filter(b=>!PLANTS[b.u]).sort((a,b)=>costOf(a.u)-costOf(b.u) || a.u.localeCompare(b.u));
  const augs = c.augs.map(id=>augById[id]).filter(Boolean);
  const prio = c.augTypes.map(t=>`<span class="cp-pill">${esc(augTypeName(t))}</span>`).join('<span class="cp-arrow">▶</span>');
  const carousel = c.carousel.map(findItem).filter(Boolean).map(it=>`<button data-item="${it.id}" title="${esc(it.en)}"><img src="${it.img}" alt="${esc(it.en)}" loading="lazy"><span></span></button>`).join('<span class="cp-arrow">▶</span>');
  const flex = c.cap.map(b=>{ const l=(b.lv||[])[0]||''; const num=/^\d+$/.test(l); return unitHex(b,{sm:true, lv:num?l:'⇄', lvTitle:num?L(`ab Level ${l}`, `from level ${l}`):L(`ersetzt ${l}`, `replaces ${l}`)}); }).join('');
  const card = (title, body, cls='') => body ? `<div class="cp-card ${cls}"><h4>${title}</h4>${body}</div>` : '';
  return `${tabs}<div class="cp" style="--tc:${TIER_COL[c.tier]}">
    ${page ? '' : '<button class="cp-close" data-close-panel aria-label="Schließen">✕<span></span></button>'}
    <div class="cp-left">
      <div class="cp-tierbg">${c.tier}</div>
      ${hexHTML(c.carry,'hx-big')}
      <h3>${esc(c.name)}</h3>
      <div class="cp-style">${L('Spielstil', 'Playstyle')}: ${esc(compStyleName(c))} (${esc(compDiffName(c))})${c.sub?`<br>${L('Situativ · Bewertung', 'Situational · rated')} ${c.sub}`:''}</div>
      <div class="trait-row" style="justify-content:center">${compTraits(c).map(t=>tBadge(t,false)).join('')}</div>
      ${augs.length?`<h4>Augments</h4><div class="cp-augs">${augs.map(a=>`<button class="cp-aug" data-aug="${a.id}" title="${esc(a.en)}"><img src="${augImg(a)}" alt="${esc(a.en)}" loading="lazy"><span></span></button>`).join('')}</div>`:''}
      ${prio?`<h4>${L('Augment-Priorität', 'Augment priority')}</h4><div class="cp-prio">${prio}</div>`:''}
      <h4>${L('Spielplan', 'Game plan')}</h4><p>${c.plan ? esc(c.plan).replace(/\n/g,'<br>') : L(PLAN[c.style]||'', PLAN_EN[c.style]||'')}</p>
      ${c.tips ? `<h4>${L('Tipps', 'Tips')}</h4><p>${esc(c.tips).replace(/\n/g,'<br>')}</p>` : ''}
    </div>
    <div class="cp-right">
      <div class="cp-card cp-final">${units.map(b=>unitHex(b)).join('')}</div>
      <div class="cp-mid">
        ${card('Early Units', c.early.length?`<div class="cp-units">${c.early.map(b=>unitHex(b,{sm:true})).join('')}</div>`:'')}
        ${card(L('Item-Priorität', 'Item priority'), carousel?`<div class="cp-itemprio">${carousel}</div>`:'')}
        ${card('Flex Units', flex?`<div class="cp-units">${flex}</div>`:'')}
      </div>
      <div class="cp-bottom">
        ${card('Aufstellung', `<div class="cp-board">${boardHTML(c)}</div>`)}
        ${card('Alt Builds', c.alt.length?`<div class="cp-units cp-col">${c.alt.map(b=>unitHex(b,{sm:true})).join('')}</div>`:'<p class="note" style="text-align:center;margin:0">–</p>')}
      </div>
      <div class="cp-actions">${page ? '' : `<a class="cp-names cp-page" href="${compHref(c)}">${L('Ganze Comp-Seite', 'Full comp page')} →</a>`}<button class="cp-names" type="button" data-builder="${c.slug}">⬡ ${L('Im Team Builder öffnen', 'Open in Team Builder')}<span></span></button><label class="cp-names"><input type="checkbox" data-names> ${L('Namen anzeigen', 'Show names')}</label></div>
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
function openComp(slug){   // Comp-Links (Suche, Champion-Seiten, Fenster) führen auf die eigene Comp-Seite
  const c = compBySlug[slug]; if(c) go(compHref(c));
}
// Comp-Seite (/comps/<key>): Kopf mit Carry, Tier und Spielstil, darunter dasselbe Panel wie in der Tierlist,
// dann weitere Comps derselben Tier-Stufe und ein Textblock mit Fragen für Google
const compItemsOf = (c, u) => ((c.board.find(b=>b.u===u) || {}).i || []).map(findItem).filter(Boolean);
function renderCompPage(key){
  const box = $('#compPage'), c = compByKey[key];
  if(!c){ box.innerHTML = ornnSays(L('Diese Comp gibt es in der aktuellen Tierlist nicht (mehr).', 'This comp is not (or no longer) in the current tier list.')); return; }
  const S = TFT_DATA.set, tr = compTraits(c), carryItems = compItemsOf(c, c.carry), splash = champImg(c.carry) || champFallback(c.carry);
  const tierTxt = c.tier === 'X' ? L(`Situativ (${c.sub || '–'})`, `Situational (${c.sub || '–'})`) : `${c.tier}-Tier`;
  const others = comps.filter(x=>x !== c && x.main && x.tier === c.tier).slice(0, 8);
  const units = c.board.filter(b=>!PLANTS[b.u]).map(b=>b.u);
  const augTxt = c.augTypes.map(augTypeName).join(', ');
  box.innerHTML = `
    <div class="crumb"><a href="/">Home</a> / <a href="/tierlist">Tierlist</a> / ${esc(c.name)}</div>
    <section class="chp-hero comp-hero" style="--tc:${TIER_COL[c.tier]}${splash ? `;--splash:url('${splash}')` : ''}">
      <div class="chp-hero-in">
        <div class="comp-tierb"><b>${c.tier}</b><small>${c.tier === 'X' ? 'Situational' : 'Tier'}</small></div>
        <div class="chp-head">
          <h1 class="chp-h1"><span class="th-key">${esc(c.name)}</span> ${L('TFT Comp Guide', 'TFT comp guide')} · Set ${S}</h1>
          <div class="chp-tags"><span class="chp-tr">${tierTxt}</span><span class="chp-tr">${esc(compStyleName(c))}</span>${c.diff ? `<span class="chp-tr">${esc(compDiffName(c))}</span>` : ''}<a class="chp-tr" href="${champHref(c.carry)}">Carry: ${esc(c.carry)}</a></div>
          <div class="trait-row">${tr.map(t=>tBadge(t, true)).join('')}</div>
          <div class="chp-acts"><button class="btn btn-primary" type="button" data-builder="${c.slug}">⬡ ${L('Im Team Builder öffnen', 'Open in Team Builder')}</button><a class="btn btn-ghost" href="/tierlist">${L('Zur Tierlist', 'To the tier list')}</a></div>
        </div>
      </div>
    </section>
    <div class="comp-panel">${panelHTML(c, true)}</div>
    ${others.length ? `<section class="card comp-more"><h2>${L(`Weitere ${c.tier === 'X' ? 'situative' : c.tier + '-Tier'} Comps`, `More ${c.tier === 'X' ? 'situational' : c.tier + '-tier'} comps`)}</h2>
      <div class="chp-comps">${others.map(x=>`<a class="chp-comp" href="${compHref(x)}" style="--tc:${TIER_COL[x.tier]}"><b class="chp-tier">${x.tier}</b><span><b>${esc(x.name)}</b><small>${esc(compStyleName(x))}</small></span><span class="chp-chx">${hexHTML(x.carry)}</span></a>`).join('')}</div></section>` : ''}
    <section class="tool-seo" aria-labelledby="ts-comp">
      <div class="ts-main">
        <h2 id="ts-comp">${L(`${esc(c.name)} in TFT Set ${S}: So spielst du die Comp`, `${esc(c.name)} in TFT Set ${S}: how to play the comp`)}</h2>
        <p>${L(`${esc(c.name)} ist eine ${esc(compStyleName(c))}-Comp mit ${esc(c.carry)} als Carry. In unserer Tierlist steht sie auf ${tierTxt}.`, `${esc(c.name)} is a ${esc(compStyleName(c))} comp with ${esc(c.carry)} as the carry. In our tier list it is rated ${tierTxt}.`)}</p>
        <p>${L(`Das fertige Board: ${units.map(esc).join(', ')}.`, `The final board: ${units.map(esc).join(', ')}.`)}${tr.length ? ' ' + L(`Aktive Traits: ${tr.map(t=>`${t.k} ${esc(t.n)}`).join(', ')}.`, `Active traits: ${tr.map(t=>`${t.k} ${esc(t.n)}`).join(', ')}.`) : ''}</p>
      </div>
      <aside class="ts-side">
        <h3>${L('Häufige Fragen', 'FAQ')}</h3>
        ${carryItems.length ? `<details><summary>${L(`Welche Items braucht ${esc(c.carry)}?`, `Which items does ${esc(c.carry)} need?`)}</summary><p>${L(`In ${esc(c.name)} bekommt ${esc(c.carry)} ${carryItems.map(it=>esc(it.en)).join(', ')}.`, `In ${esc(c.name)}, ${esc(c.carry)} gets ${carryItems.map(it=>esc(it.en)).join(', ')}.`)}</p></details>` : ''}
        ${augTxt ? `<details><summary>${L('Welche Augments passen?', 'Which augments fit?')}</summary><p>${L(`Am besten passen Augments der Art ${esc(augTxt)}.`, `Augments of these types fit best: ${esc(augTxt)}.`)}</p></details>` : ''}
        <details><summary>${L(`Wie stark ist ${esc(c.name)}?`, `How strong is ${esc(c.name)}?`)}</summary><p>${L(`In unserer TFT Tierlist für Set ${S} steht ${esc(c.name)} auf ${tierTxt}.`, `In our TFT tier list for Set ${S}, ${esc(c.name)} is rated ${tierTxt}.`)}${TL_PATCH ? ' ' + L(`Stand: Patch ${TL_PATCH}.`, `As of patch ${TL_PATCH}.`) : ''}</p></details>
        <h3>${L('Weiterlesen', 'Read more')}</h3>
        <ul class="ts-links"><li><a href="/tierlist">TFT Tierlist</a></li><li><a href="${champHref(c.carry)}">${esc(c.carry)}</a></li><li><a href="/tools/tft-dps-vergleich">${L('DPS-Vergleich', 'DPS Comparison')}</a></li><li><a href="/tools/tft-rolldown-rechner">${L('Rolldown-Rechner', 'Rolldown calculator')}</a></li></ul>
      </aside>
    </section>`;
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
const icoTile = (attr, name, img) => `<button class="tl-ico" ${attr} data-name="${esc(name)}" aria-label="${esc(name)}"><img src="${img}" alt="" loading="lazy"><span></span></button>`;

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
const holdTile = n => `<button class="tl-ico tl-champ" data-champ="${esc(n)}" data-name="${esc(n)}" aria-label="${esc(n)}">${hexHTML(n)}<span></span></button>`;
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

// Encounters: Liste aus data/custom-<Set>.js (Chance = Gewicht / Summe), Einschätzung (passende Comps, egal, Tipp) aus encTL in tierlist-data-<Set>.js
const ENCS = TFT_CUSTOM_SET.encounters || [];
const ENC_W = ENCS.reduce((s, e)=>s + (e.w||0), 0) || 1;
const ENC_CAT = {items:'Items', augments:'Augments', units:'Start-Units', econ:'Gold & Shop', other:'Sonstiges'};
const encPct = list => list.reduce((s, e)=>s + (e.w||0), 0) / ENC_W * 100;
const encPctTxt = p => fmtNum(Math.round(p * 10) / 10) + L(' %', '%');
const encEvery = p => p > 0 ? `≈ jedes ${Math.round(100 / p)}. Spiel` : '';
const encIcon = (e, size) => champBy[e.ch] ? avatar(e.ch, size) : `<span class="enc-noicon" style="width:${size}px;height:${size}px">?</span>`;
let encCat = 'all';
function renderEncTL(){
  const box = $('#encList'); if(!box) return;
  if(!ENCS.length){ box.innerHTML = ornnSays(`Für Set ${TFT_DATA.set} sind noch keine Encounters eingetragen.`); $('#encSum').innerHTML = ''; return; }
  const grp = (label, ids, cat) => { const list = ENCS.filter(e=>cat ? e.cat===cat : ids.includes(e.id)), p = encPct(list);
    return `<div class="enc-card"><b>${encPctTxt(p)}</b><span>${label}</span><small>${encEvery(p)}</small></div>`; };
  $('#encSum').innerHTML = grp('Ambosse am Start', ['completed-item-anvil','component-anvils','item-forge'])
    + grp('Augment-Encounters', [], 'augments') + grp('Prismatisches Augment garantiert', ['prismatic-opener','prismatic-finisher','prismatic-party']) + grp('Besondere Start-Units', [], 'units');
  const list = ENCS.filter(e=>encCat==='all' || e.cat===encCat).slice().sort((a,b)=>b.w - a.w || a.n.localeCompare(b.n));
  const max = Math.max(...ENCS.map(e=>e.w));
  box.innerHTML = list.map(e=>{
    const p = encPct([e]), r = ENC_TL[e.id] || {}, cs = (r.comps||[]).map(s=>compBySlug[s]).filter(Boolean);
    const rec = cs.length ? `<div class="enc-comps">${cs.map(c=>`<button class="enc-comp" data-comp="${c.slug}" style="--tc:${TIER_COL[c.tier]}"><b>${c.tier}</b><span class="enc-chx">${hexHTML(c.carry)}</span>${esc(c.name)}<span></span></button>`).join('')}</div>`
      : r.egal ? '<span class="enc-egal">Egal – spiel, was kommt</span>' : '<span class="enc-none">Noch keine Einschätzung</span>';
    return `<div class="enc-row">
      <div class="enc-who">${encIcon(e, 46)}<div><b>${esc(e.n)}</b><small>${esc(ENC_CAT[e.cat] || '')}${e.ch ? ' · ' + esc(e.ch) : ''}</small></div></div>
      <p class="enc-fx">${esc(EN ? e.en : e.de)}</p>
      <div class="enc-odds"><b>${encPctTxt(p)}</b><i><em style="width:${Math.round(e.w / max * 100)}%"></em></i><small>${encEvery(p)}</small></div>
      <div class="enc-rec">${rec}${r.note ? `<p>${esc(r.note)}</p>` : ''}</div>
    </div>`;
  }).join('');
}
$('#encFilters').addEventListener('click', e=>{
  const b=e.target.closest('.chip-btn'); if(!b) return;
  $('#encFilters').querySelectorAll('.chip-btn').forEach(x=>x.classList.toggle('active', x===b));
  encCat = b.dataset.ecat; renderEncTL();
});

function openAug(id){
  const a = augById[id]; if(!a) return;
  const desc = fmtDesc(a.desc, a.fx);
  const inComps = comps.filter(c=>c.augs.includes(id));
  $('#modalBody').innerHTML = `<div style="display:flex;gap:16px;align-items:center"><img src="${augImg(a)}" alt="" width="64" height="64" style="border-radius:10px;border:1px solid var(--line-2)"><div><small style="font-size:.7rem;color:var(--faint);text-transform:uppercase;letter-spacing:.06em">${a.lv?AUG_LV[a.lv]+'-':''}Augment</small><h2 style="margin:2px 0 0">${esc(a.en)}</h2>${a.de!==a.en?`<div style="color:var(--muted);font-size:.9rem">${esc(a.de)}</div>`:''}</div></div>
    ${desc?`<div class="it-desc">${desc}</div>`:''}
    ${inComps.length?`<h4 style="margin-top:18px;font-size:.85rem;color:var(--faint)">EMPFOHLEN IN</h4><div class="tag-row">${inComps.map(c=>`<button class="it-link" data-comp="${c.slug}" style="padding:4px 12px">${c.tier} · ${esc(c.name)}<span></span></button>`).join('')}</div>`:''}`;
  openModal();
}
document.addEventListener('click', e=>{
  const a = e.target.closest('[data-aug]'); if(a){ openAug(a.dataset.aug); return; }
  const c = e.target.closest('[data-comp]'); if(c){ closeModal(); openComp(c.dataset.comp); }
});

/* tierlist tabs */
// eigene H1 je Reiter, weil jeder Reiter eine eigene Adresse für Google ist (/tierlist/items …)
const TL_H1 = {comps:['TFT Tierlist', 'TFT Tier List'], items:['TFT Item-Tierlist', 'TFT Item Tier List'], augments:['TFT Augment-Tierlist', 'TFT Augment Tier List'], holds:['TFT Holds-Tierlist', 'TFT Holds Tier List']};
function setTab(tab){
  ['comps','items','augments','holds'].forEach(t=>{ $('#tl-'+t).hidden = t!==tab; });
  const h1 = $('#page-tierlist .page-head :is(h1, [data-h1])'); if(h1) h1.innerHTML = `${L(...TL_H1[tab])} <em class="serif">Set <span data-setno>${TFT_DATA.set}</span></em>`;
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
  const bars = items.map(i=>`<button class="rk-bar${i.k===onKey?' on':''}" ${i.href?`data-href="${i.href}"`:''} data-tip="${esc(i.label)}: ${fmtPct(i.v)}" aria-label="${esc(i.label)}: ${fmtPct(i.v)}"><em>${fmtPct(i.v)}</em><i style="height:${Math.max(0.6, i.v/max*100)}%"></i><span></span></button>`).join('');
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
        <div class="rk-toggle" role="group" aria-label="Ansicht"><button class="${view==='all'?'on':''}" data-rkview="all">Alle Ränge<span></span></button><button class="${view==='div'?'on':''}" data-rkview="div">${esc(groupLabel)}<span></span></button></div>
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

// Neues Design: Ränge als Waben (5 + 5 versetzt), darunter die Divisionen des gewählten Rangs; „Verteilung“ zeigt die bisherige Tabelle
const RK_COL = {iron:'#8f8380', bronze:'#c98a72', silver:'#a6b6d4', gold:'#e3b15c', platinum:'#41b9d6', emerald:'#2fbf7a', diamond:'#5b8cff', master:'#b45ce8', grandmaster:'#e24a42', challenger:'#f2c14e'};
function renderRankHex(){
  const list = $('#rk-list'); if(!list) return;
  if(!$('#rkx')){
    $('#rkTable').insertAdjacentHTML('beforebegin', `<div class="rkx" id="rkx">
      <div class="rkx-hex" id="rkxHex"></div></div>`);
    list.classList.add('rkx-mode-hex');
  }
  // Details zum Rang: erscheinen beim Drüberfahren unter dem Sechseck
  const tip = t => {
    const es = RANK_ENTRIES.filter(e=>e.t===t);
    const cols = t.div ? es.map(e=>`<span class="rkx-c" data-rkd="${e.d}"><span>${esc(t.n)} ${e.d}</span><b>${fmtPct(e.p)}</b><small>Top ${fmtPct(e.top)}</small></span>`).join('')
      : `<span class="rkx-c"><span>${L('Anteil', 'Share')}</span><b>${fmtPct(t.total)}</b></span><span class="rkx-c"><span>${L('Gehört zu den', 'Among the')}</span><b>Top ${fmtPct(t.topTier)}</b></span>`;
    return `<span class="rkx-tip"><span class="rkx-th"><img src="${rankImg(t)}" alt=""><span><b>${esc(t.n)}</b><small>${t.div ? L('Spielerverteilung nach Divisionen', 'Player distribution by division') : L('Spielerverteilung', 'Player distribution')}</small></span></span><span class="rkx-cols">${cols}</span><span class="rkx-more">${L('Klick für Details', 'Click for details')} →</span></span>`;
  };
  // Rahmen als SVG (Verlaufskante + feine Innenlinie), Inhalt darüber ohne Zuschnitt: das Emblem darf über den Rahmen ragen
  // breiteres Sechseck (Höhe = Breite)
  const H6 = (s, o=0) => [[50,0],[100,25],[100,75],[50,100],[0,75],[0,25]].map(([x, y])=>`${(50 + (x - 50) * s).toFixed(2)},${(50 + (y - 50) * s + o).toFixed(2)}`).join(' ');
  // Rahmen-Verlauf in den Farben des jeweiligen Emblems: hell → Rangfarbe → dunkel → Rangfarbe
  const RK_GRAD = {iron:['#e2d6d0','#8f8380','#3e3532'], bronze:['#f6c7a9','#c98a72','#5a3123'], silver:['#eef3ff','#a6b6d4','#4a5770'], gold:['#ffe7a3','#e3b15c','#6b4614'],
    platinum:['#b8f3ff','#41b9d6','#0f4a5c'], emerald:['#b6f5d3','#2fbf7a','#0e4a30'], diamond:['#c9d8ff','#5b8cff','#1d2f7a'], master:['#ecc2ff','#b45ce8','#4a1a6a'],
    grandmaster:['#ffc0a8','#e24a42','#5e1412'], challenger:['#fff0b8','#f2c14e','#1f5c9e']};
  const frame = k => { const [l, m, d] = RK_GRAD[k]; return `<svg class="rkx-f" viewBox="-6 -6 112 112" aria-hidden="true"><defs>
      <linearGradient id="rkg-${k}" x1="0" y1="0" x2=".6" y2="1"><stop offset="0" stop-color="${l}"/><stop offset=".35" stop-color="${m}"/><stop offset=".7" stop-color="${d}"/><stop offset="1" stop-color="${m}"/></linearGradient>
      <radialGradient id="rkr-${k}" cx=".5" cy=".3" r=".75"><stop offset="0" stop-color="${m}" stop-opacity=".32"/><stop offset="1" stop-color="${m}" stop-opacity="0"/></radialGradient>
      <pattern id="rkp-${k}" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(30)"><path d="M3.5 0L7 3.5 3.5 7 0 3.5z" fill="none" stroke="${m}" stroke-width=".35"/></pattern></defs>
      <polygon points="${H6(1)}" fill="#070b14"/><polygon points="${H6(1)}" fill="url(#rkr-${k})"/>
      <polygon points="${H6(.9)}" fill="url(#rkp-${k})" opacity=".14"/>
      <polygon class="rkx-fi" points="${H6(.9)}" fill="none" stroke="${m}" stroke-opacity=".45" stroke-width=".6"/>
      <polygon points="${H6(.95)}" fill="none" stroke="${l}" stroke-opacity=".38" stroke-width=".5" stroke-dasharray=".6 1.8" stroke-linecap="round"/>
      <polygon points="${H6(1)}" fill="none" stroke="url(#rkg-${k})" stroke-width="1.7" stroke-linejoin="round"/>
      ${[[50,0],[100,25],[100,75],[50,100],[0,75],[0,25]].map(([x, y])=>`<path d="M${x} ${y - 2.2}L${x + 1.6} ${y}L${x} ${y + 2.2}L${x - 1.6} ${y}z" fill="${l}" fill-opacity=".85"/>`).join('')}</svg>`; };
  const cell = t => `<a class="rkx-cell" href="/ranks/${t.k}" style="--rc:${RK_COL[t.k]}" aria-label="${esc(t.n)}: ${fmtPct(t.total)}">
      <span class="rkx-g">${frame(t.k)}<span class="rkx-in"><img src="${rankImg(t)}" alt="" loading="lazy"><b>${esc(t.n)}</b><small>${fmtPct(t.total)}</small>
      ${t.div ? `<span class="rkx-divs">${DIVS.map(d=>`<i data-rkd="${d}">${d}</i>`).join('')}</span>` : ''}</span></span>${tip(t)}</a>`;
  // Waben 3-4-3
  $('#rkxHex').innerHTML = [RANK_TIERS.slice(0, 3), RANK_TIERS.slice(3, 7), RANK_TIERS.slice(7)].map(r=>`<div class="rkx-row">${r.map(cell).join('')}</div>`).join('');
}
document.addEventListener('click', e=>{
  const tab = e.target.closest('[data-rkx]'); if(!tab) return;
  document.querySelectorAll('[data-rkx]').forEach(b=>b.classList.toggle('on', b===tab)); $('#rk-list').classList.toggle('rkx-mode-hex', tab.dataset.rkx==='hex');
});
// Division im Sechseck berühren: dieselbe Division in den Details hervorheben
document.addEventListener('mouseover', e=>{
  const c = e.target.closest && e.target.closest('.rkx-cell'); if(!c) return;
  const d = e.target.closest('.rkx-divs [data-rkd]');
  c.querySelectorAll('.rkx-tip [data-rkd]').forEach(x=>x.classList.toggle('on', !!d && x.dataset.rkd===d.dataset.rkd));
});
if(ND) renderRankHex();

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
let bTraitF = '';           // Trait-Filter für die Champion-Liste (Klick in der Trait-Liste)
let bHist = [], bRedo = [], bLast = null, bRestoring = false;
const sideBoard = s => s==='e' ? eBoard : bBoard;
const sideAugs = s => s==='e' ? eAugs : bAugs;
try { bEnemy = localStorage.getItem(BUILDER_ENEMY_KEY)==='1'; } catch(e){}
// Dieselbe Oberfläche dient auch dem Kampf-Simulator (/tools/tft-kampf-simulator) – mit eigenem Speicherstand und immer mit Gegner
const SIM_KEY = 'tftfreaks_sim_v1_' + TFT_DATA.set;
let bMode = 'builder';
const bKey = () => bMode==='sim' ? SIM_KEY : BUILDER_KEY;
const bBase = () => bMode==='sim' ? '/tools/tft-kampf-simulator' : '/tft-team-builder';
function bSetMode(mode){
  if(mode===bMode) return;
  bMode = mode; bLoaded = false; bCtx = null; bSel = null;
  if(mode==='builder'){ try { bEnemy = localStorage.getItem(BUILDER_ENEMY_KEY)==='1'; } catch(e){ bEnemy = false; } }
  const sim = mode==='sim';
  $('#page-builder').classList.toggle('sim-mode', sim);
  $('#bCrumb').innerHTML = sim ? '<a href="/tools">Tools</a> / Kampf-Simulator' : '<a href="/">Home</a> / Team Builder';
  $('#bTitle').innerHTML = sim ? `<span class="th-key">TFT Kampf-Simulator:</span> Welches Team gewinnt?` : `<span class="th-key">TFT Team Builder:</span> Board planen für Set <span data-setno>${TFT_DATA.set}</span>`;
  $('#bIntro').textContent = sim ? 'Stell dein Team und den Gegner auf und starte den Kampf. Du siehst, wohin jede Unit läuft, wen sie angreift und wann sie ihre Fähigkeit wirkt. Die Ergebnisse sind Näherungen.'
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
    if(ch && !seen.has(b.u)){ seen.add(b.u); ch.t.forEach(t=>{ cnt[t]=(cnt[t]||0)+unitTraitAdd(b.u, t); }); }
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
      const its = b.i.map((id,n)=>{ const it=findItem(id); return it?`<img src="${it.img}" alt="${esc(it.en)}" title="${esc(it.en)} – Klick entfernt · auf ein anderes Item ziehen tauscht" data-unequip="${key}:${n}" draggable="true">`:''; }).join('');
      const slotTag = unitSlots(b.u) > 1 ? `<span class="hex-slots" title="Belegt ${unitSlots(b.u)} Teamplätze">${unitSlots(b.u)} Plätze</span>` : '';
      cells += `<div class="hex filled c${ch?ch.c:1}${plant?' plant':''}${sel}" data-hex="${h}" data-side="${side}" draggable="true" title="${esc(b.u)} – Klick: Sterne · Rechtsklick: entfernen · Ziehen: verschieben"><div class="hex-bg"></div><div class="hex-img" style="background-image:${champBg(b.u)}"></div>${slotTag}`
        + `<button class="hex-stars b-star${b.s===1?' one':''}" data-star="${key}" type="button" title="Sterne ändern (${b.s}★)">${'★'.repeat(b.s)}<span></span></button>`
        + `<button class="b-x" data-remove="${key}" type="button" aria-label="${esc(b.u)} entfernen">✕<span></span></button>`
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
  const gold = units.reduce((s,b)=>s + costOf(b.u) * Math.pow(3, (b.s||1)-1), 0), slots = units.reduce((s,b)=>s + unitSlots(b.u), 0);
  $('#bStats'+S).innerHTML = `<span title="Belegte Teamplätze (Elder Dragon zählt doppelt)">⬡ ${slots}</span><span title="Gesamtkosten in Gold (inkl. Sterne)"><i class="coin"></i> ${gold}</span>`;
  // Traits: Klick filtert die Champions in der Liste darunter auf dieses Trait (nochmal klicken hebt den Filter auf)
  const tr = bAllTraits(team);
  $('#bTraits'+S).innerHTML = tr.length ? tr.map(t=>{
    const bp = (traitBy[t.n]||{bp:['1']}).bp;
    return `<button type="button" class="bt${t.lvl?'':' off'}${bTraitF===t.n?' on':''}" data-btrait="${esc(t.n)}" title="Champions mit ${esc(t.n)} zeigen">${traitHex(t.n, t.lvl?traitCls(t):'base', 26)}<div><b>${esc(t.n)}</b><span class="bt-bp">${bp.map(x=>`<i class="${+x<=t.k?'on':''}">${x}</i>`).join('')}</span></div><em>${t.k}</em></button>`;
  }).join('') : '<p class="note" style="margin:0">Noch keine Units auf dem Brett.</p>';
  $('#bAugs'+S).innerHTML = augs.map((id,i)=>{ const a = augById[id]; return a ? `<button class="b-aug" type="button" data-baug-del="${side}:${i}" title="${esc(a.en)} – Klick entfernt"><img src="${augImg(a)}" alt="${esc(a.en)}"><span></span></button>` : ''; }).join('')
    + (augs.length<3 ? `<button class="b-plus" type="button" data-baug-open="${side}" title="Augment hinzufügen" aria-label="Augment hinzufügen">+<span></span></button>` : '');
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
  return `<button class="bp-u" type="button" draggable="true" data-bunit="${esc(n)}" title="${esc(title)}">${av}<span></span></button>`;
}
function renderPool(){
  const q = bQuery.toLowerCase().trim();
  const hit = n => { const ch = champBy[n]; if(bTraitF && !(ch && ch.t.includes(bTraitF))) return false; return !q || n.toLowerCase().includes(q) || (ch ? ch.t.some(t=>t.toLowerCase().includes(q)) : 'elderwood pflanze'.includes(q)); };
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
  const tf = bTraitF ? `<button type="button" class="bp-tf" data-btrait-clear title="Filter aufheben">${traitHex(bTraitF,'base',20)}<span>Nur ${esc(bTraitF)}</span><b>✕</b></button>` : '';
  $('#bPoolUnits').innerHTML = tf + (html || viSays('Keine Unit gefunden. Andere Schreibweise?'));
  const items = ITEMS.filter(i=>(bItemCat==='other' ? ['emblem','component'].includes(i.cat) : i.cat===bItemCat) && (!q || i.en.toLowerCase().includes(q) || i.de.toLowerCase().includes(q)))
    .sort((a,b)=>bItemCat==='other' ? a.cat.localeCompare(b.cat) || a.en.localeCompare(b.en) : a.en.localeCompare(b.en));
  $('#bPoolItems').innerHTML = items.length ? `<div class="bp-grid">${items.map(it=>`<button class="bp-i${bSel&&bSel.type==='item'&&bSel.id===it.id?' sel':''}" type="button" draggable="true" data-bitem="${it.id}" title="${esc(it.en)} · ${esc(it.de)}"><img src="${it.img}" alt="" draggable="false"><span></span></button>`).join('')}</div>` : '<p class="b-empty">Kein Item gefunden.</p>';
  document.querySelectorAll('#bSortPills [data-bsort]').forEach(x=>x.classList.toggle('on', x.dataset.bsort===bSort));
  document.querySelectorAll('#bItemPills [data-bcat]').forEach(x=>x.classList.toggle('on', x.dataset.bcat===bItemCat));
}
function renderBuilderCtx(){
  const box = $('#bCtx'), c = bCtx && adm && adm.comps.find(x=>x.slug===bCtx.slug);
  box.hidden = !c;
  box.innerHTML = c ? `<span>Du bearbeitest die Aufstellung von <b>${esc(c.name)}</b>.</span><button class="btn btn-primary b-btn" id="bApply" type="button">In Comp übernehmen<span></span></button><button class="btn btn-ghost b-btn" id="bCancel" type="button">Abbrechen<span></span></button>` : '';
}
function builderRoute(sub, code2, mode){
  bSetMode(mode || 'builder');
  // Links: /builder/<Set>/<Code> bzw. /tools/tft-kampf-simulator/<Set>/<Code> – gehört der Link zu einem anderen Set, wird dorthin gewechselt
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
  if(curPath()==='/tft-team-builder') builderRoute(); else go('/tft-team-builder');
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
    .map(a=>`<button class="b-augpick" type="button" data-baug-add="${a.id}" title="${esc(a.de)}"><img src="${augImg(a)}" alt=""><span>${esc(a.en)}</span><small>${a.lv?AUG_LV[a.lv]:''}</small><span></span></button>`).join(''); };
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
    // Maus: Klick schaltet die Sterne 1 → 2 → 3 → 1 (Rechtsklick entfernt, Ziehen verschiebt). Touch: antippen wählt die Unit zum Verschieben
    if(b && e.pointerType !== 'touch' && !PLANTS[b.u]){ b.s = b.s % 3 + 1; renderBuilder(); bHint(`${b.u}: ${'★'.repeat(b.s)} – Rechtsklick entfernt die Unit.`); return; }
    if(b){ bSel = {type:'hex', side, id:h}; renderBuilder(); bHint('Jetzt auf ein anderes Feld klicken, um die Unit zu verschieben.'); }
    else renderBuilder();
    return;
  }
  const trf = t.closest('[data-btrait]'); if(trf){ bTraitF = bTraitF === trf.dataset.btrait ? '' : trf.dataset.btrait; renderPool(); renderBuilder(); bHint(bTraitF ? `Champion-Liste zeigt nur ${bTraitF}.` : ''); return; }
  if(t.closest('[data-btrait-clear]')){ bTraitF = ''; renderPool(); renderBuilder(); return; }
  const panel = t.closest('[data-panel]'); if(panel && bEnemy && bActive!==panel.dataset.panel){ bActive = panel.dataset.panel; renderBuilder(); }
  const btn = t.closest('button'); const id = btn && btn.id;
  if(id==='bUndo'){ bUndo(); return; }
  if(id==='bRedo'){ bRedoStep(); return; }
  if(id==='bClear'){ bBoard = {}; bAugs = []; bAlt = [null,null]; eBoard = {}; eAugs = []; bSel = null; renderBuilder(); bHint('Brett geleert.'); return; }
  if(id==='bShare'){ bCopy(siteUrl(bBase() + '/' + TFT_DATA.set + '/' + bEncode()), 'Link kopiert!'); return; }
  if(id==='bCopyCode'){ bCopy(bEncode() || '(leer)', 'Team-Code kopiert!'); return; }
  if(id==='bImport'){
    const v = prompt('Team-Code oder Link einfügen:'); if(!v) return;
    // akzeptiert neue Links (…/builder/18/Code, …/tools/tft-kampf-simulator/18/Code), alte Links (…#/builder/18/Code) und reine Codes
    const lm = v.trim().match(/\/(?:builder|tft-team-builder|tools\/simulator|tools\/tft-kampf-simulator)\/(.+)$/);
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
    else if(kind==='item'){   // aus der Liste auf ein ausgerüstetes Item gezogen: ersetzt es
      const ti = e.target.closest('[data-unequip]');
      if(ti){ const [s2,a2,m] = splitKey(ti.dataset.unequip), dst = sideBoard(s2)[a2]; if(dst) dst.i[m] = rest; } else bEquip(side, h, rest);
    }
    else if(kind==='eq'){   // Item von einer Unit: auf ein anderes Item = tauschen, auf eine volle Unit = mit deren letztem Item tauschen, sonst umhängen
      const [s,a,n] = splitKey(rest), src = sideBoard(s)[a], id = src && src.i[n], ti = e.target.closest('[data-unequip]');
      if(id && ti){ const [s2,a2,m] = splitKey(ti.dataset.unequip), dst = sideBoard(s2)[a2]; if(dst){ src.i[n] = dst.i[m]; dst.i[m] = id; } }
      else if(id && !(s===side && a===h)){
        const dst = sideBoard(side)[h];
        if(dst && !PLANTS[dst.u] && dst.i.length >= 3){ src.i[n] = dst.i[2]; dst.i[2] = id; }
        else if(bEquip(side, h, id)) src.i.splice(n,1);
      }
    }
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
// Redaktion: Arbeitskopie (adm). Änderungen bleiben in der Redaktion, bis „Speichern“ sie für alle veröffentlicht.
// Ungespeicherte Änderungen überleben ein Neuladen (ADM_WIP_KEY) – die öffentlichen Seiten sehen sie nie.
let admDirty = false;
function admEnsure(){
  if(adm) return;
  try { const w = JSON.parse(localStorage.getItem(ADM_WIP_KEY) || 'null'); if(w && Array.isArray(w.comps)){ adm = w; admDirty = true; return; } } catch(e){}
  const d = tierSource.data;
  adm = JSON.parse(JSON.stringify({version:1, set:TFT_DATA.set, rev:d.rev||'', patch:d.patch||TL_PATCH, updated:d.updated||'', source:d.source||'', basedOn:d.basedOn||'', comps:d.comps, itemTL:d.itemTL||ITEM_TL, augTL:d.augTL||AUG_TL, holdTL:d.holdTL||HOLD_TL, encTL:d.encTL||ENC_TL}));
}
function admStatus(t){ const el = $('#admStatus'); if(el) el.textContent = t; }
// Speichern-Knopf und Hinweis: ungespeicherte Änderungen sichtbar machen
function admDirtyUI(){
  const b = $('#admPublish'), r = $('#admReset'); if(b){ b.disabled = !admDirty; b.classList.toggle('dirty', admDirty); } if(r) r.disabled = !admDirty;
  const el = $('#admDirty'); if(el) el.hidden = !admDirty;
}
function admSave(msg){   // Änderung in der Arbeitskopie merken (noch nicht live)
  admEnsure();
  adm.updated = new Date().toISOString().slice(0,10);
  if(adm.source && !['TFTClimb', 'Climb TFT'].includes(adm.source)){ adm.basedOn = adm.source; } adm.source = 'TFTClimb';   // 'Climb TFT' = alter Name in früheren Exporten
  try { localStorage.setItem(ADM_WIP_KEY, JSON.stringify(adm)); } catch(e){}
  admDirty = true; admDirtyUI();
  admStatus(msg || 'Geändert – zum Veröffentlichen „Speichern“ klicken.');
}
// Nach dem Speichern: Arbeitskopie ist jetzt der Live-Stand – auch die Seiten in diesem Tab zeigen ihn sofort
function admApplyLive(){
  try { localStorage.removeItem(ADM_WIP_KEY); } catch(e){}
  admDirty = false; admDirtyUI();
  tierSource = {src:'file', data:JSON.parse(JSON.stringify(adm))};
  ITEM_TL = adm.itemTL || {}; AUG_TL = adm.augTL || {}; HOLD_TL = adm.holdTL || {}; ENC_TL = adm.encTL || {};
  rebuildComps(adm.comps); filterComps(); renderItemTL(); renderAugTL(); renderHoldTL(); renderEncTL(); updateTlNote();
}
window.addEventListener('beforeunload', e=>{ if(admDirty && $('#page-admin').classList.contains('active')){ e.preventDefault(); e.returnValue = ''; } });
function updateTlNote(){
  const el = $('#tlSrc'); if(!el) return;
  const D = tierSource.data, link = '<a href="https://tftacademy.com/tierlist/comps" target="_blank" rel="noopener" style="text-decoration:underline">TFTAcademy</a>';
  if(!(D.comps||[]).length){ el.textContent = `Für Set ${TFT_DATA.set} gibt es noch keine Tierlist.`; return; }
  if(D.source==='TFTAcademy'){ el.innerHTML = `Stand: Patch ${esc(D.patch||TL_PATCH)} · Bewertungen und Aufstellungen nach ${link}`; return; }
  const d = D.updated ? new Date(D.updated).toLocaleDateString(LOC) : '';
  if(ND){   // neues Design: kompaktes Abzeichen oben rechts – grüner Punkt „Live“, wenn die Tierlist zum aktuellen Patch passt
    const p = String(D.patch||TL_PATCH), live = p === String(((window.TFT_PATCHES||[])[0]||{}).id || TL_PATCH);
    el.classList.add('tl-badge'); el.classList.toggle('old', !live);
    el.title = `${L('Bewertungen von TFTClimb', 'Ratings by TFTClimb')}${d ? ' · ' + L('aktualisiert am ', 'updated on ') + d : ''}`;
    el.innerHTML = `<i class="tl-dot"></i>${live ? '<b>Live</b>' : ''}<span>Patch ${esc(p)}</span>${d ? `<span>${esc(d)}</span>` : ''}${D.basedOn==='TFTAcademy' || (TL_FILE && TL_FILE.source==='TFTAcademy') ? `<span>${L('Aufstellungen nach', 'Boards from')} ${link}</span>` : ''}`;
    return;
  }
  el.innerHTML = `Stand: Patch ${esc(D.patch||TL_PATCH)}${d?' · aktualisiert am '+d:''} · Bewertungen von TFTClimb${D.basedOn==='TFTAcademy' || (TL_FILE && TL_FILE.source==='TFTAcademy') ? ' · Aufstellungen ursprünglich nach ' + link : ''}`;
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
    return `<span class="adm-chip">${img?`<img src="${img}" alt="">`:''}${esc(o?o.en:id)}<button type="button" data-adm-del="${kind}:${i}" aria-label="Entfernen">✕<span></span></button></span>`;
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
    <div class="adm-f"><span>Augments</span><div class="adm-chips">${chips(c.augs,'aug')}</div><div class="adm-add"><input class="input" list="admAugList" placeholder="Augment hinzufügen…" data-add="aug"><button class="btn btn-ghost b-btn" type="button" data-add-btn="aug">+<span></span></button></div></div>
    <div class="adm-f"><span>Augment-Fokus</span><div class="adm-checks">${['ITEMS','ECON','COMBAT','TRAIT'].map(k=>`<label><input type="checkbox" data-aug-type="${k}"${(c.augTypes||[]).includes(k)?' checked':''}> ${AUGTYPE_DE[k]}</label>`).join('')}</div></div>
    <div class="adm-f"><span>Item-Priorität</span><div class="adm-chips">${chips(c.carousel,'item')}</div><div class="adm-add"><input class="input" list="admItemList" placeholder="Item hinzufügen…" data-add="item"><button class="btn btn-ghost b-btn" type="button" data-add-btn="item">+<span></span></button></div></div>
    <div class="adm-f"><span>Aufstellung</span>${(c.board||[]).length?`<div class="adm-board">${boardHTML(c)}</div>`:'<p class="note" style="margin:0">Noch keine Units platziert.</p>'}<button class="btn btn-primary b-btn" type="button" data-adm-builder style="margin-top:8px;align-self:flex-start">⬡ Im Team Builder bearbeiten<span></span></button></div>
    <div class="adm-foot"><button class="btn btn-ghost b-btn" type="button" data-adm-dup>Duplizieren<span></span></button><button class="btn btn-ghost b-btn adm-danger" type="button" data-adm-delete>Löschen<span></span></button></div>
    <datalist id="admAugList">${AUGS.map(a=>`<option value="${esc(a.en)}">`).join('')}</datalist>
    <datalist id="admItemList">${ITEMS.filter(i=>B_ITEM_CATS.includes(i.cat)).map(i=>`<option value="${esc(i.en)}">`).join('')}</datalist>`;
}
function renderAdmin(){
  // ohne Anmeldung nur die Passwort-Maske (der echte Schutz ist das Passwort beim Speichern in api/tierlist.js)
  const authed = !!admPwGet();
  $('#admLogin').hidden = authed; $('#admWork').hidden = !authed;
  if(!authed){ setTimeout(()=>{ const i = $('#admLoginPw'); if(i) i.focus(); }, 30); return; }
  admEnsure(); renderAdminRows(); renderAdminEdit(); renderAdminTL(); admDirtyUI();
  admStatus(admDirty ? 'Es gibt ungespeicherte Änderungen – „Speichern“ stellt sie live.' : 'Alles gespeichert – so sehen es gerade alle Besucher.');
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
document.addEventListener('keydown', e=>{
  if(e.key==='Enter' && e.target.dataset && e.target.dataset.add){ e.preventDefault(); admAdd(e.target.dataset.add); }
  if(e.key==='Enter' && e.target.id==='admLoginPw'){ e.preventDefault(); admLogin(); }
});
// Stand der Tierlist, wie er veröffentlicht bzw. exportiert wird
function admData(){
  admEnsure();
  return {version:1, set:TFT_DATA.set, patch:adm.patch, updated:adm.updated || new Date().toISOString().slice(0,10), source:adm.source || 'TFTClimb', basedOn:adm.basedOn || '', comps:adm.comps, itemTL:adm.itemTL || ITEM_TL, augTL:adm.augTL || AUG_TL, holdTL:adm.holdTL || HOLD_TL, encTL:adm.encTL || ENC_TL};
}
// Anmeldung: Passwort wird bei /api/tierlist geprüft und nur für diesen Tab gemerkt (sessionStorage); lokal (localhost) ohne Prüfung
const ADM_PW_KEY = 'tftfreaks_admin_pw';
const ADM_LOCAL = FILE_MODE || /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
const admPwGet = () => { try { return sessionStorage.getItem(ADM_PW_KEY) || ''; } catch(e){ return ''; } };
const admPwSet = v => { try { v ? sessionStorage.setItem(ADM_PW_KEY, v) : sessionStorage.removeItem(ADM_PW_KEY); } catch(e){} };
async function admLogin(){
  const inp = $('#admLoginPw'), msg = $('#admLoginMsg'), pw = inp.value; if(!pw) return;
  msg.textContent = 'Wird geprüft …';
  if(ADM_LOCAL){ admPwSet(pw); renderAdmin(); return; }
  try {
    const r = await fetch('/api/tierlist', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({password:pw, check:true})});
    const j = await r.json().catch(()=>({}));
    if(r.ok && j.ok){ admPwSet(pw); msg.textContent = ''; inp.value = ''; renderAdmin(); return; }
    msg.textContent = j.error || 'Anmeldung fehlgeschlagen.'; inp.select();
  } catch(e){ msg.textContent = 'Keine Verbindung.'; }
}
// Speichern = für alle veröffentlichen: /api/tierlist schreibt tierlist-data-<Set>.js ins Repository, Vercel baut neu (etwa eine Minute).
// Die Arbeitskopie kennt die Version (rev), auf der sie aufbaut – ist der Live-Stand inzwischen neuer (z. B. vom Handy gespeichert),
// wird nur nach ausdrücklichem „trotzdem speichern“ überschrieben
async function admPublish(force){
  if(ADM_LOCAL){ admStatus('Speichern geht nur auf der Live-Seite (tftclimb.com).'); return; }
  const pw = admPwGet(); if(!pw){ renderAdmin(); return; }
  const data = admData(), base = adm.rev || '';
  const btn = $('#admPublish'); btn.disabled = true; admStatus('Wird gespeichert …');
  try {
    const r = await fetch('/api/tierlist', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({password:pw, set:data.set, data, base, force:!!force})});
    const j = await r.json().catch(()=>({}));
    if(r.status === 401){ admPwSet(''); renderAdmin(); $('#admLoginMsg').textContent = 'Passwort falsch – bitte neu anmelden. Deine Änderungen bleiben erhalten.'; return; }
    if(r.status === 409){
      admStatus('Nicht gespeichert: Die Live-Tierlist ist neuer als deine Änderungen.'); admDirtyUI();
      if(confirm(`Achtung: Die Tierlist wurde inzwischen woanders gespeichert${j.updated ? ' (Stand ' + new Date(j.updated).toLocaleDateString(LOC) + ')' : ''}.\n\nOK = deine Version trotzdem speichern (die andere geht verloren).\nAbbrechen = nichts tun. Mit „Änderungen verwerfen“ holst du dir den aktuellen Stand.`)) admPublish(true);
      return;
    }
    if(!r.ok || !j.ok){ admStatus('Nicht gespeichert: ' + (j.error || 'Fehler ' + r.status)); admDirtyUI(); return; }
    adm.rev = j.rev || ''; admApplyLive();
    admStatus(`Gespeichert ✓ ${j.comps} Comps – in etwa einer Minute auf allen Geräten sichtbar.`);
  } catch(e){ admStatus('Nicht gespeichert: keine Verbindung.'); admDirtyUI(); }
}
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
  if(t.id==='admPublish'){ admPublish(); return; }
  if(t.id==='admLoginGo'){ admLogin(); return; }
  if(t.id==='admLogout'){ if(admDirty && !confirm('Es gibt ungespeicherte Änderungen. Trotzdem abmelden? Sie bleiben in diesem Browser erhalten.')) return; admPwSet(''); renderAdmin(); return; }
  if(t.id==='admExport'){
    const data = admData();
    const js = '// TFTClimb – Tierlist-Daten, exportiert aus der Redaktion am ' + new Date().toLocaleString(LOC) + '\n// Datei neben die index.html legen, dann sehen alle Besucher diesen Stand.\nwindow.TIERLIST_DATA = ' + JSON.stringify(data) + ';\n';
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([js], {type:'text/javascript'})); a.download = `tierlist-data-${TFT_DATA.set}.js`;
    document.body.appendChild(a); a.click(); setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); }, 500);
    admStatus(`Exportiert: tierlist-data-${TFT_DATA.set}.js – neben die index.html legen.`); return;
  }
  if(t.id==='admReset'){
    if(!confirm('Alle ungespeicherten Änderungen verwerfen? Danach siehst du wieder den gespeicherten Stand.')) return;
    try { localStorage.removeItem(ADM_WIP_KEY); } catch(err){}
    adm = null; admSel = null; admDirty = false; renderAdmin(); return;
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
  if(admTab==='encounters'){ renderAdmEnc(box); return; }
  const chip = (key, v, l) => `<button class="chip-btn${admTLf[key]===v?' active':''}" type="button" data-tlf="${key}:${v}">${l}<span></span></button>`;
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
// Redaktion: Encounters einschätzen – passende Comps, „egal“ und ein Tipp pro Encounter (encTL)
const admEncGet = id => { admEnsure(); adm.encTL = adm.encTL || {}; return adm.encTL[id] = adm.encTL[id] || {comps:[], egal:false, note:''}; };
function renderAdmEnc(box){
  admEnsure();
  const pool = adm.comps.filter(c=>!c.hidden);
  box.innerHTML = `<p class="note" style="margin:0 0 12px">Trag pro Encounter ein, welche Comps du darauf spielen würdest – oder hak „Egal“ an, wenn er die Comp-Wahl nicht ändert. Der Tipp erscheint unter der Empfehlung.</p>
    <div class="adm-enc">${ENCS.slice().sort((a,b)=>b.w - a.w || a.n.localeCompare(b.n)).map(e=>{
      const r = (adm.encTL || {})[e.id] || {}, cs = (r.comps||[]).map(s=>adm.comps.find(c=>c.slug===s)).filter(Boolean);
      return `<div class="adm-enc-row">
        <div class="enc-who">${encIcon(e, 40)}<div><b>${esc(e.n)}</b><small>${encPctTxt(encPct([e]))} · ${esc(e.de)}</small></div></div>
        <div class="adm-enc-ed">
          <div class="adm-chips">${cs.map(c=>`<span class="adm-chip" style="border-left:3px solid ${TIER_COL[c.tier] || '#666'}">${esc(c.tier)} · ${esc(c.name)}<button type="button" data-enc-del="${e.id}|${c.slug}" aria-label="Entfernen">✕<span></span></button></span>`).join('') || '<span class="note" style="margin:0">Noch keine Comps</span>'}</div>
          <div class="adm-add"><input class="input" list="admEncList" placeholder="Comp hinzufügen…" data-enc-inp="${e.id}"><button class="btn btn-ghost b-btn" type="button" data-enc-add="${e.id}">+<span></span></button>
            <label class="adm-enc-egal"><input type="checkbox" data-enc-egal="${e.id}"${r.egal ? ' checked' : ''}> Egal</label></div>
          <textarea class="input" rows="2" data-enc-note="${e.id}" placeholder="Tipp (optional), z. B. „Früh Items slammen und Lose Streak vermeiden.“">${esc(r.note || '')}</textarea>
        </div></div>`; }).join('')}</div>
    <datalist id="admEncList">${pool.map(c=>`<option value="${esc(c.name)}">`).join('')}</datalist>`;
}
function admEncAdd(id){
  const inp = document.querySelector(`[data-enc-inp="${id}"]`), v = inp ? inp.value.trim().toLowerCase() : ''; if(!v) return;
  const pool = adm.comps.filter(c=>!c.hidden), c = pool.find(x=>x.name.toLowerCase()===v && x.main) || pool.find(x=>x.name.toLowerCase()===v);
  if(!c){ admStatus('Comp nicht gefunden – bitte aus der Liste wählen.'); return; }
  const r = admEncGet(id); if(!r.comps.includes(c.slug)) r.comps.push(c.slug); r.egal = false;
  admSave(`${c.name} bei ${(ENCS.find(e=>e.id===id)||{}).n} eingetragen`); renderAdminTL();
}
document.addEventListener('click', e=>{
  if(!e.target.closest || !e.target.closest('#admTL')) return;
  const add = e.target.closest('[data-enc-add]'); if(add){ admEncAdd(add.dataset.encAdd); return; }
  const del = e.target.closest('[data-enc-del]'); if(del){ const [id, slug] = del.dataset.encDel.split('|'); const r = admEncGet(id); r.comps = r.comps.filter(s=>s!==slug); admSave('Comp entfernt'); renderAdminTL(); }
});
document.addEventListener('change', e=>{ if(e.target.dataset && e.target.dataset.encEgal){ const r = admEncGet(e.target.dataset.encEgal); r.egal = e.target.checked; if(r.egal) r.comps = []; admSave(r.egal ? 'Als „egal“ markiert' : undefined); renderAdminTL(); } });
document.addEventListener('input', e=>{ if(e.target.dataset && e.target.dataset.encNote){ admEncGet(e.target.dataset.encNote).note = e.target.value; admSave(); } });
document.addEventListener('keydown', e=>{ if(e.key==='Enter' && e.target.dataset && e.target.dataset.encInp){ e.preventDefault(); admEncAdd(e.target.dataset.encInp); } });
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
  $('#setSw').innerHTML = `<button class="set-btn" id="setBtn" type="button" aria-haspopup="true" aria-expanded="false" title="Set wechseln"><b>Set ${cur}</b><span class="set-st ${st}">${SET_LABEL[st]||esc(st)}</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg><span></span></button>
    <div class="set-menu" id="setMenu" hidden><small class="set-menu-h">Set wählen</small>${sets.map(s=>`<button type="button" class="${s.set===cur?'on':''}" data-set-pick="${s.set}"><b>Set ${s.set}</b><span class="set-st ${s.status}">${SET_LABEL[s.status]||esc(s.status)}</span><small>CommunityDragon ${esc(s.version)} · ${fmtDay(s.generated)}</small><span></span></button>`).join('')}</div>`;
  document.querySelectorAll('[data-setno]').forEach(e=>{ e.textContent = cur; });
  const live = sets.find(s=>s.status==='live'), ban = $('#setBanner');
  if(st!=='live' && live && live.set!==cur){
    ban.className = 'set-banner ' + st; ban.hidden = false;
    ban.innerHTML = (st==='pbe'
      ? `<b>PBE-Vorschau:</b> Set ${cur} ist noch nicht live – Champions, Items und Werte können sich bis zum Release ändern.`
      : `<b>Archiv:</b> Du siehst die Daten von Set ${cur}. Aktuell live ist Set ${live.set}.`)
      + ` <button type="button" data-set-pick="${live.set}">Zu Set ${live.set} (Live)<span></span></button>`;
  } else ban.hidden = true;
}
function pickSet(n){
  try { localStorage.setItem('tftfreaks_set', String(n)); } catch(e){}
  if(curPath().startsWith('/tft-team-builder/')) setUrl('/tft-team-builder');
  if(curPath().startsWith('/tools/tft-kampf-simulator/')) setUrl('/tools/tft-kampf-simulator');
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
    if(!mainComps.length) return [L(`Die Tierlist für Set ${TFT_DATA.set} wird gerade neu aufgebaut – schau bald wieder vorbei!`, `The Set ${TFT_DATA.set} tier list is being rebuilt right now – check back soon!`), L('Schau dir solange die neuen Champions und Items in der Bibliothek an!', 'Meanwhile, check out the champions and items in the library!'), L('Im Team Builder kannst du schon erste Ideen basteln.', 'You can already try out first ideas in the team builder.')];
    const s = mainComps.filter(c=>c.tier==='S'), up = mainComps.filter(c=>c.sticker===2 && c.tier!=='S'), down = mainComps.filter(c=>c.sticker===3);
    return [
      s.length > 1 ? `${s.length} Comps sind gerade S-Tier. Mein Favorit? ${s[0].name}!` : s.length ? L(`Nur eine Comp ist gerade S-Tier: ${s[0].name}!`, `Only one comp is S-tier right now: ${s[0].name}!`) : null,
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
  coaching(){ return ['Das Kennenlernen ist kostenlos – trau dich!', 'Nimm vorher ein paar Spiele auf, sonst gibt es nichts zum Anschauen!', 'Claudio und Romano sind beide Challenger. Ich bin nur fürs Zuschlagen zuständig.', 'VOD-Review heißt: pausieren, zurückspulen, verstehen. Ganz ohne Stress.', 'Mit dem Set-Pass sparst du 50 €. Ich würde zuschlagen!', 'VIP heißt: ein ganzes Set mit deinem Coach. Nur 4 Plätze – schnell sein lohnt sich!', 'Deutsch oder Englisch? Geht beides!']; },
  // Ornn: alles, was noch im Bau ist oder nicht läuft
  news(){ return ['Hmph. Die Neuigkeiten liegen noch auf dem Amboss.', 'Gut Ding will Weile haben. Gute Patch-Notes auch.', 'Ich schmiede hier gerade. Komm später wieder.', 'Erst wenn das Eisen heiß ist, wird geschrieben. Bis dahin: Tierlist.']; },
  tools(){
    const sh = TFT_CUSTOM_SET.shop, o = sh && sh.odds && sh.odds[7];
    // Heimerdinger: das Tools-Maskottchen
    return ['Willkommen in meiner Werkstatt! Such dir ein Werkzeug aus – alles frisch kalibriert.',
      'Rollen oder leveln? Mein Rolldown-Rechner kennt die Antwort. Wissenschaft!',
      o ? `Auf Level 8 ist jeder Shop-Slot zu ${o[3]} % eine 4-Kosten-Unit. Faszinierend, nicht wahr?` : null,
      'Die Item-Drop-Chance zählt mit, was noch im Item-Pool liegt. Reine Mathematik!',
      'Mit dem Tierlist-Maker baust du deine eigene Tierlist – und schickst sie als Link an deine Freunde.',
      'Ein Experiment ist kein Experiment ohne Wiederholung: Im Simulator rechnest du einen Kampf 100-mal.',
      'Guinsoo oder Infinity Edge? Der DPS-Vergleich zeigt es dir als Kurve. Wunderbar!'].filter(Boolean);
  },
  // Heimerdinger in den einzelnen Tools (erscheint nur, wenn assets/tools/<tool>.webp existiert)
  tlmaker(){ return ['S-Tier oder C-Tier? Hmm … eine Frage für die Wissenschaft – und für deine Meinung!',
    'Zieh Champions, Items, Artefakte, Embleme oder Augments in die Reihen. Oder tipp erst an, dann auf die Zeile.',
    'Klick auf ein Label, um die Reihe umzubenennen. Farbe und Reihenfolge änderst du direkt daneben.',
    'Bis zu 12 Reihen! Genug Platz für jede noch so verrückte Hypothese.',
    'Fertig? Mit „Teilen“ bekommst du einen Link. Perfekt für hitzige Diskussionen mit Freunden!']; },
  dps(){ return ['Zwei Builds, ein Gegner, 30 Sekunden. So sieht saubere Wissenschaft aus!',
    'Guinsoo und Kraken brauchen Anlauf – schau, wie die Kurve nach oben zieht.',
    'Stell die Auswertung auf die Sekunde, in der dein Kampf meist entschieden ist.',
    'Mehr Gegner zeigen, wie viel Flächenschaden in einer Fähigkeit steckt.']; },
  rolldown(){ return ['Rollen oder leveln? Lass uns das berechnen, bevor du dein Gold verbrennst!',
    'Je mehr Kopien schon weg sind, desto schlechter deine Chancen. Trag sie ein – Präzision ist alles!',
    'Der Vergleich zeigt dir, ob ein Level vor dem Rollen mehr bringt. Faszinierend!',
    'Zwei Gold pro Roll, fünf Slots pro Shop. Den Rest erledigt die Mathematik.']; },
  drops(){ return ['Komponenten kommen aus einem Item-Pool. Ich zähle mit, was noch drin ist!',
    'Klick die Komponenten an, sobald sie droppen. Je genauer du bist, desto besser meine Vorhersage.',
    'Vor jeder Creep-Stage kommt von jeder Komponente eine dazu. Ein wunderbar logisches System!',
    'Prismatische Orbs gibt es erst ab 3-7. Geduld ist auch eine Wissenschaft!']; },
  augtool(){ return ['Silber, Gold oder Prismatisch? Die Wahrscheinlichkeit sagt es dir!', 'Trag dein Augment auf 2-1 ein – den Rest berechne ich.']; },
  sim(){ return ['Willkommen in meinem Labor! Stell zwei Teams auf und starte das Experiment.',
    'Klick eine Unit an – dann siehst du ihr Ziel, ihren Laufweg und was sie als Nächstes vorhat.',
    'Ein Kampf ist Zufall, hundert Kämpfe sind Statistik. Probier „Siegchance“!']; },
  guides(){ return ['Neue Guides glühen gerade in meiner Esse. Mit Set 19 sind sie fertig geschmiedet!', 'Ein Guide ist wie eine Klinge: erst schmieden, dann schärfen.']; },
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
// Tool-Seiten: Heimerdinger in der Version des Tools (dasselbe Bild wie auf der Kachel) – nur, wenn es das Bild gibt.
// Erst wenn die Seite geöffnet wird (route), damit nicht jeder Aufruf alle Tool-Bilder lädt
function toolArtLoad(root){ root.querySelectorAll('[data-tool-art]:not([data-art-done])').forEach(head=>{
  head.dataset.artDone = '1';
  const src = head.dataset.artSrc || `assets/tools/${head.dataset.toolArt}.webp`, im = new Image();
  im.onload = ()=>{
    const sim = head.dataset.toolArt==='simulator';
    head.classList.add('art-on');
    head.insertAdjacentHTML('afterbegin', `<div class="buddy heimer${sim ? ' b-simonly' : ''}" data-buddy="${head.dataset.artBuddy}"><div class="buddy-bubble" role="status" aria-live="polite"><span class="buddy-text"></span><i class="bd1"></i><i class="bd2"></i></div>`
      + `<button class="buddy-img" type="button" style="background:url('${src}') center bottom/contain no-repeat" aria-label="Heimerdinger – nächster Tipp" title="Klick für den nächsten Tipp"><span></span></button></div>`);
    buddyWire(head.firstElementChild);
    tnEqualize();   // mit Bild bekommt der Kopf seine Seitenabstände – Höhen neu angleichen
  };
  im.src = src;
}); }
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
  // Neues Design: derselbe Kopf wie bei den Champions (Pfad, Titel, Unterzeile), damit die Reiter darunter an derselben Stelle stehen
  if(ND){
    let h = $('#ndLibHead');
    if(!h){ $('#page-library>.wrap').insertAdjacentHTML('afterbegin', '<div class="cv-head" id="ndLibHead"></div>'); h = $('#ndLibHead'); }
    const all = {items:L('Alle Items', 'All items'), traits:L('Alle Traits', 'All traits')}[tab] || '';
    h.innerHTML = `<div class="cv-crumb">Home / ${L('Bibliothek', 'Library')} / ${LIB_LABEL[tab]}</div><h1 class="cv-h1"><span>TFT</span> ${LIB_LABEL[tab]}</h1><p class="cv-sub">${all} · Set ${TFT_DATA.set}</p>`;
  }
  if(libTab!==tab){ libTab = tab; buddyNext('bibliothek', true); }
}

/* ================= CHAMPIONS V2 (/bibliothek/v2): Wabenraster mit Wellen-Hover ================= */
// Alle Champions als große Sechsecke, sortiert nach Kosten und Name. Die Positionen rechnet cvLayout() aus (versetzte Reihen),
// der Hover hebt die Wabe unter der Maus stark an und zieht die Nachbarn je nach Abstand mit (Welle).
const cv = {cost:'all', trait:'', q:'', tiles:[], raf:0, mx:0, my:0, inside:false, base:120};   // base = feste Wabengröße im CSS, skaliert wird per Transform
const CV_CLASSES = () => TFT_DATA.traits.filter(t=>((TFT_CUSTOM_SET.traits || {})[t.n] || {}).cat==='class').map(t=>t.n);
function renderChampV2(){
  const box = $('#cvApp'); if(!box) return;
  if(!box.dataset.done){
    const list = champions.slice().sort((a,b)=>a.c - b.c || a.n.localeCompare(b.n));
    box.innerHTML = `<div class="cv-stage">
      <div class="cv-head">
        <div class="cv-crumb">Home / ${L('Bibliothek', 'Library')} / Champions</div>
        <h1 class="cv-h1"><span>TFT</span> Champions</h1>
        <p class="cv-sub">${L('Alle Champions', 'All champions')} · Set ${TFT_DATA.set}</p>
        <nav class="cv-tabs" aria-label="${L('Bibliothek', 'Library')}"><a class="on" href="/bibliothek/champions">Champions</a><a href="/bibliothek/items">Items</a><a href="/bibliothek/traits">Traits</a></nav>
      </div>
      <div class="cv-filters">
        <button type="button" class="cv-chip on" data-cvcost="all">${L('Alle', 'All')}<span></span></button>
        ${[1,2,3,4,5].map(c=>`<button type="button" class="cv-chip cv-cost c${c}" data-cvcost="${c}" title="${c} Gold"><i></i>${c}<span></span></button>`).join('')}
        <span class="cv-sep"></span>
        ${CV_CLASSES().map(n=>`<button type="button" class="cv-chip cv-trait" data-cvtrait="${esc(n)}" title="${esc(n)}" aria-label="${esc(n)}"><img src="${traitImg(n)}" alt="" loading="lazy"><span></span></button>`).join('')}
        <input class="cv-search" id="cvSearch" type="search" placeholder="${L('Champion oder Trait suchen …', 'Search champion or trait …')}" autocomplete="off">
      </div>
      <div class="cv-count" id="cvCount"></div>
      <div class="cv-grid" id="cvGrid">${list.map(c=>`<a class="cv-tile c${c.c}" href="${champHref(c.n)}" data-n="${esc(c.n)}" data-c="${c.c}" data-t="${esc(c.t.join('|'))}" aria-label="${esc(c.n)}">
        <span class="cv-hx"><span class="cv-in" style="background-image:url('${champImg(c.n) || champFallback(c.n)}')"></span></span>
        ${c.t[0] ? `<span class="cv-tr">${traitHex(c.t[0], 'base', 26)}</span>` : ''}
        <span class="cv-label"><b>${esc(c.n)}</b><small><i class="cdot c${c.c}"></i>${c.c} Gold · ${c.t.map(esc).join(' · ')}</small></span>
      </a>`).join('')}</div>
    </div>`;
    cv.tiles = [...box.querySelectorAll('.cv-tile')];
    box.dataset.done = '1';
    const grid = $('#cvGrid'); grid.classList.add('noanim');   // erstes Anordnen ohne Flug-Animation
    cvFilter(); requestAnimationFrame(()=>requestAnimationFrame(()=>grid.classList.remove('noanim')));
    return;
  }
  cvFilter();
}
function cvFilter(){
  const q = cv.q.toLowerCase().trim(); let n = 0;
  cv.tiles.forEach(t=>{
    const ok = (cv.cost==='all' || t.dataset.c===cv.cost) && (!cv.trait || t.dataset.t.split('|').includes(cv.trait)) && (!q || t.dataset.n.toLowerCase().includes(q) || t.dataset.t.toLowerCase().includes(q));
    t.classList.toggle('off', !ok); if(ok) n++;
  });
  $('#cvCount').textContent = n + ' ' + L(n === 1 ? 'Champion' : 'Champions', n === 1 ? 'champion' : 'champions');
  cvLayout();
}
// Wabe (Spitze oben): Breite s, Höhe s·1,1547, Reihenabstand ¾ Höhe. Die Reihen wechseln zwischen k und k−1 Waben und sind
// mittig ausgerichtet – so greifen sie ineinander. Je weniger Champions sichtbar sind, desto größer die Waben und desto runder die Form.
function cvLayout(){
  const grid = $('#cvGrid'); if(!grid || !grid.offsetParent) return;
  const vis = cv.tiles.filter(t=>!t.classList.contains('off')), n = vis.length;
  const W = grid.clientWidth, base = W < 560 ? 74 : W < 900 ? 100 : W < 1250 ? 112 : 118, g = W < 560 ? 6 : 8;
  const grow = n <= 4 ? 1.6 : n <= 8 ? 1.45 : n <= 14 ? 1.3 : n <= 24 ? 1.15 : 1;
  let s = base * grow, step = s + g;
  const maxCols = () => Math.max(2, Math.floor((W + g) / step));
  while(grow > 1 && maxCols() < Math.min(n, 3) && s > base){ s -= 4; step = s + g; }   // auf schmalen Bildschirmen nicht zu groß
  const h = s * 1.1547, rowStep = h * 0.75 + g * 0.6, top = 34;
  // Reihenlängen: kleine Mengen mit fester, kompakter Form (4 = 2+2), sonst runde Wabe: erste Reihe eine Wabe weniger als die zweite,
  // dann abwechselnd (k−1, k, k−1, k …). Die letzte Reihe bekommt einfach die restlichen Champions.
  const SMALL = {1:[1], 2:[2], 3:[2,1], 4:[2,2], 5:[2,3], 6:[3,3], 7:[2,3,2], 8:[3,2,3], 9:[3,3,3]};
  let rows;
  if(SMALL[n] && Math.max(...SMALL[n]) <= maxCols()) rows = SMALL[n];
  else {
    const mc = maxCols(), target = Math.max(3, Math.min(mc, n < 30 ? Math.round(Math.sqrt(n * 1.7)) : mc));
    const build = k => {
      const r = []; let left = n, len = k - 1, L = len;
      while(left > 0){ const m = Math.min(len, left); r.push(m); L = len; left -= m; len = len === k ? k - 1 : k; }
      const last = r[r.length - 1], lonely = r.length > 1 && ((last <= 2 && L >= 4) || last < Math.ceil(L / 2));
      return {r, k, bad: last === L ? 0 : lonely ? 1.2 : (L - last) / L * 0.6};
    };
    // ein paar Breiten probieren: möglichst volle letzte Reihe, keine verwaisten Reste, nah an der Wunschbreite
    const cands = [target, target - 1, target - 2, n < 30 ? target + 1 : 0].filter(k=>k >= 3 && k <= mc).map(build);
    rows = (cands.sort((x, y)=>(x.bad + Math.abs(target - x.k) * 0.8) - (y.bad + Math.abs(target - y.k) * 0.8))[0] || {r:[n]}).r;
  }
  // Wabenraster ab der ersten Reihe: ungerade Reihen um eine halbe Wabe versetzt. Mittig ausgerichtete Reihen mit k−1 und k Waben
  // liegen damit exakt auf dem Raster; nur eine Rest-Reihe wird auf den nächsten Rasterplatz gerundet.
  const pos = [], origin = (W - (rows[0] * step - g)) / 2;
  let prevX = origin;
  rows.forEach((m, r)=>{
    const lat = origin + (r % 2) * step / 2, ideal = (W - (m * step - g)) / 2;
    // letzte Reihe (wenn sie kürzer ist): linksbündig unter der Reihe darüber – eine halbe Wabe eingerückt, damit sie ineinandergreift
    const isRest = r > 0 && r === rows.length - 1 && m < rows[r - 1];
    const x = isRest ? prevX + (lat > prevX ? 1 : -1) * step / 2 + (lat > prevX ? 0 : step) : lat + Math.round((ideal - lat) / step) * step;
    for(let c = 0; c < m; c++) pos.push([x + c * step, top + r * rowStep]);
    prevX = x;
  });
  const minX = Math.min(...pos.map(p=>p[0])), maxX = Math.max(...pos.map(p=>p[0])) + s, shift = (W - (maxX - minX)) / 2 - minX;
  // Position und Größe per Transform (GPU) statt left/top/width – das bleibt beim Filtern flüssig
  const B = cv.base, Hb = B * 1.1547, k2 = s / B;
  vis.forEach((t, j)=>{ const [x, y] = pos[j];
    t._cx = x + shift + s / 2; t._cy = y + h / 2;
    t.style.setProperty('--x', (t._cx - B / 2).toFixed(1) + 'px'); t.style.setProperty('--y', (t._cy - Hb / 2).toFixed(1) + 'px'); t.style.setProperty('--k', k2.toFixed(4)); });
  grid.style.height = (top + (rows.length ? (rows.length - 1) * rowStep + h : 0) + 60) + 'px';
  grid.style.setProperty('--hs', (1 + 0.34 * Math.min(1, base / s)).toFixed(3));   // große Waben beim Hover nicht noch riesiger
  cv.size = s;
}
// Welle: Einfluss nimmt mit dem Abstand zur Maus ab; die Wabe direkt unter der Maus wird groß
function cvWave(){
  cv.raf = 0;
  if(!$('#cvGrid')) return;
  const R = cv.size * 2.6;
  let hot = null, best = Infinity;
  cv.tiles.forEach(t=>{
    if(t.classList.contains('off')){ return; }
    const d = cv.inside ? Math.hypot(t._cx - cv.mx, t._cy - cv.my) : Infinity;
    const f = d < R ? Math.pow(1 - d / R, 1.6) : 0;
    t.style.setProperty('--lift', f.toFixed(3));
    if(d < best){ best = d; hot = t; }
  });
  cv.tiles.forEach(t=>t.classList.toggle('hot', cv.inside && t===hot && best < cv.size * 0.62));
  $('#cvGrid').classList.toggle('waving', cv.inside);
}
document.addEventListener('pointermove', e=>{
  const grid = e.target.closest && e.target.closest('#cvGrid'); if(e.pointerType==='touch') return;
  if(!grid){ if(cv.inside){ cv.inside = false; if(!cv.raf) cv.raf = requestAnimationFrame(cvWave); } return; }
  const r = grid.getBoundingClientRect(); cv.mx = e.clientX - r.left; cv.my = e.clientY - r.top; cv.inside = true;
  if(!cv.raf) cv.raf = requestAnimationFrame(cvWave);
});
document.addEventListener('click', e=>{
  const c = e.target.closest('[data-cvcost]');
  if(c){ const v = c.dataset.cvcost; cv.cost = v !== 'all' && cv.cost === v ? 'all' : v;   // zweiter Klick auf einen aktiven Filter schaltet ihn aus
    document.querySelectorAll('[data-cvcost]').forEach(b=>b.classList.toggle('on', b.dataset.cvcost===cv.cost)); cvFilter(); return; }
  const t = e.target.closest('[data-cvtrait]'); if(t){ cv.trait = cv.trait===t.dataset.cvtrait ? '' : t.dataset.cvtrait; document.querySelectorAll('[data-cvtrait]').forEach(b=>b.classList.toggle('on', b.dataset.cvtrait===cv.trait)); cvFilter(); }
});
document.addEventListener('input', e=>{ if(e.target.id==='cvSearch'){ cv.q = e.target.value; cvFilter(); } });
document.addEventListener('focusin', e=>{ const t = e.target.closest && e.target.closest('.cv-tile'); if(t){ cv.inside = true; cv.mx = t._cx; cv.my = t._cy; cvWave(); } });
window.addEventListener('resize', ()=>{ if($('#page-champv2') && $('#page-champv2').classList.contains('active')) cvLayout(); });

/* ================= RENDER: CHAMPIONS ================= */
let costF='all';
function renderChamps(){
  const q = $('#champSearch').value.toLowerCase().trim();
  const list = champions.filter(c=>(costF==='all'||String(c.c)===costF) && (!q || c.n.toLowerCase().includes(q) || c.t.some(t=>t.toLowerCase().includes(q))));
  $('#champCount').textContent = `${list.length} von ${champions.length} Champions`;
  // echte Links auf die Champion-Seiten (für Google), Klick öffnet die Seite ohne Neuladen
  $('#champGrid').innerHTML = list.map(c=>`<a class="champ" href="${champHref(c.n)}">${avatar(c.n,56)}<div><h4>${esc(c.n)}</h4><div class="cost"><span class="coin"></span>${c.c} Gold${champRange(c.n) ? `<span class="ch-rng sm ${isMelee(c.n) ? 'melee' : 'ranged'}" title="${rangeLabel(c.n)}">${isMelee(c.n) ? 'Nahkampf' : 'Fernkampf'}</span>` : ''}</div><div class="trait-mini">${c.t.map(t=>`<span style="display:inline-flex;align-items:center;gap:4px"><img src="${traitImg(t)}" alt="" width="12" height="12" style="width:12px;height:12px;filter:brightness(1.6)" onerror="this.remove()">${esc(t)}</span>`).join('')}</div></div></a>`).join('');
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
  // Zeilenumbrüche in Riots Text (CR + \\n) als echte Umbrüche
  let s = ab.d.replace(/\r/g, '').replace(/(\\n)+/g, '\u0007').replace(/%i:scale([A-Za-z]+)%/g, (m,k)=>`\u0002${k}\u0003`)
    .replace(/@([A-Za-z0-9_]+)(\*100)?@/g, (m,k,mul)=>{
      const v = vl[k.toLowerCase()]; if(v === undefined) return '\u0006';
      const arr = (Array.isArray(v) ? v : [v]).map(x=>x * (mul ? 100 : 1));
      return '\u0004' + (arr.every(x=>x===arr[0]) ? [arr[0]] : arr).map(fmtNum).join(' / ') + (mul ? ' %' : '') + '\u0005';
    });
  return fmtDesc(s, {})
    .replace(/\u0002([A-Za-z]+)\u0003/g, (m,k)=>`<span class="ab-sc">${esc(SCALE_LBL[k] || k)}</span>`)
    .replace(/\u0004([^\u0005]*)\u0005/g, '<b class="ab-val">$1</b>')
    .replace(/\u0006/g, '<span class="ab-q" title="Diesen Wert liefert Riot in den offiziellen Set-Daten nicht mit">?</span>')
    .replace(/\s*\u0007\s*/g, '<br>');
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
  const inComps = comps.filter(x=>x.core.includes(c.n)).map(x=>`<button class="it-link" data-comp="${x.slug}" style="padding:4px 12px">${x.tier} · ${esc(x.name)}<span></span></button>`).join('') || '<span class="note" style="margin:0">Noch in keiner Tierlist-Comp.</span>';
  // Häufigste Items auf diesem Champion über alle Comps
  const freq = {};
  comps.forEach(x=>[...x.board, ...x.alt].forEach(b=>{ if(b.u===c.n) (b.i||[]).forEach(id=>{ const it=findItem(id); if(it) freq[it.id]=(freq[it.id]||0)+1; }); }));
  const best = Object.entries(freq).sort((a,b)=>b[1]-a[1]).slice(0,6).map(([id])=>itLink(itemById[id])).join('');
  const ab = (CH_DATA[c.n] || {}).ab, st = (CH_DATA[c.n] || {}).st;
  const abHTML = abilityHTML(c.n);
  $('#modalBody').innerHTML = `<div style="display:flex;gap:16px;align-items:center;margin-bottom:6px">${avatar(c.n,64)}<div><h2 style="margin:0">${esc(c.n)}</h2><div class="cost"><span class="coin"></span> ${c.c} Gold${rangeLabel(c.n) ? ` <span class="ch-rng ${isMelee(c.n) ? 'melee' : 'ranged'}">${rangeLabel(c.n)}</span>` : ''}</div><a class="chp-open" href="${champHref(c.n)}">Zur Champion-Seite →</a></div></div>
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

/* ================= CHAMPION-SEITEN (/champions/<name>) ================= */
// Eine eigene Seite pro Champion, damit Google sie findet („TFT Ahri Build“). In der Bibliothek verlinkt, sonst bleibt das Popup mit Link hierher.
const champSlug = n => String(n).toLowerCase().replace(/['’.]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const champBySlug = Object.fromEntries(champions.map(c=>[champSlug(c.n), c]));
const champHref = n => '/champions/' + champSlug(n);
const TIER_ORDER = 'SABCX';
// Items, die der Champion in den Tierlist-Comps (Board und Alt Builds) am häufigsten trägt, und der häufigste komplette Build
function champBuilds(n){
  const freq = {}, sets = {};
  comps.forEach(x=>[...(x.board||[]), ...(x.alt||[])].forEach(b=>{
    if(b.u!==n) return;
    const ids = (b.i||[]).map(findItem).filter(it=>it && ['craft','radiant','artifact','emblem'].includes(it.cat)).map(it=>it.id);
    ids.forEach(id=>{ freq[id] = (freq[id]||0) + 1; });
    if(ids.length===3){ const k = ids.slice().sort().join('|'); sets[k] = (sets[k]||0) + 1; }
  }));
  const top = Object.entries(freq).sort((a,b)=>b[1]-a[1]).slice(0, 6).map(([id, k])=>({it:itemById[id], k})).filter(x=>x.it);
  const bs = Object.entries(sets).sort((a,b)=>b[1]-a[1])[0];
  return {top, best: bs ? bs[0].split('|').map(id=>itemById[id]).filter(Boolean) : []};
}
const champCompsOf = n => comps.filter(x=>!x.hidden && (x.board||[]).some(b=>b.u===n))
  .sort((a,b)=>(b.main - a.main) || TIER_ORDER.indexOf(a.tier) - TIER_ORDER.indexOf(b.tier) || (b.carry===n) - (a.carry===n));
function renderChampPage(slug){
  const box = $('#chPage'), c = champBySlug[slug];
  if(!c){ box.innerHTML = ornnSays('Diesen Champion gibt es im aktuellen Set nicht.'); return; }
  const n = c.n, d = CH_DATA[n] || {}, ab = d.ab, st = d.st, S = TFT_DATA.set;
  const splash = champImg(n) || champFallback(n), abHTML = abilityHTML(n), {top, best} = champBuilds(n), cs = champCompsOf(n);
  const carryN = cs.filter(x=>x.carry===n).length, patch = champPatchHTML(n);
  const hold = c.c <= 3 ? Object.entries(HOLD_TL[String(c.c)] || {}).find(([, list])=>(list||[]).includes(n)) : null;
  const sameCost = champions.filter(x=>x.c===c.c && x.n!==n);
  const order = champions.slice().sort((a,b)=>a.c - b.c || a.n.localeCompare(b.n)), oi = order.findIndex(x=>x.n===n);
  const prev = order[(oi - 1 + order.length) % order.length], next = order[(oi + 1) % order.length];
  const chLink = (x, size) => `<a class="chp-av" href="${champHref(x.n)}" title="${esc(x.n)}">${avatar(x.n, size || 44)}<span>${esc(x.n)}</span></a>`;
  const card = (title, body, cls) => `<section class="card chp-card ${cls||''}"><h2>${title}</h2>${body}</section>`;
  const traitCards = c.t.map(tn=>{ const t = traits.find(x=>x.n===tn); if(!t) return '';
    const mates = champions.filter(x=>x.n!==n && x.t.includes(tn));
    return `<div class="chp-trait"><div class="trait-top">${traitHex(t.n, t.bp.length===1 ? 'unique' : 'base', 30)}<h3>${esc(t.n)}</h3><div class="bp">${t.bp.map(b=>`<span>${b}</span>`).join('')}</div></div>
      <p>${esc(t.d)}</p>${traitMore(t.n)}${mates.length ? `<div class="chp-mates">${mates.map(x=>chLink(x, 34)).join('')}</div>` : ''}</div>`; }).join('');
  box.innerHTML = `
    <div class="crumb"><a href="/">Home</a> / <a href="/bibliothek">Bibliothek</a> / <a href="/bibliothek/champions">Champions</a> / ${esc(n)}</div>
    <section class="chp-hero c${c.c}"${splash ? ` style="--splash:url('${splash}')"` : ''}>
      <div class="chp-hero-in">
        <div class="chp-portrait">${avatar(n, 112)}</div>
        <div class="chp-head">
          <h1 class="chp-h1"><span class="th-key">${esc(n)}</span> TFT Build: Items, Comps &amp; Fähigkeit</h1>
          <div class="chp-tags"><span class="chp-cost"><span class="coin"></span>${c.c} Gold</span>${rangeLabel(n) ? `<span class="ch-rng ${isMelee(n) ? 'melee' : 'ranged'}">${rangeLabel(n)}</span>` : ''}${c.t.map(t=>`<span class="chp-tr">${traitHex(t, 'base', 20)}${esc(t)}</span>`).join('')}</div>
          <p class="chp-lead">${esc(n)} ist ein ${c.c}-Kosten-Champion aus TFT Set ${S}.</p>
          <div class="chp-acts">${dpsOk(n) ? `<a class="btn btn-primary" href="/tools/tft-dps-vergleich?c=${champSlug(n)}">Builds im DPS-Vergleich testen</a>` : ''}<a class="btn btn-ghost" href="/bibliothek/champions">Alle Champions</a></div>
        </div>
      </div>
    </section>
    <div class="chp-grid">
      <div class="chp-main">
        ${abHTML ? card('Fähigkeit', `<div class="ch-ab"><div class="ch-ab-head"><b>${esc(ab.n)}</b>${st ? `<span>Mana ${st.mana0} / ${st.mana}</span>` : ''}</div><p>${abHTML}</p>
          ${/ab-q/.test(abHTML) ? '<small class="ch-note">? = Wert, den Riot für dieses Set nicht in den offiziellen Daten mitliefert.</small>' : ''}${/ab-val/.test(abHTML) ? '<small class="ch-note">Werte für 1★ / 2★ / 3★.</small>' : ''}</div>`) : ''}
        ${top.length ? card('Beste Items', `${best.length ? `<div class="chp-best"><small>Beliebtester Build</small><div>${best.map(it=>`<button class="chp-bi" data-item="${it.id}" title="${esc(it.en)}"><img src="${it.img}" alt="" loading="lazy"><span>${esc(it.en)}</span><span></span></button>`).join('<i>+</i>')}</div></div>` : ''}
          <div class="chp-items">${top.map(({it, k})=>`<button class="chp-it" data-item="${it.id}"><img src="${it.img}" alt="" loading="lazy"><span><b>${esc(it.en)}</b><small>${k === 1 ? 'in 1 Build' : `in ${k} Builds`}</small></span><span></span></button>`).join('')}</div>
          <p class="note">Aus den Comps unserer Tierlist. Welcher Build am meisten Schaden macht, siehst du im DPS-Vergleich.</p>`) : ''}
        ${card('Comps mit ' + esc(n), cs.length ? `<div class="chp-comps">${cs.map(x=>`<button class="chp-comp" data-comp="${x.slug}" style="--tc:${TIER_COL[x.tier]}"><b class="chp-tier">${x.tier}</b><span><b>${esc(x.name)}</b><small>${esc(STYLE_DE[x.style] || x.style || '')}${x.carry===n ? ' · Carry' : ''}</small></span><span class="chp-chx">${hexHTML(x.carry)}</span><span></span></button>`).join('')}</div>`
          : `<p class="note" style="margin:0">${esc(n)} ist gerade in keiner Comp unserer Tierlist.</p>`)}
        ${st ? card('Werte', `${champStatsHTML(n)}<small class="ch-note">Leben und Angriffsschaden für 1★ / 2★ / 3★.</small>`) : ''}
        ${patch ? card('Letzte Änderungen', `<div class="cp-list">${patch}</div>`) : ''}
      </div>
      <aside class="chp-side">
        ${card('Traits', traitCards)}
        ${hold ? card('Hold-Bewertung', `<a class="chp-hold" href="/tierlist/holds" style="--tc:${TIER_COL[hold[0]]}"><b>${hold[0]}</b><span>Tier für 1-1 bis 1-3 unter den ${c.c}-Kosten-Champions</span></a>`) : ''}
        ${sameCost.length ? card(`Weitere ${c.c}-Kosten-Champions`, `<div class="chp-mates">${sameCost.map(x=>chLink(x, 40)).join('')}</div>`) : ''}
      </aside>
    </div>
    <nav class="chp-nav" aria-label="Champions blättern"><a href="${champHref(prev.n)}">← ${esc(prev.n)}</a><a href="${champHref(next.n)}">${esc(next.n)} →</a></nav>
    <section class="tool-seo" aria-labelledby="ts-champ">
      <div class="ts-main">
        <h2 id="ts-champ">${esc(n)} in TFT Set ${S}: So spielst du ihn</h2>
        <p>${esc(n)} ist ein ${c.c}-Kosten-Champion. Für ★★ brauchst du 3 Kopien, für ★★★ 9 Kopien.</p>
        <p>${cs.length ? (cs.length===1 ? `${esc(n)} spielt in einer Comp unserer Tierlist mit.` : `${esc(n)} spielt in ${cs.length} Comps unserer Tierlist mit.`) + (carryN ? (carryN===1 ? ' In einer davon ist er der Carry.' : ` In ${carryN} davon ist er der Carry.`) : ' Meist als Unterstützung für den Carry.') : `${esc(n)} ist gerade in keiner Comp unserer Tierlist – schau in die Traits, um zu sehen, mit wem er zusammenpasst.`}</p>
        <p>Die Werte und die Fähigkeit oben kommen aus den offiziellen Spieldaten des aktuellen Sets, die Items und Comps aus unserer Tierlist. Nach jedem Patch wird beides aktualisiert.</p>
      </div>
      <aside class="ts-side">
        <h3>Häufige Fragen</h3>
        <details><summary>Welche Items sind die besten für ${esc(n)}?</summary><p>${best.length ? `Der beliebteste Build für ${esc(n)} in unserer Tierlist ist ${best.map(it=>esc(it.en)).join(', ')}.` : top.length ? `Am häufigsten bekommt ${esc(n)} in unserer Tierlist ${top.slice(0, 3).map(x=>esc(x.it.en)).join(', ')}.` : `Für ${esc(n)} gibt es in unserer Tierlist noch keine festen Items – teste Builds im DPS-Vergleich.`}</p></details>
        <details><summary>Welche Traits hat ${esc(n)}?</summary><p>${esc(n)}: ${c.t.map(esc).join(', ')}.</p></details>
        <details><summary>Wie viel kostet ${esc(n)} in TFT?</summary><p>${esc(n)} kostet ${c.c} Gold. Für ★★ brauchst du 3 Kopien, für ★★★ 9 Kopien.</p></details>
        <details><summary>In welchen Comps spielt man ${esc(n)}?</summary><p>${cs.length ? cs.slice(0, 4).map(x=>`${esc(x.name)} (${x.tier})`).join(', ') : `${esc(n)} ist gerade in keiner Comp unserer Tierlist.`}</p></details>
        <h3>Weitere Tools</h3>
        <ul class="ts-links">${dpsOk(n) ? `<li><a href="/tools/tft-dps-vergleich?c=${champSlug(n)}">DPS-Vergleich</a></li>` : ''}<li><a href="/tools/tft-rolldown-rechner">Rolldown-Rechner</a></li><li><a href="/tierlist">TFT Tierlist</a></li><li><a href="/tft-team-builder">Team Builder</a></li></ul>
      </aside>
    </section>`;
}

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
      <div class="trait-units">${units.map(u=>`<button data-champ="${esc(u.n)}" style="background:none;border:0;padding:0;cursor:pointer">${avatar(u.n,40)}<span></span></button>`).join('')}</div></div>`;
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
  ['artifact','Artefakte'],['emblem','Embleme'],['other','Verbrauchsgegenstände & Sonstiges'],
];
function itemCat(it){
  const id = it.id;
  if(/Tacticians/.test(id)) return 'other';   // Taktiker-Krone, -Umhang, -Schild: keine Trait-Embleme → Sonstiges
  if(it.cat) return it.cat; // vom Update-Skript gesetzt (gilt für jedes Set)
  if(id.startsWith('DA_Component_')) return 'component';
  if(id.includes('Emblem')) return 'emblem';
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
const itLink = it => `<button class="it-link" data-item="${it.id}">${itImg(it,26)}${esc(it.en)}<span></span></button>`;

function itemCardHTML(it){
  const rec = it.comp.length===2 ? `<div class="it-recipe">${it.comp.map(c=>itemById[c]?itImg(itemById[c],22):'').join('+')}</div>` : '';
  const st = itemStats(it);
  return `<button class="it-card" data-item="${it.id}"><img class="it-ic" src="${it.img}" alt="" width="48" height="48" loading="lazy"><div><h4>${esc(it.en)}</h4>${it.de!==it.en?`<small>${esc(it.de)}</small>`:''}${rec}${st?`<div class="it-stats">${st}</div>`:''}</div><span></span></button>`;
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
  const head = `<tr><th></th>${comps.map(c=>`<th><button data-item="${c.id}" title="${esc(c.en)}">${itImg(c,42)}<span></span></button></th>`).join('')}</tr>`;
  const rows = comps.map(a=>`<tr><th><button data-item="${a.id}" title="${esc(a.en)}">${itImg(a,42)}<span></span></button></th>${comps.map(b=>{
    const r = recipeOf[[a.id,b.id].sort().join('|')];
    return `<td>${r?`<button data-item="${r.id}" title="${esc(r.en)}">${itImg(r,42)}<span></span></button>`:''}</td>`;
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
  if(tr && traits.some(t=>t.n===tr)) extra += sec('TRAIT', `<div class="tag-row"><button class="it-link" data-trait="${esc(tr)}" style="padding:4px 12px">${esc(tr)} ansehen →<span></span></button></div>`);
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
  return `<div class="card pkg ${p.f?'featured':''}">${p.f||p.b?`<span class="pill${p.b?' gold':''}" style="align-self:flex-start;margin-bottom:8px">${esc(p.b||'Beliebt')}</span>`:''}<h3 style="margin:0">${esc(p.n)}</h3><div class="price">${p.p} <small>${p.u}</small></div>${p.h ? `<div class="pkg-h">${esc(p.h)}</div>` : ''}<ul>${p.l.map(x=>`<li>${esc(x)}</li>`).join('')}</ul><a href="/apply" class="btn ${p.f?'btn-primary':'btn-ghost'}" style="justify-content:center">Kennenlernen anfragen</a></div>`;
}
function testimonialHTML(t){
  if(!t.q) return `<div class="card co-quote soon"><span class="co-qm" aria-hidden="true">“</span><p>Feedback folgt</p><figcaption><b>${esc(t.n)}</b>${t.r?`<span>${esc(t.r)}</span>`:''}</figcaption></div>`;
  return `<figure class="card co-quote"><span class="co-qm" aria-hidden="true">“</span><blockquote>${esc(t.q)}</blockquote><figcaption><b>${esc(t.n)}</b>${t.r?`<span>${esc(t.r)}</span>`:''}</figcaption></figure>`;
}
// Guides: Übersicht oder ein einzelner Guide (/guides/encounters)
// Vorerst pausiert: die Seite zeigt „Coming in Set 19“. Mit GUIDES_LIVE = true kommen Übersicht und Encounter-Guide zurück.
const GUIDES_LIVE = false;
function setGuide(sub){
  if(!GUIDES_LIVE && sub) setUrl('/guides');   // alte Links auf /guides/encounters landen auf der Übersicht
  const key = GUIDES_LIVE && sub==='encounters' ? 'encounters' : '';
  document.querySelectorAll('#page-guides .gd-view').forEach(v=>{ v.hidden = v.dataset.guide!==key; });
  if(key==='encounters') renderEncTL();
}
function guideHTML(g){
  if(g.href) return `<a class="card guide guide-on" href="${g.href}"><div class="guide-cover" style="background:${g.col}"><div>${esc(g.t)}<small>TFTClimb</small></div></div><div><span class="pill gold">${esc(g.s)}</span><h3 style="margin-top:10px">${esc(g.t)}</h3><p>${esc(g.d)}</p><p style="color:var(--faint);font-size:.82rem">${esc(g.x)}</p><span class="link-arrow">Zum Guide →</span></div></a>`;
  return `<div class="card guide"><div class="guide-cover" style="background:${g.col}"><div>${esc(g.t)}<small>TFTClimb</small></div></div><div><span class="pill">${esc(g.s)}</span><h3 style="margin-top:10px">${esc(g.t)}</h3><p>${esc(g.d)}</p><p style="color:var(--faint);font-size:.82rem">${esc(g.x)}</p><span class="link-arrow">Bald verfügbar</span></div></div>`;
}
function renderHome(){
  $('#ranks').innerHTML = ranks.map(([n,c,f])=>`<a href="/ranks/${f.toLowerCase()}" class="rank"><div class="rank-gem"><img src="${DD}tft-regalia/TFT_Regalia_${f}.png" alt="TFT Rang ${n}" loading="lazy" onerror="this.outerHTML='<span style=&quot;font:900 1.4rem var(--ff-head);color:${c}&quot;>${n[0]}</span>'"></div>${n}</a>`).join('');
  const sTier = mainComps.filter(c=>c.tier==='S').length;
  $('#sCount').textContent = sTier + ' aktiv';
  $('#sCount').closest('.chip-float').style.display = sTier ? '' : 'none';   // ohne Tierlist keine „0 aktiv“-Karte
  // Team: Vi mit offiziellem Set-18-Bild und ihren Traits
  const vi = champBy['Vi'];
  $('#teamViTraits').innerHTML = vi ? vi.t.map(n=>`<span class="tbadge">${traitHex(n,'base',18)}<span>${esc(n)}</span></span>`).join('') : '';
  $('#coachPkgs').innerHTML = packages.map(pkgHTML).join('');
  $('#coachQuotes').innerHTML = testimonials.map(testimonialHTML).join('');
  $('#allGuides').innerHTML = GUIDES_LIVE ? guides.map(guideHTML).join('') : `<div class="gd-soon"><span class="gd-soon-ic">${ndSvg('guides', 1.6)}</span><b>Coming in Set 19</b><p>${L('Wir schreiben gerade neue Guides von Challenger-Spielern – sie erscheinen mit dem Start von Set 19.', 'We are writing new guides from Challenger players – they arrive with the launch of Set 19.')}</p></div>`;
}

/* ================= APPLY ================= */
['fRank','fGoal'].forEach(id=>{ $('#'+id).innerHTML = ranks.map(([n])=>`<option>${n}</option>`).join(''); });
// Bewerbung über /api/apply als E-Mail an info@tftclimb.com schicken (Antwort: {ok} oder {ok:false, error})
$('#applyForm').addEventListener('submit', async e=>{
  e.preventDefault();
  const f = e.currentTarget, btn = f.querySelector('button[type="submit"]'), ok = $('#applyOk'), err = $('#applyErr');
  const val = id => $('#'+id).value.trim(), opt = id => { const s = $('#'+id); return s.selectedIndex >= 0 ? s.options[s.selectedIndex].textContent.trim() : ''; };
  const body = {name:val('fName'), discord:val('fDiscord'), email:val('fMail'), rank:opt('fRank'), goal:opt('fGoal'), pkg:opt('fPkg'), lang:opt('fLang'), time:val('fTime'), msg:val('fMsg'), website:val('fWeb'), site:EN ? 'en' : 'de'};
  const label = btn.textContent;
  ok.style.display = err.style.display = 'none';
  btn.disabled = true; btn.textContent = L('Wird gesendet …', 'Sending …');
  try {
    const r = await fetch('/api/apply', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body)});
    const j = await r.json().catch(()=>({}));
    if(!r.ok || !j.ok) throw new Error(j.error || 'http');
    f.reset(); ok.style.display = 'block';
  } catch(x){
    const why = x.message==='rate' ? L('Du hast gerade schon mehrere Anfragen geschickt. Probier es in ein paar Minuten noch einmal oder schreib uns direkt an', 'You have just sent several requests. Try again in a few minutes or email us directly at')
      : x.message==='email' ? L('Bitte prüf deine E-Mail-Adresse – oder lass das Feld leer. Du erreichst uns auch direkt unter', 'Please check your email address – or leave the field empty. You can also reach us directly at')
      : L('Das hat leider nicht geklappt. Versuch es gleich noch einmal oder schreib uns direkt an', 'That didn’t work, sorry. Please try again or email us directly at');
    err.innerHTML = `${why} <a href="mailto:info@tftclimb.com">info@tftclimb.com</a>.`;
    err.style.display = 'block';
  } finally { btn.disabled = false; btn.textContent = label; }
});

/* ================= SEARCH ================= */
const searchIndex = [
  ...champions.map(c=>({label:c.n,type:'Champion',html:avatar(c.n,40),go:()=>{closeSearch();go(champHref(c.n));}})),
  ...traits.map(t=>({label:t.n,type:t.cat==='origin'?'Ursprung':'Klasse',html:traitHex(t.n, t.bp.length===1?'unique':'base', 34),go:()=>{closeSearch();go('/bibliothek/traits');setTimeout(()=>{$('#traitSearch').value=t.n;renderTraits();},10);}})),
  ...ITEMS.map(it=>({label:it.en,alt:it.de,type:'Item · '+(ITEM_CATS.find(([k])=>k===it.cat)||[])[1],html:`<img src="${it.img}" alt="" width="40" height="40" loading="lazy" style="width:40px;height:40px;border-radius:8px">`,go:()=>{closeSearch();openItem(it.id);}})),
  ...AUGS.filter(a=>!AUG_DUP.has(a.id)).map(a=>({label:a.en,alt:a.de,type:'Augment'+(a.lv?' · '+AUG_LV[a.lv]:''),html:`<img src="${augImg(a)}" alt="" width="40" height="40" loading="lazy" style="width:40px;height:40px;border-radius:8px">`,go:()=>{closeSearch();openAug(a.id);}})),
];
// Tools (Karten der Tool-Übersicht), Team Builder und alle Cheatsheets: erst beim ersten Öffnen gesammelt,
// dann sind die Cheatsheet-Daten geladen und die Karten schon übersetzt. Comps immer frisch (Tierlist kann nachladen).
let searchPages = null;
const srIc = ic => `<span class="sr-ic">${ic}</span>`;
function searchPagesBuild(){
  const tools = [...document.querySelectorAll('#page-tools .tc')].map(a=>{ const href = a.getAttribute('href'), ph = a.querySelector('.tc-ph');
    return {label:a.querySelector('h3').textContent.trim(), alt:a.querySelector('.tc-text').textContent + ' ' + href, type:'Tool', html:srIc(ph ? ph.innerHTML : ''), go:()=>{closeSearch();go(href);}}; });
  tools.push({label:'Team Builder', alt:'builder board planer planner', type:'Tool', html:srIc(csSvg('<path d="M12 2.5l8.2 4.75v9.5L12 21.5l-8.2-4.75v-9.5z"/><path d="M12 7.5l4 2.3v4.4L12 16.5l-4-2.3V9.8z"/>')), go:()=>{closeSearch();go('/tft-team-builder');}});
  tools.push({label:'Patch Countdown', alt:'next patch nächster patch wann kommt countdown timer', type:'Patches', html:srIc(csSvg('<circle cx="12" cy="13.5" r="7.5"/><path d="M12 9.5v4l2.6 2M9.5 2.5h5"/>')), go:()=>{closeSearch();go(COUNTDOWN_PATH);}});
  const sheets = csList().map(([id])=>{ const m = CS_META[id] || {};
    return {label:csName(id), alt:[...(m.s || []), ...(m.h || []), ...(m.d || []), id].join(' '), type:'Cheatsheet', html:srIc(csIco(id)), go:()=>{closeSearch();go(csHref(id));}}; });
  return [...tools, ...sheets];
}
const searchAll = () => [...(searchPages || (searchPages = searchPagesBuild())), ...searchIndex,
  ...comps.map(c=>({label:c.name,type:'Comp · '+c.tier,html:avatar(c.carry,40),go:()=>{closeSearch();openComp(c.slug);}}))];
let sResults=[], sFocus=0;
function openSearch(){ $('#searchOv').classList.add('open'); $('#searchInput').value=''; runSearch(); setTimeout(()=>$('#searchInput').focus(),20); }
function closeSearch(){ $('#searchOv').classList.remove('open'); }
function runSearch(){
  const q = $('#searchInput').value.toLowerCase().trim(), all = searchAll();
  // Treffer am Namensanfang zuerst (sonst verdrängen z. B. viele Augments das Tool „Augment-Vorhersage“), danach Treffer irgendwo im Namen oder in der Beschreibung
  const rank = s=>{ const l = s.label.toLowerCase(); return l.startsWith(q) ? 0 : l.includes(q) ? 1 : s.alt && s.alt.toLowerCase().includes(q) ? 2 : 3; };
  sResults = (q ? all.map((s, i)=>[rank(s), i, s]).filter(([r])=>r < 3).sort((a, b)=>a[0] - b[0] || a[1] - b[1]).map(([, , s])=>s) : all.filter(s=>s.type.startsWith('Comp'))).slice(0,12);
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
  tools:'<path d="M14.5 6.5a4 4 0 0 0-5.4 5.1L4 16.7 7.3 20l5.1-5.1a4 4 0 0 0 5.1-5.4l-2.4 2.4-2.4-.6-.6-2.4z"/>',
  cheat:'<rect x="4" y="3.5" width="16" height="17" rx="2"/><path d="M4 9h16M4 14.5h16M10 3.5v17"/>'
};
const NAV = [
  {r:'home', h:'/', l:'Home', mascot:true},
  {r:'tierlist', h:'/tierlist', l:'Tierlist', s:'tier', badge: mainComps.length ? TL_PATCH : (setStatus()==='pbe' ? 'PBE' : '')},
  {r:'bibliothek', h:'/bibliothek', l:'Bibliothek', s:'lib'},
  {r:'builder', h:'/tft-team-builder', l:'Team Builder', s:'builder'},
  {r:'ranks', h:'/ranks', l:'Ranks', s:'rank'},
  {r:'tools', h:'/tools', l:'Tools', s:'tools', badge:'Neu'},
  {r:'coaching', h:'/coaching', l:'Coaching', s:'coach'},
  {r:'patches', h:'/patches', l:'Patches', s:'patch', more:true},
  {r:'cheatsheet', h:'/cheatsheet', l:'Cheatsheet', s:'cheat', more:true},
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
  + '<button class="tb-item tb-more" id="moreBtn" aria-haspopup="true" aria-label="Mehr">···<span></span></button>';
$('#moreMenu').innerHTML = NAV.filter(n=>n.more).map(n=>`<a href="${n.h}" data-route="${n.r}">${navIcon(n)}${n.l}</a>`).join('');
$('#drawerPanel').innerHTML = `<a href="/" class="tb-logo" style="border:0;padding:6px 10px 14px;font-size:1.7rem" aria-label="TFTClimb Startseite"><span class="tft-logo" aria-hidden="true"></span><div><span>TFT</span><b>Climb</b></div></a>
  <h5>Tierlist & Daten</h5>${NAV.filter(n=>['tierlist','bibliothek','builder','ranks','tools','patches','cheatsheet'].includes(n.r)).map(n=>`<a href="${n.h}" data-route="${n.r}">${navIcon(n)}${n.l}</a>`).join('')}
  <h5>TFTClimb</h5>${NAV.filter(n=>['home','coaching','guides','about','apply'].includes(n.r)).map(n=>`<a href="${n.h}" data-route="${n.r}">${navIcon(n)}${n.l}</a>`).join('')}`;
const moreMenu = $('#moreMenu');
$('#moreBtn').onclick = e=>{ e.stopPropagation(); const r=e.currentTarget.getBoundingClientRect(); moreMenu.style.left=Math.min(r.left, innerWidth-240)+'px'; moreMenu.classList.toggle('open'); };
document.addEventListener('click', e=>{ if(!e.target.closest('#moreMenu')) moreMenu.classList.remove('open'); });
const drawer = $('#drawer');
$('#burger').onclick = ()=>drawer.classList.add('open');
drawer.addEventListener('click', e=>{ if(e.target.closest('[data-drawer-close]') || e.target.closest('a')) drawer.classList.remove('open'); });

// Meet the Team: Übersicht (/about) oder Profil (/about/<name>)
// Zwischen den Coach-Profilen blättern: Pfeile neben der Überschrift oder Wischen am Handy; das Profil wischt zur Seite, das neue kommt von der anderen Seite
const ABOUT_COACHES = [['crazyslayt', 'CrazYSlayt', 'assets/img/team-claudio.jpg'], ['humbadobo', 'humbadobo', 'assets/img/team-romano.jpg']];
let slideDir = 0;   // 1 = zum nächsten Eintrag (alte Ansicht geht nach links raus), -1 = zum vorherigen; gesetzt von den Pfeilen und Wischgesten
// Ansichten im selben Container umschalten (Coach-Profile, Tools); mit Richtung wischt die alte Ansicht raus und die neue kommt von der Seite
function slideViews(views, to){
  const from = views.find(v=>!v.hidden), dir = slideDir; slideDir = 0;
  views.forEach(v=>{ v.getAnimations().forEach(a=>a.cancel()); v.style.cssText = ''; delete v.dataset.slide; v.hidden = v !== to; });
  if(!dir || !from || !to || from===to || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const box = to.parentElement, tok = String(Date.now() + Math.random());
  box.classList.add('mt-sliding');   // Breite begrenzen, damit beim Wischen keine Bildlaufleiste entsteht
  const pos = {top:to.offsetTop + 'px', left:to.offsetLeft + 'px', width:to.offsetWidth + 'px'};
  from.hidden = false; from.dataset.slide = tok; Object.assign(from.style, {position:'absolute', pointerEvents:'none'}, pos);
  const opt = {duration:460, easing:'cubic-bezier(.45,0,.2,1)'};
  const out = from.animate([{transform:'none', opacity:1}, {transform:`translateX(${-dir * 100}%)`, opacity:0}], opt);
  to.animate([{transform:`translateX(${dir * 100}%)`, opacity:0}, {transform:'none', opacity:1}], opt);
  const clean = ()=>{ if(from.dataset.slide !== tok) return; delete from.dataset.slide; from.style.cssText = ''; from.hidden = true; box.classList.remove('mt-sliding'); };
  out.onfinish = clean; setTimeout(clean, opt.duration + 150);   // Timer als Rückfall, falls die Animation pausiert (z. B. Tab im Hintergrund)
}
function setAbout(sub){
  const views = [...document.querySelectorAll('#page-about .mt-view')];
  const key = views.some(v=>v.dataset.about && v.dataset.about===sub) ? sub : '';
  if(!key || !(views.find(v=>!v.hidden) || {}).dataset.about) slideDir = 0;   // Übersicht ↔ Profil ohne Wischen
  slideViews(views, views.find(v=>v.dataset.about===key));
}
// Kleiner Kreis zum vorherigen/nächsten Eintrag: kleines Bild (Coach-Foto bzw. Tool-Heimer) mit Pfeil-Abzeichen, Name nur als Tooltip.
// Bilder als data-src: laden erst, wenn die Seite offen ist (route)
const pnArrow = (dir, href, name, img, label, imgCls='') => `<a class="mt-nav ${dir < 0 ? 'mt-prev' : 'mt-next'}" href="${href}" data-dir="${dir}" title="${esc(name)}" aria-label="${label}: ${esc(name)}">`
  + `<img class="pn-av${imgCls}"${img ? ` data-src="${img}"` : ''} alt="" width="40" height="40"><i class="pn-ar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${dir < 0 ? 'M15 6l-6 6 6 6' : 'M9 6l6 6-6 6'}"/></svg></i></a>`;
ABOUT_COACHES.forEach(([k], i)=>{
  const head = document.querySelector(`#page-about .mt-view[data-about="${k}"] .page-head`); if(!head) return;
  const n = ABOUT_COACHES.length, [pk, pn, pi] = ABOUT_COACHES[(i - 1 + n) % n], [nk, nn, ni] = ABOUT_COACHES[(i + 1) % n];
  head.classList.add('mt-head');
  head.insertAdjacentHTML('beforeend', pnArrow(-1, '/about/' + pk, pn, pi, L('Vorheriger Coach', 'Previous coach')) + pnArrow(1, '/about/' + nk, nn, ni, L('Nächster Coach', 'Next coach')));
});
// Tools: ein festes Kreis-Paar pro Seite (Tools und Simulator), außerhalb der wischenden Tool-Ansicht – beim Wechsel bewegt sich nur das Tool,
// die Kreise bekommen nur neues Ziel und Bild. Desktop: im Seitenrand auf halber Fensterhöhe (bleibt beim Scrollen stehen), Handy: obere Ecken.
// Reihenfolge wie in der Tool-Übersicht
const TOOL_NAV = [['rolldown', L('Rolldown-Rechner', 'Rolldown calculator')], ['drops', L('Item-Drop-Chance', 'Item Drop Chance')], ['tierlist', L('Tierlist-Maker', 'Tier list maker')],
  ['simulator', L('Kampf-Simulator', 'Fight simulator')], ['dps', L('DPS-Vergleich', 'DPS Comparison')], ['augments', L('Augment-Vorhersage', 'Augment prediction')]];
['#page-tools', '#page-builder'].forEach(sel=>{ const w = document.querySelector(sel + ' > .wrap'); if(!w) return;
  w.insertAdjacentHTML('afterbegin', `<div class="tn-nav" hidden><div class="tn-rail l">${pnArrow(-1, '/tools', '', '', L('Vorheriges Tool', 'Previous tool'), ' pn-tool')}</div><div class="tn-rail r">${pnArrow(1, '/tools', '', '', L('Nächstes Tool', 'Next tool'), ' pn-tool')}</div></div>`); });
function tnUpdate(key){   // key = aktuelles Tool ('' = keins → Kreise aus)
  const i = TOOL_NAV.findIndex(([k])=>k===key), n = TOOL_NAV.length;
  document.querySelectorAll('.tn-nav').forEach(nav=>{
    nav.hidden = i < 0; if(i < 0) return;
    [[-1, '.mt-prev', L('Vorheriges Tool', 'Previous tool')], [1, '.mt-next', L('Nächstes Tool', 'Next tool')]].forEach(([d, s, label])=>{
      const [k, name] = TOOL_NAV[(i + d + n) % n], a = nav.querySelector(s), img = a.querySelector('.pn-av');
      a.setAttribute('href', toolHref(k)); a.title = name; a.setAttribute('aria-label', `${label}: ${name}`);
      img.removeAttribute('data-src'); img.src = `assets/tools/thumb/${k}.webp`;
    });
  });
  if(i >= 0) requestAnimationFrame(tnEqualize);
}
// Alle Tool-Köpfe gleich hoch (der höchste bei der aktuellen Breite): so beginnt jede Tool-Box auf derselben Höhe und die festen
// Kreise sitzen oben bündig daneben. Gemessen an Kopien im sichtbaren Bereich – auch für Tools, die gerade versteckt sind.
function tnEqualize(){
  const heads = [...document.querySelectorAll('.page-head[data-tool-art]')], nav = document.querySelector('.page.active .tn-nav:not([hidden])');
  heads.forEach(h=>{ h.style.minHeight = ''; const k = h.querySelector('.th-key'); if(k) k.style.fontSize = ''; });
  if(!nav || matchMedia('(max-width:760px)').matches) return;   // Handy: Kreise in den oberen Ecken, Köpfe frei
  const wrap = nav.parentElement, cur = [...wrap.querySelectorAll('.page-head[data-tool-art]')].find(h=>h.offsetParent); if(!cur) return;
  const box = document.createElement('div'); box.setAttribute('data-noi18n', ''); box.style.cssText = `position:absolute;left:0;top:0;width:${cur.offsetWidth}px;visibility:hidden;pointer-events:none`;
  wrap.appendChild(box);
  const max = Math.max(...heads.map(h=>{ const c = h.cloneNode(true); c.querySelectorAll('.buddy, .mt-nav').forEach(x=>x.remove()); c.removeAttribute('id'); c.classList.add('art-on');   // jedes Tool hat sein Heimer-Bild
    c.querySelectorAll('[data-h1]').forEach(x=>h1Swap(x, 'h1'));   // versteckte Tools tragen ihre Überschrift als <div> (h1Sync) – zum Messen wie sichtbar
    box.appendChild(c);
    // zu langer Tool-Name (z. B. auf Englisch): Schrift so weit verkleinern, dass er wie die anderen in eine Zeile passt
    const k = c.querySelector('.th-key');
    if(k){ k.style.whiteSpace = 'nowrap'; const room = k.parentElement.clientWidth, need = k.scrollWidth;
      if(need > room){ const fs = parseFloat(getComputedStyle(k).fontSize) * room / need * .97 + 'px'; k.style.fontSize = fs; h.querySelector('.th-key').style.fontSize = fs; }
      k.style.whiteSpace = ''; }
    const v = c.offsetHeight; c.remove(); return v; }));
  box.remove();
  heads.forEach(h=>h.style.minHeight = max + 'px');
  nav.style.setProperty('--tn-top', (cur.offsetTop + max) + 'px');
}
let tnResize = 0; addEventListener('resize', ()=>{ clearTimeout(tnResize); tnResize = setTimeout(tnEqualize, 150); });
if(document.fonts) document.fonts.ready.then(()=>tnEqualize());
// Klick auf einen Pfeil: Wisch-Richtung merken, wenn alte und neue Ansicht auf derselben Seite liegen (der Simulator hat eine eigene Seite)
const pnGo = (a, dir) => { const href = a.getAttribute('href'), page = a.closest('.page');
  slideDir = page && page.id === 'page-tools' && !/simulator/.test(href) || page && page.id === 'page-about' ? dir : 0; go(href); };
document.addEventListener('click', e=>{ const a = e.target.closest('.mt-nav'); if(!a || e.ctrlKey || e.metaKey || e.shiftKey || e.button) return; e.preventDefault(); e.stopPropagation(); pnGo(a, +a.dataset.dir); }, true);
// Wischen auf dem Handy: bei Coaches überall im Profil, bei Tools nur im Kopf (sonst stört es die Bedienung der Tools)
let pnTouch = null;
['#page-about', '#page-tools', '#page-builder'].forEach(sel=>{ const pg = $(sel); if(!pg) return;
  pg.addEventListener('touchstart', e=>{ const v = e.target.closest('.mt-view:not([data-about=""])') || (e.target.closest('.page-head') && e.target.closest('.tool-view, #page-builder.sim-mode'));
    pnTouch = v && e.touches.length === 1 ? {x:e.touches[0].clientX, y:e.touches[0].clientY, v} : null; }, {passive:true});
  pg.addEventListener('touchend', e=>{
    if(!pnTouch) return; const t = e.changedTouches[0], dx = t.clientX - pnTouch.x, dy = t.clientY - pnTouch.y, v = pnTouch.v; pnTouch = null;
    if(Math.abs(dx) < 70 || Math.abs(dx) < Math.abs(dy) * 1.5) return;   // nur deutliche waagrechte Wischer
    const s = dx < 0 ? '.mt-next' : '.mt-prev', a = v.querySelector(s) || pg.querySelector('.tn-nav:not([hidden]) ' + s);   // Tools: das feste Kreis-Paar der Seite
    if(a) pnGo(a, dx < 0 ? 1 : -1);
  }, {passive:true});
});

/* ================= TOOLS: Übersicht & Rolldown-Rechner ================= */
// Shop-Chancen/Pool-Größen pro Set aus data/custom-<Set>.js; Champions pro Kosten aus den offiziellen Set-Daten
const SHOP = TFT_CUSTOM_SET.shop && Array.isArray(TFT_CUSTOM_SET.shop.odds) ? TFT_CUSTOM_SET.shop : null;
const SHOP_DISTINCT = [1,2,3,4,5].map(c=>champions.filter(x=>x.c===c).length);
const RD_MAXK = 9;   // bis 9 Kopien (= ★★★)
// Version 2 „für alle“, kurze Maske: Kostenstufe (welcher Champion es ist, ändert die Chance nicht – alle einer Stufe haben gleich viele Kopien),
// Ziel in Sternen (3 Kopien = ★★, 9 Kopien = ★★★) und wie viele schon da sind, spielt noch jemand die Unit, Level und Gold.
// Ergebnis als Ampel und „x von 100 Spielen“. Der Modus „Genau“ zeigt die exakten Pool-Zahlen und den XP-Vergleich für erfahrene Spieler.
const RD_LVL = [5, 6, 7, 8, 9];   // auf diesem Level rollt man die Kostenstufe meist (2-Kosten-Reroll auf 6, 3-Kosten auf 7 …)
// Kopien deiner Unit bei Gegnern (geschätzt): 1 Gegner hält meist ein ★★ (3 Kopien), bei 5-Kostern seltener; „2 oder mehr“ entsprechend doppelt
const RD_OPP = [[0, 0, 0, 0, 0], [3, 3, 3, 3, 2], [6, 6, 6, 5, 4]];
// Richtwert: Kopien ANDERER Units derselben Kostenstufe, die bei den Spielern liegen (Board + Bank) – sie fehlen im Pool und machen deine Unit häufiger.
// Pro Spieler je Kostenstufe 1–5, nach Level als Anzeiger für die Spielphase (Level 6 ≈ 3-2, Level 7 ≈ 3-5/4-1, Level 8 ≈ 4-2 …); mal 8 Spieler
const RD_LOBBY = {3:[4, 2, .5, 0, 0], 4:[4, 2, .5, 0, 0], 5:[5, 3, 1, 0, 0], 6:[5, 5, 2, .3, 0], 7:[4, 6, 4, 1, 0], 8:[3, 5, 6, 3, .3], 9:[2, 4, 6, 5, 1.5], 10:[1, 3, 5, 6, 3], 11:[1, 3, 5, 6, 3]};
const rdOtherEst = (lvl, cost) => Math.round(8 * (RD_LOBBY[Math.max(3, Math.min(11, lvl))] || [])[cost-1] || 0);
const RD_GOLD_MAX = 80;
const rd = {cost:0, lvl:7, gold:50, have:0, goal:2, contest:0, opp:0, other:'', xp:''};   // cost 0 = Leerlauf (noch keine Kostenstufe); other '' = Richtwert
const rdGoalN = g => g === 3 ? 9 : 3;   // ★★ = 3 Kopien, ★★★ = 9 Kopien
const RD_UNIT_NEW = {have:0, contest:0, opp:0, other:''};   // andere Kostenstufe: Kopien und Pool-Angaben gelten nicht mehr
const RD_DEF = {...rd};   // Startwerte für „Zurücksetzen“
let rdMode = (()=>{ try { return localStorage.getItem('tftfreaks_rd_mode') === 'pro' ? 'pro' : 'easy'; } catch(e){ return 'easy'; } })(), rdMoreOpen = rdMode === 'pro';
// Rechengrundlage: Kopien draußen (deine + die der Gegner), andere Units gleicher Kosten, wie viele du noch brauchst
function rdCtx(){
  const bag = SHOP.bag[rd.cost-1], goalN = rdGoalN(rd.goal), opp = Math.max(0, Math.min(rdMode === 'pro' ? rd.opp : RD_OPP[rd.contest][rd.cost-1], bag - rd.have));
  const est = rdOtherEst(rd.lvl, rd.cost), exact = rdMode === 'pro' && rd.other !== '';   // ohne eigene Angabe gilt der Richtwert
  const other = Math.min(exact ? rd.other : est, bag * (SHOP_DISTINCT[rd.cost-1] - 1));
  return {bag, goalN, opp, other, est, exact, out:rd.have + opp, need:goalN - rd.have, left:bag - rd.have - opp};
}

// Chance, dass EIN Shop-Slot den gesuchten Champion zeigt, wenn man schon k Kopien gefunden hat
function rdSlotP(lvl, cost, out, other, k){
  const bag = SHOP.bag[cost-1], left = bag - out - k;
  const pool = bag * SHOP_DISTINCT[cost-1] - out - other - k;
  return left > 0 && pool > 0 ? (SHOP.odds[lvl-1][cost-1] / 100) * left / pool : 0;
}
// Wahrscheinlichkeit für genau 0…9 gefundene Kopien, wenn man `gold` ins Rollen steckt (2 Gold = 5 Slots).
// Wie im Spiel kostet jeder Treffer seine Kosten in Gold – fehlt das Gold, kann er nicht gekauft werden.
// Dazu kommt der kostenlose Shop zu Beginn der Runde (geprüft gegen eine Simulation des Shops: Abweichung unter 1 Prozentpunkt).
function rdDist(lvl, cost, out, other, gold){
  const K = RD_MAXK + 1, price = cost, G = Math.max(0, Math.floor(gold));
  const pk = Array.from({length:K}, (_,k)=> k < RD_MAXK ? rdSlotP(lvl, cost, out, other, k) : 0);
  const m = new Float64Array((G+1) * K);
  const shop = st => {   // ein Shop mit 5 Slots: Treffer kaufen, wenn das Gold reicht
    for(let s = 0; s < 5; s++){
      const nx = new Map(), add = (key, v)=>nx.set(key, (nx.get(key)||0) + v);
      st.forEach((v, key)=>{
        const gg = Math.floor(key / K), kk = key % K, p = pk[kk];
        if(p > 0 && gg >= price){ add((gg-price)*K + kk + 1, v*p); add(key, v*(1-p)); } else add(key, v);
      });
      st = nx;
    }
    st.forEach((v, key)=>{ m[key] += v; });
  };
  shop(new Map([[G*K, 1]]));                // kostenloser Shop zu Rundenbeginn
  for(let g = G; g >= 2; g--){            // Gold sinkt mit jedem Roll – also von oben nach unten abarbeiten
    for(let k = 0; k < K; k++){
      const w = m[g*K+k]; if(!w) continue; m[g*K+k] = 0;
      shop(new Map([[(g-2)*K + k, w]]));
    }
  }
  const res = new Array(K).fill(0);
  for(let g = 0; g <= Math.min(1, G); g++) for(let k = 0; k < K; k++) res[k] += m[g*K+k];
  return res;
}
const rdAtLeast = (dist, k) => dist.slice(k).reduce((a,b)=>a+b, 0);
const rdPct = p => (p*100).toLocaleString(LOC, {maximumFractionDigits: p > 0 && p < 0.1 ? 1 : 0}) + L(' %', '%');
function rdGoldFor(q, x){   // kleinstes Gold, mit dem das Ziel mit Chance q erreicht wird
  const P = g => rdAtLeast(rdDist(rd.lvl, rd.cost, x.out, x.other, g), x.need);
  let hi = 2; while(P(hi) < q){ hi *= 2; if(hi > 512) return null; }
  let lo = 0; while(hi - lo > 1){ const mid = (lo + hi) >> 1; if(P(mid) >= q) hi = mid; else lo = mid; }
  return hi;
}

/* ================= DPS-VERGLEICH ================= */
// Ein Champion mit bis zu 4 Item-Builds schlägt 30 s auf Trainingspuppen (Engine des Kampf-Simulators, sim.js → simDps)
const dpsN = v => Math.round(v).toLocaleString(LOC);
const DPS_COL = ['#4f8cff','#ff8a1f','#2fe0d0','#e05cff'];
const DPS_PROF = [['back','Backline', 800, 30, 30], ['mid','Frontline', 1600, 70, 70], ['tank','Tank', 3000, 150, 150]];
const DPS_CATS = [['craft','Kombiniert'], ['radiant','Lichtversionen'], ['artifact','Artefakte'], ['emblem','Embleme']];
const DPS_ITEM_CATS = DPS_CATS.map(c=>c[0]);
// Tanks werden nicht auf Schaden gebaut – im DPS-Vergleich nur Carrys und Schadens-Units
// Units mit Tank-Trait bleiben nur drin, wenn sie in den Tierlist-Comps überwiegend Schadens-Items tragen (z. B. Elise, Morgana),
// nicht aber Tanks mit Tank-Items (z. B. Malphite mit Gargoyle, Warmog's, Crownguard)
const dpsDmgItem = it => { const f = it.fx || {}; return !!(f.AD || f.AP || f.AS || f.CritChance); };
const dpsTankItem = it => { const f = it.fx || {}; return !dpsDmgItem(it) && !!(f.Health || f.Armor || f.MagicResist); };
const dpsCarry = n => { let d = 0, t = 0;
  comps.forEach(c=>(c.board||[]).forEach(b=>{ if(b.u!==n) return; (b.i||[]).map(findItem).filter(Boolean).forEach(it=>{ if(dpsDmgItem(it)) d++; else if(dpsTankItem(it)) t++; }); }));
  return d > 0 && d >= t; };
const dpsOk = n => !!champBy[n] && (simRole(n) !== 'tank' || dpsCarry(n));
// Embleme: keine Taktiker-Kronen (die geben nur Teamgröße)
const dpsItemOk = it => it && DPS_ITEM_CATS.includes(it.cat) && !(it.cat==='emblem' && /Tactician/i.test(it.id + ' ' + it.en));
const dps = {cost:4, champ:'', star:2, builds:[[], []], tl:{}, prof:'mid', n:1, at:22, dur:30, mode:'sum', pick:null, cat:'craft', q:'', res:null, shred:false, sunder:false};
let dpsMounted = false, dpsTimer = 0;
// Ansicht „Einfach“: Champion, Items und Shred/Sunder aus dem Team. „Detailliert“ zeigt dazu Traits (stehen sonst auf der niedrigsten Stufe) und die Gegner
let dpsView = (()=>{ try { return localStorage.getItem('tftfreaks_dps_mode') === 'pro' ? 'pro' : 'easy'; } catch(e){ return 'easy'; } })();
// Builds aus der Tierlist als Startpunkt: Item-Sets, die der Champion in Comps und Alt Builds hält
function dpsSuggest(n){
  const seen = new Set(), out = [];
  comps.forEach(c=>[...(c.board||[]), ...(c.alt||[])].forEach(b=>{
    if(b.u!==n || (b.i||[]).length < 2) return;
    const ids = b.i.map(findItem).filter(dpsItemOk).map(it=>it.id), k = ids.slice().sort().join('|');
    if(ids.length >= 2 && !seen.has(k)){ seen.add(k); out.push(ids.slice(0, 3)); }
  }));
  return out.slice(0, 3);
}
// Leerlauf: Der Vergleich startet ohne Champion (oder mit ?c=<champion>, z. B. von der Champion-Seite); „Zurücksetzen“ führt hierher zurück
const DPS_IDLE = {champ:'', cost:4, star:2, builds:[[], []], tl:{}, prof:'mid', n:1, at:22, mode:'sum', pick:null, cat:'craft', q:'', shred:false, sunder:false};
function dpsMount(){
  if(dpsMounted) return; dpsMounted = true;
  $('#dpsApp').innerHTML = `<div class="dps">
    <section class="card dps-in tio-in" aria-label="${L('Deine Angaben', 'Your input')}">
      ${tioHead(false, `<div class="tio-seg" id="dpsView" role="group" aria-label="${L('Ansicht', 'View')}"><button type="button" data-dview="easy" title="${L('Champion, Items, Shred und Sunder', 'Champion, items, shred and sunder')}">${L('Einfach', 'Simple')}</button><button type="button" data-dview="pro" title="${L('Dazu Traits und Gegner einstellen', 'Also set traits and enemies')}">${L('Detailliert', 'Detailed')}</button></div>${tioReset('id="dpsReset"')}`,
        L('Wähl einen Champion und bis zu vier Item-Builds – der Vergleich rechnet sofort mit.', 'Pick a champion and up to four item builds – the comparison updates instantly.'))}
      <section><h3 class="rd-h"><b>1</b> Champion</h3>
        <div class="rd-costs" id="dpsCosts">${[1,2,3,4,5].map(c=>`<button type="button" class="rd-cost cb c${c}" data-dcost="${c}">${c} Gold<span></span></button>`).join('')}</div>
        <div class="rd-champs" id="dpsChamps"></div>
        <div class="dps-row"><span>Sterne</span><div class="rd-costs" id="dpsStars">${[1,2,3].map(s=>`<button type="button" class="rd-cost" data-dstar="${s}">${'★'.repeat(s)}<span></span></button>`).join('')}</div>
          <div class="dps-debs" id="dpsDebs" role="group" aria-label="${L('Shred und Sunder aus dem Team', 'Shred and sunder from your team')}">
            <button type="button" data-ddeb="shred" title="${L('Shred aus dem Team: −30 % Magieresistenz beim Gegner (z. B. Leerenstab) – dein Carry muss es nicht selbst bauen', 'Shred from your team: −30% enemy magic resist (e.g. Void Staff) – your carry doesn’t have to build it')}">Shred</button>
            <button type="button" data-ddeb="sunder" title="${L('Sunder aus dem Team: −30 % Rüstung beim Gegner (z. B. Letzter Atemzug) – dein Carry muss es nicht selbst bauen', 'Sunder from your team: −30% enemy armor (e.g. Last Whisper) – your carry doesn’t have to build it')}">Sunder</button></div></div></section>
      <section class="dps-bsec"><h3 class="rd-h"><b>2</b> Item-Builds</h3>
        <div id="dpsBuilds"></div>
        <div id="dpsPicker"></div></section>
      <section class="dps-pro"><h3 class="rd-h"><b>3</b> Traits</h3>
        <div id="dpsTraits"></div>
        <p class="rd-hint">${L('Stufe, auf der der Trait in deinem Board aktiv ist. In „Einfach“ zählt die niedrigste Stufe.', 'Level at which the trait is active on your board. “Simple” uses the lowest level.')}</p></section>
      <section class="dps-pro"><h3 class="rd-h"><b>4</b> ${L('Gegner', 'Enemies')}</h3>
        <div class="rd-costs" id="dpsProf">${DPS_PROF.map(([k,l,hp,ar,mr])=>`<button type="button" class="rd-cost" data-dprof="${k}" title="${dpsN(hp)} Leben · ${ar} Rüstung · ${mr} Magieresistenz">${l}<span></span></button>`).join('')}</div>
        <p class="rd-hint" id="dpsProfTxt"></p>
        <div class="dps-row" title="${L('Mehr Gegner nebeneinander zeigen, wie viel Flächenschaden eine Fähigkeit macht.', 'More enemies side by side show how much area damage an ability deals.')}"><span>${L('Anzahl', 'Count')}</span><div class="rd-costs" id="dpsN">${[1,2,3].map(n=>`<button type="button" class="rd-cost" data-dn="${n}">${n}<span></span></button>`).join('')}</div></div></section>
    </section>
    <section class="card dps-res tio-out" aria-label="${L('Dein Ergebnis', 'Your result')}">
      ${tioHead(true, `<div class="rd-costs" id="dpsMode"><button type="button" class="rd-cost" data-dmode="sum">Gesamtschaden<span></span></button><button type="button" class="rd-cost" data-dmode="dps">Schaden pro Sekunde<span></span></button></div>`,
        L('Schaden über die Zeit – jede Linie ist ein Build.', 'Damage over time – each line is one build.'))}
      <div id="dpsWin" aria-live="polite"></div>
      <div id="dpsChart" class="dps-chart"></div>
      <label class="rd-f dps-at"><span>Auswertung bis Sekunde</span><b id="dpsAtV"></b><input type="range" id="dpsAt" min="1" max="30" value="${dps.at}"></label>
      <div class="dps-table-wrap"><table class="dps-table" id="dpsTable"></table></div>
    </section>
  </div>`;
  const on = (sel, ev, f) => $(sel).addEventListener(ev, f);
  on('#dpsCosts', 'click', e=>{ const b = e.target.closest('[data-dcost]'); if(!b) return; dps.cost = +b.dataset.dcost; dpsChamps(); });
  on('#dpsChamps', 'click', e=>{ const b = e.target.closest('[data-dch]'); if(!b) return;   // gewählten Champion nochmal anklicken = zurück in den Leerlauf
    if(b.dataset.dch===dps.champ){ Object.assign(dps, {champ:'', builds:[[], []], tl:{}, pick:null}); dpsChamps(); dpsUpdate(); } else dpsSetChamp(b.dataset.dch); });
  on('#dpsStars', 'click', e=>{ const b = e.target.closest('[data-dstar]'); if(!b) return; dps.star = +b.dataset.dstar; dpsUpdate(); });
  on('#dpsProf', 'click', e=>{ const b = e.target.closest('[data-dprof]'); if(!b) return; dps.prof = b.dataset.dprof; dpsUpdate(); });
  on('#dpsN', 'click', e=>{ const b = e.target.closest('[data-dn]'); if(!b) return; dps.n = +b.dataset.dn; dpsUpdate(); });
  on('#dpsDebs', 'click', e=>{ const b = e.target.closest('[data-ddeb]'); if(!b) return; dps[b.dataset.ddeb] = !dps[b.dataset.ddeb]; dpsUpdate(); });
  on('#dpsView', 'click', e=>{ const b = e.target.closest('[data-dview]'); if(!b || b.dataset.dview === dpsView) return; dpsView = b.dataset.dview;
    try { localStorage.setItem('tftfreaks_dps_mode', dpsView); } catch(err){} dpsUpdate(); });
  on('#dpsTraits', 'click', e=>{ const b = e.target.closest('[data-dtl]'); if(!b) return; const i = b.dataset.dtl.lastIndexOf(':'); dps.tl[b.dataset.dtl.slice(0, i)] = +b.dataset.dtl.slice(i + 1); dpsUpdate(); });
  on('#dpsMode', 'click', e=>{ const b = e.target.closest('[data-dmode]'); if(!b) return; dps.mode = b.dataset.dmode; dps.anim = 'morph'; dpsDraw(); });
  on('#dpsAt', 'input', e=>{ dps.at = +e.target.value; dpsDraw(); });
  on('#dpsReset', 'click', ()=>{ Object.assign(dps, DPS_IDLE, {builds:[[], []], tl:{}}); $('#dpsAt').value = dps.at; dpsChamps(); dpsUpdate(); });
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
    const it = e.target.closest('[data-ditem]'); if(!it || it.disabled || !dps.pick) return;
    const b = dps.builds[dps.pick.b]; b[Math.min(dps.pick.s, b.length)] = it.dataset.ditem;
    dps.pick = b.length < 3 ? {b:dps.pick.b, s:b.length} : null; dpsUpdate();
  });
  on('#dpsPicker', 'input', e=>{ if(e.target.id!=='dpsQ') return; dps.q = e.target.value; dpsPickerGrid(); });
  // Klick daneben oder Escape schließt die schwebende Item-Auswahl
  document.addEventListener('click', e=>{ if(dps.pick && e.target.isConnected && !e.target.closest('#dpsPicker, [data-dslot], [data-dadd]')){ dps.pick = null; dpsBuilds(); } });
  document.addEventListener('keydown', e=>{ if(e.key === 'Escape' && dps.pick){ dps.pick = null; dpsBuilds(); } });
  window.addEventListener('resize', dpsPickPos);
  const ch = $('#dpsChart');
  ch.addEventListener('mousemove', e=>dpsHover(e)); ch.addEventListener('mouseleave', ()=>dpsHover(null));
  dpsChamps(); dpsUpdate();
}
function dpsSetChamp(n){
  if(!dpsOk(n)) return;
  dps.champ = n; dps.cost = champBy[n].c; dps.pick = null; dps.tl = {};
  const s = dpsSuggest(n); dps.builds = s.length ? (s.length > 1 ? s : [s[0], []]) : [[], []];
  dpsChamps(); dpsUpdate();
}
function dpsChamps(){
  $('#dpsCosts').querySelectorAll('[data-dcost]').forEach(b=>b.classList.toggle('on', +b.dataset.dcost===dps.cost));
  $('#dpsChamps').innerHTML = champions.filter(c=>c.c===dps.cost && dpsOk(c.n)).map(c=>`<button type="button" class="rd-ch${c.n===dps.champ?' on':''}" data-dch="${esc(c.n)}" title="${esc(c.n)}">${avatar(c.n, 44)}<span>${esc(c.n)}</span><span></span></button>`).join('');
}
// Traits im DPS-Vergleich: die eigenen des Champions plus alles, was Embleme in den Builds dazubringen
function dpsTraitList(){
  const c = champBy[dps.champ]; if(!c) return [];
  const list = c.t.map(n=>({n, own:true, from:[]}));
  dps.builds.forEach((b, i)=>b.forEach(id=>{
    const it = findItem(id), tn = it && it.cat==='emblem' ? emblemTrait(it) : null;
    if(!tn || c.t.includes(tn)) return;
    let e = list.find(x=>x.n===tn); if(!e){ e = {n:tn, own:false, from:[]}; list.push(e); }
    const L1 = String.fromCharCode(65 + i); if(!e.from.includes(L1)) e.from.push(L1);
  }));
  return list.map(x=>Object.assign(x, {t:traits.find(t=>t.n===x.n)})).filter(x=>x.t);
}
// Stufe eines Traits: gewählt, sonst die erste Stufe (der Trait ist aktiv, so wie man den Champion meist spielt)
const dpsTraitLv = x => dpsView === 'pro' && dps.tl[x.n] !== undefined ? dps.tl[x.n] : (+x.t.bp[0] || 1);   // „Einfach“: immer die niedrigste Stufe
function dpsBuildTraits(items){
  const em = items.map(findItem).filter(it=>it && it.cat==='emblem').map(emblemTrait);
  return dpsTraitList().filter(x=>x.own || em.includes(x.n)).map(x=>({n:x.n, k:dpsTraitLv(x)})).filter(x=>x.k > 0);
}
function dpsTraits(){
  const box = $('#dpsTraits'); if(!box) return;
  const list = dpsTraitList();
  box.innerHTML = list.length ? list.map(x=>{
    const k = dpsTraitLv(x), dead = SIM_NOCOMBAT.includes(x.n);
    return `<div class="dps-trait${x.own ? '' : ' em'}">${traitHex(x.n, x.t.bp.length===1 ? 'unique' : 'base', 26)}
      <span class="dps-tn"><b>${esc(x.n)}</b>${x.own ? '' : `<small>Emblem in Build <b>${x.from.join(', ')}</b></small>`}${dead ? '<small>kein Kampfeffekt</small>' : ''}</span>
      ${dead ? '' : `<div class="dps-tl"><button type="button" class="${k===0 ? 'on' : ''}" data-dtl="${esc(x.n)}:0" data-noi18n>${L('Aus', 'Off')}<span></span></button>${x.t.bp.map(b=>`<button type="button" class="${k===+b ? 'on' : ''}" data-dtl="${esc(x.n)}:${b}">${b}<span></span></button>`).join('')}</div>`}</div>`;
  }).join('') : '<p class="rd-hint" style="margin:0">Wähl zuerst einen Champion.</p>';
}
const dpsItemImg = id => { const it = findItem(id); return it ? `<img src="${it.img}" alt="" title="${esc(it.en)}">` : ''; };
function dpsBuilds(){
  if(!dps.champ){ $('#dpsBuilds').innerHTML = `<p class="rd-hint" style="margin:0">${L('Wähl zuerst einen Champion – dann schlage ich dir Builds aus unserer Tierlist vor.', 'Pick a champion first – then I’ll suggest builds from our tier list.')}</p>`; dpsPicker(); return; }
  $('#dpsBuilds').innerHTML = dps.builds.map((b, i)=>`<div class="dps-build" style="--bc:${DPS_COL[i]}"><b class="dps-bn">${String.fromCharCode(65 + i)}</b>
    <div class="dps-slots">${[0,1,2].map(s=>{ const id = b[s], open = dps.pick && dps.pick.b===i && dps.pick.s===s;
      return `<div class="dps-slot${open?' on':''}${id?'':' empty'}"><button type="button" data-dslot="${i}:${s}" aria-label="${id ? esc((findItem(id)||{}).en || '') : 'Item wählen'}">${id ? dpsItemImg(id) : '+'}<span></span></button>${id?`<button type="button" class="dps-x" data-dclr="${i}:${s}" aria-label="Entfernen">✕<span></span></button>`:''}</div>`; }).join('')}</div>
    <span class="dps-bname">${b.length ? b.map(id=>esc((findItem(id)||{}).en || '')).join(' · ') : 'Keine Items'}</span>
    ${dps.builds.length > 1 ? `<button type="button" class="dps-del" data-ddel="${i}" title="Build entfernen" aria-label="Build entfernen">✕<span></span></button>` : ''}</div>`).join('')
    + (dps.builds.length < 4 ? `<button type="button" class="btn btn-ghost b-btn dps-add" data-dadd>+ Build vergleichen<span></span></button>` : '');
  dpsPicker();
}
// Ist die Auswahl schon offen (Filter, nächster Slot nach einem Item), bleibt das Feld stehen: nur Titel, Filter-Knöpfe, Liste und Spitze wechseln – kein Neuaufbau
function dpsPicker(){
  const box = $('#dpsPicker');
  if(!dps.pick){ box.innerHTML = ''; return; }
  const title = `Item für Build ${String.fromCharCode(65 + dps.pick.b)}, Slot ${dps.pick.s + 1}`, open = box.querySelector('.dps-pick');
  if(open){
    open.querySelector('.dps-pickt').textContent = title;
    open.querySelectorAll('[data-dcat]').forEach(b=>b.classList.toggle('active', b.dataset.dcat === dps.cat));
    const grid = $('#dpsGrid'), keep = grid.dataset.cat === dps.cat ? grid.scrollTop : 0;   // gleiche Liste (nächster Slot): Scroll-Position behalten
    dpsPickerGrid(); grid.scrollTop = keep; dpsPickPos(); return;
  }
  box.innerHTML = `<div class="dps-pick"><div class="dps-pickbar"><span class="dps-pickt">${title}</span><button type="button" class="dps-x2" data-dclose aria-label="Schließen">✕<span></span></button></div>
    <div class="dps-pickbar">${DPS_CATS.map(([k,l])=>`<button type="button" class="chip-btn${dps.cat===k?' active':''}" data-dcat="${k}">${l}<span></span></button>`).join('')}<input class="input" id="dpsQ" placeholder="Item suchen…" value="${esc(dps.q)}"></div>
    <div class="dps-grid" id="dpsGrid"></div></div>`;
  dpsPickerGrid(); dpsPickPos();
}
// Die Auswahl schwebt direkt unter der Build-Zeile, die gerade bearbeitet wird (über allem, ohne etwas zu verschieben);
// die kleine Spitze oben zeigt auf den Item-Platz, der geändert oder neu belegt wird
function dpsPickPos(){
  const box = $('#dpsPicker'), pk = box && box.querySelector('.dps-pick'); if(!pk || !dps.pick) return;
  const sec = box.closest('.dps-bsec'), row = $('#dpsBuilds').children[dps.pick.b], slot = $(`[data-dslot="${dps.pick.b}:${dps.pick.s}"]`); if(!sec || !row || !slot) return;
  const s = sec.getBoundingClientRect(), r = row.getBoundingClientRect(), b = slot.getBoundingClientRect();
  box.style.top = Math.round(r.bottom - s.top + 10) + 'px';
  pk.style.setProperty('--nx', Math.round(b.left + b.width / 2 - s.left) + 'px');
}
function dpsPickerGrid(){
  const q = dps.q.toLowerCase().trim();
  const list = ITEMS.filter(i=>dpsItemOk(i) && (q || i.cat===dps.cat) && (!q || i.en.toLowerCase().includes(q) || i.de.toLowerCase().includes(q))).sort((a,b)=>a.en.localeCompare(b.en));
  // Embleme für einen Trait, den der Champion schon hat, bringen nichts – gesperrt
  const own = (champBy[dps.champ] || {}).t || [];
  $('#dpsGrid').dataset.cat = q ? '' : dps.cat;
  $('#dpsGrid').innerHTML = list.map(i=>{ const no = own.includes(emblemTrait(i));
    return `<button type="button" data-ditem="${i.id}"${no ? ` disabled title="${esc(dps.champ)} hat ${esc(emblemTrait(i))} schon"` : ` title="${esc(i.en)}"`}><img src="${i.img}" alt="" loading="lazy"><span>${esc(i.en)}</span><span></span></button>`; }).join('') || '<p class="note">Kein Item gefunden.</p>';
}
function dpsUpdate(){
  $('#dpsStars').querySelectorAll('[data-dstar]').forEach(b=>b.classList.toggle('on', +b.dataset.dstar===dps.star));
  $('#dpsProf').querySelectorAll('[data-dprof]').forEach(b=>b.classList.toggle('on', b.dataset.dprof===dps.prof));
  $('#dpsN').querySelectorAll('[data-dn]').forEach(b=>b.classList.toggle('on', +b.dataset.dn===dps.n));
  $('#dpsDebs').querySelectorAll('[data-ddeb]').forEach(b=>{ const on = dps[b.dataset.ddeb]; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
  const pro = dpsView === 'pro';
  $('.dps-in').classList.toggle('pro', pro);
  $('#dpsView').querySelectorAll('[data-dview]').forEach(b=>b.classList.toggle('on', b.dataset.dview === dpsView));
  // „Einfach“ rechnet gegen eine Frontline und einen Gegner – die Einstellungen aus „Detailliert“ bleiben gemerkt, zählen dort aber nicht
  const p = DPS_PROF.find(x=>x[0]===(pro ? dps.prof : 'mid')), n = pro ? dps.n : 1;
  $('#dpsProfTxt').textContent = `${dpsN(p[2])} Leben · ${p[3]} Rüstung · ${p[4]} Magieresistenz`;
  dpsBuilds(); dpsTraits();
  clearTimeout(dpsTimer);
  dpsTimer = setTimeout(()=>{   // kurz warten, damit schnelle Klicks nicht jedes Mal neu rechnen
    if(!dps.champ){ dps.res = null; dpsDraw(); return; }
    dps.res = dps.builds.map(items=>simDps({champ:dps.champ, star:dps.star, items, traits:dpsBuildTraits(items), hp:p[2], ar:p[3], mr:p[4], n, dur:dps.dur, shred:dps.shred, sunder:dps.sunder}));
    dps.anim = dps.champ !== dpsAnimChamp ? 'draw' : 'morph'; dpsAnimChamp = dps.champ; dpsDraw();
  }, 30);
}
// Leerlauf ohne Champion (eigene Grafik dieses Tools): drei Build-Linien zeichnen sich immer wieder ins Raster – wie ein Rennen, das gleich startet –,
// am Ende jeder Linie leuchtet ein Punkt; darunter „Bereit“ und die Aufforderung
function dpsIdle(){
  const grid = [0, 1, 2, 3, 4].map(i=>`<line x1="54" x2="626" y1="${14 + i * 61}" y2="${14 + i * 61}" class="dps-grid-l"/>`).join('') + [0, 1, 2, 3, 4, 5, 6].map(i=>`<line x1="${54 + i * 95.3}" x2="${54 + i * 95.3}" y1="14" y2="258" class="dps-grid-l v"/>`).join('');
  const steps = [[0, 258, 120, 250, 135, 196, 300, 186, 318, 120, 470, 110, 490, 52, 626, 40], [0, 258, 150, 252, 165, 214, 330, 204, 345, 160, 500, 150, 515, 104, 626, 96], [0, 258, 180, 254, 200, 236, 380, 228, 400, 200, 560, 192, 580, 170, 626, 160]];
  const px = v => (54 + v * 572 / 626).toFixed(1);
  const line = (p, i) => `<polyline class="dps-iline" style="--i:${i}" fill="none" stroke="${DPS_COL[i]}" stroke-width="3" stroke-linejoin="round" pathLength="100" points="${p.reduce((s, v, k)=>s + (k % 2 ? v + ' ' : px(v) + ','), '').trim()}"/>
    <circle class="dps-idot" style="--i:${i}" cx="${px(p[p.length - 2])}" cy="${p[p.length - 1]}" r="5" fill="${DPS_COL[i]}"/>`;
  return `<div class="dps-idle"><svg viewBox="0 0 640 270" aria-hidden="true">${grid}${steps.map(line).join('')}</svg>
    <div class="dps-idle-txt"><span class="dr-ready">${L('Bereit', 'Ready')}</span><b>${L('Welcher Build gewinnt?', 'Which build wins?')}</b><span>${L('Wähl unter „Deine Angaben“ einen Champion – dann lasse ich seine Item-Builds gegeneinander antreten.', 'Pick a champion under “Your input” – then I’ll let its item builds race each other.')}</span></div></div>`;
}
// Zahlen laufen vom zuletzt gezeigten zum neuen Wert (wie im Item-Drop-Rechner); dpsShown merkt sich die Werte je Schlüssel
const dpsShown = {};
function dpsCount(root){
  const els = [...root.querySelectorAll('[data-cnt]')], still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const jobs = els.map(el=>{ const k = el.dataset.cnt, to = +el.dataset.v, from = dpsShown[k] != null ? dpsShown[k] : to; dpsShown[k] = to; return {el, from, to}; }).filter(j=>j.from !== j.to);
  if(still || !jobs.length) return;
  const t0 = performance.now(), dur = 650, ease = x => 1 - Math.pow(1 - x, 3);
  cancelAnimationFrame(dpsCount.raf);
  const step = now => { const k = Math.max(0, Math.min(1, (now - t0) / dur)); jobs.forEach(j=>{ j.el.textContent = dpsN(j.from + (j.to - j.from) * ease(k)); }); if(k < 1) dpsCount.raf = requestAnimationFrame(step); };
  jobs.forEach(j=>{ j.el.textContent = dpsN(j.from); });
  dpsCount.raf = requestAnimationFrame(step);
}
let dpsWinner = '';
// Linien-Animation: 'draw' = neu einzeichnen (nur beim Champion-Wechsel), 'morph' = vom gezeigten zum neuen Verlauf gleiten; dpsSerShown = gerade gezeigte Werte
let dpsAnimChamp = '', dpsSerShown = null;
const dpsAtIdx = (r, t) => Math.min(r.tot.length - 1, Math.round(t / SIM_DPS_STEP));
// Schaden pro Sekunde: gleitendes Fenster (±2 s um den Zeitpunkt), damit einzelne Angriffe und Fähigkeiten nicht als Zacken stehen
const dpsRate = r => { const k = Math.round(2 / SIM_DPS_STEP), n = r.tot.length - 1;
  return r.tot.map((_, i)=>{ const a = Math.max(0, i - k), b = Math.min(n, i + k); return b > a ? (r.tot[b] - r.tot[a]) / ((b - a) * SIM_DPS_STEP) : 0; }); };
function dpsDraw(){
  $('#dpsMode').querySelectorAll('[data-dmode]').forEach(b=>b.classList.toggle('on', b.dataset.dmode===dps.mode));
  $('#dpsAtV').textContent = dps.at + ' s';
  const R = dps.res, chart = $('#dpsChart'), idle = !dps.champ || !R || !R.length;
  $('#dpsReset').disabled = !dps.champ && ['star', 'prof', 'n', 'at', 'mode', 'shred', 'sunder'].every(k=>dps[k]===DPS_IDLE[k]);
  chart.closest('.dps-res').classList.toggle('idle', idle);
  $('.dps-in').classList.toggle('need-champ', !dps.champ);   // ohne Champion pulsieren die Champions, sonst die leeren Item-Plätze
  if(idle){ cancelAnimationFrame(dpsDraw.raf); chart.innerHTML = dpsIdle(); $('#dpsTable').innerHTML = ''; $('#dpsWin').innerHTML = ''; dpsWinner = ''; dpsAnimChamp = ''; dpsSerShown = null; return; }
  // Zeichenfläche in echter Breite, damit die Beschriftung auf dem Handy lesbar bleibt
  const W = Math.round(Math.max(320, Math.min(640, chart.clientWidth || 640))), H = Math.round(W * (W < 480 ? 0.62 : 0.45)), L0 = 54, R0 = 14, T0 = 14, B0 = 30, w = W - L0 - R0, h = H - T0 - B0;
  const ser = R.map(r=>dps.mode==='dps' ? dpsRate(r) : r.tot);
  const max = Math.max(1, ...ser.map(s=>Math.max(...s)));
  const step = [50,100,200,250,500,1000,2000,2500,5000,10000,20000,25000,50000,100000].find(s=>max / s <= 5) || 200000, top = Math.ceil(max / step) * step;
  const X = t => L0 + t / dps.dur * w, Y = v => T0 + h - v / top * h;
  let g = '';
  for(let v = 0; v <= top + 1e-6; v += step) g += `<line x1="${L0}" x2="${W - R0}" y1="${Y(v)}" y2="${Y(v)}" class="dps-grid-l"/><text x="${L0 - 8}" y="${Y(v) + 4}" text-anchor="end">${dpsN(v)}</text>`;
  for(let t = 0; t <= dps.dur; t += 5) g += `<line x1="${X(t)}" x2="${X(t)}" y1="${T0}" y2="${T0 + h}" class="dps-grid-l v"/><text x="${X(t)}" y="${H - 10}" text-anchor="middle">${t} s</text>`;
  // Neuer Champion: die Linien zeichnen sich von links nach rechts ein. Andere Änderungen (Sterne, Items, Shred/Sunder, Ansicht …): die Linien
  // gleiten vom gerade gezeigten zum neuen Verlauf hoch bzw. runter (neue Builds wachsen von der Nulllinie). Regler und Fenstergröße zeichnen ohne Bewegung
  const still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const morph = dps.anim === 'morph' && !still && dpsSerShown;
  const from = morph ? ser.map((s, i)=>{ const o = dpsSerShown[i]; return o && o.length === s.length ? o : s.map(()=>0); }) : ser;
  const pts = (s, i) => s.map((v, k)=>`${X(R[i].t[k]).toFixed(1)},${Y(v).toFixed(1)}`).join(' ');
  const lines = from.map((s, i)=>`<polyline class="dps-ln" fill="none" stroke="${DPS_COL[i]}" stroke-width="2.6" stroke-linejoin="round" points="${pts(s, i)}"/>`).join('');
  const dots = from.map((s, i)=>`<circle class="dps-dot" cx="${X(dps.at)}" cy="${Y(s[dpsAtIdx(R[i], dps.at)])}" r="4.5" fill="${DPS_COL[i]}" stroke="#0d0d12" stroke-width="2"/>`).join('');
  cancelAnimationFrame(dpsDraw.raf);
  chart.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Schaden über die Zeit">${g}<line x1="${X(dps.at)}" x2="${X(dps.at)}" y1="${T0}" y2="${T0 + h}" class="dps-at-l"/>${lines}${dots}<g id="dpsHov"></g></svg><div class="dps-tip" id="dpsTip" hidden></div>`;
  chart.dataset.geo = JSON.stringify({W, L0, w, top, T0, h});
  dpsSerShown = ser;
  if(dps.anim === 'draw' && !still){
    chart.classList.add('drawing');
    chart.querySelectorAll('.dps-ln').forEach((pl, i)=>{ const len = pl.getTotalLength(); pl.style.strokeDasharray = len; pl.style.strokeDashoffset = len;
      pl.getBoundingClientRect(); pl.style.transition = `stroke-dashoffset .9s ${i * .12}s cubic-bezier(.4,0,.2,1)`; pl.style.strokeDashoffset = 0; });
    clearTimeout(dpsDraw.t); dpsDraw.t = setTimeout(()=>chart.classList.remove('drawing'), 900 + R.length * 120);
  } else if(morph){
    const pls = chart.querySelectorAll('.dps-ln'), cs = chart.querySelectorAll('.dps-dot'), t0 = performance.now(), dur = 650, ease = x => 1 - Math.pow(1 - x, 3);
    const stepM = now => { const k = Math.max(0, Math.min(1, (now - t0) / dur)), e = ease(k);
      const cur = ser.map((s, i)=>s.map((v, j)=>from[i][j] + (v - from[i][j]) * e));
      cur.forEach((s, i)=>{ pls[i].setAttribute('points', pts(s, i)); cs[i].setAttribute('cy', Y(s[dpsAtIdx(R[i], dps.at)])); });
      dpsSerShown = cur;   // wird die Bewegung unterbrochen, geht die nächste von hier weiter
      if(k < 1) dpsDraw.raf = requestAnimationFrame(stepM); };
    dpsDraw.raf = requestAnimationFrame(stepM);
  }
  dps.anim = false;
  // Tabelle: Schaden bis zur gewählten Sekunde, sortiert nach Build
  const vals = R.map(r=>r.tot[dpsAtIdx(r, dps.at)]), best = Math.max(...vals);
  // Gewinner groß über dem Diagramm: welcher Build vorne liegt und mit wie viel Abstand zum Zweiten
  const wi = vals.indexOf(best), second = Math.max(-Infinity, ...vals.filter((_, i)=>i !== wi)), si = vals.indexOf(second);
  const winKey = wi + ':' + dps.builds[wi].join(','), lead = R.length > 1 && second > 0 ? Math.round((best / second - 1) * 100) : null;
  $('#dpsWin').innerHTML = `<div class="dps-win${dpsWinner && dpsWinner !== winKey ? ' pop' : ''}" style="--bc:${DPS_COL[wi]}">
    <b class="dps-bn">${String.fromCharCode(65 + wi)}</b>
    <div><small>${R.length > 1 ? (lead === 0 ? 'Gleichauf vorne' : 'Bester Build') : 'Dein Build'}${dps.shred || dps.sunder ? ` · mit ${[dps.shred && 'Shred', dps.sunder && 'Sunder'].filter(Boolean).join(' & ')} aus dem Team` : ''}</small><span class="dps-wi">${dps.builds[wi].map(dpsItemImg).join('') || '<em>ohne Items</em>'}</span>
      ${lead ? `<p>+${lead} % mehr Schaden als Build ${String.fromCharCode(65 + si)}</p>` : ''}</div>
    <strong><b data-cnt="win" data-v="${Math.round(best)}">${dpsN(best)}</b><small>Schaden bis ${dps.at} s</small></strong></div>`;
  dpsWinner = winKey;
  const split = r => { const i = dpsAtIdx(r, dps.at), t = r.tot[i] || 1; return [r.ph[i]/t, r.mg[i]/t, r.tr[i]/t]; };
  $('#dpsTable').innerHTML = `<thead><tr><th>Build</th><th>Schaden bis ${dps.at} s</th><th>DPS</th><th>Aufteilung</th><th>Fähigkeiten</th><th>Gesamt ${dps.dur} s</th></tr></thead><tbody>${R.map((r, i)=>{
    const v = vals[i], sp = split(r), diff = best ? Math.round((v / best - 1) * 100) : 0, casts = r.casts * dps.at / dps.dur;
    return `<tr><td><span class="dps-tb" style="--bc:${DPS_COL[i]}"><b>${String.fromCharCode(65 + i)}</b>${dps.builds[i].map(dpsItemImg).join('') || '<small>ohne Items</small>'}</span></td>
      <td><b class="dps-big" data-cnt="b${i}" data-v="${Math.round(v)}">${dpsN(v)}</b>${v===best && R.length > 1 ? '<span class="dps-best">Bester</span>' : R.length > 1 ? `<small class="dps-minus">${diff} %</small>` : ''}</td>
      <td>${dpsN(v / dps.at)}</td>
      <td><div class="dps-split" title="Physisch ${Math.round(sp[0]*100)} % · Magisch ${Math.round(sp[1]*100)} % · Absolut ${Math.round(sp[2]*100)} %"><i class="ph" style="flex:${sp[0]}"></i><i class="mg" style="flex:${sp[1]}"></i><i class="tr" style="flex:${sp[2]}"></i></div></td>
      <td>${fmtNum(Math.round(casts * 10) / 10)}×</td>
      <td>${dpsN(r.tot[r.tot.length - 1])}</td></tr>`; }).join('')}</tbody>`;
  dpsCount($('.dps-res'));
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
  const key = ['rolldown','tierlist','drops','dps','augments'].includes(sub) ? sub : '';
  const views = [...document.querySelectorAll('#page-tools .tool-view')];
  if(!key || !(views.find(v=>!v.hidden) || {}).dataset.tool) slideDir = 0;   // Übersicht ↔ Tool ohne Wischen
  const to = views.find(v=>v.dataset.tool===key);
  slideViews(views, to);
  if(to) toolArtLoad(to);
  if(key==='rolldown') rdMount();
  if(key==='tierlist') tmRoute(a, b);
  if(key==='drops') drRender();
  if(key==='augments') agMount();
  if(key==='dps'){   // ?c=<champion> (z. B. von der Champion-Seite) wählt den Champion vor
    dpsMount();
    const q = qParam('c'), c = q && champBySlug[q];
    if(c && dps.champ !== c.n) dpsSetChamp(c.n);
  }
}
/* ================= AUGMENT-VORHERSAGE (/tools/tft-augment-vorhersage) ================= */
// „Deine Angaben“: die Augment-Stufen, die du schon gesehen hast (2-1, 3-2, 4-2). „Dein Ergebnis“: was als Nächstes kommt, Chance auf ein prismatisches Augment, wahrscheinlichste Verläufe.
// Gleiche Daten wie der Augment-Baum im Cheatsheet (CS.augments.seq); der kleine Baum in der Ergebnis-Box zeigt dieselbe Auswahl und lässt sich auch anklicken.
// Die Auswahl steht in der Adresse (?a=SG), damit man sie teilen kann
// Kopf der beiden Tool-Boxen (Gerüst .tio, für alle Tools gleich): Überschrift „Deine Angaben“ bzw. „Dein Ergebnis“, rechts Knöpfe, darunter ein kurzer Hinweis
const TIO_RESET_IC = '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>';
const tioReset = (attrs, label = L('Zurücksetzen', 'Reset')) => `<button type="button" class="tio-reset" ${attrs} title="${label}">${csSvg(TIO_RESET_IC, 2.2)}<span>${label}</span></button>`;
const tioHead = (out, right = '', hint = '') => `<div class="tio-top"><div class="tio-hd"><h2>${out ? L('Dein Ergebnis', 'Your result') : L('Deine Angaben', 'Your input')}</h2>${right}</div>${hint ? `<p class="tio-hint">${hint}</p>` : ''}</div>`;
const AG_ST = ['2-1', '3-2', '4-2'];
const ag = {k:''};
let agMounted = false;
const agSum = p => CS.augments.seq.filter(x=>x[0].startsWith(p)).reduce((s, x)=>s + x[1], 0);
const agName = l => L(CS_AUG[l][1], CS_AUG[l][2]);
const agHex = l => `<svg class="ag-hx atg-n atg-${l}" viewBox="0 0 24 24" aria-hidden="true"><polygon class="atg-h" points="12,1.5 21.1,6.75 21.1,17.25 12,22.5 2.9,17.25 2.9,6.75"/></svg>`;
const agPct = p => (p > 0 && p < 0.5 ? '<1' : Math.round(p)) + L(' %', '%');   // ganze Prozent – Nachkommastellen bringen hier nichts
// Augment-Rahmen in Silber, Gold und Prismatisch (eigene Grafiken von CrazYSlayt, assets/icons/tft/augment-frame-*.webp)
const AG_FR = {S:'silver', G:'gold', P:'prism'};
const agFrSrc = l => `assets/icons/tft/augment-frame-${AG_FR[l]}.webp`;
const agFr = (l, cls) => `<img class="${cls}" src="${agFrSrc(l)}" alt="" width="240" height="356">`;
const agLock = () => csSvg('<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>', 2);
// Symbol der aufklappbaren Baum-Box: Start und die drei Rahmen der ersten Stufe
const agTreeIcon = () => `<svg class="ag-ti" viewBox="0 0 66 50" aria-hidden="true"><path class="ag-ti-l" d="M33 17 13 25M33 17v8M33 17l20 8"/><polygon class="ag-ti-s" points="33,1 39.9,5 39.9,13 33,17 26.1,13 26.1,5"/>${'SGP'.split('').map((l, i)=>`<image href="${agFrSrc(l)}" x="${5 + i * 20}" y="25" width="16" height="24"/>`).join('')}</svg>`;
// Verteilung der Stufe an Position i (0 = 2-1), wenn die bisherigen Augments k sind
const agDist = (k, i) => { const all = CS.augments.seq.filter(x=>x[0].startsWith(k)), w = all.reduce((s, x)=>s + x[1], 0);
  return 'SGP'.split('').map(l=>[l, w ? all.filter(x=>x[0][i]===l).reduce((s, x)=>s + x[1], 0) / w * 100 : 0]); };
// Deine Angaben: pro Stufe drei Augment-Rahmen. Die gerade fällige Stufe pulsiert leicht, spätere Stufen (und Stufen, die nach deinen Augments nicht vorkommen) sind mit Schloss gesperrt
function agInput(){
  const k = ag.k;
  return `<div class="tio-hd"><h2>${L('Deine Angaben', 'Your input')}</h2>${tioReset(`id="agReset"${k ? '' : ' disabled'}`)}</div>
    <p class="tio-hint">${L('Wähl jedes Augment, sobald du es siehst.', 'Pick each augment as soon as you see it.')}</p>
    <div class="ag-rows">${AG_ST.map((st, i)=>`<div class="ag-row ${i < k.length ? 'done' : i === k.length ? 'cur' : 'later'}" role="group" aria-label="${i + 1}. Augment (${st})"><span class="ag-st">${st}</span>
      <div class="ag-opts">${'SGP'.split('').map(l=>{ const ok = i <= k.length && agSum(k.slice(0, i) + l) > 0, on = k[i] === l;
        return `<button type="button" class="ag-opt ${CS_AUG[l][0]}${on ? ' on' : ''}${ok ? '' : ' lock'}" data-i="${i}" data-l="${l}"${ok ? ` aria-pressed="${on}"${on ? ` title="${L('Nochmal klicken nimmt die Auswahl zurück', 'Click again to undo')}"` : ''}` : ` disabled title="${i > k.length ? L('Erst das Augment davor wählen', 'Pick the augment before first') : L('Kommt nach deinen bisherigen Augments nicht vor', 'Does not occur after your previous augments')}"`}><span class="ag-cbg"></span>${agFr(l, 'ag-fr')}<span class="ag-cin">${ok ? agHex(l) : agLock()}<b>${agName(l)}</b></span></button>`; }).join('')}</div></div>`).join('')}</div>`;
}
// Dein Ergebnis: oben die Chance auf ein prismatisches Augment, darunter immer alle drei Augments. Offene zeigen die Chancen nach deinen bisherigen Augments,
// gewählte bleiben stehen: deine Wahl ist hervorgehoben (mit der Chance, die sie vorher hatte), die anderen Stufen treten zurück
// Bewegung im Ergebnis: Balken und Zahlen laufen vom zuletzt gezeigten zum neuen Wert (agShown je Schlüssel), die neue Wahl blitzt kurz auf
const agShown = {};
let agLastK = null;
const agWas = (key, v) => agShown[key] != null ? agShown[key] : v;
function agAnim(root){
  const still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const bars = [...root.querySelectorAll('[data-p]')];
  const nums = [...root.querySelectorAll('[data-agk]')].map(el=>{ const key = el.dataset.agk, to = +el.dataset.agv, from = agWas(key, to); agShown[key] = to; return {el, from, to}; });
  if(still){ bars.forEach(el=>el.style.setProperty('--p', el.dataset.p + '%')); nums.forEach(j=>{ j.el.textContent = agPct(j.to); }); return; }
  requestAnimationFrame(()=>requestAnimationFrame(()=>bars.forEach(el=>el.style.setProperty('--p', el.dataset.p + '%'))));
  const run = nums.filter(j=>j.from !== j.to); if(!run.length) return;
  const t0 = performance.now(), dur = 650, ease = x => 1 - Math.pow(1 - x, 3);
  cancelAnimationFrame(agAnim.raf);
  const step = now => { const k = Math.max(0, Math.min(1, (now - t0) / dur));
    run.forEach(j=>{ j.el.textContent = k < 1 ? Math.round(j.from + (j.to - j.from) * ease(k)) + L(' %', '%') : agPct(j.to); });
    if(k < 1) agAnim.raf = requestAnimationFrame(step); };
  agAnim.raf = requestAnimationFrame(step);
}
// Leerlauf (eigene Grafik): die drei Karten für 2-1 schweben nebeneinander, die wahrscheinlichste ist größer und leuchtet; darunter die Chancen
function agIdle(){
  const dist = agDist('', 0), top = Math.max(...dist.map(d=>d[1])), W = agSum(''), seq = CS.augments.seq;
  const prism = seq.filter(x=>x[0].includes('P')).reduce((s, x)=>s + x[1], 0) / W * 100;
  dist.forEach(([l])=>{ if(agShown['d0' + l] == null) agShown['d0' + l] = 0; });   // beim ersten Öffnen zählen die Chancen von 0 hoch
  agShown.kpi = prism;   // die erste Wahl lässt die Prismatisch-Chance von hier aus laufen
  return `<div class="tio-hd"><h2>${L('Dein Ergebnis', 'Your result')}</h2></div>
    <div class="ag-idle">
      <span class="dr-ready">${L('Bereit', 'Ready')}</span>
      <h3>${L('Was kommt auf 2-1?', 'What comes on 2-1?')}</h3>
      <div class="ag-icards">${dist.map(([l, p], i)=>`<div class="ag-ic ${CS_AUG[l][0]}${p === top ? ' top' : ''}" style="--i:${i}">
        <div class="ag-icard"><span class="ag-cbg"></span>${agFr(l, 'ag-fr')}<span class="ag-cin">${agHex(l)}<b>${agName(l)}</b></span></div>
        <strong data-agk="d0${l}" data-agv="${p}">${agPct(agWas('d0' + l, 0))}</strong></div>`).join('')}</div>
      <p>${L('Wähl unter „Deine Angaben“ dein Augment auf 2-1 – dann sage ich dir, was auf 3-2 und 4-2 kommt.', 'Pick your 2-1 augment under “Your input” – then I’ll tell you what comes on 3-2 and 4-2.')}
        <span>${L(`In <b>${agPct(prism)}</b> aller Partien gibt es mindestens ein prismatisches Augment.`, `<b>${agPct(prism)}</b> of all games have at least one prismatic augment.`)}</span></p>
    </div>`;
}
function agOutput(){
  const k = ag.k, n = k.length, W = agSum(''), wk = agSum(k), seq = CS.augments.seq;
  if(!n) return agIdle();
  const prism = k.includes('P') ? 100 : seq.filter(x=>x[0].startsWith(k) && x[0].includes('P')).reduce((s, x)=>s + x[1], 0) / wk * 100;
  const check = csSvg('<path d="m5 12.5 4.5 4.5L19 7.5"/>', 3);
  const fresh = agLastK !== null && k.length > agLastK.length && k.startsWith(agLastK);   // gerade ein Augment dazugewählt
  let main = `<div class="ag-pg n3" style="--n:3">${AG_ST.map((st, i)=>{ const dist = agDist(k.slice(0, Math.min(i, n)), i), top = Math.max(...dist.map(d=>d[1])), done = i < n;
    return `<div class="ag-pb${done ? ' done' : i === n ? ' next' : ''}${fresh && i === n ? ' wake' : ''}"><h3><span class="ag-chip">${done ? check : ''}${st}</span>${i + 1}. Augment</h3>
      ${dist.map(([l, p])=>{ const key = `d${i}${l}`, mine = done && k[i] === l;
        return `<div class="ag-pi ${CS_AUG[l][0]}${done ? (mine ? ' pick' : ' off') : p === top && p > 0 ? ' top' : ''}${mine && fresh && i === n - 1 ? ' pop' : ''}" style="--p:${agWas(key, p).toFixed(1)}%" data-p="${p.toFixed(1)}"${mine ? ` title="${L('Deine Wahl', 'Your pick')}"` : ''}>${agHex(l)}<span>${agName(l)}</span><b data-agk="${key}" data-agv="${p}">${agPct(agWas(key, p))}</b></div>`; }).join('')}</div>`; }).join('')}</div>`;
  if(n === 3){ const rank = [...seq].sort((a, b)=>b[1] - a[1]).findIndex(x=>x[0] === k) + 1;
    main += `<div class="ag-sec"><h3>${L('Deine Reihenfolge', 'Your order')}</h3><div class="ag-done"><span class="ag-path">${k.split('').map(agHex).join('<i></i>')}</span>
      <p>${L(`Kommt in <b>${agPct(wk / W * 100)}</b> aller Partien vor – Platz ${rank} von ${seq.length} Reihenfolgen.`, `Happens in <b>${agPct(wk / W * 100)}</b> of all games – rank ${rank} of ${seq.length} orders.`)}</p></div></div>`; }
  const gotP = k.includes('P'), gotNow = gotP && fresh && k[n - 1] === 'P';
  const kpi = `<div class="ag-kpi${gotP ? ' got' : ''}${gotNow ? ' pop' : ''}"><span>${agHex('P')}</span><div><small>${L('Mindestens ein prismatisches Augment in dieser Partie', 'At least one prismatic this game')}</small>
    <b${gotP ? '' : ` data-agk="kpi" data-agv="${prism}"`}>${gotP ? L('Hast du schon', 'Already got one') : agPct(agWas('kpi', prism))}</b></div></div>`;
  const paths = n < 3 ? seq.filter(x=>x[0].startsWith(k)).sort((a, b)=>b[1] - a[1]).slice(0, 4) : [];
  const pathList = paths.length ? `<div class="ag-sec ag-psec"><h3>${L('Wahrscheinlichste Verläufe', 'Most likely orders')}</h3><div class="ag-paths">${paths.map(([s, w])=>`<div class="ag-pr"><span class="ag-path">${s.split('').map((l, i)=>`<span class="${i < n ? 'kn' : ''}">${agHex(l)}</span>`).join('<i></i>')}</span><b>${agPct(w / wk * 100)}</b></div>`).join('')}</div></div>` : '';
  return `<div class="tio-hd"><h2>${L('Dein Ergebnis', 'Your result')}</h2></div>
    <p class="tio-hint">${n ? L('Nach deinen Augments', 'Based on your augments') + ' ' + k.split('').map((l, i)=>`<b class="ag-t ${CS_AUG[l][0]}">${AG_ST[i]} ${agName(l)}</b>`).join(' · ') : L('Noch nichts eingegeben – so verteilen sich die Stufen in allen Partien.', 'Nothing entered yet – this is how the tiers spread across all games.')}</p>
    ${kpi}${main}${pathList}`;
}
function agUpdate(syncTree=true){
  const app = $('#agApp'); if(!app) return;
  app.querySelector('.tio-in').innerHTML = agInput();
  app.querySelector('.ag-ob').innerHTML = agOutput();
  agAnim(app.querySelector('.ag-ob')); agLastK = ag.k;
  const svg = app.querySelector('svg.atg');
  if(svg && syncTree){ svg.dataset.sel = ag.k; svg.dataset.hist = JSON.stringify(ag.k.split('').map((_, i)=>ag.k.slice(0, i))); atgMark(svg, ag.k); }   // Verlauf wie nach Klicks im Baum
  history.replaceState(history.state, '', location.pathname + (ag.k ? '?a=' + ag.k : '') + location.hash);
}
function agMount(){
  const q = (qParam('a') || '').toUpperCase();
  if(/^[SGP]{1,3}$/.test(q) && agSum(q) > 0) ag.k = q;
  const app = $('#agApp'); if(!app) return;
  if(!agMounted){
    agMounted = true;
    if(!CS.augments){ app.innerHTML = ornnSays(L(`Für Set ${TFT_DATA.set} fehlen mir noch die Augment-Chancen.`, `I'm still missing the augment odds for Set ${TFT_DATA.set}.`)); return; }
    const {tree, legend} = atgTreeHTML();
    // Der Baum steckt zugeklappt in einer Box (Symbol links, Pfeil rechts); Klicks darin wählen die Augments wie die Karten links
    app.innerHTML = `<div class="tio"><section class="card tio-in" aria-label="${L('Deine Angaben', 'Your input')}"></section><section class="card tio-out" aria-label="${L('Dein Ergebnis', 'Your result')}"><div class="ag-ob" aria-live="polite"></div>
      <details class="ag-tsec"><summary>${agTreeIcon()}<span class="ag-tt"><b>${L('Augment-Baum', 'Augment tree')}</b><small>${L('Alle Pfade und ihre Chancen im Überblick', 'Every path and its odds at a glance')}</small></span>${csSvg('<path d="m6 9 6 6 6-6"/>', 2.4)}</summary>
      <div class="ag-tb">${legend}${tree}</div></details></section></div>`;
    app.addEventListener('click', e=>{
      const b = e.target.closest('.ag-opt'); if(b && !b.disabled){ const i = +b.dataset.i, l = b.dataset.l; ag.k = ag.k[i] === l ? ag.k.slice(0, i) : ag.k.slice(0, i) + l; agUpdate(); return; }
      if(e.target.closest('#agReset')){ ag.k = ''; agUpdate(); }
    });
    app.addEventListener('atgsel', e=>{ ag.k = e.detail || ''; agUpdate(false); });   // Klick im Baum
  }
  agUpdate();
}
let rdMounted = false;
function rdMount(){
  if(rdMounted) return; rdMounted = true;
  const app = $('#rdApp');
  if(!SHOP){ app.innerHTML = ornnSays(`Für Set ${TFT_DATA.set} fehlen mir noch die Shop-Chancen. Sobald sie feststehen, schmiede ich den Rechner nach.`); return; }
  app.innerHTML = `<div class="rd">
    <section class="card rd-in tio-in" aria-label="${L('Deine Angaben', 'Your input')}">
      ${tioHead(false, `<div class="tio-seg" id="rdMode" role="group" aria-label="${L('Ansicht', 'View')}"><button type="button" data-rdmode="easy" title="${L('Vier kurze Fragen', 'Four quick questions')}">${L('Einfach', 'Simple')}</button><button type="button" data-rdmode="pro" title="${L('Pool genau eingeben und Leveln vergleichen', 'Enter the pool exactly and compare levelling')}">${L('Detailliert', 'Detailed')}</button></div>${tioReset('id="rdReset"')}`,
        L('Beantworte vier kurze Fragen – das Ergebnis rechnet sofort mit.', 'Answer four quick questions – the result updates instantly.'))}
      <section><h3 class="rd-h"><b>1</b> ${L('Was kostet deine Unit?', 'What does your unit cost?')}</h3>
        <div class="rd-costs rd-cost5" id="rdCosts">${[1,2,3,4,5].map(c=>`<button type="button" class="rd-cost cb c${c}" data-cost="${c}">${c} Gold<span></span></button>`).join('')}</div></section>
      <section><h3 class="rd-h"><b>2</b> ${L('Dein Ziel', 'Your goal')}</h3>
        <div class="rd-gh">
          <div class="rd-goal" id="rdGoal"><button type="button" data-goal="2"><b class="s2">★★</b><small>${L('3 Kopien', '3 copies')}</small></button><button type="button" data-goal="3"><b class="s3">★★★</b><small>${L('9 Kopien', '9 copies')}</small></button></div>
          <div class="rd-have"><span>${L('Meine Kopien', 'My copies')}</span><div class="rd-step"><button type="button" data-hstep="-1" aria-label="${L('Eine Kopie weniger', 'One copy less')}">−</button><b id="rdHaveN" aria-live="polite">0</b><button type="button" data-hstep="1" aria-label="${L('Eine Kopie mehr', 'One copy more')}">+</button></div></div>
        </div>
        <p class="rd-hint" id="rdHaveTxt"></p></section>
      <section><h3 class="rd-h"><b>3</b> ${L('Spielt noch jemand diese Unit?', 'Is anyone else playing this unit?')}</h3>
        <div class="rd-seg rd-easy" id="rdContest">${[['Niemand', 'Nobody'], ['1 Gegner', '1 opponent'], ['2 oder mehr', '2 or more']].map(([d, e], i)=>`<button type="button" data-contest="${i}">${L(d, e)}</button>`).join('')}</div>
        <div class="rd-nums rd-pro">
          <label class="rd-n"><span>${L('Kopien bei Gegnern', 'Copies held by opponents')}</span><input class="input" type="number" id="rdOpp" min="0" value="${rd.opp}"><small>${L('auf allen gegnerischen Boards und Bänken', 'on all enemy boards and benches')}</small></label>
          <label class="rd-n"><span>${L('Andere', 'Other')} <span id="rdCostLbl"></span>${L('-Kosten draußen', '-costs out')}</span><input class="input" type="number" id="rdOther" min="0" value="${rd.other}"><small>${L('alle anderen Units dieser Kosten auf Boards und Bänken', 'all other units of this cost on boards and benches')}</small></label>
        </div></section>
      <section><h3 class="rd-h"><b>4</b> ${L('Dein Level und Gold', 'Your level and gold')}</h3>
        <div class="rd-lvls" id="rdLvls"></div>
        <p class="rd-hint" id="rdLvlTxt"></p>
        <div class="rd-odds rd-pro" id="rdOdds"></div>
        <label class="rd-f"><span>${L('Gold zum Ausgeben', 'Gold to spend')} <small>${L('(Rollen und Kaufen)', '(rolling and buying)')}</small></span><b id="rdGoldV"></b><input type="range" id="rdGold" min="0" max="${RD_GOLD_MAX}" step="1" value="${rd.gold}"></label>
        <div class="rd-ticks" aria-hidden="true">${Array.from({length:RD_GOLD_MAX / 10 + 1}, (_, i)=>`<span style="--v:${i * 10 / RD_GOLD_MAX}">${i * 10}</span>`).join('')}</div>
        <label class="rd-n rd-pro"><span>${L('XP bis zum nächsten Level', 'XP to the next level')} <small>(optional)</small></span><input class="input" type="number" id="rdXp" min="0" placeholder="${L('z. B. 28', 'e.g. 28')}"><small>${L('Dann vergleicht der Rechner: jetzt rollen oder erst leveln und dann rollen?', 'Then the calculator compares: roll now or level first and then roll?')}</small></label></section>
    </section>
    <section class="card rd-res tio-out" aria-label="${L('Dein Ergebnis', 'Your result')}">${tioHead(true)}<div id="rdRes" aria-live="polite"></div></section>
  </div>
  <div class="card rd-table-card"><h3 class="rd-h">Shop-Chancen Set ${TFT_DATA.set}</h3><div class="rd-table-wrap"><table class="rd-table" id="rdTable"></table></div>
    <p class="note">Chance pro Shop-Slot nach Level. Pool: ${SHOP.bag.map((b,i)=>`${i+1}-Kosten ${b} Kopien × ${SHOP_DISTINCT[i]} Champions`).join(' · ')}.</p></div>`;
  const on = (sel, ev, f) => $(sel).addEventListener(ev, f), num = e => Math.max(0, parseInt(e.target.value) || 0);
  on('#rdCosts', 'click', e=>{ const b = e.target.closest('[data-cost]'); if(!b) return; const c = +b.dataset.cost;   // Kostenstufe wählt gleich das übliche Level mit
    if(c !== rd.cost) Object.assign(rd, RD_UNIT_NEW, {lvl:RD_LVL[c-1]}); rd.cost = c; rdUpdate(); });
  on('.rd-step', 'click', e=>{ const b = e.target.closest('[data-hstep]'); if(!b || b.disabled) return; rd.have += +b.dataset.hstep; rdUpdate(); });   // Kopien, die du schon hast
  on('#rdGoal', 'click', e=>{ const b = e.target.closest('[data-goal]'); if(!b || b.disabled) return; rd.goal = +b.dataset.goal; rdUpdate(); });
  on('#rdContest', 'click', e=>{ const b = e.target.closest('[data-contest]'); if(!b) return; rd.contest = +b.dataset.contest; rdUpdate(); });
  on('#rdLvls', 'click', e=>{ const b = e.target.closest('[data-lvl]'); if(!b) return; rd.lvl = +b.dataset.lvl; rdUpdate(); });
  on('#rdGold', 'input', e=>{ rd.gold = +e.target.value; rdUpdate(); });
  on('#rdOpp', 'input', e=>{ rd.opp = num(e); rdUpdate(); });
  on('#rdOther', 'input', e=>{ rd.other = e.target.value === '' ? '' : num(e); rdUpdate(); });   // leer = Richtwert
  on('#rdXp', 'input', e=>{ rd.xp = e.target.value; rdUpdate(); });
  on('#rdMode', 'click', e=>{ const b = e.target.closest('[data-rdmode]'); if(!b) return; rdMode = b.dataset.rdmode; rdMoreOpen = rdMode === 'pro';
    try { localStorage.setItem('tftfreaks_rd_mode', rdMode); } catch(err){} rdUpdate(); });
  on('#rdReset', 'click', ()=>{ Object.assign(rd, RD_DEF); $('#rdGold').value = rd.gold; $('#rdXp').value = rd.xp; rdUpdate(); });
  $('#rdRes').addEventListener('toggle', e=>{ if(e.target.matches && e.target.matches('.rd-more')){ rdMoreOpen = e.target.open; rdStick(); } }, true);   // „Details“ bleibt beim Neurechnen offen bzw. zu
  window.addEventListener('resize', rdStick);
  rdUpdate();
}
// Ergebnis läuft nur mit, wenn es ganz auf den Bildschirm passt (sonst wäre sein unteres Ende erst am Schluss erreichbar)
function rdStick(){ const s = document.querySelector('.rd-res'); if(s) s.classList.toggle('tall', s.offsetHeight > innerHeight - 96); }
function rdUpdate(){
  const idle = !rd.cost, ci = (rd.cost || 3) - 1;   // Leerlauf: noch keine Kostenstufe (ci nur, damit die Felder gültige Grenzen haben)
  const bag = SHOP.bag[ci], maxOther = bag * (SHOP_DISTINCT[ci] - 1);
  rd.have = Math.max(0, Math.min(8, rd.have)); if(rd.have >= 3) rd.goal = 3;   // ★★ hast du dann schon
  rd.opp = Math.min(rd.opp, bag - rd.have); if(rd.other !== '') rd.other = Math.min(rd.other, maxOther);
  const oppEl = $('#rdOpp'), othEl = $('#rdOther');   // Zahlenfelder zeigen den Stand (außer während man tippt)
  oppEl.max = bag - rd.have; othEl.max = maxOther;
  if(document.activeElement !== oppEl || +oppEl.value > rd.opp) oppEl.value = rd.opp;
  if(document.activeElement !== othEl || (rd.other !== '' && +othEl.value > rd.other)) othEl.value = rd.other;
  othEl.placeholder = idle ? '' : L(`leer = Richtwert (≈ ${rdOtherEst(rd.lvl, rd.cost)})`, `empty = guideline (≈ ${rdOtherEst(rd.lvl, rd.cost)})`);
  $('#rdContest').querySelectorAll('[data-contest]').forEach(b=>{ const i = +b.dataset.contest, n = RD_OPP[i][ci]; b.title = idle ? '' : i ? L(`geschätzt ${n} Kopien bei Gegnern`, `estimated ${n} copies with opponents`) : L('alle Kopien im Pool', 'all copies in the pool'); });
  $('#rdCostLbl').textContent = idle ? 'X' : rd.cost;
  $('.rd-in').classList.toggle('pro', rdMode === 'pro');
  $('#rdMode').querySelectorAll('[data-rdmode]').forEach(b=>b.classList.toggle('on', b.dataset.rdmode === rdMode));
  $('#rdReset').disabled = Object.keys(RD_DEF).every(k=>rd[k]===RD_DEF[k]);
  $('#rdGoldV').textContent = rd.gold + ' Gold';
  $('#rdCosts').querySelectorAll('[data-cost]').forEach(b=>b.classList.toggle('on', +b.dataset.cost === rd.cost));
  // Ziel und Kopien: 3 Kopien = ★★, 9 Kopien = ★★★ – ab 3 Kopien hast du ★★ schon, dann geht es um ★★★
  const goalN = rdGoalN(rd.goal), rest = goalN - rd.have, stars = rd.goal === 3 ? '★★★' : '★★';
  $('#rdHaveN').textContent = rd.have;
  $('.rd-step').querySelectorAll('[data-hstep]').forEach(b=>{ b.disabled = +b.dataset.hstep < 0 ? rd.have <= 0 : rd.have >= 8; });
  $('#rdHaveTxt').innerHTML = rd.have >= 3 ? L(`Du hast schon ★★ – noch <b>${rest} ${rest === 1 ? 'Kopie' : 'Kopien'}</b> bis ★★★.`, `You already have ★★ – <b>${rest} more ${rest === 1 ? 'copy' : 'copies'}</b> to ★★★.`)
    : L(`Noch <b>${rest} ${rest === 1 ? 'Kopie' : 'Kopien'}</b> bis ${stars}.`, `<b>${rest} more ${rest === 1 ? 'copy' : 'copies'}</b> to ${stars}.`);
  $('#rdGoal').querySelectorAll('[data-goal]').forEach(b=>{ const g = +b.dataset.goal; b.classList.toggle('on', g === rd.goal); b.disabled = g === 2 && rd.have >= 3; b.title = b.disabled ? L('★★ hast du schon', 'You already have ★★') : ''; });
  $('#rdContest').querySelectorAll('[data-contest]').forEach(b=>b.classList.toggle('on', +b.dataset.contest === rd.contest));
  // Level als Knöpfe mit der Shop-Chance der Kostenstufe; der gelbe Punkt markiert das übliche Level
  const oc = l => SHOP.odds[l-1][ci], typ = idle ? 0 : RD_LVL[ci];
  $('#rdLvls').innerHTML = SHOP.odds.map((o, i)=>{ const l = i + 1, p = idle ? null : o[ci]; if(l < 3) return '';
    return `<button type="button" class="rd-lv${l === rd.lvl ? ' on' : ''}${p === 0 ? ' off' : ''}${l === typ ? ' typ' : ''}" data-lvl="${l}" aria-pressed="${l === rd.lvl}"${idle ? '' : ` title="${L(`Level ${l}: ${p} % pro Shop-Slot für ${rd.cost}-Kosten`, `Level ${l}: ${p}% per shop slot for ${rd.cost}-costs`)}"`}><b>${l}</b><small>${p ? p + L(' %', '%') : '–'}</small></button>`; }).join('');
  $('#rdLvlTxt').innerHTML = idle ? L('Wähl oben die Kosten – dann siehst du die Shop-Chance pro Level.', 'Pick the cost above – then you see the shop chance per level.')
    : `<i class="rd-dot"></i>${L(`Üblich für ${rd.cost}-Kosten: Level ${typ}`, `Usual for ${rd.cost}-costs: level ${typ}`)}`
    + (rd.lvl < typ && oc(typ) > oc(rd.lvl) ? L(` – auf Level ${rd.lvl} kommen sie seltener (${oc(rd.lvl)} % statt ${oc(typ)} %).`, ` – on level ${rd.lvl} they show up less often (${oc(rd.lvl)}% instead of ${oc(typ)}%).`) : '');
  const odds = SHOP.odds[rd.lvl-1];
  $('#rdOdds').innerHTML = odds.map((o,i)=>o ? `<span class="c${i+1}${i+1===rd.cost?' on':''}" style="flex:${o}" title="${i+1}-Kosten: ${o} %">${o >= 6 ? o + ' %' : ''}</span>` : '').join('');
  $('#rdTable').innerHTML = `<thead><tr><th>Level</th>${[1,2,3,4,5].map(c=>`<th class="${c===rd.cost?'on':''}"><i class="cdot c${c}"></i>${c}</th>`).join('')}</tr></thead><tbody>${SHOP.odds.map((r,i)=>`<tr class="${i+1===rd.lvl?'on':''}"><td>${i+1}</td>${r.map((o,c)=>`<td class="${c+1===rd.cost?'on':''}">${o ? o + ' %' : '–'}</td>`).join('')}</tr>`).join('')}</tbody>`;

  // Ergebnis: Ampel und „x von 100 Spielen“, darunter ein Gold-Tipp; Balken und Gold-Tabelle stecken in „Details“
  const res = $('#rdRes');
  if(idle){   // Leerlauf: leerer Ring, Aufforderung – die erste Rechnung zählt dann von 0 hoch
    res.innerHTML = `<div class="rd-hero idle"><div class="rd-ring" style="--p:0"><i class="rd-knob"></i><b>–</b><small>${L('von 100', 'of 100')}</small></div>
      <div><span class="rd-amp">${L('Bereit', 'Ready')}</span><h3>${L('Wähl deine Unit', 'Pick your unit')}</h3>
        <p>${L('Sag mir unter „Deine Angaben“, was deine Unit kostet – dann rechne ich aus, wie oft du sie triffst.', 'Tell me under “Your input” what your unit costs – then I’ll work out how often you hit it.')}</p></div></div>`;
    Object.assign(rdShown, {p:0, cat:''}); rdStick(); return;
  }
  const x = rdCtx(), who = L(`deine ${rd.cost}-Kosten-Unit`, `your ${rd.cost}-cost unit`);
  if(x.left < x.need){ res.innerHTML = viSays(L(`Für ${who} ${stars} brauchst du noch ${x.need} ${x.need === 1 ? 'Kopie' : 'Kopien'} – im Pool sind aber nur noch ${x.left}. Das klappt so nicht mehr.`, `For ${who} ${stars} you still need ${x.need} ${x.need === 1 ? 'copy' : 'copies'} – but only ${x.left} are left in the pool. That won't work anymore.`)); rdStick(); return; }
  if(!odds[rd.cost-1]){ res.innerHTML = viSays(L(`Auf Level ${rd.lvl} tauchen keine ${rd.cost}-Kosten-Units im Shop auf. Erst leveln!`, `No ${rd.cost}-cost units show up in the shop on level ${rd.lvl}. Level up first!`)); rdStick(); return; }

  const dist = rdDist(rd.lvl, rd.cost, x.out, x.other, rd.gold);
  const P = rdAtLeast(dist, x.need), exp = dist.reduce((a, v, k)=>a + v * k, 0);
  // Vergleich (nur „Genau“): erst leveln (4 Gold = 4 XP), dann mit dem Rest rollen
  const xp = rdMode === 'pro' ? parseInt(rd.xp) : 0, lvlGold = xp > 0 ? Math.ceil(xp / 4) * 4 : 0;
  let cmp = null, cmpNote = '';
  if(xp > 0 && rd.lvl < SHOP.odds.length){
    if(rd.gold >= lvlGold) cmp = rdDist(rd.lvl + 1, rd.cost, x.out, x.other, rd.gold - lvlGold);
    else cmpNote = L(`Zum Leveln brauchst du ${lvlGold} Gold – du hast nur ${rd.gold}.`, `Levelling needs ${lvlGold} gold – you only have ${rd.gold}.`);
  }
  const pRoll = 1 - Math.pow(1 - rdSlotP(rd.lvl, rd.cost, x.out, x.other, 0), 5);
  const n = Math.round(P * 100), amp = P >= .7 ? ['g', 'Gute Chance', 'Good chance'] : P >= .4 ? ['y', 'Wackelig', 'Shaky'] : ['r', 'Eher nicht', 'Unlikely'];
  const nTxt = P >= .995 ? L('fast jedem Spiel', 'almost every game') : P < .005 ? L('weniger als 1 von 100 Spielen', 'fewer than 1 of 100 games') : L(`${n} von 100 Spielen`, `${n} of 100 games`);
  const g80 = rdGoldFor(0.8, x);
  const tip = g80 === null ? L('Selbst mit sehr viel Gold wird das schwer – vielleicht lohnt sich eine andere Unit.', 'Even with lots of gold this is hard – another unit might be the better pick.')
    : g80 > 100 && P < .8 ? L(`Mehr Sicherheit: Mit rund <b>${g80} Gold</b> wären es 8 von 10 Spielen. Das klappt nur über mehrere Runden – halte 50 Gold und roll jede Runde, was darüber liegt (Slow Roll).`, `More safety: with about <b>${g80} gold</b> it would be 8 of 10 games. That only works over several rounds – keep 50 gold and roll whatever is above it each round (slow roll).`)
    : P >= .8 ? (g80 < rd.gold ? L(`Das reicht: Schon mit <b>${g80} Gold</b> wären es 8 von 10 Spielen.`, `That's enough: with just <b>${g80} gold</b> it would be 8 of 10 games.`) : L('Das reicht: Du triffst in mindestens 8 von 10 Spielen.', "That's enough: you hit in at least 8 of 10 games."))
    : L(`Mehr Sicherheit: Mit <b>${g80} Gold</b> (${g80 - rd.gold} mehr) wären es 8 von 10 Spielen.`, `More safety: with <b>${g80} gold</b> (${g80 - rd.gold} more) it would be 8 of 10 games.`);
  const need = [[0.5, '5 von 10', '5 of 10'], [0.8, '8 von 10', '8 of 10'], [0.95, '19 von 20', '19 of 20']].map(([q, de, en])=>[L(de, en), rdGoldFor(q, x)]);
  const bars = Array.from({length:RD_MAXK}, (_, i)=>{
    const k = i + 1, a = rdAtLeast(dist, k), b = cmp ? rdAtLeast(cmp, k) : null;
    return `<div class="rd-bar${k === x.need ? ' on' : ''}" title="${L(`Mindestens ${k}×`, `At least ${k}×`)}: ${rdPct(a)}${b !== null ? L(' · nach Leveln: ', ' · after levelling: ') + rdPct(b) : ''}">
      <div class="rd-cols"><span class="rd-fill" style="height:${a * 100}%"></span>${b !== null ? `<span class="rd-fill alt" style="height:${b * 100}%"></span>` : ''}</div>
      <b>${rdPct(a)}</b><small>${k}×</small></div>`;
  }).join('');
  let verdict = '';
  if(cmp){
    const Q = rdAtLeast(cmp, x.need), diff = Math.round((Q - P) * 100);
    verdict = `<div class="rd-cmp ${diff > 0 ? 'up' : 'down'}"><b>${diff > 0 ? L('Erst leveln lohnt sich', 'Levelling first pays off') : diff < 0 ? L('Lieber jetzt rollen', 'Better roll now') : L('Kein Unterschied', 'No difference')}</b>
      <span>${L(`Auf Level ${rd.lvl + 1} (${lvlGold} Gold fürs Leveln, ${rd.gold - lvlGold} Gold zum Rollen): ${rdPct(Q)} statt ${rdPct(P)}`, `On level ${rd.lvl + 1} (${lvlGold} gold for levelling, ${rd.gold - lvlGold} gold for rolling): ${rdPct(Q)} instead of ${rdPct(P)}`)}${diff ? ` (${diff > 0 ? '+' : '−'}${Math.abs(diff)} ${L('Prozentpunkte', 'percentage points')})` : ''}.</span></div>`;
  } else if(cmpNote) verdict = `<div class="rd-cmp">${esc(cmpNote)}</div>`;

  res.innerHTML = `
    <div class="rd-hero ${amp[0]}" style="--rc:${rdColor(rdShown.p)}">
      <div class="rd-ring" style="--p:${rdShown.p.toFixed(2)}"><i class="rd-knob"></i><b>${Math.round(rdShown.p)}</b><small>${L('von 100', 'of 100')}</small></div>
      <div><span class="rd-amp${rdShown.cat && rdShown.cat !== amp[0] ? ' pop' : ''}">${L(amp[1], amp[2])}</span>
        <h3>${L(`${rd.cost}-Kosten-Unit`, `${rd.cost}-cost unit`)} <span class="rd-st s${rd.goal}">${stars}</span></h3>
        <p>${L(`Mit ${rd.gold} Gold auf Level ${rd.lvl} bringst du ${who} in <b>${nTxt}</b> auf ${stars}.`, `With ${rd.gold} gold on level ${rd.lvl} you get ${who} to ${stars} in <b>${nTxt}</b>.`)}</p></div>
    </div>
    <p class="rd-gtip">${tip}</p>
    ${verdict}
    <details class="rd-more"${rdMoreOpen ? ' open' : ''}><summary>${L('Details: Chance pro Kopie und Gold-Bedarf', 'Details: odds per copy and gold needed')}</summary>
      <p class="rd-dl">${L(`Im Schnitt findest du <b>${exp.toLocaleString(LOC, {maximumFractionDigits:1})}</b> Kopien. In einem Shop (5 Slots) taucht ${who} mit <b>${rdPct(pRoll)}</b> Chance mindestens einmal auf.`, `On average you find <b>${exp.toLocaleString(LOC, {maximumFractionDigits:1})}</b> copies. In one shop (5 slots) ${who} shows up at least once with a <b>${rdPct(pRoll)}</b> chance.`)}</p>
      <h4 class="rd-sub">${L('Chance, mindestens so viele Kopien zu finden', 'Chance to find at least this many copies')}</h4>
      <div class="rd-bars">${bars}</div>
      ${cmp ? `<div class="rd-legend"><span><i class="rd-fill"></i>${L(`jetzt rollen (Level ${rd.lvl})`, `roll now (level ${rd.lvl})`)}</span><span><i class="rd-fill alt"></i>${L(`erst leveln (Level ${rd.lvl + 1})`, `level first (level ${rd.lvl + 1})`)}</span></div>` : ''}
      <h4 class="rd-sub">${L(`Wie viel Gold brauchst du für ${who} ${stars}?`, `How much gold do you need for ${who} ${stars}?`)}</h4>
      <div class="rd-need">${need.map(([q, g])=>`<div><small>${q} ${L('Spielen', 'games')}</small><b>${g === null ? L('über 500', 'over 500') : g + ' Gold'}</b></div>`).join('')}</div>
    </details>
    <p class="note">${L('Gerechnet wird Shop für Shop mit dem geteilten Pool aller Spieler, inklusive des kostenlosen Shops zu Rundenbeginn: Jede gefundene Kopie fehlt danach im Pool und kostet ihren Preis in Gold, wie im Spiel. Nicht berücksichtigt sind Effekte, die Shops verändern (z. B. Augments oder Wisps).', 'Calculated shop by shop with the shared pool of all players, including the free shop at the start of the round: every copy found is then missing from the pool and costs its price in gold, like in the game. Effects that change shops (e.g. augments or wisps) are not included.')}${x.exact ? '' : L(` Richtwert für Level ${rd.lvl}: Bei den Spielern liegen etwa ${x.est} Kopien anderer ${rd.cost}-Kosten-Units. Sie fehlen im Pool, deshalb taucht deine Unit etwas öfter auf.`, ` Guideline for level ${rd.lvl}: the players hold about ${x.est} copies of other ${rd.cost}-cost units. They're missing from the pool, so your unit shows up a bit more often.`)}${rdMode !== 'pro' && rd.contest ? L(` Gegner: geschätzt ${x.opp} Kopien deiner Unit.`, ` Opponents: an estimated ${x.opp} copies of your unit.`) : ''}</p>`;
  rdShown.cat = amp[0];
  rdRing(P * 100, P < .005 ? '<1' : String(n));
  rdStick();
}
// Ergebnis-Ring wie ein Regler: Ring und Zahl laufen vom alten zum neuen Wert (wie die LP-Grenzen), die Farbe wandert mit –
// rot unter 40, gelb bis 70, darüber grün (gleiche Grenzen wie die Ampel)
const rdShown = {p:0, cat:''};   // p = gerade angezeigter Wert (auch mitten in der Animation)
const rdHue = v => v < 40 ? v / 40 * 22 : v < 70 ? 38 + (v - 40) / 30 * 14 : 115 + (v - 70) / 30 * 30;
const rdColor = v => `hsl(${rdHue(v).toFixed(0)} 85% 60%)`;
function rdRing(to, label){
  const hero = $('#rdRes .rd-hero'), ring = hero && hero.querySelector('.rd-ring'), num = ring && ring.querySelector('b'); if(!num) return;
  const from = rdShown.p, set = v => { v = Math.max(0, Math.min(100, v)); rdShown.p = v; ring.style.setProperty('--p', v.toFixed(2)); hero.style.setProperty('--rc', rdColor(v)); num.textContent = Math.round(v); };
  cancelAnimationFrame(rdRing.raf);
  const still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(still || Math.abs(to - from) < .5){ set(to); num.textContent = label; return; }
  const t0 = performance.now(), dur = 700, ease = x => 1 - Math.pow(1 - x, 3);
  // Fortschritt 0 … 1: der Zeitstempel des ersten Bilds kann vor t0 liegen – negativ würde die Kurve über den Startwert hinausschießen
  const step = now => { const k = Math.max(0, Math.min(1, (now - t0) / dur)); set(from + (to - from) * ease(k)); if(k < 1) rdRing.raf = requestAnimationFrame(step); else num.textContent = label; };
  rdRing.raf = requestAnimationFrame(step);
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
// Knöpfe über dem Pool: Champions nach Kosten filtern, Items nach Art, Augments nach Stufe
const TM_SORTS = {c:[['all','Alle'],['1','1 Gold'],['2','2 Gold'],['3','3 Gold'],['4','4 Gold'],['5','5 Gold']],
  t:[['type','Typ'],['name','Name']], a:[['1','Silber'],['2','Gold'],['3','Prismatisch']], i:[['craft','Items'],['radiant','Lichtversionen'],['component','Komponenten']], r:[['name','Name']], e:[['name','Name']]};
// Taktiker-Krone, -Umhang und -Schild geben nur +1 Teamgröße – keine Embleme
const tmIsTactician = it => /Tactician/i.test(it.id + ' ' + it.en);
const AUG_BY = Object.fromEntries(AUGS.map(x=>[x.id, x])), ITEM_BY = Object.fromEntries(ITEMS.map(x=>[x.id, x])), TRAIT_BY = Object.fromEntries(traits.map(x=>[x.n, x]));
// feste Reihenfolge für Teilen-Links (Index statt langer IDs)
const TM_ORDER = {c:champions.map(x=>x.n).sort(), t:traits.map(x=>x.n).sort(), a:AUGS.map(x=>x.id).sort(), i:ITEMS.map(x=>x.id).sort()};
const TM_IDX = Object.fromEntries(Object.entries(TM_ORDER).map(([k, arr])=>[k, Object.fromEntries(arr.map((v,i)=>[v,i]))]));
let tm = null, tmMode = 'build', tmTab = 'c', tmSort = {c:'all', t:'type', a:'1', i:'craft', r:'name', e:'name'}, tmSel = null, tmShared = false, tmBuilt = false, tmDrag = null;

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
function tmChanged(){ if(tmShared){ tmShared = false; setUrl('/tools/tft-tierlist-maker'); } tmSave(); tmRender(); }
function tmToast(msg){ const t = $('#tmToast'); t.textContent = msg; t.classList.add('show'); clearTimeout(tmToast.h); tmToast.h = setTimeout(()=>t.classList.remove('show'), 2200); }

function tmRoute(a, b){
  // geteilte Links: /tools/tft-tierlist-maker/<Set>/<Code>
  if(a && /^\d+$/.test(a) && b){
    if(+a !== TFT_DATA.set){ try { localStorage.setItem('tftfreaks_set', a); } catch(e){} location.reload(); return; }
    const st = tmDecode(b);
    if(st){ tm = st; tmShared = true; tmMode = 'view'; }
    else { setUrl('/tools/tft-tierlist-maker'); }
  } else if(!tm || tmShared){ tm = tmLoad(); tmShared = false; }
  if(!tmBuilt) tmBuild();
  tmRender();
}
function tmBuild(){
  tmBuilt = true;
  $('#tmApp').innerHTML = `<div class="tm">
    <div class="tm-top">
      <label class="tm-title"><span>Tierlist</span><i aria-hidden="true">›</i><input id="tmTitle" maxlength="40" placeholder="Dein Titel" aria-label="Titel der Tierlist"></label>
      <div class="tm-mode" id="tmMode" role="group" aria-label="Modus"><button type="button" data-mode="view">Ansehen<span></span></button><button type="button" data-mode="build">Bearbeiten<span></span></button></div>
    </div>
    <div class="tm-shared" id="tmShared" hidden><span>Geteilte Tierlist – zum Ansehen.</span><button type="button" class="btn btn-ghost" id="tmCopyOwn">Als eigene Kopie bearbeiten<span></span></button></div>
    <div class="tm-body">
      <div class="tm-rows" id="tmRows"></div>
      <aside class="tm-box" id="tmBox">
        <div class="tm-box-head"><h3>Toolbox</h3>
          <div class="tm-acts"><button type="button" id="tmAddRow">+ Zeile<span></span></button><button type="button" id="tmClear">Alles leeren<span></span></button><button type="button" id="tmReset" title="Reihen wieder S, A, B, C, X mit den Standardfarben, ohne Einträge und Titel">Zurücksetzen<span></span></button><button type="button" id="tmShare" class="hl">Teilen<span></span></button></div></div>
        <div class="tm-tabs" id="tmTabs">${TM_TABS.map(([k,l])=>`<button type="button" data-tab="${k}">${l}<span></span></button>`).join('')}</div>
        <input class="input" id="tmSearch" placeholder="Suchen …" aria-label="Suchen">
        <div class="tm-sorts" id="tmSorts"></div>
        <div class="tm-pool tm-drop" id="tmPool" data-r="-1"></div>
        <p class="tm-tip">Ziehen zum Einsortieren · am Handy: antippen, dann Zeile antippen · Doppelklick nimmt einen Eintrag wieder raus</p>
      </aside>
    </div>
    <div class="tm-toast" id="tmToast" role="status"></div>
  </div>`;
  const app = $('#tmApp');
  $('#tmTitle').addEventListener('input', e=>{ tm.title = e.target.value; if(tmShared){ tmShared = false; setUrl('/tools/tft-tierlist-maker'); $('#tmShared').hidden = true; } tmSave(); });
  $('#tmMode').addEventListener('click', e=>{ const b = e.target.closest('[data-mode]'); if(!b) return; tmMode = b.dataset.mode; tmSel = null; tmRender(); });
  $('#tmCopyOwn').addEventListener('click', ()=>{ tmMode = 'build'; tmChanged(); tmToast('Kopie angelegt – deine Änderungen werden gespeichert.'); });
  $('#tmTabs').addEventListener('click', e=>{ const b = e.target.closest('[data-tab]'); if(!b) return; tmTab = b.dataset.tab; tmRenderPool(); });
  $('#tmSorts').addEventListener('click', e=>{ const b = e.target.closest('[data-sort]'); if(!b) return; tmSort[tmTab] = b.dataset.sort; tmRenderPool(); });
  $('#tmSearch').addEventListener('input', tmRenderPool);
  $('#tmAddRow').addEventListener('click', ()=>{ if(tm.rows.length >= 12) return tmToast('Maximal 12 Zeilen.'); const used = new Set(tm.rows.map(r=>r.l)); tm.rows.push({l:['D','E','F','?'].find(x=>!used.has(x)) || '?', c:(tm.rows.length) % TM_COLORS.length, items:[]}); tmChanged(); });
  $('#tmClear').addEventListener('click', ()=>{ if(!tm.rows.some(r=>r.items.length) || confirm('Alle Einträge aus der Tierlist entfernen?')){ tm.rows.forEach(r=>r.items = []); tmChanged(); } });
  // Zurücksetzen: Ausgangszustand mit S, A, B, C, X und Standardfarben – auch Titel und Einträge sind danach weg
  $('#tmReset').addEventListener('click', ()=>{ if(!confirm('Tierlist komplett zurücksetzen? Reihen, Farben, Titel und alle Einträge gehen auf den Anfang zurück.')) return; tm = TM_DEFAULT(); tmSel = null; tmChanged(); tmToast('Zurückgesetzt – wieder S, A, B, C und X.'); });
  $('#tmShare').addEventListener('click', ()=>{
    const url = siteUrl('/tools/tft-tierlist-maker/' + TFT_DATA.set + '/' + tmEncode(tm));
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
      <div class="tm-label"><button type="button" data-act="name" title="Umbenennen" ${build?'':'tabindex="-1"'}>${esc(r.l)}<span></span></button>
        ${build ? `<div class="tm-ctl"><button type="button" data-act="up" title="Nach oben" aria-label="Nach oben">▲<span></span></button><button type="button" data-act="color" title="Farbe wechseln" aria-label="Farbe wechseln">●<span></span></button><button type="button" data-act="down" title="Nach unten" aria-label="Nach unten">▼<span></span></button><button type="button" data-act="del" title="Zeile löschen" aria-label="Zeile löschen">✕<span></span></button></div>` : ''}</div>
      <div class="tm-drop" data-r="${i}">${r.items.map(tmTile).join('') || (build ? '<span class="tm-empty">Hierher ziehen</span>' : '')}</div>
    </div>`).join('');
  tmRenderPool();
}
function tmRenderPool(){
  if(tmMode!=='build') return;
  $('#tmTabs').querySelectorAll('[data-tab]').forEach(b=>b.classList.toggle('on', b.dataset.tab===tmTab));
  $('#tmSorts').hidden = TM_SORTS[tmTab].length < 2;   // nur eine Sortierung: keine Knöpfe nötig
  // Kosten-Knöpfe mit den Standard-Kostenfarben der Units (wie im Rolldown- und DPS-Vergleich)
  $('#tmSorts').innerHTML = TM_SORTS[tmTab].map(([k,l])=>`<button type="button" data-sort="${k}" class="${tmSort[tmTab]===k?'on':''}${tmTab==='c' && /^\d$/.test(k) ? ' cb c' + k : ''}">${l}<span></span></button>`).join('');
  const q = $('#tmSearch').value.toLowerCase().trim(), used = tmUsed(), s = tmSort[tmTab];
  let list;
  if(tmTab==='c'){
    list = champions.filter(c=>(s==='all' || c.c===+s) && (!q || c.n.toLowerCase().includes(q) || c.t.some(t=>t.toLowerCase().includes(q))));
    list.sort((a,b)=>a.c-b.c || a.n.localeCompare(b.n));
    list = list.map(c=>'c:'+c.n);
  } else if(tmTab==='t'){
    list = traits.filter(t=>!q || t.n.toLowerCase().includes(q)).sort(s==='name' ? (a,b)=>a.n.localeCompare(b.n) : (a,b)=>(a.cat===b.cat ? 0 : a.cat==='origin' ? -1 : 1) || a.n.localeCompare(b.n)).map(t=>'t:'+t.n);
  } else if(tmTab==='a'){
    list = AUGS.filter(a=>String(a.lv||1)===s && !AUG_DUP.has(a.id) && (!q || a.en.toLowerCase().includes(q) || (a.de||'').toLowerCase().includes(q))).sort((a,b)=>a.en.localeCompare(b.en)).map(a=>'a:'+a.id);
  } else {
    // Items-Tab: nur die gewählte Art (Items, Lichtversionen oder Komponenten); Artefakte und Embleme haben eigene Tabs
    const cats = tmTab==='i' ? (TM_ITEM_TABS.i.includes(s) ? [s] : ['craft']) : (TM_ITEM_TABS[tmTab] || TM_ITEM_TABS.i), ord = Object.fromEntries(cats.map((k,i)=>[k,i]));
    list = ITEMS.filter(i=>cats.includes(itemCat(i)) && !(tmTab==='e' && tmIsTactician(i)) && (!q || i.en.toLowerCase().includes(q) || (i.de||'').toLowerCase().includes(q)))
      .sort(s==='cat' ? (a,b)=>(ord[itemCat(a)]??9)-(ord[itemCat(b)]??9) || a.en.localeCompare(b.en) : (a,b)=>a.en.localeCompare(b.en)).map(i=>'i:'+i.id);
  }
  const free = list.filter(k=>!used.has(k));
  $('#tmPool').innerHTML = free.map(tmTile).join('') || `<span class="tm-empty">${list.length ? 'Alles einsortiert!' : 'Nichts gefunden.'}</span>`;
}

/* ================= TOOLS: Item-Drop-Chance ================= */
// Komponenten aus Creep-Runden kommen aus einem Item-Pool: gezogene Komponenten fehlen darin, vor jeder weiteren Creep-Stage
// kommt von jeder Komponente eine dazu. Beute-Tabellen pro Stage stehen in data/custom-<Set>.js (loot).
// Bevorzugt die Loot-Tabelle von Little Buddy Bot (loot.lbb, wie im Cheatsheet) – umgerechnet ins Zeilenformat
// [grau, blau, gold, prisma, Komponenten-Kugeln, Komponenten-Amboss, aufgewertet, Chance]; LBB kennt keine Ambosse und aufgewerteten Runden (bleiben 0)
const LOOT = (()=>{ const l = TFT_CUSTOM_SET.loot; if(!l) return null;
  if(l.lbb) return Object.assign({}, l, {lbb:true, source:l.lbb.src, stages:Object.fromEntries(Object.entries(l.lbb.stages).map(([s, rows])=>[s, rows.map(([c, g, b, go, p, w])=>[g, b, go, p, c, 0, 0, w])]))});
  return l.stages ? l : null; })();
const DR_KEY = 'tftfreaks_drops_v1_' + TFT_DATA.set;
const DR_COMPS = COMPONENTS.filter(id=>!/spatula|fryingpan/i.test(normN(itemById[id].en))).slice(0, 8);   // die 8 Komponenten im Item-Pool
// Ab 5-7 gibt es keine zufälligen Komponenten mehr – deshalb nur die vier Creep-Stages
const DR_STAGES = [[1,'Stage 1','Minions'],[2,'2-7','Creeps'],[3,'3-7','Creeps'],[4,'4-7','Creeps']];
// Nur noch, was droppt und was du bekommen hast: Stage und Drops pro Stage (Karussell, Ambosse und Start-Pool sind raus, der Pool startet mit einer von jeder)
const DR_NEW = () => ({stage:1, drops:{1:[], 2:[], 3:[], 4:[]}});
let dr = (()=>{ try { const s = JSON.parse(localStorage.getItem(DR_KEY)); if(s && s.drops) return {stage:Math.max(1, Math.min(4, +s.stage || 1)), drops:Object.assign(DR_NEW().drops, s.drops)}; } catch(e){} return DR_NEW(); })();
// Beute der Stage (Orbs und Anzahl Komponenten) steckt eingeklappt im Ergebnis; Orbs mit den eigenen Grafiken (wie im Cheatsheet)
let drLootOpen = false;
const drOrbImg = k => `<img src="assets/icons/tft/lootorb-${k}.webp" alt="" width="34" height="34">`;
const drSave = () => { try { localStorage.setItem(DR_KEY, JSON.stringify(dr)); } catch(e){} };
// Item-Pool nach allen Drops bis einschließlich Stage `upto`
function drBag(upto){
  const bag = Object.fromEntries(DR_COMPS.map(id=>[id, 1]));
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

// Bewegung: Zahlen und Balken laufen vom alten zum neuen Wert, Zeilen rutschen an ihren neuen Platz (sortiert nach Chance),
// gedroppte Pool-Punkte fliegen raus, Nachschub springt rein. drLast = Werte beim letzten Zeichnen, drFx = einmalige Effekte (welcher Klick)
let drLast = null, drFx = {};
const drStill = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
const drNum = (key, v, fmt = 'pct') => { const f = drLast && drLast[key] != null ? drLast[key] : v; drNow[key] = v;
  return `<span class="dr-num" data-v="${v == null ? '' : v}" data-f="${f == null ? '' : f}" data-fmt="${fmt}">${v == null ? '–' : fmt === 'pct' ? drPct(f) : fmtNum(f)}</span>`; };
let drNow = {};
function drAnimate(app, rowsBefore){
  if(drStill()){ app.querySelectorAll('.dr-num').forEach(el=>{ const v = el.dataset.v; if(v !== '') el.textContent = el.dataset.fmt === 'pct' ? drPct(+v) : fmtNum(+v); }); app.querySelectorAll('[data-w]').forEach(el=>{ el.style.width = el.dataset.w + '%'; }); return; }
  // Zeilen an den neuen Platz rutschen lassen (FLIP)
  app.querySelectorAll('.dr-table tbody tr[data-id]').forEach(tr=>{ const was = rowsBefore[tr.dataset.id]; if(was == null) return;
    const dy = was - tr.getBoundingClientRect().top; if(Math.abs(dy) < 1) return;
    tr.style.transition = 'none'; tr.style.transform = `translateY(${dy}px)`;
    requestAnimationFrame(()=>requestAnimationFrame(()=>{ tr.style.transition = 'transform .5s cubic-bezier(.2,.8,.2,1)'; tr.style.transform = ''; })); });
  // Balken wachsen bzw. schrumpfen per CSS-Übergang
  requestAnimationFrame(()=>requestAnimationFrame(()=>app.querySelectorAll('[data-w]').forEach(el=>{ el.style.width = el.dataset.w + '%'; })));
  // Zahlen zählen hoch oder runter
  const nums = [...app.querySelectorAll('.dr-num')].filter(el=>el.dataset.v !== '' && el.dataset.f !== '' && el.dataset.v !== el.dataset.f);
  if(!nums.length) return;
  const t0 = performance.now(), dur = 600, ease = x => 1 - Math.pow(1 - x, 3);
  cancelAnimationFrame(drAnimate.raf);
  const step = now => { const k = Math.max(0, Math.min(1, (now - t0) / dur));
    nums.forEach(el=>{ const f = +el.dataset.f, v = +el.dataset.v, x = f + (v - f) * ease(k); el.textContent = el.dataset.fmt === 'pct' ? drPct(x) : fmtNum(Math.round(x)); });
    if(k < 1) drAnimate.raf = requestAnimationFrame(step); };
  drAnimate.raf = requestAnimationFrame(step);
}

function drRender(){
  const app = $('#drApp'); if(!app) return;
  if(!LOOT){ app.innerHTML = ornnSays(`Für Set ${TFT_DATA.set} fehlen mir noch die Beute-Tabellen. Sobald sie feststehen, schmiede ich den Rechner nach.`); return; }
  const rowsBefore = {}; app.querySelectorAll('.dr-table tbody tr[data-id]').forEach(tr=>{ rowsBefore[tr.dataset.id] = tr.getBoundingClientRect().top; });
  drNow = {};
  const s = dr.stage, cur = dr.drops[s] || [];
  const {bag, warn, n} = drBag(s);
  const rest = drRest(s, cur.length);
  const restK = rest ? Object.entries(rest).reduce((a, [k, p])=>a + k*p, 0) : 0;
  const nextS = s + 1, nextBag = Object.fromEntries(DR_COMPS.map(id=>[id, bag[id] + 1])), nextN = n + DR_COMPS.length;
  const nextDist = nextS <= 4 ? drRest(nextS, 0) : null, nextName = nextS <= 4 ? DR_STAGES[nextS-1][1] : '';
  const stageName = DR_STAGES[s-1][1];
  const prevBag = drLast && drLast.bag;
  // Ohne einen einzigen Drop ist das Ergebnis im Leerlauf
  const idle = [1,2,3,4].every(k=>!(dr.drops[k]||[]).length);
  // Stage-Leiste
  const tabs = DR_STAGES.map(([k, l, sub])=>`<button type="button" class="dr-tab${k===s ? ' on' : ''}" data-drstage="${k}"><b>${l}</b><small>${sub}</small>${(dr.drops[k]||[]).length ? `<i>${dr.drops[k].length}</i>` : ''}<span></span></button>`).join('');
  // Eingabe: ein Klick = eine gedroppte Komponente; der Knopf zeigt, wie viele noch im Pool liegen. Die Knöpfe leuchten pulsierend (wie die fällige Stufe der Augment-Vorhersage)
  const pick = `<div class="dr-pick">${DR_COMPS.map(id=>{ const it = itemById[id], left = bag[id];
    return `<button type="button" class="dr-c${left===0 ? ' empty' : ''}${drFx.add === id ? ' hit' : ''}" data-dradd="${id}"${left===0 ? ' disabled' : ''} title="${left===0 ? `${esc(it.de)}: gerade nicht im Item-Pool` : `${esc(it.de)} hinzufügen`}">${drIcon(id, 38)}<span>${esc(it.de)}</span><em>${left}× im Pool</em>${drFx.add === id ? '<strong class="dr-minus">−1</strong>' : ''}<span></span></button>`; }).join('')}</div>`;
  const got = [1,2,3,4].map(k=>{ const l = dr.drops[k]||[]; return `<div class="dr-row${k===s ? ' on' : ''}"><span>${DR_STAGES[k-1][1]}</span><div>${l.length ? l.map((id, i)=>`<button type="button" class="dr-chip${drFx.add && k===s && i===l.length-1 ? ' new' : ''}" data-drdel="${k}:${i}" title="Entfernen">${drIcon(id, 28)}<span></span></button>`).join('') : '<small>–</small>'}</div></div>`; }).join('');
  // Wahrscheinlichkeiten – sortiert nach der Chance auf den nächsten Drop (bei Gleichstand in der üblichen Reihenfolge)
  const rows = DR_COMPS.map(id=>{
    const it = itemById[id], c = bag[id];
    const pNext = !n ? null : c / n;
    const pRest = !rest || restK < 0.01 ? null : drMix(rest, c, n);
    const pNextStage = nextDist ? drMix(nextDist, nextBag[id], nextN) : null;
    return {id, it, c, pNext, pRest, pNextStage};
  }).sort((a, b)=>(b.pNext || 0) - (a.pNext || 0));
  const best = Math.max(...rows.map(r=>r.pNext || 0)), allSame = rows.every(r=>(r.pNext || 0) === best);
  // Pool-Punkte: gedroppte fliegen raus, neue (Nachschub vor der nächsten Stage) springen rein
  const dots = r => { const was = prevBag ? prevBag[r.id] : r.c;
    return '<span class="dr-dots">' + Array.from({length:Math.max(r.c, was, 1)}, (_, i)=>`<i class="${i < r.c ? 'on' : ''}${i >= r.c && i < was ? ' out' : ''}${i >= was && i < r.c ? ' in' : ''}"></i>`).join('') + '</span>'; };
  const lastBar = id => drLast && drLast['n:' + id] != null ? drLast['n:' + id] : 0;
  const table = `<table class="dr-table${nextDist ? '' : ' no-next'}"><thead><tr><th>Komponente</th><th>Im Pool</th><th>Nächster Drop</th><th>Mind. 1 im Rest von ${esc(stageName)}</th>${nextDist ? `<th>Mind. 1 in ${nextName}</th>` : ''}</tr></thead><tbody>${rows.map(r=>
    `<tr data-id="${r.id}" class="${!allSame && r.pNext && r.pNext===best ? 'best' : ''}${r.c===0 ? ' gone' : ''}"><td><span class="dr-name">${drIcon(r.id, 30)}${esc(r.it.de)}</span></td><td>${dots(r)} <b>${r.c}</b></td><td><span class="dr-bar"><i style="width:${lastBar(r.id) * 100}%" data-w="${(r.pNext||0) * 100}"></i></span>${drNum('n:' + r.id, r.pNext)}</td><td>${drNum('r:' + r.id, r.pRest)}</td>${nextDist ? `<td>${drNum('s:' + r.id, r.pNextStage)}</td>` : ''}</tr>`).join('')}</tbody></table>`;
  // Kurz und groß über der Tabelle: was am wahrscheinlichsten als Nächstes kommt
  const favs = rows.filter(r=>r.pNext && r.pNext === best);
  const favKey = favs.map(r=>r.id).join(','), favNew = drLast && drLast.fav != null && drLast.fav !== favKey;
  drNow.fav = idle ? null : favKey;
  const top = !n ? '' : allSame
    ? `<div class="dr-top same"><div><small>Nächster Drop</small><b>Alles gleich wahrscheinlich</b></div><strong>${drNum('top', best)}</strong></div>`
    : `<div class="dr-top${favNew ? ' pop' : ''}"><div><small>Am wahrscheinlichsten als Nächstes</small><span class="dr-favs${favs.length > 2 ? ' icons' : ''}">${favs.map(r=>`<span>${drIcon(r.id, 36)}${favs.length > 2 ? '' : `<b>${esc(r.it.de)}</b>`}</span>`).join('')}</span></div><strong>${favs.length > 1 ? '<em>je</em>' : ''}${drNum('top', best)}</strong></div>`;
  const restTxt = !rest ? `Mehr Komponenten als laut Tabelle möglich (max. ${Math.max(...LOOT.stages[s].map(r=>r[4]))}) – prüf deine Eingabe.`
    : restK < 0.01 ? (nextName ? `In ${esc(stageName)} kommt laut Tabelle keine weitere Komponente – weiter zu ${nextName}.` : `In ${esc(stageName)} kommt laut Tabelle keine weitere Komponente.`)
    : `Noch erwartet in ${esc(stageName)}: <b>${fmtNum(Math.round(restK*10)/10)}</b> Komponente${Math.abs(restK-1) < 0.05 ? '' : 'n'} (${Object.entries(rest).filter(([,p])=>p > 0.0005).map(([k, p])=>`${k}: ${drPct(p)}`).join(' · ')}).`;
  const poolTxt = nextName ? ` Vor ${nextName} kommt von jeder Komponente eine in den Item-Pool.` : ' Danach gibt es keine zufälligen Komponenten mehr.';
  // Beute dieser Stage (bedingt auf die schon gedroppten Komponenten) – eingeklappt, mit den eigenen Orb-Grafiken
  const all = LOOT.stages[s], ok = all.filter(r=>r[4] >= cur.length), tot = ok.reduce((a, r)=>a + r[7], 0) || 1;
  const P = f => ok.filter(f).reduce((a, r)=>a + r[7], 0) / tot;
  const cnt = {}; all.forEach(r=>{ cnt[r[4]] = (cnt[r[4]]||0) + r[7]; });
  const maxC = Math.max(...Object.values(cnt));
  const orbName = r => [r[4] && `${r[4]}× ${L('Komponente', 'component')}`, r[0] && `${r[0]}× ${L('Grau', 'gray')}`, r[1] && `${r[1]}× ${L('Blau', 'blue')}`, r[2] && `${r[2]}× Gold`, r[3] && `${r[3]}× ${L('Prismatisch', 'prismatic')}`, r[5] && L('Komponenten-Amboss', 'component anvil')].filter(Boolean).join(' + ');
  const hasUp = all.some(r=>r[6] > 0);   // aufgewertete Runden gibt es nur in der alten tftflow-Tabelle
  const orb = (cls, img, label, key, f) => `<div class="dr-orb ${cls}">${img ? drOrbImg(img) : ''}<div><span>${label}</span><b>${drNum(key, P(f))}</b></div></div>`;
  const loot = `<details class="dr-sec dr-loot"${drLootOpen ? ' open' : ''}><summary><span class="dr-lsum">${['prism', 'gold', 'blue', 'gray'].map(drOrbImg).join('')}</span><span><b>Orbs &amp; Beute in ${esc(stageName)}</b><small>Wie sich die Orbs in dieser Stage verteilen</small></span></summary>
      <div class="dr-orbs">
        ${orb('prism', 'prism', 'Prismatischer Orb', 'o:p', r=>r[3] > 0)}
        ${orb('gold', 'gold', 'Gold-Orb', 'o:g', r=>r[2] > 0)}
        ${orb('blue', 'blue', 'Blau-Orb', 'o:b', r=>r[1] > 0)}
        ${hasUp ? orb('up', '', 'Aufgewertet', 'o:u', r=>r[6] > 0) : orb('gray', 'gray', L('Grauer Orb', 'Gray orb'), 'o:y', r=>r[0] > 0)}
      </div>
      ${cur.length ? `<p class="dr-note">Schon berücksichtigt: Du hast in ${esc(stageName)} ${cur.length} Komponente${cur.length===1 ? '' : 'n'} – Kombinationen mit weniger fallen raus.</p>` : ''}
      <h4 class="dr-h4">Zufällige Komponenten in ${esc(stageName)}</h4>
      <div class="dr-counts">${Object.keys(cnt).sort((a,b)=>a-b).map(k=>`<div class="${+k < cur.length ? 'off' : ''}"><span style="height:${cnt[k]/maxC*100}%"></span><b>${fmtNum(Math.round(cnt[k]*10)/10)} %</b><small>${k}</small></div>`).join('')}</div>
      <p class="dr-note">${restTxt}${poolTxt}</p>
      <details class="dr-more"><summary>Alle Beute-Kombinationen</summary><table class="dr-table small"><tbody>${all.slice().sort((a,b)=>b[7]-a[7]).map(r=>`<tr class="${r[4] < cur.length ? 'gone' : ''}${r[3] ? ' prism' : ''}"><td>${orbName(r)}${r[6] ? ' <span class="dr-up" title="nur in einer aufgewerteten Runde">aufgewertet</span>' : ''}</td><td>${fmtNum(r[7])} %</td></tr>`).join('')}</tbody></table></details>
    </details>`;
  const orbTbl = o => o ? `<div class="dr-orbtbl"><h4>${esc(o.label)} <small>${esc(o.note)} · Wert ${esc(o.wert)}</small></h4><table class="dr-table small"><tbody>${o.items.map(([t, p])=>`<tr><td>${esc(t)}</td><td>${fmtNum(p)} %</td></tr>`).join('')}</tbody></table></div>` : '';
  // Leerlauf: der volle Item-Pool – die acht Komponenten schweben im Kreis um die Zahl im Pool, bis die erste droppt
  const out = idle ? `<div class="dr-idle">
      <div class="dr-orbit">${DR_COMPS.map((id, i)=>{ const a = i / DR_COMPS.length * 2 * Math.PI - Math.PI / 2;
        return `<span style="--x:${(50 + 41 * Math.cos(a)).toFixed(1)}%;--y:${(50 + 41 * Math.sin(a)).toFixed(1)}%;--i:${i}">${drIcon(id, 42)}</span>`; }).join('')}
        <div class="dr-orbit-c"><b>${n}</b><small>${L('im Pool', 'in pool')}</small></div></div>
      <span class="dr-ready">${L('Bereit', 'Ready')}</span>
      <h3>${L('Was droppt als Nächstes?', 'What drops next?')}</h3>
      <p>${L('Klick unter „Deine Angaben“ die Komponente an, die gerade gedroppt ist – dann siehst du hier, was am wahrscheinlichsten als Nächstes kommt.', 'Click the component that just dropped under “Your input” – then you see here what is most likely to come next.')}</p></div>`
    : `${top}
      <h3>Wahrscheinlichkeiten <small>${drNum('pool', n, 'n')} Komponenten im Pool</small></h3>
      <div class="dr-tw">${table}</div>
      ${loot}`;
  // Deine Angaben: Stage-Reiter, Komponenten zum Anklicken, Drops pro Stage. Dein Ergebnis: Favorit, Wahrscheinlichkeiten, Beute der Stage (eingeklappt), deine Komponenten
  app.innerHTML = `<div class="dr">
    <div class="dr-grid">
      <section class="card dr-in tio-in" aria-label="${L('Deine Angaben', 'Your input')}">
        ${tioHead(false, tioReset(`data-drreset${idle && s === 1 ? ' disabled' : ''}`, L('Neues Spiel', 'New game')), L('Trag Stage für Stage ein, welche Komponenten droppen.', 'Enter stage by stage which components drop.'))}
        <div class="dr-tabs">${tabs}</div>
        <div class="dr-head"><h3>Was hast du in ${esc(stageName)} bekommen?</h3></div>
        <p class="dr-note">Klick die Komponenten an, die gerade gedroppt sind – sie werden aus dem Item-Pool genommen.</p>
        ${pick}
        ${warn ? '<p class="dr-warn">Eine Komponente ist öfter gedroppt, als laut Pool-Regel möglich – prüf deine Eingabe.</p>' : ''}
        <div class="dr-got">${got}</div>
        <div class="dr-actions">
          ${nextName ? `<button class="btn btn-primary" type="button" data-drstage="${nextS}">Weiter zu ${nextName} →<span></span></button>` : ''}
          <button class="b-tbtn" type="button" data-drundo${cur.length ? '' : ' disabled'}>Letzten entfernen<span></span></button>
        </div>
      </section>
      <section class="card dr-out tio-out" aria-label="${L('Dein Ergebnis', 'Your result')}">
        ${tioHead(true)}
        ${out}
      </section>
    </div>
    <details class="card dr-more"><summary>Orb-Inhalte (Gold-Orb &amp; prismatischer Orb) und Quelle</summary>
      <div class="dr-orbgrid">${orbTbl(LOOT.orbs.prism)}${orbTbl(LOOT.orbs.gold)}${orbTbl(LOOT.orbs.gold4)}
        ${LOOT.lbb ? '' : `<div class="dr-orbtbl"><h4>Aufgewertete Runden <small>einmal pro Spiel geheim ausgewürfelt</small></h4><table class="dr-table small"><tbody>${LOOT.upgraded.map(([t, p])=>`<tr><td>${esc(t)}</td><td>${fmtNum(p)} %</td></tr>`).join('')}</tbody></table></div>`}</div>
      ${LOOT.lbb ? `<p class="dr-note">${L('Alle Spieler bekommen dieselbe Menge und Qualität an Orbs, nur der Inhalt unterscheidet sich. Komponenten-Kugeln (mindestens 11, höchstens 15 pro Spiel) sehen aus wie blaue Orbs.', 'All players receive the same quantity and quality of orbs, only the contents vary. Component orbs (minimum 11, maximum 15 per game) look the same as blue orbs.')}</p>` : ''}
      <p class="dr-note">Beute-Tabellen: ${esc(LOOT.source)}. Ab 5-7: ${esc(LOOT.late)} Die Pool-Regel (gezogene Komponenten fehlen, vor jeder Creep-Stage kommt von jeder eine dazu) ist nicht offiziell von Riot dokumentiert.</p>
    </details>
  </div>`;
  drAnimate(app, rowsBefore);
  drLast = Object.assign(drNow, {bag});
  drFx = {};
}
document.addEventListener('toggle', e=>{ if(e.target.matches && e.target.matches('.dr-loot')) drLootOpen = e.target.open; }, true);   // „Orbs & Beute“ bleibt beim Neurechnen offen bzw. zu
document.addEventListener('click', e=>{
  const app = e.target.closest && e.target.closest('#drApp'); if(!app) return;
  const t = e.target;
  const st = t.closest('[data-drstage]'); if(st){ dr.stage = +st.dataset.drstage; drSave(); drRender(); return; }
  const add = t.closest('[data-dradd]'); if(add){ if(add.disabled) return; if(dr.stage <= 4){ dr.drops[dr.stage].push(add.dataset.dradd); drFx.add = add.dataset.dradd; } drSave(); drRender(); return; }
  const del = t.closest('[data-drdel]'); if(del){ const [k, i] = del.dataset.drdel.split(':'); dr.drops[k].splice(+i, 1); drSave(); drRender(); return; }
  if(t.closest('[data-drundo]')){ const l = dr.drops[Math.min(4, dr.stage)]; if(l && l.length){ l.pop(); drSave(); drRender(); } return; }
  if(t.closest('[data-drreset]')){ if(confirm('Alle Eingaben löschen und ein neues Spiel starten?')){ dr = DR_NEW(); drSave(); drRender(); } return; }
});

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
const nameKey = s => String(s||'').toLowerCase().replace(/[’‘`´]/g, "'");   // Riot schreibt „Kha’Zix“, die Spieldaten „Kha'Zix“
(()=>{
  const add = (name, v) => { if(name) NAME_IDX[nameKey(name)] = NAME_IDX[nameKey(name)] || v; };
  TFT_DATA.champions.forEach(c=>{ add(c.n, {ty:'c', k:c.n}); add(c.de, {ty:'c', k:c.n}); });
  TFT_DATA.traits.forEach(t=>{ add(t.n, {ty:'t', k:t.n}); add(t.de, {ty:'t', k:t.n}); });
  ITEMS.forEach(i=>{ add(i.en, {ty:'i', k:i.id}); add(i.de, {ty:'i', k:i.id}); });
  AUGS.forEach(a=>{ add(a.en, {ty:'a', k:a.id}); add(a.de, {ty:'a', k:a.id}); });
})();
// Englische Patchnotes schreiben „Camille Ability Damage: …“ ohne Trennstrich – den Namen vorne abtrennen
if(EN) (()=>{ const names = Object.keys(NAME_IDX).sort((a,b)=>b.length - a.length);
  PATCHES.forEach(p=>(p.notes||[]).forEach(s=>(s.ch||[]).forEach(r=>{ if(r[0] || !r[1]) return; const l = nameKey(r[1]), n = names.find(x=>l.startsWith(x + ' ')); if(n){ r[0] = r[1].slice(0, n.length); r[1] = r[1].slice(n.length).trim(); } }))); })();
function patchIcon(subject){
  const m = NAME_IDX[nameKey(subject)]; if(!m) return '';
  if(m.ty==='c') return `<button class="pn-ic" data-champ="${esc(m.k)}" type="button">${avatar(m.k, 34)}<span></span></button>`;
  if(m.ty==='t') return `<span class="pn-ic">${traitHex(m.k, 'base', 30)}</span>`;
  if(m.ty==='i'){ const it = itemById[m.k]; return it ? `<button class="pn-ic" data-item="${esc(it.id)}" type="button"><img src="${it.img}" alt="" loading="lazy"><span></span></button>` : ''; }
  const a = AUG_BY[m.k]; return a ? `<span class="pn-ic"><img src="${augImg(a)}" alt="" loading="lazy"></span>` : '';
}
// Patch-Aktualisierungen eines Patches nach Datum: die erste ist der B-Patch, die zweite der C-Patch, dann D …
// Daten stehen deutsch („27. OKTOBER“) oder englisch („OCTOBER 27TH“) in der Gruppe; ältere Stände fassen mehrere Daten in einer Gruppe zusammen
const PATCH_MID = /PATCH-AKTUALISIERUNG|MID-PATCH/i;
const PATCH_MON = {jan:1, feb:2, 'mär':3, mar:3, apr:4, mai:5, may:5, jun:6, jul:7, aug:8, sep:9, okt:10, oct:10, nov:11, dez:12, dec:12};
const patchDayKey = d => { const m = String(d).match(/(\d{1,2})\.?\s+(\S+)/) || String(d).match(/(\S+)\s+(\d{1,2})/), [day, mon] = m ? (/^\d/.test(m[1]) ? [m[1], m[2]] : [m[2], m[1]]) : [0, ''];
  return (PATCH_MON[String(mon).toLowerCase().slice(0, 3)] || 0) * 100 + +day; };
const grpDates = g => String(g || '').split('·').slice(1).map(x=>secLabel(x.trim())).filter(Boolean);
function patchMids(p){   // [{d: '27. Oktober', k: 1027, letter: 'C'}] in zeitlicher Reihenfolge
  const seen = new Map(); (p.notes || []).filter(s=>PATCH_MID.test(s.grp || '')).forEach(s=>grpDates(s.grp).forEach(d=>seen.set(patchDayKey(d), d)));
  return [...seen].sort((a, b)=>a[0] - b[0]).map(([k, d], i)=>({d, k, letter:String.fromCharCode(66 + i)}));
}
const grpLabel = (g, p) => { const s = String(g||'');
  if(PATCH_MID.test(s)){ const mids = p ? patchMids(p) : [], ds = grpDates(s).sort((a, b)=>patchDayKey(a) - patchDayKey(b));
    const ls = ds.map(d=>(mids.find(m=>m.k === patchDayKey(d)) || {letter:'B'}).letter);
    return (ls.length > 1 ? ls.slice(0, -1).join('-, ') + '- & ' + ls[ls.length - 1] + '-Patch' : (ls[0] || 'B') + '-Patch') + (ds.length ? ' · ' + ds.join(' · ') : ''); }
  return secLabel(s).replace(/\bGrosse\b/g, 'Große'); };
const secLabel = s => String(s||'').toLowerCase().replace(/(^|[\s\-–(„"])(\S)/g, (m,a,b)=>a + b.toUpperCase());
function patchRowHTML(r){
  const [s, l, o, n] = r;
  return `<li class="pn-row">${patchIcon(s) || '<span class="pn-ic pn-dot"></span>'}<div class="pn-txt">${s ? `<b>${esc(s)}</b>` : ''}${l ? `<span class="pn-l">${esc(l)}</span>` : ''}<span class="pn-v">${o ? `<span class="pn-old">${esc(o)}</span><span class="pn-arr">⇒</span>` : ''}<span class="pn-new">${esc(n)}</span></span></div></li>`;
}
// Kopf der Patch-Seite: Patch-Nummer groß, rechts eine Nachricht von CrazYSlayt an die Besucher (Foto + Sprechblase, Klick auf Foto/Name → Profil)
const PATCH_AUTHOR = {img:'assets/img/team-claudio.jpg', href:'/about/crazyslayt'};
// Anfang der Ansage = Meta-Beschreibung der Patch-Seite (mit Keyword „TFT Patch 18.5“), danach ggf. der Hinweis auf B-Patches
const patchIntro = p => p===CURRENT_PATCH ? L(`Hey Leute, TFT Patch ${p.id} ist draußen! Ich hab ihn für euch übersichtlich aufbereitet – alle Änderungen auf einen Blick.`, `Hey everyone, TFT patch ${p.id} is out! I've neatly prepared it for you – every change at a glance.`)
  : L(`Hey Leute, hier ist TFT Patch ${p.id}! Ich hab ihn für euch übersichtlich aufbereitet – alle Änderungen auf einen Blick.`, `Hey everyone, here's TFT patch ${p.id}! I've neatly prepared it for you – every change at a glance.`);
function patchHero(p){
  // Patch-Aktualisierungen in zeitlicher Reihenfolge: „Der B-Patch vom 22. Oktober und der C-Patch vom 27. Oktober sind schon mit drin.“
  const bp = (p.notes || []).some(s=>PATCH_MID.test(s.grp || '')), mids = patchMids(p);
  const list = mids.map(m=>L(`der ${m.letter}-Patch vom ${m.d}`, `the ${m.letter}-patch from ${m.d}`)), joined = list.length > 1 ? list.slice(0, -1).join(', ') + L(' und ', ' and ') + list[list.length - 1] : list[0];
  const msg = patchIntro(p)
    + (!bp ? '' : ' ' + (list.length ? joined.charAt(0).toUpperCase() + joined.slice(1) + (list.length > 1 ? L(' sind schon mit drin.', ' are already included.') : L(' ist schon mit drin.', ' is already included.'))
      : L('Die B-Patch-Änderungen sind schon mit drin.', 'The B-patch changes are already included.')));
  return `<section class="pde"${p.img ? ` style="--img:url('${esc(p.img)}?w=1280&fm=webp');--pos:${esc(patchFocus(p))}"` : ''}>
    <div class="pde-kick"><span>Set ${esc(p.set)}</span>${p===CURRENT_PATCH ? `<span class="live">${L('Aktueller Patch', 'Current patch')}</span>` : ''}</div>
    <h1 class="pde-h1">TFT Patch <span>${esc(p.id)}</span></h1>
    <a class="pde-by" href="${PATCH_AUTHOR.href}">
      <span class="pde-av"><img src="${PATCH_AUTHOR.img}" alt="Claudio „CrazYSlayt“" width="50" height="50"><img class="pde-emb" src="${rankImg(rankBy.challenger)}" alt="" width="22" height="22"></span>
      <span class="pde-who"><span>${L('Von', 'By')} <b>${L('Claudio „CrazYSlayt“', 'Claudio "CrazYSlayt"')}</b> · TFT Challenger · TFTClimb Coach</span><small>${fmtDate(p.date)}</small></span>
    </a>
    <p class="pde-txt" data-meta>${esc(msg)}</p>
  </section>`;
}
function renderPatches(sub){
  const app = $('#patchesApp');
  if(!PATCHES.length){ app.innerHTML = `<div class="page-head"><div class="crumb">Home / Patches</div><h1>TFT <em class="serif">Patches</em></h1></div>` + ornnSays('Hmph. Die Patchliste ist noch nicht geschmiedet – das Update-Skript holt sie beim nächsten Lauf.'); return; }
  const p = sub && patchBySlug[sub];
  if(!p){
    const sets = [...new Set(PATCHES.map(x=>x.set))];
    app.innerHTML = `<div class="page-head"><div class="crumb">Home / Patches</div><h1>TFT <em class="serif">Patches</em></h1>
      <p>${L('Alle Patches für euch aufbereitet: jede Änderung übersichtlich nach Champions, Traits, Items und Augments sortiert – neu, sobald ein Patch erscheint (alle zwei Wochen, meist dienstags).', 'Every patch prepared for you: each change neatly sorted by champions, traits, items and augments – updated as soon as a patch drops (every two weeks, usually on Tuesdays).')}</p>
      ${(()=>{ const n = stNextPatch(); return n ? `<a class="pt-next" href="${COUNTDOWN_PATH}"><span class="pt-nb">${esc(n.id || 'TFT')}</span><span><small>${L('Nächster Patch in', 'Next patch in')}</small><b data-countdown>${stCountdown()}</b></span><em>${L('Zum Countdown', 'Open countdown')} →</em></a>` : ''; })()}</div>`
      + sets.map(st=>`<div class="pt-set"><h2>Set ${st}</h2><div class="pt-grid">${PATCHES.filter(x=>x.set===st).map(x=>{
        const cur = x===CURRENT_PATCH, cnt = patchCount(x), note = PATCH_NOTES[x.id];
        return `<a class="pt-card${cur?' cur':''}" href="/patches/${patchSlug(x.id)}">
          <div class="pt-img"${x.img ? ` style="background-image:url('${esc(x.img)}?w=640&fm=webp');background-position:${esc(patchFocus(x))}"` : ''}>${cur ? '<span class="pill">Aktuell</span>' : ''}</div>
          <div class="pt-body"><small>${fmtDate(x.date)}</small><h3>Patch ${esc(x.id)}</h3><p>${esc(x.teaser || '')}</p>
          <div class="pt-meta">${cnt ? `<span>${cnt} Änderungen</span>` : ''}${note ? '<span class="hl">mit Einschätzung</span>' : ''}${x.lang==='en' && !EN ? '<span>vorerst auf Englisch</span>' : ''}</div></div></a>`;
      }).join('')}</div></div>`).join('')
      + `<p class="note">${L('Quelle: offizielle Patchnotes von Riot Games, für euch übersichtlich aufbereitet.', 'Source: official patch notes by Riot Games, neatly prepared for you.')}</p>`;
    return;
  }
  const i = PATCHES.indexOf(p), newer = PATCHES[i-1], older = PATCHES[i+1];
  const grps = []; (p.notes || []).forEach(s=>{ let g = grps.find(x=>x.g===s.grp); if(!g){ g = {g:s.grp, secs:[]}; grps.push(g); } g.secs.push(s); });
  const note = PATCH_NOTES[p.id];
  app.innerHTML = `<div class="page-head"><div class="crumb"><a href="/patches">Patches</a> / ${esc(p.id)}</div></div>
    ${patchHero(p)}
    ${p.lang==='en' && !EN ? '<p class="pd-lang">Riot hat die deutschen Patchnotes noch nicht veröffentlicht – bis dahin siehst du hier die englische Fassung.</p>' : ''}
    ${note ? `<div class="card pd-note"><h3>Einschätzung von TFTClimb</h3>${String(note).split(/\n{2,}/).map(t=>`<p>${esc(t).replace(/\n/g,'<br>')}</p>`).join('')}</div>` : ''}
    ${grps.length ? `<input class="input pd-search" id="pdSearch" placeholder="Champion, Trait, Item oder Augment suchen …" aria-label="Änderungen durchsuchen">
    <div id="pdList">${grps.map(g=>`<section class="pd-grp">${g.g ? `<h2>${esc(grpLabel(g.g, p))}</h2>` : ''}${g.secs.map(s=>`<div class="card pd-sec">${s.sec ? `<h3>${esc(secLabel(s.sec))}</h3>` : ''}${s.en ? `<p class="pd-en">${L('Riot hat diese Aktualisierung bisher nur auf Englisch veröffentlicht – die deutsche Fassung folgt automatisch.', 'Riot has only published this update in English so far.')}</p>` : ''}<ul>${s.ch.map(patchRowHTML).join('')}</ul></div>`).join('')}</section>`).join('')}</div>`
      : viSays('Für diesen Patch habe ich keine einzelnen Änderungen gefunden – schau direkt in die Patchnotes bei Riot.')}
    <div class="pd-nav">${older ? `<a class="btn btn-ghost" href="/patches/${patchSlug(older.id)}">← Patch ${esc(older.id)}</a>` : '<span></span>'}${newer ? `<a class="btn btn-ghost" href="/patches/${patchSlug(newer.id)}">Patch ${esc(newer.id)} →</a>` : ''}</div>
    <p class="note">${L('Quelle: offizielle Patchnotes von Riot Games, für euch übersichtlich aufbereitet. Im Zweifel gilt das', 'Source: official patch notes by Riot Games, neatly prepared for you. If in doubt, the')} <a href="${esc(p.url)}" target="_blank" rel="noopener">${L('Original bei Riot', 'original at Riot applies')}</a>.</p>`;
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
// Bekannte Termine (Patch-Plan des Sets, data/patch-kommentare.js → TFT_PATCH_SCHEDULE) haben Vorrang vor der Schätzung.
const ST_PATCH = TL_PATCH || (CURRENT_PATCH ? CURRENT_PATCH.id : '');
// Uhrzeit in deutscher Zeit (Sommer-/Winterzeit automatisch) → echter Zeitpunkt, egal wo der Besucher ist
function berlinTime(y, mo, d, h, mi){
  const guess = Date.UTC(y, mo - 1, d, h, mi);
  const off = (()=>{ try { const p = new Intl.DateTimeFormat('en-US', {timeZone:'Europe/Berlin', timeZoneName:'shortOffset'}).formatToParts(new Date(guess)).find(x=>x.type==='timeZoneName').value.match(/GMT([+-]\d+)/); return p ? +p[1] : 1; } catch(e){ return 1; } })();
  return new Date(guess - off * 36e5);
}
// Alle bekannten Patch-Termine, nach Zeit sortiert: Patch-Plan des Sets (data/custom-<Set>.js → cheats.patchSchedule, Quelle Little Buddy Bot,
// nur das Datum → 4:30 Uhr) und Termine aus data/patch-kommentare.js (mit Uhrzeit, haben Vorrang). ev = Ereignisse [deutsch, englisch]
function stPatchDates(){
  const at = s => { const m = String(s).match(/^(\d{4})-(\d\d)-(\d\d)(?:[ T](\d\d):(\d\d))?/); return m ? berlinTime(+m[1], +m[2], +m[3], +(m[4]||4), +(m[5]||30)) : null; };
  const ps = (TFT_CUSTOM_SET.cheats || {}).patchSchedule, out = {};
  ((ps && ps.rows) || []).forEach(r=>{ const d = at(r[1]); if(d) out[r[0]] = {id:r[0], d, ev:[r[2] || [], r[3] || []]}; });
  Object.entries(window.TFT_PATCH_SCHEDULE || {}).forEach(([id, s])=>{ const d = at(s); if(d) out[id] = {ev:[[], []], ...out[id], id, d}; });
  return Object.values(out).sort((a,b)=>a.d - b.d);
}
function stNextPatch(){
  const now = new Date(), fixed = stPatchDates().find(x=>x.d > now);
  if(fixed) return {...fixed, fixed:true};
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
  if(d && d.regions && Object.keys(d.regions).length){ ST_CUT = d; ST_CUT_LIVE = true; renderStatBar(); sbCount(false);
    if(ND){ document.querySelectorAll('#dshApp .dsh-lp .sb-dot').forEach(e=>{ e.classList.add('live'); e.title = L('Live-Daten', 'Live data'); }); dshCount(false); } }
}).catch(()=>{});
const fmtLP = v => v.toLocaleString(LOC) + ' LP';
// LP-Zahlen hochzählen lassen: beim Öffnen der Startseite von 0, bei neuen Live-Daten vom alten zum neuen Wert
const sbShown = {};
function sbCount(fromZero){
  const els = [...document.querySelectorAll('#statBar [data-lp]')];
  if(!els.length || !$('#statBar').offsetParent) return;
  const still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const jobs = els.map(el=>({el, key:el.dataset.key, to:+el.dataset.lp, from:fromZero ? 0 : (sbShown[el.dataset.key] ?? +el.dataset.lp)}));
  jobs.forEach(j=>{ sbShown[j.key] = j.to; });
  if(still){ jobs.forEach(j=>{ j.el.textContent = fmtLP(j.to); }); return; }
  const t0 = performance.now(), dur = 1400, ease = x => 1 - Math.pow(1 - x, 3);
  clearInterval(sbCount.timer);
  jobs.forEach(j=>{ j.el.textContent = fmtLP(j.from); });
  sbCount.timer = setInterval(()=>{
    const k = Math.max(0, Math.min(1, (performance.now() - t0) / dur));   // Fortschritt 0 … 1 (nie negativ)
    jobs.forEach(j=>{ j.el.textContent = fmtLP(Math.round(j.from + (j.to - j.from) * ease(k))); });
    if(k >= 1) clearInterval(sbCount.timer);
  }, 16);
}
// Leiste oben: LP-Grenzen für Challenger und Großmeister (EUW) und der nächste Patch
function renderStatBar(){
  const el = $('#statBar'); if(!el) return;
  const cut = stCut('euw'), dot = `<i class="sb-dot${ST_CUT_LIVE ? ' live' : ''}" title="${ST_CUT_LIVE ? 'Live' : 'Gespeicherter Stand'}"></i>`;
  el.innerHTML = `<div class="wrap sb-in">
    ${cut ? `<a class="sb-main" href="/ranks/challenger"><img src="${rankImg(rankBy.challenger)}" alt="" width="40" height="40"><span class="sb-num"><b data-lp="${cut.ch}" data-key="ch" data-noi18n>${fmtLP(sbShown.ch ?? cut.ch)}</b><small>${dot}Challenger · EUW</small></span></a>
    <a class="sb-main" href="/ranks/grandmaster"><img src="${rankImg(rankBy.grandmaster)}" alt="" width="40" height="40"><span class="sb-num"><b data-lp="${cut.gm}" data-key="gm" data-noi18n>${fmtLP(sbShown.gm ?? cut.gm)}</b><small>${dot}Großmeister · EUW</small></span></a>` : ''}
    ${ST_PATCH ? `<a class="sb-item sb-hide" href="${COUNTDOWN_PATH}" title="${L('Nächster Patch', 'Next patch')}: ${esc(stNextLabel())}"><span class="sb-patch">${esc(ST_PATCH)}</span><span><small>Nächster Patch in</small><b data-countdown>${stCountdown()}</b></span></a>` : ''}</div>`;
  el.hidden = !cut && !ST_PATCH;
}
setInterval(()=>document.querySelectorAll('[data-countdown]').forEach(e=>{ e.textContent = stCountdown(); }), 60000);

/* ================= PATCH-COUNTDOWN (/tft-patch-countdown) ================= */
// Eigene Seite für „TFT next patch countdown“: Countdown auf die Sekunde bis zum nächsten Patch, Termin in deutscher Zeit und in der
// Zeit des Besuchers, Fortschritt des laufenden Patches, alle Termine des Sets (stPatchDates) und Fragen & Antworten für Google.
let CD_NEXT = null, CD_PREV = null, CD_TIMER = 0;
const cdDay = (d, o) => d.toLocaleDateString(LOC, {timeZone:'Europe/Berlin', ...o});
// Abstand in Kalendertagen (deutsche Zeit): „heute“, „morgen“, „in 9 Tagen“ bzw. negativ = seit wie vielen Tagen
const cdYmd = d => { const [y, m, t] = d.toLocaleDateString('en-CA', {timeZone:'Europe/Berlin'}).split('-').map(Number); return Date.UTC(y, m - 1, t); };
const cdDiff = d => Math.round((cdYmd(d) - cdYmd(new Date())) / 864e5);
const cdDays = d => { const n = cdDiff(d); return n <= 0 ? L('heute', 'today') : n === 1 ? L('morgen', 'tomorrow') : L(`in ${n} Tagen`, `in ${n} days`); };
function renderCountdown(){
  const app = $('#cdApp'); if(!app) return;
  const now = new Date(), all = stPatchDates(), n = CD_NEXT = stNextPatch(), S = TFT_DATA.set;
  const prev = CD_PREV = [...all].reverse().find(x=>x.d <= now) || (n && {id:CURRENT_PATCH ? CURRENT_PATCH.id : '', d:new Date(n.d - 14 * 864e5)});
  const notes = id => patchBySlug[patchSlug(id)] ? '/patches/' + patchSlug(id) : '';
  const id = n && n.id, long = n ? cdDay(n.d, {weekday:'long', day:'numeric', month:'long', year:'numeric'}) : '';
  const time = n ? n.d.toLocaleTimeString(LOC, {hour:'2-digit', minute:'2-digit', timeZone:'Europe/Berlin'}) : '';
  const tz = n ? (new Intl.DateTimeFormat('en-GB', {timeZone:'Europe/Berlin', timeZoneName:'short'}).formatToParts(n.d).find(p=>p.type==='timeZoneName') || {}).value || 'CET' : '';
  // Uhrzeit beim Besucher, wenn sie von der deutschen abweicht
  const fmtL = o => n.d.toLocaleString(LOC, {weekday:'short', day:'numeric', month:'short', hour:'2-digit', minute:'2-digit', ...o});
  const local = n && fmtL({}) !== fmtL({timeZone:'Europe/Berlin'}) ? fmtL({}) : '';
  const ev = n && n.ev ? L(n.ev[0], n.ev[1]) || [] : [];
  // nächstes Set: erster Patch x.1 eines höheren Sets im Patch-Plan
  const ns = all.find(x=>x.d > now && /^\d+\.1$/.test(x.id) && +x.id.split('.')[0] > S), nsN = ns && ns.id.split('.')[0];
  const nsLong = ns ? cdDay(ns.d, {day:'numeric', month:'long', year:'numeric'}) : '';
  const cur = CURRENT_PATCH, links = [
    cur && [notes(cur.id), L(`Patchnotes ${cur.id}`, `Patch notes ${cur.id}`), L('Alle Änderungen des aktuellen Patches', 'Every change of the current patch')],
    [csHref('patch-schedule'), L('Patch-Plan', 'Patch schedule'), L('Alle Termine als Tabelle im Cheatsheet', 'Every date as a table in the cheatsheet')],
    ['/tierlist', L('TFT Tierlist', 'TFT Tier List'), L('Die besten Comps bis zum Patch', 'The best comps until the patch')],
    ['/patches', L('Alle Patches', 'All patches'), L(`Jede Änderung seit Set ${S - 1}`, `Every change since Set ${S - 1}`)]].filter(x=>x && x[0]);
  const row = x => {
    const st = x === n || (n && x.id === n.id) ? 'next' : x === prev ? 'cur' : x.d <= now ? 'past' : 'later', href = notes(x.id), e = L(x.ev[0], x.ev[1]) || [];
    const tag = st === 'next' ? `<em class="cd-tag">${L('Nächster', 'Next')}</em>` : st === 'cur' ? `<em class="cd-tag live">${L('Läuft gerade', 'Live now')}</em>` : '';
    const right = st === 'past' || st === 'cur' ? (href ? `<a href="${href}">${L('Patchnotes', 'Patch notes')} →</a>` : '') : `<span>${cdDays(x.d)}</span>`;
    return `<li class="cd-row ${st}"><span class="cd-id">${esc(x.id)}</span><span class="cd-rd"><b>${esc(cdDay(x.d, {weekday:'short', day:'numeric', month:'short'}))}</b>${tag}${e.length ? `<small>${e.map(esc).join(' · ')}</small>` : ''}</span><span class="cd-rs">${right}</span></li>`;
  };
  app.innerHTML = `<div class="page-head"><div class="crumb"><a href="/">Home</a> / <a href="/patches">Patches</a> / Countdown</div>
      <h1>${L('TFT Patch <em class="serif">Countdown</em>', 'TFT Next Patch <em class="serif">Countdown</em>')}</h1></div>
    ${n ? `<section class="cd-card" aria-label="${L('Countdown bis zum nächsten Patch', 'Countdown to the next patch')}"${cur && cur.img ? ` style="--img:url('${esc(cur.img)}?w=1280&fm=webp');--pos:${esc(patchFocus(cur))}"` : ''}>
      <div class="cd-top"><span class="cd-badge">${id ? `<small>Patch</small><b>${esc(id)}</b>` : '<b>TFT</b>'}</span>
        <span class="cd-tt"><b>${id ? L(`Patch ${id} kommt in`, `Patch ${id} drops in`) : L('Der nächste Patch kommt in', 'The next patch drops in')}</b><small>${n.fixed ? L(`Termin laut Patch-Plan von Set ${S}`, `Date from the Set ${S} patch schedule`) : L('Termin geschätzt: Mittwoch, zwei Wochen nach dem letzten Patch', 'Estimated date: Wednesday, two weeks after the last patch')}</small></span></div>
      <div class="cd-clock" role="timer">${[['d', 'Tage', 'Days'], ['h', 'Stunden', 'Hours'], ['m', 'Minuten', 'Minutes'], ['s', 'Sekunden', 'Seconds']].map(([k, de, en])=>`<div class="cd-u"><b data-cd="${k}">00</b><small>${L(de, en)}</small></div>`).join('')}</div>
      <p class="cd-when"><b>${esc(long)}</b><span>${L(`ca. ${time} Uhr deutscher Zeit`, `around ${time} ${tz}`)}</span>${local ? `<span>${L('Bei dir', 'Your time')}: ${esc(local)}</span>` : ''}</p>
      ${ev.length ? `<ul class="cd-ev">${ev.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>` : ''}
      ${prev ? `<div class="cd-prog"><div class="cd-pl"><span>${prev.id ? L(`Patch ${esc(prev.id)} läuft`, `Patch ${esc(prev.id)} has been live`) : L('Aktueller Patch', 'Current patch')} <i data-cd="ago"></i></span><b data-cd="pct"></b></div><div class="cd-bar"><i data-cd="bar"></i></div></div>` : ''}
    </section>` : viSays(L('Für den nächsten Patch gibt es noch keinen Termin. Schau bald wieder vorbei!', 'There is no date for the next patch yet. Check back soon!'))}
    <div class="cd-grid">
      ${all.length ? `<section class="cd-box cd-list"><h2>${L(`Alle Patch-Termine von Set ${S}`, `Every patch date of Set ${S}`)}</h2><ol>${all.map(row).join('')}</ol>
        <p class="cd-src">${L(`Termine: ${esc((TFT_CUSTOM_SET.cheats || {}).patchSchedule ? TFT_CUSTOM_SET.cheats.patchSchedule.src : 'Riot Games')}. Die Uhrzeit ist geschätzt und gilt für die europäischen Server.`, `Dates: ${esc((TFT_CUSTOM_SET.cheats || {}).patchSchedule ? TFT_CUSTOM_SET.cheats.patchSchedule.src : 'Riot Games')}. The time is an estimate for the European servers.`)}</p></section>` : ''}
      <div class="cd-side">
        ${ns ? `<section class="cd-box cd-set"><small>${L('Neues Set', 'New set')}</small><h2>${L(`Countdown bis Set ${nsN}`, `Countdown to Set ${nsN}`)}</h2><b class="cd-setn">${esc(cdDays(ns.d))}</b><p>${L(`Set ${nsN} startet laut Patch-Plan mit Patch ${esc(ns.id)} am ${esc(nsLong)}.`, `According to the patch schedule, Set ${nsN} launches with patch ${esc(ns.id)} on ${esc(nsLong)}.`)}</p></section>` : ''}
        <nav class="cd-box cd-links" aria-label="${L('Rund um den Patch', 'All about the patch')}"><h2>${L('Rund um den Patch', 'All about the patch')}</h2>${links.map(([h, t, d])=>`<a href="${h}"><b>${t}</b><small>${d}</small></a>`).join('')}</nav>
      </div>
    </div>
    <section class="tool-seo" aria-labelledby="ts-cd">
      <div class="ts-main">
        <h2 id="ts-cd">${L('So funktioniert der TFT Patch Countdown', 'How the TFT patch countdown works')}</h2>
        <p>${L(`Riot bringt etwa alle zwei Wochen einen neuen Patch für Teamfight Tactics. Der Countdown zählt bis zum nächsten Termin aus dem Patch-Plan von Set ${S} herunter – auf die Sekunde genau. Lebst du nicht in Deutschland, siehst du die Uhrzeit zusätzlich in deiner eigenen Zeitzone.`,
          `Riot releases a new Teamfight Tactics patch about every two weeks. The countdown runs to the next date from the Set ${S} patch schedule – down to the second. If you don't live in Central Europe, you also see the time in your own time zone.`)}</p>
        <p>${L('Ein Patch verschiebt oft die ganze Tierlist. Nutz die Zeit bis dahin, um mit den aktuellen Comps noch LP mitzunehmen. Sobald die Patchnotes da sind, findest du alle Änderungen bei uns übersichtlich aufbereitet.',
          'A patch often shifts the whole tier list. Use the time until then to climb with the current comps. As soon as the patch notes are out, you\'ll find every change neatly prepared on our site.')}</p>
      </div>
      <aside class="ts-side">
        <h3>${L('Häufige Fragen', 'FAQ')}</h3>
        ${n ? `<details><summary>${L('Wann kommt der nächste TFT Patch?', 'When is the next TFT patch?')}</summary><p>${id ? L(`Patch ${esc(id)} kommt ${n.fixed ? '' : 'voraussichtlich '}am ${esc(long)}. Auf den europäischen Servern geht ein Patch meist früh am Morgen live, der Countdown zählt bis ca. ${time} Uhr deutscher Zeit.`,
          `Patch ${esc(id)} ${n.fixed ? 'drops' : 'is expected to drop'} on ${esc(long)}. On the European servers a patch usually goes live early in the morning; the countdown runs to around ${time} ${tz}.`)
          : L(`Voraussichtlich am ${esc(long)}, etwa um ${time} Uhr deutscher Zeit.`, `Probably on ${esc(long)}, around ${time} ${tz}.`)}</p></details>` : ''}
        <details><summary>${L('Wie oft kommt ein neuer TFT Patch?', 'How often is there a new TFT patch?')}</summary><p>${L('Etwa alle zwei Wochen. Dazwischen gibt es manchmal kleine B- oder C-Patches, die einzelne Champions, Traits oder Augments schnell anpassen.', 'About every two weeks. In between there are sometimes small B- or C-patches that quickly adjust single champions, traits or augments.')}</p></details>
        <details><summary>${L('Wann kommen die TFT Patchnotes?', 'When do the TFT patch notes come out?')}</summary><p>${L('Riot veröffentlicht die Patchnotes meist einen Tag vor dem Patch. Sobald sie da sind, stehen alle Änderungen bei uns unter Patches.', 'Riot usually publishes the patch notes one day before the patch. As soon as they are out, you\'ll find every change on our patches page.')}</p></details>
        ${ns ? `<details><summary>${L(`Wann startet TFT Set ${nsN}?`, `When does TFT Set ${nsN} launch?`)}</summary><p>${L(`Laut Patch-Plan startet Set ${nsN} mit Patch ${esc(ns.id)} am ${esc(nsLong)}.`, `According to the patch schedule, Set ${nsN} launches with patch ${esc(ns.id)} on ${esc(nsLong)}.`)}</p></details>` : ''}
      </aside>
    </section>`;
  clearInterval(CD_TIMER); CD_TIMER = n ? setInterval(cdTick, 1000) : 0;
  if(n) cdTick();
}
// jede Sekunde: Countdown, Fortschritt des laufenden Patches und Tage bis zum neuen Set; nur solange die Seite offen ist
function cdTick(){
  const pg = $('#page-countdown'), n = CD_NEXT;
  if(!pg || !pg.classList.contains('active') || !n){ clearInterval(CD_TIMER); CD_TIMER = 0; return; }
  const now = Date.now(), ms = n.d - now;
  if(ms <= 0){ renderCountdown(); setMeta('countdown'); h1Sync(); return; }   // Patch ist live → Countdown zum nächsten
  const set = (k, v) => { const e = pg.querySelector(`[data-cd="${k}"]`); if(e && e.textContent !== v) e.textContent = v; };
  set('d', String(Math.floor(ms / 864e5)).padStart(2, '0')); set('h', String(Math.floor(ms % 864e5 / 36e5)).padStart(2, '0'));
  set('m', String(Math.floor(ms % 36e5 / 6e4)).padStart(2, '0')); set('s', String(Math.floor(ms % 6e4 / 1e3)).padStart(2, '0'));
  const p = CD_PREV; if(p){
    const k = Math.max(0, Math.min(1, (now - p.d) / (n.d - p.d))), ago = -cdDiff(p.d);
    set('pct', Math.floor(k * 100) + L(' %', '%')); set('ago', ago < 1 ? L('seit heute', 'since today') : ago === 1 ? L('seit 1 Tag', 'for 1 day') : L(`seit ${ago} Tagen`, `for ${ago} days`));
    const bar = pg.querySelector('[data-cd="bar"]'); if(bar) bar.style.width = (k * 100).toFixed(2) + '%';
  }
}
/* ================= CHEATSHEET (/cheatsheet) ================= */
// Alle Systemwerte des Sets auf einer Seite: Shop & XP, Augment-Stufen, Encounters, Schaden, Orbs, Embleme (Karussell vorerst ausgeblendet).
// Werte aus data/custom-<Set>.js (shop, loot, encounters, cheats) und den offiziellen Set-Daten (Emblem-Rezepte).
const CS = TFT_CUSTOM_SET.cheats || {};
const CS_SHOW_CAROUSEL = false;
const csPct = p => fmtNum(Math.round(p * 10) / 10) + L(' %', '%');
const csTable = (head, rows, cls='') => `<div class="cs-wrap"><table class="cs-table ${cls}"><thead><tr>${head.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
const csSrc = s => s && !/little buddy/i.test(s) ? `<p class="cs-src">${L('Quelle', 'Source')}: ${esc(s)}</p>` : '';   // Little Buddy Bot wird nicht als Quelle genannt
const CS_AUG = {S:['s', 'Silber', 'Silver'], G:['g', 'Gold', 'Gold'], P:['p', 'Prismatisch', 'Prismatic']};
// Spielnahe Darstellung (Vorbild: Little Buddy Bot): große Zahlen, Kostenfarben als Schrift, Symbole statt Fließtext, Einheit direkt am Wert
// Offizielle Riot-Symbole (assets/icons/tft, aus den Spieldaten über CommunityDragon): Gold, Reroll, XP, Ambosse, Beutekugeln
const TI = k => `assets/icons/tft/${k}.png`;
const csIc = (src, n, title, cls='') => `<span class="csx-ic ${cls}" title="${esc(title)}"><img src="${src}" alt="${esc(title)}" width="40" height="40" loading="lazy">${n != null && n !== '' && n !== 1 ? `<b>×${n}</b>` : ''}</span>`;
const csCoin = n => +n === 0 ? '<span class="csx-none">–</span>' : csIc(TI('gold'), '' + n, n + ' Gold', 'gold');   // Gold zeigt die Anzahl immer, auch ×1
// Zufällige Champions: Riots Champion-Kugel in der Kostenfarbe (wie im Spiel); zufällige Komponenten: Riots Item-Symbol
const csChamp = (c, n) => csIc(TI('champ-' + c), n, (n > 1 ? n + ' ' : '') + L(`zufällige ${c}-Kosten-Champions`, `random ${c}-cost champions`), 'chorb');
const csComp = n => csIc(TI('orb-blue'), '' + n, n + ' ' + L('Komponenten-Kugeln (je eine zufällige Komponente)', 'component orbs (one random component each)'), 'corb');   // Riots Symbol: so sehen Komponenten-Orbs im Spiel aus
const CS_ORB = {s:['Grauer Orb', 'Gray orb'], b:['Blauer Orb', 'Blue orb'], g:['Gold-Orb', 'Gold orb'], p:['Prismatischer Orb', 'Prismatic orb']};
// Beutekugeln: eigene Grafiken (assets/icons/tft/lootorb-*.webp) – Riot hat für Grau und Gold nur Platzhalter
const CS_ORB_IMG = {s:'gray', b:'blue', g:'gold', p:'prism'};
const csOrb = (k, n, always) => csIc(TI('lootorb-' + CS_ORB_IMG[k]).replace('.png', '.webp'), n > 1 || (always && n) ? '' + n : '', (n > 1 ? n + '× ' : '') + L(CS_ORB[k][0], CS_ORB[k][1]), 'orb o-' + k);
const CS_ANVIL = {component:['Komponentenschmiede', 'Component anvil'], completed:['Gegenstandsschmiede', 'Completed item anvil'], artifact:['Artefaktschmiede', 'Artifact anvil']};
const csSpatPan = () => { const a = itemById.DA_Component_Spatula, b = itemById.DA_Component_FryingPan; return a && b ? `<span class="csx-ic sp" title="${L('Pfannenwender oder Bratpfanne', 'Spatula or Frying Pan')}"><img src="${a.img}" alt="" width="40" height="40" loading="lazy"><img class="sp2" src="${b.img}" alt="" width="40" height="40" loading="lazy"></span>` : ''; };
const csAnvil = (k, n) => csIc(TI('anvil-' + k), n, L(CS_ANVIL[k][0], CS_ANVIL[k][1]), 'anvil a-' + k);// Encounter-Champions: Bild aus den Set-Daten, sonst das LoL-Porträt von Data Dragon (fehlt es, bleibt das Feld leer)
const CS_DD = {LeBlanc:'Leblanc', "Kai'Sa":'Kaisa', "Rek'Sai":'RekSai', "Kha'Zix":'Khazix', "Cho'Gath":'Chogath', "Vel'Koz":'Velkoz', "Kog'Maw":'KogMaw', Wukong:'MonkeyKing'};
const csChampPic = n => n ? (champImg(n) || `https://ddragon.leagueoflegends.com/cdn/16.20.1/img/champion/${CS_DD[n] || n.replace(/[^A-Za-z]/g, '')}.png`) : '';
// Augment-Baum (Cheatsheet und Augment-Vorhersage): Start → 2-1 → 3-2 → 4-2 mit den Chancen aus CS.augments
function atgTreeHTML(){
  const seq = CS.augments.seq, W = seq.reduce((s, x)=>s + x[1], 0), sum = p => seq.filter(x=>x[0].startsWith(p)).reduce((s, x)=>s + x[1], 0);
  // Baum: Start → 2-1 → 3-2 → 4-2. An den Linien die Chance, wenn es bis dahin so kam; unter den Blättern die Chance für genau diese Reihenfolge.
  // Klick auf ein Augment (2-1, dann 3-2) zeigt nur noch diesen Ast und rechnet die Blatt-Prozente auf diese Lage um (Vorhersage)
  const leaves = [], gap = 1.6;   // zusätzlicher Abstand zwischen den drei Ästen (in Blattbreiten)
  for(const p1 of 'SGP'){ if(!sum(p1)) continue; if(leaves.length) leaves.push(null);
    for(const p2 of 'SGP') for(const p3 of 'SGP'){ const x = seq.find(s=>s[0]===p1 + p2 + p3); if(x) leaves.push(x[0]); } }
  const slots = leaves.length + (gap - 1) * leaves.filter(v=>v===null).length, VW = 1000, padL = 84, padR = 26, step = (VW - padL - padR) / (slots - 1);
  const X = {}; let pos = 0; leaves.forEach(k=>{ if(k===null){ pos += gap; return; } X[k] = padL + pos * step; pos++; });
  const avg = ks => ks.reduce((s, k)=>s + X[k], 0) / ks.length;
  for(const len of [2, 1]) seq.map(s=>s[0].slice(0, len)).forEach(p=>{ if(X[p]===undefined) X[p] = avg(Object.keys(X).filter(k=>k.length===len + 1 && k.startsWith(p))); });
  X[''] = avg(['S','G','P'].filter(k=>X[k]!==undefined));
  const Y = [44, 160, 280, 398], R = [34, 27, 24, 22], VH = 452;   // flach und breit
  const hex = (cx, cy, r) => [0,1,2,3,4,5].map(i=>{ const an = Math.PI / 180 * (60 * i - 90); return (cx + r * Math.cos(an)).toFixed(1) + ',' + (cy + r * Math.sin(an)).toFixed(1); }).join(' ');
  const fmtP = p => (p > 0 && p < 1 ? '<1' : Math.round(p)) + '%';   // ganze Prozent wie bei Little Buddy Bot
  const node = k => { const lv = k.length, l = k.slice(-1) || 'R', cx = X[k], cy = Y[lv], r = R[lv], w = k ? sum(k) : W;
    return `<g class="atg-n atg-${l}${lv===3 ? ' atg-leaf' : ''}${lv && lv < 3 ? ' atg-pick' : ''}" data-k="${k}" data-w="${w}"><polygon class="atg-h" points="${hex(cx, cy, r)}"/><polygon class="atg-i" points="${hex(cx, cy, r - 5)}"/><text x="${cx}" y="${cy}" dy=".35em">${k ? l : 'Start'}</text>${lv===3 ? `<text class="atg-p" x="${cx}" y="${cy + r + 27}" data-t="${fmtP(w / W * 100)}">${fmtP(w / W * 100)}</text>` : ''}</g>`; };
  const keys = [''].concat([1, 2, 3].flatMap(len=>[...new Set(seq.map(s=>s[0].slice(0, len)))]).filter(k=>X[k]!==undefined));
  const edge = k => { const p = k.slice(0, -1), lv = k.length, x1 = X[p], y1 = Y[lv - 1] + R[lv - 1], x2 = X[k], y2 = Y[lv] - R[lv], pc = sum(k) / (p ? sum(p) : W) * 100;
    const mx = x1 + (x2 - x1) * .5, my = y1 + (y2 - y1) * .5, dx = Math.abs(x2 - x1) < 2 ? 0 : (x2 < x1 ? -16 : 16);
    return `<g class="atg-e" data-k="${k}"><line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/><text x="${mx + dx}" y="${my}" dy=".35em">${Math.round(pc)}</text></g>`; };
  const rows = [['2-1', 1], ['3-2', 2], ['4-2', 3]].map(([st, lv])=>`<g class="atg-row"><rect x="0" y="${Y[lv] - 15}" width="58" height="30" rx="8"/><text x="29" y="${Y[lv]}" dy=".35em">${st}</text></g>`).join('');
  const tree = `<svg class="atg" viewBox="0 0 ${VW} ${VH}" role="img" aria-label="${L('Augment-Baum', 'Augment tree')}" data-tw="${W}"><defs><linearGradient id="atgP" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5eead4"/><stop offset=".5" stop-color="#818cf8"/><stop offset="1" stop-color="#f0abfc"/></linearGradient></defs>${rows}${keys.filter(k=>k).map(edge).join('')}${keys.map(node).join('')}</svg>`;
  const legend = `<div class="atg-leg">${[['S', L('Silber', 'Silver')], ['G', 'Gold'], ['P', L('Prismatisch', 'Prismatic')]].map(([l, n])=>`<span><svg viewBox="0 0 24 24" class="atg-n atg-${l}"><polygon class="atg-h" points="${hex(12, 12, 10)}"/></svg>${n}</span>`).join('')}<small>${L('Klick dein Augment auf 2-1 und 3-2 an – der Baum zeigt, was als Nächstes kommt. Alle Zahlen in %.', 'Click your augment on 2-1 and 3-2 – the tree shows what comes next. All numbers in %.')}</small></div>`;
  return {tree, legend};
}
function csSections(){
  const out = [];
  const pctI = p => Math.round(p) + L(' %', '%');   // ganze Prozent für bedingte Chancen
  if(SHOP){
    // Shop-Chancen, Pool-Größen und XP in einer Tabelle: Kosten als farbige Schrift, die wahrscheinlichsten Kosten pro Level fett,
    // XP bis zum nächsten Level zwischen den Zeilen. Level 8 vorausgewählt; Klick markiert eine andere Zeile
    const lv = SHOP.odds.map((r, i)=>[i + 1, r]).filter(([l])=>l >= 3 && l <= 10);
    const colMax = [0,1,2,3,4].map(c=>Math.max(...lv.map(([, r])=>r[c])));
    const head = `<tr class="cso-bag"><th></th><th></th>${[1,2,3,4,5].map(c=>`<th class="t${c}"><b>${SHOP.bag[c-1]} ${L('Kopien', 'copies')}</b><small>${SHOP_DISTINCT[c-1]} Champions</small></th>`).join('')}</tr>
      <tr class="cso-h"><th class="cso-xp"><img class="cso-xpi" src="${TI('xp')}" alt="" width="22" height="22">XP</th><th>Level</th>${[1,2,3,4,5].map(c=>`<th><span class="cso-k k${c}">${c}<span class="hm-k">${L('-Kosten', '-cost')}</span></span></th>`).join('')}</tr>`;
    const rows = lv.map(([l, r])=>{ const mx = Math.max(...r), xp = (SHOP.xp || [])[l - 1];
      return `<tr class="${l===8 ? 'sel' : ''}"><td class="cso-xp">${xp ? `<span>+${xp}</span>` : ''}</td><td class="cso-lv">Level ${l}</td>${r.map((o, c)=>o ? `<td class="t${c+1}${o===mx ? ' top' : ''}" style="--o:${(0.5 + o / colMax[c] * 0.5).toFixed(2)}">${o}${L(' %', '%')}</td>` : '<td class="cso-0">–</td>').join('')}</tr>`; }).join('');
    out.push(['shop', L('Shop-Chancen, Pool & XP', 'Shop odds, pool & XP'), `<div class="cs-wrap"><table class="cs-table cs-hm cso"><thead>${head}</thead><tbody>${rows}</tbody></table></div>
      <p class="cs-note cs-after">${L('Chance pro Shop-Slot. Fett: die wahrscheinlichsten Kosten auf diesem Level. Die Zahl zwischen zwei Levels ist die XP bis zum nächsten Level – jede Runde gibt es 2 XP gratis, 4 Gold kaufen 4 XP. Treffer-Chancen rechnet der', 'Chance per shop slot. Bold: the most likely cost at that level. The number between two levels is the XP to the next level – you get 2 free XP every round, 4 gold buys 4 XP. Hit chances are in the')} <a href="/tools/tft-rolldown-rechner">${L('Rolldown-Rechner', 'rolldown calculator')}</a>.</p>`]);
  }
  if(CS.augments){
    // Baum wie im Spiel: 1. Augment → 2. Augment (Chance, wenn das 1. so kam) → 3. Augment → Chance für genau diese Reihenfolge
    const seq = CS.augments.seq, W = seq.reduce((s, x)=>s + x[1], 0), sum = p => seq.filter(x=>x[0].startsWith(p)).reduce((s, x)=>s + x[1], 0);
    const tier = (l, p) => `<span class="csa-t ${CS_AUG[l][0]}"><b>${pctI(p)}</b> ${L(CS_AUG[l][1], CS_AUG[l][2])}</span>`;
    let cells = '', row = 2;   // Zeile 1 = Kopf
    for(const a of 'SGP'){ const wa = sum(a); if(!wa) continue; const ra = row;
      for(const b of 'SGP'){ const wb = sum(a + b); if(!wb) continue; const rb = row;
        for(const c of 'SGP'){ const x = seq.find(s=>s[0]===a + b + c); if(!x) continue;
          cells += `<div class="csa-c csa-3 ${CS_AUG[c][0]}" style="grid-row:${row}">${tier(c, x[1] / wb * 100)}</div><div class="csa-c csa-p" style="grid-row:${row}">${pctI(x[1] / W * 100)}</div>`; row++; }
        cells += `<div class="csa-c csa-2 ${CS_AUG[b][0]}" style="grid-row:${rb} / ${row}">${tier(b, wb / wa * 100)}</div>`; }
      cells += `<div class="csa-c csa-1 ${CS_AUG[a][0]}" style="grid-row:${ra} / ${row}">${tier(a, wa / W * 100)}</div>`; }
    const prism = seq.filter(x=>x[0].includes('P')).reduce((s, x)=>s + x[1], 0) / W * 100;
    const headRow = [[L('1. Augment', '1st augment'), '2-1'], [L('2. Augment', '2nd augment'), '3-2'], [L('3. Augment', '3rd augment'), '4-2'], [L('Chance', 'Odds'), '']].map(([t, s], i)=>`<div class="csa-h" style="grid-column:${i + 1}">${t}${s ? ` <small>${s}</small>` : ''}</div>`).join('');
    const {tree, legend} = atgTreeHTML();
    out.push(['augments', L('Augment-Stufen (2-1 · 3-2 · 4-2)', 'Augment tiers (2-1 · 3-2 · 4-2)'), `<div class="cst-tree">${legend}${tree}</div><div class="cst-table cs-wrap"><div class="csa">${headRow}${cells}</div></div>
      <p class="cs-note cs-after">${L('Mindestens ein prismatisches Augment pro Partie', 'At least one prismatic per game')}: <b>${csPct(prism)}</b> · ${L('Für deine Partie:', 'For your game:')} <a href="/tools/tft-augment-vorhersage">${L('Augment-Vorhersage', 'Augment prediction')} →</a></p>` + csSrc(CS.augments.src)]);
  }
  if(ENCS.length){
    const rows = [...ENCS].sort((a,b)=>b.w - a.w).map(e=>{ const src = csChampPic(e.ch);
      return `<div class="cse"><b class="cse-p">${pctI(e.w / ENC_W * 100)}</b><span class="cse-img"${e.ch ? ` title="${esc(e.ch)}"` : ''}>${src ? `<img src="${src}" alt="" width="44" height="44" loading="lazy" onerror="this.remove()">` : ''}</span><span class="cse-t"><b>${esc(e.n)}</b><small>${esc(EN ? e.en : e.de)}</small></span></div>`; }).join('');
    out.push(['encounters', L('Encounter-Chancen', 'Encounter odds'), `<div class="cse-grid">${rows}</div>`]);
  }
  if(CS.carousel && CS_SHOW_CAROUSEL){   // vorerst aus: Little Buddy Bot hat keine Karussell-Tabelle
    const list = a => a.map(x=>`<div class="cs-li"><b>${csPct(x[x.length-1])}</b><span>${typeof x[0]==='number' ? x[0] + ' ' + L('Champions', 'champions') : esc(L(x[0], x[1]))}</span></div>`).join('');
    const rows = CS.carousel.stages.map(s=>[`<b class="csc-st">${s.st}</b>`, list(s.size), list(s.ch), list(s.it)]);
    out.push(['carousel', L('Karussell', 'Carousel'), csTable(['Stage', L('Größe', 'Size'), 'Champions', 'Items'], rows, 'cs-top csc') + csSrc(CS.carousel.src)]);
  }
  if(CS.damage){
    const d = CS.damage.stage, s4 = d.find(x=>String(x[0])==='4');
    const list = d.map(([s, v])=>`<div class="csd-r"><span>Stage ${s}</span><b${v >= 100 ? ' class="hot"' : ''}>${v} <small>${L('Schaden', 'damage')}</small></b></div>`).join('');
    out.push(['damage', L('Spielerschaden', 'Player damage'), `<div class="csd"><div class="csx-card"><div class="csx-head"><img class="csx-hi" src="${TI('combat')}" alt="" width="26" height="26"><b>${L('Stage-Schaden', 'Stage damage')}</b><small>${L('fester Grundwert', 'fixed base value')}</small></div>${list}</div>
      <div class="csx-card csd-u"><div class="csx-head"><img class="csx-hi" src="${TI('champ')}" alt="" width="26" height="26"><b>${L('Units-Schaden', 'Unit damage')}</b><small>${L('kommt dazu', 'added on top')}</small></div><div class="csd-big">+1<small>${L('Schaden pro gegnerischer Unit, die den Kampf überlebt', 'damage per enemy unit that survives the fight')}</small></div>${s4 ? `<div class="csd-ex">${L('Beispiel', 'Example')}: Stage 4, ${L('3 Units übrig', '3 units left')} → <b>${s4[1]} + 3 = ${s4[1] + 3} ${L('Schaden', 'damage')}</b></div>` : ''}</div></div>` + csSrc(CS.damage.src)]);
  }
  const orbs = TFT_CUSTOM_SET.loot && TFT_CUSTOM_SET.loot.orbs;
  if(orbs){
    // Inhalt als Symbole: Gold als Münze, zufällige Champions in Kostenfarbe, bekannte Items als Bild, der Rest als kurzer Text
    const ALIAS = {'item-entferner':'DA_Consumable_ItemRemover', 'item remover':'DA_Consumable_ItemRemover', 'diebeshandschuhe':'DA_ThiefsGloves', 'kleiner duplikator':'DA_Consumable_LesserChampionDuplicator', 'lesser duplicator':'DA_Consumable_LesserChampionDuplicator', 'lichtgegenstand-glückstruhe':'DA_RadiantLuckyItemChest', 'radiant lucky chest':'DA_RadiantLuckyItemChest', 'meisterwerk-aufwertung':'DA_MasterworkUpgrade', 'masterwork upgrade':'DA_MasterworkUpgrade'};
    const part = p => { p = p.trim(); let m, n = 1;
      if((m = p.match(/^(\d+)\s*Gold$/i))) return csCoin(m[1]);
      if((m = p.match(/^(\d+)\s+(.+)$/)) && !/kosten|cost/i.test(m[2])){ n = +m[1]; p = m[2]; }   // „2 Komponenten-Ambosse“, „24 Meisterwerk-Aufwertungen“
      if(/^(pfannenwender oder bratpfanne|spatula or (frying )?pan)$/i.test(p)) return csSpatPan();
      if(/^(komponenten-ambosse?|component anvils?)$/i.test(p)) return csAnvil('component', n);
      if(/^(artefakt-ambosse?|artifact anvils?)$/i.test(p)) return csAnvil('artifact', n);
      if(/^(amboss|anvil)\s*\((fertig|fertiges item|completed( item)?)\)$/i.test(p)) return csAnvil('completed', n);
      if((m = p.match(/^(?:(\d+)\s+)?(?:zufällige[rn]?|random)\s+(\d)-(?:Kosten|costs?)(?:\s+champions?)?$/i))) return csChamp(m[2], +(m[1] || 1));
      const pl = p.toLowerCase(), it = itemById[ALIAS[pl]] || ITEMS.find(i=>[i.de, i.en, i.de0].some(x=>(x || '').toLowerCase()===pl));   // de0 = deutscher Name auf der englischen Seite
      return it ? csIc(it.img, n, EN ? it.en : it.de, 'item') : `<span class="csx-chip">${n > 1 ? n + '× ' : ''}${esc(p)}</span>`; };
    const card = o => { const k = o.orb || 'g', note = String(tr(o.note || '')).replace(/^ab /, L('ab ', 'from '));
      return `<div class="csx-card"><div class="csx-head">${csOrb(k, 1)}<b>${L(CS_ORB[k][0], CS_ORB[k][1])}</b><small>${esc(note)}${o.wert ? ' · ' + esc(o.wert) : ''}</small></div>${[...o.items].sort((a,b)=>b[1]-a[1]).map(([n, p])=>`<div class="csx-row"><b class="csx-p">${csPct(p)}</b><span class="csx-c">${String(tr(n)).split(/\s\+\s/).map(part).join('')}</span></div>`).join('')}</div>`; };
    const all = Object.values(orbs), small = all.filter(o=>'sb'.includes(o.orb)).map(card).join(''), big = all.filter(o=>!'sb'.includes(o.orb)).map(card).join('');
    const lg = (ic, txt) => `<span class="csx-lg">${ic}<span>${txt}</span></span>`;
    const legend = `<div class="csx-legend">${lg(csAnvil('component'), L(CS_ANVIL.component[0], CS_ANVIL.component[1]))}${lg(csAnvil('completed'), L(CS_ANVIL.completed[0], CS_ANVIL.completed[1]))}${lg(csAnvil('artifact'), L(CS_ANVIL.artifact[0], CS_ANVIL.artifact[1]))}${lg(csSpatPan(), L('Pfannenwender oder Bratpfanne', 'Spatula or Frying Pan'))}${lg(csChamp(4, 1), L('zufälliger Champion – Farbe = Kosten', 'random champion – colour = cost'))}</div>`;
    const html = (small ? `<div class="csx-grid csx-4 csx-compact">${small}</div>` : '') + `<div class="csx-grid csx-3 csx-compact"${small ? ' style="margin-top:10px"' : ''}>${big}</div>` + legend;
    out.push(['orbs', L('Loot-Orbs', 'Loot orbs'), `${html}<p class="cs-note cs-after">${L('Welche Komponente als Nächstes kommt, zeigt die', 'Which component drops next is shown in the')} <a href="/tools/tft-item-drop-chance">${L('Item-Drop-Chance', 'Item Drop Chance')}</a>.</p>` + csSrc(TFT_CUSTOM_SET.loot.orbSrc || TFT_CUSTOM_SET.loot.source)]);
  }
  // Beute aus den Creep-Runden pro Stage: [Silber, Blau, Gold, Prisma, Komponenten, Komponenten-Amboss, aufgewertet, Chance]
  const loot = TFT_CUSTOM_SET.loot;
  if(loot && loot.lbb){
    // Little Buddy Bot: [Komponenten-Kugeln, grau, blau, gold, prisma, Chance] – Anzahl immer am Symbol
    const row = r => `<div class="csx-row"><b class="csx-p">${r[5] < 1 ? fmtNum(r[5]) + L(' %', '%') : pctI(r[5])}</b><span class="csx-c">${r[0] ? csComp(r[0]) : ''}${['s','b','g','p'].map((k, i)=>r[i + 1] ? csOrb(k, r[i + 1], true) : '').join('')}</span></div>`;
    const html = Object.entries(loot.lbb.stages).map(([st, list])=>`<div class="csx-card"><div class="csx-head"><b>Stage ${st}</b><small>${L('PvE-Runden', 'PvE rounds')}</small></div>${[...list].sort((a,b)=>b[5]-a[5]).map(row).join('')}</div>`).join('');
    const legend = `<div class="csx-legend"><span class="csx-lg">${csComp(1)}<span>${L('Komponenten-Kugel', 'component orb')}</span></span>${['s','b','g','p'].map(k=>`<span class="csx-lg">${csOrb(k, 1)}<span>${L(CS_ORB[k][0], CS_ORB[k][1])}</span></span>`).join('')}</div>`;
    out.push(['loot', L('Loot-Verteilung pro Stage', 'Loot distribution per stage'), `<div class="csx-grid csx-loot csx-compact">${html}</div>${legend}<p class="cs-note cs-after">${L('Alle Spieler bekommen gleich viele und gleich gute Orbs, nur der Inhalt unterscheidet sich. Komponenten-Kugeln (mindestens 11, höchstens 15 pro Partie) sehen aus wie blaue Orbs.', 'All players get the same number and quality of orbs, only the contents differ. Component orbs (minimum 11, maximum 15 per game) look like blue orbs.')}</p>` + csSrc(loot.lbb.src)]);
  } else if(loot && loot.stages){
    const row = r => `<div class="csx-row${r[6] ? ' up' : ''}"><b class="csx-p">${csPct(r[7])}</b><span class="csx-c">${r[4] ? csComp(r[4]) : ''}${['s','b','g','p'].map((k, i)=>r[i] ? csOrb(k, r[i], true) : '').join('')}${r[5] ? csAnvil('component', r[5]) : ''}</span>${r[6] ? `<span class="csx-up" title="${L('aufgewertete Runde', 'upgraded round')}">★</span>` : ''}</div>`;
    const html = Object.entries(loot.stages).map(([st, list])=>`<div class="csx-card"><div class="csx-head"><b>Stage ${st}</b><small>${L('Creep-Runden', 'creep rounds')}</small></div>${[...list].sort((a,b)=>b[7]-a[7]).map(row).join('')}</div>`).join('');
    const up = loot.upgraded ? `<div class="csx-pills"><span>${L('Aufgewertete Runden pro Partie', 'Upgraded rounds per game')}</span>${loot.upgraded.map(([n, p])=>`<span class="csp-pill"><small>${esc(tr(n))}</small>${csPct(p)}</span>`).join('')}</div>` : '';
    out.push(['loot', L('Loot-Verteilung pro Stage', 'Loot distribution per stage'), `<div class="csx-grid csx-2">${html}</div>${up}<div class="csx-legend">${csComp(1)}<span>${L('Komponenten-Kugel', 'component orb')}</span>${['s','b','g','p'].map(k=>csOrb(k, 1) + `<span>${L(CS_ORB[k][0], CS_ORB[k][1])}</span>`).join('')}${csAnvil('component')}<span>${L(CS_ANVIL.component[0], CS_ANVIL.component[1])}</span><span class="csx-up">★</span><span>${L('aufgewertete Runde', 'upgraded round')}</span></div><p class="cs-note cs-after">${L('Aufgewertete Runden geben mehr Beute.', 'Upgraded rounds give more loot.')}${loot.late ? ' ' + L('Ab Stage 5', 'From Stage 5') + ': ' + esc(tr(loot.late)) : ''}</p>` + csSrc(loot.source)]);
  }
  if(CS.goldSub){
    const g0 = (CS.goldSub.from || 1) - 1, g1 = CS.goldSub.to || 8, stg = g => g.slice(g0, g1);
    const rows = [...CS.goldSub.rows].sort((a,b)=>b[0]-a[0]).map(([p, g])=>`<tr><td class="csg-p">${pctI(p)}</td>${stg(g).map(v=>`<td>${csCoin(v)}</td>`).join('')}</tr>`).join('');
    out.push(['gold-subscription', 'Gold Subscription', `<p class="cs-note">${L('Pro Partie wird eine Zeile ausgelost – das Gold kommt zu Beginn jeder Stage.', 'One row is rolled per game – the gold arrives at the start of each stage.')}</p><div class="cs-wrap"><table class="cs-table csg"><thead><tr><th>${L('Chance', 'Odds')}</th>${stg(CS.goldSub.rows[0][1]).map((_, i)=>`<th>Stage ${g0 + i + 1}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table></div>` + csSrc(CS.goldSub.src)]);
  }
  if(CS.rerollSub){
    const tiles = CS.rerollSub.rows.map(([s, n])=>`<div class="csr-t"><span>Stage ${s}</span>${csIc(TI('reroll'), n, L('kostenlose Rerolls', 'free rerolls'), 'rr')}</div>`).join('');
    out.push(['reroll-subscription', 'Reroll Subscription', `<p class="cs-note">${L('Encounter von Kayle: Zu Beginn jeder Stage bekommst du kostenlose Shop-Rerolls.', 'Kayle encounter: you get free shop rerolls at the start of every stage.')}</p><div class="csr">${tiles}</div>` + csSrc(CS.rerollSub.src)]);
  }
  // Emblem-Rezepte: Pfannenwender bzw. Bratpfanne + Komponente (aus den offiziellen Item-Daten)
  const em = ITEMS.filter(i=>i.cat==='emblem' || /Tacticians/.test(i.id)), byComp = {};   // Taktiker-Items gehören ins Rezept-Raster
  em.forEach(i=>{ if(i.comp && i.comp.length===2) byComp[[...i.comp].sort().join('+')] = i; });
  const ORD = ['BFSword','RecurveBow','NeedlesslyLargeRod','TearOfTheGoddess','ChainVest','NegatronCloak','GiantsBelt','SparringGloves','Spatula','FryingPan'], ord = i => { const k = ORD.indexOf(i.id.replace('DA_Component_', '')); return k < 0 ? 99 : k; };
  const comps = ITEMS.filter(i=>i.cat==='component').sort((a,b)=>ord(a) - ord(b)), base = ['DA_Component_Spatula', 'DA_Component_FryingPan'].map(id=>itemById[id]).filter(Boolean);
  if(base.length && comps.length){
    const cell = it => it ? `<span class="cs-it"><img src="${it.img}" alt="" width="36" height="36" loading="lazy">${esc(EN ? it.en : it.de)}</span>` : '–';
    const rows = comps.map(c=>[cell(c), ...base.map(b=>cell(byComp[[b.id, c.id].sort().join('+')]))]);
    const none = em.filter(i=>!i.comp || !i.comp.length).map(i=>esc(EN ? i.en : i.de));
    out.push(['emblems', L('Emblem-Rezepte', 'Emblem recipes'), csTable([L('Komponente', 'Component'), ...base.map(b=>'+ ' + cell(b))], rows, 'cs-emb') + (none.length ? `<p class="cs-note cs-after">${L('Nicht baubar', 'Not craftable')}: ${none.join(', ')}</p>` : '')]);
  }
  if(CS.solo){
    const blocks = CS.solo.rounds.map(([r, list])=>`<div class="css-b"><div class="css-h">${L('Runde', 'Round')} ${r}</div><div class="css-u">${list.map(n=>`<a href="${champHref(n)}" class="css-c"><img class="c${(champBy[n] || {}).c || 1}" src="${champImg(n) || champFallback(n)}" alt="" width="64" height="64" loading="lazy"><b>${esc(n)}</b><small>${L('Position egal', 'any position')}</small></a>`).join('')}</div></div>`).join('');
    out.push(['solo', L('Stage 1 solo schaffen', 'Solo Stage 1'), `<p class="cs-note">${L('1-Kosten-Champions, die die PvE-Runde allein gewinnen.', '1-cost champions that win the PvE round on their own.')}</p><div class="css">${blocks}</div>` + csSrc(CS.solo.src)]);
  }
  out.push(...csAugSections(), ...csTraitSections(), ...csPatchSection());
  return out;
}
// Augment-Tabellen (Little Buddy Bot): Augment aus den Riot-Daten (Set-18-Version bevorzugt), Belohnungen aus Kürzeln (siehe data/custom-<Set>.js)
const csAugFind = en => { const l = AUGS.filter(a=>a.en===en); const a = l.find(x=>/^DA_/.test(x.id)) || l[0]; if(!a) return null;
  const ic = [a, ...l].map(augImg).find(s=>s && !/missing/.test(s)) || augImg(a); return Object.assign({}, a, {img:ic}); };
const csDie = n => `<span class="csx-ic die" title="${L('Würfel', 'Die')}: ${n}"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="4"/>${({1:[[12,12]], 2:[[7,7],[17,17]], 3:[[7,7],[12,12],[17,17]], 4:[[7,7],[17,7],[7,17],[17,17]], 5:[[7,7],[17,7],[12,12],[7,17],[17,17]], 6:[[7,6],[17,6],[7,12],[17,12],[7,18],[17,18]]})[n].map(([x, y])=>`<circle cx="${x}" cy="${y}" r="2.1"/>`).join('')}</svg></span>`;
const csHeads = () => `<span class="csx-ic coinh" title="${L('Kopf', 'Heads')}"><i></i></span>`;
const CS_RAND = {ar:['Zufälliges Artefakt', 'Random artifact', 'random-artifact'], ra:['Zufälliger Lichtgegenstand', 'Random radiant item', 'random-radiant']};
// Offizielle Embleme (Item-Symbole aus den Riot-Daten); ohne Emblem bleibt das Attribut-Symbol
const csEmb = n => ITEMS.find(i=>i.cat==='emblem' && i.en===n + ' Emblem');
// Attribut-Symbol im Stil der Spiel-Embleme: das offizielle Emblem; ohne Emblem (Riftbeast, Avatar, Solar) das Attribut-Symbol auf einer Emblem-Medaille.
// Ohne Größe bestimmt das CSS des Platzes die Größe (Seitenleiste, Karten)
const csTrIc = (n, size, cls='') => { const e = csEmb(n), st = size ? ` style="width:${size}px;height:${size}px"` : '';
  return e ? `<img class="cs-emb ${cls}" src="${e.img}" alt="" title="${esc(n)}" width="${size || 40}" height="${size || 40}" loading="lazy"${st}>`
    : `<span class="cs-emb cs-medal ${cls}" title="${esc(n)}"${st}><img src="${traitImg(n)}" alt="" loading="lazy"></span>`; };
const csEmbImg = (n, size) => { const e = csEmb(n); return e ? `<img class="cax-emb" src="${e.img}" alt="" title="${esc(EN ? e.en : e.de)}" width="${size}" height="${size}" loading="lazy">` : traitHex(n, 'base', size * .8); };
// Zufälliges fertiges Item: Riot nutzt dafür dasselbe Symbol wie für Komponenten – deshalb Item-Rahmen mit Fragezeichen und Beschriftung.
// Zufälliges Emblem: zwei offizielle Embleme diagonal geteilt, mit Fragezeichen
const csRq = (em, n) => { const tt = `${n > 1 ? n + '× ' : ''}${em ? L('Zufälliges Emblem', 'Random emblem') : L('Zufälliges fertiges Item', 'Random full item')}`, bd = n > 1 ? `<b>×${n}</b>` : '';
  const e = em && ITEMS.filter(i=>i.cat==='emblem' && traitBy[i.en.replace(/ Emblem$/, '')]);
  return e && e.length > 1 ? `<span class="csx-ic sp emr" title="${tt}"><img src="${e[0].img}" alt="" width="40" height="40" loading="lazy"><img class="sp2" src="${e[1].img}" alt="" width="40" height="40" loading="lazy"><i>?</i>${bd}</span>`
    : `<span class="csx-rfi" title="${tt}"><span class="csx-ic rq rfi"><i>?</i>${bd}</span><em>${L('Zufälliges<br>fertiges Item', 'Random<br>full item')}</em></span>`; };   // mit Beschriftung, sonst nicht zu erkennen
function csTok(str){
  return String(str || '').split(' ').filter(Boolean).map(t=>{ let m;
    if((m = t.match(/^g(\d+|\?)$/))) return csCoin(m[1]);
    if((m = t.match(/^c(\d*)$/))){ const n = +(m[1] || 1); return csIc(TI('orb-blue'), n > 1 ? n : '', n + ' ' + L('Komponenten-Kugeln (je eine zufällige Komponente)', 'component orbs (one random component each)'), 'corb'); }   // in Belohnungen ohne „×1“
    if((m = t.match(/^u([1-5])(?:x(\d+))?(?:\*([23]))?$/))){ const n = +(m[2] || 1), s = +(m[3] || 0), h = csChamp(+m[1], n);
      return s ? h.replace(/<\/span>$/, `<i class="csx-stars s${s}">${'★'.repeat(s)}</i></span>`).replace('title="', `title="${'★'.repeat(s)} `) : h; }
    if((m = t.match(/^a([cfa])(?:x(\d+))?$/))) return csAnvil({c:'component', f:'completed', a:'artifact'}[m[1]], +(m[2] || 1));
    if((m = t.match(/^(fi|em)(?:x(\d+))?$/))) return csRq(m[1]==='em', +(m[2] || 1));
    if((m = t.match(/^(ar|ra)(?:x(\d+))?$/))){ const r = CS_RAND[m[1]]; return csIc(TI(r[2]), +(m[2] || 1), L(r[0], r[1]), 'item rand'); }
    if(t==='sp' || t==='ti') return csSpatPan();
    if((m = t.match(/^xp(\d+)$/))) return csIc(TI('xp'), m[1], m[1] + L(' Erfahrung', ' XP'), 'xp');
    if((m = t.match(/^rr(\d+)$/))) return csIc(TI('reroll'), m[1], m[1] + L(' kostenlose Rerolls', ' free rerolls'), 'rr');
    if(t==='hp') return csIc(TI('stat-hp'), '', L('Leben für alle Einheiten', 'Health for all units'), 'sti');
    if(t==='egg') return csIc(TI('golden-egg'), '', L('Goldenes Ei', 'Golden Egg'), 'item');
    if((m = t.match(/^d([1-6])$/))) return csDie(+m[1]);
    if(t==='coin') return csHeads();
    if((m = t.match(/^ch:(.+?)(?:x(\d+))?(?:\*([23]))?$/))){ const n = m[1].replace(/_/g, ' '), c = champBy[n]; if(!c) return ''; const k = +(m[2] || 1), s = +(m[3] || 0);
      return `<span class="csx-ic chu c${c.c}" title="${s ? '★'.repeat(s) + ' ' : ''}${esc(n)}${k > 1 ? ' ×' + k : ''}"><img src="${champFallback(n) || champImg(n)}" alt="${esc(n)}" width="40" height="40" loading="lazy">${s ? `<i class="csx-stars s${s}">${'★'.repeat(s)}</i>` : ''}${k > 1 ? `<b>×${k}</b>` : ''}</span>`; }
    if(t === 'or') return `<span class="csx-or">${L('oder', 'or')}</span>`;
    if((m = t.match(/^i:(.+?)(?:x(\d+))?$/))){ const k = m[1], nm = k.replace(/_/g, ' ').toLowerCase(), it = itemById[k] || ITEMS.find(i=>i.en.toLowerCase()===nm); return it ? csIc(it.img, +(m[2] || 1), EN ? it.en : it.de, 'item') : ''; }
    return '';
  }).join('');
}
const csTrName = n => n;   // Attributnamen wie auf der restlichen Seite (englisch)
const csTrChip = n => `<span class="cax-tr">${csEmbImg(n, 44)}<b>${esc(csTrName(n))}</b></span>`;
const csAv = (n, size=40) => champBy[n] ? `<a class="cax-av" href="${champHref(n)}" title="${esc(n)} · ${champBy[n].c} Gold">${avatar(n, size)}</a>` : '';
// Größe nach Inhalt: wenige Zeilen → groß (sz-xl), mittel → sz-lg, lange Listen oder viele Symbole pro Zeile → sz-md
const csSz = (rows, cards, toks=0) => { let s = rows <= 3 ? 2 : rows <= (cards > 2 ? 6 : 8) ? 1 : 0; if(toks >= 10) s = Math.max(0, s - 1); return ['sz-md', 'sz-lg', 'sz-xl'][s]; };
function csAugBody(t){
  if(t.groups){
    const rows = t.groups.flatMap(g=>g.rows || []), hasP = rows.some(r=>r[1] != null);   // Prozent-Spalte in allen Zeilen, damit die Symbole untereinander stehen
    const kc = Math.max(0, ...rows.map(r=>r[0] ? (/^d[1-6]$/.test(r[0]) ? 2 : r[0].length) : 0));   // Breite der Bezeichnungen (in Zeichen)
    const sz = csSz(Math.max(...t.groups.map(g=>(g.rows || []).length)), t.groups.length, Math.max(...rows.map(r=>String(r[2] || '').split(' ').filter(Boolean).length)));
    const rowHTML = ([k, p, tok, de, en]) => `<div class="cax-row">${k != null ? `<b class="cax-k">${k && /^d[1-6]$/.test(k) ? csDie(+k[1]) : esc(k)}</b>` : ''}${hasP ? `<b class="cax-p">${p != null ? fmtNum(p) + L(' %', '%') : ''}</b>` : ''}<span class="cax-ic">${csTok(tok)}</span>${de ? `<span class="cax-t">${esc(L(de, en || de))}</span>` : ''}</div>`;
    const cards = t.groups.map(g=>{ const ga = g.aug && csAugFind(g.aug);
      const head = ga ? `<img src="${ga.img}" alt="" width="32" height="32" loading="lazy"><b>${esc(ga.de)}</b>` : g.h ? `<b>${esc(Array.isArray(g.h) ? L(g.h[0], g.h[1]) : g.h)}</b>`
        : t.unit ? `<b>${esc(L(t.unit[0], t.unit[1]))}</b><small>${L('Belohnung', 'Reward')}</small>` : '';   // Einheit der Bezeichnungen (z. B. Attribute) einmal im Kopf statt in jeder Zeile
      return `<div class="csx-card cax-card">${head ? `<div class="csx-head">${head}</div>` : ''}${(g.rows || []).map(rowHTML).join('')}</div>`; }).join('');
    return `<div class="cax-grid ${sz} n${Math.min(t.groups.length, 4)}" style="--kc:${kc}">${cards}</div>${t.note ? `<p class="cs-note cs-after">${esc(L(t.note[0], t.note[1]))}</p>` : ''}`;
  }
  if(t.type==='traits'){
    const ok = t.traits.filter(n=>traitBy[n]);
    const no = [...new Set(ITEMS.filter(i=>i.cat==='emblem').map(i=>i.en.replace(/ Emblem$/, '')))].filter(n=>traitBy[n] && !ok.includes(n));
    return `<div class="cax-traits">${ok.map(csTrChip).join('')}</div>${no.length ? `<div class="cax-no"><span>${L('Nicht möglich', 'Not possible')}:</span>${no.map(n=>`<span class="cax-x" title="${esc(n)}">${csEmbImg(n, 40)}</span>`).join('')}</div>` : ''}`;
  }
  // Champion + das Emblem, das es dazu gibt
  if(t.type==='units') return `<div class="cax-units" style="--c:${Math.min(t.units.length, 6)}">${t.units.filter(([n])=>champBy[n]).map(([n, tr])=>`<div class="cax-unit"><div class="cax-pair">${csAv(n, 64)}<i>+</i>${csEmbImg(tr, 52)}</div><b>${esc(n)}${t.stars ? ` <i class="cax-star">${'★'.repeat(t.stars)}</i>` : ''}</b><span>${esc(csTrName(tr))}</span></div>`).join('')}</div>`;
  if(t.type==='luck') return `<div class="csx-card cax-card cax-luck ${csSz(t.rows.length, 1)}" style="--kc:3">${t.rows.map(([st, src, sub, tok, txt])=>{ const a = csAugFind(src);
    return `<div class="cax-row"><b class="cax-k">${st}</b><span class="cax-src">${a ? `<img src="${a.img}" alt="" width="40" height="40" loading="lazy">` : csTrIc('Blossom', 40)}<b>${esc(a ? a.de : src)}${sub || !a ? ` <small>${sub ? esc(L(sub[0], sub[1])) : L('Geist', 'Wisp')}</small>` : ''}</b></span><span class="cax-ic">${csTok(tok)}</span><span class="cax-t">${esc(L(txt[0], txt[1]))}</span></div>`; }).join('')}</div>`;
  if(t.type==='blossom'){ const mem = champions.filter(c=>c.t.includes(t.trait)).sort((a, b)=>a.c - b.c || a.n.localeCompare(b.n));
    return `<div class="cax-grid n${t.stages.length} ${csSz(Math.max(...t.stages.map(s=>s[1].length)), t.stages.length)}" style="--kc:4">${t.stages.map(([st, rows])=>`<div class="csx-card cax-card"><div class="csx-head"><b>Stage ${st}</b><small>${L('Geist-Kosten', 'Wisp cost')}${csIc(TI('gold'), '', 'Gold', 'gold')}</small></div>${rows.map(([k, costs])=>`<div class="cax-row"><b class="cax-k">${k}</b><span class="cax-avs">${mem.filter(c=>costs.includes(c.c)).map(c=>csAv(c.n, 52)).join('')}</span></div>`).join('')}</div>`).join('')}</div>`; }
  if(t.type==='commit') return `<div class="csx-card cax-card cax-commit ${csSz(t.traits.length, 1)}">${t.traits.map(tr=>`<div class="cax-row"><span class="cax-src">${csTrChip(tr)}</span><span class="cax-avs">${champions.filter(c=>c.t.includes(tr) && c.c >= 2).sort((a, b)=>a.c - b.c || a.n.localeCompare(b.n)).map(c=>csAv(c.n, 52)).join('')}</span></div>`).join('')}</div>`;
  // Missed Connections: Kugeln im Kreis auf dem Boden der Standard-Arena (Riot-Textur battlefield_a, assets/img/arena-default.webp).
  // Lage wie im Spiel; Radien des Kreises in CSS (--rx/--ry), hier nur die Richtung jeder Kugel
  if(t.type==='circle'){ const us = t.units.filter(n=>champBy[n]), N = us.length;
    return `<div class="cax-circle">${us.map((n, i)=>{ const an = -Math.PI / 2 + i / N * 2 * Math.PI; return `<div class="cax-cu" style="--c:${Math.cos(an).toFixed(3)};--s:${Math.sin(an).toFixed(3)}">${csAv(n, 64)}<b>${esc(n)}</b></div>`; }).join('')}</div>
      <p class="cs-note cs-after">${L('Lage der Kugeln: im Uhrzeigersinn, Akali oben.', 'Orb layout: clockwise, Akali at the top.')}</p>`; }
  if(t.type==='stats') return `<div class="cax-stats">${t.stats.map(([k, v, de, en])=>`<div class="cax-stat"><img src="${TI('stat-' + k)}" alt="" width="36" height="36"><div><b>${esc(v)}</b><span>${esc(L(de, en))}</span></div></div>`).join('')}</div>`;
  return '';
}
function csAugSections(){
  const T = CS.augTables; if(!T) return [];
  return T.list.map(t=>{ const a = csAugFind(t.aug); if(!a) return null;
    // Riot-Text ohne Regel-Zusätze (z. B. „Tactician's Crown 2025“) und leere Zahlenzeilen, als ein Absatz
    const desc = fmtDesc(String(a.desc || '').replace(/<rules>[\s\S]*?<\/rules>/gi, ''), a.fx).split('<br>').map(s=>s.trim()).filter(s=>s && !/^[\d\s.,%]*$/.test(s.replace(/<[^>]+>/g, ''))).join(' ')
      .replace(/\s*[^.<>]*<span class="d-var"[^>]*>X<\/span>[^.<]*\.?/g, '');   // Platzhalter ohne Wert („Belohnung: X“) weglassen
    const info = `<div class="cax-info"><img src="${a.img}" alt="" width="52" height="52" loading="lazy"><div><b>${esc(a.de)} <span class="cax-st">Stage ${esc(t.st)}</span></b>${desc ? `<p>${desc}</p>` : ''}</div></div>`;
    return [t.id, a.de, info + csAugBody(t) + csSrc(T.src)];
  }).filter(Boolean);
}
// Attribut- und Patch-Tabellen (Little Buddy Bot): Kopf mit Attribut-Symbol, darunter je Typ eine eigene Darstellung. Symbole nur aus den offiziellen Daten (Attribute, Embleme, Items, Champions)
const CS_STAT = {ad:['Angriffsschaden', 'Attack Damage'], ap:['Fähigkeitsstärke', 'Ability Power'], as:['Angriffstempo', 'Attack Speed'], crit:['Krit-Chance', 'Crit Chance'], da:['Schadensverstärkung', 'Damage Amp'],
  hp:['Leben', 'Health'], dr:['Haltbarkeit', 'Durability'], sv:['Omnivampir', 'Omnivamp'], armor:['Rüstung', 'Armor'], mr:['Magieresistenz', 'Magic Resist'], mana:['Manaregeneration', 'Mana Regen']};
const csSt = k => k === 'adap' ? csSt('ad') + csSt('ap') : k === 'armr' ? csSt('armor') + csSt('mr')
  : `<img class="cax-si" src="${TI('stat-' + k)}" alt="${esc(L(CS_STAT[k][0], CS_STAT[k][1]))}" title="${esc(L(CS_STAT[k][0], CS_STAT[k][1]))}" width="18" height="18">`;
const csStName = k => k === 'adap' ? L('AD & AP', 'AD & AP') : k === 'armr' ? L('Rüstung & MR', 'Armor & MR') : L(CS_STAT[k][0], CS_STAT[k][1]);
const csTL = a => esc(L(a[0], a[1]));
const csTraitHead = (n, text) => { const t = traitBy[n];
  return `<div class="cax-info">${csTrIc(n, 56)}<div><b>${esc(n)}${t && t.bp && t.bp.length > 1 ? ` <span class="cax-st">${t.bp.join(' / ')}</span>` : ''}</b>${text ? `<p>${csTL(text)}</p>` : ''}</div></div>`; };
const csChTile = (n, size=44, cls='') => champBy[n] ? `<a class="cax-av ${cls}" href="${champHref(n)}" title="${esc(n)} · ${champBy[n].c} Gold">${avatar(n, size)}</a>` : '';
function csTraitBody(t){
  if(t.type==='prismatic') return `<div class="ctr-pris">${t.rows.map(([n, q, fx])=>`<div class="ctr-pc">${csTrIc(n, 72)}<div><b>${esc(n)}</b>
    <p><span>${L('Aufgabe', 'Quest')}</span>${csTL(q)}</p><p class="fx"><span>${L('Effekt', 'Effect')}</span>${csTL(fx)}</p></div></div>`).join('')}</div>`;
  if(t.type==='coven'){
    const bp = `<div class="ctr-bps">${t.bp.map(([u, k, l])=>`<span><b>(${u})</b> ${k} ${L('pro Kill', 'per kill')} · ${l} ${L('pro Niederlage', 'per loss')}</span>`).join('')}</div>`;
    const cards = t.tiers.map(([e, ap, rows], i)=>`<div class="csx-card cax-card ctr-ct t${i}"><div class="csx-head"><b>${e} ${L('Essenz', 'Essence')}</b><small title="${L('Mit dem Augment „Dunkles Ritual“ bekommen Coven-Champions so viel Fähigkeitsstärke statt der Beute.', 'With the Dark Ritual augment, Coven champions get this much Ability Power instead of the loot.')}">${csSt('ap')} ${ap}</small></div>
      ${rows.map(([p, tok])=>`<div class="cax-row"><b class="cax-p">${fmtNum(p)}${L(' %', '%')}</b><span class="cax-ic">${csTok(tok)}</span></div>`).join('')}</div>`).join('');
    return bp + `<div class="ctr-coven">${cards}</div><p class="cs-note cs-after">${L('Zahl oben rechts: Fähigkeitsstärke für Coven-Champions statt der Beute, wenn du das Augment „Dunkles Ritual“ hast.', 'Number top right: Ability Power for Coven champions instead of the loot if you have the Dark Ritual augment.')}</p>`;
  }
  if(t.type==='riftbeast'){
    const head = `<tr><th>${L('Einheit', 'Unit')}</th>${[4, 5, 6, 7, 8, 9, 10].map(l=>`<th>Lvl ${l}</th>`).join('')}</tr>`;
    const rows = t.odds.filter(([n])=>champBy[n]).map(([n, cs])=>`<tr><td><span class="ctr-u">${csChTile(n, 34)}<b class="k${champBy[n].c}">${esc(n)}</b></span></td>${cs.map(c=>c ? `<td style="--h:${c[0] / 100}"><b>${c[0]}${L(' %', '%')}</b><small>max ${c[1]}</small></td>` : '<td class="na">–</td>').join('')}</tr>`).join('');
    const buffs = t.buffs.filter(([n])=>champBy[n]).map(([n, b, fx])=>`<div class="ctr-buff">${csChTile(n, 46)}<div><b class="k${champBy[n].c}">${esc(n)}</b><small>${csTL(b)}</small><p>${csTL(fx)}</p></div></div>`).join('');
    return `<div class="cs-wrap"><table class="cs-table ctr-odds"><thead>${head}</thead><tbody>${rows}</tbody></table></div>
      <h3 class="ctr-h3">${L('Riftbeast-Buffs', 'Riftbeast buffs')}</h3><p class="cs-note">${csTL(t.buffText)}</p><div class="ctr-buffs">${buffs}</div>`;
  }
  if(t.type==='blackthorn'){
    const ROLE = [['Tank', 'hp', 'armr'], ['AD', 'ad', 'as'], ['AP', 'da', 'mana']], star = s=>'<i class="ctr-star">' + '★'.repeat(s) + '</i>';
    const pane = b => `<div class="cs-wrap"><table class="cs-table ctr-bt"><thead><tr><th>${L('Kosten', 'Cost')}</th><th>${L('Rolle', 'Role')}</th>${[1, 2, 3].map(s=>`<th>${star(s)}</th>`).join('')}</tr></thead><tbody>
      ${t.grid.map((roles, c)=>roles.map((bps, r)=>`<tr class="${r ? '' : 'top'}">${r ? '' : `<td rowspan="3" class="ctr-cost">${csIc(TI('champ-' + (c + 1)), '', L(`${c + 1}-Kosten`, `${c + 1}-cost`), 'chorb')}</td>`}<td class="ctr-role k${c + 1}">${ROLE[r][0]}</td>
        ${bps[b].map(([v1, v2])=>`<td><div class="ctr-vv"><span class="ctr-v">${v1}${ROLE[r][1] === 'armr' ? '' : '%'} ${csSt(ROLE[r][1])}</span><span class="ctr-v">${ROLE[r][0] === 'AP' ? '+' : ''}${v2}${r === 1 ? '%' : ''} ${csSt(ROLE[r][2])}</span></div></td>`).join('')}</tr>`).join('')).join('')}</tbody></table></div>`;
    return `<div class="csp-tabs" role="tablist">${[2, 4, 6].map((b, i)=>`<button type="button" role="tab" class="${i ? '' : 'on'}" data-cstab="${i}" aria-selected="${!i}">${b} Blackthorn<span></span></button>`).join('')}</div>
      ${[0, 1, 2].map(b=>`<div class="csp-pane"${b ? ' hidden' : ''}>${pane(b)}</div>`).join('')}`;
  }
  if(t.type==='fae'){
    const cell = ([a, h]) => `<span class="ctr-v">${fmtNum(a)} % ${csSt('adap')}</span><small>${fmtNum(h)} % ${L('Heilung', 'heal')}</small>`;
    const pix = `<div class="cs-wrap"><table class="cs-table ctr-fae"><thead><tr><th>#</th><th>${L('Schwelle', 'Threshold')}</th><th>2 Fae</th><th>4 Fae</th><th class="emb">2 Fae + Embiggen</th><th class="emb">4 Fae + Embiggen</th></tr></thead><tbody>
      ${t.pix.map(([th, a, b, c, d], i)=>`<tr><td class="no">${i + 1}</td><td class="th">${th.toLocaleString(EN ? 'en-US' : 'de-DE')}</td><td>${cell(a)}</td><td>${cell(b)}</td><td class="emb">${cell(c)}</td><td class="emb">${cell(d)}</td></tr>`).join('')}</tbody></table></div>`;
    const gold = `<div class="cs-wrap"><table class="cs-table ctr-fae gold"><thead><tr><th>#</th><th>${L('Schwelle', 'Threshold')}</th><th>Gold</th></tr></thead><tbody>
      ${t.gold.map(([th, g], i)=>`<tr><td class="no">${i + 1}</td><td class="th">${th.toLocaleString(EN ? 'en-US' : 'de-DE')}</td><td>${csCoin(g)}</td></tr>`).join('')}</tbody></table></div>`;
    const a = csAugFind(t.aug[0]);
    return `<div class="ctr-fgrid"><div><h3 class="ctr-h3">${L('Pixie-Effekte', 'Pixie effects')}</h3>${pix}</div><div><h3 class="ctr-h3">${L('Goldene Pixies', 'Golden Pixies')}</h3>${gold}</div></div>
      <div class="ctr-aug">${csEmbImg('Fae', 46)}<div><b>${esc(a ? a.de : t.aug[0])} <span class="cax-st">Stage ${t.aug[2]}</span></b><p>${csTL(t.aug[1])}</p></div></div>`;
  }
  if(t.type==='info') return `<div class="ctr-info">${t.rows.map(([ic, n, fx])=>`<div class="ctr-ic">${/^emblem:/.test(ic) ? csEmbImg(ic.slice(7), 56) : traitHex(ic, 'base', 46)}<div><b>${csTL(n)}</b><p>${csTL(fx)}</p></div></div>`).join('')}</div>`;
  if(t.type==='lux') return `<div class="ctr-lux">${csChTile('Lux', 56)}<div><b>Lux · ${L('Grundeffekt', 'Base')}</b>${t.base.map(x=>`<p>${csTL(x)}</p>`).join('')}</div></div>
    <div class="ctr-lt">${t.rows.filter(([n])=>traitBy[n]).map(([n, fx])=>`<div class="ctr-ltr">${csTrIc(n, 44)}<div><b>${esc(n)}</b><p>${csTL(fx)}</p></div></div>`).join('')}</div>`;
  if(t.type==='sprykin'){
    const who = k => `<span class="ctr-who ${k}">${csTrIc('Sprykin', k === 'bff' ? 46 : 34)}<b>${k.toUpperCase()}</b></span>`;
    const eff = t.eff.map(([k, lines])=>`<div class="ctr-sp">${who(k)}<ul>${lines.map(([u, hp, as, ab])=>`<li><b>(${u})</b> ${L('Reiter', 'Rider')}: <em>${hp}</em> ${csSt('hp')} · <em>${as}</em> ${csSt('as')}${ab ? ` · ${L(`${ab} % der BFF-Fähigkeit wirkt auf deine Sprykin-Champions`, `${ab}% of the BFF's ability applies to your Sprykin champions`)}` : ''}</li>`).join('')}</ul></div>`).join('');
    const abil = (rows, st, txt, other) => rows.map(([k, lines])=>`<div class="ctr-sp">${who(k)}<div><p class="d">${csTL(txt(k))}</p><ul>${lines.map(([u, a, b])=>`<li><b>(${u})</b> <em>${a}</em> ${csSt(st)} ${L('Reiter', 'Rider')}${b ? `, <em>${b}</em> ${csSt(st)} ${csTL(other(k))}` : ''}</li>`).join('')}</ul></div></div>`).join('');
    return `<div class="csx-card ctr-spc"><div class="csx-head"><b>${L('BFF- und SFF-Effekte', 'BFF vs SFF effects')}</b></div><div class="ctr-sp2">${eff}</div></div>
      <div class="ctr-sp2 two"><div class="csx-card ctr-spc"><div class="csx-head"><b>${L('BFF-Fähigkeit (Nahkampf)', 'BFF ability (melee)')}</b></div>${abil(t.melee, 'hp', k=>k === 'bff' ? ['Der BFF brüllt und heilt den Reiter und andere Verbündete um % ihres maximalen Lebens.', 'The BFF roars, healing the Rider and other allies for a % of their max Health.'] : ['Der SFF brüllt und heilt den Reiter und andere Sprykin um % ihres maximalen Lebens.', 'The SFF roars, healing the Rider and other Sprykin for a % of their max Health.'], k=>k === 'bff' ? ['andere Verbündete', 'other allies'] : ['andere Sprykin', 'other Sprykin'])}</div>
      <div class="csx-card ctr-spc"><div class="csx-head"><b>${L('BFF-Fähigkeit (Fernkampf)', 'BFF ability (ranged)')}</b></div>${abil(t.ranged, 'adap', k=>k === 'bff' ? ['Der BFF tanzt und gibt dem Reiter für den restlichen Kampf AD und AP.', 'The BFF dances, granting the Rider AD and AP for the rest of combat.'] : ['Der SFF tanzt und gibt dem Reiter für den restlichen Kampf AD und AP.', 'The SFF dances, granting the Rider AD and AP for the rest of combat.'], ()=>['andere Sprykin', 'other Sprykin'])}</div></div>`;
  }
  return '';
}
function csTraitSections(){
  const T = CS.traitTables; if(!T) return [];
  return T.list.filter(t=>traitBy[t.trait]).map(t=>[t.id, L(t.title[0], t.title[1]), (t.type==='prismatic' ? '' : csTraitHead(t.trait, t.text)) + csTraitBody(t) + csSrc(T.src)]);
}
function csPatchSection(){
  const P = CS.patchSchedule; if(!P) return [];
  const now = new Date(), d = s => new Date(s + 'T12:00:00'), cur = P.rows.filter(r=>d(r[1]) <= now).pop(), next = P.rows.find(r=>d(r[1]) > now);
  const rows = P.rows.map(r=>{ const dt = d(r[1]), tag = r === cur ? ['aktuell', 'current'] : r === next ? ['nächster', 'next'] : null;
    return `<tr class="${r === cur ? 'cur' : r === next ? 'nxt' : dt < now ? 'past' : ''}"><td class="set">Set ${r[0].split('.')[0]}</td><td class="pv">${esc(r[0])}${tag ? ` <i class="ctr-tag">${L(tag[0], tag[1])}</i>` : ''}</td>
      <td>${dt.toLocaleDateString(EN ? 'en-US' : 'de-DE', {weekday:'long'})}</td><td class="dt">${dt.toLocaleDateString(EN ? 'en-US' : 'de-DE', {day:'numeric', month:'short'})}</td><td class="ev">${(L(r[2], r[3]) || []).map(esc).join('<br>')}</td></tr>`; }).join('');
  return [['patch-schedule', L('Patch-Plan', 'Patch schedule'), `<div class="cs-wrap"><table class="cs-table ctr-ps"><thead><tr><th>Set</th><th>Patch</th><th>${L('Tag', 'Day')}</th><th>${L('Datum', 'Date')}</th><th>${L('Was passiert', 'What happens')}</th></tr></thead><tbody>${rows}</tbody></table></div>` + csSrc(P.src)
    + `<p class="cs-cd"><a href="${COUNTDOWN_PATH}">${L('Live-Countdown bis zum nächsten Patch', 'Live countdown to the next patch')} →</a></p>`]];
}
// Seitenleiste & Panels: Kurzname (s), Unterzeile (h), Kurztext für Karten (d), Icon (SVG-Pfade), optional ein Hinweis (tip)
const CS_META = {
  shop:{s:['Shop & XP', 'Shop & XP'], h:['Wann du levelst. Wann du rollst.', 'Know when to level. Know when to roll.'], d:['Chancen pro Level, Pool & XP', 'Odds per level, pool & XP'], ic:'<path d="M3 4h2l2.4 11h11L21 7H6"/><circle cx="9" cy="19" r="1.5"/><circle cx="17" cy="19" r="1.5"/>',
    tip:()=>SHOP && SHOP.odds[7] ? L(`Level 8 ist der wichtigste Breakpoint für 4-Kosten-Carries: ${SHOP.odds[7][3]} % pro Shop-Slot.`, `Level 8 is the key breakpoint for 4-cost carries: ${SHOP.odds[7][3]}% per shop slot.`) : ''},
  augments:{s:['Augment-Stufen', 'Augment tiers'], h:['Welche Stufen auf 2-1, 3-2 und 4-2 kommen.', 'Which tiers show up on 2-1, 3-2 and 4-2.'], d:['Silber, Gold & Prismatisch pro Partie', 'Silver, gold & prismatic per game'], ic:'<path d="M12 3l2.6 5.6L20 9.5l-4 4 1 5.5-5-2.8L7 19l1-5.5-4-4 5.4-.9z"/>',
    tip:()=>L('Ist das erste Augment Silber, kommt als Nächstes zu 61 % Gold.', 'If the first augment is silver, the next one is gold 61% of the time.')},
  encounters:{s:['Encounters', 'Encounters'], h:['Alle Encounters und wie oft sie kommen.', 'Every encounter and how often it shows up.'], d:['Wie oft jeder Encounter kommt', 'How often each one appears'], ic:'<path d="M4 20l7-7M13 4l7 7-3 1-4 4-1 3-6-6 3-1 4-4z"/>'},
  orbs:{s:['Loot-Orbs', 'Loot orbs'], h:['Was in Gold-Orbs und prismatischen Orbs steckt.', "What's inside gold and prismatic orbs."], d:['Inhalt von Gold-Orbs & prismatischen Orbs', 'Gold & prismatic contents'], ic:'<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/>'},
  loot:{s:['Loot-Verteilung', 'Loot distribution'], h:['Welche Beute die Creep-Runden geben.', 'What loot the creep rounds give.'], d:['Beute aus den Creep-Runden', 'Loot from the creep rounds'], ic:'<path d="M4 9h16v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z"/><path d="M3 5h18v4H3zM12 5v15"/>'},
  damage:{s:['Spielerschaden', 'Player damage'], h:['Wie viel Leben du nach einer Niederlage verlierst.', 'How much health you lose after a loss.'], d:['Schaden pro Stage', 'Damage per stage'], ic:'<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/><path d="M12 8l-1.5 4h3L12 16"/>',
    tip:()=>L('Jede gegnerische Unit, die überlebt, kostet dich 1 Leben extra.', 'Every enemy unit that survives costs you 1 extra health.')},
  'gold-subscription':{s:['Gold Subscription', 'Gold Subscription'], h:['Wie viel Gold Kobuko zu Beginn jeder Stage gibt.', 'How much gold Kobuko gives at the start of every stage.'], d:['Gold zu Beginn jeder Stage', 'Gold at the start of every stage'], ic:'<ellipse cx="12" cy="7" rx="7" ry="3"/><path d="M5 7v5c0 1.7 3.1 3 7 3s7-1.3 7-3V7M5 12v5c0 1.7 3.1 3 7 3s7-1.3 7-3v-5"/>'},
  'reroll-subscription':{s:['Reroll Subscription', 'Reroll Subscription'], h:['Wie viele kostenlose Rerolls Kayle pro Stage gibt.', 'How many free rerolls Kayle gives per stage.'], d:['Kostenlose Rerolls pro Stage', 'Free rerolls per stage'], ic:'<path d="M20 12a8 8 0 1 1-2.3-5.7"/><path d="M20 4v4h-4"/>'},
  carousel:{s:['Karussell', 'Carousel'], h:['Größe, Champions und Items pro Stage.', 'Size, champions and items per stage.'], d:['Größe, Units & Items pro Stage', 'Size, units & items per stage'], ic:'<circle cx="12" cy="12" r="3"/><circle cx="12" cy="4.5" r="1.6"/><circle cx="19.5" cy="12" r="1.6"/><circle cx="12" cy="19.5" r="1.6"/><circle cx="4.5" cy="12" r="1.6"/>'},
  emblems:{s:['Embleme', 'Emblems'], h:['Welche Komponente welches Emblem gibt.', 'Which component makes which emblem.'], d:['Rezepte aus Komponenten', 'Recipes from components'], ic:'<path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z"/>'},
  solo:{s:['Stage 1 solo', 'Solo Stage 1'], h:['Welche 1-Kosten Stage 1 allein schaffen.', 'Which 1-costs win Stage 1 on their own.'], d:['Wer Stage 1 allein schafft', 'Who solos Stage 1'], ic:'<circle cx="12" cy="8" r="3.5"/><path d="M5 20c.8-3.8 3.6-6 7-6s6.2 2.2 7 6"/>'}
};
// Offizielle Riot-Symbole für die System-Tabellen (assets/icons/tft: Stage-Symbole, Shop-Knöpfe, Gold, Beutekugel; Embleme = Pfannenwender)
const CS_RIOT_IC = {encounters:'stage-encounter', shop:'shop-xp', augments:'stage-augment', orbs:'orb-blue', loot:'stage-krugs', damage:'stage-damage',
  'gold-subscription':'gold', 'reroll-subscription':'shop-reroll', solo:'stage-minions', carousel:'stage-carousel'};
Object.entries(CS_RIOT_IC).forEach(([id, k])=>{ if(CS_META[id]) Object.assign(CS_META[id], {img:TI(k), rio:1}); });
if(CS_META.emblems && itemById.DA_Component_Spatula) Object.assign(CS_META.emblems, {img:itemById.DA_Component_Spatula.img, rio:1});
// Augment-Tabellen: Name und Icon aus den Riot-Daten
(CS.augTables ? CS.augTables.list : []).forEach(t=>{ const a = csAugFind(t.aug); if(a) CS_META[t.id] = {s:[a.de, a.en], h:['Augment-Tabelle · Stage ' + t.st, 'Augment table · Stage ' + t.st], d:['Alle Belohnungen und Chancen', 'every reward and its odds'], img:a.img, st:t.st}; });
(CS.traitTables ? CS.traitTables.list : []).forEach(t=>{ CS_META[t.id] = {s:t.title, h:['Attribut-Tabelle · ' + t.trait, 'Trait table · ' + t.trait], d:['Werte und Belohnungen des Attributs', 'the trait\'s values and rewards'], trait:t.trait}; });
CS_META['patch-schedule'] = {s:['Patch-Plan', 'Patch schedule'], h:['Wann welcher Patch kommt.', 'When each patch lands.'], d:['Termine aller Patches des Sets', 'dates of every patch this set'], img:TI('tft-logo-game'), rio:1, ic:'<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>'};
// Gruppen: [Kurzname DE/EN (Seitenleiste), Überschrift DE/EN und Unterzeile DE/EN (Übersicht)], Tabellen – Reihenfolge wie bei Little Buddy Bot
const CS_GROUPS = [
  [['System', 'System', 'System-Tabellen', 'System tables', 'Shop-Chancen, Loot, Schaden – die festen Zahlen des Sets.', 'Shop odds, loot, damage – the fixed numbers of the set.'], ['encounters', 'shop', 'augments', 'orbs', 'loot', 'damage', 'gold-subscription', 'reroll-subscription']],
  [['Augments', 'Augments', 'Augment-Tabellen', 'Augment tables', 'Was einzelne Augments wirklich geben – mit allen Chancen.', 'What single augments really give – with every chance.'], CS.augTables ? CS.augTables.list.map(t=>t.id) : []],
  [['Attribute', 'Traits', 'Attribut-Tabellen', 'Trait tables', 'Was Attribute wirklich geben – Beute, Shop-Chancen und Boni.', 'What traits really give – loot, shop odds and bonuses.'], CS.traitTables ? CS.traitTables.list.map(t=>t.id) : []],
  [['Sonstiges', 'Other', 'Sonstiges', 'Other', 'Patch-Plan, Embleme bauen und Stage 1 allein schaffen.', 'Patch schedule, building emblems and winning Stage 1 solo.'], ['patch-schedule', 'emblems', 'solo']]
];
let CS_LIST = null;
const csList = () => CS_LIST || (CS_LIST = csSections());
const csSvg = (ic, w=1.8) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true">${ic || ''}</svg>`;
const csIco = id => { const m = CS_META[id] || {}; return m.trait ? csTrIc(m.trait, 0, 'cs-aic') : m.img ? `<img class="cs-aic${m.rio ? ' cs-ric' : ''}" src="${m.img}" alt="" width="24" height="24" loading="lazy">` : csSvg(m.ic); };   // Augment-Tabellen mit Augment-Icon
const csName = id => { const m = CS_META[id]; return m ? L(m.s[0], m.s[1]) : id; };
// Startseite (/cheatsheet): Reiter mit Karten. „TFTClimb Priority“ = unsere wichtigsten Tabellen (stehen zusätzlich in ihrer Gruppe).
// Pro Reiter zuerst 9 Karten (bei 2 Spalten 8, damit keine einzelne Karte in der letzten Reihe steht), der Rest über „Alle … ansehen“
const CS_PRIO = [['TFTClimb Priority', 'TFTClimb Priority'], ['augments', 'damage', 'coven', 'call-to-chaos', 'solo']];
const CS_IC_TRAIT = '<path d="M12 3c2.5 3 6 4 8 4-1 6-3.5 10.5-8 14-4.5-3.5-7-8-8-14 2 0 5.5-1 8-4z"/><path d="M12 9v6M9 12h6"/>';   // Attribut-Wappen
const CS_TAB_IC = ['<path d="M13 2.5L5 13.5h6.2L10 21.5l9-11.5h-6.4z"/>', '<rect x="4" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5"/>', '<path d="M12 2.5l8.2 4.75v9.5L12 21.5l-8.2-4.75v-9.5z"/>', CS_IC_TRAIT, '<circle cx="5.5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="18.5" cy="12" r="1.6"/>'];
function csCard(id, k=0){   // k = Position im Reiter: ab der 10. Karte ausgeblendet, die 9. nur bei 3 Spalten
  const m = CS_META[id] || {};
  return `<a class="cs-card${k >= 9 ? ' xtra' : k === 8 ? ' n9' : ''}" href="${csHref(id)}"><span class="cs-card-ic">${csIco(id)}</span><span class="cs-card-tx"><b>${esc(csName(id))}</b>${m.st ? `<small><i class="cs-card-st">Stage ${esc(m.st)}</i></small>` : m.h ? `<small>${L(m.h[0], m.h[1])}</small>` : ''}</span>${csSvg('<path d="M9 6l6 6-6 6"/>', 2.4)}</a>`;
}
function csHome(secs){
  const has = id=>secs.some(s=>s[0]===id);
  const tabs = [[CS_PRIO[0], CS_PRIO[1], ['Priority', 'Priority']], ...CS_GROUPS.map(([g, ids])=>[[g[0], g[1]], ids, [g[0], g[1]]])].map(([n, ids, k])=>[n, ids.filter(has), k]).filter(([, ids])=>ids.length);   // k = Kurzname fürs Handy
  return `<div class="cs-home">
    <form class="cs-hs" id="csHeroForm" role="search">${csSvg('<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>', 2)}<input id="csHeroQ" type="search" placeholder="${L('Was möchtest du nachschlagen?', 'What do you want to look up?')}" autocomplete="off" aria-label="${L('Cheatsheet suchen', 'Search cheatsheets')}"><button type="submit" aria-label="${L('Öffnen', 'Open')}">${csSvg('<path d="M5 12h14M13 6l6 6-6 6"/>', 2.2)}<span></span></button></form>
    <div class="cs-tabs" role="tablist">${tabs.map(([n, ids, k], i)=>`<button type="button" role="tab" class="cs-tab${i ? '' : ' on'}${i ? '' : ' prio'}" data-cstg="${i}" aria-selected="${!i}">${csSvg(CS_TAB_IC[i], 2)}<span class="cs-tl">${L(n[0], n[1])}</span><span class="cs-ts">${L(k[0], k[1])}</span><small>(${ids.length})</small><span></span></button>`).join('')}</div>
    <div class="cs-panes">${tabs.map(([n, ids], i)=>`<div class="cs-pane" data-cstg="${i}"${i ? ' hidden' : ''}><div class="cs-cards">${ids.map((id, k)=>csCard(id, k)).join('')}</div>
      ${ids.length > 8 ? `<div class="cs-more-w${ids.length === 9 ? ' n9' : ''}"><button type="button" class="cs-more">${L(`Alle ${ids.length} ${n[0]} ansehen`, `View all ${ids.length} ${n[1]}`)}${csSvg('<path d="M5 12h14M13 6l6 6-6 6"/>', 2.2)}<span></span></button></div>` : ''}</div>`).join('')}</div>
    <div class="cs-res" id="csRes" hidden><div class="cs-cards"></div><p class="cs-nores">${L('Nichts gefunden – versuch es mit einem anderen Wort.', 'Nothing found – try another word.')}</p></div>
  </div>`;
}
// Suche auf der Startseite: Treffer aus allen Tabellen statt der Reiter; Enter öffnet den ersten Treffer
function csHomeSearch(q){
  q = q.trim().toLowerCase();
  const res = $('#csRes'); if(!res) return;
  const ids = [...new Set(CS_GROUPS.flatMap(g=>g[1]))].filter(id=>csList().some(s=>s[0]===id)), hit = ids.filter(id=>{ const m = CS_META[id] || {};
    return [csName(id), m.s && m.s[0], m.s && m.s[1], m.h && L(m.h[0], m.h[1]), m.d && L(m.d[0], m.d[1])].filter(Boolean).join(' ').toLowerCase().includes(q); });
  res.hidden = !q; document.querySelectorAll('#csOv .cs-tabs,#csOv .cs-panes').forEach(el=>{ el.hidden = !!q; });
  res.querySelector('.cs-cards').innerHTML = q ? hit.map(id=>csCard(id)).join('') : '';
  res.querySelector('.cs-nores').hidden = !q || hit.length > 0;
  return hit;
}
// kleine Vorschau auf den Karten unter dem Panel
function csPreview(id){
  const pill = (k, v) => `<span class="csp-pill"><small>${k}</small>${v}</span>`;
  if(id==='augments' && CS.augments){ const seq = CS.augments.seq, W = seq.reduce((s, x)=>s + x[1], 0); return ['S','G','P'].map(l=>pill(L(CS_AUG[l][1], CS_AUG[l][2]), csPct(seq.filter(x=>x[0][0]===l).reduce((s, x)=>s + x[1], 0) / W * 100))).join(''); }
  if(id==='damage' && CS.damage) return CS.damage.stage.slice(0, 6).map(([s, d])=>pill('Stage ' + s, d)).join('');
  if(id==='gold-subscription' && CS.goldSub){ const r = [...CS.goldSub.rows].sort((a,b)=>b[0]-a[0])[0]; return r[1].slice(1, 7).map((g, i)=>pill('Stage ' + (i + 2), g)).join('') + `<span class="csp-note">${L('häufigste Zeile', 'most common row')} (${csPct(r[0])})</span>`; }
  if(id==='reroll-subscription' && CS.rerollSub) return CS.rerollSub.rows.map(([s, r])=>pill('Stage ' + s, r)).join('');
  if(id==='shop' && SHOP) return SHOP.odds[7].map((o, c)=>pill(`<i class="cdot c${c+1}"></i>${c+1}`, o + L(' %', '%'))).join('');
  if(id==='encounters' && ENCS.length) return [...ENCS].sort((a,b)=>b.w - a.w).slice(0, 3).map(e=>pill(esc(e.n), Math.round(e.w / ENC_W * 100) + L(' %', '%'))).join('');
  if(id==='solo' && CS.solo) return CS.solo.rounds[0][1].map(n=>`<img class="csp-ch" src="${champImg(n) || champFallback(n)}" alt="${esc(n)}" title="${esc(n)}" width="34" height="34" loading="lazy">`).join('');
  return '';
}
// Neues Design: jede Tabelle im TFTClimb-Rahmen (Überschrift oben links, Logo in der Aussparung unten)
const csHex = '<svg class="csf-hex" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l8.2 4.75v9.5L12 21.5l-8.2-4.75v-9.5z"/></svg>';
function csPanel([id, t, html], flat){
  const m = CS_META[id] || {s:[t, t], h:['', '']};
  const body = typeof html === 'string' ? html
    : `<div class="csp-tabs" role="tablist">${html.tabs.map(([l, ic], i)=>`<button type="button" role="tab" class="${i ? '' : 'on'}" data-cstab="${i}" aria-selected="${!i}">${csSvg(ic, 2)}${l}<span></span></button>`).join('')}</div>${html.tabs.map(([, , h], i)=>`<div class="csp-pane"${i ? ' hidden' : ''}>${h}</div>`).join('')}`;
  const tip = m.tip ? m.tip() : '';
  const i = flat.indexOf(id), rel = [flat[(i + 1) % flat.length], flat[(i + 2) % flat.length]].filter(x=>x && x!==id);
  const cards = rel.map(r=>{ const rm = CS_META[r] || {}, pv = csPreview(r); return `<a class="csp-card" href="${csHref(r)}"><div class="csp-card-h">${csIco(r)}<div><b>${csName(r)}</b><small>${rm.h ? L(rm.h[0], rm.h[1]) : ''}</small></div></div>${pv ? `<div class="csp-prev">${pv}</div>` : ''}<span class="csp-more">${L('Ansehen', 'View')} →</span></a>`; }).join('');
  const framed = ND;
  const main = framed
    ? `<div class="csf"><div class="csf-box"><svg class="csf-svg" aria-hidden="true"></svg><div class="csf-hd"><h2 class="csf-title">${csName(id)}</h2><span class="csf-brand">${csHex}<b>Cheat<i>sheet</i></b></span></div><div class="csf-body">${body}</div></div>
        <div class="csf-under">${csHex}<i class="csf-line"></i><i class="csf-dash"></i><span class="csf-gap"></span><i class="csf-dash"></i><i class="csf-line r"></i>${csHex}
          <img class="csf-logo" src="assets/brand/logo-tftclimb.webp" alt="TFTClimb" width="720" height="265" loading="lazy"></div></div>`
    : `<div class="csp-head"><span class="csp-ic">${csIco(id)}</span><div><h2>${csName(id)}</h2><p>${L(m.h[0], m.h[1])}</p></div></div>
    <div class="csp-box">${body}</div>`;
  return `<section class="cs-sec card${framed ? ' csf-sec' : ''}" id="cs-${id}" hidden>
    ${main}
    ${tip ? `<div class="csp-tip">${csSvg('<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 7.5v.5"/>', 2)}<span>${tip}</span></div>` : ''}
    ${cards ? `<div class="csp-rel">${cards}</div>` : ''}
  </section>`;
}
// Rahmenlinie passend zur Größe der Box zeichnen: abgeschrägte Ecken, Aussparung unten in der Mitte für das Logo, pinke Eck-Akzente
function csfDraw(box){
  const W = box.clientWidth, H = box.clientHeight, svg = box.querySelector('.csf-svg'); if(!W || !H || !svg) return;
  const u = box.dataset.fid || (box.dataset.fid = 'f' + (++csfDraw.n));   // eigene IDs je Rahmen – sonst greifen versteckte Tabellen auf die Verläufe der ersten zu
  const sm = W < 560, c = sm ? 12 : 18, n1 = sm ? 92 : 146, dx = sm ? 26 : 38, d = sm ? 30 : 44, s = 1.5, mx = W / 2, k = 9;
  const path = `M${c} ${s}H${W-c}L${W-s} ${c}V${H-c}L${W-c} ${H-s}H${mx+n1+dx}L${mx+n1} ${H-d}H${mx-n1}L${mx-n1-dx} ${H-s}H${c}L${s} ${H-c}V${c}Z`;
  const pink = [[s+k, c+k-4, c+k-4, s+k], [W-s-k, c+k-4, W-c-k+4, s+k], [s+k, H-c-k+4, c+k-4, H-s-k], [W-s-k, H-c-k+4, W-c-k+4, H-s-k]].map(([a, b, e, f])=>`<path d="M${a} ${b}L${e} ${f}"/>`).join('');
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.innerHTML = `<defs>
      <linearGradient id="csfFill${u}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0d2a34"/><stop offset="1" stop-color="#071a23"/></linearGradient>
      <radialGradient id="csfGlow${u}" cx=".5" cy="0" r=".7"><stop offset="0" stop-color="#2ee6d6" stop-opacity=".12"/><stop offset="1" stop-color="#2ee6d6" stop-opacity="0"/></radialGradient>
      <pattern id="csfHexP${u}" width="64" height="110.85" patternUnits="userSpaceOnUse"><path d="M32 0l32 18.48v36.95L32 73.9 0 55.43V18.48zM32 73.9l32 18.48v18.47M32 73.9L0 92.38v18.47" fill="none" stroke="#000" stroke-opacity=".4" stroke-width="1.4"/><path d="M32 1.5l30.7 17.7" fill="none" stroke="#2ee6d6" stroke-opacity=".07"/></pattern>
      <linearGradient id="csfLine${u}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2ee6d6"/><stop offset=".5" stop-color="#3fd3f0"/><stop offset="1" stop-color="#2ee6d6"/></linearGradient>
    </defs>
    <path d="${path}" fill="url(#csfFill${u})"/><path d="${path}" fill="url(#csfHexP${u})"/><path d="${path}" fill="url(#csfGlow${u})"/>
    <path class="csf-edge" d="${path}" fill="none" stroke="url(#csfLine${u})" stroke-width="2" stroke-linejoin="round"/>
    <path class="csf-top" d="M${W*.3} ${s}H${W*.7}" fill="none"/>
    <g class="csf-pink">${pink}</g>`;
}
csfDraw.n = 0;
const csfRO = 'ResizeObserver' in window ? new ResizeObserver(es=>es.forEach(e=>csfDraw(e.target))) : null;
function csFilter(q){
  q = q.trim().toLowerCase();
  document.querySelectorAll('#csPage .cs-group').forEach(g=>{
    let any = false;
    g.querySelectorAll('.cs-tile').forEach(a=>{ const ok = !q || a.textContent.toLowerCase().includes(q); a.hidden = !ok; any = any || ok; });
    g.hidden = !any; g.classList.toggle('force-open', !!q);
  });
}
let csFromSide = false;   // Klick in der Seitenleiste: deren Auf/Zu-Zustand bleibt, kein Scrollen
document.addEventListener('click', e=>{ if(e.target.closest && e.target.closest('#csPage .cs-side .cs-tile')) csFromSide = true; }, true);
function renderCheats(sub){
  const box = $('#csPage'); if(!box) return;
  const secs = csList(), S = TFT_DATA.set;
  if(!box.dataset.done){
    const flat = CS_GROUPS.flatMap(g=>g[1]).filter(id=>secs.some(s=>s[0]===id));
    // Gruppen: Symbol, Name, Anzahl der Tabellen, Pfeil zum Aufklappen
    const GIC = ['<rect x="4" y="4" width="16" height="16" rx="2.5"/><path d="M4 10h16M10 4v16"/>', '<path d="M12 2.5l8.2 4.75v9.5L12 21.5l-8.2-4.75v-9.5z"/><path d="M12 8.2l1.1 2.4 2.6.3-1.9 1.8.5 2.6L12 14l-2.3 1.3.5-2.6-1.9-1.8 2.6-.3z"/>', CS_IC_TRAIT, '<circle cx="6" cy="12" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="18" cy="12" r="1.7"/>'];
    const side = CS_GROUPS.map(([g, ids], gi)=>{
      ids = ids.filter(id=>secs.some(s=>s[0]===id));
      const links = ids.map(id=>`<a class="cs-tile" href="${csHref(id)}" data-cs="${id}"><span class="cs-ti">${csIco(id)}</span><span>${csName(id)}</span></a>`).join('');
      return links ? `<div class="cs-group closed" data-g="${gi}"><button type="button" class="cs-gh" aria-expanded="false"><span class="cs-gi">${csSvg(GIC[gi], 1.9)}</span><span class="cs-gt">${L(g[0], g[1])}</span><span class="cs-gn">${ids.length}</span>${csSvg('<path d="M6 9l6 6 6-6"/>', 2.4)}<span></span></button><div class="cs-menu">${links}</div></div>` : '';
    }).join('');
    box.innerHTML = `<div class="cs-head"><img class="cs-vk" src="assets/img/mascot-velkoz.webp" alt="" width="560" height="465">
        <div><div class="crumb" id="csCrumb"></div>
          <h1 class="cs-h1" id="csH1"></h1>
          <p id="csLead"></p></div>
      </div>
      <div class="cs-layout">
        <aside class="cs-side" aria-label="Cheatsheet">
          <div class="cs-side-top"><a class="cs-side-h" href="/cheatsheet">${csHex}<b>Cheat<i>sheets</i></b></a>
          <label class="cs-search">${csSvg('<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>', 2)}<input id="csSearch" type="search" placeholder="${L('Tabelle suchen …', 'Find a table …')}" autocomplete="off" aria-label="${L('Tabelle suchen', 'Find a table')}"><kbd>/</kbd></label></div>
          ${side}
        </aside>
        <div class="cs-main"><div class="cs-ov" id="csOv" hidden>${csHome(secs)}</div>${secs.map(s=>csPanel(s, flat)).join('')}</div>
      </div>
      <div class="cs-foot"><span>Set ${S}${TL_PATCH ? ' · Patch ' + TL_PATCH : ''}</span><span><kbd>/</kbd>${L('Tabellen suchen', 'Search tables')}</span></div>
    <section class="tool-seo" aria-labelledby="ts-cs">
      <div class="ts-main">
        <h2 id="ts-cs">${L('Das TFT Cheatsheet für jede Partie', 'The TFT cheatsheet for every game')}</h2>
        <p>${L(`Viele Entscheidungen in TFT hängen an festen Zahlen: Wann lohnt sich Level 8 für 4-Kosten-Units? Wie wahrscheinlich ist noch ein prismatisches Augment? Was steckt in einem Gold-Orb? Hier stehen alle Systemwerte von Set ${S} auf einer Seite – zum schnellen Nachschlagen neben dem Spiel.`, `Many decisions in TFT depend on fixed numbers: when is level 8 worth it for 4-cost units? How likely is another prismatic augment? What's inside a gold orb? Here are all system values of Set ${S} on one page – for a quick look next to the game.`)}</p>
      </div>
      <aside class="ts-side">
        <h3>${L('Häufige Fragen', 'FAQ')}</h3>
        <details><summary>${L('Wie hoch ist die Chance auf ein prismatisches Augment?', 'What are the odds of a prismatic augment?')}</summary><p>${L('Das erste Augment ist in etwa 9 % der Partien prismatisch. Mindestens ein prismatisches Augment gibt es in knapp der Hälfte der Partien (etwa 48 %).', 'The first augment is prismatic in about 9% of games. Almost half of all games (about 48%) have at least one prismatic augment.')}</p></details>
        <details><summary>${L('Wie viel Schaden bekomme ich nach einer Niederlage?', 'How much damage do I take after a loss?')}</summary><p>${L('Den Stage-Schaden plus 1 für jede gegnerische Unit, die den Kampf überlebt.', 'The stage damage plus 1 for every enemy unit that survives the fight.')}</p></details>
        <details><summary>${L('Wie baue ich ein Emblem?', 'How do I build an emblem?')}</summary><p>${L('Pfannenwender oder Bratpfanne plus eine Komponente. Welches Emblem dabei entsteht, steht in der Tabelle Emblem-Rezepte.', 'Spatula or Frying Pan plus a component. Which emblem you get is listed in the emblem recipes table.')}</p></details>
        <h3>${L('Weiterlesen', 'Read more')}</h3>
        <ul class="ts-links"><li><a href="/tools/tft-rolldown-rechner">${L('Rolldown-Rechner', 'Rolldown calculator')}</a></li><li><a href="/tools/tft-item-drop-chance">${L('Item-Drop-Chance', 'Item Drop Chance')}</a></li><li><a href="/bibliothek/items">${L('Item-Bibliothek', 'Item library')}</a></li></ul>
      </aside>
    </section>`;
    box.dataset.done = '1';
    box.querySelectorAll('.csf-box').forEach(b=>{ if(csfRO) csfRO.observe(b); else csfDraw(b); });
  }
  // /cheatsheet zeigt die Übersicht aller Tabellen, /cheatsheet/<id> die gewählte – jeweils mit eigener Überschrift
  const cur = secs.find(s=>s[0]===sub) || null, m = cur && CS_META[cur[0]];
  $('#csOv').hidden = !!cur; box.classList.toggle('cs-home', !cur);
  box.querySelectorAll('.cs-sec').forEach(s=>{ s.hidden = !cur || s.id !== 'cs-' + cur[0]; });
  box.querySelectorAll('.cs-sec:not([hidden]) .csf-box').forEach(csfDraw);   // Rahmen sofort zeichnen, nicht erst beim nächsten Größen-Ereignis
  box.querySelectorAll('.cs-tile').forEach(a=>a.classList.toggle('on', !!cur && a.dataset.cs===cur[0]));
  // Seitenleiste: Gruppe der gewählten Tabelle aufklappen. Kommt man nicht aus der Leiste selbst (Startseite, Suche, Karten, Link),
  // sind alle anderen Gruppen zu und die Tabelle steht mittig in der Leiste. Am Handy bleibt die Liste zu
  const g = box.querySelector('.cs-tile.on'), fromSide = csFromSide; csFromSide = false;
  if(g && !matchMedia('(max-width:900px)').matches){
    const gr = g.closest('.cs-group');
    box.querySelectorAll('.cs-group').forEach(x=>{ if(x !== gr && fromSide) return; const open = x === gr; x.classList.toggle('closed', !open); x.querySelector('.cs-gh').setAttribute('aria-expanded', open); });
    const mid = ()=>{ const side = box.querySelector('.cs-side'), sr = side.getBoundingClientRect(), tr = g.getBoundingClientRect(), hd = side.querySelector('.cs-side-top').offsetHeight;   // Mitte des sichtbaren Teils unter dem festen Kopf
      side.scrollTop += tr.top - sr.top + tr.height / 2 - (side.clientHeight + hd) / 2; };
    if(!fromSide){ mid(); setTimeout(mid, 150); }   // zweiter Durchlauf, falls Schrift/Bilder die Höhen noch verschieben
  }
  $('#csH1').innerHTML = cur ? 'TFT ' + esc(csName(cur[0])) : 'TFT <em>Cheatsheets</em>';
  $('#csLead').textContent = m && m.h ? L(m.h[0], m.h[1]) : L(`Jede Zahl an einem Ort – dein Nachschlagewerk für Set ${S}.`, `Every number in one place – your quick reference for Set ${S}.`);
  $('#csCrumb').innerHTML = `Home / <a href="/cheatsheet">Cheatsheet</a>${cur ? ' / ' + esc(csName(cur[0])) : ''}`;
}
document.addEventListener('click', e=>{
  const tab = e.target.closest('#csPage [data-cstab]');
  if(tab){ const sec = tab.closest('.cs-sec'); sec.querySelectorAll('[data-cstab]').forEach(b=>{ b.classList.toggle('on', b===tab); b.setAttribute('aria-selected', b===tab); }); sec.querySelectorAll('.csp-pane').forEach((p, i)=>{ p.hidden = i !== +tab.dataset.cstab; }); return; }
  const tg = e.target.closest('#csOv .cs-tab');
  if(tg){ document.querySelectorAll('#csOv .cs-tab').forEach(b=>{ b.classList.toggle('on', b===tg); b.setAttribute('aria-selected', b===tg); }); document.querySelectorAll('#csOv .cs-pane').forEach(p=>{ p.hidden = p.dataset.cstg !== tg.dataset.cstg; }); return; }
  const more = e.target.closest('#csOv .cs-more');
  if(more){ more.closest('.cs-pane').classList.add('all'); more.parentNode.remove(); return; }
  const gh = e.target.closest('#csPage .cs-gh');
  if(gh){ const g = gh.parentNode; g.classList.toggle('closed'); gh.setAttribute('aria-expanded', !g.classList.contains('closed')); return; }
  const row = e.target.closest('#csPage .cs-hm tbody tr');
  if(row) row.parentNode.querySelectorAll('tr').forEach(r=>r.classList.toggle('sel', r===row));
});
document.addEventListener('input', e=>{ if(e.target.id==='csSearch') csFilter(e.target.value); if(e.target.id==='csHeroQ') csHomeSearch(e.target.value); });
document.addEventListener('submit', e=>{ if(e.target.id!=='csHeroForm') return; e.preventDefault(); const h = csHomeSearch($('#csHeroQ').value); if(h && h.length) go(csHref(h[0])); });
// Augment-Baum: gewählten Ast hervorheben (Weg dorthin + alles darunter) und die Blatt-Prozente auf diese Lage umrechnen
function atgMark(svg, k){
  svg.classList.toggle('hl', !!k);
  svg.querySelectorAll('[data-k]').forEach(n=>{ const nk = n.dataset.k; n.classList.toggle('on', !!k && (k.startsWith(nk) || nk.startsWith(k))); });
  const wk = k ? +svg.querySelector(`.atg-n[data-k="${k}"]`).dataset.w : 0;
  svg.querySelectorAll('.atg-leaf').forEach(lf=>{ const p = lf.querySelector('.atg-p'), under = k && lf.dataset.k.startsWith(k) && k.length < 3;
    p.textContent = under ? Math.round(+lf.dataset.w / wk * 100) + '%' : p.dataset.t; p.classList.toggle('cond', !!under); });
}
const atgPick = el => el && el.closest && el.closest('svg.atg .atg-pick, svg.atg .atg-leaf');
document.addEventListener('mouseover', e=>{ const n = atgPick(e.target); if(n) atgMark(n.ownerSVGElement, n.dataset.k); });
document.addEventListener('mouseout', e=>{ const n = atgPick(e.target); if(!n || atgPick(e.relatedTarget)) return; const svg = n.ownerSVGElement; atgMark(svg, svg.dataset.sel || ''); });
// Klick: neues Augment wählen (vorherige Auswahl merken). Erneuter Klick auf die Auswahl geht nur einen Schritt zurück –
// zur letzten gemerkten Auswahl auf diesem Ast (z. B. 2-1 bleibt, wenn man 3-2 wieder abwählt), sonst ganz zurück. Klick daneben hebt alles auf
document.addEventListener('click', e=>{ const svg = e.target.closest && e.target.closest('svg.atg'); if(!svg) return; const n = atgPick(e.target);
  const cur = svg.dataset.sel || ''; let hist = JSON.parse(svg.dataset.hist || '[]'), sel;
  if(!n){ sel = ''; hist = []; }
  else if(n.dataset.k === cur){ let i = hist.length - 1; while(i >= 0 && !(cur.startsWith(hist[i]) && hist[i] !== cur)) i--; sel = i >= 0 ? hist[i] : ''; hist = hist.slice(0, Math.max(i, 0)); }
  else { hist.push(cur); sel = n.dataset.k; }
  svg.dataset.sel = sel; svg.dataset.hist = JSON.stringify(hist); atgMark(svg, sel); svg.dispatchEvent(new CustomEvent('atgsel', {bubbles:true, detail:sel})); });
document.addEventListener('keydown', e=>{   // „/“ springt ins Suchfeld, Esc leert es
  const s = $('#csPage.cs-home') ? $('#csHeroQ') : $('#csSearch'), pg = $('#page-cheatsheet');   // auf der Startseite die große Suche
  if(!s || !pg || !pg.classList.contains('active')) return;
  if(e.key==='/' && !/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)){ e.preventDefault(); s.focus(); }
  else if(e.key==='Escape' && document.activeElement===s){ s.value = ''; csFilter(''); csHomeSearch(''); s.blur(); }
});

/* ================= SEITENTITEL & SUCHMASCHINEN ================= */
// Pro Seite: [Titel, Beschreibung]. Seiten ohne eigenen Inhalt (Platzhalter, Redaktion, 404) werden nicht indexiert.
// Beschreibung: höchstens 134 Zeichen und enthält immer das Keyword der Seite (wie H1 und Adresse).
// Bei Namen unterschiedlicher Länge (Champions, Comps, Cheatsheets) nimmt fit() die erste Variante, die passt.
const META_MAX = 134;
const fit = (...c) => c.find(x=>x.length <= META_MAX) || c[c.length - 1].slice(0, META_MAX - 1).replace(/\s+\S*$/, '') + '…';
const TITLE_MAX = 60 - ' | TFTClimb'.length;   // Google zeigt etwa 60 Zeichen
const fitT = (...c) => c.find(x=>x.length <= TITLE_MAX) || c[c.length - 1];
const kwNorm = s => String(s).toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9äöüß]+/g, ' ').trim();
function pageMeta(page, sub){
  const S = `Set ${TFT_DATA.set}`, P = TL_PATCH ? ` (Patch ${TL_PATCH})` : '', PS = TL_PATCH ? `Patch ${TL_PATCH}` : S, rk = rankBy[sub];
  switch(page){
    case 'home': return [L('TFTClimb – TFT Tierlist, Comps & Coaching', 'TFTClimb – TFT Tier List, Comps & Coaching'), L(`TFT Tierlist für ${S} von Challenger-Spielern: die besten Comps mit Items, Augments und Aufstellung – dazu Tools und Coaching.`,
      `TFT tier list for ${S} by Challenger players: the best comps with items, augments and positioning – plus tools and coaching.`)];
    case 'tierlist':
      if(sub==='items') return [L(`TFT Item-Tierlist ${PS}`, `TFT Item Tier List ${PS}`), L(`TFT Item-Tierlist ${S}: die stärksten kombinierten Items, Lichtversionen, Artefakte und Embleme – bewertet von S bis C.`,
        `TFT item tier list ${S}: the strongest combined items, radiant items, artifacts and emblems – rated from S to C.`)];
      if(sub==='augments') return [L(`TFT Augment-Tierlist ${PS}`, `TFT Augment Tier List ${PS}`), L(`TFT Augment-Tierlist ${S}: die besten Augments in Silber, Gold und Prismatisch für 2-1, 3-2 und 4-2 – bewertet von S bis C.`,
        `TFT augment tier list ${S}: the best silver, gold and prismatic augments for 2-1, 3-2 and 4-2 – rated from S to C.`)];
      if(sub==='holds') return [L(`TFT Holds-Tierlist ${PS}`, `TFT Holds Tier List ${PS}`), L(`TFT Holds-Tierlist ${S}: welche 1-, 2- und 3-Kosten-Champions du von 1-1 bis 1-3 halten solltest – bewertet von S bis C.`,
        `TFT holds tier list ${S}: which 1, 2 and 3 cost champions to hold from 1-1 to 1-3 – rated from S to C.`)];
      return [L(`TFT Tierlist ${PS} – die besten Comps`, `TFT Tier List ${PS} – the Best Comps`), L(`TFT Tierlist ${S}${P}: die besten Comps mit Aufstellung, Items, Augments und Spielplan.`,
        `TFT tier list ${S}${P}: the best comps with positioning, items, augments and game plan.`)];
    case 'bibliothek':
      if(sub==='items') return [L(`TFT Items ${S} – Rezepte & Werte`, `TFT Items ${S} – Recipes & Stats`), L(`Alle TFT Items in ${S}: Rezepte, Komponenten, Lichtversionen, Artefakte und Embleme mit ihren Werten auf einen Blick.`,
        `All TFT items in ${S}: recipes, components, radiant items, artifacts and emblems with their stats at a glance.`)];
      if(sub==='traits') return [L(`TFT Traits ${S} – Stufen & Units`, `TFT Traits ${S} – Tiers & Units`), L(`Alle TFT Traits in ${S}: Ursprünge und Klassen mit Stufen, Effekten und den passenden Champions auf einen Blick.`,
        `All TFT traits in ${S}: origins and classes with tiers, effects and the matching champions at a glance.`)];
      return [L(`TFT Champions ${S} – Kosten & Traits`, `TFT Champions ${S} – Cost & Traits`), L(`Alle ${champions.length} TFT Champions in ${S}: Kosten, Traits und Fähigkeiten – mit den besten Items und Builds aus unserer Tierlist.`,
        `All ${champions.length} TFT champions in ${S}: cost, traits and abilities – with the best items and builds from our tier list.`)];
    case 'ranks': {
      if(rk){ const apex = ['master', 'grandmaster', 'challenger'].includes(sub), en = tr(rk.n);
        return [L(`TFT Rang ${rk.n} – Spielerverteilung`, `TFT Rank ${en} – Player Distribution`), L(fit(`TFT Rang ${rk.n}: wie viel Prozent aller Spieler in ${rk.n} stehen${apex ? '' : ', aufgeteilt auf die Divisionen IV bis I'} – im Vergleich zu allen Rängen.`,
          `TFT Rang ${rk.n}: wie viel Prozent aller Spieler in ${rk.n} stehen${apex ? '' : ', aufgeteilt auf die Divisionen IV bis I'} – im Vergleich.`),
          fit(`TFT rank ${en}: what percentage of all players is in ${en}${apex ? '' : ', split into divisions IV to I'} – compared to every other rank.`,
          `TFT rank ${en}: what percentage of all players is in ${en}${apex ? '' : ', split into divisions IV to I'} – compared to all ranks.`))]; }
      return [L('TFT Ränge & Spielerverteilung', 'TFT Ranks & Player Distribution'), L('Alle TFT Ränge von Eisen bis Challenger mit Divisionen – und wie viel Prozent der Spieler in jedem Rang stehen.',
        'All TFT ranks from Iron to Challenger with divisions – and what percentage of players is in each rank.')];
    }
    case 'champion': {
      const c = champBySlug[sub];
      if(!c) return ['Champion nicht gefunden', '', true];
      return [`${c.n} TFT Build ${S} – Items & Comps`, L(fit(`${c.n} TFT Build für ${S}: die besten Items, Comps und Traits, dazu Fähigkeit und Werte – mit Builds aus unserer Challenger-Tierlist.`,
        `${c.n} TFT Build für ${S}: die besten Items, Comps und Traits, dazu Fähigkeit und Werte – aus unserer Tierlist.`),
        fit(`${c.n} TFT build for ${S}: the best items, comps and traits, plus ability and stats – with builds from our Challenger tier list.`,
        `${c.n} TFT build for ${S}: the best items, comps and traits, plus ability and stats – from our tier list.`))];
    }
    case 'comp': {
      const c = compByKey[sub];
      if(!c) return ['Comp nicht gefunden', '', true];
      const tDe = c.tier === 'X' ? 'situativ' : c.tier + '-Tier', tEn = c.tier === 'X' ? 'situational' : c.tier + '-tier';
      return [L(`${c.name} – TFT Comp Guide ${S}`, `${c.name} – TFT Comp Guide ${S}`), L(fit(`${c.name} TFT Comp Guide (${S}): Aufstellung, Items für ${c.carry}, Augments und Spielplan – ${tDe} in unserer Tierlist.`,
        `${c.name} TFT Comp Guide (${S}): Aufstellung, Items für ${c.carry}, Augments und Spielplan – ${tDe}.`, `${c.name} TFT Comp Guide: Aufstellung, Items, Augments und Spielplan – ${tDe}.`),
        fit(`${c.name} TFT comp guide (${S}): positioning, items for ${c.carry}, augments and game plan – ${tEn} in our tier list.`,
        `${c.name} TFT comp guide (${S}): positioning, items for ${c.carry}, augments and game plan – ${tEn}.`, `${c.name} TFT comp guide: positioning, items, augments and game plan – ${tEn}.`))];
    }
    case 'builder': return [L(`TFT Team Builder ${S} – Board planen & teilen`, `TFT Team Builder ${S} – Plan & Share Boards`), L(`Kostenloser TFT Team Builder für ${S}: Units platzieren, Items verteilen, aktive Traits sehen und dein Board als Link teilen.`,
      `Free TFT Team Builder for ${S}: place units, add items, see active traits and share your board as a link.`)];
    case 'coaching': return [L('TFT Coaching von Challenger-Spielern', 'TFT Coaching from Challenger Players'), L('TFT Coaching von Challengern auf Deutsch und Englisch: Fundamentals und VOD-Review – das Kennenlernen ist kostenlos.',
      'TFT coaching from Challengers in German and English: fundamentals and VOD review – the intro call is free.')];
    case 'about':
      if(sub==='crazyslayt') return ['CrazYSlayt – TFT Challenger & Founder', L('Claudio „CrazYSlayt“: TFT Challenger seit Set 15, Founder von TFTClimb und Coach seit Set 17 – Profil, Ränge und Coaching.',
        'Claudio "CrazYSlayt": TFT Challenger since Set 15, founder of TFTClimb and coach since Set 17 – profile, ranks and coaching.')];
      if(sub==='humbadobo') return ['humbadobo – TFT Challenger & Coach', L('Romano „humbadobo“: TFT Challenger seit Set 15 mit Peak 1.447 LP und Coach bei TFTClimb – Profil, Ränge und Coaching.',
        'Romano "humbadobo": TFT Challenger since Set 15 with a peak of 1,447 LP and coach at TFTClimb – profile, ranks and coaching.')];
      return ['Meet the Team', L('Meet the Team: die Challenger-Spieler und Coaches hinter TFTClimb – wer wir sind, was wir spielen und wie wir coachen.',
        'Meet the team: the Challenger players and coaches behind TFTClimb – who we are, what we play and how we coach.')];
    case 'apply': return [L('TFT Coaching anfragen', 'Request TFT Coaching'), L('Bewerbung fürs TFT Coaching bei TFTClimb: Formular ausfüllen und ein kostenloses Kennenlernen mit unseren Coaches anfragen.',
      'Apply for TFT coaching at TFTClimb: fill in the form and request a free intro call with our coaches.')];
    case 'patches': {
      const p = patchBySlug[sub];
      if(p) return [L(`TFT Patch ${p.id} – alle Änderungen`, `TFT Patch ${p.id} – All Changes`), patchIntro(p)];
      return [L('TFT Patch Notes – alle Änderungen', 'TFT Patch Notes – All Changes'), L('Alle TFT Patches übersichtlich aufbereitet: jede Änderung an Champions, Traits, Items und Augments auf einen Blick.',
        'All TFT patches neatly prepared: every change to champions, traits, items and augments at a glance.')];
    }
    case 'countdown': {
      const n = stNextPatch(), id = n && n.id;
      if(!id) return [L('TFT Patch Countdown – nächster TFT Patch', 'TFT Next Patch Countdown'), L('TFT Patch Countdown: Wann kommt der nächste TFT Patch? Live-Countdown bis zum nächsten Patch mit Datum und Uhrzeit.',
        'TFT next patch countdown: when is the next TFT patch? Live countdown to the next patch with date and time.')];
      return [L(`TFT Patch Countdown – nächster Patch ${id}`, `TFT Next Patch Countdown – Patch ${id}`),
        L(fit(`TFT Patch Countdown: Wann kommt der nächste TFT Patch? Live-Countdown bis Patch ${id} mit Datum, Uhrzeit und allen Terminen von ${S}.`, `TFT Patch Countdown: Wann kommt der nächste TFT Patch? Live-Countdown bis Patch ${id} mit Datum, Uhrzeit und allen Terminen.`),
          fit(`TFT next patch countdown: when is the next TFT patch? Live countdown to patch ${id} with date, time and every patch date of ${S}.`, `TFT next patch countdown: when is the next TFT patch? Live countdown to patch ${id} with date, time and every patch date.`))];
    }
    case 'impressum': return [L('Impressum', 'Legal Notice'), L('Impressum von TFTClimb: Anbieter, Kontakt und Verantwortlicher für die Inhalte der TFT Seite tftclimb.com.',
      'Legal notice of TFTClimb: provider, contact and the person responsible for the content of the TFT site tftclimb.com.')];
    case 'datenschutz': return [L('Datenschutzerklärung', 'Privacy Policy'), L('Datenschutzerklärung von TFTClimb: welche Daten wir erheben, wie wir Google Analytics nutzen und welche Rechte du hast.',
      'Privacy policy of TFTClimb: what data we collect, how we use Google Analytics and what rights you have.')];
    case 'cheatsheet': {
      const cs = csList().find(s=>s[0]===sub), m = cs && CS_META[cs[0]];
      if(cs){
        const nm = cs[1].replace(/ \(.*\)$/, ''), title = fitT(`TFT ${nm} ${S} – Cheatsheet`, `TFT ${nm} ${S}`, `TFT ${nm}`);
        if(cs[0]==='shop') return [`TFT Shop Odds & XP ${S} – Cheatsheet`, L(`TFT Shop Odds & XP für ${S}: Shop-Chancen pro Level, Pool-Größen und XP bis zum nächsten Level – übersichtlich als Tabelle.`,
          `TFT shop odds & XP for ${S}: shop odds per level, pool sizes and XP to the next level – neatly in one table.`)];
        // Keyword aus der Adresse fehlt im deutschen Namen (z. B. „Wir halten zusammen“ ↔ tft-we-stick-together): englischen Namen dazuschreiben
        const de = m.s[0], en = m.s[1], kw = kwNorm(csHref(cs[0]).split('/').pop().replace(/^tft-/, ''));
        const has = (s, k) => ` ${kwNorm(s)} `.includes(` ${k} `), nameDe = !has(de, kw) && has(en, kw) ? `${de} (${en})` : de, d = m.d;
        return [title, L(fit(`TFT ${nameDe} für ${S}: ${d[0]}. Alle Werte übersichtlich als Tabelle im TFTClimb Cheatsheet.`, `TFT ${nameDe} für ${S}: ${d[0]} – übersichtlich als Tabelle.`, `TFT ${nameDe}: ${d[0]} als Tabelle.`),
          fit(`TFT ${en} for ${S}: ${d[1].charAt(0).toLowerCase() + d[1].slice(1)}. Every number neatly in one table in the TFTClimb cheatsheet.`, `TFT ${en} for ${S}: ${d[1].charAt(0).toLowerCase() + d[1].slice(1)} – neatly in one table.`))];
      }
    }
    return [`TFT Cheatsheets ${S} – Shop Odds & Augments`, L(`TFT Cheatsheets für ${S}: Shop Odds, Augment-Stufen, Encounters, Loot-Orbs, Spielerschaden und mehr – alle Zahlen auf einen Blick.`,
      `TFT cheatsheets for ${S}: shop odds, augment tiers, encounters, loot orbs, player damage and more – every number at a glance.`)];
    case 'bedingungen': return [L('Widerruf & Bedingungen', 'Withdrawal & Terms'), L('Widerruf & Bedingungen für das TFT Coaching bei TFTClimb: Widerrufsbelehrung, Muster-Formular und Regeln für alle Pakete.',
      'Withdrawal & terms for TFT coaching at TFTClimb: withdrawal policy, model form and the rules for every package.')];
    case 'guides':
      if(GUIDES_LIVE && sub==='encounters') return [`TFT Encounters Guide ${S}`, L(`TFT Encounters Guide für ${S}: was jeder Encounter macht, wie oft er kommt und welche Comp du darauf spielst.`,
        `TFT encounters guide for ${S}: what each encounter does, how often it shows up and which comp to play on it.`)];
      return ['TFT Guides', L(`TFT Guides von Challenger-Spielern für ${S}: Strategien, Comps und Encounters – bald hier auf TFTClimb.`, `TFT guides from Challenger players for ${S}: strategies, comps and encounters – coming soon to TFTClimb.`), true];
    case 'tools':
      if(sub==='augments') return [L(`TFT Augment-Vorhersage ${S} – nächste Stufe`, `TFT Augment Prediction ${S} – Next Tier`), L(`TFT Augment-Vorhersage für ${S}: Silber, Gold oder Prismatisch? Sieh, welche Augment-Stufe als Nächstes am wahrscheinlichsten kommt.`,
        `TFT augment prediction for ${S}: silver, gold or prismatic? See which augment tier is most likely to come next.`)];
      if(sub==='tierlist') return [L(`TFT Tierlist-Maker ${S} – eigene Tierlist`, `TFT Tier List Maker ${S} – Your Own List`), L(`Kostenloser TFT Tierlist-Maker für ${S}: Champions, Items und Augments per Drag & Drop ranken und deine Tierlist als Link teilen.`,
        `Free TFT tier list maker for ${S}: rank champions, items and augments by drag & drop and share your tier list as a link.`)];
      if(sub==='rolldown') return [L(`TFT Rolldown-Rechner ${S} – Odds pro Level`, `TFT Rolldown Calculator ${S} – Odds per Level`), L(`TFT Rolldown-Rechner für ${S}: Wie wahrscheinlich triffst du deine Units? Mit Shop-Odds pro Level, Pool-Größen und Gold-Bedarf.`,
        `TFT rolldown calculator for ${S}: how likely are you to hit your units? With shop odds per level, pool sizes and gold needed.`)];
      if(sub==='drops') return [L(`TFT Item-Drop-Chance ${S} – nächste Komponente`, `TFT Item Drop Chance ${S} – Next Component`), L(`TFT Item-Drop-Chance für ${S}: Trag deine Drops aus den Creep-Runden ein und sieh, welche Komponente als Nächstes kommt.`,
        `TFT item drop chance for ${S}: enter your drops from the creep rounds and see which component comes next.`)];
      if(sub==='dps') return [L(`TFT DPS-Vergleich ${S} – Builds vergleichen`, `TFT DPS Comparison ${S} – Compare Builds`), L(`TFT DPS-Vergleich für ${S}: Vergleich bis zu vier Item-Builds eines Champions und sieh, welcher am meisten Schaden macht.`,
        `TFT DPS comparison for ${S}: compare up to four item builds of a champion and see which one deals the most damage.`)];
      if(sub==='simulator') return [L(`TFT Kampf-Simulator ${S} – Teams testen`, `TFT Fight Simulator ${S} – Test Teams`), L(`TFT Kampf-Simulator für ${S}: Lass zwei Teams gegeneinander kämpfen und sieh Laufwege, Ziele und Fähigkeiten Schritt für Schritt.`,
        `TFT fight simulator for ${S}: let two teams fight each other and see paths, targets and abilities step by step.`)];
      return [L(`TFT Tools ${S} – Rolldown, DPS & Tierlist`, `TFT Tools ${S} – Rolldown, DPS & Tier List`), L(`Kostenlose TFT Tools für ${S}: Rolldown-Rechner, DPS-Vergleich, Item-Drop-Chance, Augment-Vorhersage und Tierlist-Maker.`,
        `Free TFT tools for ${S}: rolldown calculator, DPS comparison, item drop chance, augment prediction and tier list maker.`)];
    case 'news': return ['TFT News', '', true];
    case 'admin': return ['Redaktion', '', true];
    default: return [L('Seite nicht gefunden', 'Page not found'), '', true];
  }
}
// Der Meta-Text steht sichtbar als Einleitung direkt unter der H1, Wort für Wort gleich – so liegt bei uns, was Google als Beschreibung zeigt.
// Steht dort schon ein Einleitungssatz, ersetzt ihn der Meta-Text; Rechtstexte (data-keep) bleiben, der Meta-Text kommt davor.
let META_DESC = '';
function metaLead(desc){
  const pg = document.querySelector('.page.active'); if(!pg || !desc) return;
  const vis = el => el.getClientRects().length > 0;
  if([...pg.querySelectorAll('[data-meta]')].some(el=>vis(el) && el.textContent.includes(desc))) return;   // schon da (z. B. Patch-Ansage)
  const h1 = [...pg.querySelectorAll('h1, [data-h1]')].find(vis); if(!h1) return;
  let ref = h1, n = ref.nextElementSibling;   // Dashboard: in der Titelzeile rechts neben der H1 (CSS .dsh-title)
  while(n && n.matches('.cv-sub')){ ref = n; n = n.nextElementSibling; }   // kurze Unterzeile (Bibliothek) bleibt darüber
  let p = n && n.tagName === 'P' && !n.matches('[data-keep], .updated, .pd-lang') ? n : null;
  if(!p){ p = document.createElement('p'); p.className = 'meta-lead'; ref.after(p); }
  p.setAttribute('data-meta', ''); p.textContent = desc;
}
function headTag(sel, make){ let el = document.head.querySelector(sel); if(!el){ el = make(); document.head.appendChild(el); } return el; }
function setMeta(page, sub){
  let [title, desc, noindex] = pageMeta(page, sub);
  title = tr(title); if(desc) desc = tr(desc);   // englische Seite: über das Wörterbuch
  document.title = page==='home' ? title : title + ' | TFTClimb';
  if(desc) headTag('meta[name="description"]', ()=>Object.assign(document.createElement('meta'), {name:'description'})).content = desc;
  headTag('meta[name="robots"]', ()=>Object.assign(document.createElement('meta'), {name:'robots'})).content = noindex ? 'noindex' : 'index, follow';
  META_DESC = noindex ? '' : desc || ''; metaLead(META_DESC);
  if(FILE_MODE) return;
  if(noindex){ const c = document.head.querySelector('link[rel="canonical"]'); if(c) c.remove(); return; }
  // kanonische Adresse: eine Adresse pro Inhalt (z. B. /bibliothek statt /bibliothek/champions, Builder ohne Team-Code)
  const keep = {cheatsheet:csList().map(s=>s[0]), guides:['encounters'], tierlist:['items','augments','holds'], bibliothek:['items','traits'], tools:['rolldown','tierlist','simulator','drops','dps','augments'], patches:Object.keys(patchBySlug), ranks: rankBy[sub] ? [sub] : [], about:['crazyslayt','humbadobo']}[page] || [];
  const path = page==='home' ? '/' : page==='champion' ? champHref(champBySlug[sub].n) : page==='comp' ? compHref(compByKey[sub]) : seoPath('/' + page + (keep.includes(sub) ? '/' + sub : ''));
  headTag('link[rel="canonical"]', ()=>Object.assign(document.createElement('link'), {rel:'canonical'})).href = location.origin + withLang(path);
  // beide Sprachfassungen für Suchmaschinen verknüpfen
  [['de', path], ['en', enPath(path)], ['x-default', path]].forEach(([l, p])=>{ headTag(`link[rel="alternate"][hreflang="${l}"]`, ()=>Object.assign(document.createElement('link'), {rel:'alternate', hreflang:l})).href = location.origin + p; });
  // Sprachumschalter zeigen auf die Gegenstück-Adresse dieser Seite
  document.querySelectorAll('a[hreflang="de"]').forEach(a=>a.setAttribute('href', path));
  document.querySelectorAll('a[hreflang="en"]').forEach(a=>a.setAttribute('href', enPath(path)));
  // Vorschau beim Teilen (Discord, WhatsApp, X …)
  const url = location.origin + withLang(path), tool = page==='tools' ? (sub && keep.includes(sub) ? sub : 'overview') : page==='builder' ? 'builder' : '';
  const chN = page==='champion' ? champBySlug[sub].n : page==='comp' ? compByKey[sub].carry : '';   // Vorschaubild: Champion bzw. Carry der Comp
  const chImg = chN && (champImg(chN) || champFallback(chN));
  const img = chImg || location.origin + '/' + ({tierlist:'assets/tools/tierlist.webp', drops:'assets/tools/drops.webp', simulator:'assets/tools/simulator.webp', augments:'assets/tools/augments.webp'}[tool] || (tool ? 'assets/img/mascot-heimer-wave.webp' : 'assets/img/mascot-vi.webp'));
  const og = (k, v) => { headTag(`meta[property="${k}"]`, ()=>{ const m = document.createElement('meta'); m.setAttribute('property', k); return m; }).content = v; };
  og('og:title', document.title); og('og:description', desc || ''); og('og:url', url); og('og:type', 'website'); og('og:site_name', 'TFTClimb'); og('og:locale', EN ? 'en_GB' : 'de_DE'); og('og:image', img);
  headTag('meta[name="twitter:card"]', ()=>Object.assign(document.createElement('meta'), {name:'twitter:card'})).content = 'summary';
  setLd(page, sub, tool, title, desc, url, path);
}
// Strukturierte Daten für Google: Brotkrumen, bei Tools zusätzlich Web-App und die Fragen aus dem Textblock
const LD_SECTION = {cheatsheet:'Cheatsheet', guides:'Guides', tierlist:'Tierlist', tools:'Tools', bibliothek:'Bibliothek', ranks:'Ranks', patches:'Patches', about:'Meet the Team', builder:'Team Builder', coaching:'Coaching', apply:'Coaching', impressum:'Impressum', datenschutz:'Datenschutz'};
function setLd(page, sub, tool, title, desc, url, path){
  const org = {'@type':'Organization', name:'TFTClimb', url:location.origin + withLang('/'), logo:location.origin + '/assets/brand/logo-symbol-512.png', email:'info@tftclimb.com'};
  const graph = [{'@type':'WebSite', name:'TFTClimb', url:location.origin + withLang('/'), inLanguage:EN ? 'en' : 'de', publisher:org}];
  if(page!=='home'){
    const items = [['Home', '/']], sec = LD_SECTION[page];
    if(page==='champion') items.push([tr('Bibliothek'), '/bibliothek'], ['Champions', '/bibliothek/champions'], [champBySlug[sub].n, path]);
    else if(page==='comp') items.push(['Tierlist', '/tierlist'], [compByKey[sub].name, path]);
    else if(page==='countdown') items.push(['Patches', '/patches'], [title.split(' – ')[0], path]);
    else {
      if(sec) items.push([tr(sec), '/' + page]);
      if(path !== '/' + page) items.push([title.split(' – ')[0], path]);
    }
    graph.push({'@type':'BreadcrumbList', itemListElement:items.map(([n, p], i)=>({'@type':'ListItem', position:i + 1, name:n, item:location.origin + withLang(p)}))});
  }
  if(tool){
    graph.push({'@type':'WebApplication', name:title.split(' – ')[0], url, description:desc, applicationCategory:'GameApplication', operatingSystem:'Web', browserRequirements:'JavaScript', inLanguage:EN ? 'en' : 'de', isAccessibleForFree:true, offers:{'@type':'Offer', price:'0', priceCurrency:'EUR'}, publisher:org});
    const box = tool==='builder' ? $('#page-builder .tool-seo.b-only') : tool==='simulator' ? $('#page-builder .tool-seo.b-simonly') : $(`#page-tools .tool-view[data-tool="${tool==='overview' ? '' : tool}"] .tool-seo`);
    const qa = box ? [...box.querySelectorAll('details')].map(d=>({'@type':'Question', name:d.querySelector('summary').textContent.trim(), acceptedAnswer:{'@type':'Answer', text:d.querySelector('p').textContent.trim()}})) : [];
    if(qa.length) graph.push({'@type':'FAQPage', mainEntity:qa});
  }
  if(page==='champion' || page==='comp' || page==='cheatsheet' || page==='countdown' || (page==='guides' && sub && GUIDES_LIVE)){   // Fragen aus dem Textblock der Champion-/Comp-Seite, des Cheatsheets, des Countdowns bzw. des Guides
    const qa = [...document.querySelectorAll(page==='champion' ? '#chPage .tool-seo details' : page==='comp' ? '#compPage .tool-seo details' : page==='cheatsheet' ? '#csPage .tool-seo details' : page==='countdown' ? '#cdApp .tool-seo details' : `#page-guides .gd-view[data-guide="${sub}"] .tool-seo details`)].map(d=>({'@type':'Question', name:d.querySelector('summary').textContent.trim(), acceptedAnswer:{'@type':'Answer', text:d.querySelector('p').textContent.trim()}}));
    if(qa.length) graph.push({'@type':'FAQPage', mainEntity:qa});
  }
  const pt = page==='patches' && patchBySlug[sub];   // Patch-Seite als Artikel mit CrazYSlayt als Autor
  if(pt) graph.push({'@type':'Article', headline:title.split(' | ')[0], description:desc, datePublished:pt.date, inLanguage:EN ? 'en' : 'de', mainEntityOfPage:url, publisher:org,
    ...(pt.img ? {image:pt.img} : {}), author:{'@type':'Person', name:'Claudio "CrazYSlayt"', alternateName:'CrazYSlayt', jobTitle:'TFT Challenger & TFTClimb Coach', url:location.origin + withLang(PATCH_AUTHOR.href)}});
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

// Eine H1 pro Adresse: Alle Seiten und Ansichten liegen gleichzeitig im HTML (ausgeblendet). Damit Google pro Adresse genau
// eine Überschrift sieht, ist nur die sichtbare eine <h1> – ausgeblendete (andere Tools, Coach-Profile, Seiten) werden zu <div data-h1>
function h1Swap(el, tag){ const n = document.createElement(tag); [...el.attributes].forEach(a=>n.setAttribute(a.name, a.value)); while(el.firstChild) n.appendChild(el.firstChild); el.replaceWith(n); return n; }
function h1Sync(){
  document.querySelectorAll('h1, [data-h1]').forEach(el=>{
    const show = !!el.closest('.page.active') && !el.closest('[hidden], [data-slide]') && el.getClientRects().length > 0;
    if(show && el.tagName !== 'H1') h1Swap(el, 'h1').removeAttribute('data-h1');
    else if(!show && el.tagName === 'H1') h1Swap(el, 'div').setAttribute('data-h1', '');
  });
}
function route(){
  // lokal: normale Sprunganker (z. B. #main) nicht als Seite behandeln
  if(FILE_MODE && location.hash && !location.hash.startsWith('#/') && document.querySelector('.page.active')) return;
  const cp = curPath(), cpPath = cp.split('?')[0], seo = seoPath(cpPath);
  // alte Adresse oder Adresse in der anderen Sprachform (z. B. /en/tools/tft-rolldown-rechner) → richtige Adresse dieser Sprache
  if(withLang(seo) !== (rawPath().split('?')[0] || '/') && !(seo === '/' && EN)) setUrl(seo + (FILE_MODE ? (cp.includes('?') ? cp.slice(cp.indexOf('?')) : '') : location.search));
  const parts = seo.replace(/^\/+/,'').split('/');
  let page = parts[0] || 'home', sub = parts[1];
  // sprechende Adressen auf die internen Schlüssel zurückführen
  if('/' + page === BUILDER_PATH) page = 'builder';
  if('/' + page === COUNTDOWN_PATH && !sub) page = 'countdown';
  if(sub && page==='tools') sub = unslug(TOOL_SLUG, sub);
  if(sub && page==='cheatsheet'){ const k = unslug(CS_SLUG, sub); sub = k !== sub ? k : sub.replace(/^tft-/, ''); }
  if(sub && page==='guides') sub = unslug(GUIDE_SLUG, sub);
  // Champion-Seiten: /champions/<name>
  if(page==='champions' && sub){ page = 'champion'; }
  // Comp-Seiten: /comps/<name>, /comps allein = Tierlist
  if(page==='comps'){ page = sub ? 'comp' : 'tierlist'; }
  // alte Adressen weiter unterstützen
  if(['champions','items','traits'].includes(page)){ sub = page; page = 'bibliothek'; }
  if(page==='augments'){ sub = 'augments'; page = 'tierlist'; }
  const valid = ['home','tierlist','bibliothek','champion','comp','cheatsheet','bedingungen','ranks','builder','admin','news','tools','coaching','guides','about','apply','impressum','datenschutz','patches','countdown'];
  if(!valid.includes(page)) page='notfound';
  const isSim = page==='tools' && sub==='simulator';   // der Simulator nutzt die Builder-Oberfläche
  const isCv = page==='bibliothek' && !['items','traits'].includes(sub);   // Champions: Wabenansicht (auch alte Adresse /bibliothek/v2)
  const pageId = isCv ? 'champv2' : page==='bibliothek' ? 'library' : isSim ? 'builder' : ND && page==='home' ? 'dash' : page;
  document.querySelectorAll('.page').forEach(p=>p.classList.toggle('active', p.id==='page-'+pageId));
  // Große Bilder versteckter Seiten (Tool-Karten, Maskottchen) stehen als data-src im HTML und laden erst, wenn die Seite zu sehen ist
  document.querySelectorAll(`#page-${pageId} img[data-src]`).forEach(i=>{ i.src = i.dataset.src; i.removeAttribute('data-src'); });
  const pageEl = $('#page-' + pageId); if(pageEl && pageId !== 'tools') toolArtLoad(pageEl);   // Tools: nur das geöffnete Tool (renderTools)
  tnUpdate(isSim ? 'simulator' : page === 'tools' ? sub : '');
  // Seitenbreite: Übersichtsseiten breit wie das Dashboard, Unterseiten (einzelnes Tool, Cheatsheet, Champion, Patch, Rang, Profil, Rechtliches) schmaler
  const subOk = {tools:['rolldown','tierlist','simulator','drops','dps','augments'], cheatsheet:csList().map(s=>s[0]), patches:Object.keys(patchBySlug), ranks:Object.keys(rankBy), about:['crazyslayt','humbadobo']}[page];
  document.body.dataset.lvl = ['champion','comp','builder','apply','impressum','datenschutz','bedingungen','countdown'].includes(page) || (subOk && subOk.includes(sub)) ? 'sub' : 'top';
  let navKey = page==='champion' ? 'bibliothek' : page==='comp' ? 'tierlist' : page==='countdown' ? 'patches' : page;
  $('#statBar').classList.toggle('sb-off', page!=='home');   // LP-Grenzen und Patch-Countdown nur auf der Startseite
  if(page==='home') requestAnimationFrame(()=>sbCount(true));   // beim Öffnen der Startseite die LP hochzählen
  if(!isSim) simPause();
  if(page==='tierlist') setTab(['items','augments','holds'].includes(sub)?sub:'comps');
  if(page==='guides') setGuide(sub);
  if(isCv) requestAnimationFrame(renderChampV2);
  else if(page==='bibliothek') setLib(['items','traits'].includes(sub)?sub:'champions');
  if(page==='ranks') setRank(sub);
  if(page==='builder') builderRoute(sub, parts[2], 'builder');
  if(page==='admin') renderAdmin();
  if(page==='about') setAbout(sub);
  if(isSim) builderRoute(parts[2], parts[3], 'sim');
  else if(page==='tools') renderTools(sub, parts[2], parts[3]);
  if(page==='patches') renderPatches(sub);
  if(page==='countdown') renderCountdown();
  if(page==='champion') renderChampPage(sub);
  if(page==='comp') renderCompPage(sub);
  if(page==='cheatsheet') renderCheats(sub);
  if(page==='apply'){ const pk = qParam('paket'), sel = $('#fPkg'); if(pk && sel && [...sel.options].some(o=>o.value===pk)) sel.value = pk; }   // z. B. /apply?paket=vip
  document.querySelectorAll('[data-route]').forEach(a=>a.classList.toggle('active', a.dataset.route===navKey));
  if(['cheatsheet','guides','about','apply','patches'].includes(navKey)) $('#moreBtn').classList.add('active');
  else $('#moreBtn').classList.remove('active');
  moreMenu.classList.remove('open'); drawer.classList.remove('open');
  closeModal(); window.scrollTo(0,0);
  if(ND) ndRoute(page, navKey);
  setMeta(page, sub);
  h1Sync(); requestAnimationFrame(()=>requestAnimationFrame(()=>{ h1Sync(); metaLead(META_DESC); }));   // zweiter Lauf für Inhalte, die erst im nächsten Bild entstehen
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
    }
  } while((n = tw.nextNode()));
  // Textfelder überspringt der Walker samt Inhalt – ihre Platzhalter trotzdem übersetzen
  root.querySelectorAll('textarea[placeholder]').forEach(t=>{ if(!t.closest('[data-noi18n]')){ const v = trStr(t.placeholder); if(v !== null) t.placeholder = v; } });
}
// Englische Seite: jeder interne Link zeigt auf die englische Adresse – auch in Bereichen ohne Übersetzung (z. B. Dashboard).
// Die Sprachumschalter (hreflang) behalten ihr Ziel
function enHref(a){ const h = a.getAttribute('href'); if(h && h[0] === '/' && h[1] !== '/' && !a.hasAttribute('hreflang')){ const w = withLang(h); if(w !== h) a.setAttribute('href', w); } }
function enHrefs(root){ if(!EN || root.nodeType !== 1) return; if(root.tagName === 'A') enHref(root); root.querySelectorAll('a[href]').forEach(enHref); }
function i18nStart(){
  if(!EN && !I18N_HARVEST) return;
  i18nNode(document.body); enHrefs(document.body);
  new MutationObserver(list=>{ for(const m of list){
    if(m.type === 'childList') m.addedNodes.forEach(n=>{ i18nNode(n); enHrefs(n); });
    else if(m.type === 'characterData') i18nNode(m.target);
    else if(m.type === 'attributes'){   // nur das geänderte Attribut prüfen, nicht den ganzen Inhalt
      const el = m.target, a = m.attributeName, x = el.getAttribute(a);
      if(a === 'href'){ if(el.tagName === 'A') enHref(el); continue; }
      if(!x || el.closest('[data-noi18n]')) continue;
      const v = trStr(x); if(v !== null) el.setAttribute(a, v);
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
$('#openSearch').insertAdjacentHTML('beforebegin', `<a class="tb-lang${EN ? ' is-en' : ''}" id="langBtn" href="${EN ? curPath() : enPath(curPath())}" hreflang="${EN ? 'de' : 'en'}" role="switch" aria-checked="${EN}" title="${EN ? 'Deutsche Version' : 'English version'}" aria-label="Deutsch / English" data-noi18n><i class="tl-knob"></i><span class="tl-opt tl-de">${FLAG_DE}<b>DE</b></span><span class="tl-opt tl-en">${FLAG_US}<b>EN</b></span></a>`);
$('#langBtn').addEventListener('click', e=>{
  e.preventDefault(); e.stopPropagation();
  try { localStorage.setItem('tftfreaks_lang', EN ? 'de' : 'en'); } catch(_){}
  const p = curPath(), to = (EN ? p : enPath(p)) + location.search;
  e.currentTarget.classList.toggle('is-en', !EN);   // Regler erst rüberschieben, dann wechseln
  const still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  setTimeout(()=>{ location.href = to; }, still ? 0 : 220);
}, true);
i18nStart();

/* ================= NEUES DESIGN (Vorschau mit ?design=neu) ================= */
// Topbar mit den drei Hauptpunkten, links eine einklappbare Seitenleiste mit den übrigen Seiten, Dashboard als Startseite.
// Die alte Kopfzeile bleibt im HTML und wird per CSS (assets/css/design-neu.css) ausgeblendet; Set- und Sprachschalter ziehen um.
// ND_IC, ndSvg, ND_IMG, ndLink und das Grundgerüst (ndShellHTML) stehen in assets/js/shell.js – das lädt vor allem anderen
function ndInit(){
  const S = TFT_DATA.set;
  if(!$('#ndTop')) document.body.insertAdjacentHTML('afterbegin', ndShellHTML(EN));   // normalerweise schon von shell.js gebaut
  // Set- und Sprachschalter aus der alten Kopfzeile übernehmen (Funktionen bleiben erhalten)
  // Sprache: nur die Flagge, ein Klick öffnet ein kleines Menü
  const p0 = curPath(), deHref = p0, enHref = enPath(p0);
  const lang = `<div class="nd-lang" id="ndLang"><button type="button" class="nd-lang-btn" aria-haspopup="true" aria-expanded="false" aria-label="${L('Sprache', 'Language')}" title="${L('Sprache', 'Language')}">${EN ? FLAG_US : FLAG_DE}<svg class="nd-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M6 9l6 6 6-6"/></svg><span></span></button>
    <div class="nd-lang-menu" role="menu"><a role="menuitemradio" aria-checked="${!EN}" href="${deHref}" hreflang="de" data-lang="de" data-noi18n>${FLAG_DE}Deutsch</a><a role="menuitemradio" aria-checked="${EN}" href="${enHref}" hreflang="en" data-lang="en" data-noi18n>${FLAG_US}English</a></div></div>`;
  const slot = $('#ndSlot'); slot.insertAdjacentHTML('afterend', lang); slot.replaceWith($('#setSw'));
  const nl = $('#ndLang');
  nl.querySelector('.nd-lang-btn').addEventListener('click', e=>{ e.stopPropagation(); const o = nl.classList.toggle('open'); e.currentTarget.setAttribute('aria-expanded', o); });
  document.addEventListener('click', e=>{ if(!e.target.closest('#ndLang')) nl.classList.remove('open'); });
  nl.querySelectorAll('[data-lang]').forEach(a=>a.addEventListener('click', e=>{ e.preventDefault(); e.stopPropagation(); const l = a.dataset.lang;
    try { localStorage.setItem('tftfreaks_lang', l); } catch(_){}
    if((l === 'en') === EN){ nl.classList.remove('open'); return; }
    const cp = curPath(); location.href = (l === 'en' ? enPath(cp) : cp) + location.search; }, true));
  // Meet the Team: Player Cards nebeneinander (gleicher Stil wie im Dashboard, nur größer)
  const ml = document.querySelector('#page-about .mt-list');
  if(ml){
    const card = (href, img, name, role, bio, facts, chall) => {
      const tag = href ? 'a' : 'div';
      return `<${tag} class="dsh-pcard mt-pcard${href ? '' : ' mt-later'}"${href ? ` href="${href}"` : ''}>
        <span class="dsh-pav"><img ${$('#page-about').classList.contains('active') ? 'src' : 'data-src'}="${img}" alt="${esc(name)}">${chall ? `<img class="dsh-pemb" src="${rankImg(rankBy.challenger)}" alt="Challenger">` : ''}</span>
        <b>${esc(name)}${chall ? '<i>#EUW</i>' : ''}</b><span class="dsh-prole">${role}</span><p class="mt-pbio">${bio}</p>
        <span class="dsh-pfacts">${facts.map(([l, v])=>`<span><small>${l}</small><em>${v}</em></span>`).join('')}</span>
        <span class="mt-pgo">${href ? L('Profil ansehen', 'View profile') + ' →' : L('Profil folgt', 'Profile coming soon')}</span></${tag}>`;
    };
    ml.insertAdjacentHTML('beforebegin', `<div class="mt-pcards">
      ${card('/about/crazyslayt', 'assets/img/team-claudio.jpg', 'CrazYSlayt', 'TFT-Experte &amp; Founder · Coach', 'Hat die ersten beiden Sets gespielt, ist mit Set 12 zurückgekommen und seit Set 15 jedes Set im Challenger. Coacht seit Set 17.', [[L('Rang', 'Rank'), 'Challenger'], ['Peak', '1.002 LP'], [L('Aus', 'From'), 'Frankfurt']], true)}
      ${card('/about/humbadobo', 'assets/img/team-romano.jpg', 'humbadobo', 'Coach', 'Kam beim Studium in Island zu TFT und ist seit Set 15 jedes Set im Challenger.', [[L('Rang', 'Rank'), 'Challenger'], ['Peak', '1.447 LP'], [L('Aus', 'From'), L('Irland', 'Ireland')]], true)}
      ${card('', 'assets/img/team-kevin.jpg', 'Kevin10K', 'Partner &amp; Co-Founder', 'Partner und Co-Founder von TFTClimb.', [[L('Rang', 'Rank'), 'Unranked'], ['Peak', L('in Dota', 'in Dota')], [L('Aus', 'From'), 'Hamburg']], false)}
    </div>`);
  }
  $('#ndSide').addEventListener('click', e=>{ if(e.target.closest('a')) document.body.classList.remove('nd-drawer'); });
  $('#ndTop').addEventListener('click', e=>{ if(e.target.closest('.nd-tabs a')) document.body.classList.remove('nd-drawer'); });
}
function ndRoute(page, navKey){
  const key = page==='champion' ? 'bibliothek' : page==='apply' ? 'coaching' : navKey;
  document.querySelectorAll('#ndTop [data-nd], #ndSide [data-nd]').forEach(a=>a.classList.toggle('on', a.dataset.nd===key));
  document.body.classList.remove('nd-drawer');
  if(page==='home'){ renderDash(); requestAnimationFrame(()=>dshCount(true)); }
  setTimeout(ndColon, 0);   // erst nach der Übersetzung (läuft vorher als Microtask)
}
// Tool-Überschriften „TFT Rolldown-Rechner: Odds …“: der Doppelpunkt am Ende des großen Titels wird nur ausgeblendet (für Google bleibt er)
function ndColon(){
  document.querySelectorAll('.th-key').forEach(k=>{
    if(k.querySelector('.th-c')) return;
    const tn = [...k.childNodes].reverse().find(n=>n.nodeType===3 && n.textContent.trim());
    if(tn && /:\s*$/.test(tn.textContent)){ tn.textContent = tn.textContent.replace(/:\s*$/, ''); k.insertAdjacentHTML('beforeend', '<span class="th-c">:</span>'); }
  });
}

// Dashboard: Profil-Header, Top Comps, aktueller Patch, Tierlist im Kleinformat, Shop-Chancen, Coaching
const dshHex = (n, cls='') => { const c = champBy[n] || CH_DATA[n]; if(!c) return ''; return `<span class="dsh-hx c${c.c} ${cls}" title="${esc(n)}"><i style="background-image:url('${champImg(n) || champFallback(n)}')"></i></span>`; };
function renderDash(){
  const box = $('#dshApp'); if(!box || box.dataset.done) return;
  const P = CURRENT_PATCH || PATCHES[0], cut = (ST_CUT && ST_CUT.regions && ST_CUT.regions.euw) || {};
  const ORDER = 'SABCX', top = mainComps.filter(c=>c.tier!=='X').sort((a,b)=>ORDER.indexOf(a.tier) - ORDER.indexOf(b.tier)).slice(0, 5);
  const fmt = n => n == null ? '–' : Number(n).toLocaleString(LOC);
  const stat = (v, l, e) => `<div class="dsh-st"><b>${v}</b><small>${l}</small>${e ? `<em>${e}</em>` : ''}</div>`;
  const tierBadge = t => `<span class="dsh-tier" style="background:${TIER_COL[t]}">${t}</span>`;
  const sCount = mainComps.filter(c=>c.tier==='S').length;
  // Patch: ein paar Champion-Änderungen
  const rows = [];
  (P && P.notes || []).forEach(s=>(s.ch || []).forEach(r=>{ const m = r[0] && NAME_IDX[nameKey(r[0])]; if(m && m.ty==='c' && !rows.some(x=>x[4]===m.k)) rows.push([r[0], r[1], r[2], r[3], m.k]); }));
  const total = P ? (P.notes || []).reduce((n, s)=>n + (s.ch || []).length, 0) : 0;
  const coach = (href, img, name, peak) => `<a class="dsh-coach-pf" href="${href}"><span class="dsh-av"><img src="${img}" alt="${esc(name)}"></span><span class="dsh-c3"><b>${esc(name)}<i>#EUW</i></b><span>Coach</span><small><em>Challenger</em><i class="dsh-sep"> · </i>Peak ${peak}</small></span></a>`;
  // Player Card: Bild mit Challenger-Emblem, Name, Rolle, darunter Rang / Peak / Aus
  const pcard = (href, img, name, role, peak, from) => `<a class="dsh-pcard" href="${href}"><span class="dsh-pav"><img src="${img}" alt="${esc(name)}"><img class="dsh-pemb" src="${rankImg(rankBy.challenger)}" alt="Challenger"></span><b>${esc(name)}<i>#EUW</i></b><span class="dsh-prole">${esc(role)}</span><span class="dsh-pfacts"><span><small>${L('Rang', 'Rank')}</small><em>Challenger</em></span><span><small>Peak</small><em>${peak}</em></span><span><small>${L('Aus', 'From')}</small><em>${esc(from)}</em></span></span></a>`;
  const live = `<i class="sb-dot${ST_CUT_LIVE ? ' live' : ''}" title="${ST_CUT_LIVE ? L('Live-Daten', 'Live data') : L('Gespeicherter Stand', 'Saved data')}"></i>`;
  const lpStat = (key, v, tier, label) => `<a class="dsh-lp" href="/ranks/${tier.k}"><img src="${rankImg(tier)}" alt=""><span><b data-dlp="${v || 0}" data-key="${key}">${v ? fmt(v) + ' LP' : '–'}</b><small>${live}${label}</small></span></a>`;
  box.innerHTML = `
    <div class="dsh-title"><h1>${L('TFT Tierlist, Comps', 'TFT Tier List, Comps')} <em>&amp; Coaching</em></h1></div>
    <section class="dsh-card dsh-hero dsh-bar">
      <div class="dsh-hi"><img class="dsh-vihi" src="assets/img/mascot-vi-look.webp" alt="Vi" width="520" height="624"><div class="dsh-bubble"><b>${L('BEREIT FÜR<br>DEN CLIMB?', 'READY FOR<br>THE CLIMB?')}</b></div></div>
      <div class="dsh-stats">
        ${cut.ch ? lpStat('ch', cut.ch, rankBy.challenger, L('Challenger · EUW', 'Challenger · EUW')) : ''}
        ${cut.gm ? lpStat('gm', cut.gm, rankBy.grandmaster, L('Großmeister · EUW', 'Grandmaster · EUW')) : ''}
        ${ST_PATCH ? `<a class="dsh-np" href="${COUNTDOWN_PATH}" title="${esc(stNextLabel())}"><span class="dsh-pbadge">${esc(ST_PATCH)}</span><span><small>${L('Nächster Patch in', 'Next patch in')}</small><b data-countdown>${stCountdown()}</b></span></a>` : ''}
      </div>
    </section>
    <div class="dsh-row2">
      <section class="dsh-card"><div class="dsh-h"><h2>Top Comps</h2><a href="/tierlist">${L('Ganze Tierlist', 'Full tier list')} →</a></div>
        ${top.length ? top.map(c=>{
          const units = c.board.map(b=>b.u).filter(u=>champBy[u]).sort((a,b)=>(b===c.carry) - (a===c.carry) || costOf(b) - costOf(a)).slice(0, 7);
          return `<a class="dsh-comp" href="${compHref(c)}">${tierBadge(c.tier)}<span class="dsh-cn"><b>${esc(c.name)}</b><small>${esc(compStyleName(c))} · ${esc(compDiffName(c))}</small></span><span class="dsh-units">${units.map(u=>dshHex(u)).join('')}</span><span class="dsh-pill">Carry: ${esc(c.carry)}</span></a>`; }).join('')
          : `<p class="dsh-empty">${L('Die Tierlist wird gerade neu aufgebaut.', 'The tier list is being rebuilt.')}</p>`}
      </section>
      <section class="dsh-card dsh-coach">
        <p>${L('Fundamentals und VOD-Review mit uns – auf Deutsch oder Englisch.', 'Fundamentals and VOD reviews with us – in German or English.')}</p>
        <div class="dsh-pcards">${pcard('/about/crazyslayt', 'assets/img/team-claudio.jpg', 'CrazYSlayt', 'Founder & Coach', '1.002 LP', 'Frankfurt')}${pcard('/about/humbadobo', 'assets/img/team-romano.jpg', 'humbadobo', 'Coach', '1.447 LP', L('Irland', 'Ireland'))}</div>
        ${(()=>{ const tl = testimonials.map(dshTst).filter(Boolean); return tl.length ? `<div class="dsh-tst" aria-live="polite" title="${L('Erfolge nach dem Coaching', 'Results after coaching')}"><span class="dsh-tlab">${ndSvg('coaching')}${L('Unsere Students', 'Our students')}</span>${tl.join('')}</div>` : ''; })()}
        <a class="dsh-btn" href="/coaching">${L('Coaching buchen', 'Book coaching')} →</a>
      </section>
    </div>
    <div class="dsh-row3">
      <a class="dsh-card dsh-lib" href="/bibliothek"><div class="dsh-h"><h2>${L('Bibliothek', 'Library')}</h2><span class="dsh-more">${L('Entdecken', 'Explore')} →</span></div>
        <div class="dsh-comb">${(()=>{ const pick = champions.slice().sort((a,b)=>b.c - a.c || a.n.localeCompare(b.n)).slice(0, 16), rows = [5, 6, 5]; let i = 0;
          return rows.map(m=>`<div>${pick.slice(i, i += m).map(c=>`<span class="dsh-cb c${c.c}" title="${esc(c.n)}"><i style="background-image:url('${champImg(c.n) || champFallback(c.n)}')"></i></span>`).join('')}</div>`).join(''); })()}</div>
        <div class="dsh-libstats"><span><b>${champions.length}</b> Champions</span><span><b>${ITEMS.length}</b> Items</span><span><b>${traits.length}</b> Traits</span></div></a>
      <section class="dsh-card dsh-tools">
        <div class="dsh-h"><h2>Tools</h2><a href="/tools">${L('Alle', 'All')} →</a></div>
        <div class="dsh-tlist">${[
          ['/tools/tft-rolldown-rechner', 'rolldown', L('Rolldown-Rechner', 'Rolldown calculator'), L('Rollen oder leveln?', 'Roll or level?')],
          ['/tools/tft-dps-vergleich', 'dps', L('DPS-Vergleich', 'DPS Comparison'), L('Item-Builds vergleichen', 'Compare item builds')],
          ['/tools/tft-item-drop-chance', 'drops', L('Item-Drop-Chance', 'Item Drop Chance'), L('Was droppt als Nächstes?', 'What drops next?')],
          ['/tools/tft-augment-vorhersage', 'augments', L('Augment-Vorhersage', 'Augment Prediction'), L('Welche Stufe kommt?', 'Which tier comes next?')],
          ['/tools/tft-tierlist-maker', 'tierlist', 'Tierlist-Maker', L('Eigene Tierlist bauen', 'Build your own tier list')],
          ['/tft-team-builder', 'simulator', 'Team Builder', L('Board planen & teilen', 'Plan & share boards')]
        ].map(([h, img, t, d])=>`<a href="${h}"><img src="assets/tools/thumb/${img}.webp" alt="" width="34" height="34" loading="lazy"><span><b>${t}</b><small>${d}</small></span></a>`).join('')}</div></section>
      <section class="dsh-card dsh-cheats">
        <div class="dsh-h"><h2>Cheatsheets</h2><a href="/cheatsheet">${L('Alle', 'All')} →</a></div>
        <div class="dsh-tlist dsh-clist">${(()=>{ const has = new Set(csList().map(s=>s[0]));   // unsere wichtigsten Tabellen (wie „TFTClimb Priority“ auf der Cheatsheet-Seite)
          return CS_PRIO[1].filter(id=>has.has(id)).map(id=>{ const m = CS_META[id] || {};
            return `<a href="${csHref(id)}"><span class="dsh-cic">${csIco(id)}</span><span><b>${esc(csName(id))}</b>${m.d ? `<small>${L(m.d[0], m.d[1])}</small>` : ''}</span></a>`; }).join(''); })()}</div></section>
    </div>`;
  const f = box.querySelector('.dsh-ts'); if(f) f.classList.add('on');
  box.dataset.done = '1';
}
// Erfolge gecoachter Spieler als Rang-Sprung mit Emblemen (aus testimonials, r = 'Smaragd → Meister · 5 Sessions')
const DSH_RANK_DE = {eisen:'iron', bronze:'bronze', silber:'silver', gold:'gold', platin:'platinum', smaragd:'emerald', diamant:'diamond', meister:'master', 'großmeister':'grandmaster', challenger:'challenger'};
function dshTst(x){
  const m = String(x.r || '').match(/^\s*([^\s→]+)\s*([IV]*)\s*→\s*([^\s·]+)\s*([IV]*)\s*(?:·\s*(\d+))?/); if(!m) return '';
  const a = rankBy[DSH_RANK_DE[m[1].toLowerCase()]], b = rankBy[DSH_RANK_DE[m[3].toLowerCase()]]; if(!a || !b) return '';
  const side = (t, div) => `<span class="dsh-tr" title="${esc(t.n)}${div ? ' ' + div : ''}"><img src="${rankImg(t)}" alt="${esc(t.n)}"><b>${esc(t.n)}${div ? ' ' + div : ''}</b></span>`;
  return `<div class="dsh-ts"${m[5] ? ` title="${esc(x.n)} · ${m[5]} Sessions"` : ''}><span class="dsh-tn"><b>${esc(x.n)}</b>${m[5] ? `<small>${m[5]} Sessions</small>` : ''}</span><span class="dsh-tj">${side(a, m[2])}<i class="dsh-tarr" aria-label="${L('nach', 'to')}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></i>${side(b, m[4])}</span></div>`;
}
// nacheinander einblenden
setInterval(()=>{ const box = document.querySelector('#page-dash.active .dsh-tst'); if(!box || document.hidden) return;
  const s = [...box.querySelectorAll('.dsh-ts')], i =s.findIndex(e=>e.classList.contains('on')); s.forEach(e=>e.classList.remove('on')); s[(i + 1) % s.length].classList.add('on'); }, 3600);
// LP-Grenzen im Dashboard hochzählen (wie die Leiste auf der alten Startseite)
const dshShown = {};
function dshCount(fromZero){
  const cut = stCut('euw') || {};
  const els = [...document.querySelectorAll('#dshApp [data-dlp]')]; if(!els.length) return;
  const jobs = els.map(el=>{ const to = cut[el.dataset.key] || +el.dataset.dlp; return {el, key:el.dataset.key, to, from:fromZero ? 0 : (dshShown[el.dataset.key] ?? to)}; });
  jobs.forEach(j=>{ dshShown[j.key] = j.to; });
  if(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches){ jobs.forEach(j=>{ j.el.textContent = fmtLP(j.to); }); return; }
  const t0 = performance.now(), dur = 1400, ease = x => 1 - Math.pow(1 - x, 3);
  clearInterval(dshCount.timer);
  dshCount.timer = setInterval(()=>{ const k = Math.max(0, Math.min(1, (performance.now() - t0) / dur));
    jobs.forEach(j=>{ j.el.textContent = fmtLP(Math.round(j.from + (j.to - j.from) * ease(k))); }); if(k >= 1) clearInterval(dshCount.timer); }, 16);
}
if(ND) ndInit();

/* init */
renderSetSwitcher();
document.querySelectorAll('.data-src').forEach(el=>{ el.textContent = L(`Offizielle Spieldaten: CommunityDragon ${TFT_DATA.version} · Set ${TFT_DATA.set} · aktualisiert am ${new Date(TFT_DATA.generated).toLocaleDateString(LOC)}. Werte können sich mit Patches ändern.`, `Official game data: CommunityDragon ${TFT_DATA.version} · Set ${TFT_DATA.set} · updated on ${new Date(TFT_DATA.generated).toLocaleDateString(LOC)}. Values may change with patches.`); });
renderStatBar(); renderHome(); filterComps(); renderItemTL(); renderAugTL(); renderHoldTL(); renderEncTL(); renderChamps(); renderTraits(); renderItems(); renderRecipes(); route();

/* ================= GOOGLE ANALYTICS: HINWEIS-BANNER & WIDERSPRUCH ================= */
// Analytics läuft ab dem Aufruf (siehe Kopf von index.html). Der Banner informiert darüber; „Analyse ablehnen“ stoppt die Messung
// sofort und für künftige Besuche und löscht die Analytics-Cookies. Wahl in localStorage: tftfreaks_ga = 'ok' | 'no'
const GA_ID = 'G-BTL7VP5CTK', GA_KEY = 'tftfreaks_ga';
const gaGet = () => { try { return localStorage.getItem(GA_KEY); } catch(e){ return null; } };
function gaDelCookies(){
  const host = location.hostname, root = host.split('.').slice(-2).join('.');
  document.cookie.split(';').map(c=>c.split('=')[0].trim()).filter(n=>/^_ga(_|$)/.test(n)).forEach(n=>{
    [host, '.' + host, '.' + root, ''].forEach(d=>{ document.cookie = n + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/' + (d ? '; domain=' + d : ''); }); });
}
function gaLoad(){   // nach erneuter Zustimmung ohne Neuladen starten
  window['ga-disable-' + GA_ID] = false;
  if(location.protocol === 'file:' || /^(localhost|127\.0\.0\.1)$/.test(location.hostname)) return;
  if(!window.gtag){ const s = document.createElement('script'); s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID; document.head.appendChild(s);
    window.dataLayer = window.dataLayer || []; window.gtag = function(){ dataLayer.push(arguments); }; gtag('js', new Date()); }
  gtag('config', GA_ID);
}
function gaSet(v){
  try { localStorage.setItem(GA_KEY, v); } catch(e){}
  if(v === 'no'){ window['ga-disable-' + GA_ID] = true; gaDelCookies(); } else gaLoad();
  const b = document.getElementById('ckb'); if(b) b.remove();
  gaCtl();
}
function gaBanner(){
  if(document.getElementById('ckb')) return;
  // kleines Popup unten links mit dem Logo-Symbol; Details stehen in der Datenschutzerklärung
  document.body.insertAdjacentHTML('beforeend', `<div class="ckb" id="ckb" role="region" aria-label="${L('Hinweis zu Cookies', 'Cookie notice')}">
    <img class="ckb-logo" src="assets/brand/favicon-192.png" alt="" width="46" height="46">
    <div class="ckb-tx"><b>Cookies</b>
      <p>${L('Wir nutzen Cookies von Google Analytics, um unsere Seite zu verbessern.', 'We use Google Analytics cookies to improve our site.')} <a href="${withLang('/datenschutz')}">${L('Datenschutz', 'Privacy policy')}</a></p>
      <div class="ckb-bt"><button type="button" class="ckb-no" data-ga="no">${L('Ablehnen', 'Decline')}</button><button type="button" class="ckb-ok" data-ga="ok">OK</button></div></div></div>`);
}
// Schalter in der Datenschutzerklärung (Abschnitt 3)
function gaCtl(){
  const st = document.getElementById('gaState'), bt = document.getElementById('gaToggle'); if(!st || !bt) return;
  const off = gaGet() === 'no';
  st.textContent = off ? L('Google Analytics ist für diesen Browser abgeschaltet.', 'Google Analytics is turned off for this browser.') : L('Google Analytics ist für diesen Browser aktiv.', 'Google Analytics is active for this browser.');
  bt.textContent = off ? L('Wieder erlauben', 'Allow again') : L('Analyse ablehnen', 'Decline analytics');
  bt.dataset.ga = off ? 'ok' : 'no';
}
document.addEventListener('click', e=>{ const b = e.target.closest && e.target.closest('[data-ga]'); if(b) gaSet(b.dataset.ga); });
// „Cookie-Einstellungen“ in der Fußzeile: Banner wieder zeigen statt zur Datenschutzerklärung zu gehen (Capture, damit der Seiten-Router nicht zuerst navigiert)
document.addEventListener('click', e=>{ const c = e.target.closest && e.target.closest('[data-ckb]'); if(c){ e.preventDefault(); gaBanner(); } }, true);
if(!gaGet()) gaBanner();
gaCtl();
