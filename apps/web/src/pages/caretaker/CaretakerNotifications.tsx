import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Bell,
  Pill,
  Gamepad2,
  ShieldAlert,
  Stethoscope,
  Check,
  Send,
  Sparkles,
} from 'lucide-react';
import { apiRequest } from '../../lib/api.js';
import { NotificationLogItem } from '@ner/types';

export const CaretakerNotifications: React.FC = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState<string | null>(null);

  const fetchNotifs = async () => {
    try {
      const data = await apiRequest<NotificationLogItem[]>('/api/caretaker/notifications');
      setNotifications(data);
    } catch (err) {
      console.warn('Using default notifications:', err);
      setNotifications([
        {
          id: 'notif-1',
          patientId: 'pat-1',
          patientName: 'Biren Baruah',
          type: 'missed_medicine',
          title: 'Missed Medication Notice',
          message: 'Biren has not confirmed taking Donepezil (5mg) scheduled for 08:30 AM.',
          timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
          read: false,
          channels: ['push', 'sms'],
        },
        {
          id: 'notif-2',
          patientId: 'pat-2',
          patientName: 'Nirmala Devi',
          type: 'missed_game_session',
          title: 'Missed Cognitive Training Notice',
          message: 'Nirmala has not played any memory games for two days in a row.',
          timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
          read: true,
          channels: ['push', 'email'],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, []);

  const handleMarkRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    try {
      await apiRequest(`/api/caretaker/notifications/${id}/read`, { method: 'PATCH' });
    } catch (e) {
      console.warn('Error marking read:', e);
    }
  };

  const handleSimulateTrigger = async (
    type: 'missed_medicine' | 'missed_game_session' | 'sos_trigger' | 'doctor_flag'
  ) => {
    setTriggering(type);
    try {
      const created = await apiRequest<NotificationLogItem>('/api/caretaker/notifications/trigger-stub', {
        method: 'POST',
        body: JSON.stringify({
          type,
          patientId: 'pat-1',
          patientName: 'Biren Baruah',
        }),
      });
      setNotifications([created, ...notifications]);
    } catch (err) {
      console.error('Error triggering notification stub:', err);
    } finally {
      setTriggering(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/caretaker')}
          className="px-4 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-sm flex items-center gap-2 shadow-xs transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-amber-600" />
          <span>Back to Patients</span>
        </button>

        <span className="text-xs font-bold text-slate-500">
          Push & SMS Dispatch Monitor
        </span>
      </div>

      {/* Simulator Card: Trigger the 4 user-specified scenarios */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900">
              Notification Trigger Simulator
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Demonstrate automated caretaker notification dispatch for the 4 core clinical conditions
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Trigger 1: Missed medicine */}
          <button
            onClick={() => handleSimulateTrigger('missed_medicine')}
            disabled={triggering !== null}
            className="p-4 rounded-2xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-left space-y-1 transition-all hover:scale-[1.02] disabled:opacity-50"
          >
            <div className="flex items-center gap-1.5 font-bold text-xs">
              <Pill className="w-4 h-4 text-ner-tea" />
              <span>1. Missed Medicine</span>
            </div>
            <p className="text-[11px] text-slate-600">
              Trigger alert when medication is unconfirmed for 2 hours.
            </p>
          </button>

          {/* Trigger 2: Missed games 2 days */}
          <button
            onClick={() => handleSimulateTrigger('missed_game_session')}
            disabled={triggering !== null}
            className="p-4 rounded-2xl bg-blue-50 hover:bg-blue-100 border border-blue-300 text-blue-900 text-left space-y-1 transition-all hover:scale-[1.02] disabled:opacity-50"
          >
            <div className="flex items-center gap-1.5 font-bold text-xs">
              <Gamepad2 className="w-4 h-4 text-ner-brahmaputra" />
              <span>2. Missed 2 Days</span>
            </div>
            <p className="text-[11px] text-slate-600">
              Trigger when patient misses cognitive games 2 days in a row.
            </p>
          </button>

          {/* Trigger 3: Patient SOS */}
          <button
            onClick={() => handleSimulateTrigger('sos_trigger')}
            disabled={triggering !== null}
            className="p-4 rounded-2xl bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-900 text-left space-y-1 transition-all hover:scale-[1.02] disabled:opacity-50"
          >
            <div className="flex items-center gap-1.5 font-bold text-xs">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              <span>3. Patient SOS</span>
            </div>
            <p className="text-[11px] text-slate-600">
              Instant critical SMS alert with GPS coordinates.
            </p>
          </button>

          {/* Trigger 4: Doctor Flag */}
          <button
            onClick={() => handleSimulateTrigger('doctor_flag')}
            disabled={triggering !== null}
            className="p-4 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-900 text-left space-y-1 transition-all hover:scale-[1.02] disabled:opacity-50"
          >
            <div className="flex items-center gap-1.5 font-bold text-xs">
              <Stethoscope className="w-4 h-4 text-ner-tea" />
              <span>4. Doctor Flag</span>
            </div>
            <p className="text-[11px] text-slate-600">
              Clinician flags cognitive drop requiring home follow-up.
            </p>
          </button>
        </div>
      </div>

      {/* Notifications Feed */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
          <Bell className="w-5 h-5 text-amber-600" />
          <span>Notification Stream ({notifications.length})</span>
        </h2>

        <div className="divide-y divide-slate-100 space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                !n.read
                  ? 'bg-amber-50/60 border-amber-300 font-semibold'
                  : 'bg-white border-slate-100 text-slate-600'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    n.type === 'sos_trigger'
                      ? 'bg-rose-100 text-rose-600'
                      : n.type === 'missed_medicine'
                      ? 'bg-amber-100 text-amber-700'
                      : n.type === 'doctor_flag'
                      ? 'bg-emerald-100 text-ner-tea'
                      : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  {n.type === 'sos_trigger' ? (
                    <ShieldAlert className="w-5 h-5" />
                  ) : n.type === 'missed_medicine' ? (
                    <Pill className="w-5 h-5" />
                  ) : n.type === 'doctor_flag' ? (
                    <Stethoscope className="w-5 h-5" />
                  ) : (
                    <Gamepad2 className="w-5 h-5" />
                  )}
                </div>

                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-900 text-sm">{n.title}</h4>
                    {!n.read && (
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                    )}
                  </div>
                  <p className="text-xs text-slate-700">{n.message}</p>
                  <p className="text-[10px] text-slate-400">
                    {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Via {n.channels.map((c) => c.toUpperCase()).join(' & ')}
                  </p>
                </div>
              </div>

              {!n.read && (
                <button
                  onClick={() => handleMarkRead(n.id)}
                  className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold shrink-0 transition-colors"
                >
                  Mark as Read
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CaretakerNotifications;
