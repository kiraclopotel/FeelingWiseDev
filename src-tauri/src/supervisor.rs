//! Ollama Supervisor Module
//!
//! Manages the Ollama process lifecycle with automatic health monitoring,
//! crash recovery, and user-friendly status reporting.

use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::process::{Child, Command, Stdio};
use std::sync::atomic::{AtomicBool, AtomicU32, Ordering};
use std::sync::Arc;
use tokio::sync::Mutex;
use tokio::time::{sleep, Duration};

#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;

#[cfg(target_os = "windows")]
const CREATE_NO_WINDOW: u32 = 0x08000000;

const OLLAMA_API_BASE: &str = "http://127.0.0.1:11434";
const HEALTH_CHECK_INTERVAL: Duration = Duration::from_secs(5);
const MAX_RESTART_ATTEMPTS: u32 = 3;
const STARTUP_TIMEOUT: Duration = Duration::from_secs(30);

/// User-friendly status that hides technical details
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "status")]
pub enum FriendlyStatus {
    #[serde(rename = "starting")]
    Starting { message: String },
    #[serde(rename = "running")]
    Running { message: String },
    #[serde(rename = "not_installed")]
    NotInstalled { message: String, download_url: String },
    #[serde(rename = "model_missing")]
    ModelMissing { message: String },
    #[serde(rename = "error")]
    Error { message: String },
    #[serde(rename = "stopped")]
    Stopped { message: String },
}

impl FriendlyStatus {
    pub fn starting() -> Self {
        Self::Starting {
            message: "Starting up...".to_string(),
        }
    }

    pub fn running() -> Self {
        Self::Running {
            message: "Protected".to_string(),
        }
    }

    pub fn not_installed() -> Self {
        Self::NotInstalled {
            message: "Setup required".to_string(),
            download_url: "https://ollama.ai/download".to_string(),
        }
    }

    pub fn model_missing() -> Self {
        Self::ModelMissing {
            message: "Downloading AI model...".to_string(),
        }
    }

    pub fn error(user_message: &str) -> Self {
        Self::Error {
            message: user_message.to_string(),
        }
    }

    pub fn stopped() -> Self {
        Self::Stopped {
            message: "Protection paused".to_string(),
        }
    }
}

/// Internal supervisor state
#[derive(Debug, Clone, PartialEq)]
pub enum SupervisorState {
    Starting,
    Running,
    Unhealthy,
    Stopped,
    OllamaNotInstalled,
    ModelMissing,
}

/// Configuration for the supervisor
#[derive(Clone)]
pub struct SupervisorConfig {
    pub max_restart_attempts: u32,
    pub health_check_interval: Duration,
    pub startup_timeout: Duration,
    pub default_model: String,
}

impl Default for SupervisorConfig {
    fn default() -> Self {
        Self {
            max_restart_attempts: MAX_RESTART_ATTEMPTS,
            health_check_interval: HEALTH_CHECK_INTERVAL,
            startup_timeout: STARTUP_TIMEOUT,
            default_model: "phi3:mini".to_string(),
        }
    }
}

/// Ollama Supervisor - manages Ollama lifecycle with auto-recovery
pub struct OllamaSupervisor {
    client: reqwest::Client,
    process: Arc<Mutex<Option<Child>>>,
    state: Arc<Mutex<SupervisorState>>,
    restart_count: AtomicU32,
    is_monitoring: AtomicBool,
    config: SupervisorConfig,
}

impl OllamaSupervisor {
    pub fn new(config: SupervisorConfig) -> Self {
        Self {
            client: reqwest::Client::builder()
                .timeout(Duration::from_secs(5))
                .build()
                .unwrap_or_default(),
            process: Arc::new(Mutex::new(None)),
            state: Arc::new(Mutex::new(SupervisorState::Stopped)),
            restart_count: AtomicU32::new(0),
            is_monitoring: AtomicBool::new(false),
            config,
        }
    }

    /// Detect if Ollama is installed and return its path
    pub fn find_ollama_binary() -> Option<PathBuf> {
        #[cfg(target_os = "windows")]
        {
            // Check common Windows installation paths
            let possible_paths = [
                // User-specific installation (most common)
                dirs::data_local_dir()
                    .map(|p| p.join("Programs").join("Ollama").join("ollama.exe")),
                // System-wide installation
                Some(PathBuf::from(r"C:\Program Files\Ollama\ollama.exe")),
                // Alternative paths
                dirs::home_dir().map(|p| p.join("AppData").join("Local").join("Programs").join("Ollama").join("ollama.exe")),
            ];

            for path in possible_paths.iter().flatten() {
                if path.exists() {
                    log::info!("Found Ollama at: {:?}", path);
                    return Some(path.clone());
                }
            }

            // Check PATH as fallback
            if let Ok(output) = Command::new("where")
                .arg("ollama")
                .output()
            {
                if output.status.success() {
                    let path_str = String::from_utf8_lossy(&output.stdout);
                    if let Some(first_line) = path_str.lines().next() {
                        let path = PathBuf::from(first_line.trim());
                        if path.exists() {
                            log::info!("Found Ollama in PATH: {:?}", path);
                            return Some(path);
                        }
                    }
                }
            }

            // Try to find via registry
            if let Some(path) = Self::find_ollama_from_registry() {
                return Some(path);
            }
        }

        #[cfg(not(target_os = "windows"))]
        {
            // Check common Unix paths
            let possible_paths = [
                "/usr/local/bin/ollama",
                "/usr/bin/ollama",
                "/opt/ollama/ollama",
            ];

            for path_str in &possible_paths {
                let path = PathBuf::from(path_str);
                if path.exists() {
                    return Some(path);
                }
            }

            // Check PATH
            if let Ok(output) = Command::new("which")
                .arg("ollama")
                .output()
            {
                if output.status.success() {
                    let path_str = String::from_utf8_lossy(&output.stdout);
                    let path = PathBuf::from(path_str.trim());
                    if path.exists() {
                        return Some(path);
                    }
                }
            }
        }

        log::warn!("Ollama binary not found");
        None
    }

