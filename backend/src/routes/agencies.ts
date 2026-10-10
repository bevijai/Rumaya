import { Router } from 'express';
import { z } from 'zod';
import { otpService } from '../auth/otp';
import { authenticateMarketplace } from '../middleware/authenticateMarketplace';
import { requireMarketplacePlatformRole } from '../middleware/authorize';
import { prisma } from '../prisma';
import { marketplacePhoneSchema } from './marketplaceSchemas';

const router = Router();
router.use(authenticateMarketplace);

router.get('/me', async (req, res) => {
  const memberships = await prisma.agencyMembership.findMany({
    where: { memberId: req.marketplaceUser!.sub, active: true },
    include: { agency: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ memberships });
});

router.get('/', requireMarketplacePlatformRole('validator', 'admin'), async (_req, res) => {
  const agencies = await prisma.agency.findMany({
    include: {
      _count: { select: { members: true, representations: true, inquiries: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ agencies });
});

router.post('/', requireMarketplacePlatformRole('admin'), async (req, res) => {
  const parsed = z
    .object({
      legalName: z.string().trim().min(1).max(200),
      displayName: z.string().trim().min(1).max(100),
      licenceNumber: z.string().trim().min(1).max(100),
      contactEmail: z.string().email().optional(),
      contactPhone: marketplacePhoneSchema.optional(),
      owner: z.object({
        phone: marketplacePhoneSchema,
        name: z.string().trim().min(1).max(100),
        preferredLanguage: z.string().regex(/^[a-z]{2}$/).default('en'),
      }),
    })
    .safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });

  const duplicateLicence = await prisma.agency.findUnique({
    where: { licenceNumber: parsed.data.licenceNumber },
  });
  if (duplicateLicence) return res.status(409).json({ error: 'Agency licence is already registered' });

  const existingOwner = await prisma.member.findUnique({
    where: { phone: parsed.data.owner.phone },
    include: { agencyMemberships: { where: { active: true } } },
  });
  if (existingOwner?.agencyMemberships.length) {
    return res.status(409).json({ error: 'Agency owner already has an active agency membership' });
  }

  const agency = await prisma.$transaction(async (tx) => {
    const owner = existingOwner
      ? await tx.member.update({
          where: { id: existingOwner.id },
          data: {
            name: parsed.data.owner.name,
            preferredLanguage: parsed.data.owner.preferredLanguage,
          },
        })
      : await tx.member.create({
          data: {
            phone: parsed.data.owner.phone,
            name: parsed.data.owner.name,
            preferredLanguage: parsed.data.owner.preferredLanguage,
          },
        });

    const created = await tx.agency.create({
      data: {
        legalName: parsed.data.legalName,
        displayName: parsed.data.displayName,
        licenceNumber: parsed.data.licenceNumber,
        contactEmail: parsed.data.contactEmail,
        contactPhone: parsed.data.contactPhone,
        members: { create: { memberId: owner.id, role: 'owner' } },
      },
    });
    await tx.marketplaceAuditEvent.create({
      data: {
        actorId: req.marketplaceUser!.sub,
        entityType: 'Agency',
        entityId: created.id,
        action: 'agency_invited',
        changes: { licenceNumber: created.licenceNumber, ownerId: owner.id },
      },
    });
    return created;
  });

  await otpService.startVerification(parsed.data.owner.phone);
  res.status(201).json({ agency });
});

router.post(
  '/:agencyId/approve',
  requireMarketplacePlatformRole('validator', 'admin'),
  async (req, res) => {
    const params = z.object({ agencyId: z.string().uuid() }).safeParse(req.params);
    const body = z
      .object({ licenceExpiresAt: z.string().date().optional(), notes: z.string().trim().max(1000).optional() })
      .safeParse(req.body);
    if (!params.success || !body.success) {
      return res.status(400).json({ error: 'Invalid agency approval request' });
    }

    const existing = await prisma.agency.findUnique({ where: { id: params.data.agencyId } });
    if (!existing) return res.status(404).json({ error: 'Agency not found' });
    if (!['invited', 'pending', 'suspended'].includes(existing.status)) {
      return res.status(409).json({ error: 'Agency cannot be approved from its current status' });
    }

    const approvedAt = new Date();
    const agency = await prisma.$transaction(async (tx) => {
      const updated = await tx.agency.update({
        where: { id: existing.id },
        data: {
          status: 'active',
          licenceVerifiedAt: approvedAt,
          licenceExpiresAt: body.data.licenceExpiresAt
            ? new Date(body.data.licenceExpiresAt)
            : undefined,
          approvedAt,
        },
      });
      await tx.marketplaceAuditEvent.create({
        data: {
          actorId: req.marketplaceUser!.sub,
          entityType: 'Agency',
          entityId: existing.id,
          action: 'agency_approved',
          reason: body.data.notes,
        },
      });
      return updated;
    });

    res.json({ agency });
  },
);

router.post(
  '/:agencyId/suspend',
  requireMarketplacePlatformRole('validator', 'admin'),
  async (req, res) => {
    const params = z.object({ agencyId: z.string().uuid() }).safeParse(req.params);
    const body = z.object({ reason: z.string().trim().min(1).max(1000) }).safeParse(req.body);
    if (!params.success || !body.success) return res.status(400).json({ error: 'Invalid suspension request' });

    const existing = await prisma.agency.findUnique({ where: { id: params.data.agencyId } });
    if (!existing) return res.status(404).json({ error: 'Agency not found' });

    const agency = await prisma.$transaction(async (tx) => {
      const updated = await tx.agency.update({
        where: { id: existing.id },
        data: { status: 'suspended' },
      });
      await tx.marketplaceAuditEvent.create({
        data: {
          actorId: req.marketplaceUser!.sub,
          entityType: 'Agency',
          entityId: existing.id,
          action: 'agency_suspended',
          reason: body.data.reason,
        },
      });
      return updated;
    });

    res.json({ agency });
  },
);

export default router;
