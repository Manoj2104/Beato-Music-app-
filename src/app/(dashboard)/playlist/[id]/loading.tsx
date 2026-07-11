const P = { animation: 'ss-pulse 1.4s ease-in-out infinite' } as const;
export default function PlaylistLoading() {
  return (
    <div style={{ minHeight: '100%', background: '#fbf9f5' }}>
      {/* Hero */}
      <div style={{ display: 'flex', gap: 24, padding: '32px 24px 24px', alignItems: 'flex-end', background: 'linear-gradient(to bottom,#e2dbd0,#f4eede)' }}>
        <div style={{ width: 200, height: 200, borderRadius: 12, background: '#d4cdc2', flexShrink: 0, ...P }} />
        <div style={{ flex: 1 }}>
          <div style={{ height: 14, width: 70, borderRadius: 6, background: '#d4cdc2', marginBottom: 12, ...P }} />
          <div style={{ height: 40, width: 260, borderRadius: 10, background: '#d4cdc2', marginBottom: 10, ...P }} />
          <div style={{ height: 14, width: 200, borderRadius: 6, background: '#ded8cc', ...P }} />
        </div>
      </div>
      {/* Track list */}
      <div style={{ padding: '20px 24px' }}>
        {[...Array(10)].map((_,i) => (
          <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 14 }}>
            <div style={{ width: 20, height: 14, borderRadius: 4, background: '#e2dbd0', flexShrink: 0, ...P }} />
            <div style={{ width: 40, height: 40, borderRadius: 8, background: '#e2dbd0', flexShrink: 0, animationDelay: `${i*0.07}s`, ...P }} />
            <div style={{ flex: 1 }}>
              <div style={{ height: 14, borderRadius: 5, background: '#e2dbd0', marginBottom: 6, width: '55%', ...P }} />
              <div style={{ height: 11, borderRadius: 5, background: '#ede7dc', width: '35%', ...P }} />
            </div>
            <div style={{ width: 36, height: 12, borderRadius: 4, background: '#ede7dc', ...P }} />
          </div>
        ))}
      </div>
      <style>{`@keyframes ss-pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
    </div>
  );
}