    /// Try to find Ollama from Windows registry
    #[cfg(target_os = "windows")]
    fn find_ollama_from_registry() -> Option<PathBuf> {
        use winreg::enums::*;
        use winreg::RegKey;

        // Try HKLM
        if let Ok(hklm) = RegKey::predef(HKEY_LOCAL_MACHINE).open_subkey(r"SOFTWARE\Ollama") {
            if let Ok(path) = hklm.get_value::<String, _>("InstallPath") {
                let exe_path = PathBuf::from(&path).join("ollama.exe");
                if exe_path.exists() {
                    return Some(exe_path);
                }
            }
        }

        // Try HKCU
        if let Ok(hkcu) = RegKey::predef(HKEY_CURRENT_USER).open_subkey(r"SOFTWARE\Ollama") {
            if let Ok(path) = hkcu.get_value::<String, _>("InstallPath") {
                let exe_path = PathBuf::from(&path).join("ollama.exe");
                if exe_path.exists() {
                    return Some(exe_path);
                }
            }
        }

        None
    }

    #[cfg(not(target_os = "windows"))]
    fn find_ollama_from_registry() -> Option<PathBuf> {
        None
    }

    /// Check if Ollama is installed
    pub fn is_installed() -> bool {
        Self::find_ollama_binary().is_some()
    }

    /// Check if Ollama API is healthy
    pub async fn is_healthy(&self) -> bool {
        match self
            .client
            .get(format!("{}/api/tags", OLLAMA_API_BASE))
            .timeout(Duration::from_secs(2))
            .send()
            .await
        {
            Ok(response) => response.status().is_success(),
            Err(_) => false,
        }
    }

    /// Start Ollama with CORS enabled for browser extension
    pub async fn start(&self) -> Result<(), String> {
        // Check if already running
        if self.is_healthy().await {
            log::info!("Ollama is already running");
            *self.state.lock().await = SupervisorState::Running;
            return Ok(());
        }

        // Find Ollama binary
        let ollama_path = Self::find_ollama_binary()
            .ok_or_else(|| "Ollama is not installed".to_string())?;

        log::info!("Starting Ollama from: {:?}", ollama_path);
        *self.state.lock().await = SupervisorState::Starting;

        // Build command with CORS enabled
        let mut cmd = Command::new(&ollama_path);
        cmd.arg("serve")
            .env("OLLAMA_ORIGINS", "*") // Allow browser extension CORS
            .env("OLLAMA_HOST", "127.0.0.1:11434")
            .stdout(Stdio::null())
            .stderr(Stdio::null());

        // Hide console window on Windows
        #[cfg(target_os = "windows")]
        cmd.creation_flags(CREATE_NO_WINDOW);

        let child = cmd
            .spawn()
            .map_err(|e| format!("Failed to start Ollama: {}", e))?;

        *self.process.lock().await = Some(child);

        // Wait for Ollama to be ready
        let timeout_ms = self.config.startup_timeout.as_millis() as u64;
        let check_interval_ms = 500u64;
        let max_attempts = timeout_ms / check_interval_ms;

        for i in 0..max_attempts {
            sleep(Duration::from_millis(check_interval_ms)).await;
            if self.is_healthy().await {
                log::info!(
                    "Ollama started successfully after {}ms",
                    (i + 1) * check_interval_ms
                );
                *self.state.lock().await = SupervisorState::Running;
                self.restart_count.store(0, Ordering::SeqCst);
                return Ok(());
            }
        }

        *self.state.lock().await = SupervisorState::Unhealthy;
        Err(format!(
            "Ollama failed to start within {} seconds",
            self.config.startup_timeout.as_secs()
        ))
    }

    /// Stop Ollama process
    pub async fn stop(&self) -> Result<(), String> {
        let mut process = self.process.lock().await;
        if let Some(mut child) = process.take() {
            child
                .kill()
                .map_err(|e| format!("Failed to stop Ollama: {}", e))?;
            log::info!("Ollama process stopped");
        }
        *self.state.lock().await = SupervisorState::Stopped;
        Ok(())
    }

