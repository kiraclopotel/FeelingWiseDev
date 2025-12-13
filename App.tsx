/**
 * App.tsx
 *
 * Main application component for FeelingWise.
 * Clean production version - all demo elements removed.
 */

import React, { useState, useEffect } from 'react';
import { AnalyzeTab } from './components/AnalyzeTab';
import { StatsTab } from './components/StatsTab';
import { AboutTab } from './components/AboutTab';
import { SetupWizard } from './components/SetupWizard';
import { ChildGamification } from './components/ChildGamification';
import { AgeGroup, UserProgress, AppTab } from './types';
import { generateCard } from './services/gamificationService';
import { checkOllamaHealth } from './services/localAIService';
import { AGE_GROUPS, APP_CONFIG } from './constants';
import {
  Search, BarChart2, Info, Settings, Shield, Loader2,
  AlertTriangle, Download, RefreshCw, Layers
} from 'lucide-react';

// ============================================================================
// INITIAL STATE
// ============================================================================

const INITIAL_PROGRESS: UserProgress = {
  points: 0,
  level: 1,
  currentCard: generateCard(1),
  collection: [],
  quizCompletedToday: false
};
INITIAL_PROGRESS.collection.push(INITIAL_PROGRESS.currentCard);

// ============================================================================
// MAIN APP COMPONENT
// ============================================================================

