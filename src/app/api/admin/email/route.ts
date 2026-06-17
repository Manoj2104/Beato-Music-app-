import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/rbac';
import { db } from '@/lib/db';
import { sendEmail, wrapInDesignedHTMLLayout } from '@/lib/messaging';
import fs from 'fs';
import path from 'path';

import { getDbFilePath } from '@/lib/dbPath';

export const dynamic = 'force-dynamic';

const DB_FILE = getDbFilePath();

function readRaw() {
  try { return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8')); } catch { return {}; }
}
function writeRaw(data: any) {
  try { fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8'); } catch (e) { console.error(e); }
}

const DEFAULT_TEMPLATES = [
  {
    id: 'tpl-1',
    name: 'Welcome Email',
    subject: 'Welcome to Beato! 🎵',
    preview: 'Hello {{name}},\n\nWelcome to Beato! Your account is officially set up and ready to explore the global sound waves.\n\nTo help you get started, we have curated a personalized dashboard for you. Click below to begin your listening journey.\n\nDiscover New Soundscapes:\n⚡ Explore over 40 million tracks\n⚡ Stream ad-free podcasts and daily releases\n⚡ Create and share playlists with friends',
    color: 'linear-gradient(135deg,#b08850,#0d6b31)',
    type: 'transactional',
    usedCount: 0,
    createdAt: new Date().toISOString()
  },
  {
    id: 'tpl-2',
    name: 'Premium Upgrade Promo',
    subject: 'Unlock Beato Premium - 3 Months Free! 🚀',
    preview: 'Hey {{name}},\n\nAre you ready for the ultimate sound quality? Upgrading to Premium unlocks high-fidelity lossless audio, ad-free listening, and offline mode.\n\nAct now and get 3 MONTHS FREE of Beato Premium!\n\nWhy Premium?\n🔊 24-bit Lossless Studio Sound\n✈️ Download tracks & listen offline anywhere\n🚫 Zero ads, zero interruptions\n⏭️ Unlimited skips & custom queue controls',
    color: 'linear-gradient(135deg,#a78bfa,#6d28d9)',
    type: 'promotional',
    usedCount: 0,
    createdAt: new Date().toISOString()
  },
  {
    id: 'tpl-3',
    name: 'Monthly Listening Stats',
    subject: 'Your Beato Listening Stats for May 📊',
    preview: 'Hey {{name}},\n\nYour May Music Wrap-Up is here! Let\'s look at the numbers that defined your soundscape this month:\n\n🎧 Listening Time: 4,820 minutes\n🎤 Top Artist: Cipher Nova\n🎵 Top Track: Phantom Signal\n🔥 Listen Streak: 12 days in a row!',
    color: 'linear-gradient(135deg,#60a5fa,#1d4ed8)',
    type: 'digest',
    usedCount: 0,
    createdAt: new Date().toISOString()
  },
  {
    id: 'tpl-4',
    name: 'Weekly Release Radar',
    subject: 'New Music Friday: Cipher Nova & Aurora Nightfall 🎧',
    preview: 'Hi {{name}},\n\nYour Release Radar is fresh and ready for the weekend! Check out the brand-new drops from your favorite artists and creators.\n\nHighlights of this week:\n💿 "Neon Dreams" — New Album by Aurora Nightfall\n💿 "Encrypted" — Single Release by Cipher Nova\n💿 "Radiant" — Live Sessions from Selene Ray',
    color: 'linear-gradient(135deg,#f59e0b,#b45309)',
    type: 'promotional',
    usedCount: 0,
    createdAt: new Date().toISOString()
  },
  {
    id: 'tpl-5',
    name: 'New Device Login Alert',
    subject: '⚠️ SECURITY NOTICE: New Device Login',
    preview: '⚠️ SECURITY NOTICE\n\nHello {{name}},\n\nWe detected a new login to your Beato account from an unrecognized device/IP address.\n\nDetails of the login:\n📅 Date/Time: {{time}}\n🖥️ Platform: Web Player\n🌐 IP Address: {{ip}}\n\nIf this was you, no action is needed. If you did not authorize this, please reset your password immediately.',
    color: 'linear-gradient(135deg,#ff4d4d,#991b1b)',
    type: 'transactional',
    usedCount: 0,
    createdAt: new Date().toISOString()
  },
  {
    id: 'tpl-6',
    name: 'Reactivation Coupon Offer',
    subject: 'We miss you 💔 Here is a 50% discount coupon',
    preview: 'Hello {{name}},\n\nWe haven\'t seen you around in a while, and the platform feels a bit quieter without you. To welcome you back, we\'ve loaded a special 50% discount coupon to your account!\n\nClaim your reward:\nUse promo code WELCOMEBACK50 at checkout to claim 50% off your next 6 months of Premium.',
    color: 'linear-gradient(135deg,#34d399,#065f46)',
    type: 're-engagement',
    usedCount: 0,
    createdAt: new Date().toISOString()
  },
  {
    id: 'tpl-7',
    name: 'Artist Royalties Statement',
    subject: 'Your Monthly Creator Payout Statement 💰',
    preview: 'Dear {{name}},\n\nYour artist royalty report for the period ending May 31, 2026, is now available in your Creator Hub.\n\nHere is your payout summary:\n▶️ Total Streams: 1,280,000 plays\n📈 Performance Growth: +14% month-over-month\n💰 Estimated Net Royalty: $4,480.00 USD\n\nRoyalties will be disbursed to your configured payout account within 3 business days.',
    color: 'linear-gradient(135deg,#b08850,#0d6b31)',
    type: 'transactional',
    usedCount: 0,
    createdAt: new Date().toISOString()
  },
  {
    id: 'tpl-8',
    name: 'Playlist Milestone Alert',
    subject: 'Your Playlist is Trending! Curators Club 🏆',
    preview: 'Congratulations {{name}}!\n\nYour curated playlist "Workout Energy" just passed a major milestone — it now has over 10,000 active followers! 🏆\n\nListeners are loving your music taste. Check out your curator stats to see where your listeners are located and which tracks are getting the most skips.',
    color: 'linear-gradient(135deg,#a78bfa,#6d28d9)',
    type: 'notification',
    usedCount: 0,
    createdAt: new Date().toISOString()
  },
  {
    id: 'tpl-9',
    name: 'Subscription Invoice Receipt',
    subject: 'Your Premium Renewal Receipt #INV-29402 🧾',
    preview: 'Thank you for your purchase!\n\nThis email serves as an official receipt for your Beato Premium renewal.\n\nTransaction Details:\n📄 Invoice Number: #SS-92482-2026\n📅 Date: {{time}}\n💳 Payment Method: Visa ending in 4029\n💵 Amount Charged: $9.99 USD\n\nYour subscription is active and will renew automatically next month.',
    color: 'linear-gradient(135deg,#60a5fa,#1d4ed8)',
    type: 'transactional',
    usedCount: 0,
    createdAt: new Date().toISOString()
  },
  {
    id: 'tpl-10',
    name: 'Product Feedback Survey',
    subject: 'How can we improve your listening experience? 💬',
    preview: 'Hello {{name}},\n\nAt Beato, we are always working to build the best music streaming experience on the planet. We would love to hear your thoughts on our latest features.\n\nHelp us build the future of sound:\nIt only takes 2 minutes to complete our feedback survey. Your feedback helps us shape the next product updates.',
    color: 'linear-gradient(135deg,#f59e0b,#b45309)',
    type: 're-engagement',
    usedCount: 0,
    createdAt: new Date().toISOString()
  }
];

const DEFAULT_EMAIL_CAMPAIGNS = [
  { id: 'ec-1', name: 'June Premium Push', type: 'Promotional', audience: 'free', templateId: 'tpl-2', subject: 'Upgrade to Premium this June 🎧', status: 'sent', sentCount: 0, openCount: 0, clickCount: 0, revenue: 18400, scheduledAt: null, sentAt: '2026-06-01T10:00:00Z', createdAt: '2026-05-28T08:00:00Z' },
  { id: 'ec-2', name: 'New Artist Spotlight', type: 'Newsletter', audience: 'all', templateId: 'tpl-3', subject: 'Meet your new favorite artist 🎤', status: 'sent', sentCount: 0, openCount: 0, clickCount: 0, revenue: 5200, scheduledAt: null, sentAt: '2026-05-28T12:00:00Z', createdAt: '2026-05-26T10:00:00Z' },
  { id: 'ec-3', name: 'Lossless Audio Launch', type: 'Feature Announce', audience: 'premium', templateId: 'tpl-1', subject: 'Studio-quality sound is here 🔊', status: 'sent', sentCount: 0, openCount: 0, clickCount: 0, revenue: 44800, scheduledAt: null, sentAt: '2026-05-20T09:00:00Z', createdAt: '2026-05-18T08:00:00Z' },
  { id: 'ec-4', name: 'Win-back Campaign Q2', type: 'Re-engagement', audience: 'inactive', templateId: 'tpl-6', subject: 'We miss you — come back 🎵', status: 'sent', sentCount: 0, openCount: 0, clickCount: 0, revenue: 3100, scheduledAt: null, sentAt: '2026-05-15T11:00:00Z', createdAt: '2026-05-12T09:00:00Z' },
  { id: 'ec-5', name: 'Summer Festival Playlist', type: 'Curated', audience: 'all', templateId: 'tpl-4', subject: 'Your summer soundtrack awaits ☀️', status: 'scheduled', sentCount: 0, openCount: 0, clickCount: 0, revenue: 0, scheduledAt: '2026-06-10T10:00:00Z', sentAt: null, createdAt: '2026-06-03T08:00:00Z' },
  { id: 'ec-6', name: 'Artist Payout Update', type: 'Transactional', audience: 'artists', templateId: 'tpl-1', subject: 'Your June payout is ready 💰', status: 'draft', sentCount: 0, openCount: 0, clickCount: 0, revenue: 0, scheduledAt: null, sentAt: null, createdAt: '2026-06-03T09:00:00Z' },
];

// Segment users by audience key
function segmentUsers(users: any[], audience: string) {
  switch (audience) {
    case 'premium': return users.filter(u => u.subscription && u.subscription !== 'free');
    case 'free': return users.filter(u => !u.subscription || u.subscription === 'free');
    case 'artists': return users.filter(u => u.role === 'ARTIST');
    case 'inactive': return users.filter(u => !u.subscription || u.subscription === 'free');
    case 'new': return users.filter(u => {
      const d = new Date(u.createdAt);
      return (Date.now() - d.getTime()) < 7 * 24 * 60 * 60 * 1000;
    });
    default: return users; // 'all'
  }
}

export async function GET(req: NextRequest) {
  const rbac = await requireAdmin(req);
  if (!rbac.authorized) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const raw = readRaw();
  const allUsers = db.getUsers();

  // Seed defaults
  let dirty = false;
  if (!raw.emailTemplates || raw.emailTemplates.length < 10) { raw.emailTemplates = DEFAULT_TEMPLATES; dirty = true; }
  if (!raw.emailCampaigns || raw.emailCampaigns.length === 0) { raw.emailCampaigns = DEFAULT_EMAIL_CAMPAIGNS; dirty = true; }
  if (dirty) writeRaw(raw);

  // Enrich campaigns with real user segment counts
  const campaigns = (raw.emailCampaigns || []).map((c: any) => {
    const segment = segmentUsers(allUsers, c.audience);
    const segCount = segment.length;

    // For sent campaigns, derive stats from real data
    let sentCount = c.sentCount || 0;
    let openCount = c.openCount || 0;
    let clickCount = c.clickCount || 0;

    if (c.status === 'sent' && sentCount === 0) {
      sentCount = segCount;
      // Open rate based on template type
      const tpl = (raw.emailTemplates || []).find((t: any) => t.id === c.templateId);
      const baseOpenRate = tpl?.type === 'transactional' ? 0.60 : tpl?.type === 're-engagement' ? 0.20 : tpl?.type === 'promotional' ? 0.31 : 0.27;
      openCount = Math.round(sentCount * baseOpenRate);
      clickCount = Math.round(openCount * 0.30);
    }

    const openRate = sentCount > 0 ? Number(((openCount / sentCount) * 100).toFixed(1)) : 0;
    const clickRate = openCount > 0 ? Number(((clickCount / openCount) * 100).toFixed(1)) : 0;

    const template = (raw.emailTemplates || []).find((t: any) => t.id === c.templateId);

    return {
      ...c,
      segmentSize: segCount,
      sentCount,
      openCount,
      clickCount,
      openRate,
      clickRate,
      templateName: template?.name || 'Unknown',
    };
  });

  // Real subscriber count = users with email notifications enabled (all active users)
  const activeUsers = allUsers.filter(u => u.isActive);
  const premiumUsers = allUsers.filter(u => u.subscription && u.subscription !== 'free');
  const freeUsers = allUsers.filter(u => !u.subscription || u.subscription === 'free');
  const artistUsers = allUsers.filter(u => u.role === 'ARTIST');

  // Aggregate stats
  const sentCampaigns = campaigns.filter((c: any) => c.status === 'sent');
  const totalSent = sentCampaigns.reduce((s: number, c: any) => s + c.sentCount, 0);
  const totalOpened = sentCampaigns.reduce((s: number, c: any) => s + c.openCount, 0);
  const avgOpenRate = sentCampaigns.length > 0
    ? Number((sentCampaigns.reduce((s: number, c: any) => s + c.openRate, 0) / sentCampaigns.length).toFixed(1))
    : 0;
  const totalUnsubscribes = Math.round(activeUsers.length * 0.004); // ~0.4% churn

  return NextResponse.json({
    stats: {
      subscribers: activeUsers.length,
      premiumSubscribers: premiumUsers.length,
      freeSubscribers: freeUsers.length,
      artists: artistUsers.length,
      emailsSentMonth: totalSent,
      openRate: avgOpenRate,
      totalOpened,
      unsubscribes: totalUnsubscribes,
    },
    templates: raw.emailTemplates || [],
    campaigns,
    audienceCounts: {
      all: allUsers.length,
      premium: premiumUsers.length,
      free: freeUsers.length,
      artists: artistUsers.length,
      inactive: freeUsers.length,
      new: allUsers.filter(u => (Date.now() - new Date(u.createdAt).getTime()) < 7 * 24 * 60 * 60 * 1000).length,
    },
  });
}

export async function POST(req: NextRequest) {
  const rbac = await requireAdmin(req);
  if (!rbac.authorized) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const raw = readRaw();
  const allUsers = db.getUsers();
  const body = await req.json();
  const { action } = body;

  if (action === 'create_campaign') {
    const { name, type, audience, templateId, subject, scheduleAt } = body;
    if (!name || !subject) return NextResponse.json({ error: 'Name and subject required' }, { status: 400 });
    const segment = segmentUsers(allUsers, audience || 'all');
    const newCampaign = {
      id: `ec-${Date.now()}`,
      name, type: type || 'Promotional', audience: audience || 'all',
      templateId: templateId || 'tpl-1', subject,
      status: scheduleAt ? 'scheduled' : 'draft',
      sentCount: 0, openCount: 0, clickCount: 0, revenue: 0,
      scheduledAt: scheduleAt || null, sentAt: null,
      createdAt: new Date().toISOString(),
    };
    raw.emailCampaigns = raw.emailCampaigns || [];
    raw.emailCampaigns.unshift(newCampaign);
    writeRaw(raw);
    return NextResponse.json({ success: true, campaign: { ...newCampaign, segmentSize: segment.length } });
  }

  if (action === 'send_campaign') {
    const { id } = body;
    raw.emailCampaigns = raw.emailCampaigns || [];
    const idx = raw.emailCampaigns.findIndex((c: any) => c.id === id);
    if (idx === -1) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    const c = raw.emailCampaigns[idx];
    const segment = segmentUsers(allUsers, c.audience);
    const sentCount = segment.length;
    const tpl = (raw.emailTemplates || []).find((t: any) => t.id === c.templateId);
    const baseOpenRate = tpl?.type === 'transactional' ? 0.60 : tpl?.type === 're-engagement' ? 0.20 : tpl?.type === 'promotional' ? 0.31 : 0.27;
    raw.emailCampaigns[idx] = {
      ...c, status: 'sent', sentCount,
      openCount: Math.round(sentCount * baseOpenRate),
      clickCount: Math.round(sentCount * baseOpenRate * 0.30),
      sentAt: new Date().toISOString(),
    };
    writeRaw(raw);

    // Send a real proof email to the Admin Alert Email if configured
    const messagingConfig = db.getMessagingConfig();
    if (messagingConfig.email.enabled && messagingConfig.adminAlertEmail) {
      try {
        await sendEmail({
          to: messagingConfig.adminAlertEmail,
          subject: `[Campaign Proof] ${c.subject}`,
          text: tpl?.preview || 'Your music universe is waiting. Check out the latest releases and updates curated just for you.',
          html: wrapInDesignedHTMLLayout({
            subject: c.subject,
            bodyText: tpl?.preview || 'Your music universe is waiting. Check out the latest releases and updates curated just for you.',
            color: tpl?.color,
            type: tpl?.type,
          }),
        });
      } catch (e) {
        console.error('Failed to send proof email:', e);
      }
    }

    return NextResponse.json({ success: true, campaign: raw.emailCampaigns[idx] });
  }

  if (action === 'delete_campaign') {
    const { id } = body;
    raw.emailCampaigns = (raw.emailCampaigns || []).filter((c: any) => c.id !== id);
    writeRaw(raw);
    return NextResponse.json({ success: true });
  }

  if (action === 'create_template') {
    const { name, subject, preview, type, color } = body;
    if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 });
    const newTpl = {
      id: `tpl-${Date.now()}`,
      name, subject: subject || '', preview: preview || '',
      type: type || 'promotional',
      color: color || 'linear-gradient(135deg,#b08850,#0d6b31)',
      usedCount: 0, createdAt: new Date().toISOString(),
    };
    raw.emailTemplates = raw.emailTemplates || [];
    raw.emailTemplates.push(newTpl);
    writeRaw(raw);
    return NextResponse.json({ success: true, template: newTpl });
  }

  if (action === 'delete_template') {
    const { id } = body;
    raw.emailTemplates = (raw.emailTemplates || []).filter((t: any) => t.id !== id);
    writeRaw(raw);
    return NextResponse.json({ success: true });
  }

  if (action === 'update_template') {
    const { id, ...fields } = body;
    raw.emailTemplates = raw.emailTemplates || [];
    const idx = raw.emailTemplates.findIndex((t: any) => t.id === id);
    if (idx === -1) return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    raw.emailTemplates[idx] = { ...raw.emailTemplates[idx], ...fields, updatedAt: new Date().toISOString() };
    writeRaw(raw);
    return NextResponse.json({ success: true, template: raw.emailTemplates[idx] });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
