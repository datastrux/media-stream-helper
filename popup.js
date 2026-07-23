/**
 * Media Stream Helper - Popup UI Script
 * 
 * This script handles the popup UI interactions, displays detected media,
 * and generates FFmpeg commands for downloading/converting media streams.
 */

// DOM elements
let tabInfoEl;
let warningSection;
let mediaListEl;
let emptyStateEl;
let actionsEl;
let clearBtn;
let showSegmentsToggle;

// Current tab ID
let currentTabId = null;

// Settings
let showIndividualSegments = false;

/**
 * Initialize popup
 */
async function init() {
  // Get DOM elements
  tabInfoEl = document.getElementById('tabInfo');
  warningSection = document.getElementById('warningSection');
  mediaListEl = document.getElementById('mediaList');
  emptyStateEl = document.getElementById('emptyState');
  actionsEl = document.getElementById('actions');
  clearBtn = document.getElementById('clearBtn');

  // Set up event listeners
  clearBtn.addEventListener('click', handleClearAll);
  
  // Check if toggle exists (will add to HTML)
  showSegmentsToggle = document.getElementById('showSegmentsToggle');
  if (showSegmentsToggle) {
    showSegmentsToggle.addEventListener('change', (e) => {
      showIndividualSegments = e.target.checked;
      loadDetectedMedia();
    });
  }

  // Get current tab
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tabs.length > 0) {
    currentTabId = tabs[0].id;
    
    // Display tab info
    displayTabInfo(tabs[0]);
    
    // Display active downloads
    await displayActiveDownloads();
    
    // Load and display detected media
    await loadDetectedMedia();
  } else {
    tabInfoEl.innerHTML = '<div class="loading">No active tab found</div>';
  }
}

/**
 * Display current tab information
 */
function displayTabInfo(tab) {
  const url = tab.url || 'Unknown';
  const title = tab.title || 'Unknown';
  
  tabInfoEl.innerHTML = `
    <div><strong>Current Page:</strong></div>
    <div class="tab-url" title="${escapeHtml(url)}">${escapeHtml(truncate(url, 60))}</div>
  `;
}

/**
 * Display active downloads
 */
