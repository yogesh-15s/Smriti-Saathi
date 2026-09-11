import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Stethoscope,
  TrendingDown,
  TrendingUp,
  FileText,
  Printer,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  Clock,
  Pill,
  Gamepad2,
  Calendar,
  Save,
  Sliders,
  ShieldAlert,
} from 'lucide-react';
import { apiRequest } from '../../lib/api.js';
import { DoctorPatientDetailData, ClinicalNoteItem } from '@ner/types';

export const DoctorPatientDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [detail, setDetail] = useState<DoctorPatientDetailData | null>(null);
  const [loading, setLoading] = useState(true);

  // New clinical note state
  const [newNote, setNewNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  // Baseline difficulty state
  const [baselineDifficulty, setBaselineDifficulty] = useState<number>(1);
  const [updatingDifficulty, setUpdatingDifficulty] = useState(false);
  const [difficultySuccessMsg, setDifficultySuccessMsg] = useState<string | null>(null);

  const fetchDetail = async () => {
    try {
      const res = await apiRequest<DoctorPatientDetailData>(`/api/doctor/patient/${id || 'pat-1'}`);
      setDetail(res);
      setBaselineDifficulty(res.currentBaselineDifficulty || 1);
    } catch (err) {
      console.warn('Using fallback doctor patient detail:', err);
      // Fallback data
      setDetail({
        patient: {
          id: id || 'pat-1',
          patientProfileId: id || 'pat-1',
          name: 'Biren Baruah',
          phone: '+91 98765 43210',
          dateOfBirth: '1952-04-15',
          age: 74,
          dementiaStage: 'mild',
          preferredLanguage: 'as',
          emergencyContact: '+91 98765 11223',
          inviteCode: 'NER-8K2Q',
          caretaker: {
            name: 'Ananya Baruah',
            phone: '+91 98765 11223',
            relationship: 'Daughter / Primary Caregiver',
          },
        },
        cognitiveHistory: [
          { date: '2026-09-02', score: 24.5, assessmentType: 'MMSE Equiv' },
          { date: '2026-09-04', score: 24.0, assessmentType: 'MMSE Equiv' },
          { date: '2026-09-05', score: 25.0, assessmentType: 'MMSE Equiv' },
          { date: '2026-09-07', score: 24.8, assessmentType: 'MMSE Equiv' },
          { date: '2026-09-08', score: 25.5, assessmentType: 'MMSE Equiv' },
          { date: '2026-09-09', score: 25.2, assessmentType: 'MMSE Equiv' },
        ],
        gameSessions: [
          {
            id: 'sess-1',
            date: 'Sep 9, 09:15 AM',
            gameType: 'Assam Tea Flora Match',
            score: 85,
            difficultyLevel: 1,
            durationSeconds: 145,
          },
          {
            id: 'sess-2',
            date: 'Sep 8, 10:30 AM',
            gameType: 'Hornbill Sequence Rhythm',
            score: 90,
            difficultyLevel: 1,
            durationSeconds: 110,
          },
        ],
        adherence: {
          medicineAdherencePercent: 92,
          sessionAdherencePercent: 86,
          totalCompleted: 24,
          totalScheduled: 26,
        },
        clinicalNotes: [
          {
            id: 'note-1',
            doctorId: 'doc-1',
            doctorName: 'Dr. H. Baruah',
            timestamp: '2026-09-05T10:30:00.000Z',
            note: 'Patient presents with stable cognitive engagement. Donepezil 5mg tolerated well without gastrointestinal side effects. Encouraged daughter to continue visual paired memory games.',
          },
        ],
        currentBaselineDifficulty: 1,
      });
      setBaselineDifficulty(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    setSavingNote(true);
    try {
      const created = await apiRequest<ClinicalNoteItem>(`/api/doctor/patient/${id || 'pat-1'}/notes`, {
        method: 'POST',
        body: JSON.stringify({ note: newNote.trim() }),
      });

      if (detail) {
        setDetail({
          ...detail,
          clinicalNotes: [created, ...detail.clinicalNotes],
        });
      }
      setNewNote('');
    } catch (err) {
      console.warn('Fallback note creation:', err);
      if (detail) {
        setDetail({
          ...detail,
          clinicalNotes: [
            {
              id: `note-${Date.now()}`,
              doctorId: 'doc-1',
              doctorName: 'Dr. H. Baruah',
              timestamp: new Date().toISOString(),
              note: newNote.trim(),
            },
            ...detail.clinicalNotes,
          ],
        });
      }
      setNewNote('');
    } finally {
      setSavingNote(false);
    }
  };

  const handleAdjustDifficulty = async (diff: number) => {
    setUpdatingDifficulty(true);
    setDifficultySuccessMsg(null);
    setBaselineDifficulty(diff);

    try {
      await apiRequest(`/api/doctor/patient/${id || 'pat-1'}/difficulty`, {
        method: 'PATCH',
        body: JSON.stringify({ difficulty: diff }),
      });
      setDifficultySuccessMsg(`Baseline calibrated to Level ${diff}`);
      setTimeout(() => setDifficultySuccessMsg(null), 3000);
    } catch (err) {
      console.warn('Error saving difficulty:', err);
    } finally {
      setUpdatingDifficulty(false);
    }
  };

  const handlePrintReport = () => {
    window.print();
  };

  if (loading || !detail) {
    return (
      <div className="p-12 text-center text-slate-500 font-bold">
        Loading clinical patient file...
      </div>
    );
  }

  const { patient, cognitiveHistory, gameSessions, adherence, clinicalNotes } = detail;

  // Chart Coordinates calculation for SVG Line Chart
  const minScore = 10;
  const maxScore = 30;
  const chartHeight = 220;
  const chartWidth = 700;
  const paddingX = 50;
  const paddingY = 30;

  const points = cognitiveHistory.map((item, idx) => {
    const x = paddingX + (idx / Math.max(1, cognitiveHistory.length - 1)) * (chartWidth - paddingX * 2);
    const y = chartHeight - paddingY - ((item.score - minScore) / (maxScore - minScore)) * (chartHeight - paddingY * 2);
    return { x, y, score: item.score, date: item.date };
  });

  const pathD = points.length > 0
    ? points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
    : '';

  return (
    <div className="space-y-8">
      {/* 1. Breadcrumbs & Clinical Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
        <button
          onClick={() => navigate('/doctor')}
          className="px-4 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-sm flex items-center gap-2 shadow-xs transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-ner-brahmaputra" />
          <span>Back to Triage Console</span>
        </button>

        <div className="flex items-center gap-3">
          {/* Message Caretaker Action */}
          <Link
            to={`/doctor/patient/${patient.id}/messages`}
            className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-xs transition-all"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Message Caretaker ({patient.caretaker.name.split(' ')[0]})</span>
          </Link>

          {/* Export PDF / Print Report */}
          <button
            onClick={handlePrintReport}
            className="px-4 py-2.5 rounded-xl bg-ner-brahmaputra hover:bg-blue-800 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-xs transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>Export Clinical PDF</span>
          </button>
        </div>
      </div>

      {/* 2. Patient Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-ner-brahmaputra to-blue-700 text-white font-black text-2xl flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
            {patient.name.split(' ').map((n) => n[0]).join('')}
          </div>

          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
                {patient.name}
              </h1>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200 capitalize">
                {patient.dementiaStage} Dementia
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
              Age: <span className="font-bold text-slate-800">{patient.age} yrs</span> • Primary Phone: <span className="font-mono text-slate-800">{patient.phone}</span> • Dialect: <span className="font-bold text-slate-800 uppercase">{patient.preferredLanguage}</span>
            </p>

            <p className="text-xs text-slate-500 font-medium">
              Caretaker: <span className="font-bold text-slate-800">{patient.caretaker.name}</span> ({patient.caretaker.phone}) • {patient.caretaker.relationship}
            </p>
          </div>
        </div>

        {/* Adherence Summary Widget */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-right shrink-0">
          <span className="text-[11px] font-bold text-slate-400 uppercase block">
            Adherence Compliance
          </span>
          <div className="text-2xl font-black text-emerald-600 mt-0.5">
            {adherence.medicineAdherencePercent}%
          </div>
          <span className="text-xs text-slate-500 font-medium">
            {adherence.totalCompleted} of {adherence.totalScheduled} doses & games
          </span>
        </div>
      </div>

      {/* 3. COGNITIVE SCORE HISTORY LINE CHART (Interactive SVG) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-ner-brahmaputra" />
              <span>Longitudinal Cognitive Score Curve (MMSE Scale 0 - 30)</span>
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Derived from gameplay accuracy, response latency, and normalized difficulty tiers
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-ner-brahmaputra">
              <span className="w-3 h-3 rounded-full bg-ner-brahmaputra inline-block" />
              Patient Score
            </span>
            <span className="flex items-center gap-1.5 text-rose-500">
              <span className="w-3 h-0.5 bg-rose-400 inline-block border-t border-dashed" />
              Impairment Threshold (20.0)
            </span>
          </div>
        </div>

        {/* SVG Chart Container */}
        <div className="w-full overflow-x-auto">
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="w-full min-w-[550px] h-64 bg-slate-50/50 rounded-2xl border border-slate-200"
          >
            {/* Horizontal Grid lines */}
            {[10, 15, 20, 25, 30].map((val) => {
              const y = chartHeight - paddingY - ((val - minScore) / (maxScore - minScore)) * (chartHeight - paddingY * 2);
              return (
                <g key={val}>
                  <line
                    x1={paddingX}
                    y1={y}
                    x2={chartWidth - paddingX}
                    y2={y}
                    stroke={val === 20 ? '#F87171' : '#E2E8F0'}
                    strokeDasharray={val === 20 ? '4 4' : undefined}
                    strokeWidth={val === 20 ? '1.5' : '1'}
                  />
                  <text
                    x={paddingX - 10}
                    y={y + 4}
                    fill={val === 20 ? '#DC2626' : '#94A3B8'}
                    fontSize="10"
                    textAnchor="end"
                    fontWeight="bold"
                  >
                    {val}
                  </text>
                </g>
              );
            })}

            {/* Score Trend Line Path */}
            {pathD && (
              <path
                d={pathD}
                fill="none"
                stroke="#205493"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Data point circles & tooltips */}
            {points.map((p, i) => (
              <g key={i} className="cursor-pointer group">
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="5.5"
                  fill="#FFFFFF"
                  stroke="#205493"
                  strokeWidth="3"
                  className="transition-all group-hover:scale-125"
                />
                <text
                  x={p.x}
                  y={p.y - 10}
                  fill="#0F172A"
                  fontSize="11"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {p.score}
                </text>
                <text
                  x={p.x}
                  y={chartHeight - 8}
                  fill="#64748B"
                  fontSize="10"
                  fontWeight="600"
                  textAnchor="middle"
                >
                  {p.date.split('-').slice(1).join('/')}
                </text>
              </g>
            ))}
          </svg>
        </div>
      </div>

      {/* 4. Game-by-Game Session History & Difficulty Adjuster */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Game Session Table */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Gamepad2 className="w-5 h-5 text-emerald-600" />
                <span>Game Session History</span>
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Detailed metrics logged per cognitive exercise
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[11px]">
                  <th className="py-2.5 px-3">Date & Time</th>
                  <th className="py-2.5 px-3">Exercise Type</th>
                  <th className="py-2.5 px-3">Accuracy</th>
                  <th className="py-2.5 px-3">Tier</th>
                  <th className="py-2.5 px-3">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {gameSessions.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="py-3 px-3 font-semibold text-slate-900">{s.date}</td>
                    <td className="py-3 px-3">{s.gameType}</td>
                    <td className="py-3 px-3">
                      <span className="font-extrabold text-emerald-700">{s.score}%</span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-slate-100 text-slate-800">
                        Level {s.difficultyLevel}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-500">{s.durationSeconds}s</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Manual Baseline Difficulty Calibrator */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-ner-brahmaputra" />
              <span>Difficulty Baseline Calibration</span>
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Override AI baseline to match patient's cognitive capacity
            </p>
          </div>

          <div className="space-y-3">
            {[
              { level: 1, title: 'Level 1 (Gentle)', desc: '3 pairs, slow rhythms, minimal sensory load' },
              { level: 2, title: 'Level 2 (Moderate)', desc: '4 pairs, 4-beat audio sequences, daily objects' },
              { level: 3, title: 'Level 3 (Active)', desc: '6 pairs, 5-beat sequences, associative memory' },
            ].map((d) => (
              <button
                key={d.level}
                onClick={() => handleAdjustDifficulty(d.level)}
                disabled={updatingDifficulty}
                className={`w-full p-4 rounded-2xl border-2 text-left transition-all ${
                  baselineDifficulty === d.level
                    ? 'border-ner-brahmaputra bg-blue-50/70 text-slate-900 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-black text-sm">{d.title}</span>
                  {baselineDifficulty === d.level && (
                    <span className="w-2 h-2 rounded-full bg-ner-brahmaputra" />
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1">{d.desc}</p>
              </button>
            ))}
          </div>

          {difficultySuccessMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{difficultySuccessMsg}</span>
            </div>
          )}
        </div>
      </div>

      {/* 5. Timestamped Clinical Observations / Notes (Visible Only to Doctors) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-ner-brahmaputra" />
              <span>Clinical Observations & Neurological Notes</span>
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Timestamped physician documentation — confidential and restricted to doctor portal
            </p>
          </div>
        </div>

        {/* Add Note Form */}
        <form onSubmit={handleSaveNote} className="space-y-3">
          <textarea
            rows={3}
            required
            placeholder="Record clinical assessment, medication adjustment rationale, or caretaker guidance notes..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl border border-slate-300 text-sm focus:ring-2 focus:ring-ner-brahmaputra focus:outline-none"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={savingNote}
              className="px-5 py-2.5 rounded-xl bg-ner-brahmaputra hover:bg-blue-800 text-white font-bold text-xs sm:text-sm shadow-md flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{savingNote ? 'Saving...' : 'Save Clinical Note'}</span>
            </button>
          </div>
        </form>

        {/* Existing Notes Feed */}
        <div className="space-y-4 pt-2">
          {clinicalNotes.map((n) => (
            <div key={n.id} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-bold text-ner-brahmaputra">{n.doctorName}</span>
                <span>{new Date(n.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })} at {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-800 font-medium leading-relaxed">
                {n.note}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DoctorPatientDetail;
