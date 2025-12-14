/**
 * FeelingWise Browser Extension - Settings Module
 *
 * Handles settings persistence using chrome.storage.sync
 * and tab switching between Main and Settings views.
 */

// Default settings
const DEFAULT_SETTINGS = {
  // Quick settings (Main tab)
  enabled: true,
  autoNeutralize: true,
  showIndicators: true,
  persona: 'adult',

  // Settings tab
  language: 'en',
  storeHistory: true,
  includeTimestamps: true,
  ollamaUrl: 'http://localhost:11434'
};

// Current settings state
let settings = { ...DEFAULT_SETTINGS };

/**
 * Load settings from chrome.storage.sync
 * Falls back to defaults if not found
 */
async function loadSettingsFromStorage() {
  try {
    const result = await chrome.storage.sync.get('feelingWiseSettings');
    if (result.feelingWiseSettings) {
      settings = { ...DEFAULT_SETTINGS, ...result.feelingWiseSettings };
    }
    return settings;
  } catch (error) {
    console.error('Failed to load settings from storage:', error);
    return settings;
  }
}

/**
 * Save settings to chrome.storage.sync
 */
async function saveSettingsToStorage() {
  try {
    await chrome.storage.sync.set({ feelingWiseSettings: settings });
    // Notify background script of settings change
    try {
      await chrome.runtime.sendMessage({
        type: 'SETTINGS_UPDATED',
        settings: settings
      });
    } catch (e) {
      // Background script might not be listening
    }
  } catch (error) {
    console.error('Failed to save settings to storage:', error);
  }
}

/**
 * Update a single setting and persist
 */
async function updateSetting(key, value) {
  settings[key] = value;
  await saveSettingsToStorage();
}

/**
 * Get current settings
 */
function getSettings() {
  return settings;
}

/**
 * Initialize tab switching functionality
 */
function initTabSwitching() {
  const tabBtns = document.querySelectorAll('.tab-bar .tab-btn');
  const mainView = document.getElementById('main-view');
  const settingsView = document.getElementById('settings-view');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;

      // Update tab buttons
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Switch views
      if (tab === 'main') {
        mainView.classList.add('active');
        settingsView.classList.remove('active');
      } else {
        mainView.classList.remove('active');
        settingsView.classList.add('active');
      }
    });
  });
}

/**
 * Initialize settings view controls
 */
function initSettingsControls() {
  // Language dropdown
  const languageSelect = document.getElementById('settings-language');
  if (languageSelect) {
    languageSelect.value = settings.language;
    languageSelect.addEventListener('change', () => {
      updateSetting('language', languageSelect.value);
    });
  }

  // Store history toggle
  const storeHistoryToggle = document.getElementById('settings-store-history');
  if (storeHistoryToggle) {
    storeHistoryToggle.checked = settings.storeHistory;
    storeHistoryToggle.addEventListener('change', () => {
      updateSetting('storeHistory', storeHistoryToggle.checked);
    });
  }

  // Include timestamps toggle
  const timestampsToggle = document.getElementById('settings-timestamps');
  if (timestampsToggle) {
    timestampsToggle.checked = settings.includeTimestamps;
    timestampsToggle.addEventListener('change', () => {
      updateSetting('includeTimestamps', timestampsToggle.checked);
    });
  }

  // Ollama URL input
  const ollamaUrlInput = document.getElementById('settings-ollama-url');
  if (ollamaUrlInput) {
    ollamaUrlInput.value = settings.ollamaUrl;
    // Save on blur (when user clicks away) to avoid saving on every keystroke
    ollamaUrlInput.addEventListener('blur', () => {
      const url = ollamaUrlInput.value.trim() || DEFAULT_SETTINGS.ollamaUrl;
      updateSetting('ollamaUrl', url);
    });
    // Also save on Enter key
    ollamaUrlInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        ollamaUrlInput.blur();
      }
    });
  }

  // Settings tab persona buttons
  const settingsPersonaBtns = document.querySelectorAll('.settings-persona-btn');
  settingsPersonaBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const persona = btn.dataset.persona;

      // Update all persona buttons (both tabs)
      document.querySelectorAll('.persona-btn').forEach(b => {
        if (b.dataset.persona === persona) {
          b.classList.add('active');
        } else {
          b.classList.remove('active');
        }
      });

      updateSetting('persona', persona);
    });
  });
}

/**
 * Sync UI with loaded settings
 */
function syncUIWithSettings() {
  // Language
  const languageSelect = document.getElementById('settings-language');
  if (languageSelect) {
    languageSelect.value = settings.language;
  }

  // Data toggles
  const storeHistoryToggle = document.getElementById('settings-store-history');
  if (storeHistoryToggle) {
    storeHistoryToggle.checked = settings.storeHistory;
  }

  const timestampsToggle = document.getElementById('settings-timestamps');
  if (timestampsToggle) {
    timestampsToggle.checked = settings.includeTimestamps;
  }

  // Ollama URL
  const ollamaUrlInput = document.getElementById('settings-ollama-url');
  if (ollamaUrlInput) {
    ollamaUrlInput.value = settings.ollamaUrl;
  }

  // Sync persona buttons on both tabs
  document.querySelectorAll('.persona-btn').forEach(btn => {
    if (btn.dataset.persona === settings.persona) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

/**
 * Initialize settings module
 */
async function initSettings() {
  await loadSettingsFromStorage();
  initTabSwitching();
  initSettingsControls();
  syncUIWithSettings();
}

// Export for use in popup.js
window.FeelingWiseSettings = {
  init: initSettings,
  load: loadSettingsFromStorage,
  save: saveSettingsToStorage,
  update: updateSetting,
  get: getSettings,
  DEFAULT: DEFAULT_SETTINGS
};
