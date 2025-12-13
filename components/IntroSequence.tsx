
import React, { useState, useEffect, useRef } from 'react';
import { GuardianCard } from './GuardianCard';
import { GuardianCard as GuardianCardType } from '../types';
import { 
  Shield, ArrowRight, Play, AlertTriangle, Sparkles, HelpCircle, 
  CheckCircle, Smartphone, Brain, Zap, Lock, Phone, Activity, 
  MessageSquare, ChevronRight, X 
} from 'lucide-react';

interface IntroSequenceProps {
  onEnter: () => void;
}

// Mock card for the intro sequence
const DEMO_CARD: GuardianCardType = {
  id: '#84291',
  title: 'Swift Guardian',
  rarity: 'Epic',
  stats: { guard: 85, sight: 72, speed: 94 },
  level: 5,
  timestamp: 'Today'
};

export const IntroSequence: React.FC<IntroSequenceProps> = ({ onEnter }) => {
  const [frame, setFrame] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    // PACING STRATEGY (Based on Prompt):
    const timings = [
      // SEGMENT 1: Problem Stats (28s)
      7000, // 0: 95% teens
      7000, // 1: 42% teen girls
      7000, // 2: Abstract feed visualization
      7000, // 3: Current solutions block content

      // SEGMENT 2: Transition (7s)
      7000, // 4: What if there was another way?

      // SEGMENT 3: Solution Reveal (25s)
      5000, // 5: Introducing FeelingWise
      7000, // 6: Toxic Card (Left)
      8000, // 7: Neutralized Transformation
      5000, // 8: Same info, zero manipulation

      // SEGMENT 4: Child Mode (22s)
      8000, // 9: iPhone feed "Invisible Protection"
      8000, // 10: Guardian Card
      6000, // 11: Quiz

      // SEGMENT 5: Teen Mode (16s)
      6000, // 12: Analysis button pulse
      6000, // 13: Analysis panel expands
      4000, // 14: Think About It

      // SEGMENT 6: Adult Mode (16s)
      6000, // 15: Messages app scam
      6000, // 16: Warning overlay
      4000, // 17: Stats display

      // SEGMENT 7: Closing (15s)
      5000, // 18: Logo Pulse
      5000, // 19: Tagline
      3000, // 20: Powered by Gemini
      2000, // 21: Hackathon
      
      // FINAL CTA
      999999 // 22: CTA (Indefinite)
    ];

    if (frame < 22) {
      timer = setTimeout(() => {
        setFrame(prev => prev + 1);
      }, timings[frame]);
    }

    return () => clearTimeout(timer);
  }, [frame]);

  const skip = () => setFrame(22);

  // Attempt to play audio on first user interaction or mount if allowed
  useEffect(() => {
    if (audioRef.current) {
        audioRef.current.volume = 0.5;
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                // Auto-play was prevented. 
                // We rely on the user interface to play or just proceed silently.
                console.log("Audio autoplay prevented");
            });
        }
    }
  }, []);

  return (
    <div 
        className="fixed inset-0 bg-[#0a0a0a] z-[100] flex flex-col items-center justify-center text-white cursor-pointer select-none font-sans overflow-hidden" 
        onClick={frame < 22 ? skip : undefined}
    >
      {/* Optional Audio Element for Narration/Music */}
      <audio ref={audioRef} src="/assets/intro.mp3" loop />

      {/* Skip Button */}
      {frame < 22 && (
        <button 
          onClick={(e) => { e.stopPropagation(); skip(); }}
          className="absolute top-8 right-8 text-zinc-600 hover:text-white text-[10px] uppercase tracking-[0.2em] transition-colors z-50 mix-blend-difference"
        >
          SKIP INTRO
        </button>
      )}

      <div className="max-w-6xl px-8 text-center w-full relative min-h-[500px] flex items-center justify-center">
        
        {/* --- SEGMENT 1: PROBLEM STATS (Frames 0-3) --- */}

        {/* FRAME 0: 95% Stats */}
        {frame === 0 && (
          <div className="animate-in fade-in duration-[2000ms] ease-out">
            <h1 className="text-4xl md:text-6xl font-light tracking-wide text-zinc-100 leading-tight">
              Every day, <span className="font-bold text-white">95%</span> of teens<br />scroll through social media.
            </h1>
          </div>
        )}

        {/* FRAME 1: 42% Stats */}
        {frame === 1 && (
          <div className="animate-in fade-in duration-[2000ms] ease-out">
            <h1 className="text-3xl md:text-5xl font-light tracking-wide text-zinc-100 leading-tight mb-8">
              <span className="font-bold text-white">42%</span> of teen girls say it makes them<br />feel worse about themselves.
            </h1>
            <p className="text-zinc-500 font-mono text-xs uppercase tracking-[0.2em] animate-in fade-in slide-in-from-bottom-2 duration-1000 delay-1000">
              — Internal Meta Research
            </p>
          </div>
        )}

        {/* FRAME 2: Abstract Visualization */}
        {frame === 2 && (
          <div className="w-full max-w-lg grid grid-cols-2 gap-4 animate-in fade-in duration-1000">
             {[1,2,3,4].map((i) => (
               <div key={i} className={`h-32 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 relative overflow-hidden ${i === 2 || i === 3 ? 'border-red-900/50' : ''}`}>
                  <div className="flex gap-3 mb-3">
                     <div className="w-8 h-8 rounded-full bg-zinc-800"></div>
                     <div className="space-y-1">
                        <div className="w-20 h-2 bg-zinc-800 rounded"></div>
                        <div className="w-12 h-2 bg-zinc-800 rounded"></div>
                     </div>
                  </div>
                  <div className="space-y-2">
                     <div className="w-full h-2 bg-zinc-800/50 rounded"></div>
                     <div className="w-3/4 h-2 bg-zinc-800/50 rounded"></div>
                  </div>
                  {(i === 2 || i === 3) && (
                     <div className="absolute inset-0 bg-red-500/10 flex items-center justify-center animate-pulse">
                        <AlertTriangle className="text-red-500 opacity-50" size={32} />
                     </div>
                  )}
               </div>
             ))}
          </div>
        )}

        {/* FRAME 3: Current Solutions */}
        {frame === 3 && (
          <div className="space-y-8 animate-in fade-in duration-1000">
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-zinc-500 line-through decoration-red-500/50">
              Current solutions block content.
            </h1>
            <h2 className="text-2xl md:text-4xl font-medium text-white tracking-wide animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-1000">
              Kids find workarounds.<br />The problem persists.
            </h2>
          </div>
        )}


        {/* --- SEGMENT 2: TRANSITION (Frame 4) --- */}

        {frame === 4 && (
          <div className="animate-in fade-in zoom-in-95 duration-[2000ms] ease-out">
            <h1 className="text-5xl md:text-7xl font-light tracking-tighter text-white">
              What if there was<br /><span className="font-serif italic text-indigo-400">another way?</span>
            </h1>
          </div>
        )}


        {/* --- SEGMENT 3: SOLUTION REVEAL (Frames 5-8) --- */}

        {/* FRAME 5: Logo Reveal */}
        {frame === 5 && (
          <div className="animate-in fade-in zoom-in-90 duration-1000">
            <div className="relative inline-block mb-8">
               <div className="absolute -inset-10 bg-indigo-500/20 rounded-full blur-3xl animate-pulse"></div>
               <div className="relative w-24 h-24 bg-zinc-900 rounded-2xl flex items-center justify-center border border-white/10 mx-auto shadow-2xl">
                   <span className="text-6xl font-bold bg-gradient-to-br from-indigo-400 to-emerald-400 bg-clip-text text-transparent">F</span>
               </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white">
               Introducing <span className="bg-gradient-to-r from-indigo-400 to-emerald-400 bg-clip-text text-transparent">FeelingWise</span>
            </h1>
          </div>
        )}

        {/* FRAME 6 & 7: Transformation */}
        {(frame === 6 || frame === 7) && (
          <div className="w-full relative h-[400px] flex items-center justify-center">
             
             {/* LEFT CARD: TOXIC */}
             <div className={`absolute transition-all duration-1000 ease-in-out ${
                frame === 6 
                  ? 'left-1/2 -translate-x-1/2 scale-100 opacity-100' 
                  : 'left-[15%] -translate-x-1/2 scale-90 opacity-40 blur-[2px]'
             }`}>
                <div className="w-[320px] bg-zinc-900 border border-red-500/50 p-6 rounded-2xl shadow-[0_0_50px_rgba(239,68,68,0.1)] relative overflow-hidden">
                   <div className="absolute top-0 inset-x-0 h-1 bg-red-500"></div>
                   <div className="flex items-center gap-2 mb-4 text-red-500 font-bold uppercase text-xs tracking-widest">
                      <AlertTriangle size={14} /> Original
                   </div>
                   <p className="text-lg font-medium text-red-100 leading-relaxed font-serif">
                     "You're DISGUSTING if you don't have a beach body. NO EXCUSES."
                   </p>
                </div>
             </div>

             {/* ANIMATED ARROW */}
             {frame === 7 && (
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 animate-in fade-in zoom-in duration-500">
                   <div className="bg-zinc-800 p-3 rounded-full border border-zinc-700 shadow-xl">
                      <ArrowRight className="text-white w-8 h-8" />
                   </div>
                </div>
             )}

             {/* RIGHT CARD: NEUTRALIZED */}
             {frame === 7 && (
               <div className="absolute right-[15%] top-1/2 -translate-y-1/2 translate-x-1/2 w-[320px] z-20 animate-in slide-in-from-right-8 fade-in duration-1000">
                  <div className="bg-zinc-900 border border-emerald-500/50 p-6 rounded-2xl shadow-[0_0_80px_rgba(16,185,129,0.2)] relative overflow-hidden">
                     <div className="absolute top-0 inset-x-0 h-1 bg-emerald-500"></div>
                     <div className="flex items-center gap-2 mb-4 text-emerald-500 font-bold uppercase text-xs tracking-widest">
                        <Shield size={14} /> Neutralized
                     </div>
                     <p className="text-lg font-medium text-emerald-100 leading-relaxed">
                       "This account believes fitness goals are important. People have different timelines that work for them."
                     </p>
                     <div className="absolute bottom-4 right-4 text-emerald-500/20">
                        <Sparkles size={40} />
                     </div>
                  </div>
               </div>
             )}
          </div>
        )}

        {/* FRAME 8: Benefit Statement */}
        {frame === 8 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h1 className="text-3xl md:text-5xl font-medium tracking-tight text-white leading-tight mb-8">
              Same information.<br />
              <span className="font-bold text-emerald-400">Zero manipulation.</span>
            </h1>
            <h2 className="text-xl md:text-2xl text-indigo-400 font-medium animate-pulse">
               Not a blocker. A neutralizer.
            </h2>
          </div>
        )}


        {/* --- SEGMENT 4: CHILD MODE (Frames 9-11) --- */}

        {/* FRAME 9: Child Mode Phone */}
        {frame === 9 && (
          <div className="flex flex-col items-center animate-in fade-in slide-in-from-bottom-8 duration-700">
             <div className="relative w-[280px] h-[520px] bg-black border-[8px] border-zinc-800 rounded-[3rem] overflow-hidden shadow-2xl ring-1 ring-white/10 mb-8">
                {/* Mock Header */}
                <div className="bg-zinc-900 p-4 border-b border-white/5 flex items-center justify-between">
                   <div className="w-16 h-4 bg-zinc-800 rounded-full"></div>
                   <Shield size={16} className="text-emerald-500" />
                </div>
                {/* Mock Feed */}
                <div className="p-4 space-y-4">
                   <div className="bg-zinc-900 rounded-xl p-3 border border-emerald-500/20 relative overflow-hidden">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500"></div>
                      <div className="flex gap-2 mb-2">
                         <div className="w-8 h-8 rounded-full bg-zinc-800"></div>
                         <div className="flex-1 space-y-1">
                            <div className="w-20 h-3 bg-zinc-800 rounded"></div>
                         </div>
                      </div>
                      <div className="text-xs text-emerald-100 font-medium">
                        "Some believe that fitness takes time and patience."
                      </div>
                   </div>
                   <div className="bg-zinc-900 rounded-xl p-3 border border-white/5 opacity-50">
                      <div className="w-full h-24 bg-zinc-800/30 rounded-lg"></div>
                   </div>
                </div>
             </div>
             <p className="text-2xl text-emerald-400 font-bold">Invisible Protection</p>
          </div>
        )}

        {/* FRAME 10: Guardian Card */}
        {frame === 10 && (
          <div className="flex items-center gap-8 animate-in fade-in duration-700">
             <div className="relative w-[280px] h-[520px] bg-black border-[8px] border-zinc-800 rounded-[3rem] overflow-hidden opacity-50 scale-90">
                {/* Background Phone */}
             </div>
             <div className="absolute left-1/2 -translate-x-1/2 scale-110 z-10 shadow-[0_0_100px_rgba(168,85,247,0.3)] rounded-3xl animate-in zoom-in-75 duration-500">
                <GuardianCard card={DEMO_CARD} />
             </div>
             <div className="absolute bottom-10 left-0 right-0 text-center">
                <h2 className="text-3xl font-bold text-white mb-2">Guardian Cards</h2>
                <p className="text-zinc-400">Gamifying safety.</p>
             </div>
          </div>
        )}

        {/* FRAME 11: Quiz */}
        {frame === 11 && (
          <div className="flex flex-col items-center animate-in fade-in duration-500">
             <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-8 shadow-2xl max-w-md w-full mb-8">
                <div className="flex justify-between items-center mb-6">
                   <h3 className="text-indigo-400 font-bold uppercase text-xs flex items-center gap-2">
                     <HelpCircle size={14} /> Daily Quiz
                   </h3>
                </div>
                <h4 className="text-xl font-bold text-white mb-6">
                  "If a post says 'HURRY OR YOU'LL REGRET IT', what trick is that?"
                </h4>
                <div className="w-full p-4 rounded-xl border bg-emerald-900/30 border-emerald-500 text-emerald-200 flex justify-between items-center">
                   The Rush Trick
                   <CheckCircle size={20} />
                </div>
             </div>
             <p className="text-2xl text-white font-medium">Building emotional immunity</p>
          </div>
        )}


        {/* --- SEGMENT 5: TEEN MODE (Frames 12-14) --- */}

        {/* FRAME 12: Teen Analysis Button */}
        {frame === 12 && (
          <div className="flex flex-col items-center animate-in fade-in slide-in-from-bottom-8 duration-700">
             <div className="relative w-[280px] h-[520px] bg-black border-[8px] border-zinc-800 rounded-[3rem] overflow-hidden shadow-2xl ring-1 ring-white/10 mb-8">
                <div className="p-4 pt-20 space-y-4">
                   <div className="bg-zinc-900 rounded-xl p-3 border border-white/5">
                      <div className="text-xs text-white mb-2">
                         "Everyone is getting RICH except you!!! This coin is going 100x..."
                      </div>
                      <div className="flex justify-between items-center mt-3 pt-2 border-t border-white/5">
                         <button className="bg-indigo-600 text-white text-[10px] px-3 py-1 rounded-full font-bold shadow-[0_0_15px_rgba(79,70,229,0.5)] animate-pulse scale-110">
                           Analysis ▼
                         </button>
                      </div>
                   </div>
                </div>
             </div>
             <p className="text-2xl text-indigo-400 font-bold">Guided Learning</p>
          </div>
        )}

        {/* FRAME 13: Analysis Panel */}
        {frame === 13 && (
          <div className="flex flex-col items-center animate-in fade-in duration-500">
             <div className="relative w-[280px] h-[520px] bg-black border-[8px] border-zinc-800 rounded-[3rem] overflow-hidden shadow-2xl ring-1 ring-white/10 mb-8">
                <div className="p-4 pt-20">
                   <div className="bg-[#0d0d0d] border border-zinc-800 rounded-xl p-3 shadow-xl animate-in slide-in-from-bottom-10 duration-500">
                      <div className="flex justify-between items-center mb-3 border-b border-zinc-800 pb-2">
                         <div className="flex items-center gap-1 text-[10px] font-bold text-indigo-400 uppercase">
                            <Brain size={12} /> Analysis
                         </div>
                         <div className="text-[10px] font-bold text-red-500">8/10 Severity</div>
                      </div>
                      <div className="space-y-2 mb-3">
                         <div className="bg-zinc-900 p-2 rounded border border-zinc-800">
                            <div className="text-[10px] font-bold text-indigo-300">FOMO (Fear Of Missing Out)</div>
                            <div className="text-[9px] text-zinc-500">Creates anxiety about exclusion.</div>
                         </div>
                         <div className="bg-indigo-900/20 p-2 rounded border border-indigo-500/20">
                            <div className="text-[9px] font-bold text-indigo-300 mb-1">WHY THIS WORKS</div>
                            <div className="text-[9px] text-zinc-300 leading-snug">
                               Triggers fear of social exclusion to bypass logical thinking mechanisms.
                            </div>
                         </div>
                      </div>
                   </div>
                </div>
             </div>
             <p className="text-xl text-zinc-300 font-medium">Learning to spot manipulation</p>
          </div>
        )}

        {/* FRAME 14: Think About It */}
        {frame === 14 && (
          <div className="flex flex-col items-center animate-in fade-in duration-500">
             <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-2xl p-8 max-w-md w-full mb-8 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
                <div className="flex items-center gap-3 mb-6">
                   <HelpCircle className="text-emerald-400" size={24} />
                   <h3 className="text-xl font-bold text-white">Think About It</h3>
                </div>
                <ul className="space-y-4 text-left">
                   <li className="flex gap-3 text-lg text-zinc-200">
                      <span className="text-emerald-500 font-bold">•</span>
                      Who profits if you believe this?
                   </li>
                   <li className="flex gap-3 text-lg text-zinc-200">
                      <span className="text-emerald-500 font-bold">•</span>
                      Is "100x returns" realistic?
                   </li>
                </ul>
             </div>
             <p className="text-xl text-zinc-300 font-medium">Training to protect themselves</p>
          </div>
        )}


        {/* --- SEGMENT 6: ADULT MODE (Frames 15-17) --- */}

        {/* FRAME 15: Scam Messages */}
        {frame === 15 && (
          <div className="flex flex-col items-center animate-in fade-in slide-in-from-bottom-8 duration-700">
             <div className="relative w-[280px] h-[520px] bg-black border-[8px] border-zinc-800 rounded-[3rem] overflow-hidden shadow-2xl ring-1 ring-white/10 mb-8">
                <div className="bg-zinc-900 p-4 border-b border-white/5 flex items-center justify-between">
                   <div className="text-xs font-bold text-zinc-400">Grandson (Unknown)</div>
                   <Phone size={14} className="text-zinc-500" />
                </div>
                <div className="p-4 space-y-4">
                   <div className="bg-zinc-800 rounded-2xl rounded-tl-none p-3 text-sm text-zinc-300 animate-in fade-in slide-in-from-left-2 duration-500">
                      I need $500 for bail. Please don't tell mom. Can you send gift cards?
                   </div>
                </div>
             </div>
             <p className="text-2xl text-amber-400 font-bold">Scam Protection</p>
          </div>
        )}

        {/* FRAME 16: Warning Overlay */}
        {frame === 16 && (
          <div className="flex flex-col items-center animate-in fade-in duration-500">
             <div className="relative w-[280px] h-[520px] bg-black border-[8px] border-zinc-800 rounded-[3rem] overflow-hidden shadow-2xl ring-1 ring-white/10 mb-8">
                <div className="absolute inset-x-0 bottom-16 p-3 animate-in slide-in-from-bottom-full duration-700">
                   <div className="bg-zinc-900/95 backdrop-blur-xl border-t border-amber-500/30 rounded-2xl shadow-2xl p-4 text-zinc-100 ring-1 ring-white/10">
                      <div className="flex items-center justify-between mb-2">
                         <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wide text-amber-500">
                            <AlertTriangle size={14} /> Scam Detected
                         </div>
                         <span className="bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded text-xs font-mono border border-amber-500/20">95%</span>
                      </div>
                      <div className="space-y-1.5 mt-3">
                         <div className="flex items-center gap-2 text-[10px] text-zinc-300 bg-black/40 p-1.5 rounded border border-zinc-800/50">
                            <Activity size={10} className="text-amber-500" /> Creating urgency
                         </div>
                         <div className="flex items-center gap-2 text-[10px] text-zinc-300 bg-black/40 p-1.5 rounded border border-zinc-800/50">
                            <Activity size={10} className="text-amber-500" /> Gift card payment
                         </div>
                      </div>
                   </div>
                </div>
             </div>
             <p className="text-xl text-zinc-300 font-medium">Real-time Analysis</p>
          </div>
        )}

        {/* FRAME 17: Stats */}
        {frame === 17 && (
          <div className="animate-in fade-in zoom-in-95 duration-500 flex flex-col items-center">
             <div className="bg-zinc-900/80 border border-zinc-800 p-8 rounded-3xl shadow-2xl backdrop-blur-md mb-8">
                <div className="flex items-center gap-12">
                   <div className="text-center">
                      <div className="text-5xl font-bold text-white mb-2">23</div>
                      <div className="text-sm text-zinc-500 font-bold uppercase tracking-widest">Scams Blocked</div>
                   </div>
                   <div className="w-px h-16 bg-zinc-800"></div>
                   <div className="text-center">
                      <div className="text-5xl font-bold text-emerald-400 mb-2">~$4.2k</div>
                      <div className="text-sm text-zinc-500 font-bold uppercase tracking-widest">Saved</div>
                   </div>
                </div>
             </div>
             <h2 className="text-2xl font-bold text-white">Protection for every generation.</h2>
          </div>
        )}


        {/* --- SEGMENT 7: CLOSING (Frames 18-22) --- */}

        {/* FRAME 18: Logo Pulse */}
        {frame === 18 && (
          <div className="animate-in fade-in zoom-in-75 duration-1000 flex flex-col items-center justify-center h-full">
             <div className="relative mb-8">
                <div className="absolute -inset-12 bg-indigo-500/30 rounded-full blur-[80px] animate-pulse"></div>
                <div className="absolute -inset-12 bg-emerald-500/30 rounded-full blur-[80px] translate-x-10 animate-pulse delay-75"></div>
                <div className="w-32 h-32 bg-zinc-900 rounded-3xl flex items-center justify-center border border-white/10 relative z-10 shadow-2xl">
                   <span className="text-7xl font-bold bg-gradient-to-br from-indigo-400 to-emerald-400 bg-clip-text text-transparent">F</span>
                </div>
             </div>
             <h1 className="text-6xl font-bold text-white tracking-tight">FeelingWise</h1>
          </div>
        )}

        {/* FRAME 19: Tagline */}
        {frame === 19 && (
          <div className="animate-in fade-in duration-1000 flex flex-col items-center">
             <div className="w-24 h-24 bg-zinc-900 rounded-2xl flex items-center justify-center border border-white/10 mb-8 shadow-2xl">
                <span className="text-5xl font-bold bg-gradient-to-br from-indigo-400 to-emerald-400 bg-clip-text text-transparent">F</span>
             </div>
             <h1 className="text-4xl md:text-5xl font-medium tracking-tight text-white leading-tight">
               Restoring <span className="text-indigo-400 font-bold">intellectual honesty</span><br />to the internet.
             </h1>
          </div>
        )}

        {/* FRAME 20 & 21: Credits */}
        {(frame === 20 || frame === 21) && (
          <div className="animate-in fade-in duration-1000 text-center">
             <h1 className="text-5xl font-bold text-white mb-12">FeelingWise</h1>
             <div className="space-y-6">
                <div className={`flex flex-col items-center gap-2 transition-opacity duration-1000 ${frame === 21 ? 'opacity-100' : 'opacity-100'}`}>
                   <Zap size={24} className="text-indigo-400" />
                   <div className="text-lg text-zinc-300">Powered by <span className="text-white font-bold">Gemini 3 Pro</span></div>
                </div>
                {frame === 21 && (
                  <div className="flex flex-col items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-1000">
                     <Brain size={24} className="text-emerald-400" />
                     <div className="text-lg text-zinc-300">Built for <span className="text-white font-bold">Google DeepMind Hackathon 2025</span></div>
                  </div>
                )}
             </div>
          </div>
        )}

        {/* FRAME 22: CTA (Final) */}
        {frame === 22 && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
             <div className="mb-12">
               <div className="inline-flex items-center justify-center w-20 h-20 bg-zinc-900 rounded-2xl ring-1 ring-white/10 relative overflow-hidden mb-6">
                   <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 to-emerald-500/20"></div>
                   <span className="text-4xl font-bold bg-gradient-to-br from-indigo-400 to-emerald-400 bg-clip-text text-transparent">F</span>
               </div>
               <h1 className="text-4xl md:text-5xl font-bold mb-2">FeelingWise</h1>
               <p className="text-zinc-500 font-medium">Protecting the digital generation.</p>
             </div>
             
             <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <button 
                  onClick={(e) => { e.stopPropagation(); onEnter(); }}
                  className="px-8 py-4 bg-white text-black rounded-full font-bold text-lg hover:bg-zinc-200 transition-all active:scale-95 flex items-center gap-2 w-full sm:w-auto justify-center shadow-[0_0_30px_rgba(255,255,255,0.1)]"
                >
                  Enter Simulator <ArrowRight size={20} />
                </button>
             </div>
          </div>
        )}

      </div>

      {/* Cinematic Progress Bar */}
      <div className="fixed bottom-0 left-0 h-1 bg-white/10 w-full">
         <div 
           className="h-full bg-white transition-all ease-linear" 
           style={{ 
             width: `${((frame + 1) / 23) * 100}%`,
             transitionDuration: frame === 22 ? '0ms' : '6000ms'
           }}
         ></div>
      </div>
    </div>
  );
};
