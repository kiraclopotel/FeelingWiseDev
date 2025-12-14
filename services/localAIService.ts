/**
 * localAIService.ts
 *
 * Local AI service using Ollama via Tauri backend.
 * Replaces geminiService.ts for local, privacy-preserving inference.
 */

import { invoke } from '@tauri-apps/api/core';
import { AnalysisResult, AgeGroup, Technique } from '../types';

// ============================================================================
// TYPES
// ============================================================================

export interface SystemInfo {
  total_ram_gb: number;
  available_ram_gb: number;
  cpu_cores: number;
  cpu_name: string;
  gpu_info: GpuInfo | null;
  recommended_model: string;
  can_run_local_ai: boolean;
}

export interface GpuInfo {
  name: string;
  vram_mb: number | null;
  vendor: string;
}

export interface OllamaStatus {
  running: boolean;
  models_available: string[];
  current_model: string | null;
}

export interface RecommendedModel {
  name: string;
  display_name: string;
  size_gb: number;
  min_ram_gb: number;
  description: string;
}

export interface CachedNeutralization {
  content_hash: string;
  original: string;
  neutralized: string;
  techniques: string[];
  severity: number;
  created_at: number;
  hit_count: number;
}

export interface CacheStats {
  total_entries: number;
  cache_hits: number;
  cache_misses: number;
  hit_rate: number;
}

// ============================================================================
// UTILITY - Check if running in Tauri
// ============================================================================

export function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI__' in window;
}

// ============================================================================
// HARDWARE DETECTION
// ============================================================================

export async function getSystemInfo(): Promise<SystemInfo> {
  if (!isTauri()) {
    return mockSystemInfo();
  }
  return await invoke<SystemInfo>('get_system_info');
}

export async function checkSystemRequirements(): Promise<SystemInfo> {
  if (!isTauri()) {
    return mockSystemInfo();
  }
  return await invoke<SystemInfo>('check_system_requirements');
}

// ============================================================================
// OLLAMA MANAGEMENT
// ============================================================================

export async function checkOllamaInstalled(): Promise<boolean> {
  if (!isTauri()) {
    return false;
  }
  return await invoke<boolean>('check_ollama_installed');
}

export async function getOllamaStatus(): Promise<OllamaStatus> {
  if (!isTauri()) {
    return { running: false, models_available: [], current_model: null };
  }
  return await invoke<OllamaStatus>('get_ollama_status');
}

export async function startOllama(): Promise<void> {
  if (!isTauri()) {
    throw new Error('Ollama management requires desktop app');
  }
  return await invoke('start_ollama');
}

export async function stopOllama(): Promise<void> {
  if (!isTauri()) {
    throw new Error('Ollama management requires desktop app');
  }
  return await invoke('stop_ollama');
}

export async function listOllamaModels(): Promise<string[]> {
  if (!isTauri()) {
    return [];
  }
  return await invoke<string[]>('list_ollama_models');
}

export async function getRecommendedModels(): Promise<RecommendedModel[]> {
  if (!isTauri()) {
    return [
      { name: 'phi3:mini', display_name: 'Phi-3 Mini 3.8B', size_gb: 2.4, min_ram_gb: 4, description: 'Best accuracy-per-resource, recommended for most systems' },
      { name: 'llama3.2:3b', display_name: 'Llama 3.2 3B', size_gb: 2.0, min_ram_gb: 4, description: 'Lightweight alternative with good performance' },
    ];
  }
  return await invoke<RecommendedModel[]>('get_recommended_models');
}

export async function pullModel(modelName: string): Promise<void> {
  if (!isTauri()) {
    throw new Error('Model management requires desktop app');
  }
  return await invoke('pull_model', { modelName });
}

// ============================================================================
// NEW: Friendly Status & Setup APIs
// ============================================================================

export interface FriendlyStatus {
  status: 'starting' | 'running' | 'not_installed' | 'model_missing' | 'error' | 'stopped';
  message: string;
  download_url?: string;
}

export interface SetupStatus {
  ollama_installed: boolean;
  ollama_running: boolean;
  model_available: boolean;
  first_run_complete: boolean;
}

export interface AppSettings {
  language: string;
  start_on_login: boolean;
  minimize_to_tray: boolean;
  first_run_complete: boolean;
  selected_model: string;
  persona: string;
}

export async function getFriendlyStatus(): Promise<FriendlyStatus> {
  if (!isTauri()) {
    return { status: 'stopped', message: 'Desktop app required' };
  }
  return await invoke<FriendlyStatus>('get_friendly_status');
}

export async function getSetupStatus(): Promise<SetupStatus> {
  if (!isTauri()) {
    return {
      ollama_installed: false,
      ollama_running: false,
      model_available: false,
      first_run_complete: false,
    };
  }
  return await invoke<SetupStatus>('get_setup_status');
}

