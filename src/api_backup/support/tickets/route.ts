import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/rbac';
import { db, SupportTicketEntity, TicketMessage } from '@/lib/db';
import { verifyJWT } from '@/lib/jwt';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const rbacCheck = await requireUser(request);
  if (!rbacCheck.authorized || !rbacCheck.user) {
    return NextResponse.json(
      { error: rbacCheck.message || 'Unauthorized' },
      { status: rbacCheck.status || 401 }
    );
  }

  try {
    const decoded = await verifyJWT(rbacCheck.user.token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid session token' }, { status: 401 });
    }
    const userEmail = decoded.email as string;

    const allTickets = db.getSupportTickets();
    const isAdmin = rbacCheck.user.role === 'ADMIN' || rbacCheck.user.role === 'SUPER_ADMIN';

    // Update elapsed hours on the fly for open/in-progress tickets
    const updatedTickets = allTickets.map(t => {
      if (t.status === 'open' || t.status === 'in-progress') {
        const createdTime = new Date(t.created.replace(' ', 'T')).getTime();
        const now = Date.now();
        const elapsed = (now - createdTime) / (1000 * 60 * 60); // hours
        return {
          ...t,
          elapsedHours: Math.round(elapsed * 10) / 10,
        };
      }
      return t;
    });

    // If admin, return all tickets with internalNotes. If user, return only their own and strip internalNotes.
    const filteredTickets = isAdmin 
      ? updatedTickets
      : updatedTickets
          .filter(t => t.email.toLowerCase() === userEmail.toLowerCase())
          .map(t => {
            const { internalNotes, ...rest } = t;
            return rest;
          });

    return NextResponse.json({
      success: true,
      tickets: filteredTickets,
    });
  } catch (err: any) {
    console.error('Fetch support tickets error:', err);
    return NextResponse.json({ error: 'Failed to fetch support tickets' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const rbacCheck = await requireUser(request);
  if (!rbacCheck.authorized || !rbacCheck.user) {
    return NextResponse.json(
      { error: rbacCheck.message || 'Unauthorized' },
      { status: rbacCheck.status || 401 }
    );
  }

  try {
    const decoded = await verifyJWT(rbacCheck.user.token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid session token' }, { status: 401 });
    }
    const userEmail = decoded.email as string;
    const userName = decoded.name as string || 'User';

    const body = await request.json();
    const { action, ticketId, subject, category, priority, message, text, attachments } = body;

    const allTickets = db.getSupportTickets();
    const isAdmin = rbacCheck.user.role === 'ADMIN' || rbacCheck.user.role === 'SUPER_ADMIN';

    // 1. ACTION: Create a new support ticket
    if (action === 'create') {
      if (!subject || !category || !priority || !message) {
        return NextResponse.json({ error: 'Subject, category, priority, and message are required' }, { status: 400 });
      }

      const newId = `TKT-${Math.floor(1000 + Math.random() * 9000)}`;
      const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
      
      const newTicket: SupportTicketEntity = {
        id: newId,
        user: userName,
        email: userEmail,
        subject,
        category,
        priority,
        status: 'open',
        created: nowStr,
        message,
        thread: [],
        slaHours: priority === 'urgent' ? 2 : priority === 'high' ? 4 : priority === 'medium' ? 8 : 24,
        elapsedHours: 0,
        updatedAt: new Date().toISOString(),
        attachments: attachments || [],
        assignedDept: 'General Support',
        internalNotes: [],
      };

      const saved = db.saveSupportTicket(newTicket);
      return NextResponse.json({ success: true, ticket: saved });
    }

    // 2. ACTION: Bulk resolve multiple tickets (Admin only)
    if (action === 'bulk-resolve') {
      if (!isAdmin) {
        return NextResponse.json({ error: 'Access denied: Admin role required' }, { status: 403 });
      }
      const { ticketIds } = body;
      if (!Array.isArray(ticketIds) || ticketIds.length === 0) {
        return NextResponse.json({ error: 'Ticket IDs array is required' }, { status: 400 });
      }

      const updatedIds: string[] = [];
      for (const id of ticketIds) {
        const t = allTickets.find(x => x.id === id);
        if (t) {
          t.status = 'resolved';
          t.updatedAt = new Date().toISOString();
          db.saveSupportTicket(t);
          updatedIds.push(id);
        }
      }
      return NextResponse.json({ success: true, resolvedCount: updatedIds.length, resolvedIds: updatedIds });
    }

    // For updates on specific tickets, fetch the active ticket
    if (!ticketId) {
      return NextResponse.json({ error: 'Ticket ID is required' }, { status: 400 });
    }

    const ticket = allTickets.find(t => t.id === ticketId);
    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    // Verify ownership for non-admin users
    if (!isAdmin && ticket.email.toLowerCase() !== userEmail.toLowerCase()) {
      return NextResponse.json({ error: 'Access denied to this ticket' }, { status: 403 });
    }

    // 3. ACTION: Reply to a ticket message thread
    if (action === 'reply') {
      if (!text || !text.trim()) {
        return NextResponse.json({ error: 'Reply text cannot be empty' }, { status: 400 });
      }

      const isSupport = isAdmin;
      const newMsg: TicketMessage = {
        sender: isSupport ? 'Support' : userName,
        text,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timestamp: Date.now(),
      };

      ticket.thread = ticket.thread || [];
      ticket.thread.push(newMsg);

      // Transition status
      if (isSupport) {
        ticket.status = 'in-progress';
      } else {
        ticket.status = 'open'; // Re-open or flag to admin
      }
      ticket.updatedAt = new Date().toISOString();

      const saved = db.saveSupportTicket(ticket);
      return NextResponse.json({ success: true, ticket: saved });
    }

    // 4. ACTION: Close a ticket
    if (action === 'close') {
      ticket.status = 'closed';
      ticket.updatedAt = new Date().toISOString();
      const saved = db.saveSupportTicket(ticket);
      return NextResponse.json({ success: true, ticket: saved });
    }

    // 5. ACTION: Add an internal administrative-only note
    if (action === 'note') {
      if (!isAdmin) {
        return NextResponse.json({ error: 'Access denied: Admin role required' }, { status: 403 });
      }
      if (!text || !text.trim()) {
        return NextResponse.json({ error: 'Note content cannot be empty' }, { status: 400 });
      }

      const newNote: TicketMessage = {
        sender: `Admin (${userName})`,
        text: text.trim(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timestamp: Date.now(),
      };

      ticket.internalNotes = ticket.internalNotes || [];
      ticket.internalNotes.push(newNote);
      ticket.updatedAt = new Date().toISOString();

      const saved = db.saveSupportTicket(ticket);
      return NextResponse.json({ success: true, ticket: saved });
    }

    // 6. ACTION: Change department routing assignment
    if (action === 'assign') {
      if (!isAdmin) {
        return NextResponse.json({ error: 'Access denied: Admin role required' }, { status: 403 });
      }
      const { assignedDept } = body;
      if (!assignedDept) {
        return NextResponse.json({ error: 'Department name is required' }, { status: 400 });
      }

      ticket.assignedDept = assignedDept;
      ticket.updatedAt = new Date().toISOString();

      const saved = db.saveSupportTicket(ticket);
      return NextResponse.json({ success: true, ticket: saved });
    }

    // 7. ACTION: Submit satisfaction rating and comment
    if (action === 'rate') {
      const { rating, ratingComment } = body;
      if (typeof rating !== 'number' || rating < 1 || rating > 5) {
        return NextResponse.json({ error: 'Rating must be a number between 1 and 5' }, { status: 400 });
      }

      ticket.rating = rating;
      ticket.ratingComment = ratingComment || '';
      ticket.updatedAt = new Date().toISOString();

      const saved = db.saveSupportTicket(ticket);
      return NextResponse.json({ success: true, ticket: saved });
    }

    return NextResponse.json({ error: 'Invalid support ticket action' }, { status: 400 });

  } catch (err: any) {
    console.error('Support ticket action error:', err);
    return NextResponse.json({ error: 'Failed to process ticket update' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const rbacCheck = await requireUser(request);
  if (!rbacCheck.authorized || !rbacCheck.user) {
    return NextResponse.json(
      { error: rbacCheck.message || 'Unauthorized' },
      { status: rbacCheck.status || 401 }
    );
  }

  // Only Admin can delete tickets
  const isAdmin = rbacCheck.user.role === 'ADMIN' || rbacCheck.user.role === 'SUPER_ADMIN';
  if (!isAdmin) {
    return NextResponse.json({ error: 'Admin role is required' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Ticket ID is required' }, { status: 400 });
    }

    const deleted = db.deleteSupportTicket(id);
    if (!deleted) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Ticket deleted successfully' });
  } catch (err: any) {
    console.error('Delete support ticket error:', err);
    return NextResponse.json({ error: 'Failed to delete ticket' }, { status: 500 });
  }
}
