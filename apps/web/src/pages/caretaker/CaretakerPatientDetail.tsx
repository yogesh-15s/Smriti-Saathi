import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Pill,
  Clock,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  ShieldAlert,
  Calendar,
  Sparkles,
  Phone,
  User,
  Image,
  Mic,
  Users,
  Send,
  MapPin,
  Play,
  RotateCcw,
  Check,
  Eye,
  Camera,
  Navigation,
} from 'lucide-react';
import { apiRequest } from '../../lib/api.js';
import {
  CaretakerPatientDetailData,
  PatientReminderItem,
  ReminderType,
  FamilyPhoto,
  PatientNote,
  PatientContact,
  CaretakerMessage,
} from '@ner/types';

type DetailTab = 'schedule' | 'photos' | 'notes' | 'contacts' | 'messages' | 'safezone';

export const CaretakerPatientDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const patientId = id || 'pat-1';
  const navigate = useNavigate();

  const [detail, setDetail] = useState<CaretakerPatientDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<DetailTab>('schedule');

  // Reminders Form state
  const [showAddReminderModal, setShowAddReminderModal] = useState(false);
  const [newType, setNewType] = useState<ReminderType>('medicine');
  const [newTitle, setNewTitle] = useState('');
  const [newTime, setNewTime] = useState('08:00 AM');
  const [newDesc, setNewDesc] = useState('');
  const [reminderSubmitting, setReminderSubmitting] = useState(false);

  // Tab 2: Family Photos state
  const [photos, setPhotos] = useState<FamilyPhoto[]>([]);
  const [showAddPhotoModal, setShowAddPhotoModal] = useState(false);
  const [photoUrl, setPhotoUrl] = useState('');
  const [personName, setPersonName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [photoCaption, setPhotoCaption] = useState('');
  const [dateOfMemory, setDateOfMemory] = useState('');
  const [photoSubmitting, setPhotoSubmitting] = useState(false);

  // Tab 3: Patient Notes state
  const [patientNotes, setPatientNotes] = useState<PatientNote[]>([]);
  const [playingNoteId, setPlayingNoteId] = useState<string | null>(null);
  const noteAudioRef = useRef<HTMLAudioElement | null>(null);

  // Tab 4: Contacts state (max 3)
  const [contacts, setContacts] = useState<PatientContact[]>([]);
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactName, setContactName] = useState('');
  const [contactRelation, setContactRelation] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactPhotoUrl, setContactPhotoUrl] = useState('');
  const [contactSubmitting, setContactSubmitting] = useState(false);

  // Tab 5: Caretaker Messages state
  const [caretakerMessages, setCaretakerMessages] = useState<CaretakerMessage[]>([]);
  const [msgType, setMsgType] = useState<'photo' | 'voice'>('photo');
  const [msgContentUrl, setMsgContentUrl] = useState('');
  const [msgCaption, setMsgCaption] = useState('');
  const [msgSending, setMsgSending] = useState(false);
  const [msgSentSuccess, setMsgSentSuccess] = useState(false);

  // Tab 6: Safe Zone settings state
  const [safeZoneRadius, setSafeZoneRadius] = useState(500);
  const [homeLat, setHomeLat] = useState(26.1445);
  const [homeLng, setHomeLng] = useState(91.7362);
  const [safeZoneSaving, setSafeZoneSaving] = useState(false);
  const [safeZoneSaved, setSafeZoneSaved] = useState(false);

  const fetchDetail = async () => {
    try {
      const res = await apiRequest<CaretakerPatientDetailData>(`/api/caretaker/patient/${patientId}`);
      setDetail(res);
    } catch (err) {
      console.warn('Using fallback patient detail data:', err);
      setDetail({
        patient: {
          id: patientId,
          patientProfileId: patientId,
          name: 'Biren Baruah',
          phone: '+91 98765 43210',
          dateOfBirth: '1952-04-15',
          dementiaStage: 'mild',
          preferredLanguage: 'as',
          emergencyContact: '+91 98765 11223',
          inviteCode: 'NER-8K2Q',
          assignedDoctor: {
            id: 'doc-1',
            name: 'Dr. H. Baruah',
            hospital: 'Guwahati Neurological Institute',
            specialization: 'Neurologist / Geriatrician',
          },
        },
        status: 'on_track',
        statusText: 'On track',
        plainLanguageCognitiveStatus:
          'Consistent cognitive engagement this week. Memory response speed is steady and calm.',
        reminders: [
          {
            id: 'rem-1',
            title: 'Donepezil (5mg)',
            type: 'medicine',
            scheduledTime: '08:30 AM',
            timeDisplay: '08:30 AM',
            status: 'done',
            isOverdue: false,
            description: '1 tablet with water after breakfast',
          },
        ],
        alerts: [],
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPhotos = async () => {
    try {
      const res = await apiRequest<FamilyPhoto[]>(`/api/caretaker/patient/${patientId}/photos`);
      setPhotos(res);
    } catch (e) {
      console.warn('Could not fetch photos:', e);
    }
  };

  const fetchNotes = async () => {
    try {
      const res = await apiRequest<PatientNote[]>(`/api/caretaker/patient/${patientId}/notes`);
      setPatientNotes(res);
    } catch (e) {
      console.warn('Could not fetch patient notes:', e);
    }
  };

  const fetchContacts = async () => {
    try {
      const res = await apiRequest<PatientContact[]>(`/api/caretaker/patient/${patientId}/contacts`);
      setContacts(res);
    } catch (e) {
      console.warn('Could not fetch contacts:', e);
    }
  };

  const fetchMessages = async () => {
    try {
      const res = await apiRequest<CaretakerMessage[]>(
        `/api/caretaker/patient/${patientId}/caretaker-messages`
      );
      setCaretakerMessages(res);
    } catch (e) {
      console.warn('Could not fetch messages:', e);
    }
  };

  useEffect(() => {
    fetchDetail();
    fetchPhotos();
    fetchNotes();
    fetchContacts();
    fetchMessages();
  }, [patientId]);

  // Handle Add Reminder
  const handleAddReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setReminderSubmitting(true);
    try {
      const created = await apiRequest<PatientReminderItem>(
        `/api/caretaker/patient/${patientId}/reminders`,
        {
          method: 'POST',
          body: JSON.stringify({
            type: newType,
            title: newTitle.trim(),
            timeDisplay: newTime,
            description: newDesc.trim() || undefined,
          }),
        }
      );

      if (detail) {
        setDetail({
          ...detail,
          reminders: [...detail.reminders, created],
        });
      }

      setNewTitle('');
      setNewDesc('');
      setShowAddReminderModal(false);
    } catch (err) {
      console.error('Error adding reminder:', err);
    } finally {
      setReminderSubmitting(false);
    }
  };

  // Handle Add Photo
  const handleAddPhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoUrl.trim() || !personName.trim() || !relationship.trim()) return;

    setPhotoSubmitting(true);
    try {
      const created = await apiRequest<FamilyPhoto>(
        `/api/caretaker/patient/${patientId}/photos`,
        {
          method: 'POST',
          body: JSON.stringify({
            photoUrl: photoUrl.trim(),
            personName: personName.trim(),
            relationship: relationship.trim(),
            caption: photoCaption.trim(),
            dateOfMemory: dateOfMemory.trim() || undefined,
          }),
        }
      );

      setPhotos([created, ...photos]);
      setPhotoUrl('');
      setPersonName('');
      setRelationship('');
      setPhotoCaption('');
      setDateOfMemory('');
      setShowAddPhotoModal(false);
    } catch (err) {
      console.error('Error adding photo:', err);
    } finally {
      setPhotoSubmitting(false);
    }
  };

  // Handle Delete Photo
  const handleDeletePhoto = async (photoId: string) => {
    if (!confirm('Are you sure you want to remove this memory photo?')) return;
    try {
      await apiRequest(`/api/caretaker/photos/${photoId}`, { method: 'DELETE' });
      setPhotos(photos.filter((p) => p.id !== photoId));
    } catch (err) {
      console.error('Error deleting photo:', err);
    }
  };

  // Handle Audio Note Playback
  const handlePlayNoteAudio = (note: PatientNote) => {
    if (playingNoteId === note.id) {
      if (noteAudioRef.current) noteAudioRef.current.pause();
      setPlayingNoteId(null);
      return;
    }

    if (noteAudioRef.current) {
      noteAudioRef.current.pause();
    }

    const audio = new Audio(note.audioUrl);
    noteAudioRef.current = audio;
    setPlayingNoteId(note.id);
    audio.play();
    audio.onended = () => setPlayingNoteId(null);
  };

  // Handle Add / Edit Contact (Enforces max 3)
  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !contactPhone.trim()) return;

    if (contacts.length >= 3) {
      alert('Maximum of 3 contacts allowed. Please delete or replace an existing contact.');
      return;
    }

    setContactSubmitting(true);
    const updatedList = [
      ...contacts.map((c) => ({
        name: c.name,
        relationship: c.relationship,
        phoneNumber: c.phoneNumber,
        photoUrl: c.photoUrl,
      })),
      {
        name: contactName.trim(),
        relationship: contactRelation.trim() || 'Family',
        phoneNumber: contactPhone.trim(),
        photoUrl:
          contactPhotoUrl.trim() ||
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
      },
    ];

    try {
      const saved = await apiRequest<PatientContact[]>(
        `/api/caretaker/patient/${patientId}/contacts`,
        {
          method: 'POST',
          body: JSON.stringify({ contacts: updatedList }),
        }
      );
      setContacts(saved);
      setContactName('');
      setContactRelation('');
      setContactPhone('');
      setContactPhotoUrl('');
      setShowContactModal(false);
    } catch (err) {
      console.error('Error saving contact:', err);
    } finally {
      setContactSubmitting(false);
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    if (!confirm('Remove this call shortcut?')) return;
    try {
      await apiRequest(`/api/caretaker/contacts/${contactId}`, { method: 'DELETE' });
      setContacts(contacts.filter((c) => c.id !== contactId));
    } catch (err) {
      console.error('Error deleting contact:', err);
    }
  };

  // Handle Send Caretaker Message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgContentUrl.trim()) return;

    setMsgSending(true);
    try {
      const created = await apiRequest<CaretakerMessage>(
        `/api/caretaker/patient/${patientId}/caretaker-messages`,
        {
          method: 'POST',
          body: JSON.stringify({
            type: msgType,
            contentUrl: msgContentUrl.trim(),
            caption: msgCaption.trim() || undefined,
          }),
        }
      );

      setCaretakerMessages([created, ...caretakerMessages]);
      setMsgContentUrl('');
      setMsgCaption('');
      setMsgSentSuccess(true);
      setTimeout(() => setMsgSentSuccess(false), 3000);
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setMsgSending(false);
    }
  };

  // Handle Save Safe Zone Geofence
  const handleSaveSafeZone = async (e: React.FormEvent) => {
    e.preventDefault();
    setSafeZoneSaving(true);
    try {
      await apiRequest(`/api/caretaker/patient/${patientId}/safe-zone`, {
        method: 'PATCH',
        body: JSON.stringify({
          radiusMeters: safeZoneRadius,
          latitude: homeLat,
          longitude: homeLng,
        }),
      });
      setSafeZoneSaved(true);
      setTimeout(() => setSafeZoneSaved(false), 3000);
    } catch (err) {
      console.error('Error saving safe zone:', err);
    } finally {
      setSafeZoneSaving(false);
    }
  };

  if (loading || !detail) {
    return (
      <div className="p-12 text-center text-slate-500 font-bold">
        Loading patient details...
      </div>
    );
  }

  const { patient, statusText, plainLanguageCognitiveStatus, reminders, alerts } = detail;

  return (
    <div className="space-y-8">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <button
          onClick={() => navigate('/caretaker')}
          className="px-4 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-sm flex items-center gap-2 shadow-xs transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-amber-600" />
          <span>Back to Patients</span>
        </button>

        {/* Message Doctor Action */}
        <Link
          to={`/caretaker/patient/${patient.id}/messages`}
          className="px-5 py-2.5 rounded-xl bg-ner-brahmaputra hover:bg-blue-800 text-white font-bold text-sm flex items-center gap-2 shadow-sm hover:shadow transition-all"
        >
          <MessageSquare className="w-4 h-4" />
          <span>Message Attending Doctor</span>
        </Link>
      </div>

      {/* Patient Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-white font-black text-2xl flex items-center justify-center shadow-md shadow-amber-500/20 shrink-0">
            {patient.name.split(' ').map((n) => n[0]).join('')}
          </div>

          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
                {patient.name}
              </h1>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                {statusText}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
              Dementia Stage:{' '}
              <span className="font-bold text-slate-800 capitalize">
                {patient.dementiaStage}
              </span>{' '}
              • Primary Phone:{' '}
              <span className="font-mono text-slate-800">{patient.phone}</span>
            </p>

            <p className="text-xs text-slate-500 font-medium">
              Assigned Clinician:{' '}
              <span className="font-bold text-slate-800">
                {patient.assignedDoctor?.name || 'Dr. H. Baruah'}
              </span>{' '}
              ({patient.assignedDoctor?.hospital || 'Guwahati Neurological Inst.'})
            </p>
          </div>
        </div>

        {/* Family Code Badge */}
        <div className="px-4 py-3 rounded-2xl bg-amber-50 border border-amber-200 text-center shrink-0">
          <span className="text-[11px] font-bold text-amber-800 uppercase block">
            Invite Code
          </span>
          <span className="text-lg font-mono font-black text-slate-900">
            {patient.inviteCode || 'NER-8K2Q'}
          </span>
        </div>
      </div>

      {/* Reassuring Plain Language Cognitive Status */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-200 shadow-xs flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-600/20">
          <Sparkles className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-base font-extrabold text-slate-900">
            Cognitive Wellbeing Summary
          </h3>
          <p className="text-sm font-semibold text-emerald-950 mt-1 leading-relaxed">
            {plainLanguageCognitiveStatus}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Care insight generated from daily memory matching sessions and response consistency.
          </p>
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('schedule')}
          className={`px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${
            activeTab === 'schedule'
              ? 'bg-ner-tea text-white shadow-sm'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Schedule & Alerts</span>
        </button>

        <button
          onClick={() => setActiveTab('photos')}
          className={`px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${
            activeTab === 'photos'
              ? 'bg-ner-tea text-white shadow-sm'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Image className="w-4 h-4" />
          <span>Family Photos ({photos.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('notes')}
          className={`px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${
            activeTab === 'notes'
              ? 'bg-ner-tea text-white shadow-sm'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Mic className="w-4 h-4" />
          <span>Patient Notes ({patientNotes.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('contacts')}
          className={`px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${
            activeTab === 'contacts'
              ? 'bg-ner-tea text-white shadow-sm'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Call Shortcuts ({contacts.length}/3)</span>
        </button>

        <button
          onClick={() => setActiveTab('messages')}
          className={`px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${
            activeTab === 'messages'
              ? 'bg-ner-tea text-white shadow-sm'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Send className="w-4 h-4" />
          <span>Send Message</span>
        </button>

        <button
          onClick={() => setActiveTab('safezone')}
          className={`px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${
            activeTab === 'safezone'
              ? 'bg-ner-tea text-white shadow-sm'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Navigation className="w-4 h-4" />
          <span>Safe Zone & Geofence</span>
        </button>
      </div>

      {/* TAB 1: SCHEDULE & ALERTS */}
      {activeTab === 'schedule' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-ner-tea" />
                  <span>Today's Schedule & Reminders</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Alarms appear directly on {patient.name.split(' ')[0]}'s simplified screen
                </p>
              </div>

              <button
                onClick={() => setShowAddReminderModal(true)}
                className="px-4 py-2 rounded-xl bg-ner-tea hover:bg-ner-forest text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Reminder</span>
              </button>
            </div>

            <div className="space-y-3">
              {reminders.length === 0 ? (
                <p className="text-sm text-slate-500 py-6 text-center">
                  No reminders scheduled for today.
                </p>
              ) : (
                reminders.map((r) => {
                  const isDone = r.status === 'done';
                  return (
                    <div
                      key={r.id}
                      className={`p-4 rounded-2xl border transition-colors flex items-center justify-between gap-4 ${
                        isDone
                          ? 'bg-slate-50 border-slate-200 text-slate-500'
                          : 'bg-white border-slate-200 hover:border-amber-300'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                            isDone ? 'bg-slate-200 text-slate-600' : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {r.type === 'medicine' ? (
                            <Pill className="w-5 h-5" />
                          ) : (
                            <Clock className="w-5 h-5" />
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-slate-900 text-sm">{r.title}</h4>
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                                isDone
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {isDone ? 'Done' : 'Pending'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 font-medium mt-0.5">
                            {r.timeDisplay} {r.description ? `• ${r.description}` : ''}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <span>Recent Alerts (Plain Language)</span>
            </h3>

            <div className="space-y-3">
              {alerts.length === 0 ? (
                <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>All routines calm and normal. Zero active alerts.</span>
                </div>
              ) : (
                alerts.map((alt) => (
                  <div
                    key={alt.id}
                    className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-amber-900 uppercase">
                        {alt.type.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {new Date(alt.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-800 leading-snug">
                      {alt.plainLanguageMessage}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: FAMILY PHOTOS & MEMORY ALBUM */}
      {activeTab === 'photos' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                <Image className="w-5 h-5 text-ner-tea" />
                <span>Family Photo Album</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Photos appear on {patient.name.split(' ')[0]}'s portal and speak aloud when tapped
              </p>
            </div>

            <button
              onClick={() => setShowAddPhotoModal(true)}
              className="px-4 py-2 rounded-xl bg-ner-tea hover:bg-ner-forest text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Memory Photo</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="rounded-3xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col bg-slate-50"
              >
                <div className="h-48 w-full bg-slate-200 relative overflow-hidden">
                  <img
                    src={photo.photoUrl}
                    alt={photo.personName}
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => handleDeletePhoto(photo.id)}
                    className="absolute top-2 right-2 p-2 rounded-xl bg-white/90 text-rose-600 hover:bg-rose-600 hover:text-white transition-colors shadow"
                    title="Delete photo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                  <div>
                    <h3 className="text-base font-black text-slate-900">
                      {photo.personName}
                    </h3>
                    <p className="text-xs font-bold text-ner-forest">
                      {photo.relationship}
                    </p>
                    {photo.caption && (
                      <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                        "{photo.caption}"
                      </p>
                    )}
                  </div>

                  {photo.dateOfMemory && (
                    <div className="text-[11px] font-bold text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded-md inline-block self-start">
                      Memory Date: {photo.dateOfMemory}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: PATIENT NOTES REVIEW */}
      {activeTab === 'notes' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <Mic className="w-5 h-5 text-ner-tea" />
              <span>Patient's Voice Notes-to-Self</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Listen to audio thoughts and memories recorded by {patient.name.split(' ')[0]}
            </p>
          </div>

          <div className="space-y-4">
            {patientNotes.length === 0 ? (
              <p className="text-sm text-slate-500 py-8 text-center">
                No voice notes recorded by patient yet.
              </p>
            ) : (
              patientNotes.map((note) => (
                <div
                  key={note.id}
                  className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => handlePlayNoteAudio(note)}
                      className="w-12 h-12 rounded-2xl bg-ner-tea hover:bg-ner-forest text-white flex items-center justify-center shrink-0 shadow transition-transform hover:scale-105"
                      title={playingNoteId === note.id ? 'Pause' : 'Play'}
                    >
                      <Play className="w-6 h-6" />
                    </button>

                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        {note.transcribedText || 'Patient Voice Note'}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Recorded on {new Date(note.createdAt).toLocaleString()} • Duration:{' '}
                        {note.durationSeconds || 6}s
                      </p>
                    </div>
                  </div>

                  {playingNoteId === note.id && (
                    <span className="text-xs font-black text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full animate-pulse self-start sm:self-auto">
                      Playing audio...
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 4: CALL SHORTCUTS (MAX 3 ENFORCED) */}
      {activeTab === 'contacts' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-ner-tea" />
                <span>One-Tap Call Shortcuts</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Up to 3 large circular contact tiles shown on {patient.name.split(' ')[0]}'s home screen
              </p>
            </div>

            {contacts.length < 3 && (
              <button
                onClick={() => setShowContactModal(true)}
                className="px-4 py-2 rounded-xl bg-ner-tea hover:bg-ner-forest text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Contact ({contacts.length}/3)</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {contacts.map((contact) => (
              <div
                key={contact.id}
                className="p-6 rounded-3xl border-2 border-slate-200 bg-slate-50 text-center space-y-4 relative"
              >
                <button
                  onClick={() => handleDeleteContact(contact.id)}
                  className="absolute top-3 right-3 p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  title="Remove shortcut"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <div className="w-20 h-20 rounded-full overflow-hidden mx-auto border-4 border-emerald-400 shadow-sm bg-slate-200 flex items-center justify-center">
                  {contact.photoUrl ? (
                    <img
                      src={contact.photoUrl}
                      alt={contact.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl font-black text-slate-700">
                      {contact.name[0]}
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    {contact.name}
                  </h3>
                  <p className="text-xs font-bold text-ner-forest">
                    {contact.relationship}
                  </p>
                  <p className="text-sm font-mono font-bold text-slate-700 mt-1">
                    {contact.phoneNumber}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: SEND CARETAKER MESSAGE */}
      {activeTab === 'messages' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Send Message Form */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-5">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                <Send className="w-5 h-5 text-ner-tea" />
                <span>Send Note or Photo to Patient</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Surfaces gently as a warm ambient card on the patient's home screen
              </p>
            </div>

            {msgSentSuccess && (
              <div className="p-4 rounded-2xl bg-emerald-100 text-emerald-800 text-sm font-bold flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Message delivered to {patient.name.split(' ')[0]}'s home screen!</span>
              </div>
            )}

            <form onSubmit={handleSendMessage} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Message Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setMsgType('photo')}
                    className={`py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border ${
                      msgType === 'photo'
                        ? 'bg-sky-100 text-sky-900 border-sky-400'
                        : 'bg-white text-slate-600 border-slate-200'
                    }`}
                  >
                    <Image className="w-4 h-4" />
                    <span>Photo Message</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMsgType('voice')}
                    className={`py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border ${
                      msgType === 'voice'
                        ? 'bg-sky-100 text-sky-900 border-sky-400'
                        : 'bg-white text-slate-600 border-slate-200'
                    }`}
                  >
                    <Mic className="w-4 h-4" />
                    <span>Voice Note</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  {msgType === 'photo' ? 'Photo URL *' : 'Audio URL *'}
                </label>
                <input
                  type="url"
                  required
                  placeholder={
                    msgType === 'photo'
                      ? 'https://images.unsplash.com/photo-...'
                      : 'https://actions.google.com/sounds/v1/water/gentle_stream.ogg'
                  }
                  value={msgContentUrl}
                  onChange={(e) => setMsgContentUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Gentle Caption / Note
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Good morning Baba! Thinking of you today."
                  value={msgCaption}
                  onChange={(e) => setMsgCaption(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={msgSending}
                className="w-full py-3.5 rounded-xl bg-ner-tea hover:bg-ner-forest text-white font-bold text-sm shadow-md flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>{msgSending ? 'Sending...' : 'Send to Patient'}</span>
              </button>
            </form>
          </div>

          {/* Sent Messages History with Seen Status */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-base font-extrabold text-slate-900">
              Message History & Seen Receipts
            </h3>

            <div className="space-y-3">
              {caretakerMessages.map((msg) => (
                <div
                  key={msg.id}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center shrink-0">
                      {msg.type === 'photo' ? <Image className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        {msg.caption || `${msg.type} message`}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        Sent on {new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  <div>
                    {msg.viewedAt ? (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        <span>Seen</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black">
                        Unread
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: SAFE ZONE GEOFENCE CONFIGURATION */}
      {activeTab === 'safezone' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6 max-w-2xl">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <Navigation className="w-5 h-5 text-ner-tea" />
              <span>Location-Aware Safe Zone Settings</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Configure perimeter distance and coordinates for home residence
            </p>
          </div>

          {safeZoneSaved && (
            <div className="p-4 rounded-2xl bg-emerald-100 text-emerald-800 text-sm font-bold flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>Safe zone boundaries updated successfully!</span>
            </div>
          )}

          <form onSubmit={handleSaveSafeZone} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Safe Zone Radius (Meters)
              </label>
              <input
                type="number"
                min="100"
                max="5000"
                step="50"
                value={safeZoneRadius}
                onChange={(e) => setSafeZoneRadius(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono font-bold"
              />
              <p className="text-xs text-slate-400 mt-1">
                Recommended: 300 - 500 meters for residential community walks.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Home Latitude
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={homeLat}
                  onChange={(e) => setHomeLat(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Home Longitude
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={homeLng}
                  onChange={(e) => setHomeLng(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono font-bold"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={safeZoneSaving}
              className="px-6 py-3 rounded-xl bg-ner-tea hover:bg-ner-forest text-white font-bold text-sm shadow-md flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>{safeZoneSaving ? 'Saving...' : 'Save Safe Zone Settings'}</span>
            </button>
          </form>
        </div>
      )}

      {/* ADD PHOTO MODAL */}
      {showAddPhotoModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900">
                Add Family Memory Photo
              </h3>
              <button
                onClick={() => setShowAddPhotoModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddPhoto} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Photo URL *
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://images.unsplash.com/photo-..."
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Person Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Baruah"
                  value={personName}
                  onChange={(e) => setPersonName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Relationship (spoken aloud) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Your son Ramesh"
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Caption / Memory Story
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Ramesh visiting home during the tea harvest festival"
                  value={photoCaption}
                  onChange={(e) => setPhotoCaption(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Date of Memory (Optional, for 'On this day')
                </label>
                <input
                  type="date"
                  value={dateOfMemory}
                  onChange={(e) => setDateOfMemory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddPhotoModal(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-600 font-bold text-sm hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={photoSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-ner-tea hover:bg-ner-forest text-white font-bold text-sm shadow-md"
                >
                  {photoSubmitting ? 'Uploading...' : 'Save Photo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD CONTACT MODAL */}
      {showContactModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900">
                Add Call Shortcut
              </h3>
              <button
                onClick={() => setShowContactModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveContact} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Contact Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Relationship
                </label>
                <input
                  type="text"
                  placeholder="e.g. Son"
                  value={contactRelation}
                  onChange={(e) => setContactRelation(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+91 98765 11223"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Photo URL (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={contactPhotoUrl}
                  onChange={(e) => setContactPhotoUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowContactModal(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-600 font-bold text-sm hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={contactSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-ner-tea hover:bg-ner-forest text-white font-bold text-sm shadow-md"
                >
                  {contactSubmitting ? 'Saving...' : 'Add Shortcut'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD REMINDER MODAL */}
      {showAddReminderModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900">
                Schedule New Reminder
              </h3>
              <button
                onClick={() => setShowAddReminderModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddReminder} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Type
                </label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as ReminderType)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium"
                >
                  <option value="medicine">Medicine</option>
                  <option value="game">Cognitive Game Session</option>
                  <option value="appointment">Appointment / Exercise</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Donepezil (5mg)"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Scheduled Time *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 08:30 AM"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Instructions / Description
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Take 1 tablet with warm water after breakfast"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddReminderModal(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-600 font-bold text-sm hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reminderSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-ner-tea hover:bg-ner-forest text-white font-bold text-sm shadow-md"
                >
                  Save Reminder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CaretakerPatientDetail;
