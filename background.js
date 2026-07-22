/**
 * Media Stream Helper - Background Service Worker
 * 
 * This service worker monitors network requests to detect media streams.
 * It uses chrome.webRequest API to observe requests and stores detected media URLs
 * in chrome.storage.session for privacy (data clears when browser closes).
 * 
 * Permissions used:
 * - webRequest: To observe network requests for media files
 * - storage: To temporarily store detected media URLs
 * - tabs: To associate detected media with specific tabs
 * - host_permissions: Required to observe requests across all sites
 */

// Media file extensions to detect
const MEDIA_EXTENSIONS = [
  '.m3u8',  // HLS playlist
  '.mp4',   // Video
  '.webm',  // Video
  '.mp3',   // Audio
  '.m4a',   // Audio
  '.aac',   // Audio
  '.ts',    // Transport stream (often used with HLS)
  '.vtt',   // WebVTT subtitles
  '.srt',   // SubRip subtitles
  '.ttml'   // Timed Text Markup Language
];

// DRM/Protection indicators
const PROTECTION_INDICATORS = [
  'widevine',
  'license',
  'drm',
  'fairplay',
  'playready',
  '#EXT-X-KEY',
  'SAMPLE-AES',
  'EXT-X-SESSION-KEY'
];

// Maximum media items to store per tab
const MAX_ITEMS_PER_TAB = 50;

/**
 * Check if a URL contains a media extension
 */
function isMediaUrl(url) {
  const urlLower = url.toLowerCase();
  return MEDIA_EXTENSIONS.some(ext => {
    // Check if URL contains the extension in path (before query params)
    const urlPath = url.split('?')[0].toLowerCase();
    return urlPath.endsWith(ext) || urlPath.includes(ext + '?') || urlPath.includes(ext + '#');
  });
}

/**
 * Detect media type from URL
 */
function detectMediaType(url) {
  const urlLower = url.toLowerCase();
  const urlPath = url.split('?')[0].toLowerCase();
  
  if (urlPath.includes('.m3u8')) return 'HLS';
  if (urlPath.includes('.mp4')) return 'MP4';
  if (urlPath.includes('.webm')) return 'WEBM';
  if (urlPath.includes('.mp3')) return 'MP3';
  if (urlPath.includes('.m4a')) return 'M4A';
  if (urlPath.includes('.aac')) return 'AAC';
  if (urlPath.includes('.ts')) return 'TS';
  if (urlPath.includes('.vtt')) return 'VTT';
  if (urlPath.includes('.srt')) return 'SRT';
  if (urlPath.includes('.ttml')) return 'TTML';
  
  return 'UNKNOWN';
}

/**
 * Check if media type is a subtitle file
 */
function isSubtitle(mediaType) {
  return ['VTT', 'SRT', 'TTML'].includes(mediaType);
}

/**
 * Check if URL or content suggests protection/encryption
 */
function isPossiblyProtected(url) {
  const urlLower = url.toLowerCase();
  return PROTECTION_INDICATORS.some(indicator => 
    urlLower.includes(indicator.toLowerCase())
  );
}

/**
 * Check if media type is directly downloadable (not HLS)
 */
function isDirectDownloadable(mediaType) {
  return ['MP4', 'WEBM', 'MP3', 'M4A', 'AAC'].includes(mediaType);
}

/**
 * Extract useful headers from request
 */
function extractHeaders(details) {
  const headers = {};
  if (details.requestHeaders) {
    details.requestHeaders.forEach(header => {
      const name = header.name.toLowerCase();
      // Only capture headers useful for FFmpeg, not sensitive cookies
      if (['referer', 'origin', 'user-agent', 'accept', 'range'].includes(name)) {
        headers[header.name] = header.value;
      }
    });
  }
  return headers;
}

/**
 * Get page URL from tab
 */
async function getPageUrl(tabId) {
  try {
    // Validate tabId - some requests (e.g., service workers, extensions) don't have valid tab IDs
    if (tabId < 0 || tabId === undefined || tabId === null) {
      return '';
    }
    
    const tab = await chrome.tabs.get(tabId);
    return tab.url || '';
  } catch (error) {
    console.error('Error getting tab URL:', error);
    return '';
  }
}