export async function getAppSettings(): Promise<AppSettings> {
  if (!isTauri()) {
    return {
      language: 'en',
      start_on_login: true,
      minimize_to_tray: true,
      first_run_complete: false,
      selected_model: 'phi3:mini',
      persona: 'adult',
    };
  }
  return await invoke<AppSettings>('get_settings');
}

export async function saveAppSettings(settings: AppSettings): Promise<void> {
  if (!isTauri()) return;
  return await invoke('save_settings', { newSettings: settings });
}

export async function completeFirstRun(): Promise<void> {
  if (!isTauri()) return;
  return await invoke('complete_first_run');
}

export async function openOllamaDownload(): Promise<void> {
  if (!isTauri()) {
    window.open('https://ollama.ai/download', '_blank');
    return;
  }
  return await invoke('open_ollama_download');
}

export async function openExtensionStore(): Promise<void> {
  if (!isTauri()) {
    window.open('https://chrome.google.com/webstore', '_blank');
    return;
  }
  return await invoke('open_extension_store');
}

export async function restartOllama(): Promise<void> {
  if (!isTauri()) {
    throw new Error('Ollama management requires desktop app');
  }
  return await invoke('restart_ollama');
}

// ============================================================================
// NEUTRALIZATION
// ============================================================================

export async function neutralizeContent(
  content: string,
  model?: string
): Promise<CachedNeutralization> {
  if (!isTauri()) {
    return mockNeutralization(content);
  }
  return await invoke<CachedNeutralization>('neutralize_content', { content, model });
}

// ============================================================================
// CACHE
// ============================================================================

export async function getCacheStats(): Promise<CacheStats> {
  if (!isTauri()) {
    return { total_entries: 0, cache_hits: 0, cache_misses: 0, hit_rate: 0 };
  }
  return await invoke<CacheStats>('get_cache_stats');
}

export async function clearCache(): Promise<void> {
  if (!isTauri()) {
    return;
  }
  return await invoke('clear_cache');
}

// ============================================================================
// ANALYSIS WRAPPER (Compatible with existing code)
// ============================================================================

/**
 * Analyze text and return results in the format expected by the existing UI.
 * This is a drop-in replacement for analyzeTextWithGemini.
 */
export async function analyzeTextWithLocalAI(
  text: string,
  ageGroup: AgeGroup
): Promise<AnalysisResult> {
  if (!isTauri()) {
    // Fall back to mock data when running in browser
    return mockAnalysis(text, ageGroup);
  }

  try {
    const result = await neutralizeContent(text);

    // Convert to the expected AnalysisResult format
    return convertToAnalysisResult(result, text, ageGroup);
  } catch (error) {
    console.error('Local AI analysis failed:', error);
    // Fall back to mock data on error
    return mockAnalysis(text, ageGroup);
  }
}

function convertToAnalysisResult(
  cached: CachedNeutralization,
  original: string,
  ageGroup: AgeGroup
): AnalysisResult {
  // Convert technique names to Technique objects with age-appropriate explanations
  const techniques: Technique[] = cached.techniques.map(techName => ({
    name: techName,
    severity: Math.min(10, Math.max(1, Math.floor(cached.severity * 0.8 + Math.random() * 2))),
    explanation: getAgeAppropriateExplanation(techName, ageGroup),
  }));

  return {
    neutralized: cached.neutralized,
    techniques,
    severity: cached.severity,
    psychology: getPsychologyExplanation(cached.techniques, ageGroup),
    pattern: getPatternExplanation(cached.techniques),
    questions: getCriticalQuestions(cached.techniques, ageGroup),
  };
}

function getAgeAppropriateExplanation(technique: string, ageGroup: AgeGroup): string {
  const explanations: Record<string, Record<AgeGroup, string>> = {
    'Fear Appeal': {
      child: 'This tries to scare you into doing something.',
      teen: 'Fear appeals bypass your logical thinking by triggering an emotional response.',
      adult: 'Fear appeals induce anxiety to prompt immediate reaction without careful consideration.',
    },
    'False Urgency': {
      child: 'This says "hurry!" to make you act without thinking.',
      teen: 'Fake deadlines pressure you to act before you can think critically.',
      adult: 'Artificial time constraints force decision-making before proper evaluation.',
    },
    'Shame': {
      child: 'This tries to make you feel bad about yourself.',
      teen: 'Shame tactics use your insecurities to control your behavior.',
      adult: 'Shame mechanisms leverage social rejection fears to influence behavior.',
    },
    'Ad Hominem': {
      child: 'This attacks a person instead of their idea.',
      teen: 'Attacking someone\'s character instead of addressing their argument.',
      adult: 'Personal attacks that distract from the substantive issues being discussed.',
    },
    'Bandwagon': {
      child: 'This says "everyone is doing it" to make you follow.',
      teen: 'False consensus that pressures you to conform.',
      adult: 'Appeal to popularity that implies consensus where none may exist.',
    },
    'Catastrophizing': {
      child: 'This makes problems sound much bigger than they are.',
      teen: 'Exaggerating consequences to extreme worst-case scenarios.',
      adult: 'Rhetorical hyperbole that inflates potential negative outcomes.',
    },
  };

  const defaultExplanations: Record<AgeGroup, string> = {
    child: 'This is a trick to change how you feel.',
    teen: 'This technique is designed to influence your emotions.',
    adult: 'A persuasion technique that affects emotional processing.',
  };

  const techLower = technique.toLowerCase();
  for (const [key, values] of Object.entries(explanations)) {
    if (techLower.includes(key.toLowerCase())) {
      return values[ageGroup];
    }
  }

  return defaultExplanations[ageGroup];
}

