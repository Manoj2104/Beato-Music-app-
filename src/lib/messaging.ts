/**
 * Beato Messaging Engine
 * Handles email (Gmail SMTP), WhatsApp Business API, and SMS (Twilio)
 * All sends are fire-and-forget with error isolation
 */

import { db, MessagingConfigEntity } from './db';
import nodemailer from 'nodemailer';

// Template interpolation helper
export function interpolate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`);
}

// Enterprise HTML Email Layout Wrapper
export function wrapInDesignedHTMLLayout(opts: {
  subject: string;
  bodyText: string;
  color?: string;
  type?: string;
}): string {
  const gradient = opts.color || 'linear-gradient(135deg,#b08850,#0d6b31)';
  const typeLabel = opts.type ? opts.type.toUpperCase() : 'NOTIFICATION';
  
  // Format body text with br tags and styling for brackets
  const bodyHtml = opts.bodyText
    .replace(/\n/g, '<br/>')
    .replace(/\{\{(\w+)\}\}/g, '<strong style="color: #b08850; font-weight: 700;">{{$1}}</strong>');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${opts.subject}</title>
  <style>
    body {
      font-family: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif;
      background-color: #0a0a0a;
      color: #e5e7eb;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #0a0a0a;
      padding: 40px 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #121212;
      border: 1px solid #1f1f1f;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    }
    .header {
      background: ${gradient};
      padding: 36px 24px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      color: #ffffff;
      font-size: 28px;
      font-weight: 800;
      letter-spacing: -0.03em;
      text-shadow: 0 2px 4px rgba(0,0,0,0.25);
    }
    .content {
      padding: 36px 32px;
      line-height: 1.65;
      font-size: 15px;
      color: #d1d5db;
    }
    .content h2 {
      color: #ffffff;
      margin-top: 0;
      font-size: 20px;
      font-weight: 700;
    }
    .tag {
      display: inline-block;
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.08em;
      background: rgba(176, 136, 80, 0.15);
      color: #b08850;
      padding: 4px 10px;
      border-radius: 12px;
      text-transform: uppercase;
      margin-bottom: 16px;
    }
    .cta-container {
      text-align: center;
      margin: 30px 0 10px 0;
    }
    .btn {
      background-color: #b08850;
      color: #000000 !important;
      text-decoration: none;
      padding: 12px 36px;
      border-radius: 30px;
      font-weight: 800;
      font-size: 14px;
      display: inline-block;
      letter-spacing: 0.05em;
      box-shadow: 0 4px 15px rgba(176, 136, 80, 0.35);
    }
    .divider {
      height: 1px;
      background-color: #1f1f1f;
      margin: 24px 0;
    }
    .footer {
      background-color: #161616;
      padding: 28px 24px;
      text-align: center;
      font-size: 11px;
      color: #6b7280;
      border-top: 1px solid #1f1f1f;
      line-height: 1.5;
    }
    .footer a {
      color: #b08850;
      text-decoration: none;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <h1>🎵 Beato</h1>
      </div>
      <div class="content">
        <span class="tag">${typeLabel}</span>
        <div style="margin-top: 10px;">
          ${bodyHtml}
        </div>
      </div>
      <div class="footer">
        <p>This is an automated operational transmission from the Beato platform.</p>
        <p>© 2026 Beato Inc., 100 Feet Rd, Indiranagar, Bengaluru, KA, India.</p>
        <p><a href="#">Manage Subscriptions</a> | <a href="#">Unsubscribe</a> | <a href="#">Support Help Center</a></p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

// ─── Email via Gmail SMTP (nodemailer) ──────────────────────────────────────

export async function sendEmail(opts: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const cfg = db.getMessagingConfig();
    const emailUser = process.env.SMTP_USER || cfg.email.user;
    const emailPass = process.env.SMTP_PASS || cfg.email.pass;
    const host = process.env.SMTP_HOST || cfg.email.host || 'smtp.gmail.com';
    const port = Number(process.env.SMTP_PORT) || cfg.email.port || 587;
    const emailEnabled = (process.env.SMTP_USER && process.env.SMTP_PASS) ? true : cfg.email.enabled;

    if (!emailEnabled || !emailUser || !emailPass) {
      return { success: false, error: 'Email not configured or disabled. Enable Gmail SMTP in Settings → Messaging or define SMTP_USER / SMTP_PASS in your .env file.' };
    }

    // ✅ Port 465 = SSL (secure: true). Port 587/25 = STARTTLS (secure: false + requireTLS: true)
    // This is the correct mapping — wrong value here causes "wrong version number" SSL errors.
    const isSSL = port === 465;

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: isSSL,              // true only for port 465 (direct SSL)
      requireTLS: !isSSL,         // force STARTTLS upgrade on port 587/25
      auth: { user: emailUser, pass: emailPass },
      tls: {
        rejectUnauthorized: false, // allow self-signed certs in dev
        minVersion: 'TLSv1.2',
      },
    });

    await transporter.sendMail({
      from: `"${cfg.email.fromName || 'Beato'}" <${cfg.email.fromAddress || emailUser}>`,
      to: opts.to,
      subject: opts.subject,
      text: opts.text,
      html: opts.html || wrapInDesignedHTMLLayout({ subject: opts.subject, bodyText: opts.text }),
    });
    return { success: true };
  } catch (err: any) {
    const msg = err.message || 'Unknown SMTP error';
    console.error('[Messaging] Email send failed:', msg);
    // Provide a more helpful error for the common SSL mismatch case
    if (msg.includes('wrong version number') || msg.includes('SSL')) {
      return { success: false, error: `SSL/TLS mismatch: Use port 587 (STARTTLS) or port 465 (SSL). Current error: ${msg}` };
    }
    if (msg.includes('Invalid login') || msg.includes('Username and Password')) {
      return { success: false, error: 'Gmail auth failed. Use an App Password (not your account password). Get one at myaccount.google.com/apppasswords' };
    }
    return { success: false, error: msg };
  }
}

// ─── WhatsApp Business API (Meta Graph API or Twilio) ───────────────────────

export async function sendWhatsApp(opts: {
  to: string;
  message: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const cfg = db.getMessagingConfig();
    if (!cfg.whatsapp.enabled || !cfg.whatsapp.accessToken || !cfg.whatsapp.fromNumber) {
      return { success: false, error: 'WhatsApp not configured or disabled' };
    }

    if (cfg.whatsapp.provider === 'meta') {
      // Meta WhatsApp Cloud API
      const url = `https://graph.facebook.com/v19.0/${cfg.whatsapp.phoneNumberId}/messages`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${cfg.whatsapp.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: opts.to.replace(/\D/g, ''),
          type: 'text',
          text: { body: opts.message },
        }),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error?.message || 'WhatsApp API error' };
      return { success: true };
    } else {
      // Twilio WhatsApp
      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${cfg.whatsapp.businessAccountId}/Messages.json`;
      const credentials = Buffer.from(`${cfg.whatsapp.businessAccountId}:${cfg.whatsapp.accessToken}`).toString('base64');
      const body = new URLSearchParams({
        From: `whatsapp:${cfg.whatsapp.fromNumber}`,
        To: `whatsapp:${opts.to}`,
        Body: opts.message,
      });
      const res = await fetch(twilioUrl, {
        method: 'POST',
        headers: { 'Authorization': `Basic ${credentials}`, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.message || 'Twilio WhatsApp error' };
      return { success: true };
    }
  } catch (err: any) {
    console.error('[Messaging] WhatsApp send failed:', err.message);
    return { success: false, error: err.message };
  }
}

// ─── SMS via Twilio ──────────────────────────────────────────────────────────

export async function sendSMS(opts: {
  to: string;
  message: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const cfg = db.getMessagingConfig();
    if (!cfg.sms.enabled || !cfg.sms.accountSid || !cfg.sms.authToken) {
      return { success: false, error: 'SMS not configured or disabled' };
    }
    const url = `https://api.twilio.com/2010-04-01/Accounts/${cfg.sms.accountSid}/Messages.json`;
    const credentials = Buffer.from(`${cfg.sms.accountSid}:${cfg.sms.authToken}`).toString('base64');
    const body = new URLSearchParams({
      From: cfg.sms.fromNumber,
      To: opts.to,
      Body: opts.message,
    });
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Authorization': `Basic ${credentials}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.message || 'Twilio SMS error' };
    return { success: true };
  } catch (err: any) {
    console.error('[Messaging] SMS send failed:', err.message);
    return { success: false, error: err.message };
  }
}

