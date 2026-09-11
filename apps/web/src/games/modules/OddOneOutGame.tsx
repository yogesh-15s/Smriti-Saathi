import React, { useState, useEffect, useRef } from 'react';
import { GameModule, GameConfig, GameResult } from '../types';
import { GameWrapper } from '../components/GameWrapper';
import { CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';

interface OddItem {
  id: string;
  label: string;
  icon: string;
  isOdd: boolean;
}

interface OddOneOutSet {
  categoryLabel: string;
  explanation: string;
  items: OddItem[];
}

const DEFAULT_SETS: Record<number, OddOneOutSet[]> = {
  1: [
    {
      categoryLabel: 'Sweet Garden Fruits',
      explanation: 'The Bicycle is for riding, while the others are sweet juicy fruits! 🍎🚲',
      items: [
        { id: 'apple', label: 'Crisp Apple', icon: '🍎', isOdd: false },
        { id: 'banana', label: 'Sweet Banana', icon: '🍌', isOdd: false },
        { id: 'bicycle', label: 'Bicycle', icon: '🚲', isOdd: true },
        { id: 'orange', label: 'Juicy Orange', icon: '🍊', isOdd: false },
      ],
    },
    {
      categoryLabel: 'Things in the Sky',
      explanation: 'The Fish swims in the river water, while the others fly in the sky! 🕊️🐟',
      items: [
        { id: 'cloud', label: 'White Cloud', icon: '☁️', isOdd: false },
        { id: 'bird', label: 'Singing Bird', icon: '🕊️', isOdd: false },
        { id: 'sun', label: 'Golden Sun', icon: '☀️', isOdd: false },
        { id: 'fish', label: 'River Fish', icon: '🐟', isOdd: true },
      ],
    },
  ],
  2: [
    {
      categoryLabel: 'Birds of the North East',
      explanation: 'The River Fish swims in cool waters, while all the others are beautiful feathered birds! 🦤🐟',
      items: [
        { id: 'hornbill', label: 'Great Hornbill', icon: '🦤', isOdd: false },
        { id: 'myna', label: 'Assam Hill Myna', icon: '🐦', isOdd: false },
        { id: 'fish', label: 'River Golden Fish', icon: '🐟', isOdd: true },
        { id: 'dove', label: 'Gentle Dove', icon: '🕊️', isOdd: false },
        { id: 'duck', label: 'White-winged Duck', icon: '🦆', isOdd: false },
      ],
    },
  ],
  3: [
    {
      categoryLabel: 'Assam Morning Tea Preparation',
      explanation: 'A Hammer is a workshop tool, while the other items are for brewing and enjoying warm Assam tea! 🍵🔨',
      items: [
        { id: 'teacup', label: 'Fresh Assam Tea', icon: '🍵', isOdd: false },
        { id: 'kettle', label: 'Boiling Kettle', icon: '🫖', isOdd: false },
        { id: 'leaves', label: 'Green Tea Leaves', icon: '🍃', isOdd: false },
        { id: 'hammer', label: 'Iron Hammer', icon: '🔨', isOdd: true },
        { id: 'teapot', label: 'Ceramic Teapot', icon: '☕', isOdd: false },
      ],
    },
  ],
};

const OddOneOutComponent: React.FC<GameConfig> = ({
  difficulty,
  speak,
  onBack,
  onComplete,
}) => {
  const sets = DEFAULT_SETS[difficulty] || DEFAULT_SETS[1];
  const [setIndex, setSetIndex] = useState(0);
  const currentSet = sets[setIndex % sets.length];

  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [completedResult, setCompletedResult] = useState<GameResult | null>(null);

  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    setSelectedItemId(null);
    setHasAnswered(false);
    speak(
      `Look at these items. Most belong to ${currentSet.categoryLabel}. Tap the one that does not belong.`
    );
  }, [setIndex]);

  const handleSelectItem = (item: OddItem) => {
    if (hasAnswered) return;

    setSelectedItemId(item.id);
    setHasAnswered(true);

    if (item.isOdd) {
      speak(`Excellent! You found the odd one out! ${currentSet.explanation}`);
    } else {
      speak(`Good try! Actually, ${currentSet.explanation}`);
    }
  };

  const handleFinishRound = () => {
    const selected = currentSet.items.find((i) => i.id === selectedItemId);
    const score = selected?.isOdd ? 100 : 50;
    const duration = Math.round((Date.now() - startTimeRef.current) / 1000);

    const result: GameResult = {
      score,
      durationSeconds: Math.max(15, duration),
      metrics: { category: currentSet.categoryLabel, selectedOdd: selected?.isOdd },
    };

    setCompletedResult(result);
    onComplete(result);
  };

  const oddItem = currentSet.items.find((i) => i.isOdd);
  const isCorrect = selectedItemId === oddItem?.id;

  return (
    <GameWrapper
      title="Odd One Out"
      icon="🔍"
      difficulty={difficulty}
      instructionsAudioText={`Tap the card that does not belong with the others. Take your time.`}
      speak={speak}
      onBack={onBack}
      completedResult={completedResult}
      onPlayAgain={() => {
        setCompletedResult(null);
        setSetIndex((i) => i + 1);
        startTimeRef.current = Date.now();
      }}
    >
      <div className="space-y-6">
        {/* Banner */}
        <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🤔</span>
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                Theme: {currentSet.categoryLabel}
              </h3>
              <p className="text-sm font-semibold text-slate-600">
                Which of these friendly items doesn't belong with the group?
              </p>
            </div>
          </div>
        </div>

        {/* Card Grid (Large, senior touch targets) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
          {currentSet.items.map((item) => {
            const isSelected = selectedItemId === item.id;
            const showOddHighlight = hasAnswered && item.isOdd;

            return (
              <button
                key={item.id}
                disabled={hasAnswered}
                onClick={() => handleSelectItem(item)}
                className={`p-6 sm:p-8 rounded-3xl border-4 transition-all flex flex-col items-center justify-center gap-3 text-center min-h-[160px] active:scale-95 ${
                  hasAnswered
                    ? showOddHighlight
                      ? 'bg-emerald-100 border-emerald-500 scale-105 shadow-xl ring-4 ring-emerald-300'
                      : isSelected && !item.isOdd
                      ? 'bg-amber-100 border-amber-400 opacity-80'
                      : 'bg-white border-slate-200 opacity-60'
                    : 'bg-white border-emerald-200 hover:border-emerald-500 hover:scale-105 shadow-md hover:shadow-xl'
                }`}
              >
                <span className="text-5xl sm:text-6xl select-none">{item.icon}</span>
                <span className="text-lg sm:text-xl font-black text-slate-900 leading-tight">
                  {item.label}
                </span>

                {hasAnswered && item.isOdd && (
                  <span className="px-3 py-1 rounded-full bg-emerald-600 text-white text-xs font-black shadow-xs">
                    Odd One Out ✨
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Feedback and Next Button */}
        {hasAnswered && (
          <div className="p-6 rounded-3xl bg-white border-4 border-emerald-300 shadow-xl space-y-4 animate-fade-in">
            <div className="flex items-start gap-4">
              {isCorrect ? (
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-7 h-7" />
                </div>
              )}
              <div className="space-y-1">
                <h4 className="text-2xl font-black text-slate-900">
                  {isCorrect ? 'Well Spotted! 🌟' : 'A Very Thoughtful Guess! 🌿'}
                </h4>
                <p className="text-base sm:text-lg font-semibold text-slate-700 leading-relaxed">
                  {currentSet.explanation}
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={handleFinishRound}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-lg shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95"
              >
                <span>Continue</span>
                <ArrowRight className="w-6 h-6" />
              </button>
            </div>
          </div>
        )}
      </div>
    </GameWrapper>
  );
};

export const OddOneOutGameModule: GameModule = {
  id: 'odd_one_out',
  name: 'Odd One Out',
  category: 'matching_sorting',
  categoryLabel: 'Matching & Sorting',
  description: 'Find which friendly item does not belong to the group.',
  icon: '🔍',
  instructions_audio_text:
    'Odd One Out. Look at the friendly pictures. Most belong together. Tap the one picture that is different.',
  render: (config) => <OddOneOutComponent {...config} />,
};
