import React, { useState, useEffect } from 'react';
import {
  CheckCircle, Download, Loader2, ChevronRight,
  Shield, Puzzle, Sparkles
} from 'lucide-react';
import {
  getSetupStatus,
  startOllama,
  pullModel,
  completeFirstRun,
  openOllamaDownload,
  openExtensionStore,
  isTauri,
  SetupStatus,
} from '../services/localAIService';

interface FirstRunWizardProps {
  onComplete: () => void;
}

type WizardStep = 'checking' | 'install-helper' | 'downloading' | 'extension' | 'complete';

/**
 * FirstRunWizard - Parent-friendly setup that hides all technical details.
 *
 * Flow:
 * 1. "Setting things up..." (auto-check)
 * 2. "Install helper" (only if Ollama missing)
 * 3. "Preparing protection..." (auto-download model)
 * 4. "Add browser protection" (extension link)
 * 5. "All set!"
 */
export const FirstRunWizard: React.FC<FirstRunWizardProps> = ({ onComplete }) => {
  const [step, setStep] = useState<WizardStep>('checking');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [setupStatus, setSetupStatus] = useState<SetupStatus | null>(null);

  // Auto-run setup on mount
  useEffect(() => {
    runSetupChecks();
  }, []);

  const runSetupChecks = async () => {
    if (!isTauri()) {
      // Browser mode - skip to complete
      onComplete();
      return;
    }

    setStep('checking');
    setError(null);

    try {
      // Check current status
      const status = await getSetupStatus();
      setSetupStatus(status);

      // If already complete, skip wizard
      if (status.first_run_complete && status.ollama_running && status.model_available) {
        onComplete();
        return;
      }

      // Decide next step
      if (!status.ollama_installed) {
        setStep('install-helper');
        return;
      }

      // Ollama installed - try to start it
      if (!status.ollama_running) {
        try {
          await startOllama();
        } catch (e) {
          // Ignore start errors - might already be running
        }
      }

      // Check if model needs download
      const updatedStatus = await getSetupStatus();
      setSetupStatus(updatedStatus);

      if (!updatedStatus.model_available) {
        setStep('downloading');
        await downloadModel();
        return;
      }

      // Model available - go to extension step
      setStep('extension');

    } catch (e) {
      console.error('Setup check failed:', e);
      setError('Something went wrong. Please try again.');
    }
  };

  const downloadModel = async () => {
    setProgress(0);

    // Simulate progress (real progress would come from events)
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) return prev;
        return prev + Math.random() * 8;
      });
    }, 800);

    try {
      await pullModel('phi3:mini');
      clearInterval(progressInterval);
      setProgress(100);

      // Short delay then move to extension step
      setTimeout(() => setStep('extension'), 1500);
    } catch (e) {
      clearInterval(progressInterval);
      setError('Download failed. Please check your internet connection.');
    }
  };

  const handleComplete = async () => {
    try {
      await completeFirstRun();
    } catch (e) {
      // Ignore errors
    }
    onComplete();
  };

  const renderStep = () => {
    switch (step) {
      case 'checking':
        return (
          <div className="text-center py-12">
            <div className="relative w-20 h-20 mx-auto mb-6">
              <div className="absolute inset-0 bg-indigo-500/20 rounded-full animate-ping" />
              <div className="relative w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center border border-indigo-500/30">
                <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Setting things up...</h2>
            <p className="text-zinc-400">This only takes a moment.</p>
          </div>
        );

      case 'install-helper':
        return (
          <div className="text-center py-8">
            <div className="w-20 h-20 mx-auto mb-6 bg-amber-500/20 rounded-full flex items-center justify-center border border-amber-500/30">
              <Download className="w-10 h-10 text-amber-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">One More Thing</h2>
            <p className="text-zinc-400 mb-8 max-w-sm mx-auto">
              FeelingWise needs a small helper program to protect your family's browsing.
            </p>

            <div className="space-y-4">
              <button
                onClick={() => openOllamaDownload()}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
              >
                <Download size={20} />
                Download Helper
              </button>

              <p className="text-xs text-zinc-500">
                After installing, click the button below.
              </p>

              <button
                onClick={runSetupChecks}
                className="w-full bg-zinc-800 hover:bg-zinc-700 text-white py-3 rounded-xl font-medium transition-colors"
              >
                I've Installed It
              </button>
            </div>
          </div>
        );

      case 'downloading':
        return (
          <div className="text-center py-8">
            <div className="w-20 h-20 mx-auto mb-6 bg-indigo-500/20 rounded-full flex items-center justify-center border border-indigo-500/30">
              <Shield className="w-10 h-10 text-indigo-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Preparing Protection</h2>
            <p className="text-zinc-400 mb-8">
              Downloading the content analyzer...
            </p>

            <div className="max-w-xs mx-auto space-y-3">
              <div className="h-3 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-sm text-zinc-500">
                {progress < 100 ? 'This is a one-time download (~2GB)' : 'Almost done...'}
              </p>
            </div>
          </div>
        );

      case 'extension':
        return (
          <div className="text-center py-8">
            <div className="w-20 h-20 mx-auto mb-6 bg-emerald-500/20 rounded-full flex items-center justify-center border border-emerald-500/30">
              <Puzzle className="w-10 h-10 text-emerald-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Add Browser Protection</h2>
            <p className="text-zinc-400 mb-8 max-w-sm mx-auto">
              Install the browser extension to protect against manipulation on social media.
            </p>

            <div className="space-y-4">
              <button
                onClick={() => openExtensionStore()}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
              >
                <Puzzle size={20} />
                Add to Chrome
              </button>

              <button
                onClick={() => setStep('complete')}
                className="w-full text-zinc-400 hover:text-white py-3 text-sm transition-colors"
              >
                I'll do this later
              </button>
            </div>
          </div>
        );

      case 'complete':
        return (
          <div className="text-center py-8">
            <div className="w-24 h-24 mx-auto mb-6 bg-emerald-500/20 rounded-full flex items-center justify-center border-2 border-emerald-500/50">
              <Sparkles className="w-12 h-12 text-emerald-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">You're All Set!</h2>
            <p className="text-zinc-400 mb-8 max-w-sm mx-auto">
              FeelingWise is ready to protect your family from online manipulation.
            </p>

            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 mb-8 max-w-sm mx-auto text-left">
              <h3 className="text-sm font-bold text-white mb-3">What happens next:</h3>
              <ul className="space-y-2 text-sm text-zinc-400">
                <li className="flex items-start gap-2">
                  <CheckCircle size={16} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span>FeelingWise runs quietly in the background</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle size={16} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span>The browser extension detects manipulative content</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle size={16} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span>All processing stays on your computer - private & fast</span>
                </li>
              </ul>
            </div>

            <button
              onClick={handleComplete}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
            >
              Get Started <ChevronRight size={20} />
            </button>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto bg-zinc-900 rounded-2xl flex items-center justify-center border border-white/10 mb-4">
            <span className="text-3xl font-bold bg-gradient-to-br from-indigo-400 to-emerald-400 bg-clip-text text-transparent">
              F
            </span>
          </div>
          <h1 className="text-lg font-bold text-white">FeelingWise</h1>
          <p className="text-xs text-zinc-500">Content Protection</p>
        </div>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {['checking', 'install-helper', 'downloading', 'extension', 'complete'].map((s, i) => {
            const stepIndex = ['checking', 'install-helper', 'downloading', 'extension', 'complete'].indexOf(step);
            const isActive = step === s;
            const isPast = stepIndex > i;

            // Skip install-helper dot if not needed
            if (s === 'install-helper' && setupStatus?.ollama_installed) return null;

            return (
              <div
                key={s}
                className={`w-2 h-2 rounded-full transition-colors ${
                  isActive ? 'bg-indigo-500' : isPast ? 'bg-emerald-500' : 'bg-zinc-700'
                }`}
              />
            );
          })}
        </div>

        {/* Content */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
          {error ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-red-500/20 rounded-full flex items-center justify-center">
                <span className="text-3xl">!</span>
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Oops!</h2>
              <p className="text-zinc-400 mb-6">{error}</p>
              <button
                onClick={runSetupChecks}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-bold"
              >
                Try Again
              </button>
            </div>
          ) : (
            renderStep()
          )}
        </div>
      </div>
    </div>
  );
};
