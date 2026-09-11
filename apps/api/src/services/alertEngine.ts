import { AlertType, AlertSeverity, AlertStatus } from '@ner/types';
import { notifyCaretaker, notifyDoctor } from './notification.service.js';

// ============================================================================
// ALERT ENGINE CONFIGURATION CONSTANTS (Tuning Parameters)
// ============================================================================
export const SCORE_DROP_WARNING_PERCENT = 15;        // 15% drop over 7 days triggers Warning
export const SCORE_DROP_CRITICAL_PERCENT = 30;       // 30% drop over 7 days triggers Critical Alert
export const CONSECUTIVE_MISSED_MEDICINE_THRESHOLD = 2; // 2+ consecutive missed medicines
export const INACTIVE_DAYS_THRESHOLD = 3;             // 3+ days without cognitive game session

export interface AlertRecord {
  id: string;
  patientId: string;
  patientName: string;
  type: AlertType;
  severity: AlertSeverity;
  status: AlertStatus;
  plainMessage: string;
  clinicalRationale: string;
  createdAt: string;
  suggestedAction: string;
}

// In-memory alert store (shared with data.service / prisma)
export const globalAlerts: AlertRecord[] = [
  {
    id: 'alt-doc-1',
    patientId: 'pat-2',
    patientName: 'Nirmala Devi',
    type: 'score_drop',
    severity: 'warning',
    status: 'open',
    plainMessage: "Nirmala's cognitive game scores have dropped 18% over the past 7 days.",
    clinicalRationale: `Rolling 7-day performance baseline dropped by 18.2% (exceeding threshold of ${SCORE_DROP_WARNING_PERCENT}%). Likely attention or retrieval latency variance.`,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    suggestedAction: 'Review MMSE subscores, consider adjusting Donepezil/Memantine regimen.',
  },
  {
    id: 'alt-doc-2',
    patientId: 'pat-2',
    patientName: 'Nirmala Devi',
    type: 'missed_medicine',
    severity: 'warning',
    status: 'open',
    plainMessage: 'Rivastigmine patch change missed this morning at 09:00 AM.',
    clinicalRationale: `${CONSECUTIVE_MISSED_MEDICINE_THRESHOLD} consecutive scheduled medication intervals missed without caretaker confirmation.`,
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    suggestedAction: 'Confirm patch replacement with primary caretaker Ananya.',
  },
  {
    id: 'alt-doc-3',
    patientId: 'pat-1',
    patientName: 'Biren Baruah',
    type: 'missed_session',
    severity: 'warning',
    status: 'open',
    plainMessage: 'No cognitive games completed in the last 3 days.',
    clinicalRationale: `Patient has been inactive for >= ${INACTIVE_DAYS_THRESHOLD} days. Continuous neural stimulation required for mild dementia preservation.`,
    createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
    suggestedAction: 'Encourage 10-minute Assam Tea Garden matching game session.',
  },
];

/**
 * Evaluates patient performance against Alert Engine rules
 * 
 * Rules:
 * 1. Cognitive score drop over 7-day rolling window
 * 2. 2+ consecutive missed medicines
 * 3. 3+ days without completing a game session
 * 4. Immediate SOS trigger handling
 */
