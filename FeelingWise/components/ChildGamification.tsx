import React, { useState } from 'react';
import { UserProgress } from '../types';
import { generateCard } from '../services/gamificationService';
import { GuardianCard } from './GuardianCard';
import { QUIZ_QUESTIONS } from '../constants';
import { 
  Sparkles, Award, History, Share2, 
  HelpCircle, CheckCircle, XCircle, ArrowRight 
} from 'lucide-react';

interface ChildGamificationProps {
  progress: UserProgress;
  setProgress: React.Dispatch<React.SetStateAction<UserProgress>>;
}

export const ChildGamification: React.FC<ChildGamificationProps> = ({ progress, setProgress }) => {
  const [showHistory, setShowHistory] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Quiz State
  const [showQuiz, setShowQuiz] = useState(false);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [quizComplete, setQuizComplete] = useState(false);

  const handleGenerate = () => {
    if (progress.points < 50) return;
    
    setIsGenerating(true);
    // Deduct points immediately
    setProgress(prev => ({ ...prev, points: prev.points - 50 }));

    setTimeout(() => {
      const newCard = generateCard(progress.level);
      setProgress(prev => ({
        ...prev,
        currentCard: newCard,
        collection: [newCard, ...prev.collection]
      }));
      setIsGenerating(false);
    }, 2000); // 2s animation
  };

  const handleQuizAnswer = (idx: number) => {
    setSelectedOption(idx);
    setShowExplanation(true);
    if (idx === QUIZ_QUESTIONS[currentQuestionIdx].correctIndex) {
      setQuizScore(prev => prev + 1);
    }
  };

  const nextQuestion = () => {
    setSelectedOption(null);
    setShowExplanation(false);
    if (currentQuestionIdx < QUIZ_QUESTIONS.length - 1) {
      setCurrentQuestionIdx(prev => prev + 1);
    } else {
      setQuizComplete(true);
      // Award points
      const pointsEarned = 10; // Flat reward for completion
      setProgress(prev => ({
        ...prev,
        points: prev.points + pointsEarned,
        quizCompletedToday: true
      }));
    }
  };

  const closeQuiz = () => {
    setShowQuiz(false);
    // Reset for next time (in a real app, we'd lock it)
    setTimeout(() => {
        setQuizComplete(false);
        setCurrentQuestionIdx(0);
        setQuizScore(0);
    }, 500);
  };

  if (showQuiz) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl relative overflow-hidden min-h-[500px] flex flex-col">
        {!quizComplete ? (
          <>
            <div className="flex justify-between items-center mb-6">
               <h3 className="text-indigo-400 font-bold uppercase tracking-widest text-xs flex items-center gap-2">
                 <HelpCircle size={14} /> Daily Quiz
               </h3>
               <span className="text-zinc-500 text-xs font-mono">{currentQuestionIdx + 1}/{QUIZ_QUESTIONS.length}</span>
            </div>
            
            <div className="flex-1">
              <h4 className="text-lg font-bold text-white mb-6 leading-relaxed">
                {QUIZ_QUESTIONS[currentQuestionIdx].question}
              </h4>

              <div className="space-y-3">
                {QUIZ_QUESTIONS[currentQuestionIdx].options.map((opt, i) => {
                  const isSelected = selectedOption === i;
                  const isCorrect = i === QUIZ_QUESTIONS[currentQuestionIdx].correctIndex;
                  const showResult = showExplanation;
                  
                  let style = "bg-zinc-950 border-zinc-800 text-zinc-300 hover:bg-zinc-800";
                  if (showResult) {
                    if (isCorrect) style = "bg-emerald-900/30 border-emerald-500 text-emerald-200";
                    else if (isSelected) style = "bg-red-900/30 border-red-500 text-red-200";
                    else style = "bg-zinc-950 border-zinc-800 opacity-50";
                  }

                  return (
                    <button
                      key={i}
                      disabled={showExplanation}
                      onClick={() => handleQuizAnswer(i)}
                      className={`w-full p-4 rounded-xl border text-left transition-all ${style}`}
                    >
                      <div className="flex justify-between items-center">
                        <span>{opt}</span>
                        {showResult && isCorrect && <CheckCircle size={16} />}
                        {showResult && isSelected && !isCorrect && <XCircle size={16} />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {showExplanation && (
                <div className="mt-6 animate-in fade-in slide-in-from-bottom-4">
                   <div className="bg-indigo-900/20 p-4 rounded-xl border border-indigo-500/20 mb-4">
                      <p className="text-sm text-indigo-200">{QUIZ_QUESTIONS[currentQuestionIdx].explanation}</p>
                   </div>
                   <button 
                     onClick={nextQuestion}
                     className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2"
                   >
                     {currentQuestionIdx < QUIZ_QUESTIONS.length - 1 ? 'Next Question' : 'Finish Quiz'} <ArrowRight size={16} />
                   </button>
                </div>
              )}
            </div>
          </>
        ) : (
           <div className="flex flex-col items-center justify-center flex-1 text-center space-y-6">
              <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center border-2 border-emerald-500 text-emerald-400">
                 <Award size={40} />
              </div>
              <div>
                 <h2 className="text-2xl font-bold text-white mb-2">Quiz Complete!</h2>
                 <p className="text-zinc-400">You earned <span className="text-amber-400 font-bold">+10 Points</span></p>
              </div>
              <button onClick={closeQuiz} className="bg-zinc-800 hover:bg-zinc-700 text-white px-8 py-3 rounded-full font-bold">
                 Collect & Close
              </button>
           </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-full">
      {/* Top Bar: Points */}
      <div className="bg-zinc-900/80 px-6 py-4 border-b border-white/5 flex items-center justify-between">
         <div className="flex items-center gap-2 text-amber-400">
            <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center border border-amber-500/50 text-[10px]">🪙</div>
            <span className="font-bold font-mono text-lg">{progress.points}</span>
         </div>
         <div className="flex gap-2">
            {!progress.quizCompletedToday && (
              <button 
                onClick={() => setShowQuiz(true)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 shadow-lg shadow-indigo-500/20"
              >
                <HelpCircle size={12} /> Daily Quiz (+10)
              </button>
            )}
         </div>
      </div>

      <div className="p-6 flex-1 flex flex-col items-center justify-center">
         {isGenerating ? (
            <div className="flex flex-col items-center justify-center py-12">
               <Sparkles className="text-indigo-400 animate-spin mb-4" size={48} />
               <p className="text-indigo-200 font-bold animate-pulse">Summoning Guardian...</p>
            </div>
         ) : (
            <>
              {showHistory ? (
                <div className="w-full space-y-4">
                   <div className="flex items-center justify-between mb-2">
                      <h3 className="text-zinc-400 text-xs font-bold uppercase">Card Collection ({progress.collection.length})</h3>
                      <button onClick={() => setShowHistory(false)} className="text-xs text-indigo-400 hover:text-white">Back to Active</button>
                   </div>
                   <div className="grid grid-cols-2 gap-2 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin">
                      {progress.collection.map((card) => (
                         <div key={card.id} className="scale-[0.6] origin-top-left -mb-[100px] -mr-[80px]">
                            <GuardianCard card={card} />
                         </div>
                      ))}
                   </div>
                </div>
              ) : (
                <GuardianCard card={progress.currentCard} showNewAnimation={true} />
              )}
            </>
         )}
      </div>

      <div className="p-6 border-t border-white/5 bg-zinc-950/30">
         {!isGenerating && !showHistory && (
           <div className="space-y-3">
              <button 
                onClick={handleGenerate}
                disabled={progress.points < 50}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white py-3 rounded-xl font-bold shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-transform active:scale-95"
              >
                <Sparkles size={16} /> Generate New Card (50 pts)
              </button>
              
              <div className="flex gap-2">
                 <button 
                   onClick={() => setShowHistory(true)}
                   className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2"
                 >
                    <History size={14} /> History
                 </button>
                 <button className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2">
                    <Share2 size={14} /> Share
                 </button>
              </div>
           </div>
         )}
      </div>
    </div>
  );
};