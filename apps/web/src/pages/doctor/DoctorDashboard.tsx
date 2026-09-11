import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Stethoscope,
  Users,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Minus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldAlert,
  Activity,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { apiRequest } from '../../lib/api.js';
import { DoctorDashboardData, DoctorAlertItem, DoctorPatientRow } from '@ner/types';

export const DoctorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<DoctorDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [reviewingAlertId, setReviewingAlertId] = useState<string | null>(null);

  const fetchDashboard = async () => {
    try {
      const res = await apiRequest<DoctorDashboardData>('/api/doctor/dashboard');
      setData(res);
    } catch (err) {
      console.warn('Using fallback doctor dashboard data:', err);
      // Fallback data
      setData({
        metrics: {
          totalPatients: 2,
          activeAlertsCount: 3,
          averageScoreTrendPercent: -1.8,
          sessionsCompletedToday: 2,
        },
        alertsNeedingReview: [
          {
            id: 'alt-doc-1',
            patientId: 'pat-2',
            patientName: 'Nirmala Devi',
            type: 'score_drop',
            severity: 'warning',
            description: "Nirmala's cognitive game scores have dropped 18% over the past 7 days.",
            createdAt: new Date(Date.now() - 86400000).toISOString(),
            status: 'open',
            suggestedAction: 'Review MMSE subscores, consider adjusting Donepezil/Memantine regimen.',
          },
          {
            id: 'alt-doc-2',
            patientId: 'pat-2',
            patientName: 'Nirmala Devi',
            type: 'missed_medicine',
            severity: 'warning',
            description: 'Rivastigmine patch change missed this morning at 09:00 AM.',
            createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
            status: 'open',
            suggestedAction: 'Confirm patch replacement with primary caretaker Ananya.',
          },
          {
            id: 'alt-doc-3',
            patientId: 'pat-1',
            patientName: 'Biren Baruah',
            type: 'missed_session',
            severity: 'warning',
            description: 'No cognitive games completed in the last 3 days.',
            createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
            status: 'open',
            suggestedAction: 'Encourage 10-minute Assam Tea Garden matching game session.',
          },
        ],
        patients: [
          {
            id: 'pat-1',
            name: 'Biren Baruah',
            age: 74,
            dementiaStage: 'mild',
            lastActiveDate: 'Today',
            scoreTrend: 'up',
            currentScore: 25.2,
            statusBadge: 'stable',
            caretakerName: 'Ananya Baruah (Daughter)',
          },
          {
            id: 'pat-2',
            name: 'Nirmala Devi',
            age: 80,
            dementiaStage: 'moderate',
            lastActiveDate: 'Yesterday',
            scoreTrend: 'down',
            currentScore: 17.0,
            statusBadge: 'attention_needed',
            caretakerName: 'Ananya Baruah (Ward Caretaker)',
          },
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleReviewAlert = async (alertId: string) => {
    setReviewingAlertId(alertId);
    try {
      await apiRequest(`/api/doctor/alerts/${alertId}/review`, { method: 'PATCH' });
      // Optimistic update
      if (data) {
        setData({
          ...data,
          alertsNeedingReview: data.alertsNeedingReview.filter((a) => a.id !== alertId),
          metrics: {
            ...data.metrics,
            activeAlertsCount: Math.max(0, data.metrics.activeAlertsCount - 1),
          },
        });
      }
    } catch (err) {
      console.warn('Error reviewing alert on server:', err);
    } finally {
      setReviewingAlertId(null);
    }
  };

  if (loading || !data) {
    return (
      <div className="p-12 text-center text-slate-500 font-bold">
        Loading clinician triage dashboard...
      </div>
    );
  }

  // Filter patient cohort
  const filteredPatients = data.patients.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.caretakerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStage = stageFilter === 'all' || p.dementiaStage.toLowerCase() === stageFilter.toLowerCase();
    return matchesSearch && matchesStage;
  });

  return (
    <div className="space-y-8">
      {/* 1. Header & Quick Status */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-ner-brahmaputra text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/20">
            <Stethoscope className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
              Clinician Triage Console
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-semibold">
              North Eastern Regional Cognitive Monitoring Registry • High-Priority Care
            </p>
          </div>
        </div>

        <div className="px-4 py-2 rounded-xl bg-blue-50 text-ner-brahmaputra text-xs font-bold border border-blue-200">
          Fast Triage Mode Active
        </div>
      </div>

      {/* 2. Top Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Metric 1: Total Patients */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Total Monitored Patients
          </span>
          <div className="mt-2 text-3xl font-black text-slate-900">
            {data.metrics.totalPatients}
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">Assigned under clinical protocol</p>
        </div>

        {/* Metric 2: Active Alerts Count */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Active Alerts Needing Review
          </span>
          <div className="mt-2 text-3xl font-black text-rose-600 flex items-baseline gap-2">
            <span>{data.metrics.activeAlertsCount}</span>
            {data.metrics.activeAlertsCount > 0 && (
              <span className="text-xs font-bold text-rose-600 animate-pulse">Action Needed</span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">Prioritized for fast intervention</p>
        </div>

        {/* Metric 3: Average Cognitive Score Trend */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Cohort Score Trend (7-Day)
          </span>
          <div className="mt-2 text-3xl font-black text-slate-900 flex items-center gap-1.5">
            <span>{data.metrics.averageScoreTrendPercent > 0 ? `+${data.metrics.averageScoreTrendPercent}%` : `${data.metrics.averageScoreTrendPercent}%`}</span>
            {data.metrics.averageScoreTrendPercent > 0 ? (
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            ) : data.metrics.averageScoreTrendPercent < 0 ? (
              <TrendingDown className="w-5 h-5 text-amber-600" />
            ) : (
              <Minus className="w-5 h-5 text-slate-400" />
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">Weighted average across cohort</p>
        </div>

        {/* Metric 4: Sessions Completed Today */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Sessions Completed Today
          </span>
          <div className="mt-2 text-3xl font-black text-emerald-600">
            {data.metrics.sessionsCompletedToday}
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">Active memory sessions logged</p>
        </div>
      </div>

      {/* 3. ALERTS NEEDING REVIEW (PLACED PROMINENTLY ABOVE PATIENT LIST) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-rose-200 shadow-sm space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <span>Alerts Needing Review</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-100 text-rose-800">
                  {data.alertsNeedingReview.length} Open
                </span>
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                High-priority notifications generated by the automated Alert Engine
              </p>
            </div>
          </div>
        </div>

        {data.alertsNeedingReview.length === 0 ? (
          <div className="p-8 rounded-2xl bg-emerald-50 border border-emerald-200 text-center text-emerald-800 font-bold text-sm flex items-center justify-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>All clinical alerts have been reviewed and resolved. Zero urgent items!</span>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 space-y-2">
            {data.alertsNeedingReview.map((alert) => (
              <div
                key={alert.id}
                className="pt-3 pb-2 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-slate-50/50 p-2 rounded-2xl transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-slate-900 text-sm">
                      {alert.patientName}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider ${
                        alert.severity === 'critical'
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}
                    >
                      {alert.severity}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {new Date(alert.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <p className="text-xs font-bold text-slate-700">
                    {alert.description}
                  </p>

                  {alert.suggestedAction && (
                    <p className="text-[11px] font-semibold text-ner-brahmaputra">
                      💡 Suggested: {alert.suggestedAction}
                    </p>
                  )}
                </div>

                {/* Triage Action Buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleReviewAlert(alert.id)}
                    disabled={reviewingAlertId === alert.id}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors disabled:opacity-50"
                  >
                    {reviewingAlertId === alert.id ? 'Archiving...' : 'Mark Reviewed ✓'}
                  </button>

                  <Link
                    to={`/doctor/patient/${alert.patientId}`}
                    className="px-3.5 py-2 rounded-xl bg-ner-brahmaputra hover:bg-blue-800 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1"
                  >
                    <span>Open Patient File</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. FULL PATIENT COHORT LIST (Below Alerts) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-ner-brahmaputra" />
              <span>Assigned Patient Registry ({filteredPatients.length})</span>
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Sortable clinical cohort with MMSE score trends and status indicators
            </p>
          </div>

          {/* Search & Filter */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search patient or caretaker..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs font-medium rounded-xl border border-slate-300 focus:ring-2 focus:ring-ner-brahmaputra focus:outline-none"
              />
            </div>

            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 bg-white focus:outline-none"
            >
              <option value="all">All Stages</option>
              <option value="mild">Mild</option>
              <option value="moderate">Moderate</option>
              <option value="severe">Severe</option>
            </select>
          </div>
        </div>

        {/* Patient Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Patient Name & Demographics</th>
                <th className="py-3 px-4">Stage</th>
                <th className="py-3 px-4">Last Active</th>
                <th className="py-3 px-4">Current Score / Trend</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredPatients.map((patient) => {
                const isStable = patient.statusBadge === 'stable';
                const isAttention = patient.statusBadge === 'attention_needed';
                const isCritical = patient.statusBadge === 'critical';

                return (
                  <tr key={patient.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-4">
                      <div>
                        <span className="font-bold text-slate-900 block text-sm">
                          {patient.name}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {patient.age} yrs • Caretaker: {patient.caretakerName}
                        </span>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 capitalize">
                        {patient.dementiaStage}
                      </span>
                    </td>

                    <td className="py-4 px-4 text-xs font-semibold text-slate-600">
                      {patient.lastActiveDate}
                    </td>

                    <td className="py-4 px-4 font-bold text-slate-900">
                      <div className="flex items-center gap-2">
                        <span>{patient.currentScore} MMSE</span>
                        {patient.scoreTrend === 'up' && (
                          <span title="Score improving">
                            <TrendingUp className="w-4 h-4 text-emerald-600" />
                          </span>
                        )}
                        {patient.scoreTrend === 'down' && (
                          <span title="Score decreasing">
                            <TrendingDown className="w-4 h-4 text-rose-600" />
                          </span>
                        )}
                        {patient.scoreTrend === 'stable' && (
                          <span title="Score stable">
                            <Minus className="w-4 h-4 text-slate-400" />
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      {isStable && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                          Stable
                        </span>
                      )}
                      {isAttention && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                          Attention Needed
                        </span>
                      )}
                      {isCritical && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                          Critical Alert
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-4 text-right">
                      <Link
                        to={`/doctor/patient/${patient.id}`}
                        className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-ner-brahmaputra hover:text-white text-slate-700 font-bold text-xs inline-flex items-center gap-1 transition-colors"
                      >
                        <span>Clinical Details</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;
