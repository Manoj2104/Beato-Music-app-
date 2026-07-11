import { useAuthStore } from '@/store/authStore';

export function getApiBase(): string {
  if (typeof window === 'undefined') return '';
  const isLocalFile = (
    window.location.protocol === 'file:' || 
    window.location.protocol.startsWith('capacitor') || 
    (window.location.hostname === 'localhost' && window.location.port !== '3000' && window.location.port !== '3001')
  );
  const customApiUrl = window.localStorage.getItem('beato_api_url');
  return (isLocalFile || customApiUrl)
    ? (customApiUrl || 'https://beato-music-app.vercel.app').replace(/\/$/, '')
    : '';
}

export function getAuthToken(): string {
  if (typeof window === 'undefined') return '';
  // Try getting from authStore state
  try {
    const token = useAuthStore.getState().token;
    if (token) return token;
  } catch (e) {}
  
  const match = document.cookie.match(/beato-token=([^;]+)/);
  return match ? match[1] : '';
}

export function getRoomUrl(roomId: string): string {
  if (typeof window !== 'undefined' && (window as any).Capacitor) {
    return `/room?id=${encodeURIComponent(roomId)}`;
  }
  return `/room/${encodeURIComponent(roomId)}`;
}

export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const apiBase = getApiBase();
  
  // Resolve absolute URL if it starts with /api/
  const finalUrl = url.startsWith('/api/') ? `${apiBase}${url}` : url;
  
  // Get active token
  const token = getAuthToken();
  
  // Merge headers
  const headers = new Headers(options.headers || {});
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  
  const finalOptions: RequestInit = {
    ...options,
    headers,
    credentials: 'include'
  };
  
  return fetch(finalUrl, finalOptions);
}