const App: React.FC = () => {
  // App state
  const [activeTab, setActiveTab] = useState<AppTab>('analyze');
  const [currentAge, setAgeGroup] = useState<AgeGroup>('adult');
  const [userProgress, setUserProgress] = useState<UserProgress>(INITIAL_PROGRESS);

  // First-run / setup state
  const [isCheckingSetup, setIsCheckingSetup] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [ollamaStatus, setOllamaStatus] = useState<'checking' | 'ready' | 'missing'>('checking');

  // Settings modal
  const [showSettings, setShowSettings] = useState(false);

  // Check setup status on mount
  useEffect(() => {
    async function checkSetup() {
      setIsCheckingSetup(true);

      // Check if setup has been completed before
      const setupComplete = localStorage.getItem('fw_setup_complete');

      if (!setupComplete) {
        setNeedsSetup(true);
        setIsCheckingSetup(false);
        return;
      }

      // Check if Ollama is still available
      try {
        const ollamaOk = await checkOllamaHealth();
        setOllamaStatus(ollamaOk ? 'ready' : 'missing');
      } catch {
        setOllamaStatus('missing');
      }

      // Load saved persona preference
      const savedPersona = localStorage.getItem('fw_persona') as AgeGroup | null;
      if (savedPersona && ['child', 'teenager', 'adult'].includes(savedPersona)) {
        setAgeGroup(savedPersona);
      }

      setIsCheckingSetup(false);
    }

    checkSetup();
  }, []);

  // Handle setup completion
  const handleSetupComplete = () => {
    localStorage.setItem('fw_setup_complete', 'true');
    setNeedsSetup(false);
    setOllamaStatus('ready');
  };

  // Handle persona change
  const handlePersonaChange = (persona: AgeGroup) => {
    setAgeGroup(persona);
    localStorage.setItem('fw_persona', persona);
  };

  // Retry Ollama check
  const handleRetryOllama = async () => {
    setOllamaStatus('checking');
    try {
      const ollamaOk = await checkOllamaHealth();
      setOllamaStatus(ollamaOk ? 'ready' : 'missing');
    } catch {
      setOllamaStatus('missing');
    }
  };

  // ============================================================================
  // RENDER STATES
  // ============================================================================

  // Loading state
  if (isCheckingSetup) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mx-auto mb-4" />
          <p className="text-zinc-400">Loading FeelingWise...</p>
        </div>
      </div>
    );
  }

  // Setup wizard for first run
  if (needsSetup) {
    return (
      <SetupWizard
        onComplete={handleSetupComplete}
        onSkip={handleSetupComplete}
      />
    );
  }

  // Ollama missing warning (non-blocking, but shows a banner)
  const renderOllamaBanner = () => {
    if (ollamaStatus === 'ready') return null;

    if (ollamaStatus === 'checking') {
      return (
        <div className="bg-indigo-900/30 border-b border-indigo-500/30 px-4 py-2 flex items-center justify-center gap-2 text-sm">
          <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
          <span className="text-indigo-300">Checking Ollama connection...</span>
        </div>
      );
    }

    return (
      <div className="bg-amber-900/30 border-b border-amber-500/30 px-4 py-2 flex items-center justify-center gap-3 text-sm">
        <AlertTriangle className="w-4 h-4 text-amber-400" />
        <span className="text-amber-200">Ollama not detected. Local AI unavailable.</span>
        <button
          onClick={handleRetryOllama}
          className="flex items-center gap-1 text-amber-400 hover:text-amber-300 underline"
        >
          <RefreshCw size={12} /> Retry
        </button>
        <a
          href="https://ollama.ai"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-amber-400 hover:text-amber-300 underline"
        >
          <Download size={12} /> Install
        </a>
      </div>
    );
  };

  // Render tab content
  const renderContent = () => {
    switch (activeTab) {
      case 'analyze':
        return <AnalyzeTab />;
      case 'stats':
        return <StatsTab />;
      case 'cards':
        return (
          <div className="max-w-2xl mx-auto pt-8 px-4">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">Guardian Collection</h2>
            <ChildGamification progress={userProgress} setProgress={setUserProgress} />
          </div>
        );
      case 'settings':
        return <SettingsContent persona={currentAge} onPersonaChange={handlePersonaChange} />;
      default:
        return <AnalyzeTab />;
    }
  };

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e5e5e5] font-sans flex flex-col relative overflow-hidden selection:bg-indigo-500/30">

      {/* Background Gradients */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-900/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-emerald-900/10 rounded-full blur-[120px]" />
      </div>

      {/* Ollama Status Banner */}
      {renderOllamaBanner()}

      {/* Top Header */}
      <header className="fixed top-0 inset-x-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-md border-b border-[#2a2a2a] px-6 py-4 flex items-center justify-between transition-all duration-300">
        <div className="flex items-center gap-3 group cursor-pointer" onClick={() => setActiveTab('analyze')}>
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500 to-emerald-500 rounded-lg blur-md opacity-40 group-hover:opacity-60 transition-opacity" />
            <div className="relative w-10 h-10 bg-[#1a1a1a] rounded-lg flex items-center justify-center text-white font-bold text-xl ring-1 ring-white/10">
              <span className="bg-gradient-to-br from-indigo-400 to-emerald-400 bg-clip-text text-transparent">F</span>
            </div>
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-[#e5e5e5] group-hover:text-white transition-colors">
              {APP_CONFIG.name}
            </h1>
            <p className="text-[10px] text-[#8b8b8b] font-medium tracking-wider uppercase">
              {APP_CONFIG.tagline}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Persona Indicator */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a]">
            <Shield size={14} className="text-indigo-400" />
            <span className="text-xs font-medium text-zinc-400">
              {AGE_GROUPS.find(g => g.id === currentAge)?.name}
            </span>
          </div>

          {/* Settings Button */}
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-colors group ${
              activeTab === 'settings'
                ? 'bg-indigo-900/20 border-indigo-500/50 text-indigo-400'
                : 'bg-[#1a1a1a] border-[#2a2a2a] hover:border-[#3a3a3a]'
            }`}
          >
            <Settings size={14} className={activeTab === 'settings' ? 'text-indigo-400' : 'text-[#8b8b8b] group-hover:text-[#e5e5e5]'} />
            <span className="text-xs font-medium hidden sm:inline">Settings</span>
          </button>

          <span className="hidden sm:block px-2 py-1 rounded bg-[#1a1a1a] border border-[#2a2a2a] text-[10px] text-[#5a5a5a] font-mono">
            v{APP_CONFIG.version}
          </span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 px-4 md:px-0 relative z-10 pt-24 pb-28 overflow-y-auto scroll-smooth">
        {renderContent()}
      </main>

      {/* Floating Bottom Navigation */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-[380px] px-4">
        <div className="bg-[#1a1a1a]/90 backdrop-blur-xl border border-[#2a2a2a] rounded-2xl shadow-2xl shadow-black/50 p-2 flex justify-between items-center ring-1 ring-white/5">
          <NavButton
            active={activeTab === 'analyze'}
            onClick={() => setActiveTab('analyze')}
            icon={<Search size={22} />}
            label="Analyze"
          />
          <NavButton
            active={activeTab === 'stats'}
            onClick={() => setActiveTab('stats')}
            icon={<BarChart2 size={22} />}
            label="Stats"
          />
          <NavButton
            active={activeTab === 'cards'}
            onClick={() => setActiveTab('cards')}
            icon={<Layers size={22} />}
            label="Cards"
          />
          <NavButton
            active={activeTab === 'settings'}
            onClick={() => setActiveTab('settings')}
            icon={<Info size={22} />}
            label="About"
          />
        </div>
      </nav>
    </div>
  );
};

// ============================================================================
// NAV BUTTON COMPONENT
// ============================================================================

const NavButton = ({
  active,
  onClick,
  icon,
  label
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) => (
  <button
    onClick={onClick}
    className={`relative flex flex-col items-center justify-center w-full py-2 rounded-xl transition-all duration-300 group ${
      active ? 'text-white' : 'text-[#5a5a5a] hover:text-[#8b8b8b]'
    }`}
  >
    {active && (
      <div className="absolute inset-0 bg-white/5 rounded-xl animate-in fade-in zoom-in-95 duration-200" />
    )}

    <div className={`transition-transform duration-300 ${
      active ? 'scale-100 translate-y-0 text-indigo-400' : 'scale-90 translate-y-1 group-hover:scale-100 group-hover:translate-y-0'
    }`}>
      {icon}
    </div>

    <span className={`text-[9px] font-medium mt-1 transition-all duration-300 ${
      active ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0'
    }`}>
      {label}
    </span>
  </button>
);

// ============================================================================
// SETTINGS CONTENT COMPONENT
// ============================================================================

const SettingsContent = ({
  persona,
  onPersonaChange
}: {
  persona: AgeGroup;
  onPersonaChange: (p: AgeGroup) => void;
}) => {
  return (
    <div className="max-w-2xl mx-auto pt-8 px-4 pb-20 space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Settings</h2>
        <p className="text-zinc-400 text-sm">Configure your FeelingWise experience</p>
      </div>

      {/* Persona Selection */}
      <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6">
        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Protection Mode</h3>

        <div className="space-y-3">
          {AGE_GROUPS.map((group) => {
            const Icon = group.icon;
            const isActive = persona === group.id;
            return (
              <button
                key={group.id}
                onClick={() => onPersonaChange(group.id)}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all ${
                  isActive
                    ? 'bg-indigo-900/20 border-indigo-500/50'
                    : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  isActive ? 'bg-indigo-500/20 text-indigo-400' : 'bg-zinc-800 text-zinc-500'
                }`}>
                  <Icon size={24} fill={isActive ? "currentColor" : "none"} />
                </div>
                <div className="text-left flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className={`font-bold ${isActive ? 'text-indigo-300' : 'text-zinc-300'}`}>
                      {group.name}
                    </span>
                    {isActive && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/20">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500">{group.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* About Section */}
      <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6">
        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">About FeelingWise</h3>

        <div className="space-y-4 text-sm text-zinc-400">
          <p>
            FeelingWise uses local AI to neutralize emotional manipulation in social media content
            while preserving the original message and factual claims.
          </p>

          <div className="bg-zinc-950 rounded-xl p-4 border border-zinc-800">
            <h4 className="font-bold text-white mb-2">How It Works</h4>
            <ul className="space-y-2 list-disc list-inside text-xs">
              <li>Paste any social media content</li>
              <li>AI analyzes for manipulation techniques</li>
              <li>See a neutralized version without emotional hooks</li>
              <li>Learn to recognize these patterns yourself</li>
            </ul>
          </div>

          <div className="flex items-center justify-between text-xs pt-4 border-t border-zinc-800">
            <span className="text-zinc-600">Version {APP_CONFIG.version}</span>
            <span className="text-zinc-600">Powered by Local AI</span>
          </div>
        </div>
      </div>

      {/* Reset Setup */}
      <div className="text-center pt-4">
        <button
          onClick={() => {
            localStorage.removeItem('fw_setup_complete');
            localStorage.removeItem('fw_persona');
            window.location.reload();
          }}
          className="text-xs text-zinc-600 hover:text-zinc-400 underline"
        >
          Reset Setup Wizard
        </button>
      </div>
    </div>
  );
};

export default App;
