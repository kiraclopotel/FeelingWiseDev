use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::process::{Child, Command, Stdio};
use std::sync::Arc;
use tokio::sync::Mutex;
use tokio::time::{sleep, Duration};

const OLLAMA_API_BASE: &str = "http://127.0.0.1:11434";
const HEALTH_CHECK_INTERVAL: Duration = Duration::from_secs(5);
const MAX_RETRIES: u32 = 3;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelInfo {
    pub name: String,
    pub size: u64,
    pub modified_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GenerateRequest {
    pub model: String,
    pub prompt: String,
    pub stream: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub options: Option<GenerateOptions>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GenerateOptions {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub temperature: Option<f32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub num_predict: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GenerateResponse {
    pub model: String,
    pub response: String,
    pub done: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub context: Option<Vec<i32>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub total_duration: Option<u64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub load_duration: Option<u64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub prompt_eval_count: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub eval_count: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PullProgress {
    pub status: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub digest: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub total: Option<u64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub completed: Option<u64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OllamaStatus {
    pub running: bool,
    pub models_available: Vec<String>,
    pub current_model: Option<String>,
}

pub struct OllamaManager {
    client: Client,
    process: Arc<Mutex<Option<Child>>>,
    current_model: Arc<Mutex<Option<String>>>,
}

impl OllamaManager {
    pub fn new() -> Self {
        Self {
            client: Client::new(),
            process: Arc::new(Mutex::new(None)),
            current_model: Arc::new(Mutex::new(None)),
        }
    }

    /// Check if Ollama is running and healthy
    pub async fn is_healthy(&self) -> bool {
        match self.client.get(format!("{}/api/tags", OLLAMA_API_BASE))
            .timeout(Duration::from_secs(2))
            .send()
            .await
        {
            Ok(response) => response.status().is_success(),
            Err(_) => false,
        }
    }

    /// Check if Ollama is installed on the system
    pub fn is_ollama_installed() -> bool {
        #[cfg(target_os = "windows")]
        {
            Command::new("where")
                .arg("ollama")
                .stdout(Stdio::null())
                .stderr(Stdio::null())
                .status()
                .map(|s| s.success())
                .unwrap_or(false)
        }

        #[cfg(not(target_os = "windows"))]
        {
            Command::new("which")
                .arg("ollama")
                .stdout(Stdio::null())
                .stderr(Stdio::null())
                .status()
                .map(|s| s.success())
                .unwrap_or(false)
        }
    }

    /// Start Ollama server
    pub async fn start(&self) -> Result<(), String> {
        // Check if already running
        if self.is_healthy().await {
            log::info!("Ollama is already running");
            return Ok(());
        }

        // Try to start Ollama
        let child = Command::new("ollama")
            .arg("serve")
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .spawn()
            .map_err(|e| format!("Failed to start Ollama: {}", e))?;

        *self.process.lock().await = Some(child);

        // Wait for Ollama to be ready
        for i in 0..30 {
            sleep(Duration::from_millis(500)).await;
            if self.is_healthy().await {
                log::info!("Ollama started successfully after {}ms", (i + 1) * 500);
                return Ok(());
            }
        }

        Err("Ollama failed to start within 15 seconds".to_string())
    }

    /// Stop Ollama server
    pub async fn stop(&self) -> Result<(), String> {
        let mut process = self.process.lock().await;
        if let Some(mut child) = process.take() {
            child.kill().map_err(|e| format!("Failed to stop Ollama: {}", e))?;
        }
        Ok(())
    }

    /// List available models
    pub async fn list_models(&self) -> Result<Vec<ModelInfo>, String> {
        let response = self.client
            .get(format!("{}/api/tags", OLLAMA_API_BASE))
            .send()
            .await
            .map_err(|e| format!("Failed to list models: {}", e))?;

        #[derive(Deserialize)]
        struct TagsResponse {
            models: Option<Vec<ModelInfo>>,
        }

        let tags: TagsResponse = response.json().await
            .map_err(|e| format!("Failed to parse models response: {}", e))?;

        Ok(tags.models.unwrap_or_default())
    }

    /// Pull a model from Ollama registry
    pub async fn pull_model<F>(&self, model_name: &str, progress_callback: F) -> Result<(), String>
    where
        F: Fn(PullProgress) + Send + 'static,
    {
        let response = self.client
            .post(format!("{}/api/pull", OLLAMA_API_BASE))
            .json(&serde_json::json!({
                "name": model_name,
                "stream": true
            }))
            .send()
            .await
            .map_err(|e| format!("Failed to pull model: {}", e))?;

        let mut stream = response.bytes_stream();
        use futures_util::StreamExt;

        while let Some(chunk) = stream.next().await {
            match chunk {
                Ok(bytes) => {
                    if let Ok(text) = String::from_utf8(bytes.to_vec()) {
                        for line in text.lines() {
                            if let Ok(progress) = serde_json::from_str::<PullProgress>(line) {
                                progress_callback(progress);
                            }
                        }
                    }
                }
                Err(e) => return Err(format!("Error during model pull: {}", e)),
            }
        }

        Ok(())
    }

    /// Generate completion from Ollama
    pub async fn generate(&self, model: &str, prompt: &str) -> Result<String, String> {
        let request = GenerateRequest {
            model: model.to_string(),
            prompt: prompt.to_string(),
            stream: false,
            options: Some(GenerateOptions {
                temperature: Some(0.3),
                num_predict: Some(256),
            }),
        };

        let mut retries = 0;
        loop {
            match self.client
                .post(format!("{}/api/generate", OLLAMA_API_BASE))
                .json(&request)
                .timeout(Duration::from_secs(60))
                .send()
                .await
            {
                Ok(response) => {
                    let gen_response: GenerateResponse = response.json().await
                        .map_err(|e| format!("Failed to parse generate response: {}", e))?;

                    *self.current_model.lock().await = Some(model.to_string());
                    return Ok(gen_response.response);
                }
                Err(e) => {
                    retries += 1;
                    if retries >= MAX_RETRIES {
                        return Err(format!("Failed to generate after {} retries: {}", MAX_RETRIES, e));
                    }
                    log::warn!("Generate attempt {} failed, retrying: {}", retries, e);
                    sleep(Duration::from_millis(500)).await;
                }
            }
        }
    }

    /// Get current status
    pub async fn get_status(&self) -> OllamaStatus {
        let running = self.is_healthy().await;
        let models_available = if running {
            self.list_models().await
                .map(|m| m.iter().map(|info| info.name.clone()).collect())
                .unwrap_or_default()
        } else {
            vec![]
        };
        let current_model = self.current_model.lock().await.clone();

        OllamaStatus {
            running,
            models_available,
            current_model,
        }
    }
}

impl Default for OllamaManager {
    fn default() -> Self {
        Self::new()
    }
}

/// Recommended models based on available system resources
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RecommendedModel {
    pub name: String,
    pub display_name: String,
    pub size_gb: f32,
    pub min_ram_gb: u64,
    pub description: String,
}

pub fn get_recommended_models() -> Vec<RecommendedModel> {
    vec![
        RecommendedModel {
            name: "phi3:mini".to_string(),
            display_name: "Phi-3 Mini 3.8B".to_string(),
            size_gb: 2.4,
            min_ram_gb: 4,
            description: "Best accuracy-per-resource, recommended for most systems".to_string(),
        },
        RecommendedModel {
            name: "llama3.2:3b".to_string(),
            display_name: "Llama 3.2 3B".to_string(),
            size_gb: 2.0,
            min_ram_gb: 4,
            description: "Lightweight alternative with good performance".to_string(),
        },
        RecommendedModel {
            name: "llama3:8b".to_string(),
            display_name: "Llama 3 8B".to_string(),
            size_gb: 4.7,
            min_ram_gb: 8,
            description: "Higher quality output for systems with 8GB+ RAM".to_string(),
        },
        RecommendedModel {
            name: "mistral:7b".to_string(),
            display_name: "Mistral 7B".to_string(),
            size_gb: 4.1,
            min_ram_gb: 8,
            description: "Excellent instruction following capabilities".to_string(),
        },
    ]
}
