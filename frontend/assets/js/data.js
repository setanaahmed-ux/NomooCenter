// Ladder — mock data layer. All images are generated from stable seeded
// placeholder services (picsum for photography, dicebear for avatars) so the
// prototype always renders the same pictures without needing real uploads.
const img = (seed, w, h) => `https://picsum.photos/seed/lad-${encodeURIComponent(seed)}/${w}/${h}`;
const avatar = (seed, bg = 'b6e3f4,ffd5dc,ffdfbf,d1f4d0,ffd5a8') =>
  `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(seed)}&backgroundColor=${bg}&radius=30`;

const ME = {
  name: 'Jiara Martins',
  handle: '@jiara.makes',
  avatar: avatar('Jiara Ladder'),
  plan: 'premium', // 'free' | 'premium' | 'parent'
  xp: 2140,
  level: 7,
  streak: 12,
  followers: 1280,
  following: 214,
  sales: 3260, // this month, cents-free number for display ($)
  badges: ['founder', 'ecoHero', 'topSeller'],
};

const CATEGORIES = [
  { id: 'kits', label: 'Kits', icon: 'box' },
  { id: 'diy', label: 'DIY', icon: 'scissors' },
  { id: 'eco', label: 'Recycle', icon: 'leaf' },
  { id: 'candles', label: 'Candles', icon: 'flame' },
  { id: 'print', label: 'Prints', icon: 'printer' },
  { id: 'robots', label: 'Robotics', icon: 'cpu' },
];

const PRODUCTS = [
  { id: 'p0', title: 'Terrarium Starter Kit', price: 24, rating: 4.8, reviews: 132, seller: 'Maya L.', sellerAvatar: avatar('Maya L'), cat: 'kits', cover: img('prod0', 500, 400), gallery: [img('prod0', 700, 700), img('kitgirl', 700, 700), img('diy0', 700, 700)], tag: 'Bestseller', stock: 18 },
  { id: 'p1', title: 'Soy Candle Trio — Citrus', price: 18, rating: 4.9, reviews: 208, seller: 'Lina T.', sellerAvatar: avatar('Lina, 13'), cat: 'candles', cover: img('prod1', 500, 400), gallery: [img('prod1', 700, 700), img('candle', 700, 700), img('reelcandle', 700, 700)], tag: 'Trending', stock: 9 },
  { id: 'p2', title: 'Upcycled Denim Tote', price: 15, rating: 4.6, reviews: 76, seller: 'Sara K.', sellerAvatar: avatar('Sara K'), cat: 'eco', cover: img('prod2', 500, 400), gallery: [img('prod2', 700, 700), img('offer0', 700, 700)], tag: 'Eco', stock: 21 },
  { id: 'p3', title: 'Mini Robot Builder Kit', price: 42, rating: 4.7, reviews: 94, seller: 'Byte Labs', sellerAvatar: avatar('Byte'), cat: 'robots', cover: img('prod3', 500, 400), gallery: [img('prod3', 700, 700), img('reelrobot', 700, 700), img('reelrobot2', 700, 700)], tag: null, stock: 6 },
  { id: 'p4', title: 'Risograph Sticker Sheet', price: 8, rating: 4.9, reviews: 301, seller: 'Omar B.', sellerAvatar: avatar('Omar B'), cat: 'print', cover: img('prod4', 500, 400), gallery: [img('prod4', 700, 700), img('reelprint', 700, 700)], tag: 'New', stock: 40 },
  { id: 'p5', title: 'Beeswax Wrap 3-Pack', price: 13, rating: 4.5, reviews: 58, seller: 'Zaid R.', sellerAvatar: avatar('Zaid R'), cat: 'eco', cover: img('prod5', 500, 400), gallery: [img('prod5', 700, 700), img('reeleco', 700, 700)], tag: 'Eco', stock: 30 },
  { id: 'p6', title: 'Watercolor Postcard Set', price: 11, rating: 4.8, reviews: 121, seller: 'Sami H.', sellerAvatar: avatar('Sami, 14'), cat: 'diy', cover: img('prod6', 500, 400), gallery: [img('prod6', 700, 700), img('reelart', 700, 700)], tag: null, stock: 25 },
  { id: 'p7', title: 'Clay Charm Making Kit', price: 20, rating: 4.7, reviews: 87, seller: 'Maya L.', sellerAvatar: avatar('Maya L'), cat: 'kits', cover: img('kit1', 500, 400), gallery: [img('kit1', 700, 700), img('kit2', 700, 700)], tag: 'Bestseller', stock: 14 },
];

