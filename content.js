/**
 * Content script for media-stream-helper extension
 * Handles page interactions like highlighting video elements with download status
 */

// Track active video highlights
const activeHighlights = new Map(); // URL -> { element, overlay }

// Listen for messages from popup/background
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'locateVideo') {
    locateVideoOnPage(message.url, message.status || 'idle');
    sendResponse({ success: true });
  } else if (message.action === 'updateVideoStatus') {
    updateVideoStatus(message.url, message.status);
    sendResponse({ success: true });
  } else if (message.action === 'removeVideoHighlight') {
    removeVideoHighlight(message.url);
    sendResponse({ success: true });
  }
  return true;
});

/**
 * Find and highlight video element matching the URL with status indicator
 */
function locateVideoOnPage(mediaUrl, status = 'idle') {
  console.log('[Content Script] Locating video for URL:', mediaUrl, 'Status:', status);
  
  // Find all video and audio elements
  const mediaElements = [
    ...document.querySelectorAll('video'),
    ...document.querySelectorAll('audio')
  ];
  
  console.log('[Content Script] Found media elements:', mediaElements.length);
  
  let foundElement = null;
  
  // Try to match by src
  for (const element of mediaElements) {
    const src = element.src || element.currentSrc;
    console.log('[Content Script] Checking element src:', src);
    
    if (src && (src === mediaUrl || mediaUrl.includes(src) || src.includes(extractBaseUrl(mediaUrl)))) {
      foundElement = element;
      break;
    }
    
    // Check source elements
    const sources = element.querySelectorAll('source');
    for (const source of sources) {
      const sourceSrc = source.src;
      if (sourceSrc && (sourceSrc === mediaUrl || mediaUrl.includes(sourceSrc))) {
        foundElement = element;
        break;
      }
    }
    
    if (foundElement) break;
  }
  
  if (foundElement) {
    createPersistentHighlight(foundElement, mediaUrl, status);
    foundElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    console.log('[Content Script] Found and highlighted video element');
  } else {
    // If no exact match, highlight all video elements briefly
    console.log('[Content Script] No exact match - highlighting all videos');
    if (mediaElements.length > 0) {
      // Highlight first video as best guess
      createPersistentHighlight(mediaElements[0], mediaUrl, status);
      mediaElements[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      alert('No video elements found on this page.\n\nThe video may be loaded dynamically or in an iframe.');
    }
  }
}

/**
 * Create a persistent highlight overlay with status indicator
 */
function createPersistentHighlight(element, mediaUrl, status = 'idle') {
  // Remove existing highlight for this URL if any
  if (activeHighlights.has(mediaUrl)) {
    removeVideoHighlight(mediaUrl);
  }
  
  // Create overlay element
  const overlay = document.createElement('div');
  overlay.className = 'media-stream-helper-overlay';
  
  // Get element position
  const rect = element.getBoundingClientRect();
  
  // Get status color and label
  const statusInfo = getStatusInfo(status);
  
  // Style overlay
  overlay.style.cssText = `
    position: fixed;
    top: ${rect.top}px;
    left: ${rect.left}px;
    width: ${rect.width}px;
    height: ${rect.height}px;
    border: 4px solid ${statusInfo.color};
    box-shadow: 0 0 20px ${statusInfo.color}, inset 0 0 20px ${statusInfo.color}40;
    pointer-events: none;
    z-index: 999999;
    transition: all 0.3s ease;
  `;
  
  // Create status badge
  const badge = document.createElement('div');
  badge.className = 'media-stream-helper-badge';
  badge.textContent = statusInfo.label;
  badge.style.cssText = `
    position: absolute;
    top: -30px;
    left: 0;
    background: ${statusInfo.color};
    color: white;
    padding: 6px 12px;
    border-radius: 4px;
    font-family: Arial, sans-serif;
    font-size: 13px;
    font-weight: bold;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    white-space: nowrap;
  `;
  
  overlay.appendChild(badge);
  document.body.appendChild(overlay);
  
  // Store reference
  activeHighlights.set(mediaUrl, { element, overlay, badge });
  
  // Update position on scroll/resize
  const updatePosition = () => {
    const newRect = element.getBoundingClientRect();
    overlay.style.top = `${newRect.top}px`;
    overlay.style.left = `${newRect.left}px`;
    overlay.style.width = `${newRect.width}px`;
    overlay.style.height = `${newRect.height}px`;
  };
  
  window.addEventListener('scroll', updatePosition, true);
  window.addEventListener('resize', updatePosition);
  
  // Store cleanup functions
  overlay._cleanup = () => {
    window.removeEventListener('scroll', updatePosition, true);
    window.removeEventListener('resize', updatePosition);
  };
}

/**
 * Update video status (changes color and label)
 */
function updateVideoStatus(mediaUrl, status) {
  console.log('[Content Script] Updating status for:', mediaUrl, 'to:', status);
  
  const highlight = activeHighlights.get(mediaUrl);
  if (!highlight) {
    console.log('[Content Script] No highlight found for this URL');
    return;
  }
  
  const statusInfo = getStatusInfo(status);
  
  // Update overlay border
  highlight.overlay.style.borderColor = statusInfo.color;
  highlight.overlay.style.boxShadow = `0 0 20px ${statusInfo.color}, inset 0 0 20px ${statusInfo.color}40`;
  
  // Update badge
  highlight.badge.textContent = statusInfo.label;
  highlight.badge.style.background = statusInfo.color;
  
  // Auto-remove after completion or error (5 seconds)
  if (status === 'complete' || status === 'failed') {
    setTimeout(() => {
      removeVideoHighlight(mediaUrl);
    }, 5000);
  }
}

/**
 * Remove video highlight
 */
function removeVideoHighlight(mediaUrl) {
  const highlight = activeHighlights.get(mediaUrl);
  if (highlight) {
    if (highlight.overlay._cleanup) {
      highlight.overlay._cleanup();
    }
    highlight.overlay.remove();
    activeHighlights.delete(mediaUrl);
  }
}

/**
 * Get status color and label
 */
function getStatusInfo(status) {
  const statusMap = {
    'idle': { color: '#9c27b0', label: '📍 Located' },
    'starting': { color: '#ff9800', label: '🔌 Starting...' },
    'downloading': { color: '#ff9800', label: '⏳ Downloading...' },
    'retrying': { color: '#ff6b00', label: '🔄 Retrying...' },
    'waiting': { color: '#ff9800', label: '⏳ Waiting...' },
    'resuming': { color: '#2196f3', label: '▶️ Resuming...' },
    'complete': { color: '#4caf50', label: '✅ Complete!' },
    'failed': { color: '#f44336', label: '❌ Failed' }
  };
  
  return statusMap[status] || statusMap['idle'];
}

/**
 * Highlight an element with a pulsing border (legacy - for temporary highlights)
 */
function highlightElement(element, duration = 5000) {
  // Save original style
  const originalOutline = element.style.outline;
  const originalOutlineOffset = element.style.outlineOffset;
  const originalTransition = element.style.transition;
  
  // Create pulsing highlight effect
  element.style.transition = 'outline 0.3s ease-in-out';
  element.style.outline = '4px solid #ff0000';
  element.style.outlineOffset = '4px';
  
  // Pulse animation
  let pulseCount = 0;
  const pulseInterval = setInterval(() => {
    pulseCount++;
    if (pulseCount % 2 === 0) {
      element.style.outline = '4px solid #ff0000';
      element.style.outlineOffset = '4px';
    } else {
      element.style.outline = '6px solid #ff6b00';
      element.style.outlineOffset = '6px';
    }
  }, 300);
  
  // Remove highlight after duration
  setTimeout(() => {
    clearInterval(pulseInterval);
    element.style.outline = originalOutline;
    element.style.outlineOffset = originalOutlineOffset;
    element.style.transition = originalTransition;
  }, duration);
}

/**
 * Extract base URL (remove query params and fragments)
 */
function extractBaseUrl(url) {
  try {
    const urlObj = new URL(url);
    // Get path without query/fragment
    return urlObj.pathname.split('/').pop();
  } catch (e) {
    return url;
  }
}
