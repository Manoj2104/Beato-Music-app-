import { NextRequest, NextResponse } from 'next/server';
import { requireArtist } from '@/lib/rbac';
import { db } from '@/lib/db';
import { verifyJWT } from '@/lib/jwt';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const rbacCheck = await requireArtist(request);
  if (!rbacCheck.authorized || !rbacCheck.user) {
    return NextResponse.json({ error: rbacCheck.message || 'Unauthorized' }, { status: rbacCheck.status || 401 });
  }

  try {
    // Use the already-verified user from rbacCheck (supports both cookie & Authorization header)
    const artistId = rbacCheck.user.userId!;
    const user = db.getUserById(artistId);
    if (!user) return NextResponse.json({ error: 'Artist not found' }, { status: 404 });

    const allData = db.getArtistProfile(artistId);
    const tracks = db.getTracks().filter(t => t.artistId === artistId);
    const followers = db.getUsers().filter(u => u.followedArtists?.includes(artistId)).length;
    const payoutArtist = db.getPayoutArtistById(artistId);
    const payoutStreams = db.getPayoutStreams().filter(s => s.artistId === artistId);
    const profileViews = db.getProfileViews()[artistId] || 0;
    const totalStreams = tracks.reduce((s, t) => s + (t.plays || 0), 0);
    const campaigns = db.getCampaigns().filter(c => c.artistId === artistId);
    const events = db.getEvents().filter(e => e.artistId === artistId);
    const merchItems = db.getMerchItems().filter(m => m.artistId === artistId);
    const comments = db.getComments().filter(c => c.artistId === artistId);

    // Compute profile strength score
    const profile = allData;
    let score = 0;
    const suggestions: string[] = [];
    if (profile?.avatar || user.avatar) { score += 10; } else { suggestions.push('Add a profile photo (+10 pts)'); }
    if (profile?.bannerImage) { score += 10; } else { suggestions.push('Upload a banner image (+10 pts)'); }
    if (profile?.bio && profile.bio.length > 50) { score += 15; } else { suggestions.push('Write a complete artist bio (+15 pts)'); }
    if (profile?.socialLinks?.instagram || profile?.socialLinks?.twitter || profile?.socialLinks?.youtube) { score += 10; } else { suggestions.push('Connect social media accounts (+10 pts)'); }
    if (tracks.length > 0) { score += 15; } else { suggestions.push('Upload your first track (+15 pts)'); }
    if (profile?.verificationLevel && profile.verificationLevel !== 'none') { score += 15; } else { suggestions.push('Complete artist verification (+15 pts)'); }
    if (followers > 5) { score += 10; } else { suggestions.push('Grow to 5+ followers (+10 pts)'); }
    if (merchItems.length > 0) { score += 5; } else { suggestions.push('Set up merch store (+5 pts)'); }
    if (events.length > 0) { score += 5; } else { suggestions.push('Schedule a live event (+5 pts)'); }
    if (profile?.keywords?.length > 0) { score += 5; } else { suggestions.push('Add SEO keywords (+5 pts)'); }

    // Follower growth trend (last 7 days - mock based on real data)
    const followerGrowth = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return { date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), followers: Math.max(0, followers - (6 - i) * 2) };
    });

    // Geography from streams
    const geoMap: Record<string, number> = {};
    payoutStreams.forEach(s => {
      const c = s.country || 'IN';
      geoMap[c] = (geoMap[c] || 0) + 1;
    });

    // Audit log
    const auditLog = profile?.auditLog || [];
    const loginHistory = profile?.loginHistory || [];
    const verificationStatus = profile?.verificationStatus || {};
    const bookingRequests = profile?.bookingRequests || [];

    return NextResponse.json({
      success: true,
      profile: {
        id: artistId,
        name: user.name,
        email: user.email,
        avatar: profile?.avatar || user.avatar || '',
        bannerImage: profile?.bannerImage || '',
        stageName: profile?.stageName || user.name,
        realName: profile?.realName || '',
        username: profile?.username || user.email?.split('@')[0] || '',
        customUrl: profile?.customUrl || '',
        bio: profile?.bio || '',
        bioLanguages: profile?.bioLanguages || {},
        artistCategory: profile?.artistCategory || 'Independent',
        primaryGenre: profile?.primaryGenre || 'Pop',
        secondaryGenres: profile?.secondaryGenres || [],
        languages: profile?.languages || ['English'],
        country: profile?.country || user.country || 'IN',
        city: profile?.city || '',
        timezone: profile?.timezone || 'Asia/Kolkata',
        labelName: profile?.labelName || '',
        managementContact: profile?.managementContact || '',
        bookingContact: profile?.bookingContact || '',
        pressContact: profile?.pressContact || '',
        businessContact: profile?.businessContact || '',
        brandColor: profile?.brandColor || '#b08850',
        brandFont: profile?.brandFont || 'Inter',
        socialLinks: profile?.socialLinks || {},
        socialFollowers: profile?.socialFollowers || {},
        verificationLevel: profile?.verificationLevel || 'none',
        verificationStatus: verificationStatus,
        verificationDocuments: profile?.verificationDocuments || [],
        keywords: profile?.keywords || [],
        tags: profile?.tags || [],
        careerMilestones: profile?.careerMilestones || [],
        awards: profile?.awards || [],
        featuredTracks: profile?.featuredTracks || tracks.slice(0, 3).map(t => t.id),
        pinnedPosts: profile?.pinnedPosts || [],
        layoutTheme: profile?.layoutTheme || 'dark',
        twoFactorEnabled: profile?.twoFactorEnabled || false,
        bookingRequests,
        collaborationRequests: profile?.collaborationRequests || [],
        auditLog: auditLog.slice(-20),
        loginHistory: loginHistory.slice(-10),
        createdAt: user.createdAt,
      },
      stats: {
        profileScore: score,
        suggestions,
        totalStreams,
        followers,
        profileViews,
        revenue: payoutArtist?.lifetimeEarnings || 0,
        trackCount: tracks.length,
        campaignCount: campaigns.length,
        eventCount: events.length,
        commentCount: comments.length,
        followerGrowth,
        geography: geoMap,
      }
    });
  } catch (err: any) {
    console.error('Profile GET error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const rbacCheck = await requireArtist(request);
  if (!rbacCheck.authorized) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    // Use the already-verified user from rbacCheck (supports both cookie & Authorization header)
    const artistId = rbacCheck.user!.userId!;
    const body = await request.json();
    const { action, payload } = body;

    const currentProfile = db.getArtistProfile(artistId) || {};

    const addAuditEntry = (action: string, details: string) => {
      const log = currentProfile.auditLog || [];
      log.unshift({ id: `al-${Date.now()}`, action, details, timestamp: new Date().toISOString() });
      return log.slice(0, 50);
    };

    switch (action) {
      case 'save_identity': {
        const updated = {
          ...currentProfile,
          stageName: payload.stageName,
          realName: payload.realName,
          username: payload.username,
          customUrl: payload.customUrl,
          artistCategory: payload.artistCategory,
          primaryGenre: payload.primaryGenre,
          secondaryGenres: payload.secondaryGenres || [],
          languages: payload.languages || [],
          country: payload.country,
          city: payload.city,
          timezone: payload.timezone,
          labelName: payload.labelName,
          managementContact: payload.managementContact,
          bookingContact: payload.bookingContact,
          pressContact: payload.pressContact,
          businessContact: payload.businessContact,
          brandColor: payload.brandColor,
          brandFont: payload.brandFont,
          auditLog: addAuditEntry('identity_update', 'Artist identity information updated'),
        };
        db.saveArtistProfile(artistId, updated);
        // Also update user name if stage name changed
        if (payload.stageName) {
          const user = db.getUserById(artistId);
          if (user) db.updateUser(artistId, { name: payload.stageName });
        }
        return NextResponse.json({ success: true, profile: updated });
      }

      case 'save_bio': {
        const updated = {
          ...currentProfile,
          bio: payload.bio,
          bioLanguages: { ...(currentProfile.bioLanguages || {}), ...payload.bioLanguages },
          careerMilestones: payload.careerMilestones || currentProfile.careerMilestones || [],
          keywords: payload.keywords || currentProfile.keywords || [],
          tags: payload.tags || currentProfile.tags || [],
          auditLog: addAuditEntry('bio_update', 'Artist bio updated'),
        };
        db.saveArtistProfile(artistId, updated);
        return NextResponse.json({ success: true });
      }

      case 'save_social': {
        const updated = {
          ...currentProfile,
          socialLinks: { ...(currentProfile.socialLinks || {}), ...payload.socialLinks },
          socialFollowers: { ...(currentProfile.socialFollowers || {}), ...payload.socialFollowers },
          auditLog: addAuditEntry('social_update', `Social links updated: ${Object.keys(payload.socialLinks || {}).join(', ')}`),
        };
        db.saveArtistProfile(artistId, updated);
        return NextResponse.json({ success: true });
      }

      case 'verify_social': {
        const platform = payload.platform;
        const handle = payload.handle;
        // Simulate real verification (in prod would do OAuth)
        const verificationStatus = currentProfile.verificationStatus || {};
        verificationStatus[platform] = { verified: true, handle, verifiedAt: new Date().toISOString() };
        const updated = {
          ...currentProfile,
          verificationStatus,
          socialLinks: { ...(currentProfile.socialLinks || {}), [platform]: handle },
          auditLog: addAuditEntry('social_verify', `${platform} account verified: ${handle}`),
        };
        db.saveArtistProfile(artistId, updated);
        return NextResponse.json({ success: true, verificationStatus });
      }

      case 'update_avatar': {
        const updated = {
          ...currentProfile,
          avatar: payload.url,
          auditLog: addAuditEntry('avatar_update', 'Profile photo updated'),
        };
        db.saveArtistProfile(artistId, updated);
        db.updateUser(artistId, { avatar: payload.url });
        return NextResponse.json({ success: true });
      }

      case 'update_banner': {
        const updated = {
          ...currentProfile,
          bannerImage: payload.url,
          auditLog: addAuditEntry('banner_update', 'Banner image updated'),
        };
        db.saveArtistProfile(artistId, updated);
        return NextResponse.json({ success: true });
      }

      case 'submit_verification': {
        const verLevel = payload.level; // 'verified_artist', 'official', etc.
        const updated = {
          ...currentProfile,
          verificationSubmission: {
            level: verLevel,
            documents: payload.documents || [],
            submittedAt: new Date().toISOString(),
            status: 'under_review',
            notes: payload.notes || '',
          },
          verificationLevel: currentProfile.verificationLevel || 'none',
          auditLog: addAuditEntry('verification_submit', `Verification submitted for level: ${verLevel}`),
        };
        db.saveArtistProfile(artistId, updated);
        return NextResponse.json({ success: true, message: 'Verification request submitted for admin review' });
      }

      case 'approve_verification': {
        // This would normally be admin-only, but we simulate for demo
        const updated = {
          ...currentProfile,
          verificationLevel: payload.level || 'verified_artist',
          verificationApprovedAt: new Date().toISOString(),
          auditLog: addAuditEntry('verification_approved', `Verification approved: ${payload.level}`),
        };
        db.saveArtistProfile(artistId, updated);
        return NextResponse.json({ success: true });
      }

      case 'save_seo': {
        const updated = {
          ...currentProfile,
          keywords: payload.keywords || [],
          tags: payload.tags || [],
          discoveryCategory: payload.discoveryCategory,
          seoTitle: payload.seoTitle,
          seoDescription: payload.seoDescription,
          auditLog: addAuditEntry('seo_update', 'SEO & discovery settings updated'),
        };
        db.saveArtistProfile(artistId, updated);
        return NextResponse.json({ success: true });
      }

      case 'save_customization': {
        const updated = {
          ...currentProfile,
          layoutTheme: payload.layoutTheme,
          featuredTracks: payload.featuredTracks || [],
          pinnedPosts: payload.pinnedPosts || [],
          brandColor: payload.brandColor,
          brandFont: payload.brandFont,
          profileSections: payload.profileSections || [],
          auditLog: addAuditEntry('customization_update', 'Profile layout & customization updated'),
        };
        db.saveArtistProfile(artistId, updated);
        return NextResponse.json({ success: true });
      }

      case 'add_milestone': {
        const milestones = currentProfile.careerMilestones || [];
        const newMilestone = {
          id: `ms-${Date.now()}`,
          year: payload.year,
          title: payload.title,
          description: payload.description,
          createdAt: new Date().toISOString(),
        };
        milestones.unshift(newMilestone);
        const updated = {
          ...currentProfile,
          careerMilestones: milestones,
          auditLog: addAuditEntry('milestone_add', `Career milestone added: ${payload.title}`),
        };
        db.saveArtistProfile(artistId, updated);
        return NextResponse.json({ success: true, item: newMilestone });
      }

      case 'delete_milestone': {
        const updated = {
          ...currentProfile,
          careerMilestones: (currentProfile.careerMilestones || []).filter((m: any) => m.id !== payload.id),
          auditLog: addAuditEntry('milestone_delete', 'Career milestone removed'),
        };
        db.saveArtistProfile(artistId, updated);
        return NextResponse.json({ success: true });
      }

      case 'add_booking_request': {
        const requests = currentProfile.bookingRequests || [];
        const newRequest = {
          id: `br-${Date.now()}`,
          requester: payload.requester,
          type: payload.type, // 'show', 'podcast', 'sponsorship', etc.
          message: payload.message,
          date: payload.date,
          budget: payload.budget,
          status: 'pending',
          receivedAt: new Date().toISOString(),
        };
        requests.unshift(newRequest);
        const updated = {
          ...currentProfile,
          bookingRequests: requests.slice(0, 50),
          auditLog: addAuditEntry('booking_received', `Booking request from: ${payload.requester}`),
        };
        db.saveArtistProfile(artistId, updated);
        return NextResponse.json({ success: true, item: newRequest });
      }

      case 'update_booking_status': {
        const requests = (currentProfile.bookingRequests || []).map((r: any) => 
          r.id === payload.id ? { ...r, status: payload.status } : r
        );
        const updated = { ...currentProfile, bookingRequests: requests };
        db.saveArtistProfile(artistId, updated);
        return NextResponse.json({ success: true });
      }

      case 'toggle_2fa': {
        const updated = {
          ...currentProfile,
          twoFactorEnabled: payload.enabled,
          auditLog: addAuditEntry('2fa_toggle', `Two-factor authentication ${payload.enabled ? 'enabled' : 'disabled'}`),
        };
        db.saveArtistProfile(artistId, updated);
        return NextResponse.json({ success: true });
      }

      case 'add_award': {
        const awards = currentProfile.awards || [];
        const newAward = {
          id: `aw-${Date.now()}`,
          title: payload.title,
          issuedBy: payload.issuedBy,
          year: payload.year,
          icon: payload.icon || '🏆',
        };
        awards.unshift(newAward);
        const updated = { ...currentProfile, awards, auditLog: addAuditEntry('award_add', `Award added: ${payload.title}`) };
        db.saveArtistProfile(artistId, updated);
        return NextResponse.json({ success: true, item: newAward });
      }

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (err: any) {
    console.error('Profile POST error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
