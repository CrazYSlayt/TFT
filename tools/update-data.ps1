<#
  TFTClimb – offizielle Spieldaten aktualisieren
  ------------------------------------------------
  Lädt Champions, Traits, Items und Augments von CommunityDragon:
    • Live-Server  -> data\tft-data-<Set>.js   (Version fest, z. B. 16.20, damit Bild-Links stabil bleiben)
    • PBE-Server   -> data\tft-data-<Set>.js   nur wenn dort ein NEUERES Set als live läuft (z. B. Set 19)
  Ältere Sets werden nie gelöscht – sie bleiben als Archiv auf der Seite wählbar.
  Am Ende wird data\sets.js (Übersicht aller Sets für den Set-Umschalter) neu geschrieben.
  Außerdem: Rangverteilung (Ranks-Seite) von EsportsTales -> data\ranks.js
  Die Tierlist (Comps, Item-/Augment-Bewertungen) wird NICHT verändert – die pflegst du selbst.

  Aufruf (oder einfach "Daten aktualisieren.cmd" doppelklicken):
    powershell -ExecutionPolicy Bypass -File tools\update-data.ps1
  Optionen:
    -NoPbe             PBE-Server nicht prüfen
    -Set 18            bestimmtes Live-Set statt des neuesten
    -Version 16.20     bestimmte CommunityDragon-Version statt der neuesten
    -ItemPrefix DA     Präfix der Set-Items, falls die automatische Erkennung danebenliegt
    -OnlyRanks         nur die Rangverteilung aktualisieren (dauert ein paar Sekunden)
    -Publish           danach den Ordner data (und die Startseiten-Kopfdaten in index.html) automatisch committen und zu GitHub hochladen (für die geplante Aufgabe)
  Patches: Die Patch-Liste kommt von Riot (teamfighttactics.leagueoflegends.com). Pro Patch wird ein Datenstand in
  data\history\ abgelegt; fehlende Patches des Sets werden aus älteren CommunityDragon-Versionen nachgeholt.
  Daraus entsteht data\patches.js mit allen erkannten Änderungen. Eigene Kommentare: data\patch-kommentare.js.
#>
param(
  [switch]$NoPbe,
  [switch]$OnlyRanks,
  [switch]$Publish,
  [int]$Set = 0,
  [string]$Version = '',
  [string]$ItemPrefix = ''
)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$dataDir = Join-Path $root 'data'
New-Item -ItemType Directory -Force $dataDir | Out-Null
$utf8 = New-Object Text.UTF8Encoding $false
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
Add-Type -AssemblyName System.Web.Extensions
$ser = New-Object System.Web.Script.Serialization.JavaScriptSerializer
$ser.MaxJsonLength = [int]::MaxValue
$tmp = Join-Path $env:TEMP 'tftfreaks-update'; New-Item -ItemType Directory -Force $tmp | Out-Null
$today = Get-Date -Format 'yyyy-MM-dd'

