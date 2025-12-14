/**
 * FeelingWise Browser Extension - Popup Script
 *
 * Handles the extension popup UI and settings management.
 * Works with settings.js for persistent storage.
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
const personaBtns = document.querySelectorAll('#main-view .persona-btn');

// Check Ollama status
async function checkStatus() {
  try {
    const response = await chrome.runtime.sendMessage({
      type: 'CHECK_STATUS'
    });

    if (response.running) {
      // All good - protected
      statusDot.className = 'status-dot online';
      statusText.className = 'status-text online';
      statusText.textContent = response.friendlyMessage || 'Protected';
      statsRow.style.display = 'flex';
      offlineWarning.style.display = 'none';
      modelsCount.textContent = response.models?.length || 0;
    } else if (response.appNotRunning) {
      // Tauri app not running
      statusDot.className = 'status-dot offline';
      statusText.className = 'status-text offline';
      statusText.textContent = 'App Not Running';
      statsRow.style.display = 'none';
      offlineWarning.style.display = 'block';
      offlineWarning.innerHTML = `
        <div class="friendly-warning">
          <strong>Please start the FeelingWise app</strong>
          <p>Look for FeelingWise in your Start menu or system tray.</p>
        </div>
      `;
    } else if (response.needsSetup) {
      // Setup needed
      statusDot.className = 'status-dot offline';
      statusText.className = 'status-text offline';
      statusText.textContent = 'Setup Required';
      statsRow.style.display = 'none';
      offlineWarning.style.display = 'block';
      offlineWarning.innerHTML = `
        <div class="friendly-warning">
          <strong>Setup required</strong>
          <p>Please complete setup in the FeelingWise app.</p>
        </div>
      `;
    } else {
      // Other issue
      statusDot.className = 'status-dot offline';
      statusText.className = 'status-text offline';
      statusText.textContent = response.friendlyMessage || 'Offline';
      statsRow.style.display = 'none';
      offlineWarning.style.display = 'block';
      offlineWarning.innerHTML = `
        <div class="friendly-warning">
          <strong>${response.friendlyMessage || 'Connection issue'}</strong>
          <p>Try restarting the FeelingWise app.</p>
        </div>
      `;
    }
  } catch (error) {
    console.error('Status check failed:', error);
    statusDot.className = 'status-dot offline';
    statusText.className = 'status-text offline';
    statusText.textContent = 'Error';
    offlineWarning.style.display = 'block';
    offlineWarning.innerHTML = `
      <div class="friendly-warning">
        <strong>Connection error</strong>
        <p>Please restart the FeelingWise app.</p>
      </div>
    `;
  }
}

// Update UI to reflect current settings
function updateMainTabUI() {
  const settings = window.FeelingWiseSettings.get();

  toggleEnabled.checked = settings.enabled;
  toggleAuto.checked = settings.autoNeutralize;
  toggleIndicators.checked = settings.showIndicators;

  // Update persona buttons on main tab
  personaBtns.forEach(btn => {
    if (btn.dataset.persona === settings.persona) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

// Setup event listeners for main tab controls
function setupMainTabListeners() {
  toggleEnabled.addEventListener('change', () => {
    window.FeelingWiseSettings.update('enabled', toggleEnabled.checked);
    notifyBackgroundSettings();
  });

  toggleAuto.addEventListener('change', () => {
    window.FeelingWiseSettings.update('autoNeutralize', toggleAuto.checked);
    notifyBackgroundSettings();
  });

  toggleIndicators.addEventListener('change', () => {
    window.FeelingWiseSettings.update('showIndicators', toggleIndicators.checked);
    notifyBackgroundSettings();
  });

  // Main tab persona buttons
  personaBtns.forEach(btn => {
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

      window.FeelingWiseSettings.update('persona', persona);
      notifyBackgroundSettings();
    });
  });
}

// Notify background script of settings changes
async function notifyBackgroundSettings() {
  try {
    const settings = window.FeelingWiseSettings.get();
    await chrome.runtime.sendMessage({
      type: 'SAVE_SETTINGS',
      settings: settings
    });
  } catch (error) {
    console.error('Failed to notify background:', error);
  }
}

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
  // Initialize settings module first
  await window.FeelingWiseSettings.init();

  // Setup main tab listeners
  setupMainTabListeners();

  // Update main tab UI with loaded settings
  updateMainTabUI();

  // Check Ollama status
  await checkStatus();

  // Update processed count
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
