# Texterkennung mit der in Windows eingebauten OCR (Windows.Media.Ocr) – Bild rein, Zeilen mit Position raus (JSON)
#   powershell -File tools\set19\ocr.ps1 <bild.jpg|png> [<ausgabe.json>]
param([Parameter(Mandatory = $true)][string]$Bild, [string]$Aus)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Runtime.WindowsRuntime
$null = [Windows.Storage.StorageFile, Windows.Storage, ContentType = WindowsRuntime]
$null = [Windows.Media.Ocr.OcrEngine, Windows.Foundation, ContentType = WindowsRuntime]
$null = [Windows.Graphics.Imaging.BitmapDecoder, Windows.Foundation, ContentType = WindowsRuntime]
$null = [Windows.Globalization.Language, Windows.Globalization, ContentType = WindowsRuntime]
$asTask = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1' })[0]
function Await($op, [Type]$t) { $task = $asTask.MakeGenericMethod($t).Invoke($null, @($op)); $task.Wait(-1) | Out-Null; $task.Result }
$file = Await ([Windows.Storage.StorageFile]::GetFileFromPathAsync((Resolve-Path $Bild).Path)) ([Windows.Storage.StorageFile])
$stream = Await ($file.OpenAsync([Windows.Storage.FileAccessMode]::Read)) ([Windows.Storage.Streams.IRandomAccessStream])
$dec = Await ([Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($stream)) ([Windows.Graphics.Imaging.BitmapDecoder])
$bmp = Await ($dec.GetSoftwareBitmapAsync()) ([Windows.Graphics.Imaging.SoftwareBitmap])
$eng = [Windows.Media.Ocr.OcrEngine]::TryCreateFromLanguage([Windows.Globalization.Language]::new('en-US'))
if (-not $eng) { $eng = [Windows.Media.Ocr.OcrEngine]::TryCreateFromUserProfileLanguages() }
$res = Await ($eng.RecognizeAsync($bmp)) ([Windows.Media.Ocr.OcrResult])
$lines = foreach ($l in $res.Lines) { $w = @($l.Words); $x = ($w | ForEach-Object { $_.BoundingRect.X } | Measure-Object -Minimum).Minimum; $y = ($w | ForEach-Object { $_.BoundingRect.Y } | Measure-Object -Minimum).Minimum
  [pscustomobject]@{x = [int]$x; y = [int]$y; t = $l.Text} }
$json = $lines | ConvertTo-Json -Compress
if ($Aus) { [IO.File]::WriteAllText($Aus, $json, (New-Object System.Text.UTF8Encoding($false))) } else { $json }
$stream.Dispose()
