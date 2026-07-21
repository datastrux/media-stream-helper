# Quick Fix for Native Host Path
# This updates the registry to point to the batch file instead of Python script

Write-Host "Media Stream Helper - Registry Path Fix" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""

$nativeHostDir = $PSScriptRoot
$manifestPath = Join-Path $nativeHostDir "com.media_stream_helper.downloader.json"

if (-not (Test-Path $manifestPath)) {
    Write-Host "ERROR: Manifest file not found!" -ForegroundColor Red
    Write-Host "Please run install.ps1 first." -ForegroundColor Yellow
    exit 1
}

Write-Host "Updating Chrome registry entry..." -ForegroundColor Yellow
$chromeRegistryPath = "HKCU:\Software\Google\Chrome\NativeMessagingHosts\com.media_stream_helper.downloader"
if (Test-Path $chromeRegistryPath) {
    Set-ItemProperty -Path $chromeRegistryPath -Name "(Default)" -Value $manifestPath
    Write-Host "Updated Chrome registry" -ForegroundColor Green
} else {
    Write-Host "Chrome registry entry not found - run install.ps1" -ForegroundColor Yellow
}

Write-Host "Updating Edge registry entry..." -ForegroundColor Yellow
$edgeRegistryPath = "HKCU:\Software\Microsoft\Edge\NativeMessagingHosts\com.media_stream_helper.downloader"
if (Test-Path $edgeRegistryPath) {
    Set-ItemProperty -Path $edgeRegistryPath -Name "(Default)" -Value $manifestPath
    Write-Host "Updated Edge registry" -ForegroundColor Green
} else {
    Write-Host "Edge registry entry not found (OK if not using Edge)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Registry updated successfully!" -ForegroundColor Green
Write-Host "Restart Chrome/Edge for changes to take effect." -ForegroundColor Yellow
Write-Host ""

pause
