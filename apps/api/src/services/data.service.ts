import { prisma } from '../lib/prisma.js';
import {
  Role,
  DementiaStage,
  RegionalLanguage,
  ReminderType,
  ReminderStatus,
  AlertType,
  AlertSeverity,
  AlertStatus,
  PatientHomeData,
  PatientReminderItem,
  GameSessionSubmission,
  CaretakerPatientCard,
  CaretakerPatientDetailData,
  CaretakerMessageItem,
  DoctorDashboardData,
  DoctorPatientDetailData,
  DoctorAlertItem,
  DoctorPatientRow,
  ClinicalNoteItem,
  FamilyPhoto,
  PatientNote,
  PatientContact,
  CaretakerMessage,
  PatientWeatherInfo,
} from '@ner/types';
import { notifyCaretaker, notifyDoctor } from './notification.service.js';
import {
  globalAlerts,
  evaluatePatientAlerts,
  triggerImmediateSOS,
  getAlertsNeedingReview,
  reviewAlert,
  AlertRecord,
} from './alertEngine.js';
import {
  cognitiveScoringModel,
  adaptiveDifficultyEngine,
} from './aiModels.js';

// In-memory persistent state (mirrors schema for offline/dev resilience)
interface InMemUser {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  role: Role;
  preferredLanguage: RegionalLanguage;
}

interface InMemPatient {
  id: string;
  userId: string;
  name: string;
  phone: string;
  dateOfBirth: string;
  dementiaStage: DementiaStage;
  emergencyContact: string;
  inviteCode: string;
  preferredLanguage: RegionalLanguage;
  assignedDoctorId?: string;
  doctorName?: string;
  caretakerId: string;
  caretakerName: string;
  caretakerPhone: string;
  safeZoneRadiusMeters?: number;
  homeLatitude?: number;
  homeLongitude?: number;
}

interface InMemReminder {
  id: string;
  patientId: string;
  type: ReminderType;
  title: string;
  description?: string;
  timeDisplay: string;
  scheduledHour: number; // 24-hr
  scheduledMinute: number;
  status: ReminderStatus;
  createdAt: string;
}

interface InMemGameSession {
  id: string;
  patientId: string;
  gameType: string;
  score: number;
  difficultyLevel: number;
  durationSeconds: number;
  playedAt: string;
}

interface InMemMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: Role;
  receiverId: string;
  patientId: string;
  content: string;
  sentAt: string;
}

interface InMemCognitiveScore {
  id: string;
  patientId: string;
  date: string;
  score: number;
  assessmentType: string;
}

interface InMemClinicalNote {
  id: string;
  patientId: string;
  doctorId: string;
  doctorName: string;
  timestamp: string;
  note: string;
}

interface InMemFamilyPhoto {
  id: string;
  patientId: string;
  uploadedBy: string;
  photoUrl: string;
  personName: string;
  relationship: string;
  caption: string;
  dateOfMemory?: string;
  uploadedAt: string;
}

interface InMemPatientNote {
  id: string;
  patientId: string;
  audioUrl: string;
  transcribedText?: string;
  durationSeconds?: number;
  createdAt: string;
}

interface InMemPatientContact {
  id: string;
  patientId: string;
  name: string;
  relationship: string;
  phoneNumber: string;
  photoUrl?: string;
  displayOrder: number;
}

interface InMemCaretakerMessage {
  id: string;
  caretakerId: string;
  patientId: string;
  senderName: string;
  type: 'voice' | 'photo';
  contentUrl: string;
  caption?: string;
  sentAt: string;
  viewedAt?: string | null;
}

