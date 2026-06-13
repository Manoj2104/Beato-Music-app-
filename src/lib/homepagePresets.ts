// ─── Homepage Presets Library ─────────────────────────────────────────────────
// 30 unique, production-quality homepage layout presets for Beato
// Each preset defines: theme tokens, ordered section configs, and metadata

export interface SectionConfig {
  id: string;
  type: string;
  title: string;
  subtitle?: string;
  layout: 'grid' | 'carousel' | 'list' | 'minimal' | 'hero' | 'bento' | 'masonry' | 'story' | 'story_tiktok' | 'carousel_coverflow' | 'grid_apple' | 'grid_retro' | 'magazine_retro' | 'list_billboard' | 'hero_countdown' | 'magazine' | 'magazine_interview' | 'bento_asymmetric' | 'timeline' | 'genre_tiles' | 'ad_break_banner' | 'hashtag_slides' | 'hero_auto_slider' | 'category_quick_tiles' | 'flash_deals_countdown' | 'new_launches_spotlight' | 'featured_brands_row' | 'top_chart_billboard' | 'artist_follow_cards' | 'free_deals_grid' | 'promo_red_block' | 'fresh_picks_circles' | 'grid_deals' | 'music_summer_store' | 'music_hubs' | 'new_launches_slider' | 'brand_artist_collabs' | 'mood_mania_grid' | 'deals_pricing_slider' | 'playlist_showcase' | 'banner';
  contentSource: 'trending' | 'new_releases' | 'recommended' | 'recently_played' | 'liked' | 'made_for_you' | 'artist_spotlight' | 'genre' | 'mood' | 'custom' | 'playlist' | 'album';
  genre?: string;
  mood?: string;
  background: {
    type: 'solid' | 'gradient' | 'image' | 'video' | 'glass' | 'none';
    value: string;
  };
  animation: 'none' | 'fade' | 'slide-up' | 'scale' | 'pulse' | 'glow';
  borderStyle: 'none' | 'solid' | 'gradient' | 'pulsing' | 'neon';
  borderColor?: string;
  padding: 'none' | 'sm' | 'md' | 'lg';
  visible: boolean;
  audience?: 'all' | 'premium' | 'free';
  startDate?: string;
  endDate?: string;
  cardSize?: 'xs' | 'sm' | 'md' | 'lg';
  cardStyle?: 'classic' | 'glass' | 'neo' | 'retro' | 'gradient' | 'none';
  customImage?: string;
  customVideo?: string;
  mediaType?: 'image' | 'video';
  cardShape?: 'default' | 'square' | 'circle' | 'rectangle_banner_1' | 'rectangle_banner_2' | 'rectangle_banner_3' | 'rectangle_banner_4';
  cardWidth?: number;
  cardHeight?: number;
  sponsorName?: string;
  buttonText?: string;
  targetUrl?: string;
  hashtags?: string;
  genresList?: string;
  banners?: Array<{
    title: string;
    subtitle: string;
    imageUrl: string;
    buttonText?: string;
    targetUrl?: string;
  }>;
}

export interface PresetTheme {
  primary: string;
  primaryGlow: string;
  background: string;
  surface: string;
  card: string;
  text: string;
  textMuted: string;
  accent: string;
  accentSecondary: string;
  font: string;
  borderColor: string;
  gradient: string;
}

export interface HomepagePreset {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  thumbnail: string; // CSS gradient for preview card
  theme: PresetTheme;
  sections: SectionConfig[];
}

// ─── Helper factory ──────────────────────────────────────────────────────────
function sec(
  id: string,
  type: string,
  title: string,
  layout: SectionConfig['layout'],
  contentSource: SectionConfig['contentSource'],
  bg: SectionConfig['background'],
  animation: SectionConfig['animation'] = 'fade',
  border: SectionConfig['borderStyle'] = 'none',
  borderColor?: string,
  subtitle?: string
): SectionConfig {
  return {
    id,
    type,
    title,
    subtitle,
    layout,
    contentSource,
    background: bg,
    animation,
    borderStyle: border,
    borderColor,
    padding: 'md',
    visible: true,
    audience: 'all',
  };
}

const NONE_BG: SectionConfig['background'] = { type: 'none', value: '' };
const DARK_BG: SectionConfig['background'] = { type: 'solid', value: '#121212' };
const GLASS_BG: SectionConfig['background'] = { type: 'glass', value: 'rgba(255,255,255,0.04)' };

