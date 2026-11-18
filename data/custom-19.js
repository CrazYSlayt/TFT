// TFTClimb – eigene Ergänzungen zu Set 19 (von Hand gepflegt, das Update-Skript überschreibt diese Datei NICHT)
// Angelegt am 16.11.2026 vor dem PBE (17.11.) aus custom-18.js und dem Dev Drop (data/news.js, Beitrag prismatic-tour-dev-drop).
// AM PBE PRÜFEN: Trait-Namen gegen Riots Daten (z. B. „K/DA“, „R&B“, „8-Bit“), Shop-Odds/Pool, Loot, Karussell, Augment-Stufen –
// alles mit „Stand Set 18“ ist nur übernommen, bis es neue Zahlen gibt. Noch offen: encounters,
// augmentIcons, augTables/traitTables, goldSub/rerollSub/solo (hängen an Set-18-Encountern und -Champions und fehlen darum bewusst).
window.TFT_CUSTOM = {
  set: 19,
  // Einteilung der Traits (origin = Ursprung, class = Klasse). group: band = Band/Genre, solo = Solo-Trait mit einem Champion (unit).
  // Texte (d) bewusst leer: die Seite nimmt dann Riots deutsche Beschreibung – eigene Kurztexte erst, wenn die Werte feststehen
  traits: {
  'Ionic Spark':{cat:'origin', group:'band'},
  'K/DA':{cat:'origin', group:'band'},
  'True Damage':{cat:'origin', group:'band'},
  'Heartsteel':{cat:'origin', group:'band'},
  'Pentakill':{cat:'origin', group:'band'},
  'Beach Pop':{cat:'origin', group:'band'},
  'Classical':{cat:'origin', group:'band'},
  'Rock':{cat:'origin', group:'band'},
  'Hyperpop':{cat:'origin', group:'band'},
  'Gu Feng':{cat:'origin', group:'band'},
  'Illbeats':{cat:'origin', group:'band'},
  'Jazz':{cat:'origin', group:'band'},
  'R&B':{cat:'origin', group:'band'},
  'EDM':{cat:'origin', group:'band'},
  'Arcanist':{cat:'class'},
  'Bodyguard':{cat:'class'},
  'Choreographer':{cat:'class'},
  'Collab':{cat:'class'},
  'Encore':{cat:'class'},
  'Frontman':{cat:'class'},
  'Hitmaker':{cat:'class'},
  'Juggernaut':{cat:'class'},
  'Manager':{cat:'class'},
  'Prodigy':{cat:'class'},
  'Renegade':{cat:'class'},
  'Slayer':{cat:'class'},
  'Swiftstriker':{cat:'class'},
  'Trickshot':{cat:'class'},
  '8-Bit':{cat:'origin', group:'solo', unit:'Miss Fortune'},
  'Beat Master':{cat:'origin', group:'solo', unit:'Rell'},
  'Boy Band':{cat:'origin', group:'solo', unit:'Rakan'},
  'Composer':{cat:'origin', group:'solo', unit:'Malzahar'},
  'Country':{cat:'origin', group:'solo', unit:'Alistar'},
  'Disco':{cat:'origin', group:'solo', unit:'Nunu & Willump'},
  'Emo':{cat:'origin', group:'solo', unit:'Amumu'},
  'Freestyle':{cat:'origin', group:'solo', unit:'Akali'},
  'Goth':{cat:'origin', group:'solo', unit:'Zeri'},
  'Hype Man':{cat:'origin', group:'solo', unit:'Teemo'},
  'Indie':{cat:'origin', group:'solo', unit:'Seraphine'},
  'Mariachi':{cat:'origin', group:'solo', unit:'Nidalee'},
  'Melodic Heart':{cat:'origin', group:'solo', unit:'Gwen'},
  'One Monster Band':{cat:'origin', group:'solo', unit:'Baron Nashor'},
  'Producer':{cat:'origin', group:'solo', unit:'Sona'},
  'Record Mogul':{cat:'origin', group:'solo', unit:'Dr. Mundo'},
  'Synthwave':{cat:'origin', group:'solo', unit:'Garen'},
  'Tango':{cat:'origin', group:'solo', unit:'Twisted Fate'},
  'Windblessed':{cat:'origin', group:'solo', unit:'Janna'},
  },
  // Freischaltbare Champions (🔒 im Dev Drop, Quelle Mobalytics-Liste vom 14.11.2026) und die 7-Kosten-Champions (nur über Unlocks, nie im Shop).
  // Wird von der Seite noch nicht genutzt – Grundlage für Champion-Seite/Builder, sobald die PBE-Daten da sind
  unlocks: ['Baron Nashor', 'Rakan', 'Smeech', 'Sona', 'Akali', 'Aphelios', 'Janna', 'Lee Sin', 'Mordekaiser', 'Pyke', 'Taliyah', 'Teemo', 'Vladimir', 'Alistar', 'Alune', 'Jinx', 'Kayle', 'Thresh', 'Vayne', 'Wukong', 'Yasuo', 'Zac', 'Evelynn', 'Galio', 'Syndra', 'Tibbers', 'Ashe', 'Lulu', 'Nasus', 'Renata Glasc', 'Samira', 'Seraphine', 'Tristana', 'Kobuko'],
  sevenCost: ['Baron Nashor', 'Rakan', 'Smeech', 'Sona'],
  // Shop für den Rolldown-Rechner – Stand Set 18 (Patch 18.4), am PBE prüfen. Level 11 gibt es in Set 19 über Gu Feng
  // Rolle jedes Champions (tank / ad / ap) – für das Schwarzdorn-Opfer und die Rollen-Anzeige. Abgeleitet aus Riots Rollen im Client (data/rollen-19.js)
  // mit derselben Regel wie Set 18: Tank und Magic Fighter = tank, Attack/Hybrid = ad, Magic = ap.
  roles: {
    'Elise':'tank', 'Gnar':'ad', 'Katarina':'tank', 'Kayn':'ad', 'Kennen':'tank', 'Kobuko':'tank', 'Lillia':'tank', 'Neeko':'ap', 'Olaf':'tank', 'Sett':'tank', 'Taric':'tank', 'Varus':'ad',
    'Yunara':'ad', 'Ziggs':'ap', 'Zoe':'ap', 'Annie':'tank', 'Ashe':'ad', 'Camille':'ad', 'Ezreal':'ad', 'Gragas':'tank', 'Illaoi':'tank', 'Jax':'tank', 'Karthus':'ap', 'Lucian':'ad',
    'Lulu':'ap', 'Lux':'ap', 'Nasus':'tank', 'Qiyana':'ad', 'Renata Glasc':'ap', 'Renekton':'tank', 'Samira':'ad', 'Seraphine':'ap', 'Tristana':'ad', 'Amumu':'tank', 'Bard':'ap', 'Braum':'tank',
    'Briar':'ad', 'Draven':'ad', 'Ekko':'tank', 'Evelynn':'tank', 'Galio':'tank', "K'Sante":'tank', "Kai'Sa":'ad', 'Malzahar':'ap', 'Senna':'ad', 'Swain':'tank', 'Syndra':'ap', 'Tibbers':'tank',
    'Viego':'ad', 'Ahri':'ap', 'Alistar':'tank', 'Alune':'ap', 'Aurora':'ap', 'Garen':'tank', 'Graves':'ad', 'Jhin':'ad', 'Jinx':'ad', 'Kayle':'ap', 'Leona':'tank', 'Locke':'ap',
    'Mel':'ap', 'Shyvana':'tank', 'Thresh':'tank', 'Vayne':'ad', 'Wukong':'tank', 'Xayah':'ad', 'Yasuo':'ad', 'Yone':'ad', 'Yorick':'tank', 'Yuumi':'ap', 'Zac':'tank', 'Akali (K/DA)':'ad',
    'Akali (True Damage)':'tank', 'Aphelios':'ad', 'Dr. Mundo':'tank', 'Gwen':'tank', 'Janna':'ap', 'Lee Sin':'ad', 'Miss Fortune':'ad', 'Mordekaiser':'tank', 'Nidalee':'tank', 'Nunu & Willump':'ap', 'Pyke':'ad', 'Rell':'tank',
    'Taliyah':'ap', 'Teemo':'ap', 'Twisted Fate':'ap', 'Vi':'ad', 'Vladimir':'tank', 'Zeri':'ad', 'Baron Nashor':'ad', 'Rakan':'ap', 'Smeech':'ad', 'Sona':'ap'
  },
  // Kampf-Rolle jedes Champions: bestimmt Mana und Zielwahl im Kampf-Simulator (Regeln wie Set 18, siehe custom-18.js).
  // Quelle: Riots Rolle im Client (data/rollen-19.js) – z. B. MagicCaster = caster, AttackTank_Manaless = tank.
  combatRoles: {
    'Elise':'tank', 'Gnar':'specialist', 'Katarina':'fighter', 'Kayn':'fighter', 'Kennen':'tank', 'Kobuko':'tank', 'Lillia':'tank', 'Neeko':'caster', 'Olaf':'tank', 'Sett':'tank', 'Taric':'tank', 'Varus':'caster',
    'Yunara':'marksman', 'Ziggs':'marksman', 'Zoe':'caster', 'Annie':'tank', 'Ashe':'marksman', 'Camille':'fighter', 'Ezreal':'caster', 'Gragas':'tank', 'Illaoi':'tank', 'Jax':'fighter', 'Karthus':'caster', 'Lucian':'caster',
    'Lulu':'caster', 'Lux':'caster', 'Nasus':'tank', 'Qiyana':'fighter', 'Renata Glasc':'caster', 'Renekton':'tank', 'Samira':'caster', 'Seraphine':'caster', 'Tristana':'caster', 'Amumu':'tank', 'Bard':'marksman', 'Braum':'tank',
    'Briar':'assassin', 'Draven':'caster', 'Ekko':'tank', 'Evelynn':'fighter', 'Galio':'tank', "K'Sante":'tank', "Kai'Sa":'marksman', 'Malzahar':'caster', 'Senna':'caster', 'Swain':'tank', 'Syndra':'caster', 'Tibbers':'tank',
    'Viego':'fighter', 'Ahri':'caster', 'Alistar':'tank', 'Alune':'caster', 'Aurora':'caster', 'Garen':'tank', 'Graves':'fighter', 'Jhin':'specialist', 'Jinx':'marksman', 'Kayle':'marksman', 'Leona':'tank', 'Locke':'assassin',
    'Mel':'caster', 'Shyvana':'tank', 'Thresh':'tank', 'Vayne':'marksman', 'Wukong':'tank', 'Xayah':'caster', 'Yasuo':'fighter', 'Yone':'fighter', 'Yorick':'tank', 'Yuumi':'caster', 'Zac':'tank', 'Akali (K/DA)':'assassin',
    'Akali (True Damage)':'fighter', 'Aphelios':'marksman', 'Dr. Mundo':'tank', 'Gwen':'fighter', 'Janna':'caster', 'Lee Sin':'fighter', 'Miss Fortune':'caster', 'Mordekaiser':'fighter', 'Nidalee':'fighter', 'Nunu & Willump':'specialist', 'Pyke':'fighter', 'Rell':'tank',
    'Taliyah':'caster', 'Teemo':'caster', 'Twisted Fate':'marksman', 'Vi':'fighter', 'Vladimir':'fighter', 'Zeri':'caster', 'Baron Nashor':'fighter', 'Rakan':'assassin', 'Smeech':'specialist', 'Sona':'specialist'
  },
  shop: {bag:[30, 25, 18, 10, 9], odds:[[100, 0, 0, 0, 0], [100, 0, 0, 0, 0], [75, 25, 0, 0, 0], [55, 30, 15, 0, 0], [45, 33, 20, 2, 0], [30, 40, 25, 5, 0], [16, 30, 43, 10, 1], [15, 20, 32, 30, 3], [10, 17, 25, 33, 15], [5, 10, 20, 40, 25], [1, 2, 12, 50, 35]], xp:[2, 2, 6, 10, 20, 36, 56, 68, 68]},
  // Beute aus den Creep-Runden – Stand Set 18 (Little Buddy Bot, Patch 18.5), am PBE prüfen
  loot: {source:'tftflow.com (Set 18)', lbb:{src:'Little Buddy Bot · Patch 18.5', stages:{'1':[[3, 3, 0, 0, 0, 35], [3, 0, 1, 0, 0, 35], [2, 3, 1, 0, 0, 8], [2, 0, 2, 0, 0, 8], [5, 3, 0, 0, 0, 3], [5, 0, 1, 0, 0, 3], [4, 0, 1, 0, 0, 3], [3, 0, 2, 0, 0, 2], [1, 3, 2, 0, 0, 2], [3, 5, 0, 0, 0, 1]], '2':[[3, 1, 0, 0, 0, 20], [2, 1, 0, 0, 0, 17], [2, 0, 1, 0, 0, 17], [3, 0, 1, 0, 0, 15], [2, 2, 0, 0, 0, 13], [3, 3, 0, 0, 0, 5], [2, 1, 0, 1, 0, 4], [2, 1, 1, 0, 0, 4], [2, 0, 2, 0, 0, 4], [2, 0, 1, 1, 0, 1]], '3':[[4, 1, 0, 0, 0, 20], [4, 2, 0, 0, 0, 20], [3, 1, 1, 0, 0, 17], [3, 3, 0, 0, 0, 13], [3, 0, 2, 0, 0, 13], [4, 0, 1, 0, 0, 5], [5, 1, 0, 0, 0, 4], [3, 1, 0, 1, 0, 3], [3, 1, 0, 0, 1, 2], [2, 0, 2, 0, 0, 2], [3, 0, 1, 1, 0, 1], [4, 1, 0, 1, 0, 0.25]], '4':[[3, 2, 0, 0, 0, 18], [3, 1, 1, 0, 0, 18], [2, 2, 1, 0, 0, 18], [4, 1, 0, 0, 0, 15], [3, 3, 0, 0, 0, 13], [5, 1, 0, 0, 0, 5], [4, 1, 1, 0, 0, 4], [3, 1, 0, 1, 0, 4], [2, 0, 2, 0, 0, 3], [2, 2, 0, 0, 1, 2], [3, 0, 2, 1, 0, 1], [2, 0, 0, 1, 1, 0.03]]}}, stages:{'1':[[3, 0, 0, 0, 3, 0, 0, 31], [0, 1, 0, 0, 3, 0, 0, 31], [3, 1, 0, 0, 2, 0, 0, 10.6], [0, 2, 0, 0, 2, 0, 0, 10.6], [3, 2, 0, 0, 1, 0, 0, 5.3], [3, 0, 0, 0, 5, 0, 1, 2.8], [0, 1, 0, 0, 5, 0, 1, 2.8], [0, 1, 0, 0, 4, 0, 1, 2.3], [0, 2, 0, 0, 3, 0, 1, 2.3], [5, 0, 0, 0, 3, 0, 1, 1.1]], '2':[[0, 1, 0, 0, 2, 0, 0, 17.7], [1, 0, 0, 0, 2, 0, 0, 17.7], [1, 0, 0, 0, 3, 0, 0, 17.7], [2, 0, 0, 0, 2, 0, 0, 13.3], [0, 1, 0, 0, 3, 0, 0, 13.3], [3, 0, 0, 0, 3, 0, 1, 5], [1, 0, 1, 0, 2, 0, 1, 5], [1, 1, 0, 0, 2, 0, 0, 4.4], [0, 2, 0, 0, 2, 0, 0, 4.4], [0, 1, 1, 0, 2, 0, 1, 1.4]], '3':[[1, 0, 0, 0, 4, 0, 0, 17.7], [1, 1, 0, 0, 3, 0, 0, 17.7], [2, 0, 0, 0, 4, 0, 0, 17.7], [3, 0, 0, 0, 3, 0, 0, 13.3], [0, 2, 0, 0, 3, 0, 0, 13.3], [0, 2, 0, 0, 2, 0, 0, 4.4], [0, 1, 0, 0, 4, 0, 0, 4.4], [1, 0, 1, 0, 3, 0, 1, 3.5], [1, 0, 0, 0, 5, 0, 1, 3.3], [1, 0, 0, 1, 3, 0, 1, 2.8], [0, 1, 1, 0, 3, 0, 1, 1.5], [1, 0, 1, 0, 4, 0, 1, 0.2]], '4':[[1, 1, 0, 0, 1, 1, 0, 17.7], [2, 1, 0, 0, 1, 1, 0, 17.7], [2, 0, 0, 0, 1, 1, 0, 17.7], [1, 0, 0, 0, 3, 1, 0, 13.3], [3, 0, 0, 0, 2, 1, 0, 13.3], [0, 2, 0, 0, 1, 1, 0, 4.4], [1, 0, 0, 0, 4, 1, 0, 4.4], [1, 0, 1, 0, 2, 1, 1, 3.6], [1, 1, 0, 0, 3, 1, 1, 3.4], [2, 0, 0, 1, 1, 1, 1, 3.1], [0, 2, 1, 0, 2, 1, 1, 0.9], [0, 0, 1, 1, 1, 1, 1, 0.3]]}, late:'Silber-Orb bei 66 % Leben, Blau-Orb bei 33 %, Amboss für ein fertiges Item beim Sieg – keine zufälligen Komponenten mehr.', upgraded:[['Keine aufgewertete Runde', 63], ['Eine', 30], ['Zwei', 5.8], ['Drei', 1], ['Alle', 0.2]], orbSrc:'Little Buddy Bot · Patch 18.5', orbs:{gray:{label:'Grauer Orb', orb:'s', wert:'≈ 2 Gold', note:'Stage 1–2', items:[['2 zufällige 1-Kosten', 48], ['zufälliger 2-Kosten', 47], ['2 Gold + Umgestalter', 3], ['2 Gold + Item-Entferner', 1], ['kleiner Duplikator', 1]]}, gray3:{label:'Grauer Orb', orb:'s', wert:'≈ 3 Gold', note:'ab Stage 3', items:[['zufälliger 3-Kosten', 49], ['1 Gold + zufälliger 2-Kosten', 46], ['3 Gold + Umgestalter', 3], ['3 Gold + Item-Entferner', 1], ['kleiner Duplikator', 1]]}, blue:{label:'Blauer Orb', orb:'b', wert:'≈ 6 Gold', note:'Stage 1–3', items:[['2 zufällige 3-Kosten', 33], ['3 Gold + zufälliger 3-Kosten', 31], ['3 zufällige 2-Kosten', 31], ['2 zufällige 2-Kosten + kleiner Duplikator', 2], ['6 Gold + Umgestalter', 2], ['zufälliger 3-Kosten + Champion-Duplikator', 1]]}, blue4:{label:'Blauer Orb', orb:'b', wert:'≈ 8 Gold', note:'ab Stage 4', items:[['4 Gold + zufälliger 4-Kosten', 49], ['2 Gold + 2 zufällige 3-Kosten', 47], ['8 Gold + Umgestalter', 3], ['3 Gold + Champion-Duplikator', 1]]}, gold:{label:'Gold-Orb', orb:'g', wert:'≈ 14 Gold', items:[['15 Gold', 20], ['Amboss (fertiges Item)', 18], ['4 Gold + Pfannenwender oder Bratpfanne + Umgestalter', 15], ['6 Gold + 2 zufällige 4-Kosten', 15], ['2 Gold + 4 zufällige 3-Kosten', 13], ['1 Gold + Diebeshandschuhe', 10], ['Champion-Duplikator + 6 Gold', 3], ['2 Gold + Champion-Duplikator + kleiner Duplikator', 3], ['5 Gold + 3 zufällige 3-Kosten', 3]], note:'Stage 2–3'}, gold4:{label:'Gold-Orb', orb:'g', wert:'≈ 18 Gold', items:[['13 Gold + zufälliger 5-Kosten', 21], ['2 Gold + 2 Komponenten-Ambosse', 21], ['10 Gold + 2 zufällige 4-Kosten', 16], ['2 Gold + Amboss (fertiges Item)', 16], ['3 Gold + Diebeshandschuhe', 11], ['8 Gold + Champion-Duplikator', 5], ['7 Gold + 2 zufällige 5-Kosten', 5], ['1 Gold + Komponenten-Amboss + Pfannenwender oder Bratpfanne + Umgestalter', 5]], note:'ab Stage 4'}, prism:{label:'Prismatischer Orb', orb:'p', wert:'≈ 40 Gold', items:[['Item-Entferner + 2 Artefakt-Ambosse', 15], ['Meisterwerk-Aufwertung + Item-Entferner + Komponenten-Amboss', 15], ['24 Gold + Meisterwerk-Aufwertung', 15], ['18 Gold + Umgestalter + Amboss (fertig) + Komponenten-Amboss + Pfannenwender', 15], ['18 Gold + Umgestalter + Amboss (fertig) + Komponenten-Amboss + Bratpfanne', 15], ['Lichtgegenstand-Glückstruhe + 10 Gold', 15], ['25 Gold + Item-Entferner + Artefakt-Amboss', 10]], note:'ab Stage 3'}}},
  cheats: {
    // Augment-Stufen, Spielerschaden, Karussell – Stand Set 18, am PBE prüfen
    augments: {src:'Little Buddy Bot · Patch 18.5', seq:[['GGG', 22], ['GSG', 18], ['SGG', 12], ['GGP', 12], ['GPG', 10], ['GPS', 6], ['SSG', 5], ['SSP', 5], ['SGP', 5], ['PSG', 4], ['GSP', 2], ['PGG', 2], ['PPP', 1], ['PSP', 1], ['SPP', 1], ['GPP', 1], ['PGP', 1], ['PPG', 1]]},
    damage: {src:'Little Buddy Bot · Patch 18.5', stage:[[1, 0], [2, 2], [3, 6], [4, 7], [5, 10], [6, 12], [7, 17], [8, 150]]},
    carousel: {src:'TFT Flow · Patch 18.1', stages:[{st:'2', size:[[9, 85], [11, 12], [13, 3]], ch:[['Normal (1–3 Kosten)', 'Normal (1–3 cost)', 87], ['Nur 2-Kosten', 'All 2-costs', 5], ['2- und 3-Kosten', '2- and 3-costs', 5], ['Nur 3-Kosten', 'All 3-costs', 3]], it:[['Komponenten', 'Components', 82], ['Je eine von allen', 'One of each', 15], ['Pfannenwender & zufällig', 'Spatulas & random', 3]]}, {st:'3', size:[[9, 60], [11, 37], [13, 3]], ch:[['Normal (1–4 Kosten)', 'Normal (1–4 cost)', 92], ['Nur 3-Kosten', 'All 3-costs', 5], ['3- und 4-Kosten', '3- and 4-costs', 3]], it:[['Komponenten', 'Components', 82], ['Je eine von allen', 'One of each', 15], ['Pfannenwender & zufällig', 'Spatulas & random', 3]]}, {st:'4', size:[[9, 85], [11, 12], [13, 3]], ch:[['Normal (1–5 Kosten)', 'Normal (1–5 cost)', 85], ['Mehr 5-Kosten', 'More 5-costs', 5], ['4- und 5-Kosten', '4- and 5-costs', 5], ['Nur 4-Kosten', 'All 4-costs', 5]], it:[['Komponenten', 'Components', 82], ['Je eine von allen', 'One of each', 15], ['Pfannenwender & zufällig', 'Spatulas & random', 3]]}, {st:'5', size:[[9, 95], [13, 5]], ch:[['Normal (3–5 Kosten)', 'Normal (3–5 cost)', 75], ['Mehr 5-Kosten', 'More 5-costs', 15], ['4- und 5-Kosten', '4- and 5-costs', 5], ['Nur 4-Kosten', 'All 4-costs', 5]], it:[['Zufällige fertige Items', 'Random completed items', 35.4], ['Fertige Items als Komponenten', 'Completed items, unbuilt', 35], ['Fertige Items + 2 Embleme', 'Completed + 2 emblems', 17], ['Fertige Items + 3 Embleme', 'Completed + 3 emblems', 12], ['Taktiker-Items', 'Tactician items', 0.6]]}, {st:'6–7', size:[[9, 95], [13, 5]], ch:[['Normal (3–5 Kosten)', 'Normal (3–5 cost)', 75], ['Mehr 5-Kosten', 'More 5-costs', 15], ['4- und 5-Kosten', '4- and 5-costs', 5], ['Nur 4-Kosten', 'All 4-costs', 5]], it:[['Halb fertig, halb Komponenten', 'Half completed, half unbuilt', 50], ['Fertige Items als Komponenten', 'Completed items, unbuilt', 25], ['Fertige Items + 2 Embleme', 'Completed + 2 emblems', 15], ['Fertige Items + 3 Embleme', 'Completed + 3 emblems', 10]]}]},
    // Patch-Plan von Set 19 – bisher steht nur der Start fest (Riot-Reel vom 13.11.2026 „Live on December 2nd“); weitere Patches eintragen, sobald Riot sie nennt
    patchSchedule: {src:'Riot Games', rows:[['19.1','2026-12-02',['Set 19 startet'],['Set 19 launches']]]},
    // Gold-Regeln für den Streak- & Zins-Rechner – unverändert aus Set 18 (bestätigt von CrazYSlayt am 13.11.2026)
    econ: {base:5, win:1, per:10, cap:5, streak:[[2, 1], [5, 2], [6, 3]], src:'CrazYSlayt · LoL Wiki'}
  }
};
