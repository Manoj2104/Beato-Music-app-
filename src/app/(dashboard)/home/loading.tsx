const P = { animation: 'ss-pulse 1.4s ease-in-out infinite' } as const;
export default function HomeLoading() {
  return (
    <div style={{ minHeight: '100%', background: '#fbf9f5', padding: '20px 24px' }}>
      {/* greeting */}
      <div style={{ height: 36, width: 220, borderRadius: 10, background: '#e2dbd0', marginBottom: 20, ...P }} />
      {/* quick picks grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 32 }}>
        {[...Array(6)].map((_,i) => <div key={i} style={{ height: 50, borderRadius: 10, background: '#e2dbd0', animationDelay: `${i*0.08}s`, ...P }} />)}
      </div>
      {/* section header */}
      <div style={{ height: 24, width: 160, borderRadius: 8, background: '#e2dbd0', marginBottom: 16, ...P }} />
      {/* horizontal card row */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 32, overflow: 'hidden' }}>
        {[...Array(5)].map((_,i) => (
          <div key={i} style={{ flexShrink: 0, width: 140 }}>
            <div style={{ height: 140, borderRadius: 12, background: '#e2dbd0', marginBottom: 8, animationDelay: `${i*0.1}s`, ...P }} />
            <div style={{ height: 14, borderRadius: 6, background: '#ede7dc', animationDelay: `${i*0.1+0.05}s`, ...P }} />
          </div>
        ))}
      </div>
      {/* 2nd section */}
      <div style={{ height: 24, width: 200, borderRadius: 8, background: '#e2dbd0', marginBottom: 16, ...P }} />
      <div style={{ display: 'flex', gap: 14, overflow: 'hidden' }}>
        {[...Array(5)].map((_,i) => (
          <div key={i} style={{ flexShrink: 0, width: 140 }}>
            <div style={{ height: 140, borderRadius: 12, background: '#e2dbd0', marginBottom: 8, animationDelay: `${i*0.1}s`, ...P }} />
            <div style={{ height: 14, borderRadius: 6, background: '#ede7dc', ...P }} />
          </div>
        ))}
      </div>
      <style>{`@keyframes ss-pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
    </div>
  );
}
