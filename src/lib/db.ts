import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { Track, UserPreferences, UserStats } from '@/types';
import { dbSupabase } from './dbSupabase';
import { getDbFilePath } from './dbPath';

const DB_FILE = getDbFilePath();
const DB_DIR = path.dirname(DB_FILE);

export interface UserEntity {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'USER' | 'ARTIST' | 'ADMIN' | 'SUPER_ADMIN' | 'MODERATOR' | 'ANALYST' | 'moderator' | 'analyst' | 'admin' | 'super_admin';
  isActive: boolean;
  phone?: string;
  createdAt: string;
  avatar?: string;
  coverImage?: string;
  subscription?: 'free' | 'premium' | 'family' | 'student' | 'creator';
  paymentMethod?: 'Visa' | 'Mastercard' | 'PayPal' | 'UPI' | 'Apple Pay' | 'Google Pay' | 'Net Banking' | 'Admin Plan';
  billingCycle?: 'Monthly' | 'Annual';
  country?: string;
  followers?: number;
  following?: number;
  likedSongs?: string[];
  savedAlbums?: string[];
  followedArtists?: string[];
  playlists?: string[];
  preferences?: UserPreferences;
  stats?: UserStats;
  bio?: string;
  verified?: boolean;
  verificationRequest?: {
    name: string;
    type: 'aadhaar' | 'pan';
    number: string;
    image: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    submittedAt: string;
  };
  customPermissions?: string[];
}

export interface OtpEntity {
  phone: string;
  code: string;
  attempts: number;
  expiresAt: string;
  createdAt: string;
}

export interface SessionEntity {
  id: string;
  userId: string;
  token: string;
  expiresAt: string;
  userAgent?: string;
  ipAddress?: string;
}

export interface TrackEntity extends Track {
  uploadedBy: string;
  uploadedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  featured?: boolean;
}

export interface TransactionEntity {
  id: string;
  userId: string;
  user: string;
  email: string;
  avatar?: string;
  amount: number;
  plan: string;
  method: string;
  date: string;
  dateTs: number;
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  currency: string;
  invoiceId: string;
  country: string;
  risk: 'low' | 'medium' | 'high';
  billingCycle: string;
  planLabel: string;
  refundReason?: string;
  refundAmount?: number;
}

export interface AdminNotificationEntity {
  id: string;
  title: string;
  message: string;
  audience: 'all' | 'premium' | 'free' | 'artists';
  type: 'push' | 'email' | 'in-app';
  status: 'sent' | 'failed' | 'scheduled' | 'draft';
  sentCount: number;
  deliveredCount: number;
  openedCount: number;
  ctr: number;
  sentAt: string;
  scheduledTime?: string;
}

export interface NotificationTemplateEntity {
  id: string;
  name: string;
  type: 'push' | 'email' | 'in-app';
  preview: string;
  createdAt: string;
}

export interface TicketMessage {
  sender: string;
  text: string;
  time: string;
  timestamp: number;
}

export interface SupportTicketEntity {
  id: string;
  user: string;
  email: string;
  subject: string;
  category: 'billing' | 'technical' | 'account' | 'content';
  priority: 'urgent' | 'high' | 'medium' | 'low';
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  created: string;
  message: string;
  thread: TicketMessage[];
  slaHours: number;
  elapsedHours: number;
  updatedAt: string;
  attachments?: string[];
  assignedDept?: string;
  rating?: number;
  ratingComment?: string;
  internalNotes?: TicketMessage[];
}

export interface CannedReplyEntity {
  id: string;
  title: string;
  text: string;
}

export interface PayoutMethodEntity {
  type: 'bank' | 'paypal' | 'stripe' | 'wise' | 'payoneer';
  emailOrAccount: string;
  routingOrCode?: string;
  verified: boolean;
}

export interface ArtistPayoutEntity {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  lifetimeEarnings: number;
  availableBalance: number;
  pendingBalance: number;
  estimatedNextPayout: number;
  fraudScore: number;
  kycStatus: 'pending' | 'verified' | 'unverified';
  taxVerified: boolean;
  paymentMethod?: PayoutMethodEntity;
}

export interface PayoutStreamEntity {
  id: string;
  trackId: string;
  artistId: string;
  userId: string;
  country: string;
  isPremium: boolean;
  timestamp: string;
  ipAddress?: string;
  isFlagged?: boolean;
  adRevenue?: number;
  device?: string;
  city?: string;
}

export interface WithdrawalRequestEntity {
  id: string;
  artistId: string;
  artistName: string;
  amount: number;
  method: 'bank' | 'paypal' | 'stripe' | 'wise' | 'payoneer';
  status: 'pending' | 'review' | 'approved' | 'processing' | 'completed' | 'failed' | 'held';
  created: string;
  updated: string;
  fraudScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  details?: Record<string, string>;
  disputed?: boolean;
}

export interface PayoutDisputeEntity {
  id: string;
  artistId: string;
  artistName: string;
  issue: string;
  evidence: string;
  adminResponse?: string;
  status: 'open' | 'investigating' | 'resolved' | 'rejected';
  created: string;
  updated: string;
}

export interface PayoutAuditLogEntity {
  id: string;
  action: string;
  performedBy: string;
  targetId: string;
  details: string;
  timestamp: string;
}

export interface PayoutTaxRecordEntity {
  id: string;
  artistId: string;
  year: string;
  type: '1099-MISC' | 'W-8BEN' | '1042-S';
  totalEarnings: number;
  withheldAmount: number;
  status: 'Available' | 'Processing';
  url: string;
}

export interface ApiKeyEntity {
  id: string;
  name: string;
  key: string;
  env: 'prod' | 'staging' | 'dev';
  perms: string[];
  rateLimit: number;
  status: 'active' | 'revoked';
  lastUsed: string;
  ipWhitelist?: string[];
  expiresAt?: string;
  tier?: 'Bronze' | 'Silver' | 'Gold' | 'Custom';
  createdAt?: string;
}

export interface WebhookEntity {
  id: string;
  url: string;
  description?: string;
  events: string[];
  status: 'active' | 'inactive';
  signingSecret: string;
  createdAt: string;
}

export interface WebhookLogEntity {
  id: string;
  webhookId: string;
  webhookUrl: string;
  event: string;
  status: number;
  statusText: string;
  payload: string;
  response: string;
  timestamp: string;
  durationMs: number;
}


export interface FeatureFlagEntity {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  rollout: number;
  audience: string;
  whitelist?: string[];
}

export interface ExperimentEntity {
  id: string;
  name: string;
  description: string;
  status: 'Running' | 'Completed' | 'Paused';
  started: string;
  variants: { name: string; traffic: number; metric: string; value: string }[];
  primaryMetric: string;
  impact: string;
  winner?: string;
}

export interface AuditLogEntity {
  id: string;
  userId: string;
  userName: string;
  action: string;
  target: string;
  ipAddress?: string;
  location?: string;
  timestamp: string;
  result: 'success' | 'failure' | 'warning';
  category: 'Admin Actions' | 'Security Events' | 'System Events';
  severity: 'low' | 'medium' | 'high';
}

export interface SystemServiceEntity {
  name: string;
  uptime: number;
  respMs: number;
  rpm: number;
  status: 'operational' | 'degraded' | 'down';
}

export interface MessagingConfigEntity {
  email: {
    enabled: boolean;
    host: string;
    port: number;
    secure: boolean;
    user: string;
    pass: string;
    fromName: string;
    fromAddress: string;
  };
  whatsapp: {
    enabled: boolean;
    provider: 'meta' | 'twilio';
    accessToken: string;
    phoneNumberId: string;
    fromNumber: string;
    businessAccountId: string;
  };
  sms: {
    enabled: boolean;
    provider: 'twilio';
    accountSid: string;
    authToken: string;
    fromNumber: string;
  };
  adminAlertEmail: string;
  adminAlertPhone: string;
}

export interface AutomationRuleEntity {
  id: string;
  name: string;
  event: 'user.signup' | 'user.login' | 'artist.apply' | 'payment.success' | 'track.approved' | 'track.rejected' | 'subscription.cancelled';
  enabled: boolean;
  userAction: {
    channel: 'email' | 'whatsapp' | 'sms' | 'none';
    subject?: string;
    template: string;
  };
  adminAction: {
    channel: 'email' | 'whatsapp' | 'sms' | 'none';
    template: string;
  };
  createdAt: string;
  updatedAt: string;
  lastFiredAt?: string;
  fireCount: number;
}

export interface PlatformSettingsEntity {
  general: {
    platformName: string;
    description: string;
    supportEmail: string;
    maxUploadMB: number;
    defaultLanguage: string;
    logoUrl: string;
    websiteUrl: string;
    timezone: string;
  };
  content: {
    explicitContent: boolean;
    aiCopyright: boolean;
    autoRejectThreshold: number;
    maxTrackMinutes: number;
    allowUserUploads: boolean;
    requireArtistVerification: boolean;
  };
  billing: {
    trialDays: number;
    graceDays: number;
    autoRenewal: boolean;
    refundDays: number;
    platformFee: number;
    currency: string;
  };
  notifications: {
    emailNotifs: boolean;
    pushNotifs: boolean;
    smsNotifs: boolean;
    marketingEmails: boolean;
    digestFreq: string;
  };
  security: {
    maintenanceMode: boolean;
    mfaRequired: boolean;
    sessionTimeout: number;
    ipAllowlist: string;
    rateLimit: number;
  };
  updatedAt: string;
}

export interface CampaignEntity {
  id: string;
  artistId: string;
  name: string;
  track: string;
  budget: number;
  spent: number;
  impressions: number;
  ctr: string;
  status: string;
}

export interface LiveEventEntity {
  id: string;
  artistId: string;
  name: string;
  date: string;
  time: string;
  location: string;
  price: string;
}

export interface FanCommentEntity {
  id: string;
  artistId: string;
  user: string;
  text: string;
  track: string;
  time: string;
  reply: string;
}

export interface ArtistApplicationEntity {
  id: string;
  userId: string;
  artistName: string;
  dob?: string;
  bio: string;
  country: string;
  profileImage: string;
  socialLinks: { instagram?: string; twitter?: string; website?: string };
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}

export interface MerchItemEntity {
  id: string;
  artistId: string;
  name: string;
  price: number;
  stock: number;
  sales: number;
  emoji: string;
}

export interface MerchSalesLogEntity {
  id: string;
  artistId: string;
  buyer: string;
  item: string;
  amount: number;
  time: string;
}

export interface CollabSplitEntity {
  id: string;
  artistId: string;
  track: string;
  collaborator: string;
  role: string;
  share: number;
  status: string;
}

export interface PitchEntity {
  id: string;
  artistId: string;
  track: string;
  curator: string;
  status: string;
  pitchDate: string;
  feedback: string;
}

export interface SoundKitEntity {
  id: string;
  artistId: string;
  name: string;
  price: number;
  size: string;
  downloads: number;
  emoji: string;
}

export interface PlannerTaskEntity {
  id: string;
  artistId: string;
  task: string;
  category: string;
  done: boolean;
}

export interface DemoEntity {
  id: string;
  artistId: string;
  title: string;
  duration: string;
  date: string;
  file: string;
}

export interface ContractEntity {
  id: string;
  artistId: string;
  title: string;
  type: string;
  party: string;
  date: string;
  status: string;
}

export interface NewsletterEntity {
  id: string;
  artistId: string;
  subject: string;
  sentTo: string;
  openRate: string;
  date: string;
}

export interface LyricSyncLine {
  time: string;
  text: string;
}

export interface TrackLyricsEntity {
  trackId: string;
  artistId: string;
  text: string;
  timeline: LyricSyncLine[];
}

export interface TicketSalesEntity {
  artistId: string;
  totalRevenue: number;
  ticketsSold: number;
  recentSales: {
    id: string;
    buyer: string;
    event: string;
    tickets: number;
    amount: number;
    time: string;
  }[];
}

