const P = { animation: 'ss-pulse 1.4s ease-in-out infinite' } as const;
export default function SearchLoading() {
  return (
    <div style={{ minHeight: '100%', background: '#fbf9f5', padding: '20px 24px' }}>
      {/* title row */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#e2dbd0', ...P }} />
        <div style={{ width: 100, height: 28, borderRadius: 8, background: '#e2dbd0', ...P }} />
      </div>
      {/* search pill */}
      <div style={{ height: 44, borderRadius: 22, background: '#ede7dc', marginBottom: 28, maxWidth: 680, ...P }} />
      {/* genre grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 12 }}>
        {[...Array(12)].map((_,i) => <div key={i} style={{ height: 100, borderRadius: 12, background: '#e2dbd0', animationDelay: `${i*0.06}s`, ...P }} />)}
      </div>
      <style>{`@keyframes ss-pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
    </div>
  );
}
