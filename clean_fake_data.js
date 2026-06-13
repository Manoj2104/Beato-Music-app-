/**
 * Clean Fake Simulation Data from Beato DB
 * Overwritten to thoroughly purge all simulated/fake plays, comments, merch, and ticket events,
 * and perfectly recalculate track statistics and artist balances.
 */

const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'data', 'beato_db.json');
if (!fs.existsSync(DB_PATH)) {
  console.error('Database file not found at:', DB_PATH);
  process.exit(1);
}

const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));

console.log('=== BEFORE CLEANUP ===');
console.log('PayoutStreams:', db.payoutStreams?.length || 0);
console.log('Comments:', db.comments?.length || 0);
console.log('MerchSalesLog:', db.merchSalesLog?.length || 0);
console.log('TicketSales (events with sales):', db.ticketSales?.length || 0);

// Fake fan identifiers (only simulated mock names)
const FAKE_FAN_NAMES = new Set([
  'Anjali', 'Karthik', 'Vikram', 'Sneha', 'Nisha', 'Rahul', 'Arjun', 'Priya', 'Siddharth', 'Divya', 'Ganesh', 'Kavitha'
]);

// 1. Clean payout streams: remove sim-* streams
const cleanedStreams = (db.payoutStreams || []).filter(s => {
  const isSim = s.userId.startsWith('sim-');
  const isFakeFan = FAKE_FAN_NAMES.has(s.userId);
  return !isSim && !isFakeFan;
});
console.log('\nStreams removed:', (db.payoutStreams?.length || 0) - cleanedStreams.length);

// 2. Clean comments: remove comments posted by fake simulation users
const cleanedComments = (db.comments || []).filter(c => !FAKE_FAN_NAMES.has(c.user));
console.log('Comments removed:', (db.comments?.length || 0) - cleanedComments.length);

// 3. Clean merch sales log: remove purchases by fake simulation users
const cleanedMerchSales = (db.merchSalesLog || []).filter(m => !FAKE_FAN_NAMES.has(m.buyer));
console.log('MerchSales removed:', (db.merchSalesLog?.length || 0) - cleanedMerchSales.length);

// 4. Recalculate merch items sales count
if (db.merchItems) {
  const realSalesByItem = {};
  cleanedMerchSales.forEach(s => {
    realSalesByItem[s.item] = (realSalesByItem[s.item] || 0) + 1;
  });
  db.merchItems = db.merchItems.map(item => {
    const realSales = realSalesByItem[item.name] || 0;
    return { ...item, sales: realSales };
  });
}

// 5. Clean ticket sales
if (db.ticketSales) {
  db.ticketSales = db.ticketSales.map(ts => {
    if (!ts.recentSales) return ts;
    const realSales = ts.recentSales.filter(s => !FAKE_FAN_NAMES.has(s.buyer));
    const realRevenue = realSales.reduce((sum, s) => sum + (s.amount || 0), 0);
    const realCount = realSales.reduce((sum, s) => sum + (s.tickets || 0), 0);
    return { ...ts, recentSales: realSales, totalRevenue: realRevenue, ticketsSold: realCount };
  });
}

// Apply cleaned records
db.payoutStreams = cleanedStreams;
db.comments = cleanedComments;
db.merchSalesLog = cleanedMerchSales;

// 6. Recalculate track play counts from real streams
const trackPlayCounts = {};
cleanedStreams.forEach(s => {
  trackPlayCounts[s.trackId] = (trackPlayCounts[s.trackId] || 0) + 1;
});
if (db.tracks) {
  db.tracks = db.tracks.map(track => ({
    ...track,
    plays: trackPlayCounts[track.id] || 0
  }));
  console.log('Track play counts recalculated from real streams');
}

// 7. Recalculate artist balances based on remaining real payout streams
if (db.payoutArtists) {
  db.payoutArtists = db.payoutArtists.map(artist => {
    const artistStreams = cleanedStreams.filter(s => s.artistId === artist.id);
    let totalRealEarnings = 0;

    artistStreams.forEach(s => {
      const country = s.country || 'IN';
      const countryMultiplier = country === 'US' ? 1.25 : country === 'GB' ? 1.15 : country === 'IN' ? 0.85 : 1.0;
      const grossRoyalty = s.isPremium ? (0.0075 * countryMultiplier) : (0.0025 * countryMultiplier);
      const artistEarnings = Math.round((grossRoyalty * 0.70) * 10000) / 10000;
      totalRealEarnings += artistEarnings;
    });

    const roundedEarnings = Math.round(totalRealEarnings * 100) / 100;
    return {
      ...artist,
      lifetimeEarnings: roundedEarnings,
      availableBalance: roundedEarnings,
      estimatedNextPayout: roundedEarnings
    };
  });
  console.log('Artist balances recalculated from real streams');
}

console.log('\n=== AFTER CLEANUP ===');
console.log('PayoutStreams:', db.payoutStreams.length);
console.log('Comments:', db.comments.length);
console.log('MerchSalesLog:', db.merchSalesLog.length);

// Save back to file
fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
console.log('\n✅ Database successfully cleaned of all simulated data!');
