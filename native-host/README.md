# Native Messaging Host for Media Stream Helper

This folder contains the native messaging host that allows the Chrome extension to download and merge video streams using Python and FFmpeg.

## What is Native Messaging?

Native messaging allows Chrome extensions to communicate with native applications on your computer. This enables the extension to:
- Download HLS streams (.m3u8) and automatically merge all segments
- Handle complex video downloads that require FFmpeg
- Show real-time download progress

## Requirements

- **Python 3.7+** - [Download from python.org](https://www.python.org/)
- **FFmpeg** - [Download from ffmpeg.org](https://ffmpeg.org/) or install via Chocolatey: `choco install ffmpeg`

## Installation

1. Make sure Python and FFmpeg are installed and accessible from command line
2. Run `install.ps1` from this folder:
   ```powershell
   .\install.ps1
   ```
3. Follow the prompts to enter your Chrome Extension ID
4. Restart Chrome/Edge

### Finding Your Extension ID

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Find "Media Stream Helper" in the list
4. Copy the ID shown below the extension name (32 character string)

## Uninstallation

Run `uninstall.ps1` to remove the native host registration:
```powershell
.\uninstall.ps1
```

## Files

- `media_downloader.py` - Python script that handles downloads
- `media_downloader_host.bat` - Windows batch launcher (required for Chrome to execute Python)
- `com.media_stream_helper.downloader.json` - Native messaging manifest
- `install.ps1` - Installation script
- `uninstall.ps1` - Uninstallation script
- `update-registry.ps1` - Quick fix to update registry paths

## Troubleshooting

### Extension can't connect to native host

1. Verify Python is installed: `python --version`
2. Check the registry entries exist:
   - Chrome: `HKCU:\Software\Google\Chrome\NativeMessagingHosts\com.media_stream_helper.downloader`
   - Edge: `HKCU:\Software\Microsoft\Edge\NativeMessagingHosts\com.media_stream_helper.downloader`
3. Verify the Extension ID in the manifest matches your installed extension
4. Restart your browser

### Native host opens in VS Code instead of running

This happens if the manifest points directly to the `.py` file instead of the `.bat` file.

**Quick Fix:**
```powershell
cd native-host
.\update-registry.ps1
```

Then restart Chrome/Edge.

**Manual Fix:**
1. Check `com.media_stream_helper.downloader.json`
2. Make sure the `"path"` field points to `media_downloader_host.bat` (not `.py`)
3. Run `update-registry.ps1` to refresh the registry
4. Restart Chrome/Edge

### Downloads fail

1. Verify FFmpeg is installed: `ffmpeg -version`
2. Check the download URL is accessible
3. Look at browser console (F12) for error messages

## Security

The native host only accepts connections from your specific extension ID. No other extensions or websites can use it.
