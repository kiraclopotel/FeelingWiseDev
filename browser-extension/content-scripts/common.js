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

// Platform-specific style configurations
const PLATFORM_STYLES = {
  twitter: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    fontSize: '15px',
    lineHeight: '20px'
  },
  tiktok: {
    fontFamily: 'TikTokFont, Arial, sans-serif',
    fontSize: '16px',
    lineHeight: '22px'
  },
  facebook: {
    fontFamily: 'Helvetica, Arial, sans-serif',
    fontSize: '14px',
    lineHeight: '19px'
  }
};

/**
 * Detect current platform based on hostname
 */
function detectPlatform() {
  const hostname = window.location.hostname;
  if (hostname.includes('twitter') || hostname.includes('x.com')) return 'twitter';
  if (hostname.includes('tiktok')) return 'tiktok';
  if (hostname.includes('facebook') || hostname.includes('fb.com')) return 'facebook';
  if (hostname.includes('youtube')) return 'youtube';
  return 'twitter'; // default
}

/**
 * Get computed styles from an element for font matching
 * Looks for actual text-containing elements to get accurate styles,
 * since platforms often style child elements rather than containers.
 */
function captureElementStyles(element) {
  if (!element) return null;

  // Find the best element to capture styles from
  // Priority: first styled text-containing child > first span > container
  let targetElement = element;

  // Look for the first text node and get its parent for accurate styling
  const walker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: (node) => {
        // Only accept text nodes with actual content
        return node.textContent.trim().length > 0
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_REJECT;
      }
    },
    false
  );

  const firstTextNode = walker.nextNode();
  if (firstTextNode && firstTextNode.parentElement && firstTextNode.parentElement !== element) {
    // Use the parent of the first text node for more accurate styles
    targetElement = firstTextNode.parentElement;
  } else {
    // Fallback: look for first span or styled element
    const firstSpan = element.querySelector('span');
    if (firstSpan) {
      targetElement = firstSpan;
    }
  }

  const computed = window.getComputedStyle(targetElement);
  return {
    fontFamily: computed.fontFamily,
    fontSize: computed.fontSize,
    fontWeight: computed.fontWeight,
    lineHeight: computed.lineHeight,
    color: computed.color,
    letterSpacing: computed.letterSpacing,
    // Additional properties that can affect text appearance
    textRendering: computed.textRendering,
    webkitFontSmoothing: computed.webkitFontSmoothing || 'auto',
    wordSpacing: computed.wordSpacing
  };
}

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
 *
 * Persona behavior:
 * - Child: Sees neutralized only, NO badges/indicators (invisible protection)
 * - Teen: Sees neutralized by default, can toggle to original, sees badges
 * - Adult: Sees original by default, can toggle to neutralized, sees badges
 *
 * @param {string} original - Original text content
 * @param {string|object} neutralized - Neutralized text or object with neutralized property
 * @param {array} techniques - Detected manipulation techniques
 * @param {number} severity - Severity score (0-10)
 * @param {object} originalStyles - Optional computed styles from the original element
 */
function createNeutralizedWrapper(original, neutralized, techniques, severity, originalStyles = null) {
  const wrapper = document.createElement('div');
  wrapper.className = 'fw-neutralized-wrapper';
  wrapper.dataset.fwProcessed = 'true';

  // Ensure severity is a valid number (fix NaN bug)
  const safeSeverity = (typeof severity === 'string' ? parseInt(severity, 10) : severity) || 0;
  const validSeverity = isNaN(safeSeverity) ? 0 : Math.max(0, Math.min(10, safeSeverity));

  // Ensure techniques is a valid array
  const safeTechniques = Array.isArray(techniques) ? techniques : [];

  // Store data for analysis panel
  wrapper.dataset.techniques = JSON.stringify(safeTechniques);
  wrapper.dataset.severity = validSeverity;
  wrapper.dataset.original = original;
  wrapper.dataset.neutralized = neutralized.neutralized || neutralized;

  // Build inline style string for font matching
  // Apply all captured styles to ensure visual match with original content
  let contentStyle = '';
  if (originalStyles) {
    const styles = [
      `font-family: ${originalStyles.fontFamily}`,
      `font-size: ${originalStyles.fontSize}`,
      `font-weight: ${originalStyles.fontWeight}`,
      `line-height: ${originalStyles.lineHeight}`,
      `color: ${originalStyles.color}`,
      `letter-spacing: ${originalStyles.letterSpacing}`,
      `word-spacing: ${originalStyles.wordSpacing}`,
      `text-rendering: ${originalStyles.textRendering}`,
      `-webkit-font-smoothing: ${originalStyles.webkitFontSmoothing}`
    ];
    contentStyle = styles.join('; ') + ';';
  }

  const persona = FW_SETTINGS.persona;
  const isChild = persona === 'child';
  const isAdult = persona === 'adult';

  // Default view: Adult sees original, Teen/Child see neutralized
  const showNeutralizedFirst = !isAdult;

  // Child mode: NEVER show any indicators - invisible protection
  const showIndicator = !isChild && FW_SETTINGS.showIndicators;

  wrapper.innerHTML = `
    <div class="fw-content fw-neutralized-content ${!showNeutralizedFirst ? 'fw-hidden' : ''}"${contentStyle ? ` style="${contentStyle}"` : ''}>
      ${escapeHtml(neutralized.neutralized || neutralized)}
    </div>
    <div class="fw-content fw-original-content ${showNeutralizedFirst ? 'fw-hidden' : ''}"${contentStyle ? ` style="${contentStyle}"` : ''}>
      ${escapeHtml(original)}
    </div>
    ${showIndicator ? `
      <div class="fw-indicator">
        <span class="fw-badge fw-severity-${validSeverity >= 7 ? 'high' : validSeverity >= 4 ? 'medium' : 'low'}" role="button" tabindex="0">
          ${getSeverityIcon(validSeverity)} ${safeTechniques.length} technique${safeTechniques.length !== 1 ? 's' : ''}
        </span>
        <button class="fw-toggle-btn" data-showing="${showNeutralizedFirst ? 'neutralized' : 'original'}">
          <span class="fw-toggle-icon">${showNeutralizedFirst ? String.fromCodePoint(0x1F441) : String.fromCodePoint(0x1F6E1)}</span>
          ${showNeutralizedFirst ? 'Show Original' : 'Show Neutralized'}
        </button>
        <button class="fw-analysis-btn">
          <span class="fw-analysis-icon">${String.fromCodePoint(0x1F4A1)}</span>
          ${persona === 'teen' ? 'Why this?' : 'Analyze'}
        </button>
      </div>
      <div class="fw-analysis-panel fw-hidden">
        <div class="fw-analysis-content"></div>
        <button class="fw-analysis-close">${String.fromCodePoint(0x2715)} Close</button>
      </div>
    ` : ''}
  `;

  // Add toggle functionality (only for Teen/Adult)
  const toggleBtn = wrapper.querySelector('.fw-toggle-btn');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
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

  // Add analysis panel functionality (only for Teen/Adult)
  const analysisBtn = wrapper.querySelector('.fw-analysis-btn');
  const analysisPanel = wrapper.querySelector('.fw-analysis-panel');
  const analysisClose = wrapper.querySelector('.fw-analysis-close');

  if (analysisBtn && analysisPanel) {
    analysisBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const content = wrapper.querySelector('.fw-analysis-content');
      content.innerHTML = generateAnalysisContent(
        wrapper.dataset.original,
        wrapper.dataset.neutralized,
        JSON.parse(wrapper.dataset.techniques),
        parseInt(wrapper.dataset.severity),
        persona
      );
      analysisPanel.classList.remove('fw-hidden');
    });

    if (analysisClose) {
      analysisClose.addEventListener('click', (e) => {
        e.stopPropagation();
        analysisPanel.classList.add('fw-hidden');
      });
    }
  }

  // Badge click also opens analysis
  const badge = wrapper.querySelector('.fw-badge');
  if (badge && analysisPanel) {
    badge.addEventListener('click', (e) => {
      e.stopPropagation();
      if (analysisBtn) analysisBtn.click();
    });
  }

  return wrapper;
}

