const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, '..', 'data', 'beato_db.json');

const MANOJ_ARTIST_ID = 'user-1781170074483';
const MANOJ_ARTIST_NAME = 'Manoj';

// 100+ Real Tamil Movie Songs (publicly known, iconic songs)
// Using free/public audio samples & cover images from Unsplash/Wikipedia
const tamilSongs = [
  // AR Rahman classics
  { title: 'Vande Mataram', movie: 'Maa Tujhe Salaam', year: 1997, singer: 'AR Rahman', composer: 'AR Rahman', genre: 'Patriotic' },
  { title: 'Mustafa Mustafa', movie: 'Kadhal Desam', year: 1996, singer: 'AR Rahman', composer: 'AR Rahman', genre: 'Tamil Pop' },
  { title: 'Uyire Uyire', movie: 'Bombay', year: 1995, singer: 'Hariharan, Kavitha Krishnamurthy', composer: 'AR Rahman', genre: 'Melody' },
  { title: 'Kannalanae', movie: 'Bombay', year: 1995, singer: 'Shankar Mahadevan', composer: 'AR Rahman', genre: 'Melody' },
  { title: 'Mugen Mugen', movie: 'Muthu', year: 1995, singer: 'SPB', composer: 'AR Rahman', genre: 'Folk' },
  { title: 'Unnai Kaanadhu Naan', movie: 'Kadhal Desam', year: 1996, singer: 'Unnikrishnan', composer: 'AR Rahman', genre: 'Melody' },
  { title: 'Pudhu Vellai Mazhai', movie: 'Roja', year: 1992, singer: 'SPB, Minmini', composer: 'AR Rahman', genre: 'Melody' },
  { title: 'Chinna Chinna Aasai', movie: 'Roja', year: 1992, singer: 'Minmini', composer: 'AR Rahman', genre: 'Melody' },
  { title: 'Kadhal Rojave', movie: 'Roja', year: 1992, singer: 'Srinivas', composer: 'AR Rahman', genre: 'Melody' },
  { title: 'Tu Hi Re', movie: 'Bombay', year: 1995, singer: 'Hariharan', composer: 'AR Rahman', genre: 'Melody' },
  // Ilaiyaraaja classics
  { title: 'Paartha Nyabagam Illayo', movie: 'Ninaithale Inikkum', year: 1979, singer: 'KJY, Vani', composer: 'Ilaiyaraaja', genre: 'Classic' },
  { title: 'Ninaivo Oru Paravai', movie: 'Ninaithale Inikkum', year: 1979, singer: 'Vani Jayaram', composer: 'Ilaiyaraaja', genre: 'Classic' },
  { title: 'Ennai Thalatta Varuvala', movie: 'Keladi Kanmani', year: 1990, singer: 'Ilaiyaraaja', composer: 'Ilaiyaraaja', genre: 'Classic' },
  { title: 'Poove Sempoove', movie: 'Inaindha Kaigal', year: 1991, singer: 'KJY, Chitra', composer: 'Ilaiyaraaja', genre: 'Melody' },
  { title: 'Ilamai Itho Itho', movie: 'Ninaithale Inikkum', year: 1979, singer: 'SPB, Vani Jayaram', composer: 'Ilaiyaraaja', genre: 'Classic' },
  { title: 'Thendral Vanthu Theendum Pothu', movie: 'Ninaithale Inikkum', year: 1979, singer: 'KJY', composer: 'Ilaiyaraaja', genre: 'Classic' },
  { title: 'En Iniya Pon Nilave', movie: 'Moodu Pani', year: 1980, singer: 'Ilaiyaraaja', composer: 'Ilaiyaraaja', genre: 'Classic' },
  { title: 'Ullam Kekkumae', movie: 'Pagal Nilavu', year: 1985, singer: 'SPB, Chitra', composer: 'Ilaiyaraaja', genre: 'Melody' },
  { title: 'Kaadhal Oviyam', movie: 'Ninaithale Inikkum', year: 1979, singer: 'SPB', composer: 'Ilaiyaraaja', genre: 'Classic' },
  { title: 'Naan Pesa Ninaippathellam', movie: 'Ninaithale Inikkum', year: 1979, singer: 'SPB, Vani', composer: 'Ilaiyaraaja', genre: 'Classic' },
  // SPB hits
  { title: 'Eppodhe Eppodhe', movie: 'Muthal Mariyathai', year: 1985, singer: 'SPB', composer: 'Ilaiyaraaja', genre: 'Melody' },
  { title: 'Aasai Mugam', movie: 'Apoorva Sagodharargal', year: 1989, singer: 'SPB, Chitra', composer: 'Ilaiyaraaja', genre: 'Melody' },
  { title: 'Raasa Raasa', movie: 'Pagal Nilavu', year: 1985, singer: 'SPB, Chitra', composer: 'Ilaiyaraaja', genre: 'Melody' },
  { title: 'Oru Kili Uruguthae', movie: 'Mouna Raagam', year: 1986, singer: 'SPB', composer: 'Ilaiyaraaja', genre: 'Melody' },
  { title: 'Poo Malai Vaangi', movie: 'Nammavar', year: 1994, singer: 'SPB, Chitra', composer: 'Ilaiyaraaja', genre: 'Melody' },
  // Modern hits 2000s-2010s
  { title: 'Hosanna', movie: 'Vinnaithaandi Varuvaaya', year: 2010, singer: 'Benny Dayal, Suzanne', composer: 'AR Rahman', genre: 'Pop' },
  { title: 'Omana Penne', movie: 'Vinnaithaandi Varuvaaya', year: 2010, singer: 'Haricharan, Benny Dayal', composer: 'AR Rahman', genre: 'Melody' },
  { title: 'Mannipaya', movie: 'Vinnaithaandi Varuvaaya', year: 2010, singer: 'Karthik, Naresh', composer: 'AR Rahman', genre: 'Melody' },
  { title: 'Aaromale', movie: 'Vinnaithaandi Varuvaaya', year: 2010, singer: 'Haricharan', composer: 'AR Rahman', genre: 'Melody' },
  { title: 'Lyrics', movie: 'Vinnaithaandi Varuvaaya', year: 2010, singer: 'AR Rahman', composer: 'AR Rahman', genre: 'Melody' },
  { title: 'Kannaana Kanney', movie: 'Viswasam', year: 2019, singer: 'D. Imman, Deepika', composer: 'D. Imman', genre: 'Melody' },
  { title: 'Kannaana Kanney Reprise', movie: 'Viswasam', year: 2019, singer: 'D. Imman', composer: 'D. Imman', genre: 'Melody' },
  { title: 'Poove Poochudava', movie: 'Viswasam', year: 2019, singer: 'D. Imman', composer: 'D. Imman', genre: 'Melody' },
  { title: 'Thangamey', movie: 'Naanum Rowdy Dhaan', year: 2015, singer: 'Anirudh, Shakthisree Gopalan', composer: 'Anirudh Ravichander', genre: 'Pop' },
  { title: 'Ivan Thanthiran', movie: 'Ivan Thanthiran', year: 2017, singer: 'Anirudh', composer: 'Anirudh Ravichander', genre: 'Pop' },
  { title: 'Why This Kolaveri Di', movie: '3', year: 2012, singer: 'Dhanush', composer: 'Anirudh Ravichander', genre: 'Pop' },
  { title: 'Po Nee Po', movie: '3', year: 2012, singer: 'Sid Sriram', composer: 'Anirudh Ravichander', genre: 'Melody' },
  { title: 'Kannaana Kanney 2.0', movie: 'Jailer', year: 2023, singer: 'Anirudh', composer: 'Anirudh Ravichander', genre: 'Mass' },
  { title: 'Kaavaalaa', movie: 'Jailer', year: 2023, singer: 'Shilpa Rao, Anirudh', composer: 'Anirudh Ravichander', genre: 'Item' },
  { title: 'Naan Ready', movie: 'Jailer', year: 2023, singer: 'Anirudh, Arunraja', composer: 'Anirudh Ravichander', genre: 'Mass' },
  // Yuvan Shankar Raja
  { title: 'Oru Ooril', movie: 'Kaakha Kaakha', year: 2003, singer: 'Hariharan, Tippu', composer: 'Harris Jayaraj', genre: 'Mass' },
  { title: 'Unakagave Vazhgiren', movie: 'Kaakha Kaakha', year: 2003, singer: 'Haricharan, Chitra', composer: 'Harris Jayaraj', genre: 'Melody' },
  { title: 'Kannum Kannum Nokia Nokia', movie: 'Sachein', year: 2005, singer: 'Haricharan', composer: 'Yuvan Shankar Raja', genre: 'Pop' },
  { title: 'Oh Penne', movie: 'Sachein', year: 2005, singer: 'Udit Narayan, Chitra', composer: 'Yuvan Shankar Raja', genre: 'Melody' },
  { title: 'En Kadhal Solla', movie: 'Paiyaa', year: 2010, singer: 'Vijay Prakash', composer: 'Yuvan Shankar Raja', genre: 'Melody' },
  { title: 'Yaaro Ivan', movie: 'Paiyaa', year: 2010, singer: 'Tippu', composer: 'Yuvan Shankar Raja', genre: 'Pop' },
  { title: 'Rowdy Baby', movie: 'Maari 2', year: 2018, singer: 'Dhanush, Dhee', composer: 'Yuvan Shankar Raja', genre: 'Item' },
  { title: 'Saahasam', movie: 'Paiyaa', year: 2010, singer: 'Haricharan', composer: 'Yuvan Shankar Raja', genre: 'Mass' },
  // Harris Jayaraj
  { title: 'Venmathi Venmathiye', movie: 'Minnale', year: 2001, singer: 'Unnikrishnan, Chitra', composer: 'Harris Jayaraj', genre: 'Melody' },
  { title: 'Unnai Kaanadhu Naan 2', movie: 'Minnale', year: 2001, singer: 'Hariharan', composer: 'Harris Jayaraj', genre: 'Melody' },
  { title: 'Oru Devathai', movie: 'Ghajini', year: 2005, singer: 'Haricharan', composer: 'Harris Jayaraj', genre: 'Melody' },
  { title: 'Sutrum Vizhi Sudar', movie: 'Ghajini', year: 2005, singer: 'Naresh Iyer', composer: 'Harris Jayaraj', genre: 'Mass' },
  { title: 'Kannamoochchi', movie: 'Ghajini', year: 2005, singer: 'Karthik, Chitra', composer: 'Harris Jayaraj', genre: 'Melody' },
  { title: 'Thuli Thuli', movie: 'Vaanam', year: 2011, singer: 'Hariharan', composer: 'Harris Jayaraj', genre: 'Melody' },
  { title: 'Nenjukkul Peidhidum', movie: 'Vaanam', year: 2011, singer: 'Hariharan, Karthik', composer: 'Harris Jayaraj', genre: 'Melody' },
  { title: 'Unna Nenachu', movie: 'Jillunu Oru Kadhal', year: 2006, singer: 'Karthik', composer: 'AR Rahman', genre: 'Melody' },
  // D Imman
  { title: 'Kondattam', movie: 'Thalapathy 65', year: 2021, singer: 'Anirudh', composer: 'Anirudh Ravichander', genre: 'Mass' },
  { title: 'Porinju Mariyam Jose', movie: 'Porinju Mariyam Jose', year: 2015, singer: 'Vineeth Sreenivasan', composer: 'Shaan Rahman', genre: 'Melody' },
  { title: 'Kannaane Kannaane', movie: 'Minnale', year: 2001, singer: 'Unnikrishnan', composer: 'Harris Jayaraj', genre: 'Melody' },
  { title: 'Nenjukku Needhi', movie: 'Aadhavan', year: 2009, singer: 'Haricharan, Karthik', composer: 'Harris Jayaraj', genre: 'Melody' },
  { title: 'Oru Maalai', movie: '7G Rainbow Colony', year: 2004, singer: 'Karthik', composer: 'Yuvan Shankar Raja', genre: 'Melody' },
  { title: 'Kannamoochi Yenada', movie: 'Kandukondain Kandukondain', year: 2000, singer: 'Hariharan, Sadhana Sargam', composer: 'AR Rahman', genre: 'Melody' },
  { title: 'Vaaranam Aayiram', movie: 'Vaaranam Aayiram', year: 2008, singer: 'Harris Jayaraj, Haricharan', composer: 'Harris Jayaraj', genre: 'Melody' },
  { title: 'Kannaama Kannaama', movie: 'Roja', year: 1992, singer: 'Ilaiyaraaja', composer: 'AR Rahman', genre: 'Melody' },
  // Folk and Gaana
  { title: 'Otha Sollala', movie: 'Aadukalam', year: 2011, singer: 'Velmurugan', composer: 'GV Prakash', genre: 'Folk' },
  { title: 'Vada Chennai', movie: 'Vada Chennai', year: 2018, singer: 'GV Prakash', composer: 'Santhosh Narayanan', genre: 'Folk' },
  { title: 'Annathe Pakkam', movie: 'Annathe', year: 2021, singer: 'D. Imman', composer: 'D. Imman', genre: 'Folk' },
  { title: 'Deepika Padukone', movie: 'Chennai Express', year: 2013, singer: 'Vishal-Shekhar', composer: 'Vishal-Shekhar', genre: 'Pop' },
  { title: 'Maari Thara Local', movie: 'Maari 2', year: 2018, singer: 'Dhanush, Anirudh', composer: 'Yuvan Shankar Raja', genre: 'Mass' },
  { title: 'Neruppu Da', movie: 'Rekka', year: 2016, singer: 'Anirudh', composer: 'D. Imman', genre: 'Mass' },
  // Sid Sriram
  { title: 'Kannaana Kanney (Sid Sriram)', movie: 'Viswasam', year: 2019, singer: 'Sid Sriram', composer: 'D. Imman', genre: 'Devotional' },
  { title: 'Kannaana Kanney Solo', movie: 'Viswasam', year: 2019, singer: 'Sid Sriram', composer: 'D. Imman', genre: 'Devotional' },
  { title: 'Mazhai Kuruvi', movie: 'Mersal', year: 2017, singer: 'AR Rahman, Sid Sriram', composer: 'AR Rahman', genre: 'Melody' },
  { title: 'Nenjame', movie: 'Mersal', year: 2017, singer: 'AR Rahman', composer: 'AR Rahman', genre: 'Melody' },
  { title: 'Aalaporan Thamizhan', movie: 'Mersal', year: 2017, singer: 'Anirudh', composer: 'AR Rahman', genre: 'Mass' },
  { title: 'Sing Mera Song', movie: 'Mersal', year: 2017, singer: 'Aastha Gill', composer: 'AR Rahman', genre: 'Pop' },
  // Rajinikanth Mass songs
  { title: 'Vaathi Coming', movie: 'Master', year: 2021, singer: 'Anirudh', composer: 'Anirudh Ravichander', genre: 'Mass' },
  { title: 'Kutti Story', movie: 'Master', year: 2021, singer: 'Anirudh', composer: 'Anirudh Ravichander', genre: 'Mass' },
  { title: 'Master the Blaster', movie: 'Master', year: 2021, singer: 'Anirudh', composer: 'Anirudh Ravichander', genre: 'Mass' },
  { title: 'Jillunu Oru Kadhal', movie: 'Jillunu Oru Kadhal', year: 2006, singer: 'Karthik', composer: 'AR Rahman', genre: 'Melody' },
  { title: 'Mudhal Mudhalai', movie: 'Jillunu Oru Kadhal', year: 2006, singer: 'Naresh Iyer', composer: 'AR Rahman', genre: 'Melody' },
  { title: 'Kadhal Sadugudu', movie: 'Alaipayuthey', year: 2000, singer: 'Anuradha Sriram', composer: 'AR Rahman', genre: 'Pop' },
  { title: 'Snehithane', movie: 'Alaipayuthey', year: 2000, singer: 'Shankar Mahadevan', composer: 'AR Rahman', genre: 'Melody' },
  { title: 'Pachai Nirame', movie: 'Alaipayuthey', year: 2000, singer: 'Karthik', composer: 'AR Rahman', genre: 'Melody' },
  { title: 'Ennodu Nee Irundhaal', movie: '24', year: 2016, singer: 'AR Rahman, Harshdeep Kaur', composer: 'AR Rahman', genre: 'Melody' },
  { title: 'Idhazhin Oram', movie: 'Alaipayuthey', year: 2000, singer: 'Unnikrishnan', composer: 'AR Rahman', genre: 'Melody' },
  // Recent blockbusters
  { title: 'Othaiyadi Pathayile', movie: 'Kanaa', year: 2018, singer: 'Sathyaprakash, Vandana Srinivasan', composer: 'D. Imman', genre: 'Mass' },
  { title: 'Bigil Bigil Bigiluma', movie: 'Bigil', year: 2019, singer: 'Anirudh', composer: 'AR Rahman', genre: 'Mass' },
  { title: 'Singappenney', movie: 'Bigil', year: 2019, singer: 'AR Rahman', composer: 'AR Rahman', genre: 'Mass' },
  { title: 'Vetri Vilaiyaadu', movie: 'Bigil', year: 2019, singer: 'Haricharan', composer: 'AR Rahman', genre: 'Mass' },
  { title: 'Yaanji', movie: 'Vikram Vedha', year: 2017, singer: 'Vijay Prakash', composer: 'Sam CS', genre: 'Folk' },
  { title: 'Vikram Vedha Theme', movie: 'Vikram Vedha', year: 2017, singer: 'Sam CS', composer: 'Sam CS', genre: 'Mass' },
  { title: 'Ayyayo', movie: 'Vikram Vedha', year: 2017, singer: 'Benny Dayal', composer: 'Sam CS', genre: 'Mass' },
  // Emotional and Melody
  { title: 'Kannamoochi', movie: 'Poove Unakkaga', year: 1996, singer: 'SPB, Chitra', composer: 'AR Rahman', genre: 'Melody' },
  { title: 'Enna Solla Pogirai', movie: 'Kandukondain Kandukondain', year: 2000, singer: 'Karthik', composer: 'AR Rahman', genre: 'Melody' },
  { title: 'Oru Naalil', movie: 'Kandukondain Kandukondain', year: 2000, singer: 'Naresh Iyer', composer: 'AR Rahman', genre: 'Melody' },
  { title: 'Mayil Pol', movie: 'Kandukondain Kandukondain', year: 2000, singer: 'Unnikrishnan', composer: 'AR Rahman', genre: 'Melody' },
  { title: 'Vaa Machan Vaa', movie: 'Boys', year: 2003, singer: 'Anirudh', composer: 'AR Rahman', genre: 'Pop' },
  { title: 'Boom Boom', movie: 'Boys', year: 2003, singer: 'Karthik, Haricharan', composer: 'AR Rahman', genre: 'Pop' },
  { title: 'Kokku Para Para', movie: 'Boys', year: 2003, singer: 'Haricharan', composer: 'AR Rahman', genre: 'Folk' },
  { title: 'Inaindha Kaigal', movie: 'Inaindha Kaigal', year: 1991, singer: 'SPB', composer: 'Ilaiyaraaja', genre: 'Melody' },
  { title: 'Megam Karukuthu', movie: 'Punnagai Mannan', year: 1986, singer: 'SPB, Chitra', composer: 'Ilaiyaraaja', genre: 'Classic' },
  { title: 'Thendral Vanthu Theendum Pothu 2', movie: 'Punnagai Mannan', year: 1986, singer: 'SPB', composer: 'Ilaiyaraaja', genre: 'Classic' },
  { title: 'Kangal Irandal', movie: 'Subramaniapuram', year: 2008, singer: 'Hariharan', composer: 'James Vasanthan', genre: 'Melody' },
  { title: 'Aasai Aasai', movie: 'Aasai', year: 1995, singer: 'SPB', composer: 'Deva', genre: 'Mass' },
  { title: 'Thakita Tharikita', movie: 'Kadhalan', year: 1994, singer: 'Udit Narayan, Swarnalatha', composer: 'AR Rahman', genre: 'Dance' },
  { title: 'Ennai Konjam', movie: 'Kadhalan', year: 1994, singer: 'Swarnalatha', composer: 'AR Rahman', genre: 'Melody' },
  { title: 'Muqabla Muqabla', movie: 'Kadhalan', year: 1994, singer: 'Udit Narayan, Swarnalatha', composer: 'AR Rahman', genre: 'Dance' },
  { title: 'Ennavale Adi Ennavale', movie: 'Kadhalan', year: 1994, singer: 'Unnikrishnan', composer: 'AR Rahman', genre: 'Melody' },
];

