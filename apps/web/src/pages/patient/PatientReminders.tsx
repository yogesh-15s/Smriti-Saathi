import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Pill,
  Clock,
  Gamepad2,
  Calendar,
  CheckCircle2,
  Volume2,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import { apiRequest } from '../../lib/api.js';
import { PatientReminderItem } from '@ner/types';

export const PatientReminders: React.FC = () => {
  const navigate = useNavigate();
  const [reminders, setReminders] = useState<PatientReminderItem[]>([]);
  const [loading, setLoading] = useState(true);

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
    }
  };

  const fetchReminders = async () => {
    try {
      const data = await apiRequest<PatientReminderItem[]>('/api/patient/reminders');
      setReminders(data);
    } catch (err) {
      console.warn('Could not fetch reminders from API, using defaults:', err);
      // Fallback
      setReminders([
        {
          id: 'rem-1',
          title: 'Donepezil (5mg)',
          type: 'medicine',
          scheduledTime: '08:30 AM',
          timeDisplay: '08:30 AM',
          status: 'done',
          isOverdue: false,
          description: 'Take 1 tablet with warm water after breakfast',
        },
        {
          id: 'rem-2',
          title: 'NER Tea Garden Memory Match',
          type: 'game',
          scheduledTime: '11:00 AM',
          timeDisplay: '11:00 AM',
          status: 'pending',
          isOverdue: true,
          description: 'Morning cognitive exercise session',
        },
        {
          id: 'rem-3',
          title: 'Memantine HCl (10mg)',
          type: 'medicine',
          scheduledTime: '02:30 PM',
          timeDisplay: '02:30 PM',
          status: 'pending',
          isOverdue: false,
          description: 'Afternoon capsule with fruit or tea',
        },
        {
          id: 'rem-4',
          title: 'Evening Veranda Walk',
          type: 'appointment',
          scheduledTime: '05:30 PM',
          timeDisplay: '05:30 PM',
          status: 'pending',
          isOverdue: false,
          description: '15 minutes gentle walk with caretaker',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReminders();
    speak('Here are your reminders for today. Tap the big check button when done.');
  }, []);

  const handleMarkDone = async (id: string, title: string) => {
    speak(`Marked ${title} as done. Good job.`);
    // Optimistic UI update
    setReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'done', isOverdue: false } : r))
    );

    try {
      await apiRequest(`/api/patient/reminders/${id}/done`, {
        method: 'PATCH',
      });
    } catch (err) {
      console.warn('Could not sync reminder status to server:', err);
    }
  };

  const pendingCount = reminders.filter((r) => r.status === 'pending').length;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        <div>
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900">
            Today's Routine
          </h1>
          <p className="text-lg sm:text-xl font-bold text-ner-tea mt-1">
            {pendingCount === 0
              ? 'All finished for today! Enjoy your peaceful day.'
              : `${pendingCount} item${pendingCount > 1 ? 's' : ''} left for today.`}
          </p>
        </div>

        <button
          onClick={() =>
            speak(
              `You have ${pendingCount} pending reminders left today. Take your time.`
            )
          }
          className="p-4 rounded-3xl bg-amber-100 hover:bg-amber-200 text-amber-900 border-2 border-amber-300 shadow-md flex items-center gap-2"
          title="Read reminders aloud"
        >
          <Volume2 className="w-8 h-8 text-amber-700" />
          <span className="text-lg font-black hidden sm:inline">Listen</span>
        </button>
      </div>

      {/* Reminder Cards List */}
      <div className="space-y-5">
        {reminders.map((r) => {
          const isDone = r.status === 'done';
          // Calm color tint for overdue - soft warm amber/slate, no red flashing
          const isOverdueCalm = r.isOverdue && !isDone;

          return (
            <div
              key={r.id}
              className={`p-6 sm:p-8 rounded-3xl border-4 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-md ${
                isDone
                  ? 'bg-slate-100/70 border-slate-300 opacity-60'
                  : isOverdueCalm
                  ? 'bg-amber-50/90 border-amber-300' // Calm warm tint, comforting
                  : 'bg-white border-emerald-200'
              }`}
            >
              {/* Item Info */}
              <div className="flex items-start gap-5">
                <div
                  className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl shrink-0 mt-1 ${
                    isDone
                      ? 'bg-slate-200 text-slate-500'
                      : r.type === 'medicine'
                      ? 'bg-emerald-100 text-ner-tea'
                      : r.type === 'game'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  {r.type === 'medicine' ? (
                    <Pill className="w-9 h-9" />
                  ) : r.type === 'game' ? (
                    <Gamepad2 className="w-9 h-9" />
                  ) : (
                    <Clock className="w-9 h-9" />
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-2xl sm:text-3xl font-black text-slate-900 leading-snug">
                      {r.title}
                    </span>
                    {isOverdueCalm && (
                      <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-amber-200/80 text-amber-900">
                        A little later than usual
                      </span>
                    )}
                  </div>

                  <p className="text-lg sm:text-xl font-bold text-slate-500 flex items-center gap-1.5">
                    <Clock className="w-5 h-5 text-ner-tea shrink-0" />
                    <span>Scheduled for: {r.timeDisplay}</span>
                  </p>

                  {r.description && (
                    <p className="text-sm sm:text-base font-semibold text-slate-600">
                      {r.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Big Action Checkbox/Button */}
              <div className="w-full sm:w-auto shrink-0">
                {isDone ? (
                  <div className="px-6 py-4 rounded-2xl bg-emerald-100 border-2 border-emerald-300 text-ner-forest font-black text-xl flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-7 h-7 text-emerald-600" />
                    <span>Done ✓</span>
                  </div>
                ) : (
                  <button
                    onClick={() => handleMarkDone(r.id, r.title)}
                    className="w-full sm:w-auto px-8 py-5 rounded-2xl bg-ner-tea hover:bg-ner-forest text-white font-black text-xl sm:text-2xl shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 focus:ring-8 focus:ring-emerald-300"
                  >
                    <CheckCircle2 className="w-8 h-8" />
                    <span>Mark Done</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PatientReminders;
