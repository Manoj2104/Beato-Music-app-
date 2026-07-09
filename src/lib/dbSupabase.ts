import { createClient } from '@supabase/supabase-js';

let rawSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';

// Auto-correct common typo (trailing 's' in 21-character project ID)
if (rawSupabaseUrl.includes('zizhqtpsamvsbymwxfyps')) {
  rawSupabaseUrl = rawSupabaseUrl.replace('zizhqtpsamvsbymwxfyps', 'zizhqtpsamvsbymwxfyp');
} else {
  const match = rawSupabaseUrl.match(/https:\/\/([a-z0-9]{20})s\.supabase\.co/i);
  if (match) {
    rawSupabaseUrl = `https://${match[1]}.supabase.co`;
  }
}

const supabaseUrl = rawSupabaseUrl;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create a single supabase client for server-side use with admin privileges (Service Role Key)
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

// --- In-Memory Cache for Supabase Cloud Database calls ---
interface CacheEntry {
  data: any;
  timestamp: number;
}

const getCache = (): Record<string, CacheEntry> => {
  const g = global as any;
  if (!g.__beatoSupabaseCache) {
    g.__beatoSupabaseCache = {};
  }
  return g.__beatoSupabaseCache;
};

const fetchCached = async (key: string, ttlMs: number, fetchFn: () => Promise<any>) => {
  const cache = getCache();
  const entry = cache[key];
  const now = Date.now();
  if (entry && now - entry.timestamp < ttlMs) {
    return entry.data;
  }
  const freshData = await fetchFn();
  cache[key] = { data: freshData, timestamp: now };
  return freshData;
};

const invalidateCache = (key: string) => {
  const cache = getCache();
  delete cache[key];
};