async function displayActiveDownloads() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getActiveDownloads' });
    
    if (!response.success) {
      return;
    }
    
    const downloads = response.downloads;
    const downloadIds = Object.keys(downloads);
    
    if (downloadIds.length === 0) {
      return;
    }
    
    // Show all downloads, sorted by timestamp (newest first)
    const allDownloads = downloadIds
      .map(id => ({ id, ...downloads[id] }))
      .sort((a, b) => b.timestamp - a.timestamp);
    
    // Create download status section
    const statusSection = document.createElement('div');
    statusSection.id = 'downloadStatus';
    statusSection.style.cssText = `
      background: #e3f2fd;
      border-left: 4px solid #2196f3;
      padding: 12px;
      margin: 10px 0;
      border-radius: 4px;
      max-height: 400px;
      overflow-y: auto;
    `;
    
    // Header with clear all button
    const header = document.createElement('div');
    header.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;';
    
    const title = document.createElement('div');
    title.style.cssText = 'font-weight: bold; font-size: 13px; color: #1976d2;';
    title.textContent = `📥 Downloads (${allDownloads.length})`;
    
    const clearAllBtn = document.createElement('button');
    clearAllBtn.textContent = '🗑️ Clear All';
    clearAllBtn.style.cssText = 'font-size: 10px; padding: 3px 8px; cursor: pointer; border: 1px solid #ccc; border-radius: 3px; background: white;';
    clearAllBtn.onclick = async () => {
      if (confirm('Clear all download history?')) {
        clearAllBtn.disabled = true;
        clearAllBtn.textContent = 'Clearing...';
        await chrome.runtime.sendMessage({ action: 'clearAllDownloads' });
        location.reload();
      }
    };
    
    header.appendChild(title);
    header.appendChild(clearAllBtn);
    statusSection.appendChild(header);
    
    allDownloads.forEach(download => {
      const item = document.createElement('div');
      item.style.cssText = 'font-size: 11px; padding: 8px; background: white; border-radius: 3px; margin-bottom: 6px; border: 1px solid #ddd;';
      
      const statusIcon = {
        'starting': '🔌',
        'downloading': '⏳',
        'retrying': '🔄',
        'waiting': '⏳',
        'resuming': '▶️',
        'complete': '✅',
        'failed': '❌'
      }[download.status] || '❓';
      
      // Calculate elapsed time
      const elapsed = Date.now() - download.timestamp;
      const elapsedText = formatElapsedTime(elapsed);
      
      // Status color
      const statusColor = {
        'complete': '#4caf50',
        'failed': '#f44336',
        'retrying': '#ff9800',
        'waiting': '#ff9800'
      }[download.status] || '#2196f3';
      
      let statusHtml = `
        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 4px;">
          <div style="font-weight: 600; color: ${statusColor};">${statusIcon} ${download.status.toUpperCase()}</div>
          <div style="font-size: 10px; color: #999;">${elapsedText}</div>
        </div>
        <div style="color: #666; font-size: 10px; margin-bottom: 2px;">${download.mediaType}</div>
        <div style="color: #999; font-size: 9px;">${new Date(download.timestamp).toLocaleString()}</div>
      `;
      
      // Show progress message if available
      if (download.message) {
        statusHtml += `<div style="color: #666; font-size: 10px; margin-top: 4px; font-style: italic;">${escapeHtml(download.message)}</div>`;
      }
      
      // Show error message if failed
      if (download.status === 'failed' && download.error) {
        const shortError = download.error.length > 100 ? download.error.substring(0, 100) + '...' : download.error;
        statusHtml += `<div style="color: #f44336; font-size: 10px; margin-top: 4px; background: #ffebee; padding: 4px; border-radius: 2px;">${escapeHtml(shortError)}</div>`;
      }
      
      // Show file info if complete
      if (download.status === 'complete' && download.fileSize) {
        const sizeKB = Math.round(download.fileSize / 1024);
        const sizeMB = (download.fileSize / 1024 / 1024).toFixed(2);
        const sizeText = download.fileSize > 1024 * 1024 ? `${sizeMB} MB` : `${sizeKB} KB`;
        statusHtml += `<div style="color: #4caf50; font-size: 10px; margin-top: 4px;">📁 ${sizeText}</div>`;
      }
      
      item.innerHTML = statusHtml;
      
      // Add action buttons for failed downloads
      if (download.status === 'failed') {
        const btnContainer = document.createElement('div');
        btnContainer.style.cssText = 'margin-top: 6px; display: flex; gap: 4px;';
        
        const retryBtn = document.createElement('button');
        retryBtn.textContent = '🔄 Retry';
        retryBtn.style.cssText = 'font-size: 9px; padding: 3px 6px; cursor: pointer; border: 1px solid #2196f3; border-radius: 3px; background: #e3f2fd; color: #2196f3;';
        retryBtn.onclick = async () => {
          retryBtn.disabled = true;
          retryBtn.textContent = 'Retrying...';
          await chrome.runtime.sendMessage({ 
            action: 'retryDownload', 
            downloadId: download.id,
            url: download.url,
            outputPath: download.outputPath
          });
          setTimeout(() => location.reload(), 100);
        };
        
        const clearBtn = document.createElement('button');
        clearBtn.textContent = '✕ Clear';
        clearBtn.style.cssText = 'font-size: 9px; padding: 3px 6px; cursor: pointer; border: 1px solid #ccc; border-radius: 3px; background: white;';
        clearBtn.onclick = async () => {
          clearBtn.disabled = true;
          clearBtn.textContent = '...';
          await chrome.runtime.sendMessage({ action: 'clearDownload', downloadId: download.id });
          setTimeout(() => location.reload(), 100);
        };
        
        btnContainer.appendChild(retryBtn);
        btnContainer.appendChild(clearBtn);
        item.appendChild(btnContainer);
      }
      
      // Add clear button for completed downloads
      if (download.status === 'complete') {
        const btnContainer = document.createElement('div');
        btnContainer.style.cssText = 'margin-top: 6px;';
        
        const clearBtn = document.createElement('button');
        clearBtn.textContent = '✓ Clear';
        clearBtn.style.cssText = 'font-size: 9px; padding: 3px 6px; cursor: pointer; border: 1px solid #4caf50; border-radius: 3px; background: #e8f5e9; color: #4caf50;';
        clearBtn.onclick = async () => {
          clearBtn.disabled = true;
          clearBtn.textContent = '...';
          await chrome.runtime.sendMessage({ action: 'clearDownload', downloadId: download.id });
          setTimeout(() => location.reload(), 100);
        };
        
        btnContainer.appendChild(clearBtn);
        item.appendChild(btnContainer);
      }
      
      statusSection.appendChild(item);
    });
    
    // Insert at the top of the popup
    const container = document.querySelector('.container');
    container.insertBefore(statusSection, container.firstChild.nextSibling);
    
  } catch (error) {
    console.error('Error displaying downloads:', error);
  }
}

/**
 * Format elapsed time
 */
function formatElapsedTime(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d ${hours % 24}h ago`;
  if (hours > 0) return `${hours}h ${minutes % 60}m ago`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s ago`;
  return `${seconds}s ago`;
}

/**
 * Load detected media from storage
 */
async function loadDetectedMedia() {
  try {
    console.log('[Popup] Loading media for tab:', currentTabId);
    const result = await chrome.storage.session.get('detectedMedia');
    const detectedMedia = result.detectedMedia || {};
    console.log('[Popup] All detected media:', detectedMedia);
    console.log('[Popup] Tab IDs available:', Object.keys(detectedMedia));
    
    const mediaItems = detectedMedia[currentTabId.toString()] || [];
    console.log('[Popup] Media items for this tab:', mediaItems.length, mediaItems);
    
    displayMediaItems(mediaItems);
  } catch (error) {
    console.error('Error loading media:', error);
    showError('Failed to load detected media');
  }
}

/**
 * Display media items in the UI
 */
