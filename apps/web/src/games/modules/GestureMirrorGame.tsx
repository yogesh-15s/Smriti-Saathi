import React, { useState, useEffect, useRef } from 'react';
import { GameModule, GameConfig, GameResult } from '../types';
import { GameWrapper } from '../components/GameWrapper';
import { Heart, CheckCircle2, Sparkles, ArrowRight } from 'lucide-react';

interface GestureStep {
  name: string;
  icon: string;
  actionGuidance: string;
  encouragement: string;
  animationClass: string;
}

const GESTURES: Record<number, GestureStep[]> = {
  1: [
    {
      name: 'Peaceful Namaste',
      icon: '🙏',
      actionGuidance: 'Bring your palms gently together in front of your chest in a warm, peaceful Namaste greeting.',
      encouragement: 'Wonderful! You are sharing peace, respect, and calming your breathing. 🌿',
      animationClass: 'animate-pulse',
    },
    {
      name: 'Friendly Hand Wave',
      icon: '👋',
      actionGuidance: 'Raise your hand softly and gently wave side-to-side, saying hello to your loving family.',
      encouragement: 'A lovely, warm wave! It keeps your wrists flexible and your heart cheerful. 🌟',
      animationClass: 'animate-bounce',
    },
  ],
  2: [
    {
      name: 'Encouraging Thumbs-Up',
      icon: '👍',
      actionGuidance: 'Make a gentle fist and raise both thumbs up, showing that today is a peaceful, beautiful day.',
      encouragement: 'Splendid! That simple thumbs-up exercises thumb mobility and radiates confidence! ✨',
      animationClass: 'animate-pulse',
    },
    {
      name: 'Soft Rhythmic Clap',
      icon: '👏',
      actionGuidance: 'Gently bring both hands together in 3 soft, rhythmic claps, just like enjoying folk music.',
      encouragement: 'Delightful! Gentle clapping stimulates nerve endings in the palms and brightens your spirit. 🎶',
      animationClass: 'animate-bounce',
    },
  ],
  3: [
    {
      name: 'Heart Hands of Love',
      icon: '🫶',
      actionGuidance: 'Curl your fingers together to make a sweet heart shape with both hands.',
      encouragement: 'Precious! Bringing hands together in a heart shape connects memory, love, and motor agility! 💖',
      animationClass: 'animate-pulse',
    },
    {
      name: 'Open Palms Morning Blessing',
      icon: '👐',
      actionGuidance: 'Hold both palms open and facing upward, receiving the fresh morning air.',
      encouragement: 'Magnificent! Open palms relax shoulder tension and invite tranquil thoughts. 🌸',
      animationClass: 'animate-pulse',
    },
  ],
};

const GestureMirrorComponent: React.FC<GameConfig> = ({
  difficulty,
  speak,
  onBack,
  onComplete,
}) => {
  const gestureList = GESTURES[difficulty] || GESTURES[1];
  const [gestureIndex, setGestureIndex] = useState(0);
  const currentGesture = gestureList[gestureIndex % gestureList.length];

  const [hasConfirmed, setHasConfirmed] = useState(false);
  const [completedResult, setCompletedResult] = useState<GameResult | null>(null);

  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    setHasConfirmed(false);
    speak(`${currentGesture.name}. ${currentGesture.actionGuidance}`);
  }, [gestureIndex]);

  const handleConfirm = () => {
    setHasConfirmed(true);
    speak(`Splendid! ${currentGesture.encouragement}`);
  };

  const handleNextRound = () => {
    // Physical-cognitive warm-up logs 100% completion
    const duration = Math.round((Date.now() - startTimeRef.current) / 1000);
    const result: GameResult = {
      score: 100,
      durationSeconds: Math.max(15, duration),
      metrics: { gesture: currentGesture.name, completed: true },
    };

    setCompletedResult(result);
    onComplete(result);
  };

  return (
    <GameWrapper
      title="Gentle Hand Gestures"
      icon="🙏"
      difficulty={difficulty}
      instructionsAudioText="Physical-cognitive warm up. Mirror the gentle hand movement shown on screen. When you have done it, tap I Did It."
      speak={speak}
      onBack={onBack}
      completedResult={completedResult}
      onPlayAgain={() => {
        setCompletedResult(null);
        setGestureIndex((i) => i + 1);
        startTimeRef.current = Date.now();
      }}
    >
      <div className="space-y-6">
        {/* Banner */}
        <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🧘‍♂️</span>
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                Movement: {currentGesture.name}
              </h3>
              <p className="text-sm font-semibold text-slate-600">
                Gentle movement practice for wrist mobility and neural stimulation.
              </p>
            </div>
          </div>

          <span className="px-3.5 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black border border-emerald-300">
            No Scoring Pressure 🌿
          </span>
        </div>

        {/* Gesture Demonstration Card */}
        <div className="p-8 sm:p-12 rounded-3xl bg-linear-to-b from-emerald-50 via-teal-50/50 to-amber-50 border-4 border-emerald-300 text-center space-y-6 shadow-inner">
          <div className="w-36 h-36 sm:w-44 sm:h-44 mx-auto rounded-3xl bg-white border-4 border-emerald-200 shadow-xl flex items-center justify-center text-8xl sm:text-9xl select-none">
            <span className={currentGesture.animationClass}>{currentGesture.icon}</span>
          </div>

          <div className="space-y-2 max-w-xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900">
              {currentGesture.name}
            </h2>
            <p className="text-lg sm:text-xl font-bold text-slate-700 leading-relaxed">
              "{currentGesture.actionGuidance}"
            </p>
          </div>

          {/* Self-Confirmation Button */}
          {!hasConfirmed ? (
            <button
              onClick={handleConfirm}
              className="px-10 py-5 rounded-3xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-2xl shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 mx-auto"
            >
              <Sparkles className="w-7 h-7 text-amber-200 animate-spin" />
              <span>I Did It! 🌟</span>
            </button>
          ) : (
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-emerald-100 text-emerald-800 font-black text-xl border border-emerald-300 animate-fade-in">
              <CheckCircle2 className="w-7 h-7 text-emerald-600" />
              <span>Movement Completed!</span>
            </div>
          )}
        </div>

        {/* Feedback Section */}
        {hasConfirmed && (
          <div className="p-6 rounded-3xl bg-white border-4 border-emerald-300 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in">
            <div className="flex items-center gap-4">
              <Heart className="w-10 h-10 text-rose-500 fill-rose-100 shrink-0" />
              <div>
                <h4 className="text-2xl font-black text-slate-900">
                  Splendid Movement! 🌟
                </h4>
                <p className="text-base font-semibold text-slate-600">
                  {currentGesture.encouragement}
                </p>
              </div>
            </div>

            <button
              onClick={handleNextRound}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-lg shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <span>Done • Keep My Streak</span>
              <ArrowRight className="w-6 h-6" />
            </button>
          </div>
        )}
      </div>
    </GameWrapper>
  );
};

export const GestureMirrorGameModule: GameModule = {
  id: 'gesture_mirror',
  name: 'Gentle Hand Gestures',
  category: 'culture_movement',
  categoryLabel: 'Culture & Movement',
  description: 'Gentle physical warm-up mimicking peaceful hand movements like Namaste.',
  icon: '🙏',
  instructions_audio_text:
    'Gentle hand gestures. Mirror the hand movement shown on screen. When you finish, tap I did it.',
  render: (config) => <GestureMirrorComponent {...config} />,
};
