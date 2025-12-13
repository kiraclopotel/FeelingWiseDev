
import { GuardianCard, Rarity, GuardianStats } from '../types';
import { CARD_ADJECTIVES, CARD_NOUNS } from '../constants';

export const generateCard = (level: number): GuardianCard => {
  // 1. Generate ID
  const id = Math.floor(Math.random() * 900000) + 100000; // 6 digit ID

  // 2. Generate Title
  const adj = CARD_ADJECTIVES[Math.floor(Math.random() * CARD_ADJECTIVES.length)];
  const noun = CARD_NOUNS[Math.floor(Math.random() * CARD_NOUNS.length)];
  const title = `${adj} ${noun}`;

  // 3. Determine Rarity
  const roll = Math.random();
  let rarity: Rarity = 'Common';
  if (roll < 0.01) rarity = 'Legendary';
  else if (roll < 0.05) rarity = 'Epic';
  else if (roll < 0.20) rarity = 'Rare';
  else if (roll < 0.50) rarity = 'Uncommon';

  // 4. Generate Stats
  // Total stats based on level, plus a small variance
  const baseTotal = 100 + (level * 2);
  const variance = Math.floor(Math.random() * 10) - 5; // +/- 5
  let pointsToDistribute = baseTotal + variance;

  // Ensure minimums
  const stats: GuardianStats = { guard: 10, sight: 10, speed: 10 };
  pointsToDistribute -= 30;

  // Randomly distribute remaining
  const part1 = Math.floor(Math.random() * (pointsToDistribute - 5));
  stats.guard += part1;
  pointsToDistribute -= part1;

  const part2 = Math.floor(Math.random() * (pointsToDistribute - 2));
  stats.sight += part2;
  pointsToDistribute -= part2;

  stats.speed += pointsToDistribute;

  // 5. Date
  const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return {
    id: `#${id.toLocaleString()}`,
    title,
    rarity,
    stats,
    level,
    timestamp: date
  };
};

export const getRarityColor = (rarity: Rarity): string => {
  switch (rarity) {
    case 'Legendary': return 'text-yellow-400 border-yellow-500 bg-yellow-950/30';
    case 'Epic': return 'text-purple-400 border-purple-500 bg-purple-950/30';
    case 'Rare': return 'text-blue-400 border-blue-500 bg-blue-950/30';
    case 'Uncommon': return 'text-emerald-400 border-emerald-500 bg-emerald-950/30';
    default: return 'text-zinc-400 border-zinc-600 bg-zinc-800/50';
  }
};

export const getRarityGlow = (rarity: Rarity): string => {
   switch (rarity) {
    case 'Legendary': return 'shadow-[0_0_30px_rgba(234,179,8,0.3)]';
    case 'Epic': return 'shadow-[0_0_20px_rgba(168,85,247,0.3)]';
    case 'Rare': return 'shadow-[0_0_15px_rgba(59,130,246,0.2)]';
    case 'Uncommon': return 'shadow-[0_0_10px_rgba(16,185,129,0.2)]';
    default: return '';
  }
};
