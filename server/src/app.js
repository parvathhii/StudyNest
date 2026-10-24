
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/authRoutes.js';
import subjectRoutes from './routes/subjectRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import sessionRoutes from './routes/sessionRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import examRoutes from './routes/examRoutes.js';
import dailyGoalRoutes from './routes/dailyGoalRoutes.js';
import subjectNoteRoutes from './routes/subjectNoteRoutes.js';

import {
  notFound,
  errorHandler,
} from './middleware/errorMiddleware.js';

const app = express();

// Security middleware
app.use(helmet());

// Frontend connection
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
  })
);

// Parse incoming JSON
app.use(express.json({ limit: '20kb' }));

// Authentication rate limiter
app.use(
  '/api/auth',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
  })
);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    app: 'StudyNest API',
  });
});

// Application routes
app.use('/api/auth', authRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/daily-goals', dailyGoalRoutes);
app.use('/api/notes', subjectNoteRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

export default app;
