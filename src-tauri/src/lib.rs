mod cache;
mod extension_bridge;
mod hardware;
mod ollama;
mod settings;
mod supervisor;

use cache::{CacheStats, CachedNeutralization, NeutralizationCache};
use hardware::SystemInfo;
use ollama::{OllamaManager, OllamaStatus, RecommendedModel};
use settings::{autostart, AppSettings};
use supervisor::{FriendlyStatus, OllamaSupervisor, SupervisorConfig};

use std::sync::Arc;
use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager, State, WindowEvent,
};
use tokio::sync::Mutex;

// Application state
pub struct AppState {
    pub ollama: Arc<Mutex<OllamaManager>>,
    pub cache: Arc<Mutex<NeutralizationCache>>,
    pub supervisor: Arc<Mutex<OllamaSupervisor>>,
    pub settings: Arc<Mutex<AppSettings>>,
}

// ============================================================================
// HARDWARE DETECTION COMMANDS
// ============================================================================

#[tauri::command]
async fn get_system_info() -> Result<SystemInfo, String> {
    Ok(SystemInfo::detect())
}

#[tauri::command]
async fn check_system_requirements() -> Result<SystemInfo, String> {
    hardware::check_requirements()
}

// ============================================================================
// OLLAMA MANAGEMENT COMMANDS
// ============================================================================

#[tauri::command]
async fn check_ollama_installed() -> bool {
    OllamaSupervisor::is_installed()
}

#[tauri::command]
async fn get_ollama_status(state: State<'_, AppState>) -> Result<OllamaStatus, String> {
    let ollama = state.ollama.lock().await;
    Ok(ollama.get_status().await)
}

#[tauri::command]
async fn get_friendly_status(state: State<'_, AppState>) -> Result<FriendlyStatus, String> {
    let supervisor = state.supervisor.lock().await;
    Ok(supervisor.get_friendly_status().await)
}

#[tauri::command]
async fn start_ollama(state: State<'_, AppState>) -> Result<(), String> {
    let supervisor = state.supervisor.lock().await;
    supervisor.start().await
}

#[tauri::command]
async fn stop_ollama(state: State<'_, AppState>) -> Result<(), String> {
    let supervisor = state.supervisor.lock().await;
    supervisor.stop().await
}

#[tauri::command]
async fn restart_ollama(state: State<'_, AppState>) -> Result<(), String> {
    let supervisor = state.supervisor.lock().await;
    supervisor.reset_restart_count();
    supervisor.restart().await
}

#[tauri::command]
async fn list_ollama_models(state: State<'_, AppState>) -> Result<Vec<String>, String> {
    let ollama = state.ollama.lock().await;
    let models = ollama.list_models().await?;
    Ok(models.iter().map(|m| m.name.clone()).collect())
}

#[tauri::command]
fn get_recommended_models() -> Vec<RecommendedModel> {
    ollama::get_recommended_models()
}

#[tauri::command]
async fn pull_model(state: State<'_, AppState>, model_name: String) -> Result<(), String> {
    let ollama = state.ollama.lock().await;
    ollama
        .pull_model(&model_name, |progress| {
            log::info!("Pull progress: {:?}", progress);
        })
        .await
}

// ============================================================================
// SETTINGS COMMANDS
// ============================================================================

#[tauri::command]
async fn get_settings(state: State<'_, AppState>) -> Result<AppSettings, String> {
    let settings = state.settings.lock().await;
    Ok(settings.clone())
}

#[tauri::command]
async fn save_settings(state: State<'_, AppState>, new_settings: AppSettings) -> Result<(), String> {
    let mut settings = state.settings.lock().await;

    // Handle auto-start changes
    if settings.start_on_login != new_settings.start_on_login {
        autostart::set_enabled(new_settings.start_on_login)?;
    }

    *settings = new_settings;
    settings.save()
}

#[tauri::command]
async fn set_language(state: State<'_, AppState>, lang: String) -> Result<(), String> {
    let mut settings = state.settings.lock().await;
    settings.language = lang;
    settings.save()
}

#[tauri::command]
async fn complete_first_run(state: State<'_, AppState>) -> Result<(), String> {
    let mut settings = state.settings.lock().await;
    settings.first_run_complete = true;
    settings.save()
}

#[tauri::command]
fn get_autostart_enabled() -> bool {
    autostart::is_enabled()
}

#[tauri::command]
fn set_autostart_enabled(enabled: bool) -> Result<(), String> {
    autostart::set_enabled(enabled)
}

// ============================================================================
// HELPER COMMANDS
// ============================================================================

#[tauri::command]
async fn open_ollama_download() -> Result<(), String> {
    open::that("https://ollama.ai/download").map_err(|e| e.to_string())
}