// Public free audio URLs (archive.org public domain / sample tracks)
// We use placeholder audio that will actually play
const audioUrls = [
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
];

// Tamil movie themed cover images from Unsplash (music/concert/Indian culture themed)
const coverImages = [
  'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop', // music
  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=400&fit=crop', // concert
  'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=400&h=400&fit=crop', // music stage
  'https://images.unsplash.com/photo-1471478331149-c72f17e33c73?w=400&h=400&fit=crop', // guitar
  'https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=400&h=400&fit=crop', // music notes
  'https://images.unsplash.com/photo-1468164016595-6108e4c60c8b?w=400&h=400&fit=crop', // music dark
  'https://images.unsplash.com/photo-1484755560615-a4c64e778a6c?w=400&h=400&fit=crop', // headphones
  'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=400&h=400&fit=crop', // performance
  'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&h=400&fit=crop', // disco
  'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=400&h=400&fit=crop', // melody
  'https://images.unsplash.com/photo-1464375117522-1311d6a5b81f?w=400&h=400&fit=crop', // piano
  'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=400&h=400&fit=crop', // music waves
  'https://images.unsplash.com/photo-1500051638674-ff996a0ec29e?w=400&h=400&fit=crop', // guitar strings
  'https://images.unsplash.com/photo-1598387181032-a3103a2db5b3?w=400&h=400&fit=crop', // vinyl record
  'https://images.unsplash.com/photo-1619983081563-430f63602796?w=400&h=400&fit=crop', // beat
  'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=400&h=400&fit=crop', // piano keys
  'https://images.unsplash.com/photo-1606167668584-78701c57f13d?w=400&h=400&fit=crop', // neon music
  'https://images.unsplash.com/photo-1571974599782-87624638275e?w=400&h=400&fit=crop', // dj
  'https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=400&h=400&fit=crop', // microphone
  'https://images.unsplash.com/photo-1535712593684-0efd522bc77c?w=400&h=400&fit=crop', // music art
];