// Initial seed data
const store = {
  patients: [
    {
      id: 'pat-1',
      userId: 'user-pat-1',
      name: 'Biren Baruah',
      phone: '+91 98765 43210',
      dateOfBirth: '1952-04-15',
      dementiaStage: 'mild' as DementiaStage,
      emergencyContact: '+91 98765 11223',
      inviteCode: 'NER-8K2Q',
      preferredLanguage: 'as' as RegionalLanguage,
      assignedDoctorId: 'doc-1',
      doctorName: 'Dr. H. Baruah (Guwahati Neurological Inst.)',
      caretakerId: 'user-caretaker-1',
      caretakerName: 'Ananya Baruah',
      caretakerPhone: '+91 98765 11223',
      safeZoneRadiusMeters: 500,
      homeLatitude: 26.1445,
      homeLongitude: 91.7362,
    },
    {
      id: 'pat-2',
      userId: 'user-pat-2',
      name: 'Nirmala Devi',
      phone: '+91 94350 88990',
      dateOfBirth: '1946-08-22',
      dementiaStage: 'moderate' as DementiaStage,
      emergencyContact: '+91 98765 11223',
      inviteCode: 'NER-3P7M',
      preferredLanguage: 'hi' as RegionalLanguage,
      assignedDoctorId: 'doc-1',
      doctorName: 'Dr. H. Baruah (Guwahati Neurological Inst.)',
      caretakerId: 'user-caretaker-1',
      caretakerName: 'Ananya Baruah',
      caretakerPhone: '+91 98765 11223',
      safeZoneRadiusMeters: 400,
      homeLatitude: 26.1445,
      homeLongitude: 91.7362,
    },
  ] as InMemPatient[],

  reminders: [
    {
      id: 'rem-1',
      patientId: 'pat-1',
      type: 'medicine' as ReminderType,
      title: 'Donepezil (5mg)',
      description: 'Take 1 tablet with half a glass of warm water after breakfast',
      timeDisplay: '08:30 AM',
      scheduledHour: 8,
      scheduledMinute: 30,
      status: 'done' as ReminderStatus,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'rem-2',
      patientId: 'pat-1',
      type: 'game' as ReminderType,
      title: 'NER Tea Garden Memory Match',
      description: 'Morning cognitive exercise session to stimulate visual recall',
      timeDisplay: '11:00 AM',
      scheduledHour: 11,
      scheduledMinute: 0,
      status: 'pending' as ReminderStatus,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'rem-3',
      patientId: 'pat-1',
      type: 'medicine' as ReminderType,
      title: 'Memantine HCl (10mg)',
      description: 'Afternoon capsule with fruit or afternoon tea',
      timeDisplay: '02:30 PM',
      scheduledHour: 14,
      scheduledMinute: 30,
      status: 'pending' as ReminderStatus,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'rem-4',
      patientId: 'pat-1',
      type: 'appointment' as ReminderType,
      title: 'Evening Veranda Walk & Deep Breathing',
      description: '15 minutes gentle walking with family caretaker',
      timeDisplay: '05:30 PM',
      scheduledHour: 17,
      scheduledMinute: 30,
      status: 'pending' as ReminderStatus,
      createdAt: new Date().toISOString(),
    },
    // Reminders for Nirmala Devi
    {
      id: 'rem-5',
      patientId: 'pat-2',
      type: 'medicine' as ReminderType,
      title: 'Rivastigmine Patch Change',
      description: 'Apply new transdermal patch on upper arm',
      timeDisplay: '09:00 AM',
      scheduledHour: 9,
      scheduledMinute: 0,
      status: 'missed' as ReminderStatus,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'rem-6',
      patientId: 'pat-2',
      type: 'game' as ReminderType,
      title: 'Picture Naming: Household & Flowers',
      description: 'Identify common flowers and fruits in Hindi',
      timeDisplay: '03:00 PM',
      scheduledHour: 15,
      scheduledMinute: 0,
      status: 'pending' as ReminderStatus,
      createdAt: new Date().toISOString(),
    },
  ] as InMemReminder[],

  gameSessions: [
    {
      id: 'sess-1',
      patientId: 'pat-1',
      gameType: 'memory_match',
      score: 85,
      difficultyLevel: 1,
      durationSeconds: 145,
      playedAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: 'sess-2',
      patientId: 'pat-1',
      gameType: 'sequence_recall',
      score: 90,
      difficultyLevel: 1,
      durationSeconds: 110,
      playedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    },
    {
      id: 'sess-3',
      patientId: 'pat-2',
      gameType: 'memory_match',
      score: 45,
      difficultyLevel: 2,
      durationSeconds: 220,
      playedAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    },
  ] as InMemGameSession[],

  cognitiveScores: [
    // Biren Baruah (Mild dementia, steady retention curve)
    { id: 'cs-1', patientId: 'pat-1', date: '2026-09-02', score: 24.5, assessmentType: 'MMSE Equiv' },
    { id: 'cs-2', patientId: 'pat-1', date: '2026-09-04', score: 24.0, assessmentType: 'MMSE Equiv' },
    { id: 'cs-3', patientId: 'pat-1', date: '2026-09-05', score: 25.0, assessmentType: 'MMSE Equiv' },
    { id: 'cs-4', patientId: 'pat-1', date: '2026-09-07', score: 24.8, assessmentType: 'MMSE Equiv' },
    { id: 'cs-5', patientId: 'pat-1', date: '2026-09-08', score: 25.5, assessmentType: 'MMSE Equiv' },
    { id: 'cs-6', patientId: 'pat-1', date: '2026-09-09', score: 25.2, assessmentType: 'MMSE Equiv' },

    // Nirmala Devi (Moderate dementia, showing noticeable cognitive drop)
    { id: 'cs-7', patientId: 'pat-2', date: '2026-09-02', score: 21.0, assessmentType: 'MMSE Equiv' },
    { id: 'cs-8', patientId: 'pat-2', date: '2026-09-04', score: 20.5, assessmentType: 'MMSE Equiv' },
    { id: 'cs-9', patientId: 'pat-2', date: '2026-09-05', score: 19.8, assessmentType: 'MMSE Equiv' },
    { id: 'cs-10', patientId: 'pat-2', date: '2026-09-07', score: 18.2, assessmentType: 'MMSE Equiv' },
    { id: 'cs-11', patientId: 'pat-2', date: '2026-09-08', score: 17.5, assessmentType: 'MMSE Equiv' },
    { id: 'cs-12', patientId: 'pat-2', date: '2026-09-09', score: 17.0, assessmentType: 'MMSE Equiv' },
  ] as InMemCognitiveScore[],

  clinicalNotes: [
    {
      id: 'note-1',
      patientId: 'pat-1',
      doctorId: 'doc-1',
      doctorName: 'Dr. H. Baruah',
      timestamp: '2026-09-05T10:30:00.000Z',
      note: 'Patient presents with stable cognitive engagement. Donepezil 5mg tolerated well without gastrointestinal complaints. Caretaker daughter maintains excellent morning game adherence.',
    },
    {
      id: 'note-2',
      patientId: 'pat-2',
      doctorId: 'doc-1',
      doctorName: 'Dr. H. Baruah',
      timestamp: '2026-09-08T15:45:00.000Z',
      note: 'Cognitive score drop noted on rolling 7-day curve (down from 21.0 to 17.0). Caretaker reports intermittent sleep disturbance. Recommended checking for UTI or subclinical infection before altering pharmacotherapy.',
    },
  ] as InMemClinicalNote[],

  baselineDifficulty: {
    'pat-1': 1,
    'pat-2': 1,
  } as Record<string, number>,

  messages: [
    {
      id: 'msg-1',
      senderId: 'doc-1',
      senderName: 'Dr. H. Baruah',
      senderRole: 'doctor' as Role,
      receiverId: 'user-caretaker-1',
      patientId: 'pat-1',
      content: 'Hello Ananya. Biren is doing very well on the 5mg Donepezil dosage. Please continue with the morning memory matching games.',
      sentAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
      id: 'msg-2',
      senderId: 'user-caretaker-1',
      senderName: 'Ananya Baruah',
      senderRole: 'caretaker' as Role,
      receiverId: 'doc-1',
      patientId: 'pat-1',
      content: 'Thank you doctor! He enjoyed the Assam Tea Garden game yesterday and remembered all orchid pairs.',
      sentAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: 'msg-3',
      senderId: 'doc-1',
      senderName: 'Dr. H. Baruah',
      senderRole: 'doctor' as Role,
      receiverId: 'user-caretaker-1',
      patientId: 'pat-2',
      content: 'I noticed Nirmala had a small score drop on Wednesday. I have scheduled a tele-consultation check for next Tuesday.',
      sentAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    },
  ] as InMemMessage[],

  invites: [
    {
      code: 'NER-8K2Q',
      patientId: 'pat-1',
      patientName: 'Biren Baruah',
      status: 'ACCEPTED',
      createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    },
    {
      code: 'NER-3P7M',
      patientId: 'pat-2',
      patientName: 'Nirmala Devi',
      status: 'ACCEPTED',
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    },
    {
      code: 'NER-5X9T',
      patientId: null,
      patientName: 'Pending Registration',
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    },
  ],

  familyPhotos: [
    {
      id: 'photo-1',
      patientId: 'pat-1',
      uploadedBy: 'user-caretaker-1',
      photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop&q=80',
      personName: 'Ramesh Baruah',
      relationship: 'Your son Ramesh',
      caption: 'Ramesh visiting home during the Bihu celebration in Jorhat tea estate.',
      dateOfMemory: `2023-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`,
      uploadedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    },
    {
      id: 'photo-2',
      patientId: 'pat-1',
      uploadedBy: 'user-caretaker-1',
      photoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800&auto=format&fit=crop&q=80',
      personName: 'Meera Baruah',
      relationship: 'Your daughter Meera',
      caption: 'Meera smiling warmly on her graduation ceremony day in Guwahati.',
      dateOfMemory: '2021-05-18',
      uploadedAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    },
    {
      id: 'photo-3',
      patientId: 'pat-1',
      uploadedBy: 'user-caretaker-1',
      photoUrl: 'https://images.unsplash.com/photo-1548142813-c348350df52b?w=800&auto=format&fit=crop&q=80',
      personName: 'Sunita Baruah',
      relationship: 'Your beloved wife Sunita',
      caption: 'Sunita in the peaceful tea garden veranda enjoying warm morning chai.',
      dateOfMemory: '2019-11-20',
      uploadedAt: new Date(Date.now() - 86400000 * 14).toISOString(),
    },
    {
      id: 'photo-4',
      patientId: 'pat-1',
      uploadedBy: 'user-caretaker-1',
      photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80',
      personName: 'Ananya Baruah',
      relationship: 'Your caretaker Ananya',
      caption: 'Ananya holding fresh orchids from the garden to brighten the living room.',
      dateOfMemory: '2024-02-10',
      uploadedAt: new Date(Date.now() - 86400000 * 20).toISOString(),
    },
  ] as InMemFamilyPhoto[],

  patientNotes: [
    {
      id: 'pnote-1',
      patientId: 'pat-1',
      audioUrl: 'https://actions.google.com/sounds/v1/water/gentle_stream.ogg',
      transcribedText: 'Remembered to water the tulsi plant on the front veranda this morning.',
      durationSeconds: 8,
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
  ] as InMemPatientNote[],

  patientContacts: [
    {
      id: 'pcont-1',
      patientId: 'pat-1',
      name: 'Ramesh',
      relationship: 'Son',
      phoneNumber: '+91 98765 11223',
      photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
      displayOrder: 1,
    },
    {
      id: 'pcont-2',
      patientId: 'pat-1',
      name: 'Meera',
      relationship: 'Daughter',
      phoneNumber: '+91 98765 44332',
      photoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80',
      displayOrder: 2,
    },
    {
      id: 'pcont-3',
      patientId: 'pat-1',
      name: 'Ananya',
      relationship: 'Caretaker',
      phoneNumber: '+91 98765 11223',
      photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
      displayOrder: 3,
    },
  ] as InMemPatientContact[],

  caretakerMessages: [
    {
      id: 'cmsg-1',
      caretakerId: 'user-caretaker-1',
      patientId: 'pat-1',
      senderName: 'Ananya',
      type: 'photo',
      contentUrl: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=600&auto=format&fit=crop&q=80',
      caption: 'Good morning Baba! The garden flowers bloomed beautifully today.',
      sentAt: new Date(Date.now() - 3600000).toISOString(),
      viewedAt: null,
    },
  ] as InMemCaretakerMessage[],

  adaptiveDifficulty: {
    'pat-1:memory_match': { currentLevel: 1, streakCorrect: 2, streakWrong: 0 },
    'pat-1:sequence_recall': { currentLevel: 1, streakCorrect: 1, streakWrong: 0 },
    'pat-1:word_association': { currentLevel: 1, streakCorrect: 0, streakWrong: 0 },
    'pat-1:picture_naming': { currentLevel: 1, streakCorrect: 0, streakWrong: 0 },

    'pat-2:memory_match': { currentLevel: 1, streakCorrect: 0, streakWrong: 2 },
    'pat-2:sequence_recall': { currentLevel: 1, streakCorrect: 0, streakWrong: 1 },
  } as Record<string, { currentLevel: number; streakCorrect: number; streakWrong: number }>,
};

function isOverdue(hour: number, minute: number, status: ReminderStatus): boolean {
  if (status === 'done') return false;
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const targetMinutes = hour * 60 + minute;
  return currentMinutes > targetMinutes;
}

// ----------------------------------------------------
// PATIENT PORTAL DATA ACCESS METHODS
// ----------------------------------------------------

export async function getPatientHome(patientId?: string): Promise<PatientHomeData> {
  const patient = store.patients.find((p) => p.id === patientId) || store.patients[0];
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  };
  const formattedDate = now.toLocaleDateString('en-US', options);

  const pendingCount = store.reminders.filter(
    (r) => r.patientId === patient.id && r.status === 'pending'
  ).length;

  const gamesToday = store.gameSessions.filter(
    (g) => g.patientId === patient.id
  ).length;

  const activeSos = globalAlerts.some(
    (a) => a.patientId === patient.id && a.type === 'sos' && a.status === 'open'
  );

  const contacts = await getPatientContacts(patient.id);
  const unviewedMessage = await getUnviewedCaretakerMessage(patient.id);
  const onThisDayPhoto = await getOnThisDayPhoto(patient.id);
  const weather = getPatientWeather(patient.id);

  return {
    patientId: patient.id,
    name: patient.name,
    greeting: `Good Day, ${patient.name.split(' ')[0]}`,
    formattedDate,
    caretakerName: patient.caretakerName,
    caretakerPhone: patient.caretakerPhone,
    pendingRemindersCount: pendingCount,
    gamesPlayedToday: gamesToday,
    activeSos,
    safeZoneRadiusMeters: patient.safeZoneRadiusMeters ?? 500,
    homeLatitude: patient.homeLatitude ?? 26.1445,
    homeLongitude: patient.homeLongitude ?? 91.7362,
    contacts,
    unviewedMessage,
    onThisDayPhoto,
    weather,
  };
}

