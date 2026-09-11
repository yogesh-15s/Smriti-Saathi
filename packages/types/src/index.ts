/**
 * Shared Type Definitions for
 * AI-Based Cognitive Gaming and Memory Assistance Platform
 * for Elderly Dementia Patients in North Eastern Region (NER)
 */

// User Roles
export type Role = 'patient' | 'doctor' | 'caretaker';

// Dementia Stage
export type DementiaStage = 'early' | 'mild' | 'moderate' | 'severe' | 'unspecified';

// North Eastern Regional Languages & national languages
export type RegionalLanguage =
  | 'en'   // English (default)
  | 'as'   // Assamese
  | 'brx'  // Bodo
  | 'kha'  // Khasi
  | 'lus'  // Mizo
  | 'nag'  // Nagamese
  | 'hi';  // Hindi

export interface RegionalLanguageOption {
  code: RegionalLanguage;
  name: string;
  nativeName: string;
  region: string;
}

export const SUPPORTED_LANGUAGES: RegionalLanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English', region: 'Pan-NER' },
  { code: 'as', name: 'Assamese', nativeName: 'অসমীয়া', region: 'Assam' },
  { code: 'brx', name: 'Bodo', nativeName: 'बर’', region: 'Bodoland / Assam' },
  { code: 'kha', name: 'Khasi', nativeName: 'Ka Ktien Khasi', region: 'Meghalaya' },
  { code: 'lus', name: 'Mizo', nativeName: 'Mizo ṭawng', region: 'Mizoram' },
  { code: 'nag', name: 'Nagamese', nativeName: 'Nagamese', region: 'Nagaland' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', region: 'National' },
];

// Reminder Types & Statuses
export type ReminderType = 'medicine' | 'game' | 'appointment';
export type ReminderStatus = 'pending' | 'done' | 'missed';

// Alert Types & Severities
export type AlertType = 'score_drop' | 'missed_medicine' | 'missed_session' | 'sos' | 'left_safe_zone';
export type AlertSeverity = 'info' | 'warning' | 'critical';
export type AlertStatus = 'open' | 'reviewed';

// Caretaker Link Status
export type InviteStatus = 'pending' | 'accepted' | 'rejected';

// Doctor Verification Status
export type DoctorVerificationStatus = 'pending_verification' | 'verified' | 'rejected';

// Core User Entity
export interface User {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  role: Role;
  preferredLanguage: RegionalLanguage;
  createdAt: string;
  updatedAt?: string;
}

// Doctor Profile
export interface DoctorProfile {
  id: string;
  userId: string;
  licenseNumber: string;
  hospitalAffiliation?: string | null;
  specialization?: string | null;
  verificationStatus: DoctorVerificationStatus;
  createdAt: string;
}

// Patient Profile
export interface PatientProfile {
  id: string;
  userId: string;
  dateOfBirth?: string | null;
  dementiaStage: DementiaStage;
  assignedDoctorId?: string | null;
  emergencyContact: string;
  inviteCode?: string | null;
  safeZoneRadiusMeters?: number;
  homeLatitude?: number;
  homeLongitude?: number;
  user?: User;
}

// Caretaker Link
export interface CaretakerLink {
  id: string;
  caretakerId: string;
  patientId: string;
  relationship: string;
  inviteStatus: InviteStatus;
  createdAt: string;
  caretaker?: User;
  patient?: PatientProfile;
}

// Reminder
export interface Reminder {
  id: string;
  patientId: string;
  type: ReminderType;
  title: string;
  description?: string | null;
  scheduledTime: string;
  status: ReminderStatus;
  createdAt: string;
}

// Game Session
export interface GameSession {
  id: string;
  patientId: string;
  gameType: string;
  score: number;
  difficultyLevel: number;
  durationSeconds: number;
  playedAt: string;
}

// Game Content (Per-game content item bank for regional localization)
export interface GameContentItem {
  id: string;
  gameType: string;
  contentData: Record<string, any>;
  regionTag?: string | null;
  difficultyLevel: number;
  createdAt?: string;
}

// Cognitive Score (for trend charts)
export interface CognitiveScore {
  id: string;
  patientId: string;
  score: number;
  assessmentType: string;
  recordedAt: string;
}

// Alert
export interface Alert {
  id: string;
  patientId: string;
  type: AlertType;
  severity: AlertSeverity;
  status: AlertStatus;
  createdAt: string;
  details?: Record<string, unknown> | null;
}

// Message
export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  patientId?: string | null;
  content: string;
  sentAt: string;
}

