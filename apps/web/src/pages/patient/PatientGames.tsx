import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Gamepad2,
  Volume2,
  Sparkles,
  ArrowLeft,
  RotateCcw,
  CheckCircle2,
  Trophy,
  Brain,
} from 'lucide-react';
import { apiRequest } from '../../lib/api.js';

type ActiveGame = 'menu' | 'memory_match' | 'sequence_recall' | 'word_association' | 'picture_naming';

export const PatientGames: React.FC = () => {
  const navigate = useNavigate();
  const [activeGame, setActiveGame] = useState<ActiveGame>('menu');

  // Adaptive difficulty tracker
  const [difficulty, setDifficulty] = useState<number>(1);
  const [streakCorrect, setStreakCorrect] = useState<number>(0);
  const [streakWrong, setStreakWrong] = useState<number>(0);

  // Read aloud helper
  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Helper to record game session to real API backend
  const logGameSession = async (gameType: string, score: number, durationSeconds: number) => {
    try {
      const res = await apiRequest<{ nextDifficulty: number; message: string }>('/api/patient/games/session', {
        method: 'POST',
        body: JSON.stringify({
          gameType,
          score,
          difficultyLevel: difficulty,
          durationSeconds,
        }),
      });

      // Adaptive difficulty rule:
      // 3 correct in a row (score >= 80) -> increase difficulty
      // 2 wrong in a row (score < 50) -> decrease difficulty
      if (score >= 80) {
        const nextCorrect = streakCorrect + 1;
        if (nextCorrect >= 3) {
          setDifficulty((d) => Math.min(3, d + 1));
          setStreakCorrect(0);
        } else {
          setStreakCorrect(nextCorrect);
        }
        setStreakWrong(0);
      } else if (score < 50) {
        const nextWrong = streakWrong + 1;
        if (nextWrong >= 2) {
          setDifficulty((d) => Math.max(1, d - 1));
          setStreakWrong(0);
        } else {
          setStreakWrong(nextWrong);
        }
        setStreakCorrect(0);
      }
    } catch (err) {
      console.warn('Could not log game session to API:', err);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Active Game Router */}
      {activeGame === 'menu' && (
        <GameSelector
          onSelect={(game) => {
            setActiveGame(game);
          }}
          difficulty={difficulty}
          speak={speak}
        />
      )}

      {activeGame === 'memory_match' && (
        <MemoryMatchGame
          difficulty={difficulty}
          onBack={() => setActiveGame('menu')}
          onComplete={(score, duration) => logGameSession('memory_match', score, duration)}
          speak={speak}
        />
      )}

      {activeGame === 'sequence_recall' && (
        <SequenceRecallGame
          difficulty={difficulty}
          onBack={() => setActiveGame('menu')}
          onComplete={(score, duration) => logGameSession('sequence_recall', score, duration)}
          speak={speak}
        />
      )}

      {activeGame === 'word_association' && (
        <WordAssociationGame
          difficulty={difficulty}
          onBack={() => setActiveGame('menu')}
          onComplete={(score, duration) => logGameSession('word_association', score, duration)}
          speak={speak}
        />
      )}

      {activeGame === 'picture_naming' && (
        <PictureNamingGame
          difficulty={difficulty}
          onBack={() => setActiveGame('menu')}
          onComplete={(score, duration) => logGameSession('picture_naming', score, duration)}
          speak={speak}
        />
      )}
    </div>
  );
};

// ==========================================
// 1. GAME SELECTOR MENU (Large 4 game buttons)
// ==========================================
interface GameSelectorProps {
  onSelect: (game: ActiveGame) => void;
  difficulty: number;
  speak: (t: string) => void;
}

