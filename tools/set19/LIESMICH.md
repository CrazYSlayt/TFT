# Set 19 von Hand (solange CommunityDragon es nicht liefert)

Seit 18.6 hat TFT einen eigenen Unreal-Client. CommunityDragon liest nur noch den LoL-Client, deshalb fehlt Set 19 in `pbe/cdragon/tft/*.json` (Stand 17.11.2026, PBE 16.24).

## Grundsatz

Die Set-19-Daten sind **unsere eigenen Daten**: Basisdateien in diesem Ordner, ab jetzt nur noch von Hand gepflegt – mit dem, was CrazYSlayt liefert (Riot-Patchnotes, Truexy-Posts, eigene Werte). Es werden keine Daten mehr von anderen Seiten geholt.

## Ablauf

1. Texturen aus dem PBE-Client entpacken (nur Lesen der Spieldateien, nichts wird injiziert):
   - Champion-UI, DA und CT: Muster `Set_19/Content/Champions/[^/]+/(UI/[^/]+|DA_[^/]+|CT_[^/]+)\.uasset$` → `C:\t19`
   - Dazu die ausgelagerten großen Bildstufen: `Set_19/Content/Champions/[^/]+/UI/[^/]+\.ubulk$` → `C:\t19`. tex2png nimmt die `.ubulk` neben der `.uasset` automatisch, sonst bleiben manche Bilder bei 64 px und wirken verschwommen.
   - Trait-Icons: `Set_19/Content/(Traits/[^/]+/([^/]+/)?T_[^/]*\.uasset|Traits/[^/]+/UI/[^/]+\.uasset|Champions/[^/]+/UniqueTrait/(Textures/)?T_[^/]*Icon[^/]*\.uasset)$` → `C:\t19tr2`
   - beides mit `[IoExtract]::Run(utoc, muster, ziel, oodle)` aus `tools/unreal/IoExtract.cs`
2. Nach PNG umwandeln: mit `tools/unreal/tex2png.js` (`texToPng`); Champions nach `C:\t19png\<Ordner>\`, Traits nach `C:\t19trpng\`.
3. `node tools/set19/bauen.js` schreibt `data/tft-data-19.js`, `data/tft-data-19-en.js` und `assets/img/set19/`.

## PBE-Patch einpflegen

1. Jede Änderung aus den Patchnotes in `pbe-aenderungen.json` als neues Update eintragen:
   - `werte` – Fähigkeitswerte (Schlüssel aus `ab.v` → neue Werte für 1/2/3 Sterne)
   - `texte` – Fähigkeitstexte `[alt, neu]` auf Deutsch und Englisch
   - `stats` – Grundwerte (Leben, Mana, Angriffstempo …)
   - `unlocks` – Freischaltungen (DE + EN)
   - `traits` – Trait-Texte `[alt, neu]`
   - `items` – Werte der Standard-Items aus Set 18 (`{Item-ID: {Wert: neu}}`)
   - `augments` – Augment-Texte `[alt, neu]`
2. `node tools/set19/bauen.js` – Hinweise „nicht gefunden“ prüfen.
3. Patch-Seite `data/patches-pbe.js` (DE + EN, neuestes Update oben).
4. Neu kodierte Trait-Bilder ohne Inhaltsänderung nicht committen (`git checkout -- assets/img/set19/traits`).

## Die Dateien

| Datei | Inhalt |
| --- | --- |
| `basis-texte.json` | Fähigkeiten, Unlocks, Trait-Stufen und -Texte, Augments (DE + EN) – Grundstand vom 27.11.2026 |
| `basis-werte.json` | Grundwerte, wo der PBE-Client keine liefert |
| `items-19.json` | Set-19-eigene Items: Embleme, Artefakte, Support- und Trait-Items |
| `uebersetzungen-de.json` | eigene deutsche Übersetzungen (`champions`, `traits`, `traitTexte`, `unlocks` – hat immer Vorrang, `ersetzen`, `augments`) |
| `pbe-aenderungen.json` | alle PBE-Patches seit dem Grundstand |

Weitere Quellen: Champions, Kosten, Traits aus der Liste im Dev-Drop-Artikel (`data/news.js`), Band-Trait-Stufen aus Riots „Prismatic Tour Overview“, Bilder und Augment-Symbole aus dem PBE-Client (`augment-icons.js`), Standard-Items aus Set 18 (gleiche IDs).

Offen (Stand 18.11.): Leben von Sona und Tibbers.

`update-data.ps1` übernimmt die Datei in `data/sets.js` (channel "pbe"). Es überschreibt sie erst, wenn CommunityDragon selbst ein Set 19 liefert.