export async function evaluatePatientAlerts(
  patientId: string,
  patientName: string,
  patientData: {
    doctorId?: string;
    recentScores: Array<{ date: string; score: number }>;
    recentReminders: Array<{ type: string; status: string; scheduledTime: string; title: string }>;
    lastGameSessionDate?: string;
  }
): Promise<AlertRecord[]> {
  const newAlerts: AlertRecord[] = [];
  const now = Date.now();

  // RULE 1: Rolling 7-day Cognitive Score Drop
  if (patientData.recentScores && patientData.recentScores.length >= 2) {
    const scores = patientData.recentScores;
    const oldest = scores[scores.length - 1].score;
    const newest = scores[0].score;

    if (oldest > 0) {
      const dropPercent = ((oldest - newest) / oldest) * 100;

      if (dropPercent >= SCORE_DROP_CRITICAL_PERCENT) {
        const alert: AlertRecord = {
          id: `alt-eng-${Date.now()}-1`,
          patientId,
          patientName,
          type: 'score_drop',
          severity: 'critical',
          status: 'open',
          plainMessage: `${patientName}'s cognitive score dropped sharply (${Math.round(dropPercent)}%) this week.`,
          clinicalRationale: `Critical score drop of ${Math.round(dropPercent)}% exceeds critical threshold (${SCORE_DROP_CRITICAL_PERCENT}%). Potential acute delirium or rapid decline.`,
          createdAt: new Date().toISOString(),
          suggestedAction: 'Urgent neurological evaluation and caretaker interview recommended.',
        };
        newAlerts.push(alert);
      } else if (dropPercent >= SCORE_DROP_WARNING_PERCENT) {
        const alert: AlertRecord = {
          id: `alt-eng-${Date.now()}-1`,
          patientId,
          patientName,
          type: 'score_drop',
          severity: 'warning',
          status: 'open',
          plainMessage: `${patientName}'s game scores have dropped this week — her doctor has been notified.`,
          clinicalRationale: `Performance drop of ${Math.round(dropPercent)}% exceeds warning threshold (${SCORE_DROP_WARNING_PERCENT}%).`,
          createdAt: new Date().toISOString(),
          suggestedAction: 'Follow up with caretaker to assess sleep quality and hydration.',
        };
        newAlerts.push(alert);
      }
    }
  }

  // RULE 2: Consecutive Missed Medicines (>= CONSECUTIVE_MISSED_MEDICINE_THRESHOLD)
  const medicineReminders = patientData.recentReminders.filter((r) => r.type === 'medicine');
  let consecutiveMissed = 0;
  for (const rem of medicineReminders) {
    if (rem.status === 'missed') {
      consecutiveMissed++;
    } else {
      break;
    }
  }

  if (consecutiveMissed >= CONSECUTIVE_MISSED_MEDICINE_THRESHOLD) {
    const alert: AlertRecord = {
      id: `alt-eng-${Date.now()}-2`,
      patientId,
      patientName,
      type: 'missed_medicine',
      severity: 'warning',
      status: 'open',
      plainMessage: `${patientName} has missed ${consecutiveMissed} medication doses in a row.`,
      clinicalRationale: `Patient missed ${consecutiveMissed} consecutive doses of essential medication. Risk of cognitive destabilization.`,
      createdAt: new Date().toISOString(),
      suggestedAction: 'Send automated medication notification to caretaker mobile.',
    };
    newAlerts.push(alert);
  }

  // RULE 3: Inactive for >= INACTIVE_DAYS_THRESHOLD Days
  if (patientData.lastGameSessionDate) {
    const daysSince = Math.floor((now - new Date(patientData.lastGameSessionDate).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSince >= INACTIVE_DAYS_THRESHOLD) {
      const alert: AlertRecord = {
        id: `alt-eng-${Date.now()}-3`,
        patientId,
        patientName,
        type: 'missed_session',
        severity: 'warning',
        status: 'open',
        plainMessage: `No game session completed in ${daysSince} days.`,
        clinicalRationale: `Patient has been inactive for ${daysSince} days (threshold: ${INACTIVE_DAYS_THRESHOLD} days).`,
        createdAt: new Date().toISOString(),
        suggestedAction: 'Prompt caretaker to launch morning sound rhythm game.',
      };
      newAlerts.push(alert);
    }
  }

  // Persist alerts and dispatch real-time notifications
  for (const alert of newAlerts) {
    globalAlerts.unshift(alert);

    // Notify caretaker
    await notifyCaretaker(
      patientId,
      patientName,
      alert.type === 'missed_medicine'
        ? 'missed_medicine'
        : alert.type === 'missed_session'
        ? 'missed_game_session'
        : 'doctor_flag',
      alert.severity === 'critical' ? `🚨 CRITICAL ALERT: ${alert.plainMessage}` : `⚠️ Health Notice: ${alert.plainMessage}`,
      alert.plainMessage,
      alert.severity === 'critical' ? ['push', 'sms', 'email'] : ['push', 'sms']
    );

    // Notify doctor
    if (patientData.doctorId) {
      await notifyDoctor(
        patientData.doctorId,
        patientId,
        patientName,
        alert.clinicalRationale
      );
    }
  }

  return newAlerts;
}

/**
 * Immediate SOS trigger from patient:
 * Bypasses all batching/digests, immediately creating a Critical Alert
 * and dispatching high-priority SMS/Push alerts to caretaker and doctor.
 */
export async function triggerImmediateSOS(
  patientId: string,
  patientName: string,
  doctorId?: string,
  location?: { latitude?: number; longitude?: number; address?: string }
): Promise<AlertRecord> {
  const locString = location?.address || (location?.latitude ? `${location.latitude}, ${location.longitude}` : 'Home, Assam');

  const alert: AlertRecord = {
    id: `alt-sos-${Date.now()}`,
    patientId,
    patientName,
    type: 'sos',
    severity: 'critical',
    status: 'open',
    plainMessage: `EMERGENCY SOS: ${patientName} pressed the emergency button at ${locString}!`,
    clinicalRationale: `Emergency SOS triggered by patient from device. Immediate clinical and caretaker intervention required.`,
    createdAt: new Date().toISOString(),
    suggestedAction: 'Dispatch emergency family contact or local community health worker immediately.',
  };

  globalAlerts.unshift(alert);

  // Immediate dispatch (bypass batching)
  await notifyCaretaker(
    patientId,
    patientName,
    'sos_trigger',
    '🚨 EMERGENCY SOS ALERT',
    `IMMEDIATE ATTENTION: ${patientName} triggered SOS at ${locString}. Please respond now!`,
    ['push', 'sms']
  );

  if (doctorId) {
    await notifyDoctor(
      doctorId,
      patientId,
      patientName,
      `EMERGENCY SOS triggered at ${locString}.`
    );
  }

  return alert;
}

/**
 * Returns all active alerts needing review by a doctor
 */
export function getAlertsNeedingReview(statusFilter?: AlertStatus): AlertRecord[] {
  if (statusFilter) {
    return globalAlerts.filter((a) => a.status === statusFilter);
  }
  return globalAlerts.filter((a) => a.status === 'open');
}

/**
 * Resolves/reviews an alert
 */
export function reviewAlert(alertId: string): boolean {
  const alert = globalAlerts.find((a) => a.id === alertId);
  if (alert) {
    alert.status = 'reviewed';
    return true;
  }
  return false;
}
