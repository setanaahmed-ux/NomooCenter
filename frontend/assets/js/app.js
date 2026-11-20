// ==========================================================================
// Ladder — app shell. Single-state render loop: every interaction mutates
// `state` then calls render(), which rebuilds the screen's inner HTML from
// the current route. No build step, no framework — just enough structure
// for a fast, legible prototype.
// ==========================================================================

const state = {
  mode: 'onboarding',       // 'onboarding' | 'app'
  ob: 'welcome',            // welcome | signup | profile | subscribe
  planSel: 'premium',
  tab: 'home',              // home | explore | learn | community | profile
  stack: [],                // [{view, ...payload}]
  exploreCat: 'all',
  socialTab: 'reels',        // reels | community
  wishlist: new Set(),
  liked: new Set(['post3', 'post5']),
  saved: new Set(),
  rsvp: new Set(['e0']),
  claimed: new Set(),
  quiz: { selected: null, answered: false, correct: false },
  theme: 'light',
  chatId: null,
  chatMsgs: {},             // id -> extra messages sent this session
  searchQuery: '',
  toast: null,
  sheet: null,              // {title, body}
  notifs: new Set(NOTIFICATIONS.filter(n => n.unread).map(n => n.id)),
};

const root = document.getElementById('root');
const money = (n) => '$' + n.toFixed(2).replace(/\.00$/, '');
const byId = (arr, id) => arr.find(x => x.id === id);
const esc = (s) => (s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

// ---------------------------------------------------------------------- nav
function nav(tab) { state.tab = tab; state.stack = []; render(); }
function push(view, payload) { state.stack.push({ view, ...payload }); render(); window.scrollTo?.(0, 0); }
function back() { state.stack.pop(); render(); }
function closeAllStacks() { state.stack = []; render(); }

function showToast(msg, icon = 'check') {
  state.toast = { msg, icon };
  render();
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => { state.toast = null; render(); }, 2200);
}
function openSheet(title, body) { state.sheet = { title, body }; render(); }
function closeSheet() { state.sheet = null; render(); }

// ------------------------------------------------------------------ actions
function toggleWish(id, ev) {
  ev?.stopPropagation();
  state.wishlist.has(id) ? state.wishlist.delete(id) : state.wishlist.add(id);
  render();
  if (state.wishlist.has(id)) showToast('Saved to wishlist', 'heart');
}
function toggleLike(id) {
  state.liked.has(id) ? state.liked.delete(id) : state.liked.add(id);
  render();
}
function toggleSave(id, ev) {
  ev?.stopPropagation();
  state.saved.has(id) ? state.saved.delete(id) : state.saved.add(id);
  render();
}
function toggleTheme() {
  state.theme = state.theme === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', state.theme);
  render();
}
function selectPlan(p) { state.planSel = p; render(); }
function obGo(step) { state.ob = step; render(); }
function obBack() {
  const order = ['welcome', 'signup', 'profile', 'subscribe'];
  const i = order.indexOf(state.ob);
  if (i > 0) { state.ob = order[i - 1]; render(); }
}
function obToProfile() { obGo('profile'); }
function obAfterProfile() {
  if (state.planSel === 'premium') obGo('subscribe');
  else startApp();
}
function startApp() {
  state.mode = 'app';
  ME.plan = state.planSel;
  render();
  showToast(`Welcome, ${ME.name.split(' ')[0]}! 🎉`, 'star');
}

function selectExploreCat(id, ev) { ev?.stopPropagation(); state.exploreCat = id; render(); }
function setSocialTab(t) { state.socialTab = t; render(); }

function answerQuiz(i) {
  if (state.quiz.answered) return;
  state.quiz.selected = i;
  state.quiz.answered = true;
  state.quiz.correct = i === QUIZ.correct;
  render();
}
function finishQuiz() {
  state.quiz = { selected: null, answered: false, correct: false };
  back();
  showToast('Lesson complete +40 XP', 'award');
}

function openChat(id) { state.chatId = id; push('chat', { id }); }
function sendChat() {
  const input = document.getElementById('chatInputBox');
  const text = input && input.value.trim();
  if (!text) return;
  const id = state.chatId;
  state.chatMsgs[id] = state.chatMsgs[id] || [];
  state.chatMsgs[id].push({ from: 'me', text });
  render();
  const box = document.getElementById('chatScroll');
  if (box) box.scrollTop = box.scrollHeight;
}
function handleChatKey(ev) { if (ev.key === 'Enter') sendChat(); }

function markNotifRead(id) { state.notifs.delete(id); render(); }
function clearNotifs() { state.notifs.clear(); render(); }

function rsvpEvent(id, ev) {
  ev?.stopPropagation();
  if (state.rsvp.has(id)) { state.rsvp.delete(id); showToast('Removed from calendar'); }
  else { state.rsvp.add(id); showToast('Added to calendar', 'calendar'); }
  render();
}
function claimOffer(id) {
  state.claimed.add(id);
  render();
  showToast('Request sent to owner', 'truck');
}

function doSearch(val) { state.searchQuery = val; render(); }

function sendAiPrompt(preset) {
  const box = document.getElementById('aiInputBox');
  const text = preset || (box && box.value.trim());
  if (!text) return;
  state.aiThread = state.aiThread || [];
  state.aiThread.push({ from: 'me', text });
  render();
  const scroller = document.getElementById('aiScroll');
  if (scroller) scroller.scrollTop = scroller.scrollHeight;
  setTimeout(() => {
    state.aiThread.push({ from: 'ai', text: aiReplyFor(text) });
    render();
    const s2 = document.getElementById('aiScroll');
    if (s2) s2.scrollTop = s2.scrollHeight;
  }, 650);
}
function aiReplyFor(q) {
  const s = q.toLowerCase();
  if (s.includes('price')) return 'Try the 3x rule: (materials + your time at a fair hourly rate) × 3 covers costs, packaging and profit. For a $4 material candle, $14–18 feels right for your market.';
  if (s.includes('caption') || s.includes('instagram')) return '"New drop, made by hand 🌿 Small batch of 12 — link in bio before they\'re gone!" Add 3–5 niche hashtags like #youngmakers #handmadeshop.';
  if (s.includes('name') || s.includes('brand')) return 'Try pairing a texture word with your material: "Thread & Bloom", "ReWoven Co.", or "Second Story Totes" — short, easy to say, and available as a handle.';
  if (s.includes('photograph') || s.includes('photo')) return 'Shoot near a window at 10am–3pm, use a plain poster-board backdrop, and hold your phone at product height, not above it. Edit brightness up slightly before posting.';
  return "Good question — here's a starting point: focus on one clear next step, test it with 5 real customers, then adjust. Want me to break that into a checklist?";
}

// --------------------------------------------------------------- top icons
function topbarIcons(withNotif = true) {
  const unread = state.notifs.size;
  return `
    <div class="flex items-center gap-8">
      <button class="icon-btn" onclick="push('search')">${ICON('search', 18)}</button>
      ${withNotif ? `<button class="icon-btn" onclick="push('notifications')">${ICON('bell', 18)}${unread ? '<span class="dot"></span>' : ''}</button>` : ''}
    </div>`;
}
function backTopbar(title, right = '') {
  return `<div class="topbar">
    <button class="icon-btn" onclick="back()">${ICON('chevronLeft', 19)}</button>
    <h1 style="font-size:17px;flex:1;text-align:center">${esc(title)}</h1>
    ${right || '<span style="width:40px"></span>'}
  </div>`;
}
// Consistent section header with an optional colored "eyebrow" kicker above
// the title — a small structural cue that makes a long scroll of sections
// easier to scan at a glance.
function sectionHead(eyebrow, title, actionLabel, actionOnclick) {
  return `<div class="section-head">
    <div>${eyebrow ? `<div class="eyebrow">${esc(eyebrow)}</div>` : ''}<span class="h2">${esc(title)}</span></div>
    ${actionLabel ? `<span class="link-more" onclick="${actionOnclick}">${esc(actionLabel)}</span>` : ''}
  </div>`;
}

