import { Router, Request, Response } from 'express';
import { authenticateToken, requireRoles } from '../middleware/auth.middleware.js';
import { sendSuccess, sendError } from '../utils/response.js';
import {
  getDoctorDashboardData,
  getDoctorPatientDetail,
  addClinicalNote,
  updatePatientBaselineDifficulty,
  resolveDoctorAlert,
  getPatientMessages,
  postPatientMessage,
} from '../services/data.service.js';

const router = Router();

// Protect all routes with doctor role (or caretaker for cross-review/demo)
router.use(authenticateToken);
router.use(requireRoles('doctor', 'caretaker'));

/**
 * GET /api/doctor/dashboard
 * Top summary metrics, alerts needing review ABOVE patient list, and sortable patient cohort
 */
router.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const doctorId = req.user?.userId;
    const dashboardData = await getDoctorDashboardData(doctorId);
    sendSuccess(res, dashboardData);
  } catch (err: any) {
    console.error('Error loading doctor dashboard:', err);
    sendError(res, 'DOCTOR_DASHBOARD_ERROR', err.message || 'Failed to load dashboard', 500);
  }
});

/**
 * GET /api/doctor/patient/:id
 * Full clinical patient detail: score history for line chart, session breakdown, adherence, notes
 */
router.get('/patient/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const detail = await getDoctorPatientDetail(id);
    if (!detail) {
      sendError(res, 'NOT_FOUND', 'Patient record not found', 404);
      return;
    }
    sendSuccess(res, detail);
  } catch (err: any) {
    console.error('Error loading doctor patient detail:', err);
    sendError(res, 'DOCTOR_PATIENT_ERROR', err.message || 'Failed to load patient detail', 500);
  }
});

/**
 * POST /api/doctor/patient/:id/notes
 * Add timestamped clinical observation (visible only to doctors)
 */
router.post('/patient/:id/notes', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { note } = req.body as { note: string };

    if (!note || !note.trim()) {
      sendError(res, 'VALIDATION_ERROR', 'Clinical note text is required');
      return;
    }

    const doctorId = req.user?.userId || 'doc-1';
    const doctorName = req.user?.name || 'Dr. H. Baruah';

    const created = await addClinicalNote(id, doctorId, doctorName, note.trim());
    sendSuccess(res, created, 201);
  } catch (err: any) {
    console.error('Error adding clinical note:', err);
    sendError(res, 'CLINICAL_NOTE_ERROR', err.message || 'Failed to add note', 500);
  }
});

/**
 * PATCH /api/doctor/patient/:id/difficulty
 * Manually adjust a patient's game difficulty baseline
 */
router.patch('/patient/:id/difficulty', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { difficulty } = req.body as { difficulty: number };

    if (!difficulty || difficulty < 1 || difficulty > 3) {
      sendError(res, 'VALIDATION_ERROR', 'Difficulty level must be 1, 2, or 3');
      return;
    }

    const updated = await updatePatientBaselineDifficulty(id, difficulty);
    sendSuccess(res, updated);
  } catch (err: any) {
    console.error('Error updating baseline difficulty:', err);
    sendError(res, 'DIFFICULTY_UPDATE_ERROR', err.message || 'Failed to update difficulty', 500);
  }
});

/**
 * PATCH /api/doctor/alerts/:id/review
 * Mark an alert as reviewed
 */
router.patch('/alerts/:id/review', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const reviewed = await resolveDoctorAlert(id);
    if (!reviewed) {
      sendError(res, 'NOT_FOUND', 'Alert not found', 404);
      return;
    }
    sendSuccess(res, { success: true, message: 'Alert reviewed and archived.' });
  } catch (err: any) {
    console.error('Error reviewing alert:', err);
    sendError(res, 'ALERT_REVIEW_ERROR', err.message || 'Failed to review alert', 500);
  }
});

/**
 * GET /api/doctor/patient/:id/messages
 * Messaging thread between doctor and caretaker for this patient
 */
router.get('/patient/:id/messages', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const messages = await getPatientMessages(id);
    sendSuccess(res, messages);
  } catch (err: any) {
    console.error('Error fetching patient messages:', err);
    sendError(res, 'MESSAGES_ERROR', err.message || 'Failed to load messages', 500);
  }
});

/**
 * POST /api/doctor/patient/:id/messages
 * Post message to caretaker
 */
router.post('/patient/:id/messages', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { content } = req.body as { content: string };

    if (!content || !content.trim()) {
      sendError(res, 'VALIDATION_ERROR', 'Message content is required');
      return;
    }

    const doctorId = req.user?.userId || 'doc-1';
    const doctorName = req.user?.name || 'Dr. H. Baruah';

    const created = await postPatientMessage(doctorId, doctorName, 'doctor', id, content.trim());
    sendSuccess(res, created, 201);
  } catch (err: any) {
    console.error('Error sending message to caretaker:', err);
    sendError(res, 'POST_MESSAGE_ERROR', err.message || 'Failed to send message', 500);
  }
});

export default router;
