import React, { useState, useEffect, useRef } from 'react';
import { GameModule, GameConfig, GameResult } from '../types';
import { GameWrapper } from '../components/GameWrapper';
import { Eye, CheckCircle2, ArrowRight } from 'lucide-react';

interface SceneObject {
  id: string;
  name: string;
  icon: string;
  xPercent: number;
  yPercent: number;
}

interface SceneData {
  sceneName: string;
  sceneDescription: string;
  objects: SceneObject[];
  targetObjectId: string;
  prompt: string;
  pauseSeconds: number;
  toleranceRadiusPercent: number;
}

const DEFAULT_SCENES: Record<number, SceneData[]> = {
  1: [
    {
      sceneName: 'Cozy Morning Kitchen Table',
      sceneDescription: 'A clean wooden table with morning sunshine and tea.',
      objects: [
        { id: 'glasses', name: 'Reading Spectacles', icon: '👓', xPercent: 30, yPercent: 40 },
        { id: 'cup', name: 'Assam Tea Cup', icon: '🍵', xPercent: 70, yPercent: 35 },
      ],
      targetObjectId: 'glasses',
      prompt: 'Where did I put the reading spectacles?',
      pauseSeconds: 6,
      toleranceRadiusPercent: 20,
    },
    {
      sceneName: 'Bedside Nightstand',
      sceneDescription: 'Beside the warm reading lamp.',
      objects: [
        { id: 'book', name: 'Story Book', icon: '📖', xPercent: 25, yPercent: 45 },
        { id: 'water', name: 'Water Glass', icon: '🥛', xPercent: 75, yPercent: 30 },
      ],
      targetObjectId: 'water',
      prompt: 'Where did I place the glass of water?',
      pauseSeconds: 6,
      toleranceRadiusPercent: 20,
    },
  ],
  2: [
    {
      sceneName: 'Living Room Bookshelf',
      sceneDescription: 'A shelf with favorite books and everyday essentials.',
      objects: [
        { id: 'keys', name: 'House Keys', icon: '🔑', xPercent: 20, yPercent: 30 },
        { id: 'cup', name: 'Tea Cup', icon: '☕', xPercent: 50, yPercent: 65 },
        { id: 'comb', name: 'Wooden Comb', icon: '🪮', xPercent: 80, yPercent: 35 },
      ],
      targetObjectId: 'keys',
      prompt: 'Where did I put the house brass keys?',
      pauseSeconds: 5,
      toleranceRadiusPercent: 15,
    },
  ],
  3: [
    {
      sceneName: 'Veranda Tea Table',
      sceneDescription: 'Overlooking the peaceful garden with flowers and bamboo.',
      objects: [
        { id: 'watch', name: 'Pocket Watch', icon: '⏱️', xPercent: 20, yPercent: 30 },
        { id: 'medicine', name: 'Morning Tonic', icon: '🧴', xPercent: 75, yPercent: 25 },
        { id: 'pen', name: 'Fountain Pen', icon: '✒️', xPercent: 35, yPercent: 70 },
        { id: 'spectacles', name: 'Spectacles', icon: '👓', xPercent: 70, yPercent: 65 },
      ],
      targetObjectId: 'medicine',
      prompt: 'Where did I place the morning tonic bottle?',
      pauseSeconds: 4,
      toleranceRadiusPercent: 12,
    },
  ],
};

