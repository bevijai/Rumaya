import { prisma } from './prisma';

interface LogActivityInput {
  householdId: string;
  byId: string;
  action: string;
  month?: string;
  changes: unknown;
  comment: string;
}

/** Records an audit-trail entry. Every mutating route should call this. */
export function logActivity(input: LogActivityInput) {
  return prisma.activityLog.create({
    data: {
      householdId: input.householdId,
      byId: input.byId,
      action: input.action,
      month: input.month,
      changes: input.changes as never,
      comment: input.comment,
    },
  });
}