// ============================================================== onboarding
function renderOnboarding() {
  const steps = { welcome: 0, signup: 1, profile: 2, subscribe: 3 };
  let body = '';

  if (state.ob === 'welcome') {
    body = `
      <div style="flex:1;display:flex;flex-direction:column;padding:34px 30px 34px;background:var(--surface);position:relative;overflow:hidden">
        <div class="mesh"></div>
        <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:22px;position:relative;z-index:1">
          <div style="width:100px;height:100px;border-radius:30px;background:linear-gradient(135deg,#6B4EFF,#9B7BFF);display:flex;align-items:center;justify-content:center;box-shadow:0 24px 44px -16px rgba(107,78,255,.55);position:relative">
            <div style="position:absolute;inset:3px;border-radius:26px;border:1.5px solid rgba(255,255,255,.3)"></div>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M7 20.5V3.5M17 20.5V3.5M7 7h10M7 12h10M7 17h10" stroke-linecap="round"/></svg>
          </div>
          <div class="text-center">
            <div class="eyebrow" style="justify-content:center">YOUNG MAKERS NETWORK</div>
            <div class="h1" style="font-size:36px">Ladder</div>
            <p class="muted mt-8" style="max-width:250px;margin-inline:auto;line-height:1.6;font-size:14.5px">Make things, sell things, learn things — with a community of young creators.</p>
          </div>
          <div class="hscroll" style="padding:0;gap:10px">
            ${['🧵 Kits','🎨 DIY','♻️ Recycle','🤖 Robotics'].map(t=>`<span class="chip" style="flex:none">${t}</span>`).join('')}
          </div>
        </div>
        <button class="btn btn-primary btn-block" style="position:relative;z-index:1" onclick="obGo('signup')">Get started</button>
        <p class="tiny muted text-center mt-14" style="position:relative;z-index:1">Already have an account? <b style="color:var(--violet-500)">Log in</b></p>
      </div>`;
  }

  if (state.ob === 'signup') {
    body = `
      ${backTopbar('')}
      <div class="view-scroll pad" style="padding-top:6px">
        <div class="eyebrow">STEP 1 OF 2</div>
        <h1 class="h1">Create your account</h1>
        <p class="muted mt-6 mb-12">Join thousands of young creators.</p>
        <div class="field mb-12"><span class="label">NAME</span><input value="Jiara Martins"></div>
        <div class="field mb-12"><span class="label">EMAIL</span><input value="hello@ladder.app"></div>
        <div class="field"><span class="label">PASSWORD</span><input type="password" value="password"></div>
        <p class="tiny muted mt-14">By continuing you agree to Ladder's Terms and acknowledge our privacy practices for makers under 18.</p>
      </div>
      <div class="pad" style="padding-bottom:24px">
        <button class="btn btn-primary btn-block" onclick="obGo('profile')">Sign up</button>
      </div>`;
  }

  if (state.ob === 'profile') {
    const plans = [
      { id: 'free', title: 'Free — Youth', desc: "Join events, forums & browse the shop. Perfect to explore.", icon: 'leaf', color: 'var(--green-500)', bg: 'var(--green-100)' },
      { id: 'premium', title: 'Premium — Creator', desc: 'Sell products, AI branding tools & premium courses.', icon: 'star', color: 'var(--violet-500)', bg: 'var(--violet-100)', badge: true },
      { id: 'parent', title: 'Parent', desc: "Monitor your child's activity, progress & safety.", icon: 'users', color: 'var(--blue-500)', bg: 'var(--blue-100)' },
    ];
    body = `
      ${backTopbar('')}
      <div class="view-scroll pad" style="padding-top:6px">
        <div class="eyebrow">STEP 2 OF 2</div>
        <h1 class="h1">Choose your profile</h1>
        <p class="muted mt-6 mb-14">You can change this anytime.</p>
        <div style="display:flex;flex-direction:column;gap:14px">
          ${plans.map(p => `
            <button class="plan-option ${state.planSel===p.id?'selected':''}" onclick="selectPlan('${p.id}')">
              ${p.badge ? '<span class="plan-badge">POPULAR</span>' : ''}
              <span class="plan-icon" style="background:${p.bg};color:${p.color}">${ICON(p.icon,22)}</span>
              <span style="flex:1">
                <span class="h3" style="display:block">${p.title}</span>
                <span class="small soft" style="display:block;margin-top:3px;line-height:1.45">${p.desc}</span>
              </span>
              ${state.planSel===p.id ? `<span class="check-dot">${ICON('check',13,'stroke="#fff" stroke-width="3"')}</span>` : ''}
            </button>`).join('')}
        </div>
      </div>
      <div class="pad" style="padding-bottom:24px">
        <button class="btn btn-primary btn-block" onclick="obAfterProfile()">Continue</button>
      </div>`;
  }

  if (state.ob === 'subscribe') {
    body = `
      ${backTopbar('')}
      <div class="view-scroll pad text-center" style="padding-top:16px">
        <div style="width:66px;height:66px;border-radius:21px;background:linear-gradient(135deg,var(--violet-100),var(--violet-50));display:flex;align-items:center;justify-content:center;margin:0 auto 16px;color:var(--violet-500);box-shadow:var(--shadow-sm)">${ICON('star',30)}</div>
        <h1 class="h1">Go Premium</h1>
        <p class="muted mt-8 mb-20" style="line-height:1.55">Unlock selling tools, the AI brand assistant and every course — free for your first 30 days.</p>
        <div style="display:flex;flex-direction:column;gap:12px;text-align:start">
          ${['Sell unlimited products, 0% listing fees','Nova AI — pricing, captions & photo tips','All premium courses + certificates','Seller analytics dashboard'].map(f => `
            <div class="flex items-center gap-10">
              <span style="width:26px;height:26px;border-radius:50%;background:var(--green-100);color:var(--green-500);display:flex;align-items:center;justify-content:center;flex:none">${ICON('check',14)}</span>
              <span class="small">${f}</span>
            </div>`).join('')}
        </div>
      </div>
      <div class="pad" style="padding-bottom:24px">
        <button class="btn btn-primary btn-block" onclick="startApp()">Start free trial</button>
        <p class="tiny muted text-center mt-12">$6.99/mo after trial · Cancel anytime</p>
      </div>`;
  }

  root.innerHTML = `<div class="view enter">${body}<div class="dots" style="padding:10px 0 16px">${['welcome','signup','profile','subscribe'].map((s,i)=>`<span class="${steps[state.ob]>=i?'active':''}"></span>`).join('')}</div></div>`;
  wireBack();
}
function wireBack() {
  document.onkeydown = (e) => { if (e.key === 'Escape' && state.stack.length) back(); };
}

// ===================================================================== app
function renderApp() {
  if (state.stack.length) { root.innerHTML = renderStack(); afterRender(); return; }
  const tabs = { home: renderHome, explore: renderExplore, learn: renderLearn, community: renderSocial, profile: renderProfile };
  root.innerHTML = `<div class="view enter">${tabs[state.tab]()}${renderBottomNav()}${renderOverlays()}</div>`;
  afterRender();
}

function afterRender() {
  const top = state.stack[state.stack.length - 1];
  document.getElementById('screen').classList.toggle('reel-mode', !!top && top.view === 'reel');
}

function renderOverlays() {
  let out = '';
  if (state.toast) {
    out += `<div class="toast">${ICON(state.toast.icon,16)}<span>${esc(state.toast.msg)}</span></div>`;
  }
  if (state.sheet) {
    out += `<div class="sheet-backdrop open" onclick="if(event.target===this) closeSheet()">
      <div class="sheet">
        <div class="sheet-handle"></div>
        <h2 class="h2 mb-10">${esc(state.sheet.title)}</h2>
        ${state.sheet.body}
      </div>
    </div>`;
  }
  return out;
}