const GameSelector: React.FC<GameSelectorProps> = ({ onSelect, difficulty, speak }) => {
  useEffect(() => {
    speak('Choose a gentle memory game below. Tap any big button.');
  }, []);

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        <div>
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900">
            Memory Games
          </h1>
          <p className="text-lg sm:text-xl font-bold text-ner-tea mt-1">
            Gentle exercises to keep your mind refreshed
          </p>
        </div>

        <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-100 text-ner-forest text-sm font-black border border-emerald-300">
          <Brain className="w-5 h-5 text-ner-tea" />
          <span>Level: {difficulty === 1 ? 'Gentle' : difficulty === 2 ? 'Medium' : 'Active'}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Game 1 */}
        <button
          onClick={() => {
            speak('Starting Flora Pairs Match game.');
            onSelect('memory_match');
          }}
          className="p-8 rounded-3xl bg-white border-4 border-emerald-200 hover:border-emerald-500 shadow-lg hover:shadow-xl transition-all text-left flex items-center gap-6 group hover:scale-[1.02] active:scale-95"
        >
          <div className="w-20 h-20 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-4xl shrink-0 group-hover:scale-110 transition-transform">
            🍃
          </div>
          <div>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900">
              Matching Pairs
            </h3>
            <p className="text-sm sm:text-base font-semibold text-slate-600 mt-1">
              Find matching flowers and tea leaves
            </p>
          </div>
        </button>

        {/* Game 2 */}
        <button
          onClick={() => {
            speak('Starting Sequence Recall game.');
            onSelect('sequence_recall');
          }}
          className="p-8 rounded-3xl bg-white border-4 border-amber-200 hover:border-amber-500 shadow-lg hover:shadow-xl transition-all text-left flex items-center gap-6 group hover:scale-[1.02] active:scale-95"
        >
          <div className="w-20 h-20 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center text-4xl shrink-0 group-hover:scale-110 transition-transform">
            🔔
          </div>
          <div>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900">
              Follow the Beat
            </h3>
            <p className="text-sm sm:text-base font-semibold text-slate-600 mt-1">
              Watch the lights and repeat the sequence
            </p>
          </div>
        </button>

        {/* Game 3 */}
        <button
          onClick={() => {
            speak('Starting Word Association game.');
            onSelect('word_association');
          }}
          className="p-8 rounded-3xl bg-white border-4 border-blue-200 hover:border-blue-500 shadow-lg hover:shadow-xl transition-all text-left flex items-center gap-6 group hover:scale-[1.02] active:scale-95"
        >
          <div className="w-20 h-20 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center text-4xl shrink-0 group-hover:scale-110 transition-transform">
            ☕
          </div>
          <div>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900">
              Word Partners
            </h3>
            <p className="text-sm sm:text-base font-semibold text-slate-600 mt-1">
              Connect words that belong together
            </p>
          </div>
        </button>

        {/* Game 4 */}
        <button
          onClick={() => {
            speak('Starting Picture Naming game.');
            onSelect('picture_naming');
          }}
          className="p-8 rounded-3xl bg-white border-4 border-purple-200 hover:border-purple-500 shadow-lg hover:shadow-xl transition-all text-left flex items-center gap-6 group hover:scale-[1.02] active:scale-95"
        >
          <div className="w-20 h-20 rounded-2xl bg-purple-100 text-purple-800 flex items-center justify-center text-4xl shrink-0 group-hover:scale-110 transition-transform">
            🦏
          </div>
          <div>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900">
              Name the Picture
            </h3>
            <p className="text-sm sm:text-base font-semibold text-slate-600 mt-1">
              Choose the correct name for the animal
            </p>
          </div>
        </button>

        {/* Game 5: Family Faces Recognition */}
        <button
          onClick={() => {
            speak('Opening Family Faces recognition.');
            window.location.href = '/patient/photos';
          }}
          className="sm:col-span-2 p-8 rounded-3xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-4 border-emerald-300 shadow-xl hover:shadow-2xl transition-all text-left flex items-center gap-6 group hover:scale-[1.01] active:scale-95 cursor-pointer"
        >
          <div className="w-20 h-20 rounded-2xl bg-white/20 text-white flex items-center justify-center text-4xl shrink-0 group-hover:scale-110 transition-transform">
            👨‍👩‍👧
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h3 className="text-2xl sm:text-3xl font-black text-white">
                Family Faces Check
              </h3>
              <span className="px-3 py-0.5 rounded-full bg-white/25 text-white font-extrabold text-xs uppercase">
                Special
              </span>
            </div>
            <p className="text-sm sm:text-base font-semibold text-emerald-100 mt-1">
              Look at photos of your family members and tap the name you recognize
            </p>
          </div>
        </button>
      </div>
    </div>
  );
};

