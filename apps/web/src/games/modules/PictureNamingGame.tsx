import React, { useState, useEffect, useRef } from 'react';
import { GameModule, GameConfig, GameResult } from '../types';
import { GameWrapper } from '../components/GameWrapper';
import { Mic, MicOff, Volume2, CheckCircle2, ArrowRight } from 'lucide-react';

interface PictureItem {
  targetName: string;
  prompt: string;
  icon: string;
  synonyms: string[];
  options: string[];
}

const DEFAULT_PICTURES: Record<number, PictureItem[]> = {
  1: [
    {
      targetName: 'Rhinoceros',
      prompt: 'Look at this majestic wild friend from Kaziranga National Park.',
      icon: '🦏',
      synonyms: ['rhino', 'rhinoceros', 'one horned rhino', 'gorh', 'gonda'],
      options: ['Rhinoceros', 'Elephant', 'Wild Buffalo'],
    },
    {
      targetName: 'Tea Kettle',
      prompt: 'What is this friendly utensil used to brew morning Assam tea?',
      icon: '🫖',
      synonyms: ['kettle', 'tea kettle', 'teapot', 'chawor kettle'],
      options: ['Tea Kettle', 'Water Glass', 'Rice Pot'],
    },
  ],
  2: [
    {
      targetName: 'Dhol',
      prompt: 'Which traditional rhythmic wooden drum is played during lively Bihu songs?',
      icon: '🥁',
      synonyms: ['dhol', 'drum', 'bihu dhol', 'dholok'],
      options: ['Dhol', 'Bamboo Flute', 'Violin'],
    },
    {
      targetName: 'Hornbill',
      prompt: 'Which magnificent bird with a golden yellow beak is celebrated in Nagaland?',
      icon: '🦤',
      synonyms: ['hornbill', 'great hornbill', 'hornbill bird'],
      options: ['Hornbill', 'Assam Myna', 'Woodpecker'],
    },
  ],
  3: [
    {
      targetName: 'Japi',
      prompt: 'What is this traditional conical woven hat woven from bamboo and tokou leaves?',
      icon: '👒',
      synonyms: ['japi', 'jaapi', 'traditional hat', 'bamboo hat'],
      options: ['Japi', 'Gamosa', 'Muga Shawl'],
    },
  ],
};

