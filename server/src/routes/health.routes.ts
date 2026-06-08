import { Router } from 'express';
import type { HealthResponse } from '../../../shared/types/api';

const router = Router();

router.get('/', (_req, res) => {
  const body: HealthResponse = {
    status: 'ok',
    version: process.env.npm_package_version || '1.0.0',
    timestamp: new Date().toISOString(),
  };
  res.json(body);
});

export default router;
