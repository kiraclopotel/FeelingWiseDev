/**
 * FeelingWise Browser Extension - Popup Script
 *
 * Handles the extension popup UI and settings management.
 */

// DOM Elements
const statusDot = document.getElementById('status-dot');
const statusText = document.getElementById('status-text');
const statsRow = document.getElementById('stats-row');
const modelsCount = document.getElementById('models-count');
const processedCount = document.getElementById('processed-count');
const offlineWarning = document.getElementById('offline-warning');
const toggleEnabled = document.getElementById('toggle-enabled');
const toggleAuto = document.getElementById('toggle-auto');
const toggleIndicators = document.getElementById('toggle-indicators');
const personaBtns = document.querySelectorAll('.persona-btn');

// Current settings
let currentSettings = {
  enabled: true,
  persona: 'adult',
  autoNeutralize: true,
  showIndicators: true
};

// Check Ollama status
async function checkStatus() {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'CHECK_STATUS' });

    if (response.running) {
      statusDot.className = 'status-dot online';
      statusText.className = 'status-text online';
      statusText.textContent = 'Connected';
      statsRow.style.display = 'flex';
      offlineWarning.style.display = 'none';
      modelsCount.textContent = response.models?.length || 0;
    } else {
      statusDot.className = 'status-dot offline';
      statusText.className = 'status-text offline';
      statusText.textContent = 'Offline';
      statsRow.style.display = 'none';
      offlineWarning.style.display = 'block';
    }
  } catch (error) {
    console.error('Status check failed:', error);
    statusDot.className = 'status-dot offline';
    statusText.className = 'status-text offline';
    statusText.textContent = 'Error';
    offlineWarning.style.display = 'block';
  }
}

// Load settings
async function loadSettings() {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'GET_SETTINGS' });
    if (response) {
      currentSettings = response;
      updateUI();
    }
  } catch (error) {
    console.error('Failed to load settings:', error);
  }
}

// Save settings
async function saveSettings() {
  try {
    await chrome.runtime.sendMessage({
      type: 'SAVE_SETTINGS',
      settings: currentSettings
    });
  } catch (error) {
    console.error('Failed to save settings:', error);
  }
}

// Update UI to reflect current settings
function updateUI() {
  toggleEnabled.checked = currentSettings.enabled;
  toggleAuto.checked = currentSettings.autoNeutralize;
  toggleIndicators.checked = currentSettings.showIndicators;

  personaBtns.forEach(btn => {
    if (btn.dataset.persona === currentSettings.persona) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

// Event listeners
toggleEnabled.addEventListener('change', () => {
  currentSettings.enabled = toggleEnabled.checked;
  saveSettings();
});

toggleAuto.addEventListener('change', () => {
  currentSettings.autoNeutralize = toggleAuto.checked;
  saveSettings();
});

toggleIndicators.addEventListener('change', () => {
  currentSettings.showIndicators = toggleIndicators.checked;
  saveSettings();
});

personaBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    personaBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentSettings.persona = btn.dataset.persona;
    saveSettings();
  });
});

// Get processed count from storage
async function updateProcessedCount() {
  try {
    const result = await chrome.storage.local.get('processedCount');
    processedCount.textContent = result.processedCount || 0;
  } catch (error) {
    console.error('Failed to get processed count:', error);
  }
}

// Initialize popup
async function init() {
  await checkStatus();
  await loadSettings();
  await updateProcessedCount();

  // Refresh status periodically while popup is open
  setInterval(checkStatus, 5000);

  // Also refresh processed count periodically
  setInterval(updateProcessedCount, 2000);
}

// Listen for storage changes to update counter in real-time
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && changes.processedCount) {
    processedCount.textContent = changes.processedCount.newValue || 0;
  }
});

init();
