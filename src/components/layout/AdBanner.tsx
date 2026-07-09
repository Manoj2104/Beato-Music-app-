import { motion } from 'framer-motion';
import { useEffect } from 'react';

interface AdBannerProps {
  ad: any;
  theme?: string;
  style?: React.CSSProperties;
}

export default function AdBanner({ ad, theme = 'glass', style }: AdBannerProps) {
  useEffect(() => {
    // Record impression in background
    fetch('/api/ads/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adId: ad.id, eventType: 'impression' })
    }).catch(() => {});
  }, [ad.id]);

  const handleClick = () => {
    fetch('/api/ads/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adId: ad.id, eventType: 'click' })
    }).catch(() => {});
    if (ad.destinationUrl) {
      window.open(ad.destinationUrl, '_blank');
    }
  };

  // Resolve styling presets based on theme
  let cardStyle: React.CSSProperties = {
    padding: '12px 20px',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    position: 'relative',
    overflow: 'hidden',
    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
    ...style,
  };

  let titleStyle: React.CSSProperties = { fontSize: 14, fontWeight: 800, margin: '0 0 2px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' };
  let descStyle: React.CSSProperties = { fontSize: 11.5, margin: 0, display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.4' };
  let buttonStyle: React.CSSProperties = { border: 'none', padding: '6px 14px', fontSize: 11, fontWeight: 800, cursor: 'pointer', transition: 'all 0.15s ease', whiteSpace: 'nowrap' };

  if (theme === 'glass') {
    cardStyle = {
      ...cardStyle,
      background: 'rgba(255, 255, 255, 0.45)',
      backdropFilter: 'blur(14px)',
      border: '1px solid rgba(255, 255, 255, 0.45)',
      borderRadius: 12,
      boxShadow: '0 8px 32px rgba(43, 34, 26, 0.05)',
    };
    titleStyle.color = '#221a15';
    descStyle.color = '#706155';
    buttonStyle = {
      ...buttonStyle,
      background: '#0f5132',
      color: '#ffffff',
      borderRadius: 20,
      boxShadow: '0 4px 10px rgba(15, 81, 50, 0.2)',
    };
  } else if (theme === 'cream') {
    cardStyle = {
      ...cardStyle,
      background: 'linear-gradient(135deg, #ffffff 0%, #fcfbf7 100%)',
      border: '1px solid rgba(15, 81, 50, 0.16)',
      borderRadius: 12,
      boxShadow: '0 4px 20px rgba(43, 34, 26, 0.03)',
    };
    titleStyle.color = '#221a15';
    descStyle.color = '#87786c';
    buttonStyle = {
      ...buttonStyle,
      background: '#0f5132',
      color: '#ffffff',
      borderRadius: 20,
      boxShadow: '0 4px 10px rgba(15, 81, 50, 0.2)',
    };
  } else if (theme === 'contrast') {
    cardStyle = {
      ...cardStyle,
      background: '#ffffff',
      border: '1.5px solid #221a15',
      borderRadius: 6,
      boxShadow: 'none',
    };
    titleStyle.color = '#221a15';
    descStyle.color = '#221a15';
    buttonStyle = {
      ...buttonStyle,
      background: '#221a15',
      color: '#ffffff',
      borderRadius: 2,
    };
  } else if (theme === 'cyberpunk') {
    cardStyle = {
      ...cardStyle,
      background: '#121212',
      border: '1px solid #0f5132',
      borderRadius: 4,
      boxShadow: '0 0 15px rgba(15, 81, 50, 0.25)',
    };
    titleStyle.color = '#fff';
    descStyle.color = '#0f5132';
    buttonStyle = {
      ...buttonStyle,
      background: '#0f5132',
      color: '#000',
      borderRadius: 4,
    };
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3, boxShadow: theme === 'contrast' ? 'none' : '0 10px 28px rgba(15, 81, 50, 0.15)' }}
      onClick={handleClick}
      style={cardStyle}
    >
      {theme !== 'contrast' && theme !== 'cyberpunk' && (
        <div style={{
          position: 'absolute',
          top: '-50%',
          right: '-10%',
          width: 200,
          height: 200,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(15, 81, 50, 0.05) 0%, rgba(255, 255, 255, 0) 70%)',
          pointerEvents: 'none',
        }} />
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 0 }}>
        {ad.imageUrl ? (
          <div style={{
            width: 46,
            height: 46,
            borderRadius: theme === 'contrast' ? 2 : '50%',
            overflow: 'hidden',
            flexShrink: 0,
            background: '#ffffff', // Clean white background for logos
            border: `1px solid ${theme === 'cyberpunk' ? '#0f513244' : 'rgba(15, 81, 50, 0.18)'}`,
            boxShadow: '0 2px 6px rgba(43, 34, 26, 0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: ad.imageUrl.includes('uploads') ? 6 : 0
          }}>
            <img src={ad.imageUrl} alt="" style={{ width: '100%', height: '100%', borderRadius: theme === 'contrast' ? 2 : '50%', objectFit: ad.imageUrl.includes('uploads') ? 'contain' : 'cover' }} />
          </div>
        ) : (
          /* Premium Fallback brand letter avatar badge */
          <div style={{
            width: 46,
            height: 46,
            borderRadius: theme === 'contrast' ? 2 : '50%',
            flexShrink: 0,
            background: 'linear-gradient(135deg, #0f5132 0%, #0b3d26 100%)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 16,
            fontWeight: 800,
            fontFamily: 'Outfit, sans-serif',
            boxShadow: '0 3px 8px rgba(15, 81, 50, 0.22)',
            border: `1.5px solid rgba(255, 255, 255, 0.8)`
          }}>
            {(ad.name || 'A').charAt(0).toUpperCase()}
          </div>
        )}
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <span style={{
              fontSize: 8,
              fontWeight: 800,
              color: '#0f5132',
              background: 'rgba(15, 81, 50, 0.08)',
              padding: '2px 6px',
              borderRadius: theme === 'contrast' ? 2 : 100,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4
            }}>
              <span style={{ display: 'inline-block', width: 4, height: 4, borderRadius: '50%', backgroundColor: '#0f5132' }}></span>
              Sponsored
            </span>
          </div>
          <h3 style={{ ...titleStyle, letterSpacing: '-0.01em' }}>
            {ad.headline || ad.name}
          </h3>
          <p style={descStyle}>
            {ad.bodyText || 'Sponsored advertisement.'}
          </p>
        </div>
      </div>

      <button style={buttonStyle}>
        {ad.ctaText || 'Learn More'}
      </button>
    </motion.div>
  );
}
