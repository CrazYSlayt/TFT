@echo off
rem Climb TFT – offizielle Spieldaten von CommunityDragon aktualisieren (Champions, Traits, Items, Augments)
chcp 65001 >nul
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\update-data.ps1" %*
echo.
pause
