import { env } from '../env';

/**
 * Thin wrapper around Twilio Verify for phone-number SMS OTP (replaces Supabase's
 * built-in phone auth). Falls back to a console-logged dev code when Twilio env
 * vars are not configured, so local development doesn't require a Twilio account.
 */
export interface OtpService {
  startVerification(phoneE164: string): Promise<void>;
  checkVerification(phoneE164: string, code: string): Promise<boolean>;
}

class TwilioOtpService implements OtpService {
  private readonly accountSid: string;
  private readonly authToken: string;
  private readonly verifyServiceSid: string;
  private readonly channel: 'sms' | 'email';

  constructor(
    accountSid: string,
    authToken: string,
    verifyServiceSid: string,
    channel: 'sms' | 'email',
  ) {
    this.accountSid = accountSid;
    this.authToken = authToken;
    this.verifyServiceSid = verifyServiceSid;
    this.channel = channel;
  }

  private authHeader(): string {
    return 'Basic ' + Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64');
  }

  async startVerification(destination: string): Promise<void> {
    const res = await fetch(
      `https://verify.twilio.com/v2/Services/${this.verifyServiceSid}/Verifications`,
      {
        method: 'POST',
        headers: {
          Authorization: this.authHeader(),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ To: destination, Channel: this.channel }),
      },
    );
    if (!res.ok) throw new Error(`Twilio startVerification failed: ${res.status}`);
  }

  async checkVerification(destination: string, code: string): Promise<boolean> {
    const res = await fetch(
      `https://verify.twilio.com/v2/Services/${this.verifyServiceSid}/VerificationCheck`,
      {
        method: 'POST',
        headers: {
          Authorization: this.authHeader(),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ To: destination, Code: code }),
      },
    );
    if (!res.ok) return false;
    const data = (await res.json()) as { status?: string };
    return data.status === 'approved';
  }
}

/** Dev-only fallback: logs the code to the console instead of sending a real SMS. */
class DevConsoleOtpService implements OtpService {
  private codes = new Map<string, string>();

  async startVerification(destination: string): Promise<void> {
    const code = '123456';
    this.codes.set(destination, code);
    // eslint-disable-next-line no-console
    console.warn(`[dev-otp] Verification code for ${destination}: ${code}`);
  }

  async checkVerification(destination: string, code: string): Promise<boolean> {
    const expected = this.codes.get(destination);
    return expected !== undefined && expected === code;
  }
}

export const otpService: OtpService =
  env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN && env.TWILIO_VERIFY_SERVICE_SID
    ? new TwilioOtpService(
        env.TWILIO_ACCOUNT_SID,
        env.TWILIO_AUTH_TOKEN,
        env.TWILIO_VERIFY_SERVICE_SID,
        'sms',
      )
    : new DevConsoleOtpService();

export const emailOtpService: OtpService =
  env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN && env.TWILIO_VERIFY_SERVICE_SID
    ? new TwilioOtpService(
        env.TWILIO_ACCOUNT_SID,
        env.TWILIO_AUTH_TOKEN,
        env.TWILIO_VERIFY_SERVICE_SID,
        'email',
      )
    : new DevConsoleOtpService();