interface DatabaseSchema {
  users: UserEntity[];
  otps: OtpEntity[];
  sessions: SessionEntity[];
  tracks: TrackEntity[];
  transactions?: TransactionEntity[];
  planPrices?: Record<string, number>;
  globalCurrency?: string;
  adminNotifications?: AdminNotificationEntity[];
  notificationTemplates?: NotificationTemplateEntity[];
  supportTickets?: SupportTicketEntity[];
  cannedReplies?: CannedReplyEntity[];
  payoutArtists?: ArtistPayoutEntity[];
  payoutStreams?: PayoutStreamEntity[];
  payoutWithdrawalRequests?: WithdrawalRequestEntity[];
  payoutDisputes?: PayoutDisputeEntity[];
  payoutAuditLogs?: PayoutAuditLogEntity[];
  payoutTaxRecords?: PayoutTaxRecordEntity[];
  apiKeys?: ApiKeyEntity[];
  webhooks?: WebhookEntity[];
  webhookLogs?: WebhookLogEntity[];
  featureFlags?: FeatureFlagEntity[];
  experiments?: ExperimentEntity[];
  systemServices?: SystemServiceEntity[];
  generalAuditLogs?: AuditLogEntity[];
  messagingConfig?: MessagingConfigEntity;
  automationRules?: AutomationRuleEntity[];
  platformSettings?: PlatformSettingsEntity;
  campaigns?: CampaignEntity[];
  events?: LiveEventEntity[];
  comments?: FanCommentEntity[];
  merchItems?: MerchItemEntity[];
  merchSalesLog?: MerchSalesLogEntity[];
  collabSplits?: CollabSplitEntity[];
  pitches?: PitchEntity[];
  soundKits?: SoundKitEntity[];
  plannerTasks?: PlannerTaskEntity[];
  demos?: DemoEntity[];
  contracts?: ContractEntity[];
  newsletters?: NewsletterEntity[];
  trackLyrics?: TrackLyricsEntity[];
  ticketSales?: TicketSalesEntity[];
  profileViews?: Record<string, number>;
  artistProfiles?: Record<string, any>;
  artistApplications?: ArtistApplicationEntity[];
}



function ensureDbExists() {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }

    if (!fs.existsSync(DB_FILE)) {
    // Seed default users
    const hashed = bcrypt.hashSync('password', 10);
    const initialData: DatabaseSchema = {
      users: [
        {
          id: 'user-1',
          name: 'Manoj Lastro',
          email: 'manoj@beato.io',
          passwordHash: hashed,
          role: 'USER',
          isActive: true,
          phone: '+919999999999',
          createdAt: new Date().toISOString(),
          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop',
          subscription: 'free',
          country: 'IN',
          followers: 120,
          following: 80,
          likedSongs: [],
          savedAlbums: [],
          followedArtists: [],
          playlists: [],
        },
        {
          id: 'artist-user-1',
          name: 'Aurora Nightfall',
          email: 'artist@beato.com',
          passwordHash: hashed,
          role: 'ARTIST',
          isActive: true,
          phone: '+918888888888',
          createdAt: new Date().toISOString(),
          avatar: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=100&h=100&fit=crop',
          subscription: 'creator',
          country: 'IN',
          followers: 2400,
          following: 150,
          likedSongs: [],
          savedAlbums: [],
          followedArtists: [],
          playlists: [],
        },
        {
          id: 'admin-user-1',
          name: 'Platform Moderator',
          email: 'admin@beato.com',
          passwordHash: hashed,
          role: 'ADMIN',
          isActive: true,
          createdAt: new Date().toISOString(),
          avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&h=100&fit=crop',
          subscription: 'premium',
          country: 'IN',
          followers: 10,
          following: 10,
          likedSongs: [],
          savedAlbums: [],
          followedArtists: [],
          playlists: [],
        },
        {
          id: 'superadmin-user-1',
          name: 'Root Administrator',
          email: 'superadmin@beato.com',
          passwordHash: hashed,
          role: 'SUPER_ADMIN',
          isActive: true,
          createdAt: new Date().toISOString(),
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop',
          subscription: 'premium',
          country: 'IN',
          followers: 5,
          following: 5,
          likedSongs: [],
          savedAlbums: [],
          followedArtists: [],
          playlists: [],
        },
        // Mock Artists Seed
        {
          id: 'artist-1',
          name: 'Aurora Nightfall',
          email: 'auroranightfall@beato.io',
          passwordHash: hashed,
          role: 'ARTIST',
          isActive: true,
          createdAt: new Date().toISOString(),
          avatar: 'https://images.unsplash.com/photo-1516912481808-3406841bd33c?w=100&h=100&fit=crop',
          country: 'US',
          followers: 4820000,
          following: 120,
          likedSongs: [],
          savedAlbums: [],
          followedArtists: [],
          playlists: [],
        },
        {
          id: 'artist-2',
          name: 'Cipher Nova',
          email: 'ciphernova@beato.io',
          passwordHash: hashed,
          role: 'ARTIST',
          isActive: true,
          createdAt: new Date().toISOString(),
          avatar: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=100&h=100&fit=crop',
          country: 'US',
          followers: 7200000,
          following: 120,
          likedSongs: [],
          savedAlbums: [],
          followedArtists: [],
          playlists: [],
        },
        {
          id: 'artist-3',
          name: 'Selene Ray',
          email: 'seleneray@beato.io',
          passwordHash: hashed,
          role: 'ARTIST',
          isActive: true,
          createdAt: new Date().toISOString(),
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop',
          country: 'US',
          followers: 22000000,
          following: 120,
          likedSongs: [],
          savedAlbums: [],
          followedArtists: [],
          playlists: [],
        },
        {
          id: 'artist-4',
          name: 'The Velvet Echoes',
          email: 'thevelvetechoes@beato.io',
          passwordHash: hashed,
          role: 'ARTIST',
          isActive: true,
          createdAt: new Date().toISOString(),
          avatar: 'https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=100&h=100&fit=crop',
          country: 'GB',
          followers: 3100000,
          following: 120,
          likedSongs: [],
          savedAlbums: [],
          followedArtists: [],
          playlists: [],
        },
        {
          id: 'artist-5',
          name: 'Nyx & Prometheus',
          email: 'nyx&prometheus@beato.io',
          passwordHash: hashed,
          role: 'ARTIST',
          isActive: true,
          createdAt: new Date().toISOString(),
          avatar: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=100&h=100&fit=crop',
          country: 'US',
          followers: 2800000,
          following: 120,
          likedSongs: [],
          savedAlbums: [],
          followedArtists: [],
          playlists: [],
        },
        {
          id: 'artist-6',
          name: 'Marco Santos',
          email: 'marcosantos@beato.io',
          passwordHash: hashed,
          role: 'ARTIST',
          isActive: true,
          createdAt: new Date().toISOString(),
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
          country: 'BR',
          followers: 1900000,
          following: 120,
          likedSongs: [],
          savedAlbums: [],
          followedArtists: [],
          playlists: [],
        },
      ],
      otps: [],
      sessions: [],
      tracks: [],
    };
      fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
    }
  } catch (e: any) {
    console.warn('ensureDbExists failed (falling back to memory):', e.message);
  }
}

let cachedDb: DatabaseSchema | null = null;
let lastModifiedTime: number = 0;

