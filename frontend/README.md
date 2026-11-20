# NOMOO Frontend

The static site design — branded "Ladder" for now — plus a Firebase client
init. No bundler yet — everything runs as plain HTML/CSS/vanilla JS plus one
ES module in the browser.

- `index.html` + `assets/` — the app itself (phone-frame mockup on desktop,
  full-bleed on real mobile viewports). See `assets/README` notes inline in
  `app.js` for how the screens are put together.
- Typography: **Fraunces** (display) + **Plus Jakarta Sans** (body).
- `firebase-init.js` is already wired into `index.html`'s `<head>`.

## Firebase

`firebase-init.js` connects the site to the **nomoo-center-c3f77** Firebase
project (Analytics is wired up; Auth/Firestore/Storage can be added the same
way — import the module you need from the same CDN version and initialize it
off `firebaseApp`).

Add it to the site's HTML:

```html
<script type="module" src="/firebase-init.js"></script>
```

This is the **client-side** Firebase config — safe to ship in the page as-is.
It's separate from the backend's Google integrations (Gemini, Calendar/Meet,
D-ID) which use server-side credentials in `backend/.env` and must never be
exposed to the browser.

### If you later want the backend talking to this Firebase project
(e.g. storing avatar-tutor videos in Firebase Storage instead of just linking
to D-ID's hosted URL, or using Firestore/Firebase Auth): that needs a
**Firebase Admin SDK service account** (Project settings → Service accounts →
Generate new private key in the Firebase console) — a different, secret
credential from the web config above. Not set up yet; ask if you want this
wired in.
