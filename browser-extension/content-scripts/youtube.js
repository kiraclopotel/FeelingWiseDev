/**
 * FeelingWise - YouTube Content Script
 *
 * Processes video titles, descriptions, and comments for manipulative content.
 */

(function() {
  'use strict';

  // YouTube-specific selectors
  const YT_SELECTORS = {
    // Video titles in feed
    videoTitle: '#video-title, ytd-video-renderer #video-title-link',
    // Video description on watch page
    videoDescription: '#description-inner, #description ytd-text-inline-expander',
    // Comments
    commentText: '#content-text',
    // Video cards/thumbnails
    videoRenderer: 'ytd-video-renderer, ytd-rich-item-renderer',
    // Comment renderer
    commentRenderer: 'ytd-comment-renderer',
    // Video title on watch page
    watchTitle: 'h1.ytd-video-primary-info-renderer, h1.ytd-watch-metadata'
  };

  let processingQueue = [];
  let isProcessing = false;
  const BATCH_SIZE = 3;
  const BATCH_DELAY = 500;

  /**
   * Extract text from a YouTube element
   */
  function getElementText(element) {
    return element.textContent.trim();
  }

  /**
   * Process a video title element
   */
  async function processTitle(titleElement) {
    if (!titleElement) return;
    if (titleElement.querySelector('.fw-neutralized-wrapper')) return;
    if (window.FW.processedElements.has(titleElement)) return;

    const text = getElementText(titleElement);
    if (!window.FW.shouldProcess(text)) return;

    window.FW.processedElements.add(titleElement);
    titleElement.classList.add('fw-processing');

    try {
      const result = await window.FW.neutralize(text);

      if (result.techniques && result.techniques.length > 0) {
        titleElement.classList.remove('fw-processing');

        // For titles, we do inline replacement instead of full wrapper
        const originalText = text;
        const neutralizedText = result.neutralized;

        // Store original
        titleElement.dataset.fwOriginal = originalText;
        titleElement.dataset.fwNeutralized = neutralizedText;
        titleElement.dataset.fwTechniques = JSON.stringify(result.techniques);
        titleElement.dataset.fwSeverity = result.severity;

        // Add indicator
        const indicator = document.createElement('span');
        indicator.className = 'fw-title-indicator';
        indicator.innerHTML = `
          <span class="fw-badge-small fw-severity-${result.severity >= 7 ? 'high' : result.severity >= 4 ? 'medium' : 'low'}">
            ${result.techniques.length}
          </span>
        `;
        indicator.title = `FeelingWise: ${result.techniques.length} manipulation technique(s) detected`;

        // Update text content
        const textSpan = titleElement.querySelector('#video-title') || titleElement;
        if (textSpan.childNodes.length > 0) {
          const firstTextNode = Array.from(textSpan.childNodes).find(n => n.nodeType === Node.TEXT_NODE);
          if (firstTextNode) {
            firstTextNode.textContent = neutralizedText;
          } else {
            textSpan.textContent = neutralizedText;
          }
        } else {
          textSpan.textContent = neutralizedText;
        }

        // Append indicator
        titleElement.appendChild(indicator);
      } else {
        titleElement.classList.remove('fw-processing');
      }
    } catch (error) {
      console.error('FeelingWise: Failed to process YouTube title', error);
      titleElement.classList.remove('fw-processing');
      window.FW.processedElements.delete(titleElement);
    }
  }

  /**
   * Process a comment element
   */
  async function processComment(commentElement) {
    const textElement = commentElement.querySelector(YT_SELECTORS.commentText);
    if (!textElement) return;

    if (textElement.querySelector('.fw-neutralized-wrapper')) return;
    if (window.FW.processedElements.has(textElement)) return;

    const text = getElementText(textElement);
    if (!window.FW.shouldProcess(text)) return;

    // Capture original styles BEFORE any modifications for font matching
    const originalStyles = window.FW.captureElementStyles(textElement);

    window.FW.processedElements.add(textElement);
    textElement.classList.add('fw-processing');

    try {
      const result = await window.FW.neutralize(text);

      if (result.techniques && result.techniques.length > 0) {
        textElement.classList.remove('fw-processing');

        const wrapper = window.FW.createNeutralizedWrapper(
          text,
          result.neutralized,
          result.techniques,
          result.severity,
          originalStyles  // Pass captured styles for font matching
        );

        textElement.innerHTML = '';
        textElement.appendChild(wrapper);
      } else {
        textElement.classList.remove('fw-processing');
      }
    } catch (error) {
      console.error('FeelingWise: Failed to process YouTube comment', error);
      textElement.classList.remove('fw-processing');
      window.FW.processedElements.delete(textElement);
    }
  }

  /**
   * Process video description
   */
  async function processDescription(descElement) {
    if (!descElement) return;
    if (descElement.querySelector('.fw-neutralized-wrapper')) return;
    if (window.FW.processedElements.has(descElement)) return;

    const text = getElementText(descElement);
    if (!window.FW.shouldProcess(text)) return;

    // Capture original styles BEFORE any modifications for font matching
    const originalStyles = window.FW.captureElementStyles(descElement);

    window.FW.processedElements.add(descElement);
    descElement.classList.add('fw-processing');

    try {
      const result = await window.FW.neutralize(text);

      if (result.techniques && result.techniques.length > 0) {
        descElement.classList.remove('fw-processing');

        const wrapper = window.FW.createNeutralizedWrapper(
          text,
          result.neutralized,
          result.techniques,
          result.severity,
          originalStyles  // Pass captured styles for font matching
        );

        // Prepend wrapper to description
        descElement.insertBefore(wrapper, descElement.firstChild);
      } else {
        descElement.classList.remove('fw-processing');
      }
    } catch (error) {
      console.error('FeelingWise: Failed to process YouTube description', error);
      descElement.classList.remove('fw-processing');
      window.FW.processedElements.delete(descElement);
    }
  }

  /**
   * Generic queue processor
   */
  async function processQueue() {
    if (isProcessing || processingQueue.length === 0) return;

    isProcessing = true;

    const batch = processingQueue.splice(0, BATCH_SIZE);
    await Promise.all(batch.map(item => {
      if (item.type === 'title') return processTitle(item.element);
      if (item.type === 'comment') return processComment(item.element);
      if (item.type === 'description') return processDescription(item.element);
    }));

    isProcessing = false;

    if (processingQueue.length > 0) {
      setTimeout(processQueue, BATCH_DELAY);
    }
  }

  /**
   * Queue an element for processing
   */
  function queueElement(element, type) {
    const existing = processingQueue.find(i => i.element === element);
    if (!existing) {
      processingQueue.push({ element, type });
    }
    processQueue();
  }

  /**
   * Find and process all visible YouTube content
   */
  function processVisibleContent(container = document) {
    if (!window.FW.settings.enabled) return;

    // Process video titles in feed
    const titles = container.querySelectorAll(YT_SELECTORS.videoTitle);
    titles.forEach(title => queueElement(title, 'title'));

    // Process watch page title
    const watchTitle = container.querySelector(YT_SELECTORS.watchTitle);
    if (watchTitle) queueElement(watchTitle, 'title');

    // Process comments
    const comments = container.querySelectorAll(YT_SELECTORS.commentRenderer);
    comments.forEach(comment => queueElement(comment, 'comment'));

    // Process description (on watch page)
    const description = container.querySelector(YT_SELECTORS.videoDescription);
    if (description) queueElement(description, 'description');
  }

  /**
   * Initialize observer
   */
  function initObserver() {
    const observer = new MutationObserver((mutations) => {
      if (!window.FW.settings.enabled) return;

      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType !== Node.ELEMENT_NODE) continue;

          // Check for video renderers
          if (node.matches && (node.matches(YT_SELECTORS.videoRenderer) || node.matches(YT_SELECTORS.commentRenderer))) {
            processVisibleContent(node);
          } else if (node.querySelectorAll) {
            // Check children
            processVisibleContent(node);
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

  /**
   * Re-process on settings change
   */
  window.FW_REPROCESS = function() {
    processingQueue = [];
    processVisibleContent();
  };

  // Initialize
  function init() {
    console.log('FeelingWise: YouTube content script loaded');

    if (!window.FW) {
      setTimeout(init, 100);
      return;
    }

    processVisibleContent();
    initObserver();

    // Process on scroll (for infinite scroll feeds)
    let scrollTimeout;
    window.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        processVisibleContent();
      }, 300);
    }, { passive: true });

    // Also process on YouTube's navigation events
    window.addEventListener('yt-navigate-finish', () => {
      setTimeout(processVisibleContent, 500);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