/**
 * Store detected media in session storage
 */
async function storeDetectedMedia(mediaItem) {
  try {
    // Get current stored media
    const result = await chrome.storage.session.get('detectedMedia');
    const detectedMedia = result.detectedMedia || {};
    
    // Initialize array for this tab if needed
    const tabId = mediaItem.tabId.toString();
    if (!detectedMedia[tabId]) {
      detectedMedia[tabId] = [];
    }
    
    // Check if URL already exists for this tab (avoid duplicates)
    const exists = detectedMedia[tabId].some(item => item.url === mediaItem.url);
    if (!exists) {
      // Add to beginning of array (most recent first)
      detectedMedia[tabId].unshift(mediaItem);
      
      // Limit to MAX_ITEMS_PER_TAB
      if (detectedMedia[tabId].length > MAX_ITEMS_PER_TAB) {
        detectedMedia[tabId] = detectedMedia[tabId].slice(0, MAX_ITEMS_PER_TAB);
      }
      
      // Save back to storage
      await chrome.storage.session.set({ detectedMedia });
      
      console.log('Media detected:', mediaItem.mediaType, mediaItem.url);
    }
  } catch (error) {
    console.error('Error storing media:', error);
  }
}

/**
 * Listen for network requests
 */
chrome.webRequest.onBeforeSendHeaders.addListener(
  async (details) => {
    // Only process main_frame and sub_frame requests, and media requests
    const relevantTypes = ['main_frame', 'sub_frame', 'xmlhttprequest', 'media', 'other'];
    if (!relevantTypes.includes(details.type)) {
      return;
    }
    
    // Skip requests without valid tab IDs (e.g., service workers, background processes)
    if (details.tabId < 0 || details.tabId === undefined || details.tabId === null) {
      return;
    }
    
    // Check if URL is a media URL
    if (!isMediaUrl(details.url)) {
      return;
    }
    
    // Skip chrome:// and extension URLs
    if (details.url.startsWith('chrome://') || details.url.startsWith('chrome-extension://')) {
      return;
    }
    
    // Get page URL
    const pageUrl = await getPageUrl(details.tabId);
    
    // Extract headers
    const headers = extractHeaders(details);
    
    // If no Referer header, use the page URL as referer
    if (!headers['Referer'] && !headers['referer'] && pageUrl) {
      headers['Referer'] = pageUrl;
    }
    
    // Detect media type
    const mediaType = detectMediaType(details.url);
    
    // Create media item
    const mediaItem = {
      url: details.url,
      mediaType: mediaType,
      tabId: details.tabId,
      pageUrl: pageUrl,
      headers: headers,
      timestamp: Date.now(),
      isHLS: mediaType === 'HLS',
      isDirectDownloadable: isDirectDownloadable(mediaType),
      isPossiblyProtected: isPossiblyProtected(details.url),
      isSegment: mediaType === 'TS', // Mark individual .ts segments
      isSubtitle: isSubtitle(mediaType) // Mark subtitle files
    };
    
    // Store the detected media
    await storeDetectedMedia(mediaItem);
  },
  { urls: ["<all_urls>"] },
  ["requestHeaders"]
);

/**
 * Clean up storage when tabs are closed
 */
chrome.tabs.onRemoved.addListener(async (tabId) => {
  try {
    const result = await chrome.storage.session.get('detectedMedia');
    const detectedMedia = result.detectedMedia || {};
    
    // Remove data for closed tab
    delete detectedMedia[tabId.toString()];
    
    await chrome.storage.session.set({ detectedMedia });
  } catch (error) {
    console.error('Error cleaning up tab data:', error);
  }
});

console.log('Media Stream Helper: Background service worker initialized');

/**
 * DOWNLOAD MANAGER
 * Handles downloads via native messaging host
 * Persists across popup closing
 */

// Active downloads map (download ID -> port)
const activeDownloads = new Map();