function Step($msg) { Write-Host "» $msg" -ForegroundColor Cyan }
function Warn($msg) { Write-Host "  ! $msg" -ForegroundColor Yellow }
function NewObj { return New-Object 'System.Collections.Generic.Dictionary[string,object]' }
function Png($p) { if (-not $p -or ([string]$p).StartsWith('{')) { return $null }; return (([string]$p).ToLower() -replace '\.(tex|dds)$', '.png') }
# Riot speichert manche Wert-Namen nur als Hash ({7a9d7f0e} = FNV-1a des kleingeschriebenen Namens).
# Die Klarnamen stehen als Platzhalter im Beschreibungstext (@EssencePerDeath@) – daraus bauen wir die Rückübersetzung.
function Fnv([string]$s) { [uint32]$h = 2166136261; foreach ($b in [Text.Encoding]::UTF8.GetBytes($s.ToLower())) { $h = $h -bxor $b; $h = [uint32](([uint64]$h * 16777619) % 4294967296) }; return '{' + $h.ToString('x8') + '}' }
function HashNames([string[]]$texts) {
  $m = @{}
  foreach ($t in $texts) { if ($t) { foreach ($x in [regex]::Matches($t, '@([A-Za-z0-9_]+)(?:\*100)?@')) { $n = $x.Groups[1].Value; $m[(Fnv $n)] = $n } } }
  return $m
}
function Fx($eff, $names) {
  $o = NewObj
  if ($eff) { foreach ($k in $eff.Keys) {
    $v = $eff[$k]; $key = [string]$k
    if ($key.StartsWith('{')) { if ($names -and $names.ContainsKey($key)) { $key = $names[$key] } else { continue } }
    if ($null -ne $v -and ($v -is [int] -or $v -is [decimal] -or $v -is [double])) { $o[$key] = [Math]::Round([double]$v, 4) }
  } }
  return $o
}
function J($x) {
  if ($null -eq $x) { return 'null' }
  if ($x -is [bool]) { if ($x) { return 'true' } else { return 'false' } }
  if ($x -is [int] -or $x -is [double] -or $x -is [decimal] -or $x -is [long]) { return ([double]$x).ToString('R', [Globalization.CultureInfo]::InvariantCulture) }
  if ($x -is [string]) {
    $sb = New-Object Text.StringBuilder
    foreach ($ch in $x.ToCharArray()) {
      $n = [int]$ch
      if ($ch -eq '"') { [void]$sb.Append('\"') } elseif ($ch -eq '\') { [void]$sb.Append('\\') }
      elseif ($n -lt 32 -or $ch -eq '<' -or $ch -eq '>' -or $n -eq 0x2028 -or $n -eq 0x2029) { [void]$sb.Append('\u' + $n.ToString('x4')) }
      else { [void]$sb.Append($ch) }
    }
    return '"' + $sb.ToString() + '"'
  }
  if ($x -is [System.Collections.IDictionary]) { return '{' + ((@($x.Keys) | ForEach-Object { (J ([string]$_)) + ':' + (J $x[$_]) }) -join ',') + '}' }
  if ($x -is [System.Collections.IEnumerable]) { return '[' + ((@($x) | ForEach-Object { J $_ }) -join ',') + ']' }
  return J ([string]$x)
}
function Load($base, $tag, $lang) {
  $f = Join-Path $tmp "$tag-$lang.json"
  Step "Lade $tag $lang.json (ca. 25 MB) …"
  Invoke-WebRequest "$base/cdragon/tft/$lang.json" -UseBasicParsing -OutFile $f
  return $ser.DeserializeObject([IO.File]::ReadAllText($f, [Text.Encoding]::UTF8))
}
function NewestSet($EN) {
  return (@($EN['setData']) | Where-Object { $_['mutator'] -match '^TFTSet(\d+)$' } | ForEach-Object { [int]($_['mutator'] -replace '\D','') } | Measure-Object -Maximum).Maximum
}

# ======================= Ein Set aufbereiten und schreiben =======================
function Build($EN, $DE, [int]$SetNo, [string]$Channel, [string]$Ver, [string]$Base, [string]$Prefix) {
  $sdEN = @($EN['setData']) | Where-Object { $_['mutator'] -eq "TFTSet$SetNo" } | Select-Object -First 1
  $sdDE = @($DE['setData']) | Where-Object { $_['mutator'] -eq "TFTSet$SetNo" } | Select-Object -First 1
  if (-not $sdEN) { throw "Set $SetNo nicht in den Daten gefunden." }
  Write-Host "  Set $SetNo · $Channel · Version $Ver"
  $enItem = @{}; foreach ($i in $EN['items']) { $enItem[$i['apiName']] = $i }
  $deItem = @{}; foreach ($i in $DE['items']) { $deItem[$i['apiName']] = $i }

  # --- Champions (inkl. Werte, Reichweite und Fähigkeit – Texte auf Deutsch) ---
  $deChamp = @{}; foreach ($c in $sdDE['champions']) { $deChamp[[string]$c['apiName']] = $c }
  $champs = New-Object 'System.Collections.Generic.List[object]'; $prefixCount = @{}
  # Englische Texte für die englische Seite (eigene Datei tft-data-<Set>-en.js)
  $enChamps = NewObj; $enTraits = NewObj; $enItems = NewObj; $enAugs = NewObj
  foreach ($c in $sdEN['champions']) {
    $tr = @($c['traits']); $cost = [int]$c['cost']
    if ($tr.Count -eq 0 -or $cost -lt 1 -or $cost -gt 5 -or ([string]$c['name']) -match '\(') { continue }
    $o = NewObj
    $o['api'] = [string]$c['apiName']; $o['n'] = [string]$c['name']; $o['c'] = $cost
    $o['t'] = [string[]]@($tr | ForEach-Object { [string]$_ })
    $o['sq'] = Png $c['squareIcon']; $o['tile'] = Png $c['tileIcon']
    if ($deChamp[$o['api']] -and $deChamp[$o['api']]['name'] -and [string]$deChamp[$o['api']]['name'] -ne $o['n']) { $o['de'] = [string]$deChamp[$o['api']]['name'] }
    $s = $c['stats']
    if ($s) {
      $st = NewObj
      foreach ($p in @(@('hp','hp'),@('mana','mana'),@('mana0','initialMana'),@('ad','damage'),@('as','attackSpeed'),@('ar','armor'),@('mr','magicResist'),@('crit','critChance'),@('range','range'))) {
        if ($null -ne $s[$p[1]]) { $st[$p[0]] = [Math]::Round([double]$s[$p[1]], 3) }
      }
      $o['st'] = $st
    }
    $ab = $c['ability']; $abDE = $(if ($deChamp[$o['api']]) { $deChamp[$o['api']]['ability'] } else { $null })
    if ($ab -and ($ab['desc'] -or ($abDE -and $abDE['desc']))) {
      $a = NewObj
      $a['n'] = $(if ($abDE -and $abDE['name']) { [string]$abDE['name'] } else { [string]$ab['name'] })
      $a['d'] = $(if ($abDE -and $abDE['desc']) { [string]$abDE['desc'] } else { [string]$ab['desc'] })
      # Werte pro Sternestufe (nur wenn Riot sie mitliefert – in Set 18 fast nie)
      $v = NewObj
      foreach ($x in @($ab['variables'])) { if ($x -and $x['name'] -and $x['value']) { $vals = @($x['value']); if ($vals.Count -ge 4) { $v[[string]$x['name']] = [double[]]@($vals[1], $vals[2], $vals[3] | ForEach-Object { [Math]::Round([double]$_, 3) }) } } }
      if ($v.Count) { $a['v'] = $v }
      $o['ab'] = $a
      if ($ab['desc']) { $x = NewObj; $x['n'] = [string]$ab['name']; $x['d'] = [string]$ab['desc']; $enChamps[$o['api']] = $x }
    }
    $champs.Add($o)
    $p = ([string]$c['apiName'] -split '_')[0]; $prefixCount[$p] = 1 + [int]$prefixCount[$p]
  }
  $champs = @($champs | Sort-Object { $_['c'] }, { $_['n'] })
  if (-not $Prefix) { $Prefix = ($prefixCount.GetEnumerator() | Sort-Object Value -Descending | Select-Object -First 1).Key }

  # --- Traits ---
  $deTrait = @{}; foreach ($t in $sdDE['traits']) { $deTrait[$t['apiName']] = $t }
  $traits = New-Object 'System.Collections.Generic.List[object]'
  foreach ($t in $sdEN['traits']) {
    $bp = @(@($t['effects']) | Where-Object { $_ } | ForEach-Object { [int]$_['minUnits'] } | Where-Object { $_ -gt 0 } | Sort-Object -Unique)
    if ($bp.Count -eq 0) { continue }
    $d = $deTrait[$t['apiName']]
    $o = NewObj
    $o['api'] = [string]$t['apiName']; $o['n'] = [string]$t['name']
    $o['de'] = $(if ($d) { [string]$d['name'] } else { [string]$t['name'] })
    $o['bp'] = [int[]]$bp; $o['icon'] = Png $t['icon']
    $o['desc'] = $(if ($d -and $d['desc']) { [string]$d['desc'] } else { [string]$t['desc'] })
    if ($t['desc']) { $enTraits[$o['api']] = [string]$t['desc'] }
    # Werte je Stufe (z. B. 3/5/7 Units) mit entschlüsselten Namen
    $names = HashNames @([string]$t['desc'], $(if ($d) { [string]$d['desc'] } else { '' }))
    $o['fx'] = [object[]]@(@($t['effects']) | Where-Object { $_ -and [int]$_['minUnits'] -gt 0 } | ForEach-Object { $e = NewObj; $e['min'] = [int]$_['minUnits']; $e['max'] = [int]$_['maxUnits']; $e['v'] = Fx $_['variables'] $names; $e })
    $traits.Add($o)
  }

  # --- Items (Fallback-Texte: klassische TFT_Item_*-Einträge mit gleichem Icon bzw. Namen) ---
  $byIcon = @{}; $byName = @{}
  foreach ($i in $DE['items']) {
    if (-not $i['desc']) { continue }
    if ($i['icon'] -and ([string]$i['apiName']) -like 'TFT_Item_*' -and -not $byIcon.ContainsKey(([string]$i['icon']).ToLower())) { $byIcon[([string]$i['icon']).ToLower()] = $i }
    if ($i['name']) { $byName[([string]$i['name']).ToLower()] = $i }
  }
  # Welche Items gehören zum Set?
  #  a) Set-eigene Items (z. B. Set 18: alle mit "DA_"), wenn das Set eigene Komponenten/Rezepte hat
  #  b) sonst nach Kategorie aus der Set-Liste (z. B. Set 16/17: allgemeine "TFT_Item_…" + set-eigene Embleme/Artefakte)
  $setApis = @($sdEN['items'] | ForEach-Object { [string]$_ } | Where-Object { $enItem[$_] -and $enItem[$_]['name'] -and (Png $enItem[$_]['icon']) -and (Png $enItem[$_]['icon']) -notlike '*/zaps/*' -and $_ -notlike '*Augment' })
  $isComp = { param($a) @($enItem[$a]['tags']) -contains 'component' }
  $ownComps = @($setApis | Where-Object { $_.StartsWith("${Prefix}_") -and (& $isComp $_) })
  $mode = $(if ($ownComps.Count -ge 8) { 'eigen' } else { 'kategorie' })
  $pick = New-Object 'System.Collections.Generic.List[string]'
  if ($mode -eq 'eigen') { foreach ($a in $setApis) { if ($a.StartsWith("${Prefix}_")) { $pick.Add($a) } } }
  else {
    $comps = @($setApis | Where-Object { & $isComp $_ }); $compSet = @{}; foreach ($a in $comps) { $compSet[$a] = 1 }
    $crafts = @($setApis | Where-Object { $c = @($enItem[$_]['composition']); $c.Count -eq 2 -and $compSet[[string]$c[0]] -and $compSet[[string]$c[1]] })
    $craftNames = @{}; foreach ($a in $crafts) { $craftNames[[string]$enItem[$a]['name']] = 1 }
    foreach ($a in $setApis) {
      $n = [string]$enItem[$a]['name']; $tags = @($enItem[$a]['tags'])
      $ok = $compSet[$a] -or ($crafts -contains $a) -or
            ($a -match 'Radiant' -and $n -like 'Radiant *' -and $craftNames[$n.Substring(8)]) -or
            ($a -match 'Artifact|_Ornn' -and $a -notmatch 'ChampionItem|Assist|Armory|Cypher') -or
            ($a -match 'Emblem') -or
            ($tags -contains 'Consumable' -and $a -notmatch 'Assist|Armory|Cypher')
      if ($ok) { $pick.Add($a) }
    }
    # gleichnamige Items nur einmal – die set-eigene Version gewinnt
    $byN = [ordered]@{}
    foreach ($a in ($pick | Sort-Object { -not $_.StartsWith("${Prefix}_") })) { $n = [string]$enItem[$a]['name']; if (-not $byN.Contains($n)) { $byN[$n] = $a } }
    $pick = New-Object 'System.Collections.Generic.List[string]'; foreach ($v in $byN.Values) { $pick.Add($v) }
  }
  Write-Host "  Item-Erkennung: $(if ($mode -eq 'eigen') { "set-eigene Items ($Prefix`_…)" } else { 'nach Kategorie (allgemeine Items + Set-Items)' })"
  # Kategorien für die Seite: Komponente, Rezept-Item, Lichtversion (mit Basis-Item), Artefakt, Emblem, Sonstiges
  $compIds = @{}; foreach ($a in $pick) { if (& $isComp $a) { $compIds[$a] = 1 } }
  $craftByName = @{}
  foreach ($a in $pick) { $cc = @($enItem[$a]['composition']); if ($cc.Count -eq 2 -and $compIds[[string]$cc[0]] -and $compIds[[string]$cc[1]]) { $craftByName[[string]$enItem[$a]['name']] = $a } }
  $items = New-Object 'System.Collections.Generic.List[object]'
  foreach ($api in $pick) {
    $e = $enItem[$api]; $icon = Png $e['icon']
    $d = $deItem[$api]
    $isEmblem = $api -like '*Emblem*'; $isRadiant = $api -like '*Radiant*'
    $src = $d
    if (-not $isEmblem -and (-not $src -or -not $src['desc'])) {
      $cand = $null
      if ($e['icon'] -and $byIcon.ContainsKey(([string]$e['icon']).ToLower())) { $cand = $byIcon[([string]$e['icon']).ToLower()] }
      if (-not $cand -and $d -and $byName.ContainsKey(([string]$d['name']).ToLower())) { $cand = $byName[([string]$d['name']).ToLower()] }
      # Lichtversionen nur mit Lichtversions-Texten ergänzen (sonst stimmen die Werte nicht)
      if ($cand -and ($isRadiant -eq ([string]$cand['apiName'] -like '*Radiant*'))) { $src = $cand }
    }
    $o = NewObj
    $o['id'] = [string]$api; $o['en'] = [string]$e['name']; $o['de'] = $(if ($d) { [string]$d['name'] } else { [string]$e['name'] })
    $o['icon'] = $icon
    $o['comp'] = [string[]]@(@($e['composition']) | Where-Object { $_ } | ForEach-Object { [string]$_ })
    $o['desc'] = $(if (-not $isEmblem -and $src -and $src['desc']) { [string]$src['desc'] } else { $null })
    if ($o['desc']) { $srcEn = $enItem[[string]$src['apiName']]; if ($srcEn -and $srcEn['desc']) { $enItems[$o['id']] = [string]$srcEn['desc'] } }
    $o['fx'] = $(if (-not $isEmblem -and $src) { Fx $src['effects'] (HashNames @([string]$src['desc'], [string]$e['desc'])) } else { NewObj })
    $n = [string]$e['name']; $kat = 'other'
    if ($compIds[$api]) { $kat = 'component' }
    elseif ($api -match 'Emblem' -or $n -like 'Tactician*') { $kat = 'emblem' }
    elseif ($api -match 'Artifact|_Ornn') { $kat = 'artifact' }
    elseif ($n -like 'Radiant *' -and $craftByName[$n.Substring(8)]) { $kat = 'radiant'; $o['base'] = $craftByName[$n.Substring(8)] }
    elseif ($craftByName[$n] -eq $api) { $kat = 'craft' }
    $o['cat'] = $kat
    $items.Add($o)
  }
  $items = @($items | Sort-Object { $_['id'] })
  $cat = [ordered]@{}
  foreach ($k in @(@('component','Komponenten'),@('craft','Kombiniert'),@('radiant','Lichtversionen'),@('artifact','Artefakte'),@('emblem','Embleme'),@('other','Sonstige'))) { $cat[$k[1]] = @($items | Where-Object { $_['cat'] -eq $k[0] }).Count }

  # --- Augments (Stufe aus dem Icon-Namen; die Tierlist kann sie überschreiben) ---
  $augs = New-Object 'System.Collections.Generic.List[object]'
  foreach ($api in $sdEN['augments']) {
    $e = $enItem[$api]; if (-not $e -or -not $e['name']) { continue }
    $d = $deItem[$api]; $src = $(if ($d -and $d['desc']) { $d } else { $e })
    $icon = Png $e['icon']
    $lv = 0; $nm = [IO.Path]::GetFileNameWithoutExtension([string]$icon)
    if ($nm -match '(?:[-_])(i{1,3})$') { $lv = $Matches[1].Length } elseif ($nm -match '(?:t|[-_]|[a-z])([123])$') { $lv = [int]$Matches[1] }
    $o = NewObj
    $o['id'] = [string]$api; $o['en'] = [string]$e['name']; $o['de'] = $(if ($d) { [string]$d['name'] } else { [string]$e['name'] })
    $o['desc'] = $(if ($src['desc']) { [string]$src['desc'] } else { $null }); $o['fx'] = Fx $src['effects'] (HashNames @([string]$src['desc'], [string]$e['desc']))
    $o['icon'] = $icon; $o['lv'] = $lv
    if ($e['desc']) { $enAugs[$o['id']] = [string]$e['desc'] }
    $augs.Add($o)
  }
  $augs = @($augs | Sort-Object { $_['id'] })

  Write-Host ("  {0} Champions · {1} Traits · {2} Augments · Item-Präfix {3}" -f $champs.Count, $traits.Count, $augs.Count, $Prefix)
  Write-Host ("  {0} Items ({1})" -f $items.Count, (($cat.GetEnumerator() | ForEach-Object { "$($_.Name) $($_.Value)" }) -join ', '))
  foreach ($k in 'Komponenten','Kombiniert') { if ($cat[$k] -eq 0) { Warn "Keine $k gefunden – evtl. -ItemPrefix angeben." } }
  $ph = @($augs | Where-Object { $_['icon'] -like '*missing-t*' })
  if ($ph.Count) { Warn "$($ph.Count) Augments haben in Riots Daten nur ein Platzhalter-Icon – die Seite nutzt dafür eigene Icons (augmentIcons in data\custom-$SetNo.js), falls vorhanden." }

  $out = Join-Path $dataDir "tft-data-$SetNo.js"
  $sb = New-Object Text.StringBuilder
  [void]$sb.AppendLine("// TFTClimb – offizielle Spieldaten (automatisch erzeugt mit tools\update-data.ps1, nicht von Hand bearbeiten)")
  [void]$sb.AppendLine("// Quelle: CommunityDragon $Ver ($Channel) · Set $SetNo · erzeugt am $today")
  [void]$sb.AppendLine("window.TFT_DATA = {")
  [void]$sb.AppendLine("set:$SetNo, channel:$(J $Channel), version:$(J $Ver), generated:$(J $today), cdn:$(J "$Base/game/"),")
  [void]$sb.AppendLine("champions:[`n" + (($champs | ForEach-Object { J $_ }) -join ",`n") + "],")
  [void]$sb.AppendLine("traits:[`n" + (($traits | ForEach-Object { J $_ }) -join ",`n") + "],")
  [void]$sb.AppendLine("items:[`n" + (($items | ForEach-Object { J $_ }) -join ",`n") + "],")
  [void]$sb.AppendLine("augments:[`n" + (($augs | ForEach-Object { J $_ }) -join ",`n") + "]")
  [void]$sb.AppendLine("};")
  [IO.File]::WriteAllText($out, $sb.ToString(), $utf8)
  Write-Host ("  geschrieben: {0} ({1:N0} KB)" -f $out, ((Get-Item $out).Length / 1KB)) -ForegroundColor Green
  $en = NewObj; $en['champions'] = $enChamps; $en['traits'] = $enTraits; $en['items'] = $enItems; $en['augments'] = $enAugs
  $outEn = Join-Path $dataDir "tft-data-$SetNo-en.js"
  [IO.File]::WriteAllText($outEn, "// TFTClimb – englische Texte zu Set $SetNo für die englische Seite (automatisch erzeugt mit tools\update-data.ps1)`nwindow.TFT_DATA_EN = $(J $en);`n", $utf8)
  Write-Host ("  geschrieben: {0} ({1:N0} KB)" -f $outEn, ((Get-Item $outEn).Length / 1KB)) -ForegroundColor Green
}

# ======================= Rangverteilung (EsportsTales) =======================
# Eine Monatstabelle von EsportsTales lesen → @{div; apex} oder $null, wenn Werte fehlen (z. B. Sets vor Smaragd)
function ParseRankTable([string]$tb) {
  $vals = @{}
  # Zellen ohne innere Tags lesen, dann Rang + Prozentwert paarweise zuordnen
  $cells = @([regex]::Matches($tb, '(?is)<td[^>]*>(.*?)</td>') | ForEach-Object { ([Net.WebUtility]::HtmlDecode(($_.Groups[1].Value -replace '<[^>]+>', ''))).Trim() })
  for ($c = 0; $c -lt $cells.Count - 1; $c++) {
    if ($cells[$c] -match '^[A-Za-z]+(?:\s+(?:IV|III|II|I))?$' -and $cells[$c + 1] -match '^([\d.,]+)\s*%$') {
      $vals[($cells[$c].ToLower() -replace '\s+', ' ')] = [double]::Parse(($matches[1] -replace ',', '.'), [Globalization.CultureInfo]::InvariantCulture); $c++
    }
  }
  $div = NewObj; $apex = NewObj; $sum = 0.0; $missing = @()
  foreach ($t in 'iron','bronze','silver','gold','platinum','emerald','diamond') {
    # Smaragd gab es nicht in jedem Set – dann bleibt die Liste leer
    if ($t -eq 'emerald' -and -not ($vals.Keys | Where-Object { $_ -like 'emerald*' })) { $div[$t] = [double[]]@(); continue }
    $arr = @(); foreach ($d in 'iv','iii','ii','i') { $k = "$t $d"; if ($vals.ContainsKey($k)) { $arr += $vals[$k]; $sum += $vals[$k] } else { $missing += $k } }
    $div[$t] = [double[]]$arr
  }
  foreach ($t in 'master','grandmaster','challenger') { if ($vals.ContainsKey($t)) { $apex[$t] = $vals[$t]; $sum += $vals[$t] } else { $missing += $t } }
  if ($missing.Count -or $sum -lt 90 -or $sum -gt 110) { return @{ ok = $false; missing = $missing; sum = $sum } }
  return @{ ok = $true; div = $div; apex = $apex }
}

function UpdateRanks {
  Step 'Rangverteilung von EsportsTales laden …'
  $url = 'https://www.esportstales.com/teamfight-tactics/seasonal-rank-system-and-player-distribution'
  $out = Join-Path $dataDir 'ranks.js'
  try {
    $html = (Invoke-WebRequest $url -UseBasicParsing -UserAgent 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) TFTClimb-Update' -TimeoutSec 60).Content
    $months = 'January','February','March','April','May','June','July','August','September','October','November','December'
    $deMonth = @{ January='Januar'; February='Februar'; March='März'; April='April'; May='Mai'; June='Juni'; July='Juli'; August='August'; September='September'; October='Oktober'; November='November'; December='Dezember' }
    # Alle Sets der Seite (neuestes oben), darin alle Monatsüberschriften mit ihrer Tabelle
    $sets = @([regex]::Matches($html, '(?i)<h[1-4][^>]*>\s*Set\s+(\d+(?:\.\d+)?)\s*[-:]\s*([^<]+?)\s*</h[1-4]>'))
    if (-not $sets.Count) { throw 'Set-Überschrift nicht gefunden' }
    $history = New-Object System.Collections.ArrayList
    for ($i = 0; $i -lt $sets.Count; $i++) {
      $from = $sets[$i].Index; $to = $(if ($i + 1 -lt $sets.Count) { $sets[$i + 1].Index } else { $html.Length })
      $part = $html.Substring($from, $to - $from)
      foreach ($mm in [regex]::Matches($part, '(?i)<h[1-4][^>]*>\s*(' + ($months -join '|') + ')\s+(\d{4})\s*</h[1-4]>')) {
        $t0 = $part.IndexOf('<table', $mm.Index); if ($t0 -lt 0) { continue }
        $t1 = $part.IndexOf('</table>', $t0); if ($t1 -lt 0) { continue }
        $r = ParseRankTable $part.Substring($t0, $t1 - $t0)
        if (-not $r.ok) { continue }   # ältere Sets ohne Smaragd o. Ä.
        $mEn = (Get-Culture).TextInfo.ToTitleCase($mm.Groups[1].Value.ToLower())
        $h = NewObj
        $h['set'] = $sets[$i].Groups[1].Value; $h['setName'] = [Net.WebUtility]::HtmlDecode($sets[$i].Groups[2].Value)
        $h['month'] = $deMonth[$mEn] + ' ' + $mm.Groups[2].Value; $h['ym'] = '{0}-{1:00}' -f $mm.Groups[2].Value, ([array]::IndexOf($months, $mEn) + 1)
        $h['div'] = $r.div; $h['apex'] = $r.apex
        [void]$history.Add($h)
      }
    }
    if (-not $history.Count) { throw 'keine vollständige Monatstabelle gefunden' }
    $cur = $history[0]
    $o = NewObj
    $o['source'] = 'EsportsTales'; $o['url'] = $url
    $o['set'] = $cur['set']; $o['setName'] = $cur['setName']
    $o['month'] = $cur['month']; $o['checked'] = $today; $o['div'] = $cur['div']; $o['apex'] = $cur['apex']
    # Verlauf für die Stats-Seite (neuester Stand zuerst)
    $hist = New-Object System.Collections.ArrayList
    foreach ($h in $history) { $x = NewObj; foreach ($k in 'set','setName','month','ym','div','apex') { $x[$k] = $h[$k] }; [void]$hist.Add($x) }
    $o['history'] = $hist.ToArray()
    $old = $(if (Test-Path $out) { [IO.File]::ReadAllText($out, $utf8) } else { '' })
    $same = $old -match ('"month":"' + [regex]::Escape($o['month']) + '"') -and $old -match ('"set":"' + [regex]::Escape($o['set']) + '"') -and $old -match '"history"'
    [IO.File]::WriteAllText($out, "// TFTClimb – Rangverteilung für die Ranks- und Stats-Seite (automatisch erzeugt mit tools\update-data.ps1)`nwindow.TFT_RANKS = $(J $o);`n", $utf8)
    if ($same) { Write-Host "  Keine neuen Zahlen – EsportsTales steht weiter bei Set $($o['set']), $($o['month'])." }
    else { Write-Host "  Neuer Stand: Set $($o['set']), $($o['month']) · Verlauf: $($hist.Count) Monate" -ForegroundColor Green }
  } catch { Warn "Rangverteilung nicht aktualisiert ($($_.Exception.Message)) – die bisherigen Zahlen bleiben." }
}

# LP-Grenzen für Challenger und Großmeister pro Server (tactics.tools-Bestenliste). Rückfall für die Live-Abfrage unter /api/cutoffs.
function UpdateCutoffs {
  Step 'LP-Grenzen (Challenger/Großmeister) von tactics.tools laden …'
  $out = Join-Path $dataDir 'cutoffs.js'
  $ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36'
  $regions = NewObj
  foreach ($r in 'euw','eune','na','kr') {
    try {
      $c = (Invoke-WebRequest "https://tactics.tools/leaderboards/$r" -UseBasicParsing -UserAgent $ua -TimeoutSec 45).Content
      $m = [regex]::Match($c, 'Cutoffs</div>.*?challenger_solo[^>]*>\s*<div>([\d.,]+)\s*LP</div>.*?grandmaster_solo[^>]*>\s*<div>([\d.,]+)\s*LP</div>', 'Singleline')
      if (-not $m.Success) { throw 'Werte nicht gefunden' }
      $x = NewObj; $x['ch'] = [int]($m.Groups[1].Value -replace '[^\d]', ''); $x['gm'] = [int]($m.Groups[2].Value -replace '[^\d]', '')
      $regions[$r] = $x
    } catch { Warn "LP-Grenzen $r nicht geladen ($($_.Exception.Message))" }
  }
  if (-not $regions.Count) { Warn 'Keine LP-Grenzen – die bisherigen bleiben.'; return }
  $o = NewObj; $o['source'] = 'tactics.tools'; $o['url'] = 'https://tactics.tools/leaderboards/euw'; $o['checked'] = (Get-Date).ToString('yyyy-MM-ddTHH:mm'); $o['regions'] = $regions
  [IO.File]::WriteAllText($out, "// TFTClimb – LP-Grenzen für Challenger/Großmeister (automatisch erzeugt mit tools\update-data.ps1; live über /api/cutoffs)`nwindow.TFT_CUTOFFS = $(J $o);`n", $utf8)
  Write-Host ("  " + (($regions.Keys | ForEach-Object { "$($_.ToUpper()) $($regions[$_]['ch'])/$($regions[$_]['gm']) LP" }) -join ' · ')) -ForegroundColor Green
}
if ($OnlyRanks) { UpdateRanks; UpdateCutoffs; Write-Host 'Fertig.' -ForegroundColor Green; return }

# ======================= Patches =======================
$histDir = Join-Path $dataDir 'history'
$UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36'
# Patch-Artikel aus Riots News-Übersicht (eingebettete Seitendaten) lesen
function RiotPatches([string]$loc = 'de-de') {
  $html = (Invoke-WebRequest "https://teamfighttactics.leagueoflegends.com/$loc/news/game-updates/" -UseBasicParsing -UserAgent $UA -TimeoutSec 60).Content
  $json = [regex]::Match($html, '<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)</script>').Groups[1].Value
  if (-not $json) { throw 'Seitendaten nicht gefunden' }
  $found = New-Object 'System.Collections.Generic.List[object]'
  $walk = {
    param($node)
    if ($node -is [System.Collections.IDictionary]) {
      if ($node.ContainsKey('title') -and $node.ContainsKey('action') -and ([string]$node['title']) -match '(?i)patch (\d+)\.(\d+)\s*$') { $found.Add($node) }
      foreach ($v in @($node.Values)) { & $walk $v }
    } elseif ($node -is [System.Collections.IEnumerable] -and -not ($node -is [string])) { foreach ($v in $node) { & $walk $v } }
  }
  & $walk ($ser.DeserializeObject($json))
  $out = @{}
  foreach ($n in $found) {
    $m = [regex]::Match([string]$n['title'], '(?i)patch (\d+)\.(\d+)'); $id = $m.Groups[1].Value + '.' + $m.Groups[2].Value
    if ($out.ContainsKey($id)) { continue }
    $url = [string]$n['action']['payload']['url']; if ($url.StartsWith('/')) { $url = 'https://teamfighttactics.leagueoflegends.com' + $url.TrimEnd('/') + '/' }
    $date = $(if ($n['publishedAt']) { [string]$n['publishedAt'] } elseif ($n['analytics']) { [string]$n['analytics']['publishDate'] } else { '' })
    $o = NewObj
    $o['id'] = $id; $o['set'] = [int]$m.Groups[1].Value; $o['title'] = "Patch $id"; $o['url'] = $url; $o['date'] = $date.Substring(0, [Math]::Min(10, $date.Length))
    $o['teaser'] = $(if ($n['description'] -and $n['description']['body']) { [Net.WebUtility]::HtmlDecode(([string]$n['description']['body'] -replace '<[^>]+>', '')).Trim() } else { '' })
    $o['img'] = $(if ($n['media'] -and $n['media']['url']) { ([string]$n['media']['url']) -replace '\?.*$', '' } else { '' })
    $out[$id] = $o
  }
  return $out
}
# Änderungszeilen aus einem Patch-Artikel lesen: Abschnitt (z. B. "1-GOLD-EINHEIT") und Zeilen "Name – Wert: alt ⇒ neu".
# Unterpunkte ohne eigenen Namen ("Angriffstempo: 0,7 ⇒ 0,75") gehören zum übergeordneten Punkt.
# Daten einer Patch-Aktualisierung als "Tag.Monat" – deutsch "PATCH-AKTUALISIERUNG · 27. OKTOBER" wie englisch "MID-PATCH UPDATE · OCTOBER 27TH" → "27.10"
$MonthDe = @('JANUAR', 'FEBRUAR', 'MÄRZ', 'APRIL', 'MAI', 'JUNI', 'JULI', 'AUGUST', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DEZEMBER')
$MonthEn = @('JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER')
function GrpDays([string]$g) {
  $out = @()
  foreach ($part in @($g -split '·' | Select-Object -Skip 1)) {
    $t = $part.Trim().ToUpperInvariant()
    $m = [regex]::Match($t, '^(\d{1,2})\.\s+(\S+)$')
    if ($m.Success) { $i = [array]::IndexOf($MonthDe, $m.Groups[2].Value); if ($i -ge 0) { $out += ('{0}.{1}' -f [int]$m.Groups[1].Value, ($i + 1)) }; continue }
    $m = [regex]::Match($t, '^([A-Z]+)\s+(\d{1,2})')
    if ($m.Success) { $i = [array]::IndexOf($MonthEn, $m.Groups[1].Value); if ($i -ge 0) { $out += ('{0}.{1}' -f [int]$m.Groups[2].Value, ($i + 1)) } }
  }
  return $out
}
function CleanTxt([string]$s) { return ([Net.WebUtility]::HtmlDecode(($s -replace '<[^>]+>', ' ')) -replace '\s+', ' ').Trim() }
# Champion-Namen des Live-Sets (klein, ohne Apostroph) – damit verschachtelte Champions in den Patchnotes erkannt werden
function NormName([string]$s) { return ($s -replace "['’`]", '').Trim().ToLowerInvariant() }
$script:PatchChamps = @()
function PatchChanges([string]$url) {
  $html = (Invoke-WebRequest $url -UseBasicParsing -UserAgent $UA -TimeoutSec 60).Content
  $secs = New-Object 'System.Collections.Generic.List[object]'; $cur = $null
  $stack = New-Object 'System.Collections.Generic.List[object]'
  $inHead = $false; $head = ''; $pos = 0; $grp = ''; $grpBase = ''
  # Riot schreibt (v. a. auf Deutsch) manchmal den Namen als eigenen Punkt und die Werte als gleichrangige Punkte darunter
  # ("Würfelwurf", "Aufwertungskosten: 3 ⇒ 2") – der alleinstehende Name gilt dann für die folgenden Zeilen derselben Liste
  $bare = ''; $bareDepth = -1
  foreach ($m in [regex]::Matches($html, '<(/?)(ul|ol|li|h2|h3|h4)\b[^>]*>')) {
    $txt = $html.Substring($pos, $m.Index - $pos); $pos = $m.Index + $m.Length
    if ($inHead) { $head += $txt } elseif ($stack.Count) { [void]$stack[$stack.Count-1].t.Append($txt) }
    $close = $m.Groups[1].Value -eq '/'; $tag = $m.Groups[2].Value
    if ($tag -match '^h[234]$') {
      if (-not $close) { $inHead = $true; $head = '' }
      else {
        $inHead = $false; $name = CleanTxt $head; $bare = ''
        # h2 = Gruppe (z. B. "PATCH-AKTUALISIERUNG" = B-Patch, "GROSSE ÄNDERUNGEN"); ein Datum als h4 = eigene Aktualisierung dieser Gruppe.
        # Riot listet die Änderungen eines Datums manchmal direkt darunter, ohne Abschnitt wie "Champions" – dafür ein Abschnitt ohne Namen
        if ($tag -eq 'h2') { $grp = $name; $grpBase = $name; $cur = $null }
        elseif ($name -match '^\d{1,2}\.\s+\S+$' -or $name -match '^(?i)(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}(st|nd|rd|th)?$') {
          $grp = ($grpBase + ' · ' + $name).Trim(' ·')
          $cur = NewObj; $cur['sec'] = ''; $cur['grp'] = $grp; $cur['ch'] = New-Object 'System.Collections.Generic.List[object]'; $secs.Add($cur)
        }
        elseif ($name) { $cur = NewObj; $cur['sec'] = $name; $cur['grp'] = $grp; $cur['ch'] = New-Object 'System.Collections.Generic.List[object]'; $secs.Add($cur) }
      }
      continue
    }
    if ($tag -eq 'ul' -or $tag -eq 'ol') {
      if (-not $close -and $stack.Count) { $p = $stack[$stack.Count-1]; if (-not $p.lead) { $p.lead = CleanTxt $p.t.ToString() } }
      if ($close -and $stack.Count -le $bareDepth) { $bare = '' }
      continue
    }
    if (-not $close) { $stack.Add([pscustomobject]@{ t = (New-Object Text.StringBuilder); lead = '' }); continue }
    if (-not $stack.Count) { continue }
    $it = $stack[$stack.Count-1]; $stack.RemoveAt($stack.Count-1)
    $line = $(if ($it.lead) { $it.lead } else { CleanTxt $it.t.ToString() })
    if (-not $cur) { continue }
    if ($line -notmatch '⇒') {
      # kurzer Punkt ohne Wert und ohne eigene Unterliste = Name für die folgenden Wertezeilen
      if (-not $it.lead -and $line -and $line.Length -le 40 -and $line -notmatch '[:.!?]') { $bare = $line; $bareDepth = $stack.Count }
      continue
    }
    # Oberpunkte (z. B. "Camille" > "Schaden – Angriffsschaden: …"): oberster Punkt = Name, die übrigen gehören zur Bezeichnung
    $anc = @($stack | ForEach-Object { ($_.lead -replace '\s*[–:].*$', '').Trim() } | Where-Object { $_ })
    # Riot verschachtelt manchmal eigene Champions unter einen anderen (z. B. Master Yi und Tristana unter Mama Beak): der tiefste Champion wird zum Namen
    for ($k = $anc.Count - 1; $k -gt 0; $k--) { if ($script:PatchChamps -contains (NormName $anc[$k])) { $anc = @($anc[$k..($anc.Count-1)]); break } }
    if (-not $anc.Count -and $bare -and $stack.Count -eq $bareDepth -and $line -notmatch ' – ') { $anc = @($bare) }
    $mm = [regex]::Match($line, '^(?<s>.+?) – (?<l>.+?):\s*(?<o>.*?)\s*⇒\s*(?<n>.+)$')
    if (-not $mm.Success) { $mm = [regex]::Match($line, '^(?<l>[^:]+):\s*(?<o>.*?)\s*⇒\s*(?<n>.+)$') }
    if ($mm.Success) {
      $parts = @(@($anc) + @($(if ($mm.Groups['s'].Success) { $mm.Groups['s'].Value.Trim() })) + @($mm.Groups['l'].Value.Trim()) | Where-Object { $_ })
      $s = $(if ($parts.Count -gt 1) { $parts[0] } else { '' }); $l = $(if ($parts.Count -gt 1) { ($parts[1..($parts.Count-1)]) -join ' – ' } else { $parts[0] })
      $o = $mm.Groups['o'].Value.Trim()
      # "AD Form: Starting Attack Damage: 60 ⇒ 63": der Teil vor dem zweiten Doppelpunkt gehört noch zur Bezeichnung
      $om = [regex]::Match($o, '^(?<x>[^:⇒]*\p{L}[^:⇒]*):\s+(?<y>.+)$')
      if ($om.Success) {
        # ohne übergeordneten Namen ist der Teil vor dem ersten Doppelpunkt der Name ("Moonlight Ritual: Base Cost: 2 ⇒ 3")
        if (-not $s) { $s = $l; $l = $om.Groups['x'].Value.Trim() } else { $l = $l + ': ' + $om.Groups['x'].Value.Trim() }
        $o = $om.Groups['y'].Value.Trim()
      }
      $cur['ch'].Add([object[]]@($s, $l, $o, $mm.Groups['n'].Value.Trim()))
    } else { $cur['ch'].Add([object[]]@($(if ($anc.Count) { $anc[0] } else { '' }), '', '', $line)) }
  }
  $res = New-Object 'System.Collections.Generic.List[object]'
  foreach ($x in $secs) { if ($x['ch'].Count) { $x['ch'] = [object[]]$x['ch'].ToArray(); $res.Add($x) } }
  return [object[]]$res.ToArray()
}
function ReadJson($f) { return $ser.DeserializeObject([IO.File]::ReadAllText($f, [Text.Encoding]::UTF8)) }
function UpdatePatches([int]$liveSet) {
  try {
    $raw = [IO.File]::ReadAllText((Join-Path $dataDir "tft-data-$liveSet.js"), [Text.Encoding]::UTF8)
    $a = $raw.IndexOf('champions:['); $b = $raw.IndexOf('traits:[', $a)
    $script:PatchChamps = @([regex]::Matches($raw.Substring($a, $b - $a), '(?m)^\{"api":"[^"]*","n":"([^"]+)"') | ForEach-Object { NormName $_.Groups[1].Value })
  } catch { $script:PatchChamps = @() }
  Step 'Patches: Liste von Riot laden …'
  New-Item -ItemType Directory -Force $histDir | Out-Null
  $listFile = Join-Path $histDir 'patches.json'
  $all = @{}
  if (Test-Path $listFile) { foreach ($p in @(ReadJson $listFile)) { $all[[string]$p['id']] = $p } }
  $new = @()
  try {
    $riot = RiotPatches
    foreach ($id in $riot.Keys) { if ($all.ContainsKey($id)) { if ($all[$id].ContainsKey('lang')) { [void]$all[$id].Remove('lang'); [void]$all[$id].Remove('notes') }; foreach ($k in $riot[$id].Keys) { $all[$id][$k] = $riot[$id][$k] } } else { $all[$id] = $riot[$id]; $new += $id } }
    Write-Host "  $($riot.Count) Patch-Artikel bei Riot gefunden$(if ($new.Count) { ' – neu: ' + ($new -join ', ') })."
  } catch { Warn "Riot-Patchliste nicht erreichbar ($($_.Exception.Message)) – nutze die gespeicherte Liste." }
  # Neuer Patch, den Riot bisher nur auf Englisch veröffentlicht hat: vorerst die englische Fassung übernehmen (lang = en).
  # Sobald es ihn auf Deutsch gibt, ersetzt ihn beim nächsten Lauf die deutsche Fassung.
  try {
    foreach ($e in @((RiotPatches 'en-gb').Values)) { $id = [string]$e['id']; if (-not $all.ContainsKey($id) -and [int]$e['set'] -ge ($liveSet - 1)) { $e['lang'] = 'en'; $all[$id] = $e; Write-Host "  Patch $id gibt es bisher nur auf Englisch – vorerst die englische Fassung." -ForegroundColor Yellow } }
  } catch { Warn "Englische Patchliste nicht erreichbar ($($_.Exception.Message))." }
  # Änderungen aus den Artikeln des aktuellen und vorherigen Sets lesen (der neueste wird immer neu gelesen – wegen B-Patches)
  $newest = @($all.Values | Sort-Object { [string]$_['date'] } -Descending)[0]
  foreach ($p in @($all.Values | Where-Object { [int]$_['set'] -ge ($liveSet - 1) })) {
    if ($p.ContainsKey('notes') -and $p -ne $newest) { continue }
    try { $p['notes'] = PatchChanges ([string]$p['url']); $n = 0; foreach ($s in $p['notes']) { $n += @($s['ch']).Count }; Write-Host "  Patch $($p['id']): $n Änderungen gelesen." }
    catch { Warn "Patch $($p['id']) nicht lesbar: $($_.Exception.Message)" }
  }
  $sorted = @($all.Values | Sort-Object { [string]$_['date'] } -Descending)
  $show = @($sorted | Where-Object { [int]$_['set'] -ge ($liveSet - 1) })
  # Englische Fassung derselben Patches (Riots en-gb-Seite) für die englische Seite → data\patches-en.js
  try {
    $enFile = Join-Path $histDir 'patches-en.json'
    $en = @{}; if (Test-Path $enFile) { foreach ($p in @(ReadJson $enFile)) { $en[[string]$p['id']] = $p } }
    $riotEn = RiotPatches 'en-gb'
    foreach ($id in $riotEn.Keys) { if ($en.ContainsKey($id)) { foreach ($k in 'url','teaser','title') { $en[$id][$k] = $riotEn[$id][$k] } } else { $en[$id] = $riotEn[$id] } }
    foreach ($p in $show) {
      $id = [string]$p['id']; $e = $en[$id]; if (-not $e) { continue }
      if ($e.ContainsKey('notes') -and $p -ne $newest) { continue }
      try { $e['notes'] = PatchChanges ([string]$e['url']) } catch { Warn "Patch $id (englisch) nicht lesbar: $($_.Exception.Message)" }
    }
    $outEn = NewObj
    foreach ($p in $show) { $e = $en[[string]$p['id']]; if ($e) { $x = NewObj; foreach ($k in 'url','teaser','notes') { if ($e.ContainsKey($k)) { $x[$k] = $e[$k] } }; $outEn[[string]$p['id']] = $x } }
    [IO.File]::WriteAllText($enFile, (J @($en.Values)), $utf8)
    [IO.File]::WriteAllText((Join-Path $dataDir 'patches-en.js'), "// TFTClimb – Patches auf Englisch für die englische Seite (automatisch erzeugt mit tools\update-data.ps1 aus Riots englischen Patchnotes)`nwindow.TFT_PATCHES_EN = $(J $outEn);`n", $utf8)
    Write-Host ("  geschrieben: data\patches-en.js ({0} Patches auf Englisch)" -f $outEn.Count) -ForegroundColor Green
    # Patch-Aktualisierung (B-/C-Patch), die Riot bisher nur auf Englisch nachgetragen hat: vorerst die englischen Zeilen in die
    # deutsche Fassung übernehmen (en = true). Sobald Riot das Datum auf Deutsch ergänzt, ersetzt es beim nächsten Lauf diese Zeilen.
    $e = $en[[string]$newest['id']]
    if ($newest['notes'] -and $e -and $e['notes'] -and -not $newest.ContainsKey('lang')) {
      $deDays = @($newest['notes'] | Where-Object { $_['grp'] -match 'PATCH-AKTUALISIERUNG' } | ForEach-Object { GrpDays ([string]$_['grp']) })
      $add = @(@($e['notes']) | Where-Object { $_['grp'] -match 'MID-PATCH' } | Where-Object { $d = @(GrpDays ([string]$_['grp'])); $d.Count -and -not ($d | Where-Object { $deDays -contains $_ }) })
      if ($add.Count) {
        $merged = New-Object 'System.Collections.Generic.List[object]'
        foreach ($s in $add) { $x = NewObj; $x['sec'] = $s['sec']; $x['grp'] = 'PATCH-AKTUALISIERUNG · ' + ((@(GrpDays ([string]$s['grp'])) | ForEach-Object { $dm = $_ -split '\.'; '{0}. {1}' -f $dm[0], $MonthDe[[int]$dm[1] - 1] }) -join ' · '); $x['ch'] = $s['ch']; $x['en'] = $true; $merged.Add($x) }
        foreach ($s in @($newest['notes'])) { $merged.Add($s) }
        $newest['notes'] = [object[]]$merged.ToArray()
        Write-Host ("  Patch {0}: Aktualisierung vom {1} gibt es bisher nur auf Englisch – vorerst die englischen Zeilen." -f $newest['id'], (($add | ForEach-Object { GrpDays ([string]$_['grp']) } | Select-Object -Unique) -join ', ')) -ForegroundColor Yellow
      }
    }
  } catch { Warn "Englische Patchnotes nicht aktualisiert ($($_.Exception.Message)) – die bisherigen bleiben." }
  [IO.File]::WriteAllText($listFile, (J $sorted), $utf8)
  [IO.File]::WriteAllText((Join-Path $dataDir 'patches.js'), "// TFTClimb – Patches (automatisch erzeugt mit tools\update-data.ps1 aus Riots Patchnotes, nicht von Hand bearbeiten)`n// Eigene Kommentare zu Patches gehören in data\patch-kommentare.js`nwindow.TFT_PATCHES = $(J $show);`n", $utf8)
  Write-Host ("  geschrieben: data\patches.js ({0} Patches)" -f $show.Count) -ForegroundColor Green
}

# ======================= 1. Live-Server =======================
if (-not $Version) {
  Step 'Neueste Live-Version ermitteln …'
  $meta = $ser.DeserializeObject((Invoke-WebRequest 'https://raw.communitydragon.org/latest/content-metadata.json' -UseBasicParsing).Content)
  $Version = (([string]$meta['version']) -split '\.')[0..1] -join '.'
}
$liveBase = "https://raw.communitydragon.org/$Version"
try { $null = Invoke-WebRequest "$liveBase/cdragon/tft/en_us.json" -Method Head -UseBasicParsing }
catch { Warn "Version $Version nicht gefunden – nutze 'latest'."; $Version = 'latest'; $liveBase = 'https://raw.communitydragon.org/latest' }
$EN = Load $liveBase 'live' 'en_us'; $DE = Load $liveBase 'live' 'de_de'
$liveSet = $(if ($Set) { $Set } else { NewestSet $EN })
Step "Live-Set $liveSet aufbereiten …"
Build $EN $DE $liveSet 'live' $Version $liveBase $ItemPrefix
$EN = $null; $DE = $null; [GC]::Collect()

# ======================= 2. PBE-Server (nur wenn dort ein neueres Set läuft) =======================
$pbeSet = 0
if (-not $NoPbe) {
  try {
    $pmeta = $ser.DeserializeObject((Invoke-WebRequest 'https://raw.communitydragon.org/pbe/content-metadata.json' -UseBasicParsing).Content)
    $pbeVer = ((([string]$pmeta['version']) -split '\.')[0..1] -join '.') + ' PBE'
    $EN = Load 'https://raw.communitydragon.org/pbe' 'pbe' 'en_us'
    $pbeSet = NewestSet $EN
    if ($pbeSet -gt $liveSet) {
      Step "PBE: neues Set $pbeSet gefunden – aufbereiten …"
      $DE = Load 'https://raw.communitydragon.org/pbe' 'pbe' 'de_de'
      Build $EN $DE $pbeSet 'pbe' $pbeVer 'https://raw.communitydragon.org/pbe' ''
    } else { Step "PBE: kein neues Set (dort läuft ebenfalls Set $pbeSet)." }
  } catch { Warn "PBE konnte nicht geprüft werden: $($_.Exception.Message)" }
  $EN = $null; $DE = $null; [GC]::Collect()
}

# ======================= 3. Übersicht aller Sets (data\sets.js) =======================
Step 'Set-Übersicht schreiben …'
$legacy = Join-Path $dataDir 'tft-data.js'; if (Test-Path $legacy) { Remove-Item $legacy }   # alte Einzeldatei (vor dem Set-Umschalter)
$list = New-Object 'System.Collections.Generic.List[object]'
foreach ($f in (Get-ChildItem $dataDir -Filter 'tft-data-*.js' | Where-Object { $_.Name -notlike '*-en.js' })) {
  $head = (Get-Content $f.FullName -TotalCount 4 -Encoding UTF8) -join "`n"
  $m = [regex]::Match($head, 'set:(\d+), channel:"(\w+)", version:"([^"]*)", generated:"([^"]*)"')
  if (-not $m.Success) { Warn "Unbekanntes Format: $($f.Name)"; continue }
  $no = [int]$m.Groups[1].Value; $ch = $m.Groups[2].Value
  # Status: das aktuelle Live-Set ist "live", ein neueres PBE-Set "pbe", alles Ältere "archiv"
  $status = $(if ($no -eq $liveSet) { 'live' } elseif ($no -gt $liveSet -and $ch -eq 'pbe') { 'pbe' } else { 'archiv' })
  $o = NewObj
  $o['set'] = $no; $o['status'] = $status; $o['version'] = $m.Groups[3].Value; $o['generated'] = $m.Groups[4].Value; $o['file'] = $f.Name
  $list.Add($o)
}
$list = @($list | Sort-Object { $_['set'] } -Descending)
$manifest = "// TFTClimb – verfügbare Sets (automatisch erzeugt mit tools\update-data.ps1)`nwindow.TFT_SETS = [`n" + (($list | ForEach-Object { J $_ }) -join ",`n") + "`n];`n"
[IO.File]::WriteAllText((Join-Path $dataDir 'sets.js'), $manifest, $utf8)
foreach ($s in $list) { Write-Host ("  Set {0,-3} {1,-7} {2,-12} {3}" -f $s['set'], $s['status'], $s['version'], $s['generated']) }

# ======================= 4. Rangverteilung =======================
UpdateRanks
UpdateCutoffs
# ======================= 5. Patches: Liste von Riot, Archiv pro Patch, erkannte Änderungen =======================
UpdatePatches $liveSet

# ======================= 5b. Kopfdaten für Suchmaschinen: data\seo-meta.json (+ Startseite in index.html) =======================
# Liest Titel, Meta-Text, canonical usw. jeder Seite aus der fertigen Seite (tools\seo-meta.js) – neue Patches/Daten sind so sofort dabei
Step 'Kopfdaten für Suchmaschinen …'
$node = (Get-Command node -ErrorAction SilentlyContinue).Source
if (-not $node -and (Test-Path 'D:\Program Files\nodejs\node.exe')) { $node = 'D:\Program Files\nodejs\node.exe' }
if (-not $node) { Warn 'Node.js nicht gefunden – Kopfdaten nicht aktualisiert.' }
else {
  # Vorschaubilder der Tools (assets\og) – ohne Zahlen, ändern sich nur bei neuer Vorlage oder neuem Maskottchen; vor den Kopfdaten, die auf sie verweisen
  & $node (Join-Path $root 'tools\og-bilder.js'); if ($LASTEXITCODE -ne 0) { Warn 'Vorschaubilder konnten nicht erzeugt werden – die alten bleiben bestehen.' }
  & $node (Join-Path $root 'tools\seo-meta.js'); if ($LASTEXITCODE -ne 0) { Warn 'Kopfdaten konnten nicht erzeugt werden – die alten bleiben bestehen.' }
}

# ======================= 6. Optional: automatisch veröffentlichen (Ordner data und die Startseiten-Kopfdaten in index.html) =======================
if ($Publish) {
  Step 'Veröffentlichen …'
  $git = Join-Path $env:LOCALAPPDATA 'PortableGit\cmd\git.exe'
  if (-not (Test-Path $git)) { Warn 'Git nicht gefunden – nicht veröffentlicht.' }
  else {
    Push-Location $root
    & $git add -- data index.html
    & $git diff --cached --quiet -- data index.html
    if ($LASTEXITCODE -ne 0) {
      & $git commit -q -m "Automatisches Daten-Update $today" -- data index.html
      $env:GCM_INTERACTIVE = 'never'
      & $git pull -q --rebase --autostash   # die Redaktion veröffentlicht die Tierlist direkt auf GitHub (api/tierlist.js) – erst deren Stand holen
      & $git push -q
      if ($LASTEXITCODE -eq 0) { Write-Host '  Neue Daten veröffentlicht.' -ForegroundColor Green } else { Warn 'Hochladen fehlgeschlagen (Anmeldung?) – beim nächsten Mal "veröffentlichen" sagen.' }
    } else { Write-Host '  Keine neuen Daten – nichts zu veröffentlichen.' }
    Pop-Location
  }
}
Write-Host 'Fertig.' -ForegroundColor Green
