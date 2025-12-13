/**
 * FeelingWise - Twitter/X Content Script
 *
 * Processes tweets in the Twitter/X feed and neutralizes manipulative content.
 */

(function() {
  'use strict';

  // Twitter-specific selectors
  const TWEET_SELECTORS = {
    // Tweet text content
    tweetText: '[data-testid="tweetText"]',
    // Individual tweet container
    tweet: 'article[data-testid="tweet"]',
    // Timeline container
    timeline: '[aria-label="Timeline: Your Home Timeline"], [aria-label="Timeline"]',
    // Quote tweet text
    quoteTweet: '[data-testid="tweet"] [data-testid="tweet"]'
  };

  // Throttle processing to avoid overwhelming the AI
  let processingQueue = [];
  let isProcessing = false;
  const BATCH_SIZE = 3;
  const BATCH_DELAY = 500;

  /**
   * Extract text from a tweet element
   */
  function getTweetText(tweetTextElement) {
    // Get all text spans (handles links, mentions, hashtags)
    const textNodes = [];
    const walker = document.createTreeWalker(
      tweetTextElement,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );

    let node;
    while ((node = walker.nextNode())) {
      textNodes.push(node.textContent);
    }

    return textNodes.join('').trim();
  }

  /**
   * Replace tweet content with neutralized version
   */
  function replaceTweetContent(tweetTextElement, wrapper) {
    // Store original parent styles
    const parent = tweetTextElement.parentElement;

    // Clear the element and add our wrapper
    tweetTextElement.innerHTML = '';
    tweetTextElement.appendChild(wrapper);
  }

  /**
   * Process a single tweet
   */
  async function processTweet(tweetElement) {
    const textElement = tweetElement.querySelector(TWEET_SELECTORS.tweetText);
    if (!textElement) return;

    // Skip if already processed
    if (textElement.querySelector('.fw-neutralized-wrapper')) return;
    if (window.FW.processedElements.has(textElement)) return;

    const text = getTweetText(textElement);
    if (!window.FW.shouldProcess(text)) return;

    // Capture original styles BEFORE any modifications for font matching
    const originalStyles = window.FW.captureElementStyles(textElement);

    // Mark as being processed
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

        replaceTweetContent(textElement, wrapper);
      } else {
        textElement.classList.remove('fw-processing');
      }
    } catch (error) {
      console.error('FeelingWise: Failed to process tweet', error);
      textElement.classList.remove('fw-processing');
      window.FW.processedElements.delete(textElement);
    }
  }

  /**
   * Process queue of tweets
   */
  async function processQueue() {
    if (isProcessing || processingQueue.length === 0) return;

    isProcessing = true;

    // Take a batch
    const batch = processingQueue.splice(0, BATCH_SIZE);

    // Process in parallel
    await Promise.all(batch.map(processTweet));

    isProcessing = false;

    // Continue if more in queue
    if (processingQueue.length > 0) {
      setTimeout(processQueue, BATCH_DELAY);
    }
  }

  /**
   * Add tweet to processing queue
   */
  function queueTweet(tweetElement) {
    if (!processingQueue.includes(tweetElement)) {
      processingQueue.push(tweetElement);
    }
    processQueue();
  }

  /**
   * Find and process all visible tweets
   */
  function processVisibleTweets(container = document) {
    if (!window.FW.settings.enabled) return;

    const tweets = container.querySelectorAll(TWEET_SELECTORS.tweet);
    tweets.forEach(tweet => {
      // Skip quote tweets (they have nested tweet structure)
      if (tweet.closest(TWEET_SELECTORS.quoteTweet) && tweet !== tweet.closest(TWEET_SELECTORS.quoteTweet)) {
        return;
      }
      queueTweet(tweet);
    });
  }

  /**
   * Initialize the observer for dynamic content
   */
  function initObserver() {
    const observer = new MutationObserver((mutations) => {
      if (!window.FW.settings.enabled) return;

      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType !== Node.ELEMENT_NODE) continue;

          // Check if it's a tweet or contains tweets
          if (node.matches && node.matches(TWEET_SELECTORS.tweet)) {
            queueTweet(node);
          } else if (node.querySelectorAll) {
            const tweets = node.querySelectorAll(TWEET_SELECTORS.tweet);
            tweets.forEach(queueTweet);
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
    // Clear processed tracking and reprocess
    processingQueue = [];
    processVisibleTweets();
  };

  // Initialize when DOM is ready
  function init() {
    console.log('FeelingWise: Twitter content script loaded');

    // Wait for FW to be available
    if (!window.FW) {
      setTimeout(init, 100);
      return;
    }

    // Process existing tweets
    processVisibleTweets();

    // Watch for new tweets
    initObserver();

    // Also process on scroll (Twitter uses virtualized lists)
    let scrollTimeout;
    window.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        processVisibleTweets();
      }, 200);
    }, { passive: true });
  }

  // Start initialization
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
