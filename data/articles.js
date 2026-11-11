// TFTClimb – Artikel „TFT erklärt“ (/tft-erklaert/<adresse>, englisch /en/tft-explained/<adresse>): Mechaniken und Regeln des Spiels, nüchtern erklärt,
// dazu kurze Tipps von CrazYSlayt. Gleicher Aufbau und gleiche Blöcke wie data/guides.js (app.js: gdDataHTML, GD_BLOCK).
// frei:true = veröffentlicht (vorher nur lokal sichtbar), en:true = englische Fassung vorhanden. Ohne body = Teaser in der Übersicht („Bald“).
// Quellen stehen im Artikel (Box am Ende) – Regeln, die Riot pro Set ändern kann, mit Stand.
window.TFT_ARTICLES = [
{
  key:'ranked-reset', slug:'tft-ranked-reset', crumb:'Ranked-Reset', frei:false, date:'2026-11-11',
  t:'TFT Ranked-Reset', d:'Was zum neuen Set zurückgesetzt wird, wie die Platzierungsspiele funktionieren und wie du am besten startest.',
  title:'TFT Ranked-Reset: So funktioniert der Neustart',
  h1:['TFT Ranked-Reset:', 'So startest du ins neue Set'],
  meta:'TFT Ranked-Reset zum neuen Set: Soft Reset der MMR, 5 Platzierungsspiele ab Eisen II, kein LP-Verlust – und wie du am besten startest.',
  body:[
    {k:'lead', h:'Mit jedem neuen Set beginnt in TFT eine neue Ranked-Saison – und dein Rang fängt von vorn an. Für Set 19 ist das laut Riots Patch-Plan der <b>1. Dezember 2026</b> mit Patch 19.1. Hier steht, was dabei zurückgesetzt wird, wie die Platzierungsspiele laufen und welche Regeln danach gelten.'},
    {k:'h', id:'start', t:'TFT Ranked-Reset: das Wichtigste in Kürze'},
    {k:'stats', l:[['5', 'Platzierungsspiele zum Start', 'p'], ['Eisen II', 'dein Rang nach dem ersten Spiel', 'g'], ['bis 100 LP', 'pro Platzierungsspiel', 'p'], ['0 LP', 'Verlust in den Platzierungen', 'g']]},
        {k:'h', id:'reset', t:'Was passiert beim Ranked-Reset?'},
    {k:'p', h:'Zwei Dinge werden zurückgesetzt: dein sichtbarer <b>Rang</b> und deine versteckte <b>MMR</b>, also die Spielstärke, nach der dir das Spiel Gegner sucht. Der Rang fängt komplett neu an. Die MMR dagegen bekommt nur einen <b>Soft Reset</b>: Riot zieht sie ein Stück in Richtung Mitte, aber nicht ganz auf null. Wer letzte Saison hoch stand, trifft also schnell wieder auf stärkere Gegner.'},
    {k:'flow', l:[['Set-Start', 'Rang auf null, MMR Richtung Mitte'], ['1. Spiel', 'provisorisch Eisen II – oder bis Bronze IV, wenn du letzte Saison gerankt warst'], ['Spiel 1–5', 'Platzierung: bis 100 LP pro Spiel, kein Verlust'], ['Danach', 'normale LP – und dein Rang steht']]},
    {k:'h', id:'platzierung', t:'Platzierungsspiele: So funktionieren sie'},
    {k:'p', h:'Die ersten fünf Ranked-Partien sind <b>Platzierungsspiele</b>. Nach deinem ersten Spiel stehst du provisorisch auf <b>Eisen II</b>. Hast du letzte Saison Ranked gespielt, startest du je nach altem Rang irgendwo zwischen Eisen II und Bronze IV. Nach dem fünften Spiel bist du fest eingestuft.'},
    {k:'ranks', on:['iron', 'bronze'], cap:'Alle TFT-Ränge von Eisen bis Challenger. Nach dem ersten Platzierungsspiel stehst du auf Eisen II – mit Rang aus der Vorsaison bis Bronze IV.'},
    {k:'cmp', l:[
      {t:'In den Platzierungen', c:'g', l:['Bis zu 100 LP pro Spiel', 'Kein LP-Verlust, auch nicht auf Platz 8', 'Kein Decay']},
      {t:'Danach', c:'p', l:['Platz 1–4 bringt LP, Platz 5–8 kostet LP', 'Wie viel, hängt von deiner MMR ab', 'Bei 100 LP steigst du direkt auf']}]},
    {k:'p', h:'Weil du in den Platzierungen nichts verlieren kannst, kosten dich schlechte Partien dort nur die Chance auf mehr LP. Wie viele LP es pro Platzierung später ungefähr gibt, siehst du bei den einzelnen Rängen auf unserer Seite zu den <a class="art-a" href="/ranks">TFT Rängen</a>.'},
    {k:'h', id:'regeln', t:'Nach den Platzierungen: Diese Regeln gelten'},
    {k:'ul', l:['<b>Keine Promo-Serien:</b> Bei 100 LP steigst du direkt auf, übrige LP nimmst du mit.', '<b>Top 4 verliert nie LP:</b> Mit Platz 4 oder besser kannst du keine LP verlieren, mit Platz 5 oder schlechter keine gewinnen.', '<b>Kein Abstieg in einen tieferen Rang</b> von Eisen bis Meister – innerhalb eines Rangs kannst du aber eine Division abrutschen, etwa von Gold I auf Gold II.', '<b>Großmeister und Challenger</b> können absteigen.']},
    {k:'h4', t:'Decay ab Meister: So viele LP kostet eine Pause'},
    {k:'p', h:'Decay gibt es erst ab Meister – und auch dann nicht sofort. Jedes Spiel, das du machst, legt einen Tag „auf Vorrat“, höchstens 14. Jeden Tag ohne Spiel wird einer davon verbraucht. Erst wenn der Vorrat leer ist, verlierst du pro weiterem Tag ohne Spiel:'},
    {k:'table', head:['Rang', 'Verlust pro Tag ohne Spiel'], rows:[['Meister', '50 LP'], ['Großmeister', '150 LP'], ['Challenger', '250 LP']]},
    {k:'p', h:'Unter Meister fällst du durch Decay nicht. In den Platzierungsspielen gibt es keinen Decay.'},
    {k:'ranks', on:['master', 'grandmaster', 'challenger'], cap:'Decay gibt es nur in den drei höchsten Rängen: Meister, Großmeister und Challenger.'},
    {k:'h', id:'belohnung', t:'Ranked-Belohnungen: Was du am Saisonende bekommst'},
    {k:'p', h:'Am Ende einer Saison gibt es Ranked-Belohnungen ab <b>Gold</b>. Wer hoch genug landet, bekommt dazu einen exklusiven Victorious-Taktiker. Die Belohnungen der laufenden Saison bekommst du also nur, wenn du vor dem Reset noch hochkommst.'},
    {k:'h', id:'tipps', t:'Meine Tipps für den Ranked-Start'},
    {k:'quote', pose:'selbstbewusst', t:'Der Skill-Unterschied in den Lobbys ist am Anfang eines Sets so extrem, dass man trotzdem gut rauskommt – auch wenn mal ein Pro-Spieler dabei ist.'},
    {k:'p', h:'Ich will mich für Turniere qualifizieren, deshalb muss ich so schnell wie möglich auf Master und Challenger. Trotzdem starte ich nicht in der ersten Minute, sondern meistens ein paar Stunden nach dem Release – wenn ich mich gut fühle.'},
    {k:'rules', t:'Meine Regeln für den Ranked-Start', l:['Nicht in der ersten Minute starten – ein paar Stunden nach Release, wenn du dich gut fühlst.', 'Die ersten Partien als Lernspiele sehen: Das Set ist für alle neu.', 'Vor der Session kurz die Tierlist und die Stats checken.', 'Nach zwei, drei schlechten Partien Pause – mindestens eine halbe Stunde.']},
    {k:'next', href:'/guides/tft-ranked-guide', ic:'guides', t:'TFT Ranked Guide', d:'Tilt, Routine, Patch-Vorbereitung und der größte Fehler in deinem Rang.'},
    {k:'next', href:'/tft-set-19', ic:'newset', s:'Set 19', t:'Alles zu TFT Set 19', d:'Termine, Champions, Traits und Augments des neuen Sets.'},
    {k:'box', h:'<b>Stand:</b> Riots offizielle Ranked-FAQ (März 2026) und der Patch-Plan von Set 18. Riot kann einzelne Regeln mit einem neuen Set ändern – dann passen wir den Artikel an.'},
    {k:'h', id:'faq', t:'Häufige Fragen zum TFT Ranked-Reset'},
    {k:'faq', l:[
      ['Wann ist der Ranked-Reset in TFT?', 'Mit dem Start eines neuen Sets. Für Set 19 ist das laut Riots Patch-Plan der 1. Dezember 2026 mit Patch 19.1.'],
      ['Wie viele Platzierungsspiele gibt es in TFT?', 'Fünf. Nach dem ersten Spiel stehst du provisorisch auf Eisen II, nach dem fünften bist du fest eingestuft.'],
      ['Verliert man in TFT-Platzierungsspielen LP?', 'Nein. In den Platzierungsspielen gibt es nur LP dazu, bis zu 100 pro Spiel – auch Platz 8 kostet nichts.'],
      ['Wird die MMR in TFT komplett zurückgesetzt?', 'Nein. Die MMR bekommt einen Soft Reset: Sie wird in Richtung Mitte gezogen, aber nicht ganz zurückgesetzt.'],
      ['Kann man in TFT absteigen?', 'Von Eisen bis Meister nicht in einen tieferen Rang, nur innerhalb eines Rangs um eine Division. Großmeister und Challenger können absteigen.']]}
  ]
},
{key:'lp-mmr', slug:'tft-lp-mmr', t:'TFT LP & MMR', d:'Sichtbarer Rang, versteckte Spielstärke und warum du mal mehr, mal weniger LP bekommst.'},
{key:'gold-zinsen', slug:'tft-gold-zinsen', t:'TFT Gold, Zinsen & Serien', d:'Woher dein Gold kommt und welche Regeln dein Einkommen bestimmen.'},
{key:'champion-pool', slug:'tft-champion-pool', t:'TFT Champion-Pool', d:'Gemeinsamer Pool, verfügbare Kopien und was passiert, wenn mehrere dieselbe Unit suchen.'},
{key:'statistiken', slug:'tft-statistiken-lesen', t:'TFT-Statistiken lesen', d:'Durchschnittsplatzierung, Top-4-Rate, Winrate und warum die Stichprobe zählt.'}
];