export async function getPatientReminders(patientId?: string): Promise<PatientReminderItem[]> {
  const targetId = patientId || store.patients[0].id;
  return store.reminders
    .filter((r) => r.patientId === targetId)
    .map((r) => ({
      id: r.id,
      title: r.title,
      type: r.type,
      scheduledTime: r.timeDisplay,
      timeDisplay: r.timeDisplay,
      status: r.status,
      isOverdue: isOverdue(r.scheduledHour, r.scheduledMinute, r.status),
      description: r.description,
    }));
}

export async function markPatientReminderDone(reminderId: string): Promise<PatientReminderItem | null> {
  const reminder = store.reminders.find((r) => r.id === reminderId);
  if (!reminder) return null;

  reminder.status = 'done';

  return {
    id: reminder.id,
    title: reminder.title,
    type: reminder.type,
    scheduledTime: reminder.timeDisplay,
    timeDisplay: reminder.timeDisplay,
    status: 'done',
    isOverdue: false,
    description: reminder.description,
  };
}

export async function submitGameSession(
  patientId: string,
  submission: GameSessionSubmission
): Promise<{
  session: InMemGameSession;
  nextDifficulty: number;
  message: string;
  normalizedScore: number;
  mmseEquivalent: number;
}> {
  const patient = store.patients.find((p) => p.id === patientId) || store.patients[0];

  const newSession: InMemGameSession = {
    id: `sess-${Date.now()}`,
    patientId: patient.id,
    gameType: submission.gameType,
    score: submission.score,
    difficultyLevel: submission.difficultyLevel,
    durationSeconds: submission.durationSeconds,
    playedAt: new Date().toISOString(),
  };

  store.gameSessions.unshift(newSession);

  // 1. AI Cognitive Scoring Model calculation
  const norm = await cognitiveScoringModel({
    gameType: submission.gameType,
    score: submission.score,
    durationSeconds: submission.durationSeconds,
    difficultyLevel: submission.difficultyLevel,
  });

  // Record normalized score entry for trend analytics
  const todayStr = new Date().toISOString().split('T')[0];
  store.cognitiveScores.push({
    id: `cs-${Date.now()}`,
    patientId: patient.id,
    date: todayStr,
    score: norm.mmseEquivalent,
    assessmentType: 'MMSE Equiv',
  });

  // 2. AI Adaptive Difficulty Engine calculation
  const recentSessions = store.gameSessions
    .filter((s) => s.patientId === patient.id)
    .slice(0, 5)
    .map((s) => ({
      gameType: s.gameType,
      score: s.score,
      durationSeconds: s.durationSeconds,
      difficultyLevel: s.difficultyLevel,
    }));

  const adaptiveResult = await adaptiveDifficultyEngine(patient.id, recentSessions);

  // Update in-memory tracker
  const key = `${patient.id}:${submission.gameType}`;
  if (!store.adaptiveDifficulty[key]) {
    store.adaptiveDifficulty[key] = { currentLevel: 1, streakCorrect: 0, streakWrong: 0 };
  }
  store.adaptiveDifficulty[key].currentLevel = adaptiveResult.nextDifficulty;

  // 3. Run Alert Engine evaluation to check if this session triggered an alert
  const patientScores = store.cognitiveScores
    .filter((cs) => cs.patientId === patient.id)
    .map((cs) => ({ date: cs.date, score: cs.score }));

  const patientRems = store.reminders
    .filter((r) => r.patientId === patient.id)
    .map((r) => ({ type: r.type, status: r.status, scheduledTime: r.timeDisplay, title: r.title }));

  await evaluatePatientAlerts(patient.id, patient.name, {
    doctorId: patient.assignedDoctorId,
    recentScores: patientScores,
    recentReminders: patientRems,
    lastGameSessionDate: newSession.playedAt,
  });

  return {
    session: newSession,
    nextDifficulty: adaptiveResult.nextDifficulty,
    message: adaptiveResult.reasoning,
    normalizedScore: norm.normalizedScore,
    mmseEquivalent: norm.mmseEquivalent,
  };
}