function readDb(): DatabaseSchema {
  if (cachedDb && (process.env.DATABASE_MODE === 'supabase' || !fs.existsSync(DB_FILE))) {
    return cachedDb;
  }
  ensureDbExists();
  try {
    if (!fs.existsSync(DB_FILE)) {
      if (!cachedDb) {
        cachedDb = { users: [], otps: [], sessions: [], tracks: [], transactions: [], planPrices: { free: 0, student: 4.99, premium: 9.99, family: 15.99, creator: 19.99 } };
      }
      return cachedDb;
    }
    const stat = fs.statSync(DB_FILE);
    const mtime = stat.mtimeMs;
    if (cachedDb && mtime === lastModifiedTime) {
      return cachedDb;
    }
    
    // Concurrency-safe read with retries
    let data = '';
    let parsed: any = null;
    let retries = 5;
    while (retries > 0) {
      try {
        data = fs.readFileSync(DB_FILE, 'utf-8');
        parsed = JSON.parse(data);
        break;
      } catch (err: any) {
        retries--;
        if (retries === 0) throw err;
        const waitTill = new Date(new Date().getTime() + 50);
        while (waitTill > new Date()) {}
      }
    }
    parsed.tracks = parsed.tracks || [];
    parsed.transactions = parsed.transactions || [];
    parsed.planPrices = parsed.planPrices || { free: 0, student: 4.99, premium: 9.99, family: 15.99, creator: 19.99 };
    parsed.adminNotifications = parsed.adminNotifications || [];
    parsed.notificationTemplates = parsed.notificationTemplates || [];
    parsed.supportTickets = parsed.supportTickets || [];
    parsed.cannedReplies = parsed.cannedReplies || [];
    parsed.payoutArtists = parsed.payoutArtists || [];
    parsed.payoutStreams = parsed.payoutStreams || [];
    parsed.payoutWithdrawalRequests = parsed.payoutWithdrawalRequests || [];
    parsed.payoutDisputes = parsed.payoutDisputes || [];
    parsed.payoutAuditLogs = parsed.payoutAuditLogs || [];
    parsed.payoutTaxRecords = parsed.payoutTaxRecords || [];
    parsed.apiKeys = parsed.apiKeys || [];
    parsed.webhooks = parsed.webhooks || [];
    parsed.webhookLogs = parsed.webhookLogs || [];
    parsed.featureFlags = parsed.featureFlags || [];
    parsed.experiments = parsed.experiments || [];
    parsed.systemServices = parsed.systemServices || [];
    parsed.generalAuditLogs = parsed.generalAuditLogs || [];
    parsed.artistApplications = parsed.artistApplications || [];

    // Migration logic to remove fake data and link tickets ONLY to real registered database users
    const activeEmails = new Set(parsed.users.map((u: any) => u.email.toLowerCase().trim()));
    let migrated = false;

    // Migrate old API keys that don't have new properties
    parsed.apiKeys.forEach((key: any) => {
      if (key.tier === undefined) {
        key.tier = 'Custom';
        migrated = true;
      }
      if (key.ipWhitelist === undefined) {
        key.ipWhitelist = [];
        migrated = true;
      }
      if (key.expiresAt === undefined) {
        key.expiresAt = 'Never';
        migrated = true;
      }
      if (key.createdAt === undefined) {
        key.createdAt = new Date(Date.now() - 86400000 * 5).toISOString();
        migrated = true;
      }
    });

    if (parsed.apiKeys.length === 0) {
      parsed.apiKeys = [
        { id: 'key-1', name: 'Mobile App', key: 'sk_live_1234567890abcdef3f8a', env: 'prod', perms: ['read tracks', 'read playlists'], rateLimit: 5000, status: 'active', lastUsed: '2 min ago', createdAt: new Date(Date.now() - 86400000 * 30).toISOString(), tier: 'Silver', ipWhitelist: ['192.168.1.0/24'], expiresAt: 'Never' },
        { id: 'key-2', name: 'Web Player', key: 'sk_live_0987654321fedcba7b2c', env: 'prod', perms: ['read tracks', 'write playlists', 'read analytics'], rateLimit: 10000, status: 'active', lastUsed: '1 min ago', createdAt: new Date(Date.now() - 86400000 * 15).toISOString(), tier: 'Gold', ipWhitelist: [], expiresAt: 'Never' },
        { id: 'key-3', name: 'Partner Integration', key: 'sk_live_1122334455aabbcc4d9e', env: 'prod', perms: ['read tracks', 'access analytics'], rateLimit: 2000, status: 'active', lastUsed: '1h ago', createdAt: new Date(Date.now() - 86400000 * 5).toISOString(), tier: 'Bronze', ipWhitelist: ['45.56.78.90'], expiresAt: new Date(Date.now() + 86400000 * 180).toISOString() }
      ];
      migrated = true;
    }
    if (parsed.webhooks.length === 0) {
      parsed.webhooks = [
        {
          id: 'wh-1',
          url: 'https://api.partner-services.com/v1/beato-webhook',
          description: 'Production Sync for partner catalog',
          events: ['track.created', 'playlist.updated'],
          status: 'active',
          signingSecret: 'whsec_9b2e8c459fcd7d1a2c3b4e5f60718293',
          createdAt: new Date(Date.now() - 86400000 * 3).toISOString()
        },
        {
          id: 'wh-2',
          url: 'https://analytics-collector.net/webhooks/tracks',
          description: 'Raw listening analytics stream',
          events: ['track.played'],
          status: 'inactive',
          signingSecret: 'whsec_a3b2c1d0e9f8a7b6c5d4e3f2b1a0f9e8',
          createdAt: new Date(Date.now() - 86400000 * 10).toISOString()
        }
      ];
      migrated = true;
    }
    if (parsed.webhookLogs.length === 0) {
      parsed.webhookLogs = [
        {
          id: 'whlog-1',
          webhookId: 'wh-1',
          webhookUrl: 'https://api.partner-services.com/v1/beato-webhook',
          event: 'track.created',
          status: 200,
          statusText: 'OK',
          payload: JSON.stringify({ event: 'track.created', data: { id: 'track-1', title: 'Neon Dreams', artist: 'Aurora Nightfall' } }),
          response: JSON.stringify({ success: true, received: true }),
          timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
          durationMs: 145
        },
        {
          id: 'whlog-2',
          webhookId: 'wh-1',
          webhookUrl: 'https://api.partner-services.com/v1/beato-webhook',
          event: 'playlist.updated',
          status: 502,
          statusText: 'Bad Gateway',
          payload: JSON.stringify({ event: 'playlist.updated', data: { id: 'playlist-1', title: 'Workout Energy' } }),
          response: '<html><body>502 Bad Gateway</body></html>',
          timestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
          durationMs: 820
        }
      ];
      migrated = true;
    }
    if (parsed.featureFlags.length === 0) {
      parsed.featureFlags = [
        { id: 'lossless', name: 'Lossless Audio', description: 'Hi-res FLAC streaming for premium users', enabled: true, rollout: 23, audience: 'Premium', whitelist: [] },
        { id: 'live_sessions', name: 'Artist Live Sessions', description: 'Real-time live audio streaming for artists', enabled: false, rollout: 0, audience: 'All', whitelist: [] },
        { id: 'collab_playlists', name: 'Collaborative Playlists', description: 'Multi-user playlist editing', enabled: true, rollout: 100, audience: 'All', whitelist: [] },
        { id: 'ai_dj', name: 'AI DJ Mode', description: 'AI-generated continuous mixes', enabled: true, rollout: 5, audience: 'Beta Testers', whitelist: [] }
      ];
      migrated = true;
    }
    
    parsed.featureFlags.forEach((flag: any) => {
      if (flag.whitelist === undefined) {
        flag.whitelist = [];
        migrated = true;
      }
    });
    if (parsed.experiments.length === 0) {
      parsed.experiments = [
        {
          id: 'exp-1', name: 'New Onboarding Flow', description: 'Tests a simplified 3-step onboarding vs the current 7-step flow.',
          status: 'Running', started: '2 weeks ago', primaryMetric: 'Conversion Rate', impact: '+3.5%',
          variants: [
            { name: 'Control', traffic: 50, metric: 'Conversion', value: '12.3%' },
            { name: 'Variant A', traffic: 50, metric: 'Conversion', value: '15.8%' },
          ],
        },
        {
          id: 'exp-2', name: 'Premium Upsell Banner', description: 'Tests 3 upsell banner designs against control in free-tier user sessions.',
          status: 'Running', started: '5 days ago', primaryMetric: 'Revenue Impact', impact: '+8.2%',
          variants: [
            { name: 'Control', traffic: 25, metric: 'Revenue', value: '$0 delta' },
            { name: 'Variant A', traffic: 25, metric: 'Revenue', value: '+$4.1K' },
            { name: 'Variant B', traffic: 25, metric: 'Revenue', value: '+$8.2K' },
            { name: 'Variant C', traffic: 25, metric: 'Revenue', value: '+$5.9K' },
          ],
        }
      ];
      migrated = true;
    }
    if (parsed.systemServices.length === 0) {
      parsed.systemServices = [
        { name: 'Auth API', uptime: 99.99, respMs: 42, rpm: 28400, status: 'operational' },
        { name: 'Music Streaming', uptime: 99.97, respMs: 88, rpm: 142000, status: 'operational' },
        { name: 'Payment API', uptime: 100, respMs: 210, rpm: 3200, status: 'operational' },
        { name: 'Recommendation Engine', uptime: 99.84, respMs: 380, rpm: 18200, status: 'degraded' },
        { name: 'Search API', uptime: 99.96, respMs: 55, rpm: 48000, status: 'operational' },
        { name: 'Upload Service', uptime: 99.90, respMs: 540, rpm: 820, status: 'operational' },
        { name: 'Notification Service', uptime: 99.99, respMs: 28, rpm: 4100, status: 'operational' },
        { name: 'Analytics Service', uptime: 99.78, respMs: 280, rpm: 9400, status: 'degraded' }
      ];
      migrated = true;
    }
    parsed.generalAuditLogs = parsed.generalAuditLogs || [];
    const origAuditLen = parsed.generalAuditLogs.length;
    // Purge fake seeded logs and simulated threat/event logs
    parsed.generalAuditLogs = parsed.generalAuditLogs.filter(
      (l: any) => l.id !== 'audit-1' && l.id !== 'audit-2' && !l.id.startsWith('audit-17')
    );
    if (parsed.generalAuditLogs.length === 0) {
      parsed.generalAuditLogs = [
        {
          id: 'audit-real-1',
          userId: 'user-1780052773758',
          userName: 'Manoj S',
          action: 'user_signup',
          target: 'Manoj S (manoj2104s@gmail.com)',
          ipAddress: '192.168.1.10',
          location: 'Chennai, IN',
          timestamp: '2026-05-29 12:00:00',
          result: 'success',
          category: 'Admin Actions',
          severity: 'low'
        },
        {
          id: 'audit-real-2',
          userId: 'user-1780052773758',
          userName: 'Manoj S',
          action: 'track_uploaded',
          target: 'Nandhini',
          ipAddress: '192.168.1.10',
          location: 'Chennai, IN',
          timestamp: '2026-05-29 12:48:44',
          result: 'success',
          category: 'Admin Actions',
          severity: 'low'
        },
        {
          id: 'audit-real-3',
          userId: 'admin-user-1',
          userName: 'Platform Moderator',
          action: 'track_approved',
          target: 'Nandhini',
          ipAddress: '192.168.1.5',
          location: 'Internal',
          timestamp: '2026-05-29 12:55:00',
          result: 'success',
          category: 'Admin Actions',
          severity: 'low'
        },
        {
          id: 'audit-real-4',
          userId: 'anonymous_user',
          userName: 'Sarath K',
          action: 'login_failed',
          target: 'Account Lockout Warning',
          ipAddress: '192.168.1.12',
          location: 'Chennai, IN',
          timestamp: '2026-05-29 12:59:00',
          result: 'warning',
          category: 'Security Events',
          severity: 'medium'
        },
        {
          id: 'audit-real-5',
          userId: 'user-1780055707319',
          userName: 'Sarath K',
          action: 'user_signup',
          target: 'Sarath K (manoj9345635571@gmail.com)',
          ipAddress: '192.168.1.12',
          location: 'Chennai, IN',
          timestamp: '2026-05-29 13:00:00',
          result: 'success',
          category: 'Admin Actions',
          severity: 'low'
        },
        {
          id: 'audit-real-6',
          userId: 'user-1780052773758',
          userName: 'Manoj S',
          action: 'track_uploaded',
          target: 'Manoj nandhini',
          ipAddress: '192.168.1.10',
          location: 'Chennai, IN',
          timestamp: '2026-05-29 13:06:26',
          result: 'success',
          category: 'Admin Actions',
          severity: 'low'
        },
        {
          id: 'audit-real-7',
          userId: 'admin-user-1',
          userName: 'Platform Moderator',
          action: 'track_approved',
          target: 'Manoj nandhini',
          ipAddress: '192.168.1.5',
          location: 'Internal',
          timestamp: '2026-05-29 13:10:00',
          result: 'success',
          category: 'Admin Actions',
          severity: 'low'
        },
        {
          id: 'audit-real-8',
          userId: 'user-1780373949284',
          userName: 'Nandhini',
          action: 'user_signup',
          target: 'Nandhini (nsugu433@gmail.com)',
          ipAddress: '192.168.1.15',
          location: 'Chennai, IN',
          timestamp: '2026-06-01 10:00:00',
          result: 'success',
          category: 'Admin Actions',
          severity: 'low'
        }
      ];
      migrated = true;
    } else if (parsed.generalAuditLogs.length !== origAuditLen) {
      migrated = true;
    }

    let supportTickets = parsed.supportTickets;
    const originalLen = supportTickets.length;

    // Filter tickets: keep only those matching active emails
    supportTickets = supportTickets.filter((t: any) => t.email && activeEmails.has(t.email.toLowerCase().trim()));

    // Seed default support tickets if none remain, or if there is no ticket for manoj@beato.io
    if (supportTickets.length === 0 || !supportTickets.some((t: any) => t.email.toLowerCase().trim() === 'manoj@beato.io')) {
      supportTickets = [
        {
          id: 'TKT-1001',
          user: 'Manoj Lastro',
          email: 'manoj@beato.io',
          subject: 'Unable to process payment',
          category: 'billing',
          priority: 'urgent',
          status: 'open',
          created: new Date(Date.now() - 3600000 * 2).toISOString().replace('T', ' ').slice(0, 16),
          message: 'My card keeps getting declined even though it works on other sites. I tried 3 different cards.',
          thread: [
            { sender: 'Support', text: 'We are looking into this payment issue with our gateway.', time: new Date(Date.now() - 3600000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), timestamp: Date.now() - 3600000 }
          ],
          slaHours: 2,
          elapsedHours: 2.0,
          updatedAt: new Date().toISOString(),
          attachments: ['payment_receipt_declined.png'],
          assignedDept: 'Billing & Subscriptions',
          internalNotes: []
        },
        {
          id: 'TKT-1002',
          user: 'Platform Moderator',
          email: 'admin@beato.com',
          subject: 'Clarification regarding creator payouts',
          category: 'billing',
          priority: 'high',
          status: 'in-progress',
          created: new Date(Date.now() - 3600000 * 5).toISOString().replace('T', ' ').slice(0, 16),
          message: 'When are creator streaming payouts calculated for the second quarter of the fiscal year?',
          thread: [],
          slaHours: 4,
          elapsedHours: 5.0,
          updatedAt: new Date().toISOString(),
          attachments: [],
          assignedDept: 'Billing & Subscriptions',
          internalNotes: [
            { sender: 'Support', text: 'Spoke with the finance team, calculation begins next week.', time: '10:30 AM', timestamp: Date.now() - 3600000 * 4 }
          ]
        }
      ];
      migrated = true;
    }

    // Seed canned replies if missing
    let cannedReplies = parsed.cannedReplies;
    if (cannedReplies.length === 0) {
      cannedReplies = [
        {
          id: 'CR-1',
          title: 'Billing Inquiry Template',
          text: 'Thank you for contacting Beato Billing Support. We have verified your transaction and can confirm that your payment has been received and processed successfully. Your account tier has been updated. Please let us know if we can assist you with anything else!'
        },
        {
          id: 'CR-2',
          title: 'Playback Troubleshooting',
          text: 'We are sorry to hear you are experiencing playback issues. Please try: (1) Logging out and back in, (2) Clearing your browser cache, (3) Trying a different browser or private session, or (4) Disabling any active adblockers. Let us know if the issue persists.'
        },
        {
          id: 'CR-3',
          title: 'Account Security Verification',
          text: 'For your security, we have temporarily locked the settings on your account. To proceed with verification, please reply to this ticket confirming the last 4 digits of your registered card and your country of registration. Thank you!'
        },
        {
          id: 'CR-4',
          title: 'General Ticket Closeout',
          text: 'We have not heard back from you in a while, so we will mark this support ticket as resolved for now. If you still need help, feel free to reopen this ticket by replying or submit a new ticket. Have a wonderful day!'
        }
      ];
      parsed.cannedReplies = cannedReplies;
      migrated = true;
    }

    // Seeding Artists Payouts
    const artistsInDb = parsed.users.filter((u: any) => u.role === 'ARTIST');
    if (parsed.payoutArtists.length === 0 && artistsInDb.length > 0) {
      parsed.payoutArtists = artistsInDb.map((artist: any) => {
        return {
          id: artist.id,
          name: artist.name,
          email: artist.email,
          avatar: artist.avatar,
          lifetimeEarnings: 0.00,
          availableBalance: 0.00,
          pendingBalance: 0.00,
          estimatedNextPayout: 0.00,
          fraudScore: 0,
          kycStatus: 'verified',
          taxVerified: true,
          paymentMethod: {
            type: 'bank',
            emailOrAccount: 'Not Configured',
            routingOrCode: '',
            verified: false
          }
        };
      });
      migrated = true;
    }

    // Seeding Withdrawal Requests (Start empty)
    if (parsed.payoutWithdrawalRequests.length === 0) {
      parsed.payoutWithdrawalRequests = [];
      migrated = true;
    }

    // Seeding Payout Disputes (Start empty)
    if (parsed.payoutDisputes.length === 0) {
      parsed.payoutDisputes = [];
      migrated = true;
    }

    // Seeding Payout Tax Records (Start empty)
    if (parsed.payoutTaxRecords.length === 0) {
      parsed.payoutTaxRecords = [];
      migrated = true;
    }

    // Seeding Payout Audit Logs (Start empty)
    if (parsed.payoutAuditLogs.length === 0) {
      parsed.payoutAuditLogs = [];
      migrated = true;
    }

    // Seeding campaigns
    if (!parsed.campaigns || parsed.campaigns.length === 0) {
      parsed.campaigns = [
        { id: 'c1', artistId: 'user-1780052773758', name: 'Summer Vibes Showcase', track: 'Mutta Kalakki | Youth | Ken Karunaas', budget: 150, spent: 45, impressions: 12050, ctr: '2.4%', status: 'Active' },
        { id: 'c2', artistId: 'user-1780052773758', name: 'Chill Sessions Boost', track: 'Nandhini', budget: 100, spent: 100, impressions: 28400, ctr: '3.1%', status: 'Completed' }
      ];
      migrated = true;
    }

    // Seeding events
    if (!parsed.events || parsed.events.length === 0) {
      parsed.events = [
        { id: 'e1', artistId: 'user-1780052773758', name: 'Cosmic Listening Party (Online)', date: 'June 20, 2026', time: '8:00 PM IST', location: 'Beato Live Stream', price: 'Free' },
        { id: 'e2', artistId: 'user-1780052773758', name: 'Live at Indiranagar Social', date: 'July 5, 2026', time: '9:30 PM IST', location: 'Bengaluru, India', price: '₹499' }
      ];
      migrated = true;
    }

    // Seeding comments
    if (!parsed.comments || parsed.comments.length === 0) {
      parsed.comments = [
        { id: 'fc1', artistId: 'user-1780052773758', user: 'Nandhini', text: 'This drop on Mutta Kalakki is absolutely stellar! On repeat.', track: 'Mutta Kalakki | Youth | Ken Karunaas', time: '2 hours ago', reply: '' },
        { id: 'fc2', artistId: 'user-1780052773758', user: 'Sarath K', text: 'Incredible vocals in Nandhini. Brings back memories.', track: 'Nandhini', time: '1 day ago', reply: 'Thank you Sarath!' },
        { id: 'fc3', artistId: 'user-1780052773758', user: 'Manoj Lastro', text: 'Perfect ambient study vibes. Thank you!', track: 'Manoj nandhini', time: '3 days ago', reply: '' }
      ];
      migrated = true;
    }

    // Seeding merchItems
    if (!parsed.merchItems || parsed.merchItems.length === 0) {
      parsed.merchItems = [
        { id: 'm1', artistId: 'user-1780052773758', name: 'Neon Dreams Limited Edition Vinyl', price: 29.99, stock: 45, sales: 120, emoji: '💿' },
        { id: 'm2', artistId: 'user-1780052773758', name: 'Beato Classic Logo Hoodie', price: 45.00, stock: 15, sales: 85, emoji: '🧥' },
        { id: 'm3', artistId: 'user-1780052773758', name: 'Aurora Synth Ceramic Mug', price: 14.99, stock: 90, sales: 14, emoji: '☕' }
      ];
      migrated = true;
    }

    // Seeding merchSalesLog
    if (!parsed.merchSalesLog || parsed.merchSalesLog.length === 0) {
      parsed.merchSalesLog = [
        { id: 'msl-1', artistId: 'user-1780052773758', buyer: 'Sarath K', item: 'Neon Dreams Limited Edition Vinyl', amount: 29.99, time: '3m ago' },
        { id: 'msl-2', artistId: 'user-1780052773758', buyer: 'Nandhini', item: 'Beato Classic Logo Hoodie', amount: 45.00, time: '15m ago' }
      ];
      migrated = true;
    }

    // Seeding collabSplits
    if (!parsed.collabSplits || parsed.collabSplits.length === 0) {
      parsed.collabSplits = [
        { id: 'cs1', artistId: 'user-1780052773758', track: 'Mutta Kalakki | Youth | Ken Karunaas', collaborator: 'Ken Karunaas', role: 'Singer', share: 50, status: 'Active' },
        { id: 'cs2', artistId: 'user-1780052773758', track: 'Nandhini', collaborator: 'Sarath K', role: 'Producer', share: 30, status: 'Active' }
      ];
      migrated = true;
    }

    // Seeding pitches
    if (!parsed.pitches || parsed.pitches.length === 0) {
      parsed.pitches = [
        { id: 'p1', artistId: 'user-1780052773758', track: 'Mutta Kalakki | Youth | Ken Karunaas', curator: 'Global Pop Hits', status: 'In Review', pitchDate: 'May 28, 2026', feedback: 'Curator has listened. Decision pending.' },
        { id: 'p2', artistId: 'user-1780052773758', track: 'Nandhini', curator: 'Late Night Chillout', status: 'Approved', pitchDate: 'May 10, 2026', feedback: 'Awesome vibe. Added to placement list!' }
      ];
      migrated = true;
    }

    // Seeding soundKits
    if (!parsed.soundKits || parsed.soundKits.length === 0) {
      parsed.soundKits = [
        { id: 'sk1', artistId: 'user-1780052773758', name: 'Cosmic Synthwave Sample Kit Vol 1', price: 19.99, size: '240MB', downloads: 142, emoji: '🎹' },
        { id: 'sk2', artistId: 'user-1780052773758', name: 'Deep Lo-Fi Drum & Percussion Kit', price: 9.99, size: '110MB', downloads: 98, emoji: '🥁' }
      ];
      migrated = true;
    }

    // Seeding plannerTasks
    if (!parsed.plannerTasks || parsed.plannerTasks.length === 0) {
      parsed.plannerTasks = [
        { id: 'pt1', artistId: 'user-1780052773758', task: 'Finalize Audio Mastering exports', category: 'Audio', done: true },
        { id: 'pt2', artistId: 'user-1780052773758', task: 'Design Official Album Cover Art', category: 'Design', done: true },
        { id: 'pt3', artistId: 'user-1780052773758', task: 'Setup Pre-save SmartLink Campaign', category: 'Marketing', done: false },
        { id: 'pt4', artistId: 'user-1780052773758', task: 'Submit pitch to Beato Curators', category: 'Pitching', done: false }
      ];
      migrated = true;
    }

    // Seeding demos
    if (!parsed.demos || parsed.demos.length === 0) {
      parsed.demos = [
        { id: 'd1', artistId: 'user-1780052773758', title: 'Cosmic Dreams Jam (Draft 1)', duration: '1:45', date: 'May 30, 2026', file: 'cosmic_jam.mp3' }
      ];
      migrated = true;
    }

    // Seeding contracts
    if (!parsed.contracts || parsed.contracts.length === 0) {
      parsed.contracts = [
        { id: 'ct1', artistId: 'user-1780052773758', title: 'Standard Split Sheet: Mutta Kalakki', type: 'Royalty Split', party: 'Singer Ken Karunaas', date: 'May 22, 2026', status: 'Signed' },
        { id: 'ct2', artistId: 'user-1780052773758', title: 'Non-Exclusive Producer Lease Agreement: Nandhini', type: 'License Contract', party: 'Beatmaker Sarath K', date: 'May 29, 2026', status: 'Pending Signature' }
      ];
      migrated = true;
    }

    // Seeding newsletters
    if (!parsed.newsletters || parsed.newsletters.length === 0) {
      parsed.newsletters = [
        { id: 'nl1', artistId: 'user-1780052773758', subject: 'My New Single "Mutta Kalakki" is OUT NOW! 🌌', sentTo: '1,420 fans', openRate: '45.8%', date: 'May 22, 2026' }
      ];
      migrated = true;
    }

    // Seeding trackLyrics
    if (!parsed.trackLyrics || parsed.trackLyrics.length === 0) {
      parsed.trackLyrics = [
        {
          trackId: 'track-uploaded-1780492885251',
          artistId: 'user-1780052773758',
          text: 'Ye manja baloon-uh\nNee super saloon -uh\nYevaadi cooling watermelon-uh\nEn beauty buffoon-uh',
          timeline: [
            { time: '0:05', text: 'Intro instrumentals fading out' },
            { time: '0:12', text: 'Ye manja baloon-uh' },
            { time: '0:18', text: 'Nee super saloon -uh' }
          ]
        }
      ];
      migrated = true;
    }

    parsed.ticketSales = parsed.ticketSales || [];
    parsed.profileViews = parsed.profileViews || {};

    const demoArtistIds = new Set(['artist-1', 'artist-2', 'artist-3', 'artist-4', 'artist-5', 'artist-6']);
    const demoUserNames = new Set(['Aurora Nightfall', 'Cipher Nova', 'Selene Ray', 'The Velvet Echoes', 'Nyx & Prometheus', 'Marco Santos']);
    const beforeUserCount = parsed.users.length;
    parsed.users = parsed.users.filter((user: any) => !demoArtistIds.has(user.id) && !demoUserNames.has(user.name));
    if (parsed.users.length !== beforeUserCount) migrated = true;

    const beforeTicketCount = parsed.ticketSales.length;
    parsed.ticketSales = parsed.ticketSales.filter((sale: any) =>
      sale.totalRevenue !== 2490 &&
      sale.ticketsSold !== 125 &&
      !sale.recentSales?.some((recent: any) => recent.event === 'Live at Indiranagar Social')
    );
    if (parsed.ticketSales.length !== beforeTicketCount) migrated = true;

    for (const seededId of ['user-1780052773758', 'user-1']) {
      if (parsed.profileViews[seededId] === 104 || parsed.profileViews[seededId] === 55) {
        delete parsed.profileViews[seededId];
        migrated = true;
      }
    }

    if (migrated || supportTickets.length !== originalLen) {
      parsed.supportTickets = supportTickets;
      try {
        fs.writeFileSync(DB_FILE, JSON.stringify(parsed, null, 2), 'utf-8');
      } catch (err: any) {
        console.warn('Failed to write migrated database file:', err.message);
      }
    }

    cachedDb = parsed;
    try {
      lastModifiedTime = fs.statSync(DB_FILE).mtimeMs;
    } catch {}
    return parsed;
  } catch (e: any) {
    console.warn('Failed to read database file (falling back to memory):', e.message);
    if (!cachedDb) {
      cachedDb = { users: [], otps: [], sessions: [], tracks: [], transactions: [], planPrices: { free: 0, student: 4.99, premium: 9.99, family: 15.99, creator: 19.99 } };
    }
    return cachedDb;
  }
}

