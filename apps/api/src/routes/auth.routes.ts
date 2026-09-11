import { Router } from 'express';
import {
  login,
  socialLogin,
  phoneLogin,
  registerCaretaker,
  registerDoctor,
  registerPatientByCaretaker,
  getMe,
} from '../controllers/auth.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

// Public auth endpoints
router.post('/login', login);
router.post('/social-login', socialLogin);
router.post('/phone-login', phoneLogin);
router.post('/register/caretaker', registerCaretaker);
router.post('/register/doctor', registerDoctor);
router.post('/register/patient', registerPatientByCaretaker);

// Protected session check
router.get('/me', authenticateToken, getMe);

export default router;
