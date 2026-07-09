
content = open('src/app/(dashboard)/playlist/[id]/PlaylistClient.tsx', 'r', encoding='utf-8').read()

# 1. Add useRef and upload handler code below setEditGrad state
old_state_block = "  const [editGrad, setEditGrad] = useState((playlist as any)?.gradientCss || EDIT_GRADIENTS[0].css);"
new_state_block = """  const [editGrad, setEditGrad] = useState((playlist as any)?.gradientCss || EDIT_GRADIENTS[0].css);

  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleCoverClick = () => {
    if (isCustomPlaylist && isOwner) {
      fileInputRef.current?.click();
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2.5 * 1024 * 1024) {
      toast.error('Image is too large! Please choose an image smaller than 2.5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      if (!playlist) return;
      const normPlaylistId = normalizeId(playlist.id);
      const updated = customPlaylists.map((p: any) => {
        if (normalizeId(p.id) === normPlaylistId) {
          return {
            ...p,
            coverImage: base64,
          };
        }
        return p;
      });
      setCustomPlaylists(updated);
      toast.success('Playlist cover image uploaded successfully! 🖼️');
    };
    reader.onerror = () => {
      toast.error('Failed to read image file.');
    };
    reader.readAsDataURL(file);
  };"""

content = content.replace(old_state_block, new_state_block)

# 2. Add hidden file input uploader at the top of the mobile playlist container
old_mobile_container_start = """      {/* ── MOBILE PLAYLIST VIEW ── */}
      <div className="playlist-mobile-container" style={{
        display: 'none',
        background: 'linear-gradient(180deg, #f0f7f4 0%, #ffffff 40%)',"""

new_mobile_container_start = """      {/* ── MOBILE PLAYLIST VIEW ── */}
      <div className="playlist-mobile-container" style={{
        display: 'none',
        background: 'linear-gradient(180deg, #d5edd2 0%, #f4faf2 45%, #ffffff 80%)',"""

content = content.replace(old_mobile_container_start, new_mobile_container_start)

# Add hidden file input just below the container tag
old_top_section = """        {/* 2. TOP SECTION (Back arrow, search, sort) */}"""
new_top_section = """        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleImageUpload} 
          accept="image/*" 
          style={{ display: 'none' }} 
        />

        {/* 2. TOP SECTION (Back arrow, search, sort) */}"""

content = content.replace(old_top_section, new_top_section)

# 3. Update top bar search box to perfect grey style
old_search_box = """            <div style={{
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(15, 81, 50, 0.06)',
              borderRadius: 24,
              padding: '6px 14px',
              gap: 8,
              height: 36,
              boxSizing: 'border-box'
            }}>"""

new_search_box = """            <div style={{
              display: 'flex',
              alignItems: 'center',
              background: '#f1f5f9',
              border: '1.5px solid #cbd5e1',
              borderRadius: 24,
              padding: '6px 14px',
              gap: 8,
              height: 36,
              boxSizing: 'border-box'
            }}>"""

content = content.replace(old_search_box, new_search_box)

# 4. Remove cover image shadow and set click to trigger file uploader
old_cover_art_block = """          <div 
            onClick={() => {
              if (isCustomPlaylist && isOwner) {
                setEditTitle(playlist.title);
                setEditCover(playlist.coverImage || '');
                setEditGrad((playlist as any).gradientCss || '');
                setShowEditModal(true);
              }
            }}
            style={{
              width: 240,
              height: 240,
              boxShadow: '0 12px 36px rgba(0,0,0,0.5)',
              transform: `scale(${coverScale}) translateY(${coverTranslateY}px)`,"""

new_cover_art_block = """          <div 
            onClick={handleCoverClick}
            style={{
              width: 240,
              height: 240,
              boxShadow: 'none',
              transform: `scale(${coverScale}) translateY(${coverTranslateY}px)`,"""

content = content.replace(old_cover_art_block, new_cover_art_block)

open('src/app/(dashboard)/playlist/[id]/PlaylistClient.tsx', 'w', encoding='utf-8').write(content)
print('Successfully configured direct file upload, removed cover image shadow, and added grey search box design!')
