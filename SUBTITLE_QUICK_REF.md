# Subtitle Quick Reference

## 🎯 Extension v1.4.0 - Subtitle Support Added!

### What's New

#### ✅ Automatic Subtitle Detection
- Detects `.vtt` (WebVTT), `.srt` (SubRip), `.ttml` subtitle files
- Shows subtitle files with badges: **VTT**, **SRT**, **TTML**
- Separate from video streams for easy identification

#### ✅ New Download Options

| Button | What It Does | Output |
|--------|-------------|--------|
| **📋 MP4+Subs** | Download video with embedded subtitles | `output.mp4` (subs built-in) |
| **📋 Extract Subs** | Extract subtitles to separate file | `output.srt` |
| **⬇️ Download Subtitle** | Direct download subtitle file | `.vtt`, `.srt`, or `.ttml` |

---

## 🚀 Quick Start

### Method 1: Embedded Subtitles (Easiest)

1. Click **📋 MP4+Subs** next to your video
2. Run the FFmpeg command in terminal
3. Open `output.mp4` in VLC
4. Subtitles work automatically! ✨

**FFmpeg Command:**
```bash
ffmpeg -headers "Referer: https://..." -i "video.m3u8" -c copy -c:s mov_text "output.mp4"
```

---

### Method 2: Separate Subtitle File

1. Click **📋 Extract Subs** next to your video
2. Run the FFmpeg command
3. Place `output.srt` in same folder as video
4. Rename to match: `video.mp4` + `video.srt`
5. Open video → subtitles load automatically

**FFmpeg Command:**
```bash
ffmpeg -headers "Referer: https://..." -i "video.m3u8" -map 0:s:0 "output.srt"
```

---

### Method 3: Direct Download (If Detected)

If extension shows **VTT**, **SRT**, or **TTML** items:

1. Click **⬇️ Download Subtitle** button
2. Save to same folder as video
3. Rename to match video name
4. Done!

---

## 🎥 Playing Videos with Subtitles

### VLC (Recommended)

**Embedded:**
- Open video → Subtitles appear automatically
- Toggle: **Subtitle** → **Sub Track** → Select language

**External:**
- Place `.srt` in same folder as video
- Name it the same: `video.mp4` + `video.srt`
- VLC loads automatically

**Controls:**
- `V` - Cycle subtitle tracks
- `H` - Delay subtitles
- `G` - Advance subtitles

---

### Windows Media Player

**Embedded:**
- Right-click → **Lyrics, captions, and subtitles** → **On**

**External:**
- Place `.srt` with matching name in same folder
- WMP auto-loads when playing

---

### MPC-HC

**Embedded:**
- Press `D` to cycle subtitle tracks

**External:**
- Drag `.srt` onto player window
- Or auto-loads with matching filename

---

## 📋 FFmpeg Subtitle Commands Reference

### Basic Extraction
```bash
# Extract first subtitle track
ffmpeg -i video.m3u8 -map 0:s:0 subtitles.srt
```

### Embed Subtitles in MP4
```bash
# Embed subtitles in video file
ffmpeg -i video.m3u8 -c copy -c:s mov_text output.mp4
```

### Convert Formats
```bash
# VTT to SRT
ffmpeg -i subtitles.vtt subtitles.srt

# SRT to VTT
ffmpeg -i subtitles.srt subtitles.vtt
```

### Hardcode (Burn) Subtitles
```bash
# Permanently overlay subtitles onto video
ffmpeg -i video.mp4 -vf subtitles=subtitles.srt output.mp4
```
⚠️ Can't turn off hardcoded subs later!

---

## 💡 Pro Tips

### Naming Convention
```
video.mp4          ← Video file
video.srt          ← Subtitles (auto-loads)
video.en.srt       ← English subtitles
video.es.srt       ← Spanish subtitles
```

### Check for Subtitles
```bash
# See if video has subtitle streams
ffmpeg -i video.m3u8 2>&1 | grep Subtitle
```

If output shows `Subtitle: subrip` → Subtitles available!

### Subtitle Timing Issues
- **VLC:** Press `H` (delay) or `G` (advance)
- **MPC-HC:** Right-click subtitle → Timing
- **Edit manually:** Open `.srt` in text editor

---

## ❓ Troubleshooting

| Problem | Solution |
|---------|----------|
| No subtitles found | Not all videos have captions - try Extract Subs button to check |
| Wrong language | Cycle through tracks: VLC press `V`, MPC-HC press `D` |
| Out of sync | Use player controls: VLC `H`/`G`, MPC-HC right-click → Timing |
| Can't extract | Some subs are images (not text) - try different format or OCR tool |

---

## 📖 Full Documentation

See **[SUBTITLE_GUIDE.md](SUBTITLE_GUIDE.md)** for:
- Detailed player instructions
- Advanced FFmpeg commands
- Subtitle format specifications
- Multi-language support
- Troubleshooting guide

---

## ✨ Example Workflow

**Goal:** Download a course video with subtitles

```bash
# 1. Use extension to get FFmpeg command
# Click: 📋 MP4+Subs

# 2. Run in terminal
ffmpeg -headers "Referer: https://courses.example.com/" \
  -i "https://cdn.example.com/course/video.m3u8" \
  -c copy -c:s mov_text "Lesson_1.mp4"

# 3. Open in VLC
# Double-click Lesson_1.mp4
# Subtitles appear automatically!

# 4. (Optional) Extract subs for editing
ffmpeg -i "Lesson_1.mp4" -map 0:s:0 "Lesson_1.srt"
```

---

**Version:** 1.4.0  
**Updated:** 2026-07-08  
**Feature:** Closed Caption Support
