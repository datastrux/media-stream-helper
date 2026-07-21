# Uninstaller for Media Stream Helper Native Host

Write-Host "Media Stream Helper - Native Host Uninstaller" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""

# Remove Chrome registry entry
$chromeRegistryPath = "HKCU:\Software\Google\Chrome\NativeMessagingHosts\com.media_stream_helper.downloader"
if (Test-Path $chromeRegistryPath) {
    Remove-Item -Path $chromeRegistryPath -Recurse -Force
    Write-Host "Removed Chrome registry entry" -ForegroundColor Green
} else {
    Write-Host "Chrome registry entry not found" -ForegroundColor Yellow
}

# Remove Edge registry entry
$edgeRegistryPath = "HKCU:\Software\Microsoft\Edge\NativeMessagingHosts\com.media_stream_helper.downloader"
if (Test-Path $edgeRegistryPath) {
    Remove-Item -Path $edgeRegistryPath -Recurse -Force
    Write-Host "Removed Edge registry entry" -ForegroundColor Green
} else {
    Write-Host "Edge registry entry not found" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Uninstallation complete!" -ForegroundColor Green
Write-Host "You can safely delete the native-host folder if desired." -ForegroundColor Gray
Write-Host ""

pause
