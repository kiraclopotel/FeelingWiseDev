
import React, { useState } from 'react';
import { PostCard } from './PostCard';
import { SAMPLE_POSTS, AGE_GROUPS } from '../constants';
import { AgeGroup, Platform, UserProgress } from '../types';
import { 
  Users, LayoutGrid, MessageCircle, Shield, 
  Twitter, Facebook, Instagram, Youtube, Video, AlertTriangle,
  Type, Eye, FileText, CheckCircle
} from 'lucide-react';
import { DeviceFrame } from './DeviceFrame';
import { ChildGamification } from './ChildGamification';

interface FeedTabProps {
  currentAge: AgeGroup;
  setAgeGroup: (age: AgeGroup) => void;
  userProgress: UserProgress;
  setUserProgress: React.Dispatch<React.SetStateAction<UserProgress>>;
}

export const FeedTab: React.FC<FeedTabProps> = ({ currentAge, setAgeGroup, userProgress, setUserProgress }) => {
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>('twitter');
  
  // Adult Mode States
  const [textSize, setTextSize] = useState<'normal' | 'large'>('normal');
  const [summarizerEnabled, setSummarizerEnabled] = useState(false);
  const [highContrast, setHighContrast] = useState(false);

  // Filter posts by platform
  const filteredPosts = SAMPLE_POSTS.filter(p => p.platform === selectedPlatform);
  const highRiskCount = filteredPosts.filter(p => p.severity > 5).length;

  const handleAddPoints = (amount: number) => {
    setUserProgress(prev => ({
      ...prev,
      points: prev.points + amount
    }));
  };

  const PlatformIcon = ({ p, active }: { p: Platform, active: boolean }) => {
    const size = 20;
    const color = active ? "text-white" : "text-[#8b8b8b]";
    switch (p) {
      case 'twitter': return <Twitter size={size} className={color} />;
      case 'facebook': return <Facebook size={size} className={color} />;
      case 'instagram': return <Instagram size={size} className={color} />;
      case 'youtube': return <Youtube size={size} className={color} />;
      case 'tiktok': return <Video size={size} className={color} />;
      default: return <LayoutGrid size={size} className={color} />;
    }
  };

  // Feed container always dark for consistency
  const feedBgClass = "bg-[#0d0d0d]";

  return (
    <div className="w-full max-w-[1600px] mx-auto flex flex-col lg:flex-row items-start justify-center gap-12 lg:gap-32 px-6 lg:px-12 pb-32">
      
      {/* LEFT COLUMN: Unified Mission Control */}
      <div className="flex-1 w-full max-w-lg mx-auto lg:mx-0 lg:sticky lg:top-24 space-y-6 animate-in slide-in-from-left-4 fade-in duration-500 order-2 lg:order-1">
        
        {/* UNIFIED CARD STRUCTURE */}
        <div className="bg-[#1a1a1a]/50 backdrop-blur-md border border-[#2a2a2a] rounded-3xl overflow-hidden shadow-2xl transition-all duration-500">
           
           {/* Unified Header */}
           <div className="bg-[#1a1a1a]/80 px-6 py-4 border-b border-[#2a2a2a] flex items-center justify-between">
             <div className="flex items-center gap-2">
               <div className={`w-2 h-2 rounded-full ${currentAge === 'child' ? 'bg-emerald-500' : 'bg-indigo-500'} animate-pulse`}></div>
               <span className="text-xs font-mono uppercase tracking-widest text-[#8b8b8b]">
                 {currentAge === 'child' ? 'Safe Mode Active' : 'Simulation Active'}
               </span>
             </div>
             <span className="text-[10px] bg-white/5 border border-white/10 px-2 py-0.5 rounded text-[#8b8b8b]">v1.2.0</span>
           </div>

           <div className="p-6">
             <h3 className="text-[#8b8b8b] text-[11px] font-bold uppercase tracking-widest mb-4">Protection Mode</h3>
             
             {/* Persona Selector - Always Visible for easy switching */}
             <div className="grid grid-cols-1 gap-3 mb-6">
                {AGE_GROUPS.map((group) => {
                  const Icon = group.icon;
                  const isActive = currentAge === group.id;
                  return (
                    <button
                      key={group.id}
                      onClick={() => setAgeGroup(group.id)}
                      className={`relative flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 ${
                        isActive 
                          ? 'bg-gradient-to-r from-indigo-900/30 to-purple-900/10 border-indigo-500/30 shadow-lg' 
                          : 'bg-[#0a0a0a]/30 border-transparent hover:bg-[#0a0a0a] hover:border-[#2a2a2a]'
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${isActive ? 'bg-indigo-500/20 text-indigo-300' : 'bg-[#2a2a2a]/50 text-[#8b8b8b]'}`}>
                        <Icon size={24} fill={isActive ? "currentColor" : "none"} />
                      </div>
                      <div className="text-left flex-1">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className={`text-sm font-bold ${isActive ? 'text-indigo-200' : 'text-zinc-300'}`}>
                            {group.name}
                          </span>
                          {isActive && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/20">Active</span>}
                        </div>
                        <div className="text-xs text-[#8b8b8b]">{group.description}</div>
                      </div>
                    </button>
                  );
                })}
             </div>

             {/* Dynamic Content Area based on Age Group */}
             {currentAge === 'child' ? (
                /* Child Mode Content */
                <div className="animate-in fade-in slide-in-from-bottom-2">
                   <div className="h-px bg-white/5 my-6"></div>
                   <h3 className="text-[#8b8b8b] text-[11px] font-bold uppercase tracking-widest mb-4">Your Progress</h3>
                   <ChildGamification progress={userProgress} setProgress={setUserProgress} />
                </div>
             ) : (
                /* Teen/Adult Mode Content */
                <div className="animate-in fade-in slide-in-from-bottom-2">
                     {/* Adult Mode Specific Controls */}
                     {currentAge === 'adult' && (
                        <div className="mb-6 p-4 bg-[#0a0a0a]/50 border border-[#2a2a2a] rounded-xl">
                           <h3 className="text-[#8b8b8b] text-[10px] font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                             <Shield size={10} /> Adult Accessibility & Protection
                           </h3>
                           <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                 <div className="flex items-center gap-2 text-sm text-zinc-300">
                                   <Type size={14} className="text-[#8b8b8b]" /> Larger Text
                                 </div>
                                 <button 
                                   onClick={() => setTextSize(prev => prev === 'normal' ? 'large' : 'normal')}
                                   className={`w-10 h-5 rounded-full transition-colors relative ${textSize === 'large' ? 'bg-indigo-600' : 'bg-[#2a2a2a]'}`}
                                 >
                                   <div className={`absolute top-1 left-1 bg-white w-3 h-3 rounded-full transition-transform ${textSize === 'large' ? 'translate-x-5' : ''}`}></div>
                                 </button>
                              </div>
                              <div className="flex items-center justify-between">
                                 <div className="flex items-center gap-2 text-sm text-zinc-300">
                                   <FileText size={14} className="text-[#8b8b8b]" /> Context Summarizer
                                 </div>
                                 <button 
                                   onClick={() => setSummarizerEnabled(!summarizerEnabled)}
                                   className={`w-10 h-5 rounded-full transition-colors relative ${summarizerEnabled ? 'bg-indigo-600' : 'bg-[#2a2a2a]'}`}
                                 >
                                   <div className={`absolute top-1 left-1 bg-white w-3 h-3 rounded-full transition-transform ${summarizerEnabled ? 'translate-x-5' : ''}`}></div>
                                 </button>
                              </div>
                              <div className="flex items-center justify-between">
                                 <div className="flex items-center gap-2 text-sm text-zinc-300">
                                   <Eye size={14} className="text-[#8b8b8b]" /> High Contrast Analysis
                                 </div>
                                 <button 
                                   onClick={() => setHighContrast(!highContrast)}
                                   className={`w-10 h-5 rounded-full transition-colors relative ${highContrast ? 'bg-indigo-600' : 'bg-[#2a2a2a]'}`}
                                 >
                                   <div className={`absolute top-1 left-1 bg-white w-3 h-3 rounded-full transition-transform ${highContrast ? 'translate-x-5' : ''}`}></div>
                                 </button>
                              </div>
                           </div>
                        </div>
                     )}

                     <div className="h-px bg-white/5 my-6"></div>

                     {/* Platform Selector */}
                     <h3 className="text-[#8b8b8b] text-[11px] font-bold uppercase tracking-widest mb-4">Select Platform</h3>
                     <div className="flex justify-between items-center bg-[#0a0a0a]/50 p-2 rounded-2xl border border-[#2a2a2a]">
                        {(['twitter', 'tiktok', 'instagram', 'facebook', 'youtube'] as Platform[]).map(p => (
                           <button
                             key={p}
                             onClick={() => setSelectedPlatform(p)}
                             className={`relative group flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all duration-300 ${
                               selectedPlatform === p 
                                 ? 'bg-[#2a2a2a] text-white shadow-lg scale-100 ring-1 ring-white/10' 
                                 : 'text-[#8b8b8b] hover:bg-[#1a1a1a] hover:text-zinc-300'
                             }`}
                           >
                             <PlatformIcon p={p} active={selectedPlatform === p} />
                             <span className="text-[9px] font-medium capitalize opacity-60 group-hover:opacity-100 transition-opacity">
                               {p}
                             </span>
                             {selectedPlatform === p && (
                               <div className="absolute -bottom-1 w-1 h-1 rounded-full bg-indigo-500"></div>
                             )}
                           </button>
                        ))}
                     </div>
                </div>
             )}
           </div>
        </div>

        {/* Live Stats Card (Teen/Adult Only) */}
        {currentAge !== 'child' && (
          <div className="bg-gradient-to-br from-[#1a1a1a] to-black border border-[#2a2a2a] rounded-3xl p-6 shadow-xl relative overflow-hidden animate-in fade-in slide-in-from-bottom-4">
             <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>
             
             <h3 className="text-[#8b8b8b] text-[11px] font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
               <AlertTriangle size={12} />
               Exposure Risk Analysis
             </h3>
             
             <div className="flex items-center gap-6">
                <div>
                  <div className="text-4xl font-bold text-white tracking-tight">{filteredPosts.length}</div>
                  <div className="text-[11px] text-[#8b8b8b] font-medium">Total Posts</div>
                </div>
                <div className="w-px h-10 bg-[#2a2a2a]"></div>
                <div>
                  <div className={`text-4xl font-bold tracking-tight ${highRiskCount > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
                    {highRiskCount}
                  </div>
                  <div className="text-[11px] text-[#8b8b8b] font-medium">Manipulative</div>
                </div>
                <div className="flex-1 text-right">
                  <div className="inline-flex flex-col items-end">
                    <span className="text-[10px] text-[#8b8b8b] mb-1">Platform Threat Level</span>
                    <div className="flex gap-1">
                      {[1,2,3,4,5].map(i => (
                        <div key={i} className={`w-1.5 h-6 rounded-sm ${i <= (highRiskCount > 1 ? 4 : 2) ? 'bg-amber-500' : 'bg-[#2a2a2a]'}`}></div>
                      ))}
                    </div>
                  </div>
                </div>
             </div>
          </div>
        )}

      </div>

      {/* RIGHT COLUMN: The Device Simulator */}
      <div className="flex-none animate-in slide-in-from-bottom-8 fade-in duration-700 delay-100 order-1 lg:order-2">
        <DeviceFrame>
           <div className={`sticky top-0 z-30 flex items-center justify-between px-4 h-12 backdrop-blur-xl transition-colors duration-300 ${
             selectedPlatform === 'tiktok' ? 'bg-transparent text-white absolute w-full' : 
             'bg-[#1a1a1a]/95 text-white border-b border-[#2a2a2a]'
           }`}>
              <div className="font-bold capitalize text-sm tracking-tight flex items-center gap-2">
                <PlatformIcon p={selectedPlatform} active={true} />
                {selectedPlatform}
              </div>

              {currentAge === 'child' && (
                <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  <Shield size={10} className="text-emerald-400" />
                  <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wide">Safe Mode</span>
                </div>
              )}
           </div>

           {/* FEED CONTAINER FIX: scrollbar-hide, padding */}
           <div className={`pb-20 pt-3 h-full overflow-y-auto scrollbar-hide ${textSize === 'large' ? 'text-lg' : ''} ${selectedPlatform === 'tiktok' ? 'snap-y snap-mandatory' : ''} ${feedBgClass}`}>
             
             {/* Summarizer Demo Overlay for Adult Mode */}
             {currentAge === 'adult' && summarizerEnabled && (
               <div className="p-4 sticky top-1 z-20">
                 <div className="bg-indigo-900/90 backdrop-blur-md border border-indigo-500/30 p-4 rounded-xl shadow-xl">
                    <h4 className="text-indigo-300 text-xs font-bold uppercase mb-1 flex items-center gap-2">
                       <FileText size={12} /> AI Context Summary
                    </h4>
                    <p className="text-white text-xs leading-relaxed">
                       Feed trends indicate 65% of current content contains high-arousal emotion (Fear/Anger). Proceed with awareness.
                    </p>
                 </div>
               </div>
             )}

             <div className="space-y-3">
               {filteredPosts.map((post) => (
                 <div key={post.id} className={selectedPlatform === 'tiktok' ? 'snap-start h-[700px] flex items-center bg-black' : ''}>
                   <PostCard 
                      post={post} 
                      ageGroup={currentAge} 
                      onAddPoints={currentAge === 'child' ? handleAddPoints : undefined} 
                   />
                 </div>
               ))}
             </div>
             
             {filteredPosts.length === 0 && (
               <div className="flex flex-col items-center justify-center h-64 text-[#8b8b8b] space-y-3">
                 <LayoutGrid size={32} className="opacity-20" />
                 <span className="text-sm">No content loaded</span>
               </div>
             )}
           </div>

           <div className={`absolute bottom-0 inset-x-0 h-16 backdrop-blur-xl border-t flex justify-around items-center z-30 transition-colors duration-300 ${
              selectedPlatform === 'tiktok' ? 'bg-black text-white border-white/10' : 
              'bg-[#1a1a1a]/90 text-[#8b8b8b] border-[#2a2a2a]'
           }`}>
              <LayoutGrid size={22} className={selectedPlatform === 'instagram' ? 'text-white' : ''} />
              <div className="relative">
                <MessageCircle size={22} />
                <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-black"></div>
              </div>
              <div className="w-8 h-8 rounded-full bg-[#2a2a2a] border border-[#3a3a3a] flex items-center justify-center overflow-hidden">
                <Users size={16} className="text-[#8b8b8b]" />
              </div>
           </div>
        </DeviceFrame>

        <p className="text-center text-[#5a5a5a] text-[10px] mt-6 uppercase tracking-widest font-medium opacity-50">
          Device Simulator • Interactive Preview
        </p>

      </div>
    </div>
  );
};
