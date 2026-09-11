import { Router, Request, Response } from 'express';
import { authenticateToken, requireRoles } from '../middleware/auth.middleware.js';
import { sendSuccess, sendError } from '../utils/response.js';
import {
  getPatientHome,
  getPatientReminders,
  markPatientReminderDone,
  submitGameSession,
  triggerPatientSOS,
  getFamilyPhotos,
  getOnThisDayPhoto,
  savePatientNote,
  getPatientContacts,
  getUnviewedCaretakerMessage,
  markCaretakerMessageViewed,
  logSafeZoneBreach,
  getPatientWeather,
  getGameContent,
} from '../services/data.service.js';
import { GameSessionSubmission, SOSRequestPayload } from '@ner/types';

const router = Router();

// Protect all routes with patient role (or doctor/caretaker for assisted testing)
router.use(authenticateToken);
router.use(requireRoles('patient', 'caretaker', 'doctor'));

/**
 * GET /api/patient/home
 * Single most simplified home payload:
 * Greeting, Patient name, Today's date, Caretaker info (for Call button), reminder counts, SOS state.
 */
router.get('/home', async (req: Request, res: Response) => {
  try {
    const patientId = req.user?.patientId;
    const data = await getPatientHome(patientId);
    sendSuccess(res, data);
  } catch (err: any) {
    console.error('Error fetching patient home:', err);
    sendError(res, 'PATIENT_HOME_ERROR', err.message || 'Failed to load home data', 500);
  }
});

/**
 * GET /api/patient/reminders
 * Simple list of today's reminders with time and overdue status
 */
router.get('/reminders', async (req: Request, res: Response) => {
  try {
    const patientId = req.user?.patientId;
    const reminders = await getPatientReminders(patientId);
    sendSuccess(res, reminders);
  } catch (err: any) {
    console.error('Error fetching patient reminders:', err);
    sendError(res, 'REMINDERS_ERROR', err.message || 'Failed to load reminders', 500);
  }
});

/**
 * PATCH /api/patient/reminders/:id/done
 * Big button tap to mark a reminder done
 */
router.patch('/reminders/:id/done', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updated = await markPatientReminderDone(id);
    if (!updated) {
      sendError(res, 'NOT_FOUND', 'Reminder not found', 404);
      return;
    }
    sendSuccess(res, updated);
  } catch (err: any) {
    console.error('Error marking reminder done:', err);
    sendError(res, 'REMINDER_UPDATE_ERROR', err.message || 'Failed to update reminder', 500);
  }
});

/**
 * GET /api/patient/games
 * GET /api/patient/games
 * Cognitive training games catalog categorized into 3 large domains
 */
