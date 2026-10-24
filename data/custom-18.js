// TFTClimb – eigene Ergänzungen zu Set 18 (von Hand gepflegt, das Update-Skript überschreibt diese Datei NICHT)
// Für ein neues Set einfach eine Kopie als custom-<Set>.js anlegen und anpassen.
window.TFT_CUSTOM = {
  set: 18,
  // Eigene Trait-Texte und Einteilung (origin = Ursprung, class = Klasse)
  traits: {
  'Apex Predator':{cat:'origin',d:'Belegt zwei Team-Plätze und zählt zusätzlich als +2 Riftbeast.'},
  'Attuned':{cat:'origin',d:'Wechselt nach jedem Zauber die Mondphase — abwechselnd Widerstandsfähigkeit oder Schadensverstärkung fürs Team.'},
  'Avatar':{cat:'origin',d:'Lux trägt einen von neun Ursprüngen und zählt für diesen doppelt.'},
  'Blackthorn':{cat:'origin',d:'Ein besonderes Feld verwandelt eine verbündete Unit in den Kraftmotor des Traits — Opfer gegen Stärke.'},
  'Blossom':{cat:'origin',d:'Stärkt Wisps zunehmend (Upgrades, mehr Shops, Gold, zwei Wisps pro Runde) und die eigenen Units gleichzeitig.'},
  'Bounty Seeker':{cat:'origin',d:'Draven wählt Kopfgelder und erhält bei Erfüllung wachsende Belohnungen.'},
  'Caustic':{cat:'origin',d:'Schaden schwächt Rüstung und Magieresistenz der Ziele.'},
  'Coven':{cat:'origin',d:'Sammelt Essenz durch gegnerische Tode und verlorene Kämpfe — ab 40 Essenz gegen starke Belohnungen eintauschbar.'},
  'Elderwood':{cat:'origin',d:'Platziert wachsende Pflanzen auf dem Feld, die später sogar 2- und 3-Sterne erreichen.'},
  'Emerald Aspect':{cat:'origin',d:'Verbindet Taric mit einer verbündeten Unit — beide erhalten bei niedrigem Leben ein Schild.'},
  'Fae':{cat:'origin',d:'Schaden, Heilung und Schilde ziehen Feen an, die Fae-Units stärken und heilen.'},
  'Flora Fatalis':{cat:'origin',d:'Vernichtungen geben Mana; die zweite Stufe heilt zusätzlich die schwächste verbündete Unit.'},
  'Greenfather':{cat:'origin',d:'Ivern sammelt Samen und lässt daraus verzauberte Felder wachsen, die das Board stärken.'},
  'Inferno':{cat:'origin',d:'Fügt Brand und Wunden zu; ab Stufe 3 entzündet sich ein Shop-Slot für teurere Units.'},
  'Lunar':{cat:'origin',d:'Lunar-Units und angrenzende Verbündete erhalten Angriffstempo und Fähigkeitsstärke.'},
  'Monolith':{cat:'origin',d:'Malphite erhält Rüstung und Magieresistenz für jeden Gegner, der ihn anvisiert.'},
  'Old Growth':{cat:'origin',d:'Maokai gewinnt dauerhaft maximales Leben, wenn Gegner in seiner Nähe sterben.'},
  'Primal':{cat:'origin',d:'Erlaubt die Wahl aus Primal-Segnungen, die das ganze Spiel verändern können.'},
  'Riftbeast':{cat:'origin',d:'Ab 3 erhält ein Riftbeast die Alpha-Markierung. Ab 10: +2 maximale Team-Größe.'},
  'Rival':{cat:'origin',d:'Beide Rivalen entwickeln eigene Belohnungen durch Vernichtungen — gemeinsam verbinden sich ihre Fähigkeiten.'},
  'Solar':{cat:'origin',d:'Gewährt Schilde und zusätzlichen Magieschaden, mit Bonus pro einzigartiger 3-Sterne-Unit.'},
  'Sprykin':{cat:'origin',d:'Erschafft einen großen pelzigen Begleiter — ein gewählter Reiter erhält viel Leben und Angriffstempo.'},
  'Thornmaiden':{cat:'origin',d:'Zyras Pflanzen verleihen dem Team zusätzliche Widerstandsfähigkeit.'},
  'Adaptor':{cat:'class',d:'Fähigkeiten passen sich dem dominanten Wert (AD/AP) an und verstärken ihn.'},
  'Brawler':{cat:'class',d:'Verleiht zusätzliches Leben — je mehr Brawler, desto größer der Bonus.'},
  'Defender':{cat:'class',d:'Gewährt Rüstung und Magieresistenz für das ganze Team.'},
  'Executioner':{cat:'class',d:'Gewährt kritische Trefferchance und wachsende Offensivkraft.'},
  'Hunter':{cat:'class',d:'Verleiht Angriffsschaden und belohnt Fokus auf dasselbe Ziel.'},
  'Invoker':{cat:'class',d:'Verbessert die Mana-Regeneration des Teams, besonders für Invoker.'},
  'Juggernaut':{cat:'class',d:'Gewährt Widerstandsfähigkeit, deutlich mehr für Juggernauts selbst.'},
  'Rapidfire':{cat:'class',d:'Baut Angriffstempo durch wiederholte Angriffe auf.'},
  'Ravager':{cat:'class',d:'Gewährt Omnivamp und zusätzlichen Schaden, stärker im späten Kampfverlauf.'},
  'Spellweaver':{cat:'class',d:'Gewährt Fähigkeitsstärke, die mit jedem Zauber weiter wächst.'},
  'Summoner':{cat:'class',d:'Verstärkt Beschwörungen und Beschwörungs-Mechaniken.'},
  'Vanguard':{cat:'class',d:'Erzeugt zu Kampfbeginn ein starkes Schild.'},
  },
  // Augments mit eigenem Icon in assets/augments/<ID>.webp: Riot liefert nur einen Platzhalter oder ein Icon in der Farbe einer anderen Stufe.
  // Alle sind auf Riots Stufenfarben (Silber/Gold/Prismatisch) und den dunklen Icon-Hintergrund angeglichen.
  augmentIcons: ['DA_18_BlossomTraitAugment','DA_18_CovenTraitAugment','DA_18_CovenTraitAugment_LootToAP','DA_18_ElderwoodTraitAugment','DA_18_FOURcing','DA_18_FaeTraitAugment','DA_18_FloraFatalisAugment','DA_18_InfernoTraitAugment','DA_18_LunarTraitAugment','DA_18_LunarTraitAugmentPlus','DA_18_LuxAugmentII','DA_18_OnesTwosThree','DA_18_PrimalAugmentPlus_Nidalee','DA_18_PrimalAugmentPlus_Sivir','DA_18_PrimalAugment_Nidalee','DA_18_PrimalAugment_Sivir','DA_18_ResidualMagic','DA_18_ResidualMagicPlus','DA_18_ResidualMagicPlusPlus','DA_18_RiftbeastTraitAugment','DA_18_RivalsAugment','DA_18_SolarTraitAugment','DA_18_SprykinAugment','DA_18_WeightTheWorth','DA_18_WispRebatePlus','DA_18_WispRebatePlusPlus','DA_BlackthornTraitAugment','DA_BonusGift','DA_BonusGiftPlus','DA_CapitalGainsI','DA_CapitalGainsII','DA_ChampDelivery','DA_ChampDeliveryPlus','DA_ChampDeliveryPlusPlus','DA_ComponentQuest','DA_FutureFocused','DA_ItsMeBaby','DA_LoadedDice','DA_NestingAnvils','DA_NestingAnvilsPlus','DA_QuickStreaks','DA_TraitLadder','DA_VerticalityI','DA_VerticalityII','DA_VerticalityIII','DA_DeadlierBlades','DA_DeadlierCaps','DA_Flexible','DA_PandorasBench','DA_TonsOfStatsII','DA_WovenMagic'],
  // Shop für den Rolldown-Rechner (Patch 18.4; Quellen: EsportsTales, TFTFlow). Champions pro Kosten kommen automatisch aus den Set-Daten.
  shop: {
    bag: [30, 25, 18, 10, 9],          // Kopien pro Champion (1- bis 5-Kosten)
    odds: [                             // Chance pro Shop-Slot in %, Level 1–11 (1/2/3/4/5-Kosten)
      [100, 0, 0, 0, 0], [100, 0, 0, 0, 0], [75, 25, 0, 0, 0], [55, 30, 15, 0, 0], [45, 33, 20, 2, 0], [30, 40, 25, 5, 0],
      [16, 30, 43, 10, 1], [15, 20, 32, 30, 3], [10, 17, 25, 33, 15], [5, 10, 20, 40, 25], [1, 2, 12, 50, 35]
    ],
    xp: [2, 2, 6, 10, 20, 36, 56, 68, 68] // XP von Level 1→2 … 9→10
  },
  // Beute aus den Creep-Runden (für den Item-Drop-Rechner). Quelle: tftflow.com/tables/set18/stage-loot-orbs
  // Pro Stage alle möglichen Beute-Kombinationen: [Silber, Blau, Gold, Prisma, zufällige Komponenten, Komponenten-Amboss, aufgewertet (0/1), Chance %]
  loot: {
    source: 'tftflow.com (Set 18)',
    // Für das Cheatsheet: Loot-Tabelle von Little Buddy Bot (Patch 18.5, Stand 24.09.2026). Der Item-Drop-Rechner nutzt weiter „stages“.
    // Pro Stage alle Kombinationen: [Komponenten-Kugeln, graue, blaue, goldene, prismatische Orbs, Chance %]
    lbb: {src:'Little Buddy Bot · Patch 18.5', stages:{
      1: [[3,3,0,0,0,35],[3,0,1,0,0,35],[2,3,1,0,0,8],[2,0,2,0,0,8],[5,3,0,0,0,3],[5,0,1,0,0,3],[4,0,1,0,0,3],[3,0,2,0,0,2],[1,3,2,0,0,2],[3,5,0,0,0,1]],
      2: [[3,1,0,0,0,20],[2,1,0,0,0,17],[2,0,1,0,0,17],[3,0,1,0,0,15],[2,2,0,0,0,13],[3,3,0,0,0,5],[2,1,0,1,0,4],[2,1,1,0,0,4],[2,0,2,0,0,4],[2,0,1,1,0,1]],
      3: [[4,1,0,0,0,20],[4,2,0,0,0,20],[3,1,1,0,0,17],[3,3,0,0,0,13],[3,0,2,0,0,13],[4,0,1,0,0,5],[5,1,0,0,0,4],[3,1,0,1,0,3],[3,1,0,0,1,2],[2,0,2,0,0,2],[3,0,1,1,0,1],[4,1,0,1,0,0.25]],
      4: [[3,2,0,0,0,18],[3,1,1,0,0,18],[2,2,1,0,0,18],[4,1,0,0,0,15],[3,3,0,0,0,13],[5,1,0,0,0,5],[4,1,1,0,0,4],[3,1,0,1,0,4],[2,0,2,0,0,3],[2,2,0,0,1,2],[3,0,2,1,0,1],[2,0,0,1,1,0.03]]
    }},
    stages: {
      1: [[3,0,0,0,3,0,0,31],[0,1,0,0,3,0,0,31],[3,1,0,0,2,0,0,10.6],[0,2,0,0,2,0,0,10.6],[3,2,0,0,1,0,0,5.3],[3,0,0,0,5,0,1,2.8],[0,1,0,0,5,0,1,2.8],[0,1,0,0,4,0,1,2.3],[0,2,0,0,3,0,1,2.3],[5,0,0,0,3,0,1,1.1]],
      2: [[0,1,0,0,2,0,0,17.7],[1,0,0,0,2,0,0,17.7],[1,0,0,0,3,0,0,17.7],[2,0,0,0,2,0,0,13.3],[0,1,0,0,3,0,0,13.3],[3,0,0,0,3,0,1,5],[1,0,1,0,2,0,1,5],[1,1,0,0,2,0,0,4.4],[0,2,0,0,2,0,0,4.4],[0,1,1,0,2,0,1,1.4]],
      3: [[1,0,0,0,4,0,0,17.7],[1,1,0,0,3,0,0,17.7],[2,0,0,0,4,0,0,17.7],[3,0,0,0,3,0,0,13.3],[0,2,0,0,3,0,0,13.3],[0,2,0,0,2,0,0,4.4],[0,1,0,0,4,0,0,4.4],[1,0,1,0,3,0,1,3.5],[1,0,0,0,5,0,1,3.3],[1,0,0,1,3,0,1,2.8],[0,1,1,0,3,0,1,1.5],[1,0,1,0,4,0,1,0.2]],
      4: [[1,1,0,0,1,1,0,17.7],[2,1,0,0,1,1,0,17.7],[2,0,0,0,1,1,0,17.7],[1,0,0,0,3,1,0,13.3],[3,0,0,0,2,1,0,13.3],[0,2,0,0,1,1,0,4.4],[1,0,0,0,4,1,0,4.4],[1,0,1,0,2,1,1,3.6],[1,1,0,0,3,1,1,3.4],[2,0,0,1,1,1,1,3.1],[0,2,1,0,2,1,1,0.9],[0,0,1,1,1,1,1,0.3]]
    },
    // ab Stage 5: Xerath – Silber-Orb bei 66 % Leben, Blau-Orb bei 33 %, Amboss für ein fertiges Item beim Sieg
    late: 'Silber-Orb bei 66 % Leben, Blau-Orb bei 33 %, Amboss für ein fertiges Item beim Sieg – keine zufälligen Komponenten mehr.',
    upgraded: [['Keine aufgewertete Runde', 63], ['Eine', 30], ['Zwei', 5.8], ['Drei', 1], ['Alle', 0.2]],
    // Inhalt der Beutekugeln: orb = Farbe (s grau, b blau, g gold, p prisma). Grau und Blau: Little Buddy Bot, Patch 18.5 (Stand 26.08.2026)
    orbSrc: 'Little Buddy Bot · Patch 18.5',
    orbs: {
      gray: {label:'Grauer Orb', orb:'s', wert:'≈ 2 Gold', note:'Stage 1–2', items:[['2 zufällige 1-Kosten', 48], ['zufälliger 2-Kosten', 47], ['2 Gold + Umgestalter', 3], ['2 Gold + Item-Entferner', 1], ['kleiner Duplikator', 1]]},
      gray3: {label:'Grauer Orb', orb:'s', wert:'≈ 3 Gold', note:'ab Stage 3', items:[['zufälliger 3-Kosten', 49], ['1 Gold + zufälliger 2-Kosten', 46], ['3 Gold + Umgestalter', 3], ['3 Gold + Item-Entferner', 1], ['kleiner Duplikator', 1]]},
      blue: {label:'Blauer Orb', orb:'b', wert:'≈ 6 Gold', note:'Stage 1–3', items:[['2 zufällige 3-Kosten', 33], ['3 Gold + zufälliger 3-Kosten', 31], ['3 zufällige 2-Kosten', 31], ['2 zufällige 2-Kosten + kleiner Duplikator', 2], ['6 Gold + Umgestalter', 2], ['zufälliger 3-Kosten + Champion-Duplikator', 1]]},
      blue4: {label:'Blauer Orb', orb:'b', wert:'≈ 8 Gold', note:'ab Stage 4', items:[['4 Gold + zufälliger 4-Kosten', 49], ['2 Gold + 2 zufällige 3-Kosten', 47], ['8 Gold + Umgestalter', 3], ['3 Gold + Champion-Duplikator', 1]]},
      gold: {label:'Gold-Orb', orb:'g', wert:'≈ 14 Gold', items:[['15 Gold', 20], ['Amboss (fertiges Item)', 18], ['4 Gold + Pfannenwender oder Bratpfanne + Umgestalter', 15], ['6 Gold + 2 zufällige 4-Kosten', 15], ['2 Gold + 4 zufällige 3-Kosten', 13], ['1 Gold + Diebeshandschuhe', 10], ['Champion-Duplikator + 6 Gold', 3], ['2 Gold + Champion-Duplikator + kleiner Duplikator', 3], ['5 Gold + 3 zufällige 3-Kosten', 3]], note:'Stage 2–3'},
      gold4: {label:'Gold-Orb', orb:'g', wert:'≈ 18 Gold', items:[['13 Gold + zufälliger 5-Kosten', 21], ['2 Gold + 2 Komponenten-Ambosse', 21], ['10 Gold + 2 zufällige 4-Kosten', 16], ['2 Gold + Amboss (fertiges Item)', 16], ['3 Gold + Diebeshandschuhe', 11], ['8 Gold + Champion-Duplikator', 5], ['7 Gold + 2 zufällige 5-Kosten', 5], ['1 Gold + Komponenten-Amboss + Pfannenwender oder Bratpfanne + Umgestalter', 5]], note:'ab Stage 4'},
      prism: {label:'Prismatic-Orb', orb:'p', wert:'≈ 40 Gold', items:[['Item-Entferner + 2 Artefakt-Ambosse', 15], ['Meisterwerk-Aufwertung + Item-Entferner + Komponenten-Amboss', 15], ['24 Gold + Meisterwerk-Aufwertung', 15], ['18 Gold + Umgestalter + Amboss (fertig) + Komponenten-Amboss + Pfannenwender', 15], ['18 Gold + Umgestalter + Amboss (fertig) + Komponenten-Amboss + Bratpfanne', 15], ['Lichtgegenstand-Glückstruhe + 10 Gold', 15], ['25 Gold + Item-Entferner + Artefakt-Amboss', 10]], note:'ab Stage 3'}
    }
  },
  // Schwarzdorn (Blackthorn): Die Unit auf dem Opferfeld wird vor dem Kampf geopfert.
  // Alle Champions erhalten das Leben der Trait-Stufe (175/350/600), Schwarzdorn-Champions zusätzlich Werte je nach Rolle des Opfers:
  // Grundwert × Faktor (Kosten/Sterne des Opfers) × Stufe (1 / 1,3 / 1,6). Quelle: tftips.app/tables/blackthorn-sacrifice (Patch 18.4), AP-Schadenssteigerung laut Patch 18.5 von 12 % auf 10 %
  blackthorn: {
    hex: 17,                            // Brett-Feld 0–27, Reihe 0 = vorne → 3. Reihe von vorne, Mitte
    role: {
      tank: {hpP: 0.17, res: 12},       // % max. Leben, Rüstung und Magieresistenz
      ad:   {adP: 0.24, asP: 0.14},     // % Angriffsschaden, % Angriffstempo
      ap:   {regen: 2, amp: 0.10}       // Manaregeneration, Schadenssteigerung
    },
    mult: [                             // Kosten 1–5 × Sterne 1–4
      [0.6, 1, 1.75, 2.5], [0.7, 1.4, 2.8, 5], [0.8, 1.75, 3.3, 8], [1.1, 2.1, 50, 500], [1.4, 3, 100, 999]
    ]
  },
  // Rolle jedes Champions (tank / ad / ap) – für das Schwarzdorn-Opfer. Riot liefert die Rolle in den Set-Daten nicht mit.
  roles: {
    'Akali':'ad', 'Camille':'ad', 'Cinderling':'ad', 'Karma':'ap', 'Kobuko':'tank', 'Leona':'tank', 'Ornn':'tank', 'Pebbles':'ap', 'Rakan':'tank', "Rek'Sai":'tank', 'Varus':'ad', 'Veigar':'ap', 'Xayah':'ad', 'Yorick':'tank',
    'Alistar':'tank', 'Caitlyn':'ad', 'Elise':'tank', 'Gromp':'ap', 'Kayle':'ap', 'LeBlanc':'ap', 'Murkwolf':'ad', 'Scuttlecrab':'tank', 'Sejuani':'tank', 'Shen':'tank', 'Teemo':'ap', 'Warwick':'ad', 'Yunara':'ad',
    'Azir':'ap', 'Cassiopeia':'ap', 'Diana':'tank', 'Fiddlesticks':'tank', 'Hecarim':'tank', "Kha'Zix":'ap', "Kog'Maw":'ad', 'Krug':'tank', 'Mama Beak':'ad', 'Master Yi':'ad', 'Rammus':'tank', 'Rengar':'ad', 'Tristana':'ad', 'Vi':'tank',
    'Ahri':'ap', 'Amumu':'tank', 'Aphelios':'ad', 'Brambleback':'ad', 'Ezreal':'ad', 'Lillia':'tank', 'Malphite':'tank', 'Morgana':'tank', 'Nidalee':'ap', 'Sentinel':'tank', 'Sett':'tank', 'Sivir':'ad', 'Soraka':'ap', 'Zyra':'ap',
    'Alune':'ap', 'Ashe':'ad', 'Draven':'ad', 'Elder Dragon':'ad', 'Gnar':'ad', 'Ivern':'ap', 'Kennen':'ap', 'Lux':'ap', 'Maokai':'tank', 'Taric':'tank'
  },
  // Encounters (Beginn jeder Partie, genau einer pro Spiel). w = Gewicht: Chance = w / Summe aller Gewichte (88 = 100 %).
  // Quelle: TFT Flow / TFTips, Stand Patch 18.1, bis 18.4 laut Riots Patchnotes unverändert. Einschätzungen (passende Comps) pflegst du in der Redaktion.
  encounters: [
    {id:'completed-item-anvil', n:'Completed Item Anvil', ch:'Yunara', cat:'items', w:6, de:'Du startest mit einem Amboss für ein fertiges Item.', en:'You start with a completed item anvil.'},
    {id:'component-anvils', n:'Component Anvils', ch:'Sivir', cat:'items', w:6, de:'Du startest mit 2 Komponenten-Ambossen.', en:'You start with 2 component anvils.'},
    {id:'item-forge', n:'Item Forge', ch:'Ornn', cat:'items', w:3, de:'Alle Spieler starten mit 2 Ambossen für fertige Items.', en:'All players start with 2 completed item anvils.'},
    {id:'emblem-ensemble', n:'Emblem Ensemble', ch:'Lux', cat:'items', w:2, de:'Du startest mit 3 zufälligen Emblemen.', en:'You start with 3 random emblems.'},
    {id:'golden-gala', n:'Golden Gala', ch:'Leona', cat:'augments', w:6, de:'Alle angebotenen Augments sind Gold.', en:'All augments offered are gold.'},
    {id:'golden-prelude', n:'Golden Prelude', ch:'Amumu', cat:'augments', w:4, de:'Das erste Augment ist Gold.', en:'The first augment is gold.'},
    {id:'golden-finale', n:'Golden Finale', ch:'Ivern', cat:'augments', w:4, de:'Das letzte Augment ist Gold.', en:'The last augment is gold.'},
    {id:'prismatic-opener', n:'Prismatic Prelude', ch:'Morgana', cat:'augments', w:4, de:'Das erste Augment ist Prismatisch.', en:'The first augment is prismatic.'},
    {id:'prismatic-finisher', n:'Prismatic Finale', ch:'Karma', cat:'augments', w:4, de:'Das letzte Augment ist Prismatisch.', en:'The last augment is prismatic.'},
    {id:'scouting-party', n:'Scouting Party', ch:'Teemo', cat:'augments', w:4, de:'Du bekommst +1 Augment-Reroll.', en:'You get +1 augment reroll.'},
    {id:'prismatic-party', n:'Prismatic Party', ch:'Elder Dragon', cat:'augments', w:2, de:'Alle angebotenen Augments sind Prismatisch.', en:'All augments offered are prismatic.'},
    {id:'2-cost-start', n:'2 Cost Start', ch:'Warwick', cat:'units', w:6, de:'Du startest mit einem zufälligen 2-Kosten-Champion.', en:'You start with a random 2-cost champion.'},
    {id:'upgraded-start', n:'Upgraded Start', ch:'LeBlanc', cat:'units', w:6, de:'Dein Start-Champion ist schon ★★.', en:'Your starting champion is already ★★.'},
    {id:'howling-abyss', n:'Howling Abyss', ch:'Azir', cat:'units', w:6, de:'Du startest mit 5 zufälligen 1-Kosten-Champions.', en:'You start with 5 random 1-cost champions.'},
    {id:'3-cost-start', n:'3 Cost Start', ch:'Tristana', cat:'units', w:5, de:'Du startest mit einem zufälligen 3-Kosten-Champion.', en:'You start with a random 3-cost champion.'},
    {id:'cheaper-levels', n:'Cheaper Levels', ch:'Ashe', cat:'econ', w:4, de:'Jedes Level kostet 2 XP weniger.', en:'Every level costs 2 less XP.'},
    {id:'gold-subscription', n:'Gold Subscription', ch:'Kobuko', cat:'econ', w:4, de:'Zu Beginn jeder Stage bekommen alle Spieler gleich viel Gold.', en:'At the start of every stage, all players get the same amount of gold.'},
    {id:'reroll-subscription', n:'Reroll Subscription', ch:'Kayle', cat:'econ', w:3, de:'Zu Beginn jeder Stage bekommst du kostenlose Shop-Rerolls.', en:'At the start of every stage you get free shop rerolls.'},
    {id:'final-showdown', n:'Final Showdown', ch:'Draven', cat:'other', w:6, de:'Die letzten zwei Spieler bekommen 70 Gold für das Finale.', en:'The final two players get 70 gold for the last fight.'},
    {id:'no-encounter', n:'No Encounter', ch:'', cat:'other', w:3, de:'In diesem Spiel gibt es keinen Encounter.', en:'There is no encounter this game.'}
  ],
  // Cheatsheet (/cheatsheet): Systemwerte des Sets. Shop, Loot und Encounters stehen oben, hier nur der Rest.
  cheats: {
    // Augment-Stufen pro Partie (2-1, 3-2, 4-2): S = Silber, G = Gold, P = Prismatisch, w = Gewicht (Summe 109). Quelle: TFT Flow, Patch 18.1
    augments: {src:'Little Buddy Bot · Patch 18.5', seq:[
      ['GGG',22],['GSG',18],['SGG',12],['GGP',12],['GPG',10],['GPS',6],['SSG',5],['SSP',5],['SGP',5],
      ['PSG',4],['GSP',2],['PGG',2],['PPP',1],['PSP',1],['SPP',1],['GPP',1],['PGP',1],['PPG',1]
    ]},
    // Spielerschaden nach einer Niederlage = Stage-Schaden + 1 pro überlebender gegnerischer Unit. Quelle: TFT Flow, Patch 18.1
    damage: {src:'Little Buddy Bot · Patch 18.5', stage:[[1,0],[2,2],[3,6],[4,7],[5,10],[6,12],[7,17],[8,150]]},
    // Karussell pro Stage: Größe, Champion-Auswahl, Item-Auswahl jeweils [Bezeichnung DE, EN, Chance %]. Quelle: TFT Flow, Patch 18.1
    carousel: {src:'TFT Flow · Patch 18.1', stages:[
      {st:'2', size:[[9,85],[11,12],[13,3]],
        ch:[['Normal (1–3 Kosten)','Normal (1–3 cost)',87],['Nur 2-Kosten','All 2-costs',5],['2- und 3-Kosten','2- and 3-costs',5],['Nur 3-Kosten','All 3-costs',3]],
        it:[['Komponenten','Components',82],['Je eine von allen','One of each',15],['Pfannenwender & zufällig','Spatulas & random',3]]},
      {st:'3', size:[[9,60],[11,37],[13,3]],
        ch:[['Normal (1–4 Kosten)','Normal (1–4 cost)',92],['Nur 3-Kosten','All 3-costs',5],['3- und 4-Kosten','3- and 4-costs',3]],
        it:[['Komponenten','Components',82],['Je eine von allen','One of each',15],['Pfannenwender & zufällig','Spatulas & random',3]]},
      {st:'4', size:[[9,85],[11,12],[13,3]],
        ch:[['Normal (1–5 Kosten)','Normal (1–5 cost)',85],['Mehr 5-Kosten','More 5-costs',5],['4- und 5-Kosten','4- and 5-costs',5],['Nur 4-Kosten','All 4-costs',5]],
        it:[['Komponenten','Components',82],['Je eine von allen','One of each',15],['Pfannenwender & zufällig','Spatulas & random',3]]},
      {st:'5', size:[[9,95],[13,5]],
        ch:[['Normal (3–5 Kosten)','Normal (3–5 cost)',75],['Mehr 5-Kosten','More 5-costs',15],['4- und 5-Kosten','4- and 5-costs',5],['Nur 4-Kosten','All 4-costs',5]],
        it:[['Zufällige fertige Items','Random completed items',35.4],['Fertige Items als Komponenten','Completed items, unbuilt',35],['Fertige Items + 2 Embleme','Completed + 2 emblems',17],['Fertige Items + 3 Embleme','Completed + 3 emblems',12],['Taktiker-Items','Tactician items',0.6]]},
      {st:'6–7', size:[[9,95],[13,5]],
        ch:[['Normal (3–5 Kosten)','Normal (3–5 cost)',75],['Mehr 5-Kosten','More 5-costs',15],['4- und 5-Kosten','4- and 5-costs',5],['Nur 4-Kosten','All 4-costs',5]],
        it:[['Halb fertig, halb Komponenten','Half completed, half unbuilt',50],['Fertige Items als Komponenten','Completed items, unbuilt',25],['Fertige Items + 2 Embleme','Completed + 2 emblems',15],['Fertige Items + 3 Embleme','Completed + 3 emblems',10]]}
    ]},
    // Encounter Gold Subscription (Kobuko): eine Zeile wird pro Partie ausgelost, Gold zu Beginn von Stage 1–8. Quelle: TFT Flow, Patch 18.1
    goldSub: {src:'Little Buddy Bot · Patch 18.5', from:2, to:7, rows:[[15,[0,1,1,2,2,3,3,4]],[35,[1,2,3,4,5,6,7,8]],[25,[2,4,6,8,10,12,14,16]],[23,[3,6,9,12,15,18,21,24]],[2,[8,16,24,32,40,48,56,64]]]},
    // Encounter Reroll Subscription (Kayle): kostenlose Shop-Rerolls zu Beginn jeder Stage [Stage, Rerolls]. Quelle: Little Buddy Bot, Patch 18.4 (05.09.2026)
    rerollSub: {src:'Little Buddy Bot · Patch 18.5', rows:[[2,4],[3,5],[4,6],[5,7],[6,8],[7,9]]},
    // 1-Kosten-Champions, die eine Stage-1-PvE-Runde allein schaffen (Position egal). Quelle: Little Buddy Bot, Patch 18.4 (16.09.2026)
    solo: {src:'Little Buddy Bot · Patch 18.5', rounds:[['1-3',['Akali','Camille',"Rek'Sai",'Yorick']],['1-4',['Camille']]]},
    // Augment-Tabellen (Cheatsheet): Werte von Little Buddy Bot, Patch 18.5. aug = englischer Augment-Name (Icon, deutscher Name und Text kommen aus den Riot-Daten).
    // Belohnungen als Kürzel: g15 Gold · c2 Komponenten · u3 / u3x2 / u4*2 zufällige Champions (Kosten, Anzahl, Sterne) · ac/af/aa Komponenten-/Gegenstands-/Artefaktschmiede
    // fi zufälliges fertiges Item · ar Artefakt · ra Lichtgegenstand · em Emblem · sp Pfannenwender oder Bratpfanne · ti Taktiker-Item · xp64 · rr40 Rerolls · hp Leben für alle
    // egg goldenes Ei · d6 Würfel · coin Kopf · i:<Item-ID oder englischer Name mit _ statt Leerzeichen>x3
    // Zeilen: [Bezeichnung, Chance %, Belohnung, Text DE, Text EN]
    augTables: {src:'Little Buddy Bot · Patch 18.5', list:[
      {id:'trait-ladder', aug:'Trait Ladder', st:'2', unit:['Attribute', 'traits'], groups:[
        {rows:[['2',null,'g1 i:DA_Reforger','Umgestalter','Reforger'],['3',null,'g3','Gold','gold'],['4',null,'g5','Gold','gold'],['5',null,'c','Komponente','component'],
          ['6',50,'g7','Gold','gold'],['',50,'u3x2','3-Kosten','3-costs'],['7',null,'g2 ac','Komponentenschmiede','component anvil']]},
        {rows:[['8',57,'c2','Komponenten','components'],['',43,'af','Gegenstandsschmiede','full item anvil'],['9',null,'g2 u5x2','5-Kosten','5-costs'],['10',null,'g18','Gold','gold'],
          ['11',null,'ti','Taktiker-Item','Tactician\'s item'],['12',null,'u4x3 i:DA_LuckyItemChest','4-Kosten + Glückstruhe','4-costs + Lucky Chest'],
          ['13',null,'g8 c4 i:DA_Consumable_ItemRemover','Komponenten','components'],['14',null,'g10 i:DA_MasterworkUpgrade','Meisterwerk-Aufwertung','Masterwork Upgrade']]}]},
      {id:'we-stick-together', aug:'We Stick Together', st:'2', type:'traits', traits:['Blackthorn','Blossom','Coven','Elderwood','Executioner','Fae','Hunter','Inferno','Invoker','Rapidfire','Ravager','Spellweaver','Sprykin']},
      {id:'loaded-dice', aug:'Loaded Dice', st:'2', type:'luck', rows:[
        ['2','Loaded Dice',['Würfelwurf','die roll'],'d6',['garantiert 6','guaranteed 6']],
        ['2','Loaded Dice',['Münzwurf','coin flip'],'coin',['garantiert Kopf','guaranteed heads']],
        ['2','Coin Flip',null,'coin',['garantiert Kopf','guaranteed heads']],
        ['3','Feeling Lucky',null,'coin',['garantiert Kopf','guaranteed heads']],
        ['3','A Magic Roll',null,'d4 d5 d6',['garantiert 14+ Augen insgesamt','guaranteed 14+ dice total']],
        ['3/4','Flip Frenzy',null,'coin coin coin coin coin',['die ersten 5 Würfe garantiert Kopf','first 5 flips guaranteed heads']],
        ['3/4','Die Roll',null,'d6',['garantiert 6','guaranteed 6']],
        ['3/4','Golden Gamble',null,'coin',['garantiert Kopf (Glücks-Lichtgegenstand-Truhe)','guaranteed heads (Radiant Lucky Item Chest)']]]},
      {id:'blossoms-call', aug:'Blossom\'s Call', st:'4', type:'blossom', trait:'Blossom', stages:[
        ['4',[['0',[1]],['1–2',[1,2,3]],['3',[2,3]],['4',[2,3,4]],['5–7',[3,4]],['8+',[3,4,5]]]],
        ['5',[['0–1',[1,2,3,4]],['2–3',[2,3,4]],['4',[3,4]],['5+',[3,4,5]]]],
        ['6',[['0–1',[2,3,4,5]],['2–10',[3,4,5]],['11+',[5]]]]]},
      {id:'expedition', aug:'Expedition', st:'2', groups:[{rows:[[null,null,'g15 u5x2','Gold + 5-Kosten','gold + 5-costs'],[null,null,'ac i:DA_MasterworkUpgrade','Komponentenschmiede + Meisterwerk-Aufwertung','component anvil + Masterwork Upgrade']]}]},
      {id:'booster-pack', aug:'Booster Pack', st:'2/3/4', groups:[
        {aug:'Booster Pack', rows:[[null,13.5,'u1 u2 u3x3'],[null,13.5,'u1x2 u2x2 u3 u1*2'],[null,13.5,'u1x2 u2x2 u3 u3'],[null,13.5,'u1x3 u3x2 u1*2'],[null,13.5,'u1x2 u2x2 u3x2'],
          [null,13.5,'u1 u2 u3 u1x2*2'],[null,8,'u1 u2 u3 u2*2'],[null,8,'u1 u2 u3 u2*2'],[null,1.5,'u1 u2 u3*2'],[null,1.5,'u1x3 u2 u3 u4']]},
        {aug:'Booster Pack+', rows:[[null,11,'u2x2 u4x2 u2*2'],[null,11,'u2 u3x2 u4 u2*2'],[null,11,'u2 u4 u1x4*2'],[null,11,'u1 u3x3 u4x2'],[null,11,'u2x2 u4x2 u1x2*2'],
          [null,11,'u2 u3x2 u4 u2*2'],[null,10,'u2 u3 u4 u1*3'],[null,8,'u2 u3 u4 u3*2'],[null,8,'u1 u2x2 u4 u3*2'],[null,5,'u2x3 u4x3'],[null,4,'u3x3 u4 u5']]},
        {aug:'Booster Pack++', rows:[[null,12,'u3 u5 u2*3'],[null,12,'u1 u2 u5 u3*2 u3*2'],[null,12,'u5 u1*2 u1*2 u2*2 u3*2'],[null,12,'u4 u5 u5 u2*2 u2*2'],[null,12,'u4x4 u5x2'],
          [null,12,'u4x3 u5 u1*2 u2*2'],[null,12,'u1 u3x2 u5x2 u1*3'],[null,4,'u3x2 u5x4'],[null,4,'u3 u5 u1*3 u1*3'],[null,4,'u5 u3*2 u4*2'],[null,3,'u3 u5 u2*2 u4*2'],[null,1,'u1 u3 u3 u4 u5*2']]}]},
      {id:'frontline-foundation', aug:'Frontline Foundation', st:'2', type:'units', stars:2, units:[['Kobuko','Brawler'],['Leona','Defender'],['Yorick','Juggernaut'],['Rek\'Sai','Brawler'],['Ornn','Defender'],['Rakan','Vanguard']]},
      {id:'backline-blueprint', aug:'Backline Blueprint', st:'2', type:'units', units:[['Azir','Executioner'],['Cassiopeia','Spellweaver'],['Diana','Ravager'],['Mama Beak','Rapidfire'],['Tristana','Hunter']]},
      {id:'warpath', aug:'Warpath', st:'2', groups:[{rows:[[null,null,'u5x3 u4*2 afx2','3× 5-Kosten, 4-Kosten ★★, 2 Gegenstandsschmieden','3× 5-cost, 4-cost ★★, 2 full item anvils']]}]},
      {id:'slightly-magic-roll', aug:'Slightly Magic Roll', st:'2', groups:[
        {rows:[['d1',null,'rr6','kostenlose Rerolls','free rerolls'],['d2',null,'g10','Gold','gold']]},
        {rows:[['d3',null,'g3 u2*2','2-Kosten ★★ + Gold','2-cost ★★ + gold'],['d4',null,'fi i:DA_Reforger','fertiges Item + Umgestalter','full item + Reforger']]},
        {rows:[['d5',null,'hp','+160 Leben für alle Einheiten','+160 HP board-wide'],['d6',null,'em','zufälliges Emblem','random emblem']]}]},
      {id:'magic-roll', aug:'A Magic Roll', st:'3', note:['Besonderes goldenes Ei: schlüpft nach 3 Runden und gibt 5 Gold, 2× 5-Kosten und eine Taktikerkrone.', 'Special Golden Egg: hatches in 3 turns and gives 5 gold, 2× 5-cost and a Tactician\'s Crown.'], groups:[
        {h:['Augensumme der 3 Würfel', 'Total of the 3 dice'], rows:[['4–8',25,'hp','+250 Leben für alle Einheiten (auch künftige)','+250 health for all units (present and future)'],['9–11',36,'u1*2 u2*2 u2*2 u3*2','Haufen Champions','pile of champions'],
          ['12–15',32,'c4 i:DA_Reforger','4× dieselbe Komponente + Umgestalter','4× same component + Reforger'],['16–17',4,'i:DA_Component_FryingPan c2','Bratpfanne + 2 zufällige Komponenten','Pan + 2 random components'],
          ['111 · 222 · 333',1.4,'g? i:DA_Consumable_LesserChampionDuplicatorx3','4–6 Gold + 3× kleiner Duplikator','4–6 gold + 3× Lesser Duplicator'],['444 · 555 · 666',1.4,'i:DA_TacticiansCape','Taktikerumhang','Tactician\'s Cape'],
          ['626',0.5,'egg','besonderes goldenes Ei','Special Golden Egg']]}]},
      {id:'expected-unexpectedness', aug:'Expected Unexpectedness', st:'2', groups:[
        {h:'Stage 2', rows:[[null,36,'u4x2'],[null,32,'acx2 i:DA_Reforgerx3'],[null,25,'g9'],[null,4,'aa'],[null,3,'i:DA_TacticiansCrown']]},
        {h:'Stage 3', rows:[[null,36,'g5 i:DA_Consumable_LesserChampionDuplicatorx2'],[null,32,'g3 af'],[null,25,'g15'],[null,4,'c3'],[null,3,'emx2']]},
        {h:'Stage 4', rows:[[null,36,'g3 u5x2'],[null,32,'g5 i:DA_LuckyItemChest'],[null,25,'g18'],[null,4,'fi c2'],[null,3,'u5x3 i:DA_Consumable_ChampionDuplicator']]}]},
      {id:'call-to-chaos', aug:'Call to Chaos', st:'4', groups:[
        {rows:[[null,11,'g58','Gold','gold'],[null,11,'xp64','Erfahrung','XP'],[null,11,'rr40','Shop-Rerolls','shop rerolls'],[null,11,'af egg','Gegenstandsschmiede + goldenes Ei','full item anvil + Golden Egg'],
          [null,11,'g8 i:DA_RadiantLuckyItemChest i:DA_Consumable_ItemRemover','Glücks-Lichtgegenstand-Truhe','Radiant Lucky Item Chest']]},
        {rows:[[null,11,'acx2 i:DA_Component_FryingPan i:DA_Component_Spatula','Komponentenschmieden + Pfanne + Pfannenwender','component anvils + Pan + Spat'],[null,11,'i:DA_ThiefsGlovesx3 i:DA_Consumable_ItemRemover','Diebeshandschuhe','Thief\'s Gloves'],
          [null,11,'i:DA_LuckyItemChestx3 i:DA_Consumable_ItemRemover','Glückstruhen','Lucky Item Chests'],[null,11,'c6','verschiedene Komponenten','unique components']]}]},
      {id:'golden-egg', aug:'The Golden Egg', st:'4', groups:[
        {rows:[[null,15,'g88 i:DA_TacticiansCrown'],[null,15,'g30 i:DA_TacticiansCrownx2 i:DA_ThiefsGloves'],[null,10,'g10 i:DA_TacticiansCrown ra ar fi i:DA_Consumable_ItemRemover'],
          [null,10,'g25 i:Infinity_Force i:Zhonya\'s_Paradox i:The_Indomitable i:DA_Consumable_ChampionDuplicator i:DA_Consumable_ItemRemoverx2']]},
        {rows:[[null,15,'g10 i:DA_TacticiansCrown rax2'],[null,15,'g25 i:DA_TacticiansCrown i:DA_ThiefsGlovesRadiant i:DA_ThiefsGloves'],[null,10,'g30 i:DA_TacticiansCrown u5x4 i:DA_Consumable_ChampionDuplicatorx2'],
          [null,10,'g10 i:DA_TacticiansCrown i:Infinity_Edge i:Jeweled_Gauntlet i:Striker\'s_Flail i:Hand_Of_Justice i:Quicksilver i:DA_Consumable_ItemRemover']]}]},
      {id:'missed-connections', aug:'Missed Connections', st:'3+', type:'circle', units:['Akali','Camille','Varus','Veigar','Ornn','Yorick','Xayah','Karma','Pebbles','Rek\'Sai','Rakan','Leona','Kobuko','Cinderling']},
      {id:'slice-of-life', aug:'Slice of Life', st:'2', groups:[{rows:[['2-1',null,'u2'],['2-5',null,'u2']]},{rows:[['3-1',null,'u3'],['3-5',null,'u3']]},{rows:[['4-1',null,'u4'],['4-5',null,'u4']]},{rows:[['5-1',null,'u5']]}]},
      {id:'hard-commit', aug:'Hard Commit', st:'2', type:'commit', traits:['Blossom','Brawler','Elderwood','Hunter','Juggernaut','Spellweaver','Vanguard']},
      {id:'solo-leveling', aug:'Solo Leveling', st:'2', type:'stats', stats:[['ad','50 %','Angriffsschaden','Attack Damage'],['ap','50 %','Fähigkeitsstärke','Ability Power'],['as','150 %','Angriffstempo','Attack Speed'],['crit','10 %','Krit-Chance','Crit Chance'],
        ['da','30 %','Schadensverstärkung','Damage Amp'],['hp','525','Leben','Health'],['dr','20 %','Haltbarkeit','Durability'],['sv','20 %','Omnivampir','Omnivamp']]}
    ]},
    // Attribut-Tabellen (Cheatsheet): Werte von Little Buddy Bot, Patch 18.5. trait = englischer Attributname (Symbol aus den Riot-Daten), text = Kurzbeschreibung [DE, EN].
    // Belohnungen wie bei den Augment-Tabellen, dazu ch:<Champion>x3*2 (bestimmter Champion, Anzahl, Sterne) und „or“ (oder)
    traitTables: {src:'Little Buddy Bot · Patch 18.5', list:[
      {id:'prismatic-traits', title:['Prismatische Attribute','Prismatic traits'], trait:'Blossom', type:'prismatic', text:['Mit genug Champions eines Attributs auf dem Feld wird es prismatisch.','Field enough champions of a trait and it turns prismatic.'],
        rows:[['Blossom',['11 Blossom-Champions aufs Feld (mindestens 2 Embleme nötig)','Field 11 Blossom (requires at least 2 emblems)'],['Geister laden sich mit Kraft auf und werden zu ihren prismatischen Effekten.','Wisps overflow with power, upgrading to their prismatic effects.']],
          ['Elderwood',['11 Elderwood-Champions aufs Feld (mindestens 2 Embleme nötig)','Field 11 Elderwood (requires at least 2 emblems)'],['Pflanzen steigen auf 3 Sterne auf, und alle 7 Sekunden erscheinen Tiefwald-Beschützer.','Plants star up to 3-star and Deepwood Protectors spawn every 7 seconds.']]]},
      {id:'coven', title:['Coven-Beute','Coven loot'], trait:'Coven', type:'coven',
        text:['Sammle Essenz durch Kills und verlorene Kämpfe. Dann wählst du: in Beute umwandeln oder weitersammeln.','Gather Essence by killing champions, plus more by losing player combat. Then choose: convert it to rewards or keep gathering.'],
        bp:[[3,2,22],[4,2,28],[5,3,35],[7,10,60]],
        tiers:[[40,5,[[33,'g4'],[33,'u2x2'],[33,'ch:Cassiopeia ch:Camille']]],
          [85,10,[[33,'g2 c'],[33,'g10'],[33,'ch:Elise c']]],
          [130,28,[[50,'c ch:Caitlynx3 or ch:Elisex3'],[25,'g6 c'],[25,'g3 c ch:Camillex3']]],
          [185,45,[[25,'af c'],[25,'g10 af'],[25,'g10 c2 i:DA_Reforger'],[25,'ch:Caitlynx3 ch:Camillex3 af']]],
          [250,85,[[20,'g20 af af'],[20,'g5 ch:Morganax3 i:DA_LuckyItemChest fi'],[20,'g18 i:DA_LuckyItemChest i:DA_LuckyItemChest i:DA_Reforger'],[20,'g18 ch:Lux i:DA_LuckyItemChest acx2'],[20,'g18 aa af']]],
          [365,175,[[17,'g27 ra ra i:DA_Consumable_ItemRemoverx2 i:DA_Reforgerx2'],[17,'g22 ch:Morganax3 ch:Sentinelx3 i:DA_RadiantLuckyItemChest i:DA_ThiefsGloves'],[17,'g22 i:DA_RadiantLuckyItemChest af af em'],
            [17,'g15 ch:Kennenx3 i:DA_ThiefsGloves i:DA_ThiefsGloves i:DA_Consumable_ItemRemoverx3'],[17,'g22 ch:Morgana i:DA_RadiantLuckyItemChest i:DA_18_EmblemInvoker i:DA_18_EmblemInvoker'],[17,'g12 ch:Dravenx3 i:DA_TacticiansCrown i:DA_RadiantLuckyItemChest i:DA_Consumable_GoldenItemRemover']]],
          [500,300,[[20,'rax3 af af i:DA_Consumable_ItemRemoverx3 i:DA_Reforgerx3'],[20,'u5x3 u5x3 i:DA_RadiantLuckyItemChestx2 fix2 i:DA_Consumable_ItemRemoverx3'],[20,'g20 i:DA_RadiantLuckyItemChest i:DA_RadiantLuckyItemChest aax2 i:DA_Consumable_ItemRemoverx3'],
            [20,'g10 i:DA_RadiantLuckyItemChest i:DA_RadiantLuckyItemChest emx4 i:DA_Consumable_GoldenItemRemover'],[20,'g15 ch:Kennenx3 ch:Lux*2 i:DA_TacticiansShield i:DA_RadiantLuckyItemChestx2']]],
          [650,400,[[33,'g30 u5x3 u5x3 u5x3 i:DA_TacticiansShield ra ra ra i:DA_Consumable_GoldenItemRemover'],[33,'g10 ch:Lux*2 ch:Morganax3 i:DA_TacticiansCape i:DA_RadiantLuckyItemChest i:DA_RadiantLuckyItemChest i:DA_RadiantLuckyItemChest i:DA_Consumable_GoldenItemRemover'],
            [33,'g40 i:DA_TacticiansCrown ra ra ra i:DA_Consumable_ChampionDuplicator i:DA_Consumable_ChampionDuplicator i:DA_Consumable_ChampionDuplicator i:DA_Consumable_GoldenItemRemover i:DA_Reforger i:DA_Reforger']]],
          [800,1666,[[50,'g100 i:DA_TacticiansCapex3 rax6 i:DA_Consumable_GoldenItemRemover'],[50,'g100 i:DA_TacticiansShield rax6 i:DA_Consumable_ChampionDuplicatorx6']]]]},
      {id:'riftbeast', title:['Riftbeast-Shop & Buffs','Riftbeast shop & buffs'], trait:'Riftbeast', type:'riftbeast',
        text:['(5) Jeder 3. Kampf: Dein nächster Shop ist voller Riftbeasts. Chance = mindestens 1 Kopie im Shop (ohne 3-Sterne-Riftbeasts). Diese Shops nutzen feste 5er-Aufstellungen statt der normalen Shop-Chancen.','(5) Every 3 combats, your next shop is overrun with Riftbeasts. % = odds of seeing at least 1 copy in the shop, assuming no 3-star Riftbeasts. These shops use preset 5-unit lineups, not normal shop odds.'],
        odds:[['Cinderling',[[67,2],[66,2],[64,2],[59,2],[31,3],[21,3],[9,1]]],['Pebbles',[[67,2],[66,2],[64,2],[59,2],[31,3],[21,3],[9,1]]],['Murkwolf',[[44,2],[44,2],[44,2],[45,2],[29,2],[24,3],[14,3]]],
          ['Gromp',[[56,1],[56,2],[55,2],[55,2],[51,2],[45,2],[14,2]]],['Scuttlecrab',[[56,2],[56,2],[55,2],[55,2],[51,2],[47,3],[27,3]]],['Mama Beak',[[33,1],[34,2],[39,2],[52,2],[52,2],[53,2],[64,3]]],
          ['Krug',[[67,1],[67,2],[69,2],[76,2],[76,2],[74,2],[64,3]]],['Sentinel',[[11,1],[11,1],[12,1],[15,1],[34,1],[34,1],[24,1]]],['Brambleback',[[11,1],[11,1],[12,1],[15,1],[34,1],[39,1],[51,1]]],['Elder Dragon',[null,null,null,null,null,[5,1],[45,1]]]],
        buffs:[['Cinderling',['Scharlachroter Buff','Scarlet Buff'],['Erhält bei jedem Zauber 22 % Angriffsschaden.','Gains 22% Attack Damage each cast.']],['Pebbles',['Petrol-Buff','Teal Buff'],['Erhält 2 Manaregeneration pro 4 Sekunden Kanalisieren.','Gain 2 Mana Regen for every 4 seconds channeled.']],
          ['Gromp',['Lila Buff','Purple Buff'],['Erhält alle 5 Sekunden 30 % Fähigkeitsstärke.','Every 5 seconds, Gromp gains 30% Ability Power.']],['Murkwolf',['Grauer Buff','Grey Buff'],['Erhält Präzision und 25 % Krit-Chance, bis zu 75 % je nach fehlendem Leben.','Gain Precision and 25% Crit Chance, increased up to 75% based on missing Health.']],
          ['Scuttlecrab',['Grüner Buff','Green Buff'],['Fallen Verbündete unter 50 % Leben, stellen sie 15 % ihres maximalen Lebens wieder her.','When allies fall below 50% Health, they restore 15% max Health.']],['Mama Beak',['Oranger Buff','Orange Buff'],['Normaler Schaden senkt die Rüstung des Gegners um 2.','Dealing physical damage reduces enemy Armor by 2.']],
          ['Krug',['Schiefer-Buff','Slate Buff'],['Beim Tod schützen Krug und Kruglets Verbündete mit einem Schild über 8 % des maximalen Lebens.','On death, Krug and Kruglettes shield allies for 8% max Health.']],['Brambleback',['Roter Buff','Red Buff'],['Angriffe verbrennen Gegner um 1 % und heilen Brambleback um 5 % des maximalen Lebens.','Attacks 1% Burn enemies and heal Brambleback for 5% max Health.']],
          ['Sentinel',['Blauer Buff','Blue Buff'],['Bei jedem Zauber erhalten Verbündete 2 Manaregeneration.','Each time Sentinel casts, allies gain 2 Mana Regen.']],['Elder Dragon',['Buff des Ältesten Drachen','Elder Dragon Buff'],['Schaden an Gegnern unter 12 % Leben richtet sie hin.','Damaging an enemy below 12% Health executes them.']]],
        buffText:['(3) Mit dem Alpha-Mal erhält eine Riftbeast ihren eigenen Buff.','(3) Use the Alpha Mark to grant a Riftbeast their unique Buff.']},
      // Blackthorn: [Kosten][Rolle Tank/AD/AP][Stufe 2/4/6][Sterne] = [Wert 1, Wert 2] – Tank: Leben % + Rüstung/MR, AD: AD % + AS %, AP: Schadensverstärkung % + Manaregeneration
      {id:'blackthorn', title:['Blackthorn-Boni','Blackthorn bonus stats'], trait:'Blackthorn', type:'blackthorn',
        text:['Der Verbündete auf dem Blackthorn-Feld wird vor dem Kampf geopfert und gibt deinen Champions Leben. Blackthorn-Champions erhalten Boni je nach Rolle, Sternen und Kosten des Opfers.','The ally on the Blackthorn hex is sacrificed before combat, granting your champions Health. Blackthorn champions gain bonus stats based on the sacrifice\'s role, star level and cost.'],
        grid:[
          [[[[10,7],[17,12],[30,21]],[[13,9],[22,16],[39,27]],[[15,11],[26,18],[45,32]]],[[[14,8],[24,14],[42,25]],[[19,11],[31,18],[55,32]],[[22,13],[36,21],[63,37]]],[[[6,1],[10,2],[18,4]],[[8,2],[13,3],[23,5]],[[9,2],[15,3],[26,5]]]],
          [[[[12,8],[24,17],[48,34]],[[15,11],[31,22],[62,44]],[[18,13],[36,25],[71,50]]],[[[17,10],[34,20],[67,39]],[[22,13],[44,25],[87,51]],[[25,15],[50,29],[101,59]]],[[[7,1],[14,3],[28,6]],[[9,2],[18,4],[36,7]],[[11,2],[21,4],[42,8]]]],
          [[[[14,10],[30,21],[56,40]],[[18,12],[39,27],[73,51]],[[20,14],[45,32],[84,59]]],[[[19,11],[42,25],[79,46]],[[25,15],[55,32],[103,60]],[[29,17],[63,37],[119,69]]],[[[8,2],[18,4],[33,7]],[[10,2],[23,5],[43,9]],[[12,2],[26,5],[50,10]]]],
          [[[[19,13],[36,25],[850,600]],[[24,17],[46,33],[1105,780]],[[28,20],[54,38],[1275,900]]],[[[26,15],[50,29],[1200,700]],[[34,20],[66,38],[1560,910]],[[40,23],[76,44],[1800,1050]]],[[[11,2],[21,4],[500,100]],[[14,3],[27,5],[650,130]],[[17,3],[32,6],[750,150]]]],
          [[[[24,17],[51,36],[1700,1200]],[[31,22],[66,47],[2210,1560]],[[36,25],[77,54],[2550,1800]]],[[[34,20],[72,42],[2400,1400]],[[44,25],[94,55],[3120,1820]],[[50,29],[108,63],[3600,2100]]],[[[14,3],[30,6],[1000,200]],[[18,4],[39,8],[1300,260]],[[21,4],[45,9],[1500,300]]]]]},
      {id:'fae', title:['Fae-Pixies & Gold','Fae pixies & gold'], trait:'Fae', type:'fae',
        text:['Schaden, Heilung und Schilde deines Teams locken Pixies an. Jede Pixie gibt Fae-Champions AD und AP und heilt sie unter 50 % Leben. Nach 7 Pixies kommen stattdessen goldene Pixies, die Gold geben.','Your team\'s damage, healing and shielding attracts Pixies. Each Pixie grants Fae champions AD and AP and heals them below 50% Health. After 7 Pixies, Golden Pixies come instead and grant gold.'],
        pix:[[2000,[4.5,3],[7,5],[25,3],[28.5,5]],[7500,[9,6],[14,10],[31.5,6],[39,10]],[15000,[13.5,9],[21,15],[38,9],[49.5,15]],[25000,[18,12],[28,20],[45,12],[60,20]],[60000,[22.5,15],[35,25],[52,15],[70.5,25]],[100000,[27,18],[42,30],[58.5,18],[81,30]],[155000,[31.5,21],[49,35],[65,21],[91.5,35]]],
        gold:[[170000,5],[200000,8],[300000,12],[400000,18],[500000,25],[600000,50],[888888,777]],
        aug:['Embiggen',['Pixies werden größer und geben 50 % mehr AD und AP. Fae-Champions erhalten sofort 18 % AD und AP.','Fae pixies are now larger and grant 50% more Attack Damage and Ability Power. Fae champions gain 18% Attack Damage and Ability Power immediately.'],'2+']},
      {id:'primal', title:['Primal-Segen','Primal blessings'], trait:'Primal', type:'info', text:['Wähle einen von vier Primal-Segen.','Choose one of four Primal blessings.'],
        rows:[['emblem:Primal',['Schildkröte','Turtle'],['Dein Team heilt alle 4 Sekunden 4 % seines maximalen Lebens.','Your team heals for 4% of their max Health every 4 seconds.']],['emblem:Primal',['Bär','Bear'],['Primal-Schaden richtet Gegner unter 12 % Leben hin.','Primal damage executes enemies below 12% Health.']],
          ['emblem:Primal',['Tiger','Tiger'],['Nach 6 Sekunden erhalten Primal-Champions 35 % Angriffstempo und dein Team 15 % Angriffstempo.','After 6 seconds, Primal champions gain 35% Attack Speed and your team gains 15% Attack Speed.']],['emblem:Primal',['Phönix','Phoenix'],['Alle 15 Primal-Kills erhältst du eine Komponente (höchstens 4).','Every 15 Primal takedowns, gain a component. Max 4.']]]},
      {id:'avatar-lux', title:['Avatar (Lux)','Avatar (Lux)'], trait:'Avatar', type:'lux', text:['Lux bekommt je nach gewähltem Attribut einen Zusatzeffekt.','Lux gains a bonus effect based on her chosen trait.'],
        base:[['Passiv: Bei jedem Zauber erhalten alle Verbündeten, die ein Attribut mit Lux teilen, 3/3/100 Mana.','Passive: On cast, all allies that share a trait with Lux gain 3/3/100 mana.'],['Aktiv: Feuert einen Laser in die Linie mit den meisten Gegnern: 375/565/6500 magischer Schaden, pro getroffenem Gegner 25/25/10 % weniger (mindestens 40 %).','Active: Fire a laser towards the most enemies in a line that deals 375/565/6500 magic damage, reduced by 25/25/10% for each enemy hit (minimum 40%).']],
        rows:[['Blackthorn',['Betäubt getroffene Ziele für 1 Sekunde.','Stuns targets hit for 1 second.']],['Blossom',['Das erste getroffene Ziel erleidet 10 % zusätzlichen Schaden.','The first target hit is dealt 10% bonus damage.']],
          ['Coven',['Senkt Rüstung und Magieresistenz getroffener Ziele für den restlichen Kampf um 8.','Reduces the Armor and Magic Resist of targets hit by 8 for the rest of combat.']],['Elderwood',['Zauber geben allen Verbündeten für den restlichen Kampf 2,5 % mehr maximales Leben.','Casts grant all allies 2.5% increased max Health for the rest of combat.']],
          ['Fae',['Heilt den Verbündeten mit dem niedrigsten Leben in Prozent um 18 % des Fähigkeitsschadens.','Heals the lowest percent Health ally for 18% of ability damage dealt.']],['Inferno',['Stellt pro Kill 8 Mana wieder her.','Restores 8 mana per takedown.']],
          ['Lunar',['Macht getroffene Gegner für 4 Sekunden 10 % verwundbar.','Applies 10% Vulnerable to enemies hit for 4 seconds.']],['Primal',['Nach dem Zauber 6 Sekunden lang 50 % Angriffstempo.','Gain 50% Attack Speed for 6 seconds after cast.']],
          ['Solar',['Verursacht 15 % zusätzlichen Schaden, plus 12 % je einzigartigem 3-Sterne-Champion auf dem Feld.','Deal 15% bonus damage. For each unique 3-star champion fielded, deal an additional 12% damage.']]]},
      {id:'sprykin', title:['Sprykin BFF & SFF','Sprykin BFF & SFF'], trait:'Sprykin', type:'sprykin',
        text:['Du erhältst den besten flauschigen Freund (BFF). Setze einen Sprykin darauf, um seinen Reiter zu wählen. Mit „Small Furry Friend“ (ab Stage 2) kommt ein zweiter, kleinerer Freund (SFF) mit 45 % der Stärke dazu.','You get a Best Furry Friend (BFF). Put a Sprykin on it to choose its Rider. Small Furry Friend (Stage 2+) adds a second summon (SFF) that is 45% as powerful.'],
        eff:[['bff',[[3,'15 %','15 %',null],[5,'40 %','40 %',50],[7,'55 %','55 %',100]]],['sff',[[3,'6,75 %','6,75 %',null],[5,'18 %','15,75 %',50],[7,'24,75 %','24,75 %',100]]]],
        melee:[['bff',[[3,'10 %',null],[5,'13 %','6,5 %'],[7,'16 %','16 %']]],['sff',[[3,'4,5 %',null],[5,'0,6 %','0,3 %'],[7,'7,2 %','7,2 %']]]],
        ranged:[['bff',[[3,'15 %',null],[5,'30 %','15 %'],[7,'40 %','40 %']]],['sff',[[3,'6,75 %',null],[5,'12,6 %','6,3 %'],[7,'15 %','15 %']]]]}
    ]},
    // Patch-Plan des Sets: [Patch, Datum, Ereignisse DE, Ereignisse EN]. Quelle: Little Buddy Bot (Stand 09.09.2026)
    patchSchedule: {src:'Little Buddy Bot', rows:[
      ['18.1','2026-08-26',['Battle Pass Teil 1','TPC Cup #1'],['Battle Pass Part 1','TPC Cup #1']],['18.2','2026-09-10',['Tactician\'s Trials #1, Woche 1','TPC Cup #2'],['Tactician\'s Trials #1 wk 1','TPC Cup #2']],
      ['18.3','2026-09-23',['Tactician\'s Trials #1, Woche 2','TPC Cup #3'],['Tactician\'s Trials #1 wk 2','TPC Cup #3']],['18.4','2026-10-07',['Battle Pass Teil 2','Tactician\'s Trials #2'],['Battle Pass Part 2','Tactician\'s Trials #2']],
      ['18.5','2026-10-21',['Regionals'],['Regionals']],['18.6','2026-11-04',['Patch für 1 Woche','4v4 Superbrawl'],['1 week patch','4v4 Superbrawl']],['18.6B','2026-11-11',['Worlds','Set 19 PBE'],['Worlds','Set 19 PBE']],['19.1','2026-12-01',['Set 19 startet'],['Set 19 launches']]]}
  },
  // Elderwood-Pflanzen (platzierbare Einheiten ohne Champion-Daten). Reihenfolge nicht ändern – Builder-Links hängen davon ab.
  plants: {
    'Lifebloom': 'assets/plants/lifebloom.webp',
    'Stonebark Tree': 'assets/plants/stonebark-tree.webp',
    'Deepwood Protector': 'assets/plants/deepwood-protector.webp'
  }
};