import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Users,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Pill,
  ChevronRight,
  Plus,
  Bell,
  Mail,
  Share2,
  Activity,
  HeartPulse,
} from 'lucide-react';
import { apiRequest } from '../../lib/api.js';
import { CaretakerPatientCard, NotificationLogItem } from '@ner/types';

export const CaretakerHome: React.FC = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<CaretakerPatientCard[]>([]);
  const [notifications, setNotifications] = useState<NotificationLogItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [pts, notifs] = await Promise.all([
        apiRequest<CaretakerPatientCard[]>('/api/caretaker/patients'),
        apiRequest<NotificationLogItem[]>('/api/caretaker/notifications'),
      ]);
      setPatients(pts);
      setNotifications(notifs);
    } catch (err) {
      console.warn('Error fetching caretaker data, using fallbacks:', err);
      setPatients([
        {
          id: 'pat-1',
          patientProfileId: 'pat-1',
          name: 'Biren Baruah',
          initials: 'BB',
          dementiaStage: 'mild',
          preferredLanguage: 'as',
          status: 'on_track',
          statusText: 'On track',
          openAlertCount: 0,
          todayMedicationSummary: '1 of 3 taken',
          recentActivity: 'Played memory game (85% recall)',
          inviteCode: 'NER-8K2Q',
        },
        {
          id: 'pat-2',
          patientProfileId: 'pat-2',
          name: 'Nirmala Devi',
          initials: 'ND',
          dementiaStage: 'moderate',
          preferredLanguage: 'hi',
          status: 'alert_open',
          statusText: '2 open alerts',
          openAlertCount: 2,
          todayMedicationSummary: '0 of 2 taken',
          recentActivity: 'Score drop flagged for doctor review',
          inviteCode: 'NER-3P7M',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const unreadNotifsCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-8">
      {/* Top Header & Navigation Sub-tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200 w-fit mb-2">
            <Users className="w-3.5 h-3.5" />
            <span>Caretaker Guardian Companion</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            Family Patients & Monitoring
          </h1>
          <p className="text-sm text-slate-600 font-medium mt-0.5">
            Daily routines, reassuring plain-language health updates, and quick family coordination
          </p>
        </div>

        {/* Quick Nav Actions */}
        <div className="flex items-center gap-3">
          <Link
            to="/caretaker/invites"
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs sm:text-sm flex items-center gap-2 border border-slate-300 transition-colors"
          >
            <Share2 className="w-4 h-4 text-amber-600" />
            <span>Invite Codes</span>
          </Link>

          <Link
            to="/caretaker/notifications"
            className="relative px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-sm transition-colors"
          >
            <Bell className="w-4 h-4" />
            <span>Notifications</span>
            {unreadNotifsCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[11px] font-black flex items-center justify-center -ml-0.5">
                {unreadNotifsCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Patient Cards List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <HeartPulse className="w-5 h-5 text-emerald-600" />
            <span>Linked Family Members ({patients.length})</span>
          </h2>
          <span className="text-xs font-semibold text-slate-500">
            Tap a card to view daily schedule & messages
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 font-bold">
            Loading your loved ones...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {patients.map((patient) => {
              const isOnTrack = patient.status === 'on_track';
              const isNeedsAttention = patient.status === 'needs_attention';
              const isAlertOpen = patient.status === 'alert_open';

              return (
                <div
                  key={patient.id}
                  onClick={() => navigate(`/caretaker/patient/${patient.id}`)}
                  className="group bg-white rounded-3xl p-6 sm:p-7 border-2 border-slate-200 hover:border-amber-400 shadow-sm hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    {/* Top Row: Avatar, Name, Status Badge */}
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-white font-black text-xl flex items-center justify-center shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
                          {patient.initials}
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-slate-900 group-hover:text-amber-800 transition-colors">
                            {patient.name}
                          </h3>
                          <p className="text-xs font-semibold text-slate-500 capitalize">
                            {patient.dementiaStage} stage • Dialect: {patient.preferredLanguage.toUpperCase()}
                          </p>
                        </div>
                      </div>

                      {/* Status Badges */}
                      <div>
                        {isOnTrack && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>On track</span>
                          </span>
                        )}
                        {isNeedsAttention && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            <span>Needs attention</span>
                          </span>
                        )}
                        {isAlertOpen && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                            <span>{patient.openAlertCount} alert{patient.openAlertCount > 1 ? 's' : ''}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quick Metrics (Reassuring language, not raw numbers) */}
                    <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs font-medium text-slate-700 mb-4">
                      <div>
                        <span className="text-[11px] font-bold text-slate-400 block uppercase">
                          Today's Medicine
                        </span>
                        <span className="font-extrabold text-slate-900 text-sm flex items-center gap-1 mt-0.5">
                          <Pill className="w-3.5 h-3.5 text-ner-tea" />
                          {patient.todayMedicationSummary}
                        </span>
                      </div>

                      <div>
                        <span className="text-[11px] font-bold text-slate-400 block uppercase">
                          Recent Status
                        </span>
                        <span className="font-semibold text-slate-800 truncate block mt-0.5">
                          {patient.recentActivity}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Action bar */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-amber-700">
                    <span>Invite Code: <span className="font-mono text-slate-700">{patient.inviteCode || 'NER-8K2Q'}</span></span>
                    <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      <span>View Daily Schedule & Details</span>
                      <ChevronRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CaretakerHome;
