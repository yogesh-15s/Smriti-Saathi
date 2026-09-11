import React, { useState } from 'react';
import {
  HeartPulse,
  Volume2,
  PhoneCall,
  Gamepad2,
  Pill,
  Clock,
  Sparkles,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Sun,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { useAccessibility } from '../../context/AccessibilityContext.js';

interface DailyReminder {
  id: string;
  title: string;
  time: string;
  type: 'medicine' | 'game' | 'appointment';
  status: 'pending' | 'done';
}

export const PatientDashboard: React.FC = () => {
  const { user } = useAuth();
  const { highContrast, toggleHighContrast } = useAccessibility();

  const [reminders, setReminders] = useState<DailyReminder[]>([
    {
      id: '1',
      title: 'Morning Dementia Tablet (Donepezil 5mg)',
      time: '08:30 AM',
      type: 'medicine',
      status: 'pending',
    },
    {
      id: '2',
      title: 'NER Flora Memory Match Session',
      time: '11:00 AM',
      type: 'game',
      status: 'pending',
    },
    {
      id: '3',
      title: 'Afternoon Walking & Breathing Exercise',
      time: '04:30 PM',
      type: 'appointment',
      status: 'pending',
    },
  ]);

  const [sosTriggered, setSosTriggered] = useState(false);
  const [speechActive, setSpeechActive] = useState(false);

  const markReminderDone = (id: string) => {
    setReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'done' } : r))
    );
  };

  const handleReadAloud = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.85; // slightly slower for elderly clarity
      setSpeechActive(true);
      utterance.onend = () => setSpeechActive(false);
      utterance.onerror = () => setSpeechActive(false);
      window.speechSynthesis.speak(utterance);
    } else {
      alert(`Read Aloud: "${text}"`);
    }
  };

  const handleSos = () => {
    setSosTriggered(true);
    handleReadAloud('Emergency alert sent to your caretaker and family members.');
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-emerald-50/30 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Patient Welcome Header */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-emerald-200 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs sm:text-sm font-bold mb-3">
              <HeartPulse className="w-4 h-4 text-emerald-600" />
              <span>Elderly Patient Portal • Assisted Care</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Good Morning, {user?.name || 'Grandparent'}!
            </h1>
            <p className="mt-2 text-slate-600 text-base sm:text-lg font-semibold">
              Today is a peaceful day in the North East. Here is your daily routine.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Read Page Aloud Button */}
            <button
              onClick={() =>
                handleReadAloud(
                  `Good morning ${user?.name || 'there'}. You have ${
                    reminders.filter((r) => r.status === 'pending').length
                  } pending tasks today.`
                )
              }
              className="px-5 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm sm:text-base flex items-center gap-2 border border-slate-300 shadow-xs transition-colors"
              title="Click to hear page contents spoken clearly"
            >
              <Volume2 className={`w-5 h-5 text-ner-tea ${speechActive ? 'animate-bounce' : ''}`} />
              <span>Read Aloud</span>
            </button>

            {/* Emergency SOS Call Button */}
            <button
              onClick={handleSos}
              className={`px-6 py-3.5 rounded-2xl font-black text-base sm:text-lg flex items-center gap-2 shadow-lg transition-all ${
                sosTriggered
                  ? 'bg-rose-700 text-white animate-pulse'
                  : 'bg-rose-600 hover:bg-rose-700 text-white hover:scale-105 shadow-rose-600/30'
              }`}
            >
              <PhoneCall className="w-6 h-6" />
              <span>{sosTriggered ? 'SOS ALERT SENT!' : 'CALL CARETAKER (SOS)'}</span>
            </button>
          </div>
        </div>

        {/* SOS Confirmation Banner */}
        {sosTriggered && (
          <div className="p-6 rounded-3xl bg-rose-600 text-white shadow-xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <ShieldAlert className="w-10 h-10 text-rose-200 shrink-0 animate-spin" />
              <div>
                <h3 className="text-xl font-black">Help is on the way!</h3>
                <p className="text-sm font-semibold text-rose-100">
                  Your registered caretaker has been alerted via emergency SMS and notification. Stay calm.
                </p>
              </div>
            </div>
            <button
              onClick={() => setSosTriggered(false)}
              className="px-4 py-2 bg-white text-rose-700 rounded-xl font-bold text-sm hover:bg-rose-50"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Main Grid: Reminders & Games */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Daily Schedule & Medicines */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-emerald-100 shadow-md flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
                  <Pill className="w-6 h-6 text-ner-tea" />
                  <span>Today's Reminders</span>
                </h2>
                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                  {reminders.filter((r) => r.status === 'done').length} of {reminders.length} Done
                </span>
              </div>

              <div className="space-y-4">
                {reminders.map((item) => (
                  <div
                    key={item.id}
                    className={`p-5 rounded-2xl border-2 transition-all flex items-center justify-between gap-4 ${
                      item.status === 'done'
                        ? 'bg-slate-50 border-slate-200 opacity-60'
                        : 'bg-emerald-50/40 border-emerald-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        {item.type === 'medicine' ? (
                          <Pill className="w-6 h-6 text-ner-tea" />
                        ) : (
                          <Clock className="w-6 h-6 text-amber-600" />
                        )}
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-slate-900 leading-snug">
                          {item.title}
                        </h4>
                        <p className="text-sm font-semibold text-slate-500 mt-1 flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>Scheduled: {item.time}</span>
                        </p>
                      </div>
                    </div>

                    <div>
                      {item.status === 'done' ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 text-sm font-bold">
                          <CheckCircle2 className="w-4 h-4" /> Done
                        </span>
                      ) : (
                        <button
                          onClick={() => markReminderDone(item.id)}
                          className="px-5 py-2.5 rounded-xl bg-ner-tea hover:bg-ner-forest text-white font-black text-sm shadow-md transition-transform hover:scale-105"
                        >
                          Mark Done
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200 text-xs text-slate-500 font-semibold flex items-center justify-between">
              <span>All adherence records sync automatically with your doctor & caretaker.</span>
            </div>
          </div>

          {/* Cognitive Games & Cultural Memory Activities */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-emerald-100 shadow-md flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
                  <Gamepad2 className="w-6 h-6 text-ner-golden" />
                  <span>Memory Games (NER)</span>
                </h2>
                <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
                  Recommended for You
                </span>
              </div>

              <div className="space-y-4">
                {/* Game 1 */}
                <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-200 hover:border-emerald-500 transition-all flex items-center justify-between gap-4">
                  <div>
                    <span className="px-2.5 py-0.5 rounded-md text-[11px] font-extrabold bg-emerald-200 text-emerald-900">
                      Visual Recall
                    </span>
                    <h4 className="text-lg font-bold text-slate-900 mt-1">
                      Assam Tea Garden & Flora Match
                    </h4>
                    <p className="text-xs text-slate-600 font-medium mt-0.5">
                      Pair indigenous orchids, tea leaves, and rhododendrons.
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      handleReadAloud(
                        'Starting Assam Tea Garden and Flora Match game. Difficulty level 1.'
                      )
                    }
                    className="px-5 py-3 rounded-xl bg-ner-tea hover:bg-ner-forest text-white font-black text-sm shadow-md transition-all shrink-0 hover:scale-105"
                  >
                    Play
                  </button>
                </div>

                {/* Game 2 */}
                <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 hover:border-amber-500 transition-all flex items-center justify-between gap-4">
                  <div>
                    <span className="px-2.5 py-0.5 rounded-md text-[11px] font-extrabold bg-amber-200 text-amber-900">
                      Pattern Sequence
                    </span>
                    <h4 className="text-lg font-bold text-slate-900 mt-1">
                      Hornbill Audio & Beat Sequence
                    </h4>
                    <p className="text-xs text-slate-600 font-medium mt-0.5">
                      Listen and follow traditional folk percussion patterns.
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      handleReadAloud(
                        'Starting Hornbill Audio pattern game. Listen to the rhythmic sequence.'
                      )
                    }
                    className="px-5 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-sm shadow-md transition-all shrink-0 hover:scale-105"
                  >
                    Play
                  </button>
                </div>

                {/* Game 3 */}
                <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-50 to-sky-50 border-2 border-blue-200 hover:border-blue-500 transition-all flex items-center justify-between gap-4">
                  <div>
                    <span className="px-2.5 py-0.5 rounded-md text-[11px] font-extrabold bg-blue-200 text-blue-900">
                      Spatial Memory
                    </span>
                    <h4 className="text-lg font-bold text-slate-900 mt-1">
                      Kaziranga River Trail Journey
                    </h4>
                    <p className="text-xs text-slate-600 font-medium mt-0.5">
                      Recall paths through the sanctuary to guide the rhino safely.
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      handleReadAloud(
                        'Starting Kaziranga Trail Journey. Guide the gentle rhino through the sanctuary.'
                      )
                    }
                    className="px-5 py-3 rounded-xl bg-ner-brahmaputra hover:bg-blue-800 text-white font-black text-sm shadow-md transition-all shrink-0 hover:scale-105"
                  >
                    Play
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 font-semibold">
              <span>Playing 10 mins daily stimulates neural plasticity.</span>
              <span className="text-emerald-700 font-bold">Streak: 4 Days 🔥</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
