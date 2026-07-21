# Create simple placeholder PNG icons using .NET
Add-Type -AssemblyName System.Drawing

function Create-PlaceholderIcon {
    param(
        [int]$Size,
        [string]$OutputPath
    )
    
    $bitmap = New-Object System.Drawing.Bitmap($Size, $Size)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    
    # Fill with a blue-ish background
    $bgBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(64, 100, 200))
    $graphics.FillRectangle($bgBrush, 0, 0, $Size, $Size)
    
    # Add white "M" text for Media
    $font = New-Object System.Drawing.Font("Arial", [int]($Size * 0.6), [System.Drawing.FontStyle]::Bold)
    $textBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
    $format = New-Object System.Drawing.StringFormat
    $format.Alignment = [System.Drawing.StringAlignment]::Center
    $format.LineAlignment = [System.Drawing.StringAlignment]::Center
    
    $rect = New-Object System.Drawing.RectangleF(0, 0, $Size, $Size)
    $graphics.DrawString("M", $font, $textBrush, $rect, $format)
    
    # Save as PNG
    $bitmap.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    
    # Cleanup
    $graphics.Dispose()
    $bitmap.Dispose()
    $font.Dispose()
    $textBrush.Dispose()
    $bgBrush.Dispose()
    
    Write-Host "Created: $OutputPath" -ForegroundColor Green
}

Write-Host "Creating placeholder icons..." -ForegroundColor Cyan

try {
    Create-PlaceholderIcon -Size 16 -OutputPath "icon16.png"
    Create-PlaceholderIcon -Size 48 -OutputPath "icon48.png"
    Create-PlaceholderIcon -Size 128 -OutputPath "icon128.png"
    
    Write-Host ""
    Write-Host "SUCCESS! Placeholder icons created." -ForegroundColor Green
    Write-Host "Your extension will now load in Chrome." -ForegroundColor Green
    Write-Host ""
    Write-Host "NOTE: These are placeholder icons." -ForegroundColor Yellow
    Write-Host "To create proper icons from icon.svg, you can:" -ForegroundColor Yellow
    Write-Host "  1. Use an online converter like cloudconvert.com" -ForegroundColor Gray
    Write-Host "  2. Install ImageMagick (requires admin)" -ForegroundColor Gray
} catch {
    Write-Host "ERROR: $_" -ForegroundColor Red
    Write-Host "Falling back to online converter instructions..." -ForegroundColor Yellow
}
