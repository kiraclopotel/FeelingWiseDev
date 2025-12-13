import React, { useState, useEffect } from 'react';
import {
  Cpu, HardDrive, CheckCircle, XCircle, Download,
  AlertTriangle, Loader2, ChevronRight, RefreshCw, ExternalLink
} from 'lucide-react';
import {
  getSystemInfo,
  checkOllamaInstalled,
  getOllamaStatus,
  startOllama,
  getRecommendedModels,
  pullModel,
  isTauri,
  SystemInfo,
  OllamaStatus,
  RecommendedModel,
} from '../services/localAIService';

interface SetupWizardProps {
  onComplete: () => void;
  onSkip?: () => void;
}

type SetupStep = 'requirements' | 'ollama' | 'model' | 'downloading' | 'complete';

export const SetupWizard: React.FC<SetupWizardProps> = ({ onComplete, onSkip }) => {
  const [currentStep, setCurrentStep] = useState<SetupStep>('requirements');
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [ollamaInstalled, setOllamaInstalled] = useState<boolean | null>(null);
  const [ollamaStatus, setOllamaStatus] = useState<OllamaStatus | null>(null);
  const [recommendedModels, setRecommendedModels] = useState<RecommendedModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [downloadStatus, setDownloadStatus] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if we're in Tauri
  const inTauri = isTauri();

  // Step 1: Check system requirements
  useEffect(() => {
    async function checkRequirements() {
      if (!inTauri) {
        setSystemInfo({
          total_ram_gb: 16,
          available_ram_gb: 8,
          cpu_cores: 8,
          cpu_name: 'Browser Mode',
          gpu_info: null,
          recommended_model: 'phi3:mini',
          can_run_local_ai: false,
        });
        setIsLoading(false);
        return;
      }

      try {
        const info = await getSystemInfo();
        setSystemInfo(info);

        const installed = await checkOllamaInstalled();
        setOllamaInstalled(installed);

        const models = await getRecommendedModels();
        setRecommendedModels(models);
        if (info.recommended_model) {
          setSelectedModel(info.recommended_model);
        } else if (models.length > 0) {
          setSelectedModel(models[0].name);
        }

        if (installed) {
          const status = await getOllamaStatus();
          setOllamaStatus(status);

          // If Ollama is running and has models, we might be done
          if (status.running && status.models_available.length > 0) {
            setCurrentStep('complete');
          }
        }
      } catch (err) {
        setError(`Failed to check system: ${err}`);
      } finally {
        setIsLoading(false);
      }
    }

    checkRequirements();
  }, [inTauri]);

  // Step 2: Start Ollama
  const handleStartOllama = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await startOllama();
      const status = await getOllamaStatus();
      setOllamaStatus(status);
      setCurrentStep('model');
    } catch (err) {
      setError(`Failed to start Ollama: ${err}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Download model
  const handleDownloadModel = async () => {
    if (!selectedModel) return;

    setCurrentStep('downloading');
    setDownloadProgress(0);
    setDownloadStatus('Preparing download...');
    setError(null);

    try {
      // Note: Real progress would come from Tauri events
      // For now, simulate progress
      const progressInterval = setInterval(() => {
        setDownloadProgress(prev => {
          if (prev >= 95) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + Math.random() * 10;
        });
        setDownloadStatus('Downloading model layers...');
      }, 500);

      await pullModel(selectedModel);

      clearInterval(progressInterval);
      setDownloadProgress(100);
      setDownloadStatus('Complete!');

      // Refresh status
      const status = await getOllamaStatus();
      setOllamaStatus(status);

      setTimeout(() => setCurrentStep('complete'), 1000);
    } catch (err) {
      setError(`Failed to download model: ${err}`);
      setCurrentStep('model');
    }
  };

  // Render different steps
  const renderStep = () => {
    if (isLoading && currentStep === 'requirements') {
      return (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
          <p className="text-zinc-400">Checking system requirements...</p>
        </div>
      );
    }

    switch (currentStep) {
      case 'requirements':
        return renderRequirementsStep();
      case 'ollama':
        return renderOllamaStep();
      case 'model':
        return renderModelStep();
      case 'downloading':
        return renderDownloadingStep();
      case 'complete':
        return renderCompleteStep();
      default:
        return null;
    }
  };

  const renderRequirementsStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">System Check</h2>
        <p className="text-zinc-400">
          FeelingWise uses local AI for private, fast content analysis.
        </p>
      </div>

      {systemInfo && (
        <div className="space-y-4">
          {/* Hardware Info */}
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4">
            <div className="flex items-center gap-3 mb-4">
              <Cpu className="text-indigo-400" size={24} />
              <div>
                <h3 className="font-bold text-white">Hardware</h3>
                <p className="text-xs text-zinc-500">{systemInfo.cpu_name}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-zinc-950 rounded-lg p-3">
                <div className="text-xs text-zinc-500 mb-1">RAM</div>
                <div className="text-lg font-bold text-white">
                  {systemInfo.total_ram_gb.toFixed(1)} GB
                </div>
                <div className="text-xs text-zinc-500">
                  {systemInfo.available_ram_gb.toFixed(1)} GB available
                </div>
              </div>

              <div className="bg-zinc-950 rounded-lg p-3">
                <div className="text-xs text-zinc-500 mb-1">GPU</div>
                <div className="text-lg font-bold text-white">
                  {systemInfo.gpu_info?.name || 'None detected'}
                </div>
                <div className="text-xs text-zinc-500">
                  {systemInfo.gpu_info?.vram_mb
                    ? `${(systemInfo.gpu_info.vram_mb / 1024).toFixed(1)} GB VRAM`
                    : 'CPU inference'}
                </div>
              </div>
            </div>
          </div>

          {/* Requirements Status */}
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4">
            <h3 className="font-bold text-white mb-3">Requirements</h3>

            <div className="space-y-2">
              <RequirementRow
                label="Minimum RAM (4GB)"
                met={systemInfo.total_ram_gb >= 4}
              />
              <RequirementRow
                label="Can run local AI"
                met={systemInfo.can_run_local_ai || inTauri}
              />
              <RequirementRow
                label="Desktop app mode"
                met={inTauri}
              />
            </div>
          </div>

          {/* Recommended Model */}
          {systemInfo.recommended_model && (
            <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4">
              <div className="flex items-center gap-2 text-indigo-400 mb-2">
                <HardDrive size={16} />
                <span className="text-xs font-bold uppercase tracking-wider">Recommended Model</span>
              </div>
              <p className="text-white font-medium">{systemInfo.recommended_model}</p>
              <p className="text-xs text-zinc-400 mt-1">
                Based on your system's capabilities
              </p>
            </div>
          )}
        </div>
      )}

      {!inTauri && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-amber-400 mt-0.5" size={20} />
            <div>
              <h4 className="font-bold text-amber-200">Browser Mode</h4>
              <p className="text-sm text-zinc-400 mt-1">
                You're running in browser mode. Local AI features require the desktop app.
                The app will use cloud AI fallback or mock data.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-4">
        {onSkip && (
          <button
            onClick={onSkip}
            className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-3 rounded-xl font-medium transition-colors"
          >
            Skip Setup
          </button>
        )}
        <button
          onClick={() => {
            if (!inTauri) {
              onComplete();
            } else if (ollamaInstalled) {
              setCurrentStep('ollama');
            } else {
              setCurrentStep('ollama');
            }
          }}
          className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
        >
          Continue <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );

  const renderOllamaStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Ollama Setup</h2>
        <p className="text-zinc-400">
          FeelingWise uses Ollama for local AI inference.
        </p>
      </div>

      <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
        {ollamaInstalled ? (
          <div className="text-center">
            <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
            <h3 className="font-bold text-white text-lg mb-2">Ollama Installed</h3>
            <p className="text-zinc-400 text-sm mb-6">
              {ollamaStatus?.running
                ? 'Ollama is running and ready.'
                : 'Ollama is installed but not running.'}
            </p>

            {!ollamaStatus?.running && (
              <button
                onClick={handleStartOllama}
                disabled={isLoading}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 mx-auto disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <RefreshCw size={18} />
                )}
                Start Ollama
              </button>
            )}
          </div>
        ) : (
          <div className="text-center">
            <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h3 className="font-bold text-white text-lg mb-2">Ollama Not Found</h3>
            <p className="text-zinc-400 text-sm mb-6">
              Please install Ollama to use local AI features.
            </p>

            <a
              href="https://ollama.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-bold inline-flex items-center gap-2"
            >
              <Download size={18} />
              Download Ollama
              <ExternalLink size={14} />
            </a>

            <p className="text-xs text-zinc-500 mt-4">
              After installing, restart this app and run setup again.
            </p>
          </div>
        )}
      </div>

      {ollamaStatus?.running && (
        <button
          onClick={() => setCurrentStep('model')}
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
        >
          Continue to Model Selection <ChevronRight size={18} />
        </button>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm">
          {error}
        </div>
      )}
    </div>
  );

  const renderModelStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Choose AI Model</h2>
        <p className="text-zinc-400">
          Select a model based on your system's capabilities.
        </p>
      </div>

      {/* Available models on system */}
      {ollamaStatus && ollamaStatus.models_available.length > 0 && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
          <h3 className="text-emerald-400 font-bold text-sm mb-2">Models Already Installed</h3>
          <div className="flex flex-wrap gap-2">
            {ollamaStatus.models_available.map(model => (
              <span
                key={model}
                className="bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full text-xs font-medium"
              >
                {model}
              </span>
            ))}
          </div>

          <button
            onClick={onComplete}
            className="w-full mt-4 bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-bold"
          >
            Use Existing Model
          </button>
        </div>
      )}

      {/* Model selection */}
      <div className="space-y-3">
        <h3 className="text-zinc-400 text-xs font-bold uppercase tracking-wider">
          Download New Model
        </h3>

        {recommendedModels.map(model => (
          <button
            key={model.name}
            onClick={() => setSelectedModel(model.name)}
            className={`w-full p-4 rounded-xl border text-left transition-all ${
              selectedModel === model.name
                ? 'bg-indigo-500/10 border-indigo-500'
                : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-bold text-white">{model.display_name}</h4>
                <p className="text-xs text-zinc-400 mt-1">{model.description}</p>
              </div>
              <div className="text-right">
                <div className="text-sm font-mono text-zinc-500">
                  {model.size_gb} GB
                </div>
                <div className="text-xs text-zinc-600">
                  Min {model.min_ram_gb}GB RAM
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      <button
        onClick={handleDownloadModel}
        disabled={!selectedModel}
        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
      >
        <Download size={18} />
        Download Selected Model
      </button>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm">
          {error}
        </div>
      )}
    </div>
  );

  const renderDownloadingStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Downloading Model</h2>
        <p className="text-zinc-400">
          This may take a few minutes depending on your connection.
        </p>
      </div>

      <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-8">
        <div className="flex items-center justify-center mb-6">
          <Loader2 className="w-16 h-16 text-indigo-500 animate-spin" />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between text-sm">
            <span className="text-zinc-400">{downloadStatus}</span>
            <span className="text-white font-mono">{Math.round(downloadProgress)}%</span>
          </div>

          <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 transition-all duration-300"
              style={{ width: `${downloadProgress}%` }}
            />
          </div>

          <p className="text-xs text-zinc-500 text-center">
            Downloading {selectedModel}...
          </p>
        </div>
      </div>
    </div>
  );

  const renderCompleteStep = () => (
    <div className="space-y-6">
      <div className="text-center py-8">
        <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-emerald-500">
          <CheckCircle className="w-10 h-10 text-emerald-400" />
        </div>

        <h2 className="text-2xl font-bold text-white mb-2">Setup Complete!</h2>
        <p className="text-zinc-400 max-w-sm mx-auto">
          FeelingWise is ready to analyze and neutralize content locally on your device.
        </p>
      </div>

      {ollamaStatus && ollamaStatus.models_available.length > 0 && (
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4">
          <h3 className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-3">
            Available Models
          </h3>
          <div className="flex flex-wrap gap-2">
            {ollamaStatus.models_available.map(model => (
              <span
                key={model}
                className="bg-zinc-800 text-zinc-300 px-3 py-1 rounded-full text-sm"
              >
                {model}
              </span>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={onComplete}
        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-xl font-bold text-lg transition-colors"
      >
        Start Using FeelingWise
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {['requirements', 'ollama', 'model', 'complete'].map((step, index) => (
            <React.Fragment key={step}>
              <div
                className={`w-3 h-3 rounded-full transition-colors ${
                  currentStep === step
                    ? 'bg-indigo-500'
                    : ['requirements', 'ollama', 'model', 'complete'].indexOf(currentStep) > index
                      ? 'bg-emerald-500'
                      : 'bg-zinc-700'
                }`}
              />
              {index < 3 && (
                <div className="w-8 h-0.5 bg-zinc-800" />
              )}
            </React.Fragment>
          ))}
        </div>

        {renderStep()}
      </div>
    </div>
  );
};

// Helper component
const RequirementRow: React.FC<{ label: string; met: boolean }> = ({ label, met }) => (
  <div className="flex items-center justify-between py-2 border-b border-zinc-800 last:border-0">
    <span className="text-zinc-300 text-sm">{label}</span>
    {met ? (
      <CheckCircle className="text-emerald-400" size={18} />
    ) : (
      <XCircle className="text-red-400" size={18} />
    )}
  </div>
);
