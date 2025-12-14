# FeelingWise: Zero-Configuration Architecture Implementation Plan

## Executive Summary

Transform FeelingWise from a developer-friendly app requiring command-line setup into a truly parent-friendly "install and forget" experience. The parent should never see a port number, command prompt, or technical error message.

---

## Current State Analysis

### What Works
- Tauri app can start/stop Ollama process
- Health checks via HTTP (2s timeout)
- Model pulling capability exists
- Browser extension connects to localhost:11434
- Dual-layer caching (extension + SQLite)

### What's Missing
1. **No Ollama installation detection/help** - Just returns boolean
2. **No OLLAMA_ORIGINS=* setting** - Extension blocked by CORS
3. **No system tray** - App must stay visible
4. **No Windows startup** - Manual launch required
5. **No extension ↔ Tauri communication** - Extension talks directly to Ollama
6. **No auto-recovery** - Ollama crash = manual restart
7. **No first-run wizard** - Technical setup shown to users

---

## Architecture Changes

### New Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                      BROWSER EXTENSION                               │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  background.js (Service Worker)                                 │ │
│  │  ┌──────────────────────────────────────────────────────────┐  │ │
│  │  │ 1. Check Native Messaging Host (Tauri app running?)       │  │ │
│  │  │ 2. If running → Get port from Tauri                       │  │ │
│  │  │ 3. If not → Show "Please start FeelingWise" message       │  │ │
│  │  │ 4. Connect to Ollama via Tauri-provided URL               │  │ │
│  │  └──────────────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                              │                                       │
│                    Native Messaging / HTTP                           │
│                              │                                       │
└──────────────────────────────┼───────────────────────────────────────┘
                               │
         ┌─────────────────────┼─────────────────────┐
         │                     │                     │
         ▼                     ▼                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    TAURI DESKTOP APP                                 │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  SYSTEM TRAY (always running)                                   │ │
│  │  ├─ Show Window                                                 │ │
│  │  ├─ Ollama Status: ● Running                                    │ │
│  │  ├─ Restart Ollama                                              │ │
│  │  ├─ Settings                                                    │ │
│  │  └─ Quit                                                        │ │
│  └────────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  OLLAMA SUPERVISOR (new module)                                 │ │
│  │  ├─ Installation Detection (registry, PATH, common locations)  │ │
│  │  ├─ Auto-Start with OLLAMA_ORIGINS=*                           │ │
│  │  ├─ Health Monitor (every 5s)                                  │ │
│  │  ├─ Auto-Restart on crash (max 3 attempts)                     │ │
│  │  └─ Model Availability Check                                   │ │
│  └────────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  FIRST-RUN WIZARD                                               │ │
│  │  Step 1: "Checking system..." (auto-detect language)           │ │
│  │  Step 2: "Installing AI engine..." (if Ollama missing)         │ │
│  │  Step 3: "Downloading AI model..." (progress bar)              │ │
│  │  Step 4: "Install browser extension" (one-click link)          │ │
│  │  Step 5: "All set! ✓"                                          │ │
│  └────────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  SETTINGS (persisted)                                           │ │
│  │  ├─ Start on Windows login: [✓]                                │ │
│  │  ├─ Minimize to tray on close: [✓]                             │ │
│  │  └─ Language: [Auto-detected / Manual]                         │ │
│  └────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                               │
                               │ Spawns & Monitors
                               ▼
                ┌─────────────────────────────────────┐
                │   OLLAMA PROCESS (invisible)        │
                │   ├─ OLLAMA_ORIGINS=*               │
                │   ├─ OLLAMA_HOST=127.0.0.1:11434    │
                │   └─ Runs in background             │
                └─────────────────────────────────────┘
```

---

## Implementation Tasks

### Phase 1: Ollama Supervisor Module (Rust Backend)

#### 1.1 Create `src-tauri/src/supervisor.rs`

**Purpose:** Centralized Ollama lifecycle management with auto-recovery

```rust
// New module structure
pub struct OllamaSupervisor {
    process: Arc<Mutex<Option<Child>>>,
    status: Arc<Mutex<SupervisorStatus>>,
    restart_count: AtomicU32,
    config: SupervisorConfig,
}