function renderBottomNav() {
  const items = [
    { id: 'home', label: 'Home', icon: 'home' },
    { id: 'explore', label: 'Explore', icon: 'compass' },
    { id: 'learn', label: 'Learn', icon: 'book' },
    { id: 'community', label: 'Community', icon: 'play' },
    { id: 'profile', label: 'Profile', icon: 'user' },
  ];
  return `<div class="bottomnav">
    ${items.map(it => `
      <button class="navbtn ${state.tab===it.id?'active':''}" onclick="nav('${it.id}')">
        ${ICON(it.icon, 21)}<span>${it.label}</span>
        ${it.id==='profile' && state.notifs.size ? '<span class="dot"></span>' : ''}
      </button>`).join('')}
  </div>`;
}

// ------------------------------------------------------------------- HOME
function renderHome() {
  const trending = PRODUCTS.slice(0, 5);
  const courses = COURSES.slice(0, 3);
  const top3 = LEADERBOARD.slice(0, 3);
  const buzz = POSTS.slice(0, 5);

  return `
    <div class="topbar">
      <div>
        <div class="eyebrow">GOOD TO SEE YOU</div>
        <div class="h2">Hey ${ME.name.split(' ')[0]} 👋</div>
      </div>
      ${topbarIcons()}
    </div>
    <div class="view-scroll">

      <div class="streak-banner"><div class="mesh"></div>
        <div class="streak-flame">${ICON('flame', 24, 'stroke="#fff"')}</div>
        <div class="info">
          <div style="font-family:var(--font-display);font-weight:600;font-size:16px">${ME.streak}-day streak 🔥 · Level ${ME.level}</div>
          <div class="tiny" style="opacity:.92;margin-top:3px">360 XP to Level ${ME.level+1}</div>
          <div class="xpbar"><div style="width:${(ME.xp % 500)/5}%"></div></div>
        </div>
      </div>

      <div class="section">
        <div class="stories">
          ${STORIES.map(s => `
            <div class="story ${s.me?'me':''}">
              <div class="ring" style="${s.isAI?'background:conic-gradient(from 180deg,var(--green-500),var(--blue-500),var(--green-500))':''}"><img src="${s.avatar}" alt=""></div>
              <div class="name">${esc(s.name)}</div>
            </div>`).join('')}
        </div>
      </div>

      <div class="section">
        <div class="chip-row">
          ${CATEGORIES.map(c => `<button class="chip" onclick="nav('explore');selectExploreCat('${c.id}')">${ICON(c.icon,14)}${c.label}</button>`).join('')}
        </div>
      </div>

      <div class="section">
        ${sectionHead('FOR YOU', 'Trending kits', 'See all', "nav('explore')")}
        <div class="hscroll">${trending.map(productCard).join('')}</div>
      </div>

      <div class="section">
        ${sectionHead('THIS WEEKEND', 'Upcoming events', 'See all', "push('events')")}
        <div class="hero-banner" style="margin-top:0" onclick="push('eventDetail',{id:'e0'})">
          <img src="${EVENTS[0].cover}" alt="">
          <div class="overlay">
            <div class="tag" style="width:fit-content;margin-bottom:8px;background:rgba(255,255,255,.22);color:#fff;backdrop-filter:blur(4px)">214 GOING</div>
            <div class="h3" style="color:#fff;font-size:17px">${EVENTS[0].title}</div>
            <div class="tiny mt-6" style="opacity:.9">${EVENTS[0].date}</div>
          </div>
        </div>
      </div>

      <div class="section">
        ${sectionHead('KEEP GOING', 'Continue learning', 'See all', "nav('learn')")}
        <div class="hscroll">${courses.map(courseCard).join('')}</div>
      </div>

      <div class="section">
        ${sectionHead('TOP MAKERS', "This week's leaders", 'Leaderboard', "push('leaderboard')")}
        <div class="rows-card">
          ${top3.map(p => `
            <div class="row" style="${p.me?'background:var(--violet-50)':''}">
              <div class="h3 num" style="width:20px;color:var(--muted)">${p.rank}</div>
              <img class="avatar" src="${p.avatar}" width="38" height="38">
              <div class="flex-1"><div class="small" style="font-weight:700">${esc(p.name)}${p.me?' (you)':''}</div><div class="tiny muted num">${p.xp.toLocaleString()} XP</div></div>
              ${p.rank<=3?`<span style="color:${p.rank===1?'#FFA53E':p.rank===2?'#B8B8C4':'#C97A4A'}">${ICON('award',20)}</span>`:''}
            </div>`).join('')}
        </div>
      </div>

      <div class="section" style="margin-bottom:24px">
        ${sectionHead('TRENDING', 'Community buzz', 'See all', "nav('community')")}
        <div class="hscroll">
          ${buzz.map(p => `
            <div style="flex:none;width:104px" onclick="nav('community')">
              <img src="${p.cover}" style="width:104px;height:104px;border-radius:16px;object-fit:cover;border:1px solid var(--border);box-shadow:var(--shadow-sm)">
              <div class="flex items-center gap-6 mt-8"><img class="avatar" src="${p.avatar}" width="18" height="18"><span class="tiny" style="font-weight:700">${esc(p.user)}</span></div>
            </div>`).join('')}
        </div>
      </div>
    </div>`;
}

function productCard(p) {
  const wished = state.wishlist.has(p.id);
  return `
    <div class="product-card" onclick="push('productDetail',{id:'${p.id}'})">
      <button class="wish-btn ${wished?'active':''}" onclick="toggleWish('${p.id}', event)">${ICON('heart',15)}</button>
      <img class="thumb" src="${p.cover}" alt="${esc(p.title)}">
      <div class="body">
        ${p.tag ? `<span class="tag tag-violet mb-6">${p.tag.toUpperCase()}</span>` : ''}
        <div class="title">${esc(p.title)}</div>
        <div class="price-row">
          <span class="price num">${money(p.price)}</span>
          <span class="stars tiny">${ICON('starFill',12)} ${p.rating}</span>
        </div>
      </div>
    </div>`;
}
function courseCard(c) {
  return `
    <div class="product-card" style="width:200px" onclick="push('quiz',{course:'${c.id}'})">
      <img class="thumb" src="${c.cover}" alt="" style="height:100px">
      <div class="body">
        <span class="tag tag-amber mb-6">${c.level.toUpperCase()}</span>
        <div class="title" style="height:auto">${esc(c.title)}</div>
        <div class="tiny muted mt-6">${c.lessons} lessons · ${c.mins}m</div>
        <div class="progress-track mt-8"><div class="progress-fill ${c.progress===100?'green':''}" style="width:${c.progress}%"></div></div>
      </div>
    </div>`;
}

