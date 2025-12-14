/**
 * FeelingWise Localization System
 *
 * Loads and applies UI strings from locale files.
 *
 * USAGE:
 *   // Initialize with a language code
 *   await FWLocale.init('en');
 *
 *   // Get a translated string
 *   const title = FWLocale.t('popup.title');
 *
 *   // Get with fallback
 *   const text = FWLocale.t('some.key', 'Default Value');
 *
 *   // Change language
 *   await FWLocale.setLanguage('ro');
 *
 *   // Apply translations to DOM elements with data-i18n attributes
 *   FWLocale.applyToDOM();
 *
 * ADDING A NEW LANGUAGE:
 *   1. Create locales/{code}.json (copy en.json as template)
 *   2. Translate all strings
 *   3. Add the code to SUPPORTED_LANGUAGES below
 *   4. The language will automatically appear in language selectors
 */

const FWLocale = (() => {
  // Supported language codes - add new languages here
  const SUPPORTED_LANGUAGES = ['en', 'ro'];
  const DEFAULT_LANGUAGE = 'en';
  const STORAGE_KEY = 'fw_language';

  // Current state
  let currentLanguage = DEFAULT_LANGUAGE;
  let strings = {};
  let fallbackStrings = {};

  /**
   * Load a locale file
   * @param {string} langCode - Language code (e.g., 'en', 'ro')
   * @returns {Promise<object>} - Parsed locale object
   */
  async function loadLocale(langCode) {
    try {
      const url = chrome.runtime.getURL(`locales/${langCode}.json`);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to load locale: ${langCode}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`FWLocale: Error loading ${langCode}:`, error);
      return null;
    }
  }

  /**
   * Get a nested value from an object using dot notation
   * @param {object} obj - The object to search
   * @param {string} path - Dot-notation path (e.g., 'popup.title')
   * @returns {string|undefined} - The value or undefined
   */
  function getNestedValue(obj, path) {
    if (!obj || !path) return undefined;

    const keys = path.split('.');
    let current = obj;

    for (const key of keys) {
      if (current === undefined || current === null) return undefined;
      current = current[key];
    }

    return current;
  }

  /**
   * Initialize the localization system
   * @param {string} [langCode] - Optional language code. If not provided, loads from storage.
   * @returns {Promise<void>}
   */
  async function init(langCode) {
    // Load saved language preference or use provided/default
    if (!langCode) {
      try {
        const result = await chrome.storage.sync.get(STORAGE_KEY);
        langCode = result[STORAGE_KEY] || DEFAULT_LANGUAGE;
      } catch (e) {
        langCode = DEFAULT_LANGUAGE;
      }
    }

    // Validate language code
    if (!SUPPORTED_LANGUAGES.includes(langCode)) {
      console.warn(`FWLocale: Unsupported language "${langCode}", falling back to ${DEFAULT_LANGUAGE}`);
      langCode = DEFAULT_LANGUAGE;
    }

    // Always load English as fallback
    if (langCode !== DEFAULT_LANGUAGE) {
      fallbackStrings = await loadLocale(DEFAULT_LANGUAGE) || {};
    }

    // Load the requested language
    const loaded = await loadLocale(langCode);
    if (loaded) {
      strings = loaded;
      currentLanguage = langCode;
    } else {
      // Fall back to English if loading fails
      strings = fallbackStrings;
      currentLanguage = DEFAULT_LANGUAGE;
    }

    return currentLanguage;
  }

  /**
   * Get a translated string
   * @param {string} key - Dot-notation key (e.g., 'popup.title')
   * @param {string} [fallback] - Optional fallback if key not found
   * @returns {string} - Translated string or fallback
   */
  function t(key, fallback = '') {
    // Try current language first
    let value = getNestedValue(strings, key);

    // Fall back to English if not found
    if (value === undefined && fallbackStrings) {
      value = getNestedValue(fallbackStrings, key);
    }

    // Use provided fallback or return key as last resort
    if (value === undefined) {
      return fallback || key;
    }

    return value;
  }

  /**
   * Get a translated string with pluralization
   * @param {string} singularKey - Key for singular form
   * @param {string} pluralKey - Key for plural form
   * @param {number} count - The count to check
   * @returns {string} - Appropriate translated string
   */
  function plural(singularKey, pluralKey, count) {
    return count === 1 ? t(singularKey) : t(pluralKey);
  }

  /**
   * Change the current language
   * @param {string} langCode - New language code
   * @returns {Promise<string>} - The new current language
   */
  async function setLanguage(langCode) {
    if (!SUPPORTED_LANGUAGES.includes(langCode)) {
      console.error(`FWLocale: Language "${langCode}" is not supported`);
      return currentLanguage;
    }

    // Save preference
    try {
      await chrome.storage.sync.set({ [STORAGE_KEY]: langCode });
    } catch (e) {
      console.warn('FWLocale: Could not save language preference');
    }

    // Reload strings
    await init(langCode);

    return currentLanguage;
  }

  /**
   * Apply translations to DOM elements with data-i18n attribute
   *
   * Usage in HTML:
   *   <span data-i18n="popup.title">FeelingWise</span>
   *   <input data-i18n-placeholder="common.search" placeholder="Search...">
   *   <button data-i18n-title="common.save" title="Save">...</button>
   */
  function applyToDOM(container = document) {
    // Text content
    container.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const translated = t(key);
      if (translated && translated !== key) {
        el.textContent = translated;
      }
    });

    // Placeholder attribute
    container.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      const translated = t(key);
      if (translated && translated !== key) {
        el.placeholder = translated;
      }
    });

    // Title attribute
    container.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.getAttribute('data-i18n-title');
      const translated = t(key);
      if (translated && translated !== key) {
        el.title = translated;
      }
    });

    // Update document lang attribute
    if (container === document && strings.meta?.direction) {
      document.documentElement.lang = currentLanguage;
      document.documentElement.dir = strings.meta.direction;
    }
  }

  /**
   * Get list of supported languages with their names
   * @returns {Promise<Array<{code: string, name: string}>>}
   */
  async function getSupportedLanguages() {
    const languages = [];

    for (const code of SUPPORTED_LANGUAGES) {
      const locale = await loadLocale(code);
      languages.push({
        code,
        name: locale?.meta?.name || code.toUpperCase()
      });
    }

    return languages;
  }

  /**
   * Get current language code
   * @returns {string}
   */
  function getCurrentLanguage() {
    return currentLanguage;
  }

  /**
   * Get current language name
   * @returns {string}
   */
  function getCurrentLanguageName() {
    return strings.meta?.name || currentLanguage.toUpperCase();
  }

  /**
   * Check if a language is supported
   * @param {string} langCode - Language code to check
   * @returns {boolean}
   */
  function isSupported(langCode) {
    return SUPPORTED_LANGUAGES.includes(langCode);
  }

  // Public API
  return {
    init,
    t,
    plural,
    setLanguage,
    applyToDOM,
    getSupportedLanguages,
    getCurrentLanguage,
    getCurrentLanguageName,
    isSupported,
    SUPPORTED_LANGUAGES,
    DEFAULT_LANGUAGE
  };
})();

// Export for use in content scripts and modules
if (typeof window !== 'undefined') {
  window.FWLocale = FWLocale;
}
