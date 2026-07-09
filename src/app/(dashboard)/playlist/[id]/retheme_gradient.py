
content = open('src/app/(dashboard)/playlist/[id]/PlaylistClient.tsx', 'r', encoding='utf-8').read()

# 1. Retheme mobile layout background: remove green gradient overlay and replace with mint green -> white gradient
content = content.replace(
    "background: `linear-gradient(180deg, ${themeColor} 0%, var(--color-ss-bg, #ffffff) 50%, var(--color-ss-bg, #ffffff) 100%)`,",
    "background: 'linear-gradient(180deg, #f0f7f4 0%, #ffffff 40%)',"
)

# 2. Retheme sticky header background opacity color (fbf9f5 -> ffffff)
content = content.replace(
    "backgroundColor: `rgba(251, 249, 245, ${headerBgOpacity})`,",
    "backgroundColor: `rgba(255, 255, 255, ${headerBgOpacity})`,"
)

# 3. Retheme top bar items
content = content.replace(
    "color: '#fff', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center'",
    "color: '#0f172a', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center'"
)
content = content.replace(
    "background: 'rgba(255, 255, 255, 0.12)',\n              borderRadius: 24,",
    "background: 'rgba(15, 81, 50, 0.06)',\n              borderRadius: 24,"
)
content = content.replace(
    "color: '#fff',\n                  fontSize: 13,",
    "color: '#0f172a',\n                  fontSize: 13,"
)
content = content.replace(
    "color=\"#b3b3b3\"",
    "color=\"#94a3b8\""
)
content = content.replace(
    "color: '#b3b3b3'",
    "color: '#94a3b8'"
)

# 4. Retheme top sort button
content = content.replace(
    "background: 'rgba(255, 255, 255, 0.12)',\n                border: 'none',\n                borderRadius: 24,\n                color: '#fff',",
    "background: 'rgba(15, 81, 50, 0.06)',\n                border: 'none',\n                borderRadius: 24,\n                color: '#0f5132',"
)

# 5. Retheme sort dropdown menu (from dark to white)
content = content.replace(
    "background: '#1e1e1e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, overflow: 'hidden', minWidth: 160, boxShadow: '0 16px 48px rgba(0,0,0,0.6)'",
    "background: '#ffffff', border: '1px solid rgba(15, 81, 50, 0.1)', borderRadius: 12, overflow: 'hidden', minWidth: 160, boxShadow: '0 16px 48px rgba(15, 81, 50, 0.08)'"
)
content = content.replace(
    "color: activeSort === opt.v ? '#fff' : '#a3a3a3'",
    "color: activeSort === opt.v ? '#0f5132' : '#64748b'"
)

# 6. Retheme Playlist Info section
content = content.replace(
    "<div style={{ padding: '0 16px 12px', color: '#fff' }}>",
    "<div style={{ padding: '0 16px 12px', color: '#0f172a' }}>"
)
content = content.replace(
    "border: '1px solid rgba(255,255,255,0.4)',\n                  color: '#fff',",
    "border: '1px solid rgba(15, 81, 50, 0.2)',\n                  color: '#0f5132',"
)
content = content.replace(
    "color: '#b3b3b3',",
    "color: '#64748b',"
)
content = content.replace(
    "Globe size={13} color=\"#b3b3b3\"",
    "Globe size={13} color=\"#64748b\""
)

# 7. Retheme Action Row
content = content.replace(
    "borderBottom: '1px solid rgba(255,255,255,0.05)'",
    "borderBottom: '1px solid rgba(15,81,50,0.08)'"
)
content = content.replace(
    "color: isSaved ? '#000' : '#a3a3a3',",
    "color: isSaved ? '#ffffff' : '#94a3b8',"
)
content = content.replace(
    "border: isSaved ? `1px solid ${G}` : '1.5px solid #a3a3a3',",
    "border: isSaved ? `1px solid ${G}` : '1.5px solid #cbd5e1',"
)
content = content.replace(
    '<Check size={14} color="#000" strokeWidth={3} />',
    '<Check size={14} color="#ffffff" strokeWidth={3} />'
)
content = content.replace(
    '<Plus size={14} color="#a3a3a3" />',
    '<Plus size={14} color="#94a3b8" />'
)
content = content.replace(
    '<Download size={14} color="#a3a3a3" />',
    '<Download size={14} color="#94a3b8" />'
)
content = content.replace(
    '<MoreVertical size={22} color="#a3a3a3" />',
    '<MoreVertical size={22} color="#94a3b8" />'
)
content = content.replace(
    "<Shuffle size={22} color={shuffle ? G : '#a3a3a3'} />",
    "<Shuffle size={22} color={shuffle ? G : '#94a3b8'} />"
)
# Play button inside action row fill/color:
content = content.replace(
    '<Pause size={22} fill="black" color="black" />',
    '<Pause size={22} fill="white" color="white" />'
)
content = content.replace(
    '<Play size={22} fill="black" color="black" style={{ marginLeft: 2 }} />',
    '<Play size={22} fill="white" color="white" style={{ marginLeft: 2 }} />'
)

# 8. Retheme Capsule Buttons
content = content.replace(
    "background: isSaved ? G : 'rgba(255,255,255,0.08)',",
    "background: isSaved ? G : 'rgba(15,81,50,0.06)',"
)
content = content.replace(
    "color: isSaved ? '#000' : '#fff',",
    "color: isSaved ? '#ffffff' : '#0f5132',"
)
content = content.replace(
    "background: 'rgba(255,255,255,0.08)',",
    "background: 'rgba(15,81,50,0.06)',"
)
content = content.replace(
    "color: '#fff',",
    "color: '#0f5132',"
)

# 9. Retheme "Add to this playlist" button
content = content.replace(
    "border: '1px solid rgba(255,255,255,0.4)',\n                  borderRadius: 24,\n                  padding: '8px 24px',\n                  color: '#fff',",
    "border: '1px solid rgba(15,81,50,0.2)',\n                  borderRadius: 24,\n                  padding: '8px 24px',\n                  color: '#0f5132',"
)

open('src/app/(dashboard)/playlist/[id]/PlaylistClient.tsx', 'w', encoding='utf-8').write(content)
print('Successfully removed green gradient background and updated headers!')
