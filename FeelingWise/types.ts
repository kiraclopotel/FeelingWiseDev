
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

export interface Comment {
  id: string;
  author: string;
  original: string;
  neutralized: string;
  techniques: string[];
  severity: number;
}

export interface Post {
  id: string | number;
  platform: Platform;
  category: PostCategory;
  original: string;
  neutralized: string;
  techniques: string[];
  severity: number; // 0-10
  author: string;
  handle?: string; // For twitter/insta
  timestamp: string;
  verified?: boolean; // New field for verification badge
  
  // Engagement Metrics (strings to allow "1.2K")
  likes: string;
  comments: string;
  shares: string;
  views?: string;
  
  // Visuals
  hasMedia?: boolean;
  mediaType?: 'image' | 'video';
  mediaColor?: string; // For placeholder visuals

  // Comment Thread
  commentThread: Comment[];
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
  psychology: string; // "Why it works" / "How it tricks you"
  pattern: string; // "Pattern Recognition" / "The Pattern"
  questions: string[]; // "Think about it"
}

export interface Persona {
  id: AgeGroup;
  name: string;
  label: string;
  icon: any; // React component
  description: string;
}

// --- NEW SCAM SIMULATION TYPES ---

export interface Message {
  id: number;
  sender: 'scammer' | 'user';
  text: string;
  delay: number; // ms to wait before showing
}

export interface ScamAnalysisState {
  probability: number; // 0-100
  flags: string[];
  technique: string;
  recommendation: string;
  explanation: string;
}

export interface ScamScenario {
  id: string;
  title: string;
  contactName: string;
  icon: any; // React component
  messages: Message[];
  finalAnalysis: ScamAnalysisState;
}

// --- GAMIFICATION TYPES ---

export type Rarity = 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary';

export interface GuardianStats {
  guard: number;
  sight: number;
  speed: number;
}

export interface GuardianCard {
  id: string; // Unique #
  title: string; // Adj + Noun
  rarity: Rarity;
  stats: GuardianStats;
  level: number;
  timestamp: string;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number; // 0-3
  explanation: string;
}

export interface UserProgress {
  points: number;
  level: number;
  currentCard: GuardianCard;
  collection: GuardianCard[];
  quizCompletedToday: boolean;
}