export async function triggerPatientSOS(
  patientId: string,
  location?: { latitude?: number; longitude?: number; address?: string }
): Promise<{ alertId: string; message: string }> {
  const patient = store.patients.find((p) => p.id === patientId) || store.patients[0];
  const alert = await triggerImmediateSOS(patient.id, patient.name, patient.assignedDoctorId, location);

  return {
    alertId: alert.id,
    message: 'Emergency SOS dispatched to your caretaker and family doctor.',
  };
}

// ----------------------------------------------------
// CARETAKER PORTAL DATA ACCESS METHODS
// ----------------------------------------------------

export async function getCaretakerPatients(): Promise<CaretakerPatientCard[]> {
  return store.patients.map((p) => {
    const alerts = globalAlerts.filter((a) => a.patientId === p.id && a.status === 'open');
    const openAlertCount = alerts.length;

    const patientReminders = store.reminders.filter((r) => r.patientId === p.id && r.type === 'medicine');
    const takenCount = patientReminders.filter((r) => r.status === 'done').length;
    const medSummary = patientReminders.length > 0 ? `${takenCount} of ${patientReminders.length} taken` : 'No medicines today';

    const recentGame = store.gameSessions.find((g) => g.patientId === p.id);
    const recentActivity = recentGame ? `Played memory game (${recentGame.score}% recall)` : 'No games played today';

    let status: 'on_track' | 'needs_attention' | 'alert_open' = 'on_track';
    let statusText = 'On track';

    if (openAlertCount > 0) {
      status = 'alert_open';
      statusText = `${openAlertCount} alert${openAlertCount > 1 ? 's' : ''} open`;
    } else if (patientReminders.some((r) => isOverdue(r.scheduledHour, r.scheduledMinute, r.status))) {
      status = 'needs_attention';
      statusText = 'Needs attention';
    }

    const initials = p.name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);

    return {
      id: p.id,
      patientProfileId: p.id,
      name: p.name,
      initials,
      dementiaStage: p.dementiaStage,
      preferredLanguage: p.preferredLanguage,
      status,
      statusText,
      openAlertCount,
      todayMedicationSummary: medSummary,
      recentActivity,
      inviteCode: p.inviteCode,
    };
  });
}

