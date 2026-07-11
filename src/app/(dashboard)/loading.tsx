// Full skeleton for the dashboard shell
export default function DashboardLoading() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#fbf9f5' }}>
      {/* sidebar placeholder desktop */}
      <div style={{ width: 240, flexShrink: 0, background: '#f4eede', display: 'none' }} className="desktop-sidebar-skel" />
      {/* main area */}
      <div style={{ flex: 1, padding: 24 }}>
        {[...Array(8)].map((_, i) => (
          <div key={i} style={{ height: 60, borderRadius: 12, background: '#e8e2d8', marginBottom: 16, animation: 'ss-pulse 1.4s ease-in-out infinite', animationDelay: `${i * 0.1}s` }} />
        ))}
      </div>
      <style>{`@keyframes ss-pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
    </div>
  );
}
