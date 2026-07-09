
content = open('src/app/(dashboard)/playlist/[id]/PlaylistClient.tsx', 'r', encoding='utf-8').read()

# 1. Change G constant from gold (#b08850) to dark green (#0f5132)
content = content.replace("const G = '#b08850';", "const G = '#0f5132';")

# 2. Retheme all fallback beige #fbf9f5 to pure white #ffffff
content = content.replace("#fbf9f5", "#ffffff")

# 3. Retheme hardcoded primary gold #b08850 to dark green #0f5132
content = content.replace("#b08850", "#0f5132")
content = content.replace("var(--color-ss-primary, #b08850)", "var(--color-ss-primary, #0f5132)")

# 4. Retheme any other instances of gold rgba/accent
content = content.replace("rgba(176, 136, 80, 0.25)", "rgba(15, 81, 50, 0.2)")
content = content.replace("rgba(176,136,80,0.12)", "rgba(15,81,50,0.08)")
content = content.replace("rgba(176,136,80,0.2)", "rgba(15,81,50,0.12)")
content = content.replace("rgba(176,136,80,0.08)", "rgba(15,81,50,0.06)")
content = content.replace("borderTopColor: '#b08850'", "borderTopColor: '#0f5132'")

# 5. Fix playlist picker items in PlaylistClient: color: alreadyAdded ? '#b08850' : '#fff' -> '#0f5132' : '#0f172a'
content = content.replace("color: alreadyAdded ? '#b08850' : '#fff'", "color: alreadyAdded ? '#0f5132' : '#0f172a'")

# 6. Active checkmark and plus buttons inside playlist picker inside PlaylistClient
content = content.replace("width: 22, height: 22, borderRadius: '50%', background: '#b08850',", "width: 22, height: 22, borderRadius: '50%', background: '#0f5132',")

# 7. Retheme any gold-colored texts/icons in metadata lists
content = content.replace("color: '#b08850'", "color: '#0f5132'")

# 8. Retheme check icon stroke in playlist client (stroke="#000" -> stroke="#fff" since background is green)
content = content.replace('stroke="#000" strokeWidth="4"', 'stroke="#ffffff" strokeWidth="4"')

# 9. Retheme inline modal backgrounds inside PlaylistClient (fbf9f5 -> ffffff)
content = content.replace("background: 'var(--color-ss-bg, #fbf9f5)'", "background: '#ffffff'")

open('src/app/(dashboard)/playlist/[id]/PlaylistClient.tsx', 'w', encoding='utf-8').write(content)
print('Successfully rethemed playlist client page!')