pub struct SupervisorConfig {
    pub max_restart_attempts: u32,     // Default: 3
    pub health_check_interval: Duration, // Default: 5s
    pub startup_timeout: Duration,      // Default: 30s
}

pub enum SupervisorStatus {
    Starting,
    Running { pid: u32, uptime: Duration },
    Unhealthy { last_error: String },
    Stopped,
    OllamaNotInstalled,
    ModelMissing,
}
```

**Key Methods:**
- `detect_ollama_installation()` → Check registry, PATH, common install locations
- `get_ollama_path()` → Return executable path or None
- `start_supervised()` → Start with OLLAMA_ORIGINS=*, monitor health
- `health_loop()` → Background task checking every 5s, auto-restart on failure
- `get_friendly_status()` → Return user-friendly status (no technical details)

#### 1.2 Modify `src-tauri/src/ollama.rs`

**Changes:**
- Add `OLLAMA_ORIGINS=*` environment variable when spawning
- Add `OLLAMA_HOST=127.0.0.1:11434` environment variable
- Improve `find_ollama_binary()` to search:
  - Windows: `C:\Users\*\AppData\Local\Programs\Ollama\ollama.exe`
  - Windows: `C:\Program Files\Ollama\ollama.exe`
  - Registry: `HKLM\SOFTWARE\Ollama`
  - PATH environment variable
- Add timeout handling for slow startups

**New start code:**
```rust
pub async fn start_with_cors(&self) -> Result<(), String> {
    let ollama_path = self.find_ollama_binary()?;

    let child = Command::new(&ollama_path)
        .arg("serve")
        .env("OLLAMA_ORIGINS", "*")  // Allow browser extension
        .env("OLLAMA_HOST", "127.0.0.1:11434")
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .creation_flags(CREATE_NO_WINDOW) // Windows: hide console
        .spawn()
        .map_err(|e| format!("Failed to start Ollama: {}", e))?;

    // Wait for ready...
}
```

#### 1.3 Add Windows-Specific Process Hiding

**File:** `src-tauri/src/ollama.rs`

```rust
#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;

#[cfg(target_os = "windows")]
const CREATE_NO_WINDOW: u32 = 0x08000000;
const DETACHED_PROCESS: u32 = 0x00000008;
```

---

### Phase 2: System Tray Integration

#### 2.1 Update `src-tauri/Cargo.toml`

Add system tray dependencies:
```toml
[dependencies]
tauri = { version = "2", features = ["tray-icon", "image-png"] }
```

#### 2.2 Update `src-tauri/tauri.conf.json`

```json
{
  "app": {
    "trayIcon": {
      "iconPath": "icons/tray-icon.png",
      "iconAsTemplate": true
    }
  }
}
```

#### 2.3 Implement System Tray in `src-tauri/src/lib.rs`

```rust
use tauri::{
    tray::{TrayIconBuilder, TrayIconEvent},
    menu::{Menu, MenuItem},
    Manager,
};

fn setup_system_tray(app: &mut App) -> Result<(), Box<dyn std::error::Error>> {
    let show = MenuItem::with_id(app, "show", "Show FeelingWise", true, None)?;
    let status = MenuItem::with_id(app, "status", "● Ollama Running", false, None)?;
    let restart = MenuItem::with_id(app, "restart", "Restart Ollama", true, None)?;
    let quit = MenuItem::with_id(app, "quit", "Quit", true, None)?;

    let menu = Menu::with_items(app, &[&show, &status, &restart, &quit])?;

    TrayIconBuilder::new()
        .icon(app.default_window_icon().unwrap().clone())
        .menu(&menu)
        .on_menu_event(|app, event| {
            match event.id.as_ref() {
                "show" => { /* Show main window */ }
                "restart" => { /* Restart Ollama */ }
                "quit" => { std::process::exit(0); }
                _ => {}
            }
        })
        .build(app)?;

    Ok(())
}
```

#### 2.4 Window Close Behavior

**Minimize to tray instead of quit:**
```rust
// In setup
window.on_window_event(|event| {
    if let tauri::WindowEvent::CloseRequested { api, .. } = event {
        api.prevent_close();
        window.hide().unwrap();
    }
});
```

---

### Phase 3: Windows Auto-Start

#### 3.1 Add New Tauri Commands

**File:** `src-tauri/src/lib.rs`

```rust
#[tauri::command]
async fn set_autostart(enabled: bool) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        use winreg::enums::*;
        use winreg::RegKey;

        let hkcu = RegKey::predef(HKEY_CURRENT_USER);
        let path = r"Software\Microsoft\Windows\CurrentVersion\Run";
        let key = hkcu.open_subkey_with_flags(path, KEY_WRITE)
            .map_err(|e| e.to_string())?;

        if enabled {
            let exe_path = std::env::current_exe()
                .map_err(|e| e.to_string())?;
            key.set_value("FeelingWise", &exe_path.to_string_lossy().to_string())
                .map_err(|e| e.to_string())?;
        } else {
            let _ = key.delete_value("FeelingWise");
        }
    }
    Ok(())
}

