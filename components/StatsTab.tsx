import React, { useState, useEffect } from 'react';
import { getCacheStats, isTauri, CacheStats, getOllamaStatus, OllamaStatus } from '../services/localAIService';
import { Database, Shield, CheckCircle, TrendingUp, Cpu, RefreshCw, Loader2 } from 'lucide-react';

export const StatsTab: React.FC = () => {
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);
  const [ollamaStatus, setOllamaStatus] = useState<OllamaStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const loadStats = async () => {
    setLoading(true);
    try {
      if (isTauri()) {
        const [cache, ollama] = await Promise.all([
          getCacheStats(),
          getOllamaStatus()
        ]);
        setCacheStats(cache);
        setOllamaStatus(ollama);
      } else {
        // Mock data for browser mode
        setCacheStats({
          total_entries: 0,
          cache_hits: 0,
          cache_misses: 0,
          hit_rate: 0
        });
        setOllamaStatus({
          running: false,
          models_available: [],
          current_model: null
        });
      }
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const inTauri = isTauri();

  return (
    <div className="max-w-4xl mx-auto pt-6 pb-24 space-y-8 px-4 font-sans">

      {/* Header */}
      <div className="flex flex-col md:flex-row items-end justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <Database className="text-indigo-500" /> Statistics
          </h2>
          <p className="text-zinc-400 mt-1">Track your content neutralization activity.</p>
        </div>
        <div className="flex gap-2 items-center">
          <button
            onClick={loadStats}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white transition-colors disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span className="text-xs font-medium">Refresh</span>
          </button>
          {lastRefresh && (
            <span className="text-xs text-zinc-600">
              Updated {lastRefresh.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* Browser Mode Notice */}
      {!inTauri && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
              <Cpu size={24} className="text-amber-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-1">Browser Mode</h3>
              <p className="text-zinc-400 text-sm">
                Statistics tracking requires the desktop app with local AI enabled.
                Download the desktop version for full functionality including:
              </p>
              <ul className="mt-3 space-y-1 text-sm text-zinc-400">
                <li className="flex items-center gap-2">
                  <CheckCircle size={14} className="text-amber-400" />
                  Local AI analysis with Ollama
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={14} className="text-amber-400" />
                  Analysis caching for instant repeat lookups
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={14} className="text-amber-400" />
                  Complete privacy - no data leaves your device
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={32} className="text-indigo-500 animate-spin" />
        </div>
      )}

      {/* Stats Display */}
      {!loading && inTauri && cacheStats && (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard
              value={cacheStats.total_entries}
              label="Total Analyses"
              sublabel="Cached results"
              color="white"
            />
            <MetricCard
              value={cacheStats.cache_hits}
              label="Cache Hits"
              sublabel="Instant lookups"
              color="emerald"
            />
            <MetricCard
              value={cacheStats.cache_misses}
              label="New Analyses"
              sublabel="Fresh AI calls"
              color="indigo"
            />
            <MetricCard
              value={`${(cacheStats.hit_rate * 100).toFixed(1)}%`}
              label="Hit Rate"
              sublabel="Cache efficiency"
              color="amber"
            />
          </div>

          {/* AI Status */}
          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6 shadow-lg">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Cpu size={14} /> Local AI Status
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Ollama Status */}
              <div className="bg-zinc-950 rounded-xl p-4 border border-zinc-800">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-zinc-300">Ollama Server</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                    ollamaStatus?.running
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {ollamaStatus?.running ? 'Running' : 'Stopped'}
                  </span>
                </div>

                {ollamaStatus?.running && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs text-zinc-500">Active and processing</span>
                  </div>
                )}
              </div>

              {/* Models */}
              <div className="bg-zinc-950 rounded-xl p-4 border border-zinc-800">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-zinc-300">Installed Models</span>
                  <span className="text-xs text-zinc-500">
                    {ollamaStatus?.models_available.length || 0} available
                  </span>
                </div>

                {ollamaStatus?.models_available && ollamaStatus.models_available.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {ollamaStatus.models_available.map(model => (
                      <span
                        key={model}
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          model === ollamaStatus.current_model
                            ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                            : 'bg-zinc-800 text-zinc-400'
                        }`}
                      >
                        {model}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-600">No models installed</p>
                )}
              </div>
            </div>
          </div>

          {/* Cache Visualization */}
          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6 shadow-lg">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <TrendingUp size={14} /> Cache Performance
            </h3>

            <div className="space-y-4">
              {/* Hit Rate Bar */}
              <div>
                <div className="flex justify-between items-end mb-2">
                  <span className="text-zinc-400 text-xs font-medium">Cache Hit Rate</span>
                  <span className="text-white font-mono text-lg font-bold">
                    {(cacheStats.hit_rate * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="h-3 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-600 to-emerald-500 transition-all duration-500"
                    style={{ width: `${cacheStats.hit_rate * 100}%` }}
                  />
                </div>
                <p className="text-xs text-zinc-600 mt-2">
                  Higher hit rates mean faster responses from cached results
                </p>
              </div>

              {/* Breakdown */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-800">
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-400">{cacheStats.cache_hits}</div>
                  <div className="text-xs text-zinc-500">Instant (cached)</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-indigo-400">{cacheStats.cache_misses}</div>
                  <div className="text-xs text-zinc-500">New (AI processed)</div>
                </div>
              </div>
            </div>
          </div>

          {/* Privacy Note */}
          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <Shield size={20} className="text-emerald-400" />
              </div>
              <div>
                <h3 className="font-bold text-emerald-300 mb-1">Complete Privacy</h3>
                <p className="text-zinc-400 text-sm">
                  All analysis happens locally on your device. No content is ever sent to external servers.
                  Your cache is stored securely in your app data folder.
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Empty State for Desktop */}
      {!loading && inTauri && cacheStats && cacheStats.total_entries === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-zinc-800">
            <Database size={32} className="text-zinc-700" />
          </div>
          <h3 className="text-lg font-bold text-zinc-300 mb-2">No Analyses Yet</h3>
          <p className="text-zinc-500 text-sm max-w-md mx-auto">
            Start analyzing content to see your statistics here.
            Go to the Analyze tab and paste some text to get started.
          </p>
        </div>
      )}
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