function writeDb(data: DatabaseSchema) {
  cachedDb = data;
  try {
    ensureDbExists();
    let retries = 5;
    while (retries > 0) {
      try {
        const tempFile = DB_FILE + '.' + Math.random().toString(36).substring(2) + '.tmp';
        fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
        fs.renameSync(tempFile, DB_FILE);
        break;
      } catch (err: any) {
        retries--;
        if (retries === 0) {
          fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
        } else {
          const waitTill = new Date(new Date().getTime() + 50);
          while (waitTill > new Date()) {}
        }
      }
    }
    lastModifiedTime = fs.statSync(DB_FILE).mtimeMs;
  } catch (e: any) {
    console.warn('Failed to write database file (falling back to memory):', e.message);
  }
}

function mapUserFromSupabase(u: any): UserEntity {
  if (!u) return u;
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    passwordHash: u.password_hash,
    role: u.role,
    isActive: u.is_active,
    phone: u.phone,
    createdAt: u.created_at,
    avatar: u.avatar,
    coverImage: u.cover_image,
    subscription: u.subscription,
    paymentMethod: u.payment_method,
    billingCycle: u.billing_cycle,
    country: u.country,
    followers: u.followers || 0,
    following: u.following || 0,
    likedSongs: u.liked_songs || [],
    savedAlbums: u.saved_albums || [],
    followedArtists: u.followed_artists || [],
    playlists: u.playlists || [],
    preferences: u.preferences || {
      autoplay: true,
      crossfade: 5,
      normalize: true,
      quality: 'very_high',
      downloadQuality: 'very_high',
      showExplicit: true,
      privateSession: false,
      language: 'en',
      theme: 'dark',
    },
    stats: u.stats || {
      totalListeningTime: 0,
      topGenres: [],
      topArtists: [],
      topTracks: [],
      streaksCount: 0,
      discoverScore: 0,
    },
    bio: u.bio,
    verified: u.verified,
    verificationRequest: u.verification_request,
  };
}

