
import React from 'react';
import { GuardianCard as GuardianCardType } from '../types';
import { getRarityColor, getRarityGlow } from '../services/gamificationService';
import { Shield, Eye, Zap, Sparkles } from 'lucide-react';

interface Props {
  card: GuardianCardType;
  showNewAnimation?: boolean;
}

export const GuardianCard: React.FC<Props> = ({ card, showNewAnimation }) => {
  const colorClass = getRarityColor(card.rarity);
  const glowClass = getRarityGlow(card.rarity);

  return (
    <div className={`relative aspect-[3/4] w-full max-w-[280px] mx-auto rounded-2xl border-4 p-4 flex flex-col items-center justify-between overflow-hidden transition-all duration-700 ${colorClass} ${glowClass} ${showNewAnimation ? 'animate-in zoom-in-50 spin-in-3 duration-1000' : ''}`}>
      
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>

      {/* Header */}
      <div className="w-full flex justify-between items-center z-10">
        <div className="flex items-center gap-1">
           {card.rarity === 'Legendary' && <Sparkles size={12} className="animate-pulse" />}
           <span className="text-[10px] font-bold uppercase tracking-widest">{card.rarity}</span>
        </div>
        <span className="text-[10px] font-mono opacity-60">Lv.{card.level}</span>
      </div>

      <div className="w-full h-px bg-current opacity-20 my-2"></div>

      {/* Emblem / Icon */}
      <div className="flex-1 flex flex-col items-center justify-center py-4 z-10">
         <div className={`w-20 h-20 rounded-full border-2 flex items-center justify-center mb-4 ${colorClass.split(' ')[1]} ${card.rarity === 'Legendary' ? 'animate-pulse' : ''}`}>
             <Shield size={40} fill="currentColor" className="opacity-20" />
             <div className="absolute">
               <Shield size={40} strokeWidth={1.5} />
             </div>
         </div>
         <h3 className="text-lg font-black text-center uppercase tracking-tight leading-none px-2">
            {card.title}
         </h3>
      </div>

      {/* Stats Grid */}
      <div className="w-full grid grid-cols-3 gap-1 mb-4 z-10">
         <StatBox icon={<Shield size={12} />} value={card.stats.guard} label="Guard" />
         <StatBox icon={<Eye size={12} />} value={card.stats.sight} label="Sight" />
         <StatBox icon={<Zap size={12} />} value={card.stats.speed} label="Speed" />
      </div>

      {/* Footer */}
      <div className="w-full text-center z-10">
         <div className="text-[9px] font-mono opacity-50 mb-1">Generated {card.timestamp}</div>
         <div className="inline-block px-2 py-0.5 rounded bg-black/20 text-[10px] font-mono font-bold">
            {card.id}
         </div>
      </div>

      {/* Rarity Effects */}
      {card.rarity === 'Legendary' && (
        <>
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-tr from-yellow-500/10 to-transparent pointer-events-none"></div>
          <div className="absolute bottom-0 right-0 w-20 h-20 bg-yellow-400/20 blur-3xl rounded-full pointer-events-none"></div>
        </>
      )}
    </div>
  );
};

const StatBox = ({ icon, value, label }: { icon: React.ReactNode, value: number, label: string }) => (
  <div className="bg-black/20 rounded-lg p-1.5 flex flex-col items-center text-center">
    <div className="flex items-center gap-1 mb-0.5 opacity-80">{icon} <span className="text-xs font-bold">{value}</span></div>
    <span className="text-[8px] uppercase tracking-wide opacity-60">{label}</span>
  </div>
);
