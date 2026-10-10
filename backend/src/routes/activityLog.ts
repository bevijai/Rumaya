import { Router } from 'express';
import { prisma } from '../prisma';
import { authenticate } from '../middleware/authenticate';

const router = Router();
router.use(authenticate);

router.get('/', async (req, res) => {
  const logs = await prisma.activityLog.findMany({
    where: { householdId: req.user!.householdId },
    include: { by: { select: { id: true, name: true } } },
    orderBy: { at: 'desc' },
    take: 50,
  });
  res.json({ activityLogs: logs });
});

export default router;
