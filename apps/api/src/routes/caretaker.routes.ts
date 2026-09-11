import { Router, Request, Response } from 'express';
import { authenticateToken, requireRoles } from '../middleware/auth.middleware.js';
import { sendSuccess, sendError } from '../utils/response.js';
import {
  getCaretakerPatients,
  getCaretakerPatientDetail,
  addPatientReminder,
  deletePatientReminder,
  getPatientMessages,
  postPatientMessage,
  getInvites,
  generateNewInvite,
  getFamilyPhotos,
  addFamilyPhoto,
  deleteFamilyPhoto,
  getPatientNotes,
  getPatientContacts,
  savePatientContacts,
  deletePatientContact,
  getCaretakerMessages,
  sendCaretakerMessage,
  updatePatientSafeZone,
} from '../services/data.service.js';
import {
  getRecentNotifications,
  notifyCaretaker,
  markNotificationAsRead,
} from '../services/notification.service.js';
import { ReminderType } from '@ner/types';

const router = Router();

// Protect all routes with caretaker (or doctor for cross-review)
router.use(authenticateToken);
router.use(requireRoles('caretaker', 'doctor'));

/**
 * GET /api/caretaker/patients
 * List of patients linked to this caretaker with status badges:
 * "On track" (green), "Needs attention" (amber), or alert count badge (red)
 */
router.get('/patients', async (_req: Request, res: Response) => {
  try {
    const patients = await getCaretakerPatients();
    sendSuccess(res, patients);
  } catch (err: any) {
    console.error('Error fetching caretaker patients:', err);
    sendError(res, 'CARETAKER_PATIENTS_ERROR', err.message || 'Failed to load patients', 500);
  }
});

/**
 * GET /api/caretaker/patient/:id
 * Detailed view of a selected patient:
 * Schedule, plain-language alerts, plain-language cognitive summary
 */
router.get('/patient/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const detail = await getCaretakerPatientDetail(id);
    if (!detail) {
      sendError(res, 'NOT_FOUND', 'Patient profile not found', 404);
      return;
    }
    sendSuccess(res, detail);
  } catch (err: any) {
    console.error('Error fetching patient detail:', err);
    sendError(res, 'PATIENT_DETAIL_ERROR', err.message || 'Failed to load patient detail', 500);
  }
});

/**
 * POST /api/caretaker/patient/:id/reminders
 * Add a new scheduled reminder for this patient
 */
router.post('/patient/:id/reminders', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { type, title, timeDisplay, description } = req.body as {
      type: ReminderType;
      title: string;
      timeDisplay: string;
      description?: string;
    };

    if (!type || !title || !timeDisplay) {
      sendError(res, 'VALIDATION_ERROR', 'Type, title, and time are required');
      return;
    }

    const created = await addPatientReminder(id, { type, title, timeDisplay, description });
    sendSuccess(res, created, 201);
  } catch (err: any) {
    console.error('Error adding patient reminder:', err);
    sendError(res, 'ADD_REMINDER_ERROR', err.message || 'Failed to add reminder', 500);
  }
});

/**
 * DELETE /api/caretaker/reminders/:id
 * Remove a reminder
 */
router.delete('/reminders/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await deletePatientReminder(id);
    if (!deleted) {
      sendError(res, 'NOT_FOUND', 'Reminder not found', 404);
      return;
    }
    sendSuccess(res, { success: true, message: 'Reminder deleted' });
  } catch (err: any) {
    console.error('Error deleting reminder:', err);
    sendError(res, 'DELETE_REMINDER_ERROR', err.message || 'Failed to delete reminder', 500);
  }
});

/**
 * GET /api/caretaker/patient/:id/messages
 * Messages thread between caretaker and doctor for this patient
 */
router.get('/patient/:id/messages', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const messages = await getPatientMessages(id);
    sendSuccess(res, messages);
  } catch (err: any) {
    console.error('Error fetching messages:', err);
    sendError(res, 'MESSAGES_ERROR', err.message || 'Failed to load messages', 500);
  }
});

/**
 * POST /api/caretaker/patient/:id/messages
 * Send message to attending doctor
 */
router.post('/patient/:id/messages', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { content } = req.body as { content: string };

    if (!content || !content.trim()) {
      sendError(res, 'VALIDATION_ERROR', 'Message content is required');
      return;
    }

    const senderId = req.user?.userId || 'user-caretaker-1';
    const senderName = req.user?.name || 'Ananya Baruah';
    const senderRole = req.user?.role || 'caretaker';

    const message = await postPatientMessage(senderId, senderName, senderRole, id, content.trim());
    sendSuccess(res, message, 201);
  } catch (err: any) {
    console.error('Error posting message:', err);
    sendError(res, 'POST_MESSAGE_ERROR', err.message || 'Failed to send message', 500);
  }
});

/**
 * GET /api/caretaker/invites
 * List of generated invite codes and pending links
 */
