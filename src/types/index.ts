export interface Artist {
  id: string;
  name: string;
  image: string;
  coverImage: string;
  bio: string;
  followers: number;
  monthlyListeners: number;
  verified: boolean;
  genres: string[];
  albums: string[];
  topTracks: string[];
  socialLinks: {
    instagram?: string;
    twitter?: string;
    website?: string;
  };
}

export interface Album {
  id: string;
  title: string;
  artistId: string;
  artistName: string;
  coverImage: string;
  releaseDate: string;
  year: number;
  genre: string;
  totalTracks: number;
  duration: number;
  tracks: string[];
  type: 'album' | 'ep' | 'single';
  description?: string;
}

export interface Track {
  id: string;
  title: string;
  artistId: string;
  artistName: string;
  albumId: string;
  albumName: string;
  coverImage: string;
  duration: number;
  audioUrl: string;
  lyrics?: string;
  genre: string;
  year: number;
  plays: number;
  liked: boolean;
  explicit: boolean;
  trackNumber: number;
  waveform?: number[];
  status?: 'pending' | 'approved' | 'rejected';
}

export interface Playlist {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  ownerId: string;
  ownerName: string;
  tracks: string[];
  totalTracks: number;
  duration: number;
  isPublic: boolean;
  isCollaborative: boolean;
  followers: number;
  createdAt: string;
  updatedAt: string;
  gradient?: string;
  gradientCss?: string;
  tags?: string[];
}

export type UserRole = 'USER' | 'ARTIST' | 'ADMIN' | 'SUPER_ADMIN' | 'MODERATOR' | 'ANALYST' | 'moderator' | 'analyst' | 'admin' | 'super_admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  coverImage?: string;
  subscription: 'free' | 'premium' | 'family' | 'student' | 'creator';
  country: string;
  joinedAt: string;
  followers: number;
  following: number;
  likedSongs: string[];
  savedAlbums: string[];
  followedArtists: string[];
  playlists: string[];
  preferences: UserPreferences;
  stats: UserStats;
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
  permissions?: string[];
}

export interface UserPreferences {
  autoplay: boolean;
  crossfade: number;
  normalize: boolean;
  quality: 'low' | 'normal' | 'high' | 'very_high';
  downloadQuality: 'normal' | 'high' | 'very_high';
  showExplicit: boolean;
  privateSession: boolean;
  language: string;
  theme: 'dark' | 'light' | 'system';
}

export interface UserStats {
  totalListeningTime: number;
  topGenres: string[];
  topArtists: string[];
  topTracks: string[];
  streaksCount: number;
  discoverScore: number;
}

export interface PlayerState {
  currentTrack: Track | null;
  queue: Track[];
  history: Track[];
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  progress: number;
  duration: number;
  shuffle: boolean;
  repeat: 'none' | 'one' | 'all';
  crossfade: number;
  isLiked: boolean;
  showQueue: boolean;
  showLyrics: boolean;
  sleepTimer: number | null;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
}

export interface LibraryState {
  playlists: Playlist[];
  likedSongs: Track[];
  savedAlbums: Album[];
  followedArtists: Artist[];
  recentlyPlayed: Track[];
  downloads: Track[];
}

export interface SearchResult {
  tracks: Track[];
  artists: Artist[];
  albums: Album[];
  playlists: Playlist[];
  query: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  period: 'monthly' | 'yearly';
  features: string[];
  highlighted?: boolean;
  color: string;
}

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalArtists: number;
  totalTracks: number;
  revenue: number;
  growth: number;
  streamingHours: number;
  newSignups: number;
}

export interface ArtistStats {
  totalStreams: number;
  monthlyListeners: number;
  followers: number;
  revenue: number;
  topCountries: { country: string; percentage: number }[];
  streamsByDay: { date: string; streams: number }[];
  topTracks: { trackId: string; title: string; streams: number }[];
}

export interface Genre {
  id: string;
  name: string;
  color: string;
  gradient: string;
  image: string;
  trackCount: number;
}

export interface Notification {
  id: string;
  type: 'new_release' | 'follow' | 'like' | 'playlist' | 'system';
  message: string;
  timestamp: string;
  read: boolean;
  artistId?: string;
  trackId?: string;
}
