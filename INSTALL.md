# Installation Guide - Media Stream Helper

This guide covers the complete installation process for the Media Stream Helper Chrome extension with native messaging support.

## Overview

Media Stream Helper has two components:

1. **Chrome Extension** - Detects media streams in your browser
2. **Native Host (Optional)** - Python script that handles automatic downloads and merging

## Part 1: Install Chrome Extension

### Step 1: Load Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right corner)
3. Click **Load unpacked**
4. Select the `media-stream-helper` folder
5. The extension should now appear in your extensions list

### Step 2: Note Your Extension ID

1. Find "Media Stream Helper" in the extensions list
2. Look below the extension name - you'll see an ID like `abcdefghijklmnopqrstuvwxyzabcdef` (32 characters)
3. **Copy this ID** - you'll need it for native host setup

### Step 3: Test Basic Functionality

1. Visit a webpage with media content
2. Click the Media Stream Helper icon in your toolbar
3. You should see detected media streams
4. Click "Copy FFmpeg" buttons to get download commands

## Part 2: Install Native Host (Optional but Recommended)

The native host enables automatic downloading and merging of HLS streams.

### Prerequisites

Before installing the native host, ensure you have:

#### 1. Python 3.7 or Higher

Check if installed:
```powershell
python --version
```

If not installed:
- Download from [python.org](https://www.python.org/downloads/)
- During installation, check **"Add Python to PATH"**

#### 2. FFmpeg

Check if installed:
```powershell
ffmpeg -version
```

If not installed, choose one method:

**Option A: Using Chocolatey** (Recommended - requires admin)
```powershell
# Run PowerShell as Administrator
choco install ffmpeg
```

**Option B: Manual Download**
1. Download from [ffmpeg.org](https://ffmpeg.org/download.html#build-windows)
2. Extract to a folder (e.g., `C:\ffmpeg`)
3. Add `C:\ffmpeg\bin` to your System PATH
4. Restart PowerShell

### Install Native Host

1. Open PowerShell (no admin needed)
2. Navigate to the extension folder:
   ```powershell
   cd C:\Users\YourName\code\media-stream-helper\native-host
   ```

3. Run the installer:
   ```powershell
   .\install.ps1
   ```

4. When prompted, enter your **Extension ID** (from Part 1, Step 2)

5. The installer will:
   - Verify Python and FFmpeg are available
   - Create the native messaging manifest
   - Register with Chrome/Edge

6. **Restart Chrome** for changes to take effect

### Verify Installation

1. Open Chrome and visit a page with HLS video (`.m3u8` streams)
2. Open Media Stream Helper
3. You should now see a **"🚀 Download & Merge"** button
4. Click it to test automatic downloading

## Troubleshooting

### Extension Won't Load

**Error: Could not load manifest**
- Check that `manifest.json` exists
- Verify all icon files exist in the `icons` folder

**Error: Missing icons**
- Icons should already exist. If missing, run:
  ```powershell
  cd icons
  .\create-minimal-icons.ps1
  ```

### Native Host Connection Failed

**Error: "Specified native messaging host not found"**

1. Verify Extension ID in manifest matches your installed extension:
   ```powershell
   # Check registry entry
   Get-ItemProperty "HKCU:\Software\Google\Chrome\NativeMessagingHosts\com.media_stream_helper.downloader"
   
   # Check manifest file
   Get-Content native-host\com.media_stream_helper.downloader.json
   ```

2. Make sure Python is accessible:
   ```powershell
   python --version
   ```

3. Re-run the installer:
   ```powershell
   cd native-host
   .\install.ps1
   ```

4. Restart Chrome

### Downloads Fail with 403 Forbidden

The extension now automatically includes the Referer header, which fixes most 403 errors. If still failing:

1. Open DevTools (F12) on the page
2. Go to Network tab
3. Find a video segment request
4. Right-click → Copy → Copy as cURL
5. Compare headers with what FFmpeg is using

## Usage

### Manual FFmpeg Download (Works Without Native Host)

1. Click on a detected media stream
2. Click one of the "📋 Copy FFmpeg" buttons
3. Open PowerShell
4. Paste and run the command
5. The video will download to `output.mp4` (or other format)

**Example:**
```powershell
ffmpeg -user_agent "Mozilla/5.0..." -headers "Referer: https://example.com/" -i "https://example.com/video.m3u8" -c copy "output.mp4"
```

### Automatic Download & Merge (Requires Native Host)

1. Click on a detected HLS stream
2. Click "🚀 Download & Merge"
3. Enter the download folder path
4. Wait for the download to complete
5. The merged video will be saved to your chosen location

## Uninstalling

### Remove Extension

1. Go to `chrome://extensions/`
2. Click **Remove** on Media Stream Helper

### Remove Native Host

```powershell
cd native-host
.\uninstall.ps1
```

This removes registry entries but keeps the files. You can delete the folder manually if desired.

## What's New in v1.1.0

- ✅ **Automatic Referer Header**: FFmpeg commands now include Referer header to fix 403 Forbidden errors
- ✅ **Native Messaging Support**: Download & merge HLS streams automatically with Python
- ✅ **Download & Merge Button**: One-click downloading for HLS streams
- ✅ **Better Header Detection**: Captures all necessary headers from browser requests
- ✅ **Improved Error Messages**: Clearer feedback when downloads fail

## Need Help?

Common issues and solutions:

1. **No media detected** - Try refreshing the page and playing the video
2. **FFmpeg commands fail** - Check that URL is still valid and headers are correct
3. **Native host won't connect** - Verify Extension ID matches and Chrome was restarted
4. **Downloads are slow** - Normal for HLS streams with many segments
5. **403 Forbidden errors** - Extension now handles this automatically

For technical issues, check the browser console (F12 → Console) for error messages.

1. Open `test-page.html` in Chrome (double-click or drag into browser)
2. Click Play on any of the media elements
3. Click the extension icon in your toolbar
4. You should see detected media in the popup

### Option B: Test on Real Websites

1. Go to any website with video/audio (YouTube, news sites, etc.)
2. Play the media
3. Click the extension icon
4. Look for detected media URLs

## Step 4: Install FFmpeg (Optional but Recommended)

To use the FFmpeg commands generated by the extension:

### Windows
**Option 1: Chocolatey (if installed)**
```powershell
choco install ffmpeg
```

**Option 2: Manual download**
1. Visit https://www.gyan.dev/ffmpeg/builds/
2. Download "ffmpeg-release-essentials.zip"
3. Extract to `C:\ffmpeg`
4. Add `C:\ffmpeg\bin` to your PATH

### macOS
Using Homebrew:
```bash
brew install ffmpeg
```

### Linux
```bash
# Ubuntu/Debian
sudo apt install ffmpeg

# Fedora
sudo dnf install ffmpeg
```

**Verify installation:**
```bash
ffmpeg -version
```

## Common Issues

### "Extension not found or could not be loaded"
- Make sure you selected the `media-stream-helper` folder (the one containing `manifest.json`)
- Check that all required files exist

### No icon showing
- Did you create the PNG icon files? See Step 1
- The extension will work without custom icons, but won't look polished

### No media detected
- Refresh the page after installing the extension
- Make sure you actually play the media
- Check that the extension is enabled

### FFmpeg commands don't work
- Make sure FFmpeg is installed (Step 4)
- Run `ffmpeg -version` to verify
- Try the command in a terminal/command prompt

## What's Next?

1. Read the full [README.md](README.md) for detailed documentation
2. Explore the FFmpeg commands
3. Test with different media sources
4. Report any issues or suggestions

## Uninstalling

To remove the extension:
1. Go to `chrome://extensions/`
2. Find "Media Stream Helper"
3. Click "Remove"

---

**Need help?** Check the full README.md for troubleshooting and detailed instructions.