function displayMediaItems(mediaItems) {
  console.log('[Popup displayMediaItems] Total items:', mediaItems.length);
  
  // DEBUG: Log first few items to see their properties
  if (mediaItems.length > 0) {
    console.log('[DEBUG] First item:', mediaItems[0]);
    console.log('[DEBUG] First item isHLS:', mediaItems[0].isHLS);
    console.log('[DEBUG] First item isSegment:', mediaItems[0].isSegment);
    console.log('[DEBUG] First item mediaType:', mediaItems[0].mediaType);
    console.log('[DEBUG] showIndividualSegments:', showIndividualSegments);
  }
  
  // Clear previous content
  mediaListEl.innerHTML = '';
  // Filter and group items
  const playlists = [];
  const directMedia = [];
  const segments = [];
  
  mediaItems.forEach(item => {
    if (item.isSegment && !showIndividualSegments) {
      segments.push(item);
    } else if (item.isHLS) {
      playlists.push(item);
    } else {
      directMedia.push(item);
    }
  });
  
  console.log('[Popup displayMediaItems] Playlists:', playlists.length, 'Direct:', directMedia.length, 'Segments:', segments.length);
  
  // Group playlists by base path (same video, different qualities)
  const groupedPlaylists = groupPlaylistsByVideo(playlists);
  console.log('[Popup displayMediaItems] Grouped playlists:', Object.keys(groupedPlaylists).length, groupedPlaylists);
  
  const visibleItems = [...Object.values(groupedPlaylists), ...directMedia];
  console.log('[Popup displayMediaItems] Visible items:', visibleItems.length);
  
  if (visibleItems.length === 0 && !showIndividualSegments) {
    // Show message about hidden segments
    mediaListEl.innerHTML = `
      <div style="padding: 20px; text-align: center; color: #666;">
        <p>Only individual video segments detected.</p>
        <p>Look for the <strong>.m3u8 playlist</strong> by playing the video.</p>
        <p style="font-size: 12px; margin-top: 10px;">
          <label style="cursor: pointer;">
            <input type="checkbox" id="showSegmentsInline" style="margin-right: 5px;">
            Show individual segments (advanced)
          </label>
        </p>
      </div>
    `;
    document.getElementById('showSegmentsInline')?.addEventListener('change', (e) => {
      showIndividualSegments = e.target.checked;
      loadDetectedMedia();
    });
    actionsEl.classList.add('hidden');
    warningSection.classList.add('hidden');
    return;
  }
  
  // Hide empty state
  emptyStateEl.classList.add('hidden');
  actionsEl.classList.remove('hidden');
  
  // Check if any items are protected
  const hasProtected = mediaItems.some(item => item.isPossiblyProtected);
  if (hasProtected) {
    warningSection.classList.remove('hidden');
  } else {
    warningSection.classList.add('hidden');
  }
  
  // Create grouped playlist elements
  Object.entries(groupedPlaylists).forEach(([groupKey, group]) => {
    const groupEl = createGroupedPlaylistElement(group, mediaItems);
    mediaListEl.appendChild(groupEl);
  });
  
  // Create direct media elements
  directMedia.forEach((item, index) => {
    const itemEl = createMediaItemElement(item, mediaItems.indexOf(item), mediaItems);
    mediaListEl.appendChild(itemEl);
  });
  
  // Show segments if enabled
  if (showIndividualSegments && segments.length > 0) {
    const segmentsHeader = document.createElement('div');
    segmentsHeader.style.cssText = 'padding: 10px; background: #f5f5f5; margin: 10px 0; font-weight: bold; font-size: 12px;';
    segmentsHeader.textContent = `Individual Segments (${segments.length})`;
    mediaListEl.appendChild(segmentsHeader);
    
    segments.forEach((item, index) => {
      const itemEl = createMediaItemElement(item, mediaItems.indexOf(item), mediaItems);
      mediaListEl.appendChild(itemEl);
    });
  }
}

/**
 * Group playlists by base video URL
 */
function groupPlaylistsByVideo(playlists) {
  const groups = {};
  
  playlists.forEach(item => {
    const url = item.url;
    
    // Try to extract video ID or base path from URL
    // Pattern 1: /video-id/quality/file.m3u8 (e.g., /abc-123/1080p/video.m3u8)
    // Pattern 2: /video-id/playlist.m3u8 (master playlist)
    // Pattern 3: /video-id/file.m3u8 (simple structure)
    
    let groupKey = null;
    
    // Try to find a UUID-like video ID or unique path segment
    const videoIdMatch = url.match(/\/([a-f0-9-]{30,})\/(?:[\d]+p\/|playlist\.m3u8|[^\/]+\.m3u8)/i);
    if (videoIdMatch) {
      // Found video ID - use it as group key
      groupKey = videoIdMatch[1];
    } else {
      // Try to find base path before quality folder
      const basePathMatch = url.match(/^(.*?)\/([\d]+p|playlist)\/.*\.m3u8$/);
      if (basePathMatch) {
        groupKey = basePathMatch[1];
      }
    }
    
    if (groupKey) {
      // Add to existing group or create new one
      if (!groups[groupKey]) {
        groups[groupKey] = {
          basePath: groupKey,
          items: [],
          pageUrl: item.pageUrl,
          timestamp: item.timestamp,
          headers: item.headers,
          isPossiblyProtected: item.isPossiblyProtected
        };
      }
      groups[groupKey].items.push(item);
    } else {
      // Standalone playlist - create its own group
      groups[url] = {
        basePath: url,
        items: [item],
        pageUrl: item.pageUrl,
        timestamp: item.timestamp,
        headers: item.headers,
        isPossiblyProtected: item.isPossiblyProtected
      };
    }
  });
  
  return groups;
}

/**
 * Create a grouped playlist element with quality options
 */
