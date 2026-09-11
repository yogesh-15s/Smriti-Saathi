import React, { useState, useEffect, useRef } from 'react';
import { GameModule, GameConfig, GameResult } from '../types';
import { GameWrapper } from '../components/GameWrapper';
import { CheckCircle2, ArrowRight } from 'lucide-react';

interface SortItem {
  id: string;
  name: string;
  icon: string;
  category: 'A' | 'B';
}

interface CategorySortingSet {
  title: string;
  prompt: string;
  categoryA: { name: string; icon: string };
  categoryB: { name: string; icon: string };
  items: SortItem[];
}

const DEFAULT_SORTING_SETS: Record<number, CategorySortingSet[]> = {
  1: [
    {
      title: 'Garden Harvest Sorting',
      prompt: 'Sort each healthy food into either Fruits or Vegetables.',
      categoryA: { name: 'Fresh Fruits', icon: '🍎' },
      categoryB: { name: 'Garden Vegetables', icon: '🥕' },
      items: [
        { id: '1', name: 'Sweet Mango', icon: '🥭', category: 'A' },
        { id: '2', name: 'Crisp Carrot', icon: '🥕', category: 'B' },
        { id: '3', name: 'Ripe Banana', icon: '🍌', category: 'A' },
        { id: '4', name: 'Green Spinach', icon: '🥬', category: 'B' },
        { id: '5', name: 'Juicy Orange', icon: '🍊', category: 'A' },
        { id: '6', name: 'Fresh Potato', icon: '🥔', category: 'B' },
      ],
    },
  ],
  2: [
    {
      title: 'Creatures of Nature',
      prompt: 'Sort each friendly creature by where it travels.',
      categoryA: { name: 'Creatures That Fly', icon: '🪶' },
      categoryB: { name: 'Animals On Land', icon: '🐾' },
      items: [
        { id: '1', name: 'Great Hornbill', icon: '🦤', category: 'A' },
        { id: '2', name: 'Gentle Elephant', icon: '🐘', category: 'B' },
        { id: '3', name: 'Colorful Butterfly', icon: '🦋', category: 'A' },
        { id: '4', name: 'Spotted Deer', icon: '🦌', category: 'B' },
        { id: '5', name: 'Assam Myna', icon: '🐦', category: 'A' },
        { id: '6', name: 'Sturdy Rhinoceros', icon: '🦏', category: 'B' },
      ],
    },
  ],
  3: [
    {
      title: 'Warm & Cool Comforts',
      prompt: 'Sort each sensation into Warm Things or Cool Things.',
      categoryA: { name: 'Warm Comforts', icon: '☀️' },
      categoryB: { name: 'Cool Sights', icon: '❄️' },
      items: [
        { id: '1', name: 'Fresh Steaming Tea', icon: '🍵', category: 'A' },
        { id: '2', name: 'Mountain Snow', icon: '🏔️', category: 'B' },
        { id: '3', name: 'Morning Sunshine', icon: '☀️', category: 'A' },
        { id: '4', name: 'Chilled River Water', icon: '🧊', category: 'B' },
        { id: '5', name: 'Campfire Flame', icon: '🔥', category: 'A' },
        { id: '6', name: 'Cold Lime Sherbet', icon: '🍧', category: 'B' },
      ],
    },
  ],
};