// ---------------------------------------------------------------- EXPLORE
function renderExplore() {
  const q = (state.exploreCat === 'all') ? PRODUCTS : PRODUCTS.filter(p => p.cat === state.exploreCat);
  return `
    <div class="topbar">
      <h1>Explore</h1>
      ${topbarIcons()}
    </div>
    <div class="view-scroll">
      <div class="chip-row">
        <button class="chip ${state.exploreCat==='all'?'active':''}" onclick="selectExploreCat('all')">All</button>
        ${CATEGORIES.map(c => `<button class="chip ${state.exploreCat===c.id?'active':''}" onclick="selectExploreCat('${c.id}')">${ICON(c.icon,14)}${c.label}</button>`).join('')}
      </div>

      <div class="hero-banner" style="margin-top:14px" onclick="push('recycle')">
        <img src="${OFFERS[2].cover.replace('200/200','520/200')}" alt="">
        <div class="overlay">
          <div class="flex items-center gap-6" style="color:#fff">${ICON('recycle',16)}<span class="tiny" style="font-weight:800;letter-spacing:.4px">RECYCLE MARKET</span></div>
          <div class="h3 mt-6" style="color:#fff;font-size:17px">Trade scraps, find materials nearby</div>
        </div>
      </div>

      <div class="section-head mt-20" style="padding-top:0"><span class="h2">${state.exploreCat==='all'?'All products':CATEGORIES.find(c=>c.id===state.exploreCat)?.label}</span><span class="tiny muted num">${q.length} items</span></div>
      <div class="grid-2">${q.map(productGridCard).join('')}</div>
      <div style="height:20px"></div>
    </div>`;
}
function productGridCard(p) {
  const wished = state.wishlist.has(p.id);
  return `
    <div class="product-card" style="width:auto" onclick="push('productDetail',{id:'${p.id}'})">
      <button class="wish-btn ${wished?'active':''}" onclick="toggleWish('${p.id}', event)">${ICON('heart',15)}</button>
      <img class="thumb" src="${p.cover}" alt="${esc(p.title)}" style="height:140px">
      <div class="body">
        ${p.tag ? `<span class="tag tag-violet mb-6">${p.tag.toUpperCase()}</span>` : ''}
        <div class="title">${esc(p.title)}</div>
        <div class="tiny muted mt-6">by ${esc(p.seller)}</div>
        <div class="price-row"><span class="price num">${money(p.price)}</span><span class="stars tiny">${ICON('starFill',12)} ${p.rating}</span></div>
      </div>
    </div>`;
}

// ------------------------------------------------------------------ LEARN
function renderLearn() {
  return `
    <div class="topbar">
      <h1>Learn</h1>
      <button class="btn btn-ghost btn-sm" onclick="push('ai')">${ICON('sparkle',14)}Nova AI</button>
    </div>
    <div class="view-scroll">
      <div class="section" style="margin-top:2px">
        <div class="hero-banner dotgrid" style="height:124px;background:linear-gradient(120deg,#0E3A2C,#1B5E45 55%,#245E8C)" onclick="push('ai')">
          <div class="overlay" style="background:linear-gradient(100deg, rgba(10,20,25,.5), rgba(10,20,25,.08))">
            <div class="flex items-center gap-10">
              <div style="width:38px;height:38px;border-radius:12px;background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;box-shadow:inset 0 1px 0 rgba(255,255,255,.3)">${ICON('robot',19,'stroke="#fff"')}</div>
              <div>
                <div class="h3" style="color:#fff;font-size:16px">Ask Nova, your AI mentor</div>
                <div class="tiny" style="color:#fff;opacity:.85">Pricing, captions, photos & more</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-head"><div><div class="eyebrow">IN PROGRESS</div><span class="h2">Your courses</span></div><span class="tiny muted">${COURSES.filter(c=>c.progress>0&&c.progress<100).length} active</span></div>
        <div style="display:flex;flex-direction:column;gap:12px;padding:0 20px">
          ${COURSES.map(c => `
            <div class="card flex gap-12" style="padding:11px" onclick="push('quiz',{course:'${c.id}'})">
              <img src="${c.cover}" style="width:74px;height:74px;border-radius:14px;object-fit:cover;flex:none">
              <div class="flex-1" style="min-width:0">
                <div class="h3" style="font-size:14px">${esc(c.title)}</div>
                <div class="tiny muted mt-6">${c.lessons} lessons · ${c.mins} min · ${c.level}</div>
                <div class="progress-track mt-8"><div class="progress-fill ${c.progress===100?'green':''}" style="width:${c.progress}%"></div></div>
              </div>
              ${c.progress===100?`<span style="color:var(--green-500);align-self:center">${ICON('check',18)}</span>`:`<span style="align-self:center;color:var(--muted)">${ICON('chevronRight',18)}</span>`}
            </div>`).join('')}
        </div>
      </div>

      <div class="section" style="margin-bottom:24px">
        ${sectionHead(null, 'Knowledge base', null, null)}
        <div class="rows-card">
          ${[
            {t:'How Ladder payouts work', icon:'dollar'},
            {t:'Shipping small packages cheaply', icon:'truck'},
            {t:'Staying safe as a young seller', icon:'shield'},
            {t:'Finding your school community', icon:'users'},
          ].map(a => `
            <div class="row" onclick="openSheet('${esc(a.t)}', '<p class=\\'small soft\\' style=\\'line-height:1.6\\'>A short, friendly walkthrough written for young makers — with real examples, screenshots and a checklist you can follow today. Open the full lesson from the Learn tab any time.</p>')">
              <div class="row-icon" style="background:var(--violet-100);color:var(--violet-600)">${ICON(a.icon,18)}</div>
              <div class="flex-1 small" style="font-weight:600">${esc(a.t)}</div>
              <span class="muted">${ICON('chevronRight',16)}</span>
            </div>`).join('')}
        </div>
      </div>
    </div>`;
}

// -------------------------------------------------------------- COMMUNITY
function renderSocial() {
  return `
    <div class="topbar">
      <h1>Community</h1>
      ${topbarIcons()}
    </div>
    <div class="pad" style="padding-top:0;padding-bottom:10px">
      <div style="display:flex;gap:8px;background:var(--surface-2);padding:4px;border-radius:14px">
        <button class="btn-sm" style="flex:1;border:none;border-radius:11px;font-family:var(--font-display);font-weight:600;background:${state.socialTab==='reels'?'var(--surface)':'transparent'};box-shadow:${state.socialTab==='reels'?'var(--shadow-sm)':'none'}" onclick="setSocialTab('reels')">Reels</button>
        <button class="btn-sm" style="flex:1;border:none;border-radius:11px;font-family:var(--font-display);font-weight:600;background:${state.socialTab==='community'?'var(--surface)':'transparent'};box-shadow:${state.socialTab==='community'?'var(--shadow-sm)':'none'}" onclick="setSocialTab('community')">Feed</button>
      </div>
    </div>
    <div class="view-scroll">
      ${state.socialTab === 'reels' ? `
        <div class="reels-grid">
          ${REELS.map(r => `
            <div class="reel-card" onclick="push('reel',{id:'${r.id}'})">
              <img src="${r.cover}" alt="">
              <svg class="reel-play" viewBox="0 0 24 24" fill="currentColor"><path d="M8 6.8v10.4a1 1 0 0 0 1.5.87l9-5.2a1 1 0 0 0 0-1.74l-9-5.2A1 1 0 0 0 8 6.8Z"/></svg>
              <div class="overlay">
                <div class="views">${ICON('play',12,'stroke="#fff"')} ${r.views}</div>
                <div class="cap">${esc(r.title)}</div>
              </div>
            </div>`).join('')}
        </div>
        <div style="height:16px"></div>
      ` : `
        <div>
          ${POSTS.map(postCard).join('')}
        </div>
      `}
    </div>`;
}
function postCard(p) {
  const liked = state.liked.has(p.id);
  const saved = state.saved.has(p.id);
  return `
    <div class="post">
      <div class="post-head">
        <img class="avatar" src="${p.avatar}" width="36" height="36">
        <div class="flex-1"><div class="small" style="font-weight:700">${esc(p.user)}</div><div class="tiny muted">${p.time} ago</div></div>
        <span class="muted">${ICON('share',16)}</span>
      </div>
      <img class="post-img" src="${p.cover}" alt="">
      <div class="post-actions">
        <button class="${liked?'liked':''}" onclick="toggleLike('${p.id}')">${ICON('heart',19)} <span class="num">${p.likes + (liked?1:0)}</span></button>
        <button>${ICON('comment',19)} <span class="num">${p.comments}</span></button>
        <div class="flex-1"></div>
        <button class="${saved?'saved':''}" onclick="toggleSave('${p.id}', event)">${ICON('bookmark',19)}</button>
      </div>
      <div class="post-cap"><b>${esc(p.user)}</b> ${esc(p.caption)}</div>
    </div>`;
}