function createGroupedPlaylistElement(group, allItems = []) {
  const div = document.createElement('div');
  div.className = 'media-item media-group';
  
  // Format timestamp from first item
  const timestamp = new Date(group.timestamp).toLocaleTimeString();
  
  // Separate master playlist from quality-specific playlists
  const masterPlaylist = group.items.find(item => 
    item.url.includes('playlist.m3u8') || 
    item.url.includes('master.m3u8') ||
    !item.url.match(/\d+p/)
  );
  
  const qualityPlaylists = group.items.filter(item => item.url.match(/\d+p/));
  
  // Sort quality playlists by quality (descending)
  qualityPlaylists.sort((a, b) => {
    const getQuality = (url) => {
      const match = url.match(/(\d+)p/);
      return match ? parseInt(match[1]) : 0;
    };
    return getQuality(b.url) - getQuality(a.url);
  });
  
  // Check if this video has a matching subtitle
  const primaryItem = qualityPlaylists[0] || masterPlaylist;
  const hasSubtitle = findMatchingSubtitle(primaryItem, allItems);
  
  // Create badges
  let badges = `<span class="media-badge hls">HLS Video</span>`;
  if (group.isPossiblyProtected) {
    badges += `<span class="media-badge protected">🔒 Protected?</span>`;
  }
  if (hasSubtitle) {
    badges += `<span class="media-badge subtitle-available" style="background: #4caf50; color: white;">📝 Subtitle Available</span>`;
  }
  
  // Build quality buttons
  const qualityButtons = [];
  
  // Add master playlist button first (if exists)
  if (masterPlaylist) {
    qualityButtons.push(`<button class="btn btn-quality" data-url="${escapeHtml(masterPlaylist.url)}" data-quality="Master">Master (Auto)</button>`);
  }
  
  // Add quality-specific buttons
  qualityPlaylists.forEach(item => {
    const qualityMatch = item.url.match(/(\d+)p/);
    if (qualityMatch) {
      const quality = qualityMatch[1] + 'p';
      qualityButtons.push(`<button class="btn btn-quality" data-url="${escapeHtml(item.url)}" data-quality="${quality}">${quality}</button>`);
    }
  });
  
  const qualityButtonsHtml = qualityButtons.join('');
  
  // Use best quality or master as primary (primaryItem already declared above)
  const primaryIndex = group.items.indexOf(primaryItem);
  
  div.innerHTML = `
    <div class="media-item-header">
      ${badges}
    </div>
    <div class="media-url" title="${escapeHtml(group.basePath)}">${escapeHtml(shortenUrl(group.basePath))}</div>
    <div class="media-timestamp">Detected at ${timestamp}</div>
    
    <div class="quality-selector" style="margin: 10px 0; padding: 10px; background: #f9f9f9; border-radius: 4px;">
      <div style="font-size: 12px; font-weight: bold; margin-bottom: 8px; color: #666;">Select Quality:</div>
      <div class="quality-buttons" style="display: flex; gap: 8px; flex-wrap: wrap;">
        ${qualityButtonsHtml}
      </div>
    </div>
    
    <div class="media-actions" data-selected-url="${escapeHtml(primaryItem.url)}">
      <button class="btn btn-success btn-small" data-action="download-merge">
        🚀 Download & Merge
      </button>
      <button class="btn btn-primary btn-small" data-action="copy-ffmpeg-mp4">
        📋 FFmpeg (MP4)
      </button>
      <button class="btn btn-primary btn-small" data-action="copy-ffmpeg-mp4-subs">
        📋 MP4+Subs
      </button>
      <button class="btn btn-primary btn-small" data-action="copy-ffmpeg-extract-subs">
        📋 Extract Subs
      </button>
      <button class="btn btn-primary btn-small" data-action="copy-ffmpeg-mp3">
        📋 FFmpeg (MP3)
      </button>
      <button class="btn btn-secondary btn-small" data-action="locate-on-page" 
              style="background: #9c27b0; color: white; border-color: #9c27b0;" 
              title="Highlight this video on the webpage">
        📍 Locate on Page
      </button>
    </div>
    
    <div class="media-info">
      💡 HLS playlist - Select quality above, then click Download & Merge or copy FFmpeg command
    </div>
  `;
  
  // Add quality button listeners
  div.querySelectorAll('.btn-quality').forEach(btn => {
    btn.addEventListener('click', (e) => {
      // Remove active class from all quality buttons in this group
      div.querySelectorAll('.btn-quality').forEach(b => b.classList.remove('active'));
      // Add active class to clicked button
      btn.classList.add('active');
      
      // Update selected URL for actions
      const actionsEl = div.querySelector('.media-actions');
      actionsEl.dataset.selectedUrl = btn.dataset.url;
    });
  });
  
  // Set first quality as active by default
  div.querySelector('.btn-quality')?.classList.add('active');
  
  // Add event listeners to action buttons
  div.querySelectorAll('.media-actions button').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const actionsEl = e.currentTarget.closest('.media-actions');
      const selectedUrl = actionsEl.dataset.selectedUrl;
      const selectedItem = group.items.find(item => item.url === selectedUrl) || primaryItem;
      
      await handleGroupAction(e.currentTarget, selectedItem, group);
    });
  });
  
  return div;
}

/**
 * Handle action for grouped playlist
 */
async function handleGroupAction(button, item, group) {
  const action = button.dataset.action;
  
  switch (action) {
    case 'copy-url':
      await copyToClipboard(item.url, button);
      break;
    case 'copy-ffmpeg-mp3':
      await copyFFmpegCommand(item, 'mp3', button);
      break;
    case 'copy-ffmpeg-mp4':
      await copyFFmpegCommand(item, 'mp4', button);
      break;
    case 'copy-ffmpeg-mp4-subs':
      await copyFFmpegCommand(item, 'mp4-subs', button);
      break;
    case 'copy-ffmpeg-extract-subs':
      await copyFFmpegCommand(item, 'extract-subs', button);
      break;
    case 'download-merge':
      await downloadWithNativeHost(item, button);
      break;
    case 'locate-on-page':
      await locateVideoOnPage(item, button);
      break;
  }
}

