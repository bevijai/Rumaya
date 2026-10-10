import jwt from 'jsonwebtoken';
import { env } from '../env';
import type { PlatformRole, Role } from '@prisma/client';

export interface AccessTokenPayload {
  sub: string; // member id
  householdId: string;
  role: Role;
  platformRole: PlatformRole;
  type: 'access';
}

export interface RefreshTokenPayload {
  sub: string;
  tokenVersion: number;
  type: 'refresh';
}

export interface MarketplaceAccessTokenPayload {
  sub: string;
  platformRole: PlatformRole;
  type: 'marketplace_access';
}

export interface MarketplaceRefreshTokenPayload {
  sub: string;
  tokenVersion: number;
  type: 'marketplace_refresh';
}

export function signAccessToken(payload: Omit<AccessTokenPayload, 'type'>): string {
  return jwt.sign({ ...payload, type: 'access' }, env.JWT_SECRET, {
    expiresIn: env.JWT_ACCESS_TOKEN_TTL as jwt.SignOptions['expiresIn'],
  });
}

export function signRefreshToken(payload: Omit<RefreshTokenPayload, 'type'>): string {
  return jwt.sign({ ...payload, type: 'refresh' }, env.JWT_SECRET, {
    expiresIn: env.JWT_REFRESH_TOKEN_TTL as jwt.SignOptions['expiresIn'],
  });
}

export function signMarketplaceAccessToken(
  payload: Omit<MarketplaceAccessTokenPayload, 'type'>,
): string {
  return jwt.sign({ ...payload, type: 'marketplace_access' }, env.JWT_SECRET, {
    expiresIn: env.JWT_ACCESS_TOKEN_TTL as jwt.SignOptions['expiresIn'],
  });
}

export function signMarketplaceRefreshToken(
  payload: Omit<MarketplaceRefreshTokenPayload, 'type'>,
): string {
  return jwt.sign({ ...payload, type: 'marketplace_refresh' }, env.JWT_SECRET, {
    expiresIn: env.JWT_REFRESH_TOKEN_TTL as jwt.SignOptions['expiresIn'],
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET) as AccessTokenPayload;
  if (decoded.type !== 'access') throw new Error('Not an access token');
  return decoded;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET) as RefreshTokenPayload;
  if (decoded.type !== 'refresh') throw new Error('Not a refresh token');
  return decoded;
}

export function verifyMarketplaceAccessToken(token: string): MarketplaceAccessTokenPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET) as MarketplaceAccessTokenPayload;
  if (decoded.type !== 'marketplace_access') throw new Error('Not a marketplace access token');
  return decoded;
}

export function verifyMarketplaceRefreshToken(token: string): MarketplaceRefreshTokenPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET) as MarketplaceRefreshTokenPayload;
  if (decoded.type !== 'marketplace_refresh') throw new Error('Not a marketplace refresh token');
  return decoded;
}

