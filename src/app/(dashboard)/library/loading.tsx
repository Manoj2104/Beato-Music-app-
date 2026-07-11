const P = { animation: 'ss-pulse 1.4s ease-in-out infinite' } as const;
export default function LibraryLoading() {
  return (
    <div style={{ minHeight: '100%', background: '#fbf9f5', padding: '20px 24px' }}>
      <div style={{ height: 32, width: 160, borderRadius: 8, background: '#e2dbd0', marginBottom: 24, ...P }} />
      {[...Array(8)].map((_,i) => (
        <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 16 }}>
          <div style={{ width: 52, height: 52, borderRadius: 8, background: '#e2dbd0', flexShrink: 0, animationDelay: `${i*0.08}s`, ...P }} />
          <div style={{ flex: 1 }}>
            <div style={{ height: 16, borderRadius: 6, background: '#e2dbd0', marginBottom: 8, width: '60%', ...P }} />
            <div style={{ height: 12, borderRadius: 6, background: '#ede7dc', width: '40%', ...P }} />
          </div>
        </div>
      ))}
      <style>{`@keyframes ss-pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
    </div>
  );
}
