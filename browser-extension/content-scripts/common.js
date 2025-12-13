/**
 * FeelingWise - Common Content Script Utilities
 *
 * Shared code for all platform-specific content scripts.
 */

// Extension settings
let FW_SETTINGS = {
  enabled: true,
  persona: 'adult',
  autoNeutralize: true,
  showIndicators: true
};

// Load settings on init
chrome.runtime.sendMessage({ type: 'GET_SETTINGS' }, response => {
  if (response) {
    FW_SETTINGS = response;
  }
});

// Listen for settings updates
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SETTINGS_UPDATED') {
    FW_SETTINGS = message.settings;
    // Re-process visible content if enabled
    if (FW_SETTINGS.enabled && typeof window.FW_REPROCESS === 'function') {
      window.FW_REPROCESS();
    }
  }
});

// Track processed elements
const processedElements = new WeakSet();

/**
 * Check if content should be processed
 */
function shouldProcess(text) {
  if (!text || text.length < 10 || text.length > 5000) return false;

  // Quick checks for potential manipulation
  const hasAllCaps = /[A-Z]{4,}/.test(text);
  const hasExcessivePunctuation = /[!?]{2,}/.test(text);
  const hasAlarmEmojis = /[\u{1F6A8}\u{1F525}\u{26A0}\u{2757}\u{203C}]/u.test(text);
  const hasUrgencyWords = /\b(urgent|now|immediately|breaking|exposed|alert|emergency)\b/i.test(text);
  const hasFearWords = /\b(destroy|disaster|catastrophe|crisis|threat|danger|WARNING)\b/i.test(text);

  return hasAllCaps || hasExcessivePunctuation || hasAlarmEmojis || hasUrgencyWords || hasFearWords;
}

/**
 * Send content to background for neutralization
 */
async function neutralize(content) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      { type: 'NEUTRALIZE', content },
      response => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else if (response && response.success) {
          resolve(response);
        } else {
          reject(new Error(response?.error || 'Unknown error'));
        }
      }
    );
  });
}

/**
 * Create neutralized content wrapper
 */
function createNeutralizedWrapper(original, neutralized, techniques, severity) {
  const wrapper = document.createElement('div');
  wrapper.className = 'fw-neutralized-wrapper';
  wrapper.dataset.fwProcessed = 'true';

  const showingOriginal = FW_SETTINGS.persona !== 'child';

  wrapper.innerHTML = `
    <div class="fw-content fw-neutralized-content ${!showingOriginal ? 'fw-hidden' : ''}">
      ${escapeHtml(neutralized.neutralized || neutralized)}
    </div>
    <div class="fw-content fw-original-content ${showingOriginal ? 'fw-hidden' : ''}">
      ${escapeHtml(original)}
    </div>
    ${FW_SETTINGS.showIndicators ? `
      <div class="fw-indicator">
        <span class="fw-badge fw-severity-${severity >= 7 ? 'high' : severity >= 4 ? 'medium' : 'low'}">
          ${getSeverityIcon(severity)} ${techniques.length} technique${techniques.length !== 1 ? 's' : ''}
        </span>
        ${FW_SETTINGS.persona !== 'child' ? `
          <button class="fw-toggle-btn" data-showing="neutralized">
            <span class="fw-toggle-icon">${String.fromCodePoint(0x1F441)}</span>
            Show Original
          </button>
        ` : ''}
        <div class="fw-tooltip">
          <strong>Detected techniques:</strong>
          <ul>
            ${techniques.map(t => `<li>${escapeHtml(t)}</li>`).join('')}
          </ul>
        </div>
      </div>
    ` : ''}
  `;

  // Add toggle functionality
  const toggleBtn = wrapper.querySelector('.fw-toggle-btn');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const neutralizedContent = wrapper.querySelector('.fw-neutralized-content');
      const originalContent = wrapper.querySelector('.fw-original-content');
      const isShowingNeutralized = toggleBtn.dataset.showing === 'neutralized';

      if (isShowingNeutralized) {
        neutralizedContent.classList.add('fw-hidden');
        originalContent.classList.remove('fw-hidden');
        toggleBtn.innerHTML = `<span class="fw-toggle-icon">${String.fromCodePoint(0x1F6E1)}</span> Show Neutralized`;
        toggleBtn.dataset.showing = 'original';
      } else {
        neutralizedContent.classList.remove('fw-hidden');
        originalContent.classList.add('fw-hidden');
        toggleBtn.innerHTML = `<span class="fw-toggle-icon">${String.fromCodePoint(0x1F441)}</span> Show Original`;
        toggleBtn.dataset.showing = 'neutralized';
      }
    });
  }

  return wrapper;
}

/**
 * Get severity icon
 */
function getSeverityIcon(severity) {
  if (severity >= 7) return String.fromCodePoint(0x1F534); // Red circle
  if (severity >= 4) return String.fromCodePoint(0x1F7E0); // Orange circle
  return String.fromCodePoint(0x1F7E2); // Green circle
}

/**
 * Escape HTML entities
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Process a text element
 */
async function processElement(element, getText, setText) {
  if (!FW_SETTINGS.enabled) return;
  if (processedElements.has(element)) return;
  if (element.closest('.fw-neutralized-wrapper')) return;

  const text = getText(element);
  if (!shouldProcess(text)) return;

  processedElements.add(element);

  try {
    const result = await neutralize(text);

    if (result.techniques && result.techniques.length > 0) {
      const wrapper = createNeutralizedWrapper(
        text,
        result.neutralized,
        result.techniques,
        result.severity
      );

      // Replace element content with wrapper
      setText(element, wrapper);
    }
  } catch (error) {
    console.error('FeelingWise: Failed to process element', error);
    // Don't mark as processed on error so it can be retried
    processedElements.delete(element);
  }
}

/**
 * Create mutation observer for dynamic content
 */
function createObserver(processFunction) {
  const observer = new MutationObserver((mutations) => {
    if (!FW_SETTINGS.enabled) return;

    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          processFunction(node);
        }
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  return observer;
}

// Export for platform scripts
window.FW = {
  settings: FW_SETTINGS,
  shouldProcess,
  neutralize,
  processElement,
  createObserver,
  createNeutralizedWrapper,
  processedElements
};