/**
 * Shorten URL for display
 */
function shortenUrl(url) {
  try {
    const urlObj = new URL(url);
    const path = urlObj.pathname;
    const parts = path.split('/').filter(p => p);
    if (parts.length > 3) {
      return '.../' + parts.slice(-3).join('/');
    }
    return path;
  } catch {
    return url.length > 60 ? url.substring(0, 60) + '...' : url;
  }
}

/**
 * Find matching subtitle for a video
 * @param {Object} videoItem - The video media item
 * @param {Array} allItems - All media items from the current tab
 * @returns {Object|null} - Matching subtitle item or null
 */
function findMatchingSubtitle(videoItem, allItems) {
  if (!videoItem || videoItem.isSubtitle) return null;
  
  // Find all subtitle files
  const subtitles = allItems.filter(item => item.isSubtitle);
  if (subtitles.length === 0) return null;
  
  // Try to match by URL similarity (same base path)
  const videoUrl = new URL(videoItem.url);
  const videoBasePath = videoUrl.pathname.split('/').slice(0, -1).join('/');
  
  // Look for subtitle with same base path
  const matchingSubtitle = subtitles.find(sub => {
    const subUrl = new URL(sub.url);
    const subBasePath = subUrl.pathname.split('/').slice(0, -1).join('/');
    return videoBasePath === subBasePath;
  });
  
  // If found, return it; otherwise return first subtitle (likely the right one)
  return matchingSubtitle || (subtitles.length > 0 ? subtitles[0] : null);
}

/**
 * Create a media item element
 */
function createMediaItemElement(item, index, allItems = []) {
  const div = document.createElement('div');
  div.className = 'media-item';
  
  // Format timestamp
  const timestamp = new Date(item.timestamp).toLocaleTimeString();
  
  // Check if this video has a matching subtitle
  const hasSubtitle = !item.isSubtitle && findMatchingSubtitle(item, allItems);
  
  // Create badges
  let badges = `<span class="media-badge ${item.mediaType.toLowerCase()}">${item.mediaType}</span>`;
  if (item.isPossiblyProtected) {
    badges += `<span class="media-badge protected">🔒 Protected?</span>`;
  }
  if (hasSubtitle) {
    badges += `<span class="media-badge subtitle-available" style="background: #4caf50; color: white;">📝 Subtitle Available</span>`;
  }
  
  // Create action buttons based on media type
  let actions = '';
  
  if (item.isSubtitle) {
    // Subtitle file - show download and copy options
    actions += `
      <button class="btn btn-success btn-small" data-index="${index}" data-action="download">
        ⬇️ Download Subtitle
      </button>
      <button class="btn btn-secondary btn-small" data-index="${index}" data-action="copy-url">
        🔗 Copy URL
      </button>
    `;
  } else if (item.isHLS) {
    // HLS - show FFmpeg command options including subtitle extraction
    actions += `
      <button class="btn btn-success btn-small" data-index="${index}" data-action="download-merge">
        🚀 Download & Merge
      </button>
      <button class="btn btn-primary btn-small" data-index="${index}" data-action="copy-ffmpeg-mp4">
        📋 FFmpeg (MP4)
      </button>
      <button class="btn btn-primary btn-small" data-index="${index}" data-action="copy-ffmpeg-mp4-subs">
        📋 FFmpeg (MP4+Subs)
      </button>
      <button class="btn btn-primary btn-small" data-index="${index}" data-action="copy-ffmpeg-extract-subs">
        📋 Extract Subs
      </button>
      <button class="btn btn-primary btn-small" data-index="${index}" data-action="copy-ffmpeg-mp3">
        📋 FFmpeg (MP3)
      </button>
    `;
  } else if (item.isDirectDownloadable) {
    // Direct downloadable - show download and FFmpeg options
    actions += `
      <button class="btn btn-success btn-small" data-index="${index}" data-action="download">
        ⬇️ Download File
      </button>
      <button class="btn btn-success btn-small" data-index="${index}" data-action="download-merge">
        🚀 Download & Merge
      </button>
      <button class="btn btn-primary btn-small" data-index="${index}" data-action="copy-ffmpeg-convert">
        📋 Copy FFmpeg (Convert)
      </button>
    `;
  } else {
    // Other - show generic options
    actions += `
      <button class="btn btn-primary btn-small" data-index="${index}" data-action="copy-ffmpeg-copy">
        📋 Copy FFmpeg
      </button>
    `;
  }
  
  // Conditionally show copy URL button
  // Hide for HLS or if Referer header exists (likely needs headers to access)
  const needsHeaders = item.isHLS || item.isPossiblyProtected || 
                       (item.headers && (item.headers['Referer'] || item.headers['referer']));
  
  if (!needsHeaders || item.isSubtitle) {
    // Show Copy URL for direct files or subtitles
    actions += `
      <button class="btn btn-secondary btn-small" data-index="${index}" data-action="copy-url">
        🔗 Copy URL
      </button>
    `;
  }
  
  // Add "Locate on page" button for videos (not for segments or subtitles)
  if (!item.isSegment && !item.isSubtitle) {
    actions += `
      <button class="btn btn-secondary btn-small" data-index="${index}" data-action="locate-on-page" 
              style="background: #9c27b0; color: white; border-color: #9c27b0;" 
              title="Highlight this video on the webpage">
        📍 Locate on Page
      </button>
    `;
  }
  
  // Create info message for HLS
  let infoMessage = '';
  if (item.isHLS) {
    infoMessage = `
      <div class="media-info">
        💡 This is an HLS playlist (.m3u8). Use FFmpeg to download and convert it. Direct browser download won't work.
      </div>
    `;
  } else if (item.isSubtitle) {
    infoMessage = `
      <div class="media-info" style="background: #e8f5e9; border-left-color: #4caf50;">
        💡 <strong>How to use this subtitle:</strong>
        <br>1. Download the subtitle file (click ⬇️ above)
        <br>2. Save it with the same name as your video (e.g., <code>video.mp4</code> + <code>video.vtt</code>)
        <br>3. Place both files in the same folder
        <br>4. Open video in VLC/MPC-HC - subtitles load automatically!
        <br>Or use <strong>📋 MP4+Subs</strong> button on the video to embed subtitles directly.
      </div>
    `;
  }
  
  div.innerHTML = `
    <div class="media-item-header">
      ${badges}
    </div>
    <div class="media-url" title="${escapeHtml(item.url)}">${escapeHtml(item.url)}</div>
    <div class="media-timestamp">Detected at ${timestamp}</div>
    <div class="media-actions">
      ${actions}
    </div>
    ${infoMessage}
  `;
  
  // Add event listeners to buttons
  div.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', handleMediaAction);
  });
  
  return div;
}

