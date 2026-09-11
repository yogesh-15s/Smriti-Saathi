import React, { useState, useEffect, useRef } from 'react';
import { GameModule, GameConfig, GameResult } from '../types';
import { GameWrapper } from '../components/GameWrapper';
import { Volume2, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';

interface FestivalQuizItem {
  festivalName: string;
  prompt: string;
  icon: string;
  correctAnswer: string;
  options: string[];
  celebratoryFact: string;
}

const DEFAULT_FESTIVALS: Record<number, FestivalQuizItem[]> = {
  1: [
    {
      festivalName: 'Rongali Bihu',
      prompt: 'Do you remember which state celebrates Rongali Bihu with joyous Dhol rhythms and sweet Pitha?',
      icon: '🪘',
      correctAnswer: 'Assam',
      options: ['Assam', 'Goa', 'Kerala'],
      celebratoryFact:
        'Bihu marks the arrival of spring and harvest in Assam, filling homes with warmth, laughter, and sweet pithas! 🌸',
    },
    {
      festivalName: 'Hornbill Festival',
      prompt: 'Do you remember the famous "Festival of Festivals" held among the rolling pine hills of Nagaland?',
      icon: '🦤',
      correctAnswer: 'Nagaland',
      options: ['Nagaland', 'Punjab', 'Gujarat'],
      celebratoryFact:
        'Hornbill brings together all 16 tribes of Nagaland in glorious song, warrior dances, and joyful unity! 🏔️',
    },
  ],
  2: [
    {
      festivalName: 'Losar Mountain New Year',
      prompt: 'Do you remember which peaceful Himalayan state lights butter lamps and raises prayer flags for Losar?',
      icon: '🕯️',
      correctAnswer: 'Sikkim',
      options: ['Sikkim', 'Rajasthan', 'Tamil Nadu'],
      celebratoryFact:
        'Losar welcomes the Tibetan New Year in Sikkim with chimes and prayers for health, peace, and longevity! 🪔',
    },
    {
      festivalName: 'Wangala 100-Drums Festival',
      prompt: 'Do you remember which cloud-kissed state celebrates the Wangala harvest with one hundred drums beating together?',
      icon: '🥁',
      correctAnswer: 'Meghalaya',
      options: ['Meghalaya', 'Haryana', 'Odisha'],
      celebratoryFact:
        'The Garo people of Meghalaya offer thanks for the harvest with the thunderous, joyful beat of 100 long drums! 🌲',
    },
  ],
  3: [
    {
      festivalName: 'Sangai Festival',
      prompt: 'Do you remember which state celebrates the graceful Sangai brow-antlered deer with classical dance?',
      icon: '🦌',
      correctAnswer: 'Manipur',
      options: ['Manipur', 'Bihar', 'Karnataka'],
      celebratoryFact:
        'Manipur celebrates its rich traditions and the gentle Sangai deer living peacefully by Loktak Lake! 🌺',
    },
    {
      festivalName: 'Chapchar Kut Bamboo Dance',
      prompt: 'Do you remember which state celebrates the spring harvest with the rhythmic Cheraw bamboo dance?',
      icon: '🎋',
      correctAnswer: 'Mizoram',
      options: ['Mizoram', 'Delhi', 'Andhra Pradesh'],
      celebratoryFact:
        'Mizoram celebrates Chapchar Kut with music, feasting, and the world-famous Cheraw bamboo stepping dance! ✨',
    },
  ],
};

const FestivalMatchingComponent: React.FC<GameConfig> = ({
  difficulty,
  speak,
  onBack,
  onComplete,
}) => {
  const festivals = DEFAULT_FESTIVALS[difficulty] || DEFAULT_FESTIVALS[1];
  const [festivalIndex, setFestivalIndex] = useState(0);
  const currentFestival = festivals[festivalIndex % festivals.length];

  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [completedResult, setCompletedResult] = useState<GameResult | null>(null);

  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    setSelectedOption(null);
    setHasAnswered(false);
    speak(currentFestival.prompt);
  }, [festivalIndex]);

  const handleSelectOption = (opt: string) => {
    if (hasAnswered) return;
    setSelectedOption(opt);
    setHasAnswered(true);

    if (opt.toLowerCase() === currentFestival.correctAnswer.toLowerCase()) {
      speak(`Yes, wonderful! ${currentFestival.celebratoryFact}`);
    } else {
      speak(
        `A lovely thought! The celebration belongs to ${currentFestival.correctAnswer}. ${currentFestival.celebratoryFact}`
      );
    }
  };

  const isCorrect = selectedOption?.toLowerCase() === currentFestival.correctAnswer.toLowerCase();

  const handleNextRound = () => {
    const score = isCorrect ? 100 : 65;
    const duration = Math.round((Date.now() - startTimeRef.current) / 1000);

    const result: GameResult = {
      score,
      durationSeconds: Math.max(15, duration),
      metrics: { festival: currentFestival.festivalName, isCorrect },
    };

    setCompletedResult(result);
    onComplete(result);
  };

  return (
    <GameWrapper
      title="Festivals of the North East"
      icon="🪘"
      difficulty={difficulty}
      instructionsAudioText="Do you remember these beloved celebrations? Choose the state or symbol that brings back warm memories."
      speak={speak}
      onBack={onBack}
      completedResult={completedResult}
      onPlayAgain={() => {
        setCompletedResult(null);
        setFestivalIndex((i) => i + 1);
        startTimeRef.current = Date.now();
      }}
    >
      <div className="space-y-6">
        {/* Celebratory Hero Card */}
        <div className="p-8 sm:p-10 rounded-3xl bg-linear-to-b from-amber-50 via-rose-50/40 to-emerald-50 border-4 border-amber-300 text-center space-y-4 shadow-lg">
          <span className="text-7xl sm:text-8xl select-none block animate-pulse">
            {currentFestival.icon}
          </span>
          <div className="space-y-1">
            <span className="px-3.5 py-1 rounded-full bg-amber-200 text-amber-900 text-xs font-black uppercase tracking-wider">
              Cultural Memory
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-slate-900 pt-1">
              {currentFestival.festivalName}
            </h2>
          </div>

          <p className="text-lg sm:text-2xl font-bold text-slate-700 max-w-2xl mx-auto leading-relaxed">
            "{currentFestival.prompt}"
          </p>

          <button
            onClick={() => speak(currentFestival.prompt)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white hover:bg-slate-100 text-amber-900 font-bold border-2 border-amber-300 shadow-xs active:scale-95 transition-transform"
          >
            <Volume2 className="w-5 h-5 text-ner-tea" />
            <span>Hear Story Question</span>
          </button>
        </div>

        {/* 3 Large Accessible Options */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          {currentFestival.options.map((opt) => {
            const isSelected = selectedOption === opt;
            const isThisCorrect = opt.toLowerCase() === currentFestival.correctAnswer.toLowerCase();

            return (
              <button
                key={opt}
                disabled={hasAnswered}
                onClick={() => handleSelectOption(opt)}
                className={`p-6 sm:p-8 rounded-3xl border-4 font-black text-2xl sm:text-3xl transition-all text-center flex flex-col items-center justify-center gap-2 active:scale-95 ${
                  hasAnswered
                    ? isThisCorrect
                      ? 'bg-emerald-100 border-emerald-500 text-emerald-950 shadow-xl ring-4 ring-emerald-300 scale-105'
                      : isSelected
                      ? 'bg-amber-100 border-amber-400 text-amber-950'
                      : 'bg-white border-slate-200 opacity-50'
                    : 'bg-white border-amber-200 hover:border-amber-500 text-slate-900 hover:scale-105 shadow-md'
                }`}
              >
                <span>{opt}</span>
              </button>
            );
          })}
        </div>

        {/* Celebratory Cultural Fact and Next Action */}
        {hasAnswered && (
          <div className="p-6 rounded-3xl bg-white border-4 border-emerald-300 shadow-xl space-y-4 animate-fade-in">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <Sparkles className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h4 className="text-2xl font-black text-slate-900">
                  {isCorrect ? 'Heartwarming Memory! 🌟' : 'A Wonderful Celebration! 🌿'}
                </h4>
                <p className="text-base sm:text-lg font-semibold text-slate-700 leading-relaxed">
                  {currentFestival.celebratoryFact}
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={handleNextRound}
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

export const FestivalMatchingGameModule: GameModule = {
  id: 'festival_matching',
  name: 'Festivals of North East',
  category: 'culture_movement',
  categoryLabel: 'Culture & Movement',
  description: 'Cherish joyful memories of Bihu, Hornbill, and mountain festivals.',
  icon: '🪘',
  instructions_audio_text:
    'Festivals of the North East. Do you remember these heartwarming celebrations? Tap the state where they are celebrated.',
  render: (config) => <FestivalMatchingComponent {...config} />,
};
