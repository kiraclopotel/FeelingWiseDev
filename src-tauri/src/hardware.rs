use serde::{Deserialize, Serialize};
use sysinfo::System;
use std::process::Command;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemInfo {
    pub total_ram_gb: f64,
    pub available_ram_gb: f64,
    pub cpu_cores: usize,
    pub cpu_name: String,
    pub gpu_info: Option<GpuInfo>,
    pub recommended_model: String,
    pub can_run_local_ai: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GpuInfo {
    pub name: String,
    pub vram_mb: Option<u64>,
    pub vendor: String,
}

impl SystemInfo {
    pub fn detect() -> Self {
        let mut sys = System::new_all();
        sys.refresh_all();

        let total_ram_gb = sys.total_memory() as f64 / 1024.0 / 1024.0 / 1024.0;
        let available_ram_gb = sys.available_memory() as f64 / 1024.0 / 1024.0 / 1024.0;
        let cpu_cores = sys.cpus().len();
        let cpu_name = sys.cpus()
            .first()
            .map(|cpu| cpu.brand().to_string())
            .unwrap_or_else(|| "Unknown".to_string());

        let gpu_info = Self::detect_gpu();

        // Determine recommended model based on system capabilities
        let (recommended_model, can_run_local_ai) = Self::recommend_model(total_ram_gb, &gpu_info);

        SystemInfo {
            total_ram_gb,
            available_ram_gb,
            cpu_cores,
            cpu_name,
            gpu_info,
            recommended_model,
            can_run_local_ai,
        }
    }

    fn detect_gpu() -> Option<GpuInfo> {
        // Try nvidia-smi for NVIDIA GPUs
        if let Some(nvidia_info) = Self::detect_nvidia_gpu() {
            return Some(nvidia_info);
        }

        // Try to detect via other means
        #[cfg(target_os = "macos")]
        {
            if let Some(apple_info) = Self::detect_apple_silicon() {
                return Some(apple_info);
            }
        }

        // Try to detect AMD GPU on Linux
        #[cfg(target_os = "linux")]
        {
            if let Some(amd_info) = Self::detect_amd_gpu() {
                return Some(amd_info);
            }
        }

        None
    }

    fn detect_nvidia_gpu() -> Option<GpuInfo> {
        let output = Command::new("nvidia-smi")
            .args(["--query-gpu=name,memory.total", "--format=csv,noheader,nounits"])
            .output()
            .ok()?;

        if !output.status.success() {
            return None;
        }

        let stdout = String::from_utf8_lossy(&output.stdout);
        let parts: Vec<&str> = stdout.trim().split(',').collect();

        if parts.len() >= 2 {
            let name = parts[0].trim().to_string();
            let vram_mb = parts[1].trim().parse::<u64>().ok();

            return Some(GpuInfo {
                name,
                vram_mb,
                vendor: "NVIDIA".to_string(),
            });
        }

        None
    }

    #[cfg(target_os = "macos")]
    fn detect_apple_silicon() -> Option<GpuInfo> {
        let output = Command::new("sysctl")
            .args(["-n", "machdep.cpu.brand_string"])
            .output()
            .ok()?;

        let cpu_brand = String::from_utf8_lossy(&output.stdout);

        if cpu_brand.contains("Apple") {
            // Apple Silicon uses unified memory, so GPU VRAM = system RAM
            let mut sys = System::new_all();
            sys.refresh_memory();
            let unified_memory_mb = sys.total_memory() / 1024 / 1024;

            // Determine chip type from cpu brand
            let chip_name = if cpu_brand.contains("M1") {
                "Apple M1"
            } else if cpu_brand.contains("M2") {
                "Apple M2"
            } else if cpu_brand.contains("M3") {
                "Apple M3"
            } else if cpu_brand.contains("M4") {
                "Apple M4"
            } else {
                "Apple Silicon"
            };

            return Some(GpuInfo {
                name: format!("{} GPU", chip_name),
                vram_mb: Some(unified_memory_mb),
                vendor: "Apple".to_string(),
            });
        }

        None
    }

    #[cfg(target_os = "linux")]
    fn detect_amd_gpu() -> Option<GpuInfo> {
        // Try rocm-smi for AMD GPUs
        let output = Command::new("rocm-smi")
            .args(["--showproductname"])
            .output()
            .ok()?;

        if output.status.success() {
            let stdout = String::from_utf8_lossy(&output.stdout);
            for line in stdout.lines() {
                if line.contains("GPU") || line.contains("AMD") || line.contains("Radeon") {
                    return Some(GpuInfo {
                        name: line.trim().to_string(),
                        vram_mb: None, // Could query separately
                        vendor: "AMD".to_string(),
                    });
                }
            }
        }

        None
    }

    #[cfg(not(target_os = "linux"))]
    fn detect_amd_gpu() -> Option<GpuInfo> {
        None
    }

    #[cfg(not(target_os = "macos"))]
    fn detect_apple_silicon() -> Option<GpuInfo> {
        None
    }

    fn recommend_model(total_ram_gb: f64, gpu_info: &Option<GpuInfo>) -> (String, bool) {
        // Minimum requirement: 4GB RAM
        if total_ram_gb < 4.0 {
            return ("none".to_string(), false);
        }

        // Check for GPU with VRAM
        let has_good_gpu = gpu_info.as_ref().map_or(false, |gpu| {
            gpu.vram_mb.map_or(false, |vram| vram >= 4000)
        });

        // Apple Silicon always works well with llama.cpp/Ollama
        let is_apple_silicon = gpu_info.as_ref().map_or(false, |gpu| {
            gpu.vendor == "Apple"
        });

        // Recommend based on available resources
        let recommended = if total_ram_gb >= 16.0 || (has_good_gpu && total_ram_gb >= 8.0) {
            "llama3:8b" // Better quality for high-end systems
        } else if total_ram_gb >= 8.0 || is_apple_silicon {
            "phi3:mini" // Good balance for mid-range
        } else {
            "llama3.2:3b" // Lightweight for lower-end
        };

        (recommended.to_string(), true)
    }
}

/// Check if the system meets minimum requirements for local AI
pub fn check_requirements() -> Result<SystemInfo, String> {
    let info = SystemInfo::detect();

    if !info.can_run_local_ai {
        return Err(format!(
            "System does not meet minimum requirements. Found {:.1}GB RAM, need at least 4GB.",
            info.total_ram_gb
        ));
    }

    Ok(info)
}

/// Get human-readable system summary
pub fn get_system_summary(info: &SystemInfo) -> String {
    let mut summary = format!(
        "CPU: {} ({} cores)\nRAM: {:.1}GB total, {:.1}GB available",
        info.cpu_name, info.cpu_cores, info.total_ram_gb, info.available_ram_gb
    );

    if let Some(gpu) = &info.gpu_info {
        summary.push_str(&format!("\nGPU: {} ({})", gpu.name, gpu.vendor));
        if let Some(vram) = gpu.vram_mb {
            summary.push_str(&format!(" - {}MB VRAM", vram));
        }
    } else {
        summary.push_str("\nGPU: None detected (CPU-only inference)");
    }

    summary.push_str(&format!("\nRecommended Model: {}", info.recommended_model));

    summary
}
