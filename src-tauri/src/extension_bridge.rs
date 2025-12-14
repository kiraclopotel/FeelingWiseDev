//! Extension Bridge Module
//!
//! HTTP server that allows the browser extension to discover and communicate
//! with the Tauri app without requiring manual configuration.

use axum::{
    extract::State,
    http::StatusCode,
    response::Json,
    routing::get,
    Router,
};
use serde::Serialize;
use std::sync::Arc;
use tokio::sync::Mutex;
use tower_http::cors::{Any, CorsLayer};

use crate::supervisor::{FriendlyStatus, OllamaSupervisor};

/// Bridge server port - the extension will check this fixed port
pub const BRIDGE_PORT: u16 = 19542;

/// Status response for the extension
#[derive(Serialize)]
pub struct BridgeStatus {
    /// App is running and responsive
    pub app_running: bool,

    /// User-friendly status message
    pub status: String,

    /// Ollama API URL for the extension to use
    pub ollama_url: String,

    /// App version
    pub version: String,

    /// Is Ollama healthy and ready
    pub ollama_ready: bool,

    /// Does the user need to complete setup
    pub needs_setup: bool,
}

/// Shared state for the bridge server
pub struct BridgeState {
    pub supervisor: Arc<Mutex<OllamaSupervisor>>,
    pub first_run_complete: Arc<Mutex<bool>>,
}

/// Start the extension bridge HTTP server
pub async fn start_bridge_server(
    supervisor: Arc<Mutex<OllamaSupervisor>>,
    first_run_complete: Arc<Mutex<bool>>,
) {
    let state = Arc::new(BridgeState {
        supervisor,
        first_run_complete,
    });

    // Configure CORS to allow extension access
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    let app = Router::new()
        .route("/status", get(status_handler))
        .route("/health", get(health_handler))
        .layer(cors)
        .with_state(state);

    let addr = format!("127.0.0.1:{}", BRIDGE_PORT);
    log::info!("Starting extension bridge server on {}", addr);

    let listener = match tokio::net::TcpListener::bind(&addr).await {
        Ok(l) => l,
        Err(e) => {
            log::error!("Failed to bind extension bridge: {}. Another instance may be running.", e);
            return;
        }
    };

    if let Err(e) = axum::serve(listener, app).await {
        log::error!("Extension bridge server error: {}", e);
    }
}

/// Health check endpoint - simple ping
async fn health_handler() -> &'static str {
    "ok"
}

/// Status endpoint - full app status for extension
async fn status_handler(State(state): State<Arc<BridgeState>>) -> Result<Json<BridgeStatus>, StatusCode> {
    let supervisor = state.supervisor.lock().await;
    let friendly_status = supervisor.get_friendly_status().await;
    let is_healthy = supervisor.is_healthy().await;
    drop(supervisor);

    let first_run = *state.first_run_complete.lock().await;

    let status_message = match &friendly_status {
        FriendlyStatus::Running { message } => message.clone(),
        FriendlyStatus::Starting { message } => message.clone(),
        FriendlyStatus::NotInstalled { message, .. } => message.clone(),
        FriendlyStatus::ModelMissing { message } => message.clone(),
        FriendlyStatus::Error { message } => message.clone(),
        FriendlyStatus::Stopped { message } => message.clone(),
    };

    let needs_setup = matches!(
        friendly_status,
        FriendlyStatus::NotInstalled { .. } | FriendlyStatus::ModelMissing { .. }
    ) || !first_run;

    Ok(Json(BridgeStatus {
        app_running: true,
        status: status_message,
        ollama_url: "http://127.0.0.1:11434".to_string(),
        version: env!("CARGO_PKG_VERSION").to_string(),
        ollama_ready: is_healthy,
        needs_setup,
    }))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_bridge_status_serialization() {
        let status = BridgeStatus {
            app_running: true,
            status: "Protected".to_string(),
            ollama_url: "http://127.0.0.1:11434".to_string(),
            version: "1.0.0".to_string(),
            ollama_ready: true,
            needs_setup: false,
        };

        let json = serde_json::to_string(&status).unwrap();
        assert!(json.contains("Protected"));
        assert!(json.contains("11434"));
    }
}