router.get('/invites', async (_req: Request, res: Response) => {
  try {
    const invites = await getInvites();
    sendSuccess(res, invites);
  } catch (err: any) {
    console.error('Error fetching invites:', err);
    sendError(res, 'INVITES_ERROR', err.message || 'Failed to load invites', 500);
  }
});

/**
 * POST /api/caretaker/invites/generate
 * Generate new invite code for a patient
 */
router.post('/invites/generate', async (req: Request, res: Response) => {
  try {
    const { patientName } = req.body as { patientName?: string };
    const invite = await generateNewInvite(patientName);
    sendSuccess(res, invite, 201);
  } catch (err: any) {
    console.error('Error generating invite:', err);
    sendError(res, 'GENERATE_INVITE_ERROR', err.message || 'Failed to generate invite', 500);
  }
});

/**
 * GET /api/caretaker/notifications
 * Recent notification feed for caretaker
 */
router.get('/notifications', async (req: Request, res: Response) => {
  try {
    const patientId = req.query.patientId as string | undefined;
    const notifications = getRecentNotifications(patientId);
    sendSuccess(res, notifications);
  } catch (err: any) {
    console.error('Error fetching notifications:', err);
    sendError(res, 'NOTIFICATIONS_ERROR', err.message || 'Failed to load notifications', 500);
  }
});

/**
 * PATCH /api/caretaker/notifications/:id/read
 * Mark notification as read
 */
router.patch('/notifications/:id/read', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    markNotificationAsRead(id);
    sendSuccess(res, { success: true });
  } catch (err: any) {
    console.error('Error reading notification:', err);
    sendError(res, 'NOTIF_READ_ERROR', err.message || 'Failed to update notification', 500);
  }
});

/**
 * POST /api/caretaker/notifications/trigger-stub
 * Test stub for the four notification scenarios:
 * 1. Missed medicine
 * 2. Missed game session two days running
 * 3. Any SOS trigger from patient
 * 4. Alert doctor flags as needing caretaker follow-up
 */
router.post('/notifications/trigger-stub', async (req: Request, res: Response) => {
  try {
    const { type, patientId, patientName } = req.body as {
      type: 'missed_medicine' | 'missed_game_session' | 'sos_trigger' | 'doctor_flag';
      patientId?: string;
      patientName?: string;
    };

    const targetPatientId = patientId || 'pat-1';
    const targetName = patientName || 'Biren Baruah';

    let title = 'Platform Notice';
    let message = 'Notice dispatched.';

    if (type === 'missed_medicine') {
      title = 'Missed Medication Alert';
      message = `${targetName} did not mark the scheduled Donepezil (5mg) dose within 2 hours.`;
    } else if (type === 'missed_game_session') {
      title = 'Cognitive Engagement Warning';
      message = `${targetName} has missed daily memory games for 2 consecutive days.`;
    } else if (type === 'sos_trigger') {
      title = '🚨 Urgent SOS Triggered';
      message = `${targetName} pressed the Emergency Help button at home. Immediate assistance required.`;
    } else if (type === 'doctor_flag') {
      title = 'Doctor Follow-Up Flag';
      message = `Dr. H. Baruah flagged a recent cognitive response variance for caretaker review.`;
    }

    const notif = await notifyCaretaker(targetPatientId, targetName, type, title, message, ['push', 'sms']);
    sendSuccess(res, notif, 201);
  } catch (err: any) {
    console.error('Error triggering notification stub:', err);
    sendError(res, 'STUB_NOTIF_ERROR', err.message || 'Failed to trigger notification', 500);
  }
});

/**
 * GET /api/caretaker/patient/:id/photos
 * List all family photos for patient
 */
router.get('/patient/:id/photos', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const photos = await getFamilyPhotos(id);
    sendSuccess(res, photos);
  } catch (err: any) {
    console.error('Error fetching photos:', err);
    sendError(res, 'PHOTOS_ERROR', err.message || 'Failed to load photos', 500);
  }
});

/**
 * POST /api/caretaker/patient/:id/photos
 * Upload new family photo with relationship and optional memory date
 */
router.post('/patient/:id/photos', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { photoUrl, personName, relationship, caption, dateOfMemory } = req.body as {
      photoUrl: string;
      personName: string;
      relationship: string;
      caption: string;
      dateOfMemory?: string;
    };

    if (!photoUrl || !personName || !relationship) {
      sendError(res, 'VALIDATION_ERROR', 'photoUrl, personName, and relationship are required');
      return;
    }

    const uploadedBy = req.user?.userId || 'user-caretaker-1';
    const photo = await addFamilyPhoto(id, {
      photoUrl,
      personName,
      relationship,
      caption: caption || '',
      dateOfMemory,
      uploadedBy,
    });
    sendSuccess(res, photo, 201);
  } catch (err: any) {
    console.error('Error adding family photo:', err);
    sendError(res, 'ADD_PHOTO_ERROR', err.message || 'Failed to add photo', 500);
  }
});