export const dbSupabase = {
  // --- Users ---
  getUsers: async () => {
    return fetchCached('users', 10000, async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*');
      if (error) throw error;
      return data || [];
    });
  },

  getUserById: async (id: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    if (error) {
      if (error.code === 'PGRST116') return undefined; // Not found
      throw error;
    }
    return data || undefined;
  },

  getUserByEmail: async (email: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .single();
    if (error) {
      if (error.code === 'PGRST116') return undefined; // Not found
      throw error;
    }
    return data || undefined;
  },

  getUserByPhone: async (phone: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('phone', phone)
      .single();
    if (error) {
      if (error.code === 'PGRST116') return undefined; // Not found
      throw error;
    }
    return data || undefined;
  },

  saveUser: async (user: any) => {
    const { data, error } = await supabase
      .from('users')
      .upsert(user)
      .select()
      .single();
    if (error) throw error;
    invalidateCache('users');
    return data;
  },

  updateUser: async (userId: string, updates: any) => {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    if (error) throw error;
    invalidateCache('users');
    return !!data;
  },

  updateUserRole: async (userId: string, role: string) => {
    const { data, error } = await supabase
      .from('users')
      .update({ role })
      .eq('id', userId)
      .select()
      .single();
    if (error) throw error;
    invalidateCache('users');
    return !!data;
  },

  deleteUser: async (userId: string) => {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);
    if (error) throw error;
    invalidateCache('users');
    return true;
  },

  // --- Tracks ---
  getTracks: async () => {
    return fetchCached('tracks', 10000, async () => {
      const { data, error } = await supabase
        .from('tracks')
        .select('*')
        .order('uploaded_at', { ascending: false });
      if (error) throw error;
      return data || [];
    });
  },

  addTrack: async (track: any) => {
    const { data, error } = await supabase
      .from('tracks')
      .insert(track)
      .select()
      .single();
    if (error) throw error;
    invalidateCache('tracks');
    return data;
  },

  updateTrackStatus: async (trackId: string, status: 'approved' | 'rejected' | 'pending') => {
    const { data, error } = await supabase
      .from('tracks')
      .update({ status })
      .eq('id', trackId)
      .select()
      .single();
    if (error) throw error;
    invalidateCache('tracks');
    return !!data;
  },

  deleteTrack: async (trackId: string) => {
    const { error } = await supabase
      .from('tracks')
      .delete()
      .eq('id', trackId);
    if (error) throw error;
    invalidateCache('tracks');
    return true;
  },

  // --- Playlists ---
  getPlaylists: async () => {
    return fetchCached('playlists', 10000, async () => {
      const { data, error } = await supabase
        .from('playlists')
        .select('*')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return data || [];
    });
  },

  savePlaylist: async (playlist: any) => {
    const { data, error } = await supabase
      .from('playlists')
      .upsert(playlist)
      .select()
      .single();
    if (error) throw error;
    invalidateCache('playlists');
    return data;
  },

  deletePlaylist: async (playlistId: string) => {
    const { error } = await supabase
      .from('playlists')
      .delete()
      .eq('id', playlistId);
    if (error) throw error;
    invalidateCache('playlists');
    return true;
  },

  // --- OTPs ---
  saveOtp: async (phone: string, code: string, expiresAt: Date) => {
    const { data, error } = await supabase
      .from('otps')
      .upsert({
        phone,
        code,
        attempts: 0,
        expires_at: expiresAt.toISOString(),
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  getOtp: async (phone: string) => {
    const { data, error } = await supabase
      .from('otps')
      .select('*')
      .eq('phone', phone)
      .single();
    if (error) {
      if (error.code === 'PGRST116') return undefined;
      throw error;
    }
    if (data) {
      return {
        phone: data.phone,
        code: data.code,
        attempts: data.attempts,
        expiresAt: data.expires_at,
        createdAt: data.created_at
      };
    }
    return undefined;
  },

  incrementOtpAttempts: async (phone: string) => {
    const otp = await dbSupabase.getOtp(phone);
    if (!otp) return 0;
    const nextAttempts = (otp.attempts || 0) + 1;
    await supabase
      .from('otps')
      .update({ attempts: nextAttempts })
      .eq('phone', phone);
    return nextAttempts;
  },

  deleteOtp: async (phone: string) => {
    await supabase
      .from('otps')
      .delete()
      .eq('phone', phone);
  },

  // --- Sessions ---
  saveSession: async (session: any) => {
    const { data, error } = await supabase
      .from('sessions')
      .insert({
        id: session.id,
        user_id: session.userId,
        token: session.token,
        expires_at: session.expiresAt,
        user_agent: session.userAgent,
        ip_address: session.ipAddress
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  getSession: async (token: string) => {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('token', token)
      .single();
    if (error) {
      if (error.code === 'PGRST116') return undefined;
      throw error;
    }
    if (data) {
      return {
        id: data.id,
        userId: data.user_id,
        token: data.token,
        expiresAt: data.expires_at,
        userAgent: data.user_agent,
        ipAddress: data.ip_address
      };
    }
    return undefined;
  },

  deleteSession: async (token: string) => {
    await supabase
      .from('sessions')
      .delete()
      .eq('token', token);
  },

  // --- Comments ---
  getComments: async () => {
    return fetchCached('comments', 10000, async () => {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    });
  },

  saveComment: async (comment: any) => {
    const { data, error } = await supabase
      .from('comments')
      .insert({
        id: comment.id,
        track_id: comment.trackId || comment.track || '',
        user_id: comment.userId || comment.user || '',
        user_name: comment.userName || comment.user || '',
        user_avatar: comment.userAvatar || '',
        text: comment.text,
        created_at: comment.createdAt || comment.time || new Date().toISOString(),
        artist_id: comment.artistId || '',
        reply: comment.reply || '',
        track_title: comment.track || comment.trackTitle || ''
      })
      .select()
      .single();
    if (error) throw error;
    invalidateCache('comments');
    return data;
  },

  // --- Audio Storage ---
  uploadAudio: async (fileBuffer: Buffer, filename: string, mimeType = 'audio/mpeg'): Promise<string> => {
    // Ensure the bucket exists (create if not)
    const bucketName = 'audio-uploads';

    // Upload the file to Supabase Storage
    const { error } = await supabase.storage
      .from(bucketName)
      .upload(filename, fileBuffer, {
        contentType: mimeType,
        upsert: true, // overwrite if same name exists
      });

    if (error) throw error;

    // Get the public URL
    const { data } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filename);

    return data.publicUrl;
  },
};
