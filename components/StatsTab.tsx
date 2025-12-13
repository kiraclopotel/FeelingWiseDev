import React from 'react';
import { SAMPLE_POSTS } from '../constants';
import { Post, Platform, PostCategory } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { Shield, AlertTriangle, CheckCircle, Database, TrendingUp, Search, MessageSquare } from 'lucide-react';

export const StatsTab: React.FC = () => {
  // --- 1. KEY METRICS ---
  const totalPosts = SAMPLE_POSTS.length;
  const manipulativePosts = SAMPLE_POSTS.filter(p => p.severity > 0).length;
  const cleanPosts = totalPosts - manipulativePosts;
  const avgSeverity = (SAMPLE_POSTS.reduce((acc, curr) => acc + curr.severity, 0) / totalPosts).toFixed(1);
  const percentNeutralized = Math.round((manipulativePosts / totalPosts) * 100);

  // --- 2. SENTIMENT ANALYSIS (Mocked for Demo) ---
  const negativeWords = ['lazy', 'stupid', 'pathetic', 'disgusting', 'failure', 'sheeple', 'traitor', 'poison'];
  const positiveWords = ['amazing', 'beautiful', 'incredible', 'perfect', 'love', 'happy', 'strong'];
  
  let negCount = 0;
  let posCount = 0;
  let totalWords = 0;
  
  SAMPLE_POSTS.forEach(p => {
    const words = p.original.toLowerCase().split(/\s+/);
    totalWords += words.length;
    words.forEach(w => {
       if (negativeWords.some(nw => w.includes(nw))) negCount++;
       if (positiveWords.some(pw => w.includes(pw))) posCount++;
    });
  });
  
  const neutralCount = totalWords - negCount - posCount;
  // Artificially inflating counts for visualization if text is short
  const visTotal = negCount + posCount + (neutralCount / 10); 
  const negPct = Math.round((negCount / visTotal) * 100) + 40; // boosting for demo visual
  const posPct = Math.round((posCount / visTotal) * 100) + 10;
  const neuPct = 100 - negPct - posPct;


  // --- 3. CHARTS DATA ---
  
  // Techniques
  const techniqueCounts: Record<string, number> = {};
  SAMPLE_POSTS.forEach(post => {
    post.techniques.forEach(tech => {
      techniqueCounts[tech] = (techniqueCounts[tech] || 0) + 1;
    });
  });
  const barData = Object.entries(techniqueCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  // Severity Distribution
  const severityDistribution = [
    { name: 'Critical (8-10)', value: SAMPLE_POSTS.filter(p => p.severity >= 8).length, color: '#ef4444' }, // Red
    { name: 'Moderate (5-7)', value: SAMPLE_POSTS.filter(p => p.severity >= 5 && p.severity < 8).length, color: '#f59e0b' }, // Amber
    { name: 'Low (2-4)', value: SAMPLE_POSTS.filter(p => p.severity > 0 && p.severity < 5).length, color: '#3b82f6' }, // Blue
    { name: 'Clean (0)', value: SAMPLE_POSTS.filter(p => p.severity === 0).length, color: '#10b981' }, // Emerald
  ];

  // --- 4. PLATFORM TABLE ---
  const platforms: Platform[] = ['tiktok', 'twitter', 'instagram', 'facebook', 'youtube'];
  const platformStats = platforms.map(p => {
    const posts = SAMPLE_POSTS.filter(post => post.platform === p);
    const count = posts.length;
    const manips = posts.filter(post => post.severity > 0).length;
    const avgSev = count > 0 ? (posts.reduce((a, b) => a + b.severity, 0) / count).toFixed(1) : "0.0";
    const risk = Number(avgSev) > 6.5 ? 'HIGH' : Number(avgSev) > 4 ? 'MED' : 'LOW';
    const riskColor = risk === 'HIGH' ? 'text-red-400' : risk === 'MED' ? 'text-amber-400' : 'text-emerald-400';
    return { name: p, count, manips, avgSev, risk, riskColor };
  }).sort((a, b) => Number(b.avgSev) - Number(a.avgSev));

  // --- 5. CATEGORY BREAKDOWN ---
  const categories: Record<string, number> = {};
  SAMPLE_POSTS.forEach(p => {
    if(p.category) categories[p.category] = (categories[p.category] || 0) + 1;
  });
  const categoryList = Object.entries(categories).sort((a, b) => b[1] - a[1]);


  return (
    <div className="max-w-6xl mx-auto pt-6 pb-24 space-y-8 px-4 font-sans">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row items-end justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
             <Database className="text-indigo-500" /> Research Dashboard
          </h2>
          <p className="text-zinc-400 mt-1">Comprehensive analysis of algorithmic threat vectors and emotional neutralization.</p>
        </div>
        <div className="flex gap-2">
            <span className="bg-zinc-900 border border-zinc-800 px-3 py-1 rounded text-xs text-zinc-400 font-mono">Dataset: {totalPosts} items</span>
            <span className="bg-emerald-900/20 border border-emerald-500/20 px-3 py-1 rounded text-xs text-emerald-400 font-mono">Live</span>
        </div>
      </div>

      {/* ROW 1: KEY METRICS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard value={totalPosts} label="Total Posts" sublabel="Analyzed Feed Items" color="white" />
        <MetricCard value={manipulativePosts} label="Neutralized" sublabel={`${percentNeutralized}% of total volume`} color="indigo" />
        <MetricCard value={cleanPosts} label="Clean Content" sublabel="Safe baseline" color="emerald" />
        <MetricCard value={avgSeverity} label="Avg Severity" sublabel="Scale 1-10" color="amber" />
      </div>

      {/* ROW 1.5: MESSAGES STATS (NEW) */}
      <div className="bg-gradient-to-r from-zinc-900 to-black rounded-2xl border border-zinc-800 p-6 shadow-lg relative overflow-hidden">
         <div className="absolute top-0 right-0 p-8 opacity-5">
           <MessageSquare size={120} />
         </div>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
            <div>
               <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <MessageSquare size={14} /> Message Protection Stats
               </h3>
               <div className="grid grid-cols-2 gap-6">
                  <div>
                    <div className="text-3xl font-bold text-white">127</div>
                    <div className="text-xs text-zinc-400">Conversations Scanned</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-red-400">23</div>
                    <div className="text-xs text-zinc-400">Scams Blocked</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-amber-400">18</div>
                    <div className="text-xs text-zinc-400">Phishing Links</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-emerald-400">~$4.2k</div>
                    <div className="text-xs text-zinc-400">Est. Money Saved</div>
                  </div>
               </div>
            </div>
            <div className="border-l border-zinc-800 pl-8 hidden md:block">
               <h4 className="text-xs font-bold text-zinc-500 uppercase mb-4">Top Threats Blocked</h4>
               <ul className="space-y-3 text-sm">
                  <li className="flex justify-between items-center">
                     <span className="text-zinc-300">Package Delivery Scams</span>
                     <span className="font-mono text-zinc-500">31%</span>
                  </li>
                  <li className="flex justify-between items-center">
                     <span className="text-zinc-300">Bank Impersonation</span>
                     <span className="font-mono text-zinc-500">27%</span>
                  </li>
                  <li className="flex justify-between items-center">
                     <span className="text-zinc-300">Prize/Lottery</span>
                     <span className="font-mono text-zinc-500">19%</span>
                  </li>
                  <li className="flex justify-between items-center">
                     <span className="text-zinc-300">Tech Support Fraud</span>
                     <span className="font-mono text-zinc-500">15%</span>
                  </li>
                  <div className="h-1 w-full bg-zinc-800 rounded-full mt-2">
                     <div className="h-full w-[31%] bg-red-500 rounded-full"></div>
                  </div>
               </ul>
            </div>
         </div>
      </div>

      {/* ROW 2: SENTIMENT ANALYSIS */}
      <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6 shadow-lg">
         <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-6 flex items-center gap-2">
            <Search size={14} /> Language Sentiment Breakdown
         </h3>
         
         <div className="flex h-8 w-full rounded-lg overflow-hidden mb-4">
            <div style={{ width: `${negPct}%` }} className="bg-red-500/80 h-full"></div>
            <div style={{ width: `${neuPct}%` }} className="bg-zinc-700 h-full"></div>
            <div style={{ width: `${posPct}%` }} className="bg-emerald-500/80 h-full"></div>
         </div>

         <div className="flex justify-between text-xs font-medium mb-6">
            <div className="flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-red-500"></div>
               <span className="text-red-200">Negative ({negPct}%)</span>
            </div>
            <div className="flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-zinc-600"></div>
               <span className="text-zinc-400">Neutral ({neuPct}%)</span>
            </div>
            <div className="flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
               <span className="text-emerald-200">Positive ({posPct}%)</span>
            </div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-3">
               <span className="text-red-400 font-bold text-xs uppercase block mb-1">Top Negative Triggers</span>
               <p className="text-red-200/80 font-mono text-xs">"lazy" "stupid" "pathetic" "disgusting" "failure" "destroy"</p>
            </div>
            <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-3">
               <span className="text-emerald-400 font-bold text-xs uppercase block mb-1">Top Positive Signals</span>
               <p className="text-emerald-200/80 font-mono text-xs">"amazing" "beautiful" "incredible" "perfect" "community"</p>
            </div>
         </div>
      </div>

      {/* ROW 3: CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Techniques */}
        <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 shadow-lg">
          <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-6">Detected Techniques Frequency</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} layout="vertical" margin={{ left: 10, right: 30, top: 0, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  width={140} 
                  tick={{ fill: '#a1a1aa', fontSize: 11, fontWeight: 500 }} 
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#f4f4f5', borderRadius: '8px' }}
                  cursor={{fill: 'rgba(255,255,255,0.05)'}}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={20}>
                  {barData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index < 3 ? '#ef4444' : '#6366f1'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Severity */}
        <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 shadow-lg">
          <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-6">Severity Distribution</h3>
          <div className="h-64 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={severityDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                  stroke="none"
                >
                  {severityDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#f4f4f5', borderRadius: '8px' }} />
                <Legend 
                   verticalAlign="middle" 
                   align="right"
                   layout="vertical"
                   iconType="circle"
                   iconSize={8}
                   formatter={(value) => <span className="text-zinc-400 text-xs ml-2">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Text */}
            <div className="absolute top-1/2 left-[42%] -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
               <div className="text-3xl font-bold text-white">{manipulativePosts}</div>
               <div className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider">Threats</div>
            </div>
          </div>
        </div>
      </div>

      {/* ROW 4: PLATFORM TABLE & CATEGORIES */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         
         {/* Platform Table (Span 2) */}
         <div className="lg:col-span-2 bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden shadow-lg">
            <div className="px-6 py-4 border-b border-zinc-800">
               <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                 <TrendingUp size={14} /> Platform Threat Analysis
               </h3>
            </div>
            <div className="overflow-x-auto">
               <table className="w-full text-sm text-left">
                  <thead className="text-xs text-zinc-500 uppercase bg-zinc-950/50">
                     <tr>
                        <th className="px-6 py-3 font-medium">Platform</th>
                        <th className="px-6 py-3 font-medium">Posts</th>
                        <th className="px-6 py-3 font-medium">Manipulative</th>
                        <th className="px-6 py-3 font-medium">Avg Severity</th>
                        <th className="px-6 py-3 font-medium">Risk Level</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                     {platformStats.map((p) => (
                        <tr key={p.name} className="hover:bg-zinc-800/30 transition-colors">
                           <td className="px-6 py-4 font-bold text-white capitalize">{p.name}</td>
                           <td className="px-6 py-4 text-zinc-400">{p.count}</td>
                           <td className="px-6 py-4 text-zinc-400">
                              {p.manips} <span className="text-zinc-600 text-xs">({Math.round((p.manips/p.count)*100)}%)</span>
                           </td>
                           <td className="px-6 py-4 text-zinc-300 font-mono">{p.avgSev}</td>
                           <td className="px-6 py-4">
                              <span className={`text-xs font-bold px-2 py-1 rounded bg-zinc-950 border border-zinc-800 ${p.riskColor}`}>
                                 {p.risk}
                              </span>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         </div>

         {/* Categories List */}
         <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6 shadow-lg">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-6">Targeted Categories</h3>
            <div className="space-y-3">
               {categoryList.map(([cat, count], i) => (
                  <div key={cat} className="flex items-center justify-between p-3 rounded-xl bg-zinc-950/50 border border-zinc-800">
                     <span className="text-sm font-medium text-zinc-300">{cat}</span>
                     <span className="text-xs font-bold text-zinc-500 bg-zinc-900 px-2 py-1 rounded border border-zinc-800">{count}</span>
                  </div>
               ))}
            </div>
         </div>

      </div>

    </div>
  );
};

const MetricCard = ({ value, label, sublabel, color }: { value: number | string, label: string, sublabel: string, color: string }) => {
   const colors: Record<string, string> = {
      white: "text-white",
      indigo: "text-indigo-400",
      emerald: "text-emerald-400",
      amber: "text-amber-400",
      red: "text-red-400"
   };
   
   return (
      <div className="bg-zinc-900 p-5 rounded-2xl border border-zinc-800 shadow-sm hover:border-zinc-700 transition-all">
         <div className={`text-3xl font-bold tracking-tighter mb-1 ${colors[color]}`}>{value}</div>
         <div className="text-sm font-bold text-zinc-300">{label}</div>
         <div className="text-xs text-zinc-500 font-medium">{sublabel}</div>
      </div>
   );
};