/**
 * DELETE /api/caretaker/photos/:photoId
 * Remove family photo
 */
router.delete('/photos/:photoId', async (req: Request, res: Response) => {
  try {
    const { photoId } = req.params;
    const ok = await deleteFamilyPhoto(photoId);
    if (!ok) {
      sendError(res, 'NOT_FOUND', 'Photo not found', 404);
      return;
    }
    sendSuccess(res, { success: true });
  } catch (err: any) {
    console.error('Error deleting photo:', err);
    sendError(res, 'DELETE_PHOTO_ERROR', err.message || 'Failed to delete photo', 500);
  }
});

/**
 * GET /api/caretaker/patient/:id/notes
 * Caretaker listens to patient's recorded thoughts
 */
router.get('/patient/:id/notes', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const notes = await getPatientNotes(id);
    sendSuccess(res, notes);
  } catch (err: any) {
    console.error('Error fetching patient notes:', err);
    sendError(res, 'NOTES_ERROR', err.message || 'Failed to load patient notes', 500);
  }
});

/**
 * GET /api/caretaker/patient/:id/contacts
 * Get up to 3 patient contacts
 */
router.get('/patient/:id/contacts', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const contacts = await getPatientContacts(id);
    sendSuccess(res, contacts);
  } catch (err: any) {
    console.error('Error fetching contacts:', err);
    sendError(res, 'CONTACTS_ERROR', err.message || 'Failed to load contacts', 500);
  }
});

/**
 * POST /api/caretaker/patient/:id/contacts
 * Save / replace up to 3 contacts for patient (enforcing max 3)
 */
router.post('/patient/:id/contacts', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { contacts } = req.body as {
      contacts: Array<{ name: string; relationship: string; phoneNumber: string; photoUrl?: string }>;
    };

    if (!Array.isArray(contacts)) {
      sendError(res, 'VALIDATION_ERROR', 'contacts must be an array of at most 3 contacts');
      return;
    }

    if (contacts.length > 3) {
      sendError(res, 'VALIDATION_ERROR', 'Maximum of 3 contacts allowed');
      return;
    }

    const saved = await savePatientContacts(id, contacts);
    sendSuccess(res, saved);
  } catch (err: any) {
    console.error('Error saving patient contacts:', err);
    sendError(res, 'SAVE_CONTACTS_ERROR', err.message || 'Failed to save contacts', 500);
  }
});

/**
 * DELETE /api/caretaker/contacts/:contactId
 * Remove a patient contact
 */
router.delete('/contacts/:contactId', async (req: Request, res: Response) => {
  try {
    const { contactId } = req.params;
    const ok = await deletePatientContact(contactId);
    sendSuccess(res, { success: ok });
  } catch (err: any) {
    console.error('Error deleting contact:', err);
    sendError(res, 'DELETE_CONTACT_ERROR', err.message || 'Failed to delete contact', 500);
  }
});

/**
 * GET /api/caretaker/patient/:id/caretaker-messages
 * History of messages sent from caretaker to patient
 */
router.get('/patient/:id/caretaker-messages', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const msgs = await getCaretakerMessages(id);
    sendSuccess(res, msgs);
  } catch (err: any) {
    console.error('Error fetching messages:', err);
    sendError(res, 'MESSAGES_ERROR', err.message || 'Failed to load messages', 500);
  }
});

/**
 * POST /api/caretaker/patient/:id/caretaker-messages
 * Send voice note or photo to patient
 */
router.post('/patient/:id/caretaker-messages', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { type, contentUrl, caption } = req.body as {
      type: 'voice' | 'photo';
      contentUrl: string;
      caption?: string;
    };

    if (!type || !contentUrl) {
      sendError(res, 'VALIDATION_ERROR', 'type and contentUrl are required');
      return;
    }

    const caretakerId = req.user?.userId || 'user-caretaker-1';
    const sent = await sendCaretakerMessage(caretakerId, id, { type, contentUrl, caption });
    sendSuccess(res, sent, 201);
  } catch (err: any) {
    console.error('Error sending caretaker message:', err);
    sendError(res, 'SEND_MESSAGE_ERROR', err.message || 'Failed to send message', 500);
  }
});

/**
 * PATCH /api/caretaker/patient/:id/safe-zone
 * Update safe zone radius and home coordinates
 */
router.patch('/patient/:id/safe-zone', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { radiusMeters, latitude, longitude } = req.body as {
      radiusMeters?: number;
      latitude?: number;
      longitude?: number;
    };

    const updated = await updatePatientSafeZone(id, { radiusMeters, latitude, longitude });
    sendSuccess(res, updated);
  } catch (err: any) {
    console.error('Error updating safe zone:', err);
    sendError(res, 'SAFE_ZONE_ERROR', err.message || 'Failed to update safe zone', 500);
  }
});

export default router;
