
import React, { useState, useEffect } from 'react';
import { Post, AgeGroup, Comment } from '../types';
import { 
  AlertTriangle, Shield, Heart, Share2, MessageCircle, 
  MoreHorizontal, Repeat2, Bookmark, Send, ThumbsUp, 
  ThumbsDown, Play, CheckCircle2, Music2, Eye, EyeOff,
  Sparkles, X, Brain, HelpCircle, Info
} from 'lucide-react';

interface PostCardProps {
  post: Post;
  ageGroup: AgeGroup;
  onAddPoints?: (amount: number) => void;
}

export const PostCard: React.FC<PostCardProps> = ({ post, ageGroup, onAddPoints }) => {
  const isManipulative = post.severity > 0;
  
  // LOGIC FIX: Adults see Original by default (showOriginal=true). 
  // Children/Teens see Neutralized by default (showOriginal=false).
  const [showOriginal, setShowOriginal] = useState(ageGroup === 'adult');
  const [showAnalysis, setShowAnalysis] = useState(false);

  // Ensure state updates when mode changes (e.g. Teen -> Adult)
  useEffect(() => {
    setShowOriginal(ageGroup === 'adult');
  }, [ageGroup]);
  
  // If clean (severity 0), always show original.
  // If manipulative:
  //   - if showOriginal is true -> Show Original
  //   - if showOriginal is false -> Show Neutralized
  const displayText = isManipulative && !showOriginal ? post.neutralized : post.original;
  
  const toggleContent = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowOriginal(!showOriginal);
  };

  const toggleAnalysis = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!showAnalysis && onAddPoints) {
       onAddPoints(5); // Award points for reading analysis
    }
    setShowAnalysis(!showAnalysis);
  };

  const cardProps = { 
    post, 
    displayText, 
    ageGroup, 
    showOriginal, 
    toggleContent, 
    showAnalysis, 
    toggleAnalysis, 
    isManipulative 
  };
  
  // Platform renderers
  switch (post.platform) {
    case 'twitter': return <TwitterCard {...cardProps} />;
    case 'tiktok': return <TikTokCard {...cardProps} />;
    case 'instagram': return <InstagramCard {...cardProps} />;
    case 'facebook': return <FacebookCard {...cardProps} />;
    case 'youtube': return <YouTubeCard {...cardProps} />;
    default: return <div className="p-4 text-white">Unknown Platform</div>;
  }
};

interface PlatformCardProps {
    post: Post;
    displayText: string;
    ageGroup: AgeGroup;
    showOriginal: boolean;
    toggleContent: (e: React.MouseEvent) => void;
    showAnalysis: boolean;
    toggleAnalysis: (e: React.MouseEvent) => void;
    isManipulative: boolean;
}

// --- HELPER: DYNAMIC CONTENT GENERATION ---
const getTechniqueDetails = (techName: string, ageGroup: AgeGroup) => {
    const definitions: Record<string, any> = {
        "Fear Appeal": {
            child: { name: "Scare Trick", desc: "Trying to make you scared so you listen." },
            teen: { name: "Fear Appeal", desc: "Using scary language to bypass logical thinking." },
            adult: { name: "Fear Appeal", desc: "Inducing anxiety to prompt immediate reaction." }
        },
        "False Urgency": {
            child: { name: "Rush Trick", desc: "Saying 'Hurry!' so you don't think first." },
            teen: { name: "False Urgency", desc: "Creating fake time pressure to force a click." },
            adult: { name: "False Urgency", desc: "Artificial time constraints to force decision making." }
        },
        "Scapegoating": {
            child: { name: "Blame Trick", desc: "Blaming one person for big problems." },
            teen: { name: "Scapegoating", desc: "Unfairly blaming a group for complex issues." },
            adult: { name: "Scapegoating", desc: "Displacing aggression onto a marginalized target." }
        },
        "Shame": {
            child: { name: "Mean Trick", desc: "Making you feel bad about yourself." },
            teen: { name: "Shame/Guilt", desc: "Weaponizing insecurity to control behavior." },
            adult: { name: "Shame Mechanism", desc: "Leveraging social rejection fears." }
        },
        "FOMO": {
            child: { name: "Missing Out", desc: "Making you feel left out of the fun." },
            teen: { name: "FOMO", desc: "Fear Of Missing Out on trends or status." },
            adult: { name: "Scarcity/FOMO", desc: "Social pressure based on exclusion." }
        }
    };

    // Fallback for unknown techniques
    const def = definitions[Object.keys(definitions).find(k => techName.includes(k)) || ""] || {
        child: { name: "Tricky Words", desc: "Words used to confuse or trick you." },
        teen: { name: techName, desc: "A technique used to influence opinion." },
        adult: { name: techName, desc: "Rhetorical device for persuasion." }
    };

    return def[ageGroup === 'child' ? 'child' : ageGroup === 'adult' ? 'adult' : 'teen'];
};

