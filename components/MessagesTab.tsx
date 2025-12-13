import React, { useState, useEffect, useRef } from 'react';
import { DeviceFrame } from './DeviceFrame';
import { SCAM_SCENARIOS } from '../constants';
import { 
  Play, RotateCcw, Shield, AlertTriangle, CheckCircle, 
  MessageSquare, Send, Info, Scan, Brain, Activity, ChevronRight
} from 'lucide-react';

export const MessagesTab: React.FC = () => {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(SCAM_SCENARIOS[0].id);
  const [isPlaying, setIsPlaying] = useState(false);
  const [messagesShown, setMessagesShown] = useState<number>(0);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const scrollEndRef = useRef<HTMLDivElement>(null);

  const scenario = SCAM_SCENARIOS.find(s => s.id === selectedScenarioId) || SCAM_SCENARIOS[0];

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    if (isPlaying && messagesShown < scenario.messages.length) {
      const nextMessage = scenario.messages[messagesShown];
      timeout = setTimeout(() => {
        setMessagesShown(prev => prev + 1);
        // NOTE: Auto-scroll removed per user request to not force screen down
        // setTimeout(() => scrollEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      }, nextMessage.delay);
    } else if (isPlaying && messagesShown === scenario.messages.length) {
       // Finished
       setTimeout(() => setShowAnalysis(true), 500);
    }
    return () => clearTimeout(timeout);
  }, [isPlaying, messagesShown, scenario]);

  const handlePlay = () => {
    setMessagesShown(0);
    setShowAnalysis(false);
    setIsPlaying(true);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setMessagesShown(0);
    setShowAnalysis(false);
  };

  const currentProbability = Math.min(
    Math.round((messagesShown / scenario.messages.length) * scenario.finalAnalysis.probability),
    scenario.finalAnalysis.probability
  );

  return (
    <div className="w-full max-w-6xl mx-auto px-4 pb-32 flex flex-col lg:flex-row gap-12 pt-8 items-start justify-center">
      
      {/* LEFT COLUMN: Controls & Analysis */}
      <div className="flex-1 w-full lg:sticky lg:top-24 space-y-6 order-2 lg:order-1 animate-in slide-in-from-left-4 fade-in duration-500">
        
        {/* Scenario Selector */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-xl">
           <div className="bg-zinc-950 px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
              <h3 className="text-zinc-400 text-xs font-bold uppercase tracking-widest">Select Simulation</h3>
              {isPlaying && <span className="text-[10px] text-indigo-400 animate-pulse font-mono">● SIMULATION ACTIVE</span>}
           </div>
           <div className="p-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SCAM_SCENARIOS.map(s => {
                const Icon = s.icon;
                return (
                  <button
                    key={s.id}
                    onClick={() => {
                        setSelectedScenarioId(s.id);
                        handleReset();
                    }}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
                      selectedScenarioId === s.id 
                        ? 'bg-zinc-800 text-white ring-1 ring-white/10' 
                        : 'bg-zinc-950/50 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${selectedScenarioId === s.id ? 'bg-indigo-500/20 text-indigo-300' : 'bg-zinc-800'}`}>
                      <Icon size={16} />
                    </div>
                    <div>
                      <div className="font-bold text-sm">{s.title}</div>
                      <div className="text-[10px] opacity-70">{s.contactName}</div>
                    </div>
                  </button>
                )
              })}
           </div>
           <div className="p-4 border-t border-zinc-800 flex justify-center">
              {!isPlaying || (messagesShown === scenario.messages.length && showAnalysis) ? (
                 <button 
                   onClick={handlePlay}
                   className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-full font-bold transition-transform active:scale-95 shadow-lg shadow-indigo-500/20"
                 >
                   <Play size={18} fill="currentColor" /> {messagesShown > 0 ? 'Replay Scenario' : 'Start Simulation'}
                 </button>
              ) : (
                 <button 
                   onClick={handleReset}
                   className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-8 py-3 rounded-full font-bold transition-transform active:scale-95"
                 >
                   <RotateCcw size={18} /> Reset
                 </button>
              )}
           </div>
        </div>

        {/* Real-time Analysis Card - UPDATED DESIGN: Calmer, Smart */}
        <div className={`bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl transition-all duration-500 ${isPlaying ? 'opacity-100 translate-y-0' : 'opacity-50 translate-y-4 grayscale'}`}>
           <div className="bg-zinc-900/50 px-6 py-4 border-b border-white/5 flex items-center gap-3">
             <div className="bg-indigo-500/10 p-2 rounded-full border border-indigo-500/20">
               <Brain size={18} className="text-indigo-400" />
             </div>
             <div>
               <h3 className="text-indigo-300 font-bold text-sm uppercase tracking-wide">Pattern Analysis Engine</h3>
               <div className="text-[10px] text-zinc-500 font-mono">Real-time heuristic scanning...</div>
             </div>
           </div>

           <div className="p-6 space-y-6">
              {/* Probability Meter */}
              <div>
                <div className="flex justify-between items-end mb-2">
                   <span className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Scam Likelihood</span>
                   <span className={`text-2xl font-mono font-bold ${currentProbability > 80 ? 'text-amber-500' : currentProbability > 50 ? 'text-indigo-400' : 'text-zinc-400'}`}>
                     {currentProbability}%
                   </span>
                </div>
                <div className="h-3 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800 relative">
                   {/* Tick marks */}
                   <div className="absolute inset-0 flex justify-between px-1">
                      {[...Array(10)].map((_, i) => <div key={i} className="w-px h-full bg-zinc-800/50"></div>)}
                   </div>
                   <div 
                     className={`h-full transition-all duration-500 ease-out ${
                        currentProbability > 80 ? 'bg-gradient-to-r from-amber-600 to-amber-500' : 
                        currentProbability > 50 ? 'bg-gradient-to-r from-indigo-600 to-indigo-400' : 
                        'bg-zinc-600'
                     }`}
                     style={{ width: `${currentProbability}%` }}
                   ></div>
                </div>
              </div>

              {/* Flags */}
              {showAnalysis && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 mb-4">
                     <h4 className="text-zinc-400 text-xs font-bold uppercase mb-2 flex items-center gap-2">
                       <Scan size={14} /> Pattern Match: {scenario.finalAnalysis.technique}
                     </h4>
                     <p className="text-zinc-300 text-sm leading-relaxed">{scenario.finalAnalysis.explanation}</p>
                  </div>

                  <div className="space-y-2">
                     <h4 className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest">Detection Signals</h4>
                     {scenario.finalAnalysis.flags.map((flag, i) => (
                       <div key={i} className="flex items-center gap-2 text-zinc-300 text-sm bg-black/40 p-2 rounded border border-zinc-800/50">
                          <Activity size={12} className="text-indigo-500" />
                          {flag}
                       </div>
                     ))}
                  </div>

                  <div className="mt-6 bg-indigo-900/10 border border-indigo-500/20 rounded-xl p-4">
                     <h4 className="text-indigo-300 text-xs font-bold uppercase mb-2 flex items-center gap-2">
                       <Shield size={14} /> Safety Recommendation
                     </h4>
                     <p className="text-zinc-200 text-sm font-medium">{scenario.finalAnalysis.recommendation}</p>
                  </div>
                </div>
              )}
           </div>
        </div>

      </div>

      {/* RIGHT COLUMN: Phone Simulator */}
      <div className="flex-none order-1 lg:order-2">
         <DeviceFrame>
            <div className="bg-black min-h-full flex flex-col">
               {/* Messages Header */}
               <div className="bg-zinc-900/80 backdrop-blur-md border-b border-white/10 p-4 sticky top-0 z-10 flex items-center gap-3 shadow-lg">
                  <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-zinc-400 font-bold">
                     {scenario.contactName.charAt(0)}
                  </div>
                  <div className="flex-1">
                     <div className="font-bold text-sm text-white">{scenario.contactName}</div>
                     <div className="text-[10px] text-zinc-500 font-medium">Text Message • Now</div>
                  </div>
                  <Info size={20} className="text-zinc-600" />
               </div>

               {/* Messages List */}
               <div className="flex-1 p-4 space-y-4 overflow-y-auto pb-20">
                  <div className="text-center text-[10px] text-zinc-600 uppercase font-medium my-4">Today 9:41 AM</div>
                  
                  {scenario.messages.slice(0, messagesShown).map((msg) => (
                     <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                        <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
                           msg.sender === 'user' 
                             ? 'bg-indigo-600 text-white rounded-br-none' 
                             : 'bg-zinc-800 text-zinc-200 rounded-bl-none border border-zinc-700'
                        }`}>
                           {msg.text}
                        </div>
                     </div>
                  ))}
                  
                  {isPlaying && messagesShown < scenario.messages.length && (
                    <div className="flex justify-start animate-pulse">
                       <div className="bg-zinc-900 rounded-2xl px-4 py-3 flex gap-1 items-center rounded-bl-none">
                          <div className="w-1.5 h-1.5 bg-zinc-600 rounded-full animate-bounce"></div>
                          <div className="w-1.5 h-1.5 bg-zinc-600 rounded-full animate-bounce delay-100"></div>
                          <div className="w-1.5 h-1.5 bg-zinc-600 rounded-full animate-bounce delay-200"></div>
                       </div>
                    </div>
                  )}

                  <div ref={scrollEndRef} />
               </div>

               {/* Input Area (Mock) */}
               <div className="p-3 bg-zinc-900 border-t border-white/10">
                  <div className="flex items-center gap-2 bg-black border border-zinc-800 rounded-full px-4 py-2 opacity-50 cursor-not-allowed">
                     <div className="bg-zinc-800 p-1 rounded-full"><MessageSquare size={12} className="text-zinc-500" /></div>
                     <span className="text-xs text-zinc-600 flex-1">Text Message</span>
                     <Send size={16} className="text-zinc-700" />
                  </div>
               </div>

               {/* Overlay for Adult Mode / Analysis when complete - UPDATED: Cleaner, Smart */}
               {showAnalysis && (
                  <div className="absolute inset-x-0 bottom-16 p-4 animate-in slide-in-from-bottom-full duration-700">
                     <div className="bg-zinc-900/95 backdrop-blur-xl border-t border-amber-500/30 rounded-2xl shadow-2xl p-4 text-zinc-100 ring-1 ring-white/10">
                        <div className="flex items-center justify-between mb-2">
                           <div className="flex items-center gap-2 font-bold text-sm uppercase tracking-wide text-amber-500">
                              <AlertTriangle size={16} /> 
                              Potential Risk Detected
                           </div>
                           <span className="bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded text-xs font-mono border border-amber-500/20">{currentProbability}%</span>
                        </div>
                        <p className="text-xs text-zinc-400 leading-relaxed mb-3">
                           Our model has identified behavioral patterns consistent with <strong>{scenario.finalAnalysis.technique}</strong>.
                        </p>
                        <button className="w-full bg-zinc-100 hover:bg-white text-black font-bold py-2.5 rounded-xl text-xs shadow-lg transition-colors flex items-center justify-center gap-2">
                           View Safety Protocol <ChevronRight size={14} />
                        </button>
                     </div>
                  </div>
               )}
            </div>
         </DeviceFrame>
      </div>

    </div>
  );
};