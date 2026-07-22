# 📥 Automatic Download Resume Feature

## Overview

Media Stream Helper now includes **automatic download resume** functionality that seamlessly handles network interruptions during media downloads. When your connection drops, downloads will automatically retry with intelligent exponential backoff until they succeed or reach the maximum retry limit.

## 🎯 Key Features

### 1. **Automatic Retry with Exponential Backoff**
- Downloads automatically retry when network errors occur
- Uses exponential backoff: 2s → 4s → 8s → 16s → 32s between attempts
- Maximum 5 retry attempts by default (configurable)
- Smart error detection distinguishes network issues from permanent failures

### 2. **FFmpeg Reconnection Support**
For HLS streams, FFmpeg's built-in reconnection capabilities are enabled:
- `-reconnect 1` - Enable automatic reconnection
- `-reconnect_streamed 1` - Reconnect for streamed content
- `-reconnect_delay_max 5` - Maximum 5 seconds between reconnection attempts
- `-timeout 30000000` - 30-second connection timeout

### 3. **Download State Persistence**
- Download state is saved to temporary files during active downloads
- Enables manual resume even if the Python process crashes
- State includes: URL, headers, output path, attempt number, timestamp
- State files are automatically cleaned up on successful completion

### 4. **Smart Error Detection**
The system intelligently categorizes errors to determine retry behavior:

**Network Errors (Will Retry):**
- Connection refused
- Connection timed out
- Connection reset
- Could not resolve host
- I/O errors
- Protocol errors
- Network unreachable
- Temporary DNS failures

**Non-Retryable Errors (Fail Immediately):**
- 403 Forbidden
- 404 Not Found
- 401 Unauthorized
- DRM/encryption errors

### 5. **Real-Time Progress Notifications**
Enhanced notifications show:
- Current retry attempt (e.g., "attempt 2/5")
- Countdown until next retry (e.g., "retrying in 4s...")
- Network error messages
- Final status with total attempts made

## 📖 How It Works

### Automatic Retry Flow

1. **Download Starts** → Normal download begins
2. **Network Error Detected** → System identifies the error type
3. **Retry Decision** → Checks if error is network-related
4. **Wait Period** → Exponential backoff delay
5. **Retry Attempt** → Download restarts from beginning
6. **Repeat** → Steps 2-5 until success or max retries reached

### Example Retry Sequence

```
Attempt 1: Start download → Network error
           Wait 2 seconds...

Attempt 2: Retry download → Network error  
           Wait 4 seconds...

Attempt 3: Retry download → Network error
           Wait 8 seconds...

Attempt 4: Retry download → Success! ✓
```

## 🚀 Usage

### Standard Downloads (Automatic)

No action required! The retry mechanism is **enabled by default** for all downloads:

```javascript
// Extension automatically uses retry
chrome.runtime.sendMessage({
  action: 'startDownload',
  data: {
    url: 'https://example.com/video.m3u8',
    outputPath: 'C:\\Downloads\\video.mp4',
    mediaType: 'HLS',
    headers: { ... }
  }
});
```

### Custom Retry Configuration

You can specify a custom maximum retry count:

```python
# In the native host request
{
  "action": "download",
  "url": "...",
  "output_path": "...",
  "max_retries": 10  # Override default of 5
}
```

### Manual Resume (Advanced)

If a download fails and you want to manually resume later:

```python
# Resume download action
{
  "action": "resume_download",
  "url": "https://example.com/video.m3u8",
  "output_path": "C:\\Downloads\\video.mp4"
}
```

The system will load the saved state (if available) and resume the download.

## 🔧 Technical Details

### State File Location

State files are stored in the system temporary directory:
- **Windows:** `%TEMP%\download_state_<hash>.json`
- **macOS/Linux:** `/tmp/download_state_<hash>.json`

File name format: `download_state_{MD5_hash}.json`
- Hash is derived from URL + output path for uniqueness

### State File Contents

```json
{
  "url": "https://example.com/video.m3u8",
  "output_path": "C:\\Downloads\\video.mp4",
  "headers": {
    "Referer": "https://example.com/",
    "User-Agent": "Mozilla/5.0..."
  },
  "media_type": "HLS",
  "attempt": 3,
  "timestamp": 1658540123.456
}
```