// -------------------------------------------------------------- PROFILE
function renderProfile() {
  const planLabel = { free: 'Free · Youth', premium: 'Premium · Creator', parent: 'Parent account' }[ME.plan];
  return `
    <div class="topbar">
      <h1>Profile</h1>
      ${topbarIcons(false)}
    </div>
    <div class="view-scroll pad" style="padding-top:0">
      <div class="card" style="position:relative;overflow:hidden;padding:18px;border:none;background:var(--surface)">
        <div class="mesh green"></div>
        <div class="flex items-center gap-14" style="position:relative;z-index:1">
          <img class="avatar" src="${ME.avatar}" width="72" height="72" style="border:3px solid var(--surface);box-shadow:0 0 0 1px var(--border)">
          <div class="flex-1">
            <div class="h2">${esc(ME.name)}</div>
            <div class="tiny muted mt-6">${esc(ME.handle)}</div>
            <span class="tag ${ME.plan==='premium'?'tag-violet':ME.plan==='parent'?'tag-blue':'tag-green'} mt-8" style="margin-top:8px">${planLabel.toUpperCase()}</span>
          </div>
          <button class="icon-btn">${ICON('edit',16)}</button>
        </div>
      </div>

      <div class="flex gap-10 mt-16">
        <div class="stat-card"><div class="h2 num">${ME.followers.toLocaleString()}</div><div class="tiny muted mt-6">Followers</div></div>
        <div class="stat-card"><div class="h2 num">${ME.following}</div><div class="tiny muted mt-6">Following</div></div>
        <div class="stat-card"><div class="h2 num">${money(ME.sales)}</div><div class="tiny muted mt-6">This month</div></div>
      </div>

      ${sectionHead(null, 'Badges', 'View all', "push('badges')")}
      <div class="flex gap-10">
        ${BADGES.slice(0,4).map(b => `
          <div class="badge-tile ${b.locked?'locked':''}" style="flex:1">
            <div class="badge-icon" style="background:${b.color}22;color:${b.color}">${ICON(b.icon,20)}</div>
            <div class="tiny" style="font-weight:700;line-height:1.3">${esc(b.label)}</div>
          </div>`).join('')}
      </div>

      ${ME.plan==='premium' ? `
      <div class="card mt-20" style="padding:17px;background:linear-gradient(135deg,#221B43,#4530A0);color:#fff;border:none;box-shadow:var(--shadow-lg)" onclick="push('seller')">
        <div class="flex items-center justify-between">
          <div>
            <div class="h3" style="color:#fff;font-size:15.5px">Seller Dashboard</div>
            <div class="tiny mt-6" style="opacity:.8">Sales, orders & AI branding tools</div>
          </div>
          <span style="color:#fff">${ICON('arrowRight',20)}</span>
        </div>
      </div>` : ''}

      <div class="rows-card mt-20">
        ${[
          {t:'Wishlist', icon:'heart', view:'wishlist'},
          {t:'Orders & shipping', icon:'package', view:'orders'},
          {t:'Messages', icon:'message', view:'messages'},
          {t:'Notifications', icon:'bell', view:'notifications'},
          {t:'Leaderboard', icon:'trending', view:'leaderboard'},
          {t:'Recycle marketplace', icon:'recycle', view:'recycle'},
        ].map(r => `
          <div class="row" onclick="push('${r.view}')">
            <div class="row-icon" style="background:var(--surface-2);color:var(--ink-soft)">${ICON(r.icon,18)}</div>
            <div class="flex-1 small" style="font-weight:600">${r.t}</div>
            ${r.view==='notifications' && state.notifs.size ? `<span class="tag tag-pink">${state.notifs.size}</span>` : ''}
            <span class="muted">${ICON('chevronRight',16)}</span>
          </div>`).join('')}
      </div>

      <div class="rows-card mt-14 mb-24">
        <div class="row">
          <div class="row-icon" style="background:var(--surface-2);color:var(--ink-soft)">${ICON(state.theme==='dark'?'moon':'sun',18)}</div>
          <div class="flex-1 small" style="font-weight:600">Dark mode</div>
          <div class="switch ${state.theme==='dark'?'on':''}" onclick="toggleTheme()"></div>
        </div>
        <div class="row" onclick="push('settings')">
          <div class="row-icon" style="background:var(--surface-2);color:var(--ink-soft)">${ICON('settings',18)}</div>
          <div class="flex-1 small" style="font-weight:600">Settings & privacy</div>
          <span class="muted">${ICON('chevronRight',16)}</span>
        </div>
        <div class="row" onclick="showToast('Signed out (demo only)')">
          <div class="row-icon" style="background:var(--pink-100);color:var(--pink-500)">${ICON('logout',18)}</div>
          <div class="flex-1 small" style="font-weight:600;color:var(--pink-500)">Log out</div>
        </div>
      </div>
    </div>`;
}

// ================================================================== STACK
function renderStack() {
  const top = state.stack[state.stack.length - 1];
  const renderers = {
    productDetail: renderProductDetail,
    search: renderSearch,
    notifications: renderNotifications,
    messages: renderMessages,
    chat: renderChat,
    eventDetail: renderEventDetail,
    events: renderEventsList,
    quiz: renderQuiz,
    seller: renderSeller,
    badges: renderBadges,
    wishlist: renderWishlist,
    ai: renderAI,
    recycle: renderRecycle,
    leaderboard: renderLeaderboard,
    settings: renderSettings,
    orders: renderOrders,
    reel: renderReelViewer,
  };
  const fn = renderers[top.view] || (() => backTopbar('Not found') + '<div class="pad">Nothing here.</div>');
  return `<div class="view enter">${fn(top)}${renderOverlays()}</div>`;
}

function renderProductDetail({ id }) {
  const p = byId(PRODUCTS, id);
  const wished = state.wishlist.has(p.id);
  return `
    ${backTopbar('', `<button class="icon-btn" onclick="toggleWish('${p.id}',event)">${wished?ICON('heart',17,'style="fill:var(--pink-500);stroke:var(--pink-500)"'):ICON('heart',17)}</button>`)}
    <div class="view-scroll">
      <div class="pad">
        <img src="${p.gallery[0]}" style="width:100%;aspect-ratio:1/1;object-fit:cover;border-radius:22px;box-shadow:var(--shadow-lg)">
        <div class="flex gap-8 mt-10">
          ${p.gallery.map((g,i) => `<img src="${g}" style="width:56px;height:56px;border-radius:11px;object-fit:cover;border:2px solid ${i===0?'var(--violet-500)':'transparent'};box-shadow:var(--shadow-sm)">`).join('')}
        </div>

        <div class="flex items-center justify-between mt-20">
          ${p.tag ? `<span class="tag tag-violet">${p.tag.toUpperCase()}</span>` : '<span></span>'}
          <span class="stars small num">${ICON('starFill',14)} ${p.rating} · ${p.reviews} reviews</span>
        </div>
        <div class="h1 mt-10" style="font-size:23px">${esc(p.title)}</div>
        <div class="h1 mt-8 num" style="font-size:25px;color:var(--violet-500)">${money(p.price)}</div>

        <div class="flex items-center gap-10 mt-20 card" style="padding:12px 14px" onclick="openChat('ch0')">
          <img class="avatar" src="${p.sellerAvatar}" width="42" height="42">
          <div class="flex-1"><div class="small" style="font-weight:700">${esc(p.seller)}</div><div class="tiny muted">Usually replies within an hour</div></div>
          <span class="btn btn-sm btn-ghost">Message</span>
        </div>

        <div class="mt-20">
          <div class="h3">Description</div>
          <p class="small soft mt-8" style="line-height:1.65">Handmade in small batches by a Ladder creator. ${p.stock} left in stock — ships within 2 business days from a verified young seller.</p>
        </div>

        ${sectionHead(null, 'You might also like', null, null)}
        <div class="hscroll" style="padding:0">
          ${PRODUCTS.filter(x=>x.cat===p.cat && x.id!==p.id).concat(PRODUCTS).slice(0,4).map(productCard).join('')}
        </div>
      </div>
      <div style="height:100px"></div>
    </div>
    <div class="pad" style="position:absolute;left:0;right:0;bottom:0;padding-bottom:24px;padding-top:12px;background:var(--surface);border-top:1px solid var(--border);display:flex;gap:10px">
      <button class="icon-btn" style="width:52px;height:52px;border-radius:16px" onclick="toggleWish('${p.id}',event)">${ICON(wished?'heart':'heart',18)}</button>
      <button class="btn btn-primary flex-1" onclick="showToast('Added to cart','cart')">${ICON('cart',17)} Add to cart</button>
    </div>`;
}

