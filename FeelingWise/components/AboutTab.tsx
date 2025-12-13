import React from 'react';
import { 
  Shield, AlertTriangle, Zap, 
  Brain, Scale, Users, 
  TrendingUp, Database, Eye 
} from 'lucide-react';

export const AboutTab: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto pt-8 pb-32 px-6">
      
      {/* HEADER */}
      <div className="text-center mb-16 space-y-4">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-2">
          What is Feeling<span className="text-indigo-500">Wise</span>?
        </h1>
        <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
          Restoring intellectual honesty to the internet by neutralizing emotional manipulation.
        </p>
      </div>

      <div className="space-y-16">
        
        {/* SECTION 1: THE PROBLEM */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
           <div className="md:col-span-5">
              <div className="bg-red-500/10 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 border border-red-500/20">
                 <AlertTriangle className="text-red-500" size={32} />
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">The Problem</h2>
           </div>
           <div className="md:col-span-7 text-lg text-zinc-300 leading-relaxed space-y-4">
              <p>
                Algorithms amplify fear, anger, and shame because emotional engagement equals profit. Children are scrolling through hundreds of manipulative posts daily, creating a distorted view of reality.
              </p>
              <p>
                Current solutions fail. Blocking creates "forbidden fruit." Warning labels are ignored. We need a way to see the information without the assault.
              </p>
           </div>
        </section>

        <div className="h-px bg-white/5 w-full"></div>

        {/* SECTION 2: OUR APPROACH */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
           <div className="md:col-span-5 order-1 md:order-2">
              <div className="bg-indigo-500/10 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 border border-indigo-500/20">
                 <Zap className="text-indigo-500" size={32} />
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">Our Approach</h2>
           </div>
           <div className="md:col-span-7 order-2 md:order-1 text-lg text-zinc-300 leading-relaxed">
              <p>
                FeelingWise doesn't block content. It <strong className="text-indigo-400">neutralizes</strong> it. We use AI to strip away the emotional manipulation while preserving the core information. 
              </p>
              <p className="mt-4">
                This reveals the underlying claim for what it is: an opinion. It restores the user's ability to think logically rather than react emotionally.
              </p>
           </div>
        </section>

        <div className="h-px bg-white/5 w-full"></div>

        {/* SECTION 3: HOW IT WORKS (Visual) */}
        <section className="bg-zinc-900 rounded-3xl border border-zinc-800 overflow-hidden">
           <div className="p-8 text-center">
              <h2 className="text-2xl font-bold text-white mb-2">See the Difference</h2>
              <p className="text-zinc-400">Same information. No manipulation.</p>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="bg-red-950/20 p-8 border-r border-zinc-800/50 flex flex-col justify-center">
                  <div className="text-xs font-bold text-red-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <AlertTriangle size={14} /> Original
                  </div>
                  <div className="text-xl font-medium text-red-200/80 italic">
                    "🚨 You are DESTROYING your health! Doctors are LYING to you! Wake up before it's too late!!!"
                  </div>
              </div>
              <div className="bg-emerald-950/20 p-8 flex flex-col justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-emerald-500/5"></div>
                  <div className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-4 flex items-center gap-2 relative z-10">
                    <Shield size={14} /> Neutralized
                  </div>
                  <div className="text-xl font-medium text-emerald-100 relative z-10">
                    "Some believe that current medical advice may not be optimal for long-term health."
                  </div>
              </div>
           </div>
        </section>

        {/* SECTION 4: WHO IT'S FOR */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-8 text-center">Who It Serves</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <StakeholderCard 
               title="Parents" 
               icon={<Users className="text-indigo-400" />}
               desc="See exactly what your child would have seen. Monitor the threat level of their digital environment."
             />
             <StakeholderCard 
               title="Researchers" 
               icon={<Database className="text-amber-400" />}
               desc="Access structured data on manipulation techniques. Track algorithmic trends over time."
             />
             <StakeholderCard 
               title="Legal & Policy" 
               icon={<Scale className="text-emerald-400" />}
               desc="Generate court-admissible evidence of systematic emotional targeting by platforms."
             />
          </div>
        </section>

        {/* SECTION 5: THE VISION */}
        <section className="text-center bg-zinc-900/50 p-10 rounded-3xl border border-zinc-800">
           <Eye className="text-white mx-auto mb-4" size={32} />
           <h2 className="text-2xl font-bold text-white mb-4">The Vision</h2>
           <p className="text-xl text-zinc-300 max-w-2xl mx-auto font-medium">
             Our goal isn't to protect children forever. It's to build their <span className="text-indigo-400">emotional immunity</span> so they no longer need protection.
           </p>
        </section>
        
        {/* FOOTER */}
        <div className="border-t border-white/10 pt-12 text-center">
           <div className="inline-block px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs text-zinc-500 font-mono">
             Google DeepMind Hackathon • Dec 2025
           </div>
        </div>

      </div>
    </div>
  );
};

const StakeholderCard = ({ title, desc, icon }: { title: string, desc: string, icon: React.ReactNode }) => (
  <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 hover:border-zinc-700 transition-colors text-center md:text-left">
    <div className="mb-4 bg-zinc-950 w-12 h-12 rounded-xl flex items-center justify-center border border-zinc-800 mx-auto md:mx-0">{icon}</div>
    <h3 className="font-bold text-white text-lg mb-2">{title}</h3>
    <p className="text-sm text-zinc-400 leading-relaxed">{desc}</p>
  </div>
);
