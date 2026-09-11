import React, { useEffect } from 'react';
import { ArrowLeft, Volume2, Sparkles, Brain, CheckCircle2 } from 'lucide-react';
import { GameResult } from '../types';

interface GameWrapperProps {
  title: string;
  icon: string;
  difficulty: number;
  instructionsAudioText: string;
  speak: (text: string) => void;
  onBack: () => void;
  completedResult?: GameResult | null;
  onPlayAgain?: () => void;
  children: React.ReactNode;
}

export const GameWrapper: React.FC<GameWrapperProps> = ({
  title,
  icon,
  difficulty,
  instructionsAudioText,
  speak,
  onBack,
  completedResult,
  onPlayAgain,
  children,
}) => {
  useEffect(() => {
    if (instructionsAudioText) {
      speak(instructionsAudioText);
    }
  }, [instructionsAudioText]);

  const difficultyLabel = difficulty === 1 ? 'Gentle' : difficulty === 2 ? 'Moderate' : 'Active';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Navigation & Calm Pacing Bar */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 border-2 border-emerald-200 shadow-md flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-3 sm:px-4 sm:py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold flex items-center gap-2 transition-all active:scale-95"
            title="Return to game list"
          >
            <ArrowLeft className="w-5 h-5 text-slate-700" />
            <span className="hidden sm:inline">Back</span>
          </button>

          <div className="flex items-center gap-3">
            <span className="text-3xl sm:text-4xl">{icon}</span>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
                {title}
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300">
                  <Brain className="w-3.5 h-3.5 text-emerald-700" />
                  Level {difficulty} • {difficultyLabel}
                </span>
                <span className="text-xs font-medium text-slate-500 hidden md:inline">
                  🌿 Take your time, there is no rush
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Audio Narration Button */}
        <button
          onClick={() => speak(instructionsAudioText)}
          className="px-4 py-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-sm sm:text-base border border-emerald-300 flex items-center gap-2 shadow-xs transition-colors"
          title="Listen to instructions again"
        >
          <Volume2 className="w-5 h-5 text-emerald-700" />
          <span>Hear Instructions</span>
        </button>
      </div>

      {/* Main Game Stage or Completion View */}
      {completedResult ? (
        <div className="bg-white rounded-3xl p-8 sm:p-12 border-4 border-emerald-200 shadow-xl text-center space-y-6 animate-fade-in">
          <div className="w-24 h-24 mx-auto rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <Sparkles className="w-14 h-14 text-emerald-600 animate-pulse" />
          </div>

          <div className="space-y-2">
            <h3 className="text-3xl sm:text-4xl font-black text-slate-900">
              Wonderful Job! 🌟
            </h3>
            <p className="text-lg sm:text-xl font-semibold text-slate-600 max-w-md mx-auto">
              You completed this peaceful exercise. Your mind is sharp and refreshed today!
            </p>
          </div>

          <div className="inline-flex items-center gap-6 px-6 py-4 rounded-2xl bg-emerald-50 border-2 border-emerald-300">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                Score
              </p>
              <p className="text-3xl font-black text-emerald-700">
                {completedResult.score}%
              </p>
            </div>
            <div className="w-px h-10 bg-emerald-300" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                Result
              </p>
              <p className="text-lg font-black text-slate-800 flex items-center gap-1">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 inline" /> Completed
              </p>
            </div>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            {onPlayAgain && (
              <button
                onClick={onPlayAgain}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-lg shadow-lg hover:scale-105 active:scale-95 transition-all"
              >
                Play Another Round
              </button>
            )}
            <button
              onClick={onBack}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-lg border border-slate-300 transition-colors"
            >
              Back to Game Menu
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-emerald-200 shadow-md">
          {children}
        </div>
      )}
    </div>
  );
};
