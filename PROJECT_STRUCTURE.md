# Project Structure

This document explains the organization and purpose of each file in the Media Stream Helper extension.

## File Tree

```
media-stream-helper/
├── manifest.json           # Extension configuration (Manifest V3)
├── background.js           # Background service worker (media detection)
├── popup.html              # Extension popup UI structure
├── popup.js                # Popup UI logic and interactions
├── popup.css               # Popup UI styling
├── test-page.html          # Local testing page with sample media
├── README.md               # Main documentation
├── INSTALL.md              # Quick installation guide
├── PROJECT_STRUCTURE.md    # This file
└── icons/
    ├── icon.svg            # Source SVG icon
    ├── icon16.png          # 16x16 icon (to be generated)
    ├── icon48.png          # 48x48 icon (to be generated)
    ├── icon128.png         # 128x128 icon (to be generated)
    └── README.md           # Icon generation instructions
```

## Core Files

### manifest.json
**Purpose:** Chrome extension configuration file (Manifest V3)

**Key sections:**
- `manifest_version: 3` - Uses latest Manifest V3 specification
- `permissions` - Declares required permissions
- `host_permissions` - Allows monitoring requests on all URLs
- `background.service_worker` - Registers the background service worker
- `action` - Configures the popup UI

**Permissions explained:**
- `webRequest` - Monitor network requests for media detection
- `storage` - Store detected media temporarily
- `downloads` - Enable direct file downloads
- `activeTab` - Identify the current active tab
- `tabs` - Associate media with specific tabs
- `<all_urls>` - Required to observe requests across all websites

### background.js
**Purpose:** Background service worker that runs persistently to monitor network activity

**Key functions:**
- `isMediaUrl(url)` - Checks if URL matches media file patterns
- `detectMediaType(url)` - Identifies the type of media (MP4, HLS, MP3, etc.)
- `isPossiblyProtected(url)` - Detects potential DRM/encryption indicators
- `isDirectDownloadable(mediaType)` - Determines if media can be directly downloaded
- `extractHeaders(details)` - Captures useful HTTP headers (without cookies)
- `storeDetectedMedia(mediaItem)` - Saves detected media to session storage

**Event listeners:**
- `chrome.webRequest.onBeforeSendHeaders` - Monitors all network requests
- `chrome.tabs.onRemoved` - Cleans up data when tabs are closed

**Data model:**
Each detected media item contains:
```javascript
{
  url: String,                  // Full media URL
  mediaType: String,            // "HLS", "MP4", "MP3", etc.
  tabId: Number,                // Associated tab ID
  pageUrl: String,              // URL of the page
  headers: Object,              // Captured headers
  timestamp: Number,            // Detection time
  isHLS: Boolean,               // Whether it's HLS
  isDirectDownloadable: Boolean,// Can be downloaded directly
  isPossiblyProtected: Boolean  // May be DRM-protected
}
```

### popup.html
**Purpose:** User interface structure for the extension popup

**Sections:**
- Header - Extension title and branding
- Tab info - Displays current page URL
- Warning section - Shows alerts for protected content
- Media list - Container for detected media items
- Empty state - Shown when no media is detected
- Actions - Clear button and other controls
- Footer - Legal disclaimer

**No external dependencies:** Pure HTML, no frameworks

### popup.js
**Purpose:** Client-side logic for the popup UI

**Key functions:**
- `init()` - Initializes the popup and loads data
- `displayTabInfo(tab)` - Shows current tab information
- `loadDetectedMedia()` - Retrieves media from storage
- `displayMediaItems(mediaItems)` - Renders the media list
- `createMediaItemElement(item, index)` - Builds HTML for each media item
- `handleMediaAction(event)` - Processes button clicks
- `generateFFmpegCommand(item, mode)` - Creates FFmpeg commands
- `copyFFmpegCommand(item, mode, button)` - Copies command to clipboard
- `downloadFile(item, button)` - Initiates direct download
- `copyToClipboard(text, button)` - Copies text with user feedback
- `handleClearAll()` - Clears all detected media for current tab

**FFmpeg command modes:**
- `mp3` - Convert to MP3 audio
- `mp4` - Save as MP4 video
- `copy` - Copy streams without re-encoding
- `convert` - Extract audio from video

### popup.css
**Purpose:** Styling for the popup interface

**Design features:**
- Modern, clean interface
- Gradient header with purple theme
- Color-coded media type badges
- Responsive button states with hover effects
- Smooth transitions and animations
- Custom scrollbar styling
- Warning/info message styling
- Mobile-friendly (width: 500px)

