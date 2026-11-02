# Riots empfohlene Items (je Rolle) und die Rollen-Symbole aus dem Unreal-Client von TFT ziehen → data/rollen-<Set>.js, assets/icons/tft/roles/
# Liest nur die installierten Spieldateien (.utoc/.ucas, unverschlüsselt) – das Spiel wird nicht angefasst. Oodle wie bei faehigkeiten.ps1.
#   powershell -File tools\unreal\empfehlungen.ps1 -Set 18
#   powershell -File tools\unreal\empfehlungen.ps1 -Set 19 -Client PBE
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
# 1. Champion-Dateien (DA_…) und alles unter Item_Shared/Role (Rollen, Empfehlungstabellen, Symbole) entpacken, 2. auswerten
$re = node (Join-Path $here 'faehigkeiten.js') da-regex $Set
[IoExtract]::Run($utoc, $re, $cache, $Oodle) | Out-Null
[IoExtract]::Run($utoc, '(?i)Item_Shared/Content/Role/', $cache, $Oodle) | Out-Null
node (Join-Path $here 'empfehlungen.js') $Set $cache
