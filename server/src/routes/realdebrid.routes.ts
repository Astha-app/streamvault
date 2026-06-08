import { Router, Request, Response, NextFunction } from 'express';
import { validateBody } from '../middleware/validateRequest';
import { realDebridRateLimiter } from '../middleware/rateLimit';
import { UnrestrictSchema, TestConnectionSchema } from '../schemas/realDebrid.schema';
import { testConnection, unrestrictLink, refreshLink, AppError } from '../services/realDebridService';
import type { ApiResponse, UnrestrictResult, RealDebridUser } from '../../../shared/types/api';

const router = Router();

function handleAppError(err: unknown, res: Response): boolean {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ success: false, error: err.message, code: err.code } satisfies ApiResponse<never>);
    return true;
  }
  return false;
}

/** POST /api/realdebrid/test — verify token & return user info */
router.post(
  '/test',
  realDebridRateLimiter,
  validateBody(TestConnectionSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await testConnection(req.body.token);
      res.json({ success: true, data: user } satisfies ApiResponse<RealDebridUser>);
    } catch (err) {
      if (!handleAppError(err, res)) next(err);
    }
  },
);

/** POST /api/realdebrid/unrestrict — resolve a supported link */
router.post(
  '/unrestrict',
  realDebridRateLimiter,
  validateBody(UnrestrictSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await unrestrictLink(req.body.link, req.body.password, req.body.remote);
      res.json({ success: true, data: result } satisfies ApiResponse<UnrestrictResult>);
    } catch (err) {
      if (!handleAppError(err, res)) next(err);
    }
  },
);

/** POST /api/realdebrid/refresh — force-re-resolve a cached link */
router.post(
  '/refresh',
  realDebridRateLimiter,
  validateBody(UnrestrictSchema.pick({ link: true })),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await refreshLink(req.body.link);
      res.json({ success: true, data: result } satisfies ApiResponse<UnrestrictResult>);
    } catch (err) {
      if (!handleAppError(err, res)) next(err);
    }
  },
);

export default router;