### Notification Status Types

| Status | Icon | Meaning |
|--------|------|---------|
| `downloading` | ⏳ | Download in progress |
| `retrying` | 🔄 | Network error, retrying download |
| `waiting` | ⏳ | Waiting before next retry attempt |
| `resuming` | ▶️ | Resuming from saved state |
| `complete` | ✅ | Download successful |
| `failed` | ❌ | Download failed (max retries or permanent error) |

## 🧪 Testing the Feature

### Test Scenario 1: Network Interruption During Download

1. Start a large HLS stream download
2. Disconnect your network (disable WiFi or unplug ethernet)
3. **Expected:** Notification shows "Network error, retrying in Xs..."
4. Reconnect your network
5. **Expected:** Download automatically continues and completes

### Test Scenario 2: Temporary Network Issues

1. Start a download
2. Briefly interrupt network connection multiple times
3. **Expected:** Each interruption triggers a retry with increasing delays
4. **Expected:** Download eventually completes successfully

### Test Scenario 3: Permanent Failure

1. Start a download with an invalid URL (404)
2. **Expected:** Fails immediately without retry attempts
3. **Expected:** Error message shows "non-retryable error"

### Test Scenario 4: Max Retries Exhausted

1. Start a download
2. Keep network disconnected through all 5 retry attempts
3. **Expected:** Final notification shows "Failed after 5 attempts"

## ⚙️ Configuration Options

### Modify Retry Settings

Edit `native-host/media_downloader.py`:

```python
# At the top of the file
MAX_RETRY_ATTEMPTS = 5  # Change default max retries
RETRY_DELAYS = [2, 4, 8, 16, 32]  # Modify backoff delays (seconds)
```

### Disable Retry for Specific Downloads

Set `max_retries` to 1 in the download request:

```python
{
  "action": "download",
  "max_retries": 1,  # No retries, fail immediately
  ...
}
```

## 🐛 Troubleshooting

### Issue: Downloads keep retrying but never succeed

**Solution:** Check if the URL requires authentication or has expired. The system will keep retrying network errors, but if the URL is invalid or requires new credentials, you'll need to get a fresh URL.

### Issue: State file not being cleared

**Solution:** State files are automatically cleaned up on successful completion. If a download fails, the state file remains for potential manual resume. You can manually delete files in `%TEMP%\download_state_*.json`.

### Issue: Too many retry notifications

**Solution:** Reduce `MAX_RETRY_ATTEMPTS` in `media_downloader.py` to 2-3 attempts for faster failure feedback.

### Issue: Retry delays are too long

**Solution:** Modify `RETRY_DELAYS` array in `media_downloader.py` to use shorter delays:
```python
RETRY_DELAYS = [1, 2, 3, 4, 5]  # Shorter delays
```

## 📊 Benefits

### Before Automatic Resume
- ❌ Network interruption = complete download failure
- ❌ Manual retry required
- ❌ Lost progress on large files
- ❌ No feedback on network status

### After Automatic Resume
- ✅ Network interruptions handled gracefully
- ✅ Automatic retry with smart backoff
- ✅ Downloads complete even with unstable connections
- ✅ Clear progress notifications
- ✅ Persistent state for crash recovery
- ✅ Intelligent error categorization

## 🔐 Privacy & Security

- State files contain URLs and headers but **no passwords or tokens**
- Files are stored in OS temporary directory (cleared on reboot)
- State files are automatically deleted after successful downloads
- Only the current user can access state files (OS permissions)

## 📝 Version History

**Version 1.5.0** (2026-07-22)
- ✨ Added automatic download resume with retry logic
- ✨ Implemented exponential backoff strategy
- ✨ Added FFmpeg reconnection options for HLS
- ✨ Implemented download state persistence
- ✨ Added smart network error detection
- ✨ Enhanced progress notifications
- ✨ Added manual resume capability

## 🤝 Contributing

To improve the automatic resume feature:

1. Test with various network conditions
2. Report edge cases or failure scenarios
3. Suggest optimal retry configurations
4. Help identify additional network error patterns

## 📄 License

Same as Media Stream Helper main license.