export async function getCaretakerPatientDetail(patientId: string): Promise<CaretakerPatientDetailData | null> {
  const patient = store.patients.find((p) => p.id === patientId);
  if (!patient) return null;

  const reminders = await getPatientReminders(patient.id);
  const alerts = globalAlerts
    .filter((a) => a.patientId === patient.id)
    .map((a) => ({
      id: a.id,
      type: a.type,
      severity: a.severity,
      plainLanguageMessage: a.plainMessage,
      createdAt: a.createdAt,
      status: a.status,
    }));

  const openAlertCount = alerts.filter((a) => a.status === 'open').length;
  let status: 'on_track' | 'needs_attention' | 'alert_open' = 'on_track';
  let statusText = 'On track';

  if (openAlertCount > 0) {
    status = 'alert_open';
    statusText = `${openAlertCount} open alert`;
  } else if (reminders.some((r) => r.isOverdue)) {
    status = 'needs_attention';
    statusText = 'Needs attention';
  }

  // Plain language cognitive assessment summary without bare raw numbers
  const recentScores = store.cognitiveScores.filter((s) => s.patientId === patient.id);
  let plainLanguageCognitiveStatus = 'Consistent cognitive engagement this week. Memory response speed is steady.';
  if (recentScores.length >= 2) {
    const oldest = recentScores[0].score;
    const newest = recentScores[recentScores.length - 1].score;
    if (oldest - newest > 2) {
      plainLanguageCognitiveStatus = `${patient.name.split(' ')[0]}'s memory recall took longer than usual this week. Her doctor has been updated.`;
    }
  }

  return {
    patient: {
      id: patient.id,
      patientProfileId: patient.id,
      name: patient.name,
      phone: patient.phone,
      dateOfBirth: patient.dateOfBirth,
      dementiaStage: patient.dementiaStage,
      preferredLanguage: patient.preferredLanguage,
      emergencyContact: patient.emergencyContact,
      inviteCode: patient.inviteCode,
      assignedDoctor: patient.doctorName
        ? {
            id: patient.assignedDoctorId || 'doc-1',
            name: patient.doctorName,
            hospital: 'Guwahati Neurological Institute',
            specialization: 'Neurologist / Geriatrician',
          }
        : undefined,
    },
    status,
    statusText,
    plainLanguageCognitiveStatus,
    reminders,
    alerts,
  };
}

