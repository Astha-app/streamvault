import { Router } from 'express';
import { cacheService } from '../services/cacheService';
import type { ApiResponse, CacheStatusResponse } from '../../../shared/types/api';

const router = Router();

router.get('/status', (_req, res) => {
  const status = cacheService.status();
  res.json({
    success: true,
    data: {
      resolvedLinks: status.count,
      totalEntries: status.count,
    } satisfies CacheStatusResponse,
  } satisfies ApiResponse<CacheStatusResponse>);
});

router.delete('/', (_req, res) => {
  cacheService.clear();
  res.json({ success: true, data: { message: 'Server cache cleared.' } });
});

export default router;
