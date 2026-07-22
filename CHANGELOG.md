# Changelog

## Version 1.5.0 - Automatic Download Resume (2026-07-22)

### 🎯 Major Features

#### Automatic Download Resume with Network Interruption Handling
- **🔄 Automatic Retry** - Downloads automatically resume when network connection is lost
- **📊 Exponential Backoff** - Smart retry delays: 2s → 4s → 8s → 16s → 32s
- **🔌 FFmpeg Reconnection** - Built-in reconnection for HLS streams
- **💾 State Persistence** - Download state saved for crash recovery
- **🧠 Smart Error Detection** - Distinguishes network errors from permanent failures
- **🔔 Enhanced Notifications** - Real-time retry status and attempt counters
- **⚙️ Configurable Retries** - Default 5 attempts, customizable per download

#### Technical Improvements
- Network error detection with pattern matching
- Download state saved to temporary files
- Manual resume capability for failed downloads
- FFmpeg timeout and reconnection flags for HLS
- Non-retryable error filtering (403, 404, DRM)
- Progress notifications for retry attempts

### 📝 Files Modified
- `native-host/media_downloader.py` - Added retry logic, state persistence, network error detection
- `background.js` - Enhanced progress notifications for retry states
- `README.md` - Updated with automatic resume feature
- `DOWNLOAD_RESUME.md` - New comprehensive documentation (see this file for details)

### 🔧 New Capabilities
- Automatic recovery from temporary network outages
- Downloads complete successfully even with unstable connections
- Failed downloads can be manually resumed
- Clear user feedback during retry attempts
- Persistent state across process crashes

### 🐛 Bug Fixes
- Downloads no longer fail permanently on temporary network issues
- FFmpeg reconnection enabled for streaming content
- Better error messages distinguishing network vs. permanent failures

---

## Version 1.4.0 - Closed Caption Support

See VERSION_1.2.0.md and previous changelog entries...

---

# Version 1.1.0 - Release Notes

## What's New

### Major Features

#### 1. Automatic Referer Header Support
- **Fixed 403 Forbidden errors** - The extension now automatically includes the Referer header in all FFmpeg commands
- Headers are captured from the actual browser requests
- Falls back to page URL if Referer header is not present
- This solves the most common issue when downloading CDN-protected media

#### 2. Native Messaging Host
- **One-click downloads** - New "🚀 Download & Merge" button for automatic downloading
- Python-based native host handles complex downloads
- Automatic HLS segment merging
- Real-time progress updates
- No need to manually run FFmpeg commands

#### 3. Enhanced Header Detection
- Captures User-Agent, Referer, and Origin headers
- Uses actual browser headers for maximum compatibility
- Better support for CDN-protected content

### Installation Changes

**Extension Installation:**
- Icons are now pre-generated (no manual icon creation needed)
- Simply load the extension in Chrome

**Native Host (Optional):**
- New `native-host/` folder with Python script
- PowerShell installer (`install.ps1`)
- Easy uninstallation (`uninstall.ps1`)
- Comprehensive documentation

### Files Added

```
native-host/
├── media_downloader.py          # Python native messaging host
├── com.media_stream_helper.downloader.json  # Native host manifest
├── install.ps1                  # Windows installer
├── uninstall.ps1                # Windows uninstaller
└── README.md                    # Native host documentation

icons/
├── icon16.png                   # Generated icons
├── icon48.png
├── icon128.png
├── create-minimal-icons.ps1     # Icon generator script
└── (existing files)
```

### Files Modified

- `manifest.json` - Added `nativeMessaging` permission, version bumped to 1.1.0
- `background.js` - Enhanced header extraction, automatic Referer fallback
- `popup.js` - Updated FFmpeg command generation with proper Referer header format
- `popup.js` - Added native messaging download functionality
- `README.md` - Updated with new features and usage instructions
- `INSTALL.md` - Comprehensive installation guide

### Technical Improvements

#### FFmpeg Command Format
Old format (often failed with 403):
```powershell
ffmpeg -user_agent "..." -i "url" -c copy "output.mp4"
```

New format (works with CDNs):
```powershell
ffmpeg -user_agent "..." -headers "Referer: https://example.com/" -i "url" -c copy "output.mp4"
```

#### Native Messaging Protocol
- Bi-directional communication between extension and Python
- JSON-based message passing
- Progress updates during download
- Error handling and reporting

### User Experience

**Before v1.1.0:**
1. Copy FFmpeg command
2. Paste in terminal
3. Often get 403 Forbidden error
4. Manually add headers
5. Try again

**After v1.1.0:**
- **Without Native Host:** FFmpeg commands work immediately (Referer included)
- **With Native Host:** One click, automatic download and merge

### Compatibility

- **Extension:** Chrome, Edge, and other Chromium browsers
- **Native Host:** Windows (PowerShell-based installer)
- **Requirements:** Python 3.7+, FFmpeg

### Security

- Native host only accepts connections from your specific extension ID
- No sensitive data (cookies, tokens) are captured
- All downloads are user-initiated
- Extension respects Chrome's download security

## Upgrade Instructions

### For Existing Users

1. **Update Extension:**
   - Go to `chrome://extensions/`
   - Click "Update" or reload the extension
   - Note your Extension ID (you'll need it for native host)

2. **Optional - Install Native Host:**
   - Navigate to `native-host/` folder
   - Run `install.ps1`
   - Enter your Extension ID
   - Restart Chrome

### For New Users

Follow the comprehensive guide in [INSTALL.md](INSTALL.md)

## Breaking Changes

None - The extension is fully backward compatible. All existing features work as before, with improvements.

## Known Issues

1. **Native host path prompts** - Currently prompts user for download path each time
   - Future: Remember last path or use default Downloads folder

2. **Windows-only installer** - Native host installation script is PowerShell-based
   - Future: Add Linux/Mac installation scripts

3. **No cancel button** - Once download starts, cannot cancel from extension
   - Future: Add cancel/abort functionality

## Roadmap

Future enhancements planned:
- Remember download path preference
- Linux/Mac support for native host
- Download progress bar in popup
- Batch download multiple streams
- Custom FFmpeg parameters
- Download queue management

## Credits

Built with:
- Chrome Extensions Manifest V3
- Native Messaging API
- Python 3
- FFmpeg

## Feedback

Found a bug or have a suggestion? Check the extension console (F12) for error messages and refer to the troubleshooting section in [INSTALL.md](INSTALL.md).