**Color scheme:**
- Primary: Purple gradient (#667eea to #764ba2)
- Success: Green (#4caf50)
- Warning: Yellow (#ffc107)
- Secondary: Gray (#e0e0e0)
- Background: White/light gray

## Supporting Files

### test-page.html
**Purpose:** Local testing page for the extension

**Features:**
- Embedded test videos and audio
- Multiple media formats (MP4, MP3, WebM)
- Links to external HLS test streams
- Testing checklist
- Troubleshooting guide

**Usage:** Open in Chrome to test media detection without visiting external sites

### README.md
**Purpose:** Main documentation for users

**Sections:**
- Legal notice and usage guidelines
- Feature overview
- Installation instructions
- Usage guide
- FFmpeg installation guide
- Example commands
- Testing procedures
- Troubleshooting
- Known limitations
- Future enhancements

### INSTALL.md
**Purpose:** Quick-start installation guide

**Provides:**
- Step-by-step installation process
- Icon generation instructions
- Basic testing procedures
- FFmpeg installation guide
- Common issue solutions

### icons/
**Purpose:** Extension icon files

**Files needed:**
- `icon16.png` - Toolbar icon
- `icon48.png` - Extension management page
- `icon128.png` - Chrome Web Store and settings

**Source file:**
- `icon.svg` - Vector source for generating PNGs

## Data Flow

```
┌──────────────────┐
│   Webpage with   │
│   Media Content  │
└────────┬─────────┘
         │
         │ 1. User plays media
         │ 2. Network requests made
         ▼
┌──────────────────┐
│  background.js   │
│ (Service Worker) │
└────────┬─────────┘
         │
         │ 3. Detects media URLs
         │ 4. Captures headers
         │ 5. Stores in session storage
         ▼
┌──────────────────┐
│ chrome.storage   │
│    .session      │
└────────┬─────────┘
         │
         │ 6. User clicks extension icon
         ▼
┌──────────────────┐
│   popup.html     │
│   popup.js       │
│   popup.css      │
└────────┬─────────┘
         │
         │ 7. Loads detected media
         │ 8. Displays in UI
         │ 9. Generates commands
         ▼
┌──────────────────┐
│   User Actions   │
│ - Copy command   │
│ - Download file  │
│ - Copy URL       │
└──────────────────┘
```

## Key Design Decisions

### Why Session Storage?
- Data clears when browser closes (privacy)
- Faster than local storage
- Appropriate for temporary data
- Automatically managed by Chrome

### Why No Content Script?
- Background service worker can monitor all requests
- Content scripts would be unnecessary overhead
- Simpler architecture
- Better performance

### Why No External Libraries?
- Smaller extension size
- Faster loading
- No dependency management
- Better security (no supply chain attacks)
- Easier to audit and modify

### Why Generate Commands Instead of Downloading?
- HLS streams cannot be directly downloaded
- FFmpeg provides more control and quality options
- Avoids complex in-browser media processing
- Respects user's choice of output format
- More transparent process

## Modification Guide

### To Add a New Media Format

1. **Update `background.js`:**
   ```javascript
   // Add to MEDIA_EXTENSIONS array
   const MEDIA_EXTENSIONS = [
     // ... existing extensions
     '.newformat'
   ];
   
   // Add to detectMediaType function
   if (urlPath.includes('.newformat')) return 'NEWFORMAT';
   ```

2. **Update `popup.css`:**
   ```css
   .media-badge.newformat {
     background: #color;
     color: #textcolor;
   }
   ```

### To Modify FFmpeg Commands

Edit the `generateFFmpegCommand()` function in `popup.js`:
```javascript
case 'your-new-mode':
  command = `ffmpeg [your-command]`;
  break;
```

### To Add New UI Features

1. Update `popup.html` with new elements
2. Add styles in `popup.css`
3. Add logic in `popup.js`
4. Add event listeners in `init()` function

### To Change Storage Duration

Replace `chrome.storage.session` with `chrome.storage.local` in:
- `background.js` - All storage operations
- `popup.js` - All storage operations

**Note:** Local storage persists until manually cleared

## Security Considerations

### What We DO
✅ Monitor network requests (with user consent via permissions)
✅ Store URLs temporarily in session storage
✅ Capture non-sensitive headers (User-Agent, Referer, Origin)
✅ Keep all data local (no external servers)
✅ Clear data when tabs close

### What We DON'T DO
❌ Capture or expose cookies
❌ Bypass DRM or encryption
❌ Send data to external servers
❌ Track user behavior
❌ Store data permanently (by default)
❌ Access sensitive information

### Code Audit Points
- All network monitoring is declared in `manifest.json`
- No `eval()` or dynamic code execution
- No external script loading
- HTML sanitization via `textContent` (prevents XSS)
- User confirmation required for downloads

## Performance Considerations

### Optimizations
- Maximum 50 items stored per tab (prevents memory issues)
- Session storage auto-clears on browser close
- Efficient URL pattern matching
- Minimal background processing
- No continuous polling

### Resource Usage
- Background service worker: ~1-5 MB memory
- Popup: ~5-10 MB when open
- Storage: ~1-5 KB per detected media item
- Network: No external requests

## Future Development

Areas for expansion:
1. **Advanced Features** - Custom header management, quality selection
2. **UI Enhancements** - Dark mode, keyboard shortcuts, notifications
3. **Format Support** - DASH streams, more audio formats
4. **Export/Import** - Save detected media lists, templates
5. **Integration** - Optional FFmpeg WebAssembly integration

---

This structure keeps the extension lightweight, secure, and easy to modify while providing all essential features for media detection and download command generation.
