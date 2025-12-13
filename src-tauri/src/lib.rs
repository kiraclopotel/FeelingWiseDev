mod cache;
mod hardware;
mod ollama;

use cache::{CacheStats, CachedNeutralization, NeutralizationCache};
use hardware::SystemInfo;
use ollama::{OllamaManager, OllamaStatus, RecommendedModel};
use std::sync::Arc;
use tauri::State;
use tokio::sync::Mutex;

// Application state
pub struct AppState {
    pub ollama: Arc<Mutex<OllamaManager>>,
    pub cache: Arc<Mutex<NeutralizationCache>>,
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
    OllamaManager::is_ollama_installed()
}

#[tauri::command]
async fn get_ollama_status(state: State<'_, AppState>) -> Result<OllamaStatus, String> {
    let ollama = state.ollama.lock().await;
    Ok(ollama.get_status().await)
}

#[tauri::command]
async fn start_ollama(state: State<'_, AppState>) -> Result<(), String> {
    let ollama = state.ollama.lock().await;
    ollama.start().await
}

#[tauri::command]
async fn stop_ollama(state: State<'_, AppState>) -> Result<(), String> {
    let ollama = state.ollama.lock().await;
    ollama.stop().await
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
    ollama.pull_model(&model_name, |progress| {
        log::info!("Pull progress: {:?}", progress);
    }).await
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
        .map(|arr| arr.iter().filter_map(|v| v.as_str().map(String::from)).collect())
        .unwrap_or_default();

    let severity = parsed["severity"]
        .as_i64()
        .unwrap_or(0) as i32;

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
    // Initialize cache
    let cache = NeutralizationCache::new(None)
        .expect("Failed to initialize cache");

    // Initialize Ollama manager
    let ollama = OllamaManager::new();

    // Create app state
    let app_state = AppState {
        ollama: Arc::new(Mutex::new(ollama)),
        cache: Arc::new(Mutex::new(cache)),
    };

    tauri::Builder::default()
        .manage(app_state)
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Hardware
            get_system_info,
            check_system_requirements,
            // Ollama
            check_ollama_installed,
            get_ollama_status,
            start_ollama,
            stop_ollama,
            list_ollama_models,
            get_recommended_models,
            pull_model,
            // Neutralization
            neutralize_content,
            // Cache
            get_cache_stats,
            clear_cache,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