const SpatialRecallComponent: React.FC<GameConfig> = ({
  difficulty,
  speak,
  onBack,
  onComplete,
}) => {
  const scenes = DEFAULT_SCENES[difficulty] || DEFAULT_SCENES[1];
  const [sceneIndex, setSceneIndex] = useState(0);
  const currentScene = scenes[sceneIndex % scenes.length];

  // Game stage: 'memorize' -> 'recall' -> 'feedback'
  const [stage, setStage] = useState<'memorize' | 'recall' | 'feedback'>('memorize');
  const [tapPosition, setTapPosition] = useState<{ xPercent: number; yPercent: number } | null>(null);
  const [roundScore, setRoundScore] = useState<number>(0);
  const [completedResult, setCompletedResult] = useState<GameResult | null>(null);

  const startTimeRef = useRef<number>(Date.now());
  const sceneBoxRef = useRef<HTMLDivElement>(null);

  const targetObject = currentScene.objects.find((o) => o.id === currentScene.targetObjectId) || currentScene.objects[0];

  useEffect(() => {
    setStage('memorize');
    setTapPosition(null);
    speak(`Take a moment to look at the table. Notice where everything is placed.`);
  }, [sceneIndex]);

  const handleStartRecall = () => {
    setStage('recall');
    speak(currentScene.prompt);
  };

  const handleSceneTap = (e: React.MouseEvent<HTMLDivElement>) => {
    if (stage !== 'recall' || !sceneBoxRef.current) return;

    const rect = sceneBoxRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const xPercent = (clickX / rect.width) * 100;
    const yPercent = (clickY / rect.height) * 100;

    setTapPosition({ xPercent, yPercent });

    // Distance calculation
    const dx = xPercent - targetObject.xPercent;
    const dy = yPercent - targetObject.yPercent;
    const distance = Math.sqrt(dx * dx + dy * dy);

    const tolerance = currentScene.toleranceRadiusPercent;

    let score = 0;
    if (distance <= tolerance) {
      score = 100;
      speak(`Wonderful! You remembered right where it was!`);
    } else if (distance <= tolerance * 1.8) {
      score = 75; // Near-miss partial credit!
      speak(`Very close! Right around that spot!`);
    } else {
      score = 40;
      speak(`Here is where the ${targetObject.name} was.`);
    }

    setRoundScore(score);
    setStage('feedback');
  };

  const handleNextRound = () => {
    const duration = Math.round((Date.now() - startTimeRef.current) / 1000);
    const result: GameResult = {
      score: roundScore,
      durationSeconds: Math.max(15, duration),
      metrics: { distanceTolerance: currentScene.toleranceRadiusPercent },
    };

    setCompletedResult(result);
    onComplete(result);
  };

  return (
    <GameWrapper
      title="Where Did I Put It?"
      icon="👓"
      difficulty={difficulty}
      instructionsAudioText="Look at the everyday items on the scene. Remember where they are placed. When you are ready, tap where the item was."
      speak={speak}
      onBack={onBack}
      completedResult={completedResult}
      onPlayAgain={() => {
        setCompletedResult(null);
        setSceneIndex((i) => i + 1);
        startTimeRef.current = Date.now();
      }}
    >
      <div className="space-y-6">
        {/* Instruction and Prompt Banner */}
        <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{stage === 'memorize' ? '👀' : '🔍'}</span>
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                {stage === 'memorize'
                  ? 'Memorize the Table'
                  : currentScene.prompt}
              </h3>
              <p className="text-sm font-semibold text-slate-600">
                {stage === 'memorize'
                  ? `Notice where the ${targetObject.name} is resting.`
                  : 'Tap anywhere on the scene where you remember it.'}
              </p>
            </div>
          </div>

          {stage === 'memorize' && (
            <button
              onClick={handleStartRecall}
              className="px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-base shadow-md flex items-center gap-2 transition-transform active:scale-95 shrink-0"
            >
              <span>I'm Ready</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Visual Scene Box */}
        <div
          ref={sceneBoxRef}
          onClick={handleSceneTap}
          className={`relative w-full h-80 sm:h-96 rounded-3xl border-4 transition-all overflow-hidden select-none ${
            stage === 'recall'
              ? 'cursor-crosshair border-emerald-400 bg-linear-to-b from-amber-50/80 via-emerald-50/40 to-amber-100/60 shadow-inner'
              : 'border-slate-300 bg-linear-to-b from-amber-50 to-amber-100/70'
          }`}
        >
          {/* Background table texture visual */}
          <div className="absolute inset-x-8 bottom-0 h-28 bg-amber-200/50 rounded-t-3xl border-t-2 border-amber-300/60 pointer-events-none" />

          {/* Memorize Stage: show all objects */}
          {stage === 'memorize' &&
            currentScene.objects.map((obj) => (
              <div
                key={obj.id}
                style={{
                  left: `${obj.xPercent}%`,
                  top: `${obj.yPercent}%`,
                  transform: 'translate(-50%, -50%)',
                }}
                className={`absolute flex flex-col items-center gap-1 transition-all ${
                  obj.id === targetObject.id ? 'scale-110' : ''
                }`}
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white shadow-lg border-2 border-slate-200 flex items-center justify-center text-4xl">
                  {obj.icon}
                </div>
                <span className="px-2 py-0.5 rounded-md bg-slate-800 text-white text-xs font-bold shadow-xs whitespace-nowrap">
                  {obj.name}
                </span>
              </div>
            ))}

          {/* Recall Stage: prompt badge overlay */}
          {stage === 'recall' && !tapPosition && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="p-4 rounded-2xl bg-white/90 backdrop-blur-xs border border-emerald-300 shadow-lg text-center">
                <p className="text-base sm:text-lg font-bold text-slate-800">
                  Tap where <span className="text-ner-tea font-black">{targetObject.name}</span> was placed
                </p>
              </div>
            </div>
          )}

          {/* Feedback Stage: reveal target location and user tap */}
          {stage === 'feedback' && (
            <>
              {/* Correct Location Indicator */}
              <div
                style={{
                  left: `${targetObject.xPercent}%`,
                  top: `${targetObject.yPercent}%`,
                  transform: 'translate(-50%, -50%)',
                }}
                className="absolute z-10 flex flex-col items-center"
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-emerald-500/20 border-4 border-emerald-600 flex items-center justify-center text-3xl animate-bounce">
                  {targetObject.icon}
                </div>
                <span className="mt-1 px-2.5 py-1 rounded-lg bg-emerald-700 text-white text-xs font-black shadow-md">
                  Original Spot
                </span>
              </div>

              {/* User Tap Marker */}
              {tapPosition && (
                <div
                  style={{
                    left: `${tapPosition.xPercent}%`,
                    top: `${tapPosition.yPercent}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  className="absolute z-20 flex flex-col items-center"
                >
                  <div
                    className={`w-10 h-10 rounded-full border-4 flex items-center justify-center font-black text-white text-sm shadow-lg ${
                      roundScore >= 80
                        ? 'bg-emerald-600 border-white'
                        : 'bg-amber-600 border-white'
                    }`}
                  >
                    ✓
                  </div>
                  <span className="mt-1 px-2 py-0.5 rounded-md bg-slate-900 text-white text-xs font-bold">
                    Your Tap
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Feedback Bottom Actions */}
        {stage === 'feedback' && (
          <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              <div>
                <p className="text-xl font-black text-slate-900">
                  {roundScore >= 80 ? 'Spot On Recall! 🌟' : roundScore >= 60 ? 'Close Match! 👍' : 'Gentle Try! 🌿'}
                </p>
                <p className="text-sm font-semibold text-slate-600">
                  {roundScore >= 80
                    ? 'You placed your finger right on the target spot.'
                    : `Near-miss counts! The item was close to your tap.`}
                </p>
              </div>
            </div>

            <button
              onClick={handleNextRound}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-lg shadow-lg active:scale-95 transition-all"
            >
              I'm Done • See Results
            </button>
          </div>
        )}
      </div>
    </GameWrapper>
  );
};

export const SpatialRecallGameModule: GameModule = {
  id: 'spatial_recall',
  name: 'Where Did I Put It?',
  category: 'memory',
  categoryLabel: 'Memory Games',
  description: 'Remember where everyday items were placed in cozy room scenes.',
  icon: '👓',
  instructions_audio_text:
    'Where did I put it? Look at the everyday items on the scene. Remember where they are placed. When you are ready, tap where the item was.',
  render: (config) => <SpatialRecallComponent {...config} />,
};
