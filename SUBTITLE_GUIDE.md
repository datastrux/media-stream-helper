# Subtitle Guide - How to Download & Use Closed Captions

## 🎬 Overview

The Media Stream Helper extension now supports **closed captions (CC)** detection and extraction! This guide explains how to download subtitles with your videos and play them in video players.

---

## 📥 Downloading Subtitles

### Option 1: Embedded Subtitles (Recommended)

**Best for:** VLC, MPC-HC, Windows Media Player

```bash
# Download video with embedded subtitles
ffmpeg -headers "Referer: https://example.com/" -i "https://example.com/video.m3u8" -c copy -c:s mov_text "output.mp4"
```

**What it does:**
- Downloads the video stream
- Extracts subtitle tracks from the stream
- Embeds them into the MP4 file
- Subtitles are built-in (no separate file needed)

**Button in Extension:** Click **📋 MP4+Subs**

---

### Option 2: Separate Subtitle File

**Best for:** External subtitle management, editing, or players that prefer external subs

```bash
# Extract subtitles to separate .srt file
ffmpeg -headers "Referer: https://example.com/" -i "https://example.com/video.m3u8" -map 0:s:0 "output.srt"
```

**What it does:**
- Extracts only the subtitle track
- Saves as SubRip (.srt) format
- Can be loaded separately in any video player

**Button in Extension:** Click **📋 Extract Subs**

---

### Option 3: Direct Subtitle Download

If the extension detects **separate subtitle files** (`.vtt`, `.srt`, `.ttml`):

1. Look for items labeled **VTT**, **SRT**, or **TTML**
2. Click **⬇️ Download Subtitle**
3. Save to the same folder as your video
4. Name it the same as the video (e.g., `video.mp4` and `video.srt`)

---

## 🎥 Playing Videos with Subtitles

### VLC Media Player (Recommended)

**Embedded Subtitles:**
1. Open the downloaded MP4 file
2. Go to **Subtitle** → **Sub Track** → Select your language
3. Subtitles appear automatically

**External Subtitles:**
1. Place `.srt` file in same folder as video
2. Name it exactly like the video: `video.mp4` + `video.srt`
3. Open video → VLC loads subtitles automatically
4. Or drag-and-drop `.srt` file onto VLC window

**Keyboard Shortcuts:**
- `V` - Cycle through subtitle tracks
- `H` - Increase subtitle delay
- `G` - Decrease subtitle delay
- `Shift+H` / `Shift+G` - Fine-tune subtitle timing

---

### Windows Media Player

**Embedded Subtitles:**
1. Open the MP4 file
2. Right-click → **Lyrics, captions, and subtitles** → **On if available**
3. Subtitles display automatically

**External Subtitles:**
- Place `.srt` file in same folder with same name
- WMP loads automatically when playing video

---

### MPC-HC (Media Player Classic - Home Cinema)

**Embedded Subtitles:**
1. Open video file
2. Press `D` to cycle through subtitle tracks
3. Or go to **Play** → **Subtitles** → Select track

**External Subtitles:**
1. Place `.srt` in same folder as video
2. MPC-HC auto-loads matching subtitles
3. Or drag `.srt` onto player window

**Advanced Options:**
- Right-click → **Filters** → **DirectVobSub** for subtitle styling
- Change font, size, color, position

---

### Chrome/Browser (for .vtt files)

**HTML5 Video with Subtitles:**
```html
<video controls>
  <source src="video.mp4" type="video/mp4">
  <track src="subtitles.vtt" kind="subtitles" srclang="en" label="English" default>
</video>
```

**Using VTT files:**
- WebVTT (.vtt) is the web standard for HTML5 video
- Can be loaded directly in browsers
- Most streaming services use VTT format

---

## 🔧 Advanced FFmpeg Subtitle Commands

### Extract Multiple Subtitle Tracks

```bash
# Extract first subtitle track
ffmpeg -i input.m3u8 -map 0:s:0 subtitles_english.srt

# Extract second subtitle track (if available)
ffmpeg -i input.m3u8 -map 0:s:1 subtitles_spanish.srt
```

### Convert Subtitle Formats

```bash
# Convert VTT to SRT
ffmpeg -i subtitles.vtt subtitles.srt

# Convert SRT to VTT
ffmpeg -i subtitles.srt subtitles.vtt
```

### Burn Subtitles into Video (Hardcoded)