const PictureNamingComponent: React.FC<GameConfig> = ({
  difficulty,
  speak,
  onBack,
  onComplete,
}) => {
  const pictures = DEFAULT_PICTURES[difficulty] || DEFAULT_PICTURES[1];
  const [picIndex, setPicIndex] = useState(0);
  const currentPic = pictures[picIndex % pictures.length];

  const [inputMode, setInputMode] = useState<'options' | 'voice'>('options');
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [completedResult, setCompletedResult] = useState<GameResult | null>(null);

  const startTimeRef = useRef<number>(Date.now());
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    setSelectedOption(null);
    setHasAnswered(false);
    setVoiceTranscript('');
    speak(`${currentPic.prompt} Can you tell me what this is called?`);
  }, [picIndex]);

  // Voice recognition setup
  const startListening = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      speak('Microphone recognition is not supported in this browser. Please tap the friendly buttons.');
      setInputMode('options');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-IN';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
        speak('I am listening. Please say the name of the picture.');
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript.toLowerCase().trim();
        setVoiceTranscript(transcript);
        setIsListening(false);
        verifyAnswer(transcript);
      };

      recognition.onerror = (err: any) => {
        console.warn('Speech recognition error:', err);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn('Speech recognition start failed:', err);
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const verifyAnswer = (answer: string) => {
    setHasAnswered(true);
    const cleaned = answer.toLowerCase().trim();
    const isMatch =
      currentPic.synonyms.some((s) => cleaned.includes(s.toLowerCase())) ||
      cleaned.includes(currentPic.targetName.toLowerCase());

    if (isMatch) {
      speak(`Wonderful! That is indeed the ${currentPic.targetName}!`);
    } else {
      speak(`Good attempt! That is called the ${currentPic.targetName}.`);
    }
  };

  const handleOptionSelect = (opt: string) => {
    if (hasAnswered) return;
    setSelectedOption(opt);
    verifyAnswer(opt);
  };

  const isCorrect = hasAnswered && (
    (selectedOption && selectedOption.toLowerCase() === currentPic.targetName.toLowerCase()) ||
    currentPic.synonyms.some((s) => voiceTranscript.toLowerCase().includes(s.toLowerCase())) ||
    voiceTranscript.toLowerCase().includes(currentPic.targetName.toLowerCase())
  );

  const handleNextRound = () => {
    const score = isCorrect ? 100 : 55;
    const duration = Math.round((Date.now() - startTimeRef.current) / 1000);
    const result: GameResult = {
      score,
      durationSeconds: Math.max(15, duration),
      metrics: { target: currentPic.targetName, inputMode },
    };

    setCompletedResult(result);
    onComplete(result);
  };

  return (
    <GameWrapper
      title="Name the Picture"
      icon="🦏"
      difficulty={difficulty}
      instructionsAudioText="Look at the picture. You can either tap its name or use your voice to say what you see."
      speak={speak}
      onBack={onBack}
      completedResult={completedResult}
      onPlayAgain={() => {
        setCompletedResult(null);
        setPicIndex((i) => i + 1);
        startTimeRef.current = Date.now();
      }}
    >
      <div className="space-y-6">
        {/* Input Mode Selector & Prompt */}
        <div className="p-4 rounded-2xl bg-purple-50 border-2 border-purple-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🖼️</span>
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                {currentPic.prompt}
              </h3>
              <p className="text-sm font-semibold text-slate-600">
                Choose to tap an option or speak your answer aloud.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white border border-purple-200 shadow-xs">
            <button
              onClick={() => setInputMode('options')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                inputMode === 'options'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tap Choice
            </button>
            <button
              onClick={() => setInputMode('voice')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-1.5 ${
                inputMode === 'voice'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Mic className="w-4 h-4" />
              <span>Voice</span>
            </button>
          </div>
        </div>

        {/* Central Picture Display */}
        <div className="w-full h-64 sm:h-72 rounded-3xl bg-linear-to-b from-purple-50/60 to-emerald-50/60 border-4 border-purple-200 flex flex-col items-center justify-center p-6 shadow-inner">
          <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-3xl bg-white border-2 border-purple-200 shadow-xl flex items-center justify-center text-7xl sm:text-8xl select-none animate-pulse">
            {currentPic.icon}
          </div>
        </div>

        {/* Interactive Input Section */}
        {inputMode === 'voice' ? (
          <div className="p-6 rounded-3xl bg-white border-4 border-purple-200 text-center space-y-4 shadow-md">
            <p className="text-lg font-bold text-slate-700">
              {isListening
                ? 'Listening to your voice... Speak clearly.'
                : voiceTranscript
                ? `You said: "${voiceTranscript}"`
                : 'Tap the microphone and say the picture name'}
            </p>

            <button
              onClick={isListening ? stopListening : startListening}
              className={`px-8 py-4 rounded-3xl font-black text-lg flex items-center justify-center gap-3 mx-auto shadow-lg transition-all active:scale-95 ${
                isListening
                  ? 'bg-rose-600 text-white animate-bounce ring-4 ring-rose-300'
                  : 'bg-purple-600 hover:bg-purple-700 text-white hover:scale-105'
              }`}
            >
              {isListening ? (
                <>
                  <MicOff className="w-6 h-6" />
                  <span>Stop Listening</span>
                </>
              ) : (
                <>
                  <Mic className="w-6 h-6" />
                  <span>Tap to Speak</span>
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {currentPic.options.map((opt) => {
              const isSelected = selectedOption === opt;
              const isOptionCorrect = opt.toLowerCase() === currentPic.targetName.toLowerCase();

              return (
                <button
                  key={opt}
                  disabled={hasAnswered}
                  onClick={() => handleOptionSelect(opt)}
                  className={`p-6 sm:p-8 rounded-3xl border-4 font-black text-xl sm:text-2xl transition-all text-center flex flex-col items-center justify-center gap-2 active:scale-95 ${
                    hasAnswered
                      ? isOptionCorrect
                        ? 'bg-emerald-100 border-emerald-500 text-emerald-900 shadow-xl scale-105 ring-4 ring-emerald-300'
                        : isSelected
                        ? 'bg-amber-100 border-amber-400 text-amber-900'
                        : 'bg-white border-slate-200 text-slate-400 opacity-60'
                      : 'bg-white border-purple-200 hover:border-purple-500 text-slate-900 hover:scale-105 shadow-md'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span>{opt}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        speak(opt);
                      }}
                      className="p-1 rounded-full text-slate-400 hover:text-purple-600"
                      title="Hear option"
                    >
                      <Volume2 className="w-5 h-5" />
                    </button>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Feedback Banner */}
        {hasAnswered && (
          <div className="p-6 rounded-3xl bg-white border-4 border-purple-300 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in">
            <div className="flex items-center gap-4">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 shrink-0" />
              <div>
                <h4 className="text-2xl font-black text-slate-900">
                  {isCorrect ? 'Correct! Well Done! 🌟' : 'Good Memory Practice! 🌿'}
                </h4>
                <p className="text-base font-semibold text-slate-600">
                  This picture shows the <span className="font-bold text-slate-900">{currentPic.targetName}</span>.
                </p>
              </div>
            </div>

            <button
              onClick={handleNextRound}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-black text-lg shadow-lg active:scale-95 transition-all"
            >
              Continue
            </button>
          </div>
        )}
      </div>
    </GameWrapper>
  );
};

export const PictureNamingGameModule: GameModule = {
  id: 'picture_naming',
  name: 'Kaziranga Picture Naming',
  category: 'matching_sorting',
  categoryLabel: 'Matching & Sorting',
  description: 'Speak or tap the friendly name for regional animals and objects.',
  icon: '🦏',
  instructions_audio_text:
    'Picture naming. Look at the friendly picture and choose its name, or tap the microphone to say it aloud.',
  render: (config) => <PictureNamingComponent {...config} />,
};