export async function addPatientReminder(
  patientId: string,
  payload: {
    type: ReminderType;
    title: string;
    timeDisplay: string;
    description?: string;
  }
): Promise<PatientReminderItem> {
  const [timeStr, ampm] = payload.timeDisplay.split(' ');
  const [hourStr, minStr] = timeStr.split(':');
  let hour = parseInt(hourStr, 10);
  const min = parseInt(minStr || '0', 10);
  if (ampm && ampm.toUpperCase() === 'PM' && hour < 12) hour += 12;
  if (ampm && ampm.toUpperCase() === 'AM' && hour === 12) hour = 0;

  const newRem: InMemReminder = {
    id: `rem-${Date.now()}`,
    patientId,
    type: payload.type,
    title: payload.title,
    description: payload.description,
    timeDisplay: payload.timeDisplay,
    scheduledHour: hour,
    scheduledMinute: min,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  store.reminders.push(newRem);

  return {
    id: newRem.id,
    title: newRem.title,
    type: newRem.type,
    scheduledTime: newRem.timeDisplay,
    timeDisplay: newRem.timeDisplay,
    status: newRem.status,
    isOverdue: false,
    description: newRem.description,
  };
}

export async function deletePatientReminder(reminderId: string): Promise<boolean> {
  const idx = store.reminders.findIndex((r) => r.id === reminderId);
  if (idx >= 0) {
    store.reminders.splice(idx, 1);
    return true;
  }
  return false;
}

export async function getPatientMessages(patientId: string): Promise<CaretakerMessageItem[]> {
  return store.messages.filter((m) => m.patientId === patientId);
}

export async function postPatientMessage(
  senderId: string,
  senderName: string,
  senderRole: Role,
  patientId: string,
  content: string
): Promise<CaretakerMessageItem> {
  const patient = store.patients.find((p) => p.id === patientId);

  const newMsg: InMemMessage = {
    id: `msg-${Date.now()}`,
    senderId,
    senderName,
    senderRole,
    receiverId: patient?.assignedDoctorId || 'doc-1',
    patientId,
    content,
    sentAt: new Date().toISOString(),
  };

  store.messages.push(newMsg);

  if (patient?.assignedDoctorId) {
    await notifyDoctor(
      patient.assignedDoctorId,
      patient.id,
      patient.name,
      `New message from Caretaker ${senderName}: "${content.substring(0, 50)}..."`
    );
  }

  return newMsg;
}

export async function getInvites() {
  return store.invites;
}

export async function generateNewInvite(patientName?: string) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'NER-';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  const newInvite = {
    code,
    patientId: null,
    patientName: patientName || 'Pending Registration',
    status: 'PENDING',
    createdAt: new Date().toISOString(),
  };

  store.invites.unshift(newInvite);
  return newInvite;
}

// ----------------------------------------------------
// DOCTOR PORTAL DATA ACCESS METHODS
// ----------------------------------------------------

export async function getDoctorDashboardData(doctorId?: string): Promise<DoctorDashboardData> {
  const activeAlerts = globalAlerts.filter((a) => a.status === 'open');

  const alertsNeedingReview: DoctorAlertItem[] = activeAlerts.map((a) => ({
    id: a.id,
    patientId: a.patientId,
    patientName: a.patientName,
    type: a.type,
    severity: a.severity,
    description: a.plainMessage,
    createdAt: a.createdAt,
    status: a.status,
    suggestedAction: a.suggestedAction,
  }));

  const patientsRows: DoctorPatientRow[] = store.patients.map((p) => {
    const scores = store.cognitiveScores.filter((cs) => cs.patientId === p.id);
    const latestScore = scores.length > 0 ? scores[scores.length - 1].score : 20;

    let scoreTrend: 'up' | 'down' | 'stable' = 'stable';
    if (scores.length >= 2) {
      const prev = scores[scores.length - 2].score;
      if (latestScore > prev) scoreTrend = 'up';
      else if (latestScore < prev) scoreTrend = 'down';
    }

    const openAlerts = activeAlerts.filter((a) => a.patientId === p.id);
    let statusBadge: 'stable' | 'attention_needed' | 'critical' = 'stable';
    if (openAlerts.some((a) => a.severity === 'critical')) {
      statusBadge = 'critical';
    } else if (openAlerts.length > 0) {
      statusBadge = 'attention_needed';
    }

    const age = new Date().getFullYear() - new Date(p.dateOfBirth).getFullYear();
    const lastSession = store.gameSessions.find((s) => s.patientId === p.id);
    const lastActiveDate = lastSession
      ? new Date(lastSession.playedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })
      : '3 days ago';

    return {
      id: p.id,
      name: p.name,
      age,
      dementiaStage: p.dementiaStage,
      lastActiveDate,
      scoreTrend,
      currentScore: latestScore,
      statusBadge,
      caretakerName: p.caretakerName,
    };
  });

  const sessionsToday = store.gameSessions.filter((s) => {
    const today = new Date().toISOString().split('T')[0];
    return s.playedAt.startsWith(today);
  }).length;

  return {
    metrics: {
      totalPatients: store.patients.length,
      activeAlertsCount: activeAlerts.length,
      averageScoreTrendPercent: -1.8,
      sessionsCompletedToday: sessionsToday || 2,
    },
    alertsNeedingReview,
    patients: patientsRows,
  };
}