#[tauri::command]
async fn get_autostart() -> Result<bool, String> {
    #[cfg(target_os = "windows")]
    {
        use winreg::enums::*;
        use winreg::RegKey;

        let hkcu = RegKey::predef(HKEY_CURRENT_USER);
        let path = r"Software\Microsoft\Windows\CurrentVersion\Run";
        let key = hkcu.open_subkey(path).map_err(|e| e.to_string())?;

        Ok(key.get_value::<String, _>("FeelingWise").is_ok())
    }
    #[cfg(not(target_os = "windows"))]
    Ok(false)
}
```

#### 3.2 Add `winreg` Dependency

**File:** `src-tauri/Cargo.toml`
```toml
[target.'cfg(windows)'.dependencies]
winreg = "0.52"
```

---

### Phase 4: Extension ↔ Tauri Communication

#### 4.1 Option A: HTTP Endpoint in Tauri (Simpler)

Add a local HTTP server in Tauri that the extension can query:

**New file:** `src-tauri/src/extension_bridge.rs`

```rust
use axum::{routing::get, Router, Json};
use serde::Serialize;

#[derive(Serialize)]
struct BridgeStatus {
    app_running: bool,
    ollama_status: String,
    ollama_url: String,
    version: String,
}

pub async fn start_bridge_server() {
    let app = Router::new()
        .route("/status", get(status_handler))
        .route("/health", get(|| async { "ok" }));

    // Listen on a fixed port the extension knows about
    let listener = tokio::net::TcpListener::bind("127.0.0.1:19542").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

async fn status_handler() -> Json<BridgeStatus> {
    Json(BridgeStatus {
        app_running: true,
        ollama_status: "running".to_string(),
        ollama_url: "http://127.0.0.1:11434".to_string(),
        version: env!("CARGO_PKG_VERSION").to_string(),
    })
}
```

#### 4.2 Update Browser Extension

**File:** `browser-extension/background.js`

```javascript
// New constants
const TAURI_BRIDGE_URL = 'http://127.0.0.1:19542';
const OLLAMA_BASE_URL = 'http://127.0.0.1:11434';

// Check if Tauri app is running first
async function checkTauriApp() {
  try {
    const response = await fetch(`${TAURI_BRIDGE_URL}/status`, {
      signal: AbortSignal.timeout(2000)
    });
    if (response.ok) {
      const data = await response.json();
      return { running: true, ollamaUrl: data.ollama_url };
    }
  } catch (e) {
    return { running: false, ollamaUrl: null };
  }
  return { running: false, ollamaUrl: null };
}

// Modified status check
async function checkOllamaStatus() {
  // First check if Tauri app is running
  const tauriStatus = await checkTauriApp();

  if (!tauriStatus.running) {
    lastOllamaStatus = false;
    updateBadge('APP_NOT_RUNNING');
    return false;
  }

  // Then check Ollama via the app
  try {
    const response = await fetch(`${tauriStatus.ollamaUrl}/api/tags`, {
      signal: AbortSignal.timeout(3000)
    });
    lastOllamaStatus = response.ok;
    updateBadge(response.ok ? 'RUNNING' : 'OLLAMA_ERROR');
    return response.ok;
  } catch (e) {
    lastOllamaStatus = false;
    updateBadge('OLLAMA_ERROR');
    return false;
  }
}
```

#### 4.3 Update Extension Popup

**File:** `browser-extension/popup/popup.js`

Add friendly messages:

```javascript
function updateStatusDisplay(status) {
  const statusElement = document.getElementById('ollama-status');
  const messageElement = document.getElementById('status-message');

  if (status === 'APP_NOT_RUNNING') {
    statusElement.className = 'status-indicator offline';
    statusElement.textContent = 'App Not Running';
    messageElement.innerHTML = `
      <div class="friendly-message">
        <p>Please start the <strong>FeelingWise</strong> app.</p>
        <p class="hint">Look for the FeelingWise icon in your system tray or start menu.</p>
      </div>
    `;
  } else if (status === 'RUNNING') {
    statusElement.className = 'status-indicator online';
    statusElement.textContent = 'Protected';
    messageElement.innerHTML = `
      <div class="friendly-message success">
        <p>Content protection is active.</p>
      </div>
    `;
  } else {
    statusElement.className = 'status-indicator error';
    statusElement.textContent = 'Connection Issue';
    messageElement.innerHTML = `
      <div class="friendly-message">
        <p>There's a connection issue. Try restarting the FeelingWise app.</p>
      </div>
    `;
  }
}
```

---

### Phase 5: First-Run Experience

#### 5.1 Create Setup Wizard Component

**File:** `src/components/SetupWizard/FirstRunWizard.tsx`

```tsx
import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';

type WizardStep =
  | 'checking'
  | 'install-ollama'
  | 'downloading-model'
  | 'install-extension'
  | 'complete';

export const FirstRunWizard: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [step, setStep] = useState<WizardStep>('checking');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    runSetupChecks();
  }, []);

  const runSetupChecks = async () => {
    try {
      // Step 1: Check system
      setStep('checking');

      // Detect system language
      const systemLang = navigator.language.split('-')[0];
      await invoke('set_language', { lang: systemLang });

      // Check Ollama installation
      const ollamaInstalled = await invoke<boolean>('check_ollama_installed');

      if (!ollamaInstalled) {
        setStep('install-ollama');
        return;
      }

      // Check if model is available
      const models = await invoke<string[]>('list_ollama_models');
      if (models.length === 0) {
        setStep('downloading-model');
        await downloadModel();
        return;
      }

      // All good, show extension step
      setStep('install-extension');

    } catch (e) {
      setError(String(e));
    }
  };

  const downloadModel = async () => {
    try {
      // Listen for progress events
      await invoke('pull_model_with_progress', {
        modelName: 'phi3:mini'
      });
      setStep('install-extension');
    } catch (e) {
      setError('Failed to download AI model. Please check your internet connection.');
    }
  };

  const renderStep = () => {
    switch (step) {
      case 'checking':
        return (
          <div className="wizard-step">
            <div className="spinner" />
            <h2>Setting things up...</h2>
            <p>This only takes a moment.</p>
          </div>
        );

      case 'install-ollama':
        return (
          <div className="wizard-step">
            <h2>One more thing needed</h2>
            <p>FeelingWise needs a small helper program to work.</p>
            <button
              className="primary-button"
              onClick={() => invoke('open_ollama_download')}
            >
              Download & Install
            </button>
            <p className="hint">After installing, click "Continue"</p>
            <button
              className="secondary-button"
              onClick={runSetupChecks}
            >
              Continue
            </button>
          </div>
        );

      case 'downloading-model':
        return (
          <div className="wizard-step">
            <h2>Preparing AI Protection</h2>
            <p>Downloading the content analysis engine...</p>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <p className="hint">This is a one-time download (~2GB)</p>
          </div>
        );

      case 'install-extension':
        return (
          <div className="wizard-step">
            <h2>Almost Done!</h2>
            <p>Install the browser extension to protect your family online.</p>
            <button
              className="primary-button"
              onClick={() => invoke('open_extension_store')}
            >
              Add to Chrome
            </button>
            <button
              className="secondary-button"
              onClick={() => setStep('complete')}
            >
              I've installed it
            </button>
          </div>
        );

      case 'complete':
        return (
          <div className="wizard-step success">
            <div className="checkmark">✓</div>
            <h2>You're All Set!</h2>
            <p>FeelingWise is now protecting your family's online experience.</p>
            <button
              className="primary-button"
              onClick={onComplete}
            >
              Get Started
            </button>
          </div>
        );
    }
  };

  return (
    <div className="first-run-wizard">
      <div className="wizard-header">
        <img src="/logo.png" alt="FeelingWise" />
      </div>
      {error ? (
        <div className="wizard-error">
          <p>{error}</p>
          <button onClick={runSetupChecks}>Try Again</button>
        </div>
      ) : (
        renderStep()
      )}
    </div>
  );
};
```

#### 5.2 Add Helper Commands

**File:** `src-tauri/src/lib.rs`

```rust
#[tauri::command]
async fn open_ollama_download() -> Result<(), String> {
    open::that("https://ollama.ai/download")
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn open_extension_store() -> Result<(), String> {
    // Chrome Web Store URL for extension
    open::that("https://chrome.google.com/webstore/detail/feelingwise/...")
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn set_language(lang: String, state: State<'_, AppState>) -> Result<(), String> {
    // Save to app config
    state.config.lock().await.language = lang;
    Ok(())
}

#[tauri::command]
async fn get_setup_status() -> Result<SetupStatus, String> {
    // Returns combined status for wizard
    Ok(SetupStatus {
        ollama_installed: check_ollama_installed().await?,
        ollama_running: get_ollama_status().await?.running,
        model_available: !list_ollama_models().await?.is_empty(),
        first_run_complete: /* read from config */,
    })
}
```

---

### Phase 6: Health Monitoring & Auto-Recovery

#### 6.1 Implement Health Monitor

**File:** `src-tauri/src/supervisor.rs`

```rust
impl OllamaSupervisor {
    pub fn start_health_monitor(self: Arc<Self>) {
        tokio::spawn(async move {
            loop {
                tokio::time::sleep(Duration::from_secs(5)).await;

                let healthy = self.check_health().await;

                if !healthy {
                    let restart_count = self.restart_count.load(Ordering::SeqCst);

                    if restart_count < self.config.max_restart_attempts {
                        log::warn!("Ollama unhealthy, attempting restart ({}/{})",
                            restart_count + 1, self.config.max_restart_attempts);

                        if let Err(e) = self.restart().await {
                            log::error!("Restart failed: {}", e);
                        }

                        self.restart_count.fetch_add(1, Ordering::SeqCst);
                    } else {
                        log::error!("Max restart attempts reached");
                        // Notify user via system tray
                        self.notify_user_restart_failed().await;
                    }
                } else {
                    // Reset restart count on successful health check
                    self.restart_count.store(0, Ordering::SeqCst);
                }
            }
        });
    }

    async fn check_health(&self) -> bool {
        match self.client
            .get("http://127.0.0.1:11434/api/tags")
            .timeout(Duration::from_secs(2))
            .send()
            .await
        {
            Ok(response) => response.status().is_success(),
            Err(_) => false,
        }
    }

    async fn restart(&self) -> Result<(), String> {
        // Kill existing process
        self.stop().await?;

        // Wait a moment
        tokio::time::sleep(Duration::from_secs(1)).await;

        // Start fresh
        self.start_with_cors().await
    }
}
```

#### 6.2 Model Availability Check

**Add to supervisor:**

```rust
#[tauri::command]
async fn ensure_model_available(
    model_name: String,
    state: State<'_, AppState>
) -> Result<bool, String> {
    let models = state.ollama.list_models().await?;

    if models.contains(&model_name) {
        return Ok(true);
    }

    // Model not available - this will be handled by frontend
    // to show download UI
    Ok(false)
}
```

---

### Phase 7: Settings Persistence

#### 7.1 Create Settings Module

**File:** `src-tauri/src/settings.rs`

```rust
use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppSettings {
    pub language: String,
    pub start_on_login: bool,
    pub minimize_to_tray: bool,
    pub first_run_complete: bool,
    pub selected_model: String,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            language: "en".to_string(),
            start_on_login: true,
            minimize_to_tray: true,
            first_run_complete: false,
            selected_model: "phi3:mini".to_string(),
        }
    }
}