/**
 * Handle media action button clicks
 */
async function handleMediaAction(event) {
  const button = event.currentTarget;
  const index = parseInt(button.dataset.index);
  const action = button.dataset.action;
  
  // Get media item
  const result = await chrome.storage.session.get('detectedMedia');
  const detectedMedia = result.detectedMedia || {};
  const mediaItems = detectedMedia[currentTabId.toString()] || [];
  const item = mediaItems[index];
  
  if (!item) {
    showError('Media item not found');
    return;
  }
  
  // Handle action
  switch (action) {
    case 'copy-url':
      await copyToClipboard(item.url, button);
      break;
    case 'copy-ffmpeg-mp3':
      await copyFFmpegCommand(item, 'mp3', button);
      break;
    case 'copy-ffmpeg-mp4':
      await copyFFmpegCommand(item, 'mp4', button);
      break;
    case 'copy-ffmpeg-mp4-subs':
      await copyFFmpegCommand(item, 'mp4-subs', button);
      break;
    case 'copy-ffmpeg-extract-subs':
      await copyFFmpegCommand(item, 'extract-subs', button);
      break;
    case 'copy-ffmpeg-copy':
      await copyFFmpegCommand(item, 'copy', button);
      break;
    case 'copy-ffmpeg-convert':
      await copyFFmpegCommand(item, 'convert', button);
      break;
    case 'download':
      await downloadFile(item, button);
      break;
    case 'download-merge':
      await downloadWithNativeHost(item, button);
      break;
    case 'locate-on-page':
      await locateVideoOnPage(item, button);
      break;
  }
}

/**
 * Generate FFmpeg command
 */
function generateFFmpegCommand(item, mode) {
  const url = item.url;
  const headers = item.headers || {};
  
  // Build header arguments
  let headerArgs = '';
  
  // Add User-Agent
  if (headers['User-Agent']) {
    headerArgs += `-user_agent "${headers['User-Agent']}" `;
  }
  
  // Add Referer (this is critical for many CDNs)
  if (headers['Referer']) {
    headerArgs += `-headers "Referer: ${headers['Referer']}" `;
  } else if (headers['referer']) {
    headerArgs += `-headers "Referer: ${headers['referer']}" `;
  } else if (item.pageUrl) {
    // Fallback to page URL as referer
    headerArgs += `-headers "Referer: ${item.pageUrl}" `;
  }
  
  // Add Origin if present
  if (headers['Origin']) {
    // If we already have headers arg, append with \r\n
    if (headerArgs.includes('-headers')) {
      headerArgs = headerArgs.replace('-headers "', `-headers "Origin: ${headers['Origin']}\\r\\n`);
    } else {
      headerArgs += `-headers "Origin: ${headers['Origin']}" `;
    }
  }
  
  // Build FFmpeg command based on mode
  let command = '';
  
  switch (mode) {
    case 'mp3':
      // Convert to MP3
      command = `ffmpeg ${headerArgs}-i "${url}" -vn -acodec libmp3lame -b:a 192k "output.mp3"`;
      break;
      
    case 'mp4':
      // Save as MP4 (copy codec)
      command = `ffmpeg ${headerArgs}-i "${url}" -c copy "output.mp4"`;
      break;
      
    case 'mp4-subs':
      // Save as MP4 with embedded subtitles
      command = `ffmpeg ${headerArgs}-i "${url}" -c copy -c:s mov_text "output.mp4"`;
      break;
      
    case 'copy':
      // Copy streams without re-encoding
      const ext = item.mediaType === 'HLS' ? 'mp4' : getFileExtension(url);
      command = `ffmpeg ${headerArgs}-i "${url}" -c copy "output.${ext}"`;
      break;
      
    case 'extract-subs':
      // Extract subtitles to separate file
      command = `ffmpeg ${headerArgs}-i "${url}" -map 0:s:0 "output.srt"`;
      break;
      
    case 'convert':
      // Convert audio from video file to MP3
      command = `ffmpeg ${headerArgs}-i "${url}" -vn -acodec libmp3lame -b:a 192k "output.mp3"`;
      break;
  }
  
  return command;
}

