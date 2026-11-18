// TFTClimb – Balance-Änderungen auf dem PBE (von Hand gepflegt, das Update-Skript überschreibt diese Datei NICHT).
// Riot patcht den PBE vor einem neuen Set fast täglich. Alle Updates stehen auf EINER Seite (/patches/set-19-pbe), das neueste oben.
// Die Seite erscheint nur, solange das Set in data/sets.js den Status "pbe" hat – mit dem Release (Status "live") verschwindet sie von selbst.
// Die Werte selbst trägt tools/set19/pbe-aenderungen.json in die Set-Daten ein (node tools/set19/bauen.js).
// Neues Update: oben in notes eine neue Gruppe "PBE-UPDATE N · <Datum>" (deutsch) bzw. in en.notes, date + sources ergänzen.
window.TFT_PATCHES_PBE = [{
  id: 'Set 19 PBE', set: 19, pbe: true, date: '2026-11-19',
  title: 'TFT Set 19 PBE Patch Notes',
  img: 'assets/img/news/set19/cinematic/lineup.webp',
  url: 'https://x.com/TheTruexy/status/2123119511285227920',
  teaser: 'Riot patcht den PBE fast täglich. Hier sammle ich alle Balance-Änderungen an Set 19 bis zum Release am 2. Dezember – das neueste Update oben.',
  intro: 'Hey Leute, Riot patcht den Set-19-PBE fast täglich! Ich sammle hier alle Balance-Änderungen bis zum Release am 2. Dezember – das neueste Update steht oben, die Werte auf unseren Champion-Seiten sind schon angepasst.',
  sources: [{d: '19. November', t: 'Truexy (Riot, TFT-Balancing) auf X', url: 'https://x.com/TheTruexy/status/2123119511285227920'}],
  notes: [
    {grp: 'PBE-Update 1 · 19. November', sec: 'Traits', ch: [
      ['Boy-Band', 'Tooltip', '', 'stellt jetzt klar, dass auch Embleme kopiert werden']]},
    {grp: 'PBE-Update 1 · 19. November', sec: 'Champions: 1 Gold', ch: [
      ['Kobuko', 'Passiv: Leben', '100 % des Hypes', '85 % des Hypes'],
      ['Ziggs', 'Fähigkeitsschaden (Hauptziel)', '180/270/405 AP', '155/235/355 AP'],
      ['Ziggs', 'Fähigkeitsschaden (Fläche)', '80/120/180 AP', '70/105/160 AP']]},
    {grp: 'PBE-Update 1 · 19. November', sec: 'Champions: 2 Gold', ch: [
      ['Lux', 'Fähigkeitsschaden', '330/500/800/1360 AP', '300/450/675/1150 AP'],
      ['Lux', 'Geteilter Fähigkeitsschaden', '170/255/425/725 AP', '160/240/360/610 AP'],
      ['Renata Glasc', 'Lange Fesselung', 'Gegner mit niedrigerer oder gleicher Sternestufe', 'nur Gegner mit niedrigerer Sternestufe'],
      ['Renata Glasc', 'Dauer der langen Fesselung', '6 Sekunden', '9 Sekunden'],
      ['Seraphine', 'Fähigkeitsschaden', '600/900/1350/2295 AP', '570/855/1280/2175 AP'],
      ['Seraphine', 'Schaden der hohen Note', '70/105/160/270 AP', '60/90/135/230 AP']]},
    {grp: 'PBE-Update 1 · 19. November', sec: 'Champions: 3 Gold', ch: [
      ['Evelynn', 'Teleport', '', 'Bewegt sich ihr Ziel zu Kampfbeginn zu schnell, passt sie den Teleport an und landet trotzdem neben ihm'],
      ["Kai'Sa", 'Fähigkeitsschaden', '36/54/85/145 AD', '33/50/80/135 AD'],
      ['Malzahar', 'Fähigkeitsschaden', '380/570/960/1630 AP', '355/530/850/1445 AP'],
      ['Viego', 'Fähigkeitsschaden', '36/54/86/153 AD', '34/51/82/140 AD']]},
    {grp: 'PBE-Update 1 · 19. November', sec: 'Champions: 4, 5 und 7 Gold', ch: [
      ['Jhin', 'Empfohlene Items', '', 'aktualisiert'],
      ['Nunu & Willump', 'Empfohlene Items', '', 'aktualisiert'],
      ['Teemo', 'Viraler Schaden', '110/165 AP', '90/135 AP'],
      ['Smeech', 'Beats für das erste Emblem', '40', '30'],
      ['Sona', 'Freischaltung', '', 'zählt jetzt nur Inspirationen in Spielerkämpfen'],
      ['Sona', 'Schaden der aktiven Fähigkeit', '1400/2200 AP', '1500/2400 AP']]},
    {grp: 'PBE-Update 1 · 19. November', sec: 'Augments', ch: [
      ['Management Track', 'Angebot', '', 'erscheint nur noch bei einem Spieler gleichzeitig'],
      ['Management Track', 'Gold-Chance', '60 %', '40 %'],
      ['Management Track', 'Auszahlung ab', '20 Gold', '30 Gold'],
      ['Aus Schmerz wird Leidenschaft', 'Glitzer pro Stufe', '20', '30'],
      ['Punch Line', 'Sett', '', 'kann seine Rückstöße jetzt bis zu 30 Grad nach links oder rechts lenken, um mehr Gegner zu treffen'],
      ["Tibbers! I Can't See the Stage", 'Annie: Grund-Angriffsschaden', '50', '30'],
      ["Tibbers! I Can't See the Stage", 'Annie: Fähigkeitsschaden', '155/235/375/650', '170/255/410/700'],
      ['', 'Kronen und Reifen', '', 'Kronen und Reifen desselben Traits schließen sich jetzt gegenseitig aus'],
      ['Großes Solo', 'Angebot', '', 'erscheint nur noch bei einem Spieler gleichzeitig'],
      ['Small Squad', 'Ausschluss', '', 'schließt sich jetzt mit den Heartsteel-Prismatic-Tour-Augments aus']]},
    {grp: 'PBE-Update 1 · 19. November', sec: 'Bugfixes', ch: [
      ['', 'Über 35 Bugfixes', '', 'plus Tooltip- und Effekt-Korrekturen – u. a. funktioniert Trait Ladder jetzt, Duo Queue gibt korrekt 2 Kopien derselben Komponente, und Twisted Fate gibt Beute auch ohne einmal zu rollen. Alle Details im Original-Post.']]}
  ],
  en: {
    teaser: 'Riot patches the PBE almost daily. I collect every Set 19 balance change here until the release on December 2 – newest update on top.',
    intro: 'Hey everyone, Riot patches the Set 19 PBE almost daily! I collect every balance change here until the release on December 2 – the newest update is on top, and the values on our champion pages are already updated.',
    sources: [{d: 'November 19', t: 'Truexy (Riot, TFT balance) on X', url: 'https://x.com/TheTruexy/status/2123119511285227920'}],
    notes: [
      {grp: 'PBE update 1 · November 19', sec: 'Traits', ch: [
        ['Boy Band', 'Tooltip', '', 'clarified to say that emblems are copied too']]},
      {grp: 'PBE update 1 · November 19', sec: 'Champions: 1 cost', ch: [
        ['Kobuko', 'Passive health', '100% of Hype', '85% of Hype'],
        ['Ziggs', 'Spell damage (primary target)', '180/270/405 AP', '155/235/355 AP'],
        ['Ziggs', 'Spell damage (AoE)', '80/120/180 AP', '70/105/160 AP']]},
      {grp: 'PBE update 1 · November 19', sec: 'Champions: 2 cost', ch: [
        ['Lux', 'Main spell damage', '330/500/800/1360 AP', '300/450/675/1150 AP'],
        ['Lux', 'Split spell damage', '170/255/425/725 AP', '160/240/360/610 AP'],
        ['Renata Glasc', 'Long captivate', 'enemy star level less than or equal to Renata\'s', 'enemy star level less than Renata\'s'],
        ['Renata Glasc', 'Long captivate duration', '6 seconds', '9 seconds'],
        ['Seraphine', 'Spell damage', '600/900/1350/2295 AP', '570/855/1280/2175 AP'],
        ['Seraphine', 'High note damage', '70/105/160/270 AP', '60/90/135/230 AP']]},
      {grp: 'PBE update 1 · November 19', sec: 'Champions: 3 cost', ch: [
        ['Evelynn', 'Teleport', '', 'if her target moves too fast at combat start, she now adjusts her teleport and still lands near them'],
        ["Kai'Sa", 'Spell damage', '36/54/85/145 AD', '33/50/80/135 AD'],
        ['Malzahar', 'Spell damage', '380/570/960/1630 AP', '355/530/850/1445 AP'],
        ['Viego', 'Spell damage', '36/54/86/153 AD', '34/51/82/140 AD']]},
      {grp: 'PBE update 1 · November 19', sec: 'Champions: 4, 5 and 7 cost', ch: [
        ['Jhin', 'Recommended items', '', 'updated'],
        ['Nunu & Willump', 'Recommended items', '', 'updated'],
        ['Teemo', 'Viral damage', '110/165 AP', '90/135 AP'],
        ['Smeech', 'Beats required for first emblem', '40', '30'],
        ['Sona', 'Unlock', '', 'now only counts inspirations during player combat'],
        ['Sona', 'Active damage', '1400/2200 AP', '1500/2400 AP']]},
      {grp: 'PBE update 1 · November 19', sec: 'Augments', ch: [
        ['Management Track', 'Offer', '', 'can now only appear for one player at a time'],
        ['Management Track', 'Gold chance', '60%', '40%'],
        ['Management Track', 'Cashout threshold', '20 gold', '30 gold'],
        ['Pain into Passion', 'Bling requisite per breakpoint', '20', '30'],
        ['Punch Line', 'Sett', '', 'can now angle his punchbacks up to 30 degrees left or right to hit more units'],
        ["Tibbers! I Can't See the Stage", 'Annie base AD', '50', '30'],
        ["Tibbers! I Can't See the Stage", 'Annie main spell damage', '155/235/375/650', '170/255/410/700'],
        ['', 'Crowns and circlets', '', 'all crowns and circlets of the same trait now exclude each other'],
        ['Big Solo', 'Offer', '', 'can now only appear for one player at a time'],
        ['Small Squad', 'Exclusion', '', 'now excluded with the Heartsteel Prismatic Tour augments']]},
      {grp: 'PBE update 1 · November 19', sec: 'Bug fixes', ch: [
        ['', 'More than 35 bug fixes', '', 'plus tooltip and VFX fixes – among others Trait Ladder now works, Duo Queue correctly gives 2 copies of the same component and Twisted Fate grants loot without rolling once. All details in the original post.']]}
    ]
  }
}];
