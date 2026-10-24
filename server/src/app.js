
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

import {
  notFound,
  errorHandler,
} from './middleware/errorMiddleware.js';

const app = express();

app.set('trust proxy', 1);

app.use(helmet());

const allowedOrigins = new Set([
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://studynest-gules.vercel.app',
  ...(process.env.CLIENT_URL || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
]);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
        return callback(null, true);
      }

      return callback(new Error('Origin not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json({ limit: '20kb' }));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/auth', authLimiter);

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    app: 'StudyNest API',
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/daily-goals', dailyGoalRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;


