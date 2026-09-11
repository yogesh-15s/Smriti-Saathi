import React, { useState, useEffect, useRef } from 'react';
import { GameModule, GameConfig, GameResult } from '../types';
import { GameWrapper } from '../components/GameWrapper';
import { Volume2, CheckCircle2, ArrowRight } from 'lucide-react';

interface WordPairItem {
  pairType: 'association' | 'rhyme';
  targetWord: string;
  targetIcon: string;
  prompt: string;
  correctPair: string;
  correctIcon: string;
  options: { word: string; icon: string }[];
}

const DEFAULT_PAIRS: Record<number, WordPairItem[]> = {
  1: [
    {
      pairType: 'association',
      targetWord: 'Hot Tea',
      targetIcon: '🍃',
      prompt: 'Which item naturally goes with hot steaming tea?',
      correctPair: 'Tea Cup',
      correctIcon: '☕',
      options: [
        { word: 'Tea Cup', icon: '☕' },
        { word: 'Shoe', icon: '👞' },
        { word: 'Blanket', icon: '🛏️' },
        { word: 'Car', icon: '🚗' },
      ],
    },
    {
      pairType: 'rhyme',
      targetWord: 'Cat',
      targetIcon: '🐱',
      prompt: 'Listen carefully: Which rhyming word sounds like "Cat"?',
      correctPair: 'Hat',
      correctIcon: '👒',
      options: [
        { word: 'Hat', icon: '👒' },
        { word: 'Dog', icon: '🐕' },
        { word: 'Tree', icon: '🌳' },
        { word: 'Fish', icon: '🐟' },
      ],
    },
  ],
  2: [
    {
      pairType: 'association',
      targetWord: 'Monsoon Rain',
      targetIcon: '🌧️',
      prompt: 'When monsoon rain showers from the sky, what do you carry?',
      correctPair: 'Umbrella',
      correctIcon: '☂️',
      options: [
        { word: 'Umbrella', icon: '☂️' },
        { word: 'Sunglasses', icon: '🕶️' },
        { word: 'Torch', icon: '🔦' },
        { word: 'Clock', icon: '⏰' },
      ],
    },
    {
      pairType: 'rhyme',
      targetWord: 'Ring',
      targetIcon: '💍',
      prompt: 'Which musical word rhymes with and sounds like "Ring"?',
      correctPair: 'Sing',
      correctIcon: '🎵',
      options: [
        { word: 'Sing', icon: '🎵' },
        { word: 'Walk', icon: '🚶' },
        { word: 'Sleep', icon: '💤' },
        { word: 'Eat', icon: '🍚' },
      ],
    },
  ],
  3: [
    {
      pairType: 'association',
      targetWord: 'River Brahmaputra',
      targetIcon: '🌊',
      prompt: 'What peaceful vessel sails gracefully across the river waters?',
      correctPair: 'Wooden Boat',
      correctIcon: '⛵',
      options: [
        { word: 'Wooden Boat', icon: '⛵' },
        { word: 'Bicycle', icon: '🚲' },
        { word: 'Aeroplane', icon: '✈️' },
        { word: 'Tractor', icon: '🚜' },
      ],
    },
    {
      pairType: 'rhyme',
      targetWord: 'Tree',
      targetIcon: '🌳',
      prompt: 'Which gentle word rhymes with "Tree"?',
      correctPair: 'Bee',
      correctIcon: '🐝',
      options: [
        { word: 'Bee', icon: '🐝' },
        { word: 'Bird', icon: '🐦' },
        { word: 'Leaf', icon: '🍃' },
        { word: 'Root', icon: '🥔' },
      ],
    },
  ],
};

