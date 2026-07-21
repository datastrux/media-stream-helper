# Installation & Testing Checklist

Use this checklist to ensure proper installation and testing of the Media Stream Helper extension.

## Pre-Installation

- [ ] Verify you have Chrome or a Chromium-based browser installed
- [ ] Download or clone this project to your computer
- [ ] Locate the `media-stream-helper` folder

## Icon Generation (REQUIRED)

- [ ] Navigate to the `icons/` folder
- [ ] Verify `icon.svg` exists
- [ ] Choose an icon generation method:
  - [ ] **Option A:** Online converter (CloudConvert)
  - [ ] **Option B:** ImageMagick command line
  - [ ] **Option C:** Inkscape
  - [ ] **Option D:** PowerShell script (Windows)
- [ ] Generate `icon16.png` (16x16 pixels)
- [ ] Generate `icon48.png` (48x48 pixels)
- [ ] Generate `icon128.png` (128x128 pixels)
- [ ] Verify all three PNG files are in the `icons/` folder

## Extension Installation

- [ ] Open Chrome and navigate to `chrome://extensions/`
- [ ] Enable "Developer mode" (toggle in top-right)
- [ ] Click "Load unpacked" button
- [ ] Select the `media-stream-helper` folder
- [ ] Verify extension appears in the list
- [ ] Verify extension is enabled (toggle is on)
- [ ] Check that extension icon appears in toolbar
  - If not visible, click the puzzle piece icon and pin it

## Basic Testing

### Test 1: Local Test Page
- [ ] Open `test-page.html` in Chrome (double-click the file)
- [ ] Click Play on the MP4 video
- [ ] Click the extension icon in toolbar
- [ ] Verify MP4 URL appears in the popup
- [ ] Verify "MP4" badge is shown
- [ ] Verify Download button is available
- [ ] Verify FFmpeg buttons are available

### Test 2: Audio Detection
- [ ] On test-page.html, click Play on the MP3 audio
- [ ] Click the extension icon
- [ ] Verify MP3 URL appears
- [ ] Verify "MP3" badge is shown

### Test 3: Copy Functionality
- [ ] Click "Copy URL" on any detected media
- [ ] Verify button shows "✅ Copied!"
- [ ] Open a text editor and paste (Ctrl+V)
- [ ] Verify the URL was copied correctly

### Test 4: FFmpeg Command
- [ ] Click "Copy FFmpeg (MP3)" on any media item
- [ ] Verify button shows "✅ Copied!"
- [ ] Paste into text editor
- [ ] Verify command starts with `ffmpeg`
- [ ] Verify command includes the media URL
- [ ] Verify command includes output filename

### Test 5: Direct Download
- [ ] Click "Download File" on an MP4 or MP3 item
- [ ] Verify Chrome's download dialog appears
- [ ] Choose a location and save
- [ ] Verify file downloads successfully
- [ ] Verify file can be played

### Test 6: Clear Functionality
- [ ] Click "Clear All" button
- [ ] Verify all detected media disappears
- [ ] Verify empty state appears
- [ ] Refresh test page and play media again
- [ ] Verify detection still works

### Test 7: Multi-Tab Isolation
- [ ] Open test-page.html in Tab 1
- [ ] Play media in Tab 1
- [ ] Open a different webpage in Tab 2 (e.g., YouTube)
- [ ] Click extension icon while on Tab 2
- [ ] Verify only Tab 2's media is shown (not Tab 1's)
- [ ] Switch back to Tab 1
- [ ] Click extension icon
- [ ] Verify Tab 1's media is still there

## Real-World Testing

### Test 8: External Website
- [ ] Go to a video streaming site (YouTube, Vimeo, news sites)
- [ ] Play a video
- [ ] Click the extension icon
- [ ] Verify media URLs are detected
- [ ] Note: Some sites use proprietary formats or DRM

