//! Settings Module
//!
//! Persistent settings storage for FeelingWise application.

use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

/// Application settings that persist between sessions
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppSettings {
    /// User interface language (e.g., "en", "ro")
    pub language: String,

    /// Start app on Windows login
    pub start_on_login: bool,

    /// Minimize to system tray when closing window
    pub minimize_to_tray: bool,

    /// Has the user completed first-run setup
    pub first_run_complete: bool,

    /// Selected AI model for neutralization
    pub selected_model: String,

    /// User's persona setting for explanations
    pub persona: String,
}

impl Default for AppSettings {
    fn default() -> Self {
        // Try to detect system language
        let system_lang = Self::detect_system_language();

        Self {
            language: system_lang,
            start_on_login: true, // Default to enabled for parent convenience
            minimize_to_tray: true, // Run silently in background
            first_run_complete: false,
            selected_model: "phi3:mini".to_string(),
            persona: "adult".to_string(),
        }
    }
}

impl AppSettings {
    /// Load settings from disk, or create defaults if not found
    pub fn load() -> Self {
        let path = Self::settings_path();

        if path.exists() {
            match fs::read_to_string(&path) {
                Ok(content) => match serde_json::from_str(&content) {
                    Ok(settings) => {
                        log::info!("Loaded settings from {:?}", path);
                        return settings;
                    }
                    Err(e) => {
                        log::warn!("Failed to parse settings: {}, using defaults", e);
                    }
                },
                Err(e) => {
                    log::warn!("Failed to read settings file: {}, using defaults", e);
                }
            }
        }

        let defaults = Self::default();
        // Try to save defaults
        let _ = defaults.save();
        defaults
    }

    /// Save settings to disk
    pub fn save(&self) -> Result<(), String> {
        let path = Self::settings_path();

        // Ensure parent directory exists
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent).map_err(|e| format!("Failed to create settings dir: {}", e))?;
        }

        let json =
            serde_json::to_string_pretty(self).map_err(|e| format!("Failed to serialize settings: {}", e))?;

        fs::write(&path, json).map_err(|e| format!("Failed to write settings: {}", e))?;

        log::info!("Settings saved to {:?}", path);
        Ok(())
    }

    /// Get the path to the settings file
    fn settings_path() -> PathBuf {
        let config_dir = dirs::config_dir().unwrap_or_else(|| PathBuf::from("."));

        config_dir.join("FeelingWise").join("settings.json")
    }

    /// Detect system language from environment
    fn detect_system_language() -> String {
        // Try various environment variables
        for var in &["LANG", "LANGUAGE", "LC_ALL", "LC_MESSAGES"] {
            if let Ok(lang) = std::env::var(var) {
                // Extract just the language code (e.g., "en" from "en_US.UTF-8")
                let code = lang.split('_').next().unwrap_or("en");
                let code = code.split('.').next().unwrap_or("en");
                if !code.is_empty() && code != "C" && code != "POSIX" {
                    return code.to_lowercase();
                }
            }
        }

        // Default to English
        "en".to_string()
    }

    /// Update a single setting and save
    pub fn update<F>(&mut self, updater: F) -> Result<(), String>
    where
        F: FnOnce(&mut Self),
    {
        updater(self);
        self.save()
    }
}

/// Manage Windows auto-start via registry
#[cfg(target_os = "windows")]
pub mod autostart {
    use winreg::enums::*;
    use winreg::RegKey;

    const APP_NAME: &str = "FeelingWise";
    const RUN_KEY: &str = r"Software\Microsoft\Windows\CurrentVersion\Run";

    /// Enable auto-start on Windows login
    pub fn enable() -> Result<(), String> {
        let exe_path = std::env::current_exe().map_err(|e| format!("Failed to get exe path: {}", e))?;

        let hkcu = RegKey::predef(HKEY_CURRENT_USER);
        let key = hkcu
            .open_subkey_with_flags(RUN_KEY, KEY_WRITE)
            .map_err(|e| format!("Failed to open registry key: {}", e))?;

        // Add --minimized flag so it starts in tray
        let command = format!("\"{}\" --minimized", exe_path.display());

        key.set_value(APP_NAME, &command)
            .map_err(|e| format!("Failed to set registry value: {}", e))?;

        log::info!("Auto-start enabled");
        Ok(())
    }

    /// Disable auto-start on Windows login
    pub fn disable() -> Result<(), String> {
        let hkcu = RegKey::predef(HKEY_CURRENT_USER);

        if let Ok(key) = hkcu.open_subkey_with_flags(RUN_KEY, KEY_WRITE) {
            // Ignore error if value doesn't exist
            let _ = key.delete_value(APP_NAME);
        }

        log::info!("Auto-start disabled");
        Ok(())
    }

    /// Check if auto-start is currently enabled
    pub fn is_enabled() -> bool {
        let hkcu = RegKey::predef(HKEY_CURRENT_USER);

        if let Ok(key) = hkcu.open_subkey(RUN_KEY) {
            return key.get_value::<String, _>(APP_NAME).is_ok();
        }

        false
    }

    /// Set auto-start based on boolean
    pub fn set_enabled(enabled: bool) -> Result<(), String> {
        if enabled {
            enable()
        } else {
            disable()
        }
    }
}

/// Stub for non-Windows platforms
#[cfg(not(target_os = "windows"))]
pub mod autostart {
    pub fn enable() -> Result<(), String> {
        log::info!("Auto-start not implemented on this platform");
        Ok(())
    }

    pub fn disable() -> Result<(), String> {
        Ok(())
    }

    pub fn is_enabled() -> bool {
        false
    }

    pub fn set_enabled(_enabled: bool) -> Result<(), String> {
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_default_settings() {
        let settings = AppSettings::default();
        assert!(settings.start_on_login);
        assert!(settings.minimize_to_tray);
        assert!(!settings.first_run_complete);
    }

    #[test]
    fn test_settings_serialization() {
        let settings = AppSettings::default();
        let json = serde_json::to_string(&settings).unwrap();
        let parsed: AppSettings = serde_json::from_str(&json).unwrap();
        assert_eq!(settings.language, parsed.language);
    }
}
