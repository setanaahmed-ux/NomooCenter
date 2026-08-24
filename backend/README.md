# NOMOO Backend (MVP)

Node.js + TypeScript + Express + Prisma (SQLite for local dev). Covers the
first MVP slice: **community**, **live courses hosted on Google Meet**, and
an **AI avatar tutor** per lesson (Gemini-drafted script → D-ID voice + video).

## Quick start

```bash
cd backend
cp .env.example .env      # fill in JWT_SECRET at minimum
npm install
npm run prisma:migrate    # creates dev.db and applies the schema
npm run seed               # optional: admin@nomoo.ai / member@nomoo.ai, password123
npm run dev                 # http://localhost:4000
```

Check `GET /health` to see which optional integrations are active.

## Features

### 1. Community (works out of the box, no external creds)
- `GET/POST /community/posts`, `POST /community/posts/:id/comments`,
  `GET /community/members`

### 2. Live courses via Google Meet
- `POST /live-sessions` schedules a session. If `GOOGLE_SERVICE_ACCOUNT_JSON`
  + `GOOGLE_IMPERSONATE_EMAIL` are set (see `.env.example` for the Google
  Cloud/Workspace setup steps), it **auto-creates** a Calendar event with a
  Meet link via the Calendar API. Until then, pass `meetLink` manually in the
  request body and it still works.
- `POST /live-sessions/:id/register` registers the current user and returns
  the Meet link.

### 3. AI avatar tutor per lesson
- `AvatarProfile`s (`/avatar-profiles`) define a tutor persona: a presenter
  image + a text-to-speech voice. Create one, then assign it to a lesson.
- `POST /courses/lessons/:lessonId/script/generate` — Gemini drafts/refines
  the lesson's narration script from a topic + notes.
- `POST /courses/lessons/:lessonId/avatar/generate` — sends the script to
  D-ID, which runs text-to-speech in the chosen voice and animates the
  presenter image's mouth to match, producing a talking-avatar video.
- `GET /courses/lessons/:lessonId/avatar/status` — poll until `avatarStatus`
  is `READY` (with `avatarVideoUrl`) or `FAILED`.

### Gemini (Google Cloud)
All AI features run through `src/modules/ai/gemini.service.ts`, backed by a
single `GEMINI_API_KEY` (get one at https://aistudio.google.com). This is the
same project you'd later upgrade to Vertex AI with IAM auth if needed. A
general-purpose `POST /ai/ask` endpoint is also exposed for the frontend.

## Auth
`POST /auth/register`, `POST /auth/login` return a JWT. Send it as
`Authorization: Bearer <token>`. Roles: `MEMBER`, `INSTRUCTOR`, `ADMIN` —
course/lesson/session/avatar-profile writes require `INSTRUCTOR` or `ADMIN`.

## Not yet configured (needs your input)
- `GOOGLE_SERVICE_ACCOUNT_JSON` / `GOOGLE_IMPERSONATE_EMAIL` — for
  auto-created Google Meet links (Workspace only).
- `GEMINI_API_KEY` — for lesson-script generation and the `/ai/ask` assistant.
- `D_ID_API_KEY` / `D_ID_DEFAULT_PRESENTER_IMAGE_URL` — for avatar-tutor
  video generation.

Everything else runs with zero external config.