function renderSearch() {
  const q = state.searchQuery.trim().toLowerCase();
  const results = q ? PRODUCTS.filter(p => p.title.toLowerCase().includes(q) || p.seller.toLowerCase().includes(q)) : [];
  return `
    <div class="topbar">
      <button class="icon-btn" onclick="back()">${ICON('chevronLeft',19)}</button>
      <div class="search-bar flex-1">
        ${ICON('search',16)}
        <input placeholder="Search kits, sellers, courses…" autofocus oninput="doSearch(this.value)" value="${esc(state.searchQuery)}">
      </div>
      <button class="icon-btn">${ICON('sliders',17)}</button>
    </div>
    <div class="view-scroll pad">
      ${!q ? `
        <div class="h3 mb-10">Trending searches</div>
        <div class="chip-row" style="padding:0 0 10px">
          ${['candles','robot kit','recycled','stickers','terrarium'].map(t => `<button class="chip" onclick="doSearch('${t}')">${t}</button>`).join('')}
        </div>
        <div class="h3 mt-14 mb-10">Recent</div>
        <div class="rows-card" style="margin:0">
          ${['Terrarium kit','Sara K.','riso stickers'].map(t => `<div class="row"><span class="muted">${ICON('clock',16)}</span><span class="small flex-1">${t}</span></div>`).join('')}
        </div>
      ` : `
        <div class="tiny muted mb-10">${results.length} result${results.length===1?'':'s'} for "${esc(state.searchQuery)}"</div>
        <div class="grid-2" style="padding:0">${results.map(productGridCard).join('') || '<p class="small muted">Try a different search term.</p>'}</div>
      `}
    </div>`;
}

function renderNotifications() {
  return `
    ${backTopbar('Notifications', `<span class="link-more" style="width:auto" onclick="clearNotifs()">Clear</span>`)}
    <div class="view-scroll">
      <div class="rows-card" style="margin-top:6px">
        ${NOTIFICATIONS.map(n => `
          <div class="row" onclick="markNotifRead('${n.id}')" style="background:${state.notifs.has(n.id)?'var(--violet-50)':'var(--surface)'}">
            <div class="row-icon" style="background:var(--violet-100);color:var(--violet-600)">${ICON(n.icon,18)}</div>
            <div class="flex-1 small" style="font-weight:600;line-height:1.4">${esc(n.text)}</div>
            <div class="tiny muted" style="align-self:flex-start">${n.time}</div>
          </div>`).join('')}
      </div>
      <div style="height:20px"></div>
    </div>`;
}

function renderMessages() {
  return `
    ${backTopbar('Messages')}
    <div class="view-scroll">
      <div class="rows-card" style="margin-top:6px">
        ${CHATS.map(c => `
          <div class="row" onclick="openChat('${c.id}')">
            <div style="position:relative">
              <img class="avatar" src="${c.avatar}" width="46" height="46">
              ${c.online?'<span style="position:absolute;bottom:0;right:0;width:12px;height:12px;border-radius:50%;background:var(--green-500);border:2px solid var(--surface)"></span>':''}
            </div>
            <div class="flex-1" style="min-width:0">
              <div class="small" style="font-weight:700">${esc(c.name)}</div>
              <div class="tiny muted mt-6" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(c.last)}</div>
            </div>
            <div style="align-self:flex-start;text-align:end">
              <div class="tiny muted">${c.time}</div>
              ${c.unread?`<span class="tag tag-violet mt-6" style="margin-top:6px">${c.unread}</span>`:''}
            </div>
          </div>`).join('')}
      </div>
    </div>`;
}

function renderChat({ id }) {
  const c = byId(CHATS, id);
  const extra = state.chatMsgs[id] || [];
  const msgs = c.isBot ? [{from:'them',text:c.last}] : CHAT_THREAD;
  return `
    ${backTopbar(c.name)}
    <div class="view-scroll" id="chatScroll" style="display:flex;flex-direction:column;gap:10px;padding:16px 16px 6px">
      ${msgs.concat(extra).map(m => `<div class="chat-bubble ${m.from==='me'?'me':'them'}">${esc(m.text)}</div>`).join('')}
    </div>
    <div class="chat-input-bar">
      <input id="chatInputBox" placeholder="Message…" style="flex:1;height:42px;border-radius:21px;border:1px solid var(--border);padding:0 16px;background:var(--surface-2);outline:none" onkeydown="handleChatKey(event)">
      <button class="icon-btn" style="background:linear-gradient(135deg,var(--violet-500),var(--violet-600));color:#fff;border:none" onclick="sendChat()">${ICON('send',17)}</button>
    </div>`;
}

function renderEventDetail({ id }) {
  const e = byId(EVENTS, id);
  const going = state.rsvp.has(e.id);
  return `
    ${backTopbar('')}
    <div class="view-scroll">
      <div class="pad">
        <img src="${e.cover}" style="width:100%;height:182px;object-fit:cover;border-radius:22px;box-shadow:var(--shadow-lg)">
        <div class="h1 mt-16" style="font-size:22px">${esc(e.title)}</div>
        <div class="flex items-center gap-8 mt-12 small soft">${ICON('calendar',16)} ${e.date} · ${e.time}</div>
        <div class="flex items-center gap-8 mt-8 small soft">${ICON('mapPin',16)} ${esc(e.location)}</div>
        <div class="flex items-center gap-8 mt-8 small soft">${ICON('users',16)} ${e.going} people going</div>
        <div class="flex mt-16" style="margin-left:-4px">
          ${STORIES.slice(2,6).map(s => `<img class="avatar" src="${s.avatar}" width="30" height="30" style="border:2px solid var(--surface);margin-left:-4px">`).join('')}
          <span class="small soft" style="margin-left:8px;align-self:center">+${e.going-4} others</span>
        </div>
        <div class="mt-20"><div class="h3">About</div><p class="small soft mt-8" style="line-height:1.65">A youth maker meet-up with booths, live demos and a swap table for materials. ${e.price} — bring your own tote!</p></div>
      </div>
      <div style="height:90px"></div>
    </div>
    <div class="pad" style="position:absolute;left:0;right:0;bottom:0;padding-bottom:24px;padding-top:12px;background:var(--surface);border-top:1px solid var(--border)">
      <button class="btn ${going?'btn-secondary':'btn-primary'} btn-block" onclick="rsvpEvent('${e.id}',event)">${going?ICON('check',16)+' Going':'RSVP — '+e.price}</button>
    </div>`;
}

function renderEventsList() {
  return `
    ${backTopbar('Events')}
    <div class="view-scroll pad" style="padding-top:14px">
      ${EVENTS.map(e => `
        <div class="card mt-12" style="overflow:hidden" onclick="push('eventDetail',{id:'${e.id}'})">
          <img src="${e.cover}" style="width:100%;height:122px;object-fit:cover">
          <div style="padding:15px">
            <div class="h3">${esc(e.title)}</div>
            <div class="tiny muted mt-8">${e.date} · ${e.location}</div>
          </div>
        </div>`).join('')}
      <div style="height:10px"></div>
    </div>`;
}

