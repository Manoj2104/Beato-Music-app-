import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create a single supabase client for server-side use with admin privileges (Service Role Key)
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

export const dbSupabase = {
  // --- Users ---
  getUsers: async () => {
    const { data, error } = await supabase
      .from('users')
      .select('*');
    if (error) throw error;
    return data || [];
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
    return !!data;
  },

  deleteUser: async (userId: string) => {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);
    if (error) throw error;
    return true;
  },

  // --- Tracks ---
  getTracks: async () => {
    const { data, error } = await supabase
      .from('tracks')
      .select('*')
      .order('uploaded_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  addTrack: async (track: any) => {
    const { data, error } = await supabase
      .from('tracks')
      .insert(track)
      .select()
      .single();
    if (error) throw error;
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
    return !!data;
  },

  deleteTrack: async (trackId: string) => {
    const { error } = await supabase
      .from('tracks')
      .delete()
      .eq('id', trackId);
    if (error) throw error;
    return true;
  },

  // --- Playlists ---
  getPlaylists: async () => {
    const { data, error } = await supabase
      .from('playlists')
      .select('*')
      .order('updated_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  savePlaylist: async (playlist: any) => {
    const { data, error } = await supabase
      .from('playlists')
      .upsert(playlist)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  deletePlaylist: async (playlistId: string) => {
    const { error } = await supabase
      .from('playlists')
      .delete()
      .eq('id', playlistId);
    if (error) throw error;
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
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    if (data) {
      return data.map(c => ({
        id: c.id,
        trackId: c.track_id,
        userId: c.user_id,
        userName: c.user_name,
        userAvatar: c.user_avatar,
        text: c.text,
        createdAt: c.created_at
      }));
    }
    return [];
  },

  saveComment: async (comment: any) => {
    const { data, error } = await supabase
      .from('comments')
      .insert({
        id: comment.id,
        track_id: comment.trackId,
        user_id: comment.userId,
        user_name: comment.userName,
        user_avatar: comment.userAvatar,
        text: comment.text,
        created_at: comment.createdAt || new Date().toISOString()
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  }
};