// Authentication & JWT Payloads
export interface JWTPayload {
  userId: string;
  name: string;
  role: Role;
  email: string | null;
  phone: string;
  preferredLanguage: RegionalLanguage;
  patientId?: string; // If role is patient
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string | null;
    phone: string;
    role: Role;
    preferredLanguage: RegionalLanguage;
    patientId?: string;
    doctorStatus?: DoctorVerificationStatus;
  };
}

// Registration Payloads

// 1. Direct Caretaker Registration
export interface RegisterCaretakerRequest {
  name: string;
  email: string;
  phone: string;
  password: string;
  preferredLanguage?: RegionalLanguage;
  patientOption?: 'create_new' | 'join_existing';
  relationship?: string;
  // If joining existing:
  inviteCode?: string;
  // If creating new patient profile right away:
  patientDetails?: {
    name: string;
    phone?: string;
    dateOfBirth?: string;
    dementiaStage?: DementiaStage;
    emergencyContact?: string;
    preferredLanguage?: RegionalLanguage;
    relationship?: string;
  };
  patientData?: {
    name: string;
    phone?: string;
    dateOfBirth?: string;
    dementiaStage?: DementiaStage;
    emergencyContact?: string;
    preferredLanguage?: RegionalLanguage;
  };
}

// 2. Doctor Registration
export interface RegisterDoctorRequest {
  name: string;
  email: string;
  phone: string;
  password: string;
  licenseNumber: string;
  hospitalAffiliation?: string;
  specialization?: string;
  preferredLanguage?: RegionalLanguage;
}

// 3. Patient Registered by Caretaker (Patient does not need to type or fill credentials)
export interface RegisterPatientByCaretakerRequest {
  name: string;
  email?: string;
  phone?: string;
  password?: string;
  dateOfBirth?: string;
  dementiaStage?: DementiaStage;
  emergencyContact: string;
  preferredLanguage?: RegionalLanguage;
  relationship?: string;
  assignedDoctorId?: string;
}

// Unified Login Request
export interface LoginRequest {
  identifier: string; // email or phone
  password?: string;   // optional for rapid patient PIN or standard password
  role?: Role;
}

// Offline-first ready standard API envelope
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    timestamp: string;
    syncId?: string;
    version?: string;
  };
}

// Part 3: Memory, Connection & Safety DTOs
export interface FamilyPhoto {
  id: string;
  patientId: string;
  uploadedBy: string;
  photoUrl: string;
  personName: string;
  relationship: string;
  caption: string;
  dateOfMemory?: string; // YYYY-MM-DD or MM-DD
  uploadedAt: string;
}

export interface PatientNote {
  id: string;
  patientId: string;
  audioUrl: string;
  transcribedText?: string;
  durationSeconds?: number;
  createdAt: string;
}

export interface PatientContact {
  id: string;
  patientId: string;
  name: string;
  relationship: string;
  phoneNumber: string;
  photoUrl?: string;
  displayOrder: number;
}

