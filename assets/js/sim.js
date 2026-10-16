/* ================= KAMPF-SIMULATOR =================
   Wird VOR app.js geladen: hier stehen nur Funktionen und Konstanten ohne Abhängigkeiten.
   Die Daten (CH_DATA, findItem, Builder-Bretter …) kommen erst beim Aufruf aus app.js.

   Regeln (Quellen: League-Wiki „TFT: Mana“, tftips.app „Battle“):
   - Ziel: nächster Gegner – wenigste Schritte bis zu einer Angriffsposition, dann Feld-Abstand,
     dann echter Abstand, dann bisheriges Ziel. Neuwahl nach jedem gelaufenen Feld, bis das Ziel in Reichweite ist.
   - Bewegung 500 (Verlängerung 700) Einheiten/s, ein Feld ≈ 180 Einheiten. Das Zielfeld wird beim Losgehen belegt.
   - Mana: 10 pro Angriff, Schaden erhalten: 1 % vor + 3 % nach Abzug (max. 42,5). Kein Mana bei Betäubung/während der Fähigkeit.
   - Schaden = Basis × Krit × Schadenssteigerung × 100/(100+Resistenz) × Durchhaltevermögen (multiplikativ).
   - Verlängerung ab 30 s: pro Sekunde Schaden und Angriffstempo ×1,1, Heilung/Schilde/CC −10 % (bis −70 %), ab 38 s CC-immun.
*/
const SIM_DT = 0.05, SIM_OT = 30, SIM_END = 45, SIM_HEXU = 180;
const SIM_STAR_HP = [1, 1.8, 3.24, 5.832], SIM_STAR_AD = [1, 1.5, 2.25, 3.375];
// Geschätzte Fähigkeitsstärke (Riot liefert die Zahlen für Set 18 nicht mit): [Kosten 1–5][Stern 1–3]
const SIM_MAGIC = [[260,390,585],[340,510,770],[440,660,1040],[600,900,2200],[900,1350,5200]];   // magischer Schaden bei 100 AP
const SIM_PHYS  = [[2.9,2.9,3],[3.2,3.2,3.4],[3.7,3.7,4],[4.3,4.3,7],[5.2,5.2,15]];          // × Angriffsschaden
const SIM_SHIELD = [[250,325,425],[325,425,550],[400,525,700],[500,650,1200],[600,800,2500]];
const SIM_STUN = [1.25, 1.5, 2];
const SIM_NOCOMBAT = ['Elderwood','Avatar','Bounty Seeker','Coven','Primal','Greenfather','Rival','Old Growth','Summoner','Apex Predator'];