function renderQuiz({ course }) {
  const c = byId(COURSES, course) || COURSES[0];
  const q = state.quiz;
  return `
    ${backTopbar(c.title)}
    <div class="view-scroll pad" style="padding-top:16px">
      <div class="eyebrow">LESSON QUIZ</div>
      <div class="h2" style="line-height:1.4">${QUIZ.question}</div>
      <div style="display:flex;flex-direction:column;gap:12px;margin-top:18px">
        ${QUIZ.options.map((opt,i) => {
          let style = 'border-color:var(--border)', icon = '';
          if (q.answered) {
            if (i === QUIZ.correct) { style = 'border-color:var(--green-500);background:var(--green-100)'; icon = ICON('check',16,'style="color:var(--green-500)"'); }
            else if (i === q.selected) { style = 'border-color:var(--pink-500);background:var(--pink-100)'; icon = ICON('x',16,'style="color:var(--pink-500)"'); }
          }
          return `<button class="plan-option" style="padding:14px 16px;${style}" onclick="answerQuiz(${i})">
            <span class="small num" style="font-weight:700;flex:1">${esc(opt)}</span>${icon}
          </button>`;
        }).join('')}
      </div>
      ${q.answered ? `<div class="card mt-16" style="padding:15px;background:${q.correct?'var(--green-100)':'var(--pink-100)'};border:none"><span class="small" style="font-weight:700">${q.correct?'Correct! 🎉':'Not quite.'}</span><p class="small soft mt-6">The 3x rule keeps materials, your time and profit all covered — most beginner sellers undercharge.</p></div>` : ''}
    </div>
    ${q.answered ? `<div class="pad" style="padding-bottom:24px"><button class="btn btn-primary btn-block" onclick="finishQuiz()">Continue</button></div>` : ''}`;
}

function renderSeller() {
  const max = Math.max(...SALES_CHART);
  return `
    ${backTopbar('Seller Dashboard')}
    <div class="view-scroll pad" style="padding-top:14px">
      <div class="flex gap-10">
        <div class="stat-card"><div class="h2 num" style="color:var(--violet-500)">${money(ME.sales)}</div><div class="tiny muted mt-6">Sales (30d)</div></div>
        <div class="stat-card"><div class="h2 num">47</div><div class="tiny muted mt-6">Orders</div></div>
        <div class="stat-card"><div class="h2 num">4.8</div><div class="tiny muted mt-6">Avg rating</div></div>
      </div>

      <div class="card mt-16" style="padding:17px">
        <div class="flex items-center justify-between"><span class="h3">Sales trend</span><span class="tag tag-green">+18%</span></div>
        <div class="flex items-end gap-6 mt-14" style="height:80px">
          ${SALES_CHART.map(v => `<div style="flex:1;height:${(v/max*100)}%;background:linear-gradient(180deg,var(--violet-500),#9B7BFF);border-radius:5px 5px 2px 2px"></div>`).join('')}
        </div>
      </div>

      <div class="card mt-16" style="padding:17px;background:linear-gradient(135deg,#221B43,#4530A0);color:#fff;border:none;box-shadow:var(--shadow-lg)" onclick="push('ai')">
        <div class="flex items-center gap-10">
          <div style="width:38px;height:38px;border-radius:12px;background:rgba(255,255,255,.15);display:flex;align-items:center;justify-content:center">${ICON('robot',20,'stroke="#fff"')}</div>
          <div class="flex-1"><div class="h3" style="color:#fff;font-size:14.5px">Ask Nova to price your next drop</div><div class="tiny mt-6" style="opacity:.8">AI branding & pricing assistant</div></div>
          <span style="color:#fff">${ICON('arrowRight',18)}</span>
        </div>
      </div>

      ${sectionHead(null, 'Recent orders', null, null)}
      <div class="rows-card" style="margin:0">
        ${PRODUCTS.slice(0,4).map((p,i) => `
          <div class="row">
            <img src="${p.cover}" style="width:40px;height:40px;border-radius:11px;object-fit:cover">
            <div class="flex-1 small" style="font-weight:600">${esc(p.title)}</div>
            <span class="tag ${i%2?'tag-amber':'tag-green'}">${i%2?'PACKING':'SHIPPED'}</span>
          </div>`).join('')}
      </div>
      <div style="height:16px"></div>
    </div>`;
}

function renderBadges() {
  return `
    ${backTopbar('Badges')}
    <div class="view-scroll pad" style="padding-top:16px">
      <p class="small soft mb-14">Earn badges by selling, learning and helping the community.</p>
      <div class="grid-2" style="padding:0">
        ${BADGES.map(b => `
          <div class="badge-tile ${b.locked?'locked':''}">
            <div class="badge-icon" style="background:${b.color}22;color:${b.color};width:56px;height:56px">${ICON(b.icon,24)}</div>
            <div class="small" style="font-weight:700">${esc(b.label)}</div>
            <div class="tiny muted">${b.locked?'Locked':'Earned'}</div>
          </div>`).join('')}
      </div>
      <div style="height:16px"></div>
    </div>`;
}

function renderWishlist() {
  const items = PRODUCTS.filter(p => state.wishlist.has(p.id));
  return `
    ${backTopbar('Wishlist')}
    <div class="view-scroll pad" style="padding-top:14px">
      ${items.length ? `<div class="grid-2" style="padding:0">${items.map(productGridCard).join('')}</div>` : `
        <div class="text-center mt-24">
          <div style="width:60px;height:60px;border-radius:18px;background:var(--pink-100);color:var(--pink-500);display:flex;align-items:center;justify-content:center;margin:0 auto 14px">${ICON('heart',26)}</div>
          <div class="h3">No items yet</div>
          <p class="small muted mt-8">Tap the heart on any product to save it here.</p>
        </div>`}
      <div style="height:16px"></div>
    </div>`;
}

function renderOrders() {
  return `
    ${backTopbar('Orders & shipping')}
    <div class="view-scroll pad" style="padding-top:14px">
      ${PRODUCTS.slice(0,3).map((p,i) => `
        <div class="card mt-12 flex gap-12" style="padding:12px">
          <img src="${p.cover}" style="width:56px;height:56px;border-radius:13px;object-fit:cover">
          <div class="flex-1">
            <div class="small" style="font-weight:700">${esc(p.title)}</div>
            <div class="tiny muted mt-6">Order #${1200+i} · ${money(p.price)}</div>
          </div>
          <span class="tag ${i===0?'tag-green':'tag-amber'}" style="align-self:center">${i===0?'DELIVERED':'IN TRANSIT'}</span>
        </div>`).join('')}
      <div style="height:16px"></div>
    </div>`;
}

function renderAI() {
  const thread = state.aiThread || [];
  return `
    ${backTopbar('Nova AI')}
    <div class="view-scroll" id="aiScroll" style="padding:16px 16px 6px;display:flex;flex-direction:column;gap:14px">
      <div class="ai-bubble">
        <img class="avatar" src="${avatar('Nova AI')}" width="30" height="30">
        <div class="chat-bubble them">Hi Jiara! I'm Nova, your AI mentor for pricing, branding and growing your shop. What are you working on?</div>
      </div>
      ${thread.map(m => m.from==='me'
        ? `<div class="chat-bubble me" style="align-self:flex-end">${esc(m.text)}</div>`
        : `<div class="ai-bubble"><img class="avatar" src="${avatar('Nova AI')}" width="30" height="30"><div class="chat-bubble them">${esc(m.text)}</div></div>`
      ).join('')}
      ${!thread.length ? `<div class="flex" style="flex-direction:column;gap:10px;margin-top:6px">${AI_PROMPTS.map(p => `<button class="ai-prompt" onclick="sendAiPrompt('${esc(p)}')">${ICON('arrowRight',14)}${esc(p)}</button>`).join('')}</div>` : ''}
    </div>
    <div class="chat-input-bar">
      <input id="aiInputBox" placeholder="Ask Nova anything…" style="flex:1;height:42px;border-radius:21px;border:1px solid var(--border);padding:0 16px;background:var(--surface-2);outline:none" onkeydown="if(event.key==='Enter')sendAiPrompt()">
      <button class="icon-btn" style="background:linear-gradient(135deg,var(--violet-500),var(--violet-600));color:#fff;border:none" onclick="sendAiPrompt()">${ICON('send',17)}</button>
    </div>`;
}

