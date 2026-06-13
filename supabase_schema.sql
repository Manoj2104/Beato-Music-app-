-- Soundsphere Database Schema for Supabase PostgreSQL
-- Copy and run this script in your Supabase SQL Editor.

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'USER',
    is_active BOOLEAN NOT NULL DEFAULT true,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    avatar TEXT,
    cover_image TEXT,
    subscription TEXT DEFAULT 'free',
    payment_method TEXT,
    billing_cycle TEXT,
    country TEXT DEFAULT 'IN',
    followers INTEGER DEFAULT 0,
    following INTEGER DEFAULT 0,
    liked_songs TEXT[] DEFAULT '{}',
    saved_albums TEXT[] DEFAULT '{}',
    followed_artists TEXT[] DEFAULT '{}',
    playlists TEXT[] DEFAULT '{}',
    preferences JSONB DEFAULT '{"theme": "dark", "language": "en", "autoplay": true, "quality": "very_high", "crossfade": 5, "normalize": true, "showExplicit": true, "privateSession": false, "downloadQuality": "very_high"}'::jsonb,
    stats JSONB DEFAULT '{"discoverScore": 0, "topArtists": [], "topGenres": [], "topTracks": [], "streaksCount": 0, "totalListeningTime": 0}'::jsonb,
    bio TEXT,
    verified BOOLEAN DEFAULT false,
    verification_request JSONB
);

-- 2. TRACKS TABLE
CREATE TABLE IF NOT EXISTS tracks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    artist_id TEXT NOT NULL,
    artist_name TEXT NOT NULL,
    album_id TEXT,
    album_name TEXT,
    cover_image TEXT,
    duration INTEGER DEFAULT 0,
    audio_url TEXT NOT NULL,
    genre TEXT NOT NULL,
    year INTEGER,
    plays INTEGER DEFAULT 0,
    liked BOOLEAN DEFAULT false,
    explicit BOOLEAN DEFAULT false,
    track_number INTEGER DEFAULT 1,
    lyrics TEXT DEFAULT '',
    uploaded_by TEXT,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    status TEXT DEFAULT 'approved',
    featured BOOLEAN DEFAULT false
);

-- 3. PLAYLISTS TABLE
CREATE TABLE IF NOT EXISTS playlists (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    cover_image TEXT,
    owner_id TEXT NOT NULL,
    owner_name TEXT NOT NULL,
    tracks TEXT[] DEFAULT '{}',
    total_tracks INTEGER DEFAULT 0,
    duration INTEGER DEFAULT 0,
    is_public BOOLEAN DEFAULT true,
    is_collaborative BOOLEAN DEFAULT false,
    followers INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    gradient_css TEXT,
    tags TEXT[] DEFAULT '{}'
);

-- 4. COMMENTS TABLE
CREATE TABLE IF NOT EXISTS comments (
    id TEXT PRIMARY KEY,
    track_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    user_avatar TEXT,
    text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    artist_id TEXT,
    reply TEXT DEFAULT '',
    track_title TEXT
);

-- 5. OTPS TABLE
CREATE TABLE IF NOT EXISTS otps (
    phone TEXT PRIMARY KEY,
    code TEXT NOT NULL,
    attempts INTEGER DEFAULT 0,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 6. SESSIONS TABLE
CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    user_agent TEXT,
    ip_address TEXT
);

-- 7. SUPPORT TICKETS TABLE
CREATE TABLE IF NOT EXISTS support_tickets (
    id TEXT PRIMARY KEY,
    "user" TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT NOT NULL,
    category TEXT NOT NULL,
    priority TEXT NOT NULL,
    status TEXT DEFAULT 'open',
    created TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    message TEXT NOT NULL,
    thread JSONB DEFAULT '[]'::jsonb,
    sla_hours INTEGER DEFAULT 48,
    elapsed_hours INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    attachments TEXT[] DEFAULT '{}',
    assigned_dept TEXT,
    rating INTEGER,
    rating_comment TEXT,
    internal_notes JSONB DEFAULT '[]'::jsonb
);