function getPsychologyExplanation(techniques: string[], ageGroup: AgeGroup): string {
  const base = techniques.length > 0
    ? `This content uses ${techniques.length} manipulation technique${techniques.length > 1 ? 's' : ''}`
    : 'This content appears to be mostly factual';

  if (ageGroup === 'child') {
    return `${base}. These tricks try to change how you feel without giving you time to think.`;
  } else if (ageGroup === 'teen') {
    return `${base}. High-arousal emotions like fear and anger can bypass your logical thinking and make you want to react immediately without checking the facts.`;
  } else {
    return `${base}. Emotional manipulation techniques target the limbic system, triggering responses before the prefrontal cortex can engage in rational evaluation.`;
  }
}

function getPatternExplanation(techniques: string[]): string {
  if (techniques.length === 0) {
    return 'No significant manipulation patterns detected.';
  }

  const hasEmotional = techniques.some(t =>
    t.toLowerCase().includes('fear') ||
    t.toLowerCase().includes('anger') ||
    t.toLowerCase().includes('shame')
  );

  const hasUrgency = techniques.some(t =>
    t.toLowerCase().includes('urgency') ||
    t.toLowerCase().includes('deadline')
  );

  if (hasEmotional && hasUrgency) {
    return 'This content combines emotional triggers with artificial urgency, a common pattern in viral misinformation and aggressive marketing.';
  } else if (hasEmotional) {
    return 'This content relies primarily on emotional appeals, which can be effective but may not support rational decision-making.';
  } else if (hasUrgency) {
    return 'This content creates artificial time pressure, which can lead to hasty decisions without proper evaluation.';
  }

  return 'This content uses persuasion techniques that may affect your judgment. Consider the source and verify claims independently.';
}

function getCriticalQuestions(techniques: string[], ageGroup: AgeGroup): string[] {
  const baseQuestions = [
    'Who benefits if I believe this?',
    'Is the situation really this simple?',
    'What evidence supports these claims?',
  ];

  if (ageGroup === 'child') {
    return [
      'How does this make me feel? Happy, scared, or angry?',
      'Is this trying to rush me?',
      'Would my parent or teacher agree with this?',
    ];
  } else if (ageGroup === 'teen') {
    return [
      ...baseQuestions,
      'Am I being pressured to act quickly?',
      'What would happen if I waited to decide?',
    ];
  } else {
    return [
      ...baseQuestions,
      'What information is missing?',
      'Are there alternative explanations?',
      'What would a skeptic say about this?',
    ];
  }
}

// ============================================================================
// MOCK DATA (for browser development)
// ============================================================================

function mockSystemInfo(): SystemInfo {
  return {
    total_ram_gb: 16,
    available_ram_gb: 8,
    cpu_cores: 8,
    cpu_name: 'Browser Environment',
    gpu_info: null,
    recommended_model: 'phi3:mini',
    can_run_local_ai: false,
  };
}

function mockNeutralization(content: string): CachedNeutralization {
  // Simple mock neutralization
  let neutralized = content
    .replace(/[A-Z]{3,}/g, match => match.charAt(0) + match.slice(1).toLowerCase())
    .replace(/!{2,}/g, '.')
    .replace(/\?{2,}/g, '?')
    .replace(/[🚨🔥⚠️❗‼️]/g, '');

  const techniques: string[] = [];

  if (/[A-Z]{3,}/.test(content)) techniques.push('ALL CAPS Formatting');
  if (/!{2,}/.test(content)) techniques.push('Excessive Punctuation');
  if (/urgent|now|immediately|hurry/i.test(content)) techniques.push('False Urgency');
  if (/destroy|disaster|catastrophe|end/i.test(content)) techniques.push('Fear Appeal');
  if (/everyone|always|never|nobody/i.test(content)) techniques.push('Absolute Language');

  return {
    content_hash: 'mock-' + Date.now(),
    original: content,
    neutralized,
    techniques,
    severity: Math.min(10, techniques.length * 2),
    created_at: Date.now(),
    hit_count: 0,
  };
}

function mockAnalysis(text: string, ageGroup: AgeGroup): AnalysisResult {
  const cached = mockNeutralization(text);
  return convertToAnalysisResult(cached, text, ageGroup);
}