/**
 * Generate age-appropriate analysis content
 */
function generateAnalysisContent(original, neutralized, techniques, severity, persona) {
  const techniquesHtml = techniques.map(t => {
    const name = typeof t === 'string' ? t : t.name || t;
    return `<li><strong>${escapeHtml(name)}</strong></li>`;
  }).join('');

  if (persona === 'teen') {
    // Teen: Friendly mentor voice
    return `
      <div class="fw-analysis-teen">
        <div class="fw-analysis-header">
          <span class="fw-wise-icon">${String.fromCodePoint(0x1F989)}</span>
          <strong>Hey, here's what I noticed</strong>
        </div>
        <div class="fw-analysis-techniques">
          <p><strong>Techniques used:</strong></p>
          <ul>${techniquesHtml}</ul>
        </div>
        <div class="fw-analysis-severity">
          <strong>Manipulation level:</strong> ${severity}/10 ${getSeverityBar(severity)}
        </div>
        <div class="fw-analysis-thinking">
          <p><strong>Think about it:</strong></p>
          <ul>
            <li>Why might they use these techniques instead of just stating facts?</li>
            <li>How does this make you feel vs. what does it make you think?</li>
            <li>What would a calm version of this look like?</li>
          </ul>
        </div>
        <div class="fw-analysis-neutralized">
          <p><strong>Calmer version:</strong></p>
          <blockquote>${escapeHtml(neutralized)}</blockquote>
        </div>
      </div>
    `;
  } else {
    // Adult: Professional, concise
    return `
      <div class="fw-analysis-adult">
        <div class="fw-analysis-header">
          <span class="fw-wise-icon">${String.fromCodePoint(0x1F4A1)}</span>
          <strong>Analysis</strong>
        </div>
        <div class="fw-analysis-row">
          <span class="fw-label">Detected:</span>
          <span>${techniques.map(t => typeof t === 'string' ? t : t.name || t).join(' • ')}</span>
        </div>
        <div class="fw-analysis-row">
          <span class="fw-label">Severity:</span>
          <span>${severity}/10 ${getSeverityBar(severity)}</span>
        </div>
        <div class="fw-analysis-neutralized">
          <span class="fw-label">Neutralized:</span>
          <blockquote>${escapeHtml(neutralized)}</blockquote>
        </div>
        <p class="fw-analysis-note">Your call. Toggle above to switch views.</p>
      </div>
    `;
  }
}

/**
 * Generate severity bar visualization
 */
function getSeverityBar(severity) {
  const filled = Math.round(severity);
  const empty = 10 - filled;
  const color = severity >= 7 ? '#dc2626' : severity >= 4 ? '#ea580c' : '#16a34a';
  return `<span class="fw-severity-bar" style="color: ${color}">${'▮'.repeat(filled)}${'▯'.repeat(empty)}</span>`;
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

  // Capture original styles BEFORE any modifications for font matching
  const originalStyles = captureElementStyles(element);

  processedElements.add(element);

  try {
    const result = await neutralize(text);

    if (result.techniques && result.techniques.length > 0) {
      const wrapper = createNeutralizedWrapper(
        text,
        result.neutralized,
        result.techniques,
        result.severity,
        originalStyles  // Pass captured styles for font matching
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
  processedElements,
  captureElementStyles,
  detectPlatform,
  PLATFORM_STYLES
};