// Spielfeld: 8 Reihen × 7 Felder (Reihe 0–3 Gegner, 4–7 du), ungerade Reihen um ein halbes Feld nach rechts versetzt
const SIM_GRID = (()=>{
  const cube = i => { const R = Math.floor(i/7), C = i%7; return [C - (R - (R&1))/2, R]; };
  const D = [];
  for(let a=0;a<56;a++){ const [xa,za] = cube(a); D[a] = new Int8Array(56); for(let b=0;b<56;b++){ const [xb,zb] = cube(b), dx = xa-xb, dz = za-zb; D[a][b] = (Math.abs(dx) + Math.abs(dz) + Math.abs(dx+dz)) / 2; } }
  const NB = D.map(row=>{ const o = []; row.forEach((d,j)=>{ if(d===1) o.push(j); }); return o; });
  const P = Array.from({length:56}, (_, i)=>{ const R = Math.floor(i/7), C = i%7; return {x:C + (R&1)*0.5 + 0.5, y:R*0.866 + 0.577}; });
  return {D, NB, P};
})();
const SIM_W = 7.5, SIM_H = 7*0.866 + 1.1547;
const simEu = (a, b) => { const p = SIM_GRID.P[a], q = SIM_GRID.P[b]; return Math.hypot(p.x-q.x, p.y-q.y); };
const simCell = (side, h) => { const r = Math.floor(h/7), c = h%7; return side===0 ? (4+r)*7 + c : (3-r)*7 + (6-c); };
function simRng(seed){ let a = seed >>> 0; return ()=>{ a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

/* ---------- Fähigkeit aus dem offiziellen Text lesen ---------- */
const SIM_SPEC = {};
function simSpec(n){
  if(SIM_SPEC[n]) return SIM_SPEC[n];
  const d = CH_DATA[n] || {}, st = d.st || {};
  const txt = plainDesc(String((d.ab && (d.ab.dDe || d.ab.d)) || '').replace(/%i:scale\w+%/g, ' ').replace(/\\n|\r/g, ' ')).replace(/\{[^}]*\}/g, '').replace(/\s+/g, ' ');
  let act = txt, pas = '';
  const ia = txt.search(/Aktiv:/);
  if(ia >= 0){ pas = txt.slice(0, ia); act = txt.slice(ia + 6); }
  else if(/^\s*Passiv:/.test(txt)){ pas = txt; act = ''; }
  act = act.replace(/(\S+ Buff|Quest|Ahnendrachen-Buff):[\s\S]*$/, '')
    .replace(/(Verbrennen|Verbrennung|Verwundung|Verlangsamung|Magiefraktur|Fraktur|Manaraub|Präzision): [^.]*\.?/g, '');   // Begriffserklärungen am Ende
  // „Jede 4. Aktivierung …“: Zielwahl/Fläche gilt nur für diese Sonder-Aktivierung, sonst trifft die Fähigkeit normal
  const ev = act.match(/Jede (\d+)\. Aktivierung([\s\S]*)$/);
  const extra = ev ? ev[2] : '';
  if(ev) act = act.slice(0, ev.index);
  const has = re => re.test(act);
  const sents = act.split(/\.\s/);
  const s = {name:(d.ab && d.ab.n) || '', cost:d.c || 1, dt:'phys', dmg:false, tgt:'target', n:1, r:0, line:false, bounce:0, dot:false,
    self:{shield:false, heal:false}, ally:{shield:false, heal:false}, stun:false, taunt:false, dash:null, as:0, emp:0, burn:false, wound:false,
    shred:false, sunder:false, slow:false, counter:0, onHit:false, transform:false, splash:0, regen:false, aura:false, healOnHit:false, omni:0, ct:0.5, noCast:false};
  s.dmg = /Schaden/.test(act.replace(/den meisten Schaden verursacht hat/g, ''));
  s.dt = /magische[nm]? Schaden|magischen/.test(act) ? 'magic' : /absolute[nm]? Schaden/.test(act) ? 'true' : 'phys';
  if(has(/größte[n]? Gruppe|meisten Gegner|von den meisten Gegnern/)) s.tgt = 'cluster';
  else if(has(/(wenigsten|niedrigsten) Leben/)) s.tgt = 'lowest';
  else if(has(/entferntesten/)) s.tgt = 'farthest';
  else if(has(/nächstbefindlichen|Gegner in der Nähe|nahe Gegnergruppe|Gegnern in der Nähe/)){ s.tgt = 'near'; s.n = 3; }
  s.line = has(/Linie|durchbohrt|durchdrungen/);
  // Fläche: „Umkreis“ in einem Sprung-Satz ist die Sprungweite, keine Fläche
  const area = sents.filter(se=>!/Springt zu|springt zu|Springt zum/.test(se)).join('. ');
  const rm = area.match(/Umkreis von (\d+)/);
  s.r = rm ? +rm[1] : /angrenzende[n]? Gegner|angrenzenden Gegnern|an das Ziel angrenzen/.test(area) ? 1 : /Umkreis|kegelförmig|Feuersturm|Schwächungsfeld|alle Gegner/.test(area) ? 2 : 0;
  s.bounce = has(/abprall|Abpraller|aufteilt, um|zusätzliche Sterne|Kugeln, die sich/) ? 3 : 0;
  s.dot = sents.some(se=>/Schaden/.test(se) && /(über|im Verlauf von) +Sekunden|pro Sekunde|jede Sekunde|kanalisier/.test(se));
  if(has(/kanalisier|Laser auf das Ziel/)) s.ct = 1.5;
  sents.forEach(se=>{
    const al = /Verbündete/.test(se);
    if(/Schild/.test(se) && !/wenn der Schild bricht|Wenn der Schild bricht|Schilde dieser/.test(se)){ if(al) s.ally.shield = true; if(!al || /Shen|erhält|erhältst/.test(se)) s.self.shield = true; }
    if(/Leben wieder|heilt|heilst|heilen/.test(se) && !/Verwundung|Heilung\./.test(se)){ if(al) s.ally.heal = true; else s.self.heal = true; }
    if(/Angriffstempo/.test(se) && /(Erhält|erhält|erhältst|Erhalte|nächsten)/.test(se) && !/dem Verbündeten/.test(se)) s.as = 0.5;
  });
  s.stun = has(/betäub|hochgeschleudert|Schlaf versetzt/);
  s.taunt = has(/Verspottet Gegner/);
  if(has(/Springt zu|springt in|Stürmt los|stürmst durch|Springt zum/) && !has(/aus dem Boden/)) s.dash = s.tgt==='target' || s.tgt==='near' ? 'target' : s.tgt;
  if(has(/teleportierst vom/)) s.dash = 'away';
  if(s.dash) s.ct = 0.4;
  if(has(/nächsten (\S+ )?Angriffe/)) s.emp = 4;
  s.burn = has(/Verbrennung|brennt|entzünd|In Brand/);
  s.wound = has(/Verwundung/);
  s.shred = has(/Magieresistenz[^.]*(verringert|um)|verringert[^.]*Magieresistenz|Magiefraktur/);
  s.sunder = has(/Rüstung (des Gegners )?um|verringert die Rüstung|Rüstung um/) && !/Rüstung sowie|erhältst/.test(act);
  s.slow = has(/verlangsamt|Verlangsamung/);
  // Passiv und Sonderfälle
  if(ev) s.every = {n:+ev[1], line:/Linie|durchdrung|durchbohrt/.test(extra), cluster:/größte[n]? Gruppe|meisten Gegner/.test(extra)};
  if(st.mana > 0 && st.mana <= 5){ s.counter = st.mana; s.noCast = true; }
  if(!st.mana) s.noCast = true;
  if(/Angriffe verursachen[^.]*zusätzlichen magischen/.test(pas) || (!st.mana && /Angriffe/.test(pas))) s.onHit = true;
  if(has(/Angriffe in \S+gestalt|Verwandelt sich in eine Spinne/)) s.transform = true;
  if(/Angriffe werden durch einen Tanz|an das Ziel angrenzen/.test(pas)) s.splash = 0.5;
  if(/(Stellt|stellt) jede Sekunde[^.]*Leben wieder/.test(pas)) s.regen = true;
  if(/jede Sekunde[^.]*Schaden an Gegnern im Umkreis/.test(pas)) s.aura = true;
  if(/bei einem Angriff[^.]*Leben wieder/.test(pas)) s.healOnHit = true;
  if(/Omnivampir/.test(pas)) s.omni = 0.15;
  // eigene Werte (z. B. data/custom-<Set>.js → abilities) haben Vorrang vor der Schätzung
  const vals = Object.assign({}, (d.ab && d.ab.v) || {}, ((typeof TFT_CUSTOM_SET!=='undefined' && TFT_CUSTOM_SET.abilities) || {})[n] || {});
  const dk = Object.keys(vals).find(k=>/^((Magic|Physical)DamageCalc1|(Base|Spell|Magic|Physical)?Damage)$/i.test(k));
  if(dk && Array.isArray(vals[dk])) s.val = vals[dk];
  return SIM_SPEC[n] = s;
}
const simStarVal = (arr, star) => arr.length >= 4 ? arr[star] : arr[Math.min(arr.length, star) - 1];
// Riot legt Fähigkeiten nach Manakosten aus: billige Fähigkeiten (30 Mana) sind schwächer als teure (100+ Mana)
const simManaF = u => u.maxMana > 5 ? Math.min(1.5, Math.max(0.4, u.maxMana / 70)) : 1;
function simPow(u){   // Schaden einer Fähigkeit (vor Aufteilung), geschätzt nach Kosten, Sternen und Manakosten
  const sp = u.spec, c = Math.min(5, Math.max(1, u.cost)) - 1, s = u.star - 1;
  if(sp.val) return (+simStarVal(sp.val, u.star) || 0) * (sp.dt==='magic' ? sAP(u)/100 : 1);
  return (sp.dt==='phys' ? sAD(u) * SIM_PHYS[c][s] * sAP(u)/100 : SIM_MAGIC[c][s] * sAP(u)/100) * simManaF(u);
}
const simShieldVal = u => SIM_SHIELD[Math.min(5, Math.max(1, u.cost)) - 1][u.star - 1] * sAP(u)/100 * simManaF(u);

/* ---------- Kampf-Zustand und Grundfunktionen ---------- */
let SS = null;   // laufende Simulation
const sOtN = () => Math.max(0, Math.floor(SS.t - SIM_OT));
const sOtDmg = () => Math.pow(1.1, sOtN());
const sOtRed = () => Math.max(0.3, 1 - 0.1 * sOtN());
const sBuff = (u, k) => { let v = 0; for(const b of u.buffs) if(b.k===k && b.end > SS.t) v += b.v; return v; };
const sDeb = (u, k) => { let v = 0; for(const b of u.debs) if(b.k===k && b.end > SS.t && b.v > v) v = b.v; return v; };
function sAD(u){ return u.ad0 * Math.max(0, 1 + u.adP + sBuff(u, 'adP')); }
function sAP(u){ return u.ap + sBuff(u, 'ap'); }
function sAS(u){ const a = u.as0 * (1 + u.asP + sBuff(u, 'asP')) * (1 - sDeb(u, 'slow')) * (SS.t >= SIM_OT ? Math.pow(1.1, sOtN()) : 1); return Math.min(5, Math.max(0.2, a)); }
function sAR(u){ return (u.ar + sBuff(u, 'ar') + (u.gargRes||0) + (u.monoRes||0)) * (1 - sDeb(u, 'sunder')); }
function sMR(u){ return (u.mr + sBuff(u, 'mr') + (u.gargRes||0) + (u.monoRes||0)) * (1 - sDeb(u, 'shred')); }
const sAlive = side => SS.units.filter(u=>u.alive && u.side===side);
const sTargetable = e => e.alive && e.untarget <= SS.t;
const sEnemiesNear = (u, cell, r) => SS.units.filter(e=>e.alive && e.side!==u.side && SIM_GRID.D[cell][e.cell] <= r);
const sLowestAlly = u => sByKey(SS.units.filter(a=>a.alive && a.side===u.side && !a.plant), a=>a.hp/a.maxHp)[0];
function sEvery(u, p, f){ let next = p; u.on.tick.push(()=>{ while(SS.t >= next - 1e-9){ next += p; f(); } }); }
function sAt(u, time, f){ let done = false; u.on.tick.push(()=>{ if(!done && SS.t >= time - 1e-9){ done = true; f(); } }); }
function sLow(u, p, f){ u.on.low.push({p, f, done:false}); }
function sDebuff(t, k, v, dur, src){ if(!t.alive) return; const ex = t.debs.find(b=>b.k===k && b.src===src); if(ex){ ex.v = Math.max(ex.v, v); ex.end = Math.max(ex.end, SS.t + dur); } else t.debs.push({k, v, end:SS.t + dur, src}); }
function sDot(src, tgt, total, dur, type){ if(total > 0 && tgt.alive) SS.dots.push({src, tgt, dps:total/dur, end:SS.t + dur, type}); }
function sLog(k, o){ if(!SS.quiet) SS.ev.push(Object.assign({t:SS.t, k}, o)); }
const sName = u => `\u0001${u.id}\u0002`;   // wird in der Ansicht durch den farbigen Namen ersetzt

function sShield(src, tgt, v, dur, label, onBreak){
  if(!tgt.alive || v <= 0) return;
  v *= sOtRed();
  tgt.shields.push({v, end:SS.t + dur, onBreak});
  if(src) src.shielded += v;
  if(label) sLog('shield', {s:tgt.id, txt:L(`${sName(tgt)} erhält ${Math.round(v)} Schild (${label})`, `${sName(tgt)} gains ${Math.round(v)} shield (${label})`)});
}
function sHeal(src, tgt, v){
  if(!tgt.alive || v <= 0) return 0;
  v *= (1 - sDeb(tgt, 'wound')) * sOtRed();
  const h = Math.min(v, tgt.maxHp - tgt.hp);
  tgt.hp += h; if(src) src.healed += h;
  return h;
}
function sStun(src, tgt, dur){
  if(!tgt.alive || tgt.ccImm > SS.t || SS.t >= SIM_OT + 8) return;
  dur *= sOtRed();
  tgt.stunEnd = Math.max(tgt.stunEnd, SS.t + dur);
  sLog('stun', {s:src ? src.id : -1, d:tgt.id, txt:L(`${sName(tgt)} ist ${fmtNum(Math.round(dur*10)/10)} s betäubt`, `${sName(tgt)} is stunned for ${fmtNum(Math.round(dur*10)/10)} s`)});
}
function sDamage(src, tgt, raw, type, o){
  o = o || {};
  if(!tgt.alive || raw <= 0 || tgt.invuln > SS.t) return 0;
  let dmg = raw, crit = false;
  if(src && o.canCrit && SS.rng() < Math.min(1, src.crit + sBuff(src, 'crit'))){ dmg *= src.critD; crit = true; }
  if(src && !o.dot){ let amp = 1 + src.amp + sBuff(src, 'amp'); for(const f of src.on.amp) amp += f(tgt, type, o); dmg *= amp; }
  dmg *= sOtDmg();
  const pre = dmg;
  if(type==='phys') dmg *= 100 / (100 + Math.max(0, sAR(tgt)));
  else if(type==='magic') dmg *= 100 / (100 + Math.max(0, sMR(tgt)));
  if(type!=='true'){
    let m = 1;
    for(const x of tgt.dr) m *= 1 - (typeof x==='function' ? x() : x);
    for(const b of tgt.buffs) if(b.k==='dr' && b.end > SS.t) m *= 1 - b.v;
    if(o.atk) m *= tgt.atkTaken;
    dmg *= m;
  }
  if(tgt.maxMana > 5 && tgt.manaLock <= SS.t && tgt.stunEnd <= SS.t) tgt.mana = Math.min(tgt.maxMana, tgt.mana + Math.min(42.5, pre*0.01 + dmg*0.03));
  let rest = dmg;
  if(tgt.shields.length){
    tgt.shields.sort((a,b)=>a.end - b.end);
    for(const s of tgt.shields){ if(s.end <= SS.t || s.v <= 0) continue; const take = Math.min(s.v, rest); s.v -= take; rest -= take; if(s.v <= 0 && s.onBreak) s.onBreak(); if(rest <= 0) break; }
    tgt.shields = tgt.shields.filter(s=>s.v > 0 && s.end > SS.t);
  }
  const loss = Math.min(tgt.hp, rest);
  tgt.hp -= loss;
  if(src){ src.dealt[type] += dmg; }
  tgt.taken += dmg;
  if(src && src.alive && loss > 0){ const ov = src.omni + sBuff(src, 'omni'); if(ov > 0) sHeal(src, src, loss * ov); }
  if(src && !o.noHooks) for(const f of src.on.hit) f(tgt, dmg, type, o, crit);
  if(!o.noHooks) for(const f of tgt.on.hurt) f(src, dmg, type, o);
  if(tgt.hp <= 0.5) sDie(tgt, src);
  else for(const l of tgt.on.low) if(!l.done && tgt.hp / tgt.maxHp < l.p){ l.done = true; l.f(); }
  if(o.sum) o.sum.v += dmg;
  return dmg;
}
function sDie(u, killer){
  if(!u.alive) return;
  u.hp = 0; u.alive = false; u.deathT = SS.t; u.st = 'dead';
  if(SS.occ[u.cell]===u.id) SS.occ[u.cell] = -1;
  sLog('death', {s:u.id, txt:L(`${sName(u)} wurde besiegt${killer && killer!==u ? ' von ' + sName(killer) : ''}`, `${sName(u)} was defeated${killer && killer!==u ? ' by ' + sName(killer) : ''}`)});
  if(killer && killer.alive){ killer.kills++; for(const f of killer.on.kill) f(u); }
  for(const f of SS.team[1 - u.side].enemyDeath) f(u, killer);
}

/* ---------- Bewegung und Zielwahl ---------- */
function sBfs(u){
  const dist = new Int16Array(56).fill(-1), prev = new Int16Array(56).fill(-1), q = [u.cell];
  dist[u.cell] = 0;
  // Nachbarn in zufälliger Drehung abarbeiten: bei gleich langen Wegen gewinnt keine Seite systematisch
  const off = Math.floor(SS.rng() * 6);
  for(let i=0;i<q.length;i++){ const c = q[i], nbs = SIM_GRID.NB[c], L = nbs.length; for(let j=0;j<L;j++){ const nb = nbs[(j + off) % L]; if(dist[nb] >= 0 || SS.occ[nb] !== -1) continue; dist[nb] = dist[c] + 1; prev[nb] = c; q.push(nb); } }
  return {dist, prev, tie:SS.rng()};
}
function sStepsTo(u, e, bfs){
  const D = SIM_GRID.D;
  if(D[u.cell][e.cell] <= u.range) return {steps:0, goal:u.cell};
  let best = 99, goal = -1, bk = Infinity;
  for(let c=0;c<56;c++){
    const d = bfs.dist[c]; if(d <= 0 || D[c][e.cell] > u.range) continue;
    const k = d * 100 + simEu(c, e.cell) + ((c * 7919 + bfs.tie * 1e4) % 97) / 1e5;   // Gleichstand: zufällig, aber pro Suche fest
    if(k < bk){ bk = k; best = d; goal = c; }
  }
  return {steps:best, goal};
}
function sPick(u, bfs){
  if(u.taunt && u.taunt.alive && u.tauntEnd > SS.t && sTargetable(u.taunt)) return u.taunt;
  // Reihenfolge: Schritte bis zur Angriffsposition, Feld-Abstand, echter Abstand (±0,05 Felder), bisheriges Ziel, sonst Zufall
  const cmp = (a, b) => { for(let i=0;i<a.length;i++) if(a[i]!==b[i]) return a[i] - b[i]; return 0; };
  let best = null, bk = null;
  for(const e of SS.units){
    if(e.side===u.side || !sTargetable(e)) continue;
    const k = [sStepsTo(u, e, bfs).steps, SIM_GRID.D[u.cell][e.cell], Math.round(simEu(u.cell, e.cell)*20), e===u.tgt ? 0 : 1, SS.rng()];
    if(!bk || cmp(k, bk) < 0){ best = e; bk = k; }
  }
  return best;
}
function sMoveTo(u, cell, dur, jump){
  if(SS.occ[u.cell]===u.id) SS.occ[u.cell] = -1;
  u.from = u.cell; u.cell = cell; SS.occ[cell] = u.id;
  u.mvT0 = SS.t; u.mvT1 = SS.t + dur; u.jump = !!jump;
}
function sStep(u, tg, bfs){
  const {goal} = sStepsTo(u, tg, bfs);
  if(goal < 0 || goal===u.cell){ u.st = 'idle'; u.path = null; return; }
  const path = []; let c = goal;
  while(c !== u.cell && c >= 0){ path.unshift(c); c = bfs.prev[c]; }
  u.path = path;
  sMoveTo(u, path[0], SIM_HEXU / (SS.t >= SIM_OT ? 700 : 500), false);
  u.st = 'move';
}
function sFreeNear(cell, ref){   // freies Feld neben `cell`, möglichst nah an `ref`
  const c = SIM_GRID.NB[cell].filter(x=>SS.occ[x]===-1).map(x=>[x, simEu(x, ref) + SS.rng()*1e-3]).sort((a,b)=>a[1] - b[1]);
  return c.length ? c[0][0] : -1;
}
const sByKey = (list, key) => list.map(x=>[x, key(x) + SS.rng()*1e-3]).sort((a,b)=>a[1] - b[1]).map(x=>x[0]);   // sortieren, Gleichstand zufällig
function sLine(u, main, en){   // Ziel plus die Gegner, die (grob) dahinter auf derselben Linie stehen
  const D = SIM_GRID.D, dm = D[u.cell][main.cell];
  return [main, ...en.filter(e=>e!==main && D[u.cell][e.cell] > dm && D[u.cell][e.cell] - D[main.cell][e.cell] >= dm - 0.5).slice(0, 3)];
}
function sCluster(u, list, r){
  let best = null, bn = -1;
  for(const e of list){ const n = list.filter(x=>SIM_GRID.D[x.cell][e.cell] <= Math.max(1, r)).length + SS.rng()*0.5; if(n > bn){ bn = n; best = e; } }
  return best;
}

/* ---------- Angriff und Fähigkeit ---------- */
function sAttack(u, tg){
  u.atkCD = 1 / sAS(u);
  u.attacks++;
  for(const f of u.on.atk) f(tg);
  sLog('atk', {s:u.id, d:tg.id, r:u.range > 1 ? 1 : 0});
  const sp = u.spec, ad = sAD(u);
  if(sp.counter && u.attacks % sp.counter===0){
    const sum = {v:0}; sDamage(u, tg, simPow(u) * 0.6, sp.dt, {ab:true, canCrit:u.prec, sum});
    sLog('cast', {s:u.id, d:tg.id, hits:[tg.id], v:Math.round(sum.v), txt:L(`${sName(u)}: ${esc(sp.name || 'Fähigkeit')} trifft ${sName(tg)} für ${Math.round(sum.v)}`, `${sName(u)}: ${esc(sp.name || 'Ability')} hits ${sName(tg)} for ${Math.round(sum.v)}`)});
  } else sDamage(u, tg, ad, 'phys', {atk:true, canCrit:true});
  if(u.emp > 0){ u.emp--; sDamage(u, tg, u.empD, sp.dt, {ab:true, canCrit:u.prec}); }
  if(sp.onHit || (sp.transform && u.casts > 0)) sDamage(u, tg, simPow(u) * 0.15, 'magic', {ab:true});
  if(sp.splash) sEnemiesNear(u, tg.cell, 1).filter(e=>e!==tg).forEach(e=>sDamage(u, e, ad * sp.splash, 'phys', {noHooks:true}));
  if(sp.healOnHit) sHeal(u, u, u.maxHp * 0.02);
  if(u.manaLock <= SS.t && u.maxMana > 5) u.mana = Math.min(u.maxMana, u.mana + 10 + u.manaOnAtk);
}
function sCast(u, tg){
  const sp = u.spec, t = SS.t;
  u.mana = 0; u.casts++;
  u.castEnd = t + sp.ct; u.manaLock = t + sp.ct;
  const sum = {v:0}, hits = [];
  const P = simPow(u), dt = sp.dt, en = sAlive(1 - u.side).filter(sTargetable);
  let main = tg;
  if(sp.dash){
    const pool = en.filter(e=>SIM_GRID.D[u.cell][e.cell] <= 4);
    const pick = sp.dash==='lowest' ? sByKey(pool, e=>e.hp/e.maxHp)[0] : sp.dash==='farthest' ? sByKey(pool, e=>-SIM_GRID.D[u.cell][e.cell])[0] : sp.dash==='cluster' ? sCluster(u, pool, 1) : tg;
    if(sp.dash==='away'){
      const c = SIM_GRID.NB[u.cell].concat(...SIM_GRID.NB[u.cell].map(x=>SIM_GRID.NB[x])).filter((x,i,a)=>a.indexOf(x)===i && SS.occ[x]===-1).sort((a,b)=>SIM_GRID.D[b][tg.cell] - SIM_GRID.D[a][tg.cell])[0];
      if(c !== undefined && SIM_GRID.D[c][tg.cell] <= u.range){ const from = u.cell; sMoveTo(u, c, 0.3, true); sLog('jump', {s:u.id, from, to:c, txt:L(`${sName(u)} teleportiert sich von ${sName(tg)} weg`, `${sName(u)} teleports away from ${sName(tg)}`)}); }
    } else if(pick){
      const dest = SIM_GRID.D[u.cell][pick.cell]===1 ? u.cell : sFreeNear(pick.cell, u.cell);
      if(dest >= 0 && dest !== u.cell){
        const from = u.cell; sMoveTo(u, dest, 0.35, true);
        u.taunt = null; u.tauntEnd = 0;   // wer per Fähigkeit wegspringt, ist dem Spott entkommen und bleibt beim Sprungziel
        const why = sp.dash==='lowest' ? L(' (wenigstes Leben)', ' (lowest health)') : sp.dash==='farthest' ? L(' (am weitesten weg)', ' (farthest away)') : sp.dash==='cluster' ? L(' (größte Gruppe)', ' (largest group)') : '';
        sLog('jump', {s:u.id, from, to:dest, d:pick.id, txt:L(`${sName(u)} springt zu ${sName(pick)}${why}`, `${sName(u)} jumps to ${sName(pick)}${why}`)});
      }
      main = pick; if(u.tgt !== pick){ u.tgt = pick; u.tgtSince = t; }
    }
  } else if(sp.tgt==='lowest'){ main = sByKey(en.filter(e=>SIM_GRID.D[u.cell][e.cell] <= u.range + 2), e=>e.hp/e.maxHp)[0] || tg; }
  else if(sp.tgt==='farthest'){ main = sByKey(en.filter(e=>SIM_GRID.D[u.cell][e.cell] <= 6), e=>-SIM_GRID.D[u.cell][e.cell])[0] || tg; }
  else if(sp.tgt==='cluster'){ main = sCluster(u, en, sp.r || 1) || tg; }
  // Wer wird getroffen?
  let targets = [], f = 1;
  const center = u.range <= 1 && sp.r === 1 && sp.tgt!=='cluster' ? u.cell : main.cell;
  if(sp.tgt==='near'){ targets = sByKey(en, e=>SIM_GRID.D[u.cell][e.cell] + simEu(u.cell, e.cell)/100).slice(0, sp.n); f = 0.6; }
  else if(sp.line){ targets = sLine(u, main, en); f = 0.75; }
  else if(sp.r > 0){ targets = en.filter(e=>SIM_GRID.D[center][e.cell] <= sp.r); if(!targets.includes(main) && center===main.cell) targets.unshift(main); f = 0.65; }
  else if(sp.bounce){ targets = [main, ...sByKey(en.filter(e=>e!==main), e=>SIM_GRID.D[main.cell][e.cell]).slice(0, sp.bounce)]; }
  else targets = [main];
  targets = targets.filter(Boolean);
  if(sp.self.shield || sp.self.heal || sp.ally.shield || sp.ally.heal) f *= 0.75;
  if(sp.emp){ u.emp = sp.emp; u.empD = P * 0.35; }
  if(sp.as) u.buffs.push({k:'asP', v:sp.as, end:t + 4});
  if(sp.dmg && !sp.emp){
    targets.forEach((e, i)=>{
      const v = P * f * (sp.bounce && i > 0 ? 0.5 : 1);
      if(sp.dot) sDot(u, e, v, 3, dt); else sDamage(u, e, v, dt, {ab:true, canCrit:u.prec, sum});
      hits.push(e.id);
    });
  }
  if(sp.every && u.casts % sp.every.n===0){   // Sonder-Aktivierung (z. B. jede 4.): stärker, ggf. als Linie durch die größte Gruppe
    const c = (sp.every.cluster && sCluster(u, en, 1)) || main;
    if(c) (sp.every.line ? sLine(u, c, en) : [c]).forEach(e=>{ sDamage(u, e, P * (sp.every.line ? 1.1 : 1.5), dt, {ab:true, canCrit:u.prec, sum}); if(!hits.includes(e.id)) hits.push(e.id); });
  }
  targets.forEach(e=>{
    if(sp.burn) sDebuff(e, 'burn', 0.015, 3, u);
    if(sp.wound) sDebuff(e, 'wound', 0.33, 3, u);
    if(sp.shred) sDebuff(e, 'shred', 0.3, 4, u);
    if(sp.sunder) sDebuff(e, 'sunder', 0.3, 4, u);
    if(sp.slow) sDebuff(e, 'slow', 0.3, 2, u);
  });
  if(sp.stun) (sp.r > 0 ? targets : [main]).forEach(e=>sStun(u, e, SIM_STUN[u.star-1]));
  // Spott: Gegner im Umkreis von 2 Feldern – wer gerade springt (z. B. Kha'Zix auf die Backline), wird nicht zurückgezogen
  if(sp.taunt) sEnemiesNear(u, u.cell, 2).filter(e=>!(e.jump && e.mvT1 > t)).forEach(e=>{ e.taunt = u; e.tauntEnd = t + 2; e.tgt = u; });
  if(sp.self.shield) sShield(u, u, simShieldVal(u), 4);
  if(sp.self.heal) sHeal(u, u, simShieldVal(u) * 0.8);
  if(sp.ally.shield || sp.ally.heal){
    sByKey(SS.units.filter(a=>a.alive && a.side===u.side && a!==u && !a.plant), a=>a.hp/a.maxHp).slice(0, 2).forEach(a=>{
      if(sp.ally.shield) sShield(u, a, simShieldVal(u) * 0.6, 4); else sHeal(u, a, simShieldVal(u) * 0.5);
    });
  }
  for(const g of u.on.cast) g();
  // Ionenfunke in der Nähe: Wirken kostet Leben
  SS.units.forEach(e=>{ if(e.alive && e.side!==u.side && e.ionic && SIM_GRID.D[e.cell][u.cell] <= 2) sDamage(e, u, u.maxMana * e.ionic, 'magic', {noHooks:true}); });
  const parts = [];
  if(sum.v) parts.push(L(`${Math.round(sum.v)} Schaden`, `${Math.round(sum.v)} damage`));
  if(sp.dot && sp.dmg && !sp.emp) parts.push(L('Schaden über Zeit', 'damage over time'));
  if(sp.emp) parts.push(L(`nächste ${sp.emp} Angriffe verstärkt`, `next ${sp.emp} attacks empowered`));
  if(sp.self.shield) parts.push(L('Schild', 'shield')); if(sp.self.heal) parts.push(L('Heilung', 'healing'));
  if(sp.stun) parts.push(L('Betäubung', 'stun')); if(sp.taunt) parts.push(L('Spott', 'taunt'));
  sLog('cast', {s:u.id, d:main ? main.id : -1, hits, r:sp.r, c:center, v:Math.round(sum.v), txt:`${sName(u)} ${L('wirkt', 'casts')} ${esc(sp.name || L('Fähigkeit', 'ability'))}${hits.length ? L(' auf ', ' on ') + hits.slice(0,3).map(id=>sName(SS.units[id])).join(', ') + (hits.length > 3 ? ` +${hits.length-3}` : '') : ''}${parts.length ? ' – ' + parts.join(', ') : ''}`});
}

/* ---------- Ein Schritt pro Unit ---------- */
function sTick(u){
  const t = SS.t;
  for(const f of u.on.tick) f();
  if(!u.alive || u.plant){ if(u.plant) u.st = 'idle'; return; }
  if(u.stunEnd > t){ u.st = 'stun'; return; }
  u.atkCD -= SIM_DT;
  if(u.maxMana > 5 && u.manaLock <= t && u.regen) u.mana = Math.min(u.maxMana, u.mana + u.regen * SIM_DT);
  if(u.mvT1 > t){ u.st = u.jump ? 'jump' : 'move'; return; }
  if(u.castEnd > t){ u.st = 'cast'; return; }
  u.jump = false;
  let tg = u.tgt;
  const forced = u.taunt && u.taunt.alive && u.tauntEnd > t && sTargetable(u.taunt) ? u.taunt : null;
  if(forced) tg = forced;
  if(!(tg && sTargetable(tg) && SIM_GRID.D[u.cell][tg.cell] <= u.range)){
    const bfs = sBfs(u), nt = forced || sPick(u, bfs);
    if(nt !== u.tgt){ u.tgt = nt; u.tgtSince = t; if(nt) sLog('tgt', {s:u.id, d:nt.id, txt:L(`${sName(u)} nimmt ${sName(nt)} ins Visier`, `${sName(u)} targets ${sName(nt)}`)}); }
    tg = nt;
    if(!tg){ u.st = 'idle'; u.path = null; return; }
    if(SIM_GRID.D[u.cell][tg.cell] > u.range){ sStep(u, tg, bfs); return; }
  }
  u.path = null;
  if(!u.spec.noCast && u.maxMana > 5 && u.mana >= u.maxMana){ sCast(u, tg); u.st = 'cast'; return; }
  if(u.atkCD <= 0) sAttack(u, tg);
  u.st = 'atk';
}
function sTickDots(){   // alle 0,5 s: Verbrennung, Blutung, Schaden über Zeit
  SS.units.forEach(u=>{
    if(!u.alive) return;
    ['burn','burnI'].forEach(k=>{ const b = u.debs.filter(x=>x.k===k && x.end > SS.t).sort((a,c)=>c.v - a.v)[0]; if(b) sDamage(b.src && b.src.alive ? b.src : null, u, u.maxHp * b.v * 0.5, 'true', {dot:true, noHooks:true}); });
    u.debs = u.debs.filter(b=>b.end > SS.t); u.buffs = u.buffs.filter(b=>b.end > SS.t);
  });
  SS.dots = SS.dots.filter(d=>{ if(d.tgt.alive) sDamage(d.src, d.tgt, d.dps * 0.5, d.type, {dot:true, noHooks:true, ab:true}); return d.end > SS.t + 0.01 && d.tgt.alive; });
}

/* ---------- Items, Traits, Augments ---------- */
function sItemStats(u, fx){
  Object.entries(fx || {}).forEach(([k, v])=>{
    if(typeof v !== 'number') return;
    if(k==='AD') u.adP += v; else if(k==='AP') u.ap += v; else if(k==='AS') u.asP += v/100;
    else if(k==='Health') u.hpF += v; else if(k==='BonusPercentHP') u.hpP += v;
    else if(k==='Armor') u.ar += v; else if(k==='MagicResist') u.mr += v;
    else if(k==='CritChance') u.crit += v/100; else if(k==='ManaRegen') u.regen += v; else if(k==='StatOmnivamp') u.omni += v;
  });
}
const SIM_ITEMS = {
  adaptivehelm(u, fx){ if(u.row <= 1){ u.ar += fx.FrontlineResists||30; u.mr += fx.FrontlineResists||30; } else { u.adP += (fx.BacklineADAP||10)/100; u.ap += fx.BacklineADAP||10; } },
  archangelsstaff(u, fx){ sEvery(u, fx.IntervalSeconds||5, ()=>{ u.ap += fx.APPerInterval||20; }); },
  bloodthirster(u, fx){ sLow(u, (fx.HealthThreshold||40)/100, ()=>sShield(u, u, u.maxHp*(fx.ShieldHealthPercent||25)/100, fx.ShieldDuration||5, L('Blutdürster', 'Bloodthirster'))); },
  bramblevest(u, fx){ u.atkTaken *= 1 - (fx.AutoDamageReduction||0.05); let cd = 0;
    u.on.hurt.push((src, d, ty, o)=>{ if(!o.atk || SS.t < cd) return; cd = SS.t + (fx.ICD||2); sEnemiesNear(u, u.cell, 1).forEach(e=>sDamage(u, e, fx['1StarAoEDamage']||100, 'magic', {noHooks:true})); }); },
  crownguard(u, fx){ u.on.start.push(()=>sShield(u, u, u.maxHp*(fx.ShieldSize||25)/100, fx.ShieldDuration||8, L('Kronenwächter', 'Crownguard'))); sAt(u, fx.ShieldDuration||8, ()=>{ u.ap += fx.ShieldBonusAP||25; }); },
  deathblade(u, fx){ u.amp += fx.BonusDamage||0.1; },
  dragonsclaw(u, fx){ sEvery(u, fx.HealthRegenInterval||2, ()=>sHeal(u, u, u.maxHp*(fx.PercentHealthDamage||2.5)/100)); },
  edgeofnight(u, fx){ sLow(u, (fx.HealthThreshold||60)/100, ()=>{ u.untarget = SS.t + (fx.StealthDuration||1); u.debs = []; u.stunEnd = Math.min(u.stunEnd, SS.t);
    SS.units.forEach(e=>{ if(e.tgt===u){ e.tgt = null; } }); sLog('proc', {s:u.id, txt:L(`${sName(u)} wird kurz unangreifbar (Schneide der Nacht)`, `${sName(u)} becomes untargetable for a moment (Edge of Night)`)}); }); },
  evenshroud(u, fx){ u.buffs.push({k:'ar', v:fx.BonusResists||15, end:fx.BonusResistDuration||15}, {k:'mr', v:fx.BonusResists||15, end:fx.BonusResistDuration||15});
    sEvery(u, 0.5, ()=>sEnemiesNear(u, u.cell, fx.HexRange||2).forEach(e=>{ sDebuff(e, 'sunder', (fx.ARReductionAmount||30)/100, 1, u); sDebuff(e, 'shred', (fx.ARReductionAmount||30)/100, 1, u); })); },
  gargoylestoneplate(u, fx){ sEvery(u, 0.25, ()=>{ u.gargRes = SS.units.filter(e=>e.alive && e.side!==u.side && e.tgt===u).length * (fx.ArmorPerEnemy||10); }); },
  giantslayer(u, fx){ u.on.amp.push(t=>t.maxHp > 1750 ? (fx.DamageAmp||0.15) : 0); },
  guinsoosrageblade(u, fx){ u.on.atk.push(()=>{ u.asP += (fx.AttackSpeedPerStack||7)/100; }); },
  handofjustice(u, fx){ u.omni += fx.StatOmnivamp_NotStatBar||0.12; u.adP += fx.AD_NotStatBar||0.15; u.ap += fx.AP_NotStatBar||15; },
  hextechgunblade(u, fx){ u.on.hit.push((t, d)=>{ const a = sLowestAlly(u); if(a) sHeal(u, a, d*(fx.AllyHealing||0.2)); }); },
  infinityedge(u){ u.prec = true; },
  jeweledgauntlet(u){ u.prec = true; },
  ionicspark(u, fx){ u.ionic = (fx.ManaRatio||150)/100; sEvery(u, 0.5, ()=>sEnemiesNear(u, u.cell, fx.HexRange||2).forEach(e=>sDebuff(e, 'shred', (fx.MRShred||30)/100, 1, u))); },
  krakensfury(u, fx){ let n = 0; const cap = fx.MaxStacks||15; u.on.atk.push(()=>{ if(n < cap){ n++; u.adP += fx.ADOnAttack||0.035; if(n===cap) u.asP += fx.ASCapstone||0.15; } }); },
  lastwhisper(u, fx){ u.on.hit.push(t=>sDebuff(t, 'sunder', (fx.ArmorReductionPercent||30)/100, fx.ArmorBreakDuration||3, u)); },
  morellonomicon(u, fx){ u.on.hit.push((t, d, ty, o)=>{ if(!o.ab) return; sDebuff(t, 'burn', (fx.BurnPercent||1)/100, fx.BurnDuration||10, u); sDebuff(t, 'wound', (fx.GrievousWoundsPercent||33)/100, fx.BurnDuration||10, u); }); },
  nashorstooth(u, fx){ u.manaOnAtk += fx.BaseManaOnHit||2; },
  protectorsvow(u, fx){ u.mana += fx.CombatStartMana||20; sLow(u, (fx.HealthThreshold||40)/100, ()=>sShield(u, u, u.maxHp*(fx.ShieldHealthPercent||20)/100, fx.ShieldDuration||60, L('Beschützerschwur', 'Protector\'s Vow'))); },
  quicksilver(u, fx){ u.ccImm = fx.SpellShieldDuration||18; sEvery(u, 2, ()=>{ if(SS.t < u.ccImm) u.asP += fx.ProcAttackSpeed||0.03; }); },
  rabadonsdeathcap(u, fx){ u.amp += fx.BonusDamage||0.15; },
  redbuff(u, fx){ u.amp += fx.BonusDamage||0.06; u.on.hit.push(t=>{ sDebuff(t, 'burn', (fx.BurnPercent||1)/100, fx.Duration||5, u); sDebuff(t, 'wound', (fx.HealingReductionPct||33)/100, fx.Duration||5, u); }); },
  spearofshojin(u, fx){ u.manaOnAtk += fx.FlatManaRestore||5; },
  spiritvisage(u, fx){ sEvery(u, fx.HealTickRate||1, ()=>sHeal(u, u, Math.min(fx.MaxHeal||250, (u.maxHp - u.hp)*(fx.MissingHealthHeal||0.02)))); },
  steadfastheart(u, fx){ u.dr.push(()=>u.hp/u.maxHp > (fx.ThresholdForEmpower||0.5) ? (fx.EmpoweredDurability||0.15) : (fx.BaseDurability||0.05)); },
  steraksgage(u, fx){ sLow(u, (fx.HealthThreshold||60)/100, ()=>sShield(u, u, u.maxHp*(fx.PercentHealthShield||0.4), fx.ShieldDuration||4, L('Steraks Pfand', 'Sterak\'s Gage'))); },
  strikersflail(u, fx){ u.on.hit.push((t, d, ty, o, crit)=>{ if(crit && u.buffs.filter(b=>b.k==='amp' && b.flail && b.end > SS.t).length < (fx.MaxStacks||4)) u.buffs.push({k:'amp', v:fx.BuffDamageAmp||0.05, end:SS.t + (fx.Duration||5), flail:1}); }); },
  sunfirecape(u, fx){ sEvery(u, fx.ICD||2, ()=>sEnemiesNear(u, u.cell, fx.HexRange||2).forEach(e=>{ sDebuff(e, 'burn', (fx.BurnPercent||1)/100, fx.BurnDuration||10, u); sDebuff(e, 'wound', (fx.GrievousWoundsPercent||33)/100, fx.BurnDuration||10, u); })); },
  titansresolve(u, fx){ let n = 0; const cap = fx.StackCap||25; const add = ()=>{ if(n >= cap) return; n++; u.adP += fx.StackingAD||0.02; u.ap += fx.StackingSP||2; if(n===cap) u.amp += fx.StackedAmp||0.1; }; u.on.atk.push(add); u.on.hurt.push(add); },
  voidstaff(u, fx){ u.on.hit.push(t=>sDebuff(t, 'shred', (fx.MRShred||30)/100, fx.MRShredDuration||5, u)); },
  zhonyasparadox(u, fx){ sLow(u, (fx.PercentHealthThreshold||40)/100, ()=>{ u.invuln = SS.t + (fx.InvulnDuration||3); u.stunEnd = Math.max(u.stunEnd, u.invuln); sLog('proc', {s:u.id, txt:L(`${sName(u)} ist ${fx.InvulnDuration||3} s unverwundbar (Zhonyas Paradoxon)`, `${sName(u)} is invulnerable for ${fx.InvulnDuration||3} s (Zhonya's Paradox)`)}); }); },
  statikkshiv(u, fx){ u.on.atk.push(()=>{ if(u.attacks % 3) return; sByKey(sAlive(1-u.side), e=>SIM_GRID.D[u.cell][e.cell]).slice(0, fx.NumTargets||4).forEach(e=>{ sDamage(u, e, (fx.Damage||30) * sAP(u)/100, 'magic', {noHooks:true}); sDebuff(e, 'shred', 0.3, 5, u); }); }); },
  titanichydra(u, fx){ u.on.hit.push((t, d, ty, o)=>{ if(!o.atk) return; sEnemiesNear(u, t.cell, 1).filter(e=>e!==t).forEach(e=>sDamage(u, e, sAD(u)*(fx.PercentAttackDamageSplash||6)/100 + u.maxHp*(fx.PercentMaxHealthSplash||4)/100, 'phys', {noHooks:true})); }); },
  mittens(u, fx){ u.dr.push((fx.PercentDR||25)/100 * 0.4); },
};
// Schwarzdorn-Opferfeld und Rollen kommen aus data/custom-<Set>.js
const simBlackthorn = () => (typeof TFT_CUSTOM_SET!=='undefined' && TFT_CUSTOM_SET.blackthorn) || null;
const SIM_ROLE_DE = {tank:'Tank', ad:'AD', ap:'AP'};
const SIM_TANK_TRAITS = ['Defender','Juggernaut','Vanguard','Brawler','Monolith','Bastion','Bruiser','Warden','Guardian','Juggernaut'];
function simRole(n){
  const r = ((typeof TFT_CUSTOM_SET!=='undefined' && TFT_CUSTOM_SET.roles) || {})[n]; if(r) return r;
  const d = CH_DATA[n] || {}, st = d.st || {};
  if((st.range||1) <= 1 && (d.t||[]).some(t=>SIM_TANK_TRAITS.includes(t))) return 'tank';
  return simSpec(n).dt==='magic' ? 'ap' : 'ad';
}
// Steht auf dem Opferfeld eine Unit und ist Schwarzdorn aktiv? (Das Opfer zählt vor dem Kampf noch für die Traits mit.)
function simSacrifice(board){
  const cfg = simBlackthorn(), b = cfg && board[cfg.hex];
  if(!b || !CH_DATA[b.u]) return null;
  const team = {board:Object.entries(board).map(([h, x])=>({u:x.u, h:+h, s:x.s, i:x.i}))};
  return compTraits(team).some(t=>t.n==='Blackthorn') ? b : null;
}
const simTraitVals = (name, k) => { const tr = TFT_DATA.traits.find(x=>x.n===name); return tr ? Object.assign({}, ...(tr.fx||[]).filter(f=>f.min <= k).map(f=>f.v||{})) : {}; };
// Rückgabe: 'teil' = vereinfacht, sonst voll simuliert
const SIM_TRAITS = {
  Ravager(v, m){ m.forEach(u=>{ u.omni += v.Omnivamp||0; u.on.amp.push(t=>(v.BonusDamagePercentBase||0) * (t.hp/t.maxHp < (v.EnemyHealthThreshold||0.5) ? 2 : 1)); }); },
  Solar(v, m, all){ all.forEach(u=>{ u.on.start.push(()=>sShield(u, u, u.maxHp*(v.ShieldRatio||0.05), 99)); u.on.amp.push((t, ty)=>ty==='magic' ? (v.BonusMagicDamage||0) : 0); }); return 'teil'; },
  Sprykin(v, m){ const r = m.slice().sort((a,b)=>b.cost - a.cost || b.star - a.star)[0]; if(r){ r.hpP += v.HealthIncrease||0; r.asP += v.AttackSpeedIncrease||0; } return 'teil'; },
  Adaptor(v, m){ m.forEach(u=>{ if(u.spec.dt==='magic') u.ap += (v.ADAPGain||0)*100; else u.adP += v.ADAPGain||0; }); },
  Hunter(v, m){ m.forEach(u=>{ u.adP += v.HunterAD||0; u.on.amp.push(t=>t===u.tgt && SS.t - u.tgtSince >= (v.HunterDuration||3) ? (v.DamageAmp||0) : 0); }); },
  Invoker(v, m, all){ all.forEach(u=>{ u.regen += m.includes(u) ? (v.InvokerManaBonus||0) : (v.TeamManaRegen||0); }); },
  Rapidfire(v, m, all){ all.forEach(u=>{ u.asP += v.TeamAS||0; }); m.forEach(u=>{ let n = 0; u.on.atk.push(()=>{ if(n < (v.MaxStacks||10)){ n++; u.asP += v.ASperAttack||v.ASPerAttack||0; } }); }); },
  Juggernaut(v, m, all){ all.forEach(u=>u.dr.push(m.includes(u) ? (v.JuggernautDurability||0) : (v.TeamDurability||0))); },
  Inferno(v, m){ m.forEach(u=>u.on.hit.push(t=>{ sDebuff(t, 'burnI', (v.HPBurnPerSecond||1)/100, v.Duration||3, u); sDebuff(t, 'wound', (v.WoundPercent||33)/100, v.Duration||3, u); })); },
  Attuned(v, m, all){ all.forEach(u=>{ u.dr.push((v.Durability||0)/2); u.amp += (v.DamageAmp||0)/2; }); return 'teil'; },
  Vanguard(v, m){ m.forEach(u=>{ const sh = ()=>sShield(u, u, u.maxHp*(v.MaxHealthShield||0), v.ShieldDuration||10, L('Frontkämpfer', 'Vanguard')); u.on.start.push(sh); sLow(u, v.HealthThreshold||0.5, sh); if(v.DurabilityIncrease) u.dr.push(()=>u.shields.length ? v.DurabilityIncrease : 0); }); },
  Brawler(v, m, all){ all.forEach(u=>{ u.hpF += v.BrawlerTeamHealth||0; }); m.forEach(u=>{ u.hpP += v.BrawlerHealthPercent||0; }); },
  Blackthorn(v, m, all, k, ctx){
    const cfg = simBlackthorn(), s = ctx.sac;
    if(!cfg){ all.forEach(u=>{ u.hpF += v.Health||0; }); return 'teil'; }
    if(!s) return 'nein';   // ohne Opfer auf dem Feld gibt es keinen Bonus
    const d = CH_DATA[s.u], role = simRole(s.u), r = cfg.role[role] || {};
    const f = ((cfg.mult[(d ? d.c : 1) - 1] || [])[(s.s||1) - 1] || 0) * (1 + (v.StatMultiplier||0));
    all.forEach(u=>{ u.hpF += v.Health||0; });
    m.forEach(u=>{ u.hpP += (r.hpP||0)*f; u.ar += (r.res||0)*f; u.mr += (r.res||0)*f; u.adP += (r.adP||0)*f; u.asP += (r.asP||0)*f; u.regen += (r.regen||0)*f; u.amp += (r.amp||0)*f; });
    const bits = [];
    if(r.hpP) bits.push(`+${fmtNum(Math.round(r.hpP*f*1000)/10)} % ${L('Leben', 'health')}`); if(r.res) bits.push(`+${fmtNum(Math.round(r.res*f*10)/10)} ${L('Rüstung & MR', 'armor & MR')}`);
    if(r.adP) bits.push(`+${fmtNum(Math.round(r.adP*f*1000)/10)} % AD`); if(r.asP) bits.push(`+${fmtNum(Math.round(r.asP*f*1000)/10)} % ${L('Angriffstempo', 'attack speed')}`);
    if(r.regen) bits.push(`+${fmtNum(Math.round(r.regen*f*10)/10)} ${L('Manareg.', 'mana regen')}`); if(r.amp) bits.push(`+${fmtNum(Math.round(r.amp*f*1000)/10)} % ${L('Schadenssteigerung', 'damage amp')}`);
    ctx.info.sac = {u:s.u, s:s.s||1, role, f, hp:v.Health||0, bits};
    sLog('sac', {s:-1, side:ctx.side, txt:L(`${esc(s.u)} ${'★'.repeat(s.s||1)} wird auf dem Schwarzdorn-Feld geopfert (${SIM_ROLE_DE[role]}) – alle Champions +${v.Health||0} Leben, Schwarzdorn: ${bits.join(', ')}`, `${esc(s.u)} ${'★'.repeat(s.s||1)} is sacrificed on the Blackthorn hex (${SIM_ROLE_DE[role]}) – all champions +${v.Health||0} health, Blackthorn: ${bits.join(', ')}`)});
    return 'ja';
  },
  Executioner(v, m){ m.forEach(u=>{ u.crit += v.CritChance||0; u.prec = true; if(v.BonusBleedPercent) u.on.hit.push((t, d)=>sDot(u, t, d*v.BonusBleedPercent, v.BleedDuration||3, 'true')); }); },
  Riftbeast(v, m){ if(!v.CapstoneAD) return 'teil'; m.forEach(u=>{ const grow = ()=>{ u.adP += v.CapstoneAD; u.ap += (v.CapstoneAP||0)*100; u.asP += v.CapstoneAspd||0; u.ar += v.CapstoneArmor||0; u.mr += v.CapstoneMR||0; u.maxHp += v.CapstoneHealth||0; u.hp += v.CapstoneHealth||0; }; u.on.start.push(grow); sEvery(u, 5, grow); }); return 'teil'; },
  Caustic(v, m){ m.forEach(u=>u.on.hit.push(t=>{ sDebuff(t, 'sunder', (v.ShredPercent||30)/100, v.ShredDuration||4, u); sDebuff(t, 'shred', (v.ShredPercent||30)/100, v.ShredDuration||4, u); })); },
  Fae(v, m){ m.forEach(u=>{ let el = 0; sEvery(u, 2.5, ()=>{ if(el < 7){ el++; u.adP += (v.ADAP||0)/100; u.ap += v.ADAP||0; } }); sLow(u, v.HealThreshold||0.5, ()=>sHeal(u, u, u.maxHp*(v.Heal||0)/100*Math.max(1, el))); }); return 'teil'; },
  Lunar(v, m, all){ const got = new Set(); m.forEach(l=>{ got.add(l); all.forEach(a=>{ if(SIM_GRID.D[a.cell][l.cell]===1) got.add(a); }); });
    got.forEach(u=>{ const x = m.includes(u) ? 1 + (v.LunarMultiplier||0) : 1; u.asP += (v.AttackSpeed||0)*x; u.ap += (v.AbilityPower||0)*100*x; }); },
  Defender(v, m, all){ all.forEach(u=>{ const x = m.includes(u) ? (v.DefenderDefenseGain||0) : (v.NonDefenderDefenseGain||0); u.ar += x; u.mr += x; }); },
  Spellweaver(v, m, all){ all.forEach(u=>{ u.ap += (m.includes(u) ? (v.SpellweaverAP||0) : (v.TeamwideAP||0))*100; }); m.forEach(u=>u.on.cast.push(()=>{ u.ap += (v.APPerCast||0)*100; })); },
  Thornmaiden(v, m, all){ all.forEach(u=>u.dr.push(v.BaseDurability||0)); return 'teil'; },
  'Flora Fatalis'(v, m){ m.forEach(u=>u.on.kill.push(()=>{ u.mana = Math.min(u.maxMana, u.mana + (v.Mana||10)); if(v.PercentHeal){ const a = sLowestAlly(u); if(a) sHeal(u, a, a.maxHp*v.PercentHeal); } })); },
  Monolith(v, m){ m.forEach(u=>sEvery(u, 0.25, ()=>{ u.monoRes = SS.units.filter(e=>e.alive && e.side!==u.side && e.tgt===u).length*(v.Resists||10); })); },
  Blossom(v, m){ m.forEach(u=>{ u.adP += v.ADAP||0; u.ap += (v.ADAP||0)*100; u.hpP += v.BonusHealth||0; }); },
};
function simTraitGeneric(v, m){   // unbekannte Traits (andere Sets): erkennbare Werte auf die Träger anwenden
  let any = false;
  Object.entries(v).forEach(([k, x])=>{
    if(typeof x !== 'number') return; const kk = k.toLowerCase();
    const add = f=>{ m.forEach(f); any = true; };
    if(/^(ad|bonusad|adpercent)$/.test(kk)) add(u=>{ u.adP += x; });
    else if(/^(ap|abilitypower)$/.test(kk)) add(u=>{ u.ap += x < 2 ? x*100 : x; });
    else if(/^(as|attackspeed)$/.test(kk)) add(u=>{ u.asP += x < 2 ? x : x/100; });
    else if(/^(health|bonushealth|hp)$/.test(kk)) add(u=>{ if(x < 2) u.hpP += x; else u.hpF += x; });
    else if(/^(armor|bonusarmor)$/.test(kk)) add(u=>{ u.ar += x; });
    else if(/^(magicresist|mr|bonusmr)$/.test(kk)) add(u=>{ u.mr += x; });
    else if(/^resists$/.test(kk)) add(u=>{ u.ar += x; u.mr += x; });
    else if(/durability/.test(kk)) add(u=>{ u.dr.push(x); });
    else if(/^damageamp$/.test(kk)) add(u=>{ u.amp += x; });
    else if(/omnivamp/.test(kk)) add(u=>{ u.omni += x; });
    else if(/^critchance$/.test(kk)) add(u=>{ u.crit += x < 1 ? x : x/100; });
    else if(/manaregen/.test(kk)) add(u=>{ u.regen += x; });
  });
  return any ? 'teil' : 'nein';
}
const simAugKey = en => normN(String(en).replace(/\+$/, '').replace(/\s+(I{1,3}|IV)$/, ''));
const SIM_AUGS = {
  tonsofstats(fx, all){ all.forEach(u=>{ u.hpF += fx.Health||0; u.adP += fx.ADAP||0; u.ap += (fx.ADAP||0)*100; u.ar += fx.Resists||0; u.mr += fx.Resists||0; u.asP += fx.AttackSpeed||0; u.mana += fx.Mana||0; }); },
  celestialblessing(fx, all){ const o = fx.OmnivampI||fx.OmnivampII||fx.OmnivampIII||0; all.forEach(u=>{ u.omni += o; }); },
  focusedfire(fx, all){ all.forEach(u=>{ u.adP += fx.AD||fx.BaselineAD||0; sEvery(u, fx.Timer||fx.ProcDelay||5, ()=>{ u.adP += fx.StackAD||fx.ADPerProc||0; }); }); },
  glasscannon(fx, all){ all.filter(u=>u.row >= 2).forEach(u=>{ u.amp += fx.DamageAmp||0; u.on.start.push(()=>{ u.hp = u.maxHp*(fx.StartingHP||fx.Health||0.8); }); }); },
  ascension(fx, all){ all.forEach(u=>sAt(u, fx.Delay||12, ()=>{ u.amp += (fx.DamageAmp||0)/100; })); },
  partialascension(fx, all){ all.forEach(u=>sAt(u, fx.Delay||12, ()=>{ u.amp += (fx.DamageAmp||0)/100; })); },
  maceswill(fx, all){ all.forEach(u=>{ u.crit += fx.CritChance||0; }); },
  jeweledlotus(fx, all){ all.forEach(u=>{ u.crit += (fx.CritChance||0)/100; u.critD += fx.CritDamage||0; u.prec = true; }); },
  waterlotus(fx, all){ all.forEach(u=>{ u.crit += fx.CritChance||0; u.prec = true; }); },
  bodyguardtraining(fx, all){ const v = (fx.ArmorBonus||0) + 8*(fx.PlayerLevelBonus||0); all.forEach(u=>{ u.ar += v; u.mr += v; }); },
  boxinglessons(fx, all){ const n = all.filter(u=>u.row===0).length; all.forEach(u=>{ u.hpF += n*(fx.Health||fx.HealthIncreasePerFrontLiner||0); }); },
  crownswill(fx, all){ all.forEach(u=>{ u.ap += fx.AP||0; u.ar += fx.Armor||0; }); },
  spearswill(fx, all){ all.forEach(u=>{ u.adP += fx.AD||0; u.mana += fx.Mana||0; }); },
  youhavemybow(fx, all){ all.forEach(u=>{ u.asP += (fx.AS||0)/100; }); },
  cyberneticimplants(fx, all){ all.filter(u=>u.items.length).forEach(u=>{ u.hpF += fx.HP||fx.HPFromGold||0; u.adP += fx.AD||fx.ADFromGold||0; }); },
  cyberneticuplink(fx, all){ all.filter(u=>u.items.length).forEach(u=>{ u.hpF += fx.Health||fx.HPFromGold||0; u.regen += fx.ManaRegen||fx.ManaRegenFromGold||0; }); },
  findyourcenter(fx, all){ const u = all.find(x=>x.row===0 && x.col===3); if(u){ u.amp += fx.DamageAmpPercent||0; u.hpP += fx.MaxHealthMultiplier||0; } },
  grouphug(fx, all){ all.forEach(u=>{ const n = all.filter(a=>a!==u && SIM_GRID.D[a.cell][u.cell]===1).length; u.ar += n*(fx.Resists||0); u.mr += n*(fx.Resists||0); }); },
  keepers(fx, all){ all.forEach(u=>{ if(all.some(a=>a!==u && SIM_GRID.D[a.cell][u.cell]===1)) u.on.start.push(()=>sShield(u, u, fx.ShieldHealth||0, fx.ShieldDuration||8)); }); },
  makeshiftarmor(fx, all){ all.filter(u=>!u.items.length && !u.plant).forEach(u=>{ u.ar += fx.Resists||0; u.mr += fx.Resists||0; }); },
  bestfriends(fx, all){ const nb = u=>all.filter(a=>a!==u && SIM_GRID.D[a.cell][u.cell]===1); all.forEach(u=>{ const n = nb(u); if(n.length===1 && nb(n[0]).length===1){ u.asP += fx.AS||0; u.ar += fx.Armor||0; u.mr += fx.Armor||0; } }); },
  itemcollector(fx, all){ const k = Math.min(new Set(all.flatMap(u=>u.items.map(i=>i.id))).size, fx.MaxCap||99); all.forEach(u=>{ u.adP += k*(fx.AD||0); u.ap += k*(fx.AP||0); u.hpF += (fx.BaseHP||0) + k*(fx.Health||0); }); },
  standunited(fx, all, ctx){ const n = ctx.traits.filter(t=>!t.uniq).length; all.forEach(u=>{ u.adP += n*(fx.AD||0); u.ap += n*(fx.AP||0); }); },
  verticality(fx, all){ all.forEach(u=>{ const n = all.filter(a=>a!==u && a.tr.some(t=>u.tr.includes(t))).length; u.adP += n*(fx.ADAP||0); u.ap += n*(fx.ADAP||0)*100; u.ar += n*(fx.Resists||0); u.mr += n*(fx.Resists||0); }); },
  misfits(fx, all, ctx){ const n = ctx.traits.filter(t=>t.uniq).length; all.forEach(u=>{ u.hpF += n*(fx.Health||0); }); },
  gildedsteel(fx, all){ if(all.some(u=>u.cost===5)) all.filter(u=>u.cost < 5).forEach(u=>u.dr.push(fx.Durability||0)); },
  holdtheline(fx, all){ const n = all.filter(u=>u.row===0).length; all.filter(u=>u.row >= 2).forEach(u=>{ u.adP += n*(fx.AD||0); u.ap += n*(fx.AP||0); }); },
  legionofthrees(fx, all){ all.filter(u=>u.cost===3 || u.items.some(i=>i.cat==='emblem')).forEach(u=>{ u.hpF += fx.HealthAmount||0; u.asP += fx.AS||0; }); },
  vampiricvitality(fx, all){ all.forEach(u=>{ u.omni += fx.OmnivampStatBonus||0; }); },
  sunandmoon(fx, all){ const solar = new Set(all.filter(u=>u.tr.includes('Solar')).map(u=>u.n)).size; all.filter(u=>u.tr.includes('Lunar')).forEach(u=>{ u.hpF += fx.Health||0; u.amp += solar*(fx.DamageAmp||0); }); },
  healingorbs(fx, all, ctx){ const v = fx.HealthFromHealingOrbSilver||fx.HealthFromHealingOrbGold||0; ctx.team.enemyDeath.push(dead=>{ const a = sByKey(sAlive(ctx.side).filter(x=>!x.plant), x=>SIM_GRID.D[x.cell][dead.cell])[0]; if(a) sHeal(a, a, v); }); },
  chargetransfer(fx, all){ all.forEach(u=>{ u.amp += (fx.DamageAmp||0)/100; }); },
  natureshelter(fx, all){ all.filter(u=>!u.plant && all.some(p=>p.plant && SIM_GRID.D[p.cell][u.cell]===1)).forEach(u=>{ u.asP += fx.AS||0; sEvery(u, fx.HealInterval||2, ()=>sHeal(u, u, u.maxHp*(fx.Heal||0))); }); },
  cursedcrown(fx, all){ all.forEach(u=>u.dr.push(fx.DurabilityBonus||0)); },
  flexible(fx, all){ const n = all.reduce((s, u)=>s + u.items.filter(i=>i.cat==='emblem').length, 0); all.forEach(u=>{ u.hpF += n*(fx.Health||0); }); },
  sweettreats(fx, all){ const n = all.reduce((s, u)=>s + u.items.length, 0); all.forEach(u=>{ u.hpF += n*(fx.HealthPerItem||0); }); },
  urf(fx, all){ all.filter(u=>u.items.some(i=>/spatula|fryingpan/i.test(i.id))).forEach(u=>{ u.asP += fx.AS||0; u.regen += fx.ManaRegen||0; }); },
  messhall(fx, all){ all.forEach(u=>sAt(u, fx.EndSeconds||10, ()=>{ u.asP += fx.AttackSpeed||0; })); },
  bronzeforlife(fx, all, ctx){ const n = ctx.traits.filter(t=>t.cls===1).length; all.forEach(u=>{ u.amp += n*(fx.DamageAmp||fx.DamageAmpBonus||0); u.ar += n*(fx.Armor||fx.Resists||0); u.mr += n*(fx.Armor||fx.Resists||0); }); },
  retribution(fx, all){ all.filter(u=>u.items.some(i=>normN(i.en)==='handofjustice')).forEach(u=>{ u.crit += fx.CritChance||0; u.prec = true; }); },
};

/* ---------- Aufbau und Ablauf ---------- */
function sNewUnit(S, b, side, h, label){
  const d = CH_DATA[b.u], st = (d && d.st) || {}, star = Math.min(3, Math.max(1, b.s||1)), plant = !d;
  const u = {id:S.units.length, side, n:b.u, label, star, cost:d ? d.c : 1, tr:d ? d.t.slice() : [], plant, spec:plant ? simSpec('') : simSpec(b.u),
    cell:simCell(side, h), row:Math.floor(h/7), col:h%7, items:[], hp0:(st.hp || (plant ? 650 : 700)) * SIM_STAR_HP[star-1], ad0:(st.ad || (plant ? 0 : 45)) * SIM_STAR_AD[star-1],
    as0:st.as || 0.7, ar:st.ar || 30, mr:st.mr || 30, range:plant ? 0 : (st.range || 1), mana:st.mana0 || 0, maxMana:st.mana || 0,
    hpF:0, hpP:0, adP:0, ap:100, asP:0, crit:st.crit != null ? st.crit : 0.25, critD:1.4, omni:0, amp:0, dr:[], regen:0, prec:false, manaOnAtk:0, atkTaken:1,
    alive:true, hp:0, maxHp:0, shields:[], buffs:[], debs:[], on:{start:[], tick:[], atk:[], hit:[], hurt:[], cast:[], kill:[], low:[], amp:[]},
    atkCD:0, tgt:null, tgtSince:0, path:null, from:null, mvT0:0, mvT1:0, jump:false, castEnd:0, stunEnd:0, untarget:0, invuln:0, ccImm:0, manaLock:0, taunt:null, tauntEnd:0,
    attacks:0, casts:0, emp:0, empD:0, kills:0, deathT:null, st:'idle', dealt:{phys:0, magic:0, true:0}, taken:0, healed:0, shielded:0};
  (b.i||[]).forEach(id=>{ const it = findItem(id); if(it) u.items.push(it); });
  u.omni += u.spec.omni || 0;
  if(u.spec.regen) sEvery(u, 1, ()=>sHeal(u, u, u.maxHp*0.015));
  if(u.spec.aura) sEvery(u, 1, ()=>sEnemiesNear(u, u.cell, 1).forEach(e=>sDamage(u, e, simPow(u)*0.1, 'magic', {noHooks:true})));
  S.units.push(u); S.occ[u.cell] = u.id;
  return u;
}
function sSetup(S, side, board, augs){
  const all = Object.entries(board).map(([h, b])=>[+h, b]).sort((a,b)=>a[0]-b[0]);
  const sac = simSacrifice(board), sacHex = sac ? simBlackthorn().hex : -1;
  const entries = all.filter(([h])=>h !== sacHex);   // das Opfer kämpft nicht mit
  const cnt = {};
  const units = entries.map(([h, b])=>{ cnt[b.u] = (cnt[b.u]||0) + 1; const n = entries.filter(e=>e[1].u===b.u).length; return sNewUnit(S, b, side, h, b.u + (n > 1 ? ' ' + cnt[b.u] : '')); });
  const team = {board:all.map(([h, b])=>({u:b.u, h, s:b.s, i:b.i}))};
  const traits = compTraits(team), info = {traits:[], augs:[], items:[], sac:null};
  const fighters = units.filter(u=>!u.plant);
  const tctx = {sac, side, info};
  traits.forEach(t=>{
    const v = simTraitVals(t.n, t.k);
    const m = fighters.filter(u=>u.tr.includes(t.n) || u.items.some(i=>emblemTrait(i)===t.n));
    let res;
    if(SIM_NOCOMBAT.includes(t.n)) res = 'nein';
    else if(SIM_TRAITS[t.n]) res = SIM_TRAITS[t.n](v, m, fighters, t.k, tctx) || 'ja';
    else res = simTraitGeneric(v, m);
    info.traits.push({n:t.n, k:t.k, cls:t.cls, uniq:t.uniq, res});
  });
  fighters.forEach(u=>u.items.forEach(it=>{
    sItemStats(u, it.fx);
    const base = it.cat==='radiant' ? (radiantBase(it) || it) : it, key = normN(base.en);
    if(SIM_ITEMS[key]) SIM_ITEMS[key](u, it.fx || {});
  }));
  const ctx = {traits, team:S.team[side], side};
  (augs||[]).forEach(id=>{
    const a = augById[id]; if(!a) return;
    const f = SIM_AUGS[simAugKey(a.en)];
    if(f) f(a.fx || {}, fighters, ctx);
    info.augs.push({id, n:a.en, res:f ? 'ja' : 'nein'});
  });
  return info;
}
function simRun(boards, seed, quiet){
  const S = SS = {t:0, rng:simRng(seed), units:[], occ:new Int16Array(56).fill(-1), ev:[], frames:[], quiet:!!quiet, team:[{enemyDeath:[]}, {enemyDeath:[]}], info:[], dots:[], seed};
  boards.forEach((b, side)=>{ S.info[side] = sSetup(S, side, b.board, b.augs); });
  S.units.forEach(u=>{ u.maxHp = (u.hp0 + u.hpF) * (1 + u.hpP); u.hp = u.maxHp; if(u.maxMana > 5) u.mana = Math.min(u.mana, u.maxMana); u.atkCD = 0.2 + S.rng()*0.1; });
  S.units.forEach(u=>u.on.start.forEach(f=>f()));
  sLog('start', {txt:L('Kampfbeginn', 'Combat starts')});
  const order = S.units.slice();
  let winner = -1;
  for(let step = 0; ; step++){
    S.t = Math.round(step * SIM_DT * 1000) / 1000;
    if(step && step % 10===0) sTickDots();
    for(let i = order.length - 1; i > 0; i--){ const j = Math.floor(S.rng() * (i+1)); [order[i], order[j]] = [order[j], order[i]]; }
    for(const u of order) if(u.alive) sTick(u);
    if(S.t===SIM_OT) sLog('ot', {txt:L('Verlängerung: Schaden und Angriffstempo steigen jede Sekunde', 'Overtime: damage and attack speed increase every second')});
    if(!quiet) sFrame(S, step);
    const a0 = S.units.some(u=>u.alive && u.side===0 && !u.plant), a1 = S.units.some(u=>u.alive && u.side===1 && !u.plant);
    if(!a0 || !a1){ winner = a0 ? 0 : a1 ? 1 : -1; break; }
    if(S.t >= SIM_END){ winner = -1; break; }
  }
  S.winner = winner; S.end = S.t;
  sLog('end', {txt:winner===0 ? L('Sieg! Dein Team gewinnt.', 'Victory! Your team wins.') : winner===1 ? L('Niederlage – der Gegner gewinnt.', 'Defeat – the enemy wins.') : L('Unentschieden – Zeit abgelaufen.', 'Draw – time ran out.')});
  SS = null;
  return S;
}
/* ---------- DPS-Rechner: ein Champion schlägt auf Trainingspuppen ---------- */
// Die Puppen greifen nicht an und fallen nicht um (Leben/Rüstung/MR nach Profil). Ohne Traits und Augments.
const SIM_DPS_STEP = 0.25;
function simDpsRun(o, seed){
  const S = SS = {t:0, rng:simRng(seed), units:[], occ:new Int16Array(56).fill(-1), ev:[], frames:[], quiet:true, team:[{enemyDeath:[]}, {enemyDeath:[]}], info:[], dots:[], seed};
  const u = sNewUnit(S, {u:o.champ, s:o.star, i:o.items}, 0, 3);
  // Hauptziel direkt vor dem Champion, weitere Puppen daneben (für Flächenschaden)
  const dummies = [3, 4, 2].slice(0, o.n).map(h=>sNewUnit(S, {u:'Dummy'}, 1, h, 'Dummy'));
  // Traits auf der gewählten Stufe (o.traits = [{n, k}]) – wie im Kampf-Simulator, nur mit dem einen Champion als Träger
  const tctx = {sac:null, side:0, info:{traits:[], augs:[], items:[], sac:null}};
  (o.traits || []).forEach(t=>{
    if(!t.k || SIM_NOCOMBAT.includes(t.n)) return;
    const v = simTraitVals(t.n, t.k);
    if(SIM_TRAITS[t.n]) SIM_TRAITS[t.n](v, [u], [u], t.k, tctx); else simTraitGeneric(v, [u]);
  });
  u.items.forEach(it=>{
    sItemStats(u, it.fx);
    const base = it.cat==='radiant' ? (radiantBase(it) || it) : it, f = SIM_ITEMS[normN(base.en)];
    if(f) f(u, it.fx || {});
  });
  u.maxHp = (u.hp0 + u.hpF) * (1 + u.hpP); u.hp = u.maxHp; if(u.maxMana > 5) u.mana = Math.min(u.mana, u.maxMana); u.atkCD = 0.2 + S.rng()*0.1;
  dummies.forEach(d=>{ d.maxHp = o.hp; d.hp = 1e12; d.ar = o.ar; d.mr = o.mr; });
  u.on.start.forEach(f=>f());
  const per = Math.round(SIM_DPS_STEP / SIM_DT), rec = {ph:[0], mg:[0], tr:[0]};
  for(let step = 1; ; step++){
    S.t = Math.round(step * SIM_DT * 1000) / 1000;
    if(step % 10===0) sTickDots();
    sTick(u);
    if(step % per===0){ rec.ph.push(u.dealt.phys); rec.mg.push(u.dealt.magic); rec.tr.push(u.dealt.true); }
    if(S.t >= o.dur - 1e-9) break;
  }
  rec.atk = u.attacks; rec.casts = u.casts;
  SS = null;
  return rec;
}
// Mittelwert aus mehreren Durchläufen (Krits sind Zufall) → kumulierter Schaden alle 0,25 s
function simDps(o, runs){
  runs = runs || 24;
  const acc = {ph:null, mg:null, tr:null, atk:0, casts:0};
  for(let r = 0; r < runs; r++){
    const x = simDpsRun(o, 1000 + r * 7919);
    ['ph','mg','tr'].forEach(k=>{ if(!acc[k]) acc[k] = new Array(x[k].length).fill(0); x[k].forEach((v, i)=>{ acc[k][i] += v / runs; }); });
    acc.atk += x.atk / runs; acc.casts += x.casts / runs;
  }
  acc.tot = acc.ph.map((v, i)=>v + acc.mg[i] + acc.tr[i]);
  acc.t = acc.tot.map((_, i)=>i * SIM_DPS_STEP);
  return acc;
}

function sPos(u){
  const P = SIM_GRID.P;
  if(u.alive && u.mvT1 > SS.t && u.from !== null){
    const k = Math.min(1, (SS.t - u.mvT0) / (u.mvT1 - u.mvT0)), a = P[u.from], b = P[u.cell];
    return {x:a.x + (b.x - a.x)*k, y:a.y + (b.y - a.y)*k - (u.jump ? Math.sin(Math.PI*k)*0.6 : 0)};
  }
  return P[u.cell];
}
function sFrame(S, step){
  S.frames.push(S.units.map(u=>{
    const p = sPos(u);
    const f = {x:p.x, y:p.y, hp:u.hp, mh:u.maxHp, sh:u.shields.reduce((s, x)=>s + (x.end > S.t ? x.v : 0), 0), m:u.mana, mm:u.maxMana,
      st:u.alive ? u.st : 'dead', tg:u.alive && u.tgt && u.tgt.alive ? u.tgt.id : -1, pa:u.alive && (u.st==='move') ? u.path : null, c:u.cell,
      dp:u.dealt.phys, dm:u.dealt.magic, dt:u.dealt.true, tk:u.taken, hl:u.healed + u.shielded, un:u.untarget > S.t ? 1 : 0};
    if(step % 5===0) f.s = [sAD(u), sAP(u), sAS(u), sAR(u), sMR(u), Math.min(1, u.crit + sBuff(u, 'crit'))];
    return f;
  }));
}

/* ================= ANSICHT ================= */
let simView = 'edit';   // 'edit' = Aufstellung (ein gemeinsames Brett), 'fight' = Kampf-Ansicht – nie beides gleichzeitig
let simRes = null, simT = 0, simPlaying = false, simSpeedV = 1, simRaf = 0, simSel = null, simSeed = 7, simLastFrame = -1, simMC = null, simMeterTab = 'd', simLogAtk = false, simPrevTs = 0, simW = 60;
const simFmt = v => fmtNum(Math.round(v*10)/10);
function simBoards(){ return [{board:bBoard, augs:bAugs}, {board:eBoard, augs:eAugs}]; }
function simMount(){
  const p = $('#simPanel'); if(!p) return;
  if(!p.dataset.built){
    p.dataset.built = '1';
    p.innerHTML = `<div class="sim-head">
        <div class="sim-picks">
          <label class="sim-pick s0"><span>Dein Team</span><select class="input" id="simPickM">${simCompOptions()}</select></label>
          <span class="sim-vs" aria-hidden="true">VS</span>
          <label class="sim-pick s1"><span>Gegner</span><select class="input" id="simPickE">${simCompOptions()}</select></label>
        </div>
        <button class="btn btn-primary sim-go" id="simRun" type="button">⚔ Kampf starten</button>
        <button class="b-tbtn sim-view" id="simView" type="button" hidden></button>
        <div class="sim-ctrl" id="simCtrl" hidden>
          <button class="sim-ib" id="simBack" type="button" title="1 s zurück" aria-label="1 Sekunde zurück">«</button>
          <button class="sim-ib sim-play" id="simPlay" type="button" title="Abspielen / Pause (Leertaste)" aria-label="Abspielen oder Pause">❚❚</button>
          <button class="sim-ib" id="simFwd" type="button" title="1 s vor" aria-label="1 Sekunde vor">»</button>
          <input type="range" id="simSeek" min="0" max="1000" value="0" aria-label="Zeitleiste">
          <span class="sim-time" id="simTime">0,0 s</span>
          <div class="bp-pills sim-speed" id="simSpeed"><button type="button" data-sp="0.25">¼×</button><button type="button" data-sp="0.5">½×</button><button type="button" data-sp="1" class="on">1×</button><button type="button" data-sp="2">2×</button></div>
        </div>
        <div class="sim-extra" id="simExtra" hidden>
          <button class="b-tbtn" id="simReroll" type="button" title="Gleiche Teams, anderer Zufall (Krits, Gleichstände bei der Zielwahl)">Neu würfeln</button>
          <button class="b-tbtn" id="simMany" type="button" title="Den Kampf 100-mal mit unterschiedlichem Zufall rechnen">Siegchance (100 Kämpfe)</button>
        </div>
        <span class="sim-hint" id="simHint"></span>
      </div>
      <div class="sim-body" id="simBody" hidden>
        <div class="sim-arena-wrap"><div class="sim-arena" id="simArena"></div><div class="sim-banner" id="simBanner" hidden></div></div>
        <aside class="sim-side card" id="simSide"></aside>
      </div>
      <div class="sim-lower" id="simLower" hidden>
        <div class="card sim-meter"><div class="sim-boxhead"><h4>Auswertung</h4><div class="bp-pills" id="simMeterTabs"><button type="button" data-mt="d" class="on">Schaden</button><button type="button" data-mt="t">Erlitten</button><button type="button" data-mt="h">Heilung &amp; Schild</button></div></div><div id="simMeter"></div></div>
        <div class="card sim-logbox"><div class="sim-boxhead"><h4>Kampf-Log</h4><label class="b-sw"><input type="checkbox" id="simLogAtk"><span>Angriffe</span><i aria-hidden="true"></i></label></div><ol class="sim-log" id="simLog"></ol></div>
      </div>
      <details class="card sim-rules"><summary>So rechnet der Simulator</summary>
        <ul>
          <li><b>Spielfeld:</b> 7 × 8 Felder, jede Seite 4 Reihen – genau wie im Spiel. Reichweite und Abstände zählen in Feldern.</li>
          <li><b>Zielwahl:</b> der nächste Gegner – zuerst wenigste Schritte bis zu einer Angriffsposition, dann Feld-Abstand, dann echter Abstand, dann das bisherige Ziel. Nach jedem gelaufenen Feld wird neu gewählt, bis das Ziel in Reichweite ist. Stirbt es oder wird es unangreifbar, sucht sich die Unit ein neues.</li>
          <li><b>Laufen:</b> 500 Einheiten pro Sekunde (≈ 0,36 s pro Feld), in der Verlängerung 700. Das nächste Feld wird beim Losgehen belegt, gelaufen wird der kürzeste freie Weg.</li>
          <li><b>Angriffe:</b> Tempo = Angriffe pro Sekunde (max. 5). Krit: 25 % Grundchance, 140 % Schaden. Fähigkeiten kritten nur mit Präzision (z. B. Infinity Edge, Jeweled Gauntlet, Henker).</li>
          <li><b>Mana:</b> 10 pro Angriff; erlittener Schaden gibt 1 % vor + 3 % nach Abzug (max. 42,5). Während einer Fähigkeit und bei Betäubung gibt es kein Mana.</li>
          <li><b>Schaden:</b> Basis × Krit × Schadenssteigerung × 100/(100 + Rüstung bzw. MR) × Durchhaltevermögen. Absoluter Schaden ignoriert Resistenzen. Schilde fangen zuerst ab, Omnivamp heilt nur aus Lebensschaden.</li>
          <li><b>Effekte:</b> Fraktur/Magiefraktur −30 %, Verwundung −33 % Heilung, Verbrennung 1 % max. Leben pro Sekunde. Bei gleichen Effekten zählt der stärkste.</li>
          <li><b>Sterne:</b> Leben ×1,8 und Angriffsschaden ×1,5 pro Stern. Items, Traits und Augments werden mit ihren offiziellen Werten eingerechnet.</li>
          <li><b>Schwarzdorn:</b> Ist der Trait aktiv, wird die Unit auf dem Opferfeld (3. Reihe von vorne, Mitte) vor dem Kampf geopfert. Alle Champions erhalten das Leben der Trait-Stufe, Schwarzdorn-Champions zusätzlich Werte je nach Rolle des Opfers – Tank: Leben, Rüstung, MR · AD: Angriffsschaden, Angriffstempo · AP: Manaregeneration, Schadenssteigerung – mal Faktor nach Kosten und Sternen des Opfers, verstärkt um 30 % bzw. 60 % auf Stufe 4 und 6.</li>
          <li><b>Verlängerung ab 30 s:</b> jede Sekunde Schaden und Angriffstempo ×1,1, Heilung, Schilde und Kontrolle −10 % (bis −70 %), ab 38 s keine Kontrolle mehr. Nach 45 s: Unentschieden.</li>
          <li><b>Geschätzt:</b> Riot liefert für Set ${TFT_DATA.set} die Zahlen der Fähigkeiten nicht in den Spieldaten mit. Was eine Fähigkeit tut (Ziel, Fläche, Sprung, Schild, Heilung, Betäubung, Spott) liest der Simulator aus dem offiziellen Text, die Stärke wird nach Kosten und Sternen geschätzt. Beschwörungen, Verwandlungen und reine Set-Mechaniken (z. B. Kopfgeld, Hexenzirkel, Urjäger-Segen) fehlen oder sind vereinfacht.</li>
        </ul>
      </details>`;
    window.addEventListener('resize', ()=>{ if(simRes && $('#page-builder.active.sim-mode')) simLayout(); });
  }
  simSyncHead();
}
// Teams per Auswahl laden: Comps aus der Tierlist (nach Tier), Team Builder, Zufall, leeren
const simPickList = () => comps.filter(c=>!c.hidden && (c.board||[]).length);
function simCompOptions(){
  const list = simPickList();
  let html = '<option value="">Team laden …</option><option value="@builder">Aus dem Team Builder</option>' + (list.length ? '<option value="@random">Zufällige Comp aus der Tierlist</option>' : '') + '<option value="@clear">Brett leeren</option>';
  [['S','S-Tier'],['A','A-Tier'],['B','B-Tier'],['C','C-Tier'],['X','Situational']].forEach(([t, l])=>{
    const g = list.filter(c=>c.main && c.tier===t);
    if(g.length) html += `<optgroup label="Tierlist · ${l}">${g.map(c=>`<option value="${esc(c.slug)}">${esc(c.name)}</option>`).join('')}</optgroup>`;
  });
  const v = list.filter(c=>!c.main);
  if(v.length) html += `<optgroup label="Tierlist · Varianten">${v.map(c=>`<option value="${esc(c.slug)}">${esc(c.name)}</option>`).join('')}</optgroup>`;
  return html;
}
function simLoadPick(side, val){
  if(!val) return;
  let board = {}, augs = [], label = '';
  if(val==='@clear') label = 'geleert';
  else if(val==='@builder'){
    let st = null; try { st = bDecode(localStorage.getItem(BUILDER_KEY) || ''); } catch(e){}
    if(!st || !Object.keys(st.board).length){ bHint('Im Team Builder ist noch kein Team aufgestellt.'); return; }
    board = st.board; augs = st.augs; label = 'aus dem Team Builder geladen';
  } else {
    const c = val==='@random' ? pickOne(simPickList()) : compBySlug[val]; if(!c) return;
    // Units ohne Sternangabe in der Tierlist: 2 Sterne (typisch fürs Lategame), 3★-Angaben bleiben
    (c.board||[]).forEach(b=>{ if(b.h==null || b.h<0 || b.h>27) return; board[b.h] = {u:b.u, s:b.s||2, i:(b.i||[]).map(id=>(findItem(id)||{}).id).filter(Boolean).slice(0,3)}; });
    // Augments der Tierlist sind nur Vorschläge – nicht automatisch mitnehmen, die wählt man selbst
    label = `„${c.name}“ geladen`;
  }
  if(side==='e'){ eBoard = board; eAugs = augs; } else { bBoard = board; bAugs = augs; }
  simView = 'edit'; simPause();   // neues Team: erst die Aufstellung zeigen
  bSel = null; renderBuilder();
  bHint(`${side==='e' ? 'Gegner' : 'Dein Team'}: ${label}.`);
}
function simSyncHead(){
  const has = !!simRes;
  $('#simCtrl').hidden = !has; $('#simExtra').hidden = !has; $('#simBody').hidden = !has; $('#simLower').hidden = !has;
  $('#simRun').textContent = has ? '⚔ Neu starten' : '⚔ Kampf starten';
  // nur ein Feld sichtbar: Aufstellung oder Kampf
  const fight = has && simView==='fight';
  $('#page-builder').classList.toggle('sim-fight', fight);
  $('#simView').hidden = !has; $('#simView').textContent = fight ? '✎ Aufstellung bearbeiten' : '▶ Zum Kampf';
  if(!fight){ $('#simBody').hidden = true; $('#simLower').hidden = true; $('#simCtrl').hidden = true; $('#simExtra').hidden = true; }
  const n0 = Object.keys(bBoard).length, n1 = Object.keys(eBoard).length;
  const stale = has && simRes.code !== bEncode();
  $('#simHint').textContent = !has ? (n0 && n1 ? `${n0} gegen ${n1} Units – bereit.` : 'Stell unten dein Team und das Gegner-Team auf.') : stale ? 'Teams geändert – „Neu starten“ für den neuen Stand.' : '';
  $('#simHint').classList.toggle('warn', stale);
}
function simOnEdit(){ if($('#simPanel') && $('#simPanel').dataset.built) simSyncHead(); }
function simStart(reroll){
  if(!Object.keys(bBoard).length || !Object.keys(eBoard).length){ simSyncHead(); bHint('Für einen Kampf brauchen beide Seiten mindestens eine Unit.'); return; }
  if(reroll) simSeed = (Math.random() * 1e9) >>> 0;
  simView = 'fight';
  simRes = simRun(simBoards(), simSeed, false);
  simRes.code = bEncode();
  simT = 0; simSel = null; simLastFrame = -1; simMC = null;
  simSyncHead(); simBuildArena(); simPlay(true);
  const top = $('#simPanel').getBoundingClientRect().top + scrollY - 70;
  if(Math.abs(scrollY - top) > 40) scrollTo({top, behavior:'smooth'});
}
function simLayout(){
  const a = $('#simArena'); if(!a) return;
  simW = a.clientWidth / SIM_W;
  a.style.height = (SIM_H * simW) + 'px';
  a.style.setProperty('--w', simW + 'px');
  a.querySelectorAll('.sa-hex').forEach(h=>{ const i = +h.dataset.c, R = Math.floor(i/7), C = i%7; h.style.left = ((C + (R&1)*0.5) * simW) + 'px'; h.style.top = (R * 0.866 * simW) + 'px'; });
  simLastFrame = -1; simDraw();
}
function simBuildArena(){
  const a = $('#simArena');
  let cells = '';
  for(let i=0;i<56;i++) cells += `<div class="sa-hex${i < 28 ? ' e' : ''}" data-c="${i}"></div>`;
  const toks = simRes.units.map(u=>{
    const img = PLANTS[u.n] ? `url('${PLANT_IMG[u.n]}')` : champBg(u.n);
    return `<button type="button" class="su s${u.side} c${u.cost}${u.plant ? ' plant' : ''}" data-su="${u.id}" title="${esc(u.label)}"><span class="su-img" style="background-image:${img}"></span>`
      + `<span class="su-star">${'★'.repeat(u.star)}</span><span class="su-bars"><i class="su-hp"></i><i class="su-sh"></i></span><span class="su-mana"><i></i></span><span class="su-st"></span></button>`;
  }).join('');
  a.innerHTML = `<div class="sa-cells">${cells}</div><svg class="sa-svg" viewBox="0 0 ${SIM_W} ${SIM_H.toFixed(4)}" preserveAspectRatio="none" aria-hidden="true"><defs>
      <marker id="saArr0" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L10 5L0 10z" fill="#5aa9ff"/></marker>
      <marker id="saArr1" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L10 5L0 10z" fill="#ff5a6a"/></marker></defs><g id="saFx"></g></svg>${toks}`;
  simLayout();
}
function simPlay(on){
  simPlaying = on === undefined ? !simPlaying : on;
  if(simPlaying && simT >= simRes.end) simT = 0;
  const b = $('#simPlay'); if(b){ b.textContent = simPlaying ? '❚❚' : '▶'; b.classList.toggle('on', simPlaying); }
  cancelAnimationFrame(simRaf);
  if(simPlaying){ simPrevTs = 0; simRaf = requestAnimationFrame(simLoop); }
}
function simPause(){ if(simPlaying) simPlay(false); }
function simLoop(ts){
  if(!simPlaying) return;
  if(!$('#page-builder').classList.contains('active') || !document.body.contains($('#simArena'))){ simPlay(false); return; }
  if(simPrevTs) simT = Math.min(simRes.end, simT + (ts - simPrevTs)/1000 * simSpeedV);
  simPrevTs = ts;
  simDraw();
  if(simT >= simRes.end){ simPlay(false); return; }
  simRaf = requestAnimationFrame(simLoop);
}
function simSeek(t){ simT = Math.max(0, Math.min(simRes.end, t)); simDraw(); }
const simEvAt = t => { const ev = simRes.ev; let lo = 0, hi = ev.length; while(lo < hi){ const m = (lo + hi) >> 1; if(ev[m].t < t) lo = m + 1; else hi = m; } return lo; };
function simDraw(){
  const r = simRes; if(!r || !r.frames.length) return;
  const fi = Math.min(r.frames.length - 1, simT / SIM_DT), i0 = Math.floor(fi), i1 = Math.min(r.frames.length - 1, i0 + 1), k = fi - i0;
  const F0 = r.frames[i0], F1 = r.frames[i1], W = simW;
  const pos = r.units.map((u, i)=>{ const a = F0[i], b = F1[i]; return {x:a.x + (b.x - a.x)*k, y:a.y + (b.y - a.y)*k}; });
  r.units.forEach((u, i)=>{
    const el = document.querySelector(`.su[data-su="${i}"]`); if(!el) return;
    const f = F0[i], p = pos[i];
    el.style.transform = `translate(${p.x*W}px, ${p.y*W}px)`;
    el.classList.toggle('dead', f.st==='dead'); el.classList.toggle('stun', f.st==='stun'); el.classList.toggle('cast', f.st==='cast');
    el.classList.toggle('jump', f.st==='jump'); el.classList.toggle('untg', !!f.un); el.classList.toggle('sel', simSel===i);
    const tot = Math.max(f.mh, f.hp + f.sh);
    el.querySelector('.su-hp').style.width = (f.hp / tot * 100) + '%';
    const sh = el.querySelector('.su-sh'); sh.style.left = (f.hp / tot * 100) + '%'; sh.style.width = (f.sh / tot * 100) + '%';
    el.querySelector('.su-mana i').style.width = (f.mm > 5 ? Math.min(100, f.m / f.mm * 100) : 0) + '%';
    el.querySelector('.su-st').textContent = f.st==='stun' ? '⚡' : f.st==='cast' ? '✦' : '';
  });
  // Linien, Laufwege, Effekte
  const P = SIM_GRID.P, T = simT; let g = '';
  const hexPts = c => { const p = P[c], w = 0.5, h = 0.577; return [[0,-h],[w,-h/2],[w,h/2],[0,h],[-w,h/2],[-w,-h/2]].map(([x,y])=>`${(p.x+x*0.92).toFixed(3)},${(p.y+y*0.92).toFixed(3)}`).join(' '); };
  r.units.forEach((u, i)=>{
    const f = F0[i]; if(f.st==='dead') return;
    const on = simSel===null || simSel===i || f.tg===simSel;
    if(f.pa && f.pa.length && on){
      const pts = [`${pos[i].x.toFixed(3)},${pos[i].y.toFixed(3)}`, ...f.pa.map(c=>`${P[c].x.toFixed(3)},${P[c].y.toFixed(3)}`)].join(' ');
      g += `<polyline class="sa-path s${u.side}" points="${pts}"/><polygon class="sa-dest s${u.side}" points="${hexPts(f.pa[f.pa.length-1])}"/>`;
    }
    if(f.tg >= 0 && F0[f.tg].st!=='dead' && on){
      const a = pos[i], b = pos[f.tg], dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy) || 1, s = 0.3 / L, e = 1 - 0.36 / L;
      if(L > 0.5) g += `<line class="sa-tl s${u.side}${simSel===i ? ' hi' : ''}" x1="${(a.x + dx*s).toFixed(3)}" y1="${(a.y + dy*s).toFixed(3)}" x2="${(a.x + dx*e).toFixed(3)}" y2="${(a.y + dy*e).toFixed(3)}" marker-end="url(#saArr${u.side})"/>`;
    }
  });
  const ev = r.ev;
  for(let j = simEvAt(T - 0.9); j < ev.length && ev[j].t <= T; j++){
    const e = ev[j], age = T - e.t;
    if(e.k==='atk' && age < 0.22 && e.d >= 0){
      const a = pos[e.s], b = pos[e.d], q = Math.min(1, age / 0.18);
      if(e.r) g += `<circle class="sa-proj s${r.units[e.s].side}" cx="${(a.x + (b.x - a.x)*q).toFixed(3)}" cy="${(a.y + (b.y - a.y)*q).toFixed(3)}" r="0.07"/>`;
      else if(age < 0.15) g += `<circle class="sa-slash" cx="${b.x.toFixed(3)}" cy="${b.y.toFixed(3)}" r="${(0.22 + age).toFixed(3)}"/>`;
    } else if(e.k==='cast' && age < 0.7){
      const u = r.units[e.s], a = pos[e.s], op = (1 - age/0.7).toFixed(2);
      g += `<circle class="sa-cast s${u.side}" cx="${a.x.toFixed(3)}" cy="${a.y.toFixed(3)}" r="${(0.35 + age*0.9).toFixed(3)}" style="opacity:${op}"/>`;
      if(e.r && e.c != null) g += `<circle class="sa-aoe s${u.side}" cx="${P[e.c].x.toFixed(3)}" cy="${P[e.c].y.toFixed(3)}" r="${(e.r*0.9 + 0.45).toFixed(3)}" style="opacity:${op}"/>`;
      (e.hits || []).forEach(h=>{ g += `<circle class="sa-hit" cx="${pos[h].x.toFixed(3)}" cy="${pos[h].y.toFixed(3)}" r="${(0.25 + age*0.4).toFixed(3)}" style="opacity:${op}"/>`; });
      if(e.v && e.d >= 0) g += `<text class="sa-num s${u.side}" x="${pos[e.d].x.toFixed(3)}" y="${(pos[e.d].y - 0.45 - age*0.6).toFixed(3)}" style="opacity:${op}">${e.v}</text>`;
    } else if(e.k==='jump' && age < 0.8){
      const a = P[e.from], b = P[e.to], mx = (a.x + b.x)/2, my = Math.min(a.y, b.y) - 0.9;
      g += `<path class="sa-jump s${r.units[e.s].side}" d="M${a.x.toFixed(3)} ${a.y.toFixed(3)} Q${mx.toFixed(3)} ${my.toFixed(3)} ${b.x.toFixed(3)} ${b.y.toFixed(3)}" style="opacity:${(1 - age/0.8).toFixed(2)}"/>`;
    } else if(e.k==='death' && age < 0.9){
      const a = pos[e.s]; g += `<text class="sa-dead" x="${a.x.toFixed(3)}" y="${(a.y + 0.12).toFixed(3)}" style="opacity:${(1 - age/0.9).toFixed(2)}">✕</text>`;
    }
  }
  $('#saFx').innerHTML = g;
  $('#simTime').textContent = `${simFmt(T)} s / ${simFmt(r.end)} s`;
  const sk = $('#simSeek'); if(document.activeElement !== sk) sk.value = Math.round(T / r.end * 1000);
  const ban = $('#simBanner');
  if(T >= r.end - 1e-6){ ban.hidden = false; ban.className = 'sim-banner w' + r.winner; ban.textContent = r.winner===0 ? 'Sieg' : r.winner===1 ? 'Niederlage' : 'Unentschieden'; }
  else if(T >= SIM_OT){ ban.hidden = false; ban.className = 'sim-banner ot'; ban.textContent = 'Verlängerung'; }
  else ban.hidden = true;
  if(i0 !== simLastFrame){ simLastFrame = i0; simSide(i0); simMeter(i0); simLog(); }
}
const simNameHTML = id => { const u = simRes.units[id]; return u ? `<b class="sn s${u.side}" data-su="${id}">${esc(u.label)}</b>` : '?'; };
const simTxt = s => String(s).replace(/\u0001(\d+)\u0002/g, (m, id)=>simNameHTML(+id));
const SIM_ST = {move:'läuft', atk:'greift an', cast:'wirkt Fähigkeit', stun:'betäubt', jump:'springt', idle:'wartet', dead:'besiegt'};
function simLastStats(i, fi){ for(let j = fi; j >= 0; j--){ const s = simRes.frames[j][i].s; if(s) return s; } return null; }
function simAbilityText(u){
  const sp = u.spec; if(u.plant) return L('Pflanze: steht im Weg und fängt Angriffe ab, greift selbst nicht an.', 'Plant: blocks the way and absorbs attacks, doesn\'t attack itself.');
  const bits = [];
  if(sp.counter) bits.push(L(`jeder ${sp.counter}. Angriff ist verstärkt`, `every ${sp.counter}rd attack is empowered`));
  else if(sp.noCast) bits.push(L('nur passiv (kein Mana)', 'passive only (no mana)'));
  if(sp.dash) bits.push((EN ? {lowest:'jumps to the enemy with the lowest health', farthest:'jumps to the farthest enemy', cluster:'jumps into the largest group', away:'teleports away from the target', target:'jumps/dashes to the target'} : {lowest:'springt zum Gegner mit dem wenigsten Leben', farthest:'springt zum entferntesten Gegner', cluster:'springt in die größte Gruppe', away:'teleportiert sich vom Ziel weg', target:'springt/stürmt zum Ziel'})[sp.dash]);
  else if(sp.tgt==='cluster') bits.push(L('zielt auf die größte Gruppe', 'targets the largest group'));
  else if(sp.tgt==='lowest') bits.push(L('zielt auf den Gegner mit dem wenigsten Leben', 'targets the enemy with the lowest health'));
  else if(sp.tgt==='farthest') bits.push(L('zielt auf den entferntesten Gegner', 'targets the farthest enemy'));
  else if(sp.tgt==='near') bits.push(L(`trifft die ${sp.n} nächsten Gegner`, `hits the ${sp.n} nearest enemies`));
  if(sp.line) bits.push(L('trifft in einer Linie', 'hits in a line')); else if(sp.r) bits.push(EN ? `area ${sp.r} ${sp.r===1 ? 'hex' : 'hexes'}` : `Fläche ${sp.r} ${sp.r===1 ? 'Feld' : 'Felder'}`);
  if(sp.bounce) bits.push(L('springt auf weitere Gegner über', 'bounces to more enemies'));
  if(sp.dmg && !sp.noCast) bits.push(EN ? `${sp.dot ? 'damage over time' : 'damage'}: ${sp.dt==='magic' ? 'magic' : sp.dt==='true' ? 'true' : 'physical'}` : `${sp.dot ? 'Schaden über Zeit' : 'Schaden'}: ${sp.dt==='magic' ? 'magisch' : sp.dt==='true' ? 'absolut' : 'normal'}`);
  if(sp.emp) bits.push(L(`verstärkt die nächsten ${sp.emp} Angriffe`, `empowers the next ${sp.emp} attacks`));
  if(sp.self.shield) bits.push(L('Schild', 'shield')); if(sp.self.heal) bits.push(L('Heilung', 'healing'));
  if(sp.ally.shield) bits.push(L('Schild für Verbündete', 'shield for allies')); if(sp.ally.heal) bits.push(L('heilt Verbündete', 'heals allies'));
  if(sp.stun) bits.push(L('Betäubung', 'stun')); if(sp.taunt) bits.push(L('Spott', 'taunt')); if(sp.as) bits.push(L('+Angriffstempo', '+attack speed'));
  if(sp.shred) bits.push(L('Magiefraktur', 'shred')); if(sp.sunder) bits.push(L('Fraktur', 'sunder')); if(sp.burn) bits.push(L('Verbrennung', 'burn')); if(sp.wound) bits.push(L('Verwundung', 'wound'));
  return bits.join(' · ');
}
function simSide(fi){
  const r = simRes, box = $('#simSide'), F = r.frames[fi];
  if(simSel !== null){
    const u = r.units[simSel], f = F[simSel], s = simLastStats(simSel, fi) || [];
    const tg = f.tg >= 0 ? simNameHTML(f.tg) : null;
    let act;
    if(f.st==='dead') act = `Besiegt nach ${simFmt(u.deathT)} s.`;
    else if(f.st==='move') act = `Läuft Richtung ${tg || 'Gegner'} – noch ${f.pa ? f.pa.length : 1} ${f.pa && f.pa.length===1 ? 'Feld' : 'Felder'} bis in Reichweite.`;
    else if(f.st==='atk' && tg) act = `Greift ${tg} an (Abstand ${SIM_GRID.D[f.c][F[f.tg].c]}, Reichweite ${u.range}).`;
    else if(f.st==='cast') act = `Wirkt ${esc(u.spec.name || 'seine Fähigkeit')}${tg ? ' auf ' + tg : ''}.`;
    else if(f.st==='jump') act = `Springt${tg ? ' zu ' + tg : ''}.`;
    else if(f.st==='stun') act = 'Ist betäubt und kann nichts tun.';
    else act = u.plant ? 'Steht auf dem Feld.' : 'Wartet – gerade ist kein Weg frei.';
    let next = '';
    if(f.st!=='dead' && !u.plant){
      if(u.spec.counter) next = `Verstärkter Angriff bei jedem ${u.spec.counter}. Angriff.`;
      else if(f.mm > 5) next = f.m >= f.mm ? 'Mana voll – Fähigkeit kommt beim nächsten Schritt.' : `Fähigkeit bei vollem Mana: ${Math.floor(f.m)} / ${f.mm} (noch ≈ ${Math.ceil((f.mm - f.m)/10)} Angriffe).`;
    }
    const its = u.items.map(it=>`<img src="${it.img}" alt="" title="${esc(it.en)}">`).join('');
    box.innerHTML = `<div class="ss-head">${PLANTS[u.n] ? `<div class="av av-46 c1"><img src="${PLANT_IMG[u.n]}" alt=""></div>` : avatar(u.n, 46)}<div><b class="sn s${u.side}">${esc(u.label)}</b> <span class="ss-star">${'★'.repeat(u.star)}</span><small>${u.side ? 'Gegner' : 'Dein Team'} · ${SIM_ST[f.st] || ''}</small></div><button class="ss-x" type="button" data-sim-desel aria-label="Auswahl aufheben">✕</button></div>
      <div class="ss-bar"><i style="width:${(f.hp / Math.max(f.mh, f.hp + f.sh) * 100).toFixed(1)}%"></i><em style="left:${(f.hp / Math.max(f.mh, f.hp + f.sh) * 100).toFixed(1)}%;width:${(f.sh / Math.max(f.mh, f.hp + f.sh) * 100).toFixed(1)}%"></em><span>${Math.round(f.hp)} / ${Math.round(f.mh)}${f.sh ? ` +${Math.round(f.sh)}` : ''}</span></div>
      ${f.mm > 5 ? `<div class="ss-bar mana"><i style="width:${Math.min(100, f.m / f.mm * 100).toFixed(1)}%"></i><span>${Math.floor(f.m)} / ${f.mm} Mana</span></div>` : ''}
      <p class="ss-act"><b>Jetzt:</b> ${act}</p>${next ? `<p class="ss-next">${next}</p>` : ''}
      ${u.plant ? '' : `<div class="ss-stats"><span><small>AD</small>${Math.round(s[0]||0)}</span><span><small>AP</small>${Math.round(s[1]||0)}</span><span><small>Tempo</small>${simFmt(s[2]||0)}</span><span><small>Rüstung</small>${Math.round(s[3]||0)}</span><span><small>MR</small>${Math.round(s[4]||0)}</span><span><small>Krit</small>${Math.round((s[5]||0)*100)} %</span><span><small>Reichweite</small>${u.range}</span></div>`}
      ${its ? `<div class="ss-items">${its}</div>` : ''}
      <p class="ss-ab"><b>${esc(u.spec.name || 'Fähigkeit')}</b> ${simAbilityText(u)}${u.spec.val ? '' : ' <span class="ss-est" title="Riot liefert die Fähigkeitswerte für dieses Set nicht mit – die Stärke ist nach Kosten und Sternen geschätzt">Werte geschätzt</span>'}</p>
      <p class="ss-sum">Bisher: <b>${Math.round(f.dp + f.dm + f.dt)}</b> Schaden · <b>${Math.round(f.tk)}</b> erlitten · <b>${Math.round(f.hl)}</b> Heilung/Schild</p>`;
    return;
  }
  const alive = s => F.filter((f, i)=>f.st!=='dead' && r.units[i].side===s && !r.units[i].plant).length;
  const done = simT >= r.end - 1e-6;
  const res = done ? `<div class="ss-res w${r.winner}">${r.winner===0 ? 'Sieg' : r.winner===1 ? 'Niederlage' : 'Unentschieden'} <small>nach ${simFmt(r.end)} s</small></div>` : '';
  const mc = simMC ? (simMC.n < 100 ? `<p class="note">Rechne … ${simMC.n} / 100</p>` : `<div class="ss-mc"><div class="ss-mcbar"><i class="w0" style="width:${simMC.w0}%"></i><i class="wd" style="width:${simMC.wd}%"></i><i class="w1" style="width:${simMC.w1}%"></i></div><p><b class="s0">${simMC.w0} % Sieg</b> · ${simMC.wd} % Unentschieden · <b class="s1">${simMC.w1} % Niederlage</b><br><small>Ø ${simFmt(simMC.dur)} s · Ø ${simFmt(simMC.left)} Units übrig beim Sieger</small></p></div>`) : '';
  const status = side => { const inf = r.info[side]; const ch = (t, res)=>`<span class="ss-chip ${res}" title="${res==='ja' ? 'wird simuliert' : res==='teil' ? 'vereinfacht simuliert' : 'wirkt nicht im Kampf / nicht simuliert'}">${esc(t)}</span>`;
    const bt = inf.traits.find(t=>t.n==='Blackthorn');
    const sac = inf.sac ? `<p class="ss-sac"><b>${L('Schwarzdorn-Opfer:', 'Blackthorn sacrifice:')}</b> ${esc(inf.sac.u)} <span class="ss-star">${'★'.repeat(inf.sac.s)}</span> (${SIM_ROLE_DE[inf.sac.role]}) – ${L(`alle Champions +${inf.sac.hp} Leben; Schwarzdorn-Champions`, `all champions +${inf.sac.hp} health; Blackthorn champions`)} ${inf.sac.bits.join(', ')}.</p>`
      : bt && simBlackthorn() ? '<p class="ss-sac off">Schwarzdorn ist aktiv, aber auf dem Opferfeld (3. Reihe, Mitte) steht kein Champion – kein Bonus.</p>' : '';
    return (inf.traits.length ? inf.traits.map(t=>ch(`${t.n} ${t.k}`, t.res)).join('') : '<small>keine aktiven Traits</small>') + (inf.augs.length ? '<br>' + inf.augs.map(a=>ch(a.n, a.res)).join('') : '') + sac; };
  box.innerHTML = `${res}<div class="ss-count"><span class="s0">Du: <b>${alive(0)}</b> Units</span><span class="s1">Gegner: <b>${alive(1)}</b> Units</span></div>${mc}
    <p class="ss-tip">Tipp: Klick eine Unit an – dann siehst du ihr Ziel, ihren Laufweg, ihre Werte und was sie als Nächstes tut.</p>
    <h5>Dein Team</h5><div class="ss-chips">${status(0)}</div><h5>Gegner</h5><div class="ss-chips">${status(1)}</div>
    <p class="ss-legend"><span class="ss-chip ja">simuliert</span><span class="ss-chip teil">vereinfacht</span><span class="ss-chip nein">nicht im Kampf</span></p>`;
}
function simMeter(fi){
  const r = simRes, F = r.frames[fi];
  const val = (f)=>simMeterTab==='d' ? f.dp + f.dm + f.dt : simMeterTab==='t' ? f.tk : f.hl;
  const rows = r.units.map((u, i)=>({u, f:F[i], v:val(F[i])})).filter(x=>!x.u.plant || simMeterTab==='t');
  const max = Math.max(1, ...rows.map(x=>x.v));
  const col = side => rows.filter(x=>x.u.side===side).sort((a,b)=>b.v - a.v).map(x=>{
    const f = x.f, w = x.v / max * 100;
    const bar = simMeterTab==='d' && x.v ? `<i class="ph" style="width:${f.dp/max*100}%"></i><i class="mg" style="width:${f.dm/max*100}%"></i><i class="tr" style="width:${f.dt/max*100}%"></i>` : `<i class="${simMeterTab==='t' ? 'tk' : 'hl'}" style="width:${w}%"></i>`;
    return `<button type="button" class="sm-row${f.st==='dead' ? ' dead' : ''}${simSel===x.u.id ? ' sel' : ''}" data-su="${x.u.id}">${PLANTS[x.u.n] ? `<div class="av av-26 c1"><img src="${PLANT_IMG[x.u.n]}" alt=""></div>` : avatar(x.u.n, 26)}<span class="sm-n">${esc(x.u.label)} <small>${'★'.repeat(x.u.star)}</small></span><span class="sm-bar">${bar}</span><b>${Math.round(x.v)}</b></button>`;
  }).join('');
  $('#simMeter').innerHTML = `<div class="sm-cols"><div><h5 class="s0">Dein Team</h5>${col(0)}</div><div><h5 class="s1">Gegner</h5>${col(1)}</div></div>`
    + (simMeterTab==='d' ? '<p class="sm-legend"><i class="ph"></i>normal <i class="mg"></i>magisch <i class="tr"></i>absolut</p>' : '');
}
function simLog(){
  const r = simRes, T = simT;
  const list = [];
  for(let j = 0; j < r.ev.length && r.ev[j].t <= T + 1e-9; j++){ const e = r.ev[j]; if(e.k==='atk' ? simLogAtk : e.txt) list.push(e); }
  const shown = list.slice(-120);
  const el = $('#simLog');
  const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 30;
  el.innerHTML = shown.map(e=>{
    const side = e.side != null ? e.side : e.s >= 0 && r.units[e.s] ? r.units[e.s].side : -1;
    const txt = e.k==='atk' ? `${simNameHTML(e.s)} greift ${simNameHTML(e.d)} an` : simTxt(e.txt);
    return `<li class="lg-${e.k} lg-s${side}"><time>${simFmt(e.t)} s</time><span>${txt}</span></li>`;
  }).join('');
  if(atBottom) el.scrollTop = el.scrollHeight;
}
function simMany(){
  const boards = simBoards(), base = (Math.random() * 1e9) >>> 0;
  simMC = {n:0, w:[0,0,0], dur:0, left:0};
  const btn = $('#simMany'); btn.disabled = true;
  const step = ()=>{
    for(let i = 0; i < 10 && simMC.n < 100; i++, simMC.n++){
      const S = simRun(boards, base + simMC.n * 7919, true);
      simMC.w[S.winner===0 ? 0 : S.winner===1 ? 2 : 1]++; simMC.dur += S.end;
      simMC.left += S.units.filter(u=>u.alive && !u.plant).length;
    }
    if(simMC.n < 100){ simLastFrame = -1; simDraw(); setTimeout(step, 0); return; }
    simMC.w0 = simMC.w[0]; simMC.wd = simMC.w[1]; simMC.w1 = simMC.w[2]; simMC.dur /= 100; simMC.left /= 100;
    btn.disabled = false; simLastFrame = -1; simDraw();
  };
  setTimeout(step, 0);
}
document.addEventListener('click', e=>{
  if(!e.target.closest || !e.target.closest('#simPanel')) return;
  const t = e.target, id = (t.closest('button') || {}).id;
  if(id==='simRun'){ simStart(false); return; }
  if(id==='simView'){ simView = simView==='fight' ? 'edit' : 'fight'; if(simView==='edit') simPause(); simSyncHead(); if(simView==='fight'){ simLayout(); } scrollTo({top:$('#simPanel').getBoundingClientRect().top + scrollY - 70, behavior:'smooth'}); return; }
  if(!simRes) return;
  if(id==='simPlay'){ simPlay(); return; }
  if(id==='simBack'){ simPause(); simSeek(simT - 1); return; }
  if(id==='simFwd'){ simPause(); simSeek(simT + 1); return; }
  if(id==='simReroll'){ simStart(true); return; }
  if(id==='simMany'){ simMany(); return; }
  const sp = t.closest('[data-sp]'); if(sp){ simSpeedV = +sp.dataset.sp; document.querySelectorAll('#simSpeed [data-sp]').forEach(b=>b.classList.toggle('on', b===sp)); return; }
  const mt = t.closest('[data-mt]'); if(mt){ simMeterTab = mt.dataset.mt; document.querySelectorAll('#simMeterTabs [data-mt]').forEach(b=>b.classList.toggle('on', b===mt)); simLastFrame = -1; simDraw(); return; }
  if(t.closest('[data-sim-desel]')){ simSel = null; simLastFrame = -1; simDraw(); return; }
  const su = t.closest('[data-su]');
  if(su){ const i = +su.dataset.su; simSel = simSel===i && su.classList.contains('su') ? null : i; simLastFrame = -1; simDraw(); return; }
  if(t.closest('#simArena')){ simSel = null; simLastFrame = -1; simDraw(); }
});
document.addEventListener('input', e=>{
  if(e.target.id==='simSeek' && simRes){ simPause(); simSeek(+e.target.value / 1000 * simRes.end); }
});
document.addEventListener('change', e=>{
  if(e.target.id==='simPickM' || e.target.id==='simPickE'){ const v = e.target.value; simLoadPick(e.target.id==='simPickE' ? 'e' : 'm', v); if(v.startsWith('@')) e.target.value = ''; return; }
  if(e.target.id==='simLogAtk'){ simLogAtk = e.target.checked; simLastFrame = -1; if(simRes) simDraw(); } });
document.addEventListener('keydown', e=>{
  if(!simRes || e.key !== ' ' || bMode !== 'sim' || !$('#page-builder').classList.contains('active')) return;
  if(/INPUT|TEXTAREA|SELECT|BUTTON/.test(document.activeElement.tagName) && document.activeElement.id !== 'simPlay') return;
  e.preventDefault(); simPlay();
});