    /// Restart Ollama
    pub async fn restart(&self) -> Result<(), String> {
        log::info!("Restarting Ollama...");
        self.stop().await?;
        sleep(Duration::from_secs(1)).await;
        self.start().await
    }

    /// Start the health monitoring loop
    pub fn start_health_monitor(self: Arc<Self>) {
        if self.is_monitoring.swap(true, Ordering::SeqCst) {
            log::info!("Health monitor already running");
            return;
        }

        let supervisor = self.clone();
        tokio::spawn(async move {
            log::info!("Starting Ollama health monitor");

            loop {
                sleep(supervisor.config.health_check_interval).await;

                // Skip if we're intentionally stopped
                let state = supervisor.state.lock().await.clone();
                if state == SupervisorState::Stopped || state == SupervisorState::OllamaNotInstalled
                {
                    continue;
                }

                let healthy = supervisor.is_healthy().await;

                if !healthy {
                    let restart_count = supervisor.restart_count.load(Ordering::SeqCst);

                    if restart_count < supervisor.config.max_restart_attempts {
                        log::warn!(
                            "Ollama unhealthy, attempting restart ({}/{})",
                            restart_count + 1,
                            supervisor.config.max_restart_attempts
                        );

                        *supervisor.state.lock().await = SupervisorState::Unhealthy;

                        if let Err(e) = supervisor.restart().await {
                            log::error!("Restart failed: {}", e);
                        }

                        supervisor.restart_count.fetch_add(1, Ordering::SeqCst);
                    } else {
                        log::error!("Max restart attempts reached, giving up");
                        // Don't spam restarts - wait for user intervention
                    }
                } else {
                    // Reset restart count on successful health check
                    if supervisor.restart_count.load(Ordering::SeqCst) > 0 {
                        log::info!("Ollama recovered, resetting restart count");
                        supervisor.restart_count.store(0, Ordering::SeqCst);
                    }
                    *supervisor.state.lock().await = SupervisorState::Running;
                }
            }
        });
    }

    /// Get user-friendly status (hides all technical details)
    pub async fn get_friendly_status(&self) -> FriendlyStatus {
        // Check if installed first
        if !Self::is_installed() {
            return FriendlyStatus::not_installed();
        }

        let state = self.state.lock().await.clone();

        match state {
            SupervisorState::Starting => FriendlyStatus::starting(),
            SupervisorState::Running => {
                // Verify it's actually healthy
                if self.is_healthy().await {
                    // Check if model is available
                    match self.check_model_available().await {
                        Ok(true) => FriendlyStatus::running(),
                        Ok(false) => FriendlyStatus::model_missing(),
                        Err(_) => FriendlyStatus::running(), // Assume it's fine if we can't check
                    }
                } else {
                    FriendlyStatus::error("Connection issue. Restarting...")
                }
            }
            SupervisorState::Unhealthy => {
                let restart_count = self.restart_count.load(Ordering::SeqCst);
                if restart_count >= self.config.max_restart_attempts {
                    FriendlyStatus::error("Please restart the app")
                } else {
                    FriendlyStatus::error("Reconnecting...")
                }
            }
            SupervisorState::Stopped => FriendlyStatus::stopped(),
            SupervisorState::OllamaNotInstalled => FriendlyStatus::not_installed(),
            SupervisorState::ModelMissing => FriendlyStatus::model_missing(),
        }
    }

    /// Check if the default model is available
    async fn check_model_available(&self) -> Result<bool, String> {
        let response = self
            .client
            .get(format!("{}/api/tags", OLLAMA_API_BASE))
            .send()
            .await
            .map_err(|e| e.to_string())?;

        #[derive(Deserialize)]
        struct TagsResponse {
            models: Option<Vec<ModelInfo>>,
        }

        #[derive(Deserialize)]
        struct ModelInfo {
            name: String,
        }

        let tags: TagsResponse = response.json().await.map_err(|e| e.to_string())?;

        let models = tags.models.unwrap_or_default();
        let has_model = models
            .iter()
            .any(|m| m.name.starts_with(&self.config.default_model.replace(":mini", "")));

        Ok(has_model || !models.is_empty())
    }

    /// Get the current internal state
    pub async fn get_state(&self) -> SupervisorState {
        self.state.lock().await.clone()
    }

    /// Reset restart counter (call after user manually restarts)
    pub fn reset_restart_count(&self) {
        self.restart_count.store(0, Ordering::SeqCst);
    }
}

impl Default for OllamaSupervisor {
    fn default() -> Self {
        Self::new(SupervisorConfig::default())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_friendly_status_serialization() {
        let status = FriendlyStatus::running();
        let json = serde_json::to_string(&status).unwrap();
        assert!(json.contains("running"));
        assert!(json.contains("Protected"));
    }

    #[test]
    fn test_not_installed_status() {
        let status = FriendlyStatus::not_installed();
        let json = serde_json::to_string(&status).unwrap();
        assert!(json.contains("not_installed"));
        assert!(json.contains("ollama.ai"));
    }
}
