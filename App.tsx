
import React, { useState, useEffect } from 'react';
import { FeedTab } from './components/FeedTab';
import { AnalyzeTab } from './components/AnalyzeTab';
import { StatsTab } from './components/StatsTab';
import { AboutTab } from './components/AboutTab';
import { MessagesTab } from './components/MessagesTab';
import { IntroSequence } from './components/IntroSequence';
import { AgeGroup, UserProgress } from './types';
import { generateCard } from './services/gamificationService';
import { Home, Search, BarChart2, Info, MessageSquare, Settings, X, CheckCircle, Shield, Clapperboard } from 'lucide-react';

const INITIAL_PROGRESS: UserProgress = {
  points: 125, // Start with enough for a few actions
  level: 1,
  currentCard: generateCard(1),
  collection: [],
  quizCompletedToday: false
};
// Init collection
INITIAL_PROGRESS.collection.push(INITIAL_PROGRESS.currentCard);

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'feed' | 'analyze' | 'stats' | 'messages' | 'about'>('feed');
  const [currentAge, setAgeGroup] = useState<AgeGroup>('teenager');
  const [showSetup, setShowSetup] = useState(false);
  
  // Presentation Mode State
  const [showIntro, setShowIntro] = useState(true);
  const [presentationMode, setPresentationMode] = useState(true);
  
  // Lifted Gamification State
  const [userProgress, setUserProgress] = useState<UserProgress>(INITIAL_PROGRESS);

  // Check for returning visitor to auto-skip intro if preferred (optional, keeping simple for now)
  useEffect(() => {
    const hasSeenIntro = localStorage.getItem('fw_intro_seen');
    if (hasSeenIntro) {
      // setShowIntro(false); // Uncomment to skip on reload during dev
    }
  }, []);

  const handleEnterApp = () => {
    localStorage.setItem('fw_intro_seen', 'true');
    setShowIntro(false);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'feed':
        return (
          <FeedTab 
            currentAge={currentAge} 
            setAgeGroup={setAgeGroup} 
            userProgress={userProgress}
            setUserProgress={setUserProgress}
          />
        );
      case 'analyze':
        return <AnalyzeTab />;
      case 'stats':
        return <StatsTab />;
      case 'messages':
        return <MessagesTab />;
      case 'about':
        return <AboutTab />;
    }
  };

  // Render Intro Sequence
  if (showIntro) {
    return <IntroSequence onEnter={handleEnterApp} />;
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
            <p className="text-[10px] text-[#8b8b8b] font-medium tracking-wider uppercase">AI Feed Simulator</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
           {/* Presentation Mode Toggle */}
           <button
             onClick={() => setPresentationMode(!presentationMode)}
             className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${
               presentationMode 
                 ? 'bg-indigo-900/20 border-indigo-500/50 text-indigo-400' 
                 : 'bg-[#1a1a1a] border-[#2a2a2a] text-[#8b8b8b]'
             }`}
           >
             <Clapperboard size={14} />
             <span className="text-xs font-bold uppercase tracking-wide">Presentation Mode</span>
             <div className={`w-2 h-2 rounded-full ${presentationMode ? 'bg-indigo-500 animate-pulse' : 'bg-zinc-700'}`}></div>
           </button>

           <button 
             onClick={() => setShowSetup(true)}
             className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] hover:border-[#3a3a3a] transition-colors group"
           >
             <Settings size={14} className="text-[#8b8b8b] group-hover:text-[#e5e5e5] transition-colors" />
             <span className="text-xs font-medium text-[#8b8b8b] group-hover:text-[#e5e5e5]">Setup</span>
           </button>
           <span className="hidden sm:block px-2 py-1 rounded bg-[#1a1a1a] border border-[#2a2a2a] text-[10px] text-[#5a5a5a] font-mono">
             v1.2.0
           </span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 px-4 md:px-0 relative z-10 pt-24 pb-28 overflow-y-auto scroll-smooth">
        {renderContent()}
      </main>

      {/* Floating Bottom Navigation */}
      <nav className="fixed bottom-12 left-1/2 -translate-x-1/2 z-50 w-full max-w-[420px] px-4">
        <div className="bg-[#1a1a1a]/90 backdrop-blur-xl border border-[#2a2a2a] rounded-2xl shadow-2xl shadow-black/50 p-2 flex justify-between items-center ring-1 ring-white/5">
          <NavButton 
            active={activeTab === 'feed'} 
            onClick={() => setActiveTab('feed')} 
            icon={<Home size={22} />} 
            label="Feed" 
          />
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
            active={activeTab === 'messages'} 
            onClick={() => setActiveTab('messages')} 
            icon={<MessageSquare size={22} />} 
            label="Messages" 
          />
          <NavButton 
            active={activeTab === 'about'} 
            onClick={() => setActiveTab('about')} 
            icon={<Info size={22} />} 
            label="About" 
          />
        </div>
      </nav>

      {/* Hackathon Footer */}
      <div className="fixed bottom-0 inset-x-0 bg-black/80 backdrop-blur-md border-t border-[#2a2a2a] py-1.5 z-[60] flex justify-center items-center pointer-events-none">
        <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></span>
          FeelingWise v1.0 • Powered by Gemini 3 Pro • DeepMind Hackathon 2025
        </p>
      </div>

      {/* Setup Modal */}
      {showSetup && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
           <div className="w-full max-w-md bg-[#1a1a1a] border border-[#2a2a2a] rounded-3xl shadow-2xl p-6 relative animate-in zoom-in-95 duration-200">
              <button 
                onClick={() => setShowSetup(false)}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-[#2a2a2a] text-[#8b8b8b] hover:text-[#e5e5e5] transition-colors"
              >
                <X size={20} />
              </button>

              <h2 className="text-xl font-bold text-[#e5e5e5] mb-2 flex items-center gap-2">
                <Settings size={20} className="text-indigo-400" /> Setup & Configuration
              </h2>
              <p className="text-sm text-[#8b8b8b] mb-6">Connect your social feeds to enable real-time neutralization.</p>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="text-[10px] uppercase font-bold text-[#5a5a5a] tracking-wider mb-1.5 block">API Key</label>
                  <div className="flex items-center gap-2 bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl p-3">
                    <div className="text-emerald-500"><Shield size={16} /></div>
                    <code className="text-sm font-mono text-[#e5e5e5] flex-1">fw_demo_8f4k2m9x7h3j5n1p</code>
                    <CheckCircle size={16} className="text-emerald-500" />
                  </div>
                  <div className="flex items-center gap-1.5 mt-2 text-[10px] text-emerald-500 font-medium px-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Demo Mode Active
                  </div>
                </div>

                <div>
                   <label className="text-[10px] uppercase font-bold text-[#5a5a5a] tracking-wider mb-2 block">Connected Platforms</label>
                   <div className="grid grid-cols-2 gap-2">
                      {['Twitter/X', 'TikTok', 'Instagram', 'Facebook', 'YouTube', 'Threads'].map((p) => (
                        <div key={p} className="flex items-center gap-2 bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg p-2.5">
                           <div className="w-4 h-4 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 text-[10px]">
                             <CheckCircle size={10} />
                           </div>
                           <span className="text-xs text-[#e5e5e5]">{p}</span>
                        </div>
                      ))}
                   </div>
                </div>
                
                {/* Intro Reset Button for Demo Purposes */}
                <div className="pt-2 border-t border-[#2a2a2a]">
                   <button 
                     onClick={() => { setShowSetup(false); setShowIntro(true); }}
                     className="w-full text-xs text-[#8b8b8b] hover:text-white py-2 flex items-center justify-center gap-2"
                   >
                     <Clapperboard size={12} /> Replay Intro Sequence
                   </button>
                </div>
              </div>

              <div className="bg-[#0d0d0d] rounded-xl p-4 border border-[#2a2a2a] mb-6">
                 <h4 className="text-xs font-bold text-[#e5e5e5] mb-2">How It Works</h4>
                 <ol className="text-xs text-[#8b8b8b] space-y-2 list-decimal list-inside">
                    <li>Paste your API key above</li>
                    <li>FeelingWise connects to your feeds</li>
                    <li>Content is neutralized in real-time</li>
                    <li>That's it - you're protected</li>
                 </ol>
              </div>

              <button 
                onClick={() => setShowSetup(false)}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-bold transition-all active:scale-95 shadow-lg shadow-indigo-500/20"
              >
                Save Configuration
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
    {/* Active Background Indicator */}
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