impl AppSettings {
    pub fn load() -> Self {
        let path = Self::settings_path();
        if path.exists() {
            std::fs::read_to_string(&path)
                .ok()
                .and_then(|s| serde_json::from_str(&s).ok())
                .unwrap_or_default()
        } else {
            Self::default()
        }
    }

    pub fn save(&self) -> Result<(), String> {
        let path = Self::settings_path();
        let json = serde_json::to_string_pretty(self)
            .map_err(|e| e.to_string())?;
        std::fs::write(path, json)
            .map_err(|e| e.to_string())
    }

    fn settings_path() -> PathBuf {
        dirs::config_dir()
            .unwrap_or_else(|| PathBuf::from("."))
            .join("FeelingWise")
            .join("settings.json")
    }
}
```

---

## File Change Summary

### New Files to Create:
1. `src-tauri/src/supervisor.rs` - Ollama lifecycle management
2. `src-tauri/src/extension_bridge.rs` - HTTP server for extension communication
3. `src-tauri/src/settings.rs` - Persistent settings
4. `src/components/SetupWizard/FirstRunWizard.tsx` - User-friendly setup
5. `src-tauri/icons/tray-icon.png` - System tray icon

### Files to Modify:
1. `src-tauri/src/main.rs` - Add system tray, auto-start
2. `src-tauri/src/lib.rs` - New commands, tray setup
3. `src-tauri/src/ollama.rs` - OLLAMA_ORIGINS, better path detection
4. `src-tauri/Cargo.toml` - Add dependencies (winreg, axum)
5. `src-tauri/tauri.conf.json` - Tray icon config
6. `browser-extension/background.js` - Tauri bridge communication
7. `browser-extension/popup/popup.js` - Friendly status messages
8. `browser-extension/popup/popup.html` - Status UI
9. `browser-extension/manifest.json` - Add bridge URL permission
10. `src/App.tsx` - Integrate FirstRunWizard

---

## Implementation Order

```
Phase 1: Ollama Supervisor (Backend Foundation)
    ├─ 1.1 Create supervisor.rs
    ├─ 1.2 Add OLLAMA_ORIGINS to ollama.rs
    └─ 1.3 Windows process hiding