// ─── 30 Presets ──────────────────────────────────────────────────────────────
const CORE_PRESETS: HomepagePreset[] = [

  // ── 1. Spotify Classic ────────────────────────────────────────────────────
  {
    id: 'spotify_classic',
    name: 'Spotify Classic',
    description: 'The iconic dark green experience — clean, minimal, and familiar.',
    category: 'Platform Style',
    tags: ['dark', 'minimal', 'green', 'classic'],
    thumbnail: 'linear-gradient(135deg, #121212 0%, #1db954 100%)',
    theme: {
      primary: '#1db954', primaryGlow: 'rgba(29, 185, 84,0.4)',
      background: '#121212', surface: '#181818', card: '#282828',
      text: '#ffffff', textMuted: '#b3b3b3', accent: '#10b981', accentSecondary: '#34d399',
      font: 'Inter', borderColor: '#333333', gradient: 'linear-gradient(180deg, #16201a 0%, #121212 60%)'
    },
    sections: [
      sec('s1','hero','Good Evening',              'hero',      'made_for_you',   { type:'gradient', value:'linear-gradient(180deg, #1a3328 0%, #121212 60%)' }, 'fade'),
      sec('s2','quick','Quick Access',              'minimal',   'recently_played',DARK_BG, 'slide-up'),
      sec('s3','made','Made for You',               'grid',      'made_for_you',   DARK_BG, 'fade'),
      sec('s4','trend','Trending Now',              'carousel',  'trending',       DARK_BG, 'slide-up'),
      sec('s5','new','New Releases',                'grid',      'new_releases',   DARK_BG, 'fade'),
      sec('s6','genre','Browse Genres',             'bento',     'genre',          DARK_BG, 'scale'),
      sec('s7','liked','Your Liked Songs',          'list',      'liked',          DARK_BG, 'fade'),
    ]
  },

  // ── 2. Apple Music Elegance ───────────────────────────────────────────────
  {
    id: 'apple_music',
    name: 'Apple Music Elegance',
    description: 'Crisp white gradients and editorial typography — the Apple aesthetic.',
    category: 'Platform Style',
    tags: ['light', 'editorial', 'apple', 'elegant'],
    thumbnail: 'linear-gradient(135deg, #fc3c44 0%, #ff375f 50%, #fb0a3a 100%)',
    theme: {
      primary: '#fc3c44', primaryGlow: 'rgba(252,60,68,0.4)',
      background: '#000000', surface: '#111111', card: '#1c1c1e',
      text: '#ffffff', textMuted: '#ababab', accent: '#ff375f', accentSecondary: '#9f0020',
      font: 'SF Pro Display, Inter', borderColor: '#2c2c2e', gradient: 'linear-gradient(180deg, #290010 0%, #000 60%)'
    },
    sections: [
      sec('s1','hero','Listen Now',                 'hero',      'recommended',    { type:'gradient', value:'linear-gradient(180deg, #3d0015 0%, #000 50%)' }, 'fade'),
      sec('s2','new','New Music Daily',             'magazine',  'new_releases',   DARK_BG, 'slide-up'),
      sec('s3','artist','Artist Spotlight',         'carousel',  'artist_spotlight',DARK_BG,'fade'),
      sec('s4','chart','Top Charts',                'list',      'trending',       DARK_BG, 'slide-up'),
      sec('s5','radio','Radio Stations',            'grid',      'genre',          DARK_BG, 'fade'),
      sec('s6','mood','Moods & Moments',            'grid',      'mood',           DARK_BG, 'scale'),
    ]
  },

  // ── 3. YouTube Music Vibe ─────────────────────────────────────────────────
  {
    id: 'youtube_music',
    name: 'YouTube Music Vibe',
    description: 'Bold reds with video-first carousel layout and hot new releases.',
    category: 'Platform Style',
    tags: ['red', 'video', 'bold', 'youtube'],
    thumbnail: 'linear-gradient(135deg, #ff0000 0%, #cc0000 100%)',
    theme: {
      primary: '#ff0000', primaryGlow: 'rgba(255,0,0,0.4)',
      background: '#0f0f0f', surface: '#212121', card: '#272727',
      text: '#ffffff', textMuted: '#aaaaaa', accent: '#ff4444', accentSecondary: '#990000',
      font: 'YouTube Sans, Inter', borderColor: '#303030', gradient: 'linear-gradient(180deg, #3d0000 0%, #0f0f0f 60%)'
    },
    sections: [
      sec('s1','hero','Hot Right Now',              'hero',      'trending',       { type:'gradient', value:'linear-gradient(180deg, #3d0000 0%, #0f0f0f 50%)' }, 'fade'),
      sec('s2','new','New Releases',                'carousel',  'new_releases',   DARK_BG, 'slide-up'),
      sec('s3','quick','Quickpicks',                'grid',      'made_for_you',   DARK_BG, 'fade'),
      sec('s4','mix','Your Mixes',                  'grid',      'genre',          DARK_BG, 'scale'),
      sec('s5','trend','Trending Videos',           'carousel',  'trending',       DARK_BG, 'slide-up'),
    ]
  },

  // ── 4. Netflix Drama ─────────────────────────────────────────────────────
  {
    id: 'netflix_drama',
    name: 'Netflix Drama',
    description: 'Full-bleed hero banner with dramatic dark rows — Netflix for music.',
    category: 'Platform Style',
    tags: ['dark', 'cinematic', 'netflix', 'drama'],
    thumbnail: 'linear-gradient(135deg, #e50914 0%, #b20710 100%)',
    theme: {
      primary: '#e50914', primaryGlow: 'rgba(229,9,20,0.4)',
      background: '#141414', surface: '#181818', card: '#222222',
      text: '#ffffff', textMuted: '#999999', accent: '#e50914', accentSecondary: '#831010',
      font: 'Netflix Sans, Inter', borderColor: '#333', gradient: 'linear-gradient(180deg, #3a0005 0%, #141414 50%)'
    },
    sections: [
      sec('s1','hero','Trending Now',               'hero',      'trending',       { type:'gradient', value:'linear-gradient(180deg, #3a0005 0%, #141414 40%)' }, 'fade'),
      sec('s2','continue','Continue Listening',     'carousel',  'recently_played',DARK_BG, 'slide-up'),
      sec('s3','new','New This Week',               'carousel',  'new_releases',   DARK_BG, 'fade'),
      sec('s4','top','Top Songs',                   'carousel',  'trending',       DARK_BG, 'slide-up'),
      sec('s5','mood','Mood Picks',                 'carousel',  'mood',           DARK_BG, 'fade'),
      sec('s6','genre','Genres',                    'carousel',  'genre',          DARK_BG, 'scale'),
    ]
  },

  // ── 5. Glassmorphism Crystal ──────────────────────────────────────────────
  {
    id: 'glassmorphism',
    name: 'Glassmorphism Crystal',
    description: 'Frosted glass panels, blurred backgrounds, and crystal-clear UI.',
    category: 'Design Style',
    tags: ['glass', 'blur', 'modern', 'crystal'],
    thumbnail: 'linear-gradient(135deg, rgba(99,102,241,0.8) 0%, rgba(168,85,247,0.8) 100%)',
    theme: {
      primary: '#818cf8', primaryGlow: 'rgba(129,140,248,0.5)',
      background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
      surface: 'rgba(255,255,255,0.05)', card: 'rgba(255,255,255,0.08)',
      text: '#ffffff', textMuted: 'rgba(255,255,255,0.6)', accent: '#c084fc', accentSecondary: '#4f46e5',
      font: 'Inter', borderColor: 'rgba(255,255,255,0.12)', gradient: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)'
    },
    sections: [
      sec('s1','hero','Your Universe',              'hero',      'made_for_you',   { type:'glass', value:'rgba(255,255,255,0.06)' }, 'fade', 'gradient', 'rgba(129,140,248,0.3)'),
      sec('s2','rec','Recommended',                 'grid',      'recommended',    { type:'glass', value:'rgba(255,255,255,0.04)' }, 'slide-up', 'solid', 'rgba(255,255,255,0.1)'),
      sec('s3','trend','Trending',                  'carousel',  'trending',       GLASS_BG, 'fade'),
      sec('s4','mood','Mood Collections',           'bento',     'mood',           GLASS_BG, 'scale'),
      sec('s5','genre','Genre Vibes',               'grid',      'genre',          GLASS_BG, 'slide-up'),
    ]
  },

  // ── 6. Cyberpunk 2080 ─────────────────────────────────────────────────────
  {
    id: 'cyberpunk',
    name: 'Cyberpunk 2080',
    description: 'Neon cyan meets electric yellow in a dystopian cityscape aesthetic.',
    category: 'Design Style',
    tags: ['neon', 'cyberpunk', 'dark', 'electric'],
    thumbnail: 'linear-gradient(135deg, #00ffff 0%, #ff00ff 50%, #ffff00 100%)',
    theme: {
      primary: '#00ffff', primaryGlow: 'rgba(0,255,255,0.5)',
      background: '#050510', surface: '#0a0a1e', card: '#0f0f28',
      text: '#e0e0ff', textMuted: '#6060aa', accent: '#ff00ff', accentSecondary: '#ffff00',
      font: 'Orbitron, Inter', borderColor: '#00ffff33', gradient: 'linear-gradient(180deg, #00101a 0%, #050510 60%)'
    },
    sections: [
      sec('s1','hero','NEURAL BEATS',               'hero',      'trending',       { type:'gradient', value:'linear-gradient(180deg, #001428 0%, #050510 50%)' }, 'glow', 'neon', '#00ffff'),
      sec('s2','top','TOP CHARTS MATRIX',           'list',      'trending',       { type:'solid', value:'#0a0a1e' }, 'fade', 'neon', '#ff00ff'),
      sec('s3','new','NEW UPLOADS',                 'grid',      'new_releases',   { type:'solid', value:'#0a0a1e' }, 'slide-up', 'neon', '#00ffff'),
      sec('s4','genre','GENRE GRID',                'bento',     'genre',          { type:'solid', value:'#0a0a1e' }, 'scale', 'neon', '#ffff00'),
      sec('s5','mood','EMOTION ENGINE',             'carousel',  'mood',           { type:'solid', value:'#0a0a1e' }, 'pulse', 'neon', '#ff00ff'),
    ]
  },

  // ── 7. Neon Nights ────────────────────────────────────────────────────────
  {
    id: 'neon_nights',
    name: 'Neon Nights',
    description: 'Electric neon glows with a dark city night backdrop.',
    category: 'Design Style',
    tags: ['neon', 'dark', 'glow', 'nightlife'],
    thumbnail: 'linear-gradient(135deg, #ff006e 0%, #8338ec 50%, #3a86ff 100%)',
    theme: {
      primary: '#ff006e', primaryGlow: 'rgba(255,0,110,0.5)',
      background: '#07070f', surface: '#0e0e1a', card: '#151526',
      text: '#ffffff', textMuted: '#7070a0', accent: '#8338ec', accentSecondary: '#3a86ff',
      font: 'Inter', borderColor: '#ff006e33', gradient: 'linear-gradient(135deg, #07070f, #0e0e1a)'
    },
    sections: [
      sec('s1','hero','Tonight\'s Playlist',        'hero',      'made_for_you',   { type:'gradient', value:'linear-gradient(180deg, #200028 0%, #07070f 60%)' }, 'glow', 'pulsing', '#ff006e'),
      sec('s2','trend','On Fire Right Now',         'carousel',  'trending',       DARK_BG, 'pulse', 'neon', '#ff006e'),
      sec('s3','rec','Recommended',                 'grid',      'recommended',    DARK_BG, 'fade'),
      sec('s4','mood','Mood Vibes',                 'bento',     'mood',           DARK_BG, 'slide-up'),
      sec('s5','genre','Genres',                    'grid',      'genre',          DARK_BG, 'scale'),
    ]
  },

  // ── 8. Luxury Black Gold ─────────────────────────────────────────────────
  {
    id: 'luxury_black_gold',
    name: 'Luxury Black Gold',
    description: 'Premium black and gold with serif typography and refined elegance.',
    category: 'Premium Style',
    tags: ['luxury', 'gold', 'black', 'premium', 'elegant'],
    thumbnail: 'linear-gradient(135deg, #000000 0%, #b8860b 50%, #ffd700 100%)',
    theme: {
      primary: '#d4af37', primaryGlow: 'rgba(212,175,55,0.4)',
      background: '#080600', surface: '#100d00', card: '#1a1600',
      text: '#f5e6b3', textMuted: '#8a7a45', accent: '#ffd700', accentSecondary: '#b8860b',
      font: 'Playfair Display, Georgia', borderColor: '#d4af3733', gradient: 'linear-gradient(180deg, #1a1200 0%, #080600 60%)'
    },
    sections: [
      sec('s1','hero','Your Premium Experience',    'hero',      'made_for_you',   { type:'gradient', value:'linear-gradient(180deg, #1a1200 0%, #080600 60%)' }, 'fade', 'gradient', '#d4af37'),
      sec('s2','excl','Exclusive Releases',         'magazine',  'new_releases',   DARK_BG, 'slide-up', 'solid', '#d4af3733'),
      sec('s3','artist','Artist Showcase',          'carousel',  'artist_spotlight',DARK_BG,'fade'),
      sec('s4','chart','Gold Charts',               'list',      'trending',       DARK_BG, 'slide-up'),
      sec('s5','prem','Premium Picks',              'grid',      'recommended',    DARK_BG, 'scale'),
    ]
  },

  // ── 9. Gaming EDM ────────────────────────────────────────────────────────
  {
    id: 'gaming_edm',
    name: 'Gaming EDM',
    description: 'RGB gaming aesthetic with aggressive layouts and EDM focus.',
    category: 'Genre Style',
    tags: ['gaming', 'edm', 'rgb', 'intense', 'dark'],
    thumbnail: 'linear-gradient(135deg, #00ff87 0%, #60efff 50%, #0061ff 100%)',
    theme: {
      primary: '#00ff87', primaryGlow: 'rgba(0,255,135,0.5)',
      background: '#070d0a', surface: '#0a1410', card: '#0f1e17',
      text: '#ffffff', textMuted: '#5a7a66', accent: '#60efff', accentSecondary: '#0061ff',
      font: 'Rajdhani, Inter', borderColor: '#00ff8733', gradient: 'linear-gradient(135deg, #001a0f, #070d0a)'
    },
    sections: [
      sec('s1','hero','DROP THE BEAT',              'hero',      'trending',       { type:'gradient', value:'linear-gradient(180deg, #001a0f 0%, #070d0a 50%)' }, 'pulse', 'neon', '#00ff87'),
      sec('s2','edm','EDM Bangers',                 'carousel',  'genre',          DARK_BG, 'slide-up', 'neon', '#60efff'),
      sec('s3','top','Top Drop Charts',             'list',      'trending',       DARK_BG, 'fade'),
      sec('s4','fest','Festival Lineup',            'bento',     'mood',           DARK_BG, 'glow'),
      sec('s5','new','New Drops',                   'grid',      'new_releases',   DARK_BG, 'scale'),
    ]
  },

  // ── 10. Minimal Clean ────────────────────────────────────────────────────
  {
    id: 'minimal_clean',
    name: 'Minimal Clean',
    description: 'White space mastery with clean typography and subtle shadows.',
    category: 'Design Style',
    tags: ['minimal', 'clean', 'white', 'simple'],
    thumbnail: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
    theme: {
      primary: '#000000', primaryGlow: 'rgba(0,0,0,0.15)',
      background: '#fafafa', surface: '#ffffff', card: '#f0f0f0',
      text: '#111111', textMuted: '#666666', accent: '#333333', accentSecondary: '#999999',
      font: 'Inter', borderColor: '#e0e0e0', gradient: 'linear-gradient(180deg, #f0f0f0 0%, #fafafa 60%)'
    },
    sections: [
      sec('s1','hero','Good Morning',               'hero',      'made_for_you',   { type:'solid', value:'#ffffff' }, 'fade'),
      sec('s2','rec','For You',                     'grid',      'recommended',    NONE_BG, 'slide-up'),
      sec('s3','new','New Releases',                'grid',      'new_releases',   NONE_BG, 'fade'),
      sec('s4','trend','Trending',                  'list',      'trending',       NONE_BG, 'slide-up'),
      sec('s5','genre','Browse',                    'minimal',   'genre',          NONE_BG, 'scale'),
    ]
  },

  // ── 11. SaaS Dashboard ───────────────────────────────────────────────────
  {
    id: 'modern_saas',
    name: 'Modern SaaS',
    description: 'Professional dashboard layout with data-rich cards and metrics.',
    category: 'Design Style',
    tags: ['saas', 'dashboard', 'professional', 'data'],
    thumbnail: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
    theme: {
      primary: '#6366f1', primaryGlow: 'rgba(99,102,241,0.4)',
      background: '#0f0f1a', surface: '#16162a', card: '#1e1e38',
      text: '#e2e8f0', textMuted: '#64748b', accent: '#818cf8', accentSecondary: '#4f46e5',
      font: 'Inter', borderColor: '#2d2d4e', gradient: 'linear-gradient(180deg, #1a1a2e 0%, #0f0f1a 60%)'
    },
    sections: [
      sec('s1','hero','Your Dashboard',             'bento',     'made_for_you',   { type:'gradient', value:'linear-gradient(180deg, #1a1a2e 0%, #0f0f1a 60%)' }, 'fade'),
      sec('s2','rec','Curated For You',             'grid',      'recommended',    DARK_BG, 'slide-up'),
      sec('s3','trend','Trending Analytics',        'list',      'trending',       DARK_BG, 'fade'),
      sec('s4','genre','Genre Hub',                 'bento',     'genre',          DARK_BG, 'scale'),
      sec('s5','artist','Featured Artists',         'carousel',  'artist_spotlight',DARK_BG,'slide-up'),
    ]
  },

  // ── 12. Magazine Editorial ────────────────────────────────────────────────
  {
    id: 'magazine_editorial',
    name: 'Magazine Editorial',
    description: 'Bold editorial headlines with magazine-style grid layouts.',
    category: 'Design Style',
    tags: ['magazine', 'editorial', 'bold', 'typography'],
    thumbnail: 'linear-gradient(135deg, #1a1a1a 0%, #c9a96e 100%)',
    theme: {
      primary: '#c9a96e', primaryGlow: 'rgba(201,169,110,0.4)',
      background: '#0e0e0e', surface: '#161616', card: '#1e1e1e',
      text: '#f0ece4', textMuted: '#888880', accent: '#e8c987', accentSecondary: '#8a6d3b',
      font: 'Merriweather, Georgia', borderColor: '#c9a96e33', gradient: 'linear-gradient(180deg, #1e180a 0%, #0e0e0e 60%)'
    },
    sections: [
      sec('s1','hero','COVER STORY',                'hero',      'artist_spotlight',{ type:'gradient', value:'linear-gradient(180deg, #1e180a 0%, #0e0e0e 60%)' }, 'fade'),
      sec('s2','feat','Featured Albums',            'magazine',  'new_releases',   DARK_BG, 'slide-up'),
      sec('s3','chart','Chart Toppers',             'list',      'trending',       DARK_BG, 'fade'),
      sec('s4','genre','Genre Editions',            'grid',      'genre',          DARK_BG, 'scale'),
    ]
  },

  // ── 13. Pinterest Mosaic ──────────────────────────────────────────────────
  {
    id: 'pinterest_mosaic',
    name: 'Pinterest Mosaic',
    description: 'Masonry grid discovery with rich visual cards and exploration.',
    category: 'Design Style',
    tags: ['masonry', 'discovery', 'visual', 'colorful'],
    thumbnail: 'linear-gradient(135deg, #e60023 0%, #ad081b 100%)',
    theme: {
      primary: '#e60023', primaryGlow: 'rgba(230,0,35,0.4)',
      background: '#111111', surface: '#1a1a1a', card: '#222222',
      text: '#ffffff', textMuted: '#888888', accent: '#ff4757', accentSecondary: '#c0392b',
      font: 'Inter', borderColor: '#333333', gradient: 'linear-gradient(180deg, #2d0007 0%, #111111 60%)'
    },
    sections: [
      sec('s1','hero','Discover Music',             'hero',      'recommended',    { type:'gradient', value:'linear-gradient(180deg, #2d0007 0%, #111111 50%)' }, 'fade'),
      sec('s2','disc','Discover New',               'masonry',   'new_releases',   DARK_BG, 'slide-up'),
      sec('s3','mood','Mood Boards',                'masonry',   'mood',           DARK_BG, 'scale'),
      sec('s4','genre','Genre Collections',         'masonry',   'genre',          DARK_BG, 'fade'),
      sec('s5','artist','Artists',                  'grid',      'artist_spotlight',DARK_BG,'slide-up'),
    ]
  },

  // ── 14. TikTok Feed ──────────────────────────────────────────────────────
  {
    id: 'tiktok_feed',
    name: 'TikTok Dynamic Feed',
    description: 'Vertical story-style feed with viral trending content first.',
    category: 'Platform Style',
    tags: ['tiktok', 'viral', 'dynamic', 'feed', 'social'],
    thumbnail: 'linear-gradient(135deg, #010101 0%, #69c9d0 50%, #ee1d52 100%)',
    theme: {
      primary: '#ee1d52', primaryGlow: 'rgba(238,29,82,0.4)',
      background: '#010101', surface: '#161616', card: '#212121',
      text: '#ffffff', textMuted: '#888888', accent: '#69c9d0', accentSecondary: '#ee1d52',
      font: 'Inter', borderColor: '#333333', gradient: 'linear-gradient(180deg, #1a0010 0%, #010101 60%)'
    },
    sections: [
      sec('s1','hero','#ForYou',                    'story',     'trending',       { type:'gradient', value:'linear-gradient(180deg, #1a0010 0%, #010101 40%)' }, 'slide-up'),
      sec('s2','viral','Viral Right Now',           'story',     'trending',       DARK_BG, 'slide-up'),
      sec('s3','trend','Trending Sounds',           'carousel',  'trending',       DARK_BG, 'fade'),
      sec('s4','new','New Artists',                 'grid',      'artist_spotlight',DARK_BG,'scale'),
      sec('s5','genre','Music Genres',              'grid',      'genre',          DARK_BG, 'fade'),
    ]
  },

  // ── 15. Instagram Aesthetic ───────────────────────────────────────────────
  {
    id: 'instagram_aesthetic',
    name: 'Instagram Aesthetic',
    description: 'Stories, reels, and square grid vibes for a social music experience.',
    category: 'Platform Style',
    tags: ['instagram', 'aesthetic', 'visual', 'social'],
    thumbnail: 'linear-gradient(135deg, #833ab4 0%, #fd1d1d 50%, #fcb045 100%)',
    theme: {
      primary: '#833ab4', primaryGlow: 'rgba(131,58,180,0.4)',
      background: '#000000', surface: '#121212', card: '#1e1e1e',
      text: '#ffffff', textMuted: '#888888', accent: '#fd1d1d', accentSecondary: '#fcb045',
      font: 'Inter', borderColor: '#2a2a2a', gradient: 'linear-gradient(135deg, #1a0028, #000)'
    },
    sections: [
      sec('s1','stories','Stories',                 'story',     'recently_played',{ type:'gradient', value:'linear-gradient(135deg, #1a0028 0%, #000 60%)' }, 'scale'),
      sec('s2','rec','Recommended',                 'grid',      'recommended',    DARK_BG, 'fade'),
      sec('s3','explore','Explore',                 'masonry',   'genre',          DARK_BG, 'slide-up'),
      sec('s4','artist','Artist Posts',             'grid',      'artist_spotlight',DARK_BG,'scale'),
      sec('s5','trend','Trending',                  'carousel',  'trending',       DARK_BG, 'fade'),
    ]
  },

  // ── 16. Retro 80s Wave ───────────────────────────────────────────────────
  {
    id: 'retro_80s',
    name: 'Retro 80s Wave',
    description: 'Synthwave aesthetics with scanlines, purple sunsets, and nostalgia.',
    category: 'Design Style',
    tags: ['retro', '80s', 'synthwave', 'nostalgia', 'purple'],
    thumbnail: 'linear-gradient(135deg, #2d1b69 0%, #ff0080 50%, #ff8c00 100%)',
    theme: {
      primary: '#ff0080', primaryGlow: 'rgba(255,0,128,0.5)',
      background: '#0a0015', surface: '#120025', card: '#1e0040',
      text: '#f0d0ff', textMuted: '#8060aa', accent: '#00ffff', accentSecondary: '#ff8c00',
      font: 'Chakra Petch, Inter', borderColor: '#ff008033', gradient: 'linear-gradient(180deg, #1e0040 0%, #0a0015 60%)'
    },
    sections: [
      sec('s1','hero','WELCOME TO THE GRID',        'hero',      'made_for_you',   { type:'gradient', value:'linear-gradient(180deg, #200050 0%, #0a0015 60%)' }, 'glow', 'neon', '#ff0080'),
      sec('s2','hit','80s Greatest Hits',           'carousel',  'genre',          DARK_BG, 'fade', 'neon', '#00ffff'),
      sec('s3','trend','Synthwave Charts',          'list',      'trending',       DARK_BG, 'slide-up'),
      sec('s4','mood','Nostalgia Moods',            'bento',     'mood',           DARK_BG, 'pulse'),
    ]
  },

  // ── 17. Futuristic AI ────────────────────────────────────────────────────
  {
    id: 'futuristic_ai',
    name: 'Futuristic AI',
    description: 'AI-first interface with holographic blue tones and data visualization.',
    category: 'Design Style',
    tags: ['ai', 'futuristic', 'tech', 'holographic', 'blue'],
    thumbnail: 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 50%, #06b6d4 100%)',
    theme: {
      primary: '#0ea5e9', primaryGlow: 'rgba(14,165,233,0.5)',
      background: '#020617', surface: '#0a0f1e', card: '#0f172a',
      text: '#e2e8f0', textMuted: '#475569', accent: '#06b6d4', accentSecondary: '#6366f1',
      font: 'Space Grotesk, Inter', borderColor: '#0ea5e933', gradient: 'linear-gradient(180deg, #0a1628 0%, #020617 60%)'
    },
    sections: [
      sec('s1','hero','AI Music Experience',        'hero',      'recommended',    { type:'gradient', value:'linear-gradient(180deg, #0a1628 0%, #020617 60%)' }, 'glow', 'neon', '#0ea5e9'),
      sec('s2','ai','AI Recommendations',           'grid',      'made_for_you',   DARK_BG, 'fade', 'solid', '#0ea5e933'),
      sec('s3','trend','Neural Trending',           'carousel',  'trending',       DARK_BG, 'slide-up'),
      sec('s4','disc','AI Discovery',               'bento',     'genre',          DARK_BG, 'scale'),
      sec('s5','new','New Neural Drops',            'grid',      'new_releases',   DARK_BG, 'glow'),
    ]
  },

  // ── 18. Premium Subscription ─────────────────────────────────────────────
  {
    id: 'premium_subscription',
    name: 'Premium Subscription',
    description: 'Conversion-focused with gold accents and exclusive-feel messaging.',
    category: 'Marketing Style',
    tags: ['premium', 'conversion', 'upsell', 'exclusive'],
    thumbnail: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #db2777 100%)',
    theme: {
      primary: '#7c3aed', primaryGlow: 'rgba(124,58,237,0.4)',
      background: '#0c0a1e', surface: '#13102b', card: '#1e1a3d',
      text: '#ffffff', textMuted: '#9ca3af', accent: '#f59e0b', accentSecondary: '#db2777',
      font: 'Inter', borderColor: '#7c3aed33', gradient: 'linear-gradient(180deg, #1a1040 0%, #0c0a1e 60%)'
    },
    sections: [
      sec('s1','hero','Unlock Premium',             'hero',      'recommended',    { type:'gradient', value:'linear-gradient(180deg, #1a1040 0%, #0c0a1e 60%)' }, 'fade', 'gradient', '#7c3aed'),
      sec('s2','excl','Exclusive Content',          'grid',      'made_for_you',   DARK_BG, 'slide-up'),
      sec('s3','hi','High-Fidelity Audio',          'carousel',  'new_releases',   DARK_BG, 'fade'),
      sec('s4','artist','Premium Artist Sessions',  'magazine',  'artist_spotlight',DARK_BG,'scale'),
      sec('s5','advert','Ad-Free Experience',       'bento',     'mood',           DARK_BG, 'glow'),
    ]
  },

  // ── 19. Artist Promotion ─────────────────────────────────────────────────
  {
    id: 'artist_promo',
    name: 'Artist Promotion',
    description: 'Artist-first spotlight design for launches, tours, and campaigns.',
    category: 'Marketing Style',
    tags: ['artist', 'promo', 'launch', 'campaign'],
    thumbnail: 'linear-gradient(135deg, #f97316 0%, #ef4444 50%, #34d399 100%)',
    theme: {
      primary: '#f97316', primaryGlow: 'rgba(249,115,22,0.4)',
      background: '#0f0800', surface: '#1a1000', card: '#251800',
      text: '#fff7ed', textMuted: '#92400e', accent: '#ef4444', accentSecondary: '#34d399',
      font: 'Outfit, Inter', borderColor: '#f9731633', gradient: 'linear-gradient(180deg, #251000 0%, #0f0800 60%)'
    },
    sections: [
      sec('s1','hero','Artist Spotlight',           'hero',      'artist_spotlight',{ type:'gradient', value:'linear-gradient(180deg, #251000 0%, #0f0800 60%)' }, 'fade', 'gradient', '#f97316'),
      sec('s2','top','Artist Top Tracks',           'list',      'trending',       DARK_BG, 'slide-up'),
      sec('s3','album','Latest Albums',             'carousel',  'new_releases',   DARK_BG, 'fade'),
      sec('s4','similar','Similar Artists',         'grid',      'artist_spotlight',DARK_BG,'scale'),
    ]
  },

  // ── 20. Event Promotion ───────────────────────────────────────────────────
  {
    id: 'event_promo',
    name: 'Event Promotion',
    description: 'Concert and festival promotions with ticket-style cards.',
    category: 'Marketing Style',
    tags: ['event', 'concert', 'festival', 'promo'],
    thumbnail: 'linear-gradient(135deg, #14b8a6 0%, #0ea5e9 50%, #6366f1 100%)',
    theme: {
      primary: '#14b8a6', primaryGlow: 'rgba(20,184,166,0.4)',
      background: '#030d0c', surface: '#071a18', card: '#0d2825',
      text: '#ccfbf1', textMuted: '#4d7c78', accent: '#0ea5e9', accentSecondary: '#6366f1',
      font: 'Space Grotesk, Inter', borderColor: '#14b8a633', gradient: 'linear-gradient(180deg, #0d2825 0%, #030d0c 60%)'
    },
    sections: [
      sec('s1','hero','Live Events',                'hero',      'trending',       { type:'gradient', value:'linear-gradient(180deg, #0d2825 0%, #030d0c 60%)' }, 'fade', 'gradient', '#14b8a6'),
      sec('s2','fest','Festival Collections',       'carousel',  'mood',           DARK_BG, 'slide-up'),
      sec('s3','live','Live Concert Songs',         'grid',      'trending',       DARK_BG, 'fade'),
      sec('s4','genre','Genres Playing Live',       'bento',     'genre',          DARK_BG, 'scale'),
    ]
  },

  // ── 21. Bento Grid Modern ─────────────────────────────────────────────────
  {
    id: 'bento_grid',
    name: 'Bento Grid Modern',
    description: 'Apple WWDC-inspired bento grid tiles with spacious layout.',
    category: 'Design Style',
    tags: ['bento', 'grid', 'modern', 'apple', 'tiles'],
    thumbnail: 'linear-gradient(135deg, #1c1c1e 0%, #2c2c2e 100%)',
    theme: {
      primary: '#0a84ff', primaryGlow: 'rgba(10,132,255,0.4)',
      background: '#000000', surface: '#1c1c1e', card: '#2c2c2e',
      text: '#ffffff', textMuted: '#98989d', accent: '#30d158', accentSecondary: '#ff9f0a',
      font: 'SF Pro Display, Inter', borderColor: '#38383a', gradient: 'linear-gradient(180deg, #1c1c1e 0%, #000 60%)'
    },
    sections: [
      sec('s1','hero','Your Day in Music',          'bento',     'made_for_you',   { type:'gradient', value:'linear-gradient(180deg, #1c1c1e 0%, #000 60%)' }, 'fade'),
      sec('s2','rec','Recommended',                 'bento',     'recommended',    DARK_BG, 'slide-up'),
      sec('s3','trend','Trending',                  'bento',     'trending',       DARK_BG, 'scale'),
      sec('s4','genre','Genres',                    'bento',     'genre',          DARK_BG, 'fade'),
    ]
  },

  // ── 22. Hero Banner Focus ─────────────────────────────────────────────────
  {
    id: 'hero_banner',
    name: 'Hero Banner Focus',
    description: 'Full-width dramatic hero with large artwork and immersive feel.',
    category: 'Layout Style',
    tags: ['hero', 'banner', 'immersive', 'large'],
    thumbnail: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)',
    theme: {
      primary: '#4f46e5', primaryGlow: 'rgba(79,70,229,0.4)',
      background: '#09090b', surface: '#18181b', card: '#27272a',
      text: '#fafafa', textMuted: '#71717a', accent: '#818cf8', accentSecondary: '#6366f1',
      font: 'Inter', borderColor: '#3f3f46', gradient: 'linear-gradient(180deg, #1e1b4b 0%, #09090b 60%)'
    },
    sections: [
      sec('s1','hero','Featured Today',             'hero',      'artist_spotlight',{ type:'gradient', value:'linear-gradient(180deg, #1e1b4b 0%, #09090b 60%)' }, 'fade', 'gradient', '#4f46e5'),
      sec('s2','new','New Music',                   'grid',      'new_releases',   DARK_BG, 'slide-up'),
      sec('s3','trend','Trending',                  'carousel',  'trending',       DARK_BG, 'fade'),
      sec('s4','playlist','Playlists',              'grid',      'playlist',       DARK_BG, 'scale'),
    ]
  },

  // ── 23. Masonry Discovery ─────────────────────────────────────────────────
  {
    id: 'masonry_discovery',
    name: 'Masonry Discovery',
    description: 'Pinterest-style infinite masonry for deep music exploration.',
    category: 'Layout Style',
    tags: ['masonry', 'discovery', 'explore', 'visual'],
    thumbnail: 'linear-gradient(135deg, #065f46 0%, #059669 50%, #34d399 100%)',
    theme: {
      primary: '#059669', primaryGlow: 'rgba(5,150,105,0.4)',
      background: '#022c22', surface: '#064e3b', card: '#065f46',
      text: '#ecfdf5', textMuted: '#6ee7b7', accent: '#34d399', accentSecondary: '#10b981',
      font: 'Inter', borderColor: '#059669', gradient: 'linear-gradient(180deg, #064e3b 0%, #022c22 60%)'
    },
    sections: [
      sec('s1','hero','Explore Everything',         'hero',      'genre',          { type:'gradient', value:'linear-gradient(180deg, #064e3b 0%, #022c22 60%)' }, 'fade'),
      sec('s2','disc','Discover',                   'masonry',   'recommended',    DARK_BG, 'slide-up'),
      sec('s3','new','New Music',                   'masonry',   'new_releases',   DARK_BG, 'fade'),
      sec('s4','mood','Moods',                      'masonry',   'mood',           DARK_BG, 'scale'),
    ]
  },

  // ── 24. Story Format ──────────────────────────────────────────────────────
  {
    id: 'story_format',
    name: 'Story Format',
    description: 'Snapchat/Instagram story-style vertical cards for quick browsing.',
    category: 'Layout Style',
    tags: ['story', 'vertical', 'swipe', 'social'],
    thumbnail: 'linear-gradient(135deg, #6d28d9 0%, #db2777 100%)',
    theme: {
      primary: '#a855f7', primaryGlow: 'rgba(168,85,247,0.4)',
      background: '#09000f', surface: '#160022', card: '#200033',
      text: '#ffffff', textMuted: '#9d4edd', accent: '#db2777', accentSecondary: '#7c3aed',
      font: 'Inter', borderColor: '#a855f733', gradient: 'linear-gradient(180deg, #1a0028 0%, #09000f 60%)'
    },
    sections: [
      sec('s1','stories','Now Playing',             'story',     'recently_played',{ type:'gradient', value:'linear-gradient(180deg, #1a0028 0%, #09000f 60%)' }, 'slide-up'),
      sec('s2','hot','Hot Stories',                 'story',     'trending',       DARK_BG, 'slide-up'),
      sec('s3','rec','For You',                     'grid',      'made_for_you',   DARK_BG, 'fade'),
      sec('s4','artist','Artist Stories',           'story',     'artist_spotlight',DARK_BG,'slide-up'),
    ]
  },

  // ── 25. Tamil/Indian Classical ────────────────────────────────────────────
  {
    id: 'indian_classical',
    name: 'Indian Classical',
    description: 'Warm saffron and deep maroon for Carnatic, Bollywood, and Tamil music.',
    category: 'Genre Style',
    tags: ['indian', 'classical', 'bollywood', 'tamil', 'warm'],
    thumbnail: 'linear-gradient(135deg, #7c1d0a 0%, #c8450d 50%, #f59e0b 100%)',
    theme: {
      primary: '#f59e0b', primaryGlow: 'rgba(245,158,11,0.4)',
      background: '#0f0600', surface: '#1a0e00', card: '#261500',
      text: '#fef3c7', textMuted: '#92400e', accent: '#c8450d', accentSecondary: '#7c1d0a',
      font: 'Poppins, Inter', borderColor: '#f59e0b33', gradient: 'linear-gradient(180deg, #261500 0%, #0f0600 60%)'
    },
    sections: [
      sec('s1','hero','ராகம் & ரிதம்',              'hero',      'made_for_you',   { type:'gradient', value:'linear-gradient(180deg, #261500 0%, #0f0600 60%)' }, 'fade', 'gradient', '#f59e0b'),
      sec('s2','clas','Classical Ragas',            'carousel',  'genre',          DARK_BG, 'slide-up'),
      sec('s3','bol','Bollywood Hits',              'grid',      'trending',       DARK_BG, 'fade'),
      sec('s4','mood','Emotional Picks',            'bento',     'mood',           DARK_BG, 'scale'),
    ]
  },

  // ── 26. K-Pop Idol ────────────────────────────────────────────────────────
  {
    id: 'kpop_idol',
    name: 'K-Pop Idol',
    description: 'Pastel meets vibrant pops of pink and purple for K-Pop fans.',
    category: 'Genre Style',
    tags: ['kpop', 'idol', 'pink', 'vibrant', 'kawaii'],
    thumbnail: 'linear-gradient(135deg, #ff80ab 0%, #e040fb 50%, #7c4dff 100%)',
    theme: {
      primary: '#e040fb', primaryGlow: 'rgba(224,64,251,0.4)',
      background: '#0e0014', surface: '#1a0022', card: '#260033',
      text: '#fff0ff', textMuted: '#c580d0', accent: '#ff80ab', accentSecondary: '#7c4dff',
      font: 'Noto Sans KR, Inter', borderColor: '#e040fb33', gradient: 'linear-gradient(180deg, #200030 0%, #0e0014 60%)'
    },
    sections: [
      sec('s1','hero','K-Pop Universe',             'hero',      'trending',       { type:'gradient', value:'linear-gradient(180deg, #200030 0%, #0e0014 60%)' }, 'pulse', 'pulsing', '#e040fb'),
      sec('s2','idol','Idol Charts',                'list',      'trending',       DARK_BG, 'slide-up'),
      sec('s3','new','New K-Pop Drops',             'grid',      'new_releases',   DARK_BG, 'fade'),
      sec('s4','artist','Your Idols',               'carousel',  'artist_spotlight',DARK_BG,'scale'),
    ]
  },

  // ── 27. Lo-Fi Chill ───────────────────────────────────────────────────────
  {
    id: 'lofi_chill',
    name: 'Lo-Fi & Chill',
    description: 'Earthy tones and warm brown gradients for study and relaxation.',
    category: 'Genre Style',
    tags: ['lofi', 'chill', 'study', 'relax', 'warm'],
    thumbnail: 'linear-gradient(135deg, #44403c 0%, #78716c 50%, #a8956e 100%)',
    theme: {
      primary: '#d4a574', primaryGlow: 'rgba(212,165,116,0.4)',
      background: '#1a1612', surface: '#221e18', card: '#2e2820',
      text: '#faf0e6', textMuted: '#8a7a6a', accent: '#c8956e', accentSecondary: '#6b5240',
      font: 'Lora, Georgia', borderColor: '#d4a57433', gradient: 'linear-gradient(180deg, #2e2820 0%, #1a1612 60%)'
    },
    sections: [
      sec('s1','hero','Lo-Fi Study Session',        'hero',      'mood',           { type:'gradient', value:'linear-gradient(180deg, #2e2820 0%, #1a1612 60%)' }, 'fade'),
      sec('s2','chill','Chill Beats',               'carousel',  'genre',          DARK_BG, 'slide-up'),
      sec('s3','study','Study Playlists',           'grid',      'playlist',       DARK_BG, 'fade'),
      sec('s4','mood','Relax Moods',                'bento',     'mood',           DARK_BG, 'scale'),
    ]
  },

  // ── 28. Hip-Hop Street ───────────────────────────────────────────────────
  {
    id: 'hiphop_street',
    name: 'Hip-Hop Street',
    description: 'Bold graffiti-inspired design for hip-hop and trap music.',
    category: 'Genre Style',
    tags: ['hiphop', 'street', 'urban', 'trap', 'bold'],
    thumbnail: 'linear-gradient(135deg, #000000 0%, #fbbf24 50%, #f97316 100%)',
    theme: {
      primary: '#fbbf24', primaryGlow: 'rgba(251,191,36,0.4)',
      background: '#050505', surface: '#0f0f0f', card: '#1a1a1a',
      text: '#ffffff', textMuted: '#888888', accent: '#f97316', accentSecondary: '#dc2626',
      font: 'Bebas Neue, Inter', borderColor: '#fbbf2433', gradient: 'linear-gradient(180deg, #1a1000 0%, #050505 60%)'
    },
    sections: [
      sec('s1','hero','STREET ANTHEMS',             'hero',      'trending',       { type:'gradient', value:'linear-gradient(180deg, #1a1000 0%, #050505 60%)' }, 'slide-up', 'neon', '#fbbf24'),
      sec('s2','top','Top 100',                     'list',      'trending',       DARK_BG, 'fade'),
      sec('s3','new','New Drops',                   'grid',      'new_releases',   DARK_BG, 'slide-up'),
      sec('s4','artist','Artists',                  'carousel',  'artist_spotlight',DARK_BG,'scale'),
    ]
  },

  // ── 29. Jazz & Blues ──────────────────────────────────────────────────────
  {
    id: 'jazz_blues',
    name: 'Jazz & Blues',
    description: 'Smoky blue midnight atmosphere for jazz, blues, and soul.',
    category: 'Genre Style',
    tags: ['jazz', 'blues', 'soul', 'midnight', 'smoky'],
    thumbnail: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 50%, #7c3aed 100%)',
    theme: {
      primary: '#10b981', primaryGlow: 'rgba(16, 185, 129,0.4)',
      background: '#030711', surface: '#0a1628', card: '#111d35',
      text: '#e0e8f9', textMuted: '#4a6fa5', accent: '#60a5fa', accentSecondary: '#7c3aed',
      font: 'Lora, Inter', borderColor: '#10b98133', gradient: 'linear-gradient(180deg, #111d35 0%, #030711 60%)'
    },
    sections: [
      sec('s1','hero','Midnight Sessions',          'hero',      'mood',           { type:'gradient', value:'linear-gradient(180deg, #111d35 0%, #030711 60%)' }, 'fade'),
      sec('s2','jazz','Jazz Standards',             'carousel',  'genre',          DARK_BG, 'slide-up'),
      sec('s3','blue','Blues Collection',           'grid',      'genre',          DARK_BG, 'fade'),
      sec('s4','artist','Jazz Artists',             'magazine',  'artist_spotlight',DARK_BG,'scale'),
    ]
  },

  // ── 30. Workout Pump ─────────────────────────────────────────────────────
  {
    id: 'workout_pump',
    name: 'Workout Pump',
    description: 'High-energy orange and red for gym, fitness, and motivation.',
    category: 'Genre Style',
    tags: ['workout', 'gym', 'energy', 'fitness', 'motivation'],
    thumbnail: 'linear-gradient(135deg, #dc2626 0%, #ea580c 50%, #fbbf24 100%)',
    theme: {
      primary: '#ea580c', primaryGlow: 'rgba(234,88,12,0.5)',
      background: '#0c0200', surface: '#180500', card: '#240900',
      text: '#fff7ed', textMuted: '#9a3412', accent: '#fbbf24', accentSecondary: '#dc2626',
      font: 'Rajdhani, Inter', borderColor: '#ea580c33', gradient: 'linear-gradient(180deg, #240900 0%, #0c0200 60%)'
    },
    sections: [
      sec('s1','hero','CRUSH YOUR WORKOUT',         'hero',      'mood',           { type:'gradient', value:'linear-gradient(180deg, #240900 0%, #0c0200 60%)' }, 'pulse', 'neon', '#ea580c'),
      sec('s2','gym','Gym Anthems',                 'list',      'genre',          DARK_BG, 'slide-up'),
      sec('s3','pump','Pump-Up Playlists',          'carousel',  'playlist',       DARK_BG, 'fade'),
      sec('s4','mot','Motivation Drops',            'grid',      'new_releases',   DARK_BG, 'scale'),
    ]
  },

  // ── 31. Retro 90s Grunge ──────────────────────────────────────────────────
  {
    id: 'retro_90s_grunge',
    name: 'Retro 90s Grunge',
    description: 'A grungy aesthetic featuring raw, earthy tones and custom rock headers.',
    category: 'Design Style',
    tags: ['retro', '90s', 'grunge', 'rock', 'alternative'],
    thumbnail: 'linear-gradient(135deg, #1b262c 0%, #0f4c81 100%)',
    theme: {
      primary: '#0f4c81', primaryGlow: 'rgba(15,76,129,0.4)',
      background: '#090e11', surface: '#121b20', card: '#1b272f',
      text: '#bbe1fa', textMuted: '#5a7888', accent: '#3282b8', accentSecondary: '#1f4068',
      font: 'Courier New, monospace', borderColor: '#1b272f', gradient: 'linear-gradient(180deg, #121b20 0%, #090e11 60%)'
    },
    sections: [
      sec('s31_1', 'hero', 'Alternative Sounds', 'hero', 'genre', { type: 'gradient', value: 'linear-gradient(180deg, #121b20 0%, #090e11 60%)' }, 'fade'),
      sec('s31_2', 'quick_access', 'Quick Jams', 'minimal', 'recently_played', DARK_BG, 'slide-up'),
      sec('s31_3', 'rock_hits', '90s Rock Revival', 'grid', 'genre', DARK_BG, 'fade'),
    ]
  },
  // ── 32. Chillhop Cafe ──────────────────────────────────────────────────────
  {
    id: 'chillhop_cafe',
    name: 'Chillhop Cafe',
    description: 'Earthy brown tones and warm ambient selections — a cafe reading mood.',
    category: 'Genre Style',
    tags: ['lofi', 'chill', 'cafe', 'acoustic', 'warm'],
    thumbnail: 'linear-gradient(135deg, #3e2723 0%, #5d4037 100%)',
    theme: {
      primary: '#8d6e63', primaryGlow: 'rgba(141,110,99,0.4)',
      background: '#150f0d', surface: '#211815', card: '#2e221e',
      text: '#d7ccc8', textMuted: '#7f6f6a', accent: '#a1887f', accentSecondary: '#4e342e',
      font: 'Lora, serif', borderColor: '#2e221e', gradient: 'linear-gradient(180deg, #211815 0%, #150f0d 60%)'
    },
    sections: [
      sec('s32_1', 'quick_access', 'Welcome Back', 'minimal', 'recently_played', DARK_BG, 'fade'),
      sec('s32_2', 'cafe_beats', 'Coffee Shop Vibes', 'carousel', 'mood', DARK_BG, 'slide-up'),
      sec('s32_3', 'study_tunes', 'Late Night Focus', 'grid', 'genre', DARK_BG, 'scale'),
    ]
  },
  // ── 33. Hyperpop Glitch ────────────────────────────────────────────────────
  {
    id: 'hyperpop_glitch',
    name: 'Hyperpop Glitch',
    description: 'Extravagant neon pinks and loud greens for maximum digital impact.',
    category: 'Design Style',
    tags: ['neon', 'hyperpop', 'glitch', 'vibrant', 'pop'],
    thumbnail: 'linear-gradient(135deg, #ff007f 0%, #7fff00 100%)',
    theme: {
      primary: '#ff007f', primaryGlow: 'rgba(255,0,127,0.5)',
      background: '#040008', surface: '#0c0114', card: '#180124',
      text: '#7fff00', textMuted: '#ff007f88', accent: '#7fff00', accentSecondary: '#ff007f',
      font: 'Impact, sans-serif', borderColor: '#180124', gradient: 'linear-gradient(180deg, #0c0114 0%, #040008 60%)'
    },
    sections: [
      sec('s33_1', 'hero', 'DIGITAL OVERLOAD', 'hero', 'trending', { type: 'gradient', value: 'linear-gradient(180deg, #0c0114 0%, #040008 60%)' }, 'glow', 'neon', '#ff007f'),
      sec('s33_2', 'quick_access', 'QUICK GLITCH', 'minimal', 'recently_played', DARK_BG, 'pulse'),
      sec('s33_3', 'glitch_mix', 'HYPERPOP SELECTIONS', 'bento', 'genre', DARK_BG, 'scale'),
    ]
  },
  // ── 34. Vocaloid Symphony ──────────────────────────────────────────────────
  {
    id: 'vocaloid_symphony',
    name: 'Vocaloid Symphony',
    description: 'Electric teals and pristine light blue layouts, inspired by virtual pop stars.',
    category: 'Genre Style',
    tags: ['teal', 'vocaloid', 'pop', 'anime', 'japan'],
    thumbnail: 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)',
    theme: {
      primary: '#39c5bb', primaryGlow: 'rgba(57,197,187,0.4)',
      background: '#040b0e', surface: '#0a171d', card: '#11252e',
      text: '#e0f7f6', textMuted: '#477e80', accent: '#00f2fe', accentSecondary: '#4facfe',
      font: 'Space Grotesk, sans-serif', borderColor: '#11252e', gradient: 'linear-gradient(180deg, #0a171d 0%, #040b0e 60%)'
    },
    sections: [
      sec('s34_1', 'hero', 'Miku\'s Stage', 'hero', 'artist_spotlight', { type: 'solid', value: '#0a171d' }, 'fade'),
      sec('s34_2', 'mix', 'Virtual Diva Melodies', 'carousel', 'genre', DARK_BG, 'scale'),
      sec('s34_3', 'chart', 'Hatsune Charts', 'list', 'trending', DARK_BG, 'slide-up'),
    ]
  },
  // ── 35. Anime OST Haven ────────────────────────────────────────────────────
  {
    id: 'anime_ost_haven',
    name: 'Anime OST Haven',
    description: 'Pastel cherry blossoms and cinematic orchestral scores.',
    category: 'Genre Style',
    tags: ['anime', 'soundtrack', 'pastel', 'pink', 'orchestral'],
    thumbnail: 'linear-gradient(135deg, #ffb3ba 0%, #ffdfba 100%)',
    theme: {
      primary: '#ff85a2', primaryGlow: 'rgba(255,133,162,0.4)',
      background: '#15050a', surface: '#230a13', card: '#31101b',
      text: '#ffe5ec', textMuted: '#a26b77', accent: '#f9bec7', accentSecondary: '#ff85a2',
      font: 'Outfit, sans-serif', borderColor: '#31101b', gradient: 'linear-gradient(180deg, #230a13 0%, #15050a 60%)'
    },
    sections: [
      sec('s35_1', 'quick_access', 'Cherry Blossom Jams', 'minimal', 'recently_played', DARK_BG, 'fade'),
      sec('s35_2', 'ost_show', 'Top Anime Soundtracks', 'grid', 'genre', DARK_BG, 'scale'),
      sec('s35_3', 'piano', 'Relaxing Anime Piano', 'carousel', 'mood', DARK_BG, 'slide-up'),
    ]
  },
  // ── 36. Deep House Lounge ──────────────────────────────────────────────────
  {
    id: 'deep_house_lounge',
    name: 'Deep House Lounge',
    description: 'Deep violet neon with pulsating cards and ambient club structures.',
    category: 'Genre Style',
    tags: ['house', 'edm', 'club', 'violet', 'neon'],
    thumbnail: 'linear-gradient(135deg, #130cb7 0%, #52e5e7 100%)',
    theme: {
      primary: '#9b5de5', primaryGlow: 'rgba(155,93,229,0.4)',
      background: '#04010a', surface: '#0c0519', card: '#160b2b',
      text: '#f1e9fa', textMuted: '#674d8e', accent: '#f15bb5', accentSecondary: '#00f5d4',
      font: 'Rajdhani, sans-serif', borderColor: '#160b2b', gradient: 'linear-gradient(180deg, #0c0519 0%, #04010a 60%)'
    },
    sections: [
      sec('s36_1', 'hero', 'MAIN CLUB STAGE', 'hero', 'trending', { type: 'gradient', value: 'linear-gradient(180deg, #0c0519 0%, #04010a 60%)' }, 'glow', 'neon', '#9b5de5'),
      sec('s36_2', 'quick_access', 'VIP ACCESS', 'minimal', 'recently_played', DARK_BG, 'fade'),
      sec('s36_3', 'house_mix', 'Pulsating Deep House', 'bento', 'genre', DARK_BG, 'scale'),
    ]
  },
  // ── 37. Latin Fiesta ───────────────────────────────────────────────────────
  {
    id: 'latin_fiesta',
    name: 'Latin Fiesta',
    description: 'Hot red and sun flare yellow for high-tempo Reggaeton and Salsa.',
    category: 'Genre Style',
    tags: ['latin', 'reggaeton', 'salsa', 'party', 'yellow'],
    thumbnail: 'linear-gradient(135deg, #e52d27 0%, #b31217 100%)',
    theme: {
      primary: '#ff4d00', primaryGlow: 'rgba(255,77,0,0.4)',
      background: '#0b0200', surface: '#160802', card: '#250f04',
      text: '#fff3eb', textMuted: '#9e5235', accent: '#ffd700', accentSecondary: '#ff4d00',
      font: 'Poppins, sans-serif', borderColor: '#250f04', gradient: 'linear-gradient(180deg, #160802 0%, #0b0200 60%)'
    },
    sections: [
      sec('s37_1', 'hero', 'Ritmo y Salsa', 'hero', 'trending', { type: 'gradient', value: 'linear-gradient(180deg, #160802 0%, #0b0200 50%)' }, 'fade'),
      sec('s37_2', 'latin_hits', 'Latin Grammys Nominees', 'grid', 'genre', DARK_BG, 'slide-up'),
      sec('s37_3', 'fiesta_party', 'Fiesta Party Mix', 'carousel', 'mood', DARK_BG, 'scale'),
    ]
  },
  // ── 38. Classical Focus ────────────────────────────────────────────────────
  {
    id: 'classical_focus',
    name: 'Classical Focus',
    description: 'Royal gold accents with clean, high-contrast serif typography.',
    category: 'Genre Style',
    tags: ['classical', 'piano', 'violin', 'elegant', 'focus'],
    thumbnail: 'linear-gradient(135deg, #141e30 0%, #243b55 100%)',
    theme: {
      primary: '#dfb76c', primaryGlow: 'rgba(223,183,108,0.4)',
      background: '#040608', surface: '#0c0f13', card: '#161a20',
      text: '#f2eae1', textMuted: '#68737f', accent: '#f5e4c3', accentSecondary: '#dfb76c',
      font: 'Playfair Display, serif', borderColor: '#161a20', gradient: 'linear-gradient(180deg, #0c0f13 0%, #040608 60%)'
    },
    sections: [
      sec('s38_1', 'hero', 'The Classical Era', 'hero', 'genre', { type: 'gradient', value: 'linear-gradient(180deg, #0c0f13 0%, #040608 50%)' }, 'fade'),
      sec('s38_2', 'classical_list', 'Baroque & Classical Hits', 'list', 'genre', DARK_BG, 'slide-up'),
      sec('s38_3', 'focus_piano', 'Piano Masterpieces', 'carousel', 'mood', DARK_BG, 'scale'),
    ]
  },
  // ── 39. Cyberpunk Industrial ───────────────────────────────────────────────
  {
    id: 'cyberpunk_industrial',
    name: 'Cyberpunk Industrial',
    description: 'Aggressive steel gray with glowing hazard orange borders.',
    category: 'Design Style',
    tags: ['cyberpunk', 'industrial', 'orange', 'tech', 'dark'],
    thumbnail: 'linear-gradient(135deg, #2d3748 0%, #1a202c 100%)',
    theme: {
      primary: '#ff6b00', primaryGlow: 'rgba(255,107,0,0.5)',
      background: '#08080a', surface: '#111216', card: '#181b22',
      text: '#e2e8f0', textMuted: '#4a5568', accent: '#ff6b00', accentSecondary: '#2d3748',
      font: 'Orbitron, sans-serif', borderColor: '#ff6b0033', gradient: 'linear-gradient(180deg, #111216 0%, #08080a 60%)'
    },
    sections: [
      sec('s39_1', 'hero', 'INDUSTRIAL ENGINE', 'hero', 'trending', { type: 'solid', value: '#111216' }, 'glow', 'neon', '#ff6b00'),
      sec('s39_2', 'quick_access', 'TERMINAL', 'minimal', 'recently_played', DARK_BG, 'fade'),
      sec('s39_3', 'industrial_chart', 'HEAVY METAL CHARTS', 'list', 'genre', DARK_BG, 'slide-up'),
    ]
  },
  // ── 40. Acoustic Sunset ────────────────────────────────────────────────────
  {
    id: 'acoustic_sunset',
    name: 'Acoustic Sunset',
    description: 'Warm amber tones and soothing sunset-inspired gradients.',
    category: 'Layout Style',
    tags: ['acoustic', 'sunset', 'amber', 'chill', 'soothing'],
    thumbnail: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    theme: {
      primary: '#f3a683', primaryGlow: 'rgba(243,166,131,0.4)',
      background: '#120b08', surface: '#1c120e', card: '#271914',
      text: '#fbf0eb', textMuted: '#8d685c', accent: '#f7d794', accentSecondary: '#f3a683',
      font: 'Inter, sans-serif', borderColor: '#271914', gradient: 'linear-gradient(180deg, #1c120e 0%, #120b08 60%)'
    },
    sections: [
      sec('s40_1', 'quick_access', 'Golden Hour', 'minimal', 'recently_played', DARK_BG, 'fade'),
      sec('s40_2', 'sunset_vibe', 'Acoustic Campfire', 'carousel', 'genre', DARK_BG, 'slide-up'),
      sec('s40_3', 'calm_mood', 'Sunset Melancholy', 'grid', 'mood', DARK_BG, 'scale'),
    ]
  },
  // ── 41. Future Bass Nebula ─────────────────────────────────────────────────
  {
    id: 'future_bass_nebula',
    name: 'Future Bass Nebula',
    description: 'Cosmic purple and electric hot pink details for trap and synth fans.',
    category: 'Design Style',
    tags: ['cosmic', 'future-bass', 'nebula', 'purple', 'neon'],
    thumbnail: 'linear-gradient(135deg, #f02fc2 0%, #6094ea 100%)',
    theme: {
      primary: '#34d399', primaryGlow: 'rgba(52, 211, 153,0.5)',
      background: '#04010b', surface: '#0d041c', card: '#180931',
      text: '#faeef4', textMuted: '#71559e', accent: '#a855f7', accentSecondary: '#34d399',
      font: 'Space Grotesk, sans-serif', borderColor: '#180931', gradient: 'linear-gradient(180deg, #0d041c 0%, #04010b 60%)'
    },
    sections: [
      sec('s41_1', 'hero', 'Cosmic Synthesizer', 'hero', 'trending', { type: 'gradient', value: 'linear-gradient(180deg, #0d041c 0%, #04010b 50%)' }, 'glow', 'neon', '#34d399'),
      sec('s41_2', 'made', 'Cosmic Mix Maker', 'bento', 'made_for_you', DARK_BG, 'scale'),
      sec('s41_3', 'future_drops', 'Hyper Releases', 'grid', 'new_releases', DARK_BG, 'fade'),
    ]
  },
  // ── 42. Reggae Sunshine ────────────────────────────────────────────────────
  {
    id: 'reggae_sunshine',
    name: 'Reggae Sunshine',
    description: 'The organic warmth of Jamaica — red, yellow, and deep herb green accents.',
    category: 'Genre Style',
    tags: ['reggae', 'jamaica', 'sunshine', 'roots', 'green'],
    thumbnail: 'linear-gradient(135deg, #009b72 0%, #f1d302 50%, #c1292e 100%)',
    theme: {
      primary: '#009b72', primaryGlow: 'rgba(0,155,114,0.4)',
      background: '#060a04', surface: '#0e1408', card: '#16200c',
      text: '#f1f8ed', textMuted: '#587a3e', accent: '#f1d302', accentSecondary: '#c1292e',
      font: 'Impact, sans-serif', borderColor: '#16200c', gradient: 'linear-gradient(180deg, #0e1408 0%, #060a04 60%)'
    },
    sections: [
      sec('s42_1', 'hero', 'One Love & Roots', 'hero', 'trending', { type: 'gradient', value: 'linear-gradient(180deg, #0e1408 0%, #060a04 50%)' }, 'fade'),
      sec('s42_2', 'reggae_dub', 'Dub & Roots Classics', 'grid', 'genre', DARK_BG, 'slide-up'),
      sec('s42_3', 'warm_riddim', 'Sunny Riddims', 'carousel', 'mood', DARK_BG, 'scale'),
    ]
  },
  // ── 43. Dark Ambient Void ──────────────────────────────────────────────────
  {
    id: 'dark_ambient_void',
    name: 'Dark Ambient Void',
    description: 'Minimal, pitch black visual landscape with highly subdued gray tones.',
    category: 'Layout Style',
    tags: ['dark', 'ambient', 'void', 'minimal', 'monochromatic'],
    thumbnail: 'linear-gradient(135deg, #000 0%, #111 100%)',
    theme: {
      primary: '#444444', primaryGlow: 'rgba(68,68,68,0.2)',
      background: '#020202', surface: '#080808', card: '#101010',
      text: '#cccccc', textMuted: '#4f4f4f', accent: '#333333', accentSecondary: '#111111',
      font: 'Courier New, monospace', borderColor: '#101010', gradient: 'linear-gradient(180deg, #080808 0%, #020202 60%)'
    },
    sections: [
      sec('s43_1', 'ambient_shelf', 'The Abyss', 'grid', 'genre', { type: 'solid', value: '#080808' }, 'fade'),
      sec('s43_2', 'calm_void', 'Dark Ambient Textures', 'carousel', 'mood', DARK_BG, 'scale'),
      sec('s43_3', 'history', 'Monochrome Plays', 'list', 'recently_played', DARK_BG, 'fade'),
    ]
  },
  // ── 44. Synthwave Outrun ───────────────────────────────────────────────────
  {
    id: 'synthwave_outrun',
    name: 'Synthwave Outrun',
    description: 'Electric pink and grid blue with retro futuristic neon vibes.',
    category: 'Design Style',
    tags: ['synthwave', 'outrun', 'retro', 'neon', 'pink'],
    thumbnail: 'linear-gradient(135deg, #001026 0%, #ff007f 100%)',
    theme: {
      primary: '#ff007f', primaryGlow: 'rgba(255,0,127,0.5)',
      background: '#02000d', surface: '#09001b', card: '#160032',
      text: '#00ffff', textMuted: '#7f00ff', accent: '#00ffff', accentSecondary: '#ff007f',
      font: 'Orbitron, sans-serif', borderColor: '#ff007f33', gradient: 'linear-gradient(180deg, #09001b 0%, #02000d 60%)'
    },
    sections: [
      sec('s44_1', 'hero', 'OUTRUN CODES', 'hero', 'made_for_you', { type: 'gradient', value: 'linear-gradient(180deg, #09001b 0%, #02000d 50%)' }, 'glow', 'neon', '#ff007f'),
      sec('s44_2', 'quick_access', 'FAST ACCESS', 'minimal', 'recently_played', DARK_BG, 'slide-up'),
      sec('s44_3', 'synth_drive', 'Outrun Night Drive', 'bento', 'genre', DARK_BG, 'scale'),
    ]
  },
  // ── 45. Indie Folk Forest ──────────────────────────────────────────────────
  {
    id: 'indie_folk_forest',
    name: 'Indie Folk Forest',
    description: 'Forest green, warm pine woods, and gold details for acoustic and folk listeners.',
    category: 'Genre Style',
    tags: ['folk', 'indie', 'forest', 'green', 'woodland'],
    thumbnail: 'linear-gradient(135deg, #1b4332 0%, #2d6a4f 100%)',
    theme: {
      primary: '#b79457', primaryGlow: 'rgba(183,148,87,0.4)',
      background: '#091510', surface: '#11221b', card: '#1b3228',
      text: '#e8f5e9', textMuted: '#5c786c', accent: '#d4af37', accentSecondary: '#2d6a4f',
      font: 'Georgia, serif', borderColor: '#1b3228', gradient: 'linear-gradient(180deg, #11221b 0%, #091510 60%)'
    },
    sections: [
      sec('s45_1', 'hero', 'Folk & Wilderness', 'hero', 'recommended', { type: 'gradient', value: 'linear-gradient(180deg, #11221b 0%, #091510 50%)' }, 'fade'),
      sec('s45_2', 'acoustic', 'Acoustic Guitar Sessions', 'carousel', 'genre', DARK_BG, 'slide-up'),
      sec('s45_3', 'forest_mood', 'Indie Folk Cabin', 'grid', 'mood', DARK_BG, 'scale'),
    ]
  },
  // ── 46. Tamil/Carnatic Gold ────────────────────────────────────────────────
  {
    id: 'tamil_carnatic_gold',
    name: 'Tamil Carnatic Gold',
    description: 'Elegant saffron and rich temple gold details for traditional music.',
    category: 'Genre Style',
    tags: ['tamil', 'carnatic', 'indian', 'traditional', 'gold'],
    thumbnail: 'linear-gradient(135deg, #781c00 0%, #ff8c00 100%)',
    theme: {
      primary: '#d4af37', primaryGlow: 'rgba(212,175,55,0.4)',
      background: '#0d0400', surface: '#1b0b00', card: '#2c1500',
      text: '#fff1e0', textMuted: '#9e6231', accent: '#ff8c00', accentSecondary: '#d4af37',
      font: 'Poppins, sans-serif', borderColor: '#2c1500', gradient: 'linear-gradient(180deg, #1b0b00 0%, #0d0400 60%)'
    },
    sections: [
      sec('s46_1', 'hero', 'மங்கல இசை', 'hero', 'artist_spotlight', { type: 'gradient', value: 'linear-gradient(180deg, #1b0b00 0%, #0d0400 50%)' }, 'fade', 'gradient', '#d4af37'),
      sec('s46_2', 'raga_list', 'Classical Sangeetham', 'list', 'genre', DARK_BG, 'slide-up'),
      sec('s46_3', 'tamil_hits', 'Traditional Instrumentals', 'carousel', 'genre', DARK_BG, 'scale'),
    ]
  },
  // ── 47. K-Pop Pastel ───────────────────────────────────────────────────────
  {
    id: 'kpop_pastel',
    name: 'K-Pop Pastel Lavender',
    description: 'Soft lavender pinks and cute holographic buttons for K-Pop fans.',
    category: 'Genre Style',
    tags: ['kpop', 'pastel', 'lavender', 'pink', 'kawaii'],
    thumbnail: 'linear-gradient(135deg, #dec0f1 0%, #f7d6e0 100%)',
    theme: {
      primary: '#dec0f1', primaryGlow: 'rgba(222,192,241,0.4)',
      background: '#0e0814', surface: '#1b1224', card: '#2a1d35',
      text: '#faf3ff', textMuted: '#c3aed6', accent: '#f7d6e0', accentSecondary: '#dec0f1',
      font: 'Noto Sans KR, sans-serif', borderColor: '#2a1d35', gradient: 'linear-gradient(180deg, #1b1224 0%, #0e0814 60%)'
    },
    sections: [
      sec('s47_1', 'quick_access', 'Holographic Stage', 'minimal', 'recently_played', DARK_BG, 'scale'),
      sec('s47_2', 'trend', 'Viral Idol Tracks', 'grid', 'trending', DARK_BG, 'fade'),
      sec('s47_3', 'new', 'Brand New MV Releases', 'carousel', 'new_releases', DARK_BG, 'slide-up'),
    ]
  },
  // ── 48. Lo-Fi Rainy Day ────────────────────────────────────────────────────
  {
    id: 'lofi_rainy_day',
    name: 'Lo-Fi Rainy Day',
    description: 'Rainy window panes and soft ambient blue-gray background tones.',
    category: 'Genre Style',
    tags: ['lofi', 'rain', 'chill', 'soothing', 'study'],
    thumbnail: 'linear-gradient(135deg, #4b5563 0%, #1f2937 100%)',
    theme: {
      primary: '#93c5fd', primaryGlow: 'rgba(147,197,253,0.4)',
      background: '#0f172a', surface: '#1e293b', card: '#334155',
      text: '#f1f5f9', textMuted: '#64748b', accent: '#60a5fa', accentSecondary: '#93c5fd',
      font: 'Lora, serif', borderColor: '#334155', gradient: 'linear-gradient(180deg, #1e293b 0%, #0f172a 60%)'
    },
    sections: [
      sec('s48_1', 'hero', 'Rainy Cafe study', 'hero', 'mood', { type: 'solid', value: '#1e293b' }, 'fade'),
      sec('s48_2', 'lofi_rain', 'Rain Soundscapes & Beats', 'carousel', 'genre', DARK_BG, 'slide-up'),
      sec('s48_3', 'calm_study', 'Study Focus Playlists', 'grid', 'playlist', DARK_BG, 'scale'),
    ]
  },
  // ── 49. Hip-Hop Golden Era ─────────────────────────────────────────────────
  {
    id: 'hiphop_golden_era',
    name: 'Hip-Hop Golden Era',
    description: 'Retro 90s boom-bap aesthetic featuring deep gold and classic typography.',
    category: 'Genre Style',
    tags: ['hiphop', 'classic', 'gold', 'boom-bap', '90s'],
    thumbnail: 'linear-gradient(135deg, #1e1e24 0%, #d4af37 100%)',
    theme: {
      primary: '#d4af37', primaryGlow: 'rgba(212,175,55,0.4)',
      background: '#080808', surface: '#121212', card: '#1d1d1d',
      text: '#ffffff', textMuted: '#8a7e58', accent: '#d4af37', accentSecondary: '#b8860b',
      font: 'Bebas Neue, sans-serif', borderColor: '#1d1d1d', gradient: 'linear-gradient(180deg, #121212 0%, #080808 60%)'
    },
    sections: [
      sec('s49_1', 'hero', '90S HIP-HOP NATION', 'hero', 'trending', { type: 'gradient', value: 'linear-gradient(180deg, #121212 0%, #080808 60%)' }, 'slide-up'),
      sec('s49_2', 'boom_bap', 'Classic Boom-Bap Beats', 'grid', 'genre', DARK_BG, 'fade'),
      sec('s49_3', 'artist', 'Legendary Rap Artists', 'carousel', 'artist_spotlight', DARK_BG, 'scale'),
    ]
  },
  // ── 50. Disco Fever ────────────────────────────────────────────────────────
  {
    id: 'disco_fever',
    name: 'Disco Fever 70s',
    description: 'Retro rainbow sparkles and neon purple elements for disco grooves.',
    category: 'Genre Style',
    tags: ['disco', 'funk', 'groove', '70s', 'neon'],
    thumbnail: 'linear-gradient(135deg, #7b2cbf 0%, #ff007f 100%)',
    theme: {
      primary: '#ff007f', primaryGlow: 'rgba(255,0,127,0.5)',
      background: '#06000d', surface: '#0f001e', card: '#1c0038',
      text: '#fffae0', textMuted: '#a37bb8', accent: '#f15bb5', accentSecondary: '#00f5d4',
      font: 'Rajdhani, sans-serif', borderColor: '#ff007f33', gradient: 'linear-gradient(180deg, #0f001e 0%, #06000d 60%)'
    },
    sections: [
      sec('s50_1', 'hero', 'DISCO GROOVES', 'hero', 'trending', { type: 'gradient', value: 'linear-gradient(180deg, #0f001e 0%, #06000d 50%)' }, 'glow', 'pulsing', '#ff007f'),
      sec('s50_2', 'funk_hits', '70s Funk & Soul Charts', 'list', 'trending', DARK_BG, 'slide-up'),
      sec('s50_3', 'groove_playlist', 'Disco Party Dancefloor', 'bento', 'genre', DARK_BG, 'scale'),
    ]
  },

];