// --- ANALYSIS PANEL COMPONENT ---
const AnalysisPanel: React.FC<{ post: Post, ageGroup: AgeGroup, onClose: (e: React.MouseEvent) => void }> = ({ post, ageGroup, onClose }) => {
    const isChild = ageGroup === 'child';
    const isAdult = ageGroup === 'adult';
    
    // Generate educational content based on the first few techniques
    const techniquesToShow = post.techniques.slice(0, 3).map(t => getTechniqueDetails(t, ageGroup));

    if (isChild) {
        return (
            <div className="mt-3 bg-indigo-950/50 border-2 border-indigo-500/50 rounded-2xl overflow-hidden animate-in slide-in-from-top-2 fade-in relative">
                <div className="bg-indigo-500/20 p-3 flex justify-between items-center border-b border-indigo-500/20">
                    <div className="flex items-center gap-2 font-bold text-indigo-200 text-sm">
                        <Sparkles size={16} className="text-amber-400" />
                        WISE SPOTTED A TRICK!
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full"><X size={14} /></button>
                </div>
                <div className="p-4">
                    <div className="space-y-3 mb-4">
                        {techniquesToShow.map((tech, i) => (
                            <div key={i} className="flex items-start gap-3">
                                <div className="mt-0.5">🦉</div>
                                <div>
                                    <div className="font-bold text-indigo-300 text-sm">{tech.name}</div>
                                    <div className="text-xs text-indigo-100/70">{tech.desc}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="bg-indigo-500/20 rounded-xl p-3 flex items-center gap-3">
                        <div className="bg-amber-400 text-amber-900 font-bold text-[10px] px-2 py-0.5 rounded-full">+2 XP</div>
                        <div className="text-xs text-indigo-200 font-bold">You're learning to spot them!</div>
                    </div>
                </div>
            </div>
        );
    }

    // Teen & Adult Layout
    return (
        <div className="mt-3 bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl overflow-hidden animate-in slide-in-from-top-2 fade-in shadow-2xl relative z-10">
            <div className="bg-[#1a1a1a] px-4 py-2 flex justify-between items-center border-b border-[#2a2a2a]">
                <div className="flex items-center gap-2 font-bold text-[#e5e5e5] text-xs uppercase tracking-wider">
                    <Brain size={14} className="text-indigo-400" /> Analysis
                </div>
                <button onClick={onClose} className="text-[#8b8b8b] hover:text-white"><X size={14} /></button>
            </div>
            
            <div className="p-4 space-y-4">
                {/* Severity Bar */}
                <div>
                    <div className="flex justify-between text-xs font-bold text-[#8b8b8b] mb-1">
                        <span>MANIPULATION SEVERITY</span>
                        <span className={post.severity > 7 ? 'text-red-400' : 'text-amber-400'}>{post.severity}/10</span>
                    </div>
                    <div className="h-1.5 w-full bg-[#0a0a0a] rounded-full overflow-hidden">
                        <div 
                            className={`h-full ${post.severity > 7 ? 'bg-red-500' : 'bg-amber-500'}`} 
                            style={{width: `${post.severity * 10}%`}}
                        />
                    </div>
                </div>

                {/* Techniques */}
                <div>
                    <div className="text-[10px] font-bold text-[#5a5a5a] uppercase tracking-wider mb-2">Techniques Detected</div>
                    <div className="space-y-2">
                        {techniquesToShow.map((tech, i) => (
                            <div key={i} className="bg-[#0a0a0a] p-2 rounded border border-[#2a2a2a]">
                                <div className="text-xs font-bold text-indigo-300">{tech.name}</div>
                                <div className="text-[11px] text-[#8b8b8b]">{tech.desc}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Educational Insight (Mocked for static data) */}
                {!isAdult && (
                    <div className="bg-indigo-900/10 border border-indigo-500/20 p-3 rounded-lg">
                        <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 mb-1">
                            <Info size={12} /> WHY THIS WORKS
                        </div>
                        <p className="text-xs text-[#e5e5e5] leading-relaxed">
                            This post uses <strong>High-Arousal Emotions</strong> (like anger or fear) which shuts down the logical part of your brain, making you want to react immediately without checking the facts.
                        </p>
                    </div>
                )}
                
                {/* Critical Thinking Questions */}
                <div className="bg-emerald-900/10 border border-emerald-500/20 p-3 rounded-lg">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 mb-1">
                        <HelpCircle size={12} /> THINK ABOUT IT
                    </div>
                    <ul className="text-xs text-[#e5e5e5] space-y-1 list-disc list-inside">
                        <li>Who benefits if you believe this?</li>
                        <li>Is the situation really this simple?</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};


// --- CONTROL BAR COMPONENT ---
const ControlBar: React.FC<{ 
    ageGroup: AgeGroup, 
    isManipulative: boolean, 
    showAnalysis: boolean, 
    toggleAnalysis: (e: React.MouseEvent) => void,
    showOriginal: boolean,
    toggleContent: (e: React.MouseEvent) => void
}> = ({ ageGroup, isManipulative, showAnalysis, toggleAnalysis, showOriginal, toggleContent }) => {
    
    if (!isManipulative) return null; // Clean posts don't need controls

    const isChild = ageGroup === 'child';
    const isAdult = ageGroup === 'adult';

    // Label Logic
    let toggleLabel = "";
    if (isAdult) {
        // Adult Mode: Defaults to Original (showOriginal=true)
        // Button should offer "See Neutralized"
        toggleLabel = showOriginal ? "See Neutralized" : "Show Original";
    } else {
        // Child/Teen Mode: Defaults to Neutralized (showOriginal=false)
        // Button should offer "See Original"
        toggleLabel = showOriginal ? (isChild ? "Hide Scary Version" : "Hide Original") : (isChild ? "See Real Version" : "See Original");
    }

    return (
        <div className="flex items-center justify-between mt-3 mb-2">
            {/* BUTTON 2: ANALYSIS (Expandable) */}
            <button 
                onClick={toggleAnalysis}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all ${
                    showAnalysis 
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                        : isChild 
                            ? 'bg-indigo-100 text-indigo-700 animate-pulse'
                            : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-500/20'
                }`}
            >
                {isChild ? <Sparkles size={12} /> : <Shield size={12} />}
                {isChild ? (showAnalysis ? "Close Wise" : "Wise Spotted a Trick!") : (showAnalysis ? "Analysis ▼" : "Analysis")}
            </button>

            {/* BUTTON 1: SEE ORIGINAL / NEUTRALIZED (Toggle) */}
            <button 
                onClick={toggleContent}
                className="flex items-center gap-1.5 text-[10px] font-medium text-[#8b8b8b] hover:text-[#e5e5e5] transition-colors"
            >
                {showOriginal ? <EyeOff size={12} /> : <Eye size={12} />}
                {toggleLabel}
            </button>
        </div>
    );
};


// --- PLATFORM COMPONENTS ---

const TwitterCard: React.FC<PlatformCardProps> = ({ post, displayText, ageGroup, showOriginal, toggleContent, showAnalysis, toggleAnalysis, isManipulative }) => (
  <div className="border-b border-[#2a2a2a] bg-[#1a1a1a] p-4 text-[#e5e5e5] transition-colors relative group">
    <div className="flex gap-3">
      <div className="w-10 h-10 rounded-full bg-[#2a2a2a] flex-shrink-0 border border-[#2a2a2a]" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 text-[15px] leading-5 mb-0.5">
          <span className="font-bold text-[#e5e5e5] truncate">{post.author}</span>
          {post.verified && <CheckCircle2 size={14} className="text-[#1DA1F2] fill-[#1DA1F2]/10" />}
          <span className="text-[#8b8b8b] truncate ml-0.5">{post.handle}</span>
          <span className="text-[#8b8b8b]">·</span>
          <span className="text-[#8b8b8b] hover:underline cursor-pointer">{post.timestamp}</span>
          <div className="ml-auto text-[#8b8b8b]"><MoreHorizontal size={16} /></div>
        </div>
        
        {/* Content Area */}
        <div className={`text-[15px] leading-snug whitespace-pre-wrap mb-1 text-[#e5e5e5] font-normal transition-all duration-300 ${isManipulative && !showOriginal ? 'text-emerald-50/90' : ''}`}>
          {displayText}
        </div>

        {/* Controls */}
        <ControlBar 
            ageGroup={ageGroup} 
            isManipulative={isManipulative} 
            showAnalysis={showAnalysis} 
            toggleAnalysis={toggleAnalysis}
            showOriginal={showOriginal}
            toggleContent={toggleContent}
        />

        {/* Analysis Panel */}
        {showAnalysis && <AnalysisPanel post={post} ageGroup={ageGroup} onClose={toggleAnalysis} />}

        {/* Actions */}
        <div className="flex justify-between text-[#8b8b8b] max-w-md mt-3 pr-8 pt-2 border-t border-[#2a2a2a]">
          <Action icon={<MessageCircle size={18} />} label={post.comments} />
          <Action icon={<Repeat2 size={18} />} label={post.shares} />
          <Action icon={<Heart size={18} />} label={post.likes} />
          <Action icon={<Bookmark size={18} />} />
          <Action icon={<Share2 size={18} />} />
        </div>
      </div>
    </div>
  </div>
);

const TikTokCard: React.FC<PlatformCardProps> = ({ post, displayText, ageGroup, showOriginal, toggleContent, showAnalysis, toggleAnalysis, isManipulative }) => (
  <div className="relative h-full w-full bg-[#1a1a1a] overflow-hidden flex flex-col justify-center border-b border-[#2a2a2a]">
    <div className={`absolute inset-0 ${post.mediaColor || 'bg-[#2a2a2a]'} flex items-center justify-center`}>
      <Play size={64} className="text-white/20 fill-white/20" />
    </div>
    
    {/* Floating Actions */}
    <div className="absolute right-2 bottom-20 flex flex-col items-center gap-6 z-20">
       <div className="w-10 h-10 rounded-full bg-[#e5e5e5] border-2 border-white mb-2" />
       <TikTokAction icon={<Heart size={28} className="fill-white text-white" />} label={post.likes} />
       <TikTokAction icon={<MessageCircle size={28} className="fill-white text-white" />} label={post.comments} />
       <TikTokAction icon={<Bookmark size={28} className="fill-white text-white" />} label={post.shares} />
       <TikTokAction icon={<Share2 size={24} className="fill-white text-white" />} label="Share" />
       <div className="w-10 h-10 rounded-full bg-[#0d0d0d] border-[3px] border-[#2a2a2a] flex items-center justify-center animate-spin-slow mt-4">
         <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#8b8b8b] to-[#5a5a5a]"></div>
       </div>
    </div>

    {/* Bottom Overlay */}
    <div className="absolute inset-x-0 bottom-0 pt-20 pb-4 px-4 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10">
      <div className="pr-16">
         <div className="flex items-center gap-1 font-bold text-white text-[15px] mb-2 drop-shadow-md">
            @{post.author}
            {post.verified && <CheckCircle2 size={12} className="text-[#1DA1F2] fill-[#1DA1F2]/20" />}
         </div>
         
         <div className={`text-white text-[14px] leading-relaxed drop-shadow-md mb-2 transition-all ${isManipulative && !showOriginal ? 'text-emerald-100' : ''}`}>
           {displayText}
         </div>

         {/* TikTok specific condensed controls */}
         {isManipulative && (
            <div className="flex flex-wrap items-center gap-2 mb-3">
                <button 
                    onClick={toggleAnalysis}
                    className="bg-black/40 backdrop-blur-md text-white border border-white/20 px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1"
                >
                    <Shield size={10} /> {showAnalysis ? "Close" : (ageGroup === 'child' ? "Wise Trick Check" : "Analysis")}
                </button>
                <button onClick={toggleContent} className="text-[10px] text-white/70 font-bold underline">
                    {ageGroup === 'adult' ? (showOriginal ? "See Neutralized" : "Show Original") : (showOriginal ? "Hide Original" : "See Original")}
                </button>
            </div>
         )}
         
         {showAnalysis && (
            <div className="mb-4 text-black text-left">
                <AnalysisPanel post={post} ageGroup={ageGroup} onClose={toggleAnalysis} />
            </div>
         )}

         <div className="flex items-center gap-2 text-white/90 text-[13px] font-medium animate-pulse">
           <Music2 size={13} />
           <div className="w-24 overflow-hidden whitespace-nowrap">
             <span>original sound - {post.author} • original sound</span>
           </div>
         </div>
      </div>
    </div>
  </div>
);

const InstagramCard: React.FC<PlatformCardProps> = ({ post, displayText, ageGroup, showOriginal, toggleContent, showAnalysis, toggleAnalysis, isManipulative }) => (
  <div className="bg-[#1a1a1a] text-[#e5e5e5] border-b border-[#2a2a2a] pb-4">
    <div className="flex items-center justify-between px-3 py-3">
       <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 p-[2px]">
            <div className="w-full h-full rounded-full bg-[#1a1a1a] border border-[#1a1a1a]" />
          </div>
          <div>
             <div className="text-sm font-semibold leading-none">{post.author}</div>
             {post.platform === 'instagram' && <div className="text-[10px] text-[#8b8b8b] mt-0.5">Sponsored</div>}
          </div>
       </div>
       <MoreHorizontal size={20} />
    </div>
    
    <div className={`aspect-[4/5] w-full ${post.mediaColor || 'bg-[#2a2a2a]'} flex items-center justify-center relative`}>
       {post.mediaType === 'video' ? <Play size={40} className="text-white/50" /> : null}
    </div>
    
    <div className="px-3 pt-3">
       <div className="flex justify-between items-center mb-3">
         <div className="flex gap-4">
           <Heart size={24} className="hover:text-[#8b8b8b] cursor-pointer" />
           <MessageCircle size={24} className="hover:text-[#8b8b8b] cursor-pointer -rotate-90" />
           <Send size={24} className="hover:text-[#8b8b8b] cursor-pointer" />
         </div>
         <Bookmark size={24} className="hover:text-[#8b8b8b] cursor-pointer" />
       </div>
       
       <div className="text-sm font-bold mb-1.5">{post.likes} likes</div>
       
       <div className="text-sm leading-relaxed mb-2">
         <span className="font-bold mr-1.5">{post.author}</span>
         {displayText}
       </div>
       
       <ControlBar 
            ageGroup={ageGroup} 
            isManipulative={isManipulative} 
            showAnalysis={showAnalysis} 
            toggleAnalysis={toggleAnalysis}
            showOriginal={showOriginal}
            toggleContent={toggleContent}
       />

       {showAnalysis && <AnalysisPanel post={post} ageGroup={ageGroup} onClose={toggleAnalysis} />}

       <button className="text-[#8b8b8b] text-sm mt-1 mb-1">View all {post.comments} comments</button>
       <div className="text-[#5a5a5a] text-[10px] uppercase">{post.timestamp}</div>
    </div>
  </div>
);

const FacebookCard: React.FC<PlatformCardProps> = ({ post, displayText, ageGroup, showOriginal, toggleContent, showAnalysis, toggleAnalysis, isManipulative }) => (
  <div className="bg-[#1a1a1a] text-[#e5e5e5] mb-3 pt-3 pb-1 border-b border-[#2a2a2a] shadow-sm">
    <div className="px-4 flex gap-2.5 items-start mb-2">
       <div className="w-10 h-10 rounded-full bg-[#2a2a2a] relative border border-[#2a2a2a]">
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#1a1a1a]"></div>
       </div>
       <div className="flex-1">
          <div className="font-bold text-[15px] leading-tight text-[#e5e5e5]">{post.author}</div>
          <div className="text-xs text-[#8b8b8b] flex items-center gap-1 mt-0.5">
             {post.timestamp} · <span className="text-[10px]">🌐</span>
          </div>
       </div>
       <MoreHorizontal size={20} className="text-[#8b8b8b]" />
    </div>

    <div className="px-4 pb-3 text-[15px] leading-relaxed text-[#e5e5e5]">
       {displayText}
    </div>

    <div className="px-4 pb-2">
        <ControlBar 
            ageGroup={ageGroup} 
            isManipulative={isManipulative} 
            showAnalysis={showAnalysis} 
            toggleAnalysis={toggleAnalysis}
            showOriginal={showOriginal}
            toggleContent={toggleContent}
        />
        {showAnalysis && <AnalysisPanel post={post} ageGroup={ageGroup} onClose={toggleAnalysis} />}
    </div>

    {post.hasMedia && (
       <div className={`h-64 w-full ${post.mediaColor || 'bg-[#2a2a2a]'}`}></div>
    )}

    <div className="px-4 py-2.5 flex justify-between items-center text-[#8b8b8b] text-[13px] border-b border-[#2a2a2a]">
       <div className="flex items-center gap-1.5">
          <div className="flex -space-x-1">
             <div className="w-4 h-4 rounded-full bg-[#1877F2] flex items-center justify-center z-20 ring-2 ring-[#1a1a1a]">
               <ThumbsUp size={10} className="text-white fill-white" />
             </div>
             <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center z-10 ring-2 ring-[#1a1a1a]">
               <span className="text-[8px] text-white font-bold">!</span>
             </div>
          </div>
          <span className="hover:underline cursor-pointer">{post.likes}</span>
       </div>
       <div className="flex gap-3">
          <span className="hover:underline cursor-pointer">{post.comments} comments</span>
          <span className="hover:underline cursor-pointer">{post.shares} shares</span>
       </div>
    </div>

    <div className="mx-3 my-1 flex justify-between px-2 py-0.5">
       <FBAction icon={<ThumbsUp size={18} />} label="Like" />
       <FBAction icon={<MessageCircle size={18} />} label="Comment" />
       <FBAction icon={<Share2 size={18} />} label="Share" />
    </div>
  </div>
);

const YouTubeCard: React.FC<PlatformCardProps> = ({ post, displayText, ageGroup, showOriginal, toggleContent, showAnalysis, toggleAnalysis, isManipulative }) => (
  <div className="bg-[#1a1a1a] text-[#e5e5e5] mb-4 border-b border-[#2a2a2a] pb-4">
    <div className={`aspect-video w-full ${post.mediaColor || 'bg-[#2a2a2a]'} relative`}>
       <div className="absolute bottom-2 right-2 bg-black/80 px-1.5 py-0.5 rounded text-xs font-medium font-mono">12:43</div>
    </div>
    
    <div className="px-3 pt-3 flex gap-3">
       <div className="w-9 h-9 rounded-full bg-[#2a2a2a] flex-shrink-0" />
       <div className="flex-1">
          <div className="text-[16px] font-medium leading-tight mb-1.5 pr-4">
             {displayText}
          </div>
          <div className="text-[#8b8b8b] text-xs flex items-center gap-1 mb-2">
             {post.author} · {post.views} views · {post.timestamp}
          </div>

          <ControlBar 
            ageGroup={ageGroup} 
            isManipulative={isManipulative} 
            showAnalysis={showAnalysis} 
            toggleAnalysis={toggleAnalysis}
            showOriginal={showOriginal}
            toggleContent={toggleContent}
          />
          
          {showAnalysis && <div className="mb-4"><AnalysisPanel post={post} ageGroup={ageGroup} onClose={toggleAnalysis} /></div>}
          
          <div className="flex items-center justify-start gap-2 mb-4 overflow-x-auto scrollbar-hide pt-2">
             <div className="flex items-center bg-white/10 rounded-full h-8">
               <button className="flex items-center gap-2 pl-3 pr-3 h-full hover:bg-white/10 rounded-l-full border-r border-white/10 transition-colors">
                 <ThumbsUp size={14} /> <span className="text-xs font-bold">{post.likes}</span>
               </button>
               <button className="px-3 h-full hover:bg-white/10 rounded-r-full transition-colors">
                 <ThumbsDown size={14} />
               </button>
             </div>
             <button className="flex items-center gap-2 bg-white/10 hover:bg-white/20 rounded-full px-3 h-8 text-xs font-bold transition-colors">
               <Share2 size={14} /> Share
             </button>
          </div>
       </div>
    </div>
  </div>
);

// --- SMALLER SHARED COMPONENTS ---

const CommentsSection = ({ post, ageGroup, compact }: { post: Post, ageGroup: AgeGroup, compact?: boolean }) => {
    return null; 
};

const Action = ({ icon, label }: { icon: React.ReactNode, label?: string }) => (
  <button className="flex items-center gap-1.5 group hover:text-[#1DA1F2] transition-colors">
    <div className="group-hover:bg-[#1DA1F2]/10 p-2 rounded-full transition-colors -ml-2">{icon}</div>
    {label && <span className="text-xs font-medium">{label}</span>}
  </button>
);

const TikTokAction = ({ icon, label }: { icon: React.ReactNode, label: string }) => (
  <div className="flex flex-col items-center gap-1 drop-shadow-lg">
    {icon}
    <span className="text-[10px] font-bold text-white shadow-black">{label}</span>
  </div>
);

const FBAction = ({ icon, label }: { icon: React.ReactNode, label: string }) => (
  <button className="flex items-center gap-1.5 flex-1 justify-center py-1.5 rounded hover:bg-[#2a2a2a] transition-colors text-[#8b8b8b] font-medium text-[13px]">
     {icon}
     <span>{label}</span>
  </button>
);
