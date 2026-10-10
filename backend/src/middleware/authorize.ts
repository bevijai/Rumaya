import type { NextFunction, Request, Response } from 'express';
import type { PlatformRole, Role } from '@prisma/client';

/** Deny-by-default role guard. Must run after `authenticate`. */
export function requireRole(...allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Not permitted for this role' });
    }
    next();
  };
}

/** Deny-by-default platform guard for marketplace validators and administrators. */
export function requirePlatformRole(...allowedRoles: PlatformRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    if (!allowedRoles.includes(req.user.platformRole)) {
      return res.status(403).json({ error: 'Not permitted for this platform role' });
    }
    next();
  };
}

/** Deny-by-default platform guard for routes authenticated with a marketplace token. */
export function requireMarketplacePlatformRole(...allowedRoles: PlatformRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.marketplaceUser) return res.status(401).json({ error: 'Not authenticated' });
    if (!allowedRoles.includes(req.marketplaceUser.platformRole)) {
      return res.status(403).json({ error: 'Not permitted for this platform role' });
    }
    next();
  };
}

/**
 * Ensures the resource being accessed belongs to the caller's own household.
 * `resolveHouseholdId` looks up the resource and returns its householdId (or
 * undefined if not found). Returns 404 for both "not found" and "wrong
 * household" to avoid leaking whether a resource exists in another household.
 */
export function requireOwnHousehold(
  resolveHouseholdId: (req: Request) => Promise<string | undefined>,
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    const householdId = await resolveHouseholdId(req);
    if (!householdId || householdId !== req.user.householdId) {
      return res.status(404).json({ error: 'Not found' });
    }
    next();
  };
}

/** Ensures the caller is acting on their own member record (e.g. helper's own leave request). */
export function requireSelf(resolveOwnerMemberId: (req: Request) => Promise<string | undefined>) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    const ownerId = await resolveOwnerMemberId(req);
    if (!ownerId || ownerId !== req.user.sub) {
      return res.status(404).json({ error: 'Not found' });
    }
    next();
  };
}
