// TFT Freaks – eigene Ergänzungen zu Set 18 (von Hand gepflegt, das Update-Skript überschreibt diese Datei NICHT)
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
  // Augments, für die Riot nur ein Platzhalter-Icon liefert – eigene Icons liegen in assets/augments/<ID>.webp
  augmentIcons: ['DA_18_BlossomTraitAugment','DA_18_CovenTraitAugment','DA_18_CovenTraitAugment_LootToAP','DA_18_ElderwoodTraitAugment','DA_18_FOURcing','DA_18_FaeTraitAugment','DA_18_FloraFatalisAugment','DA_18_InfernoTraitAugment','DA_18_LunarTraitAugment','DA_18_LunarTraitAugmentPlus','DA_18_LuxAugmentII','DA_18_OnesTwosThree','DA_18_PrimalAugmentPlus_Nidalee','DA_18_PrimalAugmentPlus_Sivir','DA_18_PrimalAugment_Nidalee','DA_18_PrimalAugment_Sivir','DA_18_ResidualMagic','DA_18_ResidualMagicPlus','DA_18_ResidualMagicPlusPlus','DA_18_RiftbeastTraitAugment','DA_18_RivalsAugment','DA_18_SolarTraitAugment','DA_18_SprykinAugment','DA_18_WeightTheWorth','DA_18_WispRebatePlus','DA_18_WispRebatePlusPlus','DA_BlackthornTraitAugment','DA_BonusGift','DA_BonusGiftPlus','DA_CapitalGainsI','DA_CapitalGainsII','DA_ChampDelivery','DA_ChampDeliveryPlus','DA_ChampDeliveryPlusPlus','DA_ComponentQuest','DA_FutureFocused','DA_ItsMeBaby','DA_LoadedDice','DA_NestingAnvils','DA_NestingAnvilsPlus','DA_QuickStreaks','DA_TraitLadder','DA_VerticalityI','DA_VerticalityII','DA_VerticalityIII'],
  // Elderwood-Pflanzen (platzierbare Einheiten ohne Champion-Daten). Reihenfolge nicht ändern – Builder-Links hängen davon ab.
  plants: {
    'Lifebloom': 'assets/plants/lifebloom.webp',
    'Stonebark Tree': 'assets/plants/stonebark-tree.webp',
    'Deepwood Protector': 'assets/plants/deepwood-protector.webp'
  }
};