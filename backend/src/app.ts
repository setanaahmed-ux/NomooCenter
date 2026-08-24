import express from "express";
import cors from "cors";
import { env } from "./config/env";
import { errorHandler } from "./middleware/errorHandler";
import { authRouter } from "./modules/auth/auth.routes";
import { communityRouter } from "./modules/community/community.routes";
import { coursesRouter } from "./modules/courses/courses.routes";
import { avatarProfilesRouter } from "./modules/courses/avatarProfiles.routes";
import { liveSessionsRouter } from "./modules/liveSessions/liveSessions.routes";
import { aiRouter } from "./modules/ai/ai.routes";

export function createApp() {
  const app = express();

  app.use(cors({ origin: env.corsOrigin }));
  app.use(express.json({ limit: "1mb" }));

  app.get("/health", (_req, res) =>
    res.json({
      ok: true,
      integrations: {
        googleMeet: env.googleMeetConfigured,
        gemini: env.geminiConfigured,
        avatarTutor: env.avatarTutorConfigured,
      },
    })
  );

  app.use("/auth", authRouter);
  app.use("/community", communityRouter);
  app.use("/courses", coursesRouter);
  app.use("/avatar-profiles", avatarProfilesRouter);
  app.use("/live-sessions", liveSessionsRouter);
  app.use("/ai", aiRouter);

  app.use((_req, res) => res.status(404).json({ error: "Not found" }));
  app.use(errorHandler);

  return app;
}
