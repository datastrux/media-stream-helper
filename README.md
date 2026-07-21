# 📡 Media Stream Helper

A Chrome extension that helps you detect downloadable media streams from webpages and generate FFmpeg commands for lawful personal use. Now with automatic download & merge support via native messaging!

## ⚖️ Legal Notice

**This extension is intended for lawful personal use only.**

- Only download media you have permission to use
- Respect copyright laws and terms of service
- This tool does NOT bypass DRM, encryption, paywalls, or access controls
- Users are solely responsible for how they use this tool

## 🎯 Features

### Media Detection
Automatically detects common media formats:
- `.m3u8` - HLS (HTTP Live Streaming) playlists
- `.mp4` - Video files
- `.webm` - Video files
- `.mp3` - Audio files
- `.m4a` - Audio files
- `.aac` - Audio files
- `.ts` - Transport stream segments
- `.vtt` - WebVTT subtitles (New in v1.4.0!)
- `.srt` - SubRip subtitles (New in v1.4.0!)
- `.ttml` - Timed Text subtitles (New in v1.4.0!)

### FFmpeg Command Generation
Generates ready-to-use FFmpeg commands with proper headers:
- ✅ **Automatic Referer header** - Fixes 403 Forbidden errors
- Converting HLS streams to MP3
- Converting HLS streams to MP4
- Copying streams without re-encoding
- Extracting audio from video files
- **Embedding subtitles in MP4** (New in v1.4.0!)
- **Extracting subtitles to .srt files** (New in v1.4.0!)

### Closed Caption Support (New in v1.4.0!)
Download videos with subtitles included:
- 📋 **MP4+Subs** - Embed subtitles directly in video file
- 📋 **Extract Subs** - Save subtitles as separate .srt file
- ⬇️ **Download Subtitle** - Direct download of detected subtitle files
- Works with VLC, Windows Media Player, MPC-HC, and more
- See [SUBTITLE_GUIDE.md](SUBTITLE_GUIDE.md) for complete instructions

### Native Download & Merge
Optional Python-based native host for automatic downloading:
- 🚀 **One-click download & merge** for HLS streams
- Automatic segment concatenation
- Real-time progress updates via notifications (New in v1.3.0!)
- Downloads continue even when popup is closed (New in v1.3.0!)
- No manual FFmpeg commands needed

### Direct Download
For direct media files (MP4, MP3, etc.), provides a one-click download button.

### Protection Detection
Warns when media appears to be protected or encrypted (DRM, Widevine, etc.).

## 🚀 Installation

See [INSTALL.md](INSTALL.md) for detailed installation instructions.

### Quick Start

1. **Load Extension:**
   - Open `chrome://extensions/`
   - Enable Developer mode
   - Click "Load unpacked"
   - Select this folder

2. **Optional - Install Native Host:**
   - Navigate to `native-host` folder
   - Run `install.ps1` in PowerShell
   - Enter your Extension ID when prompted
   - Restart Chrome

## 📖 How to Use

### Basic Usage

1. **Navigate to a webpage** with audio or video content
2. **Play the media** (the extension monitors network requests)
3. **Click the extension icon** in your toolbar
4. **View detected media** in the popup
5. **Choose an action:**
   - 🚀 **Download & Merge** (native host required) - Automatic download
   - 📋 **Copy FFmpeg** command - Manual download
   - ⬇️ **Download File** - Direct download (for MP4, MP3, etc.)
   - 🔗 **Copy URL** - Just get the URL

### For HLS Streams (.m3u8)

**Option 1: Automatic Download (Recommended)**
1. Click **"🚀 Download & Merge"**
2. Enter download folder path
3. Wait for completion

**Option 2: Manual FFmpeg**
1. Click **"📋 Copy FFmpeg (MP4)"**
2. Open PowerShell
3. Paste and run the command
4. FFmpeg will download and merge all segments

**Example command generated:**
```powershell
ffmpeg -user_agent "Mozilla/5.0..." -headers "Referer: https://example.com/" -i "https://example.com/playlist.m3u8" -c copy "output.mp4"
```

### For Direct Media Files