const WordPairingComponent: React.FC<GameConfig> = ({
  difficulty,
  speak,
  onBack,
  onComplete,
}) => {
  const pairs = DEFAULT_PAIRS[difficulty] || DEFAULT_PAIRS[1];
  const [pairIndex, setPairIndex] = useState(0);
  const currentPair = pairs[pairIndex % pairs.length];

  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [completedResult, setCompletedResult] = useState<GameResult | null>(null);

  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    setSelectedWord(null);
    setHasAnswered(false);
    speak(
      `Word partner practice. Our word is: ${currentPair.targetWord}. ${currentPair.prompt}`
    );
  }, [pairIndex]);

  const handleSelectOption = (word: string) => {
    if (hasAnswered) return;
    setSelectedWord(word);
    setHasAnswered(true);

    if (word.toLowerCase() === currentPair.correctPair.toLowerCase()) {
      speak(
        `Wonderful! ${currentPair.targetWord} pairs with ${currentPair.correctPair}. You did beautifully!`
      );
    } else {
      speak(
        `Good effort! ${currentPair.targetWord} pairs with ${currentPair.correctPair}.`
      );
    }
  };

  const isCorrect = selectedWord?.toLowerCase() === currentPair.correctPair.toLowerCase();

  const handleNextRound = () => {
    const score = isCorrect ? 100 : 55;
    const duration = Math.round((Date.now() - startTimeRef.current) / 1000);

    const result: GameResult = {
      score,
      durationSeconds: Math.max(15, duration),
      metrics: { pairType: currentPair.pairType, target: currentPair.targetWord },
    };

    setCompletedResult(result);
    onComplete(result);
  };

  return (
    <GameWrapper
      title="Rhymes & Word Pairs"
      icon="☕"
      difficulty={difficulty}
      instructionsAudioText={`Listen to the word and pick its natural partner or rhyming word from the options below.`}
      speak={speak}
      onBack={onBack}
      completedResult={completedResult}
      onPlayAgain={() => {
        setCompletedResult(null);
        setPairIndex((i) => i + 1);
        startTimeRef.current = Date.now();
      }}
    >
      <div className="space-y-6">
        {/* Prompt Banner */}
        <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🗣️</span>
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                {currentPair.prompt}
              </h3>
              <p className="text-sm font-semibold text-slate-600">
                {currentPair.pairType === 'rhyme'
                  ? 'Find the word that sounds like and rhymes with the target word.'
                  : 'Find the companion item that naturally goes together.'}
              </p>
            </div>
          </div>
        </div>

        {/* Target Word Hero Box */}
        <div className="p-8 rounded-3xl bg-linear-to-b from-amber-50 to-emerald-50 border-4 border-amber-200 text-center space-y-3 shadow-inner">
          <span className="text-6xl sm:text-7xl select-none block animate-pulse">
            {currentPair.targetIcon}
          </span>
          <h2 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
            "{currentPair.targetWord}"
          </h2>

          <button
            onClick={() => speak(`The word is: ${currentPair.targetWord}.`)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white hover:bg-slate-100 text-amber-900 font-bold border-2 border-amber-300 shadow-sm transition-transform active:scale-95"
          >
            <Volume2 className="w-5 h-5 text-ner-tea" />
            <span>Hear Word Again</span>
          </button>
        </div>

        {/* Options Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {currentPair.options.map((opt) => {
            const isSelected = selectedWord === opt.word;
            const isThisCorrect = opt.word.toLowerCase() === currentPair.correctPair.toLowerCase();

            return (
              <button
                key={opt.word}
                disabled={hasAnswered}
                onClick={() => handleSelectOption(opt.word)}
                className={`p-6 sm:p-8 rounded-3xl border-4 transition-all flex items-center justify-between text-left active:scale-95 ${
                  hasAnswered
                    ? isThisCorrect
                      ? 'bg-emerald-100 border-emerald-500 text-emerald-900 shadow-xl ring-4 ring-emerald-300 scale-[1.02]'
                      : isSelected
                      ? 'bg-amber-100 border-amber-400 text-amber-900'
                      : 'bg-white border-slate-200 opacity-50'
                    : 'bg-white border-slate-200 hover:border-emerald-500 hover:scale-[1.02] shadow-md hover:shadow-lg'
                }`}
              >
                <div className="flex items-center gap-4">
                  <span className="text-4xl sm:text-5xl">{opt.icon}</span>
                  <div>
                    <h4 className="text-2xl sm:text-3xl font-black text-slate-900">
                      {opt.word}
                    </h4>
                    <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-0.5">
                      {currentPair.pairType === 'rhyme' ? 'Sounds like' : 'Goes with'}{' '}
                      {currentPair.targetWord}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    speak(opt.word);
                  }}
                  className="p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700"
                  title="Listen to option"
                >
                  <Volume2 className="w-5 h-5" />
                </button>
              </button>
            );
          })}
        </div>

        {/* Feedback Section */}
        {hasAnswered && (
          <div className="p-6 rounded-3xl bg-white border-4 border-emerald-300 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in">
            <div className="flex items-center gap-4">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 shrink-0" />
              <div>
                <h4 className="text-2xl font-black text-slate-900">
                  {isCorrect ? 'Splendid Match! 🌟' : 'Good Memory Connection! 🌿'}
                </h4>
                <p className="text-base font-semibold text-slate-600">
                  <span className="font-bold text-slate-900">{currentPair.targetWord}</span> is paired with{' '}
                  <span className="font-bold text-emerald-700">{currentPair.correctPair}</span>.
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

export const WordPairingGameModule: GameModule = {
  id: 'word_pairing',
  name: 'Rhymes & Word Pairs',
  category: 'matching_sorting',
  categoryLabel: 'Matching & Sorting',
  description: 'Match words that rhyme or belong together like tea and cup.',
  icon: '☕',
  instructions_audio_text:
    'Rhymes and word pairing. Listen to the word and choose its partner from the cards.',
  render: (config) => <WordPairingComponent {...config} />,
};
