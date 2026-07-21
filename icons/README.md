# Icon Generation Instructions

This folder contains an SVG icon file (`icon.svg`) that needs to be converted to PNG format at three different sizes.

## Quick Icon Generation

### Option 1: Using Online Tools (Easiest)
1. Go to https://cloudconvert.com/svg-to-png or similar online converter
2. Upload `icon.svg`
3. Convert to PNG at these sizes:
   - 16x16 pixels → Save as `icon16.png`
   - 48x48 pixels → Save as `icon48.png`
   - 128x128 pixels → Save as `icon128.png`

### Option 2: Using ImageMagick (Command Line)
If you have ImageMagick installed:

```bash
magick icon.svg -resize 16x16 icon16.png
magick icon.svg -resize 48x48 icon48.png
magick icon.svg -resize 128x128 icon128.png
```

### Option 3: Using Inkscape (Command Line)
If you have Inkscape installed:

```bash
inkscape icon.svg --export-filename=icon16.png -w 16 -h 16
inkscape icon.svg --export-filename=icon48.png -w 48 -h 48
inkscape icon.svg --export-filename=icon128.png -w 128 -h 128
```

### Option 4: Using Browser (Manual)
1. Open `icon.svg` in Chrome or Firefox
2. Take a screenshot
3. Resize and save as PNG at the required dimensions

## Temporary Workaround

If you just want to test the extension quickly without proper icons:
1. Create simple colored PNG files at the required sizes using any image editor
2. Or use the extension without icons (Chrome will show a default icon)

The extension will work without custom icons, though it won't look as polished.
