# Create minimal valid PNG files as placeholders
# This uses base64-encoded PNG data for a simple colored square

function Create-MinimalIcon {
    param(
        [int]$Size,
        [string]$OutputPath
    )
    
    # Create a simple bitmap programmatically
    Add-Type -AssemblyName System.Drawing
    
    $bmp = New-Object System.Drawing.Bitmap($Size, $Size)
    $graphics = [System.Drawing.Graphics]::FromImage($bmp)
    
    # Fill with a solid color (blue-ish)
    $color = [System.Drawing.Color]::FromArgb(255, 64, 100, 200)
    $brush = New-Object System.Drawing.SolidBrush($color)
    $graphics.FillRectangle($brush, 0, 0, $Size, $Size)
    
    # Draw a white "M" letter
    if ($Size -ge 16) {
        $fontSize = [Math]::Max(8, $Size * 0.5)
        $font = New-Object System.Drawing.Font("Arial", $fontSize, [System.Drawing.FontStyle]::Bold)
        $textBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
        $format = New-Object System.Drawing.StringFormat
        $format.Alignment = [System.Drawing.StringAlignment]::Center
        $format.LineAlignment = [System.Drawing.StringAlignment]::Center
        
        $rect = New-Object System.Drawing.RectangleF(0, 0, $Size, $Size)
        $graphics.DrawString("M", $font, $textBrush, $rect, $format)
        
        $font.Dispose()
        $textBrush.Dispose()
    }
    
    # Ensure the output directory exists and save
    $fullPath = Join-Path $PSScriptRoot $OutputPath
    $bmp.Save($fullPath, [System.Drawing.Imaging.ImageFormat]::Png)
    
    $graphics.Dispose()
    $bmp.Dispose()
    $brush.Dispose()
    
    if (Test-Path $fullPath) {
        Write-Host "Created: $OutputPath ($(Get-Item $fullPath | Select-Object -ExpandProperty Length) bytes)" -ForegroundColor Green
        return $true
    } else {
        Write-Host "Failed to create: $OutputPath" -ForegroundColor Red
        return $false
    }
}

Write-Host "Media Stream Helper - Creating Placeholder Icons" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""

$success = $true

try {
    $success = (Create-MinimalIcon -Size 16 -OutputPath "icon16.png") -and $success
    $success = (Create-MinimalIcon -Size 48 -OutputPath "icon48.png") -and $success
    $success = (Create-MinimalIcon -Size 128 -OutputPath "icon128.png") -and $success
    
    if ($success) {
        Write-Host ""
        Write-Host "SUCCESS! All placeholder icons created." -ForegroundColor Green
        Write-Host "Your Chrome extension should now load without errors." -ForegroundColor Green
        Write-Host ""
        Write-Host "NOTE: These are basic placeholder icons." -ForegroundColor Yellow
        Write-Host "For better quality icons from icon.svg:" -ForegroundColor Yellow
        Write-Host "  - Use https://cloudconvert.com/svg-to-png" -ForegroundColor Gray
        Write-Host "  - Or install ImageMagick (requires admin)" -ForegroundColor Gray
    }
} catch {
    Write-Host ""
    Write-Host "ERROR: $_" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
}
