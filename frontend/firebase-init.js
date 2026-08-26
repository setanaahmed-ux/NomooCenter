// NOMOO — Firebase client init (Analytics for now).
//
// This is the public, client-side Firebase Web config for the
// "nomoo-center-c3f77" project. The apiKey here is not a secret — Firebase
// web keys are meant to be public; real access control is enforced by the
// Firestore/Storage security rules you set in the Firebase console, not by
// hiding this key. Do not move it into the backend's .env.
//
// Written with CDN ES-module imports (rather than "firebase/app" npm-style
// imports) because the current site is a single static HTML file with no
// bundler. Include it with:
//   <script type="module" src="/firebase-init.js"></script>
// If a bundler (Vite/Next/etc.) is introduced later, swap these two import
// lines for the npm-package equivalents and nothing else needs to change.

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import { getAnalytics, isSupported } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-analytics.js";

const firebaseConfig = {
  apiKey: "AIzaSyBYsyAO_EswnCafsaDvCN9nmQnaNb3eAjk",
  authDomain: "nomoo-center-c3f77.firebaseapp.com",
  projectId: "nomoo-center-c3f77",
  storageBucket: "nomoo-center-c3f77.firebasestorage.app",
  messagingSenderId: "34643249808",
  appId: "1:34643249808:web:3282f1a1e23d27360a6615",
  measurementId: "G-750Z0MGV6X",
};

export const firebaseApp = initializeApp(firebaseConfig);

// Analytics only works in a real browser (not SSR, and not every browser
// supports it) — guard with isSupported() so this never throws.
export const analyticsReady = isSupported().then((supported) =>
  supported ? getAnalytics(firebaseApp) : null
);
