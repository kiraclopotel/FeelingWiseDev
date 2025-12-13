import React, { useState } from 'react';
import { analyzeTextWithGemini } from '../services/geminiService';
import { AnalysisResult, AgeGroup } from '../types';
import { AGE_GROUPS } from '../constants';
import { 
  Sparkles, Loader2, ChevronRight, ChevronDown, 
  Brain, Search, HelpCircle, AlertTriangle, Shield,
  Eye, EyeOff
} from 'lucide-react';
import { ANALYSIS_EXAMPLES } from '../constants';

export const AnalyzeTab: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [selectedAge, setSelectedAge] = useState<AgeGroup>('child');

  const handleAnalyze = async () => {
    if (!inputText.trim()) return;
    
    setIsLoading(true);
    setResult(null);
    try {
      const data = await analyzeTextWithGemini(inputText, selectedAge);
      setResult(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExampleClick = (text: string) => {
    setInputText(text);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const AgeSelector = () => (
    <div className="flex gap-2 justify-center mb-6 overflow-x-auto pb-2 scrollbar-hide">
      {AGE_GROUPS.map((group) => (
        <button
          key={group.id}
          onClick={() => {
            setSelectedAge(group.id);
            if (result && inputText) {
               setTimeout(() => {
                 const reAnalyze = async () => {
                   setIsLoading(true);
                   try {
                     const data = await analyzeTextWithGemini(inputText, group.id);
                     setResult(data);
                   } finally {
                     setIsLoading(false);
                   }
                 };
                 reAnalyze();
               }, 0);
            }
          }}
          className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
            selectedAge === group.id 
              ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-500/20' 
              : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:bg-zinc-800 hover:text-zinc-200'
          }`}
        >
          {group.name}
        </button>
      ))}
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto pt-4 pb-20">
      
      {/* Header Area */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2 text-zinc-100">Manipulation Analyzer</h2>
        <p className="text-zinc-400 text-sm max-w-md mx-auto">
          See how AI neutralizes toxic content for different age groups.
        </p>
      </div>

      <AgeSelector />

      {/* Input Card - INCREASED CONTRAST */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl overflow-hidden mb-8 ring-1 ring-white/5 relative">
        <div className="p-1">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Paste suspicious text here..."
            className="w-full h-32 bg-zinc-950 text-white p-4 rounded-xl border border-transparent focus:border-indigo-500/50 focus:bg-black focus:ring-0 outline-none resize-none placeholder:text-zinc-500 transition-all text-base leading-relaxed font-medium"
          />
        </div>
        
        <div className="bg-zinc-900 px-4 py-3 border-t border-zinc-800 flex justify-between items-center">
           <span className="text-xs text-zinc-500 font-medium hidden sm:inline-block">Powered by Gemini 2.5 Flash</span>
           <button
            onClick={handleAnalyze}
            disabled={isLoading || !inputText.trim()}
            className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 active:scale-95"
          >
            {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
            Analyze as {AGE_GROUPS.find(g => g.id === selectedAge)?.name}
          </button>
        </div>
      </div>

      {/* Results Display */}
      {result && (
        <div className="mb-12 animate-in fade-in slide-in-from-bottom-8 duration-500">
           {selectedAge === 'child' ? (
             <SproutResultView result={result} original={inputText} />
           ) : (
             <StandardResultView result={result} original={inputText} age={selectedAge} />
           )}
        </div>
      )}

      {/* Categorized Examples */}
      {!isLoading && !result && (
        <div className="space-y-6">
           <div className="flex items-center gap-4 mb-4">
              <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest whitespace-nowrap">Load Example</h4>
              <div className="h-px bg-zinc-800 w-full"></div>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {Object.entries(ANALYSIS_EXAMPLES).map(([category, examples]) => (
               <div key={category} className="space-y-2">
                 <h5 className="text-xs text-indigo-400 font-bold uppercase ml-1">{category}</h5>
                 {examples.map((ex, i) => (
                   <button 
                     key={i}
                     onClick={() => handleExampleClick(ex)}
                     className="w-full text-left p-3 rounded-xl bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-800/50 hover:border-zinc-700 transition-all group relative overflow-hidden"
                   >
                     <div className="relative z-10 flex justify-between items-start gap-3">
                        <p className="text-[13px] text-zinc-400 group-hover:text-zinc-200 transition-colors line-clamp-2 italic">
                          "{ex}"
                        </p>
                        <ChevronRight size={14} className="text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-1" />
                     </div>
                   </button>
                 ))}
               </div>
             ))}
           </div>
        </div>
      )}
    </div>
  );
};

// --- Subcomponents ---

const StandardResultView = ({ result, original, age }: { result: AnalysisResult, original: string, age: AgeGroup }) => {
  const [showCompare, setShowCompare] = useState(false);
  
  const getSeverityColor = (score: number) => {
    if (score >= 7) return 'text-red-400 bg-red-500/10 border-red-500/20';
    if (score >= 4) return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
  };

  return (
    <div className="space-y-4">
       
       {/* 1. Compare Toggle */}
       <div className="flex justify-end mb-2">
         <button 
            onClick={() => setShowCompare(!showCompare)}
            className="text-xs font-bold flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
         >
           {showCompare ? <EyeOff size={14} /> : <Eye size={14} />}
           {showCompare ? 'Hide Original' : 'Compare with Original'}
         </button>
       </div>

       {/* 2. Neutralized Card (Always Visible) - INCREASED CONTRAST */}
       <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden shadow-lg relative group">
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-emerald-500"></div>
          <div className="p-5 pl-7">
             <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-2 flex items-center gap-2">
               <Shield size={14} /> Neutralized Content
             </h3>
             <div className="text-lg text-zinc-100 font-medium leading-relaxed">
               "{result.neutralized}"
             </div>
          </div>
       </div>

       {/* Compare View */}
       {showCompare && (
         <div className="bg-zinc-950 rounded-2xl border border-red-900/30 p-5 pl-7 relative animate-in fade-in slide-in-from-top-2">
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-red-900/50"></div>
            <h3 className="text-xs font-bold text-red-400/70 uppercase tracking-widest mb-2 flex items-center gap-2">
               <AlertTriangle size={14} /> Original Content
            </h3>
            <div className="text-base text-zinc-400 leading-relaxed italic opacity-80">
               "{original}"
            </div>
         </div>
       )}

       {/* 3. Severity Meter */}
       <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-4 flex items-center gap-4">
          <div className="text-xs font-bold uppercase tracking-widest text-zinc-500 whitespace-nowrap">Threat Level</div>
          <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
             <div 
               className={`h-full rounded-full ${result.severity >= 7 ? 'bg-red-500' : result.severity >= 4 ? 'bg-amber-500' : 'bg-emerald-500'}`} 
               style={{ width: `${result.severity * 10}%` }}
             ></div>
          </div>
          <div className={`px-2 py-1 rounded text-xs font-bold ${getSeverityColor(result.severity)}`}>
            {result.severity}/10
          </div>
       </div>

       {/* 4. Expandable Accordions */}
       
       {/* Techniques */}
       <Accordion 
          title="Techniques Detected" 
          icon={<AlertTriangle size={16} className="text-amber-400" />}
          defaultOpen={true}
       >
          <div className="space-y-3">
            {result.techniques.map((tech, i) => (
              <div key={i} className="bg-zinc-950/50 p-4 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-colors">
                 <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-white text-sm">{tech.name}</h4>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${getSeverityColor(tech.severity)}`}>
                       {tech.severity}/10
                    </span>
                 </div>
                 <p className="text-sm text-zinc-400 leading-snug">{tech.explanation}</p>
              </div>
            ))}
          </div>
       </Accordion>

       {/* Psychology */}
       <Accordion 
          title="Why This Works" 
          icon={<Brain size={16} className="text-indigo-400" />}
       >
          <div className="bg-indigo-500/5 p-4 rounded-xl border border-indigo-500/10 text-indigo-100 text-sm leading-relaxed">
            {result.psychology}
          </div>
       </Accordion>

       {/* Pattern */}
       <Accordion 
          title="Pattern Recognition" 
          icon={<Search size={16} className="text-purple-400" />}
       >
          <div className="bg-zinc-950/50 p-4 rounded-xl border border-zinc-800 text-zinc-300 text-sm leading-relaxed">
            {result.pattern}
          </div>
       </Accordion>

       {/* Questions */}
       <Accordion 
          title="Think About It" 
          icon={<HelpCircle size={16} className="text-emerald-400" />}
       >
          <ul className="space-y-2">
            {result.questions.map((q, i) => (
              <li key={i} className="flex gap-3 text-sm text-zinc-300 bg-zinc-950 p-3 rounded-lg border border-zinc-800">
                <span className="text-emerald-500 font-bold">•</span>
                {q}
              </li>
            ))}
          </ul>
       </Accordion>
    </div>
  );
};

const SproutResultView = ({ result, original }: { result: AnalysisResult, original: string }) => {
   return (
     <div className="space-y-6">
        {/* Kid-friendly Neutralized Card */}
        <div className="bg-[#0f172a] rounded-3xl border-2 border-indigo-500/30 overflow-hidden shadow-2xl relative">
          <div className="bg-indigo-500/20 px-6 py-3 border-b border-indigo-500/20 flex items-center gap-2">
             <Sparkles className="text-indigo-400" size={20} />
             <span className="font-bold text-indigo-200 uppercase tracking-wider text-sm">Safe Version</span>
          </div>
          <div className="p-6">
             <div className="text-xl text-white font-medium leading-relaxed">
               "{result.neutralized}"
             </div>
          </div>
        </div>

        {/* Gamified Tricks List */}
        <div className="bg-zinc-900 rounded-3xl border border-zinc-800 p-6">
           <h3 className="text-center font-bold text-zinc-400 uppercase tracking-widest text-xs mb-6">Tricks Wise Spotted</h3>
           <div className="grid gap-4">
              {result.techniques.map((tech, i) => (
                <div key={i} className="flex items-center gap-4 bg-zinc-950 p-4 rounded-2xl border border-zinc-800">
                   <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-xl">
                      🦉
                   </div>
                   <div>
                      <h4 className="font-bold text-white text-base mb-1">{tech.name}</h4>
                      <p className="text-sm text-zinc-400">{tech.explanation}</p>
                   </div>
                   <div className="ml-auto bg-amber-500/10 text-amber-500 text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap">
                     +10 XP
                   </div>
                </div>
              ))}
           </div>
        </div>
     </div>
   );
};

// Reusable Accordion
const Accordion = ({ title, icon, children, defaultOpen = false }: { title: string, icon: React.ReactNode, children: React.ReactNode, defaultOpen?: boolean }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden transition-all duration-300">
       <button 
         onClick={() => setIsOpen(!isOpen)}
         className="w-full px-5 py-4 flex items-center justify-between hover:bg-white/5 transition-colors"
       >
         <div className="flex items-center gap-3">
           <div className="p-1.5 bg-zinc-950 rounded-lg border border-zinc-800">{icon}</div>
           <span className="font-bold text-sm text-zinc-200">{title}</span>
         </div>
         <div className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
           <ChevronDown size={16} className="text-zinc-500" />
         </div>
       </button>
       
       <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
         <div className="overflow-hidden">
           <div className="px-5 pb-5 pt-0">
             {children}
           </div>
         </div>
       </div>
    </div>
  );
};