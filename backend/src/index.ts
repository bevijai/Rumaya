import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './env';
import authRoutes from './routes/auth';
import householdRoutes from './routes/household';
import monthsRoutes from './routes/months';
import leaveRoutes from './routes/leave';
import activityLogRoutes from './routes/activityLog';
import payslipRoutes from './routes/payslip';
import messagesRoutes from './routes/messages';
import marketplaceAuthRoutes from './routes/marketplaceAuth';
import helperDirectoryRoutes from './routes/helperDirectory';
import helperProfileRoutes from './routes/helperProfiles';
import agencyHelperConnectionRoutes from './routes/agencyHelperConnections';
import agencyRoutes from './routes/agencies';
import profileValidationRoutes from './routes/profileValidation';
import employerMarketplaceRoutes from './routes/employerMarketplace';
import marketplaceInquiryRoutes from './routes/marketplaceInquiries';

const app = express();
const allowedOrigins = new Set(env.CORS_ORIGIN.split(',').map((origin) => origin.trim()));

for (const origin of [...allowedOrigins]) {
  const url = new URL(origin);
  if (url.hostname === 'localhost') {
    url.hostname = '127.0.0.1';
    allowedOrigins.add(url.origin);
  } else if (url.hostname === '127.0.0.1') {
    url.hostname = 'localhost';
    allowedOrigins.add(url.origin);
  }
}

app.use(helmet());
app.use(
  cors({
    origin: [...allowedOrigins],
    credentials: true,
  }),
);
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/auth', authRoutes);
app.use('/household', householdRoutes);
app.use('/months', monthsRoutes);
app.use('/leave-requests', leaveRoutes);
app.use('/activity-log', activityLogRoutes);
app.use('/payslip', payslipRoutes);
app.use('/messages', messagesRoutes);
app.use('/marketplace/auth', marketplaceAuthRoutes);
app.use('/marketplace/helper-directory', helperDirectoryRoutes);
app.use('/marketplace/employer-helper', employerMarketplaceRoutes);
app.use('/marketplace/employer-agency', marketplaceInquiryRoutes);
app.use('/marketplace/agency-helper', agencyHelperConnectionRoutes);

// Compatibility aliases for clients using the original pilot paths.
app.use('/marketplace/helper-profiles', helperDirectoryRoutes);
app.use('/marketplace/helper-profiles', agencyHelperConnectionRoutes);
app.use('/marketplace/helper-profiles', helperProfileRoutes);
app.use('/marketplace/agencies', agencyRoutes);
app.use('/marketplace/validation/profiles', profileValidationRoutes);
app.use('/marketplace/employer', employerMarketplaceRoutes);
app.use('/marketplace/inquiries', marketplaceInquiryRoutes);

app.listen(env.PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Rumaya API listening on port ${env.PORT}`);
});