// ─── Generic send dispatcher ─────────────────────────────────────────────────

async function dispatchChannel(
  channel: 'email' | 'whatsapp' | 'sms' | 'none',
  to: string,
  message: string,
  subject?: string,
): Promise<void> {
  if (channel === 'none' || !to) return;
  if (channel === 'email') {
    await sendEmail({ to, subject: subject || 'Beato Notification', text: message });
  } else if (channel === 'whatsapp') {
    await sendWhatsApp({ to, message });
  } else if (channel === 'sms') {
    await sendSMS({ to, message });
  }
}

// ─── Automation Rule Engine ──────────────────────────────────────────────────

export async function fireAutomation(
  event: string,
  userContext: {
    name: string;
    email: string;
    phone?: string;
    ip?: string;
    [key: string]: string | undefined;
  }
): Promise<void> {
  try {
    const rules = db.getAutomationRules();
    const cfg = db.getMessagingConfig();
    const matchingRules = rules.filter(r => r.enabled && r.event === event);

    const vars: Record<string, string> = {
      name: userContext.name,
      email: userContext.email,
      phone: userContext.phone || '',
      ip: userContext.ip || 'unknown',
      time: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      platform: 'Beato',
      ...Object.fromEntries(Object.entries(userContext).filter(([, v]) => v !== undefined).map(([k, v]) => [k, v as string])),
    };

    for (const rule of matchingRules) {
      // User action (non-blocking)
      if (rule.userAction.channel !== 'none' && rule.userAction.template) {
        const msg = interpolate(rule.userAction.template, vars);
        const subject = rule.userAction.subject ? interpolate(rule.userAction.subject, vars) : 'Beato Notification';
        // Send to user's email
        if (rule.userAction.channel === 'email' && userContext.email) {
          dispatchChannel('email', userContext.email, msg, subject).catch(console.error);
        } else if (rule.userAction.channel === 'whatsapp' && userContext.phone) {
          dispatchChannel('whatsapp', userContext.phone, msg).catch(console.error);
        } else if (rule.userAction.channel === 'sms' && userContext.phone) {
          dispatchChannel('sms', userContext.phone, msg).catch(console.error);
        }
      }

      // Admin action (non-blocking)
      if (rule.adminAction.channel !== 'none' && rule.adminAction.template) {
        const msg = interpolate(rule.adminAction.template, vars);
        if (rule.adminAction.channel === 'email' && cfg.adminAlertEmail) {
          dispatchChannel('email', cfg.adminAlertEmail, msg, `[Admin Alert] ${event}`).catch(console.error);
        } else if (rule.adminAction.channel === 'whatsapp' && cfg.adminAlertPhone) {
          dispatchChannel('whatsapp', cfg.adminAlertPhone, msg).catch(console.error);
        } else if (rule.adminAction.channel === 'sms' && cfg.adminAlertPhone) {
          dispatchChannel('sms', cfg.adminAlertPhone, msg).catch(console.error);
        }
      }

      // Track fire count
      db.incrementRuleFireCount(rule.id);
    }
  } catch (err) {
    console.error('[Automation] fireAutomation error:', err);
  }
}