// Generate 70 more unique presets to reach 100+ professional templates
const GENERATED_PRESETS: HomepagePreset[] = [];

const GENRES = [
  'Rock', 'Pop', 'Hip-Hop', 'Jazz', 'Classical', 'EDM', 'Lofi', 'Country', 
  'Metal', 'Blues', 'Reggae', 'Tamil', 'K-Pop', 'Latin', 'Ambient', 'Soul',
  'Disco', 'Folk', 'Synthwave', 'Punk', 'R&B', 'Gospel', 'Acoustic', 'Salsa'
];

const THEME_COMBOS = [
  { primary: '#ff0055', bg: '#080005', surface: '#10000a', card: '#180010', accent: '#ff77aa' },
  { primary: '#00ffcc', bg: '#000808', surface: '#001010', card: '#001818', accent: '#33ffdd' },
  { primary: '#ffaa00', bg: '#080500', surface: '#100a00', card: '#180f00', accent: '#ffbb33' },
  { primary: '#8800ff', bg: '#05000a', surface: '#0a0010', card: '#100018', accent: '#aa55ff' },
  { primary: '#00ff66', bg: '#000a03', surface: '#001507', card: '#00200b', accent: '#55ff88' },
  { primary: '#ff3300', bg: '#0a0200', surface: '#150500', card: '#200700', accent: '#ff6633' },
  { primary: '#0099ff', bg: '#00050a', surface: '#000a15', card: '#001020', accent: '#33aaff' }
];