### Test 9: HLS Detection (Advanced)
- [ ] Visit https://developer.apple.com/streaming/examples/
- [ ] Play any test video
- [ ] Click the extension icon
- [ ] Look for `.m3u8` URLs
- [ ] Verify "HLS" badge is shown
- [ ] Verify info message about playlists appears
- [ ] Verify NO download button (only FFmpeg buttons)

## FFmpeg Installation (Optional)

- [ ] Check if FFmpeg is installed: `ffmpeg -version`
- [ ] If not installed, install FFmpeg:
  - Windows: [ ] Chocolatey or manual download
  - macOS: [ ] Homebrew (`brew install ffmpeg`)
  - Linux: [ ] Package manager (`apt install ffmpeg`)
- [ ] Verify installation: `ffmpeg -version`

## FFmpeg Command Testing (Optional)

- [ ] Copy an FFmpeg command from the extension
- [ ] Open terminal/command prompt
- [ ] Paste and run the command
- [ ] Verify FFmpeg starts processing
- [ ] Wait for completion
- [ ] Verify output file was created
- [ ] Verify output file can be played

## Edge Cases & Error Handling

### Test 10: Empty State
- [ ] Open extension on a page with no media
- [ ] Verify empty state message appears
- [ ] Verify friendly icon and hint text shown

### Test 11: Protected Content Warning
- [ ] Visit a site with DRM content (Netflix, Spotify, etc.)
- [ ] Play media
- [ ] Click extension icon
- [ ] If protected content detected, verify warning banner appears
- [ ] Verify warning message mentions DRM/protection

### Test 12: Extension Reload
- [ ] Go to `chrome://extensions/`
- [ ] Click reload button on Media Stream Helper
- [ ] Go back to test page
- [ ] Refresh the page
- [ ] Play media
- [ ] Verify detection still works

## Documentation Review

- [ ] Read README.md
- [ ] Read INSTALL.md
- [ ] Browse PROJECT_STRUCTURE.md (if you plan to modify)
- [ ] Review legal disclaimer and ensure you understand usage limits

## Troubleshooting (If Issues Found)

### Extension doesn't appear
- [ ] Check if icons were generated correctly
- [ ] Try reloading the extension
- [ ] Check Chrome console for errors (F12)

### Media not detected
- [ ] Refresh page after installing extension
- [ ] Ensure you clicked Play on the media
- [ ] Check if extension is enabled
- [ ] Try a different website

### Buttons don't work
- [ ] Check browser console for JavaScript errors
- [ ] Try reloading the extension
- [ ] Check Chrome permissions

### FFmpeg commands fail
- [ ] Verify FFmpeg is installed
- [ ] Try copying just the URL first
- [ ] Check if media URL requires authentication
- [ ] Try simplified command without headers

## Final Checklist

- [ ] Extension successfully installed
- [ ] Icons display correctly
- [ ] Media detection works
- [ ] Copy functions work
- [ ] Direct download works (for supported formats)
- [ ] FFmpeg commands generate correctly
- [ ] Clear function works
- [ ] Multi-tab isolation confirmed
- [ ] Documentation reviewed
- [ ] Legal disclaimer understood

## Success Criteria

You should be able to:
- ✅ See the extension icon in Chrome toolbar
- ✅ Detect media from test page
- ✅ Copy URLs and FFmpeg commands
- ✅ Download direct media files
- ✅ See appropriate warnings for protected content
- ✅ Use extension on multiple tabs independently

## Next Steps

Once all checks pass:
1. [ ] Test with your actual use cases
2. [ ] Customize as needed (see PROJECT_STRUCTURE.md)
3. [ ] Report any issues or suggestions
4. [ ] Use responsibly and legally

---

**Installation Status:** ⬜ Not Started | 🟨 In Progress | ✅ Complete

**Notes:**
_Use this space to write down any issues, observations, or customizations you make_

---

**Estimated Time:** 15-30 minutes (including icon generation and testing)
