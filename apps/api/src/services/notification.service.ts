import { NotificationLogItem } from '@ner/types';

// In-memory persistent notification log for the platform
const notificationLogs: NotificationLogItem[] = [
  {
    id: 'notif-1',
    patientId: 'pat-1',
    patientName: 'Biren Baruah',
    type: 'missed_medicine',
    title: 'Missed Medication Notice',
    message: 'Biren has not confirmed taking Donepezil (5mg) scheduled for 08:30 AM.',
    timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
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
];

/**
 * Triggers a notification to the patient's caretaker(s)
 * Handles:
 * 1. Missed medicine
 * 2. Missed game session two days running
 * 3. Any SOS trigger from the patient
 * 4. Any alert the doctor flags as needing caretaker follow-up
 */
export async function notifyCaretaker(
  patientId: string,
  patientName: string,
  type: 'missed_medicine' | 'missed_game_session' | 'sos_trigger' | 'doctor_flag',
  title: string,
  message: string,
  channels: ('push' | 'sms' | 'email')[] = ['push', 'sms']
): Promise<NotificationLogItem> {
  const notif: NotificationLogItem = {
    id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    patientId,
    patientName,
    type,
    title,
    message,
    timestamp: new Date().toISOString(),
    read: false,
    channels,
  };

  notificationLogs.unshift(notif);

  console.log(`\n🔔 [NOTIFICATION DISPATCHED] -> Caretaker of ${patientName}`);
  console.log(`   Type:     ${type.toUpperCase()}`);
  console.log(`   Title:    ${title}`);
  console.log(`   Message:  ${message}`);
  console.log(`   Channels: ${channels.join(', ').toUpperCase()}`);
  console.log(`   Time:     ${notif.timestamp}\n`);

  return notif;
}

/**
 * Triggers a clinical alert notification to the patient's assigned doctor
 */
export async function notifyDoctor(
  doctorId: string,
  patientId: string,
  patientName: string,
  reason: string
): Promise<void> {
  console.log(`\n🩺 [CLINICAL ALERT DISPATCHED] -> Doctor ${doctorId}`);
  console.log(`   Patient: ${patientName} (${patientId})`);
  console.log(`   Reason:  ${reason}`);
  console.log(`   Time:    ${new Date().toISOString()}\n`);
}

/**
 * Retrieves all recent notifications for caretakers
 */
export function getRecentNotifications(patientId?: string): NotificationLogItem[] {
  if (patientId) {
    return notificationLogs.filter((n) => n.patientId === patientId);
  }
  return notificationLogs;
}

/**
 * Mark notification as read
 */
export function markNotificationAsRead(notifId: string): boolean {
  const item = notificationLogs.find((n) => n.id === notifId);
  if (item) {
    item.read = true;
    return true;
  }
  return false;
}
