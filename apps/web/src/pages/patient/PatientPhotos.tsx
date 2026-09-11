import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Volume2,
  Sparkles,
  HelpCircle,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Images,
} from 'lucide-react';
import { apiRequest } from '../../lib/api.js';
import { FamilyPhoto } from '@ner/types';

export const PatientPhotos: React.FC = () => {
  const navigate = useNavigate();
  const [photos, setPhotos] = useState<FamilyPhoto[]>([]);
  const [loading, setLoading] = useState(true);

  // Active view: 'album' (view all photos) or 'game' (recognition check)
  const [mode, setMode] = useState<'album' | 'game'>('album');

  // Currently selected photo in album mode for full-screen view
  const [selectedPhoto, setSelectedPhoto] = useState<FamilyPhoto | null>(null);

  // Recognition Check game state
  const [gameIndex, setGameIndex] = useState(0);
  const [options, setOptions] = useState<string[]>([]);
  const [answered, setAnswered] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean>(false);
  const [gameScore, setGameScore] = useState(0);
  const [gameFinished, setGameFinished] = useState(false);
  const [gameStartTime, setGameStartTime] = useState<number>(Date.now());

  // Web Speech API text-to-speech
  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.85;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const fetchPhotos = async () => {
    try {
      const res = await apiRequest<FamilyPhoto[]>('/api/patient/photos');
      if (res && res.length > 0) {
        setPhotos(res);
      } else {
        throw new Error('No photos returned');
      }
    } catch (e) {
      console.warn('Using fallback family photos:', e);
      setPhotos([
        {
          id: 'photo-1',
          patientId: 'pat-1',
          uploadedBy: 'user-caretaker-1',
          photoUrl:
            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop&q=80',
          personName: 'Ramesh Baruah',
          relationship: 'Your son Ramesh',
          caption: 'Ramesh visiting home during the Bihu celebration in Jorhat tea estate.',
          dateOfMemory: '2023-09-10',
          uploadedAt: new Date().toISOString(),
        },
        {
          id: 'photo-2',
          patientId: 'pat-1',
          uploadedBy: 'user-caretaker-1',
          photoUrl:
            'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800&auto=format&fit=crop&q=80',
          personName: 'Meera Baruah',
          relationship: 'Your daughter Meera',
          caption: 'Meera smiling warmly on her graduation ceremony day in Guwahati.',
          dateOfMemory: '2021-05-18',
          uploadedAt: new Date().toISOString(),
        },
        {
          id: 'photo-3',
          patientId: 'pat-1',
          uploadedBy: 'user-caretaker-1',
          photoUrl:
            'https://images.unsplash.com/photo-1548142813-c348350df52b?w=800&auto=format&fit=crop&q=80',
          personName: 'Sunita Baruah',
          relationship: 'Your beloved wife Sunita',
          caption: 'Sunita in the peaceful tea garden veranda enjoying warm morning chai.',
          dateOfMemory: '2019-11-20',
          uploadedAt: new Date().toISOString(),
        },
        {
          id: 'photo-4',
          patientId: 'pat-1',
          uploadedBy: 'user-caretaker-1',
          photoUrl:
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80',
          personName: 'Ananya Baruah',
          relationship: 'Your caretaker Ananya',
          caption: 'Ananya holding fresh orchids from the garden to brighten the room.',
          dateOfMemory: '2024-02-10',
          uploadedAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPhotos();
  }, []);

  // When tapping a photo in album mode
  const handlePhotoClick = (photo: FamilyPhoto) => {
    setSelectedPhoto(photo);
    const spokenText = `This is ${photo.relationship}.`;
    speak(spokenText);
  };

  // Start Recognition Check Game
  const startRecognitionCheck = () => {
    setMode('game');
    setGameIndex(0);
    setGameScore(0);
    setGameFinished(false);
    setGameStartTime(Date.now());
    setupQuestion(0, photos);
  };

  // Setup options for current question
  const setupQuestion = (idx: number, photoList: FamilyPhoto[]) => {
    if (idx >= photoList.length) {
      finishGame(gameScore);
      return;
    }

    const current = photoList[idx];
    setAnswered(false);
    setIsCorrect(false);

    // Pick 2 other names for 3 options total
    const otherNames = photoList
      .filter((p) => p.id !== current.id)
      .map((p) => p.personName);

    // Shuffle and pick up to 2 distractors
    const shuffledOthers = [...otherNames].sort(() => 0.5 - Math.random()).slice(0, 2);
    const opts = [current.personName, ...shuffledOthers].sort(() => 0.5 - Math.random());

    setOptions(opts);
    speak('Who is this? Tap the name you recognize.');
  };

  // Handle Answer in Recognition Check
  const handleSelectOption = async (chosenName: string) => {
    if (answered) return;

    const current = photos[gameIndex];
    const correct = chosenName === current.personName;
    setAnswered(true);
    setIsCorrect(correct);

    const newScore = correct ? gameScore + 25 : gameScore;
    if (correct) {
      setGameScore(newScore);
      speak(`Wonderful! Yes, this is ${current.relationship}.`);
    } else {
      speak(`That is okay. This is ${current.relationship}.`);
    }

    // Advance after brief pause
    setTimeout(() => {
      const nextIdx = gameIndex + 1;
      if (nextIdx < photos.length) {
        setGameIndex(nextIdx);
        setupQuestion(nextIdx, photos);
      } else {
        finishGame(newScore);
      }
    }, 2800);
  };

  // Finish Game and Log Session
  const finishGame = async (finalScore: number) => {
    setGameFinished(true);
    const durationSeconds = Math.max(5, Math.round((Date.now() - gameStartTime) / 1000));
    speak(`Great job! You scored ${finalScore} points remembering your loved ones.`);

    try {
      await apiRequest('/api/patient/games/session', {
        method: 'POST',
        body: JSON.stringify({
          gameType: 'face_recognition',
          score: finalScore,
          difficultyLevel: 1,
          durationSeconds,
        }),
      });
    } catch (err) {
      console.warn('Could not log face recognition session:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <div className="w-16 h-16 border-4 border-ner-tea border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-2xl font-bold text-slate-700">Opening photo album...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Top Header with Mode Toggle & Voice Prompt */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              if (selectedPhoto) {
                setSelectedPhoto(null);
              } else if (mode === 'game') {
                setMode('album');
              } else {
                navigate('/patient');
              }
            }}
            className="p-4 rounded-2xl bg-white border-2 border-slate-300 hover:border-ner-tea text-slate-800 shadow-md transition-all flex items-center gap-2"
            aria-label="Go back"
          >
            <ArrowLeft className="w-8 h-8 text-ner-tea" />
            <span className="text-xl font-black">Back</span>
          </button>

          <div>
            <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
              {mode === 'album' ? 'Family & Friends' : 'Who Is This?'}
            </h1>
            <p className="text-lg sm:text-xl font-bold text-slate-600">
              {mode === 'album'
                ? 'Tap any photo to hear who this is'
                : 'Lightweight memory check'}
            </p>
          </div>
        </div>

        {/* Mode Switcher */}
        <div className="flex items-center gap-3">
          {mode === 'album' ? (
            <button
              onClick={startRecognitionCheck}
              className="py-4 px-6 rounded-3xl bg-amber-500 hover:bg-amber-600 text-white text-xl sm:text-2xl font-black shadow-lg hover:scale-105 transition-all flex items-center gap-3"
            >
              <HelpCircle className="w-7 h-7" />
              <span>Recognition Check</span>
            </button>
          ) : (
            <button
              onClick={() => setMode('album')}
              className="py-4 px-6 rounded-3xl bg-emerald-600 hover:bg-emerald-700 text-white text-xl sm:text-2xl font-black shadow-lg hover:scale-105 transition-all flex items-center gap-3"
            >
              <Images className="w-7 h-7" />
              <span>View All Photos</span>
            </button>
          )}
        </div>
      </div>

      {/* VIEW 1: ALBUM MODE (LARGE TAPPABLE PHOTO CARDS) */}
      {mode === 'album' && !selectedPhoto && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
          {photos.map((photo) => (
            <button
              key={photo.id}
              onClick={() => handlePhotoClick(photo)}
              className="group p-5 rounded-[2.5rem] bg-white border-4 border-slate-200 hover:border-ner-tea shadow-xl hover:shadow-2xl transition-all text-left flex flex-col gap-4 focus:ring-8 focus:ring-emerald-200 cursor-pointer"
            >
              <div className="w-full h-64 sm:h-72 rounded-3xl overflow-hidden bg-slate-100 relative">
                <img
                  src={photo.photoUrl}
                  alt={photo.personName}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-4 right-4 p-3 rounded-2xl bg-white/90 shadow-md">
                  <Volume2 className="w-8 h-8 text-ner-tea" />
                </div>
              </div>

              <div className="space-y-1 px-2">
                <h2 className="text-3xl sm:text-4xl font-black text-slate-900">
                  {photo.personName}
                </h2>
                <p className="text-xl sm:text-2xl font-bold text-ner-forest">
                  {photo.relationship}
                </p>
                {photo.caption && (
                  <p className="text-lg text-slate-600 font-medium line-clamp-2 pt-1">
                    {photo.caption}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* FULL-SCREEN SINGLE PHOTO MODAL WITH LARGE TEXT & VOICE SPEECH */}
      {mode === 'album' && selectedPhoto && (
        <div className="bg-white rounded-[3rem] p-6 sm:p-10 border-4 border-ner-tea shadow-2xl space-y-6">
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="w-full h-80 sm:h-96 rounded-3xl overflow-hidden shadow-inner bg-slate-100">
              <img
                src={selectedPhoto.photoUrl}
                alt={selectedPhoto.personName}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="text-center space-y-3">
              <h2 className="text-4xl sm:text-5xl font-black text-slate-900">
                {selectedPhoto.personName}
              </h2>
              <p className="text-2xl sm:text-3xl font-extrabold text-ner-tea">
                This is {selectedPhoto.relationship}
              </p>
              {selectedPhoto.caption && (
                <p className="text-xl sm:text-2xl font-bold text-slate-700 bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200">
                  "{selectedPhoto.caption}"
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              <button
                onClick={() => speak(`This is ${selectedPhoto.relationship}. ${selectedPhoto.caption}`)}
                className="py-5 px-6 rounded-3xl bg-ner-tea hover:bg-ner-forest text-white text-2xl font-black shadow-lg flex items-center justify-center gap-3 transition-all"
              >
                <Volume2 className="w-8 h-8" />
                <span>Hear Aloud</span>
              </button>

              <button
                onClick={() => setSelectedPhoto(null)}
                className="py-5 px-6 rounded-3xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-2xl font-black transition-all"
              >
                Back to All Photos
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: RECOGNITION CHECK GAME ("WHO IS THIS?") */}
      {mode === 'game' && !gameFinished && photos.length > 0 && (
        <div className="bg-white rounded-[3rem] p-6 sm:p-10 border-4 border-amber-400 shadow-2xl space-y-8 max-w-3xl mx-auto">
          {/* Question Indicator */}
          <div className="flex items-center justify-between text-slate-500 font-extrabold text-xl">
            <span>
              Photo {gameIndex + 1} of {photos.length}
            </span>
            <span className="text-ner-tea font-black text-2xl">
              Score: {gameScore}
            </span>
          </div>

          {/* Photo being tested */}
          <div className="w-full h-72 sm:h-80 rounded-3xl overflow-hidden bg-slate-100 shadow-md">
            <img
              src={photos[gameIndex].photoUrl}
              alt="Family memory"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="text-center">
            <h2 className="text-3xl sm:text-5xl font-black text-slate-900">
              Who is this?
            </h2>
          </div>

          {/* 2-3 Large Friendly Choice Buttons */}
          <div className="space-y-4">
            {options.map((opt) => {
              const isSelected = answered;
              const isThisCorrect = opt === photos[gameIndex].personName;

              let btnStyle = 'bg-slate-100 hover:bg-amber-100 border-2 border-slate-300 text-slate-900';
              if (isSelected) {
                if (isThisCorrect) {
                  btnStyle = 'bg-emerald-600 text-white border-2 border-emerald-700 shadow-lg';
                } else {
                  btnStyle = 'bg-slate-200 text-slate-500 border-2 border-slate-300';
                }
              }

              return (
                <button
                  key={opt}
                  disabled={answered}
                  onClick={() => handleSelectOption(opt)}
                  className={`w-full py-6 px-8 rounded-3xl text-2xl sm:text-3xl font-black text-center transition-all shadow-md active:scale-98 ${btnStyle}`}
                >
                  {opt}
                </button>
              );
            })}
          </div>

          {/* Feedback banner */}
          {answered && (
            <div
              className={`p-6 rounded-3xl text-center space-y-2 animate-in fade-in zoom-in-95 duration-200 ${
                isCorrect ? 'bg-emerald-100 text-emerald-900' : 'bg-amber-100 text-amber-900'
              }`}
            >
              <div className="flex items-center justify-center gap-3">
                {isCorrect ? (
                  <>
                    <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                    <span className="text-3xl font-black">Correct!</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-10 h-10 text-amber-600" />
                    <span className="text-3xl font-black">That's okay!</span>
                  </>
                )}
              </div>
              <p className="text-2xl font-bold">
                This is {photos[gameIndex].relationship}.
              </p>
            </div>
          )}
        </div>
      )}

      {/* GAME FINISHED SCREEN */}
      {mode === 'game' && gameFinished && (
        <div className="bg-white rounded-[3rem] p-8 sm:p-12 border-4 border-emerald-400 shadow-2xl text-center space-y-8 max-w-xl mx-auto">
          <div className="w-24 h-24 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
            <Sparkles className="w-14 h-14" />
          </div>

          <div className="space-y-3">
            <h2 className="text-4xl sm:text-5xl font-black text-slate-900">
              Great Session!
            </h2>
            <p className="text-2xl font-bold text-slate-600">
              You scored <span className="text-ner-tea font-black">{gameScore} points</span> remembering your loved ones.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
            <button
              onClick={startRecognitionCheck}
              className="py-5 px-6 rounded-3xl bg-amber-500 hover:bg-amber-600 text-white text-2xl font-black shadow-lg flex items-center justify-center gap-3 transition-all"
            >
              <RotateCcw className="w-7 h-7" />
              <span>Play Again</span>
            </button>

            <button
              onClick={() => setMode('album')}
              className="py-5 px-6 rounded-3xl bg-ner-tea hover:bg-ner-forest text-white text-2xl font-black shadow-lg transition-all"
            >
              Back to Album
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientPhotos;