function mapUserToSupabase(u: any): any {
  if (!u) return u;
  const res: any = { ...u };
  if (u.passwordHash !== undefined) {
    res.password_hash = u.passwordHash;
    delete res.passwordHash;
  }
  if (u.isActive !== undefined) {
    res.is_active = u.isActive;
    delete res.isActive;
  }
  if (u.createdAt !== undefined) {
    res.created_at = u.createdAt;
    delete res.createdAt;
  }
  if (u.coverImage !== undefined) {
    res.cover_image = u.coverImage;
    delete res.coverImage;
  }
  if (u.paymentMethod !== undefined) {
    res.payment_method = u.paymentMethod;
    delete res.paymentMethod;
  }
  if (u.billingCycle !== undefined) {
    res.billing_cycle = u.billingCycle;
    delete res.billingCycle;
  }
  if (u.likedSongs !== undefined) {
    res.liked_songs = u.likedSongs;
    delete res.likedSongs;
  }
  if (u.savedAlbums !== undefined) {
    res.saved_albums = u.savedAlbums;
    delete res.savedAlbums;
  }
  if (u.followedArtists !== undefined) {
    res.followed_artists = u.followedArtists;
    delete res.followedArtists;
  }
  if (u.verificationRequest !== undefined) {
    res.verification_request = u.verificationRequest;
    delete res.verificationRequest;
  }
  return res;
}

let isSyncing = false;

export async function syncWithSupabase() {
  if (process.env.DATABASE_MODE !== 'supabase' || isSyncing) return;
  isSyncing = true;
  try {
    const data = readDb();
    
    // 1. Fetch Users
    const cloudUsers = await dbSupabase.getUsers();
    if (cloudUsers && cloudUsers.length > 0) {
      data.users = cloudUsers.map(mapUserFromSupabase);
    }
    
    // 2. Fetch Tracks
    const cloudTracks = await dbSupabase.getTracks();
    if (cloudTracks && cloudTracks.length > 0) {
      data.tracks = cloudTracks.map((t: any) => ({
        id: t.id,
        title: t.title,
        artistId: t.artist_id,
        artistName: t.artist_name,
        albumId: t.album_id,
        albumName: t.album_name,
        coverImage: t.cover_image,
        duration: t.duration,
        audioUrl: t.audio_url,
        genre: t.genre,
        year: t.year,
        plays: t.plays || 0,
        liked: t.liked || false,
        explicit: t.explicit || false,
        trackNumber: t.track_number || 1,
        lyrics: t.lyrics || '',
        uploadedBy: t.uploaded_by,
        uploadedAt: t.uploaded_at,
        status: t.status || 'approved',
        featured: t.featured || false,
      }));
    }

    // 3. Fetch Comments
    const cloudComments = await dbSupabase.getComments();
    if (cloudComments && cloudComments.length > 0) {
      data.comments = cloudComments.map((c: any) => {
        const track = data.tracks?.find((t: any) => t.id === c.trackId || t.title === c.trackTitle);
        return {
          id: c.id,
          artistId: c.artistId || track?.artistId || '',
          user: c.userName || c.user || 'Unknown User',
          text: c.text,
          track: track?.title || c.trackTitle || c.trackId || '',
          time: c.createdAt || c.time || new Date().toISOString(),
          reply: c.reply || ''
        };
      });
    }
    
    writeDb(data);
  } catch (e) {
    console.error('Supabase background sync error:', e);
  } finally {
    isSyncing = false;
  }
}

// Start periodic sync if in supabase mode and on server-side
if (typeof window === 'undefined') {
  // Sync immediately at boot
  setTimeout(() => {
    syncWithSupabase().catch(console.error);
  }, 100);

  // Sync every 8 seconds
  setInterval(() => {
    syncWithSupabase().catch(console.error);
  }, 8000);
}