/**
 * Copy FFmpeg command to clipboard
 */
async function copyFFmpegCommand(item, mode, button) {
  const command = generateFFmpegCommand(item, mode);
  const commandWithPrefix = `PS .\> ${command}`;
  
  // Show command preview with monospace font
  showCommandPreview(commandWithPrefix);
  
  await copyToClipboard(commandWithPrefix, button);
}

/**
 * Show command preview in monospace
 */
function showCommandPreview(command) {
  const preview = document.createElement('div');
  preview.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: #1e1e1e;
    color: #00ff00;
    padding: 20px;
    border-radius: 8px;
    font-family: 'Courier New', Courier, monospace;
    font-size: 11px;
    z-index: 10000;
    max-width: 90%;
    box-shadow: 0 4px 20px rgba(0,0,0,0.5);
    word-wrap: break-word;
    white-space: pre-wrap;
  `;
  preview.textContent = command;
  document.body.appendChild(preview);
  
  setTimeout(() => {
    preview.remove();
  }, 2000);
}

/**
 * Download file directly
 */
async function downloadFile(item, button) {
  try {
    // Show loading state
    const originalText = button.textContent;
    button.textContent = '⏳ Downloading...';
    button.disabled = true;
    
    // Generate filename
    const filename = generateFilename(item.url, item.mediaType);
    
    // Start download
    await chrome.downloads.download({
      url: item.url,
      filename: filename,
      saveAs: true
    });
    
    // Show success
    button.textContent = '✅ Started';
    setTimeout(() => {
      button.textContent = originalText;
      button.disabled = false;
    }, 2000);
  } catch (error) {
    console.error('Download error:', error);
    button.textContent = '❌ Failed';
    button.disabled = false;
    setTimeout(() => {
      button.textContent = '⬇️ Download File';
    }, 2000);
  }
}

/**
 * Download using native messaging host (Python + FFmpeg)
 */
async function downloadWithNativeHost(item, button) {
  try {
    // Show loading state
    const originalText = button.textContent;
    button.textContent = '🔌 Starting...';
    button.disabled = true;
    
    // Get downloads folder path from user
    const downloadsPath = await getDownloadsPath();
    if (!downloadsPath) {
      throw new Error('Download cancelled by user');
    }
    
    // Generate smart default filename and ask user to customize
    const defaultFilename = await generateSmartFilename(item);
    const customFilename = prompt('Enter filename (without extension):', defaultFilename);
    if (!customFilename) {
      button.textContent = originalText;
      button.disabled = false;
      return; // User cancelled
    }
    
    // Sanitize filename
    const baseFilename = sanitizeFilename(customFilename);
    
    // Determine video extension and path
    const videoExt = item.mediaType === 'HLS' ? 'mp4' : getFileExtension(item.url).toLowerCase();
    const videoOutputPath = `${downloadsPath}\\${baseFilename}.${videoExt}`;
    
    // Check for matching subtitle
    const result = await chrome.storage.session.get('detectedMedia');
    const detectedMedia = result.detectedMedia || {};
    const allItems = detectedMedia[currentTabId.toString()] || [];
    const matchingSubtitle = findMatchingSubtitle(item, allItems);
    
    // Send download request to background service worker
    const response = await chrome.runtime.sendMessage({
      action: 'startDownload',
      data: {
        url: item.url,
        outputPath: videoOutputPath,
        headers: item.headers || {},
        mediaType: item.mediaType
      }
    });
    
    if (response.success) {
      let message = 'Video download started! Check notifications for progress.';
      
      // If there's a matching subtitle, download it too
      if (matchingSubtitle) {
        const subExt = getFileExtension(matchingSubtitle.url).toLowerCase();
        const subOutputPath = `${downloadsPath}\\${baseFilename}.${subExt}`;
        
        // Download subtitle using browser's download API (subtitles are simple files)
        try {
          await chrome.downloads.download({
            url: matchingSubtitle.url,
            filename: `${baseFilename}.${subExt}`,
            saveAs: false
          });
          message = `Video + Subtitle download started!\n\nBoth files will be named: ${baseFilename}\n\nCheck notifications for progress.`;
        } catch (subError) {
          console.error('Subtitle download error:', subError);
          message += '\n\nNote: Subtitle download failed - you may need to download it separately.';
        }
      }
      
      button.textContent = matchingSubtitle ? '✅ Video + Sub Started!' : '✅ Download Started!';
      showInfo(message + '\n\nYou can close this popup - download continues in background.');
      
      setTimeout(() => {
        button.textContent = originalText;
        button.disabled = false;
      }, 3000);
    } else {
      throw new Error(response.error || 'Failed to start download');
    }
    
  } catch (error) {
    console.error('Download error:', error);
    button.textContent = '❌ Failed';
    showError(error.message);
    setTimeout(() => {
      button.textContent = '🚀 Download & Merge';
      button.disabled = false;
    }, 3000);
  }
}

/**
 * Generate smart filename from page title, URL, or timestamp
 */
async function generateSmartFilename(item) {
  try {
    // Get current tab info
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs.length > 0) {
      const tab = tabs[0];
      
      // Try to extract meaningful name from page title
      if (tab.title && tab.title !== 'Unknown') {
        const title = tab.title
          .replace(/[\\/:*?"<>|]/g, '') // Remove invalid chars
          .substring(0, 50) // Limit length
          .trim();
        if (title) return title;
      }
      
      // Try to extract from URL
      if (tab.url) {
        const urlMatch = tab.url.match(/\/([^\/]+?)(?:\.html?)?$/);
        if (urlMatch && urlMatch[1]) {
          return urlMatch[1].replace(/[\\/:*?"<>|]/g, '').substring(0, 50);
        }
      }
    }
  } catch (error) {
    console.error('Error generating smart filename:', error);
  }
  
  // Fallback to timestamp
  return `download_${Date.now()}`;
}

/**
 * Sanitize filename - remove invalid characters
 */
function sanitizeFilename(filename) {
  return filename
    .replace(/[\\/:*?"<>|]/g, '_') // Replace invalid chars with underscore
    .replace(/\s+/g, '_') // Replace spaces with underscore
    .replace(/_+/g, '_') // Collapse multiple underscores
    .replace(/^_|_$/g, '') // Trim underscores from start/end
    .substring(0, 200); // Limit total length
}

/**
 * Locate and highlight video on the current page
 */
async function locateVideoOnPage(item, button) {
  try {
    const originalText = button.textContent;
    button.textContent = '🔍 Locating...';
    button.disabled = true;
    
    // Send message to content script
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs.length === 0) {
      throw new Error('No active tab found');
    }
    
    // Locate and highlight the video (status will be 'idle' initially)
    const response = await chrome.tabs.sendMessage(tabs[0].id, {
      action: 'locateVideo',
      url: item.url,
      status: 'idle'
    });
    
    if (response.success) {
      button.textContent = '✅ Found!';
      setTimeout(() => {
        button.textContent = originalText;
        button.disabled = false;
      }, 2000);
    } else {
      throw new Error('Failed to locate video');
    }
  } catch (error) {
    console.error('Error locating video:', error);
    button.textContent = '❌ Not found';
    showError('Could not locate video on page. The video may be in an iframe or loaded dynamically.');
    setTimeout(() => {
      button.textContent = '📍 Locate on Page';
      button.disabled = false;
    }, 3000);
  }
}

/**
 * Get downloads path from user
 */
async function getDownloadsPath() {
  // Prompt user for downloads folder
  const defaultPath = 'C:\\Users\\' + (await getUserName()) + '\\Downloads';
  const path = prompt('Enter download folder path:', defaultPath);
  return path;
}

/**
 * Get current Windows username
 */
async function getUserName() {
  // Try to get from environment or use default
  return 'User'; // Fallback - user will edit the path
}

/**
 * Copy text to clipboard
 */
async function copyToClipboard(text, button) {
  try {
    await navigator.clipboard.writeText(text);
    
    // Show success feedback
    const originalText = button.textContent;
    button.textContent = '✅ Copied!';
    setTimeout(() => {
      button.textContent = originalText;
    }, 2000);
  } catch (error) {
    console.error('Copy error:', error);
    showError('Failed to copy to clipboard');
  }
}

/**
 * Test if URL is accessible without headers (returns false if 403)
 */
async function testUrlAccessibility(url) {
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      mode: 'no-cors' // Avoid CORS issues
    });
    // no-cors mode doesn't give us status, so we assume accessible
    // If it fails, catch block handles it
    return true;
  } catch (error) {
    console.log('URL test failed (may need headers):', url);
    return false;
  }
}

/**
 * Handle clear all button
 */
async function handleClearAll() {
  try {
    const result = await chrome.storage.session.get('detectedMedia');
    const detectedMedia = result.detectedMedia || {};
    
    // Clear media for current tab
    delete detectedMedia[currentTabId.toString()];
    
    await chrome.storage.session.set({ detectedMedia });
    
    // Refresh display
    await loadDetectedMedia();
  } catch (error) {
    console.error('Error clearing media:', error);
    showError('Failed to clear media');
  }
}

/**
 * Show error message
 */
function showError(message) {
  console.error(message);
  // Create a simple notification div
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    left: 10px;
    background: #f44336;
    color: white;
    padding: 12px;
    border-radius: 4px;
    font-size: 12px;
    z-index: 1000;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  `;
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
  }, 5000);
}

/**
 * Show info message
 */
function showInfo(message) {
  console.log(message);
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    left: 10px;
    background: #4caf50;
    color: white;
    padding: 12px;
    border-radius: 4px;
    font-size: 12px;
    z-index: 1000;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    white-space: pre-line;
  `;
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
  }, 5000);
}

/**
 * Generate filename from URL
 */
function generateFilename(url, mediaType) {
  try {
    const urlObj = new URL(url);
    let filename = urlObj.pathname.split('/').pop();
    
    // If no filename in URL, generate one
    if (!filename || filename.length < 3) {
      const ext = mediaType.toLowerCase();
      const timestamp = Date.now();
      filename = `media_${timestamp}.${ext}`;
    }
    
    return filename;
  } catch (error) {
    // Fallback filename
    const ext = mediaType.toLowerCase();
    return `media_${Date.now()}.${ext}`;
  }
}

/**
 * Get file extension from URL
 */
function getFileExtension(url) {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const parts = pathname.split('.');
    if (parts.length > 1) {
      return parts[parts.length - 1].toLowerCase();
    }
  } catch (error) {
    // ignore
  }
  return 'mp4'; // default
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Truncate text
 */
function truncate(text, maxLength) {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);