const DIY_PROJECTS = [
  { id: 'd0', title: 'No-Sew Scrunchies from Scraps', minutes: 20, level: 'Easy', cover: img('diy0', 420, 280), author: 'Sara K.' },
  { id: 'd1', title: 'Recycled Bottle Planters', minutes: 35, level: 'Easy', cover: img('diy1', 420, 280), author: 'Zaid R.' },
  { id: 'd2', title: 'Hand-Poured Gel Candles', minutes: 50, level: 'Medium', cover: img('diy2', 420, 280), author: 'Lina T.' },
];

const COURSES = [
  { id: 'c0', title: 'Pricing Your First Product', lessons: 8, progress: 62, cover: img('course0', 600, 360), level: 'Beginner', mins: 45 },
  { id: 'c1', title: 'Photograph Products Like a Pro', lessons: 6, progress: 100, cover: img('course1', 600, 360), level: 'Beginner', mins: 32 },
  { id: 'c2', title: 'Intro to Sustainable Materials', lessons: 10, progress: 20, cover: img('course2', 600, 360), level: 'Intermediate', mins: 58 },
  { id: 'c3', title: 'Instagram for Young Sellers', lessons: 7, progress: 0, cover: img('course3', 600, 360), level: 'Beginner', mins: 40 },
];

const QUIZ = {
  course: 'Pricing Your First Product',
  question: 'If materials cost $4 and you want a 60% profit margin, what should you charge?',
  options: ['$4.00', '$6.40', '$10.00', '$14.00'],
  correct: 2,
};

const EVENTS = [
  { id: 'e0', title: 'Downtown Youth Maker Bazaar', date: 'Sat, Aug 2', time: '10:00 AM', location: 'Riverside Park Pavilion', cover: img('evt0', 500, 340), going: 214, price: 'Free entry' },
  { id: 'e1', title: 'Eco Swap & Craft Fair', date: 'Sun, Aug 10', time: '11:30 AM', location: 'Greenway Community Hall', cover: img('evt1', 500, 340), going: 96, price: 'Free entry' },
  { id: 'e2', title: 'Ladder Demo Day — Pitch Night', date: 'Fri, Aug 22', time: '6:00 PM', location: 'Ladder HQ Studio', cover: img('evt2', 500, 340), going: 340, price: '$5 ticket' },
];

const OFFERS = [
  { id: 'o0', title: 'Trade: fabric scraps → beads', user: 'Sara K.', avatar: avatar('Sara K'), cover: img('offer0', 200, 200), kg: 2.4 },
  { id: 'o1', title: 'Free cardboard tubes, pickup only', user: 'Omar B.', avatar: avatar('Omar B'), cover: img('offer1', 200, 200), kg: 1.1 },
  { id: 'o2', title: 'Glass jars for candle makers', user: 'Lina T.', avatar: avatar('Lina, 13'), cover: img('offer2', 200, 200), kg: 3.8 },
];

const POSTS = [
  { id: 'post1', user: 'Sara K.', avatar: avatar('Sara K'), time: '2h', cover: img('post1', 500, 500), caption: 'Finally restocked the scrunchie shop 🎀 sold out in a day last time!', likes: 214, comments: 18 },
  { id: 'post2', user: 'Zaid R.', avatar: avatar('Zaid R'), time: '4h', cover: img('post2', 500, 500), caption: 'Planter batch #12 drying in the sun ☀️ eco kit link in bio', likes: 156, comments: 9 },
  { id: 'post3', user: 'Omar B.', avatar: avatar('Omar B'), time: '6h', cover: img('post3', 500, 500), caption: 'New risograph run just came off the press!', likes: 302, comments: 27 },
  { id: 'post4', user: 'Maya L.', avatar: avatar('Maya L'), time: '8h', cover: img('post4', 500, 500), caption: 'Packed 40 charm kits for the weekend bazaar ✨', likes: 189, comments: 14 },
  { id: 'post5', user: 'Sami H.', avatar: avatar('Sami, 14'), time: '1d', cover: img('post5', 500, 500), caption: 'My postcard set hit #1 in Prints this week!', likes: 411, comments: 33 },
  { id: 'post6', user: 'Lina T.', avatar: avatar('Lina, 13'), time: '1d', cover: img('post6', 500, 500), caption: 'Citrus candles smell like actual sunshine 🍊', likes: 278, comments: 21 },
];

const REELS = [
  { id: 'r0', title: 'Painting a mini canvas in 15s', cover: img('reelart', 360, 640), views: '12.4k', author: 'Sami H.' },
  { id: 'r1', title: 'Robot arm build time-lapse', cover: img('reelrobot', 360, 640), views: '8.9k', author: 'Byte Labs' },
  { id: 'r2', title: 'Pouring candles, ASMR cut', cover: img('reelcandle', 360, 640), views: '21.1k', author: 'Lina T.' },
  { id: 'r3', title: 'Riso print peel satisfaction', cover: img('reelprint', 360, 640), views: '6.2k', author: 'Omar B.' },
  { id: 'r4', title: 'Sorting scrap fabric by color', cover: img('reeleco', 360, 640), views: '15.7k', author: 'Sara K.' },
];