/**
 * Handle messages from popup
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'startDownload') {
    handleDownloadRequest(message.data)
      .then(result => sendResponse({ success: true, downloadId: result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep channel open for async response
  }
  
  if (message.action === 'getActiveDownloads') {
    getActiveDownloads()
      .then(downloads => sendResponse({ success: true, downloads }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
  
  if (message.action === 'clearDownload') {
    clearDownload(message.downloadId)
      .then(() => sendResponse({ success: true }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
  
  if (message.action === 'clearAllDownloads') {
    clearAllDownloads()
      .then(() => sendResponse({ success: true }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
  
  if (message.action === 'retryDownload') {
    retryDownload(message.downloadId, message.url, message.outputPath)
      .then(result => sendResponse({ success: true, downloadId: result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
});

/**
 * Start a download using native messaging host
 */
async function handleDownloadRequest(downloadData) {
  const downloadId = `download_${Date.now()}`;
  
  try {
    // Create notification
    chrome.notifications.create(downloadId, {
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: 'Download Started',
      message: `Downloading ${downloadData.mediaType} stream...`,
      priority: 1
    });
    
    // Store download info
    await storeDownloadInfo(downloadId, {
      url: downloadData.url,
      status: 'starting',
      mediaType: downloadData.mediaType,
      outputPath: downloadData.outputPath,
      timestamp: Date.now()
    });
    
    // Connect to native messaging host
    const port = chrome.runtime.connectNative('com.media_stream_helper.downloader');
    activeDownloads.set(downloadId, port);
    
    // Listen for messages
    port.onMessage.addListener(async (msg) => {
      await handleNativeHostMessage(downloadId, msg);
    });
    
    // Handle disconnect
    port.onDisconnect.addListener(async () => {
      await handleNativeHostDisconnect(downloadId);
    });
    
    // Send download request
    port.postMessage({
      action: 'download',
      url: downloadData.url,
      output_path: downloadData.outputPath,
      headers: downloadData.headers || {},
      media_type: downloadData.mediaType
    });
    
    return downloadId;
    
  } catch (error) {
    console.error('Download error:', error);
    
    // Update notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: 'Download Failed',
      message: error.message,
      priority: 2
    });
    
    throw error;
  }
}

/**
 * Handle messages from native host
 */
async function handleNativeHostMessage(downloadId, message) {
  if (message.type === 'progress') {
    const status = message.status || 'downloading';
    
    // Update download status
    await updateDownloadStatus(downloadId, {
      status: status,
      message: message.message
    });
    
    // Show notifications for specific status changes
    if (status === 'retrying') {
      // Network error, retrying
      chrome.notifications.create(downloadId + '_retry', {
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: '🔄 Retrying Download',
        message: message.message || `Retrying... (attempt ${message.attempt}/${message.max_attempts})`,
        priority: 1
      });
    } else if (status === 'waiting') {
      // Waiting before retry
      chrome.notifications.create(downloadId + '_wait', {
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: '⏳ Network Error',
        message: message.message || `Retrying in ${message.delay}s...`,
        priority: 1
      });
    } else if (status === 'resuming') {
      // Resuming a previous download
      chrome.notifications.create(downloadId + '_resume', {
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: '▶️ Resuming Download',
        message: message.message || 'Resuming previous download...',
        priority: 1
      });
    }
    
  } else if (message.type === 'result') {
    // Download complete
    const port = activeDownloads.get(downloadId);
    if (port) {
      port.disconnect();
      activeDownloads.delete(downloadId);
    }
    
    if (message.success) {
      const sizeKB = Math.round(message.file_size / 1024);
      
      // Update storage
      await updateDownloadStatus(downloadId, {
        status: 'complete',
        filePath: message.output_path,
        fileSize: message.file_size
      });
      
      // Show success notification
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: '✅ Download Complete!',
        message: `Downloaded ${sizeKB} KB\n${message.output_path}`,
        priority: 1
      });
    } else {
      // Update storage
      await updateDownloadStatus(downloadId, {
        status: 'failed',
        error: message.message
      });
      
      // Determine if this was after retries
      const attemptsMsg = message.attempts ? ` (after ${message.attempts} attempts)` : '';
      
      // Show error notification
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: '❌ Download Failed' + attemptsMsg,
        message: message.message || 'Unknown error',
        priority: 2
      });
    }
  }
}

