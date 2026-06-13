import { SectionConfig } from '@/lib/homepagePresets';

export interface BlockDef {
  id: string;
  label: string;
  icon: string;
  category: string;
  defaultLayout: SectionConfig['layout'];
  defaultSource: SectionConfig['contentSource'];
  description: string;
}

export const SECTION_BLOCKS: BlockDef[] = [
  // ── 1. Hero Sections (10 Blocks) ────────────────────────────────────────────────
  { id: 'hero_banner',       label: 'Hero Banner',           icon: '🎯', category: 'Hero',       defaultLayout: 'hero',     defaultSource: 'made_for_you',    description: 'Full-width cinematic hero section' },
  { id: 'cinematic_splash',  label: 'Cinematic Splash',      icon: '🎬', category: 'Hero',       defaultLayout: 'hero',     defaultSource: 'recommended',     description: 'Large cover visual splash header' },
  { id: 'fullscreen_video',  label: 'Fullscreen Video',      icon: '📹', category: 'Hero',       defaultLayout: 'hero',     defaultSource: 'artist_spotlight',description: 'Cinematic loop video header banner' },
  { id: 'parallax_slider',   label: 'Parallax Slider',       icon: '↕️', category: 'Hero',       defaultLayout: 'hero',     defaultSource: 'trending',        description: 'Parallax background scrolling slider' },
  { id: 'typo_welcome',      label: 'Typographic Welcome',   icon: '✍️', category: 'Hero',       defaultLayout: 'hero',     defaultSource: 'made_for_you',    description: 'Editorial custom text welcome banner' },
  { id: 'compact_banner',    label: 'Compact Banner',        icon: '🗂️', category: 'Hero',       defaultLayout: 'hero',     defaultSource: 'recently_played', description: 'Low-profile space-saving header card' },
  { id: 'glass_hero',        label: 'Glassmorphism Hero',    icon: '🔮', category: 'Hero',       defaultLayout: 'hero',     defaultSource: 'recommended',     description: 'Frosted glass floating welcome banner' },
  { id: 'retro_sunset',      label: 'Retro Sunset Banner',   icon: '🌅', category: 'Hero',       defaultLayout: 'hero',     defaultSource: 'genre',           description: 'Synthwave gradient aesthetic layout header' },
  { id: 'acoustic_spot',     label: 'Acoustic Spotlight',    icon: '🎸', category: 'Hero',       defaultLayout: 'hero',     defaultSource: 'artist_spotlight',description: 'Warm wood gradient spotlight hero banner' },
  { id: 'album_feature',     label: 'Album Feature Splash',  icon: '💿', category: 'Hero',       defaultLayout: 'hero',     defaultSource: 'album',           description: 'Large cover showcase for a single album' },

  // ── 2. Discovery Sections (20 Blocks) ───────────────────────────────────────────
  { id: 'trending_songs',    label: 'Trending Songs',        icon: '🔥', category: 'Discovery',  defaultLayout: 'list',     defaultSource: 'trending',        description: 'Real-time trending track charts' },
  { id: 'rec_songs',         label: 'Recommended Songs',     icon: '💡', category: 'Discovery',  defaultLayout: 'grid',     defaultSource: 'recommended',     description: 'AI-powered song recommendations' },
  { id: 'new_releases',      label: 'New Releases',          icon: '🆕', category: 'Discovery',  defaultLayout: 'grid',     defaultSource: 'new_releases',    description: 'Brand new music this week' },
  { id: 'top_charts',        label: 'Top Charts',            icon: '📊', category: 'Discovery',  defaultLayout: 'list',     defaultSource: 'trending',        description: 'Platform-wide top 50 charts' },
  { id: 'emerging_artists',  label: 'Emerging Artists',      icon: '🌱', category: 'Discovery',  defaultLayout: 'grid',     defaultSource: 'artist_spotlight',description: 'Underground artists on the rise' },
  { id: 'lofi_study',        label: 'Lo-Fi Study Corner',    icon: '📚', category: 'Discovery',  defaultLayout: 'carousel', defaultSource: 'genre',           description: 'Chill lofi tracks for focus and work' },
  { id: 'hi_fi_audio',       label: 'Hi-Fi Audio Showcase',  icon: '🎧', category: 'Discovery',  defaultLayout: 'grid',     defaultSource: 'recommended',     description: 'Tracks optimized for lossless playback' },
  { id: 'instrumentals',     label: 'Instrumental Gems',     icon: '🎹', category: 'Discovery',  defaultLayout: 'carousel', defaultSource: 'genre',           description: 'Vocals-free ambient and rock jams' },
  { id: 'live_covers',       label: 'Live Covers & Sessions',icon: '🎤', category: 'Discovery',  defaultLayout: 'carousel', defaultSource: 'trending',        description: 'Unplugged acoustic cover recordings' },
  { id: 'karaoke_favs',      label: 'Karaoke Favorites',     icon: '🗣️', category: 'Discovery',  defaultLayout: 'grid',     defaultSource: 'genre',           description: 'Popular sing-along track tracks' },
  { id: 'podcast_disc',      label: 'Podcast Discovery',     icon: '🎙️', category: 'Discovery',  defaultLayout: 'grid',     defaultSource: 'genre',           description: 'Featured talk shows and podcasts' },
  { id: 'lyric_master',      label: 'Lyric Masterpieces',    icon: '📜', category: 'Discovery',  defaultLayout: 'list',     defaultSource: 'recommended',     description: 'Songs praised for poetry and writing' },
  { id: 'global_top_50',     label: 'Global Top 50',         icon: '🌍', category: 'Discovery',  defaultLayout: 'list',     defaultSource: 'trending',        description: 'Worldwide most popular list' },
  { id: 'viral_hits',        label: 'Viral Internet Hits',   icon: '📈', category: 'Discovery',  defaultLayout: 'carousel', defaultSource: 'trending',        description: 'Songs blowings up on social feeds' },
  { id: 'indie_showcase',    label: 'Indie Rock Showcase',   icon: '🛹', category: 'Discovery',  defaultLayout: 'grid',     defaultSource: 'genre',           description: 'Independent label guitar tracks' },
  { id: 'sphere_excl',       label: 'Beato Exclusive', icon: '💎', category: 'Discovery',  defaultLayout: 'hero',     defaultSource: 'made_for_you',    description: 'Only available on Beato' },
  { id: 'summer_anthems',    label: 'Summer Anthems',        icon: '☀️', category: 'Discovery',  defaultLayout: 'carousel', defaultSource: 'mood',            description: 'Sunny high-tempo party jams' },
  { id: 'classic_rock_rev',  label: 'Classic Rock Revival',  icon: '⚡', category: 'Discovery',  defaultLayout: 'grid',     defaultSource: 'genre',           description: 'Vintage 70s and 80s guitars' },
  { id: 'synth_odyssey',     label: 'Synthwave Odyssey',     icon: '🌃', category: 'Discovery',  defaultLayout: 'carousel', defaultSource: 'genre',           description: 'Retro futuristic digital tracks' },
  { id: 'acoustic_sessions', label: 'Acoustic Sessions',     icon: '🎻', category: 'Discovery',  defaultLayout: 'grid',     defaultSource: 'mood',            description: 'Unplugged and strings selections' },

  // ── 3. Personal Sections (15 Blocks) ────────────────────────────────────────────
  { id: 'quick_access',      label: 'Quick Access Greeting', icon: '👋', category: 'Personal',   defaultLayout: 'minimal',  defaultSource: 'recently_played', description: 'Good morning greeting with 6 quick playlists' },
  { id: 'recently_played',   label: 'Recently Played',       icon: '⏱️', category: 'Personal',   defaultLayout: 'carousel', defaultSource: 'recently_played', description: 'User\'s recent listening history' },
  { id: 'continue_listening',label: 'Continue Listening',    icon: '▶️', category: 'Personal',   defaultLayout: 'minimal',  defaultSource: 'recently_played', description: 'Pick up where you left off' },
  { id: 'made_for_you',      label: 'Made For You',          icon: '🎵', category: 'Personal',   defaultLayout: 'grid',     defaultSource: 'made_for_you',    description: 'Deeply personalized mixes' },
  { id: 'daily_mixes',       label: 'Daily Mixes',           icon: '🎛️', category: 'Personal',   defaultLayout: 'carousel', defaultSource: 'genre',           description: 'Six daily genre-based mixes' },
  { id: 'liked_songs',       label: 'Liked Songs',           icon: '❤️', category: 'Personal',   defaultLayout: 'list',     defaultSource: 'liked',           description: 'User\'s hearted tracks' },
  { id: 'liked_songs_banner',label: 'Liked Song Banner',     icon: '💖', category: 'Personal',   defaultLayout: 'banner',   defaultSource: 'liked',           description: 'Large banner for liked tracks' },
  { id: 'your_taste',        label: 'Your Taste',            icon: '🎯', category: 'Personal',   defaultLayout: 'bento',    defaultSource: 'made_for_you',    description: 'Genre affinity discovery section' },
  { id: 'listening_history', label: 'Detailed History',      icon: '📂', category: 'Personal',   defaultLayout: 'list',     defaultSource: 'recently_played', description: 'Expanded chronological plays' },
  { id: 'favorites_mix',     label: 'All-Time Favorites',    icon: '🏆', category: 'Personal',   defaultLayout: 'grid',     defaultSource: 'liked',           description: 'Your top most listened songs' },
  { id: 'listening_goals',   label: 'Weekly Listening Goals',icon: '🏁', category: 'Personal',   defaultLayout: 'minimal',  defaultSource: 'recently_played', description: 'Track your streaming targets' },
  { id: 'audio_sandbox',     label: 'Custom User Sandbox',   icon: '🏖️', category: 'Personal',   defaultLayout: 'grid',     defaultSource: 'custom',          description: 'A sandbox shelf for building lists' },
  { id: 'mood_scanner',      label: 'Emotion Scanner',       icon: '👁️', category: 'Personal',   defaultLayout: 'minimal',  defaultSource: 'made_for_you',    description: 'Scan your current emotion filter' },
  { id: 'activity_tracker',  label: 'Workout Beats Tracker', icon: '🏃', category: 'Personal',   defaultLayout: 'carousel', defaultSource: 'mood',            description: 'Match steps to musical tempo' },
  { id: 'collab_mix',        label: 'Collaborative Mixes',   icon: '👥', category: 'Personal',   defaultLayout: 'grid',     defaultSource: 'made_for_you',    description: 'Playlists shared with friends' },
  { id: 'fan_messaging',     label: 'Artist Board Letters',  icon: '✉️', category: 'Personal',   defaultLayout: 'minimal',  defaultSource: 'artist_spotlight',description: 'Direct messaging and artist notes' },
  { id: 'custom_shelf',      label: 'Manual Custom Shelf',   icon: '📦', category: 'Personal',   defaultLayout: 'grid',     defaultSource: 'custom',          description: 'Drag items here to make a list' },

  // ── 4. Browse Sections (15 Blocks) ──────────────────────────────────────────────
  { id: 'genre_collection',  label: 'Genre Collections',     icon: '🎸', category: 'Browse',     defaultLayout: 'bento',    defaultSource: 'genre',           description: 'Explore music by genre tiles' },
  { id: 'mood_collection',   label: 'Mood Collections',      icon: '🌊', category: 'Browse',     defaultLayout: 'bento',    defaultSource: 'mood',            description: 'Curated mood-based playlists' },
  { id: 'festival_picks',    label: 'Festival Collections',  icon: '🎪', category: 'Browse',     defaultLayout: 'carousel', defaultSource: 'mood',            description: 'Music festival and event picks' },
  { id: 'album_showcase',    label: 'Album Showcase',        icon: '💿', category: 'Browse',     defaultLayout: 'carousel', defaultSource: 'album',           description: 'Feature a specific album' },
  { id: 'playlist_showcase', label: 'Playlist Showcase',     icon: '📋', category: 'Browse',     defaultLayout: 'grid',     defaultSource: 'playlist',        description: 'Feature a specific playlist' },
  { id: 'decades_library',   label: 'Decades Library',       icon: '🕰️', category: 'Browse',     defaultLayout: 'grid',     defaultSource: 'genre',           description: 'Timeless classics sorted by decade' },
  { id: 'local_scenes',      label: 'Local City Scenes',     icon: '🏙️', category: 'Browse',     defaultLayout: 'carousel', defaultSource: 'trending',        description: 'Discover trending sounds by city' },
  { id: 'audiobooks',        label: 'Audiobooks & Stories',  icon: '📖', category: 'Browse',     defaultLayout: 'grid',     defaultSource: 'genre',           description: 'Narrated books and literature' },
  { id: 'radio_stations',    label: 'Live Radio Streams',    icon: '📻', category: 'Browse',     defaultLayout: 'carousel', defaultSource: 'genre',           description: 'Worldwide live FM channels' },
  { id: 'ambient_noise',     label: 'White Noise & Nature',  icon: '🌧️', category: 'Browse',     defaultLayout: 'minimal',  defaultSource: 'mood',            description: 'Rain, wind, and cafe noise' },
  { id: 'sound_fx',          label: 'Sound Effects Library', icon: '💥', category: 'Browse',     defaultLayout: 'grid',     defaultSource: 'genre',           description: 'Production-ready sound cues' },
  { id: 'instrument_lib',    label: 'Instruments Library',   icon: '🎻', category: 'Browse',     defaultLayout: 'bento',    defaultSource: 'genre',           description: 'Filter tracks by dominant instrument' },
  { id: 'nature_sounds',     label: 'Nature Sounds',         icon: '🌲', category: 'Browse',     defaultLayout: 'carousel', defaultSource: 'mood',            description: 'Birds, forest, ocean sounds' },
  { id: 'soundscapes',       label: 'Ambient Soundscapes',   icon: '🌌', category: 'Browse',     defaultLayout: 'grid',     defaultSource: 'genre',           description: 'Sci-fi and drone ambient textures' },
  { id: 'podcast_shows',     label: 'Podcast Talk Shows',    icon: '🗣️', category: 'Browse',     defaultLayout: 'grid',     defaultSource: 'genre',           description: 'Filter by comedy, news, tech podcast' },

  // ── 5. Marketing Sections (10 Blocks) ───────────────────────────────────────────
  { id: 'premium_promo',     label: 'Premium Promotion',     icon: '👑', category: 'Marketing',  defaultLayout: 'hero',     defaultSource: 'made_for_you',    description: 'Premium subscription upsell banner' },
  { id: 'subscription_cta',  label: 'Subscription CTA',      icon: '🎁', category: 'Marketing',  defaultLayout: 'hero',     defaultSource: 'made_for_you',    description: 'Conversion-focused subscription banner' },
  { id: 'family_plan_card',  label: 'Family Plan Premium',   icon: '👨‍👩‍👧‍👦', category: 'Marketing',  defaultLayout: 'hero',     defaultSource: 'made_for_you',    description: 'Promote Family premium package' },
  { id: 'student_plan_card', label: 'Student Discount CTA',  icon: '🎓', category: 'Marketing',  defaultLayout: 'hero',     defaultSource: 'made_for_you',    description: 'Promote 50% discount for students' },
  { id: 'referral_banner',   label: 'Refer-a-Friend CTA',    icon: '🤝', category: 'Marketing',  defaultLayout: 'hero',     defaultSource: 'made_for_you',    description: 'Get free premium months for referrals' },
  { id: 'merch_store',       label: 'Artist Merch Shop',     icon: '👕', category: 'Marketing',  defaultLayout: 'grid',     defaultSource: 'artist_spotlight',description: 'T-shirts, posters, vinyl lists' },
  { id: 'ticket_sales',      label: 'Concert Ticket Sales',  icon: '🎫', category: 'Marketing',  defaultLayout: 'carousel', defaultSource: 'artist_spotlight',description: 'Buy live tour tickets directly' },
  { id: 'live_event_cta',    label: 'Live Stream Event',     icon: '🔴', category: 'Marketing',  defaultLayout: 'hero',     defaultSource: 'trending',        description: 'Promote live broadcast events' },
  { id: 'brand_sponsor',     label: 'Sponsor Spotlight',     icon: '🏷️', category: 'Marketing',  defaultLayout: 'hero',     defaultSource: 'trending',        description: 'Paid brand partner promo block' },
  { id: 'ad_break_banner',   label: 'Audio Ads Break',       icon: '📢', category: 'Marketing',  defaultLayout: 'minimal',  defaultSource: 'made_for_you',    description: 'Free tier listener banner ads' },
  { id: 'campaign_deals_grid', label: 'Campaign Grid (Zepto Style)', icon: '🛍️', category: 'Marketing',  defaultLayout: 'grid_deals', defaultSource: 'trending',   description: 'Zepto-style promotional grid with a large feature card and 2x2 category blocks' },

  // ── 6. Social Sections (10 Blocks) ──────────────────────────────────────────────
  { id: 'community_picks',   label: 'Community Picks',       icon: '🤝', category: 'Social',     defaultLayout: 'grid',     defaultSource: 'trending',        description: 'Songs curated by the community' },
  { id: 'friend_activity',   label: 'Friend Activity Feed',  icon: '👀', category: 'Social',     defaultLayout: 'list',     defaultSource: 'recently_played', description: 'See what your friends are streaming' },
  { id: 'shared_playlists',  label: 'Shared Playlists',      icon: '📂', category: 'Social',     defaultLayout: 'carousel', defaultSource: 'playlist',        description: 'Playlists made by multiple users' },
  { id: 'follower_activity', label: 'Follower Growth Feed',  icon: '📈', category: 'Social',     defaultLayout: 'list',     defaultSource: 'recently_played', description: 'Artist followers details stream' },
  { id: 'fan_club_reviews',  label: 'Fan Club Reviews',      icon: '✍️', category: 'Social',     defaultLayout: 'grid',     defaultSource: 'artist_spotlight',description: 'Audited fan critiques and reviews' },
  { id: 'city_meetups',      label: 'Local Listening Parties',icon: '🎉', category: 'Social',     defaultLayout: 'carousel', defaultSource: 'mood',            description: 'Group meetups in your city' },
  { id: 'listen_party',      label: 'Group Listen Party',    icon: '🎧', category: 'Social',     defaultLayout: 'minimal',  defaultSource: 'trending',        description: 'Synchronized live music playback' },
  { id: 'artist_messages',   label: 'Artist Direct Board',   icon: '💬', category: 'Social',     defaultLayout: 'minimal',  defaultSource: 'artist_spotlight',description: 'Social posts from artists you follow' },
  { id: 'fan_reviews',       label: 'Fan Reviews Grid',      icon: '🗣️', category: 'Social',     defaultLayout: 'grid',     defaultSource: 'trending',        description: 'User-submitted track comments' },
  { id: 'chat_hub',          label: 'Music Chat Hub',        icon: '💬', category: 'Social',     defaultLayout: 'minimal',  defaultSource: 'genre',           description: 'Room groups discussing genres' },

  // ── 7. AI Sections (10 Blocks) ──────────────────────────────────────────────────
  { id: 'ai_recommendations',label: 'AI Recommendations',    icon: '🤖', category: 'AI',         defaultLayout: 'carousel', defaultSource: 'recommended',     description: 'Machine-learning powered picks' },
  { id: 'ai_mix_maker',      label: 'AI Mix Generator',      icon: '🎚️', category: 'AI',         defaultLayout: 'grid',     defaultSource: 'made_for_you',    description: 'Type a prompt to build a mix' },
  { id: 'voice_prompter',    label: 'Voice Prompt Mixer',    icon: '🎙️', category: 'AI',         defaultLayout: 'minimal',  defaultSource: 'recommended',     description: 'Mix styles using voice rules' },
  { id: 'lyric_analytics',   label: 'Lyrical AI Analysis',   icon: '📊', category: 'AI',         defaultLayout: 'list',     defaultSource: 'recommended',     description: 'Analysis charts of semantic moods' },
  { id: 'daily_ai_mix',      label: 'Daily AI Mix',          icon: '🔮', category: 'AI',         defaultLayout: 'carousel', defaultSource: 'made_for_you',    description: 'Neural net predicted daily track flow' },
  { id: 'hybrid_dj',         label: 'AI Hybrid DJ',          icon: '🎧', category: 'AI',         defaultLayout: 'bento',    defaultSource: 'trending',        description: 'Auto-crossfading dynamic playlist' },
  { id: 'style_matcher',     label: 'Acoustic Style Matcher',icon: '🎸', category: 'AI',         defaultLayout: 'grid',     defaultSource: 'recommended',     description: 'Find tracks matching exact audio signature' },
  { id: 'vocal_isolator',    label: 'AI Vocal Isolator',     icon: '🗣️', category: 'AI',         defaultLayout: 'minimal',  defaultSource: 'genre',           description: 'Isolate vocal or instrumental feeds' },
  { id: 'flow_radio',        label: 'Flow Infinite Radio',   icon: '📻', category: 'AI',         defaultLayout: 'carousel', defaultSource: 'made_for_you',    description: 'Endless streams adapting to user skips' },
  { id: 'sonic_matchmaker',  label: 'Sonic Matchmaker',      icon: '🌌', category: 'AI',         defaultLayout: 'bento',    defaultSource: 'recommended',     description: 'Calculate track acoustic compatibility' },

  // ── 8. Content Sections (10 Blocks) ─────────────────────────────────────────────
  { id: 'music_news',        label: 'Music News Feed',       icon: '📰', category: 'Content',    defaultLayout: 'magazine', defaultSource: 'new_releases',    description: 'Editorial music news stories' },
  { id: 'artist_interviews', label: 'Artist Interviews',     icon: '🎥', category: 'Content',    defaultLayout: 'magazine', defaultSource: 'artist_spotlight',description: 'Exclusive talks with global artists' },
  { id: 'tour_announcements',label: 'Tour Announcements',    icon: '🗺️', category: 'Content',    defaultLayout: 'grid',     defaultSource: 'trending',        description: 'Announced live performance schedules' },
  { id: 'album_reviews_blog',label: 'Editorial Reviews',     icon: '✍️', category: 'Content',    defaultLayout: 'magazine', defaultSource: 'new_releases',    description: 'Critically evaluated album ratings' },
  { id: 'trivia_cards',      label: 'Musical Trivia Cards',  icon: '🃏', category: 'Content',    defaultLayout: 'minimal',  defaultSource: 'genre',           description: 'Test your musical pop knowledge' },
  { id: 'video_highlights',  label: 'Video Highlights',      icon: '🎬', category: 'Content',    defaultLayout: 'carousel', defaultSource: 'new_releases',    description: 'Short video clips from tours' },
  { id: 'podcast_highlights',label: 'Podcast Snippets',      icon: '✂️', category: 'Content',    defaultLayout: 'carousel', defaultSource: 'genre',           description: 'Short highlights from top talk shows' },
  { id: 'lyric_explainer',   label: 'Lyrical Explanations',  icon: '💡', category: 'Content',    defaultLayout: 'list',     defaultSource: 'recommended',     description: 'Dissect the meaning of song verses' },
  { id: 'documentaries',     label: 'Audio Documentaries',   icon: '🎥', category: 'Content',    defaultLayout: 'grid',     defaultSource: 'genre',           description: 'The stories behind legendary albums' },
  { id: 'music_history',     label: 'History of Music',      icon: '🕰️', category: 'Browse',     defaultLayout: 'bento',    defaultSource: 'genre',           description: 'Timelines mapping genre transformations' },

  // ── 9. Search Page Layout Blocks ────────────────────────────────────────────────
  { id: 'search_genre_tiles', label: 'Start Browsing (Genre Tiles)', icon: '🧭', category: 'Browse', defaultLayout: 'genre_tiles', defaultSource: 'genre', description: 'Grid of colored genre tiles with tilted artwork' },
  { id: 'search_ad_banner',   label: 'ADVERTISEMENT Banner',         icon: '📢', category: 'Marketing', defaultLayout: 'ad_break_banner', defaultSource: 'custom', description: 'Promo banner for sponsored advertisers' },
  { id: 'search_hashtag_slides', label: 'Discover Something New (Hashtags)', icon: '✨', category: 'Discovery', defaultLayout: 'hashtag_slides', defaultSource: 'mood', description: 'Portrait cards slide row for trending hashtags' },
  { id: 'music_summer_store', label: 'Summer Vibe Store (Zepto Style)', icon: '🍦', category: 'Marketing', defaultLayout: 'music_summer_store', defaultSource: 'mood', description: '2x3 grid of vibe playlist categories' },
  { id: 'music_hubs', label: 'Music Mood Hubs (Zepto Style)', icon: '🥭', category: 'Browse', defaultLayout: 'music_hubs', defaultSource: 'genre', description: 'Horizontal circular mood/genre filters with icons' },
  { id: 'new_launches_slider', label: 'Featured Spotlight Slider (Zepto Style)', icon: '🎧', category: 'Discovery', defaultLayout: 'new_launches_slider', defaultSource: 'new_releases', description: 'Featured wide banner slider with indicator dots' },
  { id: 'brand_artist_collabs', label: 'Artist Label Collabs (Zepto Style)', icon: '⚡', category: 'Marketing', defaultLayout: 'brand_artist_collabs', defaultSource: 'artist_spotlight', description: 'Grid of square record label and collaboration hubs' },
  { id: 'mood_mania_grid', label: 'Genre Mania Split Banner (Zepto Style)', icon: '🥩', category: 'Discovery', defaultLayout: 'mood_mania_grid', defaultSource: 'trending', description: 'Large promotional banner split into three vertical mood cards' },
  { id: 'deals_pricing_slider', label: 'Deals starting at ₹0 Slider (Zepto Style)', icon: '🏷️', category: 'Marketing', defaultLayout: 'deals_pricing_slider', defaultSource: 'recommended', description: 'Horizontal slider of tracks showing Free/₹0/Premium badges with playback action' },

  // ── 10. New Interactive Sections (10 Blocks) ────────────────────────────────────
  { id: 'hero_auto_slider',       label: 'Hero Auto Slider',           icon: '🎠', category: 'Interactive', defaultLayout: 'hero_auto_slider',       defaultSource: 'trending',        description: 'Zepto-style full-width auto-rotating hero banner with prev/next arrows and dot indicators' },
  { id: 'category_quick_tiles',   label: 'Category Quick Tiles',       icon: '🎡', category: 'Interactive', defaultLayout: 'category_quick_tiles',   defaultSource: 'genre',           description: 'Zepto-style horizontal emoji category circles — Pop, EDM, Hip-Hop, Lo-Fi and more' },
  { id: 'flash_deals_countdown',  label: 'Flash Deals Countdown',      icon: '⚡', category: 'Interactive', defaultLayout: 'flash_deals_countdown',  defaultSource: 'recommended',     description: 'Blinkit-style red header with countdown timer and horizontal deal cards per track' },
  { id: 'new_launches_spotlight', label: 'New Launches Spotlight',     icon: '🔴', category: 'Interactive', defaultLayout: 'new_launches_spotlight', defaultSource: 'new_releases',    description: 'Flipkart-style hero card + 3 mini cards with LIVE NOW badge and release type badges' },
  { id: 'featured_brands_row',    label: 'Featured Brands Row',        icon: '🏷️', category: 'Interactive', defaultLayout: 'featured_brands_row',    defaultSource: 'artist_spotlight',description: 'Flipkart brand logo row (Spotify, Apple Music etc.) + wide promo partner card below' },
  { id: 'top_chart_billboard',    label: 'Top Chart Billboard',        icon: '📊', category: 'Interactive', defaultLayout: 'top_chart_billboard',    defaultSource: 'trending',        description: 'Numbered ranked billboard list with gold/silver/bronze, trend arrows and play counts' },
  { id: 'artist_follow_cards',    label: 'Artist Follow Cards',        icon: '🎤', category: 'Interactive', defaultLayout: 'artist_follow_cards',    defaultSource: 'artist_spotlight',description: 'Swiggy-style artist cards with banner, overlapping avatar, genre tags and Follow button' },
  { id: 'free_deals_grid',        label: 'Free Deals Grid',            icon: '🆓', category: 'Interactive', defaultLayout: 'free_deals_grid',        defaultSource: 'recommended',     description: 'Blinkit ₹9 deals style — green header with 8-column grid, FREE badges, strikethrough prices' },
  { id: 'promo_red_block',        label: 'Promo Red Block',            icon: '🥩', category: 'Interactive', defaultLayout: 'promo_red_block',        defaultSource: 'trending',        description: 'Blinkit Meat Mania style — dark red banner with glow orbs, 50% countdown, 3-promo grid' },
  { id: 'fresh_picks_circles',    label: 'Fresh Picks Circles',        icon: '🍊', category: 'Interactive', defaultLayout: 'fresh_picks_circles',    defaultSource: 'mood',            description: 'Zepto produce-style glossy radial-gradient circles with shine highlight and promo strip' },
];

export const BLOCK_CATEGORIES = ['All', 'Hero', 'Discovery', 'Personal', 'Browse', 'Marketing', 'Social', 'AI', 'Content', 'Interactive'];
