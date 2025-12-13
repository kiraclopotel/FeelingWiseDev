/**
 * FeelingWise - Facebook Content Script
 *
 * Processes posts in the Facebook feed and neutralizes manipulative content.
 */

(function() {
  'use strict';

  // Facebook-specific selectors (these may change as FB updates)
  const FB_SELECTORS = {
    // Post content container (FB uses various data-ad-* attributes)
    postText: '[data-ad-comet-preview="message"], [data-ad-preview="message"]',
    // Alternative post text selector
    postTextAlt: '[dir="auto"][style*="text-align"]',
    // Feed post containers
    feedPost: '[role="article"]',
    // Comment text
    commentText: '[dir="auto"][class*="comment"]',
    // Post by specific author
    postAuthor: '[role="link"][tabindex="0"]'
  };

  // Track processed elements
  let processingQueue = [];
  let isProcessing = false;
  const BATCH_SIZE = 2;
  const BATCH_DELAY = 800;

  /**
   * Extract text from a Facebook post element
   */
  function getPostText(postElement) {
    // Try multiple selectors as FB structure varies
    let textElement = postElement.querySelector(FB_SELECTORS.postText);

    if (!textElement) {
      // Fallback: look for divs with dir="auto" that contain text
      const candidates = postElement.querySelectorAll('div[dir="auto"]');
      for (const candidate of candidates) {
        // Skip if it's a button/link text
        if (candidate.closest('a, button, [role="button"]')) continue;
        // Skip if it's too short or doesn't look like post content
        if (candidate.textContent.trim().length > 20) {
          textElement = candidate;
          break;
        }
      }
    }

    if (!textElement) return '';

    // Get text content
    const text = textElement.textContent.trim();
    return text;
  }

  /**
   * Find the main text container in a post
   */
  function findTextContainer(postElement) {
    // Try primary selector
    let container = postElement.querySelector(FB_SELECTORS.postText);

    if (!container) {
      // Fallback search
      const candidates = postElement.querySelectorAll('div[dir="auto"]');
      for (const candidate of candidates) {
        if (candidate.closest('a, button, [role="button"]')) continue;
        if (candidate.textContent.trim().length > 20) {
          container = candidate;
          break;
        }
      }
    }

    return container;
  }

  /**
   * Replace post content with neutralized version
   */
  function replacePostContent(textContainer, wrapper) {
    if (!textContainer) return;

    // Store original content
    textContainer.dataset.fwOriginal = textContainer.innerHTML;

    // Replace with wrapper
    textContainer.innerHTML = '';
    textContainer.appendChild(wrapper);
  }

  /**
   * Process a single Facebook post
   */
  async function processPost(postElement) {
    const textContainer = findTextContainer(postElement);
    if (!textContainer) return;

    // Skip if already processed
    if (textContainer.querySelector('.fw-neutralized-wrapper')) return;
    if (window.FW.processedElements.has(textContainer)) return;

    const text = getPostText(postElement);
    if (!window.FW.shouldProcess(text)) return;

    // Mark as being processed
    window.FW.processedElements.add(textContainer);
    textContainer.classList.add('fw-processing');

    try {
      const result = await window.FW.neutralize(text);

      if (result.techniques && result.techniques.length > 0) {
        textContainer.classList.remove('fw-processing');

        const wrapper = window.FW.createNeutralizedWrapper(
          text,
          result.neutralized,
          result.techniques,
          result.severity
        );

        replacePostContent(textContainer, wrapper);
      } else {
        textContainer.classList.remove('fw-processing');
      }
    } catch (error) {
      console.error('FeelingWise: Failed to process Facebook post', error);
      textContainer.classList.remove('fw-processing');
      window.FW.processedElements.delete(textContainer);
    }
  }

  /**
   * Process queue of posts
   */
  async function processQueue() {
    if (isProcessing || processingQueue.length === 0) return;

    isProcessing = true;

    const batch = processingQueue.splice(0, BATCH_SIZE);
    await Promise.all(batch.map(processPost));

    isProcessing = false;

    if (processingQueue.length > 0) {
      setTimeout(processQueue, BATCH_DELAY);
    }
  }

  /**
   * Add post to processing queue
   */
  function queuePost(postElement) {
    if (!processingQueue.includes(postElement)) {
      processingQueue.push(postElement);
    }
    processQueue();
  }

  /**
   * Find and process all visible posts
   */
  function processVisiblePosts(container = document) {
    if (!window.FW.settings.enabled) return;

    const posts = container.querySelectorAll(FB_SELECTORS.feedPost);
    posts.forEach(post => {
      // Skip sponsored posts if they have no meaningful content
      queuePost(post);
    });
  }

  /**
   * Initialize observer for dynamic content
   */
  function initObserver() {
    const observer = new MutationObserver((mutations) => {
      if (!window.FW.settings.enabled) return;

      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType !== Node.ELEMENT_NODE) continue;

          if (node.matches && node.matches(FB_SELECTORS.feedPost)) {
            queuePost(node);
          } else if (node.querySelectorAll) {
            const posts = node.querySelectorAll(FB_SELECTORS.feedPost);
            posts.forEach(queuePost);
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
   * Re-process content when settings change
   */
  window.FW_REPROCESS = function() {
    processingQueue = [];
    processVisiblePosts();
  };

  // Initialize
  function init() {
    console.log('FeelingWise: Facebook content script loaded');

    if (!window.FW) {
      setTimeout(init, 100);
      return;
    }

    processVisiblePosts();
    initObserver();

    // Process on scroll
    let scrollTimeout;
    window.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        processVisiblePosts();
      }, 300);
    }, { passive: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
