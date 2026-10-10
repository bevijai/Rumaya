import type { NextFunction, Request, Response } from 'express';
import {
  verifyMarketplaceAccessToken,
  type MarketplaceAccessTokenPayload,
} from '../auth/jwt';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      marketplaceUser?: MarketplaceAccessTokenPayload;
    }
  }
}

export function authenticateMarketplace(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing marketplace bearer token' });
  }

  try {
    req.marketplaceUser = verifyMarketplaceAccessToken(header.slice('Bearer '.length));
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired marketplace token' });
  }
}