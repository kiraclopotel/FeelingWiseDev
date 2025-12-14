import React, { useState, useEffect } from 'react';
import { AnalyzeTab } from './components/AnalyzeTab';
import { StatsTab } from './components/StatsTab';
import { AboutTab } from './components/AboutTab';
import { SetupWizard } from './components/SetupWizard';
import { FirstRunWizard } from './components/FirstRunWizard';
import { AgeGroup, UserProgress } from './types';
import { generateCard } from './services/gamificationService';
import { isTauri, getSetupStatus } from './services/localAIService';
import { Search, BarChart2, Info, Settings, X, Shield, Cpu } from 'lucide-react';
import { AGE_GROUPS } from './constants';

const INITIAL_PROGRESS: UserProgress = {
  points: 0,
  level: 1,
  currentCard: generateCard(1),
  collection: [],
  quizCompletedToday: false
};
INITIAL_PROGRESS.collection.push(INITIAL_PROGRESS.currentCard);

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'analyze' | 'stats' | 'about'>('analyze');
  const [currentAge, setAgeGroup] = useState<AgeGroup>('adult');
  const [showSettings, setShowSettings] = useState(false);

  // Setup wizard state
  const [showSetupWizard, setShowSetupWizard] = useState(false);
  const [setupComplete, setSetupComplete] = useState(false);
  const [checkingSetup, setCheckingSetup] = useState(true);

  // Gamification state
  const [userProgress, setUserProgress] = useState<UserProgress>(INITIAL_PROGRESS);

  // Check if setup is needed on mount
  useEffect(() => {
    async function checkSetup() {
      // Load saved persona
      const savedPersona = localStorage.getItem('fw_persona');
      if (savedPersona) {
        setAgeGroup(savedPersona as AgeGroup);
      }

      // If not in Tauri, skip setup wizard
      if (!isTauri()) {
        setSetupComplete(true);
        setCheckingSetup(false);
        return;
      }

      // Check setup status from Tauri backend
      try {
        const status = await getSetupStatus();

        if (status.first_run_complete && status.ollama_running && status.model_available) {
          // Already set up
          setSetupComplete(true);
        } else {
          // Need setup - show parent-friendly wizard
          setShowSetupWizard(true);
        }
      } catch {
        // Error checking, show wizard
        setShowSetupWizard(true);
      }

      setCheckingSetup(false);
    }

    checkSetup();
  }, []);

  const handleSetupComplete = () => {
    localStorage.setItem('fw_setup_complete', 'true');
    setSetupComplete(true);
    setShowSetupWizard(false);
  };

  const handlePersonaChange = (persona: AgeGroup) => {
    setAgeGroup(persona);
    localStorage.setItem('fw_persona', persona);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'analyze':
        return <AnalyzeTab />;
      case 'stats':
        return <StatsTab />;
      case 'about':
        return <AboutTab />;
    }
  };

  // Show loading while checking setup
  if (checkingSetup) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center border border-white/10 mx-auto mb-4">
            <span className="text-3xl font-bold bg-gradient-to-br from-indigo-400 to-emerald-400 bg-clip-text text-transparent">F</span>
          </div>
          <p className="text-zinc-500 text-sm">Loading FeelingWise...</p>
        </div>
      </div>
    );
  }

  // Show setup wizard if needed
  if (showSetupWizard && !setupComplete) {
    return (
      <FirstRunWizard
        onComplete={handleSetupComplete}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e5e5e5] font-sans flex flex-col relative overflow-hidden selection:bg-indigo-500/30">

      {/* Background Gradients */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-900/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-emerald-900/10 rounded-full blur-[120px]" />
      </div>

      {/* Top Header */}
      <header className="fixed top-0 inset-x-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-md border-b border-[#2a2a2a] px-6 py-4 flex items-center justify-between transition-all duration-300">
        <div className="flex items-center gap-3 group cursor-pointer" onClick={() => setActiveTab('about')}>
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500 to-emerald-500 rounded-lg blur-md opacity-40 group-hover:opacity-60 transition-opacity" />
            <div className="relative w-10 h-10 bg-[#1a1a1a] rounded-lg flex items-center justify-center text-white font-bold text-xl ring-1 ring-white/10">
              <span className="bg-gradient-to-br from-indigo-400 to-emerald-400 bg-clip-text text-transparent">F</span>
            </div>
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-[#e5e5e5] group-hover:text-white transition-colors">FeelingWise</h1>
            <p className="text-[10px] text-[#8b8b8b] font-medium tracking-wider uppercase">Content Neutralizer</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* AI Status Indicator */}
          {isTauri() && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-900/20 border border-emerald-500/30">
              <Cpu size={14} className="text-emerald-400" />
              <span className="text-xs font-medium text-emerald-400">Local AI</span>
            </div>
          )}

          <button
            onClick={() => setShowSettings(true)}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] hover:border-[#3a3a3a] transition-colors group"
          >
            <Settings size={14} className="text-[#8b8b8b] group-hover:text-[#e5e5e5] transition-colors" />
            <span className="text-xs font-medium text-[#8b8b8b] group-hover:text-[#e5e5e5]">Settings</span>
          </button>
          <span className="hidden sm:block px-2 py-1 rounded bg-[#1a1a1a] border border-[#2a2a2a] text-[10px] text-[#5a5a5a] font-mono">
            v1.0.0
          </span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 px-4 md:px-0 relative z-10 pt-24 pb-28 overflow-y-auto scroll-smooth">
        {renderContent()}
      </main>

      {/* Floating Bottom Navigation */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-[320px] px-4">
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
            active={activeTab === 'about'}
            onClick={() => setActiveTab('about')}
            icon={<Info size={22} />}
            label="About"
          />
        </div>
      </nav>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#1a1a1a] border border-[#2a2a2a] rounded-3xl shadow-2xl p-6 relative animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowSettings(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-[#2a2a2a] text-[#8b8b8b] hover:text-[#e5e5e5] transition-colors"
            >
              <X size={20} />
            </button>

            <h2 className="text-xl font-bold text-[#e5e5e5] mb-2 flex items-center gap-2">
              <Settings size={20} className="text-indigo-400" /> Settings
            </h2>
            <p className="text-sm text-[#8b8b8b] mb-6">Configure FeelingWise to your preferences.</p>

            {/* Persona Selection */}
            <div className="mb-6">
              <label className="text-[10px] uppercase font-bold text-[#5a5a5a] tracking-wider mb-3 block">
                Protection Mode
              </label>
              <div className="space-y-2">
                {AGE_GROUPS.map((group) => {
                  const Icon = group.icon;
                  const isActive = currentAge === group.id;
                  return (
                    <button
                      key={group.id}
                      onClick={() => handlePersonaChange(group.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${
                        isActive
                          ? 'bg-indigo-900/30 border-indigo-500/50'
                          : 'bg-[#0a0a0a] border-[#2a2a2a] hover:border-[#3a3a3a]'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isActive ? 'bg-indigo-500/20 text-indigo-300' : 'bg-[#2a2a2a] text-[#8b8b8b]'
                      }`}>
                        <Icon size={20} />
                      </div>
                      <div className="text-left flex-1">
                        <div className="text-sm font-bold text-white">{group.name}</div>
                        <div className="text-xs text-[#8b8b8b]">{group.description}</div>
                      </div>
                      {isActive && (
                        <div className="w-2 h-2 rounded-full bg-indigo-500" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* AI Setup */}
            {isTauri() && (
              <div className="mb-6">
                <label className="text-[10px] uppercase font-bold text-[#5a5a5a] tracking-wider mb-3 block">
                  AI Configuration
                </label>
                <div className="bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <Cpu size={16} className="text-emerald-400" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">Local AI Active</div>
                      <div className="text-xs text-[#8b8b8b]">Content is processed on your device</div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      localStorage.removeItem('fw_setup_complete');
                      setShowSettings(false);
                      setSetupComplete(false);
                      setShowSetupWizard(true);
                    }}
                    className="w-full text-xs text-indigo-400 hover:text-indigo-300 py-2 flex items-center justify-center gap-2"
                  >
                    <Settings size={12} /> Re-run Setup Wizard
                  </button>
                </div>
              </div>
            )}

            <button
              onClick={() => setShowSettings(false)}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-bold transition-all active:scale-95 shadow-lg shadow-indigo-500/20"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const NavButton = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) => (
  <button
    onClick={onClick}
    className={`relative flex flex-col items-center justify-center w-full py-2 rounded-xl transition-all duration-300 group ${
      active ? 'text-white' : 'text-[#5a5a5a] hover:text-[#8b8b8b]'
    }`}
  >
    {active && (
      <div className="absolute inset-0 bg-white/5 rounded-xl animate-in fade-in zoom-in-95 duration-200" />
    )}

    <div className={`transition-transform duration-300 ${active ? 'scale-100 translate-y-0 text-indigo-400' : 'scale-90 translate-y-1 group-hover:scale-100 group-hover:translate-y-0'}`}>
      {icon}
    </div>

    <span className={`text-[9px] font-medium mt-1 transition-all duration-300 ${
      active ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0'
    }`}>
      {label}
    </span>
  </button>
);

export default App;
