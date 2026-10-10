import { PrismaClient } from '@prisma/client';

// Single shared Prisma client instance across the app (avoids exhausting MySQL connections).
export const prisma = new PrismaClient();
