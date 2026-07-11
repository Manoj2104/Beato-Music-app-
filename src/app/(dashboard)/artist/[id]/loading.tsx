const P = { animation: 'ss-pulse 1.4s ease-in-out infinite' } as const;
export default function ArtistLoading() {
  return (
    <div style={{ minHeight: '100%', background: '#fbf9f5' }}>
      <div style={{ height: 300, background: 'linear-gradient(to bottom,#e2dbd0,#f4eede)', ...P }} />
      <div style={{ padding: '24px 24px' }}>
        <div style={{ height: 32, width: 200, borderRadius: 8, background: '#e2dbd0', marginBottom: 16, ...P }} />
        <div style={{ display: 'flex', gap: 12, marginBottom: 28 }}>
          {[...Array(5)].map((_,i) => <div key={i} style={{ height: 14, width: 80, borderRadius: 6, background: '#ede7dc', ...P }} />)}
        </div>
        {[...Array(6)].map((_,i) => (
          <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 14 }}>
            <div style={{ width: 48, height: 48, borderRadius: 6, background: '#e2dbd0', flexShrink: 0, ...P }} />
            <div style={{ flex: 1 }}>
              <div style={{ height: 15, borderRadius: 5, background: '#e2dbd0', marginBottom: 6, width: '55%', ...P }} />
              <div style={{ height: 11, borderRadius: 5, background: '#ede7dc', width: '35%', ...P }} />
            </div>
          </div>
        ))}
      </div>
      <style>{`@keyframes ss-pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
    </div>
  );
}
