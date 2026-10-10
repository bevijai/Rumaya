import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required (Hostinger MySQL connection string)'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be a long random string'),
  JWT_ACCESS_TOKEN_TTL: z.string().default('15m'),
  JWT_REFRESH_TOKEN_TTL: z.string().default('30d'),
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_VERIFY_SERVICE_SID: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  /** Claude API key for message translation; falls back to a dev echo-translator when unset. */
  ANTHROPIC_API_KEY: z.string().optional(),
  /** Enables POST /auth/dev-login (bypasses OTP entirely). NEVER set true in production. */
  ALLOW_DEV_LOGIN: z.coerce.boolean().default(false),
  PORT: z.coerce.number().default(4000),
  /** Comma-separated list of allowed frontend origins, e.g. https://theedzy.com */
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
});

export const env = envSchema.parse(process.env);
