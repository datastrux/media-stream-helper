/**
 * Content script for media-stream-helper extension
 * Handles page interactions like highlighting video elements
 */

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'locateVideo') {
    locateVideoOnPage(message.url);
    sendResponse({ success: true });
  }
  return true;
});

/**
 * Find and highlight video element matching the URL
 */
function locateVideoOnPage(mediaUrl) {
  console.log('[Content Script] Locating video for URL:', mediaUrl);
  
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
    highlightElement(foundElement);
    foundElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    console.log('[Content Script] Found and highlighted video element');
  } else {
    // If no exact match, highlight all video elements briefly
    console.log('[Content Script] No exact match - highlighting all videos');
    mediaElements.forEach(el => highlightElement(el, 2000));
    if (mediaElements.length > 0) {
      mediaElements[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      alert('No video elements found on this page.\n\nThe video may be loaded dynamically or in an iframe.');
    }
  }
}

/**
 * Highlight an element with a pulsing border
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