export interface CaretakerMessage {
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

export interface PatientWeatherInfo {
  temperatureC: number;
  condition: string;
  icon: 'sun' | 'cloud' | 'rain' | 'cloud-sun';
  locationName: string;
}

// Patient Portal DTOs
export interface PatientHomeData {
  patientId: string;
  name: string;
  greeting: string;
  formattedDate: string;
  caretakerName: string;
  caretakerPhone: string;
  pendingRemindersCount: number;
  gamesPlayedToday: number;
  activeSos: boolean;
  safeZoneRadiusMeters?: number;
  homeLatitude?: number;
  homeLongitude?: number;
  contacts?: PatientContact[];
  unviewedMessage?: CaretakerMessage | null;
  onThisDayPhoto?: FamilyPhoto | null;
  weather?: PatientWeatherInfo;
}

export interface PatientReminderItem {
  id: string;
  title: string;
  type: ReminderType;
  scheduledTime: string; // ISO or '08:30 AM'
  timeDisplay: string;
  status: ReminderStatus;
  isOverdue: boolean;
  description?: string;
}

export interface GameSessionSubmission {
  gameType: string;
  score: number;
  difficultyLevel: number;
  durationSeconds: number;
  details?: Record<string, unknown>;
}

export interface SOSRequestPayload {
  location?: {
    latitude?: number;
    longitude?: number;
    address?: string;
  };
  note?: string;
}

// Caretaker Portal DTOs
export type CaretakerPatientStatus = 'on_track' | 'needs_attention' | 'alert_open';

export interface CaretakerPatientCard {
  id: string;
  patientProfileId: string;
  name: string;
  initials: string;
  dementiaStage: DementiaStage;
  preferredLanguage: RegionalLanguage;
  status: CaretakerPatientStatus;
  statusText: string;
  openAlertCount: number;
  todayMedicationSummary: string;
  recentActivity: string;
  inviteCode?: string;
}

export interface CaretakerPatientDetailData {
  patient: {
    id: string;
    patientProfileId: string;
    name: string;
    phone: string;
    dateOfBirth?: string;
    dementiaStage: DementiaStage;
    preferredLanguage: RegionalLanguage;
    emergencyContact: string;
    inviteCode?: string;
    assignedDoctor?: {
      id: string;
      name: string;
      hospital?: string;
      specialization?: string;
    };
  };
  status: CaretakerPatientStatus;
  statusText: string;
  plainLanguageCognitiveStatus: string;
  reminders: PatientReminderItem[];
  alerts: Array<{
    id: string;
    type: AlertType;
    severity: AlertSeverity;
    plainLanguageMessage: string;
    createdAt: string;
    status: AlertStatus;
  }>;
}

export interface CaretakerMessageItem {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: Role;
  content: string;
  sentAt: string;
  patientId: string;
}

export interface NotificationLogItem {
  id: string;
  patientId: string;
  patientName: string;
  type: 'missed_medicine' | 'missed_game_session' | 'sos_trigger' | 'doctor_flag';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  channels: ('push' | 'sms' | 'email')[];
}

// ==========================================
// DOCTOR PORTAL & ALERT ENGINE DTOs
// ==========================================

export interface DoctorAlertItem {
  id: string;
  patientId: string;
  patientName: string;
  type: AlertType;
  severity: AlertSeverity;
  description: string;
  createdAt: string;
  status: AlertStatus;
  suggestedAction?: string;
}

export interface DoctorPatientRow {
  id: string;
  name: string;
  age: number;
  dementiaStage: DementiaStage;
  lastActiveDate: string;
  scoreTrend: 'up' | 'down' | 'stable';
  currentScore: number;
  statusBadge: 'stable' | 'attention_needed' | 'critical';
  caretakerName: string;
}

export interface DoctorDashboardData {
  metrics: {
    totalPatients: number;
    activeAlertsCount: number;
    averageScoreTrendPercent: number;
    sessionsCompletedToday: number;
  };
  alertsNeedingReview: DoctorAlertItem[];
  patients: DoctorPatientRow[];
}

export interface ClinicalNoteItem {
  id: string;
  doctorId: string;
  doctorName: string;
  timestamp: string;
  note: string;
}

export interface DoctorPatientDetailData {
  patient: {
    id: string;
    patientProfileId: string;
    name: string;
    phone: string;
    dateOfBirth?: string;
    age: number;
    dementiaStage: DementiaStage;
    preferredLanguage: RegionalLanguage;
    emergencyContact: string;
    inviteCode?: string;
    caretaker: {
      name: string;
      phone: string;
      relationship: string;
    };
  };
  cognitiveHistory: Array<{
    date: string;
    score: number;
    assessmentType: string;
  }>;
  gameSessions: Array<{
    id: string;
    date: string;
    gameType: string;
    score: number;
    difficultyLevel: number;
    durationSeconds: number;
  }>;
  adherence: {
    medicineAdherencePercent: number;
    sessionAdherencePercent: number;
    totalCompleted: number;
    totalScheduled: number;
  };
  clinicalNotes: ClinicalNoteItem[];
  currentBaselineDifficulty: number;
}

// ==========================================
// AI / ML INTEGRATION POINTS
// ==========================================

export interface RawSessionMetrics {
  gameType: string;
  score: number;
  durationSeconds: number;
  errorCount?: number;
  reactionTimeMs?: number;
  difficultyLevel: number;
}

export interface NormalizedCognitiveScore {
  normalizedScore: number; // 0 - 100
  mmseEquivalent: number;  // 0 - 30 MMSE scale
  confidenceInterval: [number, number];
  percentileRank: number;
}

export interface AdaptiveDifficultyResult {
  nextDifficulty: number;
  reasoning: string;
  confidenceScore: number;
}

export interface SpeechAnalysisResult {
  clarity_score: number;       // 0.0 - 1.0
  hesitation_count: number;    // count of detected pauses/stutters
  word_recall_score: number;   // 0.0 - 1.0
  vocal_tremor_index?: number; // micro-tremor bio-marker for Parkinsonian/Dementia onset
  transcript?: string;
}
