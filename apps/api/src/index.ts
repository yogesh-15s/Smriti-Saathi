import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes.js';
import patientRoutes from './routes/patient.routes.js';
import doctorRoutes from './routes/doctor.routes.js';
import caretakerRoutes from './routes/caretaker.routes.js';
import { sendSuccess, sendError } from './utils/response.js';

const app = express();
const PORT = process.env.PORT || 5000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

// Standard Middlewares
app.use(
  cors({
    origin: CORS_ORIGIN === '*' ? true : CORS_ORIGIN,
    credentials: true,
  })
);
app.use(express.json());

// Public Health Check Endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  sendSuccess(res, {
    status: 'online',
    service: 'NER Dementia Cognitive Gaming & Memory Assistance API',
    version: '1.0.0',
    regionSupported: 'North Eastern Region (NER), India',
    timestamp: new Date().toISOString(),
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/patient', patientRoutes);
app.use('/api/doctor', doctorRoutes);
app.use('/api/caretaker', caretakerRoutes);

// 404 Catch-All
app.use((req: Request, res: Response) => {
  sendError(res, 'NOT_FOUND', `Route ${req.method} ${req.url} not found`, 404);
});

// Global Error Handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled Server Error:', err);
  sendError(res, 'INTERNAL_SERVER_ERROR', err.message || 'An unexpected error occurred', 500);
});

// Start Server
app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(` NER Dementia Platform API is running!`);
  console.log(` Port:    http://localhost:${PORT}`);
  console.log(` Health:  http://localhost:${PORT}/api/health`);
  console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`=======================================================`);
});

export default app;