export const db = {
  // --- Users ---
  getUsers: (): UserEntity[] => {
    return readDb().users;
  },

  getUserByEmail: (email: string): UserEntity | undefined => {
    const lowEmail = email.toLowerCase().trim();
    const user = readDb().users.find((u) => u.email.toLowerCase() === lowEmail);
    if (user) {
      user.likedSongs = user.likedSongs || [];
      user.savedAlbums = user.savedAlbums || [];
      user.followedArtists = user.followedArtists || [];
      user.playlists = user.playlists || [];
      user.avatar = user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop';
      user.subscription = user.subscription || 'free';
      user.country = user.country || 'IN';
      user.followers = user.followers || 0;
      user.following = user.following || 0;
      user.preferences = user.preferences || {
        autoplay: true,
        crossfade: 5,
        normalize: true,
        quality: 'very_high',
        downloadQuality: 'very_high',
        showExplicit: true,
        privateSession: false,
        language: 'en',
        theme: 'dark',
      };
      user.stats = user.stats || {
        totalListeningTime: 0,
        topGenres: [],
        topArtists: [],
        topTracks: [],
        streaksCount: 0,
        discoverScore: 0,
      };
    }
    return user;
  },

  getUserById: (id: string): UserEntity | undefined => {
    const user = readDb().users.find((u) => u.id === id);
    if (user) {
      user.likedSongs = user.likedSongs || [];
      user.savedAlbums = user.savedAlbums || [];
      user.followedArtists = user.followedArtists || [];
      user.playlists = user.playlists || [];
      user.avatar = user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop';
      user.subscription = user.subscription || 'free';
      user.country = user.country || 'IN';
      user.followers = user.followers || 0;
      user.following = user.following || 0;
      user.preferences = user.preferences || {
        autoplay: true,
        crossfade: 5,
        normalize: true,
        quality: 'very_high',
        downloadQuality: 'very_high',
        showExplicit: true,
        privateSession: false,
        language: 'en',
        theme: 'dark',
      };
      user.stats = user.stats || {
        totalListeningTime: 0,
        topGenres: [],
        topArtists: [],
        topTracks: [],
        streaksCount: 0,
        discoverScore: 0,
      };
    }
    return user;
  },

  getUserByPhone: (phone: string): UserEntity | undefined => {
    const user = readDb().users.find((u) => u.phone === phone);
    if (user) {
      user.likedSongs = user.likedSongs || [];
      user.savedAlbums = user.savedAlbums || [];
      user.followedArtists = user.followedArtists || [];
      user.playlists = user.playlists || [];
      user.avatar = user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop';
      user.subscription = user.subscription || 'free';
      user.country = user.country || 'IN';
      user.followers = user.followers || 0;
      user.following = user.following || 0;
      user.preferences = user.preferences || {
        autoplay: true,
        crossfade: 5,
        normalize: true,
        quality: 'very_high',
        downloadQuality: 'very_high',
        showExplicit: true,
        privateSession: false,
        language: 'en',
        theme: 'dark',
      };
      user.stats = user.stats || {
        totalListeningTime: 0,
        topGenres: [],
        topArtists: [],
        topTracks: [],
        streaksCount: 0,
        discoverScore: 0,
      };
    }
    return user;
  },

  saveUser: (user: Omit<UserEntity, 'id' | 'createdAt'>): UserEntity => {
    const newUser: UserEntity = {
      ...user,
      id: (user as any).id || `user-${Date.now()}`,
      createdAt: (user as any).createdAt || new Date().toISOString(),
      avatar: user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop',
      subscription: user.subscription || 'free',
      country: user.country || 'IN',
      followers: user.followers || 0,
      following: user.following || 0,
      likedSongs: user.likedSongs || [],
      savedAlbums: user.savedAlbums || [],
      followedArtists: user.followedArtists || [],
      playlists: user.playlists || [],
      preferences: user.preferences || {
        autoplay: true,
        crossfade: 5,
        normalize: true,
        quality: 'very_high',
        downloadQuality: 'very_high',
        showExplicit: true,
        privateSession: false,
        language: 'en',
        theme: 'dark',
      },
      stats: user.stats || {
        totalListeningTime: 0,
        topGenres: [],
        topArtists: [],
        topTracks: [],
        streaksCount: 0,
        discoverScore: 0,
      },
    };

    if (process.env.DATABASE_MODE === 'supabase') {
      dbSupabase.saveUser(mapUserToSupabase(newUser)).catch(err => {
        console.error('Supabase background saveUser error:', err);
      });
    }

    const data = readDb();
    data.users = data.users.filter(u => u.id !== newUser.id);
    data.users.push(newUser);
    writeDb(data);
    return newUser;
  },

  updateUserRole: (userId: string, role: UserEntity['role']): boolean => {
    if (process.env.DATABASE_MODE === 'supabase') {
      dbSupabase.updateUserRole(userId, role).catch(err => {
        console.error('Supabase background updateUserRole error:', err);
      });
    }
    const data = readDb();
    const idx = data.users.findIndex((u) => u.id === userId);
    if (idx === -1) return false;
    data.users[idx].role = role;
    writeDb(data);
    return true;
  },

  updateUser: (userId: string, updates: Partial<UserEntity>): boolean => {
    if (process.env.DATABASE_MODE === 'supabase') {
      dbSupabase.updateUser(userId, mapUserToSupabase(updates)).catch(err => {
        console.error('Supabase background updateUser error:', err);
      });
    }
    const data = readDb();
    const idx = data.users.findIndex((u) => u.id === userId);
    if (idx === -1) return false;
    data.users[idx] = { ...data.users[idx], ...updates };
    writeDb(data);
    return true;
  },

  deleteUser: (userId: string): boolean => {
    if (process.env.DATABASE_MODE === 'supabase') {
      dbSupabase.deleteUser(userId).catch(err => {
        console.error('Supabase background deleteUser error:', err);
      });
    }
    const data = readDb();
    const originalLength = data.users.length;
    data.users = data.users.filter((u) => u.id !== userId);
    if (data.users.length === originalLength) return false;
    writeDb(data);
    return true;
  },

  // --- OTPs ---
  getOtp: (phone: string): OtpEntity | undefined => {
    return readDb().otps.find((o) => o.phone === phone);
  },

  saveOtp: (phone: string, code: string, expiresAt: Date): OtpEntity => {
    const data = readDb();
    const newOtp: OtpEntity = {
      phone,
      code,
      attempts: 0,
      expiresAt: expiresAt.toISOString(),
      createdAt: new Date().toISOString(),
    };
    
    if (process.env.DATABASE_MODE === 'supabase') {
      dbSupabase.saveOtp(phone, code, expiresAt).catch(err => {
        console.error('Supabase background saveOtp error:', err);
      });
    }

    data.otps = data.otps.filter((o) => o.phone !== phone);
    data.otps.push(newOtp);
    writeDb(data);
    return newOtp;
  },

  incrementOtpAttempts: (phone: string): number => {
    if (process.env.DATABASE_MODE === 'supabase') {
      dbSupabase.incrementOtpAttempts(phone).catch(err => {
        console.error('Supabase background incrementOtpAttempts error:', err);
      });
    }
    const data = readDb();
    const idx = data.otps.findIndex((o) => o.phone === phone);
    if (idx === -1) return 0;
    data.otps[idx].attempts += 1;
    const attempts = data.otps[idx].attempts;
    writeDb(data);
    return attempts;
  },

  deleteOtp: (phone: string) => {
    if (process.env.DATABASE_MODE === 'supabase') {
      dbSupabase.deleteOtp(phone).catch(err => {
        console.error('Supabase background deleteOtp error:', err);
      });
    }
    const data = readDb();
    data.otps = data.otps.filter((o) => o.phone !== phone);
    writeDb(data);
  },

  // --- Sessions ---
  saveSession: (session: SessionEntity): SessionEntity => {
    if (process.env.DATABASE_MODE === 'supabase') {
      dbSupabase.saveSession(session).catch(err => {
        console.error('Supabase background saveSession error:', err);
      });
    }
    const data = readDb();
    data.sessions.push(session);
    writeDb(data);
    return session;
  },

  getSession: (token: string): SessionEntity | undefined => {
    return readDb().sessions.find((s) => s.token === token);
  },

  deleteSession: (token: string) => {
    if (process.env.DATABASE_MODE === 'supabase') {
      dbSupabase.deleteSession(token).catch(err => {
        console.error('Supabase background deleteSession error:', err);
      });
    }
    const data = readDb();
    data.sessions = data.sessions.filter((s) => s.token !== token);
    writeDb(data);
  },

  // --- Tracks ---
  getTracks: (): TrackEntity[] => {
    return readDb().tracks || [];
  },

  addTrack: (track: TrackEntity): TrackEntity => {
    if (process.env.DATABASE_MODE === 'supabase') {
      const mapped = {
        id: track.id,
        title: track.title,
        artist_id: track.artistId,
        artist_name: track.artistName,
        album_id: track.albumId,
        album_name: track.albumName,
        cover_image: track.coverImage,
        duration: track.duration,
        audio_url: track.audioUrl,
        genre: track.genre,
        year: track.year,
        plays: track.plays || 0,
        liked: track.liked || false,
        explicit: track.explicit || false,
        track_number: track.trackNumber || 1,
        lyrics: track.lyrics || '',
        uploaded_by: track.uploadedBy,
        uploaded_at: track.uploadedAt || new Date().toISOString(),
        status: track.status || 'pending',
        featured: track.featured || false,
      };
      dbSupabase.addTrack(mapped).catch(err => {
        console.error('Supabase background addTrack error:', err);
      });
    }
    const data = readDb();
    data.tracks = data.tracks || [];
    data.tracks.push(track);
    writeDb(data);
    return track;
  },

  updateTrackStatus: (trackId: string, status: 'approved' | 'rejected' | 'pending'): boolean => {
    if (process.env.DATABASE_MODE === 'supabase') {
      dbSupabase.updateTrackStatus(trackId, status).catch(err => {
        console.error('Supabase background updateTrackStatus error:', err);
      });
    }
    const data = readDb();
    data.tracks = data.tracks || [];
    const idx = data.tracks.findIndex((t) => t.id === trackId);
    if (idx === -1) return false;
    data.tracks[idx].status = status;
    writeDb(data);
    return true;
  },

  updateTrackAudioUrl: (trackId: string, audioUrl: string): boolean => {
    if (process.env.DATABASE_MODE === 'supabase') {
      import('./dbSupabase').then(({ supabase }) => {
        supabase
          .from('tracks')
          .update({ audio_url: audioUrl })
          .eq('id', trackId)
          .then(({ error }) => {
            if (error) console.error('Supabase updateTrackAudioUrl error:', error);
          });
      }).catch(err => console.error('Failed to load supabase client:', err));
    }
    const data = readDb();
    data.tracks = data.tracks || [];
    const idx = data.tracks.findIndex((t) => t.id === trackId);
    if (idx === -1) return false;
    data.tracks[idx].audioUrl = audioUrl;
    writeDb(data);
    return true;
  },

  deleteTrack: (trackId: string): boolean => {
    if (process.env.DATABASE_MODE === 'supabase') {
      dbSupabase.deleteTrack(trackId).catch(err => {
        console.error('Supabase background deleteTrack error:', err);
      });
    }
    const data = readDb();
    const originalLength = data.tracks.length;
    data.tracks = data.tracks.filter((t) => t.id !== trackId);
    if (data.tracks.length === originalLength) return false;
    writeDb(data);
    return true;
  },

  // --- Transactions ---
  getTransactions: (): TransactionEntity[] => {
    return readDb().transactions || [];
  },

  saveTransaction: (tx: TransactionEntity): TransactionEntity => {
    const data = readDb();
    data.transactions = data.transactions || [];
    data.transactions.push(tx);
    writeDb(data);
    return tx;
  },

  updateTransactionStatus: (
    txId: string,
    status: 'completed' | 'pending' | 'failed' | 'refunded',
    refundAmount?: number,
    refundReason?: string
  ): boolean => {
    const data = readDb();
    data.transactions = data.transactions || [];
    const idx = data.transactions.findIndex((t) => t.id === txId);
    if (idx === -1) return false;
    
    data.transactions[idx].status = status;
    if (refundAmount !== undefined) data.transactions[idx].refundAmount = refundAmount;
    if (refundReason !== undefined) data.transactions[idx].refundReason = refundReason;
    
    writeDb(data);
    return true;
  },

  setTransactions: (txs: TransactionEntity[]) => {
    const data = readDb();
    data.transactions = txs;
    writeDb(data);
  },

  // --- Plan Prices ---
  getPlanPrices: (): Record<string, number> => {
    return readDb().planPrices || { free: 0, student: 4.99, premium: 9.99, family: 15.99, creator: 19.99 };
  },

  updatePlanPrice: (plan: string, price: number) => {
    const data = readDb();
    data.planPrices = data.planPrices || { free: 0, student: 4.99, premium: 9.99, family: 15.99, creator: 19.99 };
    data.planPrices[plan.toLowerCase()] = price;
    writeDb(data);
  },

  // --- Global Currency ---
  getGlobalCurrency: (): string => {
    return readDb().globalCurrency || 'USD';
  },

  updateGlobalCurrency: (currency: string) => {
    const data = readDb();
    data.globalCurrency = currency;
    writeDb(data);
  },

  // --- Admin Notifications ---
  getAdminNotifications: (): AdminNotificationEntity[] => {
    return readDb().adminNotifications || [];
  },

  saveAdminNotification: (notif: AdminNotificationEntity): AdminNotificationEntity => {
    const data = readDb();
    data.adminNotifications = data.adminNotifications || [];
    data.adminNotifications = data.adminNotifications.filter(n => n.id !== notif.id);
    data.adminNotifications.unshift(notif);
    writeDb(data);
    return notif;
  },

  deleteAdminNotification: (id: string): boolean => {
    const data = readDb();
    data.adminNotifications = data.adminNotifications || [];
    const origLen = data.adminNotifications.length;
    data.adminNotifications = data.adminNotifications.filter(n => n.id !== id);
    if (data.adminNotifications.length === origLen) return false;
    writeDb(data);
    return true;
  },

  // --- Notification Templates ---
  getNotificationTemplates: (): NotificationTemplateEntity[] => {
    const data = readDb();
    let templates = data.notificationTemplates || [];
    if (templates.length === 0) {
      templates = [
        { id: 'T1', name: 'Welcome',           type: 'email',  preview: 'Welcome to Beato! Start exploring millions of tracks…', createdAt: new Date().toISOString() },
        { id: 'T2', name: 'Premium Upgrade',   type: 'push',   preview: 'Unlock unlimited skips, HD audio, and offline mode. Upgrade now!', createdAt: new Date().toISOString() },
        { id: 'T3', name: 'New Release Alert', type: 'in-app', preview: '🎵 {artist_name} just dropped a new album. Listen now!',          createdAt: new Date().toISOString() },
        { id: 'T4', name: 'Account Warning',   type: 'email',  preview: 'We noticed unusual activity on your account. Please verify…',     createdAt: new Date().toISOString() },
        { id: 'T5', name: 'Payment Failed',    type: 'push',   preview: 'Your payment failed. Please update your billing info to continue.',  createdAt: new Date().toISOString() },
        { id: 'T6', name: 'Artist Approved',   type: 'email',  preview: 'Congratulations! Your artist profile has been approved.',          createdAt: new Date().toISOString() },
      ];
      data.notificationTemplates = templates;
      writeDb(data);
    }
    return templates;
  },

  saveNotificationTemplate: (tpl: NotificationTemplateEntity): NotificationTemplateEntity => {
    const data = readDb();
    data.notificationTemplates = data.notificationTemplates || [];
    data.notificationTemplates = data.notificationTemplates.filter(t => t.id !== tpl.id);
    data.notificationTemplates.unshift(tpl);
    writeDb(data);
    return tpl;
  },

  deleteNotificationTemplate: (id: string): boolean => {
    const data = readDb();
    data.notificationTemplates = data.notificationTemplates || [];
    const origLen = data.notificationTemplates.length;
    data.notificationTemplates = data.notificationTemplates.filter(t => t.id !== id);
    if (data.notificationTemplates.length === origLen) return false;
    writeDb(data);
    return true;
  },

  // --- Support Tickets ---
  getSupportTickets: (): SupportTicketEntity[] => {
    return readDb().supportTickets || [];
  },

  saveSupportTicket: (ticket: SupportTicketEntity): SupportTicketEntity => {
    const data = readDb();
    data.supportTickets = data.supportTickets || [];
    data.supportTickets = data.supportTickets.filter(t => t.id !== ticket.id);
    data.supportTickets.unshift(ticket);
    writeDb(data);
    return ticket;
  },

  deleteSupportTicket: (id: string): boolean => {
    const data = readDb();
    data.supportTickets = data.supportTickets || [];
    const origLen = data.supportTickets.length;
    data.supportTickets = data.supportTickets.filter(t => t.id !== id);
    if (data.supportTickets.length === origLen) return false;
    writeDb(data);
    return true;
  },

  // --- Canned Replies ---
  getCannedReplies: (): CannedReplyEntity[] => {
    return readDb().cannedReplies || [];
  },

  saveCannedReply: (reply: CannedReplyEntity): CannedReplyEntity => {
    const data = readDb();
    data.cannedReplies = data.cannedReplies || [];
    data.cannedReplies = data.cannedReplies.filter(r => r.id !== reply.id);
    data.cannedReplies.unshift(reply);
    writeDb(data);
    return reply;
  },

  deleteCannedReply: (id: string): boolean => {
    const data = readDb();
    data.cannedReplies = data.cannedReplies || [];
    const origLen = data.cannedReplies.length;
    data.cannedReplies = data.cannedReplies.filter(r => r.id !== id);
    if (data.cannedReplies.length === origLen) return false;
    writeDb(data);
    return true;
  },

  // --- Payout Artists ---
  getPayoutArtists: (): ArtistPayoutEntity[] => {
    return readDb().payoutArtists || [];
  },

  getPayoutArtistById: (id: string): ArtistPayoutEntity | undefined => {
    return readDb().payoutArtists?.find(a => a.id === id);
  },

  savePayoutArtist: (artist: ArtistPayoutEntity): ArtistPayoutEntity => {
    const data = readDb();
    data.payoutArtists = data.payoutArtists || [];
    data.payoutArtists = data.payoutArtists.filter(a => a.id !== artist.id);
    data.payoutArtists.unshift(artist);
    writeDb(data);
    return artist;
  },

  // --- Payout Streams ---
  getPayoutStreams: (): PayoutStreamEntity[] => {
    return readDb().payoutStreams || [];
  },

  addPayoutStream: (stream: PayoutStreamEntity): PayoutStreamEntity => {
    const data = readDb();
    data.payoutStreams = data.payoutStreams || [];
    data.payoutStreams.push(stream);
    writeDb(data);
    return stream;
  },

  // --- Payout Withdrawal Requests ---
  getWithdrawalRequests: (): WithdrawalRequestEntity[] => {
    return readDb().payoutWithdrawalRequests || [];
  },

  saveWithdrawalRequest: (req: WithdrawalRequestEntity): WithdrawalRequestEntity => {
    const data = readDb();
    data.payoutWithdrawalRequests = data.payoutWithdrawalRequests || [];
    data.payoutWithdrawalRequests = data.payoutWithdrawalRequests.filter(w => w.id !== req.id);
    data.payoutWithdrawalRequests.unshift(req);
    writeDb(data);
    return req;
  },

  // --- Payout Disputes ---
  getPayoutDisputes: (): PayoutDisputeEntity[] => {
    return readDb().payoutDisputes || [];
  },

  savePayoutDispute: (disp: PayoutDisputeEntity): PayoutDisputeEntity => {
    const data = readDb();
    data.payoutDisputes = data.payoutDisputes || [];
    data.payoutDisputes = data.payoutDisputes.filter(d => d.id !== disp.id);
    data.payoutDisputes.unshift(disp);
    writeDb(data);
    return disp;
  },

  // --- Payout Audit Logs ---
  getPayoutAuditLogs: (): PayoutAuditLogEntity[] => {
    return readDb().payoutAuditLogs || [];
  },

  addPayoutAuditLog: (log: PayoutAuditLogEntity): PayoutAuditLogEntity => {
    const data = readDb();
    data.payoutAuditLogs = data.payoutAuditLogs || [];
    data.payoutAuditLogs.unshift(log);
    writeDb(data);
    return log;
  },

  // --- Payout Tax Records ---
  getPayoutTaxRecords: (): PayoutTaxRecordEntity[] => {
    return readDb().payoutTaxRecords || [];
  },

  savePayoutTaxRecord: (rec: PayoutTaxRecordEntity): PayoutTaxRecordEntity => {
    const data = readDb();
    data.payoutTaxRecords = data.payoutTaxRecords || [];
    data.payoutTaxRecords.unshift(rec);
    writeDb(data);
    return rec;
  },

  // --- API Keys ---
  getApiKeys: (): ApiKeyEntity[] => {
    return readDb().apiKeys || [];
  },

  saveApiKey: (key: ApiKeyEntity): ApiKeyEntity => {
    const data = readDb();
    data.apiKeys = data.apiKeys || [];
    data.apiKeys = data.apiKeys.filter(k => k.id !== key.id);
    data.apiKeys.push(key);
    writeDb(data);
    return key;
  },

  deleteApiKey: (id: string): boolean => {
    const data = readDb();
    data.apiKeys = data.apiKeys || [];
    const origLen = data.apiKeys.length;
    data.apiKeys = data.apiKeys.filter(k => k.id !== id);
    if (data.apiKeys.length === origLen) return false;
    writeDb(data);
    return true;
  },

  // --- Feature Flags ---
  getFeatureFlags: (): FeatureFlagEntity[] => {
    return readDb().featureFlags || [];
  },

  saveFeatureFlag: (flag: FeatureFlagEntity): FeatureFlagEntity => {
    const data = readDb();
    data.featureFlags = data.featureFlags || [];
    data.featureFlags = data.featureFlags.filter(f => f.id !== flag.id);
    data.featureFlags.push(flag);
    writeDb(data);
    return flag;
  },

  // --- Experiments ---
  getExperiments: (): ExperimentEntity[] => {
    return readDb().experiments || [];
  },

  saveExperiment: (exp: ExperimentEntity): ExperimentEntity => {
    const data = readDb();
    data.experiments = data.experiments || [];
    data.experiments = data.experiments.filter(e => e.id !== exp.id);
    data.experiments.push(exp);
    writeDb(data);
    return exp;
  },

  deleteExperiment: (id: string): boolean => {
    const data = readDb();
    data.experiments = data.experiments || [];
    const origLen = data.experiments.length;
    data.experiments = data.experiments.filter(e => e.id !== id);
    if (data.experiments.length === origLen) return false;
    writeDb(data);
    return true;
  },

  // --- System Services ---
  getSystemServices: (): SystemServiceEntity[] => {
    return readDb().systemServices || [];
  },

  updateServiceStatus: (name: string, status: 'operational' | 'degraded' | 'down'): boolean => {
    const data = readDb();
    data.systemServices = data.systemServices || [];
    const idx = data.systemServices.findIndex(s => s.name === name);
    if (idx === -1) return false;
    data.systemServices[idx].status = status;
    writeDb(data);
    return true;
  },

  // --- General Audit Logs ---
  getGeneralAuditLogs: (): AuditLogEntity[] => {
    return readDb().generalAuditLogs || [];
  },

  addGeneralAuditLog: (log: AuditLogEntity): AuditLogEntity => {
    const data = readDb();
    data.generalAuditLogs = data.generalAuditLogs || [];
    data.generalAuditLogs.unshift(log);
    writeDb(data);
    return log;
  },

  // --- Webhooks ---
  getWebhooks: (): WebhookEntity[] => {
    return readDb().webhooks || [];
  },

  saveWebhook: (webhook: WebhookEntity): WebhookEntity => {
    const data = readDb();
    data.webhooks = data.webhooks || [];
    data.webhooks = data.webhooks.filter(w => w.id !== webhook.id);
    data.webhooks.push(webhook);
    writeDb(data);
    return webhook;
  },

  deleteWebhook: (id: string): boolean => {
    const data = readDb();
    data.webhooks = data.webhooks || [];
    const origLen = data.webhooks.length;
    data.webhooks = data.webhooks.filter(w => w.id !== id);
    if (data.webhooks.length === origLen) return false;
    writeDb(data);
    return true;
  },

  // --- Webhook Logs ---
  getWebhookLogs: (): WebhookLogEntity[] => {
    return readDb().webhookLogs || [];
  },

  addWebhookLog: (log: WebhookLogEntity): WebhookLogEntity => {
    const data = readDb();
    data.webhookLogs = data.webhookLogs || [];
    data.webhookLogs.unshift(log);
    if (data.webhookLogs.length > 100) {
      data.webhookLogs = data.webhookLogs.slice(0, 100);
    }
    writeDb(data);
    return log;
  },

  // --- Platform Settings ---
  getPlatformSettings: (): PlatformSettingsEntity => {
    const data = readDb();
    if (data.platformSettings) return data.platformSettings;
    const defaults: PlatformSettingsEntity = {
      general: {
        platformName: 'Beato',
        description: 'The next-generation music streaming platform for artists and fans worldwide.',
        supportEmail: 'support@beato.io',
        maxUploadMB: 200,
        defaultLanguage: 'en',
        logoUrl: '',
        websiteUrl: 'https://beato.io',
        timezone: 'Asia/Kolkata',
      },
      content: {
        explicitContent: true,
        aiCopyright: true,
        autoRejectThreshold: 72,
        maxTrackMinutes: 20,
        allowUserUploads: false,
        requireArtistVerification: true,
      },
      billing: {
        trialDays: 30,
        graceDays: 7,
        autoRenewal: true,
        refundDays: 14,
        platformFee: 20,
        currency: 'INR',
      },
      notifications: {
        emailNotifs: true,
        pushNotifs: true,
        smsNotifs: false,
        marketingEmails: true,
        digestFreq: 'weekly',
      },
      security: {
        maintenanceMode: false,
        mfaRequired: true,
        sessionTimeout: 60,
        ipAllowlist: '',
        rateLimit: 120,
      },
      updatedAt: new Date().toISOString(),
    };
    return defaults;
  },

  savePlatformSettings: (settings: PlatformSettingsEntity): PlatformSettingsEntity => {
    const data = readDb();
    data.platformSettings = { ...settings, updatedAt: new Date().toISOString() };
    writeDb(data);
    return data.platformSettings;
  },

  // --- Messaging Config ---
  getMessagingConfig: (): MessagingConfigEntity => {
    const data = readDb();
    if (data.messagingConfig) return data.messagingConfig;
    return {
      email: { enabled: false, host: 'smtp.gmail.com', port: 587, secure: false, user: '', pass: '', fromName: 'Beato', fromAddress: '' },
      whatsapp: { enabled: false, provider: 'meta', accessToken: '', phoneNumberId: '', fromNumber: '', businessAccountId: '' },
      sms: { enabled: false, provider: 'twilio', accountSid: '', authToken: '', fromNumber: '' },
      adminAlertEmail: '',
      adminAlertPhone: '',
    };
  },

  saveMessagingConfig: (config: MessagingConfigEntity): MessagingConfigEntity => {
    const data = readDb();
    data.messagingConfig = config;
    writeDb(data);
    return config;
  },

  // --- Automation Rules ---
  getAutomationRules: (): AutomationRuleEntity[] => {
    const data = readDb();
    if (data.automationRules && data.automationRules.length > 0) return data.automationRules;
    // Seed defaults
    const defaults: AutomationRuleEntity[] = [
      {
        id: 'rule-1',
        name: 'Welcome Email on Signup',
        event: 'user.signup',
        enabled: true,
        userAction: { channel: 'email', subject: 'Welcome to Beato! 🎵', template: 'Hi {{name}}, welcome to Beato! Your account is ready. Start exploring music today.' },
        adminAction: { channel: 'whatsapp', template: '🎵 New signup on Beato: {{name}} ({{email}}) joined at {{time}}' },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        fireCount: 0,
      },
      {
        id: 'rule-2',
        name: 'Login Alert to Admin',
        event: 'user.login',
        enabled: false,
        userAction: { channel: 'none', template: '' },
        adminAction: { channel: 'sms', template: '🔐 User login: {{name}} ({{email}}) at {{time}} from {{ip}}' },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        fireCount: 0,
      },
      {
        id: 'rule-3',
        name: 'Payment Success Notification',
        event: 'payment.success',
        enabled: true,
        userAction: { channel: 'email', subject: 'Payment Confirmed — Beato Premium 🎉', template: 'Hi {{name}}, your payment of {{amount}} for {{plan}} has been confirmed. Thank you!' },
        adminAction: { channel: 'whatsapp', template: '💰 Payment received: {{name}} paid {{amount}} for {{plan}}' },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        fireCount: 0,
      },
      {
        id: 'rule-4',
        name: 'Artist Application Alert',
        event: 'artist.apply',
        enabled: true,
        userAction: { channel: 'email', subject: 'Artist Application Received', template: 'Hi {{name}}, we have received your artist application. Our team will review it within 48 hours.' },
        adminAction: { channel: 'whatsapp', template: '🎤 New artist application from {{name}} ({{email}}). Review in admin panel.' },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        fireCount: 0,
      },
      {
        id: 'rule-5',
        name: 'Track Approved Notification',
        event: 'track.approved',
        enabled: true,
        userAction: { channel: 'email', subject: 'Your Track is LIVE on Beato! 🎵', template: 'Hi {{name}}, great news! Your track "{{trackName}}" has been approved and is now live on Beato!' },
        adminAction: { channel: 'none', template: '' },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        fireCount: 0,
      },
    ];
    data.automationRules = defaults;
    writeDb(data);
    return defaults;
  },

  saveAutomationRule: (rule: AutomationRuleEntity): AutomationRuleEntity => {
    const data = readDb();
    data.automationRules = data.automationRules || [];
    const idx = data.automationRules.findIndex(r => r.id === rule.id);
    if (idx >= 0) {
      data.automationRules[idx] = { ...rule, updatedAt: new Date().toISOString() };
    } else {
      data.automationRules.push({ ...rule, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    }
    writeDb(data);
    return rule;
  },

  deleteAutomationRule: (id: string): boolean => {
    const data = readDb();
    const orig = (data.automationRules || []).length;
    data.automationRules = (data.automationRules || []).filter(r => r.id !== id);
    if (data.automationRules.length === orig) return false;
    writeDb(data);
    return true;
  },

  incrementRuleFireCount: (id: string): void => {
    const data = readDb();
    data.automationRules = data.automationRules || [];
    const idx = data.automationRules.findIndex(r => r.id === id);
    if (idx >= 0) {
      data.automationRules[idx].fireCount = (data.automationRules[idx].fireCount || 0) + 1;
      data.automationRules[idx].lastFiredAt = new Date().toISOString();
    }
    writeDb(data);
  },

  // --- Campaigns ---
  getCampaigns: (): CampaignEntity[] => {
    return readDb().campaigns || [];
  },
  saveCampaign: (camp: CampaignEntity): CampaignEntity => {
    const data = readDb();
    data.campaigns = data.campaigns || [];
    data.campaigns = data.campaigns.filter(c => c.id !== camp.id);
    data.campaigns.unshift(camp);
    writeDb(data);
    return camp;
  },

  // --- Events ---
  getEvents: (): LiveEventEntity[] => {
    return readDb().events || [];
  },
  saveEvent: (ev: LiveEventEntity): LiveEventEntity => {
    const data = readDb();
    data.events = data.events || [];
    data.events = data.events.filter(e => e.id !== ev.id);
    data.events.unshift(ev);
    writeDb(data);
    return ev;
  },
  deleteEvent: (id: string): boolean => {
    const data = readDb();
    data.events = data.events || [];
    const initialLength = data.events.length;
    data.events = data.events.filter(e => e.id !== id);
    writeDb(data);
    return data.events.length < initialLength;
  },

  // --- Comments ---
  getComments: (): FanCommentEntity[] => {
    return readDb().comments || [];
  },
  saveComment: (comm: FanCommentEntity): FanCommentEntity => {
    if (process.env.DATABASE_MODE === 'supabase') {
      dbSupabase.saveComment(comm).then(cloudComment => {
        console.log('Supabase comment saved in background:', cloudComment?.id || cloudComment);
      }).catch(e => {
        console.error('Supabase saveComment error in background:', e);
      });
    }
    const data = readDb();
    data.comments = data.comments || [];
    data.comments = data.comments.filter(c => c.id !== comm.id);
    data.comments.unshift(comm);
    writeDb(data);
    return comm;
  },

  // --- Merch Items ---
  getMerchItems: (): MerchItemEntity[] => {
    return readDb().merchItems || [];
  },
  saveMerchItem: (item: MerchItemEntity): MerchItemEntity => {
    const data = readDb();
    data.merchItems = data.merchItems || [];
    data.merchItems = data.merchItems.filter(m => m.id !== item.id);
    data.merchItems.unshift(item);
    writeDb(data);
    return item;
  },

  // --- Merch Sales Log ---
  getMerchSalesLogs: (): MerchSalesLogEntity[] => {
    return readDb().merchSalesLog || [];
  },
  addMerchSalesLog: (log: MerchSalesLogEntity): MerchSalesLogEntity => {
    const data = readDb();
    data.merchSalesLog = data.merchSalesLog || [];
    data.merchSalesLog.unshift(log);
    writeDb(data);
    return log;
  },

  // --- Collab Splits ---
  getCollabSplits: (): CollabSplitEntity[] => {
    return readDb().collabSplits || [];
  },
  saveCollabSplit: (split: CollabSplitEntity): CollabSplitEntity => {
    const data = readDb();
    data.collabSplits = data.collabSplits || [];
    data.collabSplits = data.collabSplits.filter(s => s.id !== split.id);
    data.collabSplits.unshift(split);
    writeDb(data);
    return split;
  },

  // --- Pitches ---
  getPitches: (): PitchEntity[] => {
    return readDb().pitches || [];
  },
  savePitch: (pitch: PitchEntity): PitchEntity => {
    const data = readDb();
    data.pitches = data.pitches || [];
    data.pitches = data.pitches.filter(p => p.id !== pitch.id);
    data.pitches.unshift(pitch);
    writeDb(data);
    return pitch;
  },

  // --- Sound Kits ---
  getSoundKits: (): SoundKitEntity[] => {
    return readDb().soundKits || [];
  },
  saveSoundKit: (kit: SoundKitEntity): SoundKitEntity => {
    const data = readDb();
    data.soundKits = data.soundKits || [];
    data.soundKits = data.soundKits.filter(s => s.id !== kit.id);
    data.soundKits.unshift(kit);
    writeDb(data);
    return kit;
  },

  // --- Planner Tasks ---
  getPlannerTasks: (): PlannerTaskEntity[] => {
    return readDb().plannerTasks || [];
  },
  savePlannerTask: (task: PlannerTaskEntity): PlannerTaskEntity => {
    const data = readDb();
    data.plannerTasks = data.plannerTasks || [];
    data.plannerTasks = data.plannerTasks.filter(t => t.id !== task.id);
    data.plannerTasks.unshift(task);
    writeDb(data);
    return task;
  },

  // --- Demos ---
  getDemos: (): DemoEntity[] => {
    return readDb().demos || [];
  },
  saveDemo: (demo: DemoEntity): DemoEntity => {
    const data = readDb();
    data.demos = data.demos || [];
    data.demos = data.demos.filter(d => d.id !== demo.id);
    data.demos.unshift(demo);
    writeDb(data);
    return demo;
  },
  deleteDemo: (id: string): boolean => {
    const data = readDb();
    data.demos = data.demos || [];
    const origLen = data.demos.length;
    data.demos = data.demos.filter(d => d.id !== id);
    if (data.demos.length === origLen) return false;
    writeDb(data);
    return true;
  },

  // --- Contracts ---
  getContracts: (): ContractEntity[] => {
    return readDb().contracts || [];
  },
  saveContract: (contract: ContractEntity): ContractEntity => {
    const data = readDb();
    data.contracts = data.contracts || [];
    data.contracts = data.contracts.filter(c => c.id !== contract.id);
    data.contracts.unshift(contract);
    writeDb(data);
    return contract;
  },

  // --- Newsletters ---
  getNewsletters: (): NewsletterEntity[] => {
    return readDb().newsletters || [];
  },
  saveNewsletter: (nl: NewsletterEntity): NewsletterEntity => {
    const data = readDb();
    data.newsletters = data.newsletters || [];
    data.newsletters = data.newsletters.filter(n => n.id !== nl.id);
    data.newsletters.unshift(nl);
    writeDb(data);
    return nl;
  },

  // --- Track Lyrics ---
  getTrackLyrics: (): TrackLyricsEntity[] => {
    return readDb().trackLyrics || [];
  },
  saveTrackLyrics: (lyrics: TrackLyricsEntity): TrackLyricsEntity => {
    const data = readDb();
    data.trackLyrics = data.trackLyrics || [];
    data.trackLyrics = data.trackLyrics.filter(l => l.trackId !== lyrics.trackId);
    data.trackLyrics.unshift(lyrics);
    writeDb(data);
    return lyrics;
  },

  // --- Ticket Sales ---
  getTicketSales: (): TicketSalesEntity[] => {
    return readDb().ticketSales || [];
  },
  saveTicketSales: (sales: TicketSalesEntity): TicketSalesEntity => {
    const data = readDb();
    data.ticketSales = data.ticketSales || [];
    data.ticketSales = data.ticketSales.filter(s => s.artistId !== sales.artistId);
    data.ticketSales.unshift(sales);
    writeDb(data);
    return sales;
  },

  // --- Profile Views ---
  getProfileViews: (): Record<string, number> => {
    return readDb().profileViews || {};
  },
  incrementProfileViews: (artistId: string): number => {
    const data = readDb();
    data.profileViews = data.profileViews || {};
    data.profileViews[artistId] = (data.profileViews[artistId] || 0) + 1;
    writeDb(data);
    return data.profileViews[artistId];
  },

  // --- Artist Profiles ---
  getArtistProfile: (artistId: string): any => {
    const data = readDb();
    return (data.artistProfiles || {})[artistId] || null;
  },
  saveArtistProfile: (artistId: string, profile: any): any => {
    const data = readDb();
    data.artistProfiles = data.artistProfiles || {};
    data.artistProfiles[artistId] = { ...profile, updatedAt: new Date().toISOString() };
    writeDb(data);
    return data.artistProfiles[artistId];
  },

  // --- Artist Applications ---
  getArtistApplications: (): ArtistApplicationEntity[] => {
    return readDb().artistApplications || [];
  },
  saveArtistApplication: (app: ArtistApplicationEntity): ArtistApplicationEntity => {
    const data = readDb();
    data.artistApplications = data.artistApplications || [];
    data.artistApplications = data.artistApplications.filter(a => a.id !== app.id && a.userId !== app.userId);
    data.artistApplications.unshift(app);
    writeDb(data);
    return app;
  },
  updateArtistApplicationStatus: (appId: string, status: 'PENDING' | 'APPROVED' | 'REJECTED'): boolean => {
    const data = readDb();
    data.artistApplications = data.artistApplications || [];
    const idx = data.artistApplications.findIndex(a => a.id === appId);
    if (idx === -1) return false;
    data.artistApplications[idx].status = status;
    writeDb(data);
    return true;
  },

  // ⚡ Homepage layout data — uses the cached readDb() so no extra disk read
  getHomepageData: () => {
    const data = readDb();
    const allPromos: any[] = (data as any).promotions || [];
    return {
      promotions: allPromos.filter((p: any) => p.status === 'active'),
      homeLayoutOrder: (data as any).homeLayoutOrder || [],
      customSections: (data as any).customSections || {},
      activeTheme: (data as any).activeTheme || null,
      activePreset: (data as any).activePreset || null,
      events: (data as any).events || [],
    };
  },

  // --- Roles Configuration ---
  getRolesConfig: (): any[] => {
    const data = readDb();
    return (data as any).rolesConfig || [];
  },
  saveRolesConfig: (roles: any[]): any[] => {
    const data = readDb();
    (data as any).rolesConfig = roles;
    writeDb(data);
    return roles;
  },

  // --- Database Setup Config ---
  getDbConfig: (): any => {
    const data = readDb();
    return (data as any).dbConfig || null;
  },
  saveDbConfig: (cfg: any): any => {
    const data = readDb();
    (data as any).dbConfig = cfg;
    writeDb(data);
    return cfg;
  },

  // --- API Integrations Config ---
  getApiConfig: (): any => {
    const data = readDb();
    return (data as any).apiConfig || null;
  },
  saveApiConfig: (cfg: any): any => {
    const data = readDb();
    (data as any).apiConfig = cfg;
    writeDb(data);
    return cfg;
  },

  // --- Individual User Permissions override ---
  updateUserPermissions: (userId: string, perms: string[]): boolean => {
    const data = readDb();
    const user = data.users.find(u => u.id === userId);
    if (!user) return false;
    user.customPermissions = perms;
    writeDb(data);
    return true;
  },

  getUserPermissions: (userId: string): string[] => {
    const data = readDb();
    const user = data.users.find(u => u.id === userId);
    if (!user) return [];
    
    // Super admin has all permissions
    if (user.role === 'SUPER_ADMIN' || user.role === 'super_admin') {
      return [
        'manage_admins','manage_roles','manage_database','manage_api_keys',
        'manage_settings','manage_email','manage_sms','manage_notifications',
        'manage_users','manage_artists','manage_songs','manage_content',
        'manage_subscriptions','manage_payments','manage_payouts','view_analytics',
        'export_data','manage_reports','manage_support','manage_marketing',
        'view_audit_logs','impersonate_user','manage_geography','manage_ab_tests'
      ];
    }
    
    // Load roles config
    const rolesConfig = (data as any).rolesConfig || [
      { id: 'admin', permissions: ['manage_users','manage_artists','manage_songs','manage_subscriptions','manage_payments','view_analytics','manage_reports','manage_notifications','manage_support','manage_content','manage_marketing'] },
      { id: 'moderator', permissions: ['manage_artists','manage_songs','manage_reports','manage_support','manage_content'] },
      { id: 'analyst', permissions: ['view_analytics','manage_reports','export_data'] },
    ];
    
    // Find role permissions
    const userRole = (user.role || '').toLowerCase();
    const roleObj = rolesConfig.find((r: any) => r.id.toLowerCase() === userRole);
    
    let permissions = roleObj ? (roleObj.permissions || []) : [];
    
    // Merge user custom overrides if any
    if (user.customPermissions && Array.isArray(user.customPermissions)) {
      permissions = Array.from(new Set([...permissions, ...user.customPermissions]));
    }
    
    return permissions;
  },
};