router.get('/games', async (req: Request, res: Response) => {
  try {
    const games = [
      // 1. Memory Games
      {
        id: 'memory_match',
        name: 'Assam Tea Flora Match',
        description: 'Find matching pairs of tea leaves, wild orchids, and rhododendrons.',
        category: 'memory',
        categoryLabel: 'Memory Games',
        icon: '🍃',
        initialDifficulty: 1,
      },
      {
        id: 'spatial_recall',
        name: 'Where Did I Put It?',
        description: 'Remember where everyday items were placed in cozy room scenes.',
        category: 'memory',
        categoryLabel: 'Memory Games',
        icon: '👓',
        initialDifficulty: 1,
      },
      {
        id: 'sequence_recall',
        name: 'Hornbill Rhythm & Sequence',
        description: 'Watch the glowing lanterns and repeat the calming pattern sequence.',
        category: 'memory',
        categoryLabel: 'Memory Games',
        icon: '🔔',
        initialDifficulty: 1,
      },
      {
        id: 'face_recognition',
        name: 'Family Faces Memory',
        description: 'Recognize your cherished family members and warm memories.',
        category: 'memory',
        categoryLabel: 'Memory Games',
        icon: '👨‍👩‍👧‍👦',
        initialDifficulty: 1,
      },

      // 2. Matching & Sorting
      {
        id: 'odd_one_out',
        name: 'Odd One Out',
        description: 'Find which friendly item does not belong to the group.',
        category: 'matching_sorting',
        categoryLabel: 'Matching & Sorting',
        icon: '🔍',
        initialDifficulty: 1,
      },
      {
        id: 'picture_naming',
        name: 'Kaziranga Picture Naming',
        description: 'Speak or tap the friendly name for regional animals and objects.',
        category: 'matching_sorting',
        categoryLabel: 'Matching & Sorting',
        icon: '🦏',
        initialDifficulty: 1,
      },
      {
        id: 'word_pairing',
        name: 'Rhymes & Word Pairs',
        description: 'Match words that rhyme or belong together like tea and cup.',
        category: 'matching_sorting',
        categoryLabel: 'Matching & Sorting',
        icon: '☕',
        initialDifficulty: 1,
      },
      {
        id: 'routine_sequencing',
        name: 'Daily Routine Steps',
        description: 'Put morning tea or garden routines into the peaceful right order.',
        category: 'matching_sorting',
        categoryLabel: 'Matching & Sorting',
        icon: '🫖',
        initialDifficulty: 1,
      },
      {
        id: 'category_sorting',
        name: 'Gentle Sorting',
        description: 'Sort healthy foods and nature into two large friendly zones.',
        category: 'matching_sorting',
        categoryLabel: 'Matching & Sorting',
        icon: '🧺',
        initialDifficulty: 1,
      },
      {
        id: 'word_association',
        name: 'Brahmaputra Word Pairs',
        description: 'Connect related everyday items and familiar regional words.',
        category: 'matching_sorting',
        categoryLabel: 'Matching & Sorting',
        icon: '📖',
        initialDifficulty: 1,
      },

      // 3. Culture & Movement
      {
        id: 'festival_matching',
        name: 'Festivals of North East',
        description: 'Cherish joyful memories of Bihu, Hornbill, and mountain festivals.',
        category: 'culture_movement',
        categoryLabel: 'Culture & Movement',
        icon: '🪘',
        initialDifficulty: 1,
      },
      {
        id: 'gesture_mirror',
        name: 'Gentle Hand Gestures',
        description: 'Gentle physical warm-up mimicking peaceful hand movements like Namaste.',
        category: 'culture_movement',
        categoryLabel: 'Culture & Movement',
        icon: '🙏',
        initialDifficulty: 1,
      },
    ];
    sendSuccess(res, games);
  } catch (err: any) {
    console.error('Error fetching games:', err);
    sendError(res, 'GAMES_ERROR', err.message || 'Failed to load games', 500);
  }
});

/**
 * GET /api/patient/games/content
 * Fetch game content bank items with optional filters: gameType, regionTag, difficultyLevel
 */
router.get('/games/content', async (req: Request, res: Response) => {
  try {
    const gameType = req.query.gameType as string | undefined;
    const regionTag = req.query.regionTag as string | undefined;
    const difficultyLevel = req.query.difficultyLevel
      ? parseInt(req.query.difficultyLevel as string, 10)
      : undefined;

    const contentItems = await getGameContent(gameType, regionTag, difficultyLevel);
    sendSuccess(res, contentItems);
  } catch (err: any) {
    console.error('Error fetching game content:', err);
    sendError(res, 'GAME_CONTENT_ERROR', err.message || 'Failed to load game content', 500);
  }
});

/**
 * POST /api/patient/games/session
 * Logs score, duration, difficulty, and auto-adjusts difficulty
 */
router.post('/games/session', async (req: Request, res: Response) => {
  try {
    const patientId = req.user?.patientId || 'pat-1';
    const submission = req.body as GameSessionSubmission;

    if (!submission.gameType || submission.score === undefined) {
      sendError(res, 'VALIDATION_ERROR', 'gameType and score are required');
      return;
    }

    const result = await submitGameSession(patientId, submission);
    sendSuccess(res, result);
  } catch (err: any) {
    console.error('Error recording game session:', err);
    sendError(res, 'GAME_SESSION_ERROR', err.message || 'Failed to record session', 500);
  }
});

/**
 * POST /api/patient/sos
 * Sends emergency alert with location to caretaker and doctor
 */
router.post('/sos', async (req: Request, res: Response) => {
  try {
    const patientId = req.user?.patientId || 'pat-1';
    const payload = req.body as SOSRequestPayload;
    const result = await triggerPatientSOS(patientId, payload.location);
    sendSuccess(res, result);
  } catch (err: any) {
    console.error('Error triggering SOS:', err);
    sendError(res, 'SOS_ERROR', err.message || 'Failed to trigger SOS', 500);
  }
});

/**
 * GET /api/patient/photos
 * Returns family memory photos for the photo memory album
 */