function renderRecycle() {
  const totalKg = OFFERS.reduce((s,o)=>s+o.kg,0);
  return `
    ${backTopbar('Recycle Market')}
    <div class="view-scroll pad" style="padding-top:14px">
      <div class="card" style="padding:17px;background:linear-gradient(135deg,#0E3A2C,#1B5E45);color:#fff;border:none;box-shadow:var(--shadow-lg)">
        <div class="flex items-center gap-10">${ICON('recycle',22,'stroke="#fff"')}<span class="h3" style="color:#fff">Community eco-impact</span></div>
        <div class="flex gap-16 mt-14">
          <div><div class="h1 num" style="color:#fff;font-size:23px">${totalKg.toFixed(1)}kg</div><div class="tiny" style="opacity:.85">materials reused</div></div>
          <div><div class="h1 num" style="color:#fff;font-size:23px">${(totalKg*0.6).toFixed(1)}kg</div><div class="tiny" style="opacity:.85">CO₂ saved</div></div>
        </div>
      </div>
      ${sectionHead(null, 'Nearby offers', null, null)}
      ${OFFERS.map(o => `
        <div class="card flex items-center gap-12 mt-10" style="padding:12px">
          <img src="${o.cover}" style="width:52px;height:52px;border-radius:13px;object-fit:cover">
          <div class="flex-1">
            <div class="small" style="font-weight:700">${esc(o.title)}</div>
            <div class="tiny muted mt-6">${esc(o.user)} · ${o.kg}kg available</div>
          </div>
          <button class="btn btn-sm ${state.claimed.has(o.id)?'btn-secondary':'btn-ghost'}" onclick="claimOffer('${o.id}')" ${state.claimed.has(o.id)?'disabled':''}>${state.claimed.has(o.id)?'Requested':'I have this'}</button>
        </div>`).join('')}
      <div style="height:16px"></div>
    </div>`;
}

function renderLeaderboard() {
  return `
    ${backTopbar('Leaderboard')}
    <div class="view-scroll pad" style="padding-top:14px">
      <div class="chip-row" style="padding:0 0 12px">
        <button class="chip active">This week</button>
        <button class="chip">This month</button>
        <button class="chip">All time</button>
      </div>
      ${LEADERBOARD.map(p => `
        <div class="card flex items-center gap-12 mt-10" style="padding:12px 14px;${p.me?'border-color:var(--violet-500);background:var(--violet-50)':''}">
          <div class="h2 num" style="width:26px;color:${p.rank===1?'#FFA53E':'var(--muted)'}">${p.rank}</div>
          <img class="avatar" src="${p.avatar}" width="42" height="42">
          <div class="flex-1"><div class="small" style="font-weight:700">${esc(p.name)}${p.me?' (you)':''}</div><div class="tiny muted num">${p.xp.toLocaleString()} XP this week</div></div>
          ${p.rank<=3?ICON('award',22,`style="color:${p.rank===1?'#FFA53E':p.rank===2?'#B8B8C4':'#C97A4A'}"`):''}
        </div>`).join('')}
      <div style="height:16px"></div>
    </div>`;
}

function renderSettings() {
  return `
    ${backTopbar('Settings & privacy')}
    <div class="view-scroll">
      <div class="rows-card" style="margin-top:14px">
        <div class="row"><div class="row-icon" style="background:var(--surface-2)">${ICON(state.theme==='dark'?'moon':'sun',18)}</div><div class="flex-1 small" style="font-weight:600">Dark mode</div><div class="switch ${state.theme==='dark'?'on':''}" onclick="toggleTheme()"></div></div>
        <div class="row"><div class="row-icon" style="background:var(--surface-2)">${ICON('bell',18)}</div><div class="flex-1 small" style="font-weight:600">Push notifications</div><div class="switch on"></div></div>
        <div class="row"><div class="row-icon" style="background:var(--surface-2)">${ICON('shield',18)}</div><div class="flex-1 small" style="font-weight:600">Parent visibility</div><div class="switch ${ME.plan==='parent'?'on':''}"></div></div>
      </div>
      <div class="rows-card" style="margin-top:14px">
        <div class="row"><div class="flex-1 small" style="font-weight:600">Privacy policy</div><span class="muted">${ICON('chevronRight',16)}</span></div>
        <div class="row"><div class="flex-1 small" style="font-weight:600">Terms of service</div><span class="muted">${ICON('chevronRight',16)}</span></div>
        <div class="row"><div class="flex-1 small" style="font-weight:600">Contact support</div><span class="muted">${ICON('chevronRight',16)}</span></div>
      </div>
      <p class="tiny muted text-center mt-16">Ladder v2.1.0</p>
      <div style="height:16px"></div>
    </div>`;
}

function renderReelViewer({ id }) {
  const r = byId(REELS, id);
  const liked = state.liked.has(r.id);
  return `
    <div style="position:relative;flex:1;background:#000">
      <img src="${r.cover}" style="width:100%;height:100%;object-fit:cover;position:absolute;inset:0">
      <div style="position:absolute;inset:0;background:linear-gradient(0deg,rgba(0,0,0,.75),transparent 30%,transparent 70%,rgba(0,0,0,.4))"></div>
      <div style="position:absolute;top:56px;left:16px;right:16px;display:flex;align-items:center;gap:10px">
        <button class="icon-btn" style="background:rgba(255,255,255,.15);border:none;color:#fff" onclick="back()">${ICON('chevronLeft',18)}</button>
        <span style="color:#fff;font-weight:700;font-size:13px">${esc(r.author)}</span>
      </div>
      <div style="position:absolute;right:14px;bottom:110px;display:flex;flex-direction:column;gap:20px;align-items:center">
        <button onclick="toggleLike('${r.id}')" style="background:none;border:none;color:${liked?'var(--pink-500)':'#fff'}">${ICON('heart',26,liked?'style="fill:var(--pink-500)"':'')}</button>
        <button style="background:none;border:none;color:#fff">${ICON('comment',24)}</button>
        <button style="background:none;border:none;color:#fff">${ICON('share',24)}</button>
      </div>
      <div style="position:absolute;left:16px;right:70px;bottom:34px;color:#fff">
        <div class="small" style="font-weight:700">${esc(r.title)}</div>
        <div class="tiny mt-6" style="opacity:.85">${r.views} views</div>
      </div>
    </div>`;
}

// Graceful degradation: if an external photo/avatar ever fails to load (CDN
// hiccup, offline demo, corporate firewall), swap in a neutral placeholder
// instead of the browser's broken-image glyph. 'error' doesn't bubble, so
// this has to listen in the capture phase.
const FALLBACK_IMG = 'data:image/svg+xml;utf8,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#EDE9E1"/><path d="M30 65l14-16 10 11 12-15 14 20z" fill="#C9C3D4"/><circle cx="36" cy="34" r="8" fill="#C9C3D4"/></svg>'
);
document.addEventListener('error', (e) => {
  const t = e.target;
  if (t.tagName === 'IMG' && t.src !== FALLBACK_IMG) {
    t.onerror = null;
    t.src = FALLBACK_IMG;
    t.style.objectFit = 'cover';
  }
}, true);

// ------------------------------------------------------------------- init
function render() {
  if (state.mode === 'onboarding') renderOnboarding();
  else renderApp();
}
render();
