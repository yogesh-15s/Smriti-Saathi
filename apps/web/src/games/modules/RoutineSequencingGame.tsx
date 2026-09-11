import React, { useState, useEffect, useRef } from 'react';
import { GameModule, GameConfig, GameResult } from '../types';
import { GameWrapper } from '../components/GameWrapper';
import { CheckCircle2, RotateCcw, ArrowRight } from 'lucide-react';

interface RoutineStep {
  id: string;
  label: string;
  icon: string;
  correctPosition: number; // 1-indexed
}

interface RoutineData {
  routineTitle: string;
  prompt: string;
  steps: RoutineStep[];
}

const DEFAULT_ROUTINES: Record<number, RoutineData[]> = {
  1: [
    {
      routineTitle: 'Making a Warm Cup of Assam Tea',
      prompt: 'Arrange the steps for preparing a peaceful morning tea.',
      steps: [
        { id: 's1', label: 'Boil fresh water in the kettle', icon: '🫖', correctPosition: 1 },
        { id: 's2', label: 'Add rich black tea leaves to steep', icon: '🍃', correctPosition: 2 },
        { id: 's3', label: 'Pour fragrant tea into your cup', icon: '☕', correctPosition: 3 },
      ],
    },
    {
      routineTitle: 'Morning Gentle Routine',
      prompt: 'Arrange the sequence for waking up to a fresh day.',
      steps: [
        { id: 'm1', label: 'Wake up and stretch gently in bed', icon: '🌅', correctPosition: 1 },
        { id: 'm2', label: 'Wash face and brush teeth', icon: '🪥', correctPosition: 2 },
        { id: 'm3', label: 'Enjoy a glass of warm water', icon: '🥛', correctPosition: 3 },
      ],
    },
  ],
  2: [
    {
      routineTitle: 'Planting a Garden Blossom',
      prompt: 'Order the steps to plant and care for a garden flower.',
      steps: [
        { id: 'p1', label: 'Dig a small gentle hole in the soil', icon: '🌱', correctPosition: 1 },
        { id: 'p2', label: 'Carefully place the tender seedling', icon: '🌿', correctPosition: 2 },
        { id: 'p3', label: 'Gently cover the roots with soft earth', icon: '🪴', correctPosition: 3 },
        { id: 'p4', label: 'Shower with clean cool water', icon: '🚿', correctPosition: 4 },
      ],
    },
  ],
  3: [
    {
      routineTitle: 'Evening Wind-Down & Rest',
      prompt: 'Order the peaceful steps before a good night sleep.',
      steps: [
        { id: 'e1', label: 'Have a light and healthy warm dinner', icon: '🍲', correctPosition: 1 },
        { id: 'e2', label: 'Take your evening prescribed medicines', icon: '💊', correctPosition: 2 },
        { id: 'e3', label: 'Read a favorite peaceful book', icon: '📖', correctPosition: 3 },
        { id: 'e4', label: 'Dim the bedroom lights for restful sleep', icon: '🌙', correctPosition: 4 },
      ],
    },
  ],
};

// Shuffler that ensures the initial list is not already in correct order
function shuffleSteps(steps: RoutineStep[]): RoutineStep[] {
  const arr = [...steps];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  // If shuffle accidentally yielded identical order, swap first two
  if (arr.every((s, idx) => s.correctPosition === idx + 1) && arr.length > 1) {
    [arr[0], arr[1]] = [arr[1], arr[0]];
  }
  return arr;
}

