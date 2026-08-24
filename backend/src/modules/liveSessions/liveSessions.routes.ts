import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../utils/prisma";
import { asyncHandler } from "../../utils/asyncHandler";
import { requireAuth, requireRole } from "../../middleware/auth";
import { env } from "../../config/env";
import { cancelMeetEvent, createMeetEvent } from "./google.service";

export const liveSessionsRouter = Router();

liveSessionsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const upcomingOnly = req.query.upcoming === "true";
    const sessions = await prisma.liveSession.findMany({
      where: upcomingOnly ? { scheduledStart: { gte: new Date() } } : undefined,
      orderBy: { scheduledStart: "asc" },
      include: {
        course: { select: { id: true, title: true } },
        host: { select: { id: true, name: true, avatarUrl: true } },
        _count: { select: { registrations: true } },
      },
    });
    res.json({ sessions });
  })
);

const createSessionSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  courseId: z.string().optional(),
  scheduledStart: z.string().datetime(),
  scheduledEnd: z.string().datetime(),
  // Manual fallback for when Google Meet auto-scheduling isn't configured yet.
  meetLink: z.string().url().optional(),
  attendeeEmails: z.array(z.string().email()).optional(),
});

liveSessionsRouter.post(
  "/",
  requireAuth,
  requireRole("INSTRUCTOR", "ADMIN"),
  asyncHandler(async (req, res) => {
    const data = createSessionSchema.parse(req.body);

    let meetLink = data.meetLink;
    let calendarEventId: string | undefined;

    if (env.googleMeetConfigured) {
      const event = await createMeetEvent({
        title: data.title,
        description: data.description,
        startISO: data.scheduledStart,
        endISO: data.scheduledEnd,
        attendeeEmails: data.attendeeEmails,
      });
      meetLink = event.meetLink;
      calendarEventId = event.eventId;
    } else if (!meetLink) {
      return res.status(422).json({
        error:
          "Google Meet auto-scheduling isn't configured yet, so a meetLink must be provided manually. " +
          "See backend/.env.example (GOOGLE_SERVICE_ACCOUNT_JSON / GOOGLE_IMPERSONATE_EMAIL) to enable auto-creation.",
      });
    }

    const session = await prisma.liveSession.create({
      data: {
        title: data.title,
        description: data.description,
        courseId: data.courseId,
        hostId: req.user!.sub,
        scheduledStart: new Date(data.scheduledStart),
        scheduledEnd: new Date(data.scheduledEnd),
        meetLink,
        calendarEventId,
      },
    });
    res.status(201).json({ session, googleMeetAutoCreated: env.googleMeetConfigured });
  })
);

liveSessionsRouter.post(
  "/:id/register",
  requireAuth,
  asyncHandler(async (req, res) => {
    const session = await prisma.liveSession.findUnique({ where: { id: req.params.id } });
    if (!session) return res.status(404).json({ error: "Session not found" });

    const registration = await prisma.liveSessionRegistration.upsert({
      where: { sessionId_userId: { sessionId: session.id, userId: req.user!.sub } },
      create: { sessionId: session.id, userId: req.user!.sub },
      update: {},
    });
    res.status(201).json({ registration, meetLink: session.meetLink });
  })
);

liveSessionsRouter.delete(
  "/:id",
  requireAuth,
  requireRole("INSTRUCTOR", "ADMIN"),
  asyncHandler(async (req, res) => {
    const session = await prisma.liveSession.findUnique({ where: { id: req.params.id } });
    if (!session) return res.status(404).json({ error: "Session not found" });

    if (session.calendarEventId && env.googleMeetConfigured) {
      await cancelMeetEvent(session.calendarEventId).catch(() => {
        // Best-effort: still cancel locally even if the calendar delete fails
        // (e.g. event already removed by the host in Google Calendar).
      });
    }
    await prisma.liveSession.update({ where: { id: session.id }, data: { status: "CANCELLED" } });
    res.status(204).end();
  })
);