// ==========================================
// 2. MEMORY MATCHING GAME (Pairs)
// ==========================================
const CARDS_POOL = [
  { icon: '🍃', label: 'Tea Leaf' },
  { icon: '🌸', label: 'Orchid' },
  { icon: '🪶', label: 'Hornbill' },
  { icon: '🦏', label: 'Rhino' },
  { icon: '🌊', label: 'River' },
  { icon: '🥁', label: 'Drum' },
];

const MemoryMatchGame: React.FC<{
  difficulty: number;
  onBack: () => void;
  onComplete: (score: number, duration: number) => void;
  speak: (t: string) => void;
}> = ({ difficulty, onBack, onComplete, speak }) => {
  const pairCount = difficulty === 1 ? 3 : difficulty === 2 ? 4 : 6;
  const [cards, setCards] = useState<Array<{ id: number; icon: string; matched: boolean }>>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [isDone, setIsDone] = useState(false);
  const [startTime] = useState<number>(Date.now());

  const initGame = () => {
    const selected = CARDS_POOL.slice(0, pairCount);
    const deck = [...selected, ...selected]
      .sort(() => Math.random() - 0.5)
      .map((item, idx) => ({ id: idx, icon: item.icon, matched: false }));
    setCards(deck);
    setFlipped([]);
    setMoves(0);
    setIsDone(false);
    speak('Tap two cards to find matching pairs.');
  };

  useEffect(() => {
    initGame();
  }, [difficulty]);

  const handleCardClick = (idx: number) => {
    if (flipped.length === 2 || cards[idx].matched || flipped.includes(idx)) return;

    const nextFlipped = [...flipped, idx];
    setFlipped(nextFlipped);

    if (nextFlipped.length === 2) {
      setMoves((m) => m + 1);
      const [first, second] = nextFlipped;
      if (cards[first].icon === cards[second].icon) {
        speak('Match found!');
        const updated = cards.map((c, i) =>
          i === first || i === second ? { ...c, matched: true } : c
        );
        setCards(updated);
        setFlipped([]);

        if (updated.every((c) => c.matched)) {
          setIsDone(true);
          const duration = Math.round((Date.now() - startTime) / 1000);
          const score = Math.max(50, Math.round(100 - (moves - pairCount) * 5));
          speak('Wonderful! You found all the matching pairs.');
          onComplete(score, duration);
        }
      } else {
        setTimeout(() => setFlipped([]), 1200);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="px-5 py-3 rounded-2xl bg-white border-2 border-slate-300 text-slate-800 font-bold text-lg flex items-center gap-2 hover:bg-slate-50 shadow-sm"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Exit Game</span>
        </button>

        <div className="text-right">
          <span className="text-xl font-black text-slate-800">Pairs Match</span>
          <p className="text-sm font-bold text-slate-500">Pairs Found: {cards.filter((c) => c.matched).length / 2} / {pairCount}</p>
        </div>
      </div>

      {!isDone ? (
        <div className={`grid gap-4 sm:gap-6 ${pairCount <= 4 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3 sm:grid-cols-4'}`}>
          {cards.map((c, idx) => {
            const isRevealed = flipped.includes(idx) || c.matched;
            return (
              <button
                key={c.id}
                onClick={() => handleCardClick(idx)}
                disabled={c.matched}
                className={`h-28 sm:h-36 rounded-3xl text-5xl sm:text-6xl flex items-center justify-center transition-all shadow-md active:scale-95 ${
                  c.matched
                    ? 'bg-emerald-100 border-4 border-emerald-400 opacity-90'
                    : isRevealed
                    ? 'bg-white border-4 border-ner-tea shadow-lg'
                    : 'bg-emerald-600 hover:bg-ner-tea border-4 border-emerald-400 text-white'
                }`}
              >
                {isRevealed ? c.icon : '❓'}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="p-8 sm:p-12 rounded-[2.5rem] bg-white border-4 border-emerald-400 text-center space-y-6 shadow-2xl">
          <Trophy className="w-20 h-20 text-ner-golden mx-auto animate-bounce" />
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900">
            Great Memory Work!
          </h2>
          <p className="text-xl font-bold text-slate-600">
            You completed all pairs in {moves} moves.
          </p>
          <div className="flex justify-center gap-4">
            <button
              onClick={initGame}
              className="px-6 py-4 rounded-2xl bg-ner-tea text-white font-black text-xl hover:bg-ner-forest shadow-md"
            >
              Play Again
            </button>
            <button
              onClick={onBack}
              className="px-6 py-4 rounded-2xl bg-slate-200 text-slate-800 font-black text-xl hover:bg-slate-300"
            >
              Return to Games
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// 3. SEQUENCE RECALL GAME
// ==========================================
const BELL_COLORS = [
  { id: 0, color: 'bg-red-500', name: 'Red', sound: 'Red' },
  { id: 1, color: 'bg-blue-500', name: 'Blue', sound: 'Blue' },
  { id: 2, color: 'bg-amber-400', name: 'Yellow', sound: 'Yellow' },
  { id: 3, color: 'bg-emerald-500', name: 'Green', sound: 'Green' },
];

const SequenceRecallGame: React.FC<{
  difficulty: number;
  onBack: () => void;
  onComplete: (score: number, duration: number) => void;
  speak: (t: string) => void;
}> = ({ difficulty, onBack, onComplete, speak }) => {
  const sequenceLength = difficulty === 1 ? 3 : difficulty === 2 ? 4 : 5;
  const [sequence, setSequence] = useState<number[]>([]);
  const [playbackIdx, setPlaybackIdx] = useState<number | null>(null);
  const [playerInput, setPlayerInput] = useState<number[]>([]);
  const [isDone, setIsDone] = useState(false);
  const [isShowing, setIsShowing] = useState(false);
  const [startTime] = useState<number>(Date.now());

  const startSequence = () => {
    const seq = Array.from({ length: sequenceLength }, () => Math.floor(Math.random() * 4));
    setSequence(seq);
    setPlayerInput([]);
    setIsDone(false);
    setIsShowing(true);

    speak('Watch the lights and remember the sequence.');

    let i = 0;
    const interval = setInterval(() => {
      if (i < seq.length) {
        setPlaybackIdx(seq[i]);
        speak(BELL_COLORS[seq[i]].name);
        i++;
        setTimeout(() => setPlaybackIdx(null), 700);
      } else {
        clearInterval(interval);
        setIsShowing(false);
        speak('Now tap the same colors.');
      }
    }, 1300);
  };

  useEffect(() => {
    startSequence();
  }, [difficulty]);

  const handleTap = (id: number) => {
    if (isShowing || isDone) return;

    speak(BELL_COLORS[id].name);
    const nextInput = [...playerInput, id];
    setPlayerInput(nextInput);

    const currStep = nextInput.length - 1;
    if (nextInput[currStep] !== sequence[currStep]) {
      speak('Not quite right. Let us try again.');
      setTimeout(startSequence, 1200);
      return;
    }

    if (nextInput.length === sequence.length) {
      setIsDone(true);
      speak('Terrific! You recalled the whole rhythm!');
      const duration = Math.round((Date.now() - startTime) / 1000);
      onComplete(95, duration);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="px-5 py-3 rounded-2xl bg-white border-2 border-slate-300 text-slate-800 font-bold text-lg flex items-center gap-2 hover:bg-slate-50 shadow-sm"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Exit Game</span>
        </button>
        <span className="text-xl font-black text-slate-800">
          Sequence: {sequenceLength} Steps
        </span>
      </div>

      {!isDone ? (
        <div className="space-y-8 text-center">
          <p className="text-xl font-bold text-slate-600">
            {isShowing ? '👀 Watch the sequence...' : '👉 Your turn! Tap the colors:'}
          </p>

          <div className="grid grid-cols-2 gap-6 max-w-md mx-auto">
            {BELL_COLORS.map((bell) => {
              const isLit = playbackIdx === bell.id;
              return (
                <button
                  key={bell.id}
                  onClick={() => handleTap(bell.id)}
                  disabled={isShowing}
                  className={`h-36 rounded-3xl text-white font-black text-2xl shadow-xl transition-all active:scale-95 flex items-center justify-center ${
                    bell.color
                  } ${isLit ? 'ring-8 ring-white scale-105 brightness-125' : 'hover:opacity-90'}`}
                >
                  {bell.name}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="p-8 sm:p-12 rounded-[2.5rem] bg-white border-4 border-amber-400 text-center space-y-6 shadow-2xl">
          <Trophy className="w-20 h-20 text-amber-500 mx-auto animate-bounce" />
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900">
            Excellent Rhythm Recall!
          </h2>
          <p className="text-xl font-bold text-slate-600">
            You matched all {sequenceLength} lights in the correct sequence.
          </p>
          <div className="flex justify-center gap-4">
            <button
              onClick={startSequence}
              className="px-6 py-4 rounded-2xl bg-amber-500 text-white font-black text-xl hover:bg-amber-600 shadow-md"
            >
              Play Again
            </button>
            <button
              onClick={onBack}
              className="px-6 py-4 rounded-2xl bg-slate-200 text-slate-800 font-black text-xl hover:bg-slate-300"
            >
              Return to Games
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// 4. WORD ASSOCIATION GAME
// ==========================================
const WORD_PAIRS = [
  { prompt: 'Tea ☕', answer: 'Cup 🥛', options: ['Cup 🥛', 'Shoe 👟', 'Tree 🌳'] },
  { prompt: 'Rain 🌧️', answer: 'Umbrella ☂️', options: ['Umbrella ☂️', 'Book 📖', 'Bed 🛏️'] },
  { prompt: 'Bird 🐦', answer: 'Nest 🪺', options: ['Nest 🪺', 'Car 🚗', 'Hat 👒'] },
  { prompt: 'River 🌊', answer: 'Boat 🛶', options: ['Boat 🛶', 'Clock ⏰', 'Chair 🪑'] },
];

const WordAssociationGame: React.FC<{
  difficulty: number;
  onBack: () => void;
  onComplete: (score: number, duration: number) => void;
  speak: (t: string) => void;
}> = ({ difficulty, onBack, onComplete, speak }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [isDone, setIsDone] = useState(false);
  const [startTime] = useState<number>(Date.now());

  const currentPair = WORD_PAIRS[currentIdx];

  useEffect(() => {
    if (!isDone && currentPair) {
      speak(`What goes with ${currentPair.prompt}?`);
    }
  }, [currentIdx, isDone]);

  const handleSelect = (choice: string) => {
    if (choice === currentPair.answer) {
      speak('Correct! That belongs together.');
      setScore((s) => s + 1);
    } else {
      speak(`Good try! ${currentPair.prompt} usually pairs with ${currentPair.answer}.`);
    }

    if (currentIdx + 1 < WORD_PAIRS.length) {
      setTimeout(() => setCurrentIdx((i) => i + 1), 1000);
    } else {
      setIsDone(true);
      const finalScore = Math.round(((score + (choice === currentPair.answer ? 1 : 0)) / WORD_PAIRS.length) * 100);
      const duration = Math.round((Date.now() - startTime) / 1000);
      onComplete(finalScore, duration);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="px-5 py-3 rounded-2xl bg-white border-2 border-slate-300 text-slate-800 font-bold text-lg flex items-center gap-2 hover:bg-slate-50 shadow-sm"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Exit Game</span>
        </button>
        <span className="text-xl font-black text-slate-800">
          Question {currentIdx + 1} of {WORD_PAIRS.length}
        </span>
      </div>

      {!isDone ? (
        <div className="space-y-8 text-center max-w-xl mx-auto">
          <div className="p-8 rounded-3xl bg-blue-50 border-4 border-blue-200">
            <span className="text-lg font-bold text-blue-800 block">What goes best with:</span>
            <span className="text-4xl sm:text-5xl font-black text-slate-900 mt-2 block">
              {currentPair.prompt}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {currentPair.options.map((opt) => (
              <button
                key={opt}
                onClick={() => handleSelect(opt)}
                className="py-6 px-4 rounded-2xl bg-white hover:bg-blue-50 border-4 border-blue-200 hover:border-blue-500 text-2xl font-black text-slate-900 shadow-md transition-all active:scale-95"
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-8 sm:p-12 rounded-[2.5rem] bg-white border-4 border-blue-400 text-center space-y-6 shadow-2xl">
          <Trophy className="w-20 h-20 text-blue-500 mx-auto animate-bounce" />
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900">
            Word Activity Complete!
          </h2>
          <p className="text-xl font-bold text-slate-600">
            You scored {score} out of {WORD_PAIRS.length}.
          </p>
          <button
            onClick={onBack}
            className="px-6 py-4 rounded-2xl bg-blue-600 text-white font-black text-xl hover:bg-blue-700 shadow-md"
          >
            Return to Games
          </button>
        </div>
      )}
    </div>
  );
};

// ==========================================
// 5. PICTURE NAMING GAME
// ==========================================
const PICTURE_ITEMS = [
  { emoji: '🦏', title: 'One-Horned Rhino', options: ['Rhino', 'Cow', 'Horse'] },
  { emoji: '🐘', title: 'Asian Elephant', options: ['Elephant', 'Deer', 'Sheep'] },
  { emoji: '🌺', title: 'Hibiscus Flower', options: ['Hibiscus', 'Leaf', 'Grass'] },
  { emoji: '🛶', title: 'Country River Boat', options: ['Boat', 'Bicycle', 'Aeroplane'] },
];

const PictureNamingGame: React.FC<{
  difficulty: number;
  onBack: () => void;
  onComplete: (score: number, duration: number) => void;
  speak: (t: string) => void;
}> = ({ difficulty, onBack, onComplete, speak }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [isDone, setIsDone] = useState(false);
  const [startTime] = useState<number>(Date.now());

  const item = PICTURE_ITEMS[currentIdx];

  useEffect(() => {
    if (!isDone && item) {
      speak('Look at this picture. What is it called?');
    }
  }, [currentIdx, isDone]);

  const handleChoose = (opt: string) => {
    const isRight = item.title.toLowerCase().includes(opt.toLowerCase());
    if (isRight) {
      speak(`Yes! That is a ${opt}.`);
      setCorrectCount((c) => c + 1);
    } else {
      speak(`Good attempt! That is a ${item.title}.`);
    }

    if (currentIdx + 1 < PICTURE_ITEMS.length) {
      setTimeout(() => setCurrentIdx((i) => i + 1), 1000);
    } else {
      setIsDone(true);
      const finalScore = Math.round(((correctCount + (isRight ? 1 : 0)) / PICTURE_ITEMS.length) * 100);
      const duration = Math.round((Date.now() - startTime) / 1000);
      onComplete(finalScore, duration);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="px-5 py-3 rounded-2xl bg-white border-2 border-slate-300 text-slate-800 font-bold text-lg flex items-center gap-2 hover:bg-slate-50 shadow-sm"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Exit Game</span>
        </button>
        <span className="text-xl font-black text-slate-800">
          Picture {currentIdx + 1} of {PICTURE_ITEMS.length}
        </span>
      </div>

      {!isDone ? (
        <div className="space-y-8 text-center max-w-xl mx-auto">
          <div className="w-48 h-48 sm:w-56 sm:h-56 mx-auto rounded-[3rem] bg-purple-50 border-4 border-purple-300 flex items-center justify-center text-8xl sm:text-9xl shadow-inner">
            {item.emoji}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {item.options.map((opt) => (
              <button
                key={opt}
                onClick={() => handleChoose(opt)}
                className="py-6 px-4 rounded-2xl bg-white hover:bg-purple-50 border-4 border-purple-200 hover:border-purple-500 text-2xl font-black text-slate-900 shadow-md transition-all active:scale-95"
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-8 sm:p-12 rounded-[2.5rem] bg-white border-4 border-purple-400 text-center space-y-6 shadow-2xl">
          <Trophy className="w-20 h-20 text-purple-500 mx-auto animate-bounce" />
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900">
            Well Done!
          </h2>
          <p className="text-xl font-bold text-slate-600">
            You recognized {correctCount} of {PICTURE_ITEMS.length} pictures.
          </p>
          <button
            onClick={onBack}
            className="px-6 py-4 rounded-2xl bg-purple-600 text-white font-black text-xl hover:bg-purple-700 shadow-md"
          >
            Return to Games
          </button>
        </div>
      )}
    </div>
  );
};

export default PatientGames;
