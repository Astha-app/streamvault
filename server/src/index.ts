import 'dotenv/config';
import express from 'express';
import { corsMiddleware } from './middleware/cors';
import { apiRateLimiter } from './middleware/rateLimit';
import { errorHandler } from './middleware/errorHandler';
import healthRouter from './routes/health.routes';
import realDebridRouter from './routes/realdebrid.routes';
import cacheRouter from './routes/cache.routes';
import { logger } from './utils/logger';

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

// Security & parsing
app.use(corsMiddleware);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));
app.set('trust proxy', 1);

// Rate limiting on all routes
app.use(apiRateLimiter);

// Routes
app.use('/health', healthRouter);
app.use('/api/realdebrid', realDebridRouter);
app.use('/api/cache', cacheRouter);

// 404
app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Not found', code: 'NOT_FOUND' });
});

// Central error handler
app.use(errorHandler);

app.listen(PORT, '0.0.0.0', () => {
  logger.info(`Server running on http://0.0.0.0:${PORT}`);
  logger.info(`Real-Debrid token configured: ${Boolean(process.env.REALDEBRID_API_TOKEN)}`);
});

export default app;
