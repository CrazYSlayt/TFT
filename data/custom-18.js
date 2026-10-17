// Climb TFT – eigene Ergänzungen zu Set 18 (von Hand gepflegt, das Update-Skript überschreibt diese Datei NICHT)
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
    stages: {
      1: [[3,0,0,0,3,0,0,31],[0,1,0,0,3,0,0,31],[3,1,0,0,2,0,0,10.6],[0,2,0,0,2,0,0,10.6],[3,2,0,0,1,0,0,5.3],[3,0,0,0,5,0,1,2.8],[0,1,0,0,5,0,1,2.8],[0,1,0,0,4,0,1,2.3],[0,2,0,0,3,0,1,2.3],[5,0,0,0,3,0,1,1.1]],
      2: [[0,1,0,0,2,0,0,17.7],[1,0,0,0,2,0,0,17.7],[1,0,0,0,3,0,0,17.7],[2,0,0,0,2,0,0,13.3],[0,1,0,0,3,0,0,13.3],[3,0,0,0,3,0,1,5],[1,0,1,0,2,0,1,5],[1,1,0,0,2,0,0,4.4],[0,2,0,0,2,0,0,4.4],[0,1,1,0,2,0,1,1.4]],
      3: [[1,0,0,0,4,0,0,17.7],[1,1,0,0,3,0,0,17.7],[2,0,0,0,4,0,0,17.7],[3,0,0,0,3,0,0,13.3],[0,2,0,0,3,0,0,13.3],[0,2,0,0,2,0,0,4.4],[0,1,0,0,4,0,0,4.4],[1,0,1,0,3,0,1,3.5],[1,0,0,0,5,0,1,3.3],[1,0,0,1,3,0,1,2.8],[0,1,1,0,3,0,1,1.5],[1,0,1,0,4,0,1,0.2]],
      4: [[1,1,0,0,1,1,0,17.7],[2,1,0,0,1,1,0,17.7],[2,0,0,0,1,1,0,17.7],[1,0,0,0,3,1,0,13.3],[3,0,0,0,2,1,0,13.3],[0,2,0,0,1,1,0,4.4],[1,0,0,0,4,1,0,4.4],[1,0,1,0,2,1,1,3.6],[1,1,0,0,3,1,1,3.4],[2,0,0,1,1,1,1,3.1],[0,2,1,0,2,1,1,0.9],[0,0,1,1,1,1,1,0.3]]
    },
    // ab Stage 5: Xerath – Silber-Orb bei 66 % Leben, Blau-Orb bei 33 %, Amboss für ein fertiges Item beim Sieg
    late: 'Silber-Orb bei 66 % Leben, Blau-Orb bei 33 %, Amboss für ein fertiges Item beim Sieg – keine zufälligen Komponenten mehr.',
    upgraded: [['Keine aufgewertete Runde', 63], ['Eine', 30], ['Zwei', 5.8], ['Drei', 1], ['Alle', 0.2]],
    orbs: {
      gold: {label:'Gold-Orb', wert:'15–18 Gold', items:[['15 Gold', 20], ['4 Gold + Bratpfanne + Pfannenwender + Umgestalter', 15], ['Amboss (fertiges Item)', 18], ['6 Gold + 2 zufällige 4-Kosten', 15], ['2 Gold + 4 zufällige 3-Kosten', 13], ['1 Gold + Diebeshandschuhe', 10], ['Champion-Duplikator + 6 Gold', 3], ['Champion-Duplikator + 2 Gold + kleiner Duplikator', 3], ['5 Gold + 3 zufällige 3-Kosten', 3]], note:'Stage 2–3'},
      gold4: {label:'Gold-Orb', wert:'≈ 18 Gold', items:[['13 Gold + zufälliger 5-Kosten', 21.1], ['2 Gold + 2 Komponenten-Ambosse', 21.1], ['10 Gold + 2 zufällige 4-Kosten', 15.8], ['2 Gold + Amboss (fertiges Item)', 15.8], ['3 Gold + Diebeshandschuhe', 10.5], ['1 Gold + Bratpfanne + Pfannenwender + Umgestalter + Komponenten-Amboss', 5.3], ['Champion-Duplikator + 8 Gold', 5.3], ['7 Gold + 2 zufällige 5-Kosten', 5.3]], note:'ab Stage 4'},
      prism: {label:'Prismatic-Orb', wert:'≈ 40 Gold', items:[['Item-Entferner + 2 Artefakt-Ambosse', 15], ['24 Meisterwerk-Aufwertungen + Item-Entferner + Komponenten-Amboss', 15], ['24 Gold + Meisterwerk-Aufwertung', 15], ['18 Gold + Umgestalter + Amboss (fertig) + Komponenten-Amboss + Pfannenwender', 15], ['18 Gold + Umgestalter + Amboss (fertig) + Komponenten-Amboss + Bratpfanne', 15], ['Lichtgegenstand-Glückstruhe + 10 Gold', 15], ['25 Gold + Item-Entferner + Artefakt-Amboss', 10]], note:'ab Stage 3'}
    }
  },
  // Schwarzdorn (Blackthorn): Die Unit auf dem Opferfeld wird vor dem Kampf geopfert.
  // Alle Champions erhalten das Leben der Trait-Stufe (175/350/600), Schwarzdorn-Champions zusätzlich Werte je nach Rolle des Opfers:
  // Grundwert × Faktor (Kosten/Sterne des Opfers) × Stufe (1 / 1,3 / 1,6). Quelle: tftips.app/tables/blackthorn-sacrifice (Patch 18.4)
  blackthorn: {
    hex: 17,                            // Brett-Feld 0–27, Reihe 0 = vorne → 3. Reihe von vorne, Mitte
    role: {
      tank: {hpP: 0.17, res: 12},       // % max. Leben, Rüstung und Magieresistenz
      ad:   {adP: 0.24, asP: 0.14},     // % Angriffsschaden, % Angriffstempo
      ap:   {regen: 2, amp: 0.12}       // Manaregeneration, Schadenssteigerung
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
    {id:'prismatic-opener', n:'Prismatic Opener', ch:'Morgana', cat:'augments', w:4, de:'Das erste Augment ist Prismatisch.', en:'The first augment is prismatic.'},
    {id:'prismatic-finisher', n:'Prismatic Finisher', ch:'Karma', cat:'augments', w:4, de:'Das letzte Augment ist Prismatisch.', en:'The last augment is prismatic.'},
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
    augments: {src:'TFT Flow · Patch 18.1', seq:[
      ['GGG',22],['GSG',18],['SGG',12],['GGP',12],['GPG',10],['GPS',6],['SSG',5],['SSP',5],['SGP',5],
      ['PSG',4],['GSP',2],['PGG',2],['PPP',1],['PSP',1],['SPP',1],['GPP',1],['PGP',1],['PPG',1]
    ]},
    // Spielerschaden nach einer Niederlage = Stage-Schaden + 1 pro überlebender gegnerischer Unit. Quelle: TFT Flow, Patch 18.1
    damage: {src:'TFT Flow · Patch 18.1', stage:[[2,2],[3,6],[4,7],[5,10],[6,12],[7,17],['8+',150]]},
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
    goldSub: {src:'TFT Flow · Patch 18.1', rows:[[15,[0,1,1,2,2,3,3,4]],[35,[1,2,3,4,5,6,7,8]],[25,[2,4,6,8,10,12,14,16]],[23,[3,6,9,12,15,18,21,24]],[2,[8,16,24,32,40,48,56,64]]]},
    // Encounter Reroll Subscription (Kayle): kostenlose Shop-Rerolls zu Beginn jeder Stage [Stage, Rerolls]. Quelle: Little Buddy Bot, Patch 18.4 (05.09.2026)
    rerollSub: {src:'Little Buddy Bot · Patch 18.4', rows:[[2,4],[3,5],[4,6],[5,7],[6,8],[7,9]]},
    // 1-Kosten-Champions, die eine Stage-1-PvE-Runde allein schaffen (Position egal). Quelle: Little Buddy Bot, Patch 18.4 (16.09.2026)
    solo: {src:'Little Buddy Bot · Patch 18.4', rounds:[['1-3',['Akali','Camille',"Rek'Sai",'Yorick']],['1-4',['Camille']]]}
  },
  // Elderwood-Pflanzen (platzierbare Einheiten ohne Champion-Daten). Reihenfolge nicht ändern – Builder-Links hängen davon ab.
  plants: {
    'Lifebloom': 'assets/plants/lifebloom.webp',
    'Stonebark Tree': 'assets/plants/stonebark-tree.webp',
    'Deepwood Protector': 'assets/plants/deepwood-protector.webp'
  }
};