router.get('/photos', async (req: Request, res: Response) => {
  try {
    const patientId = req.user?.patientId || 'pat-1';
    const photos = await getFamilyPhotos(patientId);
    sendSuccess(res, photos);
  } catch (err: any) {
    console.error('Error fetching family photos:', err);
    sendError(res, 'PHOTOS_ERROR', err.message || 'Failed to load photos', 500);
  }
});

/**
 * GET /api/patient/photos/on-this-day
 * Returns a photo matching today's MM-DD for ambient reassurance
 */
router.get('/photos/on-this-day', async (req: Request, res: Response) => {
  try {
    const patientId = req.user?.patientId || 'pat-1';
    const photo = await getOnThisDayPhoto(patientId);
    sendSuccess(res, photo);
  } catch (err: any) {
    console.error('Error fetching on-this-day memory:', err);
    sendError(res, 'ON_THIS_DAY_ERROR', err.message || 'Failed to check on-this-day memory', 500);
  }
});

/**
 * POST /api/patient/notes
 * Saves voice note-to-self
 */
router.post('/notes', async (req: Request, res: Response) => {
  try {
    const patientId = req.user?.patientId || 'pat-1';
    const { audioUrl, transcribedText, durationSeconds } = req.body as {
      audioUrl: string;
      transcribedText?: string;
      durationSeconds?: number;
    };

    if (!audioUrl) {
      sendError(res, 'VALIDATION_ERROR', 'audioUrl is required');
      return;
    }

    const created = await savePatientNote(patientId, { audioUrl, transcribedText, durationSeconds });
    sendSuccess(res, created, 201);
  } catch (err: any) {
    console.error('Error saving patient note:', err);
    sendError(res, 'NOTE_SAVE_ERROR', err.message || 'Failed to save note', 500);
  }
});

/**
 * GET /api/patient/contacts
 * Returns up to 3 quick-call contacts
 */
router.get('/contacts', async (req: Request, res: Response) => {
  try {
    const patientId = req.user?.patientId || 'pat-1';
    const contacts = await getPatientContacts(patientId);
    sendSuccess(res, contacts);
  } catch (err: any) {
    console.error('Error fetching contacts:', err);
    sendError(res, 'CONTACTS_ERROR', err.message || 'Failed to load contacts', 500);
  }
});

/**
 * GET /api/patient/caretaker-message/latest
 * Returns unviewed message sent by caretaker
 */
router.get('/caretaker-message/latest', async (req: Request, res: Response) => {
  try {
    const patientId = req.user?.patientId || 'pat-1';
    const msg = await getUnviewedCaretakerMessage(patientId);
    sendSuccess(res, msg);
  } catch (err: any) {
    console.error('Error fetching caretaker message:', err);
    sendError(res, 'MESSAGE_ERROR', err.message || 'Failed to check caretaker message', 500);
  }
});

/**
 * PATCH /api/patient/caretaker-message/:id/viewed
 * Marks caretaker message as viewed
 */
router.patch('/caretaker-message/:id/viewed', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const ok = await markCaretakerMessageViewed(id);
    sendSuccess(res, { success: ok });
  } catch (err: any) {
    console.error('Error marking message viewed:', err);
    sendError(res, 'MESSAGE_VIEWED_ERROR', err.message || 'Failed to mark message viewed', 500);
  }
});

/**
 * POST /api/patient/safe-zone-alert
 * Silently records left_safe_zone alert to alerts table
 */
router.post('/safe-zone-alert', async (req: Request, res: Response) => {
  try {
    const patientId = req.user?.patientId || 'pat-1';
    const { latitude, longitude } = req.body as { latitude?: number; longitude?: number };
    const result = await logSafeZoneBreach(patientId, latitude, longitude);
    sendSuccess(res, result);
  } catch (err: any) {
    console.error('Error logging safe zone breach:', err);
    sendError(res, 'SAFE_ZONE_ERROR', err.message || 'Failed to log safe zone alert', 500);
  }
});

/**
 * GET /api/patient/weather
 * Returns current ambient weather
 */
router.get('/weather', async (req: Request, res: Response) => {
  try {
    const patientId = req.user?.patientId || 'pat-1';
    const weather = getPatientWeather(patientId);
    sendSuccess(res, weather);
  } catch (err: any) {
    console.error('Error fetching weather:', err);
    sendError(res, 'WEATHER_ERROR', err.message || 'Failed to fetch weather', 500);
  }
});

export default router;
