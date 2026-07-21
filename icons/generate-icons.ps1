# Icon Generator Script for Windows
# This script helps generate PNG icons from the SVG source

Write-Host "Media Stream Helper - Icon Generator" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

$svgPath = Join-Path $PSScriptRoot "icon.svg"

# Check if SVG exists
if (-not (Test-Path $svgPath)) {
    Write-Host "ERROR: icon.svg not found!" -ForegroundColor Red
    Write-Host "Make sure you're running this script from the icons/ folder" -ForegroundColor Yellow
    exit 1
}

Write-Host "Found icon.svg" -ForegroundColor Green
Write-Host ""

# Check for ImageMagick
Write-Host "Checking for ImageMagick..." -ForegroundColor Yellow
$hasMagick = Get-Command magick -ErrorAction SilentlyContinue

if ($hasMagick) {
    Write-Host "ImageMagick found! Generating icons..." -ForegroundColor Green
    Write-Host ""
    
    # Generate icons
    Write-Host "Creating icon16.png..."
    & magick $svgPath -resize 16x16 "icon16.png"
    
    Write-Host "Creating icon48.png..."
    & magick $svgPath -resize 48x48 "icon48.png"
    
    Write-Host "Creating icon128.png..."
    & magick $svgPath -resize 128x128 "icon128.png"
    
    Write-Host ""
    Write-Host "Icons generated successfully!" -ForegroundColor Green
    Write-Host "Files created:" -ForegroundColor Cyan
    Write-Host "  - icon16.png"
    Write-Host "  - icon48.png"
    Write-Host "  - icon128.png"
} else {
    Write-Host "ImageMagick not found." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "OPTIONS:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1. Install ImageMagick (Recommended)" -ForegroundColor Yellow
    Write-Host "   Using Chocolatey:"
    Write-Host "   choco install imagemagick" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   Manual download:"
    Write-Host "   https://imagemagick.org/script/download.php#windows" -ForegroundColor Gray
    Write-Host ""
    Write-Host "2. Use Online Converter (Quickest)" -ForegroundColor Yellow
    Write-Host "   a. Go to: https://cloudconvert.com/svg-to-png" -ForegroundColor Gray
    Write-Host "   b. Upload icon.svg"
    Write-Host "   c. Convert to PNG at these sizes:"
    Write-Host "      - 16x16 pixels -> save as icon16.png"
    Write-Host "      - 48x48 pixels -> save as icon48.png"
    Write-Host "      - 128x128 pixels -> save as icon128.png"
    Write-Host "   d. Save all files to this folder"
    Write-Host ""
    Write-Host "3. Use Inkscape" -ForegroundColor Yellow
    Write-Host "   Download from: https://inkscape.org/" -ForegroundColor Gray
    Write-Host "   Then use File -> Export PNG"
    Write-Host ""
    
    # Offer to open browser
    Write-Host ""
    $openBrowser = Read-Host "Open CloudConvert in your browser? (Y/N)"
    if ($openBrowser -eq "Y" -or $openBrowser -eq "y") {
        Start-Process "https://cloudconvert.com/svg-to-png"
        Write-Host "Opening browser..." -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
