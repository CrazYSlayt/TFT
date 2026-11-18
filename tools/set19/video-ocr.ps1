# Riots PBE-Rundown: an jedem Haltepunkt (nach dem Scrollen, D:\Tools\video\set19\stops.txt) ein Standbild in voller Auflösung ziehen
# und mit tools\set19\ocr.ps1 lesen → D:\Tools\video\set19\stops\<sekunde>.jpg/.json
$ErrorActionPreference = 'Stop'
$d = 'D:\Tools\video\set19'; $ff = (Get-ChildItem 'D:\Tools\video\ffmpeg' -Recurse -Filter ffmpeg.exe | Select-Object -First 1).FullName
$out = Join-Path $d 'stops2'; New-Item -ItemType Directory -Force $out | Out-Null
$ocr = Join-Path $PSScriptRoot 'ocr.ps1'
$stops = (Get-Content (Join-Path $d 'stops.txt')) -split ';' | ForEach-Object { [double]::Parse($_, [Globalization.CultureInfo]::InvariantCulture) }
$i = 0
foreach ($t in $stops) {
  $i++; $n = ('{0:00000}' -f [int]$t); $jpg = Join-Path $out "$n.jpg"; $js = Join-Path $out "$n.json"
  if (-not (Test-Path $jpg)) { & $ff -hide_banner -loglevel error -ss $t.ToString([Globalization.CultureInfo]::InvariantCulture) -i (Join-Path $d 'rundown.mp4') -frames:v 1 -q:v 2 -y $jpg }
  if (-not (Test-Path $js)) { powershell -NoProfile -ExecutionPolicy Bypass -File $ocr $jpg $js }
  if ($i % 20 -eq 0) { Write-Host "$i / $($stops.Count)" }
}
Write-Host "fertig: $i"
