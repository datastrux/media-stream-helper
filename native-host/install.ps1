# Native Host Installer for Media Stream Helper
# This script installs the native messaging host for Chrome/Edge on Windows

Write-Host "Media Stream Helper - Native Host Installer" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

# Get the absolute path to the native host directory
$nativeHostDir = $PSScriptRoot
$pythonScript = Join-Path $nativeHostDir "media_downloader.py"
$manifestTemplate = Join-Path $nativeHostDir "com.media_stream_helper.downloader.json"

# Check if Python is available
Write-Host "Checking for Python..." -ForegroundColor Yellow
try {
    $pythonVersion = & python --version 2>&1
    Write-Host "Found: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Python not found!" -ForegroundColor Red
    Write-Host "Please install Python 3.7+ from https://www.python.org/" -ForegroundColor Yellow
    Write-Host "Make sure to check 'Add Python to PATH' during installation" -ForegroundColor Yellow
    exit 1
}

# Check if FFmpeg is available
Write-Host "Checking for FFmpeg..." -ForegroundColor Yellow
try {
    $ffmpegVersion = & ffmpeg -version 2>&1 | Select-Object -First 1
    Write-Host "Found: $ffmpegVersion" -ForegroundColor Green
} catch {
    Write-Host "WARNING: FFmpeg not found!" -ForegroundColor Yellow
    Write-Host "The extension will work but downloads will fail without FFmpeg." -ForegroundColor Yellow
    Write-Host "Install FFmpeg using: choco install ffmpeg" -ForegroundColor Yellow
    Write-Host "Or download from: https://ffmpeg.org/" -ForegroundColor Yellow
    Write-Host ""
}

# Check if manifest template exists
if (-not (Test-Path $manifestTemplate)) {
    Write-Host "ERROR: Manifest template not found at $manifestTemplate" -ForegroundColor Red
    exit 1
}

# Check if Python script exists
if (-not (Test-Path $pythonScript)) {
    Write-Host "ERROR: Python script not found at $pythonScript" -ForegroundColor Red
    exit 1
}

# Ask user to provide Extension ID
Write-Host ""
Write-Host "To complete installation, you need the Chrome Extension ID." -ForegroundColor Yellow
Write-Host ""
Write-Host "How to find your Extension ID:" -ForegroundColor Cyan
Write-Host "1. Open Chrome and go to: chrome://extensions/" -ForegroundColor Gray
Write-Host "2. Enable 'Developer mode' (top right toggle)" -ForegroundColor Gray
Write-Host "3. Find 'Media Stream Helper' in the list" -ForegroundColor Gray
Write-Host "4. The ID is shown below the extension name (long string like 'abcdefgh...')" -ForegroundColor Gray
Write-Host ""

$extensionId = Read-Host "Enter your Extension ID"

if ([string]::IsNullOrWhiteSpace($extensionId)) {
    Write-Host "ERROR: Extension ID cannot be empty" -ForegroundColor Red
    exit 1
}

# Validate extension ID format (32 lowercase letters)
if ($extensionId -notmatch '^[a-z]{32}$') {
    Write-Host "WARNING: Extension ID format looks unusual." -ForegroundColor Yellow
    Write-Host "Extension IDs are usually 32 lowercase letters." -ForegroundColor Yellow
    $continue = Read-Host "Continue anyway? (Y/N)"
    if ($continue -ne 'Y' -and $continue -ne 'y') {
        Write-Host "Installation cancelled." -ForegroundColor Yellow
        exit 0
    }
}

# Create manifest with the actual extension ID
Write-Host ""
Write-Host "Creating native messaging manifest..." -ForegroundColor Yellow

# Create batch file launcher (Windows needs this to execute Python)
$batchFile = Join-Path $nativeHostDir "media_downloader_host.bat"
$batchContent = @"
@echo off
REM Native Messaging Host Launcher for Media Stream Helper
python "%~dp0media_downloader.py" %*
"@
$batchContent | Out-File -FilePath $batchFile -Encoding ASCII

Write-Host "Created batch launcher at: $batchFile" -ForegroundColor Green

$manifestContent = Get-Content $manifestTemplate -Raw
$manifestContent = $manifestContent -replace 'EXTENSION_ID_PLACEHOLDER', $extensionId

# Update path to use absolute path to batch file (not Python script)
$manifestJson = $manifestContent | ConvertFrom-Json
$manifestJson.path = $batchFile
$manifestContent = $manifestJson | ConvertTo-Json -Depth 10

# Save manifest to registry location
$manifestName = "com.media_stream_helper.downloader.json"
$manifestPath = Join-Path $nativeHostDir $manifestName
$manifestContent | Out-File -FilePath $manifestPath -Encoding UTF8

Write-Host "Manifest created at: $manifestPath" -ForegroundColor Green

# Register with Chrome
Write-Host ""
Write-Host "Registering with Chrome..." -ForegroundColor Yellow

$registryPath = "HKCU:\Software\Google\Chrome\NativeMessagingHosts\com.media_stream_helper.downloader"

# Create registry key
if (-not (Test-Path $registryPath)) {
    New-Item -Path $registryPath -Force | Out-Null
}

# Set default value to manifest path
Set-ItemProperty -Path $registryPath -Name "(Default)" -Value $manifestPath

Write-Host "Registered with Chrome at: $registryPath" -ForegroundColor Green

# Also register with Edge if it exists
$edgeRegistryPath = "HKCU:\Software\Microsoft\Edge\NativeMessagingHosts\com.media_stream_helper.downloader"
if (Test-Path "HKCU:\Software\Microsoft\Edge") {
    Write-Host "Registering with Microsoft Edge..." -ForegroundColor Yellow
    
    if (-not (Test-Path $edgeRegistryPath)) {
        New-Item -Path $edgeRegistryPath -Force | Out-Null
    }
    
    Set-ItemProperty -Path $edgeRegistryPath -Name "(Default)" -Value $manifestPath
    Write-Host "Registered with Edge at: $edgeRegistryPath" -ForegroundColor Green
}

Write-Host ""
Write-Host "Installation Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "The native messaging host has been installed." -ForegroundColor Green
Write-Host "Restart Chrome/Edge for changes to take effect." -ForegroundColor Yellow
Write-Host ""
Write-Host "You can now use the 'Download & Merge' feature in the extension." -ForegroundColor Cyan
Write-Host ""

pause
