# Version 1.2.0 - UI Improvements

## What's New

### Cleaner, More User-Friendly Interface

#### 1. Individual Segments Hidden by Default
- **Before:** Extension showed all `.ts` segment files (video0.ts, video1.ts, etc.) - cluttered and confusing
- **After:** Only shows `.m3u8` playlists by default - clean and simple
- Advanced users can still enable segment view if needed

#### 2. Grouped Quality Options
- **Before:** Each quality (1080p, 360p, 240p) was shown as a separate item
- **After:** All qualities are grouped together with selectable buttons

**New UI Layout:**
```
┌─────────────────────────────────────┐
│ HLS Video                           │
│ .../video/                          │
│                                     │
│ Select Quality:                     │
│  [1080p] [360p] [240p]             │
│                                     │
│ 🚀 Download & Merge                 │
│ 📋 FFmpeg (MP4)  📋 FFmpeg (MP3)   │
└─────────────────────────────────────┘
```

#### 3. Better User Experience
- Click a quality button to select (highlights in purple)
- All actions use the selected quality
- Much less scrolling needed
- Clearer what to download

## Technical Changes

### Files Modified

**background.js:**
- Added `isSegment` flag to mark individual .ts files
- Helps filter them out in the UI

**popup.js:**
- New `groupPlaylistsByVideo()` function - groups playlists by base URL
- New `createGroupedPlaylistElement()` - creates quality selector UI
- Added `showIndividualSegments` toggle (hidden by default)
- Filters out .ts segments unless user enables them

**popup.css:**
- Added `.btn-quality` styles for quality selector buttons
- Added `.media-group` styles for grouped playlist items
- Purple gradient on selected quality button
- Enhanced visual hierarchy

**manifest.json:**
- Version bumped to 1.2.0

## User Benefits

### Before v1.2.0
Your example would show:
- 15+ individual .ts files
- 4 separate .m3u8 entries
- Lots of scrolling
- Confusion about what to download

### After v1.2.0
Your example shows:
- 1 grouped HLS Video item
- Quality selector: 1080p | 360p | 240p
- Clean, concise interface
- Clear what to do

## Example Usage

When you visit a page with HLS video:

1. **Extension detects the video**
2. **Shows ONE grouped item** with the video
3. **You select quality** (1080p, 360p, or 240p)
4. **Click "Download & Merge"** or copy FFmpeg command
5. **Done!**

No more confusion about which file to download or whether you need all those .ts segments.

## Advanced Features

Users who want to see individual segments can:
1. Check the "Show individual segments" option
2. See all .ts files listed separately
3. Useful for debugging or advanced use cases

## Compatibility

- Fully backward compatible
- All existing features still work
- Native messaging still supported
- No breaking changes