⚠️ **Warning:** This permanently overlays subtitles onto the video (can't be turned off)

```bash
ffmpeg -i video.mp4 -vf subtitles=subtitles.srt output_with_subs.mp4
```

**Use when:**
- Sharing video with people who can't load external subs
- Playing on devices without subtitle support
- Creating final/permanent video versions

---

## 📝 Subtitle File Formats

### WebVTT (.vtt)
```
WEBVTT

00:00:00.000 --> 00:00:02.000
Welcome to the video!

00:00:02.000 --> 00:00:05.000
This is a subtitle example.
```
- Web standard for HTML5 video
- Supports styling, positioning
- Used by YouTube, Netflix, etc.

### SubRip (.srt)
```
1
00:00:00,000 --> 00:00:02,000
Welcome to the video!

2
00:00:02,000 --> 00:00:05,000
This is a subtitle example.
```
- Most common format
- Widely supported
- Simple text-based

### TTML (.ttml)
- XML-based format
- Used in professional broadcasting
- Supports complex styling

---

## 🎯 Best Practices

### 1. **Always Check for Subtitles**
   - Click **📋 Extract Subs** to test if video has embedded captions
   - If FFmpeg outputs a file, subtitles are available!

### 2. **Naming Convention**
   ```
   video.mp4
   video.srt       ← Same name, different extension
   ```
   - Most players auto-load subtitles with matching names
   - Keep files in the same folder

### 3. **Multiple Languages**
   ```
   video.mp4
   video.en.srt    ← English
   video.es.srt    ← Spanish
   video.fr.srt    ← French
   ```
   - Add language code between name and extension
   - VLC and MPC-HC detect and offer language selection

### 4. **Subtitle Sync Issues**
   - If subtitles appear too early/late, use player controls to adjust timing
   - VLC: `H` (delay) / `G` (advance)
   - MPC-HC: Right-click subtitle → **Timing**

---

## 🚀 Quick Start Example

### Download Video + Subtitles + Play

**Step 1: Download with embedded subs**
```bash
ffmpeg -headers "Referer: https://courses.example.com/" -i "https://cdn.example.com/video.m3u8" -c copy -c:s mov_text "lesson.mp4"
```

**Step 2: Open in VLC**
```
Double-click lesson.mp4
→ Subtitles appear automatically!
```

**Step 3: Customize (Optional)**
```
VLC → Tools → Preferences → Subtitles/OSD
→ Change font, size, color, position
```

---

## ❓ Troubleshooting

### "No subtitle tracks found"
- Not all videos have embedded subtitles
- Check if extension detected separate `.vtt` or `.srt` files
- Some streams use external caption files (look for VTT badge)

### "Subtitles appear but wrong language"
- Video may have multiple subtitle tracks
- VLC: **Subtitle** → **Sub Track** → Select correct language
- MPC-HC: Press `D` to cycle through tracks

### "Subtitles out of sync"
- Use player's subtitle delay controls
- VLC: `H` (increase delay) / `G` (decrease delay)
- Or edit `.srt` file manually in text editor

### "Can't extract subtitles with FFmpeg"
- Some subtitles are graphical (images), not text
- Try: `ffmpeg -i video.m3u8 -map 0:s:0 -c dvdsub subs.sub`
- Or use OCR tools to convert image subs to text

---

## 📚 Additional Resources

- **FFmpeg Documentation**: https://ffmpeg.org/ffmpeg.html#Subtitle-options
- **VLC Subtitle Guide**: https://www.vlchelp.com/add-subtitles/
- **WebVTT Spec**: https://www.w3.org/TR/webvtt1/
- **Subtitle Edit Tool**: https://github.com/SubtitleEdit/subtitleedit (free subtitle editor)

---

## 🎓 Extension Features for Subtitles

### Detection
✅ Automatically detects `.vtt`, `.srt`, `.ttml` files
✅ Shows subtitle files with **VTT**, **SRT**, **TTML** badges
✅ Separate from video files for easy identification

### Download Options
✅ **📋 MP4+Subs** - Download video with embedded subtitles
✅ **📋 Extract Subs** - Save subtitles as separate `.srt` file
✅ **⬇️ Download Subtitle** - Direct download of detected subtitle files

### Quality Selector
✅ Works with subtitle extraction
✅ Select quality → Extract subs for that specific quality

---

## 💡 Pro Tips

1. **Testing for Subtitles:**
   ```bash
   # Check if video has subtitle streams
   ffmpeg -i video.m3u8 2>&1 | grep Subtitle
   ```
   If output shows "Subtitle: subrip", subtitles are available!

2. **Multi-Language Downloads:**
   Extract all languages at once:
   ```bash
   ffmpeg -i video.m3u8 -map 0:s -c copy subtitles.srt
   ```

3. **Preview Subtitles:**
   Open `.srt` or `.vtt` files in any text editor to preview/edit timing

4. **Browser DevTools:**
   - Open Network tab
   - Filter by `.vtt` or `.srt`
   - Find subtitle URLs directly from browser traffic

---

**Remember:** Only download content you have permission to access. This tool is for personal, lawful use only.