Phase 2: System Tray
    ├─ 2.1 Add Cargo dependencies
    ├─ 2.2 Update tauri.conf.json
    ├─ 2.3 Implement tray in lib.rs
    └─ 2.4 Close-to-tray behavior

Phase 3: Auto-Start
    ├─ 3.1 Add winreg commands
    └─ 3.2 Settings UI integration

Phase 4: Extension Bridge
    ├─ 4.1 Create HTTP bridge server
    ├─ 4.2 Update background.js
    └─ 4.3 Update popup UI

Phase 5: First-Run Wizard
    ├─ 5.1 Create wizard component
    ├─ 5.2 Add helper commands
    └─ 5.3 Integrate with App.tsx

Phase 6: Health Monitoring
    ├─ 6.1 Health monitor loop
    └─ 6.2 Auto-restart logic

Phase 7: Settings & Polish
    ├─ 7.1 Settings persistence
    └─ 7.2 Final integration
```

---

## Success Criteria

After implementation, a parent should be able to:

1. **Install** - Double-click installer, click "Next" a few times
2. **First Launch** - See friendly wizard, click one button to download AI model
3. **Extension** - Click link to install extension, done
4. **Daily Use** - App runs invisibly in system tray
5. **Problems** - App auto-recovers, parent sees only "Protected" or "Please restart app"

**Never see:**
- Port numbers (11434, 19542)
- Command prompts
- "OLLAMA_ORIGINS" or any environment variables
- "localhost" or "127.0.0.1"
- Stack traces or technical errors
- "API" or "endpoint" terminology
