import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../utils/prisma";
import { asyncHandler } from "../../utils/asyncHandler";
import { requireAuth, requireRole } from "../../middleware/auth";
import { env } from "../../config/env";
import { generateText } from "../ai/gemini.service";
import { createAvatarTalk, getAvatarTalk } from "./avatar.service";

export const coursesRouter = Router();

coursesRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const courses = await prisma.course.findMany({
      orderBy: { createdAt: "desc" },
      include: { lessons: { orderBy: { order: "asc" } } },
    });
    res.json({ courses });
  })
);

const courseSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
});

coursesRouter.post(
  "/",
  requireAuth,
  requireRole("INSTRUCTOR", "ADMIN"),
  asyncHandler(async (req, res) => {
    const data = courseSchema.parse(req.body);
    const course = await prisma.course.create({ data });
    res.status(201).json({ course });
  })
);

coursesRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const course = await prisma.course.findUnique({
      where: { id: req.params.id },
      include: { lessons: { orderBy: { order: "asc" }, include: { avatarProfile: true } } },
    });
    if (!course) return res.status(404).json({ error: "Course not found" });
    res.json({ course });
  })
);

const lessonSchema = z.object({
  title: z.string().min(1).max(200),
  script: z.string().min(1).max(20000),
  order: z.number().int().min(0).default(0),
  avatarProfileId: z.string().optional(),
});

coursesRouter.post(
  "/:id/lessons",
  requireAuth,
  requireRole("INSTRUCTOR", "ADMIN"),
  asyncHandler(async (req, res) => {
    const data = lessonSchema.parse(req.body);
    const course = await prisma.course.findUnique({ where: { id: req.params.id } });
    if (!course) return res.status(404).json({ error: "Course not found" });

    const lesson = await prisma.lesson.create({ data: { ...data, courseId: course.id } });
    res.status(201).json({ lesson });
  })
);

coursesRouter.patch(
  "/lessons/:lessonId",
  requireAuth,
  requireRole("INSTRUCTOR", "ADMIN"),
  asyncHandler(async (req, res) => {
    const data = lessonSchema.partial().parse(req.body);
    const lesson = await prisma.lesson.update({ where: { id: req.params.lessonId }, data });
    res.json({ lesson });
  })
);

// --- Gemini: draft/refine a lesson script from a topic + notes. Feeds
// straight into the avatar-tutor pipeline below. ---
const scriptGenSchema = z.object({
  topic: z.string().min(1).max(300),
  notes: z.string().max(4000).optional(),
});

coursesRouter.post(
  "/lessons/:lessonId/script/generate",
  requireAuth,
  requireRole("INSTRUCTOR", "ADMIN"),
  asyncHandler(async (req, res) => {
    const { topic, notes } = scriptGenSchema.parse(req.body);
    const lesson = await prisma.lesson.findUnique({ where: { id: req.params.lessonId } });
    if (!lesson) return res.status(404).json({ error: "Lesson not found" });

    const script = await generateText(
      [
        `Write a short, spoken-style lesson script (60-120 seconds when read aloud) on: "${topic}".`,
        notes ? `Notes to incorporate: ${notes}` : "",
        "Plain narration only, no stage directions, no markdown.",
      ]
        .filter(Boolean)
        .join("\n")
    );

    const updated = await prisma.lesson.update({ where: { id: lesson.id }, data: { script } });
    res.json({ lesson: updated });
  })
);

// --- Avatar tutor generation (D-ID text-to-speech + talking avatar) ---

coursesRouter.post(
  "/lessons/:lessonId/avatar/generate",
  requireAuth,
  requireRole("INSTRUCTOR", "ADMIN"),
  asyncHandler(async (req, res) => {
    const lesson = await prisma.lesson.findUnique({
      where: { id: req.params.lessonId },
      include: { avatarProfile: true },
    });
    if (!lesson) return res.status(404).json({ error: "Lesson not found" });

    const presenterImageUrl = lesson.avatarProfile?.presenterImageUrl ?? env.dIdDefaultPresenterImageUrl;
    if (!presenterImageUrl) {
      return res.status(422).json({
        error:
          "No presenter image available. Assign an AvatarProfile to this lesson, or set D_ID_DEFAULT_PRESENTER_IMAGE_URL.",
      });
    }

    try {
      const { talkId } = await createAvatarTalk({
        script: lesson.script,
        presenterImageUrl,
        voiceProvider: lesson.avatarProfile?.voiceProvider ?? "microsoft",
        voiceId: lesson.avatarProfile?.voiceId ?? "en-US-JennyNeural",
        language: lesson.avatarProfile?.language ?? "en-US",
      });
      const updated = await prisma.lesson.update({
        where: { id: lesson.id },
        data: { avatarStatus: "PENDING", avatarProviderId: talkId, avatarError: null },
      });
      res.status(202).json({ lesson: updated });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Avatar generation failed to start";
      await prisma.lesson.update({
        where: { id: lesson.id },
        data: { avatarStatus: "FAILED", avatarError: message },
      });
      res.status(422).json({ error: message });
    }
  })
);

// Poll-on-demand: checks D-ID for status and syncs it locally. Simple and
// dependable for an MVP without a background job runner.
coursesRouter.get(
  "/lessons/:lessonId/avatar/status",
  asyncHandler(async (req, res) => {
    const lesson = await prisma.lesson.findUnique({ where: { id: req.params.lessonId } });
    if (!lesson) return res.status(404).json({ error: "Lesson not found" });

    if (lesson.avatarStatus !== "PENDING" || !lesson.avatarProviderId) {
      return res.json({ lesson });
    }

    const talk = await getAvatarTalk(lesson.avatarProviderId);
    if (talk.status === "done" && talk.resultUrl) {
      const updated = await prisma.lesson.update({
        where: { id: lesson.id },
        data: { avatarStatus: "READY", avatarVideoUrl: talk.resultUrl },
      });
      return res.json({ lesson: updated });
    }
    if (talk.status === "error" || talk.status === "rejected") {
      const updated = await prisma.lesson.update({
        where: { id: lesson.id },
        data: { avatarStatus: "FAILED", avatarError: talk.error ?? "Generation failed" },
      });
      return res.json({ lesson: updated });
    }
    res.json({ lesson }); // still created/started
  })
);
