import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventId, buyerName, ticketsCount } = body;

    if (!eventId || !ticketsCount) {
      return NextResponse.json({ error: 'eventId and ticketsCount are required' }, { status: 400 });
    }

    const events = db.getEvents();
    const event = events.find(e => e.id === eventId);

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const artistId = event.artistId;
    const tickets = Number(ticketsCount) || 1;

    // Calculate price amount
    let ticketPrice = 250; // Default INR price
    if (event.price) {
      const parsedPrice = parseInt(event.price.replace(/[^0-9]/g, ''));
      if (!isNaN(parsedPrice)) {
        ticketPrice = event.price.includes('$') ? parsedPrice * 83 : parsedPrice; // Convert USD to INR if needed for consistency
      }
    }
    const totalAmount = ticketPrice * tickets;

    const list = db.getTicketSales().filter(t => t.artistId === artistId);
    const sales = list[0] || {
      artistId,
      totalRevenue: 0,
      ticketsSold: 0,
      recentSales: []
    };

    sales.ticketsSold += tickets;
    sales.totalRevenue += totalAmount;
    
    // Add transaction to recent sales
    sales.recentSales.unshift({
      id: `sale-${Date.now()}`,
      buyer: buyerName || 'Anonymous Fan',
      event: event.name,
      tickets: tickets,
      amount: totalAmount,
      time: 'Just now'
    });

    // Keep last 10 sales
    sales.recentSales = sales.recentSales.slice(0, 10);

    db.saveTicketSales(sales);

    return NextResponse.json({
      success: true,
      message: `Successfully booked ${tickets} ticket(s) for ${event.name}!`,
      sales
    });
  } catch (error: any) {
    console.error('Error in public ticket purchase API:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
