<#
  TFT Freaks – offizielle Spieldaten aktualisieren
  ------------------------------------------------
  Lädt Champions, Traits, Items und Augments von CommunityDragon:
    • Live-Server  -> data\tft-data-<Set>.js   (Version fest, z. B. 16.20, damit Bild-Links stabil bleiben)
    • PBE-Server   -> data\tft-data-<Set>.js   nur wenn dort ein NEUERES Set als live läuft (z. B. Set 19)
  Ältere Sets werden nie gelöscht – sie bleiben als Archiv auf der Seite wählbar.
  Am Ende wird data\sets.js (Übersicht aller Sets für den Set-Umschalter) neu geschrieben.
  Die Tierlist (Comps, Item-/Augment-Bewertungen) wird NICHT verändert – die pflegst du selbst.

  Aufruf (oder einfach "Daten aktualisieren.cmd" doppelklicken):
    powershell -ExecutionPolicy Bypass -File tools\update-data.ps1
  Optionen:
    -NoPbe             PBE-Server nicht prüfen
    -Set 18            bestimmtes Live-Set statt des neuesten
    -Version 16.20     bestimmte CommunityDragon-Version statt der neuesten
    -ItemPrefix DA     Präfix der Set-Items, falls die automatische Erkennung danebenliegt
#>
param(
  [switch]$NoPbe,
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
function Fx($eff) {
  $o = NewObj
  if ($eff) { foreach ($k in $eff.Keys) { $v = $eff[$k]; if ($null -ne $v -and -not ([string]$k).StartsWith('{') -and ($v -is [int] -or $v -is [decimal] -or $v -is [double])) { $o[[string]$k] = [Math]::Round([double]$v, 4) } } }
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

  # --- Champions ---
  $champs = New-Object 'System.Collections.Generic.List[object]'; $prefixCount = @{}
  foreach ($c in $sdEN['champions']) {
    $tr = @($c['traits']); $cost = [int]$c['cost']
    if ($tr.Count -eq 0 -or $cost -lt 1 -or $cost -gt 5 -or ([string]$c['name']) -match '\(') { continue }
    $o = NewObj
    $o['api'] = [string]$c['apiName']; $o['n'] = [string]$c['name']; $o['c'] = $cost
    $o['t'] = [string[]]@($tr | ForEach-Object { [string]$_ })
    $o['sq'] = Png $c['squareIcon']; $o['tile'] = Png $c['tileIcon']
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
    $o['fx'] = $(if (-not $isEmblem -and $src) { Fx $src['effects'] } else { NewObj })
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
    $o['desc'] = $(if ($src['desc']) { [string]$src['desc'] } else { $null }); $o['fx'] = Fx $src['effects']
    $o['icon'] = $icon; $o['lv'] = $lv
    $augs.Add($o)
  }
  $augs = @($augs | Sort-Object { $_['id'] })

  Write-Host ("  {0} Champions · {1} Traits · {2} Augments · Item-Präfix {3}" -f $champs.Count, $traits.Count, $augs.Count, $Prefix)
  Write-Host ("  {0} Items ({1})" -f $items.Count, (($cat.GetEnumerator() | ForEach-Object { "$($_.Name) $($_.Value)" }) -join ', '))
  foreach ($k in 'Komponenten','Kombiniert') { if ($cat[$k] -eq 0) { Warn "Keine $k gefunden – evtl. -ItemPrefix angeben." } }
  $ph = @($augs | Where-Object { $_['icon'] -like '*missing-t*' })
  if ($ph.Count) { Warn "$($ph.Count) Augments haben in Riots Daten nur ein Platzhalter-Icon – die Seite nutzt dafür eigene Icons (AUG_IMG in index.html), falls vorhanden." }

  $out = Join-Path $dataDir "tft-data-$SetNo.js"
  $sb = New-Object Text.StringBuilder
  [void]$sb.AppendLine("// TFT Freaks – offizielle Spieldaten (automatisch erzeugt mit tools\update-data.ps1, nicht von Hand bearbeiten)")
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
foreach ($f in Get-ChildItem $dataDir -Filter 'tft-data-*.js') {
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
$manifest = "// TFT Freaks – verfügbare Sets (automatisch erzeugt mit tools\update-data.ps1)`nwindow.TFT_SETS = [`n" + (($list | ForEach-Object { J $_ }) -join ",`n") + "`n];`n"
[IO.File]::WriteAllText((Join-Path $dataDir 'sets.js'), $manifest, $utf8)
foreach ($s in $list) { Write-Host ("  Set {0,-3} {1,-7} {2,-12} {3}" -f $s['set'], $s['status'], $s['version'], $s['generated']) }
Write-Host 'Fertig.' -ForegroundColor Green
