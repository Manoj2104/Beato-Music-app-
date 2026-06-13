import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/rbac';
import { db } from '@/lib/db';
import { logSecurityEvent } from '@/lib/audit';
import crypto from 'crypto';

const DEFAULT_PLAN_PRICES: Record<string, number> = {
  free: 0,
  student: 4.99,
  premium: 9.99,
  family: 15.99,
  creator: 19.99,
};

function recordManualPlanChange(user: any, newPlan: string) {
  const p = newPlan.toLowerCase();
  const txDate = new Date();
  const allTx = db.getTransactions();
  const txSerial = 50000 + allTx.length + 1;
  const invoiceId = `INV-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
  
  db.saveTransaction({
    id: `TXN-${txSerial}`,
    userId: user.id,
    user: user.name,
    email: user.email,
    avatar: user.avatar || null,
    amount: 0, // Manual plan upgrades do not generate actual payment revenue
    plan: p,
    method: 'Admin Plan', // Show "Admin Plan" as the payment method for manual overrides
    date: txDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    dateTs: txDate.getTime(),
    status: 'completed',
    currency: 'USD',
    invoiceId,
    country: user.country || 'IN',
    risk: 'low',
    billingCycle: 'Current',
    planLabel: p.charAt(0).toUpperCase() + p.slice(1),
  });
}


export async function POST(request: NextRequest) {
  const rbacCheck = await requireAdmin(request);
  if (!rbacCheck.authorized) {
    return NextResponse.json(
      { error: rbacCheck.message || 'Forbidden' },
      { status: rbacCheck.status || 403 }
    );
  }

  try {
    const body = await request.json();
    const { userId, userIds, action, payload } = body;
    const adminUser = rbacCheck.user;

    if (!action) {
      return NextResponse.json({ error: 'Action is required.' }, { status: 400 });
    }

    // BULK ACTIONS
    if (['bulk_suspend', 'bulk_activate', 'bulk_remove'].includes(action)) {
      if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        return NextResponse.json({ error: 'userIds array is required for bulk actions.' }, { status: 400 });
      }

      let processed = 0;
      for (const id of userIds) {
        const targetUser = db.getUserById(id);
        if (!targetUser) continue;
        
        const isArtist = targetUser.role === 'ARTIST';

        if (action === 'bulk_suspend') {
          db.updateUser(id, { isActive: false });
          if (isArtist) {
            const allTracks = db.getTracks().filter(t => t.artistId === id);
            allTracks.forEach(t => db.deleteTrack(t.id));
          }
          processed++;
        } else if (action === 'bulk_activate') {
          db.updateUser(id, { isActive: true });
          processed++;
        } else if (action === 'bulk_remove') {
          if (isArtist) {
            const allTracks = db.getTracks().filter(t => t.artistId === id);
            allTracks.forEach(t => db.deleteTrack(t.id));
          }
          db.deleteUser(id);
          processed++;
        }
      }

      logSecurityEvent(
        adminUser?.token || 'unknown-token',
        `Admin (${adminUser?.role})`,
        'ADMIN_ACTION',
        `Bulk ${action.replace('bulk_', '')} executed on ${processed} users.`
      );

      return NextResponse.json({ success: true, message: `Bulk action completed. Processed ${processed} users.` });
    }

    // CREATE NEW USER
    if (action === 'create') {
      if (!payload || !payload.email || !payload.name) {
        return NextResponse.json({ error: 'Name and Email are required for creating a user.' }, { status: 400 });
      }
      
      const existing = db.getUserByEmail(payload.email);
      if (existing) {
        return NextResponse.json({ error: 'Email already exists.' }, { status: 400 });
      }

      const hasPlan = payload.plan && payload.plan !== 'free';
      const newUser = db.saveUser({
        name: payload.name,
        email: payload.email,
        passwordHash: 'default-hash-will-reset', // simulated
        role: payload.role || 'USER',
        isActive: true,
        subscription: payload.plan || 'free',
        country: payload.country || 'US',
        paymentMethod: hasPlan ? 'Admin Plan' : undefined,
      });

      if (hasPlan) {
        recordManualPlanChange(newUser, payload.plan);
      }

      logSecurityEvent(
        adminUser?.token || 'unknown-token',
        `Admin (${adminUser?.role})`,
        'ADMIN_ACTION',
        `Admin created new user "${newUser.name}" (${newUser.email}).`
      );

      return NextResponse.json({ success: true, message: 'User created successfully.', user: newUser });
    }

    // ACTIONS REQUIRING SINGLE USER ID
    if (!userId) {
      return NextResponse.json({ error: 'userId is required.' }, { status: 400 });
    }

    const targetUser = db.getUserById(userId);
    if (!targetUser) {
      return NextResponse.json({ error: `User with ID ${userId} not found.` }, { status: 404 });
    }

    const isArtist = targetUser.role === 'ARTIST';

    if (action === 'edit') {
      if (!payload) return NextResponse.json({ error: 'Payload required for edit.' }, { status: 400 });
      
      const updates: any = {};
      if (payload.name) updates.name = payload.name;
      if (payload.email) updates.email = payload.email;
      if (payload.role) updates.role = payload.role;
      if (payload.plan) updates.subscription = payload.plan;
      if (payload.country) updates.country = payload.country;

      const oldPlan = (targetUser.subscription || 'free').toLowerCase();
      const newPlan = (payload.plan || 'free').toLowerCase();

      if (payload.plan && newPlan !== oldPlan) {
        updates.paymentMethod = 'Admin Plan';
        db.updateUser(userId, updates);
        const updatedUser = db.getUserById(userId);
        if (updatedUser) {
          recordManualPlanChange(updatedUser, payload.plan);
        }
      } else {
        db.updateUser(userId, updates);
      }

      logSecurityEvent(
        adminUser?.token || 'unknown-token',
        `Admin (${adminUser?.role})`,
        'ADMIN_ACTION',
        `Admin edited user "${targetUser.name}" (${userId}).`
      );

      return NextResponse.json({ success: true, message: 'User updated successfully.' });
    }

    if (action === 'reset_password') {
      logSecurityEvent(
        adminUser?.token || 'unknown-token',
        `Admin (${adminUser?.role})`,
        'ADMIN_ACTION',
        `Admin sent password reset link to "${targetUser.name}" (${targetUser.email}).`
      );
      return NextResponse.json({ success: true, message: 'Password reset link sent to user email.' });
    }

    if (action === 'suspend' || action === 'deactivate') {
      db.updateUser(userId, { isActive: false });
      let tracksDeleted = 0;
      if (isArtist) {
        const allTracks = db.getTracks().filter(t => t.artistId === userId);
        allTracks.forEach(t => db.deleteTrack(t.id));
        tracksDeleted = allTracks.length;
      }
      logSecurityEvent(
        adminUser?.token || 'unknown-token',
        `Admin (${adminUser?.role})`,
        'SUSPENSION',
        `User "${targetUser.name}" (${userId}) suspended. Deleted ${tracksDeleted} tracks.`
      );
      return NextResponse.json({ success: true, message: `Account suspended successfully.${isArtist ? ` Deleted all ${tracksDeleted} tracks.` : ''}` });
    }

    if (action === 'activate') {
      db.updateUser(userId, { isActive: true });
      logSecurityEvent(
        adminUser?.token || 'unknown-token',
        `Admin (${adminUser?.role})`,
        'ROLE_CHANGE',
        `User "${targetUser.name}" (${userId}) reactivated.`
      );
      return NextResponse.json({ success: true, message: `Account reactivated successfully.` });
    }

    if (action === 'remove') {
      let tracksDeleted = 0;
      if (isArtist) {
        const allTracks = db.getTracks().filter(t => t.artistId === userId);
        allTracks.forEach(t => db.deleteTrack(t.id));
        tracksDeleted = allTracks.length;
      }
      db.deleteUser(userId);
      logSecurityEvent(
        adminUser?.token || 'unknown-token',
        `Admin (${adminUser?.role})`,
        'ROLE_CHANGE',
        `User "${targetUser.name}" (${userId}) deleted. Deleted ${tracksDeleted} tracks.`
      );
      return NextResponse.json({ success: true, message: `Account permanently removed.${isArtist ? ` Deleted all ${tracksDeleted} tracks.` : ''}` });
    }

    if (action === 'approve_verification') {
      db.updateUser(userId, {
        verified: true,
        verificationRequest: targetUser.verificationRequest ? {
          ...targetUser.verificationRequest,
          status: 'APPROVED'
        } : undefined
      });
      logSecurityEvent(
        adminUser?.token || 'unknown-token',
        `Admin (${adminUser?.role})`,
        'ADMIN_ACTION',
        `Admin approved user profile verification for "${targetUser.name}" (${userId}).`
      );
      return NextResponse.json({ success: true, message: `Verification approved successfully.` });
    }

    if (action === 'reject_verification') {
      db.updateUser(userId, {
        verified: false,
        verificationRequest: targetUser.verificationRequest ? {
          ...targetUser.verificationRequest,
          status: 'REJECTED'
        } : undefined
      });
      logSecurityEvent(
        adminUser?.token || 'unknown-token',
        `Admin (${adminUser?.role})`,
        'ADMIN_ACTION',
        `Admin rejected user profile verification for "${targetUser.name}" (${userId}).`
      );
      return NextResponse.json({ success: true, message: `Verification request rejected.` });
    }

    if (action === 'reverify') {
      db.updateUser(userId, {
        verified: false,
        verificationRequest: undefined
      });
      logSecurityEvent(
        adminUser?.token || 'unknown-token',
        `Admin (${adminUser?.role})`,
        'ADMIN_ACTION',
        `Admin requested reverification for user "${targetUser.name}" (${userId}). Resetting verification status.`
      );
      return NextResponse.json({ success: true, message: `Reverification requested. Verification status reset.` });
    }

    return NextResponse.json({ error: 'Unsupported action.' }, { status: 400 });
  } catch (err: any) {
    console.error('user-action api error:', err);
    return NextResponse.json(
      { error: 'Server error processing user action.' },
      { status: 500 }
    );
  }
}