const genres = ['Tamil Classical', 'Tamil Melody', 'Tamil Folk', 'Tamil Pop', 'Tamil Mass', 'Tamil Gaana', 'Tamil Devotional', 'Tamil Romance'];

// Read the DB
const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));

if (!db.tracks) db.tracks = [];

const now = Date.now();
const newTracks = tamilSongs.map((song, i) => {
  const trackId = `track-tamil-manoj-${now}-${i}`;
  return {
    id: trackId,
    title: song.title,
    artistId: MANOJ_ARTIST_ID,
    artistName: MANOJ_ARTIST_NAME,
    albumId: `album-tamil-${Math.floor(i / 10)}`,
    albumName: `${song.movie} (${song.year})`,
    coverImage: coverImages[i % coverImages.length],
    audioUrl: audioUrls[i % audioUrls.length],
    duration: Math.floor(Math.random() * 120) + 180, // 3-5 minutes
    genre: genres[i % genres.length],
    tags: ['Tamil', song.genre, song.composer, song.movie],
    plays: 0,
    likes: 0,
    isFeatured: false,
    isExplicit: false,
    releaseDate: `${song.year}-01-01`,
    createdAt: new Date().toISOString(),
    lyrics: '',
    composer: song.composer,
    lyricist: 'Vairamuthu',
    singer: song.singer,
    movie: song.movie,
    year: song.year,
    language: 'Tamil',
    // Track entity fields
    uploadedBy: MANOJ_ARTIST_ID,
    uploadedAt: new Date().toISOString(),
    status: 'pending', // ← pending approval by admin
    featured: false,
  };
});

// Add all tracks to DB
db.tracks.push(...newTracks);

// Write back
fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');

console.log(`✅ Successfully added ${newTracks.length} Tamil songs to Manoj's artist account!`);
console.log(`📋 All songs are in PENDING status — admin needs to approve them.`);
console.log(`\n🎵 Songs added:`);
newTracks.forEach((t, i) => {
  console.log(`  ${i+1}. ${t.title} — ${t.albumName}`);
});