#[tauri::command]
async fn open_extension_store() -> Result<(), String> {
    // Chrome Web Store - update with actual extension ID when published
    open::that("https://chrome.google.com/webstore").map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_setup_status(state: State<'_, AppState>) -> Result<SetupStatus, String> {
    let settings = state.settings.lock().await;
    let supervisor = state.supervisor.lock().await;
    let is_healthy = supervisor.is_healthy().await;

    let models = if is_healthy {
        let ollama = state.ollama.lock().await;
        ollama
            .list_models()
            .await
            .map(|m| m.iter().map(|info| info.name.clone()).collect())
            .unwrap_or_default()
    } else {
        vec![]
    };

    Ok(SetupStatus {
        ollama_installed: OllamaSupervisor::is_installed(),
        ollama_running: is_healthy,
        model_available: !models.is_empty(),
        first_run_complete: settings.first_run_complete,
    })
}

#[derive(serde::Serialize)]
pub struct SetupStatus {
    pub ollama_installed: bool,
    pub ollama_running: bool,
    pub model_available: bool,
    pub first_run_complete: bool,
}

// ============================================================================
// NEUTRALIZATION COMMANDS
// ============================================================================

/// System prompt for content neutralization (from MASTER_BLUEPRINT)
const NEUTRALIZATION_PROMPT: &str = r#"You are a content neutralization system. Your task is to transform emotionally manipulative social media text into neutral, factual language while preserving ALL original meaning and claims.

## RULES (MUST FOLLOW):

1. PRESERVE the author's viewpoint, concern, topic, and all factual claims
2. REMOVE only manipulation techniques:
   - ALL CAPS → normal case
   - Excessive punctuation (!!!) → single punctuation
   - Urgency language → factual timeline if applicable
   - Fear appeals → neutral concern statement
   - Ad hominem attacks → position-focused language
   - Absolute language (everyone, always, never) → proportional (some, often, rarely)
   - Alarm emojis (🚨🔥⚠️) → removed

3. DO NOT:
   - Add information not in the original
   - Judge whether claims are true or false
   - Use loaded verbs (claimed, alleged, admitted, revealed)
   - Add warnings, disclaimers, or editorial comments
   - Change the meaning or direction of the opinion

4. OUTPUT FORMAT:
   Return JSON with the following structure:
   {
     "neutralized": "The neutralized version of the text",
     "techniques": ["List", "of", "detected", "techniques"],
     "severity": 0-10
   }

Now neutralize this text:
"#;

#[tauri::command]
async fn neutralize_content(
    state: State<'_, AppState>,
    content: String,
    model: Option<String>,
) -> Result<CachedNeutralization, String> {
    // Check cache first
    {
        let cache = state.cache.lock().await;
        if let Some(cached) = cache.get(&content) {
            log::info!("Cache hit for content");
            return Ok(cached);
        }
    }

    // Not in cache, perform neutralization
    let ollama = state.ollama.lock().await;
    let model_name = model.unwrap_or_else(|| "phi3:mini".to_string());

    let prompt = format!("{}{}", NEUTRALIZATION_PROMPT, content);
    let response = ollama.generate(&model_name, &prompt).await?;

    // Parse the JSON response
    let parsed: serde_json::Value = serde_json::from_str(&response)
        .map_err(|e| format!("Failed to parse AI response: {}. Response: {}", e, response))?;

    let neutralized = parsed["neutralized"]
        .as_str()
        .ok_or("Missing 'neutralized' field in response")?
        .to_string();

    let techniques: Vec<String> = parsed["techniques"]
        .as_array()
        .map(|arr| {
            arr.iter()
                .filter_map(|v| v.as_str().map(String::from))
                .collect()
        })
        .unwrap_or_default();

    let severity = parsed["severity"].as_i64().unwrap_or(0) as i32;

    // Store in cache
    {
        let cache = state.cache.lock().await;
        cache.set(&content, &neutralized, &techniques, severity)?;
    }

    let content_hash = NeutralizationCache::hash_content(&content);

    Ok(CachedNeutralization {
        content_hash,
        original: content,
        neutralized,
        techniques,
        severity,
        created_at: std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map(|d| d.as_secs() as i64)
            .unwrap_or(0),
        hit_count: 0,
    })
}

// ============================================================================
// CACHE COMMANDS
// ============================================================================

#[tauri::command]
async fn get_cache_stats(state: State<'_, AppState>) -> Result<CacheStats, String> {
    let cache = state.cache.lock().await;
    Ok(cache.get_stats())
}

#[tauri::command]
async fn clear_cache(state: State<'_, AppState>) -> Result<(), String> {
    let cache = state.cache.lock().await;
    cache.clear()
}

// ============================================================================
// MAIN APPLICATION ENTRY
// ============================================================================

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Load settings
    let settings = AppSettings::load();

    // Initialize cache
    let cache = NeutralizationCache::new(None).expect("Failed to initialize cache");

    // Initialize Ollama manager
    let ollama = OllamaManager::new();

    // Initialize supervisor with config
    let supervisor = OllamaSupervisor::new(SupervisorConfig::default());

    // Create app state
    let app_state = AppState {
        ollama: Arc::new(Mutex::new(ollama)),
        cache: Arc::new(Mutex::new(cache)),
        supervisor: Arc::new(Mutex::new(supervisor)),
        settings: Arc::new(Mutex::new(settings)),
    };

    // Clone references for async tasks
    let supervisor_for_bridge = app_state.supervisor.clone();
    let settings_for_bridge = app_state.settings.clone();

    tauri::Builder::default()
        .manage(app_state)
        .plugin(tauri_plugin_shell::init())
        .setup(move |app| {
            // Initialize logging in debug mode
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            // Setup system tray
            setup_system_tray(app)?;

            // Get references from managed state
            let state: State<AppState> = app.state();
            let supervisor_clone = state.supervisor.clone();
            let settings_clone = state.settings.clone();

            // Start Ollama automatically on app launch
            let supervisor_for_start = supervisor_clone.clone();
            tauri::async_runtime::spawn(async move {
                let supervisor = supervisor_for_start.lock().await;
                if OllamaSupervisor::is_installed() {
                    log::info!("Auto-starting Ollama...");
                    if let Err(e) = supervisor.start().await {
                        log::error!("Failed to auto-start Ollama: {}", e);
                    }
                } else {
                    log::info!("Ollama not installed, skipping auto-start");
                }
            });

            // Start health monitoring
            let supervisor_for_monitor = supervisor_clone.clone();
            tauri::async_runtime::spawn(async move {
                // Small delay to let initial start complete
                tokio::time::sleep(tokio::time::Duration::from_secs(5)).await;
                let supervisor = supervisor_for_monitor.lock().await;
                let supervisor_arc = Arc::new(OllamaSupervisor::new(SupervisorConfig::default()));
                // Note: In production, we'd want to share the same supervisor instance
                // For now, start a new monitor
                drop(supervisor);
                OllamaSupervisor::start_health_monitor(supervisor_arc);
            });

            // Start extension bridge server
            let first_run_complete = Arc::new(Mutex::new(
                tauri::async_runtime::block_on(async {
                    settings_clone.lock().await.first_run_complete
                }),
            ));

            tauri::async_runtime::spawn(async move {
                extension_bridge::start_bridge_server(supervisor_for_bridge, first_run_complete).await;
            });

            // Handle window close - minimize to tray instead of quitting
            let main_window = app.get_webview_window("main").unwrap();
            let settings_for_close = state.settings.clone();

            main_window.on_window_event(move |event| {
                if let WindowEvent::CloseRequested { api, .. } = event {
                    let settings = tauri::async_runtime::block_on(async {
                        settings_for_close.lock().await.clone()
                    });

                    if settings.minimize_to_tray {
                        api.prevent_close();
                        // Hide the window instead of closing
                        // Note: window.hide() would need the window reference
                        log::info!("Window close requested, minimizing to tray");
                    }
                }
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Hardware
            get_system_info,
            check_system_requirements,
            // Ollama
            check_ollama_installed,
            get_ollama_status,
            get_friendly_status,
            start_ollama,
            stop_ollama,
            restart_ollama,
            list_ollama_models,
            get_recommended_models,
            pull_model,
            // Settings
            get_settings,
            save_settings,
            set_language,
            complete_first_run,
            get_autostart_enabled,
            set_autostart_enabled,
            // Helpers
            open_ollama_download,
            open_extension_store,
            get_setup_status,
            // Neutralization
            neutralize_content,
            // Cache
            get_cache_stats,
            clear_cache,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

/// Setup system tray with menu
fn setup_system_tray(app: &mut tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    let show_item = MenuItem::with_id(app, "show", "Show FeelingWise", true, None::<&str>)?;
    let separator1 = MenuItem::with_id(app, "sep1", "─────────────", false, None::<&str>)?;
    let status_item = MenuItem::with_id(app, "status", "● Protected", false, None::<&str>)?;
    let restart_item = MenuItem::with_id(app, "restart", "Restart Protection", true, None::<&str>)?;
    let separator2 = MenuItem::with_id(app, "sep2", "─────────────", false, None::<&str>)?;
    let quit_item = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;

    let menu = Menu::with_items(
        app,
        &[
            &show_item,
            &separator1,
            &status_item,
            &restart_item,
            &separator2,
            &quit_item,
        ],
    )?;

    let _tray = TrayIconBuilder::new()
        .icon(app.default_window_icon().unwrap().clone())
        .menu(&menu)
        .menu_on_left_click(false)
        .on_menu_event(|app, event| match event.id.as_ref() {
            "show" => {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
            "restart" => {
                let app_handle = app.clone();
                tauri::async_runtime::spawn(async move {
                    if let Some(state) = app_handle.try_state::<AppState>() {
                        let supervisor = state.supervisor.lock().await;
                        supervisor.reset_restart_count();
                        if let Err(e) = supervisor.restart().await {
                            log::error!("Failed to restart Ollama: {}", e);
                        }
                    }
                });
            }
            "quit" => {
                // Stop Ollama before quitting
                let app_handle = app.clone();
                tauri::async_runtime::spawn(async move {
                    if let Some(state) = app_handle.try_state::<AppState>() {
                        let supervisor = state.supervisor.lock().await;
                        let _ = supervisor.stop().await;
                    }
                    std::process::exit(0);
                });
            }
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                let app = tray.app_handle();
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
        })
        .build(app)?;

    Ok(())
}