const CategorySortingComponent: React.FC<GameConfig> = ({
  difficulty,
  speak,
  onBack,
  onComplete,
}) => {
  const sets = DEFAULT_SORTING_SETS[difficulty] || DEFAULT_SORTING_SETS[1];
  const [setIndex, setSetIndex] = useState(0);
  const currentSet = sets[setIndex % sets.length];

  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [sortedA, setSortedA] = useState<SortItem[]>([]);
  const [sortedB, setSortedB] = useState<SortItem[]>([]);
  const [correctCount, setCorrectCount] = useState(0);
  const [completedResult, setCompletedResult] = useState<GameResult | null>(null);

  const startTimeRef = useRef<number>(Date.now());
  const currentItem = currentSet.items[currentItemIndex];
  const isFinished = currentItemIndex >= currentSet.items.length;

  useEffect(() => {
    setCurrentItemIndex(0);
    setSortedA([]);
    setSortedB([]);
    setCorrectCount(0);
    speak(`${currentSet.title}. ${currentSet.prompt}`);
  }, [setIndex]);

  const handleSort = (destination: 'A' | 'B') => {
    if (isFinished || !currentItem) return;

    const isMatch = currentItem.category === destination;
    if (isMatch) {
      setCorrectCount((c) => c + 1);
      speak(`Good! Placed in ${destination === 'A' ? currentSet.categoryA.name : currentSet.categoryB.name}.`);
    } else {
      speak(`Placed in ${destination === 'A' ? currentSet.categoryA.name : currentSet.categoryB.name}.`);
    }

    if (destination === 'A') {
      setSortedA((prev) => [...prev, currentItem]);
    } else {
      setSortedB((prev) => [...prev, currentItem]);
    }

    const nextIndex = currentItemIndex + 1;
    setCurrentItemIndex(nextIndex);

    if (nextIndex >= currentSet.items.length) {
      const finalCorrect = correctCount + (isMatch ? 1 : 0);
      const score = Math.round((finalCorrect / currentSet.items.length) * 100);
      const duration = Math.round((Date.now() - startTimeRef.current) / 1000);

      const result: GameResult = {
        score,
        durationSeconds: Math.max(15, duration),
        metrics: { totalItems: currentSet.items.length, correct: finalCorrect },
      };

      setCompletedResult(result);
      onComplete(result);
    }
  };

  return (
    <GameWrapper
      title="Gentle Sorting"
      icon="🧺"
      difficulty={difficulty}
      instructionsAudioText={`Sort each item into one of the two large friendly boxes below. Take your time.`}
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
            <span className="text-3xl">🧺</span>
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                {currentSet.title}
              </h3>
              <p className="text-sm font-semibold text-slate-600">
                {currentSet.prompt}
              </p>
            </div>
          </div>

          <span className="px-3.5 py-1.5 rounded-full bg-white border border-emerald-300 font-black text-sm text-emerald-800">
            Item {Math.min(currentItemIndex + 1, currentSet.items.length)} of {currentSet.items.length}
          </span>
        </div>

        {/* Current Active Item Display */}
        {!isFinished && currentItem && (
          <div className="p-6 sm:p-8 rounded-3xl bg-linear-to-b from-amber-50 to-emerald-50 border-4 border-amber-200 text-center space-y-4 shadow-md animate-fade-in">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Where does this belong?
            </p>
            <span className="text-7xl sm:text-8xl select-none block animate-bounce">
              {currentItem.icon}
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900">
              {currentItem.name}
            </h2>
          </div>
        )}

        {/* Two Large Destination Drop/Tap Zones */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Zone A */}
          <button
            onClick={() => handleSort('A')}
            disabled={isFinished}
            className="p-6 sm:p-8 rounded-3xl border-4 border-emerald-300 hover:border-emerald-600 bg-emerald-50/70 hover:bg-emerald-100 transition-all text-left flex flex-col justify-between gap-4 shadow-md hover:scale-[1.02] active:scale-95 group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-4xl">{currentSet.categoryA.icon}</span>
                <h3 className="text-2xl sm:text-3xl font-black text-emerald-950">
                  {currentSet.categoryA.name}
                </h3>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-200 text-emerald-800 text-xs font-black">
                {sortedA.length} items
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white border-2 border-emerald-300 font-black text-center text-emerald-800 text-lg group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              Put in {currentSet.categoryA.name} 👈
            </div>

            {/* Micro list of sorted items */}
            {sortedA.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2 border-t border-emerald-200">
                {sortedA.map((item) => (
                  <span
                    key={item.id}
                    className="px-2.5 py-1 rounded-xl bg-white border border-emerald-200 text-xs font-bold text-slate-700 flex items-center gap-1"
                  >
                    <span>{item.icon}</span>
                    <span>{item.name}</span>
                  </span>
                ))}
              </div>
            )}
          </button>

          {/* Zone B */}
          <button
            onClick={() => handleSort('B')}
            disabled={isFinished}
            className="p-6 sm:p-8 rounded-3xl border-4 border-amber-300 hover:border-amber-600 bg-amber-50/70 hover:bg-amber-100 transition-all text-left flex flex-col justify-between gap-4 shadow-md hover:scale-[1.02] active:scale-95 group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-4xl">{currentSet.categoryB.icon}</span>
                <h3 className="text-2xl sm:text-3xl font-black text-amber-950">
                  {currentSet.categoryB.name}
                </h3>
              </div>
              <span className="px-3 py-1 rounded-full bg-amber-200 text-amber-800 text-xs font-black">
                {sortedB.length} items
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white border-2 border-amber-300 font-black text-center text-amber-900 text-lg group-hover:bg-amber-600 group-hover:text-white transition-colors">
              Put in {currentSet.categoryB.name} 👉
            </div>

            {/* Micro list of sorted items */}
            {sortedB.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2 border-t border-amber-200">
                {sortedB.map((item) => (
                  <span
                    key={item.id}
                    className="px-2.5 py-1 rounded-xl bg-white border border-amber-200 text-xs font-bold text-slate-700 flex items-center gap-1"
                  >
                    <span>{item.icon}</span>
                    <span>{item.name}</span>
                  </span>
                ))}
              </div>
            )}
          </button>
        </div>
      </div>
    </GameWrapper>
  );
};

export const CategorySortingGameModule: GameModule = {
  id: 'category_sorting',
  name: 'Gentle Sorting',
  category: 'matching_sorting',
  categoryLabel: 'Matching & Sorting',
  description: 'Sort healthy foods and nature into two large friendly zones.',
  icon: '🧺',
  instructions_audio_text:
    'Simple sorting. Look at each item and tap the large friendly box where it belongs.',
  render: (config) => <CategorySortingComponent {...config} />,
};
