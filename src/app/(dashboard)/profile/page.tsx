'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, Settings, MoreHorizontal, Edit, 
  Trash2, LogOut, Copy, Check, Music, User, 
  Camera, Eye, Lock, Globe, Plus, Pencil, X, Save,
  Smartphone, ShieldAlert
} from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { usePlaylistStore } from '@/store/playlistStore';
import { useMusicStore, trackGradient } from '@/store/musicStore';
import { mockArtists, mockPlaylists } from '@/lib/mockData';
import toast from 'react-hot-toast';
import { useIsMobile } from '@/hooks/useIsMobile';

const G = '#b08850';
const BG = 'var(--color-ss-bg, #fbf9f5)';
const BORDER = 'var(--color-ss-border, rgba(43, 34, 26, 0.08))';
const SOFT = '#4d3f35';
const MUTED = 'var(--color-ss-text-muted, #87786c)';
const WHITE = 'var(--color-ss-text-primary, #221a15)';

// Default banner cover image if the user has not uploaded one
const DEFAULT_BANNER = '/images/profile_banner.png';

const Label = ({ children }: { children: React.ReactNode }) => (
  <p style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
    {children}
  </p>
);

// ⚡ Module-level flag: true after first hydration, so subsequent tab
// navigations start mounted=true and skip the blank-screen frame.
let _profileHydrated = false;

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout, updateUser, upgradeToArtist, initializeSession } = useAuthStore();
  const { customPlaylists } = usePlaylistStore();
  const { recentlyPlayed } = useMusicStore();
  
  const [mounted, setMounted] = useState(_profileHydrated);
  const isMobile = useIsMobile(); // ⚡ shared single resize listener
  const [showMenu, setShowMenu] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  
  const [newName, setNewName] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Verification & Artist upgrade states
  const [showVerifyWarning, setShowVerifyWarning] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyPhone, setVerifyPhone] = useState('');
  const [verifyOtp, setVerifyOtp] = useState('');
  const [verifyStep, setVerifyStep] = useState<1 | 2 | 3 | 4>(1); // 1 = phone, 2 = otp, 3 = ID proof form, 4 = submitted timeline
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [verifying, setVerifying] = useState(false);

  // Identity Proof Details States
  const [verifyName, setVerifyName] = useState('');
  const [verifyType, setVerifyType] = useState<'aadhaar' | 'pan'>('aadhaar');
  const [verifyNumber, setVerifyNumber] = useState('');
  const [verifyImage, setVerifyImage] = useState('');
  const [submittingVerification, setSubmittingVerification] = useState(false);

  // Real-time validation helper functions
  const getPanValidationError = () => {
    if (verifyType !== 'pan') return null;
    const value = verifyNumber.trim().toUpperCase();
    if (!value) return null;

    const nameFirstLetter = verifyName.trim().charAt(0).toUpperCase();

    // Enforce PAN format: 5 letters (4th is P, 5th matches name's 1st letter), 4 digits, 1 letter
    if (value.length !== 10) {
      return 'Invalid PAN Number';
    }
    if (!/^[A-Z]{5}$/.test(value.substring(0, 5))) {
      return 'Invalid PAN Number';
    }
    if (value[3] !== 'P') {
      return 'Invalid PAN Number';
    }
    if (nameFirstLetter && value[4] !== nameFirstLetter) {
      return 'Invalid PAN Number';
    }
    if (!/^\d{4}$/.test(value.substring(5, 9))) {
      return 'Invalid PAN Number';
    }
    if (!/^[A-Z]$/.test(value[9])) {
      return 'Invalid PAN Number';
    }
    return null;
  };

  const getAadhaarValidationError = () => {
    if (verifyType !== 'aadhaar') return null;
    const value = verifyNumber.replace(/\s/g, '');
    if (!value) return null;
    if (value.length !== 12 || !/^\d{12}$/.test(value)) {
      return 'Invalid Aadhaar Number';
    }
    return null;
  };

  const panError = getPanValidationError();
  const aadhaarError = getAadhaarValidationError();

  const handleBecomeArtist = () => {
    if (!user) return;
    if (!user.verified) {
      setShowVerifyWarning(true);
      return;
    }
    router.push('/artist/apply');
  };

  const handleSendOtp = () => {
    if (!verifyPhone.trim() || verifyPhone.length < 10) {
      toast.error('Please enter a valid phone number');
      return;
    }
    // Simulate sending OTP instantly
    setTimeout(() => {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(code);
      setVerifying(false);
      setVerifyStep(2);
      toast(`Simulated OTP code: ${code}`, {
        icon: '💬',
        duration: 8000,
        style: { background: '#1a1a1a', color: '#fff', border: '1px solid #10b981', borderRadius: 12 }
      });

      // Simulate OTP Auto-Read (auto-fill the verification input after 10ms)
      setTimeout(() => {
        setVerifyOtp(code);
        toast.success('OTP auto-read successfully! 📱', {
          id: 'otp-auto-read',
          style: { background: '#1a1a1a', color: '#fff', border: '1px solid #b08850', borderRadius: 12 }
        });
      }, 10);
    }, 10);
  };

  const handleVerifyOtp = async () => {
    if (verifyOtp !== generatedOtp) {
      toast.error('Incorrect verification code. Please try again.');
      return;
    }

    setVerifying(true);
    setTimeout(async () => {
      setVerifying(false);
      setVerifyStep(3); // Move to Step 3: Identity proof form
      setVerifyName(user?.name || ''); // Default to display name
      toast.success('Mobile verification successful! 📱 Please submit identity proof.', {
        style: { background: '#1a1a1a', color: '#fff', border: '1px solid #b08850', borderRadius: 12 }
      });
    }, 10);
  };

  const handleSubmitProof = async () => {
    if (!verifyName.trim()) {
      toast.error('Please enter your name as in proof.');
      return;
    }
    if (!verifyNumber.trim()) {
      toast.error('Please enter your document number.');
      return;
    }
    if (!verifyImage) {
      toast.error('Please upload an image of your proof document.');
      return;
    }

    // Validation rules
    if (verifyType === 'aadhaar') {
      const aadhaarClean = verifyNumber.replace(/\s/g, '');
      if (!/^\d{12}$/.test(aadhaarClean)) {
        toast.error('Aadhaar Card number must be exactly 12 numeric digits.');
        return;
      }
    } else if (verifyType === 'pan') {
      const panClean = verifyNumber.trim().toUpperCase();
      if (panClean.length !== 10) {
        toast.error('PAN Card number must be exactly 10 characters.');
        return;
      }
      // Check first 5 letters
      if (!/^[A-Z]{5}$/.test(panClean.substring(0, 5))) {
        toast.error('The first 5 characters of PAN must be uppercase letters.');
        return;
      }
      // 4th character must be P
      if (panClean[3] !== 'P') {
        toast.error('The 4th character of PAN must be "P" (Individual).');
        return;
      }
      // 5th character must be the first letter of Name on Proof
      const nameFirstLetter = verifyName.trim().charAt(0).toUpperCase();
      if (panClean[4] !== nameFirstLetter) {
        toast.error(`The 5th character of PAN must be "${nameFirstLetter}" (matching the first letter of Name on Proof).`);
        return;
      }
      // 6-9 must be digits
      if (!/^\d{4}$/.test(panClean.substring(5, 9))) {
        toast.error('Characters 6 to 9 of PAN must be digits.');
        return;
      }
      // 10 must be a letter
      if (!/^[A-Z]$/.test(panClean[9])) {
        toast.error('The last character of PAN must be a letter.');
        return;
      }
    }

    setSubmittingVerification(true);
    const reqPayload = {
      name: verifyName.trim(),
      type: verifyType,
      number: verifyNumber.trim().toUpperCase(),
      image: verifyImage,
      status: 'PENDING' as const,
      submittedAt: new Date().toISOString()
    };

    try {
      const res = await fetch('/api/user/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verificationRequest: reqPayload
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        updateUser({
          verificationRequest: reqPayload
        } as any);
        toast.success('Verification details submitted! Under review. 📄', {
          style: { background: '#1a1a1a', color: '#fff', border: '1px solid #b08850', borderRadius: 12 }
        });
        setVerifyStep(4); // Move to submitted review screen
      } else {
        toast.error(data.error || 'Failed to submit verification details.');
      }
    } catch {
      toast.error('Network error submitting proof. Please try again.');
    } finally {
      setSubmittingVerification(false);
    }
  };

  const handleResetVerify = () => {
    setVerifyPhone('');
    setVerifyOtp('');
    setGeneratedOtp('');
    setVerifyStep(1);
    setVerifyName('');
    setVerifyType('aadhaar');
    setVerifyNumber('');
    setVerifyImage('');
    setShowVerifyModal(false);
  };



  useEffect(() => {
    _profileHydrated = true;
    setMounted(true);
    setNewName(user?.name || 'Manoj lastro');
    setCoverUrl((user as any)?.coverImage || '');

    // Auto-trigger verification modal if redirecting from artist application
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('verify') === 'true' && !user?.verified) {
        setVerifyStep(1);
        setShowVerifyModal(true);
        
        // Clean up verification parameter from URL query string
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
      }
    }
  }, [user]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  if (!mounted) return null;

  const displayName = user?.name || 'Manoj lastro';
  const displayCover = coverUrl || DEFAULT_BANNER;
  
  // Real-time playlists owned or saved by user
  const userCustomPlaylists = customPlaylists.filter(p => p.ownerId === user?.id || user?.playlists?.includes(p.id));
  const realPlaylists = [
    ...userCustomPlaylists,
    ...mockPlaylists.filter((p: any) => user?.playlists?.includes(p.id))
  ];

  // Resolve unique artists from user's actual recently played tracks
  const uniqueArtistIds = Array.from(new Set(recentlyPlayed.map(t => t.artistId)));
  const artistsToRender = uniqueArtistIds.map(id => {
    const artist = mockArtists.find(a => a.id === id);
    if (artist) {
      return {
        id: artist.id,
        name: artist.name,
        followers: `${artist.followers.toLocaleString()} followers`,
        image: artist.image
      };
    }
    // Fallback info for newly uploaded tracks/custom artists
    const trackInfo = recentlyPlayed.find(t => t.artistId === id);
    return {
      id: id,
      name: trackInfo?.artistName || 'Independent Artist',
      followers: 'Independent Creator',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop'
    };
  });

  const followersCount = user?.followers ?? 0;
  const followingCount = user?.followedArtists?.length ?? 0;

  const handleCopyProfileLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Profile link copied to clipboard!', {
      style: { background: '#1a1a1a', color: '#fff', border: `1px solid rgba(255,255,255,0.1)`, borderRadius: 12 }
    });
    setShowMenu(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB safety limit
        toast.error('Cover image must be less than 2MB to save locally.', {
          style: { background: '#1a1a1a', color: '#fff', border: '1px solid #ef4444', borderRadius: 12 }
        });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateProfile = async () => {
    if (!newName.trim()) {
      toast.error('Name cannot be empty');
      return;
    }
    
    const loadingToast = toast.loading('Updating profile...', {
      style: { background: '#1a1a1a', color: '#fff', border: `1px solid rgba(255,255,255,0.1)`, borderRadius: 12 }
    });

    try {
      const res = await fetch('/api/user/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          coverImage: coverUrl
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        updateUser({ 
          name: newName,
          ...({ coverImage: coverUrl } as any)
        });
        toast.dismiss(loadingToast);
        toast.success('Profile updated!', {
          style: { background: '#1a1a1a', color: '#fff', border: `1px solid ${G}30`, borderRadius: 12 }
        });
        setEditOpen(false);
      } else {
        toast.dismiss(loadingToast);
        toast.error(data.error || 'Failed to update profile');
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      toast.dismiss(loadingToast);
      toast.error('Network error updating profile');
    }
  };

  return (
    <div style={{ minHeight: '100%', background: BG, display: 'flex', flexDirection: 'column', color: WHITE, position: 'relative' }}>
      <style>{`
        .profile-main-content h1,
        .profile-main-content h2,
        .profile-main-content h3,
        .profile-main-content h4,
        .profile-main-content p,
        .profile-main-content span,
        .profile-main-content label {
          color: var(--color-ss-text-primary, #221a15) !important;
        }
        .profile-main-content button:not(.text-white-force) {
          color: var(--color-ss-text-primary, #221a15) !important;
          border-color: rgba(43, 34, 26, 0.3) !important;
        }
        .profile-main-content div[style*="background: rgba(255, 255, 255, 0.02)"],
        .profile-main-content div[style*="background: rgba(255,255,255,0.02)"] {
          background: var(--color-ss-surface, #f4eede) !important;
          border-color: var(--color-ss-border, rgba(43, 34, 26, 0.08)) !important;
        }
        .profile-main-content div[style*="background: rgba(255, 255, 255, 0.05)"],
        .profile-main-content div[style*="background: rgba(255,255,255,0.05)"] {
          background: var(--color-ss-surface, #f4eede) !important;
          border-color: var(--color-ss-border, rgba(43, 34, 26, 0.08)) !important;
        }
        .profile-modal-themed {
          background: var(--color-ss-elevated, #ffffff) !important;
          border: 1px solid var(--color-ss-border, rgba(43, 34, 26, 0.08)) !important;
          box-shadow: 0 20px 50px rgba(43, 34, 26, 0.15) !important;
        }
        .profile-modal-themed h1,
        .profile-modal-themed h2,
        .profile-modal-themed h3,
        .profile-modal-themed h4,
        .profile-modal-themed p,
        .profile-modal-themed span,
        .profile-modal-themed label {
          color: var(--color-ss-text-primary, #221a15) !important;
        }
        .profile-modal-themed input,
        .profile-modal-themed select,
        .profile-modal-themed textarea {
          background: var(--color-ss-surface, #f4eede) !important;
          color: var(--color-ss-text-primary, #221a15) !important;
          border: 1.5px solid var(--color-ss-border, rgba(43, 34, 26, 0.08)) !important;
        }
        .profile-modal-themed button {
          border-color: rgba(43, 34, 26, 0.3) !important;
        }
        .profile-modal-themed button[style*="background: rgb(176, 136, 80)"],
        .profile-modal-themed button[style*="background: #b08850"] {
          color: #000 !important;
          border: none !important;
        }
      `}</style>
      
      {/* ─── Cover Header Section ─── */}
      <div style={{
        position: 'relative',
        height: isMobile ? 320 : 380,
        width: '100%',
        overflow: 'hidden',
        background: '#000'
      }}>
        
        {/* Cover Photo Banner */}
        <img 
          src={displayCover} 
          alt={displayName} 
          style={{ 
            width: '100%', 
            height: '100%', 
            objectFit: 'cover',
            opacity: 0.85
          }} 
        />

        {/* Linear Gradient Overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to bottom, rgba(43,34,26,0.15) 0%, rgba(43,34,26,0.85) 100%)',
          zIndex: 1
        }} />

        {/* Back Arrow Button (Overlaid top-left) */}
        <div style={{ 
          position: 'absolute', 
          top: isMobile ? 'calc(var(--sat, 0px) + 16px)' : '24px', 
          left: isMobile ? '16px' : '24px',
          zIndex: 10
        }}>
          <button 
            onClick={() => router.back()} 
            style={{ 
              width: 36, 
              height: 36, 
              borderRadius: '50%', 
              background: 'rgba(0,0,0,0.6)', 
              border: 'none', 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              color: '#fff', 
              transition: 'background 0.2s' 
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.8)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.6)'}
          >
            <ChevronLeft size={22} />
          </button>
        </div>

        {/* Profile Details Overlay (Aligned bottom-left) */}
        <div style={{
          position: 'absolute',
          bottom: '24px',
          left: isMobile ? '16px' : '32px',
          right: isMobile ? '16px' : '32px',
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 6
        }}>
          
          {/* Verified Badge Row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 16,
              height: 16,
              borderRadius: '50%',
              background: user?.verified ? '#b08850' : '#6b6b6b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#000',
              flexShrink: 0
            }}>
              <Check size={10} strokeWidth={4} color={user?.verified ? "black" : "#ccc"} />
            </div>
            <span style={{ 
              fontSize: 12, 
              fontWeight: 700, 
              color: user?.verified ? '#fff' : SOFT,
              fontFamily: 'Inter, sans-serif'
            }}>
              {user?.verified ? 'Verified Profile' : 'Standard Profile'}
            </span>
          </div>

          {/* User Name */}
          <h1 style={{ 
            fontFamily: 'Outfit, sans-serif', 
            fontSize: isMobile ? 36 : 52, 
            fontWeight: 900, 
            letterSpacing: '-0.02em', 
            margin: '0 0 2px 0',
            color: '#fff',
            lineHeight: 1.1,
            textShadow: '0 2px 8px rgba(0,0,0,0.6)'
          }}>
            {displayName}
          </h1>

          {/* Real-time Follow Stats */}
          <p style={{ 
            fontSize: isMobile ? 13 : 14, 
            fontWeight: 600, 
            color: '#d1d5db', 
            margin: 0,
            textShadow: '0 1px 4px rgba(0,0,0,0.5)'
          }}>
            {followersCount} follower{followersCount === 1 ? '' : 's'} • {followingCount} following
          </p>
        </div>
      </div>

      {/* ─── Main Content ─── */}
      <div className="profile-main-content" style={{ 
        padding: isMobile ? '24px 16px 100px' : '32px 32px 100px', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: 32 
      }}>
        
        {/* Buttons Action Row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative' }}>
          
          {/* Edit Button */}
          <button 
            onClick={() => setEditOpen(true)}
            style={{
              padding: '8px 24px',
              borderRadius: 20,
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.4)',
              color: '#fff',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = '#fff';
              e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)';
              e.currentTarget.style.background = 'transparent';
            }}
          >
            Edit
          </button>

          {/* Settings gear icon */}
          <Link href="/settings" style={{ textDecoration: 'none' }}>
            <button 
              style={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.4)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = '#fff';
                e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)';
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <Settings size={17} />
            </button>
          </Link>

          {/* Three dots dropdown */}
          <div ref={menuRef} style={{ position: 'relative' }}>
            <button 
              onClick={() => setShowMenu(o => !o)}
              style={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.4)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = '#fff';
                e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)';
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <MoreHorizontal size={17} />
            </button>

            <AnimatePresence>
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.12 }}
                  className="profile-modal-themed"
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    left: 0,
                    width: 200,
                    zIndex: 100,
                    overflow: 'hidden'
                  }}
                >
                  <button 
                    onClick={handleCopyProfileLink}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '12px 16px',
                      background: 'none',
                      border: 'none',
                      color: '#fff',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <Copy size={14} /> Copy Profile Link
                  </button>
                  <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />
                  <button 
                    onClick={() => { logout(); setShowMenu(false); }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '12px 16px',
                      background: 'none',
                      border: 'none',
                      color: '#ef4444',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <LogOut size={14} color="#ef4444" /> Log out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ─── Playlists Section ─── */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 22, fontWeight: 800, margin: 0, flex: 1 }}>
              Playlists
            </h2>
            <Link href="/library" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, color: SOFT, fontSize: 13, fontWeight: 700 }}>
              <Pencil size={14} />
              <span>Manage</span>
            </Link>
          </div>

          {realPlaylists.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {realPlaylists.map((pl: any) => {
                const subtext = pl.tracks ? `${pl.tracks.length} song${pl.tracks.length === 1 ? '' : 's'}` : '0 songs';
                const displayImg = pl.coverImage && pl.coverImage !== 'undefined' ? pl.coverImage : null;
                
                return (
                  <Link 
                    key={pl.id} 
                    href={`/playlist/${pl.id}`}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 14, 
                      textDecoration: 'none', 
                      padding: '8px 10px', 
                      borderRadius: 8, 
                      transition: 'background 0.2s' 
                    }}
                    className="playlist-item-row"
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ 
                      width: 54, 
                      height: 54, 
                      borderRadius: 6, 
                      overflow: 'hidden', 
                      background: displayImg ? 'none' : trackGradient(pl.id), 
                      position: 'relative', 
                      flexShrink: 0 
                    }}>
                      {displayImg ? (
                        <img src={displayImg} alt={pl.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Music size={20} color="rgba(255,255,255,0.6)" />
                        </div>
                      )}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ color: '#fff', fontSize: 15, fontWeight: 700, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {pl.title}
                      </p>
                      <p style={{ color: SOFT, fontSize: 12, margin: '2px 0 0 0' }}>
                        {subtext}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div style={{ padding: '24px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: 14, border: `1px solid ${BORDER}`, textAlign: 'center' }}>
              <p style={{ color: SOFT, fontSize: 13, margin: '0 0 16px 0' }}>
                No playlists created yet. Start organizing your collection!
              </p>
              <Link href="/library" style={{ textDecoration: 'none' }}>
                <button style={{
                  padding: '8px 20px',
                  borderRadius: 20,
                  background: G,
                  border: 'none',
                  color: '#000',
                  fontSize: 12.5,
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6
                }}>
                  <Plus size={14} /> Create Playlist
                </button>
              </Link>
            </div>
          )}

          {realPlaylists.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
              <Link href="/library" style={{ textDecoration: 'none' }}>
                <button
                  style={{
                    padding: '10px 28px',
                    borderRadius: 20,
                    background: 'transparent',
                    border: '1px solid rgba(255,255,255,0.3)',
                    color: '#fff',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontFamily: 'Inter, sans-serif',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = '#fff';
                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)';
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  See all playlists
                </button>
              </Link>
            </div>
          )}
        </section>

        {/* ─── Recently Played Artists Section ─── */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 22, fontWeight: 800, margin: 0 }}>
            Recently played artists
          </h2>

          {artistsToRender.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {artistsToRender.map((artist: any) => (
                <Link 
                  key={artist.id}
                  href={`/artist/${artist.id}`}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 14, 
                    textDecoration: 'none', 
                    padding: '6px 8px', 
                    borderRadius: 8, 
                    transition: 'background 0.2s' 
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ 
                    width: 56, 
                    height: 56, 
                    borderRadius: '50%', 
                    overflow: 'hidden', 
                    background: 'rgba(50,50,50,0.5)', 
                    flexShrink: 0 
                  }}>
                    <img src={artist.image} alt={artist.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ color: '#fff', fontSize: 15, fontWeight: 700, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {artist.name}
                    </p>
                    <p style={{ color: SOFT, fontSize: 12, margin: '2px 0 0 0' }}>
                      {artist.followers}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div style={{ padding: '24px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: 14, border: `1px solid ${BORDER}`, textAlign: 'center' }}>
              <p style={{ color: SOFT, fontSize: 13, margin: 0 }}>
                No recently played artists yet. Start playing music to populate your list!
              </p>
            </div>
          )}
        </section>

        {/* ─── Verification & Creator Upgrades Section ─── */}
        {user?.role !== 'ARTIST' && (
          <section style={{ 
            background: 'rgba(255,255,255,0.02)', 
            border: `1px solid ${BORDER}`, 
            borderRadius: 18, 
            padding: isMobile ? '20px 16px' : '24px 28px',
            display: 'flex',
            flexDirection: 'column',
            gap: 16
          }}>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 20, fontWeight: 800, margin: 0, color: '#fff' }}>
              Creator Upgrades & Verification
            </h2>
            <p style={{ fontSize: 13, color: SOFT, margin: 0, lineHeight: 1.5 }}>
              Verify your identity to secure your profile and unlock music uploading to distribute your tracks globally.
            </p>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', 
              gap: 16,
              marginTop: 8
            }}>
              {/* Profile Verification Subcard */}
              <div style={{ 
                background: 'rgba(255,255,255,0.02)', 
                border: `1px solid rgba(255,255,255,0.04)`, 
                borderRadius: 12, 
                padding: 16,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: 12
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Identity Verification</span>
                    <span style={{ 
                      fontSize: 10, 
                      fontWeight: 800, 
                      padding: '2px 8px', 
                      borderRadius: 12, 
                      background: user?.verified 
                        ? 'rgba(176, 136, 80, 0.15)' 
                        : user?.verificationRequest?.status === 'PENDING'
                          ? 'rgba(245, 158, 11, 0.15)'
                          : user?.verificationRequest?.status === 'REJECTED'
                            ? 'rgba(239, 68, 68, 0.12)'
                            : 'rgba(239, 68, 68, 0.12)', 
                      color: user?.verified 
                        ? G 
                        : user?.verificationRequest?.status === 'PENDING'
                          ? '#f59e0b'
                          : user?.verificationRequest?.status === 'REJECTED'
                            ? '#f87171'
                            : '#f87171',
                      textTransform: 'uppercase'
                    }}>
                      {user?.verified 
                        ? 'Verified' 
                        : user?.verificationRequest?.status === 'PENDING'
                          ? 'Under Review'
                          : user?.verificationRequest?.status === 'REJECTED'
                            ? 'Rejected'
                            : 'Unverified'}
                    </span>
                  </div>
                  <p style={{ fontSize: 12, color: MUTED, margin: 0, lineHeight: 1.4 }}>
                    {user?.verified 
                      ? 'Your profile is authenticated and active.' 
                      : user?.verificationRequest?.status === 'PENDING'
                        ? 'Your proof document details are currently under admin review.'
                        : user?.verificationRequest?.status === 'REJECTED'
                          ? 'Your verification was rejected. Please resubmit identity proof.'
                          : 'Complete identity proof submission to secure your account.'}
                  </p>
                </div>
                {!user?.verified && (
                  user?.verificationRequest?.status === 'PENDING' ? (
                    <div style={{
                      padding: '8px 12px',
                      borderRadius: 10,
                      background: 'rgba(245, 158, 11, 0.08)',
                      border: '1px solid rgba(245, 158, 11, 0.2)',
                      color: '#f59e0b',
                      fontSize: 12,
                      fontWeight: 600,
                      textAlign: 'center',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6
                    }}>
                      <span>⌛ Pending Admin Review</span>
                    </div>
                  ) : (
                    <button 
                      onClick={() => {
                        setVerifyStep(1);
                        setShowVerifyModal(true);
                      }}
                      style={{
                        width: '100%',
                        padding: '10px 0',
                        borderRadius: 10,
                        background: 'rgba(255,255,255,0.06)',
                        border: `1px solid rgba(255,255,255,0.1)`,
                        color: '#fff',
                        fontSize: 12.5,
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                    >
                      {user?.verificationRequest?.status === 'REJECTED' ? 'Resubmit Verification' : 'Verify Profile'}
                    </button>
                  )
                )}
              </div>

              {/* Become an Artist Subcard */}
              <div style={{ 
                background: 'rgba(255,255,255,0.02)', 
                border: `1px solid rgba(255,255,255,0.04)`, 
                borderRadius: 12, 
                padding: 16,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: 12
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Become an Artist</span>
                  </div>
                  <p style={{ fontSize: 12, color: MUTED, margin: 0, lineHeight: 1.4 }}>
                    Unlock analytics, release tracks, and start earning streaming revenue.
                  </p>
                </div>
                <button 
                  onClick={handleBecomeArtist}
                  style={{
                    width: '100%',
                    padding: '10px 0',
                    borderRadius: 10,
                    background: G,
                    border: 'none',
                    color: '#000',
                    fontSize: 12.5,
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: `0 4px 12px ${G}22`,
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.01)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'none'}
                >
                  Become an Artist
                </button>
              </div>
            </div>
          </section>
        )}
      </div>

      {/* ─── Profile details editor modal ─── */}
      <AnimatePresence>
        {editOpen && (
          <div style={{
            position: 'fixed',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100000,
          }}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditOpen(false)}
              style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(0,0,0,0.8)',
                backdropFilter: 'blur(10px)',
              }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="profile-modal-themed"
              style={{
                position: 'relative',
                borderRadius: 24,
                padding: '28px',
                zIndex: 100001,
                width: 400,
                maxWidth: '90vw',
                display: 'flex',
                flexDirection: 'column',
                gap: 20
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 20, fontWeight: 900, color: '#fff', margin: 0 }}>
                  Edit profile details
                </h3>
                <button 
                  onClick={() => setEditOpen(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: SOFT, display: 'flex' }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Display Name Input */}
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
                  Display Name
                </p>
                <input 
                  type="text" 
                  value={newName} 
                  onChange={e => setNewName(e.target.value)}
                  placeholder="Enter your name"
                  style={{
                    width: '100%',
                    background: '#2c2c2e',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 12,
                    padding: '12px 16px',
                    color: '#fff',
                    fontSize: 14,
                    outline: 'none',
                    fontFamily: 'Inter, sans-serif',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Direct Cover Image Upload Dropzone */}
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
                  Profile Cover Banner
                </p>
                
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    position: 'relative',
                    width: '100%',
                    height: 120,
                    borderRadius: 12,
                    overflow: 'hidden',
                    background: '#2c2c2e',
                    border: '1px dashed rgba(255,255,255,0.2)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    cursor: 'pointer',
                    transition: 'border-color 0.2s, background 0.2s'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = G;
                    e.currentTarget.style.background = '#323236';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                    e.currentTarget.style.background = '#2c2c2e';
                  }}
                >
                  {coverUrl ? (
                    <>
                      <img src={coverUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0, opacity: 0.6 }} />
                      <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(0,0,0,0.7)', padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                        <Camera size={14} /> Upload Banner
                      </div>
                    </>
                  ) : (
                    <>
                      <Camera size={24} color={SOFT} />
                      <span style={{ fontSize: 12, color: SOFT, fontWeight: 600 }}>Choose file to upload</span>
                      <span style={{ fontSize: 10, color: MUTED }}>Supports JPG, PNG (Max 2MB)</span>
                    </>
                  )}
                </div>
                <input 
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
              </div>

              {/* Save/Cancel actions */}
              <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                <button
                  onClick={() => setEditOpen(false)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: 12,
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: 'transparent',
                    color: SOFT,
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateProfile}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: 12,
                    border: 'none',
                    background: G,
                    color: '#000',
                    fontSize: 13,
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: `0 4px 14px ${G}44`,
                  }}
                >
                  Save
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Verification Warning Modal */}
        {showVerifyWarning && (
          <div style={{
            position: 'fixed',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100000,
          }}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowVerifyWarning(false)}
              style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(0,0,0,0.8)',
                backdropFilter: 'blur(10px)',
              }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="profile-modal-themed"
              style={{
                position: 'relative',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: 24,
                padding: '28px',
                zIndex: 100001,
                width: 400,
                maxWidth: '90vw',
                display: 'flex',
                flexDirection: 'column',
                gap: 16
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: 'rgba(239, 68, 68, 0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <ShieldAlert size={20} color="#f87171" />
                </div>
                <div style={{ fontSize: 18, fontWeight: 900, color: '#fff', fontFamily: 'Outfit, sans-serif' }}>
                  Verification Required
                </div>
              </div>

              <p style={{ fontSize: 13, color: '#a3a3a3', lineHeight: 1.6, margin: 0 }}>
                To become a verified creator on Beato and upload tracks, you must first verify your profile identity. This helps prevent catalog spam and unauthorized track distribution.
              </p>

              <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                <button
                  onClick={() => setShowVerifyWarning(false)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: 12,
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: 'transparent',
                    color: SOFT,
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowVerifyWarning(false);
                    setVerifyStep(1);
                    setShowVerifyModal(true);
                  }}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: 12,
                    border: 'none',
                    background: G,
                    color: '#000',
                    fontSize: 13,
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: `0 4px 14px ${G}44`,
                  }}
                >
                  Verify Now
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Verification OTP Modal */}
        {showVerifyModal && (
          <div style={{
            position: 'fixed',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100000,
          }}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !verifying && handleResetVerify()}
              style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(0,0,0,0.8)',
                backdropFilter: 'blur(10px)',
              }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="profile-modal-themed"
              style={{
                position: 'relative',
                borderRadius: 24,
                padding: '28px',
                zIndex: 100001,
                width: 400,
                maxWidth: '90vw',
                display: 'flex',
                flexDirection: 'column',
                gap: 20
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 20, fontWeight: 900, color: '#fff', margin: 0 }}>
                  Profile Verification
                </h3>
                <button 
                  onClick={() => !verifying && handleResetVerify()}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: SOFT, display: 'flex' }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Step 1: Input Phone Number */}
              {verifyStep === 1 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <p style={{ fontSize: 13, color: SOFT, margin: 0, lineHeight: 1.5 }}>
                    Enter your phone number to receive a simulated WhatsApp validation code.
                  </p>
                  <div>
                    <Label>Phone Number</Label>
                    <div style={{ position: 'relative' }}>
                      <Smartphone size={16} color={MUTED} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                      <input 
                        type="tel" 
                        value={verifyPhone} 
                        onChange={e => setVerifyPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        style={{
                          width: '100%',
                          background: '#2c2c2e',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: 12,
                          padding: '12px 16px 12px 42px',
                          color: '#fff',
                          fontSize: 14,
                          outline: 'none',
                          fontFamily: 'Inter, sans-serif',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleSendOtp}
                    disabled={verifying}
                    style={{
                      padding: '12px',
                      borderRadius: 12,
                      border: 'none',
                      background: G,
                      color: '#000',
                      fontSize: 13,
                      fontWeight: 800,
                      cursor: verifying ? 'not-allowed' : 'pointer',
                      boxShadow: `0 4px 14px ${G}33`,
                      transition: 'all 0.2s',
                    }}
                  >
                    {verifying ? 'Sending OTP...' : 'Send Verification Code'}
                  </button>
                </div>
              )}

              {/* Step 2: Input OTP */}
              {verifyStep === 2 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <p style={{ fontSize: 13, color: SOFT, margin: 0, lineHeight: 1.5 }}>
                    We sent a simulated verification code to your number. Please enter it below.
                  </p>
                  <div>
                    <Label>Verification Code</Label>
                    <input 
                      type="text" 
                      maxLength={6}
                      value={verifyOtp} 
                      onChange={e => setVerifyOtp(e.target.value)}
                      placeholder="Enter 6-digit code"
                      style={{
                        width: '100%',
                        background: '#2c2c2e',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 12,
                        padding: '12px 16px',
                        color: '#fff',
                        fontSize: 16,
                        fontWeight: 'bold',
                        letterSpacing: '0.15em',
                        textAlign: 'center',
                        outline: 'none',
                        fontFamily: 'monospace',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      onClick={() => setVerifyStep(1)}
                      disabled={verifying}
                      style={{
                        flex: 1,
                        padding: '12px',
                        borderRadius: 12,
                        border: '1px solid rgba(255,255,255,0.1)',
                        background: 'transparent',
                        color: SOFT,
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: verifying ? 'not-allowed' : 'pointer',
                      }}
                    >
                      Back
                    </button>
                    <button
                      onClick={handleVerifyOtp}
                      disabled={verifying}
                      style={{
                        flex: 1,
                        padding: '12px',
                        borderRadius: 12,
                        border: 'none',
                        background: G,
                        color: '#000',
                        fontSize: 13,
                        fontWeight: 800,
                        cursor: verifying ? 'not-allowed' : 'pointer',
                        boxShadow: `0 4px 14px ${G}33`,
                      }}
                    >
                      {verifying ? 'Verifying...' : 'Verify OTP'}
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Identity Details & Document Proof Form */}
              {verifyStep === 3 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <p style={{ fontSize: 13, color: SOFT, margin: 0, lineHeight: 1.5 }}>
                    Please submit your official document details for verification.
                  </p>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div>
                      <Label>Name as in Proof</Label>
                      <input 
                        type="text" 
                        value={verifyName} 
                        onChange={e => setVerifyName(e.target.value)}
                        placeholder="e.g. SARATH KUMAR M"
                        style={{
                          width: '100%',
                          background: '#2c2c2e',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: 12,
                          padding: '12px 16px',
                          color: '#fff',
                          fontSize: 14,
                          outline: 'none',
                          fontFamily: 'Inter, sans-serif',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    <div>
                      <Label>Proof Document Type</Label>
                      <select 
                        value={verifyType} 
                        onChange={e => {
                          setVerifyType(e.target.value as 'aadhaar' | 'pan');
                          setVerifyNumber('');
                        }}
                        style={{
                          width: '100%',
                          background: '#2c2c2e',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: 12,
                          padding: '12px 14px',
                          color: '#fff',
                          fontSize: 14,
                          outline: 'none',
                          fontFamily: 'Inter, sans-serif',
                          boxSizing: 'border-box',
                          colorScheme: 'dark'
                        }}
                      >
                        <option value="aadhaar">Aadhaar Card</option>
                        <option value="pan">PAN Card</option>
                      </select>
                    </div>

                    <div>
                      <Label>{verifyType === 'aadhaar' ? 'Aadhaar Card Number (12 digits)' : 'PAN Card Number (10 characters)'}</Label>
                      <input 
                        type="text" 
                        value={verifyNumber} 
                        onChange={e => {
                          const val = e.target.value;
                          setVerifyNumber(verifyType === 'pan' ? val.toUpperCase() : val);
                        }}
                        placeholder={verifyType === 'aadhaar' ? 'e.g. 1234 5678 9012' : 'e.g. ABCDP1234Z'}
                        maxLength={verifyType === 'aadhaar' ? 14 : 10}
                        style={{
                          width: '100%',
                          background: '#2c2c2e',
                          border: `1px solid ${
                            (verifyType === 'pan' && panError) || (verifyType === 'aadhaar' && aadhaarError)
                              ? '#ef4444'
                              : 'rgba(255,255,255,0.1)'
                          }`,
                          borderRadius: 12,
                          padding: '12px 16px',
                          color: '#fff',
                          fontSize: 14,
                          outline: 'none',
                          fontFamily: 'monospace',
                          boxSizing: 'border-box'
                        }}
                      />
                      {verifyType === 'pan' && panError && (
                        <span style={{ fontSize: 11, color: '#ef4444', display: 'block', marginTop: 6, fontWeight: 600 }}>
                          ⚠️ {panError}
                        </span>
                      )}
                      {verifyType === 'pan' && !panError && (
                        <span style={{ fontSize: 10, color: MUTED, display: 'block', marginTop: 4 }}>
                          Format: 5 letters (4th is P, 5th matches name's 1st letter), 4 digits, 1 letter.
                        </span>
                      )}
                      {verifyType === 'aadhaar' && aadhaarError && (
                        <span style={{ fontSize: 11, color: '#ef4444', display: 'block', marginTop: 6, fontWeight: 600 }}>
                          ⚠️ {aadhaarError}
                        </span>
                      )}
                    </div>

                    <div>
                      <Label>Proof Document Image</Label>
                      <div 
                        onClick={() => {
                          const fileInput = document.createElement('input');
                          fileInput.type = 'file';
                          fileInput.accept = 'image/*';
                          fileInput.onchange = (e: any) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              if (file.size > 2 * 1024 * 1024) {
                                toast.error('Document image must be under 2MB.');
                                return;
                              }
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setVerifyImage(reader.result as string);
                              };
                              reader.readAsDataURL(file);
                            }
                          };
                          fileInput.click();
                        }}
                        style={{
                          width: '100%',
                          height: 100,
                          borderRadius: 12,
                          border: '1px dashed rgba(255,255,255,0.2)',
                          background: '#2c2c2e',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          cursor: 'pointer',
                          position: 'relative',
                          overflow: 'hidden',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = G}
                        onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'}
                      >
                        {verifyImage ? (
                          <>
                            <img src={verifyImage} alt="Document Preview" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.5 }} />
                            <div style={{ position: 'absolute', zIndex: 2, background: 'rgba(0,0,0,0.7)', padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                              ✓ Image Selected (Change)
                            </div>
                          </>
                        ) : (
                          <>
                            <span style={{ fontSize: 20 }}>📸</span>
                            <span style={{ fontSize: 12, color: SOFT, fontWeight: 600 }}>Upload Document Image</span>
                            <span style={{ fontSize: 9, color: MUTED }}>JPG, PNG (Max 2MB)</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                    <button
                      onClick={() => setVerifyStep(2)}
                      disabled={submittingVerification}
                      style={{
                        flex: 1,
                        padding: '12px',
                        borderRadius: 12,
                        border: '1px solid rgba(255,255,255,0.1)',
                        background: 'transparent',
                        color: SOFT,
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: submittingVerification ? 'not-allowed' : 'pointer',
                      }}
                    >
                      Back
                    </button>
                    <button
                      onClick={handleSubmitProof}
                      disabled={submittingVerification}
                      style={{
                        flex: 1.5,
                        padding: '12px',
                        borderRadius: 12,
                        border: 'none',
                        background: G,
                        color: '#000',
                        fontSize: 13,
                        fontWeight: 800,
                        cursor: submittingVerification ? 'not-allowed' : 'pointer',
                        boxShadow: `0 4px 14px ${G}33`,
                      }}
                    >
                      {submittingVerification ? 'Submitting...' : 'Submit Verification'}
                    </button>
                  </div>
                </div>
              )}

              {/* Step 4: Submission Success Screen */}
              {verifyStep === 4 && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, textAlign: 'center', padding: '10px 0' }}>
                  <div style={{
                    width: 56, height: 56, borderRadius: '50%',
                    background: 'rgba(176, 136, 80, 0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <Check size={28} color={G} strokeWidth={3} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: 18, fontWeight: 800, color: '#fff', margin: '0 0 6px 0', fontFamily: 'Outfit, sans-serif' }}>
                      Request Under Review!
                    </h4>
                    <p style={{ fontSize: 13, color: SOFT, margin: 0, lineHeight: 1.5 }}>
                      Your identity proof details have been submitted successfully. Our admin team will review your application. This normally takes less than 24 hours.
                    </p>
                  </div>

                  <button
                    onClick={handleResetVerify}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: 12,
                      border: 'none',
                      background: G,
                      color: '#000',
                      fontSize: 13,
                      fontWeight: 800,
                      cursor: 'pointer',
                      boxShadow: `0 4px 14px ${G}33`,
                      marginTop: 8
                    }}
                  >
                    Done
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