const CHATS = [
  { id: 'ch0', name: 'Maya L.', avatar: avatar('Maya L'), last: 'Yes! I can ship the charm kit Friday', time: '2m', unread: 2, online: true },
  { id: 'ch1', name: 'Ladder Support', avatar: avatar('Nova AI'), last: 'Your payout of $86.00 has been sent', time: '1h', unread: 0, online: true, isBot: true },
  { id: 'ch2', name: 'Sara K.', avatar: avatar('Sara K'), last: 'omg yes let\'s do a bundle 👀', time: '3h', unread: 0, online: false },
  { id: 'ch3', name: 'Eco Swap Group', avatar: avatar('Zaid B'), last: 'Omar: dropping off jars tomorrow', time: '5h', unread: 5, online: false, isGroup: true },
  { id: 'ch4', name: 'Zaid R.', avatar: avatar('Zaid R'), last: 'Thanks for the review 🙏', time: '1d', unread: 0, online: false },
];

const CHAT_THREAD = [
  { from: 'them', text: 'Hey! Loved the terrarium kit, does it come with the moss too?' },
  { from: 'me', text: 'Yes! Moss, pebbles, a mini succulent and the glass jar 🌿' },
  { from: 'them', text: 'Perfect, I\'ll take 2 for the bazaar booth' },
  { from: 'me', text: 'On it — I can ship Friday, want tracking?' },
  { from: 'them', text: 'Yes! I can ship the charm kit Friday' },
];

const NOTIFICATIONS = [
  { id: 'n0', icon: 'cart', text: 'Sami H. bought your Postcard Set', time: '10m', unread: true },
  { id: 'n1', icon: 'heart', text: 'Zaid R. and 24 others liked your post', time: '38m', unread: true },
  { id: 'n2', icon: 'award', text: 'You unlocked the "Eco Hero" badge 🌿', time: '2h', unread: true },
  { id: 'n3', icon: 'calendar', text: 'Downtown Youth Maker Bazaar is in 3 days', time: '5h', unread: false },
  { id: 'n4', icon: 'message', text: 'Maya L. sent you a message', time: '6h', unread: false },
  { id: 'n5', icon: 'trending', text: 'Your shop reached 1,000 followers 🎉', time: '1d', unread: false },
];

const LEADERBOARD = [
  { name: 'Sami H.', avatar: avatar('Sami, 14'), xp: 3120, rank: 1 },
  { name: 'Maya L.', avatar: avatar('Maya L'), xp: 2870, rank: 2 },
  { name: 'Jiara Martins', avatar: ME.avatar, xp: ME.xp, rank: 3, me: true },
  { name: 'Omar B.', avatar: avatar('Omar B'), xp: 1980, rank: 4 },
  { name: 'Sara K.', avatar: avatar('Sara K'), xp: 1790, rank: 5 },
];

const BADGES = [
  { id: 'founder', label: 'Founding Maker', icon: 'star', color: '#6B4EFF' },
  { id: 'ecoHero', label: 'Eco Hero', icon: 'leaf', color: '#22C58B' },
  { id: 'topSeller', label: 'Top Seller', icon: 'trending', color: '#FFA53E' },
  { id: 'streak30', label: '30-Day Streak', icon: 'flame', color: '#FF5C7A', locked: true },
  { id: 'mentor', label: 'Community Mentor', icon: 'users', color: '#4D9DFF', locked: true },
];

const STORIES = [
  { name: 'You', avatar: ME.avatar, me: true },
  { name: 'Nova AI', avatar: avatar('Nova AI'), isAI: true },
  { name: 'Sara K.', avatar: avatar('Sara K') },
  { name: 'Omar B.', avatar: avatar('Omar B') },
  { name: 'Maya L.', avatar: avatar('Maya L') },
  { name: 'Zaid R.', avatar: avatar('Zaid R') },
  { name: 'Lina T.', avatar: avatar('Lina, 13') },
  { name: 'Sami H.', avatar: avatar('Sami, 14') },
];

const AI_PROMPTS = [
  'Help me price my candle kit',
  'Write an Instagram caption for my new drop',
  'Suggest a name for my recycled tote brand',
  'How do I photograph jewelry with my phone?',
];

const SALES_CHART = [12, 18, 14, 26, 22, 34, 30, 41, 38, 52, 46, 61];

const SCHOOLS = [
  { id: 's0', name: 'Riverside Middle School', members: 412, cover: img('school0', 500, 260) },
  { id: 's1', name: 'Northbrook High', members: 289, cover: img('school1', 500, 260) },
  { id: 's2', name: 'Maple Grove Academy', members: 176, cover: img('school2', 500, 260) },
];
