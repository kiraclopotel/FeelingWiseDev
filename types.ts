/**
 * types.ts
 *
 * Type definitions for FeelingWise application.
 */

// ============================================================================
// CORE TYPES
// ============================================================================

export type AgeGroup = 'child' | 'teenager' | 'adult';

export type Platform = 'twitter' | 'tiktok' | 'instagram' | 'facebook' | 'youtube';

export type PostCategory =
  | 'Health Misinformation'
  | 'Body Image'
  | 'Political Division'
  | 'Financial Scams'
  | 'Parenting Shame'
  | 'Mental Health'
  | 'Conspiracy'
  | 'Clean Content';

// ============================================================================
// ANALYSIS TYPES
// ============================================================================

export interface Technique {
  name: string;
  severity: number;
  explanation: string;
}

export interface TechniqueAnalysis {
  name: string;
  severity: number;
  explanation: string;
}

export interface AnalysisResult {
  neutralized: string;
  severity: number;
  techniques: TechniqueAnalysis[];
  psychology: string;
  pattern: string;
  questions: string[];
}

export interface AnalysisHistoryItem {
  id: string;
  original: string;
  neutralized: string;
  techniques: string[];
  severity: number;
  createdAt: number;
  persona: AgeGroup;
}

// ============================================================================
// PERSONA TYPES
// ============================================================================

export interface Persona {
  id: AgeGroup;
  name: string;
  label: string;
  icon: any; // React component (LucideIcon)
  description: string;
}

export interface PersonaConfig {
  showOriginal: boolean;
  showAnalysis: boolean;
  defaultView: 'original' | 'neutralized';
}

// ============================================================================
// GAMIFICATION TYPES
// ============================================================================

export type Rarity = 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary';

export interface GuardianStats {
  guard: number;
  sight: number;
  speed: number;
}

export interface GuardianCard {
  id: string;
  title: string;
  rarity: Rarity;
  stats: GuardianStats;
  level: number;
  timestamp: string;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface UserProgress {
  points: number;
  level: number;
  currentCard: GuardianCard;
  collection: GuardianCard[];
  quizCompletedToday: boolean;
}

// ============================================================================
// APP STATE TYPES
// ============================================================================

export type AppTab = 'analyze' | 'stats' | 'cards' | 'settings';

export interface AppSettings {
  persona: AgeGroup;
  useLocalAI: boolean;
  selectedModel: string | null;
  textSize: 'normal' | 'large';
  highContrast: boolean;
}

// ============================================================================
// STATISTICS TYPES
// ============================================================================

export interface AnalysisStats {
  totalAnalyses: number;
  techniqueFrequency: Record<string, number>;
  averageSeverity: number;
  lastAnalysisTime: number | null;
  cacheHitRate: number;
}

export interface CacheStats {
  totalEntries: number;
  cacheHits: number;
  cacheMisses: number;
  hitRate: number;
}