For MP4, MP3, WEBM, and other direct files:

1. Click **"⬇️ Download File"** to save directly, or
2. Click **"🚀 Download & Merge"** for FFmpeg-based download, or
3. Use FFmpeg commands to convert the format

## 🛠️ Installing FFmpeg

FFmpeg is required for both manual commands and the native host.

### Windows
1. Download from [ffmpeg.org](https://ffmpeg.org/download.html) or use [Chocolatey](https://chocolatey.org/):
   ```powershell
   choco install ffmpeg
   ```
2. Or download a build from [gyan.dev](https://www.gyan.dev/ffmpeg/builds/)

### macOS
Using [Homebrew](https://brew.sh/):
```bash
brew install ffmpeg
```

### Linux
```bash
# Ubuntu/Debian
sudo apt install ffmpeg

# Fedora
sudo dnf install ffmpeg

# Arch
sudo pacman -S ffmpeg
```

### Verify Installation
```bash
ffmpeg -version
```

## 📋 Example FFmpeg Commands

### Convert HLS to MP3 (audio only)
```bash
ffmpeg -i "https://example.com/playlist.m3u8" -vn -acodec libmp3lame -b:a 192k "output.mp3"
```

### Convert HLS to MP4 (copy without re-encoding)
```bash
ffmpeg -i "https://example.com/playlist.m3u8" -c copy "output.mp4"
```

### Extract audio from MP4 to MP3
```bash
ffmpeg -i "video.mp4" -vn -acodec libmp3lame -b:a 192k "audio.mp3"
```

### With headers (for restricted content you have access to)
```bash
ffmpeg -user_agent "Mozilla/5.0..." -referer "https://example.com" -i "https://example.com/stream.m3u8" -c copy "output.mp4"
```

## 🧪 Testing

### Test with Public Streaming Content

You can test the extension with publicly available test streams:

1. **Apple HLS Test Streams**
   - Visit: https://developer.apple.com/streaming/examples/
   - Play any of the test videos
   - Open the extension to see detected `.m3u8` files

2. **Big Buck Bunny (Public Domain)**
   - Visit: http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4
   - The extension should detect the `.mp4` file

3. **Create Your Own Test**
   - Create a simple HTML file with a video element:
   ```html
   <video controls>
     <source src="https://example.com/video.mp4" type="video/mp4">
   </video>
   ```

### Expected Behavior

- Media URLs should appear in the extension popup after playback starts
- For `.m3u8` files, only FFmpeg buttons should be available
- For `.mp4`, `.mp3` files, both Download and FFmpeg buttons should appear
- Protected content should show a warning banner

## 🔒 Privacy & Security

This extension is designed with privacy and security in mind:

- ✅ **No remote logging** - All data stays on your device
- ✅ **No analytics** - We don't track your usage
- ✅ **No external API calls** - Everything is processed locally
- ✅ **Session storage** - Data clears when you close your browser
- ✅ **No credential collection** - Cookies are not included in commands by default
- ✅ **No DRM bypass** - Does not circumvent content protection

### Permissions Explained

- **`webRequest`** - To observe network requests and detect media URLs
- **`storage`** - To temporarily store detected media (session storage only)
- **`downloads`** - To enable direct file downloads for non-streaming media
- **`activeTab`** - To identify which tab is currently active
- **`tabs`** - To associate detected media with specific tabs
- **`host_permissions: <all_urls>`** - Required to monitor requests across all websites

## 🧩 How It Works

### Architecture

```
┌─────────────────┐
│  Webpage with   │
│  Media Content  │
└────────┬────────┘
         │
         │ Network Requests
         ▼
┌─────────────────┐
│   Background    │◄─── Monitors all network requests
│ Service Worker  │     Detects media URLs
└────────┬────────┘     Stores in session storage
         │
         │ chrome.storage.session
         ▼
┌─────────────────┐
│  Popup UI       │◄─── User clicks extension icon
│  (HTML/CSS/JS)  │     Displays detected media
└─────────────────┘     Generates FFmpeg commands
                        Handles downloads
```

### Detection Logic

1. **Background Service Worker** listens to `chrome.webRequest.onBeforeSendHeaders`
2. Filters requests by URL pattern (contains `.m3u8`, `.mp4`, etc.)
3. Captures request headers (User-Agent, Referer, Origin)
4. Stores media information in `chrome.storage.session`
5. Associates each media item with a tab ID

### Command Generation

When generating FFmpeg commands, the extension:
1. Retrieves the media URL
2. Includes relevant headers (User-Agent, Referer, Origin)
3. Formats the command based on desired output (MP3, MP4, copy)
4. Does NOT include cookies by default (privacy protection)

## ⚠️ Known Limitations

### Technical Limitations

1. **DRM Content** - Cannot download DRM-protected content (by design)
2. **Authenticated Content** - May not work with content requiring login cookies
3. **Live Streams** - Limited support for live streaming content
4. **CORS Restrictions** - Some sites block cross-origin requests
5. **JavaScript-Initiated Requests** - May miss some dynamically loaded media
6. **Fragmented Streams** - Does not assemble HLS segments within the extension

### Browser Limitations

- **Manifest V3** - Service workers have execution time limits
- **Storage Limits** - Session storage clears when browser closes
- **Permission Requirements** - Requires broad permissions to detect all media

### FFmpeg Limitations

- **Not Included** - Users must install FFmpeg separately
- **Command Line Required** - No GUI for FFmpeg operations
- **Platform Differences** - Command syntax may vary by OS

## 🔮 Future Enhancements

Potential features for future versions:

### Planned Features
- [ ] Custom header management UI
- [ ] Preset command templates
- [ ] History of previously detected media
- [ ] Export detected media list
- [ ] Better duplicate detection
- [ ] Automatic filename suggestions
- [ ] Support for more media formats (DASH, etc.)

### Advanced Features
- [ ] In-extension HLS segment assembly (complex)
- [ ] FFmpeg integration via WebAssembly (advanced)
- [ ] Batch download management
- [ ] Custom FFmpeg parameter builder
- [ ] Quality selection for multi-bitrate streams

### UI Improvements
- [ ] Dark mode
- [ ] Customizable interface
- [ ] Keyboard shortcuts
- [ ] Toast notifications
- [ ] Better error messages

## 🐛 Troubleshooting

### Extension doesn't detect media

1. **Reload the page** - Detection only works on requests after extension loads
2. **Play the media** - Some sites load media URLs only after playback starts
3. **Check permissions** - Ensure extension has necessary permissions
4. **Inspect console** - Check browser console for errors (F12)

### FFmpeg command doesn't work

1. **Check FFmpeg installation** - Run `ffmpeg -version` in terminal
2. **Verify URL** - Ensure the media URL is still valid (some expire)
3. **Check headers** - Some streams require specific headers
4. **Try simpler command** - Start with basic command without headers
5. **Quote the URL** - Ensure URL is properly quoted in command

### Download button doesn't work

1. **Check browser permissions** - Chrome may block downloads
2. **Check disk space** - Ensure sufficient storage available
3. **Try "Save As"** - Extension uses `saveAs: true` by default
4. **Check URL validity** - Direct downloads only work for direct files, not playlists

### Media appears protected

If the extension warns about protected content:
- This is expected for DRM-protected streams
- The extension cannot bypass this protection
- Look for alternative, non-protected sources
- Check if the content provider offers a download option

## 📜 License

This project is provided as-is for educational and lawful personal use.

**Disclaimer:** The authors are not responsible for misuse of this tool. Users must comply with all applicable laws and terms of service.

## 🤝 Contributing

While this is a standalone project, improvements are welcome:

- Report bugs via GitHub issues
- Suggest features
- Submit pull requests
- Improve documentation

## 📞 Support

For issues or questions:
1. Check this README first
2. Review the troubleshooting section
3. Check browser console for errors
4. Verify FFmpeg installation and commands

## 🙏 Acknowledgments

- FFmpeg project for the amazing multimedia framework
- Chrome Extensions documentation
- The open-source community

---

**Remember:** Only use this tool for content you have permission to download. Respect creators and copyright holders.
