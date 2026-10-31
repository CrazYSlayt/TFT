# Fähigkeitssymbole der Champions aus dem Unreal-Client von TFT ziehen (seit Set 18 liefert CommunityDragon keine mehr).
# Liest nur die installierten Spieldateien (.utoc/.ucas, unverschlüsselt) – das Spiel wird nicht angefasst.
# Entpacken mit der Oodle-Bibliothek, die FModel beim ersten Start herunterlädt (Pfad über -Oodle anpassbar).
#   powershell -File tools\unreal\faehigkeiten.ps1 -Set 18
#   powershell -File tools\unreal\faehigkeiten.ps1 -Set 19 -Client PBE      (neues Set auf dem PBE)
param(
  [Parameter(Mandatory = $true)][int]$Set,
  [ValidateSet('Live', 'PBE')][string]$Client = 'Live',
  [string]$Oodle = 'D:\Tools\FModel\Output\.data\oodle-data-shared.dll'
)
$ErrorActionPreference = 'Stop'
$here = $PSScriptRoot
$utoc = "C:\Riot Games\Teamfight Tactics\$Client\TFT\Content\Paks\pakchunk1-WindowsClient.utoc"
$cache = Join-Path $here 'cache'
if (-not (Test-Path $utoc)) { throw "Spieldatei nicht gefunden: $utoc" }
if (-not (Test-Path $Oodle)) { throw "Oodle-Bibliothek nicht gefunden: $Oodle (einmal FModel starten, dann liegt sie dort)" }
Add-Type -Path (Join-Path $here 'IoExtract.cs')
# 1. Champion-Dateien entpacken, 2. darin den Verweis aufs Fähigkeitssymbol finden und die Texturen entpacken, 3. als PNG speichern
$re = node (Join-Path $here 'faehigkeiten.js') da-regex $Set
[IoExtract]::Run($utoc, $re, $cache, $Oodle) | Out-Null
$re = node (Join-Path $here 'faehigkeiten.js') tex-regex $Set $cache
[IoExtract]::Run($utoc, $re, $cache, $Oodle) | Out-Null
node (Join-Path $here 'faehigkeiten.js') png $Set $cache