const MOODS = ['Happy', 'Chill', 'Energetic', 'Romantic', 'Focus', 'Sad', 'Sleep', 'Workout', 'Meditation', 'Party'];

for (let i = 1; i <= 70; i++) {
  const genre = GENRES[i % GENRES.length];
  const mood = MOODS[i % MOODS.length];
  const theme = THEME_COMBOS[i % THEME_COMBOS.length];
  
  const id = `gen_preset_${i}`;
  const name = `${genre} & ${mood} Universe`;
  const description = `A beautiful, custom generated preset styled for listening to ${genre} and feeling ${mood}.`;
  const thumbnail = `linear-gradient(135deg, ${theme.bg} 0%, ${theme.primary} 100%)`;
  
  GENERATED_PRESETS.push({
    id,
    name,
    description,
    category: i % 2 === 0 ? 'Genre Style' : 'Layout Style',
    tags: [genre.toLowerCase(), mood.toLowerCase(), 'generated', 'modern'],
    thumbnail,
    theme: {
      primary: theme.primary,
      primaryGlow: `${theme.primary}44`,
      background: theme.bg,
      surface: theme.surface,
      card: theme.card,
      text: '#ffffff',
      textMuted: '#888888',
      accent: theme.accent,
      accentSecondary: theme.primary,
      font: i % 2 === 0 ? 'Space Grotesk' : 'Outfit',
      borderColor: `${theme.primary}22`,
      gradient: `linear-gradient(180deg, ${theme.surface} 0%, ${theme.bg} 60%)`
    },
    sections: [
      sec(`g_${i}_s1`, 'hero', `${genre} & ${mood}`, 'hero', 'made_for_you', { type: 'gradient', value: `linear-gradient(180deg, ${theme.surface} 0%, ${theme.bg} 50%)` }, 'fade'),
      sec(`g_${i}_s2`, 'quick', 'Quick Access', 'minimal', 'recently_played', { type: 'none', value: '' }, 'slide-up'),
      sec(`g_${i}_s3`, 'rec', `Best of ${genre}`, 'grid', 'genre', { type: 'none', value: '' }, 'fade'),
      sec(`g_${i}_s4`, 'mood', `${mood} Playlist`, 'carousel', 'mood', { type: 'none', value: '' }, 'scale'),
      sec(`g_${i}_s5`, 'trend', 'Trending Beats', 'list', 'trending', { type: 'none', value: '' }, 'slide-up'),
    ]
  });
}

export const HOMEPAGE_PRESETS: HomepagePreset[] = [];

export const PRESET_CATEGORIES = [
  'All', 'Platform Style', 'Design Style', 'Premium Style',
  'Marketing Style', 'Layout Style', 'Genre Style'
];

export function getPresetById(id: string): HomepagePreset | undefined {
  return HOMEPAGE_PRESETS.find(p => p.id === id);
}

export function getPresetsByCategory(category: string): HomepagePreset[] {
  if (category === 'All') return HOMEPAGE_PRESETS;
  return HOMEPAGE_PRESETS.filter(p => p.category === category);
}

export function getPresetsByTag(tag: string): HomepagePreset[] {
  return HOMEPAGE_PRESETS.filter(p => p.tags.includes(tag));
}
