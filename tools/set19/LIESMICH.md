# Set 19 von Hand (solange CommunityDragon es nicht liefert)

Seit 18.6 hat TFT einen eigenen Unreal-Client. CommunityDragon liest nur noch den LoL-Client, deshalb fehlt Set 19 in `pbe/cdragon/tft/*.json` (Stand 17.11.2026, PBE 16.24).

## Ablauf

1. Texturen aus dem PBE-Client entpacken (nur Lesen der Spieldateien, nichts wird injiziert):
   - Champion-UI, DA und CT: Muster `Set_19/Content/Champions/[^/]+/(UI/[^/]+|DA_[^/]+|CT_[^/]+)\.uasset$` → `C:\t19`
   - Dazu die ausgelagerten großen Bildstufen: `Set_19/Content/Champions/[^/]+/UI/[^/]+\.ubulk$` → `C:\t19`. tex2png nimmt die `.ubulk` neben der `.uasset` automatisch, sonst bleiben manche Bilder bei 64 px und wirken verschwommen.
   - Trait-Icons: `Set_19/Content/(Traits/[^/]+/([^/]+/)?T_[^/]*\.uasset|Traits/[^/]+/UI/[^/]+\.uasset|Champions/[^/]+/UniqueTrait/(Textures/)?T_[^/]*Icon[^/]*\.uasset)$` → `C:\t19tr2`
   - beides mit `[IoExtract]::Run(utoc, muster, ziel, oodle)` aus `tools/unreal/IoExtract.cs`
2. Nach PNG umwandeln: mit `tools/unreal/tex2png.js` (`texToPng`); Champions nach `C:\t19png\<Ordner>\`, Traits nach `C:\t19trpng\`.
3. `node tools/set19/bauen.js` schreibt `data/tft-data-19.js`, `data/tft-data-19-en.js` und `assets/img/set19/`.

## Woher die Daten kommen

| Was | Quelle |
| --- | --- |
| Champions, Kosten, Traits | Liste im Dev-Drop-Artikel (`data/news.js`) |
| Band-Trait-Stufen | Riots „Prismatic Tour Overview“ |
| Bilder | PBE-Client |
| Trait-Stufen auch für Klassen, Fähigkeiten, Unlocks, Augments (Texte) | blitz.gg (`blitz.js` → `blitz-daten.json`) |
| Grundwerte, Fähigkeitszahlen | PBE-Client (DA/CT), sonst `blitz-werte.json` |
| Deutsche Texte, die Blitz noch englisch hat | `uebersetzungen-de.json` (`champions`, `traits`, `traitTexte`, `unlocks` – hat immer Vorrang, `ersetzen`, `augments`) |
| Augment-Symbole | PBE-Client (`augment-icons.js`, Pakete in `C:\t19aug`, nachgeladene in `C:\t19aug2`/`C:\t19aug3`); Set-18-Platzhalter zählen nicht |
| Items | Standard-Items aus Set 18 (gleiche IDs) |

Offen (Stand 18.11.): Leben von Sona und Tibbers (weder Client noch Blitz).

`update-data.ps1` übernimmt die Datei in `data/sets.js` (channel "pbe"). Es überschreibt sie erst, wenn CommunityDragon selbst ein Set 19 liefert.