export async function getDoctorPatientDetail(patientId: string): Promise<DoctorPatientDetailData | null> {
  const patient = store.patients.find((p) => p.id === patientId);
  if (!patient) return null;

  const age = new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear();

  const cognitiveHistory = store.cognitiveScores
    .filter((cs) => cs.patientId === patient.id)
    .map((cs) => ({
      date: cs.date,
      score: cs.score,
      assessmentType: cs.assessmentType,
    }));

  const gameSessions = store.gameSessions
    .filter((gs) => gs.patientId === patient.id)
    .map((gs) => ({
      id: gs.id,
      date: new Date(gs.playedAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      gameType: gs.gameType,
      score: gs.score,
      difficultyLevel: gs.difficultyLevel,
      durationSeconds: gs.durationSeconds,
    }));

  const patientReminders = store.reminders.filter((r) => r.patientId === patient.id);
  const doneCount = patientReminders.filter((r) => r.status === 'done').length;
  const medPercent = patientReminders.length > 0 ? Math.round((doneCount / patientReminders.length) * 100) : 85;

  const notes = store.clinicalNotes
    .filter((n) => n.patientId === patient.id)
    .map((n) => ({
      id: n.id,
      doctorId: n.doctorId,
      doctorName: n.doctorName,
      timestamp: n.timestamp,
      note: n.note,
    }));

  return {
    patient: {
      id: patient.id,
      patientProfileId: patient.id,
      name: patient.name,
      phone: patient.phone,
      dateOfBirth: patient.dateOfBirth,
      age,
      dementiaStage: patient.dementiaStage,
      preferredLanguage: patient.preferredLanguage,
      emergencyContact: patient.emergencyContact,
      inviteCode: patient.inviteCode,
      caretaker: {
        name: patient.caretakerName,
        phone: patient.caretakerPhone,
        relationship: 'Primary Family Caretaker',
      },
    },
    cognitiveHistory,
    gameSessions,
    adherence: {
      medicineAdherencePercent: medPercent,
      sessionAdherencePercent: 88,
      totalCompleted: doneCount,
      totalScheduled: patientReminders.length,
    },
    clinicalNotes: notes,
    currentBaselineDifficulty: store.baselineDifficulty[patient.id] || 1,
  };
}

export async function addClinicalNote(
  patientId: string,
  doctorId: string,
  doctorName: string,
  note: string
): Promise<ClinicalNoteItem> {
  const newNote: InMemClinicalNote = {
    id: `note-${Date.now()}`,
    patientId,
    doctorId,
    doctorName,
    timestamp: new Date().toISOString(),
    note,
  };

  store.clinicalNotes.unshift(newNote);
  return newNote;
}

export async function updatePatientBaselineDifficulty(
  patientId: string,
  difficulty: number
): Promise<{ difficulty: number; message: string }> {
  store.baselineDifficulty[patientId] = difficulty;

  // Also reset game adaptive tracker to baseline
  Object.keys(store.adaptiveDifficulty).forEach((key) => {
    if (key.startsWith(patientId)) {
      store.adaptiveDifficulty[key].currentLevel = difficulty;
    }
  });

  return {
    difficulty,
    message: `Baseline difficulty set to Level ${difficulty}.`,
  };
}

export async function resolveDoctorAlert(alertId: string): Promise<boolean> {
  return reviewAlert(alertId);
}

// ----------------------------------------------------
// PART 3: MEMORY, SAFETY & FAMILY CONNECTION SERVICES
// ----------------------------------------------------

export function getPatientWeather(_patientId?: string): PatientWeatherInfo {
  return {
    temperatureC: 27,
    condition: 'Pleasant & Mild',
    icon: 'cloud-sun',
    locationName: 'Guwahati, Assam',
  };
}

export async function getFamilyPhotos(patientId?: string): Promise<FamilyPhoto[]> {
  const targetId = patientId || store.patients[0].id;
  return store.familyPhotos.filter((p) => p.patientId === targetId);
}

export async function getOnThisDayPhoto(patientId?: string): Promise<FamilyPhoto | null> {
  const targetId = patientId || store.patients[0].id;
  const now = new Date();
  const currentMonthDay = `${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const photos = store.familyPhotos.filter((p) => p.patientId === targetId && p.dateOfMemory);
  const match = photos.find((p) => {
    if (!p.dateOfMemory) return false;
    // dateOfMemory can be YYYY-MM-DD or MM-DD
    return p.dateOfMemory.endsWith(currentMonthDay);
  });

  return match || null;
}

export async function addFamilyPhoto(
  patientId: string,
  data: {
    photoUrl: string;
    personName: string;
    relationship: string;
    caption: string;
    dateOfMemory?: string;
    uploadedBy?: string;
  }
): Promise<FamilyPhoto> {
  const patient = store.patients.find((p) => p.id === patientId) || store.patients[0];
  const newPhoto: InMemFamilyPhoto = {
    id: `photo-${Date.now()}`,
    patientId: patient.id,
    uploadedBy: data.uploadedBy || patient.caretakerId,
    photoUrl: data.photoUrl,
    personName: data.personName,
    relationship: data.relationship,
    caption: data.caption,
    dateOfMemory: data.dateOfMemory,
    uploadedAt: new Date().toISOString(),
  };

  store.familyPhotos.unshift(newPhoto);
  return newPhoto;
}

export async function deleteFamilyPhoto(photoId: string): Promise<boolean> {
  const idx = store.familyPhotos.findIndex((p) => p.id === photoId);
  if (idx === -1) return false;
  store.familyPhotos.splice(idx, 1);
  return true;
}

export async function getPatientNotes(patientId?: string): Promise<PatientNote[]> {
  const targetId = patientId || store.patients[0].id;
  return store.patientNotes.filter((n) => n.patientId === targetId);
}

export async function savePatientNote(
  patientId: string,
  data: { audioUrl: string; transcribedText?: string; durationSeconds?: number }
): Promise<PatientNote> {
  const patient = store.patients.find((p) => p.id === patientId) || store.patients[0];
  const newNote: InMemPatientNote = {
    id: `pnote-${Date.now()}`,
    patientId: patient.id,
    audioUrl: data.audioUrl,
    transcribedText: data.transcribedText || 'Voice note from patient',
    durationSeconds: data.durationSeconds || 5,
    createdAt: new Date().toISOString(),
  };

  store.patientNotes.unshift(newNote);
  return newNote;
}

export async function getPatientContacts(patientId?: string): Promise<PatientContact[]> {
  const targetId = patientId || store.patients[0].id;
  const contacts = store.patientContacts.filter((c) => c.patientId === targetId);
  return contacts.sort((a, b) => a.displayOrder - b.displayOrder).slice(0, 3);
}

export async function savePatientContacts(
  patientId: string,
  contacts: Array<{ name: string; relationship: string; phoneNumber: string; photoUrl?: string }>
): Promise<PatientContact[]> {
  const targetId = patientId || store.patients[0].id;
  // Enforce maximum 3 at API level
  const limited = contacts.slice(0, 3);

  // Remove existing
  store.patientContacts = store.patientContacts.filter((c) => c.patientId !== targetId);

  // Add new
  const saved: InMemPatientContact[] = limited.map((c, i) => ({
    id: `pcont-${Date.now()}-${i}`,
    patientId: targetId,
    name: c.name,
    relationship: c.relationship,
    phoneNumber: c.phoneNumber,
    photoUrl: c.photoUrl,
    displayOrder: i + 1,
  }));

  store.patientContacts.push(...saved);
  return saved;
}

export async function addOrUpdatePatientContact(
  patientId: string,
  contact: { id?: string; name: string; relationship: string; phoneNumber: string; photoUrl?: string }
): Promise<PatientContact> {
  const targetId = patientId || store.patients[0].id;
  const existing = store.patientContacts.filter((c) => c.patientId === targetId);

  if (contact.id) {
    const target = existing.find((c) => c.id === contact.id);
    if (target) {
      target.name = contact.name;
      target.relationship = contact.relationship;
      target.phoneNumber = contact.phoneNumber;
      if (contact.photoUrl !== undefined) target.photoUrl = contact.photoUrl;
      return target;
    }
  }

  if (existing.length >= 3) {
    throw new Error('Maximum of 3 patient contacts allowed.');
  }

  const created: InMemPatientContact = {
    id: `pcont-${Date.now()}`,
    patientId: targetId,
    name: contact.name,
    relationship: contact.relationship,
    phoneNumber: contact.phoneNumber,
    photoUrl: contact.photoUrl,
    displayOrder: existing.length + 1,
  };

  store.patientContacts.push(created);
  return created;
}

export async function deletePatientContact(contactId: string): Promise<boolean> {
  const idx = store.patientContacts.findIndex((c) => c.id === contactId);
  if (idx === -1) return false;
  store.patientContacts.splice(idx, 1);
  return true;
}

export async function getCaretakerMessages(patientId?: string): Promise<CaretakerMessage[]> {
  const targetId = patientId || store.patients[0].id;
  return store.caretakerMessages.filter((m) => m.patientId === targetId);
}

export async function getUnviewedCaretakerMessage(patientId?: string): Promise<CaretakerMessage | null> {
  const targetId = patientId || store.patients[0].id;
  const unviewed = store.caretakerMessages
    .filter((m) => m.patientId === targetId && !m.viewedAt)
    .sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());

  return unviewed[0] || null;
}

export async function sendCaretakerMessage(
  caretakerId: string,
  patientId: string,
  data: { type: 'voice' | 'photo'; contentUrl: string; caption?: string }
): Promise<CaretakerMessage> {
  const patient = store.patients.find((p) => p.id === patientId) || store.patients[0];
  const senderName = patient.caretakerName ? patient.caretakerName.split(' ')[0] : 'Caretaker';

  const newMsg: InMemCaretakerMessage = {
    id: `cmsg-${Date.now()}`,
    caretakerId,
    patientId: patient.id,
    senderName,
    type: data.type,
    contentUrl: data.contentUrl,
    caption: data.caption,
    sentAt: new Date().toISOString(),
    viewedAt: null,
  };

  store.caretakerMessages.unshift(newMsg);
  return newMsg;
}

export async function markCaretakerMessageViewed(messageId: string): Promise<boolean> {
  const msg = store.caretakerMessages.find((m) => m.id === messageId);
  if (!msg) return false;
  msg.viewedAt = new Date().toISOString();
  return true;
}

export async function updatePatientSafeZone(
  patientId: string,
  safeZone: { radiusMeters?: number; latitude?: number; longitude?: number }
): Promise<{ safeZoneRadiusMeters: number; homeLatitude: number; homeLongitude: number }> {
  const patient = store.patients.find((p) => p.id === patientId) || store.patients[0];

  if (safeZone.radiusMeters !== undefined) patient.safeZoneRadiusMeters = safeZone.radiusMeters;
  if (safeZone.latitude !== undefined) patient.homeLatitude = safeZone.latitude;
  if (safeZone.longitude !== undefined) patient.homeLongitude = safeZone.longitude;

  return {
    safeZoneRadiusMeters: patient.safeZoneRadiusMeters || 500,
    homeLatitude: patient.homeLatitude || 26.1445,
    homeLongitude: patient.homeLongitude || 91.7362,
  };
}

export async function logSafeZoneBreach(
  patientId: string,
  latitude?: number,
  longitude?: number
): Promise<{ alertId: string; message: string }> {
  const patient = store.patients.find((p) => p.id === patientId) || store.patients[0];

  const alertId = `alt-safe-${Date.now()}`;
  const now = new Date().toISOString();

  // Silently add a 'left_safe_zone' warning alert
  const alertObj: AlertRecord = {
    id: alertId,
    patientId: patient.id,
    patientName: patient.name,
    type: 'left_safe_zone',
    severity: 'warning',
    status: 'open',
    plainMessage: `${patient.name} wandered outside the designated home safe zone perimeter (${patient.safeZoneRadiusMeters || 500}m).`,
    clinicalRationale: `Geofence coordinates (${latitude ?? '26.1445'}, ${longitude ?? '91.7362'}) detected outside registered residence safe zone. Potential wandering behavior risk.`,
    createdAt: now,
    suggestedAction: 'Contact patient directly or dispatch family caretaker to check status.',
  };

  globalAlerts.unshift(alertObj);

  // Notify caretaker and doctor silently
  await notifyCaretaker(
    patient.id,
    patient.name,
    'sos_trigger',
    'Safe Zone Notice',
    `${patient.name} is currently outside the registered safe zone perimeter.`,
    ['push']
  );

  return {
    alertId,
    message: 'Safe zone alert recorded and sent to designated caretaker.',
  };
}

