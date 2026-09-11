import React, { useState } from 'react';
import {
  Users,
  HeartPulse,
  Pill,
  Clock,
  Plus,
  Copy,
  Check,
  Gamepad2,
  AlertCircle,
  Phone,
  Calendar,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';

interface CaretakerReminder {
  id: string;
  medicine: string;
  dosage: string;
  time: string;
  status: 'pending' | 'taken' | 'missed';
}

export const CaretakerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [inviteCode] = useState('NER-8K2Q');

  const [reminders, setReminders] = useState<CaretakerReminder[]>([
    {
      id: '1',
      medicine: 'Donepezil',
      dosage: '5mg - 1 tablet',
      time: '08:30 AM',
      status: 'taken',
    },
    {
      id: '2',
      medicine: 'Memantine HCl',
      dosage: '10mg - with water',
      time: '01:00 PM',
      status: 'pending',
    },
    {
      id: '3',
      medicine: 'Multivitamin & Ginkgo Biloba',
      dosage: '1 capsule',
      time: '08:00 PM',
      status: 'pending',
    },
  ]);

  const [newMedName, setNewMedName] = useState('');
  const [newMedTime, setNewMedTime] = useState('09:00 AM');
  const [newMedDosage, setNewMedDosage] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddMedicine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMedName.trim()) return;

    const newReminder: CaretakerReminder = {
      id: String(Date.now()),
      medicine: newMedName.trim(),
      dosage: newMedDosage.trim() || 'Standard Dose',
      time: newMedTime,
      status: 'pending',
    };

    setReminders([...reminders, newReminder]);
    setNewMedName('');
    setNewMedDosage('');
    setShowAddForm(false);
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-amber-50/20 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Caretaker Welcome Header */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-amber-200 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs sm:text-sm font-bold mb-3">
              <Users className="w-4 h-4 text-amber-600" />
              <span>Caretaker Guardian Companion</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
              Welcome back, {user?.name || 'Caregiver'}
            </h1>
            <p className="mt-1 text-slate-600 text-sm font-semibold">
              Monitoring Biren Baruah (Parent) • Assam, India
            </p>
          </div>

          {/* Family Linking Code Box */}
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center gap-4">
            <div>
              <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">
                Patient Invite Code
              </span>
              <span className="text-lg font-mono font-black text-slate-900">
                {inviteCode}
              </span>
            </div>
            <button
              onClick={handleCopyCode}
              className="p-2 rounded-xl bg-white hover:bg-amber-100 border border-amber-300 text-amber-900 transition-colors"
              title="Copy patient code to share with other family caretakers"
            >
              {copied ? <Check className="w-5 h-5 text-emerald-600" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Status Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Today's Medication
              </span>
              <Pill className="w-5 h-5 text-ner-tea" />
            </div>
            <div className="mt-2 text-2xl font-black text-slate-900">
              {reminders.filter((r) => r.status === 'taken').length} / {reminders.length} Taken
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">Morning dose taken on time at 08:32 AM</p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Memory Gaming
              </span>
              <Gamepad2 className="w-5 h-5 text-ner-golden" />
            </div>
            <div className="mt-2 text-2xl font-black text-ner-golden">
              1 Session Complete
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">Flora Match: 92% accuracy (14m duration)</p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Doctor Connected
              </span>
              <ShieldCheck className="w-5 h-5 text-ner-brahmaputra" />
            </div>
            <div className="mt-2 text-2xl font-black text-ner-brahmaputra">
              Dr. H. Baruah
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">Guwahati Neurological Institute</p>
          </div>
        </div>

        {/* Medication Scheduler & Recent Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Medication Schedule List */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                  <Pill className="w-5 h-5 text-amber-600" />
                  <span>Scheduled Reminders & Alarms</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">
                  Reminders automatically announce on the patient's device in preferred language
                </p>
              </div>

              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Medicine</span>
              </button>
            </div>

            {/* Add Medicine Form Modal/Inline */}
            {showAddForm && (
              <form
                onSubmit={handleAddMedicine}
                className="mb-6 p-4 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-3"
              >
                <h4 className="text-xs font-bold text-amber-900 uppercase">
                  Schedule New Medicine
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    required
                    placeholder="Medicine Name (e.g. Donepezil)"
                    value={newMedName}
                    onChange={(e) => setNewMedName(e.target.value)}
                    className="px-3 py-2 text-xs rounded-lg border border-amber-300 bg-white"
                  />
                  <input
                    type="text"
                    placeholder="Dosage (e.g. 1 Tablet)"
                    value={newMedDosage}
                    onChange={(e) => setNewMedDosage(e.target.value)}
                    className="px-3 py-2 text-xs rounded-lg border border-amber-300 bg-white"
                  />
                  <input
                    type="text"
                    placeholder="Time (e.g. 02:00 PM)"
                    value={newMedTime}
                    onChange={(e) => setNewMedTime(e.target.value)}
                    className="px-3 py-2 text-xs rounded-lg border border-amber-300 bg-white"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-bold hover:bg-amber-700"
                  >
                    Save Reminder
                  </button>
                </div>
              </form>
            )}

            {/* Reminders Table/List */}
            <div className="space-y-3">
              {reminders.map((r) => (
                <div
                  key={r.id}
                  className="p-4 rounded-2xl border border-slate-200 flex items-center justify-between gap-4 hover:border-amber-300 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{r.medicine}</h4>
                      <p className="text-xs text-slate-500 font-medium">
                        {r.dosage} • {r.time}
                      </p>
                    </div>
                  </div>

                  <div>
                    {r.status === 'taken' ? (
                      <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                        Taken ✓
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
                        Pending
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Emergency & Care Info */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <h3 className="text-base font-extrabold text-slate-900">
              Emergency Contact & Settings
            </h3>

            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200">
              <span className="text-xs font-bold text-rose-800 uppercase tracking-wider block mb-1">
                Emergency SOS Destination
              </span>
              <p className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-rose-600" />
                <span>+91 98765 43210 (Caretaker Primary)</span>
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                When patient presses "CALL CARETAKER (SOS)", an instantaneous alert is dispatched.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1">
                Patient Preferred Language
              </span>
              <p className="text-sm font-bold text-slate-900">
                Assamese (অসমীয়া)
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Voice read-aloud prompts will automatically render in this dialect.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
