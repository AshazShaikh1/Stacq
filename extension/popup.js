// Extension Configuration
// Update this to your production URL when deploying
const API_BASE = "http://localhost:3000"; // Change to your production URL

// DOM Elements
const loadingEl = document.getElementById('loading');
const contentEl = document.getElementById('content');
const errorEl = document.getElementById('error');
const errorTextEl = document.getElementById('error-text');
const closeBtn = document.getElementById('close-btn');

// Preview Elements
const previewTitleEl = document.getElementById('preview-title');
const previewUrlEl = document.getElementById('preview-url');
const previewDescriptionEl = document.getElementById('preview-description');
const previewImageEl = document.getElementById('preview-image');
const previewImageContainer = document.getElementById('preview-image-container');
const faviconEl = document.getElementById('favicon');
const saveBtn = document.getElementById('save-btn');
const linkPreview = document.getElementById('link-preview');
const linkTextEl = document.getElementById('link-text');

// Close button handler
if (closeBtn) {
  closeBtn.addEventListener('click', () => {
    try {
      window.close();
    } catch (err) {
      // Some browsers don't allow programmatic close
    }
  });
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // 1. Get Current Tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab || !tab.url) {
      throw new Error("Cannot access current tab URL.");
    }

    // Skip chrome:// and extension pages
    if (tab.url.startsWith('chrome://') || 
        tab.url.startsWith('chrome-extension://') || 
        tab.url.startsWith('edge://') ||
        tab.url.startsWith('about:') ||
        tab.url.startsWith('moz-extension://')) {
      throw new Error("Cannot save browser pages. Please navigate to a website.");
    }

    const url = tab.url;
    let hostname;
    try {
      hostname = new URL(url).hostname;
    } catch (e) {
      throw new Error("Invalid URL. Please navigate to a valid website.");
    }

    // 2. Set up UI immediately with tab data
    if (previewTitleEl) previewTitleEl.textContent = tab.title || "Untitled Page";
    if (previewUrlEl) previewUrlEl.textContent = hostname;
    if (linkTextEl) linkTextEl.textContent = hostname;
    if (linkPreview) linkPreview.href = url;

    // Set favicon immediately
    if (faviconEl) {
      faviconEl.src = `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`;
      faviconEl.onerror = () => {
        if (faviconEl) faviconEl.style.display = 'none';
      };
    }

    // 3. Set "Save" Link (Deep Link)
    const saveUrl = `${API_BASE}/save?url=${encodeURIComponent(url)}`;
    
    // Handle save button click and keyboard
    if (saveBtn) {
      saveBtn.href = saveUrl;
      saveBtn.addEventListener('click', (e) => {
        // Let the link open naturally, popup will close automatically
        // Small delay to ensure navigation starts
        setTimeout(() => {
          try {
            window.close();
          } catch (err) {
            // Some browsers don't allow programmatic close, that's okay
          }
        }, 200);
      });

      // Keyboard support
      saveBtn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          saveBtn.click();
        }
      });
    }

    // 4. Fetch Enhanced Metadata (Optional but improves UX)
    fetchMetadata(url);

  } catch (err) {
    showError(err.message || "An error occurred. Please try again.");
  }
});

async function fetchMetadata(url) {
  try {
    // First try the cache endpoint (faster)
    const cacheResponse = await fetch(`${API_BASE}/api/metadata?url=${encodeURIComponent(url)}`);
    
    if (cacheResponse.ok) {
      const cacheData = await cacheResponse.json();
      if (cacheData.ok && cacheData.found && cacheData.meta) {
        updatePreview(cacheData.meta);
        return;
      }
    }

    // If not in cache, fetch metadata directly
    const queueResponse = await fetch(`${API_BASE}/api/metadata`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url }),
    });

    if (queueResponse.ok) {
      const queueData = await queueResponse.json();
      if (queueData.ok && queueData.meta) {
        updatePreview(queueData.meta);
      }
    }
  } catch (err) {
    // Silently fail - we already have tab title/URL as fallback
    console.log("Metadata fetch failed, using tab data:", err);
  } finally {
    // Show content regardless of metadata fetch success
    if (loadingEl) loadingEl.style.display = 'none';
    if (contentEl) contentEl.style.display = 'flex';
  }
}

function updatePreview(meta) {
  if (!meta) return;

  if (meta.title && meta.title.trim() && previewTitleEl) {
    previewTitleEl.textContent = meta.title;
  }

  if (meta.description && meta.description.trim() && previewDescriptionEl) {
    previewDescriptionEl.textContent = meta.description;
    previewDescriptionEl.style.display = 'block';
  }

  if (meta.image && previewImageEl && previewImageContainer) {
    previewImageEl.src = meta.image;
    previewImageEl.onerror = () => {
      if (previewImageContainer) previewImageContainer.style.display = 'none';
    };
    previewImageEl.onload = () => {
      if (previewImageContainer) previewImageContainer.style.display = 'block';
    };
  }
}

function showError(message) {
  if (loadingEl) loadingEl.style.display = 'none';
  if (errorTextEl) errorTextEl.textContent = message;
  if (errorEl) errorEl.style.display = 'flex';
  if (contentEl) contentEl.style.display = 'none';
}

// Handle keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    try {
      window.close();
    } catch (err) {
      // Some browsers don't allow programmatic close
    }
  }
  // Allow Enter key to trigger save button
  if (e.key === 'Enter' && e.target === document.body) {
    const saveBtn = document.getElementById('save-btn');
    if (saveBtn && saveBtn.style.display !== 'none') {
      saveBtn.click();
    }
  }
});