const RoutineSequencingComponent: React.FC<GameConfig> = ({
  difficulty,
  speak,
  onBack,
  onComplete,
}) => {
  const routines = DEFAULT_ROUTINES[difficulty] || DEFAULT_ROUTINES[1];
  const [routineIndex, setRoutineIndex] = useState(0);
  const currentRoutine = routines[routineIndex % routines.length];

  const [orderedSteps, setOrderedSteps] = useState<RoutineStep[]>([]);
  const [hasChecked, setHasChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [completedResult, setCompletedResult] = useState<GameResult | null>(null);

  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    const shuffled = shuffleSteps(currentRoutine.steps);
    setOrderedSteps(shuffled);
    setHasChecked(false);
    setIsCorrect(false);
    speak(`${currentRoutine.routineTitle}. ${currentRoutine.prompt}`);
  }, [routineIndex]);

  // Move step item up or down in order
  const moveStep = (index: number, direction: 'up' | 'down') => {
    if (hasChecked) return;
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= orderedSteps.length) return;

    const updated = [...orderedSteps];
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;
    setOrderedSteps(updated);
  };

  const handleCheckOrder = () => {
    const correct = orderedSteps.every((s, idx) => s.correctPosition === idx + 1);
    setIsCorrect(correct);
    setHasChecked(true);

    if (correct) {
      speak(
        `Wonderful! The routine is in the perfect peaceful order! You did a marvelous job.`
      );
    } else {
      speak(
        `Very thoughtful try. Let's look at the gentle natural sequence together.`
      );
    }
  };

  const handleNextRound = () => {
    const score = isCorrect ? 100 : 60;
    const duration = Math.round((Date.now() - startTimeRef.current) / 1000);

    const result: GameResult = {
      score,
      durationSeconds: Math.max(15, duration),
      metrics: { routine: currentRoutine.routineTitle, isCorrect },
    };

    setCompletedResult(result);
    onComplete(result);
  };

  const handleResetOrder = () => {
    setOrderedSteps(shuffleSteps(currentRoutine.steps));
    setHasChecked(false);
  };

  return (
    <GameWrapper
      title="Daily Routine Steps"
      icon="🫖"
      difficulty={difficulty}
      instructionsAudioText={`Put the steps of the daily task into the right order from first to last. Use the gentle up and down buttons.`}
      speak={speak}
      onBack={onBack}
      completedResult={completedResult}
      onPlayAgain={() => {
        setCompletedResult(null);
        setRoutineIndex((i) => i + 1);
        startTimeRef.current = Date.now();
      }}
    >
      <div className="space-y-6">
        {/* Banner */}
        <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl">📋</span>
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                {currentRoutine.routineTitle}
              </h3>
              <p className="text-sm font-semibold text-slate-600">
                {currentRoutine.prompt}
              </p>
            </div>
          </div>

          {!hasChecked && (
            <button
              onClick={handleResetOrder}
              className="p-2.5 rounded-2xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 flex items-center gap-1.5 text-xs font-bold"
              title="Shuffle steps again"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Steps List (Senior friendly with clear Up / Down buttons) */}
        <div className="space-y-3">
          {orderedSteps.map((step, idx) => {
            const isStepCorrect = hasChecked && step.correctPosition === idx + 1;

            return (
              <div
                key={step.id}
                className={`p-4 sm:p-6 rounded-3xl border-4 transition-all flex items-center justify-between gap-4 ${
                  hasChecked
                    ? isStepCorrect
                      ? 'bg-emerald-50 border-emerald-500 shadow-md'
                      : 'bg-amber-50 border-amber-400'
                    : 'bg-white border-slate-200 hover:border-emerald-400 shadow-sm'
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* Step Number Badge */}
                  <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white font-black text-xl flex items-center justify-center shrink-0">
                    {idx + 1}
                  </div>

                  <span className="text-4xl select-none">{step.icon}</span>

                  <div>
                    <h4 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                      {step.label}
                    </h4>
                    {hasChecked && !isStepCorrect && (
                      <p className="text-xs font-bold text-amber-800 mt-1">
                        (Should naturally be step #{step.correctPosition})
                      </p>
                    )}
                  </div>
                </div>

                {/* Move Controls */}
                {!hasChecked && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => moveStep(idx, 'up')}
                      disabled={idx === 0}
                      className={`p-3 rounded-2xl font-black text-lg transition-all ${
                        idx === 0
                          ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                          : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900 active:scale-90'
                      }`}
                      title="Move up"
                    >
                      ▲
                    </button>
                    <button
                      onClick={() => moveStep(idx, 'down')}
                      disabled={idx === orderedSteps.length - 1}
                      className={`p-3 rounded-2xl font-black text-lg transition-all ${
                        idx === orderedSteps.length - 1
                          ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                          : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900 active:scale-90'
                      }`}
                      title="Move down"
                    >
                      ▼
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Action / Feedback Section */}
        {!hasChecked ? (
          <div className="pt-2 flex justify-end">
            <button
              onClick={handleCheckOrder}
              className="w-full sm:w-auto px-10 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xl shadow-lg active:scale-95 transition-all"
            >
              Check My Order
            </button>
          </div>
        ) : (
          <div className="p-6 rounded-3xl bg-white border-4 border-emerald-300 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in">
            <div className="flex items-center gap-4">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 shrink-0" />
              <div>
                <h4 className="text-2xl font-black text-slate-900">
                  {isCorrect ? 'Perfect Routine Order! 🌟' : 'Routine Completed! 🌿'}
                </h4>
                <p className="text-base font-semibold text-slate-600">
                  {isCorrect
                    ? 'All steps are in natural sequence.'
                    : 'Sequencing everyday tasks keeps procedural memory resilient.'}
                </p>
              </div>
            </div>

            <button
              onClick={handleNextRound}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-lg shadow-lg active:scale-95 transition-all"
            >
              Continue
            </button>
          </div>
        )}
      </div>
    </GameWrapper>
  );
};

export const RoutineSequencingGameModule: GameModule = {
  id: 'routine_sequencing',
  name: 'Daily Routine Steps',
  category: 'matching_sorting',
  categoryLabel: 'Matching & Sorting',
  description: 'Put morning tea or garden routines into the peaceful right order.',
  icon: '🫖',
  instructions_audio_text:
    'Daily routine ordering. Arrange the steps of a familiar routine into the right order.',
  render: (config) => <RoutineSequencingComponent {...config} />,
};