-- 8. ARTIST PAYOUTS TABLE
CREATE TABLE IF NOT EXISTS artist_payouts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    avatar TEXT,
    lifetime_earnings NUMERIC DEFAULT 0.0,
    available_balance NUMERIC DEFAULT 0.0,
    pending_balance NUMERIC DEFAULT 0.0,
    estimated_next_payout NUMERIC DEFAULT 0.0,
    fraud_score NUMERIC DEFAULT 0.0,
    kyc_status TEXT DEFAULT 'unverified',
    tax_verified BOOLEAN DEFAULT false,
    payment_method JSONB
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tracks_artist_id ON tracks(artist_id);
CREATE INDEX IF NOT EXISTS idx_tracks_genre ON tracks(genre);
CREATE INDEX IF NOT EXISTS idx_comments_track_id ON comments(track_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);

-- Seed Initial Users (matching your local database accounts, default password is "password" hashed)
INSERT INTO users (id, name, email, password_hash, role, is_active, phone, created_at, avatar, subscription, country)
VALUES 
(
    'user-1', 
    'Manoj Lastro', 
    'manoj@beato.io', 
    '$2a$10$QOsnY0Z5Rj.0ml976um5cOfENbt1OQ2qQERyGWG3SPIg3uD0N6.YAg9GYI0q09r41Ua', -- hashed 'password'
    'USER', 
    true, 
    '+919999999999', 
    NOW(), 
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop',
    'free',
    'IN'
),
(
    'artist-user-1', 
    'Aurora Nightfall', 
    'artist@beato.com', 
    '$2a$10$QOsnY0Z5Rj.0ml976um5cOfENbt1OQ2qQERyGWG3SPIg3uD0N6.YAg9GYI0q09r41Ua', -- hashed 'password'
    'ARTIST', 
    true, 
    '+918888888888', 
    NOW(), 
    'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=100&h=100&fit=crop',
    'creator',
    'IN'
),
(
    'admin-1', 
    'Admin User', 
    'admin@beato.com', 
    '$2a$10$QOsnY0Z5Rj.0ml976um5cOfENbt1OQ2qQERyGWG3SPIg3uD0N6.YAg9GYI0q09r41Ua', -- hashed 'password'
    'ADMIN', 
    true, 
    '+917777777777', 
    NOW(), 
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
    'premium',
    'IN'
),
(
    'superadmin-1', 
    'Super Admin', 
    'superadmin@beato.com', 
    '$2a$10$QOsnY0Z5Rj.0ml976um5cOfENbt1OQ2qQERyGWG3SPIg3uD0N6.YAg9GYI0q09r41Ua', -- hashed 'password'
    'SUPER_ADMIN', 
    true, 
    '+916666666666', 
    NOW(), 
    'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&h=100&fit=crop',
    'premium',
    'IN'
)
ON CONFLICT (id) DO NOTHING;

-- Seed default tracks matching presets
INSERT INTO tracks (id, title, artist_id, artist_name, album_id, album_name, cover_image, duration, audio_url, genre, year, plays, liked, explicit, status, featured)
VALUES
(
    'track-1',
    'Stellar Drift',
    'artist-user-1',
    'Aurora Nightfall',
    'album-1',
    'Cosmic Echoes',
    'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=400&h=400&fit=crop',
    245,
    'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    'Indie Electronic',
    2026,
    45210,
    false,
    false,
    'approved',
    true
),
(
    'track-2',
    'Midnight Cascade',
    'artist-user-1',
    'Aurora Nightfall',
    'album-1',
    'Cosmic Echoes',
    'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=400&h=400&fit=crop',
    188,
    'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    'Synth Wave',
    2026,
    98233,
    false,
    false,
    'approved',
    true
),
(
    'track-3',
    'Neon Horizon',
    'artist-user-2',
    'Cipher Nova',
    'album-2',
    'Pixelated Skyline',
    'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400&h=400&fit=crop',
    205,
    'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    'Dream Pop',
    2025,
    12544,
    false,
    true,
    'approved',
    false
)
ON CONFLICT (id) DO NOTHING;

-- Migrations/Updates for existing tables
ALTER TABLE comments ADD COLUMN IF NOT EXISTS artist_id TEXT;
ALTER TABLE comments ADD COLUMN IF NOT EXISTS reply TEXT DEFAULT '';
ALTER TABLE comments ADD COLUMN IF NOT EXISTS track_title TEXT;