/**
 * Handle native host disconnect
 */
async function handleNativeHostDisconnect(downloadId) {
  const error = chrome.runtime.lastError;
  activeDownloads.delete(downloadId);
  
  // Check if download was already marked as complete
  const info = await getDownloadInfo(downloadId);
  if (info && info.status === 'complete') {
    return; // Normal completion
  }
  
  // Unexpected disconnect
  await updateDownloadStatus(downloadId, {
    status: 'failed',
    error: error ? error.message : 'Connection lost'
  });
  
  if (error) {
    let errorMsg = error.message;
    if (errorMsg.includes('Specified native messaging host not found')) {
      errorMsg = 'Native host not installed. Run installer in native-host folder.';
    }
    
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: 'Download Error',
      message: errorMsg,
      priority: 2
    });
  }
}

/**
 * Store download info
 */
async function storeDownloadInfo(downloadId, info) {
  try {
    const result = await chrome.storage.local.get('activeDownloads');
    const downloads = result.activeDownloads || {};
    downloads[downloadId] = info;
    await chrome.storage.local.set({ activeDownloads: downloads });
  } catch (error) {
    console.error('Error storing download info:', error);
  }
}

/**
 * Update download status
 */
async function updateDownloadStatus(downloadId, updates) {
  try {
    const result = await chrome.storage.local.get('activeDownloads');
    const downloads = result.activeDownloads || {};
    if (downloads[downloadId]) {
      // Update with timestamp for the update
      downloads[downloadId] = { 
        ...downloads[downloadId], 
        ...updates,
        lastUpdate: Date.now()
      };
      await chrome.storage.local.set({ activeDownloads: downloads });
    }
  } catch (error) {
    console.error('Error updating download status:', error);
  }
}

/**
 * Get download info
 */
async function getDownloadInfo(downloadId) {
  try {
    const result = await chrome.storage.local.get('activeDownloads');
    const downloads = result.activeDownloads || {};
    return downloads[downloadId] || null;
  } catch (error) {
    console.error('Error getting download info:', error);
    return null;
  }
}

/**
 * Get all active downloads
 */
async function getActiveDownloads() {
  try {
    const result = await chrome.storage.local.get('activeDownloads');
    return result.activeDownloads || {};
  } catch (error) {
    console.error('Error getting active downloads:', error);
    return {};
  }
}

/**
 * Clear a specific download from history
 */
async function clearDownload(downloadId) {
  try {
    const result = await chrome.storage.local.get('activeDownloads');
    const downloads = result.activeDownloads || {};
    delete downloads[downloadId];
    await chrome.storage.local.set({ activeDownloads: downloads });
  } catch (error) {
    console.error('Error clearing download:', error);
    throw error;
  }
}

/**
 * Clear all downloads from history
 */
async function clearAllDownloads() {
  try {
    await chrome.storage.local.set({ activeDownloads: {} });
  } catch (error) {
    console.error('Error clearing all downloads:', error);
    throw error;
  }
}

/**
 * Retry a failed download
 */
async function retryDownload(oldDownloadId, url, outputPath) {
  try {
    // Get the old download info for headers and media type
    const downloads = await getActiveDownloads();
    const oldDownload = downloads[oldDownloadId];
    
    if (!oldDownload) {
      throw new Error('Download not found');
    }
    
    // Clear the old download entry
    await clearDownload(oldDownloadId);
    
    // Start a new download with the same parameters
    const downloadData = {
      url: url || oldDownload.url,
      outputPath: outputPath || oldDownload.outputPath,
      headers: oldDownload.headers || {},
      mediaType: oldDownload.mediaType || 'unknown'
    };
    
    return await handleDownloadRequest(downloadData);
  } catch (error) {
    console.error('Error retrying download:', error);
    throw error;
  }
}